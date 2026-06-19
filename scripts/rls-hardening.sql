-- ─────────────────────────────────────────────────────────────────────────────
-- RLS HARDENING — Somma (projeto Supabase riqfjewvygqsbuokvsjw)
-- Objetivo: fechar o vazamento em que a ANON KEY (pública) lê PII/financeiro:
--   cadastro_site (5.879), checkins (5.525), payments (292),
--   gestao-clientes-assessoria (47), professor_clients (65).
--
-- Princípio: `service_role` SEMPRE ignora RLS — todas as rotas server-side que
-- usam service-role (webhook, /api/eventos, /api/checkin, professores/clientes,
-- validate-coupon, parq) continuam funcionando. Só restringimos a ANON.
--
-- ⚠️ PRÉ-REQUISITO DE CÓDIGO (importante):
--   - /api/cadastro-site faz um SELECT de dedup por CPF usando a ANON key. Após
--     este hardening, esse SELECT passa a retornar vazio (RLS bloqueia leitura),
--     então a dedup PARA de funcionar (o INSERT continua OK). Para manter a dedup,
--     troque a rota para getServiceSupabase() OU crie um UNIQUE em cadastro_site.cpf.
--   - /api/supabase/cliente apenas INSERE (mantido via policy anon insert abaixo).
--
-- ⚠️ ATENÇÃO PRODUÇÃO: este banco é compartilhado com o site atual e a gestão.
--   Valide que NENHUM cliente (browser) lê essas tabelas via anon antes de aplicar.
--   Rode em horário de baixo tráfego. Idempotente (pode reexecutar).
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: zera as policies da tabela, habilita RLS e cria só o que for permitido p/ anon.
create or replace function public._rls_apply(
  tbl text,
  anon_insert boolean,
  anon_select boolean
) returns void as $$
declare r record;
begin
  -- 1) Remove TODAS as policies existentes (nomes desconhecidos/permissivos)
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = tbl
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, tbl);
  end loop;

  -- 2) Garante RLS habilitado (sem policy = ninguém via anon; service_role ignora)
  execute format('alter table public.%I enable row level security', tbl);

  -- 3) Recria apenas as permissões mínimas para a ANON
  if anon_insert then
    execute format(
      'create policy %I on public.%I for insert to anon with check (true)',
      tbl || '_anon_insert', tbl
    );
  end if;
  if anon_select then
    execute format(
      'create policy %I on public.%I for select to anon using (true)',
      tbl || '_anon_select', tbl
    );
  end if;
end;
$$ language plpgsql;

-- ── Tabelas com PII/financeiro → SEM leitura anon ───────────────────────────
-- Mantêm INSERT anon apenas onde o formulário público grava direto com a anon key.
select public._rls_apply('cadastro_site',               true,  false); -- form home (insert)
select public._rls_apply('gestao-clientes-assessoria',  true,  false); -- /api/supabase/cliente (insert)
select public._rls_apply('checkins',                    false, false); -- insert é via service-role
select public._rls_apply('payments',                    false, false);
select public._rls_apply('professor_clients',           false, false);
select public._rls_apply('asaas_customers_sync',        false, false);
select public._rls_apply('webhook_events',              false, false);
select public._rls_apply('coupons',                     false, false);
select public._rls_apply('coupon_redemptions',          false, false);
select public._rls_apply('commission_config',           false, false);

-- ── Dados públicos NÃO sensíveis → leitura anon permitida ───────────────────
select public._rls_apply('eventos',                          false, true);  -- info de evento (público)
select public._rls_apply('professores_curriculo_assessoria', false, true);  -- checkout lê via anon

-- Limpa o helper
drop function public._rls_apply(text, boolean, boolean);

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO (rode separadamente; deve voltar 0 linhas para anon).
-- No SQL Editor você roda como service-role (vê tudo). Para validar a ANON de verdade,
-- use o REST com a anon key:
--   curl "$URL/rest/v1/cadastro_site?select=id&limit=0" \
--        -H "apikey: <ANON>" -H "Authorization: Bearer <ANON>" \
--        -H "Prefer: count=exact" -I        # deve vir content-range: */0
--
-- Conferir policies resultantes:
--   select tablename, policyname, cmd, roles from pg_policies
--   where schemaname='public'
--     and tablename in ('cadastro_site','payments','checkins',
--       'gestao-clientes-assessoria','professor_clients','asaas_customers_sync',
--       'webhook_events','coupons','eventos','professores_curriculo_assessoria')
--   order by tablename, cmd;
-- ─────────────────────────────────────────────────────────────────────────────
