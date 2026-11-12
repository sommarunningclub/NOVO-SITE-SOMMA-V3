-- Plataforma de eventos do SOMMA Club (prefixo evp_).
-- Primeira aplicação: Meeting Técnico | Maratona Monumental de Brasília 2026,
-- em /maratonamonumental2026.
--
-- Por que evp_ e não events/event_registrations: `public.event_registrations`
-- já existe no banco (outra aplicação). O prefixo evita qualquer conflito.
--
--   evp_events          evento e sua configuração
--   evp_registrations   inscrições (confirmada, lista_espera, cancelada)
--   evp_waitlist        fila da lista de espera
--   evp_checkins        credenciamento (um ativo por inscrição)
--   evp_staff           equipe autorizada (admin, operador)
--   evp_schedule        programação
--   evp_speakers        profissionais
--   evp_routes          percursos georreferenciados (GeoJSON validado)
--   evp_audit_logs      histórico de alterações
--   evp_page_views      visitas e inícios de formulário por dia e origem
--
-- Regras centrais:
--   * Toda leitura e escrita passa por função chamada com a service role, a
--     partir do servidor do site. RLS ligada e sem política: anon e
--     authenticated não enxergam nada.
--   * Vaga é decidida aqui, dentro de uma transação que trava a linha do
--     evento (`for update`). A última vaga não sai para duas pessoas.
--   * O CPF chega cifrado (AES-256-GCM, feito no servidor do site) e com um
--     HMAC para deduplicar. O banco nunca vê o CPF em claro.
--
-- Pode reexecutar: só cria o que falta e recria as funções.

-- ─── Tabelas ────────────────────────────────────────────────────────────────

create table if not exists public.evp_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  descricao text,
  starts_at timestamptz,
  ends_at timestamptz,
  local_nome text,
  endereco text,
  lat double precision,
  lng double precision,
  orientacoes_chegada text,
  info_participacao text,
  capacidade integer check (capacidade is null or capacidade >= 0),
  -- null = ainda não definido; 0 = gratuito.
  valor_centavos integer check (valor_centavos is null or valor_centavos >= 0),
  inscricoes_status text not null default 'em_breve'
    check (inscricoes_status in ('em_breve', 'aberta', 'encerrada')),
  -- O que acontece quando as vagas acabam.
  ao_lotar text not null default 'lista_espera' check (ao_lotar in ('lista_espera', 'encerrar')),
  -- Vaga liberada vai sozinha para o primeiro da fila.
  promover_automatico boolean not null default true,
  -- Textos, imagens e links editáveis da página.
  conteudo jsonb not null default '{}'::jsonb,
  contato jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (lat is null or (lat between -90 and 90)),
  check (lng is null or (lng between -180 and 180))
);

create table if not exists public.evp_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.evp_events (id) on delete restrict,
  status text not null check (status in ('confirmada', 'lista_espera', 'cancelada')),
  -- Código curto, para a equipe conferir. Não dá acesso a nada.
  codigo text not null unique,
  -- Abre a página do ingresso. Vai no link do e-mail.
  ticket_token text not null unique,
  -- Conteúdo do QR Code. Só serve para o credenciamento.
  qr_token text not null unique,
  nome text not null,
  -- Nome sem acento e em minúsculas, para a busca do credenciamento.
  nome_busca text not null,
  email text not null,
  telefone text not null,
  cpf_cifrado text not null,
  cpf_hmac text not null,
  cpf_final text not null check (cpf_final ~ '^[0-9]{2}$'),
  sexo text not null check (sexo in ('masculino', 'feminino')),
  distancia text not null
    check (distancia in ('5k', '10k', '21k', '42k', '5k+21k', '10k+21k', '5k+42k', '10k+42k')),
  primeira_vez boolean not null,
  aceite_termos_em timestamptz not null,
  aceite_marketing boolean not null default false,
  origem jsonb not null default '{}'::jsonb,
  origem_fonte text not null default 'direto',
  idempotency_key text,
  confirmada_em timestamptz,
  cancelada_em timestamptz,
  cancelada_motivo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Uma inscrição ativa por CPF em cada evento.
create unique index if not exists evp_registrations_cpf_ativo
  on public.evp_registrations (event_id, cpf_hmac) where status <> 'cancelada';
-- Reenvio da mesma requisição não vira segunda inscrição.
create unique index if not exists evp_registrations_idempotencia
  on public.evp_registrations (event_id, idempotency_key) where idempotency_key is not null;
create index if not exists evp_registrations_evento_status
  on public.evp_registrations (event_id, status);

create table if not exists public.evp_waitlist (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.evp_events (id) on delete restrict,
  registration_id uuid not null unique references public.evp_registrations (id) on delete cascade,
  entrou_em timestamptz not null default now(),
  saiu_em timestamptz,
  motivo_saida text check (motivo_saida is null or motivo_saida in ('promovida', 'cancelada'))
);
create index if not exists evp_waitlist_fila
  on public.evp_waitlist (event_id, entrou_em) where saiu_em is null;

create table if not exists public.evp_staff (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.evp_events (id) on delete restrict,
  nome text not null,
  email text not null,
  senha_hash text,
  papel text not null check (papel in ('admin', 'operador')),
  ativo boolean not null default true,
  -- Conta da senha mestra (variável de ambiente). Não tem senha no banco.
  mestre boolean not null default false,
  ultimo_acesso timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, email)
);

create table if not exists public.evp_checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.evp_events (id) on delete restrict,
  registration_id uuid not null references public.evp_registrations (id) on delete cascade,
  staff_id uuid not null references public.evp_staff (id) on delete restrict,
  via text not null check (via in ('qr', 'manual')),
  feito_em timestamptz not null default now(),
  desfeito_em timestamptz,
  desfeito_por uuid references public.evp_staff (id) on delete restrict
);
-- Um check-in ativo por inscrição: é o que barra o duplicado.
create unique index if not exists evp_checkins_ativo
  on public.evp_checkins (registration_id) where desfeito_em is null;

create table if not exists public.evp_schedule (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.evp_events (id) on delete cascade,
  ordem integer not null,
  titulo text not null,
  descricao text,
  -- Só aparece na página quando preenchido.
  horario text
);
create index if not exists evp_schedule_evento on public.evp_schedule (event_id, ordem);

create table if not exists public.evp_speakers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.evp_events (id) on delete cascade,
  ordem integer not null,
  nome text not null,
  funcao text,
  descricao text,
  especialidade text,
  foto_url text,
  organizacao text not null default 'bora' check (organizacao in ('bora', 'somma'))
);
create index if not exists evp_speakers_evento on public.evp_speakers (event_id, ordem);

create table if not exists public.evp_routes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.evp_events (id) on delete cascade,
  distancia text not null check (distancia in ('5k', '10k', '21k', '42k')),
  -- Só percurso publicado aparece na página.
  status text not null default 'em_validacao' check (status in ('em_validacao', 'publicado')),
  -- [[lng, lat], ...] na ordem de corrida.
  coordenadas jsonb not null,
  comprimento_m integer not null,
  pontos integer not null,
  arquivo_nome text,
  formato text,
  fonte text,
  relatorio jsonb not null default '{}'::jsonb,
  enviado_por uuid references public.evp_staff (id) on delete set null,
  enviado_em timestamptz not null default now(),
  publicado_por uuid references public.evp_staff (id) on delete set null,
  publicado_em timestamptz,
  unique (event_id, distancia)
);

