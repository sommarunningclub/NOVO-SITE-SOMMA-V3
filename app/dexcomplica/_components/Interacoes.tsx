"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { movimentoReduzido } from "@/lib/dexcomplica-love-run/motion";

/**
 * Tudo na página responde ao toque, em um lugar só (delegação + GSAP):
 *
 * - `[data-coracao]`  (botões com o mascote): pulsa e solta uma chuva de
 *   corações; dá para arrastar e ele volta com mola.
 * - `[data-arrasta]`  (polaroides da festa): arrasta e volta com mola.
 * - `[data-tilt]`     (fotos, número de peito, cartões): inclina em 3D
 *   seguindo o ponteiro; no toque, dá uma apertadinha.
 * - `[data-pula]`     (letras de LOVE RUN, 07.11): cada letra pula ao passar/tocar.
 * - `[data-tag]`      (etiquetas do after): balança e troca de cor.
 * - `.lr-letreiro`    pausa no hover/toque.
 *
 * Com movimento reduzido nada disso roda (o que é útil, como a mochila e o
 * som, vive nos próprios componentes e continua funcionando).
 */
const CORES = ["#E73A28", "#FF85A1", "#F2C230", "#FFFFFF"];

function chuvaDeCoracoes(x: number, y: number, n = 14) {
  for (let i = 0; i < n; i++) {
    const c = document.createElement("span");
    c.className = "lr-chuva";
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    c.style.background = CORES[i % CORES.length];
    document.body.appendChild(c);
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const dist = 70 + Math.random() * 90;
    gsap.fromTo(
      c,
      { x: 0, y: 0, scale: 0.4, rotate: 0, opacity: 1 },
      {
        x: Math.cos(ang) * dist,
        y: Math.sin(ang) * dist - 40,
        scale: 0.8 + Math.random() * 0.8,
        rotate: (Math.random() - 0.5) * 120,
        opacity: 0,
        duration: 0.9 + Math.random() * 0.4,
        ease: "power3.out",
        onComplete: () => c.remove(),
      }
    );
  }
}

export default function Interacoes() {
  useEffect(() => {
    if (movimentoReduzido()) return;
    gsap.registerPlugin(Draggable);
    const fino = window.matchMedia("(pointer: fine)").matches;
    const limpar: (() => void)[] = [];

    // Corações (botões): clique = pulso + chuva; arrastar = mola de volta.
    const baterCoracao = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      gsap.fromTo(el, { scale: 1 }, { scale: 1.25, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" });
      chuvaDeCoracoes(r.left + r.width / 2, r.top + r.height / 2);
      navigator.vibrate?.(20);
    };
    document.querySelectorAll<HTMLElement>("[data-coracao], [data-arrasta]").forEach((el) => {
      const ehCoracao = el.hasAttribute("data-coracao");
      const [d] = Draggable.create(el, {
        type: "x,y",
        zIndexBoost: true,
        minimumMovement: 6,
        allowNativeTouchScrolling: !ehCoracao,
        onPress() {
          gsap.to(el, { scale: 1.06, duration: 0.15 });
        },
        onRelease() {
          gsap.to(el, { x: 0, y: 0, scale: 1, duration: 0.9, ease: "elastic.out(1, 0.45)" });
        },
        onClick() {
          if (ehCoracao) baterCoracao(el);
        },
      });
      // Teclado: Enter/Espaço no botão também bate o coração.
      const tecla = (e: KeyboardEvent) => {
        if (ehCoracao && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          baterCoracao(el);
        }
      };
      el.addEventListener("keydown", tecla);
      limpar.push(() => {
        d.kill();
        el.removeEventListener("keydown", tecla);
      });
    });

    // Inclinação 3D com brilho que acompanha o ponteiro.
    document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
      const forca = Number(el.dataset.tilt) || 8;
      const mover = (e: PointerEvent) => {
        if (!fino) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotateY: px * forca, rotateX: -py * forca, transformPerspective: 900, duration: 0.4, ease: "power2.out" });
        el.style.setProperty("--brilho-x", `${(px + 0.5) * 100}%`);
        el.style.setProperty("--brilho-y", `${(py + 0.5) * 100}%`);
      };
      const sair = () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.7, ease: "elastic.out(1, 0.6)" });
      const apertar = () => {
        if (!fino) gsap.fromTo(el, { scale: 0.97 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      };
      el.addEventListener("pointermove", mover);
      el.addEventListener("pointerleave", sair);
      el.addEventListener("pointerdown", apertar);
      limpar.push(() => {
        el.removeEventListener("pointermove", mover);
        el.removeEventListener("pointerleave", sair);
        el.removeEventListener("pointerdown", apertar);
      });
    });

    // Letras que pulam (delegado: funciona com hover e toque).
    const pular = (e: Event) => {
      const letra = (e.target as Element | null)?.closest?.("[data-pula] .lr-l");
      if (!letra || gsap.isTweening(letra)) return;
      gsap.fromTo(letra, { y: 0 }, { y: "-0.18em", duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out" });
    };
    document.addEventListener("pointerover", pular);
    document.addEventListener("pointerdown", pular);
    limpar.push(() => {
      document.removeEventListener("pointerover", pular);
      document.removeEventListener("pointerdown", pular);
    });

    // Etiquetas do after: balançam e trocam de cor a cada toque.
    let cor = 0;
    const etiqueta = (e: Event) => {
      const tag = (e.target as Element | null)?.closest?.("[data-tag]") as HTMLElement | null;
      if (!tag) return;
      cor = (cor + 1) % 3;
      tag.dataset.cor = String(cor);
      gsap.fromTo(tag, { rotate: -8, scale: 1.12 }, { rotate: 0, scale: 1, duration: 0.8, ease: "elastic.out(1.2, 0.3)" });
    };
    document.addEventListener("click", etiqueta);
    limpar.push(() => document.removeEventListener("click", etiqueta));

    // Letreiro: o hover pausa (CSS); o toque pausa e solta.
    const letreiro = (e: Event) => {
      const l = (e.target as Element | null)?.closest?.(".lr-letreiro") as HTMLElement | null;
      if (l) l.dataset.pausado = l.dataset.pausado === "1" ? "0" : "1";
    };
    document.addEventListener("click", letreiro);
    limpar.push(() => document.removeEventListener("click", letreiro));

    return () => limpar.forEach((f) => f());
  }, []);

  return null;
}
