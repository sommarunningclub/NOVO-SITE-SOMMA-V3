# Sorteio: filtro por lista VIP Na Praia

Data: 2026-07-31
Contexto: módulo Sorteio do painel `/insider-conect`

## Problema

O sorteador atual escolhe ganhadores entre os check-ins de um evento, com filtros de
sexo, pelotão, dia do check-in e validação. A operação precisa cruzar esse público com
a tabela `napraia_lista_vip` (530 registros do site Na Praia) — por exemplo: sortear
apenas entre quem tem check-in validado **e** está na lista VIP.

## Decisão

Um filtro adicional, não uma nova fonte de participantes. A base do sorteio continua
sendo `checkins` do evento selecionado, o que preserva sem nenhuma migration o
histórico (`sorteios` / `sorteio_ganhadores`), o confirmar/ausente e o resorteio —
`sorteio_ganhadores.checkin_id` continua apontando para um check-in real.

Sortear pessoas da lista VIP que não têm check-in está **fora do escopo**: exigiria
tornar `checkin_id`/`evento_id` opcionais em tabelas de produção.

## Chave de cruzamento

CPF, e somente CPF. Comparação por dígitos (`replace(/\D/g, '')`) dos dois lados: a
lista VIP guarda formatado (`058.802.051-69`), os check-ins variam. Os 530 registros
da lista têm CPF com 11 dígitos, então a cobertura é total. E-mail foi descartado
como chave secundária para evitar falso positivo por e-mail compartilhado.

## Componentes

**`lib/sorteio/vip.ts`** (novo) — isola o cruzamento:
- `carregarCpfsVip(supabase)`: lê `napraia_lista_vip` paginando de 1000 em 1000
  (o limite padrão do PostgREST) e devolve um `Set` de CPFs normalizados.
- `ehVip(cpf, cpfsVip)`: predicado por registro.
- `aplicarFiltroVip(lista, filtro, cpfsVip)`: `'todos'` devolve a lista intacta;
  `'somente'` mantém quem está na lista; `'excluir'` mantém quem não está.
- `normalizarFiltroVip(valor)`: sanitiza a entrada vinda de query string / body.

**Rotas** — as três que montam pool de participantes passam a aceitar o filtro e a
aplicá-lo em memória, depois da consulta ao Supabase:
- `GET /api/sorteio/participantes` — parâmetro `vip`; sempre carrega os CPFs VIP para
  poder devolver `stats.vips` (quantos do conjunto atual são VIP).
- `POST /api/sorteio/sortear` — `filtros.vip`; o valor é gravado em
  `filtros_aplicados`, logo o critério fica registrado no histórico.
- `POST /api/sorteio/ganhadores/[id]/resorteio` — relê `filtros_aplicados.vip` do
  sorteio original, para que o substituto respeite o mesmo critério.

Falha ao ler `napraia_lista_vip` retorna 500. É o mesmo banco das demais consultas do
sorteio; degradar em silêncio produziria um sorteio com público errado.

**UI (`app/insider-conect/page.tsx`, `ModuloSorteio`)** — um select "Lista VIP · Na
Praia" no bloco de filtros (Todos / Somente VIPs / Excluir VIPs), somado ao card de
estatísticas com o contador de VIPs. O filtro reseta ao trocar de evento, como os
demais.

**`descricaoFiltros`** (`lib/sorteio/utils.ts`) — passa a descrever o critério VIP no
histórico ("Somente VIPs" / "Sem VIPs").

## Fluxo

1. Insider escolhe o evento e os filtros, incluindo o VIP.
2. `/api/sorteio/participantes` devolve o pool já filtrado + estatísticas; a prévia e
   o botão de sortear refletem esse número.
3. Ao sortear, a mesma combinação de filtros é reaplicada no servidor — a UI não
   envia a lista de participantes, apenas os critérios.
4. Ganhadores, hash de auditoria e histórico seguem o fluxo atual.

## Verificação

- `npx tsc --noEmit` e `npm run build`.
- Conferência contra dados reais: para o evento "Somma Club — Edição #03 de Março",
  326 check-ins, 60 VIPs, 101 validados e 20 validados-e-VIP. Os números da UI com
  `Validação: validados` + `VIP: somente` devem bater com 20.
