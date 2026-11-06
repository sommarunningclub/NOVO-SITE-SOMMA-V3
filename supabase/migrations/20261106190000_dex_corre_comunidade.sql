-- ─────────────────────────────────────────────────────────────────────────────
-- Vem Correr Comigo (Dexcomplica Love Run): comunidade de quem está inscrito.
--
-- Só adiciona estruturas `dex_corre_*`. Nenhuma tabela existente é alterada e
-- não há trigger em `evento_participantes`: inscrição, ingresso, transferência
-- e check-in continuam exatamente como estão.
--
-- Fonte da verdade da inscrição: `evento_participantes` (uma linha por vaga).
-- A transferência troca o titular NA MESMA linha, então perfil e sessão são
-- presos a (participacao_id, pessoa_id). Quem transferiu perde o acesso sozinho:
-- `dex_corre__limpar` desliga perfis cuja pessoa não é mais a titular.
--
-- Acesso: tudo passa pelas rotas do site com a service role. O site não usa
-- Supabase Auth para participante (a sessão é um cookie assinado, emitido a partir
-- do CPF de uma inscrição válida), então anon e authenticated não têm permissão nenhuma
-- aqui: RLS ligada sem política + REVOKE nas tabelas, views e funções.
--
-- Concorrência: toda escrita em grupo pega um advisory lock por evento. Com a
-- escala do evento (centenas de pessoas) isso é simples e correto: duas pessoas
-- na última vaga viram duas transações em fila, e a segunda vê o grupo cheio.
-- Os índices únicos parciais seguram o mesmo invariante no nível do banco.
--
-- Idempotente: pode reexecutar.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Tabelas ────────────────────────────────────────────────────────────────

create table if not exists public.dex_corre_config (
  evento_id uuid primary key references public.eventos(id) on delete cascade,
  max_homens smallint not null default 2 check (max_homens between 0 and 4),
  max_mulheres smallint not null default 2 check (max_mulheres between 0 and 4),
  -- true: um grupo de 4 precisa fechar exatamente em max_homens + max_mulheres.
  -- Com isso, quem se declara "outro" entra em dupla e trio, mas não em quarteto.
  -- A organização decide mudando esta linha; nada é atribuído automaticamente.
  quarteto_exige_paridade boolean not null default true,
  convite_horas smallint not null default 48 check (convite_horas > 0)
);

create table if not exists public.dex_corre_perfis (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  evento_id uuid not null references public.eventos(id) on delete cascade,
  participacao_id uuid not null references public.evento_participantes(id) on delete cascade,
  pessoa_id bigint not null,
  foto_path text,
  foto_versao integer not null default 0,
  instagram text check (instagram is null or instagram ~ '^[a-z0-9._]{1,30}$'),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[1-9][0-9]{9,10}$'),
  whatsapp_publico boolean not null default false,
  genero_grupo text not null check (genero_grupo in ('masculino', 'feminino', 'outro')),
  preferencia smallint not null check (preferencia in (2, 3, 4)),
  termos_em timestamptz not null default now(),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- WhatsApp público exige número: o painel nunca mostra botão sem destino.
  constraint dex_corre_perfis_whatsapp_publico check (not whatsapp_publico or whatsapp is not null)
);
create unique index if not exists dex_corre_perfis_uma_por_vaga
  on public.dex_corre_perfis (participacao_id) where ativo;
create index if not exists dex_corre_perfis_evento on public.dex_corre_perfis (evento_id, criado_em desc) where ativo;

create table if not exists public.dex_corre_grupos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  evento_id uuid not null references public.eventos(id) on delete cascade,
  pelotao text not null,
  status text not null default 'ativo' check (status in ('ativo', 'encerrado')),
  criado_por uuid references public.dex_corre_perfis(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists dex_corre_grupos_evento on public.dex_corre_grupos (evento_id, atualizado_em desc) where status = 'ativo';

create table if not exists public.dex_corre_membros (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.dex_corre_grupos(id) on delete cascade,
  perfil_id uuid not null references public.dex_corre_perfis(id) on delete cascade,
  entrou_em timestamptz not null default now(),
  saiu_em timestamptz
);
-- A regra "um grupo ativo por pessoa" vale mesmo se uma função errar.
create unique index if not exists dex_corre_membros_um_ativo
  on public.dex_corre_membros (perfil_id) where saiu_em is null;
create index if not exists dex_corre_membros_grupo on public.dex_corre_membros (grupo_id) where saiu_em is null;

create table if not exists public.dex_corre_convites (
  id uuid primary key default gen_random_uuid(),
  remetente_id uuid not null references public.dex_corre_perfis(id) on delete cascade,
  destinatario_id uuid not null references public.dex_corre_perfis(id) on delete cascade,
  grupo_id uuid references public.dex_corre_grupos(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'expired')),
  criado_em timestamptz not null default now(),
  respondido_em timestamptz,
  expira_em timestamptz not null,
  check (remetente_id <> destinatario_id)
);
create unique index if not exists dex_corre_convites_um_pendente
  on public.dex_corre_convites (remetente_id, destinatario_id) where status = 'pending';
create index if not exists dex_corre_convites_destino on public.dex_corre_convites (destinatario_id) where status = 'pending';

create table if not exists public.dex_corre_notificacoes (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.dex_corre_perfis(id) on delete cascade,
  tipo text not null,
  dados jsonb not null default '{}'::jsonb,
  lida_em timestamptz,
  criado_em timestamptz not null default now()
);
create index if not exists dex_corre_notificacoes_perfil on public.dex_corre_notificacoes (perfil_id, criado_em desc);

create table if not exists public.dex_corre_atividade (
  id bigint generated always as identity primary key,
  evento_id uuid not null references public.eventos(id) on delete cascade,
  perfil_id uuid,
  tipo text not null,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists dex_corre_atividade_evento on public.dex_corre_atividade (evento_id, criado_em desc);

-- Perfis que ainda valem: a pessoa continua titular de uma vaga não cancelada.
create or replace view public.dex_corre_perfis_validos as
  select
    pf.id, pf.codigo, pf.evento_id, pf.participacao_id, pf.pessoa_id,
    ep.nome_completo as nome, ep.pelotao,
    pf.foto_path, pf.foto_versao, pf.instagram, pf.whatsapp, pf.whatsapp_publico,
    pf.genero_grupo, pf.preferencia, pf.criado_em, pf.atualizado_em
  from public.dex_corre_perfis pf
  join public.evento_participantes ep on ep.id = pf.participacao_id
  where pf.ativo and ep.pessoa_id = pf.pessoa_id and ep.status <> 'cancelado';

-- ─── Fundamentos ────────────────────────────────────────────────────────────

create or replace function public.dex_corre__codigo_novo()
returns text language sql volatile as $$
  select substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)
$$;

