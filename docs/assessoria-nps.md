# NPS da Assessoria Somma

Pesquisa de experiência dos alunos da Assessoria, com NPS, em
`https://sommaclub.com.br/assessoria/nps`.

As rodadas (uma a cada dois meses) são criadas e acompanhadas no painel:
admin.sommaclub.com.br › NPS Assessoria (repositório v0-sistema-somma-de-gestao-l7).
O site só coleta; relatório, links pessoais e tratativas moram no painel.

Não é anônima: pede nome e sobrenome, e vincula a resposta ao aluno quando é
possível saber quem é.

## Rotas

| Rota | O que faz |
| --- | --- |
| `GET /assessoria/nps` | Link geral: abre a rodada publicada cuja janela contém agora. Sem nenhuma no ar, mostra a próxima agendada ou "encerrada". `noindex`. |
| `GET /assessoria/nps/<slug>` | Link da rodada. Mostra a pesquisa, "ainda não abriu" (com data), "encerrada" ou "link inválido" (inclusive para rascunho). |
| `GET /assessoria/nps/convite/<token>` | Link pessoal. Troca o token por cookie httpOnly (`somma_nps_convite`) e redireciona (303) para o link da rodada do convite. Token inválido cai no link geral. |
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
  rodada.ts      situação da rodada pela janela e rótulo do bimestre (puro)
  db.ts          server-only: rodada por slug ou atual, convite, casamento por nome, insert

app/assessoria/nps/
  layout.tsx (metadata e estilos), page.tsx, [rodada]/page.tsx, convite/[token]/route.ts
  _lib/estado-inicial.ts   resolve rodada, convite e estado da tela no servidor
  _components/
    NpsSurvey.tsx, SurveyFlow.tsx, useSurvey.ts, survey-api.ts, QuestionRenderer.tsx, types.ts
    screens/  IntroScreen, IdentityScreen, QuestionScreen, StatusScreen
    ui/       NpsScale, RatingScale, SingleChoice, MultipleChoice, OpenText,
              ConditionalQuestion, ProgressIndicator, SurveyNavigation,
              SectionRail, SurveyShell, MensagemDaTela, pointer.ts, styles.ts

