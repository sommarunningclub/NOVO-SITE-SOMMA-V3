import type { Metadata } from "next";
import Link from "next/link";
import { lerSessao } from "@/lib/evp/auth";
import { CAMINHO } from "@/lib/evp/config";
import { BotaoSair, LoginEquipe } from "./_components/LoginEquipe";
import { Painel } from "./_components/Painel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel | Meeting Técnico",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const sessao = await lerSessao();
  if (!sessao) return <LoginEquipe destino="admin" />;
  if (sessao.papel !== "admin") {
    return (
      <main className="mt-container flex min-h-dvh flex-col items-start justify-center gap-6 py-16">
        <p className="mt-rotulo">Meeting Técnico · Painel</p>
        <h1 className="mt-titulo" style={{ fontSize: "clamp(1.8rem, 6vw, 3rem)" }}>
          Sua conta não tem acesso ao painel
        </h1>
        <p className="mt-texto max-w-xl">
          {sessao.nome}, a sua conta é de operador. Ela faz o credenciamento no dia do encontro, mas não abre os dados
          do painel.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={`${CAMINHO}/credenciamento`} className="mt-botao mt-botao--cheio">
            Ir para o credenciamento
          </Link>
          <BotaoSair />
        </div>
      </main>
    );
  }
  return <Painel sessao={sessao} />;
}
