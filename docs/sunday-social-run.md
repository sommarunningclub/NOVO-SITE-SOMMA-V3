# SUNDAY SOCIAL RUN — guia da landing page

**Rota:** `/sunday-social-run`
**Evento:** SOMMA Club × Santa Monica Gastrobar, powered by Hype On Club
**Config única:** [`lib/sunday-social-run/event.config.ts`](../lib/sunday-social-run/event.config.ts)

Nenhum componente inventa dado. Tudo que muda — preço, capacidade, horários,
benefícios, parceiros, copy — vive no config. O que ainda não foi definido está
`null`, e a interface mostra o estado real ("rota oficial em breve", "a
confirmar") em vez de improvisar.

## Ligar a venda

A venda é exclusiva da Hype On Club e o link entra por variável de ambiente, sem
deploy de código:

```
NEXT_PUBLIC_HYPE_TICKET_URL=https://…
```

Sem essa variável a página assume o estado de pré-venda: os CTAs levam à seção
do ingresso e o botão de lá aponta para o Instagram do SOMMA, onde a venda vai
ser anunciada. Com a variável preenchida, todos os CTAs passam a abrir a Hype em
nova aba e disparam `outbound_hype_click`.

## O que preencher quando fechar

| Campo no config  | Hoje    | O que acontece ao preencher                                    |
| ---------------- | ------- | -------------------------------------------------------------- |
| `EVENT_DATE`     | `null`  | A data cheia aparece em hero, ingresso e OG, e o JSON-LD passa a publicar `SportsEvent` com `startDate` |
| `EVENT.local.endereco` | `null` | Entra no `PostalAddress` dos dados estruturados           |
| `PARTNER_SLOTS[].marca` | `null` | O bloco da categoria troca "A CONFIRMAR" pelo nome da marca |
| `BENEFICIOS` → `camiseta.ativo` | `false` | A camiseta entra no mosaico de entregas do ingresso |
| `BRANDS[].logo`  | só SOMMA | Santa Monica e Hype On passam de wordmark tipográfico para SVG |

Os perfis de `PERFIS_DEMO` são **ilustrativos** e a própria página diz isso nas
cenas onde aparecem. Não são inscrições, e não devem virar "confirmados" sem
dado real vindo de API.

## Mapa do percurso

`_components/RunRouteMap.tsx` desenha o traçado e faz o pelotão correr por cima
dele, com a câmera acompanhando. Os pontos vêm de `lib/sunday-social-run/rota.ts`
— geometria real das vias, gerada uma única vez pela Directions API e congelada
no repo, então a página **não** chama a API a cada visita (só carrega o Maps JS
com `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). O percurso é ida e volta pelo Eixão,
porque domingo é Eixão do Lazer e a pista fica fechada para carros. Sem chave, a
seção mostra um aviso e o resto do bloco continua de pé.

## Pelotões

A social run sai em três pelotões — 5, 6 e 8 km (`ROUTE_DISTANCES`) — que largam
juntos do Santa Monica e voltam para o mesmo brunch. A divisão é por distância,
não por ritmo. O traçado exato continua pendente de homologação, e é só isso que
a seção de percurso assume como "em breve".

## Sistema visual

O conceito é **a manhã como narrativa**: a página não é dividida em blocos de
cor, ela muda de luz. Cinco camadas fixas (`_components/LightStage.tsx`) fazem
cross-fade conforme cada seção entra em tela — creme da alvorada, laranja do
asfalto, preto e dourado do digital, céu do brunch, laranja pleno na conversão.
A luz vigente também vira atributo no `<html>`, e header e CTA fixo trocam de tom
a partir dele.

O elemento gráfico do evento é **a linha** (`_components/SignatureLine.tsx`): um
traço só que se transforma ao longo do scroll — rota de rua, gráfico de pace,
encontro de duas pontas, waveform do DJ. É o mesmo desenho contando
RUN → CONNECT → STAY.

**Tipografia:** Space Grotesk nos títulos, Figtree no texto e Space Mono nos
números. Limpa, direta e com um pouco de graça no desenho das letras. Todas open
source, carregadas por `next/font`.

**Voz:** português, frases curtas, sem jargão de agência. Os nomes das dinâmicas
são autoexplicativos ("Mesmo pace", "Troca de Strava", "O after") e a seção
**Como funciona** resolve em quatro passos o que a pessoa precisa fazer — é o
bloco mais didático da página e deve continuar assim.

**Dourado:** `--gold` em `evento.css` é token **do evento**, não a cor
institucional da Hype On. Quando o token oficial chegar, troque só ali.

## Motion

GSAP + ScrollTrigger, todo motion dentro de `gsap.context` com cleanup
(`_motion.ts`). Regras que valem para a página inteira:

- `prefers-reduced-motion` desliga o motion e **nada fica invisível** — o CSS
  entrega tudo visível por padrão; o GSAP é quem esconde na hora de animar;
- pin só no desktop (a cena do Pace Match), nunca em tela de toque;
- parallax e blur pesado caem em aparelho modesto (`isLowPower()`);
- rolagem suave (Lenis) só onde há mouse; no touch, scroll nativo.

## Analytics

`lib/sunday-social-run/analytics.ts` empurra para o `dataLayer`/GA4/Meta já
existentes no site — nenhuma plataforma nova. Eventos: `hero_cta_click`,
`ticket_cta_click`, `outbound_hype_click`, `view_experience`, e as views de
seção (`hype_section_view`, `pace_match_view`, `timeline_view`,
`after_pace_view`, `ticket_section_view`).

## Fotografia

Tudo é foto real: o acervo do SOMMA (`public/somma`) para a corrida e a
comunidade, e as imagens oficiais do Santa Monica em
`public/sunday-social-run/` — fachada, salão, mesas sob as árvores e a cabine do
DJ. O hero usa três delas para contar a manhã inteira (start → after pace →
closing), e o After Pace usa as outras quatro. Não há nenhum placeholder de
imagem na página.
