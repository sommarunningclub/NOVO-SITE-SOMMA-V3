"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EVENT } from "@/lib/desafio-esteiras/event.config";

interface UnidadeResumo {
  id: string;
  nome: string;
  curto: string;
  cidade: string;
  uf: string;
}

/**
 * Login da página de uma unidade.
 *
 * Diferente do login geral: a unidade já está definida pela URL e aparece na
 * tela, então quem abre o link sabe de cara que chegou no lugar certo. A
 * senha aqui só autentica.
 */
export function LoginUnidade({
  unidade,
  configurado,
  envSugerida,
}: {
  unidade: UnidadeResumo;
  configurado: boolean;
  envSugerida: string;
}) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setErro(null);
    setEnviando(true);

    try {
      const res = await fetch("/api/desafio-esteiras/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha, unidade: unidade.id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível entrar.");
        setEnviando(false);
        return;
      }
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
      setEnviando(false);
    }
  }

  return (
    <main className="dst-wrap flex min-h-[100svh] items-center justify-center py-12">
      <div className="w-full max-w-[420px]">
        <p className="dst-label mb-5 text-[color:var(--somma)]">Operação da unidade</p>

        <h1 className="dst-display text-[clamp(2rem,8vw,3rem)]">
          EVOLVE
          <br />
          {unidade.curto.toUpperCase()}
        </h1>

        <p className="dst-label mt-4 text-[color:rgba(242,240,236,0.45)]">
          {unidade.cidade}/{unidade.uf} · Desafio das Esteiras
        </p>
        <p className="dst-label mt-1.5 text-[color:rgba(242,240,236,0.45)]">
          {EVENT.dataExtenso} · {EVENT.horaExtenso}
        </p>

        {!configurado ? (
          <div className="mt-9 border border-[color:var(--evolve)] bg-[rgba(224,38,27,0.1)] p-5">
            <p className="dst-label mb-2 text-[color:var(--evolve)]">Acesso não configurado</p>
            <p className="text-[0.9rem] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
              Defina <code className="dst-mono">DESAFIO_ESTEIRAS_UNIDADE_PASSWORD</code> nas
              variáveis de ambiente para liberar as quatro unidades, ou{" "}
              <code className="dst-mono">{envSugerida}</code> para dar a esta unidade uma senha
              própria.
            </p>
          </div>
        ) : (
          <form onSubmit={entrar} className="mt-9">
            <div className="dst-field-wrap">
              <input
                id="senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder=" "
                className="dst-field"
                required
                autoFocus
              />
              <label htmlFor="senha" className="dst-field-label">
                Senha da unidade
              </label>
            </div>

            {erro && (
              <p role="alert" className="dst-label mt-3 text-[color:var(--evolve)]">
                {erro}
              </p>
            )}

            <button type="submit" disabled={enviando} className="dst-btn mt-7 w-full disabled:opacity-60">
              {enviando ? "Entrando…" : "Entrar"}
            </button>
          </form>
        )}

        <p className="dst-label mt-8 leading-relaxed text-[color:rgba(242,240,236,0.3)]">
          Este acesso mostra as inscrições da {unidade.curto} e valida ticket na entrada. Alterar
          cadastro é com a organização.
        </p>
      </div>
    </main>
  );
}
