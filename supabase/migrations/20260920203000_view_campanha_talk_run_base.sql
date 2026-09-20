-- ─────────────────────────────────────────────────────────────────────────────
-- Base da Talk Run 2026 para o módulo de E-mail Marketing do admin de gestão
-- (admin.sommaclub.com.br). Registrada lá como AUDIENCE_SOURCES.talk_run.
--
-- Mesmo papel de `campanha_swr_base` (migration 20260827103000), com uma
-- diferença: a fonte NÃO é `campanha_contatos`, é `cadastro_site` + `checkins`
-- lidas ao vivo. A régua da Talk Run tem sete envios em sete dias, e uma base
-- fotografada no primeiro dia deixaria de fora quem se cadastrou no meio da
-- semana. Lendo ao vivo, cada envio pega a base do seu próprio horário.
--
-- O que a view garante por construção:
--
--   1. SEM DUPLICADOS. Uma linha por e-mail (minúsculo, sem espaços). Quem está
--      nas duas tabelas fica como `cadastro-site`, a mesma precedência de
--      `sincronizarBaseGenerica` no site. O admin deduplica de novo no disparo;
--      aqui é para a contagem da tela já ser a verdadeira.
--
--   2. DESCADASTRO DO SITE. Tira quem está em `descadastros_globais`, lista que
--      o admin não conhece (ele só filtra `email_suppressions`). Em 20/09/2026
--      eram 68 pessoas só na lista do site. Isso é LGPD, não preferência.
--
--   3. PRIMEIRO NOME. `nome` é só o primeiro nome, com inicial maiúscula: o
--      HTML usa `Oi, {{nome}}.` e "Oi, Maria." lê melhor que o nome completo.
--
-- `security_invoker`: roda com os privilégios de quem consulta, então a RLS
-- das tabelas de origem continua valendo. Só o service_role lê.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view public.campanha_talk_run_base
with (security_invoker = true)
as
with origem as (
  select lower(trim(email)) as email, nome_completo, 'cadastro-site'::text as segmento, 1 as prioridade
  from public.cadastro_site
  where email is not null and trim(email) <> ''
  union all
  select lower(trim(email)), nome_completo, 'checkins'::text, 2
  from public.checkins
  where email is not null and trim(email) <> ''
),
unicos as (
  select distinct on (email) email, nome_completo, segmento
  from origem
  order by email, prioridade, (nome_completo is null)
)
select
  u.email,
  nullif(initcap(split_part(trim(coalesce(u.nome_completo, '')), ' ', 1)), '') as nome,
  u.segmento
from unicos u
where not exists (
  select 1 from public.descadastros_globais d where lower(trim(d.email)) = u.email
);

comment on view public.campanha_talk_run_base is
  'Base da Talk Run 2026: cadastro_site + checkins ao vivo, sem duplicados e sem descadastrados do site. Consumida pelo admin de gestão (AUDIENCE_SOURCES.talk_run).';

revoke all on public.campanha_talk_run_base from anon, authenticated;
grant select on public.campanha_talk_run_base to service_role;
