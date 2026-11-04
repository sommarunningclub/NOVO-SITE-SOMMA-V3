-- ─────────────────────────────────────────────────────────────────────────────
-- Maratona do Rio 2027: inscrição da Meia Maratona pela assessoria (2º lote)
-- Projeto: sommarunning_2026 (riqfjewvygqsbuokvsjw)
-- Rota pública: sommaclub.com.br/assessoria/maratona-rio-2027-garanta-sua-vaga
--
-- Diferente de `maratona_rio_2027_intencoes` (só intenção): aqui a pessoa
-- reserva uma das vagas do lote e paga por Pix à BORA. A equipe confere o
-- pagamento e marca como pago no painel.
--
-- Vagas: `maratona_rio_2027_inscrever` conta as inscrições não canceladas sob
-- advisory lock, então dois envios no mesmo instante nunca passam do teto. O
-- teto vem do site (`p_limite`). Cancelar uma inscrição devolve a vaga.
--
-- Uma inscrição por CPF: quem envia de novo atualiza os dados (treinador,
-- estrutura de apoio) sem ocupar outra vaga.
--
-- Sem policy nenhuma: só a service role lê e escreve, sempre server-side.
--
-- Idempotente: pode reexecutar.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.maratona_rio_2027_inscricoes (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  nome text not null,
  email text not null,
  -- Só dígitos, com DDI 55.
  telefone text not null,
  -- Só dígitos.
  cpf text not null unique check (cpf ~ '^\d{11}$'),
  data_nascimento date not null,
  sexo text not null check (sexo in ('feminino', 'masculino')),
  -- Só a meia sem camisa está à venda neste lote.
  prova text not null default '21k_sem_camisa' check (prova in ('21k_sem_camisa')),
  -- Slug do professor BORA (lib/nova-assessoria/professores) ou 'outro'.
  treinador text not null,
  -- Nome digitado quando treinador = 'outro'.
  treinador_outro text,
  -- Quer a estrutura de apoio da BORA no Rio pelo valor promocional.
  estrutura_apoio boolean not null,
  -- Em reais, do momento da inscrição (o preço pode mudar de lote).
  valor_inscricao numeric(10, 2) not null,
  valor_estrutura numeric(10, 2) not null default 0,
  valor_total numeric(10, 2) not null,
  aceite_termo_em timestamptz not null,

  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento', 'pago', 'cancelado')),
  pago_em timestamptz,
  observacao text,

  ip text,
  user_agent text
);

create index if not exists maratona_rio_2027_inscricoes_status_idx
  on public.maratona_rio_2027_inscricoes (status);

alter table public.maratona_rio_2027_inscricoes enable row level security;

comment on table public.maratona_rio_2027_inscricoes is
  'Inscrições da Meia Maratona do Rio 2027 pela assessoria (pagamento por Pix à BORA). Uma por CPF; canceladas devolvem a vaga.';

-- Inscreve (ou atualiza quem já está inscrito) respeitando o teto de vagas.
-- Devolve o resultado e quantas vagas sobram depois da operação.
--   resultado: 'inscrito' | 'atualizado' | 'esgotado'
create or replace function public.maratona_rio_2027_inscrever(
  p_dados jsonb,
  p_limite integer
)
returns table (resultado text, inscricao_id bigint, vagas_restantes integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
  v_status text;
  v_ocupadas integer;
begin
  perform pg_advisory_xact_lock(hashtext('maratona_rio_2027_inscricoes'));

  select i.id, i.status into v_id, v_status
    from public.maratona_rio_2027_inscricoes i
   where i.cpf = p_dados->>'cpf';

  select count(*) into v_ocupadas
    from public.maratona_rio_2027_inscricoes i
   where i.status <> 'cancelado';

  -- Quem já tem vaga só atualiza. Inscrição cancelada que volta precisa de vaga.
  if v_id is not null and v_status <> 'cancelado' then
    update public.maratona_rio_2027_inscricoes i
       set nome = p_dados->>'nome',
           email = p_dados->>'email',
           telefone = p_dados->>'telefone',
           data_nascimento = (p_dados->>'data_nascimento')::date,
           sexo = p_dados->>'sexo',
           treinador = p_dados->>'treinador',
           treinador_outro = nullif(p_dados->>'treinador_outro', ''),
           -- Quem já pagou não perde a estrutura reenviando o formulário.
           estrutura_apoio = case when i.status = 'pago' then i.estrutura_apoio or (p_dados->>'estrutura_apoio')::boolean
                                  else (p_dados->>'estrutura_apoio')::boolean end,
           valor_estrutura = case when i.status = 'pago' and i.estrutura_apoio then i.valor_estrutura
                                  else (p_dados->>'valor_estrutura')::numeric end,
           valor_total = i.valor_inscricao + case when i.status = 'pago' and i.estrutura_apoio then i.valor_estrutura
                                                  else (p_dados->>'valor_estrutura')::numeric end,
           aceite_termo_em = now(),
           ip = p_dados->>'ip',
           user_agent = p_dados->>'user_agent',
           atualizado_em = now()
     where i.id = v_id;
    return query select 'atualizado'::text, v_id, greatest(p_limite - v_ocupadas, 0);
    return;
  end if;

  if v_ocupadas >= p_limite then
    return query select 'esgotado'::text, null::bigint, 0;
    return;
  end if;

  if v_id is not null then
    delete from public.maratona_rio_2027_inscricoes where id = v_id;
  end if;

  insert into public.maratona_rio_2027_inscricoes (
    nome, email, telefone, cpf, data_nascimento, sexo, treinador, treinador_outro,
    estrutura_apoio, valor_inscricao, valor_estrutura, valor_total, aceite_termo_em, ip, user_agent
  ) values (
    p_dados->>'nome', p_dados->>'email', p_dados->>'telefone', p_dados->>'cpf',
    (p_dados->>'data_nascimento')::date, p_dados->>'sexo', p_dados->>'treinador',
    nullif(p_dados->>'treinador_outro', ''), (p_dados->>'estrutura_apoio')::boolean,
    (p_dados->>'valor_inscricao')::numeric, (p_dados->>'valor_estrutura')::numeric,
    (p_dados->>'valor_inscricao')::numeric + (p_dados->>'valor_estrutura')::numeric,
    now(), p_dados->>'ip', p_dados->>'user_agent'
  )
  returning id into v_id;

  return query select 'inscrito'::text, v_id, greatest(p_limite - v_ocupadas - 1, 0);
end;
$$;

revoke all on function public.maratona_rio_2027_inscrever(jsonb, integer) from public, anon, authenticated;
grant execute on function public.maratona_rio_2027_inscrever(jsonb, integer) to service_role;
