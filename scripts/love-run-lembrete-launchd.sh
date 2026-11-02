#!/bin/zsh
# Chamado de hora em hora pelo launchd (~/Library/LaunchAgents/br.com.sommaclub.love-run-lembrete.plist).
# Roda o 2º envio do e-mail da transferência quando já deram 24 h do 1º. Depois
# que ele sai (ou se o prazo da transferência passou), atualiza as campanhas no
# admin e remove o próprio agendamento. Log em ~/Library/Logs/love-run-lembrete.log.
set -u
ROTULO="br.com.sommaclub.love-run-lembrete"
LOG="$HOME/Library/Logs/love-run-lembrete.log"
export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "$(dirname "$0")/.." || exit 1

SAIDA=$(npx tsx --conditions=react-server scripts/love-run-como-transferir.mts --lembrete --enviar 2>&1)
{ echo "=== $(date '+%d/%m %H:%M')"; echo "$SAIDA"; } >> "$LOG"

if echo "$SAIDA" | grep -qE "^Enviados:|lembrete cancelado"; then
  npx tsx --conditions=react-server scripts/love-run-campanhas-admin.mts --gravar >> "$LOG" 2>&1
  echo "agendamento removido" >> "$LOG"
  rm -f "$HOME/Library/LaunchAgents/$ROTULO.plist"
  launchctl bootout "gui/$(id -u)/$ROTULO" 2>/dev/null
fi
