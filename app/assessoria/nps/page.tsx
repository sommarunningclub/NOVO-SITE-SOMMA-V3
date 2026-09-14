import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase";
import { SURVEY_VERSION } from "@/lib/assessoria-nps/survey";
import { CONVITE_COOKIE, buscarCampanhaAtiva, buscarConvite, conviteRespondido } from "@/lib/assessoria-nps/db";
import { NpsSurvey } from "./_components/NpsSurvey";
import type { EstadoInicial } from "./_components/types";
import "./nps.css";

/** Lê a campanha no ar e o cookie do convite a cada acesso. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pesquisa da Assessoria Somma | SOMMA Club",
  description: "Queremos ouvir você. Conte como está a sua experiência na Assessoria Somma. Leva poucos minutos.",
  alternates: { canonical: "/assessoria/nps" },
  // Pesquisa de aluno não é página de busca.
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SOMMA Club",
    title: "Pesquisa da Assessoria Somma",
    description: "Queremos ouvir você. Leva poucos minutos.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

async function estadoInicial(): Promise<EstadoInicial> {
  const sb = getServiceSupabase();
  if (!sb) return { tipo: "indisponivel" };

  const busca = await buscarCampanhaAtiva(sb);
  if (busca.status !== "ok") return { tipo: busca.status };

  const { campanha } = busca;
  if (campanha.survey_version !== SURVEY_VERSION) {
    console.error("[assessoria-nps] campanha ativa com survey_version diferente do código:", campanha.slug);
    return { tipo: "indisponivel" };
  }

  // Link pessoal: o token vive num cookie httpOnly (ver convite/[token]/route.ts).
  const token = (await cookies()).get(CONVITE_COOKIE)?.value;
  const convite = await buscarConvite(sb, token, campanha.id);

  return {
    tipo: "aberta",
    campanha: campanha.slug,
    convite: convite
      ? {
          firstName: convite.first_name,
          lastName: convite.last_name,
          jaRespondeu: await conviteRespondido(sb, convite.id),
        }
      : null,
  };
}

export default async function AssessoriaNpsPage() {
  return <NpsSurvey inicial={await estadoInicial()} />;
}
