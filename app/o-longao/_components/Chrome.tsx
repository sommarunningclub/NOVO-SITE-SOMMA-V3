"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EVENT_PATH, FORMATO, LINKS } from "@/lib/o-longao/config";
import { HERO } from "@/lib/o-longao/copy";
import { captureAttribution, track } from "@/lib/o-longao/analytics";

const NAV = [
  { href: "#desafio", label: "ENTENDA" },
  { href: "#seletiva", label: "SELETIVA" },
  { href: "#final", label: "A FINAL" },
  { href: "#premiacao", label: "PREMIAÇÃO" },
  { href: "#crews", label: "SUA CREW" },
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

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500"
        style={{
          backgroundColor: solido ? "rgba(5,5,8,0.88)" : "transparent",
          backdropFilter: solido ? "blur(14px)" : "none",
          borderBottom: `1px solid ${solido ? "rgba(255,255,255,0.1)" : "transparent"}`,
        }}
      >
        <div className="lgo-wrap flex h-16 items-center justify-between gap-4 md:h-20">
          {/* Lockup: wordmark + chip âmbar de 24H, a assinatura de timing do evento */}
          <Link
            href={EVENT_PATH}
            aria-label="O Longão, início da página"
            className="flex min-h-[44px] shrink-0 items-center gap-2.5"
          >
            <span className="lgo-display text-lg leading-none md:text-xl">O LONGÃO</span>
            <span className="lgo-mono lgo-clip-tag bg-[color:var(--sinal)] px-2 py-1 text-[0.6rem] font-bold leading-none text-[color:var(--noite)]">
              {FORMATO.finalHoras}H
            </span>
          </Link>

          <nav aria-label="Seções do evento" className="hidden items-center gap-5 lg:flex">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="lgo-label flex min-h-[44px] items-center px-2 text-[color:rgba(242,240,236,0.65)] transition-colors hover:text-[color:var(--sinal)]"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={LINKS.inscricao}
              onClick={() => track("begin_registration", { origem: "header" })}
              className="lgo-btn hidden !min-h-[44px] !px-5 !text-[0.7rem] sm:inline-flex"
            >
              {HERO.ctaPrimario}
            </Link>
            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              aria-expanded={aberto}
              aria-controls="lgo-menu"
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
        id="lgo-menu"
        aria-hidden={!aberto}
        className={`fixed inset-0 z-40 flex-col bg-[color:var(--noite)] pt-16 lg:hidden ${
          aberto ? "flex" : "hidden"
        }`}
      >
        <nav aria-label="Menu" className="lgo-wrap flex flex-1 flex-col justify-center gap-1 py-8">
          {NAV.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setAberto(false)}
              className="lgo-display border-b border-[color:var(--line)] py-4 text-[clamp(1.9rem,8.5vw,3rem)] transition-colors hover:text-[color:var(--sinal)]"
            >
              <span className="lgo-mono mr-4 align-super text-[0.6rem] tracking-[0.2em] text-[color:var(--sinal)]">
                0{i + 1}
              </span>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="lgo-wrap pb-8">
          <Link
            href={LINKS.inscricao}
            onClick={() => {
              setAberto(false);
              track("begin_registration", { origem: "menu_mobile" });
            }}
            className="lgo-btn w-full"
          >
            {HERO.ctaPrimario}
          </Link>
        </div>
      </div>

      {/* CTA fixo do mobile — some quando o menu está aberto para não competir. */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--line)] bg-[color:rgba(5,5,8,0.92)] p-3 backdrop-blur-md transition-transform duration-500 sm:hidden"
        style={{
          transform: mostraCta && !aberto ? "translateY(0)" : "translateY(110%)",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <Link
          href={LINKS.inscricao}
          onClick={() => track("begin_registration", { origem: "sticky_mobile" })}
          className="lgo-btn w-full"
        >
          {HERO.ctaPrimario}
          <span className="lgo-mono text-[0.65rem] opacity-70">{FORMATO.finalHoras}H</span>
        </Link>
      </div>
    </>
  );
}