create table if not exists public.evp_audit_logs (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.evp_events (id) on delete cascade,
  staff_id uuid references public.evp_staff (id) on delete set null,
  staff_nome text,
  acao text not null,
  alvo_tipo text,
  alvo_id text,
  detalhes jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists evp_audit_evento on public.evp_audit_logs (event_id, criado_em desc);
create index if not exists evp_audit_alvo on public.evp_audit_logs (alvo_tipo, alvo_id);

-- Contadores agregados, sem dado pessoal.
create table if not exists public.evp_page_views (
  event_id uuid not null references public.evp_events (id) on delete cascade,
  dia date not null,
  origem text not null,
  visitas integer not null default 0,
  inicios_form integer not null default 0,
  primary key (event_id, dia, origem)
);

-- ─── Internas ───────────────────────────────────────────────────────────────

create or replace function public.evp__log(
  p_event uuid, p_staff uuid, p_acao text, p_alvo_tipo text, p_alvo_id text, p_detalhes jsonb
) returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  insert into public.evp_audit_logs (event_id, staff_id, staff_nome, acao, alvo_tipo, alvo_id, detalhes)
  values (
    p_event, p_staff,
    (select s.nome from public.evp_staff s where s.id = p_staff),
    p_acao, p_alvo_tipo, p_alvo_id, coalesce(p_detalhes, '{}'::jsonb)
  );
end $$;

create or replace function public.evp__confirmadas(p_event uuid) returns integer
language sql stable
set search_path = public, pg_temp
as $$
  select count(*)::int from public.evp_registrations where event_id = p_event and status = 'confirmada';
$$;

create or replace function public.evp__fila(p_event uuid) returns integer
language sql stable
set search_path = public, pg_temp
as $$
  select count(*)::int from public.evp_waitlist where event_id = p_event and saiu_em is null;
$$;

/** O que a página pode dizer sobre as vagas. Sempre o número real do banco. */
create or replace function public.evp__situacao(ev public.evp_events) returns jsonb
language plpgsql stable
set search_path = public, pg_temp
as $$
declare
  n int := public.evp__confirmadas(ev.id);
  f int := public.evp__fila(ev.id);
  livres int;
  modo text;
begin
  livres := case when ev.capacidade is null then null else greatest(ev.capacidade - n, 0) end;
  modo := case
    when ev.inscricoes_status = 'em_breve' then 'em_breve'
    when ev.inscricoes_status = 'encerrada' then 'encerrada'
    when ev.capacidade is null then 'em_breve'
    when livres > 0 and f = 0 then 'aberta'
    when ev.ao_lotar = 'lista_espera' then 'lista_espera'
    else 'esgotada'
  end;
  return jsonb_build_object(
    'modo', modo,
    'capacidade', ev.capacidade,
    'confirmadas', n,
    'vagas_livres', livres,
    'fila', f
  );
end $$;

/**
 * Leva gente da fila para as vagas livres, na ordem de chegada. Quem chama já
 * travou a linha do evento. Devolve quem foi promovido, para o site avisar.
 */
create or replace function public.evp__promover_fila(p_event uuid, p_staff uuid) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  ev public.evp_events;
  w record;
  saida jsonb := '[]'::jsonb;
begin
  select * into ev from public.evp_events where id = p_event;
  if ev.capacidade is null then return saida; end if;

  loop
    exit when public.evp__confirmadas(p_event) >= ev.capacidade;
    select wl.id, wl.registration_id into w
      from public.evp_waitlist wl
      where wl.event_id = p_event and wl.saiu_em is null
      order by wl.entrou_em, wl.id
      limit 1;
    exit when not found;

    update public.evp_waitlist set saiu_em = now(), motivo_saida = 'promovida' where id = w.id;
    update public.evp_registrations
      set status = 'confirmada', confirmada_em = now(), updated_at = now()
      where id = w.registration_id;
    perform public.evp__log(p_event, p_staff, 'lista_espera_promovida', 'inscricao', w.registration_id::text, '{}'::jsonb);

    saida := saida || (
      select jsonb_build_object('id', r.id, 'nome', r.nome, 'email', r.email, 'codigo', r.codigo, 'ticket_token', r.ticket_token)
      from public.evp_registrations r where r.id = w.registration_id
    );
  end loop;
  return saida;
end $$;

create or replace function public.evp__registro_publico(r public.evp_registrations) returns jsonb
language sql stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', r.id, 'status', r.status, 'codigo', r.codigo, 'ticket_token', r.ticket_token,
    'nome', r.nome, 'email', r.email, 'distancia', r.distancia,
    'posicao_fila', case when r.status = 'lista_espera' then (
      select count(*)::int from public.evp_waitlist w
      join public.evp_waitlist eu on eu.registration_id = r.id
      where w.event_id = r.event_id and w.saiu_em is null
        and (w.entrou_em, w.id) <= (eu.entrou_em, eu.id)
    ) end
  );
$$;

-- ─── Público ────────────────────────────────────────────────────────────────

/** Tudo o que a landing page mostra. Nenhum dado pessoal de inscrito. */
create or replace function public.evp_evento_publico(p_slug text) returns jsonb
language plpgsql stable
set search_path = public, pg_temp
as $$
declare ev public.evp_events;
begin
  select * into ev from public.evp_events where slug = p_slug;
  if not found then return null; end if;
  return jsonb_build_object(
    'slug', ev.slug, 'nome', ev.nome, 'descricao', ev.descricao,
    'starts_at', ev.starts_at, 'ends_at', ev.ends_at,
    'local_nome', ev.local_nome, 'endereco', ev.endereco, 'lat', ev.lat, 'lng', ev.lng,
    'orientacoes_chegada', ev.orientacoes_chegada, 'info_participacao', ev.info_participacao,
    'valor_centavos', ev.valor_centavos,
    'conteudo', ev.conteudo, 'contato', ev.contato,
    'vagas', public.evp__situacao(ev),
    'programacao', coalesce((
      select jsonb_agg(jsonb_build_object('titulo', s.titulo, 'descricao', s.descricao, 'horario', s.horario) order by s.ordem)
      from public.evp_schedule s where s.event_id = ev.id), '[]'::jsonb),
    'profissionais', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nome', p.nome, 'funcao', p.funcao, 'descricao', p.descricao,
        'especialidade', p.especialidade, 'foto_url', p.foto_url, 'organizacao', p.organizacao) order by p.ordem)
      from public.evp_speakers p where p.event_id = ev.id), '[]'::jsonb),
    'percursos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'distancia', r.distancia, 'coordenadas', r.coordenadas,
        'comprimento_m', r.comprimento_m, 'fonte', r.fonte))
      from public.evp_routes r where r.event_id = ev.id and r.status = 'publicado'), '[]'::jsonb)
  );
end $$;

/**
 * Inscrição. Uma transação: trava o evento, confere reenvio, duplicidade,
 * abertura e vaga, e só então grava. p = dados já validados e normalizados
 * pelo servidor do site.
 */
create or replace function public.evp_inscrever(p_slug text, p jsonb) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  ev public.evp_events;
  r public.evp_registrations;
  n int;
  f int;
  novo_status text;
