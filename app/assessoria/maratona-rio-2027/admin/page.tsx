import type { Metadata, Viewport } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import { altone } from "@/components/bora/fonte";
import { getServiceSupabase } from "@/lib/supabase";
import { ENV_SENHA, acessoConfigurado, temAcesso } from "@/lib/maratona-rio-2027/auth";
import { lerConfig } from "@/lib/maratona-rio-2027/config";
import { BUCKET_COMPROVANTES } from "@/lib/maratona-rio-2027/inscricao";
import { PROFESSORES_BORA } from "@/lib/nova-assessoria/professores";
import { LoginAdmin } from "./_components/LoginAdmin";
import { Dashboard, type Cadastro } from "./_components/Dashboard";
import { AbasAdmin, type Aba } from "./_components/AbasAdmin";
import { GestaoInscricoes, type Comprovante, type Inscricao } from "./_components/GestaoInscricoes";

/**
 * Painel da Maratona do Rio 2027, com duas abas: cadastros de intenção e
 * gestão das inscrições da Meia (vagas, Pix, comprovantes). Senha em
 * MARATONA_RIO_ADMIN_SENHA (ver lib/maratona-rio-2027/auth). Os dados vêm do
 * servidor já com a sessão conferida; filtros, cópia e CSV rodam no navegador.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel · Maratona do Rio 2027",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

async function carregarIntencoes(supabase: SupabaseClient): Promise<{ cadastros: Cadastro[]; erro?: string }> {
  const { data, error } = await supabase
    .from("maratona_rio_2027_intencoes")
    .select("id, criado_em, atualizado_em, nome, telefone, email, cpf, sexo, prova")
    .order("criado_em", { ascending: false })
    .limit(5000);
  if (error) return { cadastros: [], erro: error.message };
  return { cadastros: (data ?? []) as Cadastro[] };
}

async function carregarInscricoes(
  supabase: SupabaseClient
): Promise<{ inscricoes: Inscricao[]; comprovantes: Record<number, Comprovante>; erro?: string }> {
  const { data, error } = await supabase
    .from("maratona_rio_2027_inscricoes")
    .select(
      "id, criado_em, nome, email, telefone, cpf, data_nascimento, sexo, treinador, treinador_outro, estrutura_apoio, valor_total, status, pago_em, comprovante_path, comprovante_enviado_em, observacao"
    )
    .order("criado_em", { ascending: true })
    .limit(2000);
  if (error) return { inscricoes: [], comprovantes: {}, erro: error.message };
  const inscricoes = (data ?? []) as (Inscricao & { comprovante_path: string | null })[];

  // Bucket privado: cada comprovante abre por link assinado que vale 1 hora.
  const comprovantes: Record<number, Comprovante> = {};
  const comArquivo = inscricoes.filter((i) => i.comprovante_path);
  if (comArquivo.length) {
    const { data: links, error: erroLinks } = await supabase.storage
      .from(BUCKET_COMPROVANTES)
      .createSignedUrls(comArquivo.map((i) => i.comprovante_path!), 60 * 60);
    if (erroLinks) console.error("[maratona-rio-2027] Falha nos links dos comprovantes:", erroLinks.message);
    links?.forEach((l, n) => {
      const caminho = comArquivo[n].comprovante_path!;
      if (l.signedUrl) {
        comprovantes[comArquivo[n].id] = { url: l.signedUrl, tipo: caminho.endsWith(".pdf") ? "pdf" : "imagem" };
      }
    });
  }
  return { inscricoes, comprovantes };
}

export default async function AdminMaratonaRioPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  let conteudo: React.ReactNode;
  const supabase = getServiceSupabase();

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
  } else if (!supabase) {
    conteudo = (
      <p className="mx-auto max-w-md px-4 py-24 text-center text-red-300">
        Banco indisponível (SUPABASE_SERVICE_ROLE_KEY ausente).
      </p>
    );
  } else {
    const [{ aba }, intencao, inscricao, config] = await Promise.all([
      searchParams,
      carregarIntencoes(supabase),
      carregarInscricoes(supabase),
      lerConfig(supabase),
    ]);
    const treinadores = Object.fromEntries(PROFESSORES_BORA.map((p) => [p.slug, p.nome]));
    const conferir = inscricao.inscricoes.filter(
      (i) => i.status === "aguardando_pagamento" && i.comprovante_enviado_em
    ).length;
    conteudo = (
      <AbasAdmin
        abaInicial={(aba === "inscricoes" ? "inscricoes" : "intencao") satisfies Aba}
        totais={{
          intencao: intencao.cadastros.length,
          inscricoes: inscricao.inscricoes.filter((i) => i.status !== "cancelado").length,
          conferir,
        }}
        intencao={<Dashboard cadastros={intencao.cadastros} erro={intencao.erro} />}
        inscricoes={
          <GestaoInscricoes
            inscricoes={inscricao.inscricoes}
            comprovantes={inscricao.comprovantes}
            treinadores={treinadores}
            config={config}
            erro={inscricao.erro}
          />
        }
      />
    );
  }

  return (
    <main className={`${altone.variable} min-h-screen bg-black text-white`}>
      <style>{"html,body{background:#000}"}</style>
      {conteudo}
    </main>
  );
}
