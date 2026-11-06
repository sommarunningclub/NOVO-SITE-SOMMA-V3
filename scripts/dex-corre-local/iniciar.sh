#!/bin/zsh
# Site local ligado ao banco de mentira. Nada aqui alcança o Supabase de produção
# nem envia e-mail: as variáveis abaixo têm prioridade sobre o .env.local.
cd "$(dirname "$0")/../.."
node scripts/dex-corre-local/servidor.cjs &
BANCO=$!
trap "kill $BANCO 2>/dev/null" EXIT
SUPABASE_URL=http://localhost:54399 NEXT_PUBLIC_SUPABASE_URL=http://localhost:54399 \
SUPABASE_SERVICE_ROLE_KEY=local-sem-acesso NEXT_PUBLIC_SUPABASE_ANON_KEY=local-sem-acesso \
RESEND_API_KEY= UPSTASH_REDIS_REST_URL= UPSTASH_REDIS_REST_TOKEN= \
AUTH_SECRET=local-sem-acesso INSIDER_SESSION_SECRET=local-sem-acesso \
npx next dev -p ${PORTA_SITE:-3108}
