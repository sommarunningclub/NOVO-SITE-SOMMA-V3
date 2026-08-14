"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import {
  EVENT,
  EVENT_PATH,
  SOMMA_BASE,
  UNITS,
  UNIT_LABELS,
  getUnit,
  inscricoesAbertas,
  type EventUnit,
} from "@/lib/desafio-esteiras/event.config";
import { track } from "@/lib/desafio-esteiras/analytics";
import {
  distanciaKm,
  modoRota,
  rotaGoogleUrl,
  type LatLng,
} from "@/lib/desafio-esteiras/geo";
import { riseIn, useScope } from "../_motion";
import { FitLines } from "./FitLines";
import { NearYou } from "./NearYou";
import { statsPorUnidade, useLiveStats, type StatsIniciais } from "./useLiveStats";

/** Estilo escuro do mapa — o mapa precisa desaparecer atrás dos marcadores. */
const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#101014" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#08080a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6f6f78" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1b1b21" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2a2a32" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b0b12" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2b2b33" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#0e0e12" }] },
];

function marcador(cor: string, ativo: boolean): google.maps.Symbol {
  return {
    path: "M 0,-11 A 11,11 0 1,1 0,11 A 11,11 0 1,1 0,-11",
    fillColor: cor,
    fillOpacity: 1,
    strokeColor: "#08080a",
    strokeWeight: ativo ? 5 : 3,
    scale: ativo ? 1.35 : 1,
  };
}

/**
 * Encontre sua Evolve.
 *
 * Google Maps quando a chave está configurada; se não estiver (ou se o script
 * falhar), a seção degrada para um mapa esquemático em SVG com as coordenadas
 * reais projetadas — a escolha de unidade e o "como chegar" continuam
 * funcionando em qualquer cenário.
 */