begin
  select * into ev from public.evp_events where slug = p_slug for update;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'sem_evento');
  end if;

  if nullif(p->>'idempotency_key', '') is not null then
    select * into r from public.evp_registrations
      where event_id = ev.id and idempotency_key = p->>'idempotency_key';
    if found then
      -- A chave só vale para a mesma pessoa.
      if r.cpf_hmac <> p->>'cpf_hmac' then
        return jsonb_build_object('ok', false, 'motivo', 'chave_em_uso');
      end if;
      return jsonb_build_object('ok', true, 'repetida', true, 'inscricao', public.evp__registro_publico(r));
    end if;
  end if;

  select * into r from public.evp_registrations
    where event_id = ev.id and cpf_hmac = p->>'cpf_hmac' and status <> 'cancelada';
  if found then
    return jsonb_build_object('ok', false, 'motivo', 'duplicada', 'status', r.status, 'email', r.email);
  end if;

  if ev.inscricoes_status <> 'aberta' or ev.capacidade is null then
    return jsonb_build_object('ok', false, 'motivo', 'fechada', 'vagas', public.evp__situacao(ev));
  end if;

  n := public.evp__confirmadas(ev.id);
  f := public.evp__fila(ev.id);
  if n < ev.capacidade and f = 0 then
    novo_status := 'confirmada';
  elsif ev.ao_lotar = 'lista_espera' then
    novo_status := 'lista_espera';
  else
    return jsonb_build_object('ok', false, 'motivo', 'lotado', 'vagas', public.evp__situacao(ev));
  end if;

  insert into public.evp_registrations (
    event_id, status, codigo, ticket_token, qr_token, nome, nome_busca, email, telefone,
    cpf_cifrado, cpf_hmac, cpf_final, sexo, distancia, primeira_vez,
    aceite_termos_em, aceite_marketing, origem, origem_fonte, idempotency_key, confirmada_em
  ) values (
    ev.id, novo_status, p->>'codigo', p->>'ticket_token', p->>'qr_token',
    p->>'nome', p->>'nome_busca', p->>'email', p->>'telefone',
    p->>'cpf_cifrado', p->>'cpf_hmac', p->>'cpf_final', p->>'sexo', p->>'distancia',
    (p->>'primeira_vez')::boolean,
    now(), coalesce((p->>'aceite_marketing')::boolean, false),
    coalesce(p->'origem', '{}'::jsonb), coalesce(nullif(p->>'origem_fonte', ''), 'direto'),
    nullif(p->>'idempotency_key', ''),
    case when novo_status = 'confirmada' then now() end
  ) returning * into r;

  if novo_status = 'lista_espera' then
    insert into public.evp_waitlist (event_id, registration_id) values (ev.id, r.id);
  end if;

  perform public.evp__log(ev.id, null,
    case when novo_status = 'confirmada' then 'inscricao_confirmada' else 'lista_espera_entrada' end,
    'inscricao', r.id::text, jsonb_build_object('distancia', r.distancia, 'origem', r.origem_fonte));

  return jsonb_build_object('ok', true, 'repetida', false,
    'inscricao', public.evp__registro_publico(r), 'vagas', public.evp__situacao(ev));
end $$;

/** Página do ingresso. Quem tem o token vê o próprio ingresso e mais nada. */
create or replace function public.evp_ingresso(p_slug text, p_ticket_token text) returns jsonb
language plpgsql stable
set search_path = public, pg_temp
as $$
declare
  ev public.evp_events;
  r public.evp_registrations;
begin
  select * into ev from public.evp_events where slug = p_slug;
  if not found then return null; end if;
  select * into r from public.evp_registrations where event_id = ev.id and ticket_token = p_ticket_token;
  if not found then return null; end if;
  return public.evp__registro_publico(r) || jsonb_build_object(
    'qr_token', r.qr_token,
    'presente', exists (select 1 from public.evp_checkins c where c.registration_id = r.id and c.desfeito_em is null),
    'evento', jsonb_build_object(
      'nome', ev.nome, 'starts_at', ev.starts_at, 'ends_at', ev.ends_at,
      'local_nome', ev.local_nome, 'endereco', ev.endereco, 'lat', ev.lat, 'lng', ev.lng)
  );
end $$;

/** Reenvio pelo próprio inscrito: acha a inscrição ativa pelo HMAC do CPF. */
create or replace function public.evp_inscricao_por_cpf(p_slug text, p_cpf_hmac text) returns jsonb
language sql stable
set search_path = public, pg_temp
as $$
  select public.evp__registro_publico(r)
  from public.evp_registrations r
  join public.evp_events e on e.id = r.event_id
  where e.slug = p_slug and r.cpf_hmac = p_cpf_hmac and r.status <> 'cancelada';
$$;

/** Conta visita ou início de formulário. tipo: 'visita' | 'inicio_form'. */
create or replace function public.evp_registrar_funil(p_slug text, p_origem text, p_tipo text) returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare ev_id uuid;
begin
  select id into ev_id from public.evp_events where slug = p_slug;
  if ev_id is null then return; end if;
  insert into public.evp_page_views (event_id, dia, origem, visitas, inicios_form)
  values (
    ev_id, (now() at time zone 'America/Sao_Paulo')::date, coalesce(nullif(p_origem, ''), 'direto'),
    case when p_tipo = 'visita' then 1 else 0 end,
    case when p_tipo = 'inicio_form' then 1 else 0 end
  )
  on conflict (event_id, dia, origem) do update set
    visitas = public.evp_page_views.visitas + excluded.visitas,
    inicios_form = public.evp_page_views.inicios_form + excluded.inicios_form;
end $$;

-- ─── Equipe ─────────────────────────────────────────────────────────────────

/** Para o login: devolve o hash para o servidor conferir. Nunca vai ao navegador. */
create or replace function public.evp_staff_login(p_slug text, p_email text) returns jsonb
language sql stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object('id', s.id, 'nome', s.nome, 'papel', s.papel, 'senha_hash', s.senha_hash, 'ativo', s.ativo)
  from public.evp_staff s join public.evp_events e on e.id = s.event_id
  where e.slug = p_slug and s.email = lower(trim(p_email)) and not s.mestre;
$$;

/** Conferida a cada requisição: conta desativada perde o acesso na hora. */
create or replace function public.evp_staff_sessao(p_slug text, p_staff uuid) returns jsonb
language sql stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object('id', s.id, 'nome', s.nome, 'papel', s.papel, 'ativo', s.ativo, 'mestre', s.mestre)
  from public.evp_staff s join public.evp_events e on e.id = s.event_id
  where e.slug = p_slug and s.id = p_staff;
$$;

create or replace function public.evp_staff_marcar_acesso(p_staff uuid) returns void
language sql
set search_path = public, pg_temp
as $$
  update public.evp_staff set ultimo_acesso = now() where id = p_staff;
$$;

/** Conta da senha mestra. Criada na primeira vez que alguém entra com ela. */
create or replace function public.evp_staff_mestre(p_slug text) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  ev_id uuid;
  s public.evp_staff;
