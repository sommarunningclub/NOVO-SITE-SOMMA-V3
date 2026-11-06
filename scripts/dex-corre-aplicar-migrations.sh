#!/bin/zsh
# Aplica no Supabase de produção as migrations do Vem Correr Comigo, na ordem, e
# registra no histórico. Para no primeiro erro. Só cria estruturas dex_corre_*;
# pode reexecutar. Rodar antes do merge: o código depende destas funções.
set -e
cd "$(dirname "$0")/.."
for f in supabase/migrations/*dex_corre*.sql; do
  v=$(basename "$f" | cut -d_ -f1)
  echo "Aplicando $(basename "$f")"
  supabase db query --linked -f "$f" > /dev/null
  supabase migration repair --linked --status applied "$v" > /dev/null
done
supabase db query --linked "select count(*) as tabelas_criadas from pg_class where relname like 'dex_corre_%' and relkind = 'r'"
echo "Pronto. Avise o Claude para conferir e publicar."
