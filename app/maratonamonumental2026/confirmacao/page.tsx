import { redirect } from "next/navigation";
import { CAMINHO } from "@/lib/evp/config";

export const dynamic = "force-dynamic";

/** Endereço antigo do ingresso. Leva para a página de obrigado, com o mesmo token. */
export default async function Pagina({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  redirect(`${CAMINHO}/obrigado${t ? `?t=${encodeURIComponent(t)}` : ""}`);
}