begin
  select id into ev_id from public.evp_events where slug = p_slug;
  if ev_id is null then return null; end if;
  select * into s from public.evp_staff where event_id = ev_id and mestre;
  if not found then
    insert into public.evp_staff (event_id, nome, email, papel, mestre)
    values (ev_id, 'Administrador (senha mestra)', 'mestre@interno', 'admin', true)
    returning * into s;
  end if;
  update public.evp_staff set ultimo_acesso = now() where id = s.id;
  return jsonb_build_object('id', s.id, 'nome', s.nome, 'papel', s.papel, 'ativo', s.ativo, 'mestre', true);
end $$;

create or replace function public.evp_admin_staff_listar(p_slug text) returns jsonb
language sql stable
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'nome', s.nome, 'email', s.email, 'papel', s.papel, 'ativo', s.ativo,
    'mestre', s.mestre, 'ultimo_acesso', s.ultimo_acesso, 'tem_senha', s.senha_hash is not null
  ) order by s.mestre desc, s.nome), '[]'::jsonb)
  from public.evp_staff s join public.evp_events e on e.id = s.event_id
  where e.slug = p_slug;
$$;

/** Cria ou edita uma pessoa da equipe. p.senha_hash só quando a senha muda. */
create or replace function public.evp_admin_staff_salvar(p_slug text, p_staff uuid, p jsonb) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  ev_id uuid;
  alvo public.evp_staff;
  v_email text := lower(trim(coalesce(p->>'email', '')));
begin
  select id into ev_id from public.evp_events where slug = p_slug;
  if ev_id is null then return jsonb_build_object('ok', false, 'motivo', 'sem_evento'); end if;

  if nullif(p->>'id', '') is null then
    if exists (select 1 from public.evp_staff where event_id = ev_id and email = v_email) then
      return jsonb_build_object('ok', false, 'motivo', 'email_em_uso');
    end if;
    if nullif(p->>'senha_hash', '') is null then
      return jsonb_build_object('ok', false, 'motivo', 'sem_senha');
    end if;
    insert into public.evp_staff (event_id, nome, email, senha_hash, papel, ativo)
    values (ev_id, trim(p->>'nome'), v_email, p->>'senha_hash', p->>'papel', coalesce((p->>'ativo')::boolean, true))
    returning * into alvo;
    perform public.evp__log(ev_id, p_staff, 'equipe_criada', 'equipe', alvo.id::text,
      jsonb_build_object('nome', alvo.nome, 'papel', alvo.papel));
  else
    select * into alvo from public.evp_staff where id = (p->>'id')::uuid and event_id = ev_id for update;
    if not found then return jsonb_build_object('ok', false, 'motivo', 'nao_encontrado'); end if;
    if alvo.mestre then return jsonb_build_object('ok', false, 'motivo', 'conta_mestra'); end if;
    if exists (select 1 from public.evp_staff where event_id = ev_id and email = v_email and id <> alvo.id) then
      return jsonb_build_object('ok', false, 'motivo', 'email_em_uso');
    end if;
    update public.evp_staff set
      nome = trim(p->>'nome'), email = v_email, papel = p->>'papel',
      ativo = coalesce((p->>'ativo')::boolean, ativo),
      senha_hash = coalesce(nullif(p->>'senha_hash', ''), senha_hash)
    where id = alvo.id;
    perform public.evp__log(ev_id, p_staff, 'equipe_editada', 'equipe', alvo.id::text,
      jsonb_build_object('papel', p->>'papel', 'ativo', p->>'ativo', 'senha_trocada', nullif(p->>'senha_hash', '') is not null));
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ─── Credenciamento ─────────────────────────────────────────────────────────

/**
 * Check-in. A credencial é conferida aqui, no banco: o QR só carrega um
 * identificador, e é a inscrição encontrada que decide. Trava a inscrição para
 * dois aparelhos não registrarem a mesma pessoa.
 */
create or replace function public.evp_checkin(
  p_slug text, p_staff uuid, p_qr_token text, p_registration uuid, p_via text
) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  ev_id uuid;
  r public.evp_registrations;
  c public.evp_checkins;
  resumo jsonb;
begin
  select id into ev_id from public.evp_events where slug = p_slug;
  if ev_id is null then return jsonb_build_object('ok', false, 'motivo', 'sem_evento'); end if;

  if not exists (select 1 from public.evp_staff where id = p_staff and event_id = ev_id and ativo) then
    return jsonb_build_object('ok', false, 'motivo', 'sem_permissao');
  end if;

  if p_registration is not null then
    select * into r from public.evp_registrations where id = p_registration and event_id = ev_id for update;
  else
    select * into r from public.evp_registrations where qr_token = p_qr_token and event_id = ev_id for update;
  end if;
  if not found then
    perform public.evp__log(ev_id, p_staff, 'checkin_recusado', 'inscricao', null, jsonb_build_object('motivo', 'invalido', 'via', p_via));
    return jsonb_build_object('ok', false, 'motivo', 'invalido');
  end if;

  resumo := jsonb_build_object('id', r.id, 'nome', r.nome, 'codigo', r.codigo, 'distancia', r.distancia, 'cpf_final', r.cpf_final);

  if r.status <> 'confirmada' then
    perform public.evp__log(ev_id, p_staff, 'checkin_recusado', 'inscricao', r.id::text, jsonb_build_object('motivo', r.status, 'via', p_via));
    return jsonb_build_object('ok', false, 'motivo', r.status, 'inscricao', resumo);
  end if;

  select * into c from public.evp_checkins where registration_id = r.id and desfeito_em is null;
  if found then
    perform public.evp__log(ev_id, p_staff, 'checkin_recusado', 'inscricao', r.id::text, jsonb_build_object('motivo', 'duplicado', 'via', p_via));
    return jsonb_build_object('ok', false, 'motivo', 'duplicado', 'inscricao', resumo,
      'feito_em', c.feito_em,
      'operador', (select s.nome from public.evp_staff s where s.id = c.staff_id));
  end if;

  insert into public.evp_checkins (event_id, registration_id, staff_id, via)
  values (ev_id, r.id, p_staff, case when p_via = 'qr' then 'qr' else 'manual' end)
  returning * into c;
  perform public.evp__log(ev_id, p_staff, 'checkin', 'inscricao', r.id::text, jsonb_build_object('via', c.via));

  return jsonb_build_object('ok', true, 'inscricao', resumo, 'feito_em', c.feito_em,
    'presentes', (select count(*)::int from public.evp_checkins where event_id = ev_id and desfeito_em is null));
end $$;

create or replace function public.evp_checkin_desfazer(p_slug text, p_staff uuid, p_registration uuid) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  ev_id uuid;
  c public.evp_checkins;
begin
  select id into ev_id from public.evp_events where slug = p_slug;
  if ev_id is null then return jsonb_build_object('ok', false, 'motivo', 'sem_evento'); end if;
  select * into c from public.evp_checkins
    where registration_id = p_registration and event_id = ev_id and desfeito_em is null for update;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'sem_checkin'); end if;
  update public.evp_checkins set desfeito_em = now(), desfeito_por = p_staff where id = c.id;
  perform public.evp__log(ev_id, p_staff, 'checkin_desfeito', 'inscricao', p_registration::text, '{}'::jsonb);
  return jsonb_build_object('ok', true);
end $$;

