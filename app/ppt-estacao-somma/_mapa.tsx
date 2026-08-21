"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { gsap } from "gsap";

/**
 * Sobrevoo do Espaço Cerrado, no Parque da Cidade.
 *
 * Usa os tiles fotorrealistas do Google (biblioteca `maps3d`): abre com o
 * Parque inteiro, desce até o quiosque e fica orbitando baixo, como um drone
 * do SOMMA monitorando a área. Por cima, um HUD discreto com REC, tempo de voo,
 * coordenadas, altitude e rumo lidos da câmera em tempo real. Se o 3D não
 * carregar (chave sem permissão, sem WebGL, rede ruim), cai para a imagem de
 * satélite estática no mesmo ponto, com um sobrevoo simulado por movimento
 * lento da imagem e telemetria animada.
 */

declare global {
  interface Window {
    __sommaMaps3dConfigured?: boolean;
  }
}

export const ESPACO_CERRADO = {
  nome: "Espaço Cerrado",
  lat: -15.7953665,
  lng: -47.9010603,
  endereco: "Parque da Cidade Sarah Kubitschek · Brasília, DF",
  plusCode: "633X+VH Brasília, Plano Piloto",
  maps: "https://maps.app.goo.gl/?q=-15.7953665,-47.9010603",
} as const;

/** Enquadramento inicial: o Parque inteiro, visto do sul. */
const CAMERA_PARQUE = { center: { lat: -15.8005, lng: -47.9075 }, range: 6200, tilt: 52, heading: -18 };
/** Altitude do terreno na região do quiosque, em metros. */
const ALTITUDE_TERRENO = 1100;
/** Órbita do drone: baixa e inclinada, para ler o volume do quiosque. */
const RANGE_DRONE = 260;
const TILT_DRONE = 66;
const ESPERA_ANTES_DE_DESCER = 2200;
const DURACAO_DESCIDA = 5200;
/** Uma volta completa do drone em torno do quiosque. */
const DURACAO_ORBITA = 75000;
const LIMITE_DE_ESPERA = 14000;

const CHAVE = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const ORANGE = "#FF2C03";

type Estado = "carregando" | "pronto" | "fallback";

type Telemetria = { lat: number; lng: number; alt: number; hdg: number };

