"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, reduced, isTouch, EASE } from "./_motion";
import { cx, s } from "./_ui";

export const STAGES = ["DISCOVER", "JOIN", "TRAIN", "ENGAGE", "RUN", "CONTINUE"] as const;

/* ================================================================= raiz do motion */

/**
 * Liga o motion do deck.
 *
 * Três responsabilidades: scroll suave (Lenis dirigindo o ticker do GSAP para
 * não brigar com o ScrollTrigger), reveal automático das headlines e a leitura
 * do estágio atual da jornada. Nada disso roda sob `prefers-reduced-motion`.
 */
export function useDeckMotion(rootRef: React.RefObject<HTMLDivElement | null>) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (reduced()) {
      setProgress(1);
      setStage(STAGES.length - 1);
      return;
    }

    root.dataset.motion = "on";

    // No celular a barra de endereço entra e sai durante a rolagem e muda a
    // altura da viewport. Sem isto o ScrollTrigger remede tudo no meio do gesto
    // e as seções dão um salto sob o dedo.
    ScrollTrigger.config({ ignoreMobileResize: true });

    // --- scroll suave (só onde existe roda de mouse) -------------------------
    // No toque o scroll do sistema já é o melhor que existe: tem o momentum e a
    // borracha que o usuário conhece. Interpor qualquer coisa aí só atrasa.
    const touch = isTouch();
    const lenis = touch
      ? null
      : new Lenis({
          duration: 1.05,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          syncTouch: false,
        });

    const raf = lenis ? (time: number) => lenis.raf(time * 1000) : null;
    if (lenis && raf) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    const ctx = gsap.context(() => {
      // --- reveal das headlines --------------------------------------------
      // toda headline que não pediu timing próprio entra pelo mesmo padrão
      root.querySelectorAll<HTMLElement>(".js-head:not([data-solo])").forEach((head) => {
        const words = head.querySelectorAll<HTMLElement>(".js-word");
        if (!words.length) return;
        gsap.fromTo(
          words,
          // `y: 0` neutraliza o transform da classe, que o GSAP lê convertido em px
          { yPercent: 106, y: 0 },
          {
            yPercent: 0,
            duration: 1.05,
            ease: EASE.out,
            stagger: 0.05,
            scrollTrigger: { trigger: head, start: "top 82%", once: true },
          },
        );
      });

      // --- filetes ----------------------------------------------------------
      root.querySelectorAll<HTMLElement>(".js-rule").forEach((rule) => {
        gsap.fromTo(
          rule,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.2,
            ease: EASE.soft,
            scrollTrigger: { trigger: rule, start: "top 92%", once: true },
          },
        );
      });

      // --- blocos genéricos -------------------------------------------------
      root.querySelectorAll<HTMLElement>("[data-rise]").forEach((el) => {
        const kids = el.hasAttribute("data-rise-children")
          ? gsap.utils.toArray<HTMLElement>(el.children)
          : [el];
        gsap.fromTo(
          kids,
          { y: 26, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: EASE.soft,
            stagger: 0.075,
            scrollTrigger: { trigger: el, start: "top 84%", once: true },
          },
        );
      });

      // --- estágio da jornada ----------------------------------------------
      root.querySelectorAll<HTMLElement>(".js-section").forEach((sec) => {
        const n = Number(sec.dataset.stage ?? 0);
        ScrollTrigger.create({
          trigger: sec,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => self.isActive && setStage(n),
        });
      });

      // --- progresso global -------------------------------------------------
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => setProgress(self.progress),
      });
    }, root);

    // fontes e imagens mudam a altura do documento depois da primeira medição
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) void document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
      if (raf) gsap.ticker.remove(raf);
      lenis?.destroy();
      delete root.dataset.motion;
    };
  }, [rootRef]);

  return { stage, progress };
}

/* ================================================================= navegação */

export function Nav() {
  return (
    <nav className={s.nav} aria-label="Atalhos da apresentação">
      <a href="#hero" className={s.navLink}>
        SBT × Somma
      </a>
      <div className="flex items-center gap-7">
        <a href="#road" className={s.navLink}>
          Road to Sunset
        </a>
        <a href="#deliverables" className={s.navLink}>
          Partnership
        </a>
        <a href="#investment" className={s.navLink}>
          R$ 15K
        </a>
      </div>
    </nav>
  );
}

/* ================================================================= rail lateral */

export function JourneyRail({ stage, progress }: { stage: number; progress: number }) {
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (fill.current) fill.current.style.scale = `1 ${progress}`;
  }, [progress]);

  return (
    <aside className={s.rail} aria-hidden>
      <div className={s.railTrack}>
        <span ref={fill} className={s.railFill} />
      </div>
      {STAGES.map((label, i) => (
        <div
          key={label}
          className={cx(s.railItem, i === stage && s.railItemOn, i < stage && s.railItemDone)}
        >
          <span className={s.railLabel}>
            {String(i + 1).padStart(2, "0")} {label}
          </span>
          <span className={s.railDot} />
        </div>
      ))}
    </aside>
  );
}

/* ================================================================= barra mobile */

export function MobileBar({ stage, progress }: { stage: number; progress: number }) {
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fill.current) fill.current.style.scale = `${progress} 1`;
  }, [progress]);

  return (
    <div className={s.mbar} aria-hidden>
      <div className={s.mbarRow}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sbt/kit/sunset-run-logo.png" alt="" className="h-3.5 w-auto opacity-90" />
        <span
          className={cx(s.mono, "text-[0.5625rem] uppercase tracking-[0.22em]")}
          style={{ color: "var(--dim)" }}
        >
          <span style={{ color: "var(--somma)" }}>{String(stage + 1).padStart(2, "0")}</span>{" "}
          {STAGES[stage]}
        </span>
      </div>
      <div className={s.mbarTrack}>
        <div ref={fill} className={s.mbarFill} />
      </div>
    </div>
  );
}
