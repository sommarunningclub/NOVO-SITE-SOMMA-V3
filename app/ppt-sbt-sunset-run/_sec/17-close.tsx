"use client";

import { gsap, useScope, EASE, scrub } from "../_motion";
import { Headline, Lockup, Section, cx, s } from "../_ui";

/**
 * Fechamento.
 *
 * Espelha a abertura: o mesmo skyline, agora com o sol nascendo em vez de se
 * pondo. A primeira frase é negada pela segunda, que só aparece quando a
 * primeira sai.
 */
export function Close() {
  const ref = useScope<HTMLDivElement>(({ root }) => {
    const q = gsap.utils.selector(root);

    gsap
      .timeline({
        scrollTrigger: { trigger: q(".js-close-wrap")[0], start: "top top", end: "bottom bottom", scrub: scrub(0.55) },
      })
      .fromTo(q(".js-sun-rise"), { yPercent: 42, opacity: 0.15 }, { yPercent: 0, opacity: 1, ease: "none", duration: 1 }, 0)
      .fromTo(q(".js-sky-close"), { yPercent: 16, opacity: 0 }, { yPercent: 0, opacity: 1, ease: "none", duration: 0.6 }, 0)
      .fromTo(
        q(".js-line-a .js-word"),
        { yPercent: 106, y: 0 },
        { yPercent: 0, duration: 0.3, stagger: 0.05, ease: EASE.out },
        0.14,
      )
      .to(q(".js-line-a"), { opacity: 0, yPercent: -22, duration: 0.18, ease: "power2.in" }, 0.56)
      // a segunda frase só existe depois que a primeira sai: sem isso as duas
      // se sobrepõem enquanto as palavras da B ainda estão escondidas
      .set(q(".js-line-b"), { opacity: 1 }, 0.75)
      .fromTo(
        q(".js-line-b .js-word"),
        { yPercent: 106, y: 0 },
        { yPercent: 0, duration: 0.3, stagger: 0.06, ease: EASE.out },
        0.76,
      )
      .fromTo(q(".js-close-foot"), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.24 }, 0.96);
  });

  return (
    <Section id="close" stage={5}>
      <div ref={ref}>
        <div className="js-close-wrap js-pin-track relative h-[190vh]">
          <div
            className="js-pin-frame sticky top-0 flex h-[100svh] flex-col overflow-hidden"
            style={{ background: "linear-gradient(184deg,#04081a 0%,#061031 40%,#0a2a72 76%,#123c95 100%)" }}
          >
            {/* sol nascendo */}
            <div
              aria-hidden
              className="js-sun-rise absolute inset-x-0 bottom-0 h-[80%]"
              style={{
                background:
                  "radial-gradient(60% 96% at 50% 104%, rgba(255,186,96,.95) 0%, rgba(255,116,48,.72) 22%, rgba(255,60,30,.4) 40%, rgba(122,59,224,.36) 60%, rgba(20,102,224,0) 82%)",
              }}
            />

            {/* silhueta de Brasília */}
            <div
              aria-hidden
              className={cx(s.skyLayer, "js-sky-close")}
              style={{
                ["--mask" as string]: "url(/sbt/kit/skyline-near.png)",
                background: "linear-gradient(180deg,#04081a 0%,#04081a 100%)",
              }}
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-2/5"
              style={{ background: "linear-gradient(180deg,rgba(4,8,26,0),rgba(4,8,26,.9) 74%,#04081a)" }}
            />
            <div className={s.grain} />

            {/* ------------------------------------------------ frases */}
            <div className={cx(s.shell, "relative z-10 flex flex-1 flex-col justify-center")}>
              <div className="relative">
                <Headline as="p" level="h1" solo className="js-line-a max-w-[15ch]">
                  {"Don't just\npromote the race."}
                </Headline>

                <Headline
                  as="p"
                  level="h1"
                  solo
                  className={cx("js-line-b", s.mHide, s.swapTop, "max-w-[14ch]")}
                  style={{ color: "var(--paper)" }}
                >
                  {"Build the\nroad to it."}
                </Headline>
              </div>
            </div>

            {/* ------------------------------------------------ assinatura */}
            <div className={cx(s.shell, s.mHide, "js-close-foot relative z-10 pb-10 md:pb-14")}>
              <div
                className="mb-9 h-px w-full"
                style={{ background: "linear-gradient(90deg,var(--somma),rgba(85,218,255,.45) 46%,rgba(255,255,255,0))" }}
              />

              <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div>
                  <Lockup size="md" className="!justify-start" />
                  <p className={cx(s.mono, "mt-5 text-[0.625rem] uppercase tracking-[0.24em]")} style={{ color: "var(--dim-2)" }}>
                    Community Experience Partnership · Brasília 2026
                  </p>
                </div>

                <p
                  className={cx(s.h2, "shrink-0")}
                  style={{ fontSize: "clamp(1.75rem,4vw,3.4rem)", color: "var(--somma)" }}
                >
                  Let&apos;s run
                  <br />
                  together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