/** Busca manual: nome, código ou CPF inteiro (por HMAC). Sem e-mail e sem telefone. */
create or replace function public.evp_checkin_buscar(p_slug text, p_termo text, p_cpf_hmac text) returns jsonb
language sql stable
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(x.linha order by x.nome), '[]'::jsonb) from (
    select r.nome, jsonb_build_object(
      'id', r.id, 'nome', r.nome, 'codigo', r.codigo, 'distancia', r.distancia,
      'status', r.status, 'cpf_final', r.cpf_final,
      'checkin_em', (select c.feito_em from public.evp_checkins c where c.registration_id = r.id and c.desfeito_em is null)
    ) as linha
    from public.evp_registrations r join public.evp_events e on e.id = r.event_id
    where e.slug = p_slug and r.status <> 'cancelada' and (
      (p_cpf_hmac is not null and r.cpf_hmac = p_cpf_hmac)
      or (p_cpf_hmac is null and length(p_termo) >= 2 and (
        r.nome_busca like '%' || replace(replace(replace(p_termo, '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
        or upper(r.codigo) = upper(p_termo)
        or upper(r.codigo) = 'MT-' || upper(p_termo)
      ))
    )
    order by r.nome
    limit 25
  ) x;
$$;

create or replace function public.evp_checkin_resumo(p_slug text) returns jsonb
language sql stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'confirmadas', public.evp__confirmadas(e.id),
    'presentes', (select count(*)::int from public.evp_checkins c where c.event_id = e.id and c.desfeito_em is null),
    'ultimos', coalesce((
      select jsonb_agg(u.linha order by u.feito_em desc) from (
        select c.feito_em, jsonb_build_object(
          'nome', r.nome, 'codigo', r.codigo, 'distancia', r.distancia, 'feito_em', c.feito_em,
          'operador', s.nome, 'via', c.via) as linha
        from public.evp_checkins c
        join public.evp_registrations r on r.id = c.registration_id
        join public.evp_staff s on s.id = c.staff_id
        where c.event_id = e.id and c.desfeito_em is null
        order by c.feito_em desc limit 12
      ) u), '[]'::jsonb)
  )
  from public.evp_events e where e.slug = p_slug;
$$;

-- ─── Administração ──────────────────────────────────────────────────────────

create or replace function public.evp_admin_painel(p_slug text) returns jsonb
language plpgsql stable
set search_path = public, pg_temp
as $$
declare
  ev public.evp_events;
  v_presentes int;
  v_confirmadas int;
  v_visitas int;
  v_inicios int;
  v_inscritas int;
begin
  select * into ev from public.evp_events where slug = p_slug;
  if not found then return null; end if;
  v_confirmadas := public.evp__confirmadas(ev.id);
  select count(*)::int into v_presentes from public.evp_checkins where event_id = ev.id and desfeito_em is null;
  select coalesce(sum(v.visitas), 0)::int, coalesce(sum(v.inicios_form), 0)::int into v_visitas, v_inicios
    from public.evp_page_views v where v.event_id = ev.id;
  select count(*)::int into v_inscritas from public.evp_registrations where event_id = ev.id and status <> 'cancelada';

  return jsonb_build_object(
    'vagas', public.evp__situacao(ev),
    'inscricoes_status', ev.inscricoes_status,
    'confirmadas', v_confirmadas,
    'lista_espera', public.evp__fila(ev.id),
    'canceladas', (select count(*)::int from public.evp_registrations where event_id = ev.id and status = 'cancelada'),
    'presentes', v_presentes,
    'taxa_comparecimento', case when v_confirmadas > 0 then round(v_presentes::numeric * 100 / v_confirmadas, 1) end,
    'por_distancia', coalesce((
      select jsonb_object_agg(d.distancia, d.n) from (
        select distancia, count(*)::int n from public.evp_registrations
        where event_id = ev.id and status = 'confirmada' group by distancia) d), '{}'::jsonb),
    'por_sexo', coalesce((
      select jsonb_object_agg(d.sexo, d.n) from (
        select sexo, count(*)::int n from public.evp_registrations
        where event_id = ev.id and status = 'confirmada' group by sexo) d), '{}'::jsonb),
    'primeira_vez', jsonb_build_object(
      'sim', (select count(*)::int from public.evp_registrations where event_id = ev.id and status = 'confirmada' and primeira_vez),
      'nao', (select count(*)::int from public.evp_registrations where event_id = ev.id and status = 'confirmada' and not primeira_vez)),
    'por_origem', coalesce((
      select jsonb_agg(jsonb_build_object('origem', o.origem, 'visitas', o.visitas, 'inicios_form', o.inicios, 'inscricoes', o.inscricoes)
        order by o.inscricoes desc, o.visitas desc)
      from (
        select coalesce(v.origem, r.origem) as origem,
               coalesce(v.visitas, 0) as visitas, coalesce(v.inicios, 0) as inicios, coalesce(r.n, 0) as inscricoes
        from (select origem, sum(visitas)::int visitas, sum(inicios_form)::int inicios
              from public.evp_page_views where event_id = ev.id group by origem) v
        full join (select origem_fonte as origem, count(*)::int n
              from public.evp_registrations where event_id = ev.id and status <> 'cancelada' group by origem_fonte) r
          on r.origem = v.origem
      ) o), '[]'::jsonb),
    'funil', jsonb_build_object(
      'visitas', v_visitas, 'inicios_form', v_inicios, 'inscricoes', v_inscritas,
      'conversao', case when v_visitas > 0 then round(v_inscritas::numeric * 100 / v_visitas, 1) end),
    'por_dia', coalesce((
      select jsonb_agg(jsonb_build_object('dia', d.dia, 'n', d.n) order by d.dia) from (
        select (created_at at time zone 'America/Sao_Paulo')::date dia, count(*)::int n
        from public.evp_registrations where event_id = ev.id and status <> 'cancelada' group by 1) d), '[]'::jsonb)
  );
end $$;

/** Lista para a tabela do painel. CPF só os dois dígitos finais. */
create or replace function public.evp_admin_participantes(p_slug text) returns jsonb
language sql stable
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'status', r.status, 'codigo', r.codigo, 'nome', r.nome, 'email', r.email,
    'telefone', r.telefone, 'cpf_final', r.cpf_final, 'sexo', r.sexo, 'distancia', r.distancia,
    'primeira_vez', r.primeira_vez, 'aceite_marketing', r.aceite_marketing,
    'origem_fonte', r.origem_fonte, 'created_at', r.created_at,
    'confirmada_em', r.confirmada_em, 'cancelada_em', r.cancelada_em,
    'checkin_em', (select c.feito_em from public.evp_checkins c where c.registration_id = r.id and c.desfeito_em is null),
    'fila_desde', (select w.entrou_em from public.evp_waitlist w where w.registration_id = r.id and w.saiu_em is null)
  ) order by r.created_at desc), '[]'::jsonb)
  from public.evp_registrations r join public.evp_events e on e.id = r.event_id
  where e.slug = p_slug;
$$;