/** "Maria Clara Souza" → "Maria Souza": a comunidade não precisa do nome inteiro. */
create or replace function public.dex_corre__nome_curto(p_nome text)
returns text language sql immutable as $$
  select case
    when array_length(regexp_split_to_array(btrim(p_nome), '\s+'), 1) > 1 then
      initcap((regexp_split_to_array(btrim(p_nome), '\s+'))[1]) || ' ' ||
      initcap((regexp_split_to_array(btrim(p_nome), '\s+'))[array_length(regexp_split_to_array(btrim(p_nome), '\s+'), 1)])
    else initcap(btrim(p_nome))
  end
$$;

create or replace function public.dex_corre__sem_acento(p text)
returns text language sql immutable as $$
  select translate(lower(coalesce(p, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn')
$$;

create or replace function public.dex_corre__travar(p_evento uuid)
returns void language sql as $$
  select pg_advisory_xact_lock(hashtextextended('dex_corre:' || p_evento::text, 0))
$$;

create or replace function public.dex_corre__config(p_evento uuid)
returns public.dex_corre_config language plpgsql stable as $$
declare c public.dex_corre_config;
begin
  select * into c from public.dex_corre_config where evento_id = p_evento;
  if not found then
    c.evento_id := p_evento; c.max_homens := 2; c.max_mulheres := 2;
    c.quarteto_exige_paridade := true; c.convite_horas := 48;
  end if;
  return c;
end $$;

/** Evento do slug. A rota nunca recebe o id do navegador. */
create or replace function public.dex_corre__evento(p_slug text)
returns uuid language sql stable as $$
  select id from public.eventos where slug = p_slug
$$;

-- ─── Notificação e histórico ────────────────────────────────────────────────

create or replace function public.dex_corre__notificar(p_perfil uuid, p_tipo text, p_dados jsonb)
returns void language sql as $$
  insert into public.dex_corre_notificacoes (perfil_id, tipo, dados) values (p_perfil, p_tipo, p_dados)
$$;

create or replace function public.dex_corre__registrar(p_evento uuid, p_perfil uuid, p_tipo text, p_dados jsonb default '{}'::jsonb)
returns void language sql as $$
  insert into public.dex_corre_atividade (evento_id, perfil_id, tipo, dados) values (p_evento, p_perfil, p_tipo, p_dados)
$$;

-- ─── Regras do grupo ────────────────────────────────────────────────────────

/**
 * Uma pessoa desse gênero cabe? A capacidade efetiva é a menor preferência entre
 * os integrantes, contando quem entra. Regra única: vitrine, entrada e convite
 * passam todos por aqui.
 */
create or replace function public.dex_corre__cabe(
  p_cfg public.dex_corre_config,
  p_total int, p_homens int, p_mulheres int, p_capacidade int,
  p_genero text, p_preferencia int
) returns boolean language plpgsql immutable as $$
declare
  novo_total int := p_total + 1;
  h int := p_homens + (p_genero = 'masculino')::int;
  m int := p_mulheres + (p_genero = 'feminino')::int;
begin
  if novo_total > 4 then return false; end if;
  if novo_total > least(p_capacidade, coalesce(p_preferencia, 4)) then return false; end if;
  if h > p_cfg.max_homens or m > p_cfg.max_mulheres then return false; end if;
  if novo_total = 4 and p_cfg.quarteto_exige_paridade
     and not (h = p_cfg.max_homens and m = p_cfg.max_mulheres) then
    return false;
  end if;
  return true;
end $$;

/** Situação calculada: nada disto é guardado, então não tem como ficar defasado. */
create or replace function public.dex_corre__grupo_info(p_grupo uuid)
returns jsonb language plpgsql stable as $$
declare
  g public.dex_corre_grupos;
  cfg public.dex_corre_config;
  total int; h int; m int; cap int;
  aceita_h boolean; aceita_m boolean; aceita_o boolean;
begin
  select * into g from public.dex_corre_grupos where id = p_grupo;
  if not found then return null; end if;
  cfg := public.dex_corre__config(g.evento_id);
  select
    count(*),
    count(*) filter (where p.genero_grupo = 'masculino'),
    count(*) filter (where p.genero_grupo = 'feminino'),
    coalesce(min(p.preferencia), 4)
  into total, h, m, cap
  from public.dex_corre_membros mb
  join public.dex_corre_perfis p on p.id = mb.perfil_id
  where mb.grupo_id = p_grupo and mb.saiu_em is null;

  aceita_h := public.dex_corre__cabe(cfg, total, h, m, cap, 'masculino', 4);
  aceita_m := public.dex_corre__cabe(cfg, total, h, m, cap, 'feminino', 4);
  aceita_o := public.dex_corre__cabe(cfg, total, h, m, cap, 'outro', 4);

  return jsonb_build_object(
    'total', total, 'homens', h, 'mulheres', m, 'capacidade', cap,
    -- Sem vaga compatível, não anuncia vaga: "vagas" é o que dá para ocupar de verdade.
    'vagas', case when aceita_h or aceita_m or aceita_o then greatest(cap - total, 0) else 0 end,
    'aceita_masculino', aceita_h, 'aceita_feminino', aceita_m, 'aceita_outro', aceita_o,
    'completo', not (aceita_h or aceita_m or aceita_o)
  );
end $$;

create or replace function public.dex_corre__grupo_do(p_perfil uuid)
returns uuid language sql stable as $$
  select mb.grupo_id
  from public.dex_corre_membros mb
  join public.dex_corre_grupos g on g.id = mb.grupo_id and g.status = 'ativo'
  where mb.perfil_id = p_perfil and mb.saiu_em is null
$$;

/** Tira a pessoa do grupo. Sobrou um: ele volta a ser individual e o grupo fecha. */
create or replace function public.dex_corre__remover(p_grupo uuid, p_perfil uuid, p_motivo text)
returns void language plpgsql as $$
declare
  g public.dex_corre_grupos;
  restantes int;
  r record;
  nome_saiu text;
begin
  select * into g from public.dex_corre_grupos where id = p_grupo for update;
  select public.dex_corre__nome_curto(ep.nome_completo) into nome_saiu
    from public.dex_corre_perfis p join public.evento_participantes ep on ep.id = p.participacao_id
    where p.id = p_perfil;

  update public.dex_corre_membros set saiu_em = now()
    where grupo_id = p_grupo and perfil_id = p_perfil and saiu_em is null;
  if not found then return; end if;

  perform public.dex_corre__registrar(g.evento_id, p_perfil, 'integrante_removido',
    jsonb_build_object('grupo_id', p_grupo, 'motivo', p_motivo));

  select count(*) into restantes from public.dex_corre_membros where grupo_id = p_grupo and saiu_em is null;

  for r in select perfil_id from public.dex_corre_membros where grupo_id = p_grupo and saiu_em is null loop
    perform public.dex_corre__notificar(r.perfil_id, 'saida',
      jsonb_build_object('nome', nome_saiu, 'grupo', g.codigo, 'desfeito', restantes <= 1));
  end loop;

  if restantes <= 1 then
    update public.dex_corre_membros set saiu_em = now() where grupo_id = p_grupo and saiu_em is null;
    update public.dex_corre_grupos set status = 'encerrado', atualizado_em = now() where id = p_grupo;
    update public.dex_corre_convites set status = 'cancelled', respondido_em = now()
      where grupo_id = p_grupo and status = 'pending';
    perform public.dex_corre__registrar(g.evento_id, null, 'grupo_encerrado', jsonb_build_object('grupo_id', p_grupo));
  else
    update public.dex_corre_grupos set atualizado_em = now() where id = p_grupo;
  end if;
end $$;

/**
 * Acerta o que mudou por fora: transferência, cancelamento, troca de pelotão na
 * gestão e convite vencido. Só pega a trava se houver o que acertar, então a
 * leitura de rotina não escreve nada.
 */
create or replace function public.dex_corre__limpar(p_evento uuid)
returns void language plpgsql as $$
declare r record;
begin
  if not exists (
    select 1 from public.dex_corre_perfis pf
    left join public.dex_corre_perfis_validos v on v.id = pf.id
    where pf.evento_id = p_evento and pf.ativo and v.id is null
  ) and not exists (
    select 1 from public.dex_corre_membros mb
    join public.dex_corre_grupos g on g.id = mb.grupo_id and g.status = 'ativo' and g.evento_id = p_evento
    join public.dex_corre_perfis_validos v on v.id = mb.perfil_id
    where mb.saiu_em is null and v.pelotao is distinct from g.pelotao
  ) and not exists (
    select 1 from public.dex_corre_convites c
    join public.dex_corre_perfis p on p.id = c.remetente_id
    where p.evento_id = p_evento and c.status = 'pending' and c.expira_em <= now()
  ) then
    return;
  end if;

  perform public.dex_corre__travar(p_evento);

  for r in
    select pf.id, public.dex_corre__grupo_do(pf.id) as grupo
    from public.dex_corre_perfis pf
    left join public.dex_corre_perfis_validos v on v.id = pf.id
    where pf.evento_id = p_evento and pf.ativo and v.id is null
  loop
    if r.grupo is not null then
      perform public.dex_corre__remover(r.grupo, r.id, 'inscricao_invalida');
    end if;
    update public.dex_corre_convites set status = 'cancelled', respondido_em = now()
      where status = 'pending' and (remetente_id = r.id or destinatario_id = r.id);
    update public.dex_corre_perfis set ativo = false, atualizado_em = now() where id = r.id;
    perform public.dex_corre__registrar(p_evento, r.id, 'perfil_desativado');
  end loop;

  for r in
    select mb.perfil_id, mb.grupo_id
    from public.dex_corre_membros mb
    join public.dex_corre_grupos g on g.id = mb.grupo_id and g.status = 'ativo' and g.evento_id = p_evento
    join public.dex_corre_perfis_validos v on v.id = mb.perfil_id
    where mb.saiu_em is null and v.pelotao is distinct from g.pelotao
  loop
    perform public.dex_corre__remover(r.grupo_id, r.perfil_id, 'pelotao_alterado');
  end loop;

  update public.dex_corre_convites c set status = 'expired', respondido_em = now()
    from public.dex_corre_perfis p
    where p.id = c.remetente_id and p.evento_id = p_evento
      and c.status = 'pending' and c.expira_em <= now();
end $$;

/** Perfil de quem está na sessão. Sem inscrição válida, não devolve nada. */
create or replace function public.dex_corre__ator(p_participacao uuid, p_pessoa bigint)
returns public.dex_corre_perfis_validos language sql stable as $$
  select v.* from public.dex_corre_perfis_validos v
  where v.participacao_id = p_participacao and v.pessoa_id = p_pessoa
$$;

/** Depois que alguém entra: convites que não fazem mais sentido deixam de valer. */
create or replace function public.dex_corre__apos_entrar(p_grupo uuid, p_perfil uuid)
returns void language plpgsql as $$
declare
  info jsonb := public.dex_corre__grupo_info(p_grupo);
begin
  update public.dex_corre_convites set status = 'cancelled', respondido_em = now()
    where status = 'pending' and (remetente_id = p_perfil or destinatario_id = p_perfil);
  if (info->>'completo')::boolean then
    update public.dex_corre_convites set status = 'cancelled', respondido_em = now()
      where status = 'pending' and grupo_id = p_grupo;
  end if;
end $$;

/** Tipo da celebração pelo tamanho que o grupo acabou de atingir. */
create or replace function public.dex_corre__celebracao(p_total int)
returns text language sql immutable as $$
  select case p_total when 2 then 'dupla' when 3 then 'trio' when 4 then 'quarteto' end
$$;

/** Avisa o grupo e devolve a resposta de quem agiu. */
create or replace function public.dex_corre__anunciar_entrada(p_grupo uuid, p_perfil uuid, p_resultado text)
returns jsonb language plpgsql as $$
declare
  g public.dex_corre_grupos;
  info jsonb := public.dex_corre__grupo_info(p_grupo);
  total int := (info->>'total')::int;
  completo boolean := (info->>'completo')::boolean;
  nome text;
  r record;
begin
  select * into g from public.dex_corre_grupos where id = p_grupo;
  select public.dex_corre__nome_curto(v.nome) into nome from public.dex_corre_perfis_validos v where v.id = p_perfil;

  for r in
    select perfil_id from public.dex_corre_membros
    where grupo_id = p_grupo and saiu_em is null and perfil_id <> p_perfil
  loop
    perform public.dex_corre__notificar(r.perfil_id, 'novo_integrante', jsonb_build_object(
      'nome', nome, 'grupo', g.codigo, 'celebrar', public.dex_corre__celebracao(total)));
    if completo then
      perform public.dex_corre__notificar(r.perfil_id, 'grupo_completo', jsonb_build_object('grupo', g.codigo));
    end if;
  end loop;

  perform public.dex_corre__registrar(g.evento_id, p_perfil, 'integrante_adicionado',
    jsonb_build_object('grupo_id', p_grupo, 'total', total));
  if completo then
    perform public.dex_corre__registrar(g.evento_id, null, 'grupo_concluido', jsonb_build_object('grupo_id', p_grupo, 'total', total));
  end if;

  return jsonb_build_object('ok', true, 'resultado', p_resultado, 'grupo', g.codigo,
    'celebrar', public.dex_corre__celebracao(total), 'total', total);
end $$;

/** Forma o grupo de duas pessoas. Quem chama já validou e já está com a trava. */
create or replace function public.dex_corre__formar(p_a uuid, p_b uuid, p_evento uuid, p_pelotao text)
returns uuid language plpgsql as $$
declare gid uuid;
begin
  insert into public.dex_corre_grupos (codigo, evento_id, pelotao, criado_por)
    values (public.dex_corre__codigo_novo(), p_evento, p_pelotao, p_a) returning id into gid;
  insert into public.dex_corre_membros (grupo_id, perfil_id) values (gid, p_a), (gid, p_b);
  perform public.dex_corre__registrar(p_evento, p_a, 'grupo_criado', jsonb_build_object('grupo_id', gid));
  perform public.dex_corre__apos_entrar(gid, p_a);
  perform public.dex_corre__apos_entrar(gid, p_b);
  return gid;
end $$;

-- ─── Acesso ─────────────────────────────────────────────────────────────────

/**
 * Entrada pelo CPF. Só devolve quando há exatamente uma vaga válida: nunca
 * escolhe entre duas. O registro alimenta a métrica de quem já acessou.
 */
create or replace function public.dex_corre_entrar(p_slug text, p_cpf text)
returns jsonb language plpgsql as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  n int; r record;
begin
  select count(*) into n from public.evento_participantes
    where evento_id = ev and cpf = p_cpf and status <> 'cancelado';
  if n <> 1 then return null; end if;
  select id, pessoa_id into r from public.evento_participantes
    where evento_id = ev and cpf = p_cpf and status <> 'cancelado';
  perform public.dex_corre__registrar(ev, null, 'acesso', jsonb_build_object('participacao', r.id));
  return jsonb_build_object('participacao_id', r.id, 'pessoa_id', r.pessoa_id);
end $$;

/** A sessão continua valendo? Transferiu ou cancelou: não. */
create or replace function public.dex_corre_sessao_valida(p_participacao uuid, p_pessoa bigint)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.evento_participantes
    where id = p_participacao and pessoa_id = p_pessoa and status <> 'cancelado'
  )
$$;

-- ─── Perfil ─────────────────────────────────────────────────────────────────

/** Nome, percurso e gênero já cadastrado: base do onboarding. Nada disso é editável aqui. */
create or replace function public.dex_corre_inscricao(p_participacao uuid, p_pessoa bigint)
returns jsonb language plpgsql stable as $$
declare
  ep record;
  gen text;
begin
  select e.nome_completo, e.pelotao, e.metadata into ep
    from public.evento_participantes e
    where e.id = p_participacao and e.pessoa_id = p_pessoa and e.status <> 'cancelado';
  if not found then return null; end if;
  gen := public.dex_corre__genero_cadastrado(p_participacao);
  return jsonb_build_object(
    'nome', public.dex_corre__nome_curto(ep.nome_completo),
    'pelotao', ep.pelotao,
    'precisa_genero', gen is null
  );
end $$;

create or replace function public.dex_corre__genero_cadastrado(p_participacao uuid)
returns text language plpgsql stable as $$
declare
  ep record;
  g text;
begin
  select e.metadata, e.pessoa_id into ep from public.evento_participantes e where e.id = p_participacao;
  -- A ficha da transferência grava o sexo na vaga; a pessoa antiga fica no cadastro.
  g := lower(coalesce(ep.metadata->>'sexo', ''));
  if g in ('masculino', 'feminino') then return g; end if;
  select lower(coalesce(c.sexo, '')) into g from public.cadastro_site c where c.id = ep.pessoa_id;
  if g in ('masculino', 'feminino') then return g; end if;
  return null;
end $$;

/**
 * Cria ou edita o próprio perfil. Nome e percurso vêm sempre da inscrição; o
 * navegador manda só os campos abaixo. Preferência que invalidaria o grupo atual
 * é recusada aqui, com o grupo travado.
 */
create or replace function public.dex_corre_salvar_perfil(p_slug text, p_participacao uuid, p_pessoa bigint, p_dados jsonb)
returns jsonb language plpgsql as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  atual public.dex_corre_perfis_validos;
  ep record;
  gen text;
  pref int := (p_dados->>'preferencia')::int;
  ig text := nullif(p_dados->>'instagram', '');
  wa text := nullif(p_dados->>'whatsapp', '');
  wa_pub boolean := coalesce((p_dados->>'whatsapp_publico')::boolean, false) and nullif(p_dados->>'whatsapp', '') is not null;
  grupo uuid;
  info jsonb;
  novo uuid;
begin
  select e.id into ep from public.evento_participantes e
    where e.id = p_participacao and e.pessoa_id = p_pessoa and e.evento_id = ev and e.status <> 'cancelado';
  if not found then return jsonb_build_object('ok', false, 'erro', 'sessao'); end if;

  perform public.dex_corre__travar(ev);
  perform public.dex_corre__limpar(ev);
  atual := public.dex_corre__ator(p_participacao, p_pessoa);

  if atual.id is null then
    gen := public.dex_corre__genero_cadastrado(p_participacao);
    if gen is null then gen := nullif(p_dados->>'genero', ''); end if;
    if gen is null or gen not in ('masculino', 'feminino', 'outro') then
      return jsonb_build_object('ok', false, 'erro', 'genero');
    end if;
    if coalesce((p_dados->>'termos')::boolean, false) is not true then
      return jsonb_build_object('ok', false, 'erro', 'termos');
    end if;
    insert into public.dex_corre_perfis (
      codigo, evento_id, participacao_id, pessoa_id, instagram, whatsapp, whatsapp_publico, genero_grupo, preferencia
    ) values (public.dex_corre__codigo_novo(), ev, p_participacao, p_pessoa, ig, wa, wa_pub, gen, pref)
    returning id into novo;
    perform public.dex_corre__registrar(ev, novo, 'perfil_criado');
    return jsonb_build_object('ok', true, 'criado', true);
  end if;

  grupo := public.dex_corre__grupo_do(atual.id);
  if grupo is not null then
    info := public.dex_corre__grupo_info(grupo);
    if (info->>'total')::int > pref then
      return jsonb_build_object('ok', false, 'erro', 'preferencia_grupo');
    end if;
  end if;

  update public.dex_corre_perfis
    set instagram = ig, whatsapp = wa, whatsapp_publico = wa_pub, preferencia = pref, atualizado_em = now()
    where id = atual.id;
  if atual.preferencia <> pref then
    perform public.dex_corre__registrar(ev, atual.id, 'preferencia_modificada',
      jsonb_build_object('de', atual.preferencia, 'para', pref));
    -- Virou dupla com grupo de dois: ninguém mais entra, nem por convite já aberto.
    if grupo is not null and (public.dex_corre__grupo_info(grupo)->>'completo')::boolean then
      update public.dex_corre_convites set status = 'cancelled', respondido_em = now()
        where status = 'pending' and grupo_id = grupo;
    end if;
  end if;
  return jsonb_build_object('ok', true, 'criado', false);
end $$;

create or replace function public.dex_corre_definir_foto(p_participacao uuid, p_pessoa bigint, p_path text)
returns jsonb language plpgsql as $$
declare
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  update public.dex_corre_perfis
    set foto_path = p_path, foto_versao = foto_versao + 1, atualizado_em = now() where id = a.id;
  return jsonb_build_object('ok', true, 'anterior', a.foto_path);
end $$;

/** Caminho da foto para a rota de imagem, que só responde a quem tem sessão. */
create or replace function public.dex_corre_foto_de(p_participacao uuid, p_pessoa bigint, p_codigo text)
returns text language plpgsql stable as $$
begin
  if not public.dex_corre_sessao_valida(p_participacao, p_pessoa) then return null; end if;
  return (select v.foto_path from public.dex_corre_perfis_validos v
    join public.evento_participantes ep on ep.id = p_participacao and ep.evento_id = v.evento_id
    where v.codigo = p_codigo);
end $$;

-- ─── Leituras ───────────────────────────────────────────────────────────────

/** O que outro inscrito pode ver de alguém. Telefone só com autorização. */
create or replace function public.dex_corre__cartao(v public.dex_corre_perfis_validos)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'codigo', v.codigo,
    'nome', public.dex_corre__nome_curto(v.nome),
    'pelotao', v.pelotao,
    'preferencia', v.preferencia,
    'instagram', v.instagram,
    'whatsapp', case when v.whatsapp_publico then v.whatsapp end,
    'foto', case when v.foto_path is not null then v.foto_versao end
  )
$$;

create or replace function public.dex_corre__grupo_json(p_grupo uuid)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'codigo', g.codigo,
    'pelotao', g.pelotao,
    'atualizado_em', g.atualizado_em,
    -- Quem vê o grupo de fora não deduz o gênero de ninguém pela composição.
    'info', public.dex_corre__grupo_info(g.id) - 'homens' - 'mulheres' - 'aceita_masculino' - 'aceita_feminino' - 'aceita_outro',
    'membros', coalesce((
      select jsonb_agg(public.dex_corre__cartao(v) order by mb.entrou_em, v.id)
      from public.dex_corre_membros mb
      join public.dex_corre_perfis_validos v on v.id = mb.perfil_id
      where mb.grupo_id = g.id and mb.saiu_em is null
    ), '[]'::jsonb)
  )
  from public.dex_corre_grupos g where g.id = p_grupo
