# /institucional · Apresentação institucional SOMMA Club

Apresentação para marcas e parceiros: **"Sua marca dentro de uma comunidade em movimento."**
Sem fotos: a linguagem visual é o ponto do símbolo SOMMA (cada ponto é uma pessoa) e a trama de pontos do pattern da marca.

| Rota | O que é |
|---|---|
| `/institucional` | Apresentação 16:9 com 16 slides em 5 atos |
| `/institucional#7` | Abre direto no slide 7 (o hash acompanha a navegação) |
| `/institucional?painel=1` | Abre a apresentação já com o painel por cima |
| `/institucional/painel` | Painel da comunidade em página própria |

Material comercial: `noindex`, circula só por link.

## Como apresentar

| Tecla | Ação |
|---|---|
| → · Espaço · PageDown · clique no fundo | Próximo slide |
| ← · PageUp · Shift + clique | Slide anterior |
| 1 a 9 · Home · End | Ir para o slide |
| F | Tela cheia |
| G ou O | Visão geral |
| N | Notas do apresentador (e o título do próximo slide) |
| P | Painel da comunidade (Esc volta ao mesmo slide) |

No celular em retrato (ou janela com menos de 900 px), a apresentação vira leitura vertical, com índice no topo.

## Estrutura

```
_data/          conteúdo e números (editar aqui, não nos componentes)
  slides.ts       ordem, atos, temas, títulos e notas do apresentador
  instagram.ts    Insights do Instagram (fonte, período, definições)
  comunidade.ts   tipos e leitura do retrato agregado
  comunidade.snapshot.json   retrato gerado por script (não editar à mão)
  cases.ts        marcas com registro (evidência sai do retrato)
  oportunidades.ts  os 5 territórios
  parceria.ts     durações, linha do tempo ilustrativa, fatores, processo
  contato.ts      contatos verificados no projeto
_components/
  Deck.tsx        palco, navegação, visão geral, notas, painel sobreposto
  ui.tsx · pontos.tsx   peças comuns e os motivos de ponto da marca
  slides/ato1..4.tsx    os 16 slides
  painel/         painel da comunidade e gráficos (SVG próprio)
institucional.css sistema visual escopado em .inst
```

## Dados

### Instagram (verificado)
Prints do Instagram Insights enviados pela SOMMA, últimos 30 dias, capturados em 04/11/2026. Atualizar em `_data/instagram.ts`.

### Comunidade (dados internos, reais e agregados)
Gerado por `node scripts/institucional/gerar-snapshot.mjs` (da raiz, com `.env.local` contendo `SUPABASE_SERVICE_ROLE_KEY`). O script só lê o banco e grava `comunidade.snapshot.json`, sem CPF, nome, e-mail ou telefone. Sugestão: rodar a cada trimestre, ou antes de uma reunião importante, e publicar.

Tabelas lidas: `eventos` (id, título, data, tipo), `checkins` (CPF, sexo, evento), `cadastro_site` (CPF, nascimento, sexo).

**Ressalva importante:** `checkins` é a confirmação de presença feita pelo site ou app de check-in, não contagem auditada na porta. Por isso a apresentação fala em "confirmações", nunca em "público".

Definições:
- **Confirmação**: uma pessoa (CPF de 11 dígitos) num evento. Repetição no mesmo evento conta uma vez.
- **Pessoas únicas**: CPFs distintos com confirmação no recorte.
- **Estreante**: a primeira confirmação registrada da pessoa caiu no recorte (somável por evento).
- **Foram a 2+ eventos**: pessoas com confirmação em pelo menos dois eventos distintos no recorte ÷ pessoas únicas.
- **Retenção N dias**: entre quem estreou há pelo menos N dias da data de corte, a parcela com outro evento em até N dias depois da estreia.
- **Coorte**: pessoas agrupadas pelo mês da estreia; cada célula = parcela da coorte com confirmação naquele mês.
- **Voltaram depois** (por evento): parcela das pessoas do evento com confirmação em algum evento posterior.
- **Pessoas na base**: união de `cadastro_site` com quem já fez check-in (há CPFs com check-in que nunca passaram pelo cadastro).
- **Sábados**: evento de tipo `corrida` num sábado. O resto é "outros dias e formatos".

Tratamento:
- Ficam fora: eventos que ainda não aconteceram, registros sem CPF válido, linhas transferidas e repetidas no mesmo evento.
- O histórico começa em 07/03/2026. Quem já corria antes aparece como estreante em março.
- Contagens abaixo de 5 viram "menos de 5"; retenção e coortes exigem 30 pessoas elegíveis.
- No intervalo personalizado do painel, só aparece o que é somável por evento (confirmações, eventos, média, estreantes). Pessoas únicas e recorrência usam os períodos padrão, que são pré-calculados.

Se um dia o retrato não puder vir do banco, gerar um JSON com `"fonte": "demonstrativo"`: o painel passa a mostrar o selo amarelo "Dados demonstrativos".

## Pendências

- **Cases sem registro**: Big Box, Liquidz e Track&Field foram citados no briefing, mas não achei data, formato nem evidência no projeto. Para incluir, acrescentar em `_data/cases.ts`.
- **Michelob Ultra** aparece como "Projeto em preparação" e o Move Fest como convite. Confirmar se pode ser citado publicamente antes de circular o link.
- **Fontes da marca**: Parabolica e Elizeth não têm woff2 no projeto; a apresentação usa Archivo (títulos) e Geist (texto). Trocar em `layout.tsx` quando chegarem.
- **Imagens**: a pedido, a apresentação não usa fotos. Se um dia entrarem, os pontos naturais são a abertura (slide 1), o slide 2 (sábado) e a chamada final.
