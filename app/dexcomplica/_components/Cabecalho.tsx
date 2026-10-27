"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { rastrear } from "@/lib/dexcomplica-love-run/analytics";
import { useMeuIngresso } from "./meuIngresso";
import PlayerSom from "./PlayerSom";

const LINKS = [
  ["#corre", "O corre"],
  ["#after", "O after"],
  ["#festa", "A festa"],
  ["#local", "Localização"],
  ["#inscricao", "Inscrição"],
] as const;

export default function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);
  const ingresso = useMeuIngresso();

  useEffect(() => {
    const onScroll = () => setRolou(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberto]);

  return (
    <header className={`lr-cab${rolou || aberto ? " lr-cab--solido" : ""}`}>
      <div className="lr-cab__barra">
        <a href="#conteudo" className="lr-cab__marcas" aria-label="Dexcomplica Love Run, início">
          <Image src="/dexcomplica-love-run/marca/somma-branca.svg" alt="" width={1280} height={343} className="lr-cab__somma" priority />
          <span aria-hidden="true" className="lr-cab__x">×</span>
          <Image src="/dexcomplica-love-run/marca/dex-logo.png" alt="" width={900} height={194} className="lr-cab__dex" priority />
        </a>

        <nav aria-label="Seções" className="lr-cab__nav">
          {LINKS.slice(0, 4).map(([href, rotulo]) => (
            <a key={href} href={href}>{rotulo}</a>
          ))}
        </nav>

        <div className="lr-cab__acoes">
          <PlayerSom />
          {ingresso ? (
            <a href={ingresso} className="lr-cab__ingresso">Meu ingresso</a>
          ) : null}
          <a href="#inscricao" className="lr-btn lr-btn--vermelho lr-btn--p" onClick={() => rastrear("cta_clicado", { origem: "cabecalho" })}>
            Garanta sua vaga
          </a>
          <button
            type="button"
            className="lr-cab__menu"
            aria-expanded={aberto}
            aria-controls="lr-menu"
            onClick={() => setAberto((v) => !v)}
          >
            <span className="sr-only">{aberto ? "Fechar menu" : "Abrir menu"}</span>
            <span aria-hidden="true" className="lr-cab__menu-icone" data-aberto={aberto} />
          </button>
        </div>
      </div>

      <nav id="lr-menu" aria-label="Seções" className="lr-cab__gaveta" hidden={!aberto}>
        {LINKS.map(([href, rotulo]) => (
          <a key={href} href={href} onClick={() => setAberto(false)}>{rotulo}</a>
        ))}
        {ingresso ? <a href={ingresso} onClick={() => setAberto(false)}>Meu ingresso</a> : null}
      </nav>
    </header>
  );
}
