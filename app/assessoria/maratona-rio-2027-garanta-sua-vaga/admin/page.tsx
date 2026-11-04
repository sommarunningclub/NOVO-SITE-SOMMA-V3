import type { Metadata, Viewport } from "next";
import { altone } from "@/components/bora/fonte";
import { getServiceSupabase } from "@/lib/supabase";
import { ENV_SENHA, acessoConfigurado, temAcesso } from "@/lib/maratona-rio-2027/auth";
import { PROFESSORES_BORA } from "@/lib/nova-assessoria/professores";
import { LoginAdmin } from "../../maratona-rio-2027/admin/_components/LoginAdmin";
import { PainelInscricoes, type Inscricao } from "./_components/PainelInscricoes";

/**
 * Painel das inscrições da Meia Maratona do Rio 2027. Mesma senha e mesma
 * sessão do painel de intenção (/assessoria/maratona-rio-2027/admin).
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel · Inscrições Meia Maratona do Rio 2027",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

async function carregar(): Promise<{ inscricoes: Inscricao[]; erro?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { inscricoes: [], erro: "Banco indisponível (SUPABASE_SERVICE_ROLE_KEY ausente)." };
  const { data, error } = await supabase
    .from("maratona_rio_2027_inscricoes")
    .select(
      "id, criado_em, nome, email, telefone, cpf, data_nascimento, sexo, treinador, treinador_outro, estrutura_apoio, valor_total, status, pago_em"
    )
    .order("criado_em", { ascending: true })
    .limit(2000);
  if (error) return { inscricoes: [], erro: error.message };
  return { inscricoes: (data ?? []) as Inscricao[] };
}

export default async function AdminInscricoesPage() {
  let conteudo: React.ReactNode;

  if (!acessoConfigurado()) {
    conteudo = (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Painel fechado</p>
        <p className="mt-4 text-white/70">
          Falta configurar a senha: crie a variável <code className="text-white">{ENV_SENHA}</code> na Vercel.
        </p>
      </div>
    );
  } else if (!(await temAcesso())) {
    conteudo = <LoginAdmin />;
  } else {
    const { inscricoes, erro } = await carregar();
    const treinadores = Object.fromEntries(PROFESSORES_BORA.map((p) => [p.slug, p.nome]));
    conteudo = <PainelInscricoes inscricoes={inscricoes} treinadores={treinadores} erro={erro} />;
  }

  return (
    <main className={`${altone.variable} min-h-screen bg-black text-white`}>
      <style>{"html,body{background:#000}"}</style>
      {conteudo}
    </main>
  );
}
