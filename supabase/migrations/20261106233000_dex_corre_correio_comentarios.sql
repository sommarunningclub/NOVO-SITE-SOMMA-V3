-- ─────────────────────────────────────────────────────────────────────────────
-- Correio Elegante: comentários anônimos nos recados.
--
-- Quem lê vê só a inicial do primeiro nome. Nome, foto, perfil e distância nunca
-- saem do banco, e o autor de um recado anônimo não é marcado nos comentários.
-- O autor do comentário fica guardado para a organização agir em caso de denúncia.
--
-- Apagam: quem comentou, quem publicou o recado e Insider ativo (moderação).
-- Três denúncias de pessoas diferentes ocultam o comentário.
--
-- Idempotente: pode reexecutar.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.dex_corre_correio_comentarios (
  id uuid primary key default gen_random_uuid(),
  recado_id uuid not null references public.dex_corre_correio(id) on delete cascade,
  perfil_id uuid not null references public.dex_corre_perfis(id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 200),
  status text not null default 'publicado' check (status in ('publicado', 'oculto', 'removido')),
  criado_em timestamptz not null default now()
);
create index if not exists dex_corre_correio_comentarios_recado
  on public.dex_corre_correio_comentarios (recado_id, criado_em) where status = 'publicado';
create index if not exists dex_corre_correio_comentarios_autor
  on public.dex_corre_correio_comentarios (perfil_id, criado_em desc);

