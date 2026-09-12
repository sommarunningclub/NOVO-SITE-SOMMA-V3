"use client";

import Image from "next/image";
import {
  ABERTURA,
  CIDADE,
  DATA_CURTA,
  ESCASSEZ_PUBLICA,
  EVENTO_EDICAO,
  LOCAL,
} from "@/lib/somma-day/event.config";
import { useGsap, movimentoReduzido } from "@/lib/somma-day/motion";

/**
 * A capa.
 *
 * Uma foto de largada do SOMMA ocupando a tela inteira, a logo oficial por
 * cima e o mote em três tempos. A foto afasta devagar enquanto a página desce
 * (parallax com scrub) e o conteúdo sobe junto: a sensação é de a multidão
 * ficar para trás, não de um bloco rolando.
 *
 * Tudo que entra por animação começa VISÍVEL no HTML — quem tem movimento
 * reduzido, ou se o GSAP não carregar, vê a capa inteira, parada.
 */
export default function Capa() {
  const ref = useGsap(({ gsap, root }) => {
    if (movimentoReduzido()) return;

    const midia = root.querySelector<HTMLElement>("[data-midia]");
    const linhas = root.querySelectorAll<HTMLElement>("[data-linha]");
    const marca = root.querySelector<HTMLElement>("[data-marca]");
    const apoio = root.querySelectorAll<HTMLElement>("[data-apoio]");

    const tl = gsap.timeline({ delay: 0.15 });
    if (marca) tl.from(marca, { scale: 0.86, rotate: -6, autoAlpha: 0, duration: 1.1, ease: "power4.out" }, 0);
    if (linhas.length) tl.from(linhas, { yPercent: 115, autoAlpha: 0, duration: 1, stagger: 0.11, ease: "power4.out" }, 0.15);
    if (apoio.length) tl.from(apoio, { y: 22, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 0.55);

    if (midia) {
      gsap.fromTo(
        midia,
        { yPercent: -6, scale: 1.08 },
        {
          yPercent: 8,
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        }
      );
    }

    // O conteúdo sai antes da seção acabar: quando a próxima chega, a capa já
    // não disputa atenção.
    const conteudo = root.querySelector<HTMLElement>("[data-conteudo]");
    if (conteudo) {
      gsap.to(conteudo, {
        yPercent: -14,
        autoAlpha: 0.25,
        ease: "none",
        scrollTrigger: { trigger: root, start: "center top", end: "bottom top", scrub: true },
      });
    }
  }, []);

  return (
    <section ref={ref} className="sd-capa">
      <div data-midia className="sd-capa-midia">
        <Image
          src="/somma/SMSPD-372.jpg"
          alt="Largada de um encontro do SOMMA Club, com centenas de corredores"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="sd-capa-veu" />

      <div
        data-conteudo
        className="sd-seguro-lados relative z-10 mx-auto grid w-full max-w-[1200px] items-center gap-7 py-14 md:grid-cols-[0.8fr_1.2fr] md:gap-12 md:py-20"
      >
        <div data-marca className="mx-auto w-full min-w-0 max-w-[260px] sm:max-w-[320px] md:max-w-none">
          <Image
            src="/somma-day/logo-somma-day.svg"
            alt={`SOMMA DAY — ${EVENTO_EDICAO}`}
            width={1040}
            height={1040}
            priority
            unoptimized
            className="h-auto w-full drop-shadow-[0_18px_0_rgba(0,0,0,0.25)]"
          />
        </div>

        <div className="min-w-0 text-[var(--sd-creme)]">
          <h1 className="sd-display text-[clamp(2.9rem,9vw,6rem)] leading-[1.02]">
            {["A corrida", "é só", "o começo."].map((linha, i) => (
              <span key={linha} className="sd-mask">
                <span
                  data-linha
                  className="block"
                  style={{ color: i === 2 ? "var(--sd-amarelo)" : "var(--sd-creme)" }}
                >
                  {linha}
                </span>
              </span>
            ))}
          </h1>

          <p data-apoio className="mt-5 max-w-md text-[15px] font-semibold leading-relaxed opacity-90 sm:text-[16px]">
            Você chega para correr e fica para o resto: ativações, café da manhã, sorteios, DJ e
            pagode. Todo mundo corre. Depois todo mundo fica.
          </p>

          <ul data-apoio className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-extrabold uppercase tracking-[0.16em] sm:text-[13px]">
            <li className="text-[var(--sd-amarelo)]">{DATA_CURTA}</li>
            <li>{ABERTURA}</li>
            <li>{LOCAL}</li>
            <li className="opacity-70">{CIDADE}</li>
          </ul>

          <div data-apoio className="mt-7 flex flex-wrap items-center gap-4">
            <a
              href="#inscricao"
              className="sd-botao sd-toque inline-block bg-[var(--sd-vermelho)] px-9 py-5 text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--sd-creme)]"
              style={{ borderColor: "var(--sd-creme)", boxShadow: "6px 6px 0 var(--sd-creme)" }}
            >
              Garanta sua pulseira
            </a>
            <span className="text-[12px] font-extrabold uppercase tracking-[0.18em]">
              Gratuito · {ESCASSEZ_PUBLICA}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2" aria-hidden="true">
        <div className="sd-cue" />
      </div>
    </section>
  );
}
