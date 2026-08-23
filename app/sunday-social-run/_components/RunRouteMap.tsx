"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { ROTA_SIMULADA, type Coordenada } from "@/lib/sunday-social-run/rota";
import { EVENT } from "@/lib/sunday-social-run/event.config";
import { gsap, prefersReducedMotion } from "../_motion";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/** Quanto tempo a simulação leva para percorrer o percurso inteiro. */
const DURACAO_S = 18;

/** Zoom de perseguição: perto o bastante para ver a pista, largo o bastante
 *  para dar contexto de onde o pelotão está na Asa Sul. */
const ZOOM_CORRIDA = 15;

/** A câmera não acompanha a 60 fps: mover o centro a cada quadro faria o mapa
 *  pedir tiles sem parar e a tela ficaria em branco. Um passo a cada 260 ms já
 *  parece contínuo e deixa os tiles alcançarem. */
const PASSO_CAMERA_MS = 260;

/**
 * Estilo do mapa: a mesma manhã da página. Asfalto claro, verde oliva nos
 * parques, rótulos discretos — o traçado é que tem de saltar, não o mapa.
 */
const ESTILO: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f7f2e8" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8878" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#fdfaf4" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#dbe4cd" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#f2ece0" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e8e0d0" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cbe4f2" }] },
];