$$;

create or replace function public.dex_corre__numeros(p_evento uuid)
returns jsonb language sql stable as $$
  with ativos as (
    select g.id, count(mb.id) as total
    from public.dex_corre_grupos g
    join public.dex_corre_membros mb on mb.grupo_id = g.id and mb.saiu_em is null
    where g.evento_id = p_evento and g.status = 'ativo'
    group by g.id
  )
  select jsonb_build_object(
    'comunidade', (select count(*) from public.dex_corre_perfis_validos where evento_id = p_evento),
    'conectadas', (select coalesce(sum(total), 0) from ativos),
    'duplas', (select count(*) from ativos where total = 2),
    'trios', (select count(*) from ativos where total = 3),
    'quartetos', (select count(*) from ativos where total = 4)
  )
$$;

/** Tudo do painel de quem está logado, numa ida ao banco. */
create or replace function public.dex_corre_estado(p_slug text, p_participacao uuid, p_pessoa bigint)
returns jsonb language plpgsql as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos;
  grupo uuid;
begin
  if not public.dex_corre_sessao_valida(p_participacao, p_pessoa) then
    return jsonb_build_object('ok', false, 'erro', 'sessao');
  end if;
  perform public.dex_corre__limpar(ev);
  a := public.dex_corre__ator(p_participacao, p_pessoa);
  if a.id is null then
    return jsonb_build_object('ok', true, 'perfil', null, 'inscricao', public.dex_corre_inscricao(p_participacao, p_pessoa));
  end if;
  grupo := public.dex_corre__grupo_do(a.id);
  return jsonb_build_object(
    'ok', true,
    -- Aqui, e só aqui, o telefone volta para o próprio dono, mesmo privado.
    'perfil', public.dex_corre__cartao(a) || jsonb_build_object(
      'whatsapp', a.whatsapp, 'whatsapp_publico', a.whatsapp_publico, 'genero', a.genero_grupo),
    'grupo', case when grupo is not null then
      jsonb_set(public.dex_corre__grupo_json(grupo), '{info}', public.dex_corre__grupo_info(grupo) - 'homens' - 'mulheres') end,
    'convites_recebidos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'de', public.dex_corre__cartao(v), 'criado_em', c.criado_em,
        'grupo', case when c.grupo_id is not null then public.dex_corre__grupo_json(c.grupo_id) end
      ) order by c.criado_em desc)
      from public.dex_corre_convites c
      join public.dex_corre_perfis_validos v on v.id = c.remetente_id
      where c.destinatario_id = a.id and c.status = 'pending' and c.expira_em > now()
    ), '[]'::jsonb),
    'convites_enviados', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'para', public.dex_corre__cartao(v), 'criado_em', c.criado_em) order by c.criado_em desc)
      from public.dex_corre_convites c
      join public.dex_corre_perfis_validos v on v.id = c.destinatario_id
      where c.remetente_id = a.id and c.status = 'pending' and c.expira_em > now()
    ), '[]'::jsonb),
    'notificacoes', coalesce((
      select jsonb_agg(n) from (
        select id, tipo, dados, lida_em, criado_em from public.dex_corre_notificacoes
        where perfil_id = a.id order by criado_em desc limit 20
      ) n
    ), '[]'::jsonb),
    'numeros', public.dex_corre__numeros(ev),
    'conexoes', coalesce((
      select jsonb_agg(public.dex_corre__grupo_json(x.id))
      from (
        select g.id from public.dex_corre_grupos g
        where g.evento_id = ev and g.status = 'ativo'
        order by (select count(*) from public.dex_corre_membros mb where mb.grupo_id = g.id and mb.saiu_em is null) = 4 desc,
                 g.atualizado_em desc
        limit 8
      ) x
    ), '[]'::jsonb)
  );
