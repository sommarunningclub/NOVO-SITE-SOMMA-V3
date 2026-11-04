"use client";

import { createContext, useContext, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { MetaMetrica } from "../_data/metricas";
import { ROTULO_STATUS } from "../_data/metricas";
import { fmtData } from "../_lib/formato";

export type Modo = "palco" | "leitura";

export interface SlideProps {
  ativo: boolean;
  modo: Modo;
  abrirPainel: () => void;
  irPara: (indice: number) => void;
}

/** Contexto do slide atual: os blocos animam quando o slide fica ativo. */
export const SlideCtx = createContext<{ ativo: boolean; modo: Modo }>({ ativo: true, modo: "palco" });
export const useSlide = () => useContext(SlideCtx);

const EASE = [0.2, 0.7, 0.2, 1] as const;

/** Entrada com fade e deslocamento curto. */
export function Entra({
  children,
  atraso = 0,
  y = 22,
  x = 0,
  className,
  style,
  as = "div",
}: {
  children: ReactNode;
  atraso?: number;
  y?: number;
  x?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "p" | "h1" | "h2" | "h3" | "span" | "li" | "ul";
}) {
  const { ativo } = useSlide();
  const M = motion[as];
  return (
    <M
      className={className}
      style={style}
      initial={{ opacity: 0, y, x }}
      animate={ativo ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y, x }}
      transition={{ duration: 0.8, delay: ativo ? atraso : 0, ease: EASE }}
    >
      {children}
    </M>
  );
}

/** Título em blocos: cada linha sobe por trás de uma máscara. */
export function TituloMascara({
  linhas,
  className,
  atraso = 0.05,
  destaque = [],
  as = "h2",
}: {
  linhas: string[];
  className?: string;
  atraso?: number;
  /** Índices das linhas em laranja. */
  destaque?: number[];
  as?: "h1" | "h2";
}) {
  const { ativo } = useSlide();
  const Tag = as;
  return (
    <Tag className={`t-display ${className ?? ""}`}>
      {linhas.map((l, i) => (
        <span key={i} style={{ display: "block", overflow: "hidden", padding: "0.16em 0 0.06em", margin: "-0.16em 0 -0.06em" }}>
          <motion.span
            style={{ display: "block" }}
            className={destaque.includes(i) ? "c-destaque" : undefined}
            initial={{ y: "105%" }}
            animate={{ y: ativo ? "0%" : "105%" }}
            transition={{ duration: 0.9, delay: ativo ? atraso + i * 0.08 : 0, ease: EASE }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return <span className="kicker">{children}</span>;
}

/** Linha de fonte: de onde vem o número, de quando é e qual o status. */
export function Fonte({ meta, extra }: { meta: MetaMetrica; extra?: string }) {
  return (
    <p className="fonte linha g-08 quebra">
      <span className="selo selo-ponto" style={{ fontSize: "1em" }}>
        {ROTULO_STATUS[meta.status]}
      </span>
      <span>
        Fonte: {meta.fonte} · {meta.periodo} · atualizado em {fmtData(meta.atualizadoEm)}
        {extra ? ` · ${extra}` : ""}
      </span>
    </p>
  );
}

/** Logo oficial (arquivos SVG do repositório, nunca redesenhado). */
export function Logo({ tom, className, style }: { tom: "claro" | "escuro" | "preto"; className?: string; style?: React.CSSProperties }) {
  // claro = palavra branca (fundo escuro); escuro = palavra preta (fundo claro);
  // preto = versão monocromática preta (fundo laranja).
  const src = tom === "claro" ? "/logo-somma.svg" : "/logo-somma-dark.svg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="SOMMA Club"
      className={className}
      style={{ ...(tom === "preto" ? { filter: "brightness(0)" } : null), ...style }}
      draggable={false}
    />
  );
}