export function UnitsMap({ iniciais }: { iniciais: StatsIniciais }) {
  const [selecionada, setSelecionada] = useState<EventUnit>(UNITS[0]);
  const [mapaOk, setMapaOk] = useState<boolean | null>(null);
  const [origem, setOrigem] = useState<LatLng | null>(null);
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const marcadoresRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const origemRef = useRef<LatLng | null>(null);
  origemRef.current = origem;

  const stats = useLiveStats(iniciais);
  const unidades = statsPorUnidade(stats);
  const dados = unidades.find((u) => u.id === selecionada.id);
  const status = dados?.status ?? selecionada.status;

  const root = useScope<HTMLElement>(({ root }) => {
    riseIn(root.querySelectorAll(".map-anim"), { trigger: root, start: "top 78%", stagger: 0.1 });
  });

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !mapDiv.current) {
      setMapaOk(false);
      return;
    }

    let cancelado = false;
    setOptions({ key, v: "weekly" });

    importLibrary("maps")
      .then(({ Map }) => {
        if (cancelado || !mapDiv.current) return;

        const map = new Map(mapDiv.current, {
          center: { lat: -15.95, lng: -48.01 },
          zoom: 9,
          styles: MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative", // não sequestra o scroll da página
          keyboardShortcuts: false,
        });
        mapRef.current = map;

        const bounds = new google.maps.LatLngBounds();
        UNITS.forEach((unit) => {
          const pos = { lat: unit.latitude, lng: unit.longitude };
          bounds.extend(pos);
          const m = new google.maps.Marker({
            map,
            position: pos,
            title: unit.nome,
            icon: marcador(unit.sommaBase ? "#ff2c04" : "#e0261b", unit.id === UNITS[0].id),
            optimized: false,
          });
          m.addListener("click", () => selecionar(unit, { centralizar: false }));
          marcadoresRef.current.set(unit.id, m);
        });
        map.fitBounds(bounds, { top: 60, bottom: 60, left: 40, right: 40 });

        setMapaOk(true);
      })
      .catch(() => {
        if (!cancelado) setMapaOk(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !origem || mapaOk !== true) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        map,
        position: origem,
        title: "Você",
        zIndex: 20,
        icon: {
          path: "M 0,-7 A 7,7 0 1,1 0,7 A 7,7 0 1,1 0,-7",
          fillColor: "#f2f0ec",
          fillOpacity: 1,
          strokeColor: "#ff2c04",
          strokeWeight: 3,
          scale: 1,
        },
      });
    } else {
      userMarkerRef.current.setPosition(origem);
    }

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(origem);
    bounds.extend({ lat: selecionada.latitude, lng: selecionada.longitude });
    map.fitBounds(bounds, { top: 72, bottom: 72, left: 48, right: 48 });
    const zoom = map.getZoom() ?? 13;
    if (zoom > 14) map.setZoom(14);
  }, [origem, selecionada, mapaOk]);

  function selecionar(
    unit: EventUnit,
    opts: { centralizar?: boolean; origem?: string; km?: number } = {},
  ) {
    const centralizar = opts.centralizar ?? true;
    setSelecionada(unit);
    track("select_unit", {
      unidade: unit.id,
      origem: opts.origem ?? "mapa",
      ...(typeof opts.km === "number" ? { km: Number(opts.km.toFixed(1)) } : {}),
    });

    marcadoresRef.current.forEach((m, id) => {
      const u = UNITS.find((x) => x.id === id);
      m.setIcon(marcador(u?.sommaBase ? "#ff2c04" : "#e0261b", id === unit.id));
      m.setZIndex(id === unit.id ? 10 : 1);
    });

    if (centralizar && mapRef.current && !origemRef.current) {
      mapRef.current.panTo({ lat: unit.latitude, lng: unit.longitude });
      if ((mapRef.current.getZoom() ?? 9) < 12) mapRef.current.setZoom(13);
    }
  }

  const abertas = inscricoesAbertas();
  const fechada = status === "encerrada";
  const kmOrigem = origem
    ? distanciaKm(origem, { lat: selecionada.latitude, lng: selecionada.longitude })
    : null;
  const rotaHref = rotaGoogleUrl(
    selecionada,
    origem,
    kmOrigem != null ? modoRota(kmOrigem) : "driving",
  );
  const ficha = selecionada.google;

  return (
    <section
      ref={root}
      id="mapa"
      className="dst-section relative scroll-mt-16 overflow-hidden border-t border-[color:var(--line)]"
      aria-labelledby="mapa-titulo"
    >
      <div className="dst-wrap">
        <p className="dst-label map-anim mb-6 text-[color:var(--somma)]">Localização</p>
        <h2 id="mapa-titulo" className="map-anim">
          <FitLines linhas={["ENCONTRE", "SUA EVOLVE"]} max="8rem" min="2.2rem" />
        </h2>

        <NearYou
          onLocated={(pos, nearestId) => {
            const unit = getUnit(nearestId);
            if (!unit) return;
            setOrigem(pos);
            selecionar(unit, {
              centralizar: false,
              origem: "localizacao",
              km: distanciaKm(pos, { lat: unit.latitude, lng: unit.longitude }),
            });
          }}
        />

        <div className="map-anim mt-10 grid gap-4 md:mt-14 md:grid-cols-12 md:gap-6">
          {/* Seletor de unidade */}
          <div className="md:col-span-4">
            <ul className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
              {UNITS.map((unit) => {
                const u = unidades.find((x) => x.id === unit.id);
                const ativo = unit.id === selecionada.id;
                return (
                  <li key={unit.id} className="shrink-0 md:shrink">
                    <button
                      type="button"
                      onClick={() => selecionar(unit)}
                      aria-pressed={ativo}
                      className="dst-panel flex min-h-[64px] w-full min-w-[160px] items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors md:min-w-0"
                      style={{
                        borderColor: ativo ? "var(--somma)" : "var(--line)",
                        background: ativo ? "rgba(255,44,4,0.08)" : "var(--ink-2)",
                      }}
                    >
                      <span>
                        <span className="dst-display block text-[1.05rem]">{unit.curto}</span>
                        <span className="dst-label mt-1 block text-[color:rgba(242,240,236,0.4)]">
                          {unit.cidade}/{unit.uf}
                        </span>
                      </span>
                      <span
                        className="dst-num text-sm font-bold"
                        style={{ color: ativo ? "var(--somma)" : "rgba(242,240,236,0.5)" }}
                      >
                        {(u?.inscritos ?? 0).toLocaleString("pt-BR")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Mapa */}
          <div className="md:col-span-8">
            <div className="dst-panel relative h-[320px] overflow-hidden md:h-[440px]">
              <div ref={mapDiv} className="absolute inset-0 h-full w-full" aria-hidden={mapaOk !== true} />

              {mapaOk === null && (
                <div className="absolute inset-0 grid place-items-center">
                  <span className="dst-label text-[color:rgba(242,240,236,0.4)]">Carregando mapa…</span>
                </div>
              )}

              {mapaOk === false && (
                <MapaEsquematico selecionada={selecionada} origem={origem} onSelect={selecionar} />
              )}
            </div>
          </div>
        </div>

        {/* Detalhe da unidade selecionada */}
        <div className="map-anim dst-panel mt-4 grid gap-6 p-6 md:mt-6 md:grid-cols-12 md:p-8">
          <div className="md:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="dst-display text-[clamp(1.5rem,5vw,2.4rem)]">
                {ficha?.nome ?? selecionada.nome}
              </h3>
              <span className="dst-label bg-[color:var(--paper)] px-2.5 py-1.5 text-[0.5rem] text-[color:var(--ink)]">
                Grátis
              </span>
              {selecionada.sommaBase && (
                <span className="dst-label bg-[color:var(--somma)] px-2.5 py-1.5 text-[0.5rem] text-[color:var(--ink)]">
                  {SOMMA_BASE.selo}
                </span>
              )}
            </div>
            {ficha && (
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="dst-num text-xl font-bold">
                  {ficha.rating.toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </span>
                <Estrelas valor={ficha.rating} />
                <span className="dst-label text-[color:rgba(242,240,236,0.45)]">
                  {ficha.avaliacoes.toLocaleString("pt-BR")} avaliações no Google
                </span>
              </p>
            )}
            {ficha?.categoria && (
              <p className="dst-label mt-2 text-[color:rgba(242,240,236,0.4)]">{ficha.categoria}</p>
            )}
            <p className="mt-3 max-w-[52ch] text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.68)]">
              {selecionada.endereco}
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-4 md:col-span-5">
            <div>
              <dt className="dst-label text-[color:rgba(242,240,236,0.4)]">Dia do desafio</dt>
              <dd className="dst-num mt-2 text-lg font-bold">{EVENT.horaLabel}</dd>
              <dd className="dst-label mt-1 text-[color:rgba(242,240,236,0.4)]">{EVENT.dataCurta}</dd>
            </div>
            <div>
              <dt className="dst-label text-[color:rgba(242,240,236,0.4)]">Inscritos</dt>
              <dd className="dst-num mt-2 text-lg font-bold" style={{ color: "var(--somma)" }}>
                {(dados?.inscritos ?? 0).toLocaleString("pt-BR")}
              </dd>
            </div>
            <div>
              <dt className="dst-label text-[color:rgba(242,240,236,0.4)]">Vagas</dt>
              <dd className="dst-label mt-2.5" style={{ color: fechada ? "rgba(242,240,236,0.5)" : "var(--somma)" }}>
                {UNIT_LABELS[status]}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row md:col-span-12">
            {abertas && !fechada && (
              <Link
                href={`${EVENT_PATH}/inscricao?unidade=${selecionada.slug}`}
                onClick={() =>
                  track("begin_registration", { origem: "mapa", unidade: selecionada.id })
                }
                className="dst-btn flex-1"
              >
                Escolher esta unidade
              </Link>
            )}
            <a
              href={rotaHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                track("open_directions", {
                  unidade: selecionada.id,
                  origem: origem ? "mapa_com_gps" : "mapa",
                  modo: kmOrigem != null ? modoRota(kmOrigem) : "driving",
                })
              }
              className="dst-btn dst-btn--ghost flex-1"
            >
              Iniciar rota
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Fallback sem Google Maps: projeção linear das coordenadas reais das unidades. */
function MapaEsquematico({
  selecionada,
  origem,
  onSelect,
}: {
  selecionada: EventUnit;
  origem: LatLng | null;
  onSelect: (u: EventUnit) => void;
}) {
  const lats = UNITS.map((u) => u.latitude);
  const lngs = UNITS.map((u) => u.longitude);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const pad = 0.16;

  const proj = (lat: number, lng: number) => ({
    top: `${clampPct((pad + ((maxLat - lat) / (maxLat - minLat || 1)) * (1 - pad * 2)) * 100)}%`,
    left: `${clampPct((pad + ((lng - minLng) / (maxLng - minLng || 1)) * (1 - pad * 2)) * 100)}%`,
  });

  return (
    <div className="absolute inset-0">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <p className="dst-label absolute left-4 top-4 text-[color:rgba(242,240,236,0.4)]">
        Mapa esquemático · posições reais
      </p>

      {origem && (
        <span
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={proj(origem.lat, origem.lng)}
        >
          <span
            className="mx-auto block rounded-full"
            style={{
              width: 12,
              height: 12,
              background: "var(--paper)",
              boxShadow: "0 0 0 4px rgba(255,44,4,0.35)",
            }}
          />
          <span className="dst-label mt-2 block whitespace-nowrap text-[color:var(--paper)]">Você</span>
        </span>
      )}

      {UNITS.map((unit) => {
        const ativo = unit.id === selecionada.id;
        return (
          <button
            key={unit.id}
            type="button"
            onClick={() => onSelect(unit)}
            aria-pressed={ativo}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 p-3"
            style={proj(unit.latitude, unit.longitude)}
          >
            <span
              className="mx-auto block rounded-full transition-all duration-300"
              style={{
                width: ativo ? 20 : 13,
                height: ativo ? 20 : 13,
                background: unit.sommaBase ? "var(--somma)" : "var(--evolve)",
                boxShadow: ativo ? "0 0 0 6px rgba(255,44,4,0.22)" : "none",
              }}
            />
            <span
              className="dst-label mt-2 block whitespace-nowrap"
              style={{ color: ativo ? "var(--paper)" : "rgba(242,240,236,0.5)" }}
            >
              {unit.curto}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function clampPct(n: number): number {
  return Math.min(96, Math.max(4, n));
}

function Estrelas({ valor }: { valor: number }) {
  const pct = Math.min(100, Math.max(0, (valor / 5) * 100));
  return (
    <span
      className="relative inline-block h-[1em] w-[5.1em] align-middle text-[1.05rem] leading-none tracking-[0.08em]"
      aria-hidden
    >
      <span className="absolute inset-0 text-[color:rgba(242,240,236,0.18)]">★★★★★</span>
      <span className="absolute inset-0 overflow-hidden text-[#e8c547]" style={{ width: `${pct}%` }}>
        ★★★★★
      </span>
    </span>
  );
}
