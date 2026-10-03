"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../../_motion";
import { PAPER_AMP, PAPER_GLOW, createArt, createPaper, cssColor, type ArtLayer, type PaperLayer } from "./fire-gl";

/** Duração da abertura, em segundos. Curta: é uma ignição, não uma vinheta. */
const IGNITION_S = 1.5;
/**
 * Quanto a frente de fogo anda adiante da seção que sobe, em fração da hero.
 * Precisa ser maior que o vaivém da frente (PAPER_AMP) mais a faixa de cinza:
 * é o que impede a borda reta da seção de aparecer por baixo do papel.
 */
const LEAD = 0.15;
/** Quanto tempo de rolagem a frente antecipa (dois quadros a 60 Hz) e o teto disso. */
const RUSH_S = 0.035;
const RUSH_MAX = 0.25;
/** Calor do fogo com a rolagem parada: brasa, não chama. */
const EMBER = 0.4;
/** Daqui em diante o botão da hero já está pegando fogo e não vale mais o clique. */
const TOUCHED = 0.02;

type State = "static" | "live" | "fallback";

/**
 * O fogo da abertura, em dois canvas:
 *
 *  1. A arte "SOMMA RUNNING CLUB" acende de baixo para cima e fica em chamas.
 *  2. A hero é o papel. Ela fica parada no topo (sticky, em loja.css) enquanto
 *     o resto da página sobe por cima, e a rolagem queima o papel de baixo para
 *     cima: a frente de fogo anda sempre um pouco adiante da seção que sobe.
 *
 * A rolagem é a nativa. O fogo só lê quanto da hero já foi coberto.
 *
 * Sem WebGL ou com movimento reduzido fica a imagem parada e nada queima; o
 * `<img>` é sempre o que o navegador baixa e o que o leitor de tela lê.
 */
