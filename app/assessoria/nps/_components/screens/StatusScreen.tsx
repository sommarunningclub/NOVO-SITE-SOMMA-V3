"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, RotateCcw } from "lucide-react";

export type VarianteStatus =
  | "enviado"
  | "ja-respondeu"
  | "encerrada"
  | "agendada"
  | "nao-encontrada"
  | "indisponivel";

interface Conteudo {
  eyebrow: string;
  titulo: string;
  texto: string;
}

/** Fuso de Brasília fixo: servidor e navegador escrevem a mesma data. */
const FORMATO_ABERTURA = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function conteudoDa(variante: VarianteStatus, rotulo: string | null, abreEm: string | null): Conteudo {
  const daRodada = rotulo ? `Rodada ${rotulo}` : null;
  switch (variante) {
    case "enviado":
      return {
        eyebrow: "Pesquisa enviada",
        titulo: "Obrigado por ajudar a construir a próxima fase da Assessoria Somma.",
        texto: "Suas respostas foram registradas.",
      };
    case "ja-respondeu":
      return {
        eyebrow: "Tudo certo",
        titulo: "Você já respondeu esta rodada da pesquisa.",
        texto: "Suas respostas já estão com a gente. Obrigado por participar.",
      };
    case "encerrada":
      return {
        eyebrow: daRodada ?? "Pesquisa encerrada",
        titulo: "Esta rodada da pesquisa foi encerrada.",
        texto: "Obrigado pelo interesse. Avisamos no grupo da assessoria quando abrir a próxima.",
      };
    case "agendada":
      return {
        eyebrow: daRodada ?? "Em breve",
        titulo: "Esta pesquisa ainda não abriu.",
        texto: abreEm
          ? `Ela abre em ${FORMATO_ABERTURA.format(new Date(abreEm))}. Guarde este link.`
          : "Ela abre em breve. Guarde este link.",
      };
    case "nao-encontrada":
      return {
        eyebrow: "Link inválido",
        titulo: "Não encontramos esta pesquisa.",
        texto: "Confira o link que você recebeu ou abra a pesquisa que está no ar agora.",
      };
    case "indisponivel":
      return {
        eyebrow: "Instabilidade",
        titulo: "Não conseguimos abrir a pesquisa agora.",
        texto: "Tente de novo em alguns minutos. Se continuar, fale com a equipe da assessoria.",
      };
  }
}

interface StatusScreenProps {
  variante: VarianteStatus;
  nome: string | null;
  focar: boolean;
  rotulo?: string | null;
  abreEm?: string | null;
  onOutraPessoa?: () => void;
}

const BOTAO =
  "flex h-14 items-center justify-center gap-2 rounded-full bg-[#f5f5f4] px-8 text-[16px] font-semibold text-[#0b0b0c] transition hover:bg-white";

export function StatusScreen({ variante, nome, focar, rotulo = null, abreEm = null, onOutraPessoa }: StatusScreenProps) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const c = conteudoDa(variante, rotulo, abreEm);
  const concluida = variante === "enviado" || variante === "ja-respondeu";

  useEffect(() => {
    if (focar) titulo.current?.focus({ preventScroll: true });
  }, [focar]);

  return (
    <section className="flex flex-1 flex-col justify-center py-12 lg:py-16">
      <div className="max-w-[720px]">
        {concluida && <CheckAnimado />}
        <p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#ff2c04]">
          {variante === "enviado" && nome ? `Tudo certo, ${nome}` : c.eyebrow}
        </p>
        <h1
          ref={titulo}
          tabIndex={-1}
          className="mt-4 text-balance text-[34px] font-semibold leading-[1.06] tracking-[-0.03em] focus:outline-none sm:text-[48px] lg:text-[60px]"
        >
          {c.titulo}
        </h1>
        <p className="mt-5 text-[18px] leading-relaxed text-white/70">{c.texto}</p>

        <div className="mt-10 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
          {variante === "indisponivel" ? (
            <button type="button" onClick={() => window.location.reload()} className={BOTAO}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Tentar novamente
            </button>
          ) : variante === "nao-encontrada" ? (
            <Link href="/assessoria/nps" className={BOTAO}>
              Abrir a pesquisa atual
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <Link href="/assessoria" className={BOTAO}>
              Voltar para a Assessoria
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
          {concluida && onOutraPessoa && (
            <button
              type="button"
              onClick={onOutraPessoa}
              className="h-12 rounded-full px-4 text-[15px] font-medium text-white/70 transition hover:text-white"
            >
              {variante === "enviado" ? "Responder por outra pessoa neste aparelho" : "Não é você? Responder como outra pessoa"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function CheckAnimado() {
  const reduzir = useReducedMotion();
  const desenho = reduzir ? { initial: false as const } : { initial: { pathLength: 0 } };

  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
      <motion.circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="#ff2c04"
        strokeWidth="3"
        {...desenho}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M20 33.5 28 41.5 44.5 24"
        fill="none"
        stroke="#ff2c04"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...desenho}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
