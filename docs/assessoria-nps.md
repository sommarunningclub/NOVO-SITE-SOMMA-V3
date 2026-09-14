# NPS da Assessoria Somma

Pesquisa de experiência dos alunos da Assessoria, com NPS, em
`https://sommaclub.com.br/assessoria/nps`.

Não é anônima: pede nome e sobrenome, e vincula a resposta ao aluno quando é
possível saber quem é.

## Rotas

| Rota | O que faz |
| --- | --- |
| `GET /assessoria/nps` | A pesquisa. Server component lê a campanha ativa e o cookie do convite; o resto é client. `noindex`. |
| `GET /assessoria/nps/convite/<token>` | Link pessoal. Troca o token por cookie httpOnly (`somma_nps_convite`) e redireciona (303) para a URL limpa. Token inválido cai na pesquisa normal. |
| `POST /api/assessoria/nps` | Grava a resposta. Rate limit (20 a cada 10 min por IP), limite de 64 KB, zod + regras condicionais, service role. |
| `DELETE /api/assessoria/nps/convite` | "Responder por outra pessoa neste aparelho": apaga o cookie do convite. |

Respostas da API: `201 {ok}` gravou · `200 {ok, duplicate}` o mesmo envio chegou
de novo · `400 {error, campo}` · `409 already_answered` (convite já respondeu) ·
`409 version_mismatch` · `410 closed` · `413` · `429` · `503`/`500`.

## Arquivos

```
lib/assessoria-nps/
  survey.ts      perguntas, alternativas, seções, condições, SURVEY_VERSION (fonte única)
  logic.ts       visibilidade, validação, montagem da linha, categoria e cálculo do NPS
  schema.ts      zod do payload (forma); o contexto fica em logic.ts
  nome.ts        caixa, validação e casamento de nomes
  storage.ts     rascunho no localStorage
  analytics.ts   eventos para dataLayer/gtag, sem conteúdo de resposta
  db.ts          server-only: campanha, convite, casamento por nome, insert

app/assessoria/nps/
  page.tsx, nps.css, convite/[token]/route.ts
  _components/
    NpsSurvey.tsx, SurveyFlow.tsx, useSurvey.ts, survey-api.ts, QuestionRenderer.tsx, types.ts
    screens/  IntroScreen, IdentityScreen, QuestionScreen, StatusScreen
    ui/       NpsScale, RatingScale, SingleChoice, MultipleChoice, OpenText,
              ConditionalQuestion, ProgressIndicator, SurveyNavigation,
              SectionRail, SurveyShell, MensagemDaTela, pointer.ts, styles.ts

app/api/assessoria/nps/route.ts, app/api/assessoria/nps/convite/route.ts
supabase/migrations/20260914120000_assessoria_nps.sql
scripts/assessoria-nps-unit.mts       testes das regras (npx tsx …)
scripts/assessoria-nps-convites.mts   gera os links pessoais
```

Para mudar uma pergunta, edite só `survey.ts`. Mudou o sentido, a escala ou as
alternativas? Suba `SURVEY_VERSION`, ajuste os CHECKs numa migration nova e abra
uma campanha nova. O teste `scripts/assessoria-nps-unit.mts` falha se o código
tiver um valor que o banco não aceita.

## Banco

Migration `20260914120000_assessoria_nps.sql`, aplicada no projeto
`sommarunning_2026`. Não altera nenhuma tabela existente.

### `nps_assessoria_campaigns`

Uma rodada da pesquisa. Rodada nova é linha nova; o histórico nunca é sobrescrito.

`id`, `slug` (único), `title`, `survey_version`, `reference_period` (ex.: `2026-09`),
`status` (`draft`/`active`/`closed`), `opens_at`, `closes_at`, `created_at`, `updated_at`.

Índice único parcial `nps_assessoria_campaigns_uma_ativa`: só uma campanha ativa
por vez. Primeira rodada: `assessoria-nps-2026-09`, versão `assessoria_nps_v1`.

### `nps_assessoria_invites`

Link pessoal por aluno por rodada.

`id`, `campaign_id`, `token` (único, 24 bytes base64url), `student_asaas_id`,
`first_name`, `last_name`, `professor_id` (FK `professors`, set null),
`professor_name`, `opened_at`, `created_at`. Único `(campaign_id, student_asaas_id)`.

### `nps_assessoria_responses`

Uma linha por envio concluído. Uma coluna por pergunta.

- Controle: `id`, `campaign_id`, `survey_version`, `client_submission_id`
- Identificação: `first_name`, `last_name`, `full_name` (gerada), `full_name_normalized`,
  `identification_method` (`invite`/`name_match`/`self_declared`), `invite_id`,
  `student_asaas_id`, `professor_id`, `professor_name`
