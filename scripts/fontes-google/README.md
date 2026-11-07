# Fontes do Google guardadas no repositório

Desde 07/11/2026 o build da Vercel quebrava no `next/font/google`
(`TypeError: Cannot read properties of null (reading '1')` em `loader.js:122`):
o Google passou a devolver, para os servidores da Vercel, endereço de fonte
sem extensão, e o Next 15.5 (até o 15.5.29) não aceita. Daqui a resposta vinha
normal, então não dava para corrigir do nosso lado.

Para o build não depender do Google, `npm run build` liga
`NEXT_FONT_GOOGLE_MOCKED_RESPONSES` apontando para `respostas.cjs`. O CSS de cada
pedido e os arquivos `.woff2` ficam aqui. O `next dev` continua buscando no Google.

## Fonte nova ou mudança de peso/eixo

O build falha com `Missing mocked response for URL`. Para regenerar:

1. Rodar um build com a captura ligada, sem cache:
   ```
   rm -rf .next
   CAPTURA_SAIDA=/tmp/captura.jsonl NODE_OPTIONS="--require ./scripts/fontes-google/captura.cjs" npx next build
   ```
   (basta passar da etapa "Compiled successfully").
2. `node scripts/fontes-google/gerar.cjs /tmp/captura.jsonl`
3. Commitar `respostas.json` e `arquivos/`.

Para voltar a buscar no Google, tirar a variável do script `build` no package.json.
