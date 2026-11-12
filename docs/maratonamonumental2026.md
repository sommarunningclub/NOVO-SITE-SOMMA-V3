# Meeting Técnico | Maratona Monumental de Brasília 2026

Landing page, inscrições, ingresso com QR Code, credenciamento e painel do
Meeting Técnico do SOMMA Club com a BORA Assessoria. É a primeira aplicação da
plataforma de eventos do site (tabelas e funções `evp_`).

| O quê | Onde |
| --- | --- |
| Landing page | `/maratonamonumental2026` |
| Obrigado e ingresso | `/maratonamonumental2026/obrigado?t=<token>` (o antigo `/confirmacao` redireciona) |
| Credenciamento (equipe) | `/maratonamonumental2026/credenciamento` |
| Painel (admin) | `/maratonamonumental2026/admin` |
| Convite de agenda | `/maratonamonumental2026/agenda.ics` |
| Código da página | `app/maratonamonumental2026/` |
| Regras e dados | `lib/evp/` |
| Rotas de API | `app/api/evp/` |
| Banco | `supabase/migrations/20261111190000_evp_plataforma_eventos.sql` |

## O que é fato e o que é configurável

- **Dados da prova** (datas, largadas, pelotões, tempos limite, pontos de corte,
  hidratação por quilômetro, Desafio Monumental, retirada de kit): saíram do
  regulamento oficial 2026 (v6) e estão em `lib/evp/config.ts`. Se a organização
  mudar o regulamento, é lá que se corrige.
- **Dados do Meeting** (data, horário, local, endereço, capacidade, valor,
  programação, profissionais): ficam no banco e são editados no painel. Nada
  disso tem valor padrão. Enquanto não for preenchido, a página mostra "Em
  breve" e "Local em definição".
- O Meeting é do SOMMA e da BORA. A página diz, no rodapé e na seção de
  informações, que não é um evento da organização da maratona.

## Abrir as inscrições

No painel, aba **Evento**. O banco só aceita o estado "aberta" com data e
horário, local, endereço, capacidade e valor definidos (0 = gratuito). Faltando
qualquer um, o painel diz qual.

Quando as vagas acabam, vale a opção "ao lotar": lista de espera (padrão) ou
encerrar. Com lista de espera e promoção automática, um cancelamento confirma
na hora o primeiro da fila e manda o e-mail para ele.

## Banco de dados

A especificação pedia `events`, `event_registrations` etc. O nome
`event_registrations` já existe no banco (outra aplicação), então a plataforma
usa o prefixo `evp_`:

| Pedido | Criado |
| --- | --- |
| events | `evp_events` |
| event_registrations | `evp_registrations` |
| event_waitlist | `evp_waitlist` |
| event_checkins | `evp_checkins` |
| event_staff | `evp_staff` |
| event_schedule | `evp_schedule` |
| event_speakers | `evp_speakers` |
| event_routes | `evp_routes` |
| event_audit_logs | `evp_audit_logs` |
| (contador do funil) | `evp_page_views` |

- RLS ligada em todas, sem política: anon e authenticated não leem nem gravam.
  O site fala com o banco só por função (`evp_*`), com a service role, a partir
  do servidor.
- Vaga, fila e check-in são decididos dentro do Postgres, em transação que trava
  a linha do evento (`for update`). A última vaga não sai para duas pessoas.
- Reenvio da mesma requisição não duplica: cada formulário manda uma chave de
  idempotência.

### Aplicar a migration (antes do merge)

```
supabase db query --linked -f supabase/migrations/20261111190000_evp_plataforma_eventos.sql
supabase migration repair --linked --status applied 20261111190000
```

A migration só cria estruturas `evp_` e o bucket público `evp-midia`. Pode
reexecutar. Se o CLI responder 403, refazer o `supabase login`.

## Variáveis de ambiente

| Variável | Para quê | Obrigatória |
| --- | --- | --- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Banco (já existem) | Sim |
| `AUTH_SECRET` | Assina o cookie da equipe e o selo do formulário (já existe) | Sim |
| `EVP_ADMIN_SENHA` | Senha mestra do painel e do credenciamento. Sem valor padrão no código: o repositório é público | Sim, para entrar a primeira vez |
| `EVP_DADOS_SECRET` | Segredo de onde saem a chave que cifra o CPF e a do HMAC | Recomendada |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Mapa (já existe). Pública por natureza | Sim, para o mapa |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Map ID com estilo feito no console do Google | Não |
| `RESEND_API_KEY`, `VIP_EMAIL_FROM` | E-mail de confirmação (já existem) | Sim, para o e-mail |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Limite de requisições valendo entre instâncias | Recomendada |

Cuidados:

- **`EVP_DADOS_SECRET` não pode mudar depois da primeira inscrição.** Sem ela o
  sistema usa o `AUTH_SECRET`, e a regra é a mesma: trocar o segredo deixa os
  CPFs gravados ilegíveis e desliga a trava de inscrição duplicada. Defina a
  variável antes de abrir as inscrições e não mexa mais.
- A chave do Google Maps vai para o navegador. No console do Google ela precisa
  estar restrita ao domínio `sommaclub.com.br/*` e à Maps JavaScript API.
  Nenhuma chave privada é usada no cliente.
- Sem Upstash, o limite de requisições conta por instância da Vercel: segura
  rajada, mas não é barreira.

## Dados pessoais (LGPD)

- **Finalidade**: inscrição, credenciamento e avisos deste evento. Comunicação
  promocional tem consentimento próprio, opcional e desmarcado por padrão.