/** Ficha de uma inscrição, com o CPF cifrado (o servidor decifra só para admin). */
create or replace function public.evp_admin_participante(p_slug text, p_id uuid) returns jsonb
language sql stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', r.id, 'status', r.status, 'codigo', r.codigo, 'ticket_token', r.ticket_token,
    'nome', r.nome, 'email', r.email, 'telefone', r.telefone,
    'cpf_cifrado', r.cpf_cifrado, 'cpf_final', r.cpf_final,
    'sexo', r.sexo, 'distancia', r.distancia, 'primeira_vez', r.primeira_vez,
    'aceite_termos_em', r.aceite_termos_em, 'aceite_marketing', r.aceite_marketing,
    'origem', r.origem, 'origem_fonte', r.origem_fonte,
    'created_at', r.created_at, 'confirmada_em', r.confirmada_em,
    'cancelada_em', r.cancelada_em, 'cancelada_motivo', r.cancelada_motivo,
    'checkins', coalesce((
      select jsonb_agg(jsonb_build_object(
        'feito_em', c.feito_em, 'via', c.via, 'operador', s.nome,
        'desfeito_em', c.desfeito_em,
        'desfeito_por', (select d.nome from public.evp_staff d where d.id = c.desfeito_por)) order by c.feito_em desc)
      from public.evp_checkins c join public.evp_staff s on s.id = c.staff_id
      where c.registration_id = r.id), '[]'::jsonb),
    'historico', coalesce((
      select jsonb_agg(jsonb_build_object(
        'acao', a.acao, 'quem', coalesce(a.staff_nome, 'Participante'), 'detalhes', a.detalhes, 'criado_em', a.criado_em)
        order by a.criado_em desc)
      from public.evp_audit_logs a
      where a.alvo_tipo = 'inscricao' and a.alvo_id = r.id::text), '[]'::jsonb)
  )
  from public.evp_registrations r join public.evp_events e on e.id = r.event_id
  where e.slug = p_slug and r.id = p_id;
$$;

/** Edição controlada: só os campos abaixo, e o histórico guarda quais mudaram. */
create or replace function public.evp_admin_editar_participante(p_slug text, p_staff uuid, p_id uuid, p jsonb) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  ev_id uuid;
  r public.evp_registrations;
  mudou text[] := '{}';
begin
  select id into ev_id from public.evp_events where slug = p_slug;
  select * into r from public.evp_registrations where id = p_id and event_id = ev_id for update;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'nao_encontrado'); end if;

  if p ? 'nome' and p->>'nome' is distinct from r.nome then mudou := array_append(mudou, 'nome'); end if;
  if p ? 'email' and p->>'email' is distinct from r.email then mudou := array_append(mudou, 'email'); end if;
  if p ? 'telefone' and p->>'telefone' is distinct from r.telefone then mudou := array_append(mudou, 'telefone'); end if;
  if p ? 'sexo' and p->>'sexo' is distinct from r.sexo then mudou := array_append(mudou, 'sexo'); end if;
  if p ? 'distancia' and p->>'distancia' is distinct from r.distancia then mudou := array_append(mudou, 'distancia'); end if;
  if p ? 'primeira_vez' and (p->>'primeira_vez')::boolean is distinct from r.primeira_vez then mudou := array_append(mudou, 'primeira_vez'); end if;

  if array_length(mudou, 1) is null then return jsonb_build_object('ok', true, 'mudou', '[]'::jsonb); end if;

  update public.evp_registrations set
    nome = coalesce(p->>'nome', nome),
    nome_busca = coalesce(p->>'nome_busca', nome_busca),
    email = coalesce(p->>'email', email),
    telefone = coalesce(p->>'telefone', telefone),
    sexo = coalesce(p->>'sexo', sexo),
    distancia = coalesce(p->>'distancia', distancia),
    primeira_vez = coalesce((p->>'primeira_vez')::boolean, primeira_vez),
    updated_at = now()
  where id = r.id;

  perform public.evp__log(ev_id, p_staff, 'inscricao_editada', 'inscricao', r.id::text,
    jsonb_build_object('campos', to_jsonb(mudou)));
  return jsonb_build_object('ok', true, 'mudou', to_jsonb(mudou));
end $$;

/**
 * Cancela e libera a vaga. Com a promoção automática ligada, o primeiro da
 * fila sobe na mesma transação. p_staff nulo = cancelamento pelo sistema.
 */
create or replace function public.evp_admin_cancelar(p_slug text, p_staff uuid, p_id uuid, p_motivo text) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  ev public.evp_events;
  r public.evp_registrations;
  promovidas jsonb := '[]'::jsonb;
begin
  select * into ev from public.evp_events where slug = p_slug for update;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'sem_evento'); end if;
  select * into r from public.evp_registrations where id = p_id and event_id = ev.id for update;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'nao_encontrado'); end if;
  if r.status = 'cancelada' then return jsonb_build_object('ok', false, 'motivo', 'ja_cancelada'); end if;

  update public.evp_registrations
    set status = 'cancelada', cancelada_em = now(), cancelada_motivo = nullif(trim(p_motivo), ''), updated_at = now()
    where id = r.id;
  update public.evp_waitlist set saiu_em = now(), motivo_saida = 'cancelada'
    where registration_id = r.id and saiu_em is null;
  update public.evp_checkins set desfeito_em = now(), desfeito_por = p_staff
    where registration_id = r.id and desfeito_em is null;

  perform public.evp__log(ev.id, p_staff, 'inscricao_cancelada', 'inscricao', r.id::text,
    jsonb_build_object('era', r.status, 'motivo', nullif(trim(p_motivo), '')));

  if r.status = 'confirmada' and ev.promover_automatico then
    promovidas := public.evp__promover_fila(ev.id, p_staff);
  end if;

  return jsonb_build_object('ok', true, 'promovidas', promovidas, 'vagas', public.evp__situacao(ev));
end $$;

/** Promoção manual: sobe quem estiver na fila enquanto houver vaga. */
create or replace function public.evp_admin_promover_fila(p_slug text, p_staff uuid) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare ev public.evp_events;
begin
  select * into ev from public.evp_events where slug = p_slug for update;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'sem_evento'); end if;
  return jsonb_build_object('ok', true, 'promovidas', public.evp__promover_fila(ev.id, p_staff), 'vagas', public.evp__situacao(ev));
end $$;

create or replace function public.evp_admin_evento(p_slug text) returns jsonb
language plpgsql stable
set search_path = public, pg_temp
as $$
declare ev public.evp_events;
begin
  select * into ev from public.evp_events where slug = p_slug;
  if not found then return null; end if;
  return to_jsonb(ev) || jsonb_build_object(
    'vagas', public.evp__situacao(ev),
    'programacao', coalesce((
      select jsonb_agg(jsonb_build_object('titulo', s.titulo, 'descricao', s.descricao, 'horario', s.horario) order by s.ordem)
      from public.evp_schedule s where s.event_id = ev.id), '[]'::jsonb),
    'profissionais', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nome', p.nome, 'funcao', p.funcao, 'descricao', p.descricao,
        'especialidade', p.especialidade, 'foto_url', p.foto_url, 'organizacao', p.organizacao) order by p.ordem)
      from public.evp_speakers p where p.event_id = ev.id), '[]'::jsonb),
    'percursos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'distancia', r.distancia, 'status', r.status, 'comprimento_m', r.comprimento_m, 'pontos', r.pontos,
        'arquivo_nome', r.arquivo_nome, 'formato', r.formato, 'fonte', r.fonte, 'relatorio', r.relatorio,
        'enviado_em', r.enviado_em, 'publicado_em', r.publicado_em, 'coordenadas', r.coordenadas))
      from public.evp_routes r where r.event_id = ev.id), '[]'::jsonb)
  );
