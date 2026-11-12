#!/bin/zsh
# Site local ligado ao banco de mentira (PGlite). Nada aqui alcança o Supabase
# de produção nem envia e-mail: as variáveis abaixo têm prioridade sobre o
# .env.local. A chave do Google Maps continua a do .env.local, se existir.
#
#   scripts/evp-local/iniciar.sh          build + start (use este para E2E)
#   scripts/evp-local/iniciar.sh dev      next dev
#
# Painel e credenciamento: senha mestra "senha-local-de-teste", e-mail em branco.
cd "$(dirname "$0")/../.."
PORTA_BANCO=${PORTA_BANCO:-54398}
PORTA_SITE=${PORTA_SITE:-3120}
PORTA=$PORTA_BANCO node scripts/evp-local/servidor.cjs &
BANCO=$!
trap "kill $BANCO 2>/dev/null" EXIT
export SUPABASE_URL=http://localhost:$PORTA_BANCO NEXT_PUBLIC_SUPABASE_URL=http://localhost:$PORTA_BANCO
export SUPABASE_SERVICE_ROLE_KEY=local-sem-acesso NEXT_PUBLIC_SUPABASE_ANON_KEY=local-sem-acesso
export RESEND_API_KEY= UPSTASH_REDIS_REST_URL= UPSTASH_REDIS_REST_TOKEN=
export AUTH_SECRET=local-sem-acesso INSIDER_SESSION_SECRET=local-sem-acesso
export EVP_ADMIN_SENHA=${EVP_ADMIN_SENHA:-senha-local-de-teste} EVP_DADOS_SECRET=segredo-local-de-teste
if [ "$1" = "dev" ]; then
  npx next dev -p $PORTA_SITE
else
  NEXT_FONT_GOOGLE_MOCKED_RESPONSES="$PWD/scripts/fontes-google/respostas.cjs" npx next build && npx next start -p $PORTA_SITE
fi