/** Distância entre dois pontos, em metros (haversine — evita carregar a lib geometry). */
function metros(a: Coordenada, b: Coordenada): number {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Comprimento acumulado da rota — base para interpolar a posição do pelotão. */
function acumulada(pontos: readonly Coordenada[]): number[] {
  const soma = [0];
  for (let i = 1; i < pontos.length; i++) soma.push(soma[i - 1] + metros(pontos[i - 1], pontos[i]));
  return soma;
}

/** Posição do pelotão em `t` (0 a 1), interpolando entre os vértices da rota. */
function posicaoEm(pontos: readonly Coordenada[], soma: number[], t: number): google.maps.LatLngLiteral {
  const alvo = soma[soma.length - 1] * Math.min(Math.max(t, 0), 1);
  let i = 1;
  while (i < soma.length - 1 && soma[i] < alvo) i++;
  const trecho = soma[i] - soma[i - 1] || 1;
  const f = (alvo - soma[i - 1]) / trecho;
  const a = pontos[i - 1];
  const b = pontos[i];
  return { lat: a[0] + (b[0] - a[0]) * f, lng: a[1] + (b[1] - a[1]) * f };
}

/** "07:45" + 34 min → "08:19". */
function horaEm(inicio: string, minutos: number): string {
  const [h, m] = inicio.split(":").map(Number);
  const total = h * 60 + m + Math.round(minutos);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * A simulação do percurso.
 *
 * O pelotão sai do Santa Monica, entra no Eixão, vira e volta para o after — no
 * traçado real das vias, gerado pela Directions API e congelado em
 * `lib/sunday-social-run/rota.ts`. Enquanto o ponto anda, o relógio e o
 * contador de quilômetros acompanham a janela real da programação (07:45 →
 * 08:40).
 *
 * A animação só começa quando a seção entra na tela, e sob
 * `prefers-reduced-motion` o traçado aparece completo, parado — sem ninguém
 * correndo pela tela de quem pediu menos movimento.
 */
export function RunRouteMap({ className = "" }: { className?: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [rodando, setRodando] = useState(false);
  const controles = useRef<{ play: () => void; pause: () => void } | null>(null);

  useEffect(() => {
    if (!KEY) {
      setErro("sem-chave");
      return;
    }

    let cancelado = false;
    let tween: gsap.core.Tween | null = null;
    let io: IntersectionObserver | null = null;

    setOptions({ key: KEY, v: "weekly", language: "pt-BR", region: "BR" });

    (async () => {
      try {
        const { Map, Polyline, OverlayView } = await importLibrary("maps");
        const { LatLngBounds } = await importLibrary("core");
        if (cancelado || !caixa.current) return;

        const pontos = ROTA_SIMULADA.pontos;
        const caminho = pontos.map(([lat, lng]) => ({ lat, lng }));
        const soma = acumulada(pontos);
        const total = soma[soma.length - 1];

        const limites = new LatLngBounds();
        for (const p of caminho) limites.extend(p);

        const map = new Map(caixa.current, {
          mapTypeId: "roadmap",
          disableDefaultUI: true,
          zoomControl: false,
          // no mobile, um dedo rola a página; dois dedos movem o mapa
          gestureHandling: "cooperative",
          keyboardShortcuts: false,
          styles: ESTILO,
          backgroundColor: "#f7f2e8",
        });
        // enquadra o traçado com folga curta: a rota é o assunto, não a cidade
        map.fitBounds(limites, { top: 72, bottom: 28, left: 20, right: 20 });

        // Traçado completo, discreto — o caminho que o pelotão vai fazer.
        new Polyline({
          path: caminho,
          map,
          strokeColor: "#141e09",
          strokeOpacity: 0.16,
          strokeWeight: 6,
        });

        // Traçado percorrido, em laranja SOMMA.
        const feito = new Polyline({
          path: [caminho[0]],
          map,
          strokeColor: "#ff2c04",
          strokeOpacity: 1,
          strokeWeight: 5,
        });

        /** Ponto que anda pelo mapa — HTML puro, para poder pulsar via CSS. */
        class Pino extends OverlayView {
          private el: HTMLDivElement | null = null;
          constructor(private posicao: google.maps.LatLngLiteral, private classe: string, private rotulo?: string) {
            super();
          }
          onAdd() {
            this.el = document.createElement("div");
            this.el.className = this.classe;
            if (this.rotulo) this.el.dataset.rotulo = this.rotulo;
            this.getPanes()?.overlayMouseTarget.appendChild(this.el);
          }
          draw() {
            const proj = this.getProjection();
            if (!proj || !this.el) return;
            const p = proj.fromLatLngToDivPixel(new google.maps.LatLng(this.posicao));
            if (!p) return;
            this.el.style.left = `${p.x}px`;
            this.el.style.top = `${p.y}px`;
          }
          mover(nova: google.maps.LatLngLiteral) {
            this.posicao = nova;
            this.draw();
          }
          onRemove() {
            this.el?.remove();
            this.el = null;
          }
        }

        const partida = new Pino(caminho[0], "ris-map-pin", "SANTA MONICA");
        const virada = new Pino(
          { lat: ROTA_SIMULADA.virada.lat, lng: ROTA_SIMULADA.virada.lng },
          "ris-map-pin ris-map-pin-virada",
          "EIXÃO"
        );
        const pelotao = new Pino(caminho[0], "ris-map-pelotao");
        partida.setMap(map);
        virada.setMap(map);
        pelotao.setMap(map);

        setPronto(true);

        if (prefersReducedMotion()) {
          feito.setPath(caminho);
          pelotao.mover(caminho[caminho.length - 1]);
          setProgresso(1);
          return;
        }

        const estado = { t: 0 };
        let ultimoPan = 0;
        const aplicar = () => {
          const t = estado.t;
          const pos = posicaoEm(pontos, soma, t);
          pelotao.mover(pos);
          const ate = soma.findIndex((d) => d > total * t);
          feito.setPath([...caminho.slice(0, ate < 0 ? caminho.length : ate), pos]);
          setProgresso(t);

          // a câmera corre junto, mas em passos — ver PASSO_CAMERA_MS
          const agora = performance.now();
          if (agora - ultimoPan > PASSO_CAMERA_MS) {
            ultimoPan = agora;
            map.panTo(pos);
          }
        };

        /** Volta a mostrar o percurso inteiro — usado no fim e no pause. */
        const enquadrarTudo = () => map.fitBounds(limites, { top: 72, bottom: 28, left: 20, right: 20 });

        tween = gsap.to(estado, {
          t: 1,
          duration: DURACAO_S,
          ease: "power1.inOut",
          paused: true,
          onStart: () => {
            // aproxima antes de sair correndo
            map.setZoom(ZOOM_CORRIDA);
            map.setCenter(posicaoEm(pontos, soma, estado.t));
          },
          onUpdate: aplicar,
          onComplete: () => {
            setRodando(false);
            enquadrarTudo();
          },
        });

        controles.current = {
          play: () => {
            if (!tween) return;
            if (tween.progress() === 1) tween.restart();
            else tween.play();
            setRodando(true);
          },
          pause: () => {
            tween?.pause();
            setRodando(false);
            enquadrarTudo();
          },
        };

        // Começa sozinha quando a seção aparece — uma vez.
        io = new IntersectionObserver(
          (entradas) => {
            for (const e of entradas) {
              if (e.isIntersecting) {
                controles.current?.play();
                io?.disconnect();
              }
            }
          },
          { threshold: 0.4 }
        );
        if (caixa.current) io.observe(caixa.current);
      } catch {
        if (!cancelado) setErro("falhou");
      }
    })();

    return () => {
      cancelado = true;
      tween?.kill();
      io?.disconnect();
    };
  }, []);

  const minutos = progresso * 55;
  const km = (progresso * ROTA_SIMULADA.distanciaKm).toFixed(2);
  // a volta é o mesmo caminho: metade do percurso sobe o Eixão, metade desce
  const trecho = progresso === 0 ? "LARGADA" : progresso >= 1 ? "CHEGADA" : progresso < 0.5 ? "SUBINDO O EIXÃO" : "VOLTANDO";

  if (erro) {
    return (
      <div className={`ris-card flex min-h-[220px] items-center justify-center p-6 text-center ${className}`}>
        <p className="ris-label max-w-[36ch] leading-relaxed opacity-55">
          {erro === "sem-chave"
            ? "Mapa indisponível — falta a chave do Google Maps neste ambiente."
            : "Não foi possível carregar o mapa agora. O percurso segue abaixo."}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-[20px] border border-[color:var(--line)]">
        <div ref={caixa} className="h-[340px] w-full md:h-[520px]" aria-label="Mapa do percurso da corrida" role="img" />

        {/* Painel de telemetria da simulação */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-3">
          <div className="pointer-events-auto flex items-center gap-4 rounded-2xl bg-[color:var(--night-92)] px-4 py-3 text-[color:var(--cream)] backdrop-blur-md">
            <div>
              <div className="ris-mono text-[1.15rem] font-bold leading-none">{horaEm(ROTA_SIMULADA.inicio, minutos)}</div>
              <div className="ris-label mt-1.5 opacity-50">Relógio</div>
            </div>
            <div className="h-8 w-px bg-white/15" aria-hidden />
            <div>
              <div className="ris-mono text-[1.15rem] font-bold leading-none">{km} km</div>
              <div className="ris-label mt-1.5 opacity-50">Percorridos</div>
            </div>
            <div className="hidden h-8 w-px bg-white/15 sm:block" aria-hidden />
            <div className="hidden sm:block">
              <div className="ris-mono whitespace-nowrap text-[0.8rem] font-bold leading-none text-[color:var(--somma)]">
                {trecho}
              </div>
              <div className="ris-label mt-1.5 opacity-50">Trecho</div>
            </div>
          </div>

          {pronto && !prefersReducedMotion() && (
            <button
              type="button"
              onClick={() => (rodando ? controles.current?.pause() : controles.current?.play())}
              className="ris-mono pointer-events-auto rounded-full bg-[color:var(--somma)] px-5 py-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[color:var(--cream)]"
            >
              {rodando ? "Pausar" : progresso >= 1 ? "Repetir" : "Simular"}
            </button>
          )}
        </div>
      </div>

      <p className="ris-label mt-4 leading-relaxed opacity-40">
        Domingo é Eixão do Lazer: pista fechada para carros. Simulação do pelotão de{" "}
        {ROTA_SIMULADA.distanciaKm.toFixed(2).replace(".", ",")} km saindo do {EVENT.local.nome} · percurso oficial a
        ser homologado
      </p>
    </div>
  );
}
