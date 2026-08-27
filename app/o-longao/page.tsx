import { getCrewsPublicas } from "@/lib/o-longao/db";
import { Chrome } from "./_components/Chrome";
import { Hero } from "./_components/Hero";
import { Ticker } from "./_components/Ticker";
import { Provocacao } from "./_components/Provocacao";
import { Conceito } from "./_components/Conceito";
import { Seletiva } from "./_components/Seletiva";
import { Virada } from "./_components/Virada";
import { Timeline24 } from "./_components/Timeline24";
import { Estrategia } from "./_components/Estrategia";
import { Categorias } from "./_components/Categorias";
import { Premiacao } from "./_components/Premiacao";
import { QuemParticipa } from "./_components/QuemParticipa";
import { Arena } from "./_components/Arena";
import { StarTrac } from "./_components/StarTrac";
import { ExperienciaDigital } from "./_components/ExperienciaDigital";
import { CrewsGrid } from "./_components/CrewsGrid";
import { Faq } from "./_components/Faq";
import { FinalCta } from "./_components/FinalCta";
import { EventFooter } from "./_components/EventFooter";

/**
 * A página é um Server Component: busca a vitrine de crews no banco e passa
 * como valor inicial. Só os blocos com motion ou interação viram Client
 * Components — os Tickers e o rodapé chegam como HTML puro.
 *
 * O ritmo visual alterna noite e papel de propósito: a página inteira é uma
 * prova de 24 horas, e as quebras claras são os raros momentos de luz.
 */
export const revalidate = 30;

export default async function OLongaoPage() {
  const crews = await getCrewsPublicas();

  return (
    <>
      <Chrome />
      <main>
        <Hero />
        <Ticker variante="timing" />
        <Provocacao />
        <Conceito />
        <Ticker variante="escuro" reverso />
        <Seletiva />
        <Virada />
        <Timeline24 />
        <Estrategia />
        <Ticker
          variante="energia"
          itens={[
            "UMA TROCA PODE DECIDIR 24 HORAS",
            "O RELÓGIO NUNCA PARA",
            "QUANDO UM PARA, OUTRO COMEÇA",
            "DORMIR TAMBÉM É ESTRATÉGIA",
          ]}
        />
        <Categorias />
        <Premiacao />
        <QuemParticipa />
        <Arena />
        <StarTrac />
        <ExperienciaDigital />
        <CrewsGrid crews={crews} />
        <Faq />
        <FinalCta />
      </main>
      <EventFooter />
      {/* respiro para o CTA fixo do mobile não cobrir o rodapé */}
      <div aria-hidden className="h-20 sm:hidden" />
    </>
  );
}