export function HeroFire({ alt }: { alt: string }) {
  const img = useRef<HTMLImageElement>(null);
  const artCanvas = useRef<HTMLCanvasElement>(null);
  const paperCanvas = useRef<HTMLCanvasElement>(null);
  // "static": só o <img> (estado do servidor). "live": canvas no ar. "fallback": WebGL não deu.
  const [state, setState] = useState<State>("static");

  useEffect(() => {
    const image = img.current;
    const artView = artCanvas.current;
    const paperView = paperCanvas.current;
    const hero = paperView?.closest<HTMLElement>("[data-hero]");
    if (!image || !artView || !paperView || !hero) return;
    if (prefersReducedMotion()) {
      setState("fallback");
      return;
    }

    // O que está embaixo do papel: o resto da página, que sobe por cima da hero.
    const under = hero.nextElementSibling instanceof HTMLElement ? hero.nextElementSibling : null;
    const fire = cssColor(getComputedStyle(hero).getPropertyValue("--somma-orange"), [1, 0.282, 0]);
    let art: ArtLayer | null = null;
    let paper: PaperLayer | null = under
      ? createPaper(paperView, {
          fire,
          ink: cssColor(getComputedStyle(hero).backgroundColor, [0.078, 0.078, 0.078]),
          under: cssColor(getComputedStyle(under).backgroundColor, [0.969, 0.969, 0.969]),
        })
      : null;

    let frame = 0;
    let disposed = false;
    let inView = true;
    let started = 0;
    let last = 0;
    let lit = 0; // quando a arte acendeu
    let announced = false;
    let covered = 0; // quanto da hero o resto da página já cobriu, de 0 a 1
    let painted = -1; // o que o canvas do papel mostra agora (-1 = quadro do fogo)
    let heat = 0;
    let ahead = 0; // dianteira extra da frente quando a rolagem é rápida
    let touched = false;

    const tick = (now: number) => {
      frame = 0;
      if (disposed) return;
      if (!started) started = last = now;
      const time = (now - started) / 1000;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      // Com a hero parada (sticky) isto anda junto com a rolagem. Enquanto ela
      // ainda rola com a página, a conta dá zero e nada queima.
      const box = hero.getBoundingClientRect();
      const overlap = paper && under ? (box.bottom - under.getBoundingClientRect().top) / box.height : 0;
      const next = overlap < 0.001 ? 0 : overlap > 0.999 ? 1 : overlap;
      const velocity = (next - covered) / Math.max(dt, 0.001); // heros por segundo; positivo = descendo
      covered = next;
      const burning = covered > 0 && covered < 1;

      // rolou, o fogo cresce na hora; parou, esfria devagar até virar brasa
      const target = burning ? Math.min(1, EMBER + Math.abs(velocity) * 1.2) : 0;
      heat += (target - heat) * (1 - Math.exp(-dt / (target > heat ? 0.08 : 0.9)));
      // A página sobe pelo compositor e chega à tela um quadro antes do canvas.
      // Descendo rápido, o fogo se adianta o que a página anda nesse intervalo
      // e depois recua sem pressa: é o que mantém a emenda escondida.
      const rush = Math.min(Math.max(velocity, 0) * RUSH_S, RUSH_MAX);
      ahead = rush > ahead ? rush : ahead + (rush - ahead) * (1 - Math.exp(-dt / 0.35));
      // no começo a frente sai da própria borda; depois abre a dianteira
      const front = covered + LEAD * (1 - Math.exp(-covered / 0.08)) + ahead;

      if (paper) {
        const wiped = paper.fit();
        if (burning) {
          paper.draw(time, front, covered, heat);
          painted = -1;
        } else if (wiped || painted !== covered) {
          if (covered) paper.fill();
          else paper.clear();
          painted = covered;
        }
      }
      if (touched !== covered > TOUCHED) {
        touched = !touched;
        hero.toggleAttribute("data-burning", touched);
      }

      const artAlive = art !== null && covered < 1;
      if (art && artAlive) {
        if (!lit) lit = now;
        const p = Math.min((now - lit) / 1000 / IGNITION_S, 1);
        let paperFront = 0;
        if (burning) {
          const artBox = artView.getBoundingClientRect();
          paperFront = (artBox.bottom - box.bottom + front * box.height) / artBox.height;
        }
        art.draw(time, 1 - (1 - p) ** 3, paperFront, burning ? heat : 0); // sai rápido, assenta devagar
        if (!announced) {
          announced = true;
          setState("live");
        }
      }

      // papel inteiro sem arte, ou tudo queimado: nada se mexe, o laço para
      if (visible() && (burning || artAlive)) frame = requestAnimationFrame(tick);
    };
    // fora da tela ou com a aba escondida, o laço também para: zero custo
    const visible = () => inView && document.visibilityState === "visible";
    const wake = () => {
      if (!frame && !disposed && visible()) frame = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      wake();
    });
    io.observe(hero);
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("scroll", wake, { passive: true });

    const layout = () => {
      // Com esta medida o CSS sabe se a hero cabe na tela: se não couber
      // (celular deitado, zoom de texto), ela só para depois de mostrar a base.
      hero.style.setProperty("--lj-hero-h", `${hero.offsetHeight}px`);
      // O fogo chega ao topo antes da seção de baixo, então o header precisa
      // ficar sólido mais cedo. Quem lê este atributo é o Header.
      if (paper && getComputedStyle(hero).position === "sticky") hero.dataset.headerUntil = String(1 - LEAD - PAPER_AMP - PAPER_GLOW);
      else delete hero.dataset.headerUntil;
      wake();
    };
    const ro = new ResizeObserver(layout);
    ro.observe(hero);
    window.addEventListener("resize", layout);

    // Foco no botão da hero com a página rolada (Shift+Tab): volta para o papel
    // inteiro, senão o foco ficaria num botão já queimado e coberto.
    const onFocus = () => {
      if (!under) return;
      const hidden = hero.getBoundingClientRect().bottom - under.getBoundingClientRect().top;
      if (hidden > 1) window.scrollBy({ top: -hidden, behavior: "instant" });
    };
    hero.addEventListener("focusin", onFocus);

    const onArtLost = (event: Event) => {
      event.preventDefault();
      art = null;
      setState("fallback");
    };
    const onPaperLost = (event: Event) => {
      event.preventDefault();
      paper = null;
      layout();
    };
    artView.addEventListener("webglcontextlost", onArtLost);
    paperView.addEventListener("webglcontextlost", onPaperLost);

    const ignite = () => {
      if (disposed) return;
      art = createArt(artView, image, fire);
      if (art) wake();
      else setState("fallback");
    };
    if (image.complete && image.naturalWidth > 0) ignite();
    else image.addEventListener("load", ignite, { once: true });
    const onError = () => setState("fallback");
    image.addEventListener("error", onError, { once: true });

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", layout);
      hero.removeEventListener("focusin", onFocus);
      image.removeEventListener("load", ignite);
      image.removeEventListener("error", onError);
      artView.removeEventListener("webglcontextlost", onArtLost);
      paperView.removeEventListener("webglcontextlost", onPaperLost);
      art?.dispose();
      paper?.dispose();
      hero.style.removeProperty("--lj-hero-h");
      hero.removeAttribute("data-burning");
      delete hero.dataset.headerUntil;
    };
  }, []);

  return (
    <>
      <div className="lj-hero__stage">
        <div className="lj-tribal" data-state={state}>
          <picture>
            <source type="image/avif" srcSet="/loja/brand/tribal-1024.avif 1024w, /loja/brand/tribal-2048.avif 2048w" sizes="(min-width: 48rem) 34rem, 60vw" />
            {/* <img> puro, sem next/image: o canvas usa este mesmo elemento como textura */}
            <img
              ref={img}
              className="lj-tribal__img"
              src="/loja/brand/tribal-1024.webp"
              srcSet="/loja/brand/tribal-1024.webp 1024w, /loja/brand/tribal-2048.webp 2048w"
              sizes="(min-width: 48rem) 34rem, 60vw"
              width={2048}
              height={2048}
              alt={alt}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <canvas ref={artCanvas} className="lj-tribal__canvas" aria-hidden="true" />
        </div>
      </div>
      {/* o papel: cobre a hero inteira e só pinta o que o fogo já alcançou */}
      <canvas ref={paperCanvas} className="lj-paper" aria-hidden="true" />
    </>
  );
}
