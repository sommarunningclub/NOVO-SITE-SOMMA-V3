-- ─────────────────────────────────────────────────────────────────────────────
-- P1.6 — Estado `enviando` em campanha_etapas (reserva atômica do disparo)
-- Projeto: sommarunning_2026 (riqfjewvygqsbuokvsjw)
--
-- O disparo levava até 5 minutos entre "conferi que ninguém enviou" e "marquei
-- como enviado". Dentro dessa janela, dois cliques no botão ou um retry do cron
-- passavam os dois pela conferência e a base recebia o mesmo e-mail duas vezes.
--
-- `lib/campanhas/claim.ts` fecha a janela reservando a etapa com uma escrita
-- atômica antes de enviar. O estado dessa reserva é `enviando`, que o CHECK
-- original não previa — sem esta migration, todo disparo passa a falhar com
-- violação de constraint.
--
-- ⚠️ APLIQUE ANTES do deploy do código.
-- Idempotente: pode reexecutar.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.campanha_etapas
  drop constraint if exists campanha_etapas_status_check;

alter table public.campanha_etapas
  add constraint campanha_etapas_status_check
  check (status in ('rascunho', 'agendado', 'enviando', 'enviado', 'cancelado'));

-- Uma etapa que ficou presa em `enviando` (função morta no meio, deploy no
-- meio do disparo) volta ao rascunho para o operador poder tentar de novo:
--
--   update public.campanha_etapas set status = 'rascunho'
--    where status = 'enviando' and campanha = '<campanha>' and etapa = <n>;
