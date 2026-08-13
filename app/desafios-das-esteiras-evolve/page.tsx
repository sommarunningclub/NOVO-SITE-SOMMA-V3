import { getEventStats } from "@/lib/desafio-esteiras/db";
import { UNITS } from "@/lib/desafio-esteiras/event.config";
import { Chrome } from "./_components/Chrome";
import { Hero } from "./_components/Hero";
import { Ticker } from "./_components/Ticker";
import { Manifesto } from "./_components/Manifesto";
import { Experience } from "./_components/Experience";
import { HowItWorks } from "./_components/HowItWorks";
import { UnitsNetwork } from "./_components/UnitsNetwork";
import { UnitsMap } from "./_components/UnitsMap";
import { SommaBase } from "./_components/SommaBase";
import { Faq } from "./_components/Faq";
import { FinalCta } from "./_components/FinalCta";
import { EventFooter } from "./_components/EventFooter";

/**
 * A página é um Server Component: busca os contadores no banco e passa como
 * valor inicial. Só os blocos que precisam de motion ou interação viram
 * Client Components — o Ticker e o rodapé, por exemplo, chegam como HTML puro.
 */
export const revalidate = 30;

export default async function DesafioDasEsteirasPage() {
  const stats = await getEventStats();

  const iniciais = {
    total: stats.total,
    unidades: stats.porUnidade.map((u) => {
      const unit = UNITS.find((x) => x.id === u.unitId)!;
      return {
        id: u.unitId,
        inscritos: u.inscritos,
        status: unit.status,
        capacidade: unit.capacidade,
      };
    }),
    disponivel: stats.disponivel,
  };

  return (
    <>
      <Chrome />
      <main>
        <Hero />
        <Ticker variante="energia" />
        <Manifesto />
        <Ticker variante="escuro" reverso />
        <Experience />
        <HowItWorks />
        <UnitsNetwork iniciais={iniciais} />
        <UnitsMap iniciais={iniciais} />
        <SommaBase />
        <Faq />
        <FinalCta />
      </main>
      <EventFooter />
      {/* respiro para o CTA fixo do mobile não cobrir o rodapé */}
      <div aria-hidden className="h-20 sm:hidden" />
    </>
  );
}
