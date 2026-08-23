import { ActsStrip } from "./_components/ActsStrip";
import { ComoFunciona } from "./_components/ComoFunciona";
import { AfterPace } from "./_components/AfterPace";
import { EventFooter } from "./_components/EventFooter";
import { EventHeader } from "./_components/EventHeader";
import { FinalCTA } from "./_components/FinalCTA";
import { FinishTransition } from "./_components/FinishTransition";
import { HeroExperience } from "./_components/HeroExperience";
import { HundredPeopleScene } from "./_components/HundredPeopleScene";
import { HypeDownload } from "./_components/HypeDownload";
import { HypeExperience } from "./_components/HypeExperience";
import { LightStage, type AncoraDeLuz } from "./_components/LightStage";
import { PaceMatchScene } from "./_components/PaceMatchScene";
import { PartnersExperience } from "./_components/PartnersExperience";
import { RunRoute } from "./_components/RunRoute";
import { Smooth } from "./_components/Smooth";
import { StravaExchange } from "./_components/StravaExchange";
import { SundayJourney } from "./_components/SundayJourney";
import { TicketExperience } from "./_components/TicketExperience";

/**
 * A JORNADA DA LUZ
 *
 * Cada seção declara em que hora do dia ela acontece, e o palco faz a página
 * mudar de clima continuamente — nunca em blocos. Lida de cima a baixo, a lista
 * é a própria narrativa:
 *
 *   asfalto → alvorada → a véspera digital → domingo amanhece → a corrida →
 *   o céu do brunch → a troca → o ingresso → a decisão.
 *
 * O hero abre em `run` porque a fotografia que o cobre é escura: é ela que
 * define o tom do header e do CTA fixo por cima.
 */
const MAPA_DE_LUZ: readonly AncoraDeLuz[] = [
  { id: "hero", luz: "run" },
  { id: "experiencia", luz: "dawn" },
  { id: "como-funciona", luz: "dawn" },
  { id: "cem", luz: "run" },
  { id: "hype", luz: "night" },
  { id: "baixar-app", luz: "night" },
  { id: "pace-match", luz: "night" },
  { id: "domingo", luz: "dawn" },
  { id: "percurso", luz: "dawn" },
  { id: "finish", luz: "run" },
  { id: "after-pace", luz: "noon" },
  { id: "strava-exchange", luz: "night" },
  { id: "spot", luz: "noon" },
  { id: "marcas", luz: "noon" },
  { id: "garantir", luz: "flare" },
];

/**
 * SUNDAY SOCIAL RUN — landing da experiência.
 *
 * Server Component: só os blocos com motion ou interação viram Client
 * Components. O rodapé, por exemplo, chega como HTML puro.
 */
export default function RunIntoSomeonePage() {
  return (
    <>
      <LightStage mapa={MAPA_DE_LUZ} />
      <Smooth />
      <EventHeader />

      <main>
        {/* Ato I — RUN */}
        <HeroExperience />
        <ActsStrip />
        <ComoFunciona />
        <HundredPeopleScene />

        {/* Ato II — CONNECT (a véspera acontece no digital) */}
        <HypeExperience />
        <HypeDownload />
        <PaceMatchScene />

        {/* Ato I continua — domingo amanhece */}
        <SundayJourney />
        <RunRoute />
        <FinishTransition />

        {/* Ato III — STAY */}
        <AfterPace />
        <StravaExchange />

        {/* Conversão */}
        <TicketExperience />
        <PartnersExperience />
        <FinalCTA />
      </main>

      <EventFooter />

      {/* respiro para o CTA fixo do mobile não cobrir o rodapé */}
      <div aria-hidden className="h-24 sm:hidden" />
    </>
  );
}
