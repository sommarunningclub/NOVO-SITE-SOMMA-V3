"use client";

import { CommercialProvider } from "./CommercialContext";
import PresentationChrome from "./PresentationChrome";
import GsapEffects from "./GsapEffects";
import PackageDetailsModal from "./PackageDetailsModal";
import PackageComparison from "./PackageComparison";

import { Hero, QuemSomos, Posicionamento } from "./sections/Overview";
import { Numeros, BasePropria, PresencaFisica } from "./sections/Community";
import { ImpactoDigital, Formatos } from "./sections/Reach";
import { Ecossistema } from "./sections/Ecosystem";
import { Ativacoes } from "./sections/Activations";
import { MidiaInstagram, MidiaAgendaSite } from "./sections/Media";
import { Patrocinios, Assessoria, PatrociniosTopo } from "./sections/Sponsorships";
import {
  TabelaGeral,
  SimuladorSection,
  Entregas,
  Transparencia,
  Processo,
} from "./sections/Investments";
import { Formulario, Encerramento, Regras, Footer } from "./sections/Contact";

export default function Presentation() {
  return (
    <CommercialProvider>
      <div className="pcs-root min-h-screen selection:bg-[var(--somma-primary)] selection:text-white">
        <PresentationChrome />
        <GsapEffects />

        <main>
          {/* Visão geral */}
          <Hero />
          <QuemSomos />
          <Posicionamento />

          {/* Comunidade */}
          <Numeros />
          <BasePropria />
          <PresencaFisica />

          {/* Alcance */}
          <ImpactoDigital />
          <Formatos />

          {/* Ecossistema */}
          <Ecossistema />

          {/* Ativações */}
          <Ativacoes />

          {/* Mídia */}
          <MidiaInstagram />
          <MidiaAgendaSite />

          {/* Patrocínios */}
          <Patrocinios />
          <Assessoria />
          <PatrociniosTopo />

          {/* Investimentos */}
          <TabelaGeral />
          <SimuladorSection />
          <Entregas />
          <Transparencia />
          <Processo />

          {/* Contato */}
          <Formulario />
          <Encerramento />
          <Regras />
        </main>

        <Footer />

        {/* Camadas interativas globais */}
        <PackageDetailsModal />
        <PackageComparison />
      </div>
    </CommercialProvider>
  );
}
