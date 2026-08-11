"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { CAMERA_PARQUE, ESTACIONAMENTO_9, PARQUE_CONTORNO } from "./_parque-data";

/**
 * Mapa 3D do evento final.
 *
 * Usa os tiles fotorrealistas do Google (biblioteca `maps3d`) para mostrar o
 * Parque da Cidade em perspectiva, com o contorno do parque extrudado e a
 * câmera orbitando o estacionamento 9. Se a biblioteca 3D não carregar — chave
 * sem permissão, navegador sem WebGL, rede ruim —, cai para uma imagem de
 * satélite estática, para o slide nunca ficar com um buraco.
 */

declare global {
  interface Window {
    __sommaMaps3dConfigured?: boolean;
  }
}

const GOLD = "#C6A664";
const RED = "#D22030";

/** Altitude do terreno no estacionamento 9, medida pela Elevation API. */
const ALTITUDE_TERRENO = 1108;
/** Altura das paredes do contorno, em metros acima do chão. */
const ALTURA_CONTORNO = 90;
/** Abertura final, já em cima do estacionamento. */
const RANGE_ESTACIONAMENTO = 1300;
/** Tempo parado mostrando o parque inteiro antes de descer. */
const ESPERA_ANTES_DE_DESCER = 2600;
const DURACAO_DESCIDA = 5000;
/** Sem sinal de "mapa estável" nesse prazo, mostra o satélite estático. */
const LIMITE_DE_ESPERA = 14000;

const CHAVE = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type Estado = "carregando" | "pronto" | "fallback";

export function ParqueMap() {
  const caixa = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<Estado>("carregando");

  useEffect(() => {
    if (!CHAVE) {
      setEstado("fallback");
      return;
    }

    let cancelado = false;
    let parar: (() => void) | undefined;

    async function montar() {
      try {
        // setOptions é global e só vale antes do primeiro import: guarda para
        // não brigar com outros mapas do site.
        if (!window.__sommaMaps3dConfigured) {
          setOptions({ key: CHAVE!, v: "beta" });
          window.__sommaMaps3dConfigured = true;
        }

        const { Map3DElement, Polygon3DElement, Marker3DElement, AltitudeMode, MapMode } =
          await importLibrary("maps3d");
        if (cancelado || !caixa.current) return;

        // Abre enquadrando o parque inteiro; só depois desce no estacionamento.
        const mapa = new Map3DElement({
          center: { ...CAMERA_PARQUE.center, altitude: ALTITUDE_TERRENO },
          range: CAMERA_PARQUE.range,
          tilt: CAMERA_PARQUE.tilt,
          heading: CAMERA_PARQUE.heading,
          mode: MapMode.HYBRID,
          defaultUIHidden: true,
        });
        mapa.style.width = "100%";
        mapa.style.height = "100%";

        // Contorno do parque como uma parede baixa, para a área inteira ler de
        // relance mesmo com a câmera baixa.
        const contorno = new Polygon3DElement({
          outerCoordinates: PARQUE_CONTORNO.map(([lat, lng]) => ({
            lat,
            lng,
            altitude: ALTURA_CONTORNO,
          })),
          altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
          extruded: true,
          drawsOccludedSegments: true,
          strokeColor: GOLD,
          strokeWidth: 3,
          fillColor: "rgba(198, 166, 100, 0.18)",
        });

        // Haste vermelha no ponto exato do evento.
        const marcador = new Marker3DElement({
          position: { ...ESTACIONAMENTO_9, altitude: 140 },
          altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
          extruded: true,
          label: ESTACIONAMENTO_9.nome,
        });

        mapa.append(contorno);
        mapa.append(marcador);
        caixa.current.replaceChildren(mapa);

        // Só declara pronto quando o mapa termina de desenhar. Se os tiles não
        // vierem — WebGL indisponível, rede ruim —, cai para o satélite.
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

        // Desce até o estacionamento e fica orbitando devagar por lá: dá a
        // leitura de volume sem virar carrossel.
        const camera = {
          center: { ...ESTACIONAMENTO_9, altitude: ALTITUDE_TERRENO },
          tilt: 66,
          range: RANGE_ESTACIONAMENTO,
        };
        const descida = window.setTimeout(() => {
          mapa.flyCameraTo({ endCamera: camera, durationMillis: DURACAO_DESCIDA });
        }, ESPERA_ANTES_DE_DESCER);
        const orbita = window.setTimeout(
          () =>
            mapa.flyCameraAround({
              camera,
              durationMillis: 140000,
              repeatCount: Number.POSITIVE_INFINITY,
            }),
          ESPERA_ANTES_DE_DESCER + DURACAO_DESCIDA + 400,
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

  return (
    <div className="a-up relative overflow-hidden rounded-3xl border border-white/10 bg-[#080F26]">
      <div ref={caixa} className="h-[250px] w-full sm:h-[300px] lg:h-[352px]" aria-hidden={estado !== "pronto"}>
        {estado === "fallback" && CHAVE && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${ESTACIONAMENTO_9.lat},${ESTACIONAMENTO_9.lng}&zoom=14&size=640x420&scale=2&maptype=satellite&markers=color:red%7C${ESTACIONAMENTO_9.lat},${ESTACIONAMENTO_9.lng}&key=${CHAVE}`}
            alt={`Vista de satélite do ${ESTACIONAMENTO_9.nome} no Parque da Cidade`}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {estado === "carregando" && (
        <p className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
          Carregando o parque em 3D…
        </p>
      )}

      {/* Legenda por cima do mapa, com o endereço e o link para abrir no Maps. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#060B1C] via-[#060B1C]/80 to-transparent px-4 pb-4 pt-12 sm:px-6 sm:pb-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em]" style={{ color: RED }}>
              Evento final · domingo
            </p>
            <p className="mt-1.5 font-display text-lg font-semibold uppercase leading-tight tracking-tight sm:text-xl">
              {ESTACIONAMENTO_9.nome}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-white/55">
              {ESTACIONAMENTO_9.endereco} · CEP {ESTACIONAMENTO_9.cep}
            </p>
          </div>
          <a
            href={ESTACIONAMENTO_9.maps}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/75 transition-colors hover:text-white"
            style={{ borderColor: `${GOLD}59` }}
          >
            Abrir no Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
