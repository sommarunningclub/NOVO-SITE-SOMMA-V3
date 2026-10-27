"use client";

import Image from "next/image";
import { APOIO, CHAMADA, ESCASSEZ_PUBLICA, HORARIO } from "@/lib/dexcomplica-love-run/event.config";
import { rastrear } from "@/lib/dexcomplica-love-run/analytics";
import { movimentoReduzido, useGsap } from "@/lib/dexcomplica-love-run/motion";
import Marcas from "./Marcas";
import { Equalizador, Pulso } from "./Graficos";
import Letras from "./Letras";
import { useMeuIngresso } from "./meuIngresso";

/**
 * A capa. Foto real do Somma (a corredora de regata rosa com o megafone, no
 * meio do pelotão), o coração da Dexcomplica como adesivo e o título em
 * camadas. Sem JavaScript tudo já está no lugar: a animação só parte de um
 * estado alterado (gsap.from) e devolve ao CSS.
 */
export default function Capa() {
  const ingresso = useMeuIngresso();
  const ref = useGsap<HTMLElement>(({ gsap, root }) => {
    if (movimentoReduzido()) return;
    const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.1 } });
    tl.from(root.querySelector(".lr-capa__moldura"), { clipPath: "inset(12% 8% 12% 8% round 28px)", scale: 1.08, duration: 1.4 })
      .from(root.querySelectorAll("[data-capa-linha]"), { yPercent: 110, stagger: 0.09 }, 0.15)
      .from(root.querySelector(".lr-capa__logo"), { y: 24, opacity: 0, duration: 0.8 }, 0.25)
      .from(root.querySelector(".lr-capa__adesivo"), { scale: 0, rotate: -40, ease: "back.out(2.2)", duration: 0.9 }, 0.6)
      .from(root.querySelectorAll("[data-capa-entra]"), { y: 18, opacity: 0, stagger: 0.06, duration: 0.7 }, 0.55);

    const caminho = root.querySelector<SVGPathElement>("[data-pulso]");
    if (caminho) {
      const total = caminho.getTotalLength();
      gsap.fromTo(caminho, { strokeDasharray: total, strokeDashoffset: total }, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut", delay: 0.5 });
    }
    gsap.to(root.querySelector(".lr-capa__adesivo img"), { y: -10, rotate: 8, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.6 });
    gsap.to(root.querySelector(".lr-capa__moldura img"), {
      yPercent: 8,
      ease: "none",
      scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
    });
  });

  return (
    <section ref={ref} className="lr-capa" aria-labelledby="t-capa">
      <div className="lr-capa__foto">
        <div className="lr-capa__moldura">
          <Image
            src="/dexcomplica-love-run/fotos/corre-laranja.jpg"
            alt="Pelotão do Somma de camisetas laranja correndo pelo Parque da Cidade"
            fill
            priority
            sizes="(min-width: 960px) 46vw, 100vw"
          />
        </div>
        <button type="button" className="lr-capa__adesivo" data-coracao aria-label="Mandar um coração">
          <Image src="/dexcomplica-love-run/marca/dex-coracao.png" alt="" width={525} height={502} priority />
        </button>
      </div>

      <div className="lr-capa__texto">
        <h1 id="t-capa" className="lr-capa__titulo">
          <Image
            className="lr-capa__logo"
            src="/dexcomplica-love-run/marca/dex-logo.png"
            alt="Dexcomplica"
            width={900}
            height={194}
            priority
          />
          <span className="lr-capa__mascara"><span data-capa-linha><Letras texto="Love" /></span></span>
          <span className="lr-capa__mascara"><span data-capa-linha><Letras texto="Run" /><Equalizador className="lr-capa__eq" /></span></span>
        </h1>

        <p className="lr-capa__chamada" data-capa-entra>{CHAMADA}</p>
        <p className="lr-capa__apoio" data-capa-entra>{APOIO}</p>

        <ul className="lr-capa__fatos" aria-label="Informações do evento">
          <li data-capa-entra><strong>Sábado, 7 de novembro</strong>{HORARIO.concentracao ? ` · ${HORARIO.concentracao}` : ""}</li>
          <li data-capa-entra>Parque da Cidade, Estacionamento 1</li>
          <li data-capa-entra className="lr-selo lr-selo--amarelo">Inscrição gratuita</li>
          <li data-capa-entra className="lr-selo lr-selo--rosa">{ESCASSEZ_PUBLICA}</li>
        </ul>

        <div className="lr-capa__ctas" data-capa-entra>
          <a href="#inscricao" className="lr-btn lr-btn--vermelho lr-btn--g" onClick={() => rastrear("cta_clicado", { origem: "capa" })}>
            Quero garantir minha vaga
          </a>
          {ingresso ? (
            <a href={ingresso} className="lr-btn lr-btn--contorno">Ver meu ingresso</a>
          ) : (
            <a href="#experiencia" className="lr-link-seta lr-link-seta--claro">Como vai ser</a>
          )}
        </div>

        <div data-capa-entra>
          <Marcas tom="claro" compacto />
        </div>
      </div>

      <Pulso className="lr-capa__pulso" />
    </section>
  );
}
