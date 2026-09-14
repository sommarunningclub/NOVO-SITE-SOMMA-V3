-- ═══════════════════════════════════════════════════════════════════════════
-- NPS da Assessoria: professor informado pelo aluno e edição pelo painel
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 1. `declared_professor`: resposta de "Quem é o seu professor?". A pergunta só
--    aparece quando o link não traz o professor do cadastro (link geral, ou
--    link pessoal de aluno sem professor conhecido). NULL = não foi exibida.
--    O NPS por professor do painel usa `professor_name` (cadastro) e, sem ele,
--    este campo. Professor novo na assessoria: incluir o valor neste CHECK
--    (numa migration nova) e em PROFESSORES, em `lib/assessoria-nps/survey.ts`.
--
-- 2. `updated_by`: e-mail de quem corrigiu nome, sobrenome ou professor da
--    resposta no painel. NULL = nunca editada. `updated_at` já existia.
--
-- Só colunas novas e nulas: respostas antigas continuam válidas, e o código
-- que está no ar antes do deploy segue gravando sem elas.

alter table public.nps_assessoria_responses
  add column if not exists declared_professor text,
  add column if not exists updated_by text;

alter table public.nps_assessoria_responses
  drop constraint if exists nps_assessoria_responses_professor_informado_check;
alter table public.nps_assessoria_responses
  add constraint nps_assessoria_responses_professor_informado_check check (
    declared_professor is null
    or declared_professor in ('alexandre_alves', 'joseph_pereira', 'mateus_fonseca', 'unknown')
  );

comment on column public.nps_assessoria_responses.declared_professor is
  'Resposta de "Quem é o seu professor?" (unknown = Não sei). NULL quando a pergunta não foi exibida: o link pessoal já trazia o professor.';
comment on column public.nps_assessoria_responses.updated_by is
  'E-mail de quem editou nome, sobrenome ou professor no painel. NULL = nunca editada.';
