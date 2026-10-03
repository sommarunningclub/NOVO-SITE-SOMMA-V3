# SOMMA Club Store · movimento

GSAP 3 (`gsap`, `ScrollTrigger`, `SplitText`, `Flip`) com `useGSAP`
(`@gsap/react`). Tudo passa por `app/loja/_motion.ts`.

Princípio: movimento curto e com função. Ele mostra hierarquia e resposta, não
enfeita. A página tem que ficar boa com tudo desligado.

## Tokens

| | CSS | JS (`_motion.ts`) |
|---|---|---|
| rápido | `--lj-t-fast` 160ms | `DUR.fast` |
| base | `--lj-t-base` 320ms | `DUR.base` |
| lento | `--lj-t-slow` 640ms | `DUR.slow` |
| revelação | | `DUR.reveal` 0,9s |
| curva | `--lj-ease` | `EASE.out` (`expo.out`) |

Mudou num lado, muda no outro.

## Como declarar

As seções são Server Components e só declaram o movimento no HTML. Quem liga é
o `<MotionRoot />`, que vem dentro de `<Page>`.

```tsx
<h2 className="lj-display" data-reveal="lines"><Lines lines={linhas} /></h2>
<h2 className="lj-slab" data-reveal="split">{titulo}</h2>
<div className="..." data-reveal="image" data-parallax="8">...</div>
<p data-reveal="up" data-delay="0.3">...</p>
```

| `data-reveal` | Efeito |
|---|---|
| `lines` | cada `.lj-line` sobe de dentro da máscara (headline em linhas fixas) |
| `split` | o mesmo, com o `SplitText` achando as linhas reais na largura da tela |
| `image` | a foto abre por recorte, de baixo para cima |
| `up` | bloco sobe 20px |

`data-parallax="N"` move a foto N% dentro da moldura durante o scroll.

Cada revelação dispara uma vez, quando o elemento entra na tela, e o gatilho é
destruído.

## Abertura: a arte em chamas e o papel que queima

`_components/home/HeroFire.tsx` decide quando desenhar; os shaders moram em
`_components/home/fire-gl.ts`. É o único movimento da loja fora do GSAP: WebGL
puro, sem biblioteca, em dois canvas.

### A arte

1. **Ignição (1,5s, uma vez)**: o fogo sobe de baixo para cima e acende a arte.
   A frente é irregular (ruído) e incandescente em branco; esfria para o
   laranja atrás dela. A frase e o botão entram em seguida.
2. **Chama viva (laço)**: a forma treme com três oitavas de ruído subindo, como
   ar quente. O traço fino das chamas dança; a letra cheia quase não se mexe.
   Quem separa um do outro é a versão borrada da própria forma (mipmap alto),
   que mede a espessura local.

### O papel

A hero inteira é uma folha de papel preto. Ao rolar, ela queima de baixo para
cima e deixa aparecer a página que está embaixo.

- **Como funciona**: a hero fica parada no topo (`position: sticky`, no CSS) e
  o resto da página, dentro de `.lj-under`, sobe por cima dela na rolagem
  nativa. Um canvas cobrindo a hero pinta com a cor de fundo da página tudo o
  que o fogo já levou. O fogo só lê quanto da hero já foi coberto; ninguém
  mexe na rolagem.
- **A frente**: anda sempre um pouco adiante da seção que sobe (`LEAD`), por
  isso a borda reta dela nunca aparece. A forma vem de um ruído parado no
  papel (papel queimado não volta) com um termo em módulo, que dá o desenho de
  papel queimado: o fogo avança em arcos e o papel sobra em pontas. Junto da
  base a frente é quase reta, porque o papel pega fogo pela borda.
- **O que se vê**: faixa de carvão, brasa laranja com trechos brancos, cinza se
  desfazendo atrás e fagulhas subindo. Só cores da paleta: laranja, branco,
  preto e o off-white da página, todas lidas do CSS.
- **Calor**: rolando, o fogo cresce na hora; parado no meio do caminho, esfria
  até virar brasa. Rolando rápido para baixo a frente se adianta mais, para
  compensar o quadro de atraso entre a rolagem e o canvas.
- **Voltar para cima** desfaz a queima. É o preço de ser comandado pela rolagem.

Para a queima funcionar, tudo o que vem depois da hero precisa estar dentro de
`<div className="lj-under">` (ver `app/loja/page.tsx`). É esse bloco que sobe
por cima do papel, e é a cor de fundo dele que o canvas pinta.

### Garantias

- O `<img>` é a base: é o arquivo que o navegador baixa (o canvas reaproveita o
  mesmo elemento como textura), é o texto alternativo e é o que aparece sem
  WebGL, com movimento reduzido ou se algo falhar. Se o script não chegar em
  3s, a imagem parada aparece sozinha.
