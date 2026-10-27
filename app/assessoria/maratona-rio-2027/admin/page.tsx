import type { Metadata, Viewport } from "next";
import { altone } from "@/components/bora/fonte";
import { getServiceSupabase } from "@/lib/supabase";
import { ENV_SENHA, acessoConfigurado, temAcesso } from "@/lib/maratona-rio-2027/auth";
import { LoginAdmin } from "./_components/LoginAdmin";
import { Dashboard, type Cadastro } from "./_components/Dashboard";

/**
 * Painel dos cadastros da Maratona do Rio 2027. Senha em MARATONA_RIO_ADMIN_SENHA
 * (ver lib/maratona-rio-2027/auth). Os dados vêm do servidor já com a sessão
 * conferida; filtros, gráficos e exportação rodam no navegador.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel · Maratona do Rio 2027",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

async function carregar(): Promise<{ cadastros: Cadastro[]; erro?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { cadastros: [], erro: "Banco indisponível (SUPABASE_SERVICE_ROLE_KEY ausente)." };
  const { data, error } = await supabase
    .from("maratona_rio_2027_intencoes")
    .select("id, criado_em, atualizado_em, nome, telefone, email, cpf, sexo, prova")
    .order("criado_em", { ascending: false })
    .limit(5000);
  if (error) return { cadastros: [], erro: error.message };
  return { cadastros: (data ?? []) as Cadastro[] };
}

export default async function AdminMaratonaRioPage() {
  let conteudo: React.ReactNode;

  if (!acessoConfigurado()) {
    conteudo = (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Painel fechado</p>
        <p className="mt-4 text-white/70">
          Falta configurar a senha: crie a variável <code className="text-white">{ENV_SENHA}</code> na Vercel e
          publique de novo.
        </p>
      </div>
    );
  } else if (!(await temAcesso())) {
    conteudo = <LoginAdmin />;
  } else {
    const { cadastros, erro } = await carregar();
    conteudo = <Dashboard cadastros={cadastros} erro={erro} />;
  }

  return (
    <main className={`${altone.variable} min-h-screen bg-black text-white`}>
      <style>{"html,body{background:#000}"}</style>
      {conteudo}
    </main>
  );
}
