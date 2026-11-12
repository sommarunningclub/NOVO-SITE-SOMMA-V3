"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { medir } from "@/lib/evp/analytics";
import { IMAGENS } from "@/lib/evp/config";
import { rotuloCta, useEvento } from "./Contexto";

const LINKS = [
  { href: "#meeting", rotulo: "O Meeting" },
  { href: "#distancias", rotulo: "Distâncias" },
  { href: "#percursos", rotulo: "Percursos" },
  { href: "#programacao", rotulo: "Programação" },
  { href: "#encontro", rotulo: "Data e local" },
] as const;

export function Marcas({ altura = 22 }: { altura?: number }) {
  return (
    <span className="flex items-center gap-3">
      <Image src={IMAGENS.logoSomma} alt="SOMMA Club" width={Math.round(altura * 4.2)} height={altura} style={{ height: altura, width: "auto" }} priority />
      <span aria-hidden className="mt-mono text-[0.7rem] text-[color:var(--mt-cinza)]">×</span>
      <Image src={IMAGENS.logoBora} alt="BORA Assessoria" width={Math.round(altura * 3)} height={altura} style={{ height: altura * 0.82, width: "auto" }} priority />
    </span>
  );
}

export function Navegacao() {
  const { vagas } = useEvento();
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);
  const [barraOculta, setBarraOculta] = useState(true);
  const botaoMenu = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  // A barra fixa do celular some enquanto o botão da hero ou o formulário estão na tela.
  useEffect(() => {
    const alvos = [document.getElementById("hero-cta"), document.getElementById("inscricao")].filter(Boolean) as HTMLElement[];
    if (!alvos.length) return;
    const visiveis = new Set<Element>();
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) (e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target));
        setBarraOculta(visiveis.size > 0);
      },
      { threshold: 0.05 }
    );
    alvos.forEach((a) => io.observe(a));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        botaoMenu.current?.focus();
      }
    };
    document.addEventListener("keydown", aoTeclar);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  const cta = rotuloCta(vagas.modo);

  return (
    <>
      <a href="#conteudo" className="mt-botao mt-botao--cheio mt-botao--pequeno fixed left-3 top-3 z-[60] -translate-y-24 focus:translate-y-0">
        Pular para o conteúdo
      </a>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          background: rolou || aberto ? "rgba(8,8,8,0.92)" : "transparent",
          borderBottom: `1px solid ${rolou && !aberto ? "var(--mt-linha)" : "transparent"}`,
          backdropFilter: rolou && !aberto ? "blur(10px)" : undefined,
        }}
      >
        <div className="mt-container flex h-16 items-center justify-between gap-4">
          <a href="#topo" aria-label="Meeting Técnico: início da página" className="shrink-0">
            <Marcas altura={20} />
          </a>
          <nav aria-label="Seções da página" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="mt-mono text-[0.7rem] text-[color:var(--mt-cinza)] transition-colors hover:text-white">
                    {l.rotulo}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            {/* O span decide a visibilidade: .mt-botao define display e venceria o "hidden". */}
            <span className="hidden sm:block">
              <a href="#inscricao" className="mt-botao mt-botao--cheio mt-botao--pequeno" onClick={() => medir("evp_cta_click", { local: "menu" })}>
                {cta}
              </a>
            </span>
            <button
              ref={botaoMenu}
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full border border-[color:var(--mt-linha-forte)] lg:hidden"
              aria-expanded={aberto}
              aria-controls="mt-menu"
              aria-label={aberto ? "Fechar menu" : "Abrir menu"}
              onClick={() => setAberto((v) => !v)}
            >
              <span aria-hidden className="relative block h-3 w-5">
                <span className="absolute inset-x-0 top-0 h-0.5 bg-white transition-transform duration-300" style={{ transform: aberto ? "translateY(5px) rotate(45deg)" : undefined }} />
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white transition-transform duration-300" style={{ transform: aberto ? "translateY(-5px) rotate(-45deg)" : undefined }} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Só existe no DOM quando aberto: a classe "flex" venceria o atributo hidden. */}
      {aberto && (
      <div
        id="mt-menu"
        className="fixed inset-0 z-40 flex flex-col justify-between bg-[color:var(--mt-preto)] lg:hidden"
        style={{ paddingTop: "calc(5rem + env(safe-area-inset-top))", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <nav aria-label="Seções da página" className="mt-container">
          <ul>
            {LINKS.map((l, i) => (
              <li key={l.href} className="border-b border-[color:var(--mt-linha)]">
                <a href={l.href} onClick={() => setAberto(false)} className="flex items-baseline gap-4 py-4">
                  <span className="mt-mono text-[0.7rem] text-[color:var(--mt-laranja)]">0{i + 1}</span>
                  <span className="mt-display text-[2.6rem]">{l.rotulo}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-container">
          <a
            href="#inscricao"
            className="mt-botao mt-botao--cheio w-full"
            onClick={() => {
              setAberto(false);
              medir("evp_cta_click", { local: "menu-celular" });
            }}
          >
            {cta}
          </a>
        </div>
      </div>
      )}

      <div className="mt-barra-fixa" data-oculta={barraOculta || aberto} aria-hidden={barraOculta || aberto}>
        <a
          href="#inscricao"
          tabIndex={barraOculta || aberto ? -1 : 0}
          className="mt-botao mt-botao--cheio w-full"
          onClick={() => medir("evp_cta_click", { local: "barra-fixa" })}
        >
          {cta}
          <span aria-hidden className="mt-seta">→</span>
        </a>
      </div>
    </>
  );
}
