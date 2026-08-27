"use client";

import { PREMIO } from "@/lib/o-longao/copy";
import { PREMIACAO, PREMIACAO_TOTAL } from "@/lib/o-longao/config";
import { EASE, countUp, gsap, maskReveal, riseIn, useScope } from "../_motion";

/**
 * Premiação: o valor total sobe no placar como distância acumulada.
 *
 * O número gigante conta de zero até o total (derivado do config, nunca
 * digitado aqui) em âmbar de cronometragem; abaixo, as duas categorias em
 * linhas de leaderboard, com o 1º lugar aceso como líder. A faixa TOTAL
 * fecha sobre a rampa de timing.
 */

// "EM PREMIAÇÃO" sem duplicar literal: é o título do copy menos o valor.
const TITULO_RESTO = PREMIO.titulo.replace(PREMIO.total, "").trim();

// Estado servido pelo SSR: se o JS não rodar, o valor final já está na tela.
const TOTAL_FORMATADO = PREMIACAO_TOTAL.toLocaleString("pt-BR");

export function Premiacao() {
  const root = useScope<HTMLElement>(({ root }) => {
    const cabeca = root.querySelector(".prm-cabeca") ?? root;
    maskReveal(root.querySelectorAll(".prm-titulo > *"), { trigger: cabeca, start: "top 76%" });

    // countUp não tem prefixo: o "R$" fica num span estático ao lado.
    const contador = root.querySelector<HTMLElement>(".prm-contador");
    if (contador) countUp(contador, PREMIACAO_TOTAL, { decimals: 0, trigger: cabeca });

    riseIn(root.querySelectorAll(".prm-sub"), { trigger: cabeca, start: "top 72%" });

    const grid = root.querySelector(".prm-grid") ?? root;
    riseIn(root.querySelectorAll(".prm-col"), { trigger: grid, start: "top 80%", stagger: 0.14 });
    riseIn(root.querySelectorAll(".prm-surpresa"), { trigger: grid, start: "top 68%" });
    riseIn(root.querySelectorAll(".prm-row"), { trigger: grid, start: "top 76%", stagger: 0.06, y: 22 });

    const faixa = root.querySelector(".prm-total") ?? root;
    riseIn(faixa, { trigger: faixa, start: "top 85%" });
    gsap.fromTo(
      root.querySelectorAll(".prm-total-line"),
      { scaleX: 0, transformOrigin: "left center" },
      {
        scaleX: 1,
        duration: 1.2,
        ease: EASE.drive,
        scrollTrigger: { trigger: faixa, start: "top 85%", once: true },
      }
    );

    riseIn(root.querySelectorAll(".prm-nota"), { trigger: faixa, start: "top 85%" });
  });

  return (
    <section
      ref={root}
      id="premiacao"
      className="lgo-section relative scroll-mt-16 overflow-hidden"
      aria-labelledby="premiacao-titulo"
    >
      {/* Halo âmbar discreto: luz de madrugada, não de vitrine. */}
      <div
        className="lgo-glow right-[-14%] top-[6%] h-[52vh] w-[52vh]"
        style={{ background: "var(--sinal)", opacity: 0.14 }}
        aria-hidden
      />

      <div className="lgo-wrap relative">
        <div className="prm-cabeca">
          <h2 id="premiacao-titulo">
            <span className="lgo-mask prm-titulo">
              <span className="flex flex-wrap items-baseline gap-x-3">
                <span className="lgo-num text-[clamp(1.4rem,4vw,2.6rem)] font-bold text-[color:var(--sinal)]">
                  {PREMIACAO.moeda}
                </span>
                <span className="prm-contador lgo-num text-[clamp(4rem,15vw,11rem)] font-bold leading-none tracking-[-0.04em] text-[color:var(--sinal)]">
                  {TOTAL_FORMATADO}
                </span>
              </span>
            </span>
            <span className="lgo-mask prm-titulo mt-3">
              <span className="lgo-display block text-[clamp(1.6rem,5.5vw,3.4rem)]">
                {TITULO_RESTO}
              </span>
            </span>
          </h2>

          <p className="prm-sub mt-6 max-w-[44ch] text-[clamp(1rem,2.6vw,1.2rem)] leading-relaxed text-[color:rgba(242,240,236,0.72)]">
            {PREMIO.subtitulo}
          </p>
        </div>

        {/*
          Uma coluna por categoria, e o valor do 1º lugar em corpo grande dentro
          de cada uma. É essa repetição que desfaz a leitura errada: quem bate o
          olho vê 20 mil no masculino E 20 mil no feminino, em vez de imaginar
          um bolo único sendo dividido entre as duas.
        */}
        <div className="prm-grid mt-12 grid gap-4 md:mt-16 md:grid-cols-2 md:gap-6">
          {PREMIO.categorias.map((categoria) => (
            <div key={categoria} className="prm-col lgo-panel p-6 md:p-8">
              <h3 className="lgo-display text-[clamp(1.5rem,4.5vw,2.2rem)]">{categoria}</h3>

              <p className="lgo-label mt-5 text-[color:rgba(242,240,236,0.45)]">
                CREW CAMPEÃ LEVA
              </p>
              <p className="lgo-num mt-1.5 text-[clamp(2.4rem,8vw,3.6rem)] font-bold leading-none tracking-[-0.03em] text-[color:var(--sinal)]">
                {PREMIO.distribuicao[0]?.valor}
              </p>

              <ul className="mt-6">
                {PREMIO.distribuicao.slice(1).map((linha) => (
                  <li
                    key={linha.posicao}
                    className="lgo-row grid-cols-[auto_1fr] last:border-b-0"
                  >
                    <span className="lgo-mono text-[0.85rem] text-[color:rgba(242,240,236,0.55)]">
                      {linha.posicao}
                    </span>
                    <span
                      className={`text-right text-[0.9rem] ${
                        linha.surpresa
                          ? "lgo-mono uppercase tracking-[0.1em] text-[color:var(--somma)]"
                          : "lgo-num font-bold text-[color:var(--papel)]"
                      }`}
                    >
                      {linha.valor}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* O que 2º e 3º levam existe, mas não se conta agora. */}
        <div className="prm-surpresa lgo-panel mt-4 flex flex-col gap-3 p-6 md:mt-6 md:flex-row md:items-center md:gap-8 md:p-8">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="lgo-clip-tag shrink-0 px-3 py-1.5 text-[0.7rem] font-bold tracking-[0.14em]"
              style={{ background: "var(--somma)", color: "var(--papel)" }}
            >
              ?
            </span>
            <h3 className="lgo-display lgo-display-condensed text-[clamp(1.1rem,4vw,1.5rem)]">
              {PREMIO.surpresaTitulo}
            </h3>
          </div>
          <p className="text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.72)]">
            {PREMIO.surpresaTexto}
          </p>
        </div>

        {/* Faixa de fechamento sobre a rampa de timing */}
        <div className="prm-total mt-6 md:mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4">
            <span className="lgo-label text-[color:rgba(242,240,236,0.6)]">
              TOTAL EM DINHEIRO
            </span>
            <span className="flex flex-wrap items-baseline gap-x-3">
              <span className="lgo-mono text-[0.72rem] uppercase tracking-[0.12em] text-[color:rgba(242,240,236,0.45)]">
                {PREMIO.totalNota}
              </span>
              <span className="lgo-num text-[clamp(1.6rem,5vw,2.6rem)] font-bold text-[color:var(--sinal)]">
                {PREMIO.total}
              </span>
            </span>
          </div>
          <div className="prm-total-line lgo-timing-line" aria-hidden />
        </div>

        <p className="prm-nota lgo-mono mt-6 text-[0.78rem] leading-relaxed text-[color:rgba(242,240,236,0.5)]">
          {PREMIO.nota}
        </p>
      </div>
    </section>
  );
}