create table if not exists public.dex_corre_correio_comentario_denuncias (
  comentario_id uuid not null references public.dex_corre_correio_comentarios(id) on delete cascade,
  perfil_id uuid not null references public.dex_corre_perfis(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (comentario_id, perfil_id)
);

/** Comenta num recado publicado. Clique repetido devolve o mesmo comentário. */
create or replace function public.dex_corre_correio_comentar(
  p_slug text, p_participacao uuid, p_pessoa bigint, p_recado uuid, p_texto text
) returns jsonb language plpgsql as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  t text := btrim(coalesce(p_texto, ''));
  dono uuid;
  recentes int;
  novo uuid;
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  if char_length(t) not between 1 and 200 then return jsonb_build_object('ok', false, 'erro', 'comentario_texto'); end if;
  if t ~ '[0-9]([ .()-]*[0-9]){8,}' then return jsonb_build_object('ok', false, 'erro', 'contato_no_texto'); end if;

  perform public.dex_corre__travar(ev);

  select perfil_id into dono from public.dex_corre_correio
    where id = p_recado and evento_id = ev and status = 'publicado';
  if dono is null then return jsonb_build_object('ok', false, 'erro', 'nao_encontrado'); end if;

  select id into novo from public.dex_corre_correio_comentarios
    where recado_id = p_recado and perfil_id = a.id and texto = t and status = 'publicado'
      and criado_em > now() - interval '2 minutes';
  if novo is not null then return jsonb_build_object('ok', true, 'id', novo, 'repetido', true); end if;

  select count(*) into recentes from public.dex_corre_correio_comentarios
    where perfil_id = a.id and criado_em > now() - interval '1 hour';
  if recentes >= 20 then return jsonb_build_object('ok', false, 'erro', 'limite_comentarios'); end if;

  insert into public.dex_corre_correio_comentarios (recado_id, perfil_id, texto)
    values (p_recado, a.id, t) returning id into novo;
  perform public.dex_corre__registrar(ev, a.id, 'recado_comentado', jsonb_build_object('recado', p_recado, 'comentario', novo));
  -- A notificação não diz quem comentou.
  if dono <> a.id then
    perform public.dex_corre__notificar(dono, 'recado_comentado', '{}'::jsonb);
  end if;
  return jsonb_build_object('ok', true, 'id', novo);
end $$;

/** Do mais antigo ao mais novo. A inicial é o único dado de quem comentou que sai daqui. */
create or replace function public.dex_corre_correio_comentarios_lista(
  p_slug text, p_participacao uuid, p_pessoa bigint, p_recado uuid, p_limite int, p_offset int
) returns jsonb language plpgsql stable as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  modera boolean := public.dex_corre__eh_moderador(p_participacao, p_pessoa);
  dono uuid;
  itens jsonb; total int;
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  select perfil_id into dono from public.dex_corre_correio
    where id = p_recado and evento_id = ev and status = 'publicado';
  if dono is null then return jsonb_build_object('ok', false, 'erro', 'nao_encontrado'); end if;

  select count(*) into total from public.dex_corre_correio_comentarios c
    join public.dex_corre_perfis_validos v on v.id = c.perfil_id
    where c.recado_id = p_recado and c.status = 'publicado';

  select coalesce(jsonb_agg(x.j order by x.criado_em, x.id), '[]'::jsonb) into itens
  from (
    select c.id, c.criado_em, jsonb_build_object(
      'id', c.id,
      'texto', c.texto,
      'inicial', upper(left(btrim(v.nome), 1)),
      'criado_em', c.criado_em,
      'meu', c.perfil_id = a.id,
      'pode_apagar', c.perfil_id = a.id or dono = a.id or modera,
      'denunciei', exists (
        select 1 from public.dex_corre_correio_comentario_denuncias d
        where d.comentario_id = c.id and d.perfil_id = a.id
      )
    ) as j
    from public.dex_corre_correio_comentarios c
    join public.dex_corre_perfis_validos v on v.id = c.perfil_id
    where c.recado_id = p_recado and c.status = 'publicado'
    order by c.criado_em, c.id
    limit p_limite offset p_offset
  ) x;

  return jsonb_build_object('ok', true, 'itens', itens, 'total', total);
end $$;

create or replace function public.dex_corre_correio_comentario_apagar(p_participacao uuid, p_pessoa bigint, p_comentario uuid)
returns jsonb language plpgsql as $$
declare
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  modera boolean := public.dex_corre__eh_moderador(p_participacao, p_pessoa);
  c public.dex_corre_correio_comentarios;
  dono uuid;
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  select * into c from public.dex_corre_correio_comentarios where id = p_comentario for update;
  if not found or c.status = 'removido' then return jsonb_build_object('ok', false, 'erro', 'nao_encontrado'); end if;
  select perfil_id into dono from public.dex_corre_correio where id = c.recado_id and evento_id = a.evento_id;
  if dono is null or not (c.perfil_id = a.id or dono = a.id or modera) then
    return jsonb_build_object('ok', false, 'erro', 'nao_encontrado');
  end if;
  update public.dex_corre_correio_comentarios set status = 'removido' where id = p_comentario;
  perform public.dex_corre__registrar(a.evento_id, a.id, 'comentario_apagado', jsonb_build_object('comentario', p_comentario));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.dex_corre_correio_comentario_denunciar(p_participacao uuid, p_pessoa bigint, p_comentario uuid)
returns jsonb language plpgsql as $$
declare
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  c public.dex_corre_correio_comentarios;
  n int;
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  select cm.* into c from public.dex_corre_correio_comentarios cm
    join public.dex_corre_correio r on r.id = cm.recado_id and r.evento_id = a.evento_id
    where cm.id = p_comentario for update of cm;
  if not found or c.status <> 'publicado' then return jsonb_build_object('ok', false, 'erro', 'nao_encontrado'); end if;
  if c.perfil_id = a.id then return jsonb_build_object('ok', false, 'erro', 'proprio'); end if;
  insert into public.dex_corre_correio_comentario_denuncias (comentario_id, perfil_id)
    values (p_comentario, a.id) on conflict do nothing;
  select count(*) into n from public.dex_corre_correio_comentario_denuncias where comentario_id = p_comentario;
  if n >= 3 then
    update public.dex_corre_correio_comentarios set status = 'oculto' where id = p_comentario;
    perform public.dex_corre__registrar(a.evento_id, null, 'comentario_ocultado', jsonb_build_object('comentario', p_comentario));
  end if;
  return jsonb_build_object('ok', true, 'ocultado', n >= 3);
end $$;

-- Mural: igual ao atual, com a contagem de comentários.
create or replace function public.dex_corre_correio_mural(
  p_slug text, p_participacao uuid, p_pessoa bigint, p_limite int, p_offset int
) returns jsonb language plpgsql stable as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  modera boolean := public.dex_corre__eh_moderador(p_participacao, p_pessoa);
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
      'pode_apagar', m.perfil_id = a.id or modera,
      'comentarios', (
        select count(*) from public.dex_corre_correio_comentarios c
        join public.dex_corre_perfis_validos cv on cv.id = c.perfil_id
        where c.recado_id = m.id and c.status = 'publicado'
      ),
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

alter table public.dex_corre_correio_comentarios enable row level security;
alter table public.dex_corre_correio_comentario_denuncias enable row level security;
revoke all on public.dex_corre_correio_comentarios, public.dex_corre_correio_comentario_denuncias from public, anon, authenticated;
grant all on public.dex_corre_correio_comentarios, public.dex_corre_correio_comentario_denuncias to service_role;

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
