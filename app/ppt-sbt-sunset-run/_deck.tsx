"use client";

import { useRef } from "react";
import { JourneyRail, MobileBar, Nav, useDeckMotion } from "./_chrome";
import { s } from "./_ui";

import { Hero } from "./_sec/01-hero";
import { Partida } from "./_sec/02-partida";
import { PorQue } from "./_sec/03-porque";
import { Road } from "./_sec/05-road";
import { Pass } from "./_sec/06-pass";
import { Missions } from "./_sec/07-missions";
import { DataSection } from "./_sec/08-data";
import { ContentEngine } from "./_sec/09-content";
import { RaceDay } from "./_sec/10-raceday";
import { Pacers } from "./_sec/11-pacers";
import { Journey } from "./_sec/12-journey";
import { Access } from "./_sec/13-access";
import { Investment } from "./_sec/15-investment";
import { ValueBothWays } from "./_sec/16-value";
import { Close } from "./_sec/17-close";

export function Deck() {
  const root = useRef<HTMLDivElement>(null);
  const { stage, progress } = useDeckMotion(root);

  return (
    // o data-motion abaixo é escrito antes da hidratação, de propósito
    <main ref={root} className={s.deck} suppressHydrationWarning>
      {/*
        Liga os estados iniciais do motion ainda durante o parse do HTML.
        Precisa acontecer antes dos efeitos das seções: é o CSS deste atributo
        que esconde as palavras, e o GSAP precisa encontrá-las já escondidas
        para saber de onde animar. Também evita o flash do texto visível.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.currentScript.parentElement.dataset.motion='on'}}catch(e){}})()",
        }}
      />
      <Nav />
      <MobileBar stage={stage} progress={progress} />
      <JourneyRail stage={stage} progress={progress} />

      <Hero />
      <Partida />
      <PorQue />
      <Road />
      <Pass />
      <Missions />
      <DataSection />
      <ContentEngine />
      <RaceDay />
      <Pacers />
      <Journey />
      <Access />
      <Investment />
      <ValueBothWays />
      <Close />
    </main>
  );
}