end $$;

/**
 * Vitrine paginada: pessoas sem grupo e grupos ativos, já com a ação possível
 * para quem está vendo. A ação é só para a tela: entrar de verdade revalida tudo.
 */
create or replace function public.dex_corre_vitrine(
  p_slug text, p_participacao uuid, p_pessoa bigint, p_filtros jsonb, p_limite int, p_offset int
) returns jsonb language plpgsql stable as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  cfg public.dex_corre_config := public.dex_corre__config(ev);
  meu_grupo uuid;
  mi jsonb;
  f_pelotao text := nullif(p_filtros->>'pelotao', '');
  f_tamanho int := nullif(p_filtros->>'tamanho', '')::int;
  f_vagas boolean := coalesce((p_filtros->>'com_vagas')::boolean, false);
  f_busca text := public.dex_corre__sem_acento(nullif(btrim(p_filtros->>'busca'), ''));
  itens jsonb;
  total int;
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  meu_grupo := public.dex_corre__grupo_do(a.id);
  if meu_grupo is not null then mi := public.dex_corre__grupo_info(meu_grupo); end if;

  with pessoas as (
    select
      v.id, 'pessoa'::text as tipo, v.pelotao, v.preferencia as tamanho, true as com_vaga,
      v.criado_em as data, public.dex_corre__sem_acento(v.nome) as busca,
      public.dex_corre__cartao(v) as dados,
      case
        when v.pelotao is distinct from a.pelotao then 'distancia'
        when exists (select 1 from public.dex_corre_convites c where c.status = 'pending' and c.remetente_id = a.id and c.destinatario_id = v.id) then 'aguardando'
        when exists (select 1 from public.dex_corre_convites c where c.status = 'pending' and c.remetente_id = v.id and c.destinatario_id = a.id) then 'aceitar'
        when meu_grupo is not null then
          case when public.dex_corre__cabe(cfg, (mi->>'total')::int, (mi->>'homens')::int, (mi->>'mulheres')::int, (mi->>'capacidade')::int, v.genero_grupo, v.preferencia)
            then 'convidar' else 'sem_vaga_no_meu' end
        when a.preferencia = 2 or v.preferencia = 2 then 'convidar'
        else 'conectar'
      end as acao
    from public.dex_corre_perfis_validos v
    where v.evento_id = ev and v.id <> a.id and public.dex_corre__grupo_do(v.id) is null
  ),
  grupos as (
    select
      g.id, 'grupo'::text as tipo, g.pelotao, (i.j->>'capacidade')::int as tamanho,
      not (i.j->>'completo')::boolean as com_vaga, g.atualizado_em as data,
      (select string_agg(public.dex_corre__sem_acento(v.nome), ' ') from public.dex_corre_membros mb
        join public.dex_corre_perfis_validos v on v.id = mb.perfil_id
        where mb.grupo_id = g.id and mb.saiu_em is null) as busca,
      public.dex_corre__grupo_json(g.id) as dados,
      case
        when g.id = meu_grupo then 'meu'
        when (i.j->>'completo')::boolean then 'completo'
        when g.pelotao is distinct from a.pelotao then 'distancia'
        when meu_grupo is not null then 'ja_em_grupo'
        when public.dex_corre__cabe(cfg, (i.j->>'total')::int, (i.j->>'homens')::int, (i.j->>'mulheres')::int, (i.j->>'capacidade')::int, a.genero_grupo, a.preferencia) then 'entrar'
        else 'incompativel'
      end as acao
    from public.dex_corre_grupos g
    cross join lateral (select public.dex_corre__grupo_info(g.id) as j) i
    where g.evento_id = ev and g.status = 'ativo'
  ),
  tudo as (
    select * from pessoas union all select * from grupos
  ),
  filtrado as (
    select * from tudo t
    where (f_pelotao is null or t.pelotao = f_pelotao)
      and (f_tamanho is null or t.tamanho = f_tamanho)
      and (not f_vagas or t.com_vaga)
      and (f_busca is null or position(f_busca in t.busca) > 0)
  ),
  pagina as (
    select * from filtrado t
    order by
      (t.pelotao is not distinct from a.pelotao) desc,
      (t.acao in ('aceitar', 'conectar', 'convidar', 'entrar')) desc,
      (t.tipo = 'grupo' and t.com_vaga) desc,
      t.data desc, t.id
    limit p_limite offset p_offset
  )
  select
    coalesce((select jsonb_agg(jsonb_build_object('tipo', p.tipo, 'acao', p.acao, 'dados', p.dados)) from pagina p), '[]'::jsonb),
    (select count(*) from filtrado)
  into itens, total;

  return jsonb_build_object('ok', true, 'itens', itens, 'total', total);
