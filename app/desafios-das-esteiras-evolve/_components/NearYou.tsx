"use client";

import Link from "next/link";
import { useState } from "react";
import { EVENT, EVENT_PATH, inscricoesAbertas } from "@/lib/desafio-esteiras/event.config";
import { track } from "@/lib/desafio-esteiras/analytics";
import {
  formatarDistancia,
  foraDaRegiao,
  interpretarGeoError,
  modoRota,
  rotaGoogleUrl,
  unidadeMaisProxima,
  type GeoSnap,
  type LatLng,
} from "@/lib/desafio-esteiras/geo";

/**
 * Bloco cômico da seção de mapa: pede a localização no gesto do usuário
 * (iOS bloqueia prompt automático) e aponta a Evolve mais perto.
 */
export function NearYou({
  onLocated,
}: {
  onLocated: (pos: LatLng, nearestId: string) => void;
}) {
  const [geo, setGeo] = useState<GeoSnap>({ status: "idle" });
  const abertas = inscricoesAbertas();

  function pedirLocalizacao() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo({ status: "unsupported" });
      return;
    }

    setGeo({ status: "pending" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const { unit, km } = unidadeMaisProxima(here);
        setGeo({ status: "ok", pos: here, nearest: unit, km });
        onLocated(here, unit.id);
      },
      (err) => setGeo(interpretarGeoError(err.code)),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 },
    );
  }

  const ok = geo.status === "ok" ? geo : null;
  const rota = ok
    ? rotaGoogleUrl(ok.nearest, ok.pos, modoRota(ok.km))
    : null;

  return (
    <aside
      className="map-anim dst-panel mt-10 overflow-hidden md:mt-12"
      aria-live="polite"
      style={{ borderColor: "rgba(255,44,4,0.45)" }}
    >
      <div className="dst-energia-line" aria-hidden />
      <div className="p-6 md:p-8">
        <p className="dst-label text-[color:var(--somma)]">
          {kicker(geo)}
        </p>
        <h3 className="dst-display mt-3 text-[clamp(1.6rem,5.5vw,3rem)] leading-[0.92]">
          {titulo(geo)}
        </h3>
        <p className="mt-4 max-w-[58ch] text-[1.02rem] leading-relaxed text-[color:rgba(242,240,236,0.72)]">
          {corpo(geo)}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {geo.status !== "ok" && (
            <button
              type="button"
              onClick={pedirLocalizacao}
              disabled={geo.status === "pending"}
              className="dst-btn dst-btn--somma flex-1"
            >
              {geo.status === "pending" ? "Caçando você…" : "Me acha"}
            </button>
          )}
          {ok && abertas && ok.nearest.status !== "encerrada" && (
            <Link
              href={`${EVENT_PATH}/inscricao?unidade=${ok.nearest.slug}`}
              onClick={() =>
                track("begin_registration", { origem: "localizacao", unidade: ok.nearest.id })
              }
              className="dst-btn flex-1"
            >
              Correr nessa unidade
            </Link>
          )}
          {ok && rota && (
            <a
              href={rota}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                track("open_directions", {
                  unidade: ok.nearest.id,
                  origem: "localizacao",
                  modo: modoRota(ok.km),
                })
              }
              className="dst-btn dst-btn--ghost flex-1"
            >
              Iniciar rota
            </a>
          )}
        </div>
        {ok && (
          <button
            type="button"
            onClick={pedirLocalizacao}
            className="dst-label mt-4 text-[color:rgba(242,240,236,0.4)] underline-offset-4 hover:text-[color:var(--paper)] hover:underline"
          >
            Atualizar localização
          </button>
        )}
      </div>
    </aside>
  );
}

function kicker(geo: GeoSnap): string {
  if (geo.status === "ok") {
    if (geo.km < 0.25) return "Grátis · você já tá no quarteirão";
    const dist = formatarDistancia(geo.km);
    return foraDaRegiao(geo.km)
      ? `Grátis · a Evolve mais perto ainda é a ${dist}`
      : `Grátis · a ${dist} da sua cara`;
  }
  if (geo.status === "pending") return "Grátis · triangulando o ego";
  return `Grátis · ${EVENT.dataCurta} · ${EVENT.horaLabel}`;
}

function titulo(geo: GeoSnap): string {
  if (geo.status === "ok") {
    if (geo.km < 0.25) return `É A ${geo.nearest.curto.toUpperCase()}`;
    return foraDaRegiao(geo.km)
      ? `${geo.nearest.curto.toUpperCase()} AINDA É A APOSTA`
      : `A MAIS PERTO É ${geo.nearest.curto.toUpperCase()}`;
  }
  if (geo.status === "denied") return "BELEZA, A GENTE NÃO INSISTE";
  if (geo.status === "unsupported") return "SEM GPS NESSE APARELHO";
  if (geo.status === "error") return "O SINAL FUGIU";
  return "CADÊ VOCÊ NESSA CIDADE?";
}

function corpo(geo: GeoSnap): string {
  if (geo.status === "ok") {
    if (geo.km < 0.25) {
      return `Relaxa, a ${geo.nearest.nome} é logo aí. Corre, se exibe, leva alguém. O Desafio das Esteiras é gratuito. Sem ingresso.`;
    }
    if (foraDaRegiao(geo.km)) {
      return `O pin caiu longe do Planalto, mas a Evolve mais perto ainda é a ${geo.nearest.nome}. O Desafio das Esteiras é em Brasília e Luziânia, dia ${EVENT.dataExtenso}, e é gratuito. Escolhe uma, leva alguém e aparece. Vai ser irado.`;
    }
    return `A esteira mais perto de você é a ${geo.nearest.nome}. Dá pra ir correr, se exibir e ainda levar alguém de carona no ego. Vai ser irado se você for. E o Desafio das Esteiras é gratuito. Zero ingresso, só chegar.`;
  }
  if (geo.status === "denied") {
    return "Sem localização a gente não adivinha o bairro. Escolhe no mapa, leva um amigo, o evento é de graça em qualquer unidade.";
  }
  if (geo.status === "unsupported") {
    return "Esse navegador não entrega coordenadas. Escolhe a unidade no mapa. Qualquer uma aceita convidado e o Desafio é gratuito.";
  }
  if (geo.status === "error") {
    return "O GPS não fechou a conta. Tenta de novo ou escolhe no mapa. O evento continua gratuito. Leva alguém mesmo assim.";
  }
  return "Libera a localização. A gente aponta a Evolve mais perto pra você chegar, correr e se exibir. Leva alguém. O Desafio das Esteiras é gratuito. Sem ingresso. Sem desculpa.";
}