- O texto e o botão da hero já estão no HTML. O LCP é texto, não depende da arte.
- Custo: no topo só a arte desenha; queimando, os dois canvas; passou da hero,
  nenhum. Com a aba escondida, zero quadros. O shader do papel só faz conta na
  faixa perto da frente.
- Resolução limitada: 2x na arte, 1,5x no papel (que cobre a hero inteira).
- Hero mais alta que a tela (celular deitado, zoom de texto): ela rola até a
  base aparecer e só então para e queima. O botão nunca fica fora de alcance.
- Header: fica sólido enquanto o fogo passa por baixo dele e só volta a ser
  transparente sobre papel inteiro (`data-header-until`, lido em `Header.tsx`).
- Teclado: foco no botão da hero com a página rolada (Shift+Tab) leva de volta
  ao papel inteiro. Com o fogo já no botão, ele deixa de receber clique.
- Sem WebGL: a hero continua parada e a página sobe por cima, de borda reta.
  Sem JavaScript ou com movimento reduzido: a hero rola como qualquer seção.

### Para ajustar

| O quê | Onde |
|---|---|
| duração da ignição | `IGNITION_S` em `HeroFire.tsx` |
| quanto a arte treme, e a velocidade | `amp` e os multiplicadores de `uTime` no shader da arte |
| dianteira do fogo sobre a seção | `LEAD` em `HeroFire.tsx` (maior que `PAPER_AMP` + cinza) |
| brasa com a rolagem parada | `EMBER` em `HeroFire.tsx` |
| quão irregular é a borda | `PAPER_AMP` e `relief()` em `fire-gl.ts` |
| cinza, fagulhas, alcance da luz | `PAPER_ASH`, `PAPER_SPARKS`, `PAPER_GLOW` em `fire-gl.ts` |

## Regras

- **`<Page>` é obrigatório** em toda página. O `MotionRoot` fica dentro dela, e
  não no layout, porque o GSAP só pode mexer no HTML depois que a página
  hidratou. Fora disso o React descarta o HTML do servidor.
- **Não use `data-reveal` dentro de `<Suspense>` aninhado**, pelo mesmo motivo.
- O que está na hero (`[data-hero]`) entra na abertura, sem esperar o scroll.
- Scroll é nativo. Nada de smooth scroll nem de sequestro de rolagem. O
  lookbook rola de verdade (dedo, trackpad, teclado, arrastar) e só deriva
  sozinho até o primeiro toque da pessoa. A hero parada no topo é `sticky` do
  CSS: a página anda no passo de sempre, só a hero não sobe junto.
- Nenhuma animação muda o tamanho de nada no fluxo: só `transform`,
  `clip-path` e `opacity`. Sem layout shift.
- `Flip` só é baixado na página de coleção, e fora do caminho crítico.
- Limpeza: `useGSAP` reverte timelines e `ScrollTrigger` ao desmontar ou trocar
  de rota. `ScrollTrigger.refresh()` roda uma vez, quando as fontes assentam.

## Movimento reduzido

Com `prefers-reduced-motion: reduce`:

- nenhuma revelação, parallax ou deriva é registrada; o conteúdo aparece direto
- o `Flip` da grade é pulado
- a arte da abertura fica parada, a hero rola junto com a página e nada queima
- as transições de CSS caem para quase zero

O CSS só esconde o que vai ser revelado quando há JavaScript **e** a pessoa
aceita movimento (`@media (prefers-reduced-motion: no-preference) and
(scripting: enabled)`). Se o script falhar, uma animação de segurança devolve o
conteúdo em 2,5s.

## Onde cada tipo está

| Tipo | Onde |
|---|---|
| abertura | arte tribal em chamas (`HeroFire`) |
| papel queimando | a hero, comandada pela rolagem (`HeroFire`) |
| 01 revelação tipográfica | frase da hero, manifesto, clube, archive, Drop Access, nome do drop |
| 02 revelação de imagem | campanha do drop, clube, hero da coleção |
| 03 parallax editorial | campanha do drop, clube |
| 05 trilho com deriva | lookbook da home (`LookbookRail`) |
| 06 grade com Flip | filtros, ordenação e densidade (`CollectionView`) |
| 07 resposta do carrinho | a sacola abre ao adicionar; o contador muda na hora |
| interface | botão (preenchimento e seta), header que some e volta, painéis |

Ainda não feitos: 04 (storytelling com pin) e 08 (transição entre coleção e
produto). Entram quando houver conteúdo de campanha que justifique.
