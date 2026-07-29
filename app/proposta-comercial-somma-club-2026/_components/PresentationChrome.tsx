"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Check, Copy, Maximize2, Minimize2, Menu, X } from "lucide-react";
import { CHAPTERS } from "../_data/presentationSections";
import { CONFIG } from "../_data/config";

function scrollToAnchor(anchor: string) {
  document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function PresentationChrome() {
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFull, setIsFull] = useState(false);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  /* Capítulo ativo por interseção das âncoras. */
  useEffect(() => {
    const els = CHAPTERS.map((c) => document.getElementById(c.anchor)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = CHAPTERS.findIndex((c) => c.anchor === visible.target.id);
          if (idx >= 0) setActive(idx);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* Navegação por teclado entre capítulos. */
  const go = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(CHAPTERS.length - 1, idx));
    scrollToAnchor(CHAPTERS[clamped].anchor);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) {
        e.preventDefault();
        go(active + 1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        go(active - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(0);
      } else if (e.key === "End") {
        e.preventDefault();
        go(CHAPTERS.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go]);

  /* Tela cheia. */
  useEffect(() => {
    const onFs = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONFIG.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível, ignora silenciosamente */
    }
  }, []);

  return (
    <>
      {/* Barra de progresso */}
      <motion.div
        className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[var(--somma-primary)]"
        style={{ scaleX: progress }}
        aria-hidden
      />

      {/* Barra de navegação */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[var(--somma-background)]/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8" aria-label="Capítulos da apresentação">
          <button
            onClick={() => go(0)}
            className="flex shrink-0 items-center gap-2"
            aria-label="Ir para o início"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CONFIG.logo} alt="Somma Club" className="h-6 w-auto sm:h-7" />
          </button>

          {/* Capítulos (desktop/tablet) */}
          <ul className="pcs-no-scrollbar hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto lg:flex">
            {CHAPTERS.map((c, i) => (
              <li key={c.id}>
                <button
                  onClick={() => go(i)}
                  aria-current={active === i ? "true" : undefined}
                  className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                    active === i
                      ? "bg-[var(--somma-highlight)] text-[var(--somma-primary)]"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  {c.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={copyLink}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10"
              aria-label="Copiar link da apresentação"
            >
              {copied ? <Check className="h-4 w-4 text-[var(--somma-primary)]" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline lg:hidden xl:inline">{copied ? "Copiado" : "Copiar link"}</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:bg-white/10 md:inline-flex"
              aria-label={isFull ? "Sair da tela cheia" : "Apresentar em tela cheia"}
            >
              {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            {/* Menu mobile */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 lg:hidden"
              aria-label="Abrir menu de capítulos"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>

        {/* Painel de capítulos (mobile) */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-white/10 lg:hidden"
            >
              <ul className="grid grid-cols-2 gap-1 px-5 py-4 sm:px-8">
                {CHAPTERS.map((c, i) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        go(i);
                        setMenuOpen(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${
                        active === i
                          ? "bg-[var(--somma-highlight)] text-[var(--somma-primary)]"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