end $$;

create or replace function public.dex_corre_ver_perfil(p_participacao uuid, p_pessoa bigint, p_codigo text)
returns jsonb language plpgsql stable as $$
declare
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  v public.dex_corre_perfis_validos;
  g uuid;
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  select * into v from public.dex_corre_perfis_validos x where x.codigo = p_codigo and x.evento_id = a.evento_id;
  if v.id is null then return jsonb_build_object('ok', false, 'erro', 'nao_encontrado'); end if;
  g := public.dex_corre__grupo_do(v.id);
  return jsonb_build_object('ok', true, 'proprio', v.id = a.id, 'perfil', public.dex_corre__cartao(v),
    'grupo', case when g is not null then public.dex_corre__grupo_json(g) end);
end $$;

create or replace function public.dex_corre_ver_grupo(p_participacao uuid, p_pessoa bigint, p_codigo text)
returns jsonb language plpgsql stable as $$
declare
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  g public.dex_corre_grupos;
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  select * into g from public.dex_corre_grupos x where x.codigo = p_codigo and x.evento_id = a.evento_id and x.status = 'ativo';
  if g.id is null then return jsonb_build_object('ok', false, 'erro', 'nao_encontrado'); end if;
  return jsonb_build_object('ok', true, 'meu', g.id = public.dex_corre__grupo_do(a.id), 'grupo', public.dex_corre__grupo_json(g.id));