- Notas 0 a 10 (`smallint`): `nps_score`, `renewal_probability`
- `nps_category` (gerada a partir de `nps_score`): `detractor` 0 a 6, `passive` 7 e 8, `promoter` 9 e 10
- Escalas 1 a 5 (`smallint`): `overall_quality`, `expectation_delivery`, `teacher_followup`,
  `teacher_understands_goals`, `teacher_whatsapp_access`, `teacher_support_quality`,
  `teacher_communication_quality`, `training_quality`, `training_level_fit`,
  `training_goal_alignment`, `perceived_progress`, `whatsapp_group_quality`,
  `whatsapp_connection`, `whatsapp_information_clarity`, `community_climate`,
  `community_belonging`, `community_interaction`, `sunday_support_quality`, `sunday_value`,
  `physical_structure_quality`, `cost_benefit`
- Escolha única (`text` com CHECK): `needs_more_feedback`, `whatsapp_message_volume`,
  `sunday_frequency`, `weekday_training_interest`, `preferred_weekday_combination`,
  `preferred_period`, `preferred_morning_time`, `preferred_evening_time`, `expected_weekly_frequency`
- Múltipla escolha (`text[]` com CHECK de subconjunto): `whatsapp_content_preferences`,
  `available_periods`
- Abertas (`text`): `nps_reason`, `whatsapp_content_other`, `community_one_word`,
  `sunday_improvements`, `preferred_weekday_other`, `physical_structure_improvements`,
  `what_is_excellent`, `what_needs_improvement`, `one_change`
- Metadados: `source`, `utm_source`, `utm_medium`, `utm_campaign`, `device_type`
  (`mobile`/`tablet`/`desktop`). Sem IP e sem user agent.
- Tempo: `started_at`, `submitted_at`, `completion_seconds` (gerada), `created_at`, `updated_at`

**NULL em pergunta condicional quer dizer "não foi exibida"**, não dado faltando.
CHECKs de coerência garantem isso no banco: quem respondeu `never` no domingo
tem domingo e estrutura NULL; quem respondeu `no` na semana tem dia, período e
horário NULL; horário da manhã existe se e só se `morning` está em `available_periods`.

