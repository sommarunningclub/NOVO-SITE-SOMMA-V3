"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { gsap } from "gsap";
import { garantirGsap, movimentoReduzido } from "@/lib/dexcomplica-love-run/motion";

/**
 * Do clique em "Garantir minha vaga" até o ingresso, uma cena só.
 *
 * 1. `carregando` (enquanto a API responde): coração em repouso batendo,
 *    linha de batimento em loop, BPM oscilando e frases que se revezam.
 *    Nada aqui diz "confirmado": a inscrição ainda não existe.
 * 2. `confirmado` (o banco gravou): o coração dispara, aparece "Inscrição
 *    confirmada", Desapega. Desilude. Dexcomplica! batem no ritmo, o mascote
 *    volta com "Sua vaga está garantida" e a onda vermelha leva ao ingresso.
 *
 * Se a API falhar, quem chamou desmonta a cena e mostra o erro no formulário.
 * O carregamento dura no mínimo 1,4 s (resposta rápida não vira um piscar).
 * Movimento reduzido: telas paradas, sem loop, e o ingresso abre em 1,5 s.
 */
const MINIMO_CARREGANDO_MS = 1400;
const FRASES = ["Aquecendo…", "Segurando sua vaga…", "Conferindo seus dados…", "Gerando seu ingresso…"];

