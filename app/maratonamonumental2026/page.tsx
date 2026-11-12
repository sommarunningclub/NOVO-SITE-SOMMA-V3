import type { Metadata } from "next";
import { CAMINHO, NOME_EVENTO, PROVA, URL_LP } from "@/lib/evp/config";
import { EVENTO_VAZIO, lerEventoPublico } from "@/lib/evp/db";
import type { EventoPublico } from "@/lib/evp/tipos";
import { Conduzem } from "./_components/Conduzem";
import { EventoProvider } from "./_components/Contexto";
import { Essencial } from "./_components/Essencial";
import { Hero } from "./_components/Hero";
import { Informacoes } from "./_components/Informacoes";
import { Inscricao } from "./_components/Inscricao";
import { MapaPercursos } from "./_components/MapaPercursos";
import { Navegacao } from "./_components/Navegacao";
import { Programacao } from "./_components/Programacao";
import { Rodape } from "./_components/Rodape";
import { SeletorDistancia } from "./_components/SeletorDistancia";

// A página sai de cache por até um minuto; o painel pede a regeneração quando
// salva, e a situação das vagas é conferida no navegador ao abrir.
export const revalidate = 60;

const TITULO = "Meeting Técnico | Maratona Monumental de Brasília 2026 | SOMMA Club × BORA";
const DESCRICAO =
  "Encontro presencial com os treinadores da BORA Assessoria e o SOMMA Club para entender os percursos da Maratona Monumental de Brasília 2026 e preparar a estratégia da sua prova: ritmo, hidratação, alimentação e logística.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  keywords: [
    "Meeting Técnico",
    "Maratona Monumental de Brasília 2026",
    "percurso Maratona Monumental",
    "SOMMA Club",
    "BORA Assessoria",
    "estratégia de prova",
    "corrida Brasília",
  ],
  alternates: { canonical: CAMINHO },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: URL_LP,
    siteName: "SOMMA Club",
    title: "Meeting Técnico | Maratona Monumental de Brasília 2026",
    description: "Você treinou para a prova. Agora conheça o caminho. Com o SOMMA Club e a BORA Assessoria.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meeting Técnico | Maratona Monumental de Brasília 2026",
    description: "Você treinou para a prova. Agora conheça o caminho.",
  },
};

/**
 * Dados estruturados só com o que está confirmado no painel. Sem data e local
 * cadastrados, a página não declara evento nenhum ao buscador.
 */
function dadosEstruturados(ev: EventoPublico): string | null {
  if (!ev.starts_at || !ev.local_nome || !ev.endereco) return null;
  const aberta = ev.vagas.modo === "aberta";
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    name: NOME_EVENTO,
    description: DESCRICAO,
    startDate: ev.starts_at,
    ...(ev.ends_at ? { endDate: ev.ends_at } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: URL_LP,
    image: [`${URL_LP}/opengraph-image`],
    location: {
      "@type": "Place",
      name: ev.local_nome,
      address: { "@type": "PostalAddress", streetAddress: ev.endereco, addressLocality: "Brasília", addressRegion: "DF", addressCountry: "BR" },
      ...(ev.lat !== null && ev.lng !== null ? { geo: { "@type": "GeoCoordinates", latitude: ev.lat, longitude: ev.lng } } : {}),
    },
    organizer: [
      { "@type": "Organization", name: "SOMMA Club", url: "https://sommaclub.com.br" },
      { "@type": "Organization", name: "BORA Assessoria" },
    ],
    ...(ev.valor_centavos !== null
      ? {
          offers: {
            "@type": "Offer",
            url: `${URL_LP}#inscricao`,
            price: (ev.valor_centavos / 100).toFixed(2),
            priceCurrency: "BRL",
            availability: aberta ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
          },
          isAccessibleForFree: ev.valor_centavos === 0,
        }
      : {}),
    about: { "@type": "SportsEvent", name: PROVA.nome, url: PROVA.site },
  }).replace(/</g, "\\u003c");
}

/** Antes da primeira pintura: liga a ocultação da hero só para quem aceita movimento. */
const PRE = `try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('mt-pre')}catch(e){}`;

export default async function Pagina() {
  const evento = (await lerEventoPublico()) ?? EVENTO_VAZIO;
  const ld = dadosEstruturados(evento);

  return (
    <EventoProvider evento={evento}>
      <script dangerouslySetInnerHTML={{ __html: PRE }} />
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />}
      <Navegacao />
      <main id="conteudo">
        <Hero />
        <Essencial evento={evento} />
        <SeletorDistancia />
        <MapaPercursos />
        <Programacao momentos={evento.programacao} />
        <Conduzem profissionais={evento.profissionais} />
        <Informacoes />
        <Inscricao />
      </main>
      <Rodape evento={evento} />
    </EventoProvider>
  );
}