end $$;

/**
 * Salva a configuração. Só mexe nas chaves presentes em p. Abrir inscrições
 * exige data, local, endereço, capacidade e valor definidos: é a trava que
 * impede publicar inscrição sem condição operacional.
 */
create or replace function public.evp_admin_salvar_evento(p_slug text, p_staff uuid, p jsonb) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  ev public.evp_events;
  novo public.evp_events;
  faltam text[] := '{}';
  item jsonb;
  i int;
  promovidas jsonb := '[]'::jsonb;
begin
  select * into ev from public.evp_events where slug = p_slug for update;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'sem_evento'); end if;

  novo := ev;
  if p ? 'nome' then novo.nome := coalesce(nullif(trim(p->>'nome'), ''), ev.nome); end if;
  if p ? 'descricao' then novo.descricao := nullif(trim(p->>'descricao'), ''); end if;
  if p ? 'starts_at' then novo.starts_at := nullif(p->>'starts_at', '')::timestamptz; end if;
  if p ? 'ends_at' then novo.ends_at := nullif(p->>'ends_at', '')::timestamptz; end if;
  if p ? 'local_nome' then novo.local_nome := nullif(trim(p->>'local_nome'), ''); end if;
  if p ? 'endereco' then novo.endereco := nullif(trim(p->>'endereco'), ''); end if;
  if p ? 'lat' then novo.lat := nullif(p->>'lat', '')::double precision; end if;
  if p ? 'lng' then novo.lng := nullif(p->>'lng', '')::double precision; end if;
  if p ? 'orientacoes_chegada' then novo.orientacoes_chegada := nullif(trim(p->>'orientacoes_chegada'), ''); end if;
  if p ? 'info_participacao' then novo.info_participacao := nullif(trim(p->>'info_participacao'), ''); end if;
  if p ? 'capacidade' then novo.capacidade := nullif(p->>'capacidade', '')::int; end if;
  if p ? 'valor_centavos' then novo.valor_centavos := nullif(p->>'valor_centavos', '')::int; end if;
  if p ? 'inscricoes_status' then novo.inscricoes_status := p->>'inscricoes_status'; end if;
  if p ? 'ao_lotar' then novo.ao_lotar := p->>'ao_lotar'; end if;
  if p ? 'promover_automatico' then novo.promover_automatico := (p->>'promover_automatico')::boolean; end if;
  if p ? 'conteudo' then novo.conteudo := coalesce(p->'conteudo', '{}'::jsonb); end if;
  if p ? 'contato' then novo.contato := coalesce(p->'contato', '{}'::jsonb); end if;

  if novo.ends_at is not null and novo.starts_at is not null and novo.ends_at <= novo.starts_at then
    return jsonb_build_object('ok', false, 'motivo', 'fim_antes_do_inicio');
  end if;
  if (novo.lat is null) <> (novo.lng is null) then
    return jsonb_build_object('ok', false, 'motivo', 'coordenadas_incompletas');
  end if;
  if novo.capacidade is not null and novo.capacidade < public.evp__confirmadas(ev.id) then
    return jsonb_build_object('ok', false, 'motivo', 'capacidade_menor', 'confirmadas', public.evp__confirmadas(ev.id));
  end if;

  if novo.inscricoes_status = 'aberta' then
    if novo.starts_at is null then faltam := array_append(faltam, 'data e horário'); end if;
    if novo.local_nome is null then faltam := array_append(faltam, 'local'); end if;
    if novo.endereco is null then faltam := array_append(faltam, 'endereço'); end if;
    if novo.capacidade is null or novo.capacidade = 0 then faltam := array_append(faltam, 'capacidade'); end if;
    if novo.valor_centavos is null then faltam := array_append(faltam, 'valor da inscrição'); end if;
    if array_length(faltam, 1) is not null then
      return jsonb_build_object('ok', false, 'motivo', 'faltam', 'faltam', to_jsonb(faltam));
    end if;
  end if;

  update public.evp_events set
    nome = novo.nome, descricao = novo.descricao, starts_at = novo.starts_at, ends_at = novo.ends_at,
    local_nome = novo.local_nome, endereco = novo.endereco, lat = novo.lat, lng = novo.lng,
    orientacoes_chegada = novo.orientacoes_chegada, info_participacao = novo.info_participacao,
    capacidade = novo.capacidade, valor_centavos = novo.valor_centavos,
    inscricoes_status = novo.inscricoes_status, ao_lotar = novo.ao_lotar,
    promover_automatico = novo.promover_automatico, conteudo = novo.conteudo, contato = novo.contato,
    updated_at = now()
  where id = ev.id;

  if p ? 'programacao' then
    delete from public.evp_schedule where event_id = ev.id;
    i := 0;
    for item in select * from jsonb_array_elements(coalesce(p->'programacao', '[]'::jsonb)) loop
      if nullif(trim(item->>'titulo'), '') is not null then
        i := i + 1;
        insert into public.evp_schedule (event_id, ordem, titulo, descricao, horario)
        values (ev.id, i, trim(item->>'titulo'), nullif(trim(item->>'descricao'), ''), nullif(trim(item->>'horario'), ''));
      end if;
    end loop;
  end if;

  if p ? 'profissionais' then
    delete from public.evp_speakers where event_id = ev.id;
    i := 0;
    for item in select * from jsonb_array_elements(coalesce(p->'profissionais', '[]'::jsonb)) loop
      if nullif(trim(item->>'nome'), '') is not null then
        i := i + 1;
        insert into public.evp_speakers (event_id, ordem, nome, funcao, descricao, especialidade, foto_url, organizacao)
        values (ev.id, i, trim(item->>'nome'), nullif(trim(item->>'funcao'), ''), nullif(trim(item->>'descricao'), ''),
          nullif(trim(item->>'especialidade'), ''), nullif(trim(item->>'foto_url'), ''),
          case when item->>'organizacao' = 'somma' then 'somma' else 'bora' end);
      end if;
    end loop;
  end if;

  perform public.evp__log(ev.id, p_staff, 'evento_editado', 'evento', ev.id::text,
    jsonb_build_object('campos', (select coalesce(jsonb_agg(k), '[]'::jsonb) from jsonb_object_keys(p) k),
      'inscricoes_status', novo.inscricoes_status, 'capacidade', novo.capacidade));

  -- Capacidade maior ou promoção recém-ligada: a fila anda.
  if novo.promover_automatico and novo.inscricoes_status <> 'em_breve' then
    promovidas := public.evp__promover_fila(ev.id, p_staff);
  end if;

  select * into ev from public.evp_events where id = ev.id;
  return jsonb_build_object('ok', true, 'promovidas', promovidas, 'vagas', public.evp__situacao(ev));
end $$;

