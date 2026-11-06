-- ─────────────────────────────────────────────────────────────────────────────
-- Correio Elegante (Vem Correr Comigo): mural de recados da comunidade.
--
-- Mesmo modelo da migration 20261106190000: só estruturas `dex_corre_*`, RLS sem
-- política e acesso apenas pelas rotas do site com a service role.
--
-- Anônimo vale para quem lê o mural. O autor fica guardado para a organização
-- poder agir em caso de denúncia, e a tela avisa isso antes de publicar.
-- Três denúncias de pessoas diferentes ocultam o recado até alguém revisar.
--
-- Idempotente: pode reexecutar.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.dex_corre_correio (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  perfil_id uuid not null references public.dex_corre_perfis(id) on delete cascade,
  para text not null check (char_length(para) between 1 and 60),
  mensagem text not null check (char_length(mensagem) between 1 and 280),
  foto_path text,
  identificado boolean not null default true,
  mostrar_instagram boolean not null default false,
  mostrar_whatsapp boolean not null default false,
  status text not null default 'publicado' check (status in ('publicado', 'oculto', 'removido')),
  criado_em timestamptz not null default now(),
  -- Contato num recado anônimo revelaria quem escreveu.
  constraint dex_corre_correio_contato check (identificado or not (mostrar_instagram or mostrar_whatsapp))
);
create index if not exists dex_corre_correio_mural
  on public.dex_corre_correio (evento_id, criado_em desc) where status = 'publicado';
create index if not exists dex_corre_correio_autor on public.dex_corre_correio (perfil_id, criado_em desc);

