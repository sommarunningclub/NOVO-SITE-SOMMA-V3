"use client";

import Image from "next/image";
import { gsap, useScope, EASE } from "../_motion";
import { Headline, Chapter, Section, cx, s } from "../_ui";

const CREW = [
  { t: "Ponto de encontro Somma", d: "Um endereço único na arena, comunicado desde a Week 01." },
  { t: "Concentração e aquecimento", d: "Ativação conduzida pelos treinadores antes da largada." },
  { t: "Foto oficial da comunidade", d: "O registro que vira conteúdo no mesmo dia." },
  { t: "Pacers por ritmo", d: "Grupos de 5 km e 10 km com balão e identificação." },
  { t: "Bandeiras e identidade", d: "Um bloco visual Somma reconhecível dentro da arena." },
  { t: "Cobertura da jornada", d: "O fecho da série de conteúdo, gravado na Esplanada." },
];

/**
 * Race Day.
 *
 * É aqui que a apresentação troca de temperatura: sai da preparação e entra no
 * evento. A imagem da largada só aparece quando a leitura chega — antes disso a
 * tela está fechada.
 */
export function RaceDay() {
  const ref = useScope<HTMLDivElement>(({ root }) => {
    const q = gsap.utils.selector(root);

    gsap
      .timeline({
        scrollTrigger: { trigger: q(".js-rd-wrap")[0], start: "top top", end: "bottom bottom", scrub: 0.55 },
      })
      // a foto abre de dentro para fora
      .fromTo(
        q(".js-rd-photo"),
        { clipPath: "inset(46% 12% 46% 12%)", scale: 1.24 },
        { clipPath: "inset(0% 0% 0% 0%)", scale: 1.04, duration: 1, ease: "power2.inOut" },
        0,
      )
      .fromTo(q(".js-rd-veil"), { opacity: 0.94 }, { opacity: 0.52, duration: 1, ease: "none" }, 0)
      .fromTo(
        q(".js-rd-title .js-word"),
        { yPercent: 106, y: 0 },
        { yPercent: 0, duration: 0.34, stagger: 0.08, ease: EASE.out },
        0.22,
      )
      .fromTo(q(".js-rd-sub"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.24 }, 0.5);
  });

  return (
    <Section id="raceday" stage={4}>
      <div ref={ref}>
        {/* ------------------------------------------------------ abertura */}
        <div className="js-rd-wrap js-pin-track relative h-[240vh] md:h-[280vh]">
          <div className="js-pin-frame sticky top-0 h-[100svh] overflow-hidden">
            <div className="js-rd-photo absolute inset-0">
              <Image
                src="/sbt/kit/start-gate.jpg"
                alt="Largada da SBT Sunset Run na Esplanada dos Ministérios, com a Catedral de Brasília ao fundo"
                fill
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>

            {/* véu que abre junto com a foto */}
            <div
              className="js-rd-veil absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg,rgba(4,8,26,.9) 0%,rgba(4,8,26,.5) 42%,rgba(4,8,26,.86) 100%)",
              }}
            />
            <div className={s.grain} />

            <div className={cx(s.shell, "relative z-10 flex h-full flex-col justify-end pb-16 md:pb-24")}>
              <Headline
                as="h2"
                level="h1"
                solo
                className="js-rd-title"
                style={{ fontSize: "clamp(3.4rem,13.5vw,13rem)" }}
              >
                Race Day
              </Headline>
              <p className={cx(s.lead, s.mHide, "js-rd-sub mt-6 max-w-[34ch] !text-white")}>
                Quatro semanas depois, a comunidade não chega na Esplanada. Ela{" "}
                <span style={{ color: "var(--somma)" }}>volta</span> para lá — junto.
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------ o bloco Somma */}
        <div className={cx(s.shell, "relative z-10 pt-24 md:pt-36")}>
          <Chapter n="10" label="Somma Sunset Crew" />

          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-6">
              <Headline level="h2">{"Um bloco Somma\ndentro da\nSunset Run."}</Headline>
            </div>
            <div className="flex items-end md:col-span-5 md:col-start-8" data-rise>
              <p className={s.body}>
                A ideia não é ocupar a organização da prova, e sim criar um ponto de gravidade dentro dela: um lugar
                onde a comunidade se encontra, aquece, se fotografa e larga junta.
              </p>
            </div>
          </div>

          <ul className="mt-14 grid gap-px md:mt-20 md:grid-cols-3" data-rise data-rise-children>
            {CREW.map((c, i) => (
              <li key={c.t} className="border-t py-6 md:pr-8" style={{ borderColor: "var(--hair)" }}>
                <span className={cx(s.mono, "text-[0.5625rem] tracking-[0.22em]")} style={{ color: "var(--somma)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className={cx(s.h3, "mt-3 !text-[clamp(1.05rem,1.6vw,1.3rem)]")} style={{ fontVariationSettings: '"wdth" 100' }}>
                  {c.t}
                </p>
                <p className={cx(s.body, "mt-2 !text-[0.875rem]")}>{c.d}</p>
              </li>
            ))}
          </ul>

          {/* ressalva honesta sobre o que depende da organização */}
          <p
            className={cx(s.mono, "mt-12 max-w-[62ch] text-[0.625rem] uppercase leading-[1.7] tracking-[0.14em]")}
            style={{ color: "rgba(255,255,255,.3)" }}
          >
            A formação de um pelotão da comunidade é uma possibilidade a ser desenhada junto com a organização
            esportiva. Posicionamento de largada segue as regras da prova.
          </p>
        </div>
      </div>
    </Section>
  );
}
