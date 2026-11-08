"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { GEO, MAPA } from "@/lib/boracomsomma/config";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/** Mapa escuro no tom da BORA: preto, cinzas e o verde-limão só no que importa. */
const ESTILO_ESCURO: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0b0b0b" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0b0b" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", stylers: [{ visibility: "on" }] },
  { featureType: "poi.park", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#13200a" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#7f9a3a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#262626" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9a9a9a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#2f2f2f" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3a3a" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#061418" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d5a60" }] },
];

type Tipo = "mapa" | "satelite";

/**
 * Ponto de encontro com a Maps JavaScript API.
 *
 * Só carrega a API quando o mapa chega perto da tela (a LP é longa e o mapa
 * fica lá embaixo). O pino é um overlay em CSS na coordenada do Estacionamento
 * 10 que a Places API devolveu. Se a chave faltar ou a API falhar, cai para o
 * embed simples do Google Maps: onde ir nunca depende da API.
 */
export function MapaEncontro({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<google.maps.Map | null>(null);
  const [falhou, setFalhou] = useState(!KEY);
  const [tipo, setTipo] = useState<Tipo>("mapa");

  useEffect(() => {
    if (!KEY || !ref.current) return;
    let cancelado = false;
    const alvo = ref.current;

    async function montar() {
      try {
        setOptions({ key: KEY!, v: "weekly", language: "pt-BR", region: "BR" });
        const { Map, OverlayView } = await importLibrary("maps");
        if (cancelado) return;

        const mapa = new Map(alvo, {
          center: GEO,
          zoom: 16,
          styles: ESTILO_ESCURO,
          backgroundColor: "#0b0b0b",
          tilt: 0,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
          clickableIcons: false,
        });
        mapaRef.current = mapa;

        class Pino extends OverlayView {
          private el: HTMLDivElement | null = null;
          onAdd() {
            const el = document.createElement("div");
            el.className = "bcs-pino";
            el.innerHTML =
              '<span class="bcs-pino-rotulo">Estacionamento 10</span>' +
              '<span class="bcs-pino-onda"></span><span class="bcs-pino-ponto"></span>';
            this.el = el;
            this.getPanes()?.overlayMouseTarget.appendChild(el);
          }
          draw() {
            const p = this.getProjection()?.fromLatLngToDivPixel(new google.maps.LatLng(GEO.lat, GEO.lng));
            if (p && this.el) {
              this.el.style.left = `${p.x}px`;
              this.el.style.top = `${p.y}px`;
            }
          }
          onRemove() {
            this.el?.remove();
            this.el = null;
          }
        }
        new Pino().setMap(mapa);
      } catch {
        if (!cancelado) setFalhou(true);
      }
    }

    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          obs.disconnect();
          montar();
        }
      },
      { rootMargin: "600px 0px" },
    );
    obs.observe(alvo);

    return () => {
      cancelado = true;
      obs.disconnect();
    };
  }, []);

  function trocar(novo: Tipo) {
    setTipo(novo);
    mapaRef.current?.setMapTypeId(novo === "satelite" ? "satellite" : "roadmap");
  }

  if (falhou) {
    return (
      <iframe
        title="Mapa: Estacionamento 10 do Parque da Cidade"
        src={MAPA.embed}
        className={`w-full grayscale invert-[0.92] hue-rotate-180 ${className}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }

  const aba = (t: Tipo, rotulo: string) => (
    <button
      type="button"
      onClick={() => trocar(t)}
      aria-pressed={tipo === t}
      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
        tipo === t ? "bg-bora text-black" : "text-white/80 hover:text-white"
      }`}
    >
      {rotulo}
    </button>
  );

  return (
    <div className={`relative bg-[#0b0b0b] ${className}`}>
      <style>{CSS_PINO}</style>
      <div ref={ref} className="h-full w-full" aria-label="Mapa: Estacionamento 10 do Parque da Cidade, Brasília" />
      <div className="absolute left-3 top-3 flex rounded-full border border-white/15 bg-black/75 p-1 backdrop-blur">
        {aba("mapa", "Mapa")}
        {aba("satelite", "Satélite")}
      </div>
    </div>
  );
}

const CSS_PINO = `
.bcs-pino{position:absolute;width:0;height:0;pointer-events:none}
.bcs-pino-ponto{position:absolute;left:-11px;top:-11px;width:22px;height:22px;border-radius:9999px;background:#CEFF00;border:3px solid #000;box-shadow:0 0 0 2px #CEFF00,0 6px 18px rgba(0,0,0,.6)}
.bcs-pino-onda{position:absolute;left:-11px;top:-11px;width:22px;height:22px;border-radius:9999px;background:rgba(206,255,0,.45);animation:bcs-onda 1.8s ease-out infinite}
.bcs-pino-rotulo{position:absolute;left:0;bottom:22px;transform:translateX(-50%);white-space:nowrap;background:#CEFF00;color:#000;font-weight:800;font-size:12px;letter-spacing:.06em;text-transform:uppercase;padding:6px 10px;border-radius:9999px;box-shadow:0 6px 18px rgba(0,0,0,.5)}
.bcs-pino-rotulo:after{content:"";position:absolute;left:50%;bottom:-5px;transform:translateX(-50%) rotate(45deg);width:10px;height:10px;background:#CEFF00}
@keyframes bcs-onda{from{transform:scale(1);opacity:1}to{transform:scale(3.4);opacity:0}}
@media (prefers-reduced-motion:reduce){.bcs-pino-onda{animation:none;opacity:0}}
`;
