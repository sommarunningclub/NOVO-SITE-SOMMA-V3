"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import {
  COPY,
  EVENT_CAPACITY,
  TICKET_PRICE,
  ticketHref,
  vendaAberta,
} from "@/lib/sunday-social-run/event.config";
import { track, type EventName } from "@/lib/sunday-social-run/analytics";
import { gsap, prefersReducedMotion } from "../_motion";

/* ═══════════════════════════════════════════════════════════════════════════
   TIPOGRAFIA
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Headline que preenche a linha.
 *
 * Cada linha informa o próprio comprimento em `--len` e o CSS resolve o
 * tamanho por divisão — uma palavra curta fica gigante, uma longa se ajusta, e
 * nenhuma das duas transborda. Sem media query e sem medir nada em JS.
 */
export function Fit({
  linhas,
  className = "",
  maskClass = "",
  max = "11rem",
  min = "2rem",
  col,
  as: Tag = "span",
}: {
  linhas: readonly string[];
  className?: string;
  maskClass?: string;
  max?: string;
  min?: string;
  /** Fração da grade que a headline ocupa no desktop (4 a 8 de 12). */
  col?: 4 | 5 | 6 | 7 | 8;
  as?: "span" | "div";
}) {
  return (
    <Tag className={`ris-display block ${col ? `ris-col-${col}` : ""} ${className}`}>
      {linhas.map((linha, i) => (
        <span key={`${linha}-${i}`} className={`ris-mask ${maskClass}`}>
          <span
            className="ris-fit"
            style={
              {
                "--len": linha.length,
                "--fit-max": max,
                "--fit-min": min,
              } as CSSProperties
            }
          >
            {linha}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/** Rótulo técnico. O texto pequeno que dá tom de painel de dados. */
export function Label({
  children,
  className = "",
  dot = false,
}: {
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span className={`ris-label inline-flex items-center gap-2 ${className}`}>
      {dot && <span className="ris-pulse" aria-hidden />}
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CTA
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * O botão de conversão da página.
 *
 * Um só componente para todos os pontos de compra: ele decide o destino (link
 * da Hype quando configurado, âncora da seção de ingresso enquanto não houver),
 * dispara o analytics certo e faz o efeito magnético — que existe apenas onde
 * há mouse de verdade. No touch o botão é um botão, e o toque responde na hora.
 */
export function TicketCta({
  children = COPY.cta.principal,
  origem,
  evento = "ticket_cta_click",
  variant,
  className = "",
  full = false,
}: {
  children?: ReactNode;
  origem: string;
  evento?: EventName;
  variant?: "ghost" | "ink" | "cream";
  className?: string;
  full?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const externo = vendaAberta();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

    const mover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.34);
    };
    const sair = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", sair);
    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", sair);
    };
  }, []);

  return (
    <a
      ref={ref}
      href={ticketHref()}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => {
        track(evento, { origem, preco: TICKET_PRICE, vagas: EVENT_CAPACITY });
        if (externo) track("outbound_hype_click", { origem });
      }}
      data-variant={variant}
      className={`ris-btn ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MARQUEE
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Faixa deslizante contínua.
 *
 * O conteúdo é duplicado e o movimento é só `transform` em um `gsap.ticker`
 * modificador — nada de reflow, roda liso até em aparelho fraco. Sob
 * `prefers-reduced-motion` a faixa fica parada, e continua legível.
 */
export function Marquee({
  itens,
  velocidade = 60,
  reverso = false,
  className = "",
  separador = "·",
}: {
  itens: readonly string[];
  velocidade?: number;
  reverso?: boolean;
  className?: string;
  separador?: string;
}) {
  const trilho = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    const largura = el.scrollWidth / 2;
    if (!largura) return;

    const tween = gsap.to(el, {
      x: reverso ? largura : -largura,
      duration: largura / velocidade,
      ease: "none",
      repeat: -1,
    });
    gsap.set(el, { x: reverso ? -largura : 0 });

    return () => {
      tween.kill();
    };
  }, [velocidade, reverso]);

  const bloco = (chave: string) => (
    <div key={chave} className="flex shrink-0 items-center" aria-hidden={chave === "b"}>
      {itens.map((item, i) => (
        <span key={`${chave}-${i}`} className="flex items-center whitespace-nowrap">
          <span className="px-[0.4em]">{item}</span>
          <span className="opacity-30">{separador}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div ref={trilho} className="ris-marquee">
        {bloco("a")}
        {bloco("b")}
      </div>
    </div>
  );
}
