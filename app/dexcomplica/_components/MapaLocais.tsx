"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { PONTOS, urlComoChegar, urlNoMapa, type Ponto } from "@/lib/dexcomplica-love-run/event.config";
import { rastrear } from "@/lib/dexcomplica-love-run/analytics";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Os dois pontos no mesmo mapa: o encontro no Estacionamento 1 e o
 * Oscarito. Coordenadas e Place IDs conferidos na Places API e cravados no
 * config (o mapa não depende de geocodificar em tempo de execução).
 *
 * A API só carrega quando o bloco chega perto da tela. Sem chave, com a API
 * fora ou bloqueada, ficam os cartões com endereço e "Como chegar": a
 * informação de onde ir nunca depende do mapa.
 */
export default function MapaLocais() {
  const caixa = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<"espera" | "carregando" | "pronto" | "falhou">(KEY ? "espera" : "falhou");

  useEffect(() => {
    const el = caixa.current;
    if (!KEY || !el) return;
    let cancelado = false;

    const carregar = async () => {
      setEstado("carregando");
      try {
        setOptions({ key: KEY, v: "weekly", language: "pt-BR", region: "BR" });
        const { Map, InfoWindow } = await importLibrary("maps");
        const { Marker } = await importLibrary("marker");
        if (cancelado) return;

        const mapa = new Map(el, {
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
          clickableIcons: false,
        });
        const limites = new google.maps.LatLngBounds();
        const info = new InfoWindow();
        PONTOS.forEach((p, i) => {
          const m = new Marker({
            map: mapa,
            position: p.geo,
            title: p.nome,
            label: { text: String(i + 1), color: "#ffffff", fontWeight: "700" },
          });
          m.addListener("click", () => {
            info.setContent(`<strong>${p.nome}</strong><br><a href="${urlComoChegar(p)}" target="_blank" rel="noopener">Como chegar</a>`);
            info.open({ map: mapa, anchor: m });
          });
          limites.extend(p.geo);
        });
        mapa.fitBounds(limites, 64);
        google.maps.event.addListenerOnce(mapa, "idle", () => {
          if ((mapa.getZoom() ?? 0) > 17) mapa.setZoom(17);
        });
        setEstado("pronto");
      } catch {
        if (!cancelado) setEstado("falhou");
      }
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          carregar();
        }
      },
      { rootMargin: "300px 0px" }
    );
    io.observe(el);
    return () => {
      cancelado = true;
      io.disconnect();
    };
  }, []);

  return (
    <div className="lr-local">
      <ol className="lr-local__cartoes">
        {PONTOS.map((p, i) => (
          <Cartao key={p.id} ponto={p} n={i + 1} />
        ))}
      </ol>
      <div className="lr-local__mapa" data-estado={estado}>
        <div ref={caixa} className="lr-local__canvas" role="region" aria-label="Mapa com o local do corre e do after" />
        {estado !== "pronto" ? (
          <div className="lr-local__reserva">
            {estado === "falhou" ? (
              <>
                <p>O mapa não carregou. Abra os locais direto no Google Maps:</p>
                {PONTOS.map((p) => (
                  <a key={p.id} href={urlNoMapa(p)} target="_blank" rel="noopener noreferrer">
                    {p.nome}
                  </a>
                ))}
              </>
            ) : (
              <p>Carregando mapa…</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Cartao({ ponto, n }: { ponto: Ponto; n: number }) {
  return (
    <li className="lr-local__cartao" data-revelar>
      <span className="lr-local__n" aria-hidden="true">{n}</span>
      <div>
        <p className="lr-local__rotulo">{ponto.rotulo}</p>
        <h3 className="lr-local__nome">{ponto.nome}</h3>
        <p className="lr-local__end">{ponto.endereco}</p>
        <a
          className="lr-btn lr-btn--tinta lr-btn--p"
          href={urlComoChegar(ponto)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => rastrear("como_chegar", { origem: ponto.id })}
        >
          Como chegar
        </a>
      </div>
    </li>
  );
}