end $$;

-- ─── Ações ──────────────────────────────────────────────────────────────────

/** Convite com o destino certo. Repetir o clique devolve o mesmo convite. */
create or replace function public.dex_corre__convidar(
  p_de public.dex_corre_perfis_validos, p_para public.dex_corre_perfis_validos, p_grupo uuid
) returns jsonb language plpgsql as $$
declare
  cfg public.dex_corre_config := public.dex_corre__config(p_de.evento_id);
  cid uuid;
begin
  select id into cid from public.dex_corre_convites
    where remetente_id = p_de.id and destinatario_id = p_para.id and status = 'pending';
  if cid is not null then
    return jsonb_build_object('ok', true, 'resultado', 'convite_enviado', 'repetido', true);
  end if;
  insert into public.dex_corre_convites (remetente_id, destinatario_id, grupo_id, expira_em)
    values (p_de.id, p_para.id, p_grupo, now() + make_interval(hours => cfg.convite_horas))
    returning id into cid;
  perform public.dex_corre__notificar(p_para.id, 'convite_recebido',
    jsonb_build_object('nome', public.dex_corre__nome_curto(p_de.nome), 'convite', cid));
  perform public.dex_corre__registrar(p_de.evento_id, p_de.id, 'convite_enviado', jsonb_build_object('convite', cid));
  return jsonb_build_object('ok', true, 'resultado', 'convite_enviado');
end $$;

/** Aceita ou recusa. Aceitar revalida tudo: nada verificado antes é presumido. */
create or replace function public.dex_corre__responder(
  a public.dex_corre_perfis_validos, p_convite uuid, p_aceitar boolean
) returns jsonb language plpgsql as $$
declare
  c public.dex_corre_convites;
  de public.dex_corre_perfis_validos;
  cfg public.dex_corre_config := public.dex_corre__config(a.evento_id);
  gid uuid; i jsonb; erro text;
