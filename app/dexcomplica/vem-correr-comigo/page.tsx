import { lerSessao } from "@/lib/vem-correr-comigo/servidor";
import App from "./_components/App";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <App logado={Boolean(await lerSessao())} />;
}
