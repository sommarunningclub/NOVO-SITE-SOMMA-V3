-- ─────────────────────────────────────────────────────────────────────────────
-- P2.5 — Avisos restantes do Advisor do Supabase
-- Projeto: sommarunning_2026 (riqfjewvygqsbuokvsjw)
--
-- Idempotente: pode reexecutar. Rode no SQL Editor do Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. search_path fixo nas funções SECURITY DEFINER ────────────────────────
-- Função SECURITY DEFINER roda com os privilégios do dono. Se o `search_path`
-- for o de quem chama, quem chama escolhe qual `now()`, qual `crypt()`, qual
-- tabela a função vai usar — basta criar um objeto de mesmo nome num schema que
-- venha antes. Fixar o caminho tira essa escolha das mãos do chamador.
--
-- Escopo deliberadamente estreito: SÓ os schemas da aplicação. `auth`,
-- `storage`, `realtime`, `vault`, `graphql` e `extensions` são do Supabase e de
-- extensões — mexer no search_path de uma função de lá é alterar infraestrutura
-- que não é nossa, e o mais provável é derrubar login ou storage. Funções que
-- pertencem a uma extensão também ficam de fora, pelo mesmo motivo.
--
-- Só mexe em quem ainda não tem `search_path` declarado, para não sobrescrever
-- ajuste feito à mão em função que já foi tratada.
do $$
declare
  r record;
  caminho text;
begin
  for r in
    select p.oid,
           n.nspname as schema_name,
           p.proname as func_name,
           pg_get_function_identity_arguments(p.oid) as args
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where p.prosecdef                                   -- SECURITY DEFINER
       and n.nspname in ('public', 'mafood')
       and not exists (
             select 1 from unnest(coalesce(p.proconfig, '{}')) cfg
              where cfg like 'search_path=%'
           )
       and not exists (                                  -- não é de extensão
             select 1 from pg_depend d
              where d.objid = p.oid
                and d.classid = 'pg_proc'::regclass
                and d.deptype = 'e'
           )
  loop
    -- `extensions` entra no caminho porque pgcrypto (crypt/gen_salt) e pg_trgm
    -- moram lá nos projetos Supabase; `pg_temp` vai por último, sempre.
    caminho := format('%I, extensions, pg_temp', r.schema_name);
    execute format(
      'alter function %I.%I(%s) set search_path = %s',
      r.schema_name, r.func_name, r.args, caminho
    );
    raise notice 'search_path fixado em %.%(%)', r.schema_name, r.func_name, r.args;
  end loop;
end $$;

-- ─── 2. Proteção contra senha vazada (Auth) ──────────────────────────────────
-- Não tem SQL: é chave de configuração do GoTrue, ligada no painel.
--   Dashboard → Authentication → Policies → Password protection
--   → "Prevent use of leaked passwords" (checagem contra HaveIBeenPwned).
-- Vale a pena mesmo com o site usando pouco o Auth nativo: custa um clique.

-- ─── 3. pg_trgm no schema public (extension_in_public) ───────────────────────
-- NÃO movido de propósito. Índices GIN/GiST criados com `gin_trgm_ops` guardam
-- referência ao operador; mover a extensão exige recriar todos eles, e um
-- índice de busca que some em produção é pior do que o aviso do linter.
--
-- Quando houver janela para fazer isso com calma, o caminho é:
--   1. levantar os índices que dependem de pg_trgm;
--   2. drop desses índices;
--   3. alter extension pg_trgm set schema extensions;
--   4. recriar os índices (com `extensions` no search_path de quem consulta);
--   5. conferir que as buscas por similaridade continuam usando índice.