/** Percurso enviado entra em validação. Publicar é um segundo passo, consciente. */
create or replace function public.evp_admin_percurso_salvar(p_slug text, p_staff uuid, p_distancia text, p jsonb) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare ev_id uuid;
begin
  select id into ev_id from public.evp_events where slug = p_slug;
  if ev_id is null then return jsonb_build_object('ok', false, 'motivo', 'sem_evento'); end if;
  insert into public.evp_routes (event_id, distancia, status, coordenadas, comprimento_m, pontos,
    arquivo_nome, formato, fonte, relatorio, enviado_por, enviado_em, publicado_por, publicado_em)
  values (ev_id, p_distancia, 'em_validacao', p->'coordenadas', (p->>'comprimento_m')::int, (p->>'pontos')::int,
    p->>'arquivo_nome', p->>'formato', nullif(trim(p->>'fonte'), ''), coalesce(p->'relatorio', '{}'::jsonb),
    p_staff, now(), null, null)
  on conflict (event_id, distancia) do update set
    status = 'em_validacao', coordenadas = excluded.coordenadas, comprimento_m = excluded.comprimento_m,
    pontos = excluded.pontos, arquivo_nome = excluded.arquivo_nome, formato = excluded.formato,
    fonte = excluded.fonte, relatorio = excluded.relatorio, enviado_por = excluded.enviado_por,
    enviado_em = now(), publicado_por = null, publicado_em = null;
  perform public.evp__log(ev_id, p_staff, 'percurso_enviado', 'percurso', p_distancia,
    jsonb_build_object('arquivo', p->>'arquivo_nome', 'comprimento_m', p->>'comprimento_m'));
  return jsonb_build_object('ok', true);
end $$;

/** p_acao: 'publicar' | 'despublicar' | 'remover'. */
create or replace function public.evp_admin_percurso_acao(p_slug text, p_staff uuid, p_distancia text, p_acao text) returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare ev_id uuid;
begin
  select id into ev_id from public.evp_events where slug = p_slug;
  if ev_id is null then return jsonb_build_object('ok', false, 'motivo', 'sem_evento'); end if;
  if not exists (select 1 from public.evp_routes where event_id = ev_id and distancia = p_distancia) then
    return jsonb_build_object('ok', false, 'motivo', 'nao_encontrado');
  end if;
  if p_acao = 'publicar' then
    update public.evp_routes set status = 'publicado', publicado_por = p_staff, publicado_em = now()
      where event_id = ev_id and distancia = p_distancia;
  elsif p_acao = 'despublicar' then
    update public.evp_routes set status = 'em_validacao', publicado_por = null, publicado_em = null
      where event_id = ev_id and distancia = p_distancia;
  elsif p_acao = 'remover' then
    delete from public.evp_routes where event_id = ev_id and distancia = p_distancia;
  else
    return jsonb_build_object('ok', false, 'motivo', 'acao_invalida');
  end if;
  perform public.evp__log(ev_id, p_staff, 'percurso_' || p_acao, 'percurso', p_distancia, '{}'::jsonb);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.evp_admin_auditoria(p_slug text, p_limite int) returns jsonb
language sql stable
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(l.linha order by l.criado_em desc, l.id desc), '[]'::jsonb) from (
    select a.criado_em, a.id, jsonb_build_object(
      'id', a.id, 'acao', a.acao, 'quem', coalesce(a.staff_nome, 'Sistema'),
      'alvo_tipo', a.alvo_tipo, 'alvo_id', a.alvo_id, 'detalhes', a.detalhes, 'criado_em', a.criado_em,
      'alvo_nome', case when a.alvo_tipo = 'inscricao' and a.alvo_id is not null then
        (select r.nome from public.evp_registrations r where r.id::text = a.alvo_id) end
    ) as linha
    from public.evp_audit_logs a join public.evp_events e on e.id = a.event_id
    where e.slug = p_slug
    order by a.criado_em desc, a.id desc
    limit least(greatest(coalesce(p_limite, 100), 1), 500)
  ) l;
$$;

/** Registro vindo do servidor do site: exportação, CPF revelado, reenvio de e-mail. */
create or replace function public.evp_admin_log(
  p_slug text, p_staff uuid, p_acao text, p_alvo_tipo text, p_alvo_id text, p_detalhes jsonb
) returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare ev_id uuid;
begin
  select id into ev_id from public.evp_events where slug = p_slug;
  if ev_id is null then return; end if;
  perform public.evp__log(ev_id, p_staff, p_acao, p_alvo_tipo, p_alvo_id, p_detalhes);
end $$;

-- ─── Segurança ──────────────────────────────────────────────────────────────

alter table public.evp_events enable row level security;
alter table public.evp_registrations enable row level security;
alter table public.evp_waitlist enable row level security;
alter table public.evp_checkins enable row level security;
alter table public.evp_staff enable row level security;
alter table public.evp_schedule enable row level security;
alter table public.evp_speakers enable row level security;
alter table public.evp_routes enable row level security;
alter table public.evp_audit_logs enable row level security;
alter table public.evp_page_views enable row level security;

revoke all on
  public.evp_events, public.evp_registrations, public.evp_waitlist, public.evp_checkins,
  public.evp_staff, public.evp_schedule, public.evp_speakers, public.evp_routes,
  public.evp_audit_logs, public.evp_page_views
from public, anon, authenticated;

grant all on
  public.evp_events, public.evp_registrations, public.evp_waitlist, public.evp_checkins,
  public.evp_staff, public.evp_schedule, public.evp_speakers, public.evp_routes,
  public.evp_audit_logs, public.evp_page_views
to service_role;

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as assinatura
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'evp\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.assinatura);
    execute format('grant execute on function %s to service_role', f.assinatura);
  end loop;
end $$;

-- Imagens da página (foto dos profissionais, imagem da hero). Público para
-- leitura; só a service role grava. Fora do Supabase (teste local) não há
-- schema storage, então o bloco se pula sozinho.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('evp-midia', 'evp-midia', true, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;
  end if;
end $$;

-- ─── Primeiro evento ────────────────────────────────────────────────────────
-- Data, horário, local, capacidade e valor ficam vazios de propósito: quem
-- define é o operador, no painel. Inscrições nascem em "em breve".

insert into public.evp_events (slug, nome, descricao)
values (
  'maratonamonumental2026',
  'Meeting Técnico | Maratona Monumental de Brasília 2026',
  'Encontro presencial de orientação e preparação para a Maratona Monumental de Brasília 2026, com os treinadores da BORA Assessoria e o SOMMA Club.'
)
on conflict (slug) do nothing;

insert into public.evp_schedule (event_id, ordem, titulo, descricao)
select e.id, m.ordem, m.titulo, m.descricao
from public.evp_events e
cross join (values
  (1, 'Recepção e credenciamento', 'Chegue, apresente o QR Code do seu ingresso e escolha o seu lugar.'),
  (2, 'SOMMA Club e BORA Assessoria', 'Quem recebe você e por que esse encontro existe.'),
  (3, 'Visão geral da Maratona Monumental', 'Datas, largadas, pelotões e o que muda de uma distância para a outra.'),
  (4, 'Análise dos percursos', 'O trajeto de cada distância e os trechos que pedem atenção.'),
  (5, 'Estratégias de corrida', 'Ritmo, hidratação, alimentação e as orientações técnicas dos treinadores.'),
  (6, 'Perguntas, respostas e encerramento', 'Espaço aberto para tirar dúvidas direto com quem vai apresentar.')
) as m (ordem, titulo, descricao)
where e.slug = 'maratonamonumental2026'
  and not exists (select 1 from public.evp_schedule s where s.event_id = e.id);
