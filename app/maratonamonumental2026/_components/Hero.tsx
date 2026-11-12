"use client";

import Image from "next/image";
import { medir } from "@/lib/evp/analytics";
import { IMAGENS } from "@/lib/evp/config";
import { dataLonga, horario } from "@/lib/evp/formato";
import { EASE, gsap, useEscopo } from "../_motion";
import { rotuloCta, useEvento } from "./Contexto";

export function Hero() {
  const { evento, vagas } = useEvento();
  const imagem = evento.conteudo.hero_imagem || IMAGENS.hero;
  const data = dataLonga(evento.starts_at);
  const hora = horario(evento.starts_at, evento.ends_at);

  const ref = useEscopo<HTMLElement>(({ raiz, modesto }) => {
    const rota = raiz.querySelector<SVGPathElement>("[data-rota]");
    // pathLength="1" no SVG: o traço vai de 1 a 0 qualquer que seja a escala da tela.
    if (rota) gsap.set(rota, { strokeDasharray: 1, strokeDashoffset: 1 });

    const tl = gsap.timeline({ defaults: { ease: EASE.out } });
    tl.from("[data-hero='marca']", { y: -14, autoAlpha: 0, duration: 0.7 })
      .fromTo("[data-hero='cortina']", { scaleY: 1, opacity: 1 }, { scaleY: 0, duration: 1.3, ease: EASE.inOut }, 0.1)
      .from("[data-hero='foto']", { scale: 1.18, duration: 1.8 }, 0.1)
      .from("[data-hero='linha']", { yPercent: 108, duration: 1, stagger: 0.09 }, 0.25)
      .from("[data-hero='sobe']", { y: 26, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 0.75);
    if (rota) tl.to(rota, { strokeDashoffset: 0, duration: 2, ease: EASE.inOut }, 0.5);
    tl.from("[data-hero='ponto']", { scale: 0, autoAlpha: 0, duration: 0.5, ease: "back.out(2)" }, "-=0.5");

    // O GSAP já assumiu: sai a ocultação de primeira pintura.
    document.documentElement.classList.remove("mt-pre");

    if (!modesto) {
      gsap.to("[data-hero='foto']", {
        yPercent: 8,
        ease: "none",
        scrollTrigger: { trigger: raiz, start: "top top", end: "bottom top", scrub: 0.5 },
      });
    }
  });

  return (
    <section ref={ref} id="topo" className="relative isolate flex min-h-[min(100svh,54rem)] flex-col justify-end overflow-hidden pb-10 pt-28 lg:min-h-[min(100svh,58rem)] lg:pb-14">
      {/* Foto: fundo no celular, painel assimétrico à direita no desktop. */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[62%] overflow-hidden lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:w-[44%]">
        <div data-hero="foto" className="absolute inset-0">
          <Image src={imagem} alt="Corredores do SOMMA Club em Brasília, vistos de costas, com a bandeira do clube" fill priority sizes="(min-width: 1024px) 44vw, 100vw" className="object-cover object-[50%_35%]" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[rgba(8,8,8,0.55)] via-[rgba(8,8,8,0.15)] to-[color:var(--mt-preto)] lg:bg-gradient-to-r lg:from-[color:var(--mt-preto)] lg:via-[rgba(8,8,8,0.25)] lg:to-[rgba(8,8,8,0.1)]" />
        <div aria-hidden data-hero="cortina" className="absolute inset-0 origin-bottom scale-y-0 bg-[color:var(--mt-preto)]" />
      </div>

      {/* Grafismo: uma linha de percurso que atravessa a composição. Não é o trajeto da prova. */}
      <svg aria-hidden viewBox="0 0 1200 600" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-[18%] -z-10 h-[46%] w-full opacity-90 lg:bottom-[8%] lg:h-[70%]">
        <path data-rota pathLength={1} className="mt-rota" d="M-20 520 C 140 520, 180 400, 320 404 S 470 520, 610 470 S 700 250, 850 262 S 980 380, 1070 210 S 1150 90, 1230 96" />
      </svg>
      <span aria-hidden data-hero="ponto" className="pointer-events-none absolute right-[7%] top-[30%] -z-10 hidden h-3 w-3 rounded-full bg-[color:var(--mt-laranja)] shadow-[0_0_0_6px_rgba(255,44,3,0.25)] lg:block" />

      <div className="mt-container relative">
        <p data-hero="marca" className="mt-marco mb-5">
          <b>Encontro presencial</b> Brasília, DF
        </p>

        <h1>
          <span className="mt-display block text-[clamp(3.9rem,20.5vw,9.5rem)] lg:text-[clamp(8.5rem,12.4vw,13.5rem)]">
            <span className="mt-mascara"><span data-hero="linha">Meeting</span></span>
            <span className="mt-mascara"><span data-hero="linha">Técnico<span className="text-[color:var(--mt-laranja)]">.</span></span></span>
          </span>
          <span className="mt-titulo mt-4 block !text-[clamp(1.35rem,5.4vw,2.6rem)] text-white">
            <span className="mt-mascara"><span data-hero="linha">Maratona Monumental</span></span>
            <span className="mt-mascara"><span data-hero="linha">de Brasília 2026.</span></span>
          </span>
        </h1>

        <div className="mt-7 max-w-[34rem] lg:mt-9">
          <p data-hero="sobe" className="text-[1.2rem] font-semibold leading-snug text-white sm:text-[1.4rem]">
            Você treinou para a prova. Agora conheça o caminho.
          </p>
          {evento.conteudo.hero_descricao && (
            <p data-hero="sobe" className="mt-texto mt-3">{evento.conteudo.hero_descricao}</p>
          )}
          <div data-hero="sobe" id="hero-cta" className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#inscricao" className="mt-botao mt-botao--cheio" onClick={() => medir("evp_cta_click", { local: "hero" })}>
              {rotuloCta(vagas.modo)}
              <span aria-hidden className="mt-seta">→</span>
            </a>
            <a href="#meeting" className="mt-botao mt-botao--linha" onClick={() => medir("evp_cta_click", { local: "hero-secundario" })}>
              Conheça o Meeting
            </a>
          </div>
        </div>

        <dl data-hero="sobe" className="mt-10 grid max-w-[44rem] grid-cols-2 gap-x-6 gap-y-5 border-t border-[color:var(--mt-linha)] pt-6 sm:grid-cols-4">
          <Dado rotulo="Data" valor={data} pendente="Em breve" />
          <Dado rotulo="Horário" valor={hora} pendente="Em breve" />
          <Dado rotulo="Local" valor={evento.local_nome} pendente="Em definição" />
          <Dado rotulo="Formato" valor="Presencial" />
        </dl>
      </div>
    </section>
  );
}

function Dado({ rotulo, valor, pendente }: { rotulo: string; valor: string | null; pendente?: string }) {
  return (
    <div>
      <dt className="mt-rotulo">{rotulo}</dt>
      <dd className="mt-1.5 text-[0.95rem] font-medium leading-snug">
        {valor ?? <span className="text-[color:var(--mt-cinza)]">{pendente}</span>}
      </dd>
    </div>
  );
}
