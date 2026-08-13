"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { COPY, EVENT, EVENT_PATH, inscricoesAbertas } from "@/lib/desafio-esteiras/event.config";
import { captureAttribution, track } from "@/lib/desafio-esteiras/analytics";
import { Logos } from "./Logos";

const LINKS = [
  { href: "#desafio", label: "O Desafio" },
  { href: "#experiencia", label: "Experiência" },
  { href: "#unidades", label: "Unidades" },
  { href: "#competidores", label: "Competidores" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#faq", label: "FAQ" },
];

/**
 * Header + CTA fixo do mobile.
 *
 * É também onde a página captura UTMs e dispara o `view_event` — uma vez só,
 * mesmo com o StrictMode montando o componente duas vezes em desenvolvimento.
 */
export function Chrome() {
  const [solido, setSolido] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [mostraCta, setMostraCta] = useState(false);
  const jaContou = useRef(false);

  useEffect(() => {
    captureAttribution();
    if (!jaContou.current) {
      jaContou.current = true;
      track("view_event", { pagina: "landing" });
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSolido(y > 40);
      setMostraCta(y > window.innerHeight * 0.75);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menu aberto trava o scroll do corpo — evita o "scroll fantasma" do iOS.
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const abertas = inscricoesAbertas();

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500"
        style={{
          backgroundColor: solido ? "rgba(8,8,10,0.86)" : "transparent",
          backdropFilter: solido ? "blur(14px)" : "none",
          borderBottom: `1px solid ${solido ? "rgba(255,255,255,0.1)" : "transparent"}`,
        }}
      >
        <div className="dst-wrap flex h-16 items-center justify-between gap-4 md:h-20">
          {/* py generoso: a logo é baixa, mas o alvo de toque precisa ter 44px */}
          <Link
            href={EVENT_PATH}
            aria-label="Desafio das Esteiras · Evolve + SOMMA Club"
            className="flex min-h-[44px] shrink-0 items-center"
          >
            <Logos className="h-5 md:h-6" />
          </Link>

          <nav aria-label="Seções do evento" className="hidden items-center gap-6 lg:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="dst-label flex min-h-[44px] items-center px-2 text-[color:rgba(242,240,236,0.65)] transition-colors hover:text-[color:var(--somma)]"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {abertas && (
              <Link
                href={`${EVENT_PATH}/inscricao`}
                onClick={() => track("begin_registration", { origem: "header" })}
                className="dst-btn hidden !min-h-[44px] !px-5 !text-[0.72rem] sm:inline-flex"
              >
                Garantir ticket
              </Link>
            )}
            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              aria-expanded={aberto}
              aria-controls="dst-menu"
              aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              className="flex h-11 w-11 shrink-0 items-center justify-center border border-[color:var(--line)] lg:hidden"
            >
              <span className="relative block h-3 w-5">
                <span
                  className="absolute left-0 block h-[2px] w-full bg-current transition-transform duration-300"
                  style={{ top: aberto ? 5 : 0, transform: aberto ? "rotate(45deg)" : "none" }}
                />
                <span
                  className="absolute left-0 block h-[2px] w-full bg-current transition-transform duration-300"
                  style={{ top: aberto ? 5 : 10, transform: aberto ? "rotate(-45deg)" : "none" }}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile — lista simples, alvos grandes, sem submenu.
          Sem o atributo `hidden`: a classe utilitária `flex` venceria o
          `display:none` implícito dele e o menu ficaria sempre aberto. */}
      <div
        id="dst-menu"
        aria-hidden={!aberto}
        className={`fixed inset-0 z-40 flex-col bg-[color:var(--ink)] pt-16 lg:hidden ${
          aberto ? "flex" : "hidden"
        }`}
      >
        <nav aria-label="Menu" className="dst-wrap flex flex-1 flex-col justify-center gap-1 py-8">
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setAberto(false)}
              className="dst-display border-b border-[color:var(--line)] py-4 text-[clamp(2rem,9vw,3rem)] transition-colors hover:text-[color:var(--somma)]"
            >
              <span className="dst-mono mr-4 align-super text-[0.6rem] tracking-[0.2em] text-[color:var(--somma)]">
                0{i + 1}
              </span>
              {l.label}
            </a>
          ))}
        </nav>
        {abertas && (
          <div className="dst-wrap pb-8">
            <Link
              href={`${EVENT_PATH}/inscricao`}
              onClick={() => {
                setAberto(false);
                track("begin_registration", { origem: "menu_mobile" });
              }}
              className="dst-btn w-full"
            >
              {COPY.ctaPrimario}
            </Link>
          </div>
        )}
      </div>

      {/* CTA fixo do mobile — some quando o menu está aberto para não competir. */}
      {abertas && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--line)] bg-[color:rgba(8,8,10,0.92)] p-3 backdrop-blur-md transition-transform duration-500 sm:hidden"
          style={{
            transform: mostraCta && !aberto ? "translateY(0)" : "translateY(110%)",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <Link
            href={`${EVENT_PATH}/inscricao`}
            onClick={() => track("begin_registration", { origem: "sticky_mobile" })}
            className="dst-btn w-full"
          >
            {COPY.ctaPrimario}
            <span className="dst-mono text-[0.65rem] opacity-70">
              {EVENT.dataLabel} · {EVENT.horaLabel}
            </span>
          </Link>
        </div>
      )}
    </>
  );
}
