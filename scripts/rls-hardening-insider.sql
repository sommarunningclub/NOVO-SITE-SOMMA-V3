-- ─────────────────────────────────────────────────────────────────────────────
-- RLS HARDENING (INSIDER) — Somma (projeto Supabase riqfjewvygqsbuokvsjw)
-- Complementa o scripts/rls-hardening.sql, fechando as tabelas do subsistema
-- /insider-conect que HOJE estão legíveis pela ANON KEY (pública):
--
--   dados_insiders          → CPF + nome dos insiders  (VAZAMENTO CRÍTICO: a
--                             ANON lê os CPFs que servem de "senha" do login)
--   sorteios                → registros de sorteio (audit_hash, filtros)
--   sorteio_ganhadores      → ganhadores (checkin_id, status)
--   transferencias          → log de transferências (CPF/e-mail origem/destino)
--   leads_shakeout_centauro → PII de leads (CPF, e-mail, telefone)
--
-- Princípio (idêntico ao hardening principal): `service_role` SEMPRE ignora RLS.
-- TODAS as rotas do /insider-conect usam getServiceSupabase() (service-role),
-- então continuam funcionando. Nenhuma dessas tabelas é lida via anon no site
-- público (verificado no código) → todas ficam SEM acesso anon (insert/select).
--
-- ⚠️ Idempotente: pode reexecutar. Rode no SQL Editor do Supabase (service-role).
-- ─────────────────────────────────────────────────────────────────────────────

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

  -- 2) Habilita RLS (sem policy = ninguém via anon/authenticated; service_role ignora)
  execute format('alter table public.%I enable row level security', tbl);
  execute format('alter table public.%I force row level security', tbl);

  -- 3) Recria apenas as permissões mínimas p/ ANON (nenhuma, neste script)
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

  -- 4) Revoga grants de tabela da anon/authenticated (defesa em profundidade:
  --    além do RLS, tira o privilégio de SELECT/INSERT/UPDATE/DELETE)
  execute format('revoke all on public.%I from anon', tbl);
  execute format('revoke all on public.%I from authenticated', tbl);
end;
$$ language plpgsql;

-- ── Tabelas do insider → SEM acesso anon (tudo via service-role) ────────────
select public._rls_apply('dados_insiders',          false, false);
select public._rls_apply('sorteios',                false, false);
select public._rls_apply('sorteio_ganhadores',      false, false);
select public._rls_apply('transferencias',          false, false);
select public._rls_apply('leads_shakeout_centauro', false, false);

-- Limpa o helper
drop function public._rls_apply(text, boolean, boolean);

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO — rode DEPOIS, com a ANON KEY (não no SQL Editor, que é service-role):
--
--   for t in dados_insiders sorteios sorteio_ganhadores transferencias \
--            leads_shakeout_centauro; do
--     curl -s -o /dev/null -w "$t -> HTTP %{http_code}\n" \
--       "https://riqfjewvygqsbuokvsjw.supabase.co/rest/v1/$t?select=id&limit=1" \
--       -H "apikey: <ANON_KEY>"
--   done
--
-- Esperado: HTTP 200 com corpo "[]" (RLS bloqueia linhas) ou 401/permission denied.
-- ANTES deste script os mesmos curls retornavam linhas reais (id preenchido).
-- ─────────────────────────────────────────────────────────────────────────────
