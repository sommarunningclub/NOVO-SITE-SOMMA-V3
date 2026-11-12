-- Meeting Técnico: inscrição começando pelo CPF e perfil de quem se inscreve.
--
-- O formulário passa a perguntar o CPF primeiro e a reaproveitar o cadastro do
-- clube (cadastro_site). Entram três informações novas por inscrição:
--   * se a pessoa já estava na base do SOMMA quando se inscreveu (ja_membro);
--   * se ela já é de alguma assessoria, e qual (tem_assessoria, assessoria_nome);
--   * se vai correr a Monumental ou só quer participar do encontro: quem não vai
--     correr fica com distancia = 'nao_corre'.
--
-- Depende de 20261111190000_evp_plataforma_eventos.sql. Pode reexecutar.

alter table public.evp_registrations
  add column if not exists tem_assessoria boolean not null default false,
  add column if not exists assessoria_nome text,
  add column if not exists ja_membro boolean not null default false;

alter table public.evp_registrations drop constraint if exists evp_registrations_distancia_check;
alter table public.evp_registrations add constraint evp_registrations_distancia_check
  check (distancia in ('5k', '10k', '21k', '42k', '5k+21k', '10k+21k', '5k+42k', '10k+42k', 'nao_corre'));

/** Inscrição, agora com assessoria, base do SOMMA e a opção de não correr. */
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
    tem_assessoria, assessoria_nome, ja_membro,
    aceite_termos_em, aceite_marketing, origem, origem_fonte, idempotency_key, confirmada_em
  ) values (
    ev.id, novo_status, p->>'codigo', p->>'ticket_token', p->>'qr_token',
    p->>'nome', p->>'nome_busca', p->>'email', p->>'telefone',
    p->>'cpf_cifrado', p->>'cpf_hmac', p->>'cpf_final', p->>'sexo', p->>'distancia',
    coalesce((p->>'primeira_vez')::boolean, false),
    coalesce((p->>'tem_assessoria')::boolean, false), nullif(trim(p->>'assessoria_nome'), ''),
    coalesce((p->>'ja_membro')::boolean, false),
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

/** Lista para a tabela do painel. CPF só os dois dígitos finais. */
create or replace function public.evp_admin_participantes(p_slug text) returns jsonb
language sql stable
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'status', r.status, 'codigo', r.codigo, 'nome', r.nome, 'email', r.email,
    'telefone', r.telefone, 'cpf_final', r.cpf_final, 'sexo', r.sexo, 'distancia', r.distancia,
    'primeira_vez', r.primeira_vez, 'aceite_marketing', r.aceite_marketing,
    'tem_assessoria', r.tem_assessoria, 'assessoria_nome', r.assessoria_nome, 'ja_membro', r.ja_membro,
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
    'tem_assessoria', r.tem_assessoria, 'assessoria_nome', r.assessoria_nome, 'ja_membro', r.ja_membro,
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
    -- Primeira vez só faz sentido para quem vai correr.
    'primeira_vez', jsonb_build_object(
      'sim', (select count(*)::int from public.evp_registrations where event_id = ev.id and status = 'confirmada' and distancia <> 'nao_corre' and primeira_vez),
      'nao', (select count(*)::int from public.evp_registrations where event_id = ev.id and status = 'confirmada' and distancia <> 'nao_corre' and not primeira_vez)),
    'vai_correr', jsonb_build_object(
      'sim', (select count(*)::int from public.evp_registrations where event_id = ev.id and status = 'confirmada' and distancia <> 'nao_corre'),
      'nao', (select count(*)::int from public.evp_registrations where event_id = ev.id and status = 'confirmada' and distancia = 'nao_corre')),
    'assessoria', jsonb_build_object(
      'sim', (select count(*)::int from public.evp_registrations where event_id = ev.id and status = 'confirmada' and tem_assessoria),
      'nao', (select count(*)::int from public.evp_registrations where event_id = ev.id and status = 'confirmada' and not tem_assessoria)),
    'base_somma', jsonb_build_object(
      'sim', (select count(*)::int from public.evp_registrations where event_id = ev.id and status = 'confirmada' and ja_membro),
      'nao', (select count(*)::int from public.evp_registrations where event_id = ev.id and status = 'confirmada' and not ja_membro)),
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

-- As funções recriadas mantêm a mesma assinatura, então as permissões da
-- primeira migration continuam valendo. O bloco abaixo só garante isso.
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
