import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { TrustBar } from "@/components/trust-bar";
import { About } from "@/components/about";
import { Location } from "@/components/location";
import { Paces } from "@/components/paces";
import { AdvisoryTeaser } from "@/components/advisory-teaser";
import { Gallery } from "@/components/gallery";
import { Testimonials } from "@/components/testimonials";
import { StravaCta } from "@/components/strava-cta";
import { Faq } from "@/components/faq";
import { SignupSection } from "@/components/signup-section";
import { Footer } from "@/components/footer";
import { AgendaPopup } from "@/components/agenda-popup";
import { SpecialDayPopup } from "@/components/special-day-popup";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <About />
        <Location />
        <Paces />
        <AdvisoryTeaser />
        <Gallery />
        {/* Depoimentos oculto por enquanto (trocar `false` por `true` para reexibir) */}
        {false && <Testimonials />}
        <StravaCta />
        <Faq />
        <SignupSection />
      </main>
      <Footer />
      {/* Pop-up do evento tem prioridade agora; agenda pausada p/ não ter 2 pop-ups (trocar false→true p/ reativar) */}
      {false && <AgendaPopup />}
      <SpecialDayPopup />
    </>
  );
}
