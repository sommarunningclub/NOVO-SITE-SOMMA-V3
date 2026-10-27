"use client";

import { useSyncExternalStore } from "react";

/**
 * O som da Dexcomplica (trilha do vídeo oficial) tocando pela página.
 *
 * Um único <audio> no módulo: sobrevive à navegação do cliente, então a
 * música segue da LP para a transição e para o ingresso sem cortar.
 *
 * Navegador nenhum deixa tocar som sozinho antes de a pessoa interagir. Por
 * isso: tenta ao abrir; se for barrado, começa no primeiro toque, clique ou
 * tecla em qualquer lugar. Quem pausar fica pausado (lembrado no aparelho)
 * e o player está sempre à mão para ligar de novo.
 */
const SRC = "/dexcomplica-love-run/audio/dex-som.m4a";
const CHAVE = "love-run:som";
const VOLUME = 0.55;

type Estado = "parado" | "tocando" | "aguardando";

let audio: HTMLAudioElement | null = null;
let estado: Estado = "parado";
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

function setEstado(e: Estado) {
  estado = e;
  avisar();
}

function el(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = VOLUME;
    audio.addEventListener("play", () => setEstado("tocando"));
    audio.addEventListener("pause", () => estado === "tocando" && setEstado("parado"));
  }
  return audio;
}

function preferiuSilencio(): boolean {
  try {
    return localStorage.getItem(CHAVE) === "off";
  } catch {
    return false;
  }
}

function lembrar(v: "on" | "off") {
  try {
    localStorage.setItem(CHAVE, v);
  } catch {
    /* modo privado */
  }
}

export async function tocar(): Promise<boolean> {
  try {
    const a = el();
    a.volume = 0;
    await a.play();
    // Entra suave, sem susto.
    const inicio = performance.now();
    const subir = (t: number) => {
      const k = Math.min(1, (t - inicio) / 900);
      a.volume = VOLUME * k;
      if (k < 1 && !a.paused) requestAnimationFrame(subir);
    };
    requestAnimationFrame(subir);
    return true;
  } catch {
    return false;
  }
}

export function pausar() {
  lembrar("off");
  el().pause();
  setEstado("parado");
}

export async function alternar() {
  if (estado === "tocando") pausar();
  else {
    lembrar("on");
    await tocar();
  }
}

let armado = false;

/**
 * Chamado uma vez pela página: tenta tocar; se o navegador barrar, espera a
 * primeira interação. Toques em controles de som são ignorados aqui (eles
 * mesmos decidem), para o primeiro toque no player não ligar e desligar.
 */
export function iniciarSomAmbiente() {
  if (armado || typeof window === "undefined") return;
  armado = true;
  if (preferiuSilencio() || estado === "tocando") return;

  tocar().then((ok) => {
    if (ok) return;
    setEstado("aguardando");
    const comecar = (e: Event) => {
      if ((e.target as Element | null)?.closest?.("[data-som]")) return;
      tirar();
      if (!preferiuSilencio()) tocar();
    };
    const eventos = ["pointerdown", "keydown", "touchend"] as const;
    const tirar = () => eventos.forEach((n) => window.removeEventListener(n, comecar, true));
    eventos.forEach((n) => window.addEventListener(n, comecar, { capture: true, passive: true }));
  });
}

export function useSom(): Estado {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    () => estado,
    () => "parado"
  );
}
