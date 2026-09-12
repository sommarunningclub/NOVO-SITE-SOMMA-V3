"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { ENDERECO_COMPLETO, GEO, LOCAL_COMPLETO, MAPS_URL } from "@/lib/somma-day/event.config";
import { evento as rastrear } from "@/lib/somma-day/analytics";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * O Estacionamento 9 no mapa.
 *
 * Satélite de propósito: o participante precisa reconhecer o estacionamento de
 * cima, não ler nomes de rua. A coordenada é a que a Places API devolveu para
 * o endereço oficial — cravada no config, não resolvida em tempo de execução,
 * para o mapa não depender de uma segunda chamada para aparecer no lugar certo.
 *
 * Se a chave faltar ou a API falhar, cai para um bloco com o endereço e o link
 * do Google Maps: a informação de onde ir nunca depende do mapa carregar.
 */
export default function MapaLocal() {
  const ref = useRef<HTMLDivElement>(null);
  const [falhou, setFalhou] = useState(!KEY);

  useEffect(() => {
    if (!KEY) return;
    let cancelado = false;
    setOptions({ key: KEY, v: "weekly", language: "pt-BR", region: "BR" });

    (async () => {
      try {
        const { Map, OverlayView } = await importLibrary("maps");
        if (cancelado || !ref.current) return;

        const mapa = new Map(ref.current, {
          center: GEO,
          zoom: 17,
          mapTypeId: "satellite",
          tilt: 0,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
        });

        class Pulso extends OverlayView {
          private el: HTMLDivElement | null = null;
          constructor(private posicao: google.maps.LatLngLiteral) {
            super();
          }
          onAdd() {
            this.el = document.createElement("div");
            this.el.className = "sd-mapa-pulso";
            this.getPanes()?.overlayMouseTarget.appendChild(this.el);
          }
          draw() {
            const proj = this.getProjection();
            if (!proj || !this.el) return;
            const p = proj.fromLatLngToDivPixel(new google.maps.LatLng(this.posicao.lat, this.posicao.lng));
            if (p) {
              this.el.style.left = `${p.x}px`;
              this.el.style.top = `${p.y}px`;
            }
          }
          onRemove() {
            this.el?.remove();
            this.el = null;
          }
        }

        new Pulso(GEO).setMap(mapa);
      } catch {
        if (!cancelado) setFalhou(true);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div className="sd-sticker overflow-hidden bg-[var(--sd-tinta)]">
      {falhou ? (
        <div className="flex h-[260px] items-center justify-center bg-white px-6 text-center text-sm font-bold sm:h-[340px]">
          {ENDERECO_COMPLETO}
        </div>
      ) : (
        <div ref={ref} className="h-[260px] w-full sm:h-[340px]" aria-label={`Mapa: ${LOCAL_COMPLETO}`} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t-[3px] border-[var(--sd-tinta)] bg-[var(--sd-creme)] px-5 py-4">
        <p className="text-[13px] font-bold leading-snug">{ENDERECO_COMPLETO}</p>
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => rastrear("mapa_aberto")}
          className="sd-botao bg-[var(--sd-azul)] px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--sd-creme)]"
        >
          Abrir no Maps
        </a>
      </div>
    </div>
  );
}