export default function Transicao({
  fase,
  jaInscrito = false,
  aoTerminar,
}: {
  fase: "carregando" | "confirmado";
  jaInscrito?: boolean;
  aoTerminar: () => void;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const pular = useRef<HTMLButtonElement>(null);
  const inicio = useRef(0);
  const loop = useRef<gsap.core.Timeline | null>(null);
  /** A oscilação do BPM na espera: precisa parar para a subida até 168 valer sozinha. */
  const bpmEspera = useRef<gsap.core.Tween | null>(null);
  const terminou = useRef(false);
  const [frase, setFrase] = useState(0);
  const [reduzido, setReduzido] = useState(false);

  const fim = () => {
    if (terminou.current) return;
    terminou.current = true;
    aoTerminar();
  };

  // Montagem: trava o scroll, guarda o início e começa o loop de espera.
  useLayoutEffect(() => {
    const root = raiz.current;
    if (!root) return;
    inicio.current = performance.now();
    const html = document.documentElement;
    const overflowAntes = html.style.overflow;
    html.style.overflow = "hidden";
    const red = movimentoReduzido();
    setReduzido(red);
    const troca = window.setInterval(() => setFrase((f) => (f + 1) % FRASES.length), 1100);
    if (red) {
      return () => {
        window.clearInterval(troca);
        html.style.overflow = overflowAntes;
      };
    }

    const { gsap } = garantirGsap();
    const q = (s: string) => root.querySelector(s);
    const linha = q("[data-t-linha]") as SVGPathElement | null;
    const total = linha?.getTotalLength() ?? 1000;
    const visor = q("[data-t-bpm]");
    const bpm = { v: 72 };

    const ctx = gsap.context(() => {
      gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" });
      gsap.fromTo(q("[data-t-coracao]"), { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2)" });
      // Coração em repouso: tum-tum, pausa.
      const tl = gsap.timeline({ repeat: -1, delay: 0.5 });
      tl.to(q("[data-t-coracao]"), { scale: 1.1, duration: 0.11, ease: "power2.out" })
        .to(q("[data-t-coracao]"), { scale: 1, duration: 0.16, ease: "power2.in" })
        .to(q("[data-t-coracao]"), { scale: 1.06, duration: 0.09, ease: "power2.out" })
        .to(q("[data-t-coracao]"), { scale: 1, duration: 0.2, ease: "power2.in" })
        .to({}, { duration: 0.34 });
      loop.current = tl;
      // A linha corre sem parar e o BPM respira entre 72 e 96.
      gsap.fromTo(
        linha,
        { strokeDasharray: `${total * 0.35} ${total}`, strokeDashoffset: total * 1.35 },
        { strokeDashoffset: 0, duration: 1.8, ease: "none", repeat: -1 }
      );
      bpmEspera.current = gsap.to(bpm, {
        v: 96,
        duration: 1.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (visor) visor.textContent = String(Math.round(bpm.v));
        },
      });
    }, root);

    return () => {
      window.clearInterval(troca);
      ctx.revert();
      html.style.overflow = overflowAntes;
    };
  }, []);

  // Confirmado: espera o mínimo do carregamento e toca a celebração.
  useEffect(() => {
    if (fase !== "confirmado" || !raiz.current) return;
    const root = raiz.current;
    const espera = Math.max(0, MINIMO_CARREGANDO_MS - (performance.now() - inicio.current));
    pular.current?.focus({ preventScroll: true });
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fim();
    window.addEventListener("keydown", esc);

    if (movimentoReduzido()) {
      const t = window.setTimeout(fim, espera + 1500);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("keydown", esc);
      };
    }

    const { gsap } = garantirGsap();
    const q = (s: string) => root.querySelector(s);
    const qa = (s: string) => root.querySelectorAll(s);
    const bater = () => navigator.vibrate?.(28);
    let ctx: ReturnType<typeof gsap.context> | null = null;

    const t = window.setTimeout(() => {
      ctx = gsap.context(() => {
        loop.current?.kill();
        bpmEspera.current?.kill();
        gsap.killTweensOf(q("[data-t-coracao]"));
        const visor = q("[data-t-bpm]");
        const bpm = { v: Number(visor?.textContent) || 90 };
        const palavras = qa("[data-t-palavra]");
        const tl = gsap.timeline({ onComplete: fim });

        // 0 → 1,6 s: o coração dispara; sai a espera, entra "confirmada".
        tl.to(q("[data-t-espera]"), { opacity: 0, y: -10, duration: 0.25 }, 0)
          .fromTo(q("[data-t-confirmada]"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, immediateRender: false }, 0.1)
          .to(
            bpm,
            {
              v: 168,
              duration: 1.4,
              ease: "power2.in",
              onUpdate: () => {
                if (visor) visor.textContent = String(Math.round(bpm.v));
              },
            },
            0
          )
          .to(q("[data-t-coracao]"), { scale: 1.18, duration: 0.09, repeat: 7, yoyo: true, ease: "power1.inOut" }, 0)
          .to(q("[data-t-coracao]"), { scale: 0, rotate: 25, duration: 0.35, ease: "back.in(2)" }, 1.25)
          .call(bater, [], 1.25);

        // 1,6 → 3,3 s: as três palavras, uma por batida, no mesmo lugar.
        [1.6, 2.15, 2.7].forEach((em, i) => {
          tl.call(bater, [], em)
            .fromTo(
              palavras[i],
              { scale: 1.6, opacity: 0, filter: "blur(10px)" },
              { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.3, ease: "expo.out", immediateRender: false },
              em
            )
            .fromTo(q("[data-t-flash]"), { opacity: 0.25 + i * 0.12 }, { opacity: 0, duration: 0.4, ease: "power2.out", immediateRender: false }, em);
          if (i < 2) tl.to(palavras[i], { opacity: 0, scale: 0.9, duration: 0.18 }, [2.15, 2.7][i] - 0.05);
        });

        // 3,3 → 4,8 s: o mascote volta, "Sua vaga está garantida", três batidas.
        tl.to(palavras[2], { opacity: 0, y: -14, duration: 0.25 }, 3.3)
          .to(qa("[data-t-visor], [data-t-linha-svg], [data-t-confirmada]"), { opacity: 0, duration: 0.3 }, 3.3)
          .fromTo(q("[data-t-coracao]"), { scale: 0, rotate: -30 }, { scale: 1, rotate: 0, duration: 0.6, ease: "back.out(2.4)", immediateRender: false }, 3.35)
          .fromTo(q("[data-t-garantida]"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, immediateRender: false }, 3.55);
        [3.85, 4.2, 4.55].forEach((em, i) => {
          tl.call(bater, [], em)
            .to(q("[data-t-coracao]"), { scale: 1.16 + i * 0.04, duration: 0.1, ease: "power2.out" }, em)
            .to(q("[data-t-coracao]"), { scale: 1, duration: 0.22, ease: "power2.in" }, em + 0.1)
            .fromTo(qa("[data-t-anel]")[i], { scale: 0.6, opacity: 0.9 }, { scale: 3.2, opacity: 0, duration: 0.85, ease: "power2.out", immediateRender: false }, em);
        });

        // 4,9 → 5,65 s: a onda vermelha toma a tela e escurece no tom do ingresso.
        tl.to(q("[data-t-garantida]"), { opacity: 0, duration: 0.2 }, 4.9)
          .to(q("[data-t-coracao]"), { scale: 4, opacity: 0, duration: 0.45, ease: "power3.in" }, 4.9)
          .fromTo(q("[data-t-onda]"), { scale: 0 }, { scale: 1, duration: 0.5, ease: "power2.in", immediateRender: false }, 5.0)
          .to(q("[data-t-escuro]"), { opacity: 1, duration: 0.25, ease: "power1.in" }, 5.4);
      }, root);
    }, espera);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", esc);
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  const confirmado = fase === "confirmado";

  // Sem portal: a camada precisa ficar dentro de .lr-root, onde moram as
  // variáveis das fontes (next/font) e as cores. `position: fixed` resolve.
  return (
    <div
      ref={raiz}
      className="lr-trans"
      data-fase={fase}
      data-reduzido={reduzido || undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lr-trans-titulo"
      aria-busy={!confirmado}
    >
      <p id="lr-trans-titulo" className="sr-only" role="status" aria-live="assertive">
        {confirmado
          ? jaInscrito
            ? "Você já está inscrito. Abrindo seu ingresso."
            : "Inscrição confirmada. Abrindo seu ingresso."
          : "Enviando sua inscrição."}
      </p>
      <div className="lr-trans__flash" data-t-flash aria-hidden="true" />

      <p className="lr-trans__confirmada" data-t-confirmada aria-hidden="true">
        <span className="lr-trans__ponto" /> {jaInscrito ? "Você já está dentro" : "Inscrição confirmada"}
      </p>

      <div className="lr-trans__visor" data-t-visor aria-hidden="true">
        <span data-t-bpm>72</span>
        <small>bpm</small>
      </div>

      <svg className="lr-trans__linha" data-t-linha-svg viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
        <path
          data-t-linha
          d="M0 110 H210 l16 -40 l22 90 l26 -130 l22 120 l16 -40 H470 l14 -30 l20 70 l22 -110 l20 100 l14 -30 H730 l12 -24 l18 54 l20 -90 l18 80 l12 -20 H1200"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="lr-trans__palavras" aria-hidden="true">
        <span data-t-palavra>Desapega.</span>
        <span data-t-palavra>Desilude.</span>
        <span data-t-palavra className="lr-trans__dex">
          Dexcomplica!
        </span>
      </div>

      <div className="lr-trans__centro" aria-hidden="true">
        <span className="lr-trans__anel" data-t-anel />
        <span className="lr-trans__anel" data-t-anel />
        <span className="lr-trans__anel" data-t-anel />
        <Image data-t-coracao className="lr-trans__coracao" src="/dexcomplica-love-run/marca/dex-coracao.png" alt="" width={525} height={502} priority />
      </div>

      <div className="lr-trans__espera" data-t-espera aria-hidden="true">
        <span className="lr-trans__frase" key={frase}>
          {FRASES[frase]}
        </span>
        <span className="lr-trans__barra">
          <span />
        </span>
      </div>
      <p className="lr-trans__garantida" data-t-garantida aria-hidden="true">
        {jaInscrito ? "Seu ingresso está aqui." : "Sua vaga está garantida."}
      </p>

      <div className="lr-trans__onda" data-t-onda aria-hidden="true" />
      <div className="lr-trans__escuro" data-t-escuro aria-hidden="true" />

      {confirmado ? (
        <button ref={pular} type="button" className="lr-trans__pular" onClick={fim}>
          Pular para o ingresso
        </button>
      ) : null}
    </div>
  );
}