begin
  select * into c from public.dex_corre_convites where id = p_convite and destinatario_id = a.id for update;
  if not found then return jsonb_build_object('ok', false, 'erro', 'convite_invalido'); end if;

  if c.status = 'accepted' and p_aceitar then
    gid := public.dex_corre__grupo_do(a.id);
    return jsonb_build_object('ok', true, 'resultado', 'ja_no_grupo',
      'grupo', (select codigo from public.dex_corre_grupos where id = gid));
  end if;
  if c.status = 'rejected' and not p_aceitar then return jsonb_build_object('ok', true, 'resultado', 'recusado'); end if;
  if c.status <> 'pending' or c.expira_em <= now() then
    return jsonb_build_object('ok', false, 'erro', 'convite_invalido');
  end if;

  if not p_aceitar then
    update public.dex_corre_convites set status = 'rejected', respondido_em = now() where id = c.id;
    perform public.dex_corre__notificar(c.remetente_id, 'convite_recusado',
      jsonb_build_object('nome', public.dex_corre__nome_curto(a.nome)));
    return jsonb_build_object('ok', true, 'resultado', 'recusado');
  end if;

  select * into de from public.dex_corre_perfis_validos where id = c.remetente_id;
  if de.id is null then erro := 'perfil_indisponivel';
  elsif de.pelotao is distinct from a.pelotao then erro := 'distancia';
  elsif public.dex_corre__grupo_do(a.id) is not null then erro := 'ja_em_grupo';
  end if;

  if erro is null then
    gid := public.dex_corre__grupo_do(de.id);
    if c.grupo_id is null then
      if gid is not null then erro := 'convite_invalido'; end if;
    elsif gid is distinct from c.grupo_id then
      erro := 'convite_invalido';
    else
      i := public.dex_corre__grupo_info(gid);
      if not public.dex_corre__cabe(cfg, (i->>'total')::int, (i->>'homens')::int, (i->>'mulheres')::int,
        (i->>'capacidade')::int, a.genero_grupo, a.preferencia) then
        erro := case when (i->>'completo')::boolean then 'grupo_completo' else 'composicao' end;
      end if;
    end if;
  end if;

  if erro is not null then
    update public.dex_corre_convites set status = 'cancelled', respondido_em = now() where id = c.id;
    return jsonb_build_object('ok', false, 'erro', erro);
  end if;

  update public.dex_corre_convites set status = 'accepted', respondido_em = now() where id = c.id;
  perform public.dex_corre__registrar(a.evento_id, a.id, 'convite_aceito', jsonb_build_object('convite', c.id));

  if c.grupo_id is null then
    gid := public.dex_corre__formar(de.id, a.id, a.evento_id, a.pelotao);
    perform public.dex_corre__notificar(de.id, 'convite_aceito', jsonb_build_object(
      'nome', public.dex_corre__nome_curto(a.nome),
      'grupo', (select codigo from public.dex_corre_grupos where id = gid), 'celebrar', 'dupla'));
    return jsonb_build_object('ok', true, 'resultado', 'grupo_formado',
      'grupo', (select codigo from public.dex_corre_grupos where id = gid), 'celebrar', 'dupla', 'total', 2);
  end if;

  insert into public.dex_corre_membros (grupo_id, perfil_id) values (gid, a.id);
  update public.dex_corre_grupos set atualizado_em = now() where id = gid;
  perform public.dex_corre__apos_entrar(gid, a.id);
  perform public.dex_corre__notificar(de.id, 'convite_aceito',
    jsonb_build_object('nome', public.dex_corre__nome_curto(a.nome)));
  return public.dex_corre__anunciar_entrada(gid, a.id, 'entrou_no_grupo');
end $$;

/**
 * "Quero descomplicar com você". Uma ação só, com o destino certo:
 *  - alguém escolheu dupla, ou quem clica já tem grupo: vira convite;
 *  - os dois aceitam trio ou quarteto: conecta na hora;
 *  - alvo é um grupo com vaga compatível: entra na hora.
 * Dois grupos nunca se unem nesta versão.
 */
create or replace function public.dex_corre_interesse(
  p_slug text, p_participacao uuid, p_pessoa bigint, p_alvo_perfil text, p_alvo_grupo text
) returns jsonb language plpgsql as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos;
  b public.dex_corre_perfis_validos;
  cfg public.dex_corre_config := public.dex_corre__config(ev);
  g public.dex_corre_grupos;
  meu uuid; alvo uuid; i jsonb; gid uuid; volta uuid;
begin
  perform public.dex_corre__travar(ev);
  perform public.dex_corre__limpar(ev);
  a := public.dex_corre__ator(p_participacao, p_pessoa);
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  meu := public.dex_corre__grupo_do(a.id);

  if p_alvo_perfil is not null then
    select * into b from public.dex_corre_perfis_validos v where v.codigo = p_alvo_perfil and v.evento_id = ev;
    if b.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil_indisponivel'); end if;
    if b.id = a.id then return jsonb_build_object('ok', false, 'erro', 'proprio'); end if;
    alvo := public.dex_corre__grupo_do(b.id);
  else
    select id into alvo from public.dex_corre_grupos x
      where x.codigo = p_alvo_grupo and x.evento_id = ev and x.status = 'ativo';
    if alvo is null then return jsonb_build_object('ok', false, 'erro', 'grupo_indisponivel'); end if;
  end if;

  -- Alvo em grupo: a conversa é com o grupo.
  if alvo is not null then
    select * into g from public.dex_corre_grupos where id = alvo;
    if alvo = meu then
      return jsonb_build_object('ok', true, 'resultado', 'ja_no_grupo', 'grupo', g.codigo);
    end if;
    if meu is not null then return jsonb_build_object('ok', false, 'erro', 'ja_em_grupo'); end if;
    if g.pelotao is distinct from a.pelotao then return jsonb_build_object('ok', false, 'erro', 'distancia'); end if;
    i := public.dex_corre__grupo_info(alvo);
    if (i->>'completo')::boolean then return jsonb_build_object('ok', false, 'erro', 'grupo_completo'); end if;
    if not public.dex_corre__cabe(cfg, (i->>'total')::int, (i->>'homens')::int, (i->>'mulheres')::int,
      (i->>'capacidade')::int, a.genero_grupo, a.preferencia) then
      return jsonb_build_object('ok', false, 'erro',
        case when (i->>'total')::int + 1 > a.preferencia then 'preferencia' else 'composicao' end);
    end if;
    insert into public.dex_corre_membros (grupo_id, perfil_id) values (alvo, a.id);
    update public.dex_corre_grupos set atualizado_em = now() where id = alvo;
    perform public.dex_corre__apos_entrar(alvo, a.id);
    return public.dex_corre__anunciar_entrada(alvo, a.id, 'entrou_no_grupo');
  end if;

  -- Alvo é uma pessoa sem grupo.
  if b.pelotao is distinct from a.pelotao then return jsonb_build_object('ok', false, 'erro', 'distancia'); end if;

  if meu is not null then
    i := public.dex_corre__grupo_info(meu);
    if not public.dex_corre__cabe(cfg, (i->>'total')::int, (i->>'homens')::int, (i->>'mulheres')::int,
      (i->>'capacidade')::int, b.genero_grupo, b.preferencia) then
      return jsonb_build_object('ok', false, 'erro',
        case when (i->>'completo')::boolean then 'grupo_completo' else 'composicao' end);
    end if;
    -- Quem entra precisa manifestar interesse: aqui é a outra pessoa que decide.
    return public.dex_corre__convidar(a, b, meu);
  end if;

  -- O outro lado já tinha convidado: clicar é aceitar.
  select id into volta from public.dex_corre_convites
    where remetente_id = b.id and destinatario_id = a.id and status = 'pending' and expira_em > now();
  if volta is not null then return public.dex_corre__responder(a, volta, true); end if;

  if a.preferencia = 2 or b.preferencia = 2 then
    return public.dex_corre__convidar(a, b, null);
  end if;

  gid := public.dex_corre__formar(a.id, b.id, ev, a.pelotao);
  perform public.dex_corre__notificar(b.id, 'novo_integrante', jsonb_build_object(
    'nome', public.dex_corre__nome_curto(a.nome),
    'grupo', (select codigo from public.dex_corre_grupos where id = gid), 'celebrar', 'dupla'));
  return jsonb_build_object('ok', true, 'resultado', 'grupo_formado',
    'grupo', (select codigo from public.dex_corre_grupos where id = gid), 'celebrar', 'dupla', 'total', 2);