function fmtTempo(seg: number) {
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MapaEspacoCerrado() {
  const caixa = useRef<HTMLDivElement>(null);
  const foto = useRef<HTMLImageElement>(null);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [tele, setTele] = useState<Telemetria>({
    lat: CAMERA_PARQUE.center.lat,
    lng: CAMERA_PARQUE.center.lng,
    alt: CAMERA_PARQUE.range,
    hdg: (CAMERA_PARQUE.heading + 360) % 360,
  });
  const [tempo, setTempo] = useState(0);

  /* Relógio do voo e leitura da câmera (ou simulação, no fallback). */
  useEffect(() => {
    const inicio = performance.now();
    let raf = 0;
    let ultimo = 0;
    const tick = (agora: number) => {
      raf = requestAnimationFrame(tick);
      if (agora - ultimo < 200) return; // 5x por segundo é o bastante para o HUD
      ultimo = agora;
      const decorrido = (agora - inicio) / 1000;
      setTempo(decorrido);
      const mapa = caixa.current?.querySelector("gmp-map-3d") as
        | (HTMLElement & { center?: { lat: number; lng: number }; range?: number; heading?: number })
        | null;
      if (estado === "pronto" && mapa?.center) {
        setTele({
          lat: mapa.center.lat,
          lng: mapa.center.lng,
          alt: mapa.range ?? RANGE_DRONE,
          hdg: ((mapa.heading ?? 0) % 360 + 360) % 360,
        });
      } else if (estado === "fallback") {
        // Drone simulado: rumo girando devagar e pequena deriva em volta do ponto.
        const hdg = (decorrido * 4.8) % 360;
        const r = 0.00012;
        const a = (hdg * Math.PI) / 180;
        setTele({
          lat: ESPACO_CERRADO.lat + Math.cos(a) * r,
          lng: ESPACO_CERRADO.lng + Math.sin(a) * r,
          alt: 180 + Math.sin(decorrido / 9) * 12,
          hdg,
        });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [estado]);

  /* Sobrevoo simulado no fallback: a imagem de satélite desliza e aproxima devagar. */
  useEffect(() => {
    if (estado !== "fallback" || !foto.current) return;
    const tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } });
    tl.fromTo(foto.current, { scale: 1.18, xPercent: -3, yPercent: 2 }, { scale: 1.32, xPercent: 3, yPercent: -2, duration: 26 })
      .to(foto.current, { scale: 1.22, xPercent: -2, yPercent: -3, duration: 24 });
    return () => {
      tl.kill();
    };
  }, [estado]);

  useEffect(() => {
    if (!CHAVE) {
      setEstado("fallback");
      return;
    }
    let cancelado = false;
    let parar: (() => void) | undefined;

    async function montar() {
      try {
        if (!window.__sommaMaps3dConfigured) {
          setOptions({ key: CHAVE!, v: "beta" });
          window.__sommaMaps3dConfigured = true;
        }
        const { Map3DElement, Marker3DElement, AltitudeMode, MapMode } = await importLibrary("maps3d");
        if (cancelado || !caixa.current) return;

        const mapa = new Map3DElement({
          center: { ...CAMERA_PARQUE.center, altitude: ALTITUDE_TERRENO },
          range: CAMERA_PARQUE.range,
          tilt: CAMERA_PARQUE.tilt,
          heading: CAMERA_PARQUE.heading,
          mode: MapMode.SATELLITE,
          defaultUIHidden: true,
        });
        mapa.style.width = "100%";
        mapa.style.height = "100%";

        const marcador = new Marker3DElement({
          position: { lat: ESPACO_CERRADO.lat, lng: ESPACO_CERRADO.lng, altitude: 60 },
          altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
          extruded: true,
          label: ESPACO_CERRADO.nome,
        });
        mapa.append(marcador);
        caixa.current.replaceChildren(mapa);

        const desistir = window.setTimeout(() => {
          if (!cancelado) setEstado((atual) => (atual === "pronto" ? atual : "fallback"));
        }, LIMITE_DE_ESPERA);
        mapa.addEventListener("gmp-steadychange", (evento) => {
          if (!cancelado && evento.isSteady) {
            window.clearTimeout(desistir);
            setEstado("pronto");
          }
        });
        mapa.addEventListener("gmp-error", () => {
          if (!cancelado) setEstado("fallback");
        });

        const camera = {
          center: { lat: ESPACO_CERRADO.lat, lng: ESPACO_CERRADO.lng, altitude: ALTITUDE_TERRENO },
          tilt: TILT_DRONE,
          range: RANGE_DRONE,
          heading: -30,
        };
        const descida = window.setTimeout(() => {
          mapa.flyCameraTo({ endCamera: camera, durationMillis: DURACAO_DESCIDA });
        }, ESPERA_ANTES_DE_DESCER);
        const orbita = window.setTimeout(
          () => mapa.flyCameraAround({ camera, durationMillis: DURACAO_ORBITA, repeatCount: Number.POSITIVE_INFINITY }),
          ESPERA_ANTES_DE_DESCER + DURACAO_DESCIDA + 300,
        );
        parar = () => {
          window.clearTimeout(desistir);
          window.clearTimeout(descida);
          window.clearTimeout(orbita);
          mapa.stopCameraAnimation();
        };
      } catch {
        if (!cancelado) setEstado("fallback");
      }
    }

    montar();
    return () => {
      cancelado = true;
      parar?.();
    };
  }, []);

  const estatico = CHAVE
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${ESPACO_CERRADO.lat},${ESPACO_CERRADO.lng}&zoom=18&size=640x640&scale=2&maptype=satellite&key=${CHAVE}`
    : null;

  const voando = estado !== "carregando";

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0A0A0A]">
      <div ref={caixa} className="absolute inset-0" aria-hidden={estado !== "pronto"} />

      {estado === "fallback" && estatico ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={foto}
          src={estatico}
          alt="Vista de satélite do Espaço Cerrado no Parque da Cidade"
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
        />
      ) : null}

      {estado === "carregando" ? (
        <p className="absolute inset-0 flex items-center justify-center font-display text-[10px] uppercase tracking-[0.3em] text-white/40">
          Decolando
        </p>
      ) : null}

      {/* HUD do drone: moldura fina, mira no centro e telemetria. Tudo em linha, nada decorativo. */}
      <div className="pointer-events-none absolute inset-0 z-10 font-mono text-[10px] tracking-[0.2em] text-white/70" aria-hidden>
        {/* cantos da moldura */}
        {[
          "left-6 top-6 border-l border-t",
          "right-6 top-6 border-r border-t",
          "left-6 bottom-6 border-l border-b",
          "right-6 bottom-6 border-r border-b",
        ].map((c) => (
          <span key={c} className={`absolute h-7 w-7 border-white/45 ${c}`} />
        ))}

        {/* mira */}
        <span className="absolute left-1/2 top-1/2 h-px w-10 -translate-x-1/2 -translate-y-1/2 bg-white/55" />
        <span className="absolute left-1/2 top-1/2 h-10 w-px -translate-x-1/2 -translate-y-1/2 bg-white/55" />
        <span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 border border-white/20" />

        {/* topo esquerdo: quem monitora */}
        <div className="absolute left-12 top-8 flex items-center gap-3">
          <span
            className="inline-block h-2 w-2"
            style={{ backgroundColor: ORANGE, animation: voando ? "somma-rec 1.1s steps(1) infinite" : undefined }}
          />
          <span className="text-white">REC</span>
          <span>{fmtTempo(tempo)}</span>
          <span className="ml-3 text-white/45">SOMMA · DRONE 01 · SOBREVOO</span>
        </div>

        {/* topo direito: telemetria */}
        <div className="absolute right-16 top-8 text-right leading-[1.9]">
          <p>
            LAT <span className="text-white">{tele.lat.toFixed(6)}</span>
          </p>
          <p>
            LNG <span className="text-white">{tele.lng.toFixed(6)}</span>
          </p>
          <p>
            ALT <span className="text-white">{Math.round(tele.alt)} m</span>
            <span className="ml-4">HDG <span className="text-white">{String(Math.round(tele.hdg)).padStart(3, "0")}°</span></span>
          </p>
        </div>

        <style>{`@keyframes somma-rec { 0%, 55% { opacity: 1 } 56%, 100% { opacity: 0.15 } }`}</style>
      </div>
    </div>
  );
}
