"use client";

import { useEffect, useRef, useState } from "react";
import { TRILHA } from "@/lib/dexcomplica-love-run/event.config";
import { rastrear } from "@/lib/dexcomplica-love-run/analytics";
import { Equalizador } from "./Graficos";

/**
 * "Trilha do Love Run": o player oficial do Spotify com a música da página.
 *
 * O iframe só é criado quando o bloco chega perto da tela: o Spotify é pesado
 * e grava cookies próprios, então quem não rola até aqui nem baixa o player.
 * Até lá fica uma reserva do mesmo tamanho (sem pulo de layout) com o link
 * para abrir a faixa no app.
 */
export default function Trilha() {
  const caixa = useRef<HTMLDivElement>(null);
  const [carregar, setCarregar] = useState(false);
  const player = useRef<HTMLIFrameElement>(null);
  const urlFaixa = `https://open.spotify.com/track/${TRILHA.spotifyId}`;

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setCarregar(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Clique dentro do iframe não chega à página; o que chega é o foco saindo
  // para ele. Uma vez por visita basta para medir quem apertou o play.
  useEffect(() => {
    if (!carregar) return;
    const aoSair = () => {
      if (document.activeElement === player.current) {
        rastrear("trilha_tocada");
        window.removeEventListener("blur", aoSair);
      }
    };
    window.addEventListener("blur", aoSair);
    return () => window.removeEventListener("blur", aoSair);
  }, [carregar]);

  return (
    <section className="lr-trilha" aria-labelledby="t-trilha">
      <div className="lr-wrap lr-trilha__grid">
        <div className="lr-trilha__texto">
          <p className="lr-eyebrow lr-eyebrow--claro">
            Trilha do Love Run <Equalizador className="lr-trilha__eq" />
          </p>
          <h2 id="t-trilha" className="lr-trilha__titulo">Aperta o play.</h2>
          <p className="lr-trilha__faixa">
            {TRILHA.titulo} · {TRILHA.artistas}
          </p>
        </div>
        <div className="lr-trilha__player" ref={caixa}>
          {carregar ? (
            <iframe
              ref={player}
              title={`${TRILHA.titulo}, de ${TRILHA.artistas}, no Spotify`}
              src={`https://open.spotify.com/embed/track/${TRILHA.spotifyId}?utm_source=generator&theme=0`}
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          ) : (
            <a className="lr-trilha__reserva" href={urlFaixa} target="_blank" rel="noopener noreferrer">
              Ouvir no Spotify
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
