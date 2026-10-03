# SOMMA Club Store · sistema visual

Tudo o que é visual na loja mora em `app/loja/loja.css`, preso à classe `.loja`
(nada vaza para o resto do site). As classes têm prefixo `lj-`. A referência de
marca é o MIV 2026, na pasta `Nova Marca Somma Club 2026`.

## Cor

| Token | Valor | Uso |
|---|---|---|
| `--somma-black` | `#141414` | fundos de marca, texto, botão principal |
| `--somma-orange` | `#FF4800` | ação, ponto final das headlines, selos, o bloco Drop Access |
| `--somma-offwhite` | `#F7F7F7` | fundo das páginas de compra |
| `--somma-white` | `#FFFFFF` | texto sobre preto, fundo do lookbook |

Regras:

- Não existe paleta auxiliar. Os tons de apoio (`--lj-ink-soft`, `--lj-line`,
  `--lj-chalk-soft`) são as cores oficiais com opacidade.
- Texto sobre laranja é **preto** (5,4:1). Branco sobre laranja só passa em
  título grande (3,4:1), então botão laranja tem rótulo preto.
- Laranja em área grande aparece uma vez por página (Drop Access). No resto é
  detalhe: ponto final, símbolo, selo, estado ativo.
- O arquivo vetorial da marca usa `#FF2C00`; os logos da loja foram gerados com
  `#FF4800`, que é o valor do MIV e o token oficial digital.

## Tipografia

| Papel | Fonte do MIV | Substituta em uso | Variável |
|---|---|---|---|
| Principal | Parabolica | Inter Tight | `--lj-font-sans` |
| Apoio | Elizeth | Zilla Slab | `--lj-font-slab` |

**As fontes oficiais ainda não estão no projeto.** Os arquivos licenciados de
Parabolica e Elizeth não foram encontrados; as substitutas são do Google Fonts e
foram escolhidas pela proximidade de desenho. Para trocar:

1. Colocar os `.woff2` licenciados em `app/loja/_fonts/`.
2. Em `app/loja/layout.tsx`, declarar as duas com `next/font/local` expondo
   `--font-parabolica` e `--font-elizeth`.
3. Nada mais: `loja.css` já dá prioridade a essas variáveis.

Classes:

- `.lj-display` (+ `--xl`, `--l`, `--m`, `--s`): Parabolica em caixa alta, peso
  800, entrelinha 0,84 a 0,95, espaçamento −0,045em. Headlines, nomes de
  produto, categorias, números.
- `.lj-slab` (+ `--xl`, `--m`): Elizeth. Nome de drop e momentos de narrativa.
  Nunca vira fonte de interface.
- `.lj-label`: rótulo de interface, 12px, caixa alta, +0,08em.
- `.lj-annot`: anotação editorial em Elizeth, caixa alta, +0,1em. É a voz da
  estampa interna das peças.
- `.lj-dot`: o ponto final laranja, tirado do logo `somma.`

## Anotações editoriais

As linhas abaixo **já existem estampadas nas peças** e por isso são de uso livre
na loja:

- `15°48'06.8"S 47°54'14.5"W` (coordenada do ponto de encontro)
- `TOGETHER ON SATURDAYS`
- `SOMMA RUNNING CLUB`

Códigos: `061.00N` numera as peças dentro de um drop (`pieceCode` em
`_lib/format.ts`); `DROP 001` identifica o drop. São derivados da ordem da
coleção, não são SKU.

## Logos

Versões oficiais em `public/loja/brand/`, extraídas do vetor da marca, uma por
arquivo, nas cinco combinações do MIV (`cor-claro`, `cor-escuro`,
`sobre-laranja`, `preto`, `branco`).

| Lugar | Versão |
|---|---|
| Header | horizontal (`somma.`), inline em `brand/Logo.tsx` |
| Menu do celular e rodapé | selo |
| Rótulo de seção, carregando | símbolo de círculos |
| Favicon, etiqueta | monograma `S.` |
| Lançamento, institucional | assinatura |

O logo do header é SVG inline porque troca de cor conforme o fundo. O texto usa
`currentColor` e o símbolo usa `--lj-logo-accent`, o que só produz combinações
previstas no MIV. Regras do manual que o código respeita: não distorcer, não
rotacionar, não recortar, não aplicar sombra ou efeito, não usar fora da paleta.

## Arte tribal (hero)

A abertura da loja é a arte "SOMMA RUNNING CLUB" em letras de fogo, a mesma da
Regata Machão Fire Pack. A origem é `TRIBAL.pdf` (acervo da marca, 2000×2000
px, imagem de Photoshop sem vetor).

- Arquivos: `public/loja/brand/tribal-1024` e `tribal-2048`, em `.avif` e
  `.webp`, com fundo transparente.
- Como foram feitos: a máscara de transparência foi extraída direto do PDF na
  resolução original e recortada num quadrado com 2% de folga (as chamas tremem
  para fora do contorno). Os dois tamanhos são potência de 2 de propósito: a
  animação precisa de mipmap.
- A cor não está no arquivo que vai para a tela animada: o shader lê só a forma
  e pinta com `--somma-orange`. Trocar o token troca a arte.
- A arte é ilustração, não logo: pode animar. Os logos oficiais continuam sem
  efeito nenhum.
- Ao rolar, a hero queima como papel (ver `MOTION_SYSTEM.md`). O fogo usa só
  a paleta: brasa em `--somma-orange`, o ponto mais quente em branco, carvão e
  cinza em `--somma-black`, e por baixo aparece o `--somma-offwhite` da página.

## Forma

- Raio zero em tudo. O único círculo da interface é o do símbolo (bolinhas de
  cor, densidade da grade, estoque).
- Sem sombra, sem card, sem gradiente decorativo. Separação é linha de 1px.
- Produto: foto 4:5 sem moldura, nome, preço, cor e estado. Mais nada.
- Botão (`.lj-btn`): retangular, 56px, rótulo em caixa alta, seta que anda e
  preenchimento que entra da esquerda no hover. Variantes `--accent` (laranja),
  `--ghost` (contorno), `--block`, `--lg`, `--sm`.
- Alvo de toque mínimo de 44px (`--lj-tap`).

## Imagem

| Proporção | Uso |
|---|---|
| 4:5 | produto (grade, galeria no celular) |
| 2:3 ou 3:4 | campanha |
| livre | lookbook e galeria no desktop: cada foto mantém a sua proporção |

Foto de produto vem da CDN da Shopify e é redimensionada por ela (`ShopImg`).
Peça esgotada fica em preto e branco na grade.

## Responsivo

Mobile primeiro. Quebras: `48rem` (tablet) e `60rem` (desktop com navegação
completa e hover). Tamanhos de fonte e espaços usam `clamp()`; não há layout
fixo em 375 ou 1440.

## Estados que vêm de dado real

Nada de escassez inventada. `Novo` e `Limited` são o metafield `somma.badge`;
`Sold out` e `Últimas unidades` saem do estoque da Shopify (`stockState`).
Bloco sem conteúdo na Shopify simplesmente não aparece.