`available_periods` é o período já resolvido ("Manhã" vira `{morning}`, "mais de
um período" vira os marcados). Para contar manhã/tarde/noite, use esta coluna,
não `preferred_period`.

Índices: `(campaign_id, submitted_at desc)`, `(campaign_id, nps_category)`,
`(submitted_at)`, `(professor_id, campaign_id)` parcial, `(student_asaas_id)` parcial,
`(campaign_id, full_name_normalized)`, único `(campaign_id, client_submission_id)`,
único `(invite_id)` parcial.

### View `nps_assessoria_campaign_summary`

Por rodada: total, promotores, neutros, detratores, NPS, médias por dimensão
(professor, treino, evolução, WhatsApp, clima, pertencimento, domingo, estrutura,
custo benefício, renovação), interesse na semana, seg/qua x ter/qui, períodos e
tempo médio. `security_invoker = true`.

### RLS

Postura da casa: RLS ligado nas três tabelas e **nenhuma policy**. `anon` e
`authenticated` não têm grant nenhum (conferido: a anon key recebe
`42501 permission denied` para ler e para gravar, inclusive na view). O
formulário grava pela rota da API, server-side, com `SUPABASE_SERVICE_ROLE_KEY`,
que nunca vai ao navegador.

## Identificação e duplicidade

1. **Link pessoal** (`invite`): prova forte. Pré-preenche nome e sobrenome para
   confirmação e vincula `student_asaas_id` e professor. Um convite responde uma
   vez por rodada (índice único); a segunda tentativa vê "Você já respondeu".
2. **Link genérico com nome inequívoco** (`name_match`): o servidor compara o nome
   digitado com `professor_clients`. Só vincula se exatamente um aluno casar
   (primeiro nome igual e todos os sobrenomes digitados presentes no cadastro).
   É inferência: não bloqueia uma segunda resposta e deve ser tratado assim no
   dashboard.
3. **Só o nome** (`self_declared`).

O site não tem login de aluno, por isso não há preenchimento automático fora do
link pessoal.

Envio duplicado acidental (refresh, clique duplo, retry de rede) é neutralizado
por `client_submission_id`, gerado no aparelho quando a pessoa começa: o mesmo
envio chega de novo e a API responde `200 duplicate` sem novo insert.

## Experiência

- Uma pergunta por tela, agrupadas em 10 etapas. Progresso "4 de 10" com barra.
- Toque numa alternativa avança sozinho depois de 300 ms. Teclado não avança
  sozinho: setas escolhem, Enter confirma; no texto longo, Ctrl/⌘ + Enter.
- "Qual é o principal motivo para a sua nota?" é opcional, mas pede uma vez
  antes de deixar pular.
- Cada pergunta é uma entrada no histórico: o voltar do celular volta uma pergunta.
- Rascunho no `localStorage` (`somma:assessoria-nps:<campanha>`). Refresh em até
  30 minutos volta direto para a pergunta; depois disso, a abertura oferece
  "Continuar de onde parei". Depois do envio, o rascunho é apagado e fica só a
  marca de enviado; refresh mostra o obrigado sem novo insert.
- Celular: escala 0 a 10 em duas linhas (botões de ~52 px). Desktop: trilho de
  etapas à esquerda e pergunta na coluna larga.

## Analytics

Eventos no `dataLayer` (GTM) e `gtag`: `nps_survey_opened`, `nps_survey_started`,
`nps_step_completed` (`step_id`, `step_index`, `steps_total`), `nps_survey_submitted`
(`duration_bucket`), `nps_survey_error` (`error_type`). Todos levam
`survey_version`. Nenhum leva nome, nota, categoria ou texto. Meta Pixel fica fora.

## Operação

### Gerar links pessoais

```bash
npx tsx scripts/assessoria-nps-convites.mts                          # simula e conta
npx tsx scripts/assessoria-nps-convites.mts --gerar --saida convites.csv
```

Usa os alunos ativos de `professor_clients`. Rodar de novo cria só os que faltam
e não troca link de ninguém. O CSV tem dado pessoal: não versionar.

### Abrir nova rodada

```sql
begin;
update nps_assessoria_campaigns set status = 'closed', closes_at = now() where status = 'active';
insert into nps_assessoria_campaigns (slug, title, survey_version, reference_period, status, opens_at)
values ('assessoria-nps-2027-03', 'NPS da Assessoria Somma · março de 2027', 'assessoria_nps_v1', '2027-03', 'active', now());
commit;
```

Encerrar sem abrir outra: só o `update`. A página passa a mostrar "Esta rodada
da pesquisa foi encerrada".

## Consultas

NPS e médias por rodada:

```sql
select slug, reference_period, total_responses, promoters, passives, detractors, nps,
       avg_teacher, avg_training, avg_perceived_progress, avg_whatsapp,
       avg_community_belonging, avg_sunday, avg_cost_benefit, avg_renewal_probability
from nps_assessoria_campaign_summary
order by reference_period;
```

Como o NPS é calculado (% promotores − % detratores, de −100 a 100):

```sql
select round(100.0 * (count(*) filter (where nps_category = 'promoter')
                    - count(*) filter (where nps_category = 'detractor')) / nullif(count(*), 0), 1) as nps
from nps_assessoria_responses r
join nps_assessoria_campaigns c on c.id = r.campaign_id
where c.slug = 'assessoria-nps-2026-09';
```

NPS ao longo do tempo (semana, horário de Brasília):

```sql
select date_trunc('week', submitted_at at time zone 'America/Sao_Paulo')::date as semana,
       count(*) as respostas,
       round(100.0 * (count(*) filter (where nps_category = 'promoter')
                    - count(*) filter (where nps_category = 'detractor')) / count(*), 1) as nps
from nps_assessoria_responses
group by 1 order by 1;
```

Por professor (só respostas vinculadas; `name_match` é inferência):

```sql
select coalesce(professor_name, '(não identificado)') as professor,
       identification_method, count(*) as respostas,
       round(100.0 * (count(*) filter (where nps_category = 'promoter')
                    - count(*) filter (where nps_category = 'detractor')) / count(*), 1) as nps,
       round(avg((teacher_followup + teacher_understands_goals + teacher_whatsapp_access
                + teacher_support_quality + teacher_communication_quality) / 5.0), 2) as media_professor
from nps_assessoria_responses
group by 1, 2 order by 1, 2;
```

Treino na semana:

```sql
select weekday_training_interest, count(*) from nps_assessoria_responses group by 1;

select preferred_weekday_combination, count(*)
from nps_assessoria_responses where preferred_weekday_combination is not null group by 1 order by 2 desc;

select periodo, count(*) from nps_assessoria_responses, unnest(available_periods) as periodo group by 1 order by 2 desc;

select preferred_morning_time, count(*) from nps_assessoria_responses where preferred_morning_time is not null group by 1;
select preferred_evening_time, count(*) from nps_assessoria_responses where preferred_evening_time is not null group by 1;
```

O que querem receber nos grupos:

```sql
select conteudo, count(*) from nps_assessoria_responses, unnest(whatsapp_content_preferences) as conteudo
group by 1 order by 2 desc;
```

Respostas abertas, detratores primeiro:

```sql
select full_name, nps_score, nps_reason, what_is_excellent, what_needs_improvement, one_change
from nps_assessoria_responses
order by nps_score, submitted_at;
```

Taxa de resposta dos links pessoais:

```sql
select count(*) as convites, count(i.opened_at) as abertos, count(r.id) as respondidos
from nps_assessoria_invites i
left join nps_assessoria_responses r on r.invite_id = i.id
join nps_assessoria_campaigns c on c.id = i.campaign_id and c.status = 'active';
```

Tempo de preenchimento (mediana, ignorando rascunho esquecido por dias):

```sql
select percentile_cont(0.5) within group (order by completion_seconds) as mediana_segundos
from nps_assessoria_responses where completion_seconds < 3600;
```
