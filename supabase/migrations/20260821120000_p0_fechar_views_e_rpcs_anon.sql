-- ─────────────────────────────────────────────────────────────────────────────
-- P0.5 — Fecha views e funções SECURITY DEFINER que a ANON KEY alcançava
-- Projeto: sommarunning_2026 (riqfjewvygqsbuokvsjw)
--
-- O problema: views criadas com SECURITY DEFINER rodam com os privilégios do
-- dono, então RLS das tabelas por trás não vale nada; com GRANT para `anon`,
-- qualquer pessoa com a chave pública (que vai no HTML do site) lia o
-- conteúdo. `vw_payments_summary` é o caso grave: totais financeiros reais.
--
-- Nenhuma dessas views nem dessas funções é usada pelo site com a anon key
-- (conferido no código: o cliente anônimo só lê `professores_curriculo_assessoria`
-- e as tabelas do popup e do Wings). Todo o resto do app usa service_role, que
-- ignora RLS e não perde nada com estes REVOKE.
--
-- Idempotente: pode reexecutar. Rode no SQL Editor do Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Views ────────────────────────────────────────────────────────────────
-- Tira o acesso da anon/authenticated. As views continuam existindo e
-- continuam funcionando para service_role e para o painel do Supabase.
do $$
declare
  v text;
  alvos text[] := array[
    'vw_payments_summary',
    'vw_last_syncs',
    'contest_public_participants',
    'contest_public_leaderboard',
    'dst_grade'
  ];
begin
  foreach v in array alvos loop
    if to_regclass('public.' || quote_ident(v)) is null then
      raise notice 'view public.% não existe — ignorada', v;
      continue;
    end if;
    execute format('revoke all on table public.%I from anon', v);
    execute format('revoke all on table public.%I from authenticated', v);
    raise notice 'revogado anon/authenticated em public.%', v;
  end loop;
end $$;

-- Se um dia alguma das `contest_*` precisar voltar a ser pública, o caminho é
-- este — e só ele. `security_invoker` faz a view respeitar o RLS de quem
-- consulta, e o GRANT é de SELECT, nunca de escrita:
--
--   alter view public.contest_public_leaderboard set (security_invoker = true);
--   grant select on table public.contest_public_leaderboard to anon;

-- ─── 2. Funções (RPC) ────────────────────────────────────────────────────────
-- As assinaturas são descobertas em pg_proc: evita errar o tipo de um
-- argumento e revogar de uma sobrecarga que não existe.
do $$
declare r record;
begin
  for r in
    select n.nspname as schema_name,
           p.proname  as func_name,
           pg_get_function_identity_arguments(p.oid) as args
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where (n.nspname = 'public' and p.proname in (
              'decrement_stock',
              'dst_espelhar_em_checkins',
              'dst_sincronizar_do_checkin',
              'inscrever_atleta'
            ))
        or (n.nspname = 'mafood' and p.proname in ('has_role', 'owns_pdv'))
  loop
    execute format(
      'revoke all on function %I.%I(%s) from anon',
      r.schema_name, r.func_name, r.args
    );
    execute format(
      'revoke all on function %I.%I(%s) from authenticated',
      r.schema_name, r.func_name, r.args
    );
    raise notice 'revogado anon/authenticated em %.%(%)', r.schema_name, r.func_name, r.args;
  end loop;
end $$;

-- `dst_espelhar_em_checkins` e `dst_sincronizar_do_checkin` são funções de
-- TRIGGER: o Postgres não checa privilégio de EXECUTE ao disparar um trigger,
-- então os triggers do Desafio das Esteiras continuam funcionando. O REVOKE
-- só fecha a chamada direta via `/rest/v1/rpc/...`.

-- ─── 3. Nada de PUBLIC nas funções fechadas ──────────────────────────────────
-- O Postgres concede EXECUTE a PUBLIC por padrão em toda função nova. Sem
-- tirar isso, o REVOKE acima não adianta: anon herda de PUBLIC.
do $$
declare r record;
begin
  for r in
    select n.nspname as schema_name,
           p.proname  as func_name,
           pg_get_function_identity_arguments(p.oid) as args
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where (n.nspname = 'public' and p.proname in (
              'decrement_stock',
              'dst_espelhar_em_checkins',
              'dst_sincronizar_do_checkin',
              'inscrever_atleta'
            ))
        or (n.nspname = 'mafood' and p.proname in ('has_role', 'owns_pdv'))
  loop
    execute format(
      'revoke all on function %I.%I(%s) from public',
      r.schema_name, r.func_name, r.args
    );
  end loop;
end $$;
