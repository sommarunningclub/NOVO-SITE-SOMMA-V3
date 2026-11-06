import { lerSessao } from "@/lib/vem-correr-comigo/servidor";
import App from "../../_components/App";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  return <App logado={Boolean(await lerSessao())} destino={{ tipo: "grupo", codigo }} />;
}