end $$;

create or replace function public.dex_corre_responder_convite(
  p_slug text, p_participacao uuid, p_pessoa bigint, p_convite uuid, p_aceitar boolean
) returns jsonb language plpgsql as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos;
begin
  perform public.dex_corre__travar(ev);
  perform public.dex_corre__limpar(ev);
  a := public.dex_corre__ator(p_participacao, p_pessoa);
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  return public.dex_corre__responder(a, p_convite, p_aceitar);
end $$;

create or replace function public.dex_corre_cancelar_convite(
  p_slug text, p_participacao uuid, p_pessoa bigint, p_convite uuid
) returns jsonb language plpgsql as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos;
begin
  perform public.dex_corre__travar(ev);
  a := public.dex_corre__ator(p_participacao, p_pessoa);
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  update public.dex_corre_convites set status = 'cancelled', respondido_em = now()
    where id = p_convite and remetente_id = a.id and status = 'pending';
  return jsonb_build_object('ok', true, 'resultado', 'cancelado');
end $$;

create or replace function public.dex_corre_sair_do_grupo(p_slug text, p_participacao uuid, p_pessoa bigint)
returns jsonb language plpgsql as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos;
  gid uuid;
begin
  perform public.dex_corre__travar(ev);
  perform public.dex_corre__limpar(ev);
  a := public.dex_corre__ator(p_participacao, p_pessoa);
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  gid := public.dex_corre__grupo_do(a.id);
  if gid is null then return jsonb_build_object('ok', true, 'resultado', 'sem_grupo'); end if;
  -- Convites que a pessoa mandou em nome do grupo saem com ela.
  update public.dex_corre_convites set status = 'cancelled', respondido_em = now()
    where status = 'pending' and remetente_id = a.id and grupo_id = gid;
  perform public.dex_corre__remover(gid, a.id, 'saiu');
  return jsonb_build_object('ok', true, 'resultado', 'saiu');
end $$;

create or replace function public.dex_corre_ler_notificacoes(p_participacao uuid, p_pessoa bigint, p_ids uuid[])
returns jsonb language plpgsql as $$
declare
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  update public.dex_corre_notificacoes set lida_em = now()
    where perfil_id = a.id and lida_em is null and (p_ids is null or id = any(p_ids));
  return jsonb_build_object('ok', true);
end $$;

-- ─── Métricas (para a gestão; sem painel nesta versão) ──────────────────────

create or replace function public.dex_corre_metricas(p_slug text)
returns jsonb language sql stable as $$
  with e as (select public.dex_corre__evento(p_slug) as id),
  perfis as (select v.* from public.dex_corre_perfis_validos v, e where v.evento_id = e.id),
  convites as (
    select c.* from public.dex_corre_convites c
    join public.dex_corre_perfis p on p.id = c.remetente_id, e where p.evento_id = e.id
  ),
  elegiveis as (select count(*) as n from public.evento_participantes ep, e where ep.evento_id = e.id and ep.status <> 'cancelado')
  select public.dex_corre__numeros((select id from e)) || jsonb_build_object(
    'elegiveis', (select n from elegiveis),
    'perfis', (select count(*) from perfis),
    'conversao_perfis', round((select count(*) from perfis)::numeric / nullif((select n from elegiveis), 0), 4),
    'com_foto', (select count(*) from perfis where foto_path is not null),
    'com_instagram', (select count(*) from perfis where instagram is not null),
    'whatsapp_publico', (select count(*) from perfis where whatsapp_publico),
    'convites_enviados', (select count(*) from convites),
    'convites_aceitos', (select count(*) from convites where status = 'accepted'),
    'taxa_aceite', round((select count(*) from convites where status = 'accepted')::numeric / nullif((select count(*) from convites), 0), 4),
    'saidas', (select count(*) from public.dex_corre_atividade a, e where a.evento_id = e.id and a.tipo = 'integrante_removido'),
    'autenticados', (select count(distinct a.dados->>'participacao') from public.dex_corre_atividade a, e
       where a.evento_id = e.id and a.tipo = 'acesso'),
    'por_distancia', coalesce((select jsonb_object_agg(coalesce(x.pelotao, '?'), x.n)
       from (select pelotao, count(*) as n from perfis group by pelotao) x), '{}'::jsonb)
  )
$$;

-- ─── Segurança ──────────────────────────────────────────────────────────────

alter table public.dex_corre_config enable row level security;
alter table public.dex_corre_perfis enable row level security;
alter table public.dex_corre_grupos enable row level security;
alter table public.dex_corre_membros enable row level security;
alter table public.dex_corre_convites enable row level security;
alter table public.dex_corre_notificacoes enable row level security;
alter table public.dex_corre_atividade enable row level security;

revoke all on
  public.dex_corre_config, public.dex_corre_perfis, public.dex_corre_grupos, public.dex_corre_membros,
  public.dex_corre_convites, public.dex_corre_notificacoes, public.dex_corre_atividade,
  public.dex_corre_perfis_validos
from public, anon, authenticated;

grant all on
  public.dex_corre_config, public.dex_corre_perfis, public.dex_corre_grupos, public.dex_corre_membros,
  public.dex_corre_convites, public.dex_corre_notificacoes, public.dex_corre_atividade,
  public.dex_corre_perfis_validos
to service_role;

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as assinatura
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'dex\_corre\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.assinatura);
    execute format('grant execute on function %s to service_role', f.assinatura);
  end loop;
end $$;

-- Fotos: bucket privado, só para isto. A rota de imagem confere a sessão.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dex-corre-fotos', 'dex-corre-fotos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

insert into public.dex_corre_config (evento_id)
select id from public.eventos where slug = 'dexcomplica-love-run'
on conflict (evento_id) do nothing;