app/api/assessoria/nps/route.ts, app/api/assessoria/nps/convite/route.ts
supabase/migrations/20260914120000_assessoria_nps.sql
supabase/migrations/20260914170000_assessoria_nps_rodadas.sql
supabase/migrations/20260914200000_assessoria_nps_professor_e_edicao.sql
scripts/assessoria-nps-unit.mts       testes das regras (npx tsx …)
scripts/assessoria-nps-convites.mts   gera os links pessoais (o painel faz o mesmo)
```

Para mudar uma pergunta, edite só `survey.ts`. Mudou o sentido, a escala ou as
alternativas? Suba `SURVEY_VERSION`, ajuste os CHECKs numa migration nova e abra
uma campanha nova. Pergunta nova que não muda as outras (como
`declared_professor`) pode entrar na mesma versão, com coluna nula. O teste
`scripts/assessoria-nps-unit.mts` falha se o código tiver um valor ou uma coluna
que o banco não tem. Depois de mexer em `survey.ts`, regenere o espelho do painel
(`lib/nps/questionario.ts` no admin).

## Banco

Migrations `20260914120000_assessoria_nps.sql` e `20260914170000_assessoria_nps_rodadas.sql`,
aplicadas no projeto `sommarunning_2026`. Não alteram nenhuma tabela existente
fora das `nps_assessoria_*`.

### `nps_assessoria_campaigns`

Uma rodada da pesquisa. Rodada nova é linha nova; o histórico nunca é sobrescrito.

`id`, `slug` (único, é o código do link), `title`, `survey_version`,
`reference_period` (`2026-B5` = set–out 2026), `status` (`draft`/`active`/`closed`),
`opens_at`, `closes_at`, `created_by`, `updated_by`, `created_at`, `updated_at`.

Várias rodadas podem estar publicadas (a atual e a próxima agendada), mas a
restrição de exclusão `nps_assessoria_campaigns_sem_sobreposicao` impede que
duas rodadas `active` tenham janelas sobrepostas (`closes_at` nulo vale até o
infinito). Publicada exige `opens_at`. O slug `convite` é reservado.

"Agendada", "no ar" e "encerrada por data" não são gravados: saem de `status` +
janela, no site (`lib/assessoria-nps/rodada.ts`) e no painel com a mesma regra.

Primeira rodada: slug `assessoria-nps-2026-09` (mantido porque já estava no ar),
período `2026-B5`. As próximas usam o padrão do painel, ex.: `2026-nov-dez`.

### `nps_assessoria_invites`

Link pessoal por aluno por rodada.

`id`, `campaign_id`, `token` (único, 24 bytes base64url), `student_asaas_id`,
`first_name`, `last_name`, `professor_id` (FK `professors`, set null),
`professor_name`, `opened_at`, `shared_at`, `shared_by`, `created_at`.
Único `(campaign_id, student_asaas_id)`.

### `nps_assessoria_responses`

Uma linha por envio concluído. Uma coluna por pergunta.

- Controle: `id`, `campaign_id`, `survey_version`, `client_submission_id`
- Identificação: `first_name`, `last_name`, `full_name` (gerada), `full_name_normalized`,
  `identification_method` (`invite`/`name_match`/`self_declared`), `invite_id`,
  `student_asaas_id`, `professor_id`, `professor_name` (cadastro: convite, nome
  reconhecido ou correção no painel)
- Professor marcado pelo aluno: `declared_professor` (`alexandre_alves`,
  `joseph_pereira`, `mateus_fonseca`, `unknown` = Não sei). NULL quando o link
  pessoal já trazia o professor, ou em resposta anterior à pergunta.
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
- Correção no painel: `updated_by` (e-mail de quem corrigiu nome, sobrenome ou professor)

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

### `nps_assessoria_followups` e `nps_assessoria_followup_events`

Tratativas do painel. Todo detrator (nota 0 a 6) e todo aluno com 6 ou menos na
chance de renovar precisa de uma; sem linha = pendente. `followups` guarda o
estado atual (`status` pending/in_progress/resolved/no_action, `owner_name`,
`resolved_at`, `updated_by`); `followup_events` é o histórico (mudança de status
ou anotação, `author`), que só cresce. Apagar a resposta apaga os dois.

### RLS

Postura da casa: RLS ligado em todas as tabelas `nps_assessoria_*` e **nenhuma policy**. `anon` e
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

**Professor.** O link pessoal já traz o professor do cadastro (`professor_name`)
e não pergunta. Sem ele, a pesquisa pergunta "Quem é o seu professor?"
(`declared_professor`), e as perguntas do professor passam a citar o apelido
("o Ale acompanha sua rotina…", regra em `tituloDaPergunta`). O painel usa o
cadastro e, sem cadastro, o professor marcado; quando os dois divergem, a rodada
ganha um ponto de atenção. Uma aba aberta antes de a pergunta existir recebe
`409 version_mismatch` e, ao recarregar, continua do rascunho.

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

Tudo pelo painel (NPS Assessoria):

- **Nova rodada:** escolher o bimestre preenche título, código do link e uma
  janela de 15 dias. Cria como rascunho ou já publicada (agendada até abrir).
- **Encerrar / reabrir por 7 dias / voltar para rascunho** na tela da rodada.
- **Divulgação:** link da rodada, um link por canal (`?origem=`) e os links
  pessoais dos alunos ativos, com copiar, WhatsApp e situação (não enviado,
  enviado, abriu, respondeu).
- **Tratativas:** status, responsável e anotações na ficha da resposta.
- **Respostas:** lista, ficha completa e exportação CSV. Na lista ou na ficha dá
  para corrigir nome, sobrenome e professor (grava `updated_by`) e apagar a
  resposta, que leva junto a tratativa; se veio de link pessoal, o convite volta
  a aceitar resposta. Notas e textos do aluno não se editam.

O script continua existindo para uso fora do painel:

```bash
npx tsx scripts/assessoria-nps-convites.mts --rodada 2026-nov-dez
npx tsx scripts/assessoria-nps-convites.mts --rodada 2026-nov-dez --gerar --saida convites.csv
```

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

Por professor (cadastro e, sem ele, o professor marcado; `name_match` é inferência):

```sql
select coalesce(professor_name,
                case declared_professor
                  when 'alexandre_alves' then 'Alexandre Alves'
                  when 'joseph_pereira' then 'Joseph Pereira'
                  when 'mateus_fonseca' then 'Mateus Fonseca'
                end,
                '(não identificado)') as professor,
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
