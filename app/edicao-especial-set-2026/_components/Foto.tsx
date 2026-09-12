"use client";

import Image from "next/image";
import { useGsap, movimentoReduzido } from "@/lib/somma-day/motion";

/**
 * Fotografia com revelação editorial.
 *
 * O acervo do SOMMA é gente de verdade correndo junto — a foto entra com
 * gesto, não com fade: uma cortina creme desliza para fora enquanto a imagem
 * assenta de uma escala maior. São dois movimentos em direções opostas, e é o
 * que dá sensação de câmera em vez de banner.
 *
 * A cortina começa COBRINDO. Isso significa que uma falha do ScrollTrigger não
 * deixaria a animação por fazer: deixaria a foto invisível. Daí o guarda no
 * fim — se um segundo depois de o quadro estar na tela a cortina não tiver
 * saído, ela é removida. Em operação normal ele nunca dispara.
 */
export default function Foto({
  src,
  alt,
  ratio = 4 / 5,
  parallax = 0,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  direcao = "bottom",
  className = "",
  legenda,
}: {
  src: string;
  alt: string;
  ratio?: number;
  parallax?: number;
  priority?: boolean;
  sizes?: string;
  direcao?: "bottom" | "left" | "right";
  className?: string;
  legenda?: string;
}) {
  const ref = useGsap(({ gsap, root }) => {
    const cortina = root.querySelector<HTMLElement>("[data-cortina]");
    const midia = root.querySelector<HTMLElement>("[data-midia]");

    if (movimentoReduzido()) {
      if (cortina) cortina.style.display = "none";
      return;
    }
    if (!midia) return;

    if (cortina) {
      const saida =
        direcao === "bottom" ? { yPercent: -101 } : direcao === "left" ? { xPercent: -101 } : { xPercent: 101 };
      gsap
        .timeline({ scrollTrigger: { trigger: root, start: "top 84%", once: true } })
        .fromTo(midia, { scale: 1.18 }, { scale: 1, duration: 1.3, ease: "power3.out" }, 0)
        .to(cortina, { ...saida, duration: 1, ease: "power4.inOut" }, 0);
    }

    if (parallax !== 0) {
      gsap.fromTo(
        midia,
        { yPercent: -parallax / 2 },
        {
          yPercent: parallax / 2,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    }

    if (!cortina) return;
    let timer = 0;
    const guarda = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            const t = window.getComputedStyle(cortina).transform;
            const aindaCobrindo = t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)";
            if (aindaCobrindo) cortina.style.display = "none";
            guarda.disconnect();
          }, 1000);
        }
      },
      { threshold: 0.2 }
    );
    guarda.observe(root);
    // O gsap.context não conhece o observer: o cleanup é nosso.
    return () => {
      window.clearTimeout(timer);
      guarda.disconnect();
    };
  }, [src, parallax, direcao]);

  return (
    <figure ref={ref} className={`sd-quadro ${className}`} style={{ aspectRatio: ratio }}>
      <div data-midia className="sd-quadro-midia">
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
      <div data-cortina className="sd-cortina" aria-hidden="true" />
      {legenda && <figcaption className="sd-legenda">{legenda}</figcaption>}
    </figure>
  );
}
