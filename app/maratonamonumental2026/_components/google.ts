"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

/**
 * Carregamento da Google Maps JavaScript API, um só para a página inteira.
 *
 * A chave é a pública do site (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY), restrita por
 * domínio e por API no console do Google. A API só é pedida quando um mapa
 * chega perto da tela. Falta de chave, rede fora, chave recusada ou demora
 * viram erro tratado: quem chama mostra o conteúdo alternativo.
 */

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
export const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined;
export const TEM_CHAVE = Boolean(KEY);

const TEMPO_LIMITE_MS = 12_000;
let promessa: Promise<google.maps.MapsLibrary> | null = null;
let chaveRecusada = false;
const ouvintesDeRecusa = new Set<() => void>();

/** O Google chama gm_authFailure quando a chave é inválida ou o domínio não está liberado. */
export function aoRecusarChave(fn: () => void): () => void {
  if (chaveRecusada) fn();
  ouvintesDeRecusa.add(fn);
  return () => ouvintesDeRecusa.delete(fn);
}

export function carregarMaps(): Promise<google.maps.MapsLibrary> {
  if (!KEY) return Promise.reject(new Error("sem-chave"));
  if (chaveRecusada) return Promise.reject(new Error("chave-recusada"));
  if (!promessa) {
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      chaveRecusada = true;
      ouvintesDeRecusa.forEach((fn) => fn());
    };
    setOptions({ key: KEY, v: "weekly", language: "pt-BR", region: "BR" });
    const carga = importLibrary("maps");
    const limite = new Promise<never>((_, falha) => setTimeout(() => falha(new Error("tempo-esgotado")), TEMPO_LIMITE_MS));
    promessa = Promise.race([carga, limite]).catch((erro) => {
      promessa = null; // permite tentar de novo
      throw erro;
    });
  }
  return promessa;
}

/** Tema escuro do site. Só vale sem Map ID: com Map ID, o estilo vem do console do Google. */
export const ESTILO_ESCURO: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0d0d0d" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8f8f8f" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d0d0d" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", stylers: [{ visibility: "on" }] },
  { featureType: "poi.park", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#111a12" }] },
  { featureType: "poi.government", elementType: "labels.text", stylers: [{ visibility: "on" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#262626" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9a9a9a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#303030" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3b3b3b" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#07161b" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d5a60" }] },
];

export type Pino = { remover: () => void; mover: (p: google.maps.LatLngLiteral) => void };

/** Marcador em HTML sobre o mapa (OverlayView). Funciona com e sem Map ID. */
export function criarPino(
  mapa: google.maps.Map,
  posicaoInicial: google.maps.LatLngLiteral,
  opcoes: { texto: string; classe?: string; titulo: string; aoClicar?: () => void }
): Pino {
  const posicao = { ...posicaoInicial };
  class Overlay extends google.maps.OverlayView {
    private el: HTMLElement | null = null;
    onAdd() {
      const el = document.createElement(opcoes.aoClicar ? "button" : "div");
      el.className = `mt-pino ${opcoes.classe ?? ""}`;
      el.textContent = opcoes.texto;
      el.title = opcoes.titulo;
      el.setAttribute("aria-label", opcoes.titulo);
      if (opcoes.aoClicar) {
        (el as HTMLButtonElement).type = "button";
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          opcoes.aoClicar?.();
        });
      }
      this.el = el;
      this.getPanes()?.overlayMouseTarget.appendChild(el);
    }
    draw() {
      const p = this.getProjection()?.fromLatLngToDivPixel(new google.maps.LatLng(posicao.lat, posicao.lng));
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
  const o = new Overlay();
  o.setMap(mapa);
  return {
    remover: () => o.setMap(null),
    // Para o marcador que corre o percurso: muda a coordenada e redesenha só ele.
    mover: (p) => {
      posicao.lat = p.lat;
      posicao.lng = p.lng;
      o.draw();
    },
  };
}
