"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { SOMMA } from "@/lib/somma-data";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Comunidade", href: "#sobre" },
  { label: "Local", href: "#local" },
  { label: "Ritmos", href: "#ritmos" },
  { label: "Assessoria", href: "#assessoria" },
  { label: "Fotos", href: "#fotos" },
  { label: "FAQ", href: "#faq" },
  { label: "Check-in", href: "/check-in" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
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
            type="button"
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full md:hidden",
              scrolled ? "text-ink" : "text-white"
            )}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Overlay menu mobile (mecânica do Marun) */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-ink text-white transition-opacity duration-300 md:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="container-somma flex h-16 items-center justify-between">
          <a href="/" aria-label="SOMMA Club — início" onClick={() => setOpen(false)}>
            <Image src="/logo-somma.svg" alt="SOMMA Club" width={120} height={32} className="h-7 w-auto" />
          </a>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <ul className="container-somma mt-8 flex flex-col gap-6 text-3xl font-semibold">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)} className="hover:text-primary">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="container-somma mt-auto pb-10">
          <a
            href={SOMMA.links.inscricao}
            onClick={() => setOpen(false)}
            className="block rounded-full bg-primary px-6 py-4 text-center text-base font-semibold text-white"
          >
            Inscreva-se grátis
          </a>
        </div>
      </div>
    </header>
  );
}
