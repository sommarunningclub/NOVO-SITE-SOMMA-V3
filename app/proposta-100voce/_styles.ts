/* CSS escopado em .erx — não vaza para o resto do site. */
export const DECK_CSS = `
body:has(.erx){ background:#0A0A0A; overscroll-behavior:none; }

.erx{
  --ink:#0A0A0A;
  --ink-2:#121110;
  --ink-3:#191716;
  --paper:#F4F2EF;
  --muted:#8C8681;
  --orange:#FF2C04;
  --orange-soft:rgba(255,44,4,.14);
  --line:rgba(255,255,255,.11);
  --line-2:rgba(255,255,255,.06);
  --top-h:58px;
  --bot-h:78px;
  background:var(--ink);
  color:var(--paper);
  -webkit-font-smoothing:antialiased;
  -webkit-tap-highlight-color:transparent;
  font-family:var(--font-geist-sans),system-ui,-apple-system,sans-serif;
}
/* No desktop a barra some, mas o lockup fixo do rodapé continua ocupando
   espaço — o slide precisa reservar essa faixa para não colidir. */
@media (min-width:768px){ .erx{ --top-h:0px; --bot-h:60px; } }

.erx-display{ font-family:var(--font-display),"Barlow Condensed",Impact,sans-serif; }

/* ── scroller ──────────────────────────────────────────────────────────── */
.erx-scroller{
  height:100dvh;
  overflow-y:auto;
  overflow-x:hidden;
  scroll-snap-type:y proximity;
  overscroll-behavior-y:contain;
  -webkit-overflow-scrolling:touch;
  scrollbar-width:none;
  -ms-overflow-style:none;
}
.erx-scroller::-webkit-scrollbar{ display:none; }
@media (min-width:768px){ .erx-scroller{ scroll-snap-type:y mandatory; } }

.erx-slide{
  position:relative;
  min-height:100dvh;
  scroll-snap-align:start;
  scroll-snap-stop:always;
  display:flex;
  flex-direction:column;
  justify-content:center;
  isolation:isolate;
  overflow:hidden;
}
.erx-pad{
  width:100%;
  max-width:1440px;
  margin-inline:auto;
  padding-inline:clamp(1.25rem,5vw,5.5rem);
  padding-top:calc(var(--top-h) + clamp(1.75rem,4vh,3.5rem));
  padding-bottom:calc(var(--bot-h) + clamp(1.75rem,4vh,3.5rem));
}

/* Notebooks de tela curta (720p e afins): comprime o respiro vertical para
   que cada slide continue cabendo em uma tela cheia. */
@media (min-width:768px) and (max-height:820px){
  .erx{ --bot-h:44px; }
  .erx-pad{
    padding-top:clamp(1rem,2.6vh,2rem);
    padding-bottom:calc(var(--bot-h) + clamp(.75rem,1.8vh,1.5rem));
  }
  /* A lista de 9 itens do Energy Run é o que define a altura do slide 05. */
  .erx .erx-card ul > * + *{ margin-top:.3rem !important; }
  .erx .erx-card li{ line-height:1.4; }
}

/* ── estados iniciais da animação (GSAP assume a partir daqui) ─────────── */
.erx [data-a="mask"]{ transform:translateY(108%); will-change:transform; }
.erx [data-a="up"]{ opacity:0; transform:translateY(22px); will-change:transform,opacity; }
.erx [data-a="fade"]{ opacity:0; }
.erx [data-a="grow"]{ transform:scaleX(0); transform-origin:left center; }
.erx [data-a="img"]{ opacity:0; transform:scale(1.08); }

/* ── textura ───────────────────────────────────────────────────────────── */
.erx-grain{
  position:fixed; inset:0; z-index:70; pointer-events:none;
  opacity:.05; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>");
}
.erx-hair{
  background-image:linear-gradient(to right,var(--line-2) 1px,transparent 1px);
  background-size:clamp(48px,7vw,104px) 100%;
}

/* ── marca d'água tipográfica ─────────────────────────────────────────── */
.erx-ghost{
  position:absolute; pointer-events:none; user-select:none;
  font-family:var(--font-display),"Barlow Condensed",sans-serif;
  font-weight:700; letter-spacing:-.04em; line-height:.78;
  color:transparent;
  -webkit-text-stroke:1px rgba(255,255,255,.055);
}

/* ── pace ticks (movimento) ───────────────────────────────────────────── */
.erx-pace{
  height:100%;
  background-image:repeating-linear-gradient(90deg,var(--orange) 0 2px,transparent 2px 22px);
  animation:erx-pace-move 1.4s linear infinite;
}
@keyframes erx-pace-move{ to{ background-position-x:-22px; } }

.erx-pulse{ animation:erx-pulse 2.2s ease-in-out infinite; }
@keyframes erx-pulse{ 0%,100%{opacity:.35} 50%{opacity:1} }

/* ── barra de progresso (topo mobile) ─────────────────────────────────── */
.erx-seg{ height:2px; background:rgba(255,255,255,.16); overflow:hidden; border-radius:2px; }
.erx-seg > i{ display:block; height:100%; background:var(--orange); transform-origin:left; transition:transform .45s cubic-bezier(.16,1,.3,1); }

/* ── cartões ──────────────────────────────────────────────────────────── */
.erx-card{
  position:relative;
  background:linear-gradient(180deg,var(--ink-2),rgba(10,10,10,.6));
  border:1px solid var(--line);
  transition:border-color .35s ease,transform .35s cubic-bezier(.16,1,.3,1),background .35s ease;
}
@media (hover:hover){ .erx-card:hover{ border-color:rgba(255,255,255,.24); } }
.erx-card--hero{
  background:linear-gradient(180deg,rgba(255,44,4,.10),rgba(10,10,10,.9) 46%);
  border-color:rgba(255,44,4,.55);
  box-shadow:0 0 0 1px rgba(255,44,4,.14),0 40px 90px -50px rgba(255,44,4,.75);
}
@media (hover:hover){ .erx-card--hero:hover{ border-color:var(--orange); } }

/* ── botões ───────────────────────────────────────────────────────────── */
.erx-btn{
  transition:background-color .3s ease,color .3s ease,border-color .3s ease,transform .3s cubic-bezier(.16,1,.3,1);
}
.erx-btn:active{ transform:scale(.96); }

.erx-safe-t{ padding-top:env(safe-area-inset-top); }
.erx-safe-b{ padding-bottom:env(safe-area-inset-bottom); }

.erx :focus-visible{ outline:2px solid var(--orange); outline-offset:3px; border-radius:2px; }

@media (prefers-reduced-motion:reduce){
  .erx *{ animation-duration:.01ms !important; animation-iteration-count:1 !important; }
  .erx-scroller{ scroll-behavior:auto !important; }
}
`;
