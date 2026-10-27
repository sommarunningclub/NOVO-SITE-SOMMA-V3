# Dexcomplica Love Run (07/11/2026)

LP: `sommaclub.com.br/dexcomplica` (slug no banco: `dexcomplica-love-run`; `/dexcomplica-love-run` redireciona). Realização Somma Club e Dexcomplica, produção Monu.

## Como se conecta ao Somma

Nada novo de infraestrutura: a LP usa as mesmas tabelas e a mesma função do SOMMA DAY.

| Peça | Onde | Papel |
|---|---|---|
| Evento | `public.eventos`, slug `dexcomplica-love-run` | Fonte da verdade. A gestão abre/fecha, define pelotões e vagas. O `/check-in` lista o card e manda para a LP (`lp_url`). |
| Pessoa | `cadastro_site` (CPF único) | Criada ou completada pela inscrição (nunca sobrescreve dado existente). |
| Inscrição | `evento_participantes` | Uma por CPF+evento. Guarda `ticket_code` (DLR-XXXXXX), `ticket_token` (QR) e status. |
| Lista da gestão | `checkins` | Espelhada na hora da inscrição. A gestão também sincroniza sozinha ao abrir a lista. |
| Inscrever | `public.inscrever_no_evento(...)` | Transação única: pessoa + inscrição, teto de vagas sob advisory lock, unicidade (evento, pessoa). |

Ingresso: `/dexcomplica/ingresso/<token>` (token aleatório de 32 bytes; noindex; sem Referer). O QR contém essa URL. O leitor da gestão (módulo Check-in → **Ler ingresso**) aceita o QR ou o código digitado e marca presença em `evento_participantes` (status `presente`) e em `checkins` (`validacao_do_checkin`). O botão Presente/Ausente da lista também reflete na inscrição.

## Para abrir as inscrições

A LP só aceita inscrição quando TODAS as condições valem (senão mostra "em breve"):

1. a linha existe em `eventos` (migration `supabase/migrations/20261027120000_dexcomplica_love_run.sql`);
2. **pelotões** preenchidos (gestão → Eventos → pelotões);
3. **vagas pela LP** preenchidas (gestão → Eventos → "Vagas pela LP", coluna `eventos.capacidade`);
4. status do check-in **aberto**.

Fechar: status `bloqueado` ou `encerrado`. Esgotou: a própria LP mostra.

## Informações pendentes

Tudo em `lib/dexcomplica-love-run/event.config.ts`. Enquanto `null`/`confirmada: false`, a página não mostra:
`HORARIO` (concentração e largada), `PERCURSO` (traçado), `AFTER.horario`, `AFTER.acesso`, `AFTER.modalidades`,
`FESTA.confirmada`/`local`/`url`, `FESTA.beneficio`.

Atenção: o formulário de Eventos da gestão preenche `horario_inicio` com 07:00 ao salvar. O card do `/check-in` passa a mostrar esse horário; a LP não (ela lê o config).

## Variáveis de ambiente

Já existentes no projeto: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM` (ou `VIP_EMAIL_FROM`), `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (restrinja por referrer `sommaclub.com.br/*` e à Maps JavaScript API). Opcional: `UPSTASH_REDIS_REST_URL`/`TOKEN` (rate limit global). Só para teste local: `LOVE_RUN_EVENTO_SLUG` (ignorada em produção).

## Testes

```bash
npx tsx scripts/love-run-unit.mts                       # regras de abertura, validação, máscara

# integração contra o banco, em evento de TESTE oculto
node scripts/love-run-integracao.mjs preparar
LOVE_RUN_EVENTO_SLUG=teste-dexcomplica-love-run RESEND_API_KEY= npx next dev -p 3108
BASE=http://localhost:3108 node scripts/love-run-integracao.mjs testar
#   → depois, no repo da gestão: scripts/leitor-ingresso-integracao.mts com os tokens impressos
node scripts/love-run-integracao.mjs limpar
```

Prévia local do ingresso e do e-mail (só em dev): `/dev/love-run`, `/dev/love-run?presente=1`, `/dev/love-run?tela=email`.

## Métricas (GTM/dataLayer, prefixo `love_run_`)

`lp_visualizada`, `cta_clicado`, `formulario_iniciado`, `inscricao_concluida`, `inscricao_erro`, `ja_inscrito`, `ingresso_visualizado`, `ingresso_salvo`, `codigo_copiado`, `como_chegar`, `festa_saiba_mais`, `evento_compartilhado`, `recuperacao_solicitada`. Nenhum dado pessoal sobe (filtro em `lib/dexcomplica-love-run/analytics.ts`).
