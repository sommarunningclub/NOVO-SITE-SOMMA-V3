"use client";

import { useEffect, useRef, useState } from "react";
import {
  COPY,
  EVENT_CAPACITY,
  EVENT_PATH,
  TICKET_PRICE,
  precoLabel,
  spotsLabel,
} from "@/lib/sunday-social-run/event.config";
import { track } from "@/lib/sunday-social-run/analytics";
import { TicketCta } from "./base";

const LINKS = [
  { href: "#experiencia", label: "Experiência" },
  { href: "#hype", label: "Hype On" },
  { href: "#domingo", label: "Programação" },
  { href: "#after-pace", label: "O after" },
  { href: "#spot", label: "Vagas" },
] as const;

/**
 * Header + CTA fixo do mobile.
 *
 * O header nasce transparente sobre o hero, encolhe e ganha vidro ao rolar. O
 * tom (claro ou escuro) vem do atributo que o palco de luz publica no `<html>`,
 * então ele nunca fica com texto branco sobre creme.
 *
 * No mobile, um CTA fixo acompanha a leitura a partir do fim do hero: é o único
 * elemento que nunca sai da tela, porque é o único que converte.
 */
export function EventHeader() {
  const [solido, setSolido] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [mostraCta, setMostraCta] = useState(false);
  const progresso = useRef<HTMLDivElement>(null);
  const contou = useRef(false);

  useEffect(() => {
    if (!contou.current) {
      contou.current = true;
      track("view_experience", { pagina: "landing" });
    }
  }, []);

  useEffect(() => {
    let frame = 0;

    const medir = () => {
      frame = 0;
      const y = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;

      setSolido(y > 40);
      // O CTA entra quando o hero já passou: antes disso ele só atrapalharia a
      // primeira impressão.
      setMostraCta(y > window.innerHeight * 0.8);

      if (progresso.current) {
        progresso.current.style.transform = `scaleX(${total > 0 ? Math.min(y / total, 1) : 0})`;
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Menu aberto trava o corpo — evita o scroll fantasma do iOS por trás do painel.
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
        data-solido={solido && !aberto ? "sim" : "nao"}
        className="ris-chrome ris-header fixed inset-x-0 top-0"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          // acima do painel: o X do header é o único jeito de fechar, e é o
          // mesmo botão que abriu — sem controle duplicado no meio do caminho
          zIndex: aberto ? 70 : 50,
          ...(aberto ? { color: "var(--cream)" } : {}),
        }}
      >
        <div
          className="ris-wrap flex items-center justify-between gap-4 transition-[height] duration-500"
          style={{ height: solido ? 60 : 76 }}
        >
          <a
            href={EVENT_PATH}
            aria-label="Sunday Social Run — início"
            className="ris-display flex shrink-0 items-center text-[0.86rem] leading-none tracking-[-0.02em] md:text-[1rem]"
          >
            SUNDAY SOCIAL RUN
          </a>

          <nav aria-label="Seções da experiência" className="hidden items-center gap-7 lg:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="ris-label group relative py-2 opacity-70 transition-opacity hover:opacity-100">
                {l.label}
                {/* sublinhado que cresce a partir da esquerda */}
                <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-current transition-transform duration-500 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <TicketCta
              origem="header"
              className="hidden !min-h-[42px] !text-[0.68rem] sm:inline-flex"
              variant="ink"
            >
              {COPY.cta.header}
            </TicketCta>

            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              aria-expanded={aberto}
              aria-controls="ris-menu"
              aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--line-strong)] lg:hidden"
            >
              <span className="relative block h-3 w-5" aria-hidden>
                <span
                  className="absolute left-0 block h-[1.5px] w-full bg-current transition-transform duration-300"
                  style={{ top: aberto ? 5 : 0, transform: aberto ? "rotate(45deg)" : "none" }}
                />
                <span
                  className="absolute left-0 block h-[1.5px] w-full bg-current transition-all duration-300"
                  style={{ top: aberto ? 5 : 10, transform: aberto ? "rotate(-45deg)" : "none" }}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Progresso da jornada — fio discreto, sem número, sem barra gorda. */}
        <div className="h-px w-full bg-[color:var(--line)]">
          <div
            ref={progresso}
            className="h-full w-full origin-left bg-[color:var(--somma)]"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </header>

      {/* Painel mobile */}
      <div
        id="ris-menu"
        aria-hidden={!aberto}
        className="fixed inset-0 z-[60] lg:hidden"
        style={{ pointerEvents: aberto ? "auto" : "none" }}
      >
        <div
          onClick={() => setAberto(false)}
          className="absolute inset-0 bg-black/50 transition-opacity duration-500"
          style={{ opacity: aberto ? 1 : 0 }}
        />
        <div
          className="absolute inset-x-0 top-0 bg-[color:var(--night)] px-6 pb-10 text-[color:var(--cream)] transition-transform duration-500"
          style={{
            paddingTop: "calc(env(safe-area-inset-top) + 5.25rem)",
            transform: aberto ? "translateY(0)" : "translateY(-102%)",
          }}
        >
          <span className="ris-label opacity-60">{`${spotsLabel} · ${precoLabel}`}</span>

          <nav className="mt-5 flex flex-col" aria-label="Seções da experiência">
            {LINKS.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setAberto(false)}
                className="ris-display flex items-baseline gap-3 border-b border-white/10 py-4 text-[1.7rem] leading-none"
              >
                <span className="ris-mono text-[0.6rem] opacity-40">{String(i + 1).padStart(2, "0")}</span>
                {l.label}
              </a>
            ))}
          </nav>

          <TicketCta origem="menu_mobile" full className="mt-7">
            {COPY.cta.principal}
          </TicketCta>
        </div>
      </div>

      {/* CTA fixo — mobile */}
      <div
        className="ris-sticky fixed inset-x-0 bottom-0 z-40 px-3 pt-3 transition-all duration-500 sm:hidden"
        style={{
          transform: mostraCta && !aberto ? "translateY(0)" : "translateY(140%)",
          opacity: mostraCta && !aberto ? 1 : 0,
          pointerEvents: mostraCta && !aberto ? "auto" : "none",
        }}
      >
        <div className="flex items-center gap-3 rounded-full border border-white/12 bg-[color:var(--night-92)] p-1.5 pl-4 text-[color:var(--cream)] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <div className="ris-mono flex min-w-0 flex-1 items-baseline gap-2 text-[0.72rem]">
            <span className="font-bold">{EVENT_CAPACITY} vagas</span>
            <span className="opacity-40">·</span>
            <span className="opacity-80">R$ {TICKET_PRICE}</span>
          </div>
          <TicketCta origem="sticky_mobile" className="!min-h-[46px] !px-6 !text-[0.7rem]">
            {COPY.cta.curto}
          </TicketCta>
        </div>
      </div>
    </>
  );
}
