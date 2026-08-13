"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger, reduced } from "./_motion";

/**
 * Nuvem de pontos que converge.
 *
 * Cada ponto começa espalhado (audiência: muita gente, nenhuma ligação) e é
 * puxado para um núcleo conforme a leitura avança. Quando se aproximam, os
 * vizinhos passam a se conectar: a comunidade aparece como consequência da
 * distância, não como enfeite.
 *
 * Vive atrás da virada "divulgação vira experiência", que é onde o argumento
 * acontece. `trigger` permite amarrar o progresso ao trilho daquela seção em
 * vez do próprio canvas.
 */
export function ConvergenceCanvas({ trigger }: { trigger?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    const box = host.current;
    if (!cv || !box) return;

    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let COUNT = 340;
    let HUBS = 5;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let progress = 0;

    type P = { x0: number; y0: number; x1: number; y1: number; r: number; hub: number };
    let pts: P[] = [];
    /** pares que terminam perto o bastante para virar vínculo, calculados uma vez */
    let links: [number, number][] = [];

    // gerador determinístico: o mesmo desenho no servidor, no reload e no resize
    let seed = 20260927;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const build = () => {
      const rect = box.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      seed = 20260927;

      // no retrato cinco núcleos viram cinco pontinhos: menos e maiores lê melhor
      const narrow = w < 720;
      HUBS = narrow ? 3 : 5;
      COUNT = narrow ? 220 : 340;
      const spread = narrow ? 0.3 : 0.19;
      const radius = narrow ? 0.15 : 0.088;

      const hubs = Array.from({ length: HUBS }, (_, i) => ({
        x: w * (0.5 + (i - (HUBS - 1) / 2) * spread),
        y: h * (0.5 + (i % 2 === 0 ? -0.13 : 0.14)),
      }));

      pts = Array.from({ length: COUNT }, () => {
        const hub = Math.floor(rnd() * HUBS);
        const a = rnd() * Math.PI * 2;
        const rad = Math.pow(rnd(), 0.62) * Math.min(w, h) * radius;
        return {
          x0: rnd() * w,
          y0: rnd() * h,
          x1: hubs[hub].x + Math.cos(a) * rad,
          y1: hubs[hub].y + Math.sin(a) * rad * 0.82,
          r: 0.9 + rnd() * 1.5,
          hub,
        };
      });

      // o desenho por frame percorre só estes pares, não todos contra todos
      links = [];
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          if (pts[i].hub !== pts[j].hub) continue;
          const dx = pts[i].x1 - pts[j].x1;
          const dy = pts[i].y1 - pts[j].y1;
          if (dx * dx + dy * dy < 3400) links.push([i, j]);
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const t = progress;
      const ease = t * t * (3 - 2 * t); // smoothstep

      const cur = pts.map((p) => ({
        x: p.x0 + (p.x1 - p.x0) * ease,
        y: p.y0 + (p.y1 - p.y0) * ease,
        r: p.r,
        hub: p.hub,
      }));

      // vínculos: só existem depois que a nuvem começa a se agrupar
      if (ease > 0.34) {
        const k = (ease - 0.34) / 0.66;
        ctx.lineWidth = 0.6;
        for (const [i, j] of links) {
          const dx = cur[i].x - cur[j].x;
          const dy = cur[i].y - cur[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 > 3400) continue;
          ctx.strokeStyle = `rgba(85,218,255,${(1 - d2 / 3400) * 0.3 * k})`;
          ctx.beginPath();
          ctx.moveTo(cur[i].x, cur[i].y);
          ctx.lineTo(cur[j].x, cur[j].y);
          ctx.stroke();
        }
      }

      for (const p of cur) {
        // o laranja Somma marca quem já foi puxado para dentro da comunidade
        ctx.fillStyle = ease > 0.55 && p.hub % 2 === 0 ? `rgba(255,44,4,${0.35 + ease * 0.5})` : `rgba(255,255,255,${0.24 + ease * 0.42})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.8 + ease * 0.55), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    build();
    if (reduced()) {
      progress = 1;
      draw();
      return;
    }
    draw();

    const st = ScrollTrigger.create({
      trigger: (trigger && document.querySelector(trigger)) || box,
      start: trigger ? "top top" : "top 88%",
      end: trigger ? "bottom bottom" : "bottom 32%",
      scrub: true,
      onUpdate: (self) => {
        progress = self.progress;
        draw();
      },
    });

    const onResize = () => {
      build();
      draw();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      st.kill();
    };
  }, [trigger]);

  return (
    <div ref={host} className="absolute inset-0" aria-hidden>
      <canvas ref={canvas} className="h-full w-full" />
    </div>
  );
}
