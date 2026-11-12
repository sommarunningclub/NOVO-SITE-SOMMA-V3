"use client";

import { useEffect, useRef, useState } from "react";
import { aoRecusarChave, carregarMaps, criarPino, ESTILO_ESCURO, MAP_ID, TEM_CHAVE } from "./google";

/** Mapa do espaço do encontro. Só existe quando o painel tem as coordenadas do local. */
export function MapaLocal({ lat, lng, nome }: { lat: number; lng: number; nome: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [falhou, setFalhou] = useState(!TEM_CHAVE);

  useEffect(() => {
    const el = caixa.current;
    if (!el || !TEM_CHAVE) return;
    let cancelado = false;
    let limpar = () => {};
    const parar = aoRecusarChave(() => !cancelado && setFalhou(true));
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        carregarMaps()
          .then(({ Map }) => {
            if (cancelado || !caixa.current) return;
            const mapa = new Map(caixa.current, {
              center: { lat, lng },
              zoom: 16,
              disableDefaultUI: true,
              zoomControl: true,
              gestureHandling: "cooperative",
              backgroundColor: "#0d0d0d",
              clickableIcons: false,
              ...(MAP_ID ? { mapId: MAP_ID, colorScheme: "DARK" } : { styles: ESTILO_ESCURO }),
            });
            const pino = criarPino(mapa, { lat, lng }, { texto: "MEETING", classe: "mt-pino--largada", titulo: nome });
            limpar = () => pino.remover();
          })
          .catch(() => !cancelado && setFalhou(true));
      },
      { rootMargin: "300px 0px" }
    );
    io.observe(el);
    return () => {
      cancelado = true;
      parar();
      io.disconnect();
      limpar();
    };
  }, [lat, lng, nome]);

  if (falhou) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <p className="max-w-[20rem] text-[0.92rem] leading-relaxed text-[color:var(--mt-cinza)]">
          Mapa indisponível agora. Use o botão &ldquo;Como chegar&rdquo; para abrir a rota no seu aplicativo de mapas.
        </p>
      </div>
    );
  }
  return <div ref={caixa} className="h-full w-full" role="application" aria-label={`Mapa do local: ${nome}`} />;
}
