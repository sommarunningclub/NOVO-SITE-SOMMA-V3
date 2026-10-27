"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Instagram, Menu, X } from "lucide-react";
import { SOMMA } from "@/lib/somma-data";
import { cn } from "@/lib/utils";
import { ASSESSORIA_VENDAS_ABERTAS } from "@/lib/assessoria-status";
import { StravaIcon } from "./icons/strava";
import { TikTokIcon } from "./icons/tiktok";

const NAV_LINKS = [
  { label: "Comunidade", href: "#sobre" },
  { label: "Local", href: "#local" },
  { label: "Ritmos", href: "#ritmos" },
  { label: "Assessoria", href: "#assessoria" },
  { label: "Fotos", href: "#fotos" },
  { label: "FAQ", href: "#faq" },
  { label: "Check-in", href: "/check-in" },
].filter((l) => ASSESSORIA_VENDAS_ABERTAS || l.href !== "#assessoria");

const SOCIAL = [
  { label: "Instagram", href: SOMMA.links.instagram, Icon: Instagram },
  { label: "TikTok", href: SOMMA.links.tiktok, Icon: TikTokIcon },
  { label: "Strava", href: SOMMA.links.strava, Icon: StravaIcon },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Âncora escolhida no menu: só rola depois que a trava de scroll sai.
  const pendingHash = useRef<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trava o scroll da página (html e body, por causa do Safari do iPhone),
  // fecha com Esc e fecha sozinho se a tela passar para desktop.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const desktop = window.matchMedia("(min-width: 768px)");
    const onDesktop = () => desktop.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);

    return () => {
      html.style.overflow = "";
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
      toggleRef.current?.focus({ preventScroll: true });

      const hash = pendingHash.current;
      pendingHash.current = null;
      if (hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
        history.pushState(null, "", hash);
      }
    };
  }, [open]);

  const navigate = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      pendingHash.current = href;
    }
    setOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)]"
            : "bg-transparent"
        )}
      >
        <nav className="container-somma flex h-16 items-center justify-between md:h-20">
          <a href="/" aria-label="SOMMA Club — início" className="flex items-center">
            <Image
              src={scrolled ? "/logo-somma-dark.svg" : "/logo-somma.svg"}
              alt="SOMMA Club"
              width={120}
              height={32}
              className="h-7 w-auto md:h-8"
              priority
            />
          </a>

          {/* Links desktop */}
          <ul
            className={cn(
              "hidden items-center gap-7 text-sm font-medium md:flex",
              scrolled ? "text-ink" : "text-white"
            )}
          >
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="transition-colors hover:text-primary">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <a
              href={SOMMA.links.inscricao}
              className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:inline-block"
            >
              Inscreva-se grátis
            </a>
            <button
              ref={toggleRef}
              type="button"
              aria-label="Abrir menu"
              aria-expanded={open}
              aria-controls="menu-mobile"
              onClick={() => setOpen(true)}
              className={cn(
                "-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full md:hidden",
                scrolled ? "text-ink" : "text-white"
              )}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </nav>
      </header>

      {/* Menu mobile. Fica fora do <header> de propósito: o backdrop-blur do
          header rolado vira o contêiner de elementos fixed e espremia o menu
          na altura da barra. */}
      <div
        id="menu-mobile"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        className={cn(
          "fixed inset-0 z-[70] flex flex-col bg-ink text-white duration-300 md:hidden",
          // Ao abrir, visibility vira na hora (senão o foco no X falha no
          // primeiro quadro); ao fechar, espera o fade terminar.
          open ? "visible opacity-100 transition-opacity" : "invisible opacity-0 transition-[opacity,visibility]"
        )}
      >
        <div className="hero-spotlight pointer-events-none absolute inset-0" aria-hidden />

        <div className="container-somma relative flex h-16 shrink-0 items-center justify-between">
          <a href="/" aria-label="SOMMA Club — início" onClick={() => setOpen(false)}>
            <Image src="/logo-somma.svg" alt="SOMMA Club" width={120} height={32} className="h-7 w-auto" />
          </a>
          <button
            ref={closeRef}
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ul className="container-somma pb-6 pt-4 [@media(max-height:640px)]:pt-1">
            {NAV_LINKS.map((l, i) => {
              const external = !l.href.startsWith("#");
              const Arrow = external ? ArrowUpRight : ArrowRight;
              return (
                <li
                  key={l.href}
                  style={{ transitionDelay: open ? `${80 + i * 40}ms` : "0ms" }}
                  className={cn(
                    "border-b border-white/10 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
                    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  )}
                >
                  <a
                    href={l.href}
                    onClick={(e) => navigate(e, l.href)}
                    className="group flex items-center justify-between py-3.5 text-[1.75rem] font-semibold leading-tight tracking-tight transition-colors active:text-primary [@media(max-height:640px)]:py-2.5 [@media(max-height:640px)]:text-2xl"
                  >
                    {l.label}
                    <Arrow className="h-5 w-5 text-white/30 transition-colors group-hover:text-primary group-active:text-primary" />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="container-somma relative shrink-0 border-t border-white/10 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="text-sm leading-snug text-white/60">
              {SOMMA.encontro.dia}, {SOMMA.encontro.hora}
              <br />
              Parque da Cidade
            </p>
            <div className="flex gap-2">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} do SOMMA Club`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-primary"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          <a
            href={SOMMA.links.inscricao}
            onClick={(e) => navigate(e, SOMMA.links.inscricao)}
            className="block rounded-full bg-primary px-6 py-4 text-center text-base font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Inscreva-se grátis
          </a>
        </div>
      </div>
    </>
  );
}