create table if not exists public.dex_corre_correio_denuncias (
  recado_id uuid not null references public.dex_corre_correio(id) on delete cascade,
  perfil_id uuid not null references public.dex_corre_perfis(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (recado_id, perfil_id)
);

/**
 * Publica um recado. Telefone ou documento no texto é recusado: o mural não pode
 * servir para expor o contato de quem recebe. Clique repetido devolve o mesmo recado.
 */
create or replace function public.dex_corre_correio_publicar(
  p_slug text, p_participacao uuid, p_pessoa bigint, p_dados jsonb
) returns jsonb language plpgsql as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  para_t text := btrim(coalesce(p_dados->>'para', ''));
  msg text := btrim(coalesce(p_dados->>'mensagem', ''));
  ident boolean := coalesce((p_dados->>'identificado')::boolean, false);
  ig boolean := ident and coalesce((p_dados->>'mostrar_instagram')::boolean, false);
  wa boolean := ident and coalesce((p_dados->>'mostrar_whatsapp')::boolean, false);
  recentes int;
  novo uuid;
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  if char_length(para_t) not between 1 and 60 or char_length(msg) not between 1 and 280 then
    return jsonb_build_object('ok', false, 'erro', 'texto');
  end if;
  if para_t ~ '[0-9]([ .()-]*[0-9]){8,}' or msg ~ '[0-9]([ .()-]*[0-9]){8,}' then
    return jsonb_build_object('ok', false, 'erro', 'contato_no_texto');
  end if;
  if ig and a.instagram is null then ig := false; end if;
  if wa and a.whatsapp is null then wa := false; end if;

  perform public.dex_corre__travar(ev);

  select id into novo from public.dex_corre_correio
    where perfil_id = a.id and para = para_t and mensagem = msg and status = 'publicado'
      and criado_em > now() - interval '2 minutes';
  if novo is not null then
    -- Mesmo texto de novo: se agora veio foto e o recado antigo não tem, aproveita.
    if nullif(p_dados->>'foto_path', '') is not null then
      update public.dex_corre_correio
        set foto_path = coalesce(foto_path, p_dados->>'foto_path')
        where id = novo and foto_path is null;
      if found then
        return jsonb_build_object('ok', true, 'id', novo, 'repetido', true, 'foto_salva', true);
      end if;
    end if;
    return jsonb_build_object('ok', true, 'id', novo, 'repetido', true);
  end if;

  select count(*) into recentes from public.dex_corre_correio
    where perfil_id = a.id and criado_em > now() - interval '1 hour';
  if recentes >= 5 then return jsonb_build_object('ok', false, 'erro', 'limite_recados'); end if;

  insert into public.dex_corre_correio (evento_id, perfil_id, para, mensagem, foto_path, identificado, mostrar_instagram, mostrar_whatsapp)
    values (ev, a.id, para_t, msg, nullif(p_dados->>'foto_path', ''), ident, ig, wa)
    returning id into novo;
  perform public.dex_corre__registrar(ev, a.id, 'recado_publicado', jsonb_build_object('recado', novo));
  return jsonb_build_object('ok', true, 'id', novo);
end $$;

/** O que o mural mostra. Em recado anônimo, nada que leve ao autor sai daqui. */
create or replace function public.dex_corre_correio_mural(
  p_slug text, p_participacao uuid, p_pessoa bigint, p_limite int, p_offset int
) returns jsonb language plpgsql stable as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  itens jsonb; total int;
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;

  select count(*) into total from public.dex_corre_correio m
    join public.dex_corre_perfis_validos v on v.id = m.perfil_id
    where m.evento_id = ev and m.status = 'publicado';

  select coalesce(jsonb_agg(x.j order by x.criado_em desc, x.id), '[]'::jsonb) into itens
  from (
    select m.id, m.criado_em, jsonb_build_object(
      'id', m.id,
      'para', m.para,
      'mensagem', m.mensagem,
      'foto', m.foto_path is not null,
      'criado_em', m.criado_em,
      'meu', m.perfil_id = a.id,
      'denunciei', exists (select 1 from public.dex_corre_correio_denuncias d where d.recado_id = m.id and d.perfil_id = a.id),
      'autor', case when m.identificado then jsonb_build_object(
        'codigo', v.codigo,
        'nome', public.dex_corre__nome_curto(v.nome),
        'foto', case when v.foto_path is not null then v.foto_versao end,
        'instagram', case when m.mostrar_instagram then v.instagram end,
        'whatsapp', case when m.mostrar_whatsapp then v.whatsapp end
      ) end
    ) as j
    from public.dex_corre_correio m
    join public.dex_corre_perfis_validos v on v.id = m.perfil_id
    where m.evento_id = ev and m.status = 'publicado'
    order by m.criado_em desc, m.id
    limit p_limite offset p_offset
  ) x;

  return jsonb_build_object('ok', true, 'itens', itens, 'total', total);
end $$;

/** Só o autor apaga. Devolve a foto para a rota tirar do Storage. */
create or replace function public.dex_corre_correio_apagar(p_participacao uuid, p_pessoa bigint, p_recado uuid)
returns jsonb language plpgsql as $$
declare
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  caminho text;
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  select foto_path into caminho from public.dex_corre_correio where id = p_recado and perfil_id = a.id;
  if not found then return jsonb_build_object('ok', false, 'erro', 'nao_encontrado'); end if;
  update public.dex_corre_correio set status = 'removido', foto_path = null where id = p_recado;
  perform public.dex_corre__registrar(a.evento_id, a.id, 'recado_apagado', jsonb_build_object('recado', p_recado));
  return jsonb_build_object('ok', true, 'foto', caminho);
end $$;

/** Uma denúncia por pessoa. Na terceira, o recado sai do mural até ser revisado. */
create or replace function public.dex_corre_correio_denunciar(p_participacao uuid, p_pessoa bigint, p_recado uuid)
returns jsonb language plpgsql as $$
declare
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  m public.dex_corre_correio;
  n int;
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  select * into m from public.dex_corre_correio where id = p_recado and evento_id = a.evento_id for update;
  if not found or m.status <> 'publicado' then return jsonb_build_object('ok', false, 'erro', 'nao_encontrado'); end if;
  if m.perfil_id = a.id then return jsonb_build_object('ok', false, 'erro', 'proprio'); end if;
  insert into public.dex_corre_correio_denuncias (recado_id, perfil_id) values (p_recado, a.id) on conflict do nothing;
  select count(*) into n from public.dex_corre_correio_denuncias where recado_id = p_recado;
  if n >= 3 then
    update public.dex_corre_correio set status = 'oculto' where id = p_recado;
    perform public.dex_corre__registrar(a.evento_id, null, 'recado_ocultado', jsonb_build_object('recado', p_recado));
  end if;
  return jsonb_build_object('ok', true, 'ocultado', n >= 3);
end $$;

/** Foto do recado para a rota de imagem: só com sessão e só enquanto ele está publicado. */
create or replace function public.dex_corre_correio_foto(p_participacao uuid, p_pessoa bigint, p_recado uuid)
returns text language plpgsql stable as $$
begin
  if not public.dex_corre_sessao_valida(p_participacao, p_pessoa) then return null; end if;
  return (select m.foto_path from public.dex_corre_correio m
    join public.evento_participantes ep on ep.id = p_participacao and ep.evento_id = m.evento_id
    where m.id = p_recado and m.status = 'publicado');
end $$;

alter table public.dex_corre_correio enable row level security;
alter table public.dex_corre_correio_denuncias enable row level security;
revoke all on public.dex_corre_correio, public.dex_corre_correio_denuncias from public, anon, authenticated;
grant all on public.dex_corre_correio, public.dex_corre_correio_denuncias to service_role;

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as assinatura
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'dex\_corre\_correio\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.assinatura);
    execute format('grant execute on function %s to service_role', f.assinatura);
  end loop;
end $$;