- **CPF**: gravado cifrado (AES-256-GCM) e com um HMAC para impedir a segunda
  inscrição. Nenhuma tela mostra o CPF inteiro. No painel, o admin revela um a
  um e cada revelação fica no histórico. O CSV sai com o CPF mascarado.
- **Ingresso e QR Code**: o QR carrega só um identificador aleatório, diferente
  do link do ingresso. Não tem CPF, e-mail nem nome.
- **Acesso**: operador faz check-in e busca por nome, sem ver e-mail nem
  telefone. Só admin abre o painel. Conta desativada perde o acesso na hora.
- **Aceites**: o aceite de dados e o de uso de imagem vão para `aceites_termos`,
  como nas outras páginas de evento do site. Atenção: essa tabela guarda o CPF
  em claro (decisão anterior do site, mantida aqui para a prova do aceite).
- **Retenção**: ainda não há prazo decidido. Proposta: apagar ou anonimizar as
  inscrições 12 meses depois do evento. Precisa de decisão do Alex antes de
  virar texto na página.

## Percursos no mapa

Regra: o mapa só desenha traçado que veio de arquivo georreferenciado (GPX, KML
ou GeoJSON), enviado no painel, aba **Percursos**. Não há caminho para desenhar
por cima de PDF nem para pedir rota ao Google. O arquivo entra em validação, com
relatório (comprimento medido contra o oficial, pontos, avisos), e só aparece na
página depois que alguém marca "conferi com o mapa oficial" e publica. Sem
traçado publicado, a página mostra a região da largada e o link do PDF oficial.

Os pontos de apoio e de corte aparecem no mapa na posição calculada pela
distância ao longo do traçado, a partir dos quilômetros do regulamento.

Arquivos em `docs/maratonamonumental2026/percursos/`:

| Arquivo | Distância | Medido | Origem |
| --- | --- | --- | --- |
| `21k-Corrida_matinal.gpx` | 21 km | 21,27 km | Gravação do Strava |
| `42k-Maratona_Monumental.gpx` | 42 km | 42,03 km | Gravação do Strava |

São gravações de GPS de corridas no percurso, não arquivos da organização. A
página informa a origem embaixo do mapa. Antes de publicar em produção, comparar
com os PDFs oficiais de 2026: se o traçado deste ano mudou, o arquivo não serve.
Para 5 km e 10 km ainda não há arquivo.

## Analytics

Eventos no GA4 do site (prefixo `evp_`): `view_page`, `cta_click`, `form_start`,
`select_distance`, `form_step`, `form_error`, `sign_up`, `waitlist_join`,
`add_to_calendar`. Nenhum carrega CPF, e-mail, telefone ou nome: os parâmetros
aceitos são uma lista fechada em `lib/evp/analytics.ts`. UTMs e site de origem
ficam na sessão e vão junto com a inscrição. A conversão do painel usa um
contador próprio (visitas e inícios de formulário por dia e origem, sem dado
pessoal).

## E-mail de confirmação

Sai sozinho a cada inscrição, pelo Resend (`RESEND_API_KEY` e `VIP_EMAIL_FROM`,
que já existem na Vercel). Quem tem vaga confirmada recebe o QR Code dentro do
e-mail; quem entra na lista de espera recebe a posição, sem QR. O mesmo e-mail
sai quando a pessoa é promovida da fila e quando o admin reenvia pelo painel.
Modelo aprovado pelo Alex em 11/11/2026, com as duas logos no cabeçalho
(`public/maratonamonumental2026/email/`). Prévia sem enviar nada:

```
npx tsx --conditions=react-server scripts/evp-email-preview.mts
```

Depois de enviar a inscrição, a pessoa vê uma tela de espera de 5 segundos e
cai na página de obrigado, que mostra o ingresso.

## Testes

```
npm i --no-save @electric-sql/pglite

# 1. Regras do banco, com a migration real, num Postgres em memória (55 testes)
node scripts/evp-banco.test.cjs

# 2. Site local contra o banco de mentira (não toca em produção, não manda e-mail)
scripts/evp-local/iniciar.sh            # terminal 1: build + start na porta 3120
node scripts/evp-e2e.mjs                # terminal 2: 93 testes pelas rotas
node scripts/evp-local/percursos.mjs    # opcional: carrega os GPX no mapa local
```

Painel e credenciamento locais: e-mail em branco, senha `senha-local-de-teste`.

Limite conhecido: o Postgres em memória tem uma conexão só. A disputa pela
última vaga é testada disparando as inscrições juntas e conferindo o resultado;
a garantia entre conexões de verdade vem do `for update`, que o teste confere
pelo texto das funções.

## Publicar

1. Aplicar a migration (acima).
2. Na Vercel, projeto `novo-site-somma-v3`: criar `EVP_ADMIN_SENHA` e
   `EVP_DADOS_SECRET`.
3. PR para a `main` e merge. Dos checks, só vale o `Vercel – novo-site-somma-v3`.
4. Entrar em `/maratonamonumental2026/admin` com a senha mestra, criar as contas
   da equipe, preencher o evento e subir os percursos.
5. Conferir a página no celular e fazer uma inscrição de teste antes de divulgar.

## O que não está incluído

- Pagamento online. O valor é configurável e aparece na página, mas não há
  cobrança: com valor acima de zero, a forma de pagamento precisa ser combinada.
- Espelho das inscrições na gestão (`checkins`, `cadastro_site`).
- Conferência dos traçados contra os PDFs oficiais de 2026 (é trabalho de olho).
