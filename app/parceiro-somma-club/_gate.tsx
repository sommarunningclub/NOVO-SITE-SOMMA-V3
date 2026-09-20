"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Tela de acesso do parceiro.
 *
 * Diferente dos decks, o código não é numérico de tamanho fixo: cada parceiro
 * tem uma palavra própria na tabela `codigo_parceiro`. Por isso um campo de
 * texto, e não as casinhas de dígito.
 */
export function Gate() {
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const enviar = useCallback(async () => {
    const valor = codigo.trim();
    if (!valor || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch("/api/parceiro-somma-club/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: valor }),
      });
      if (r.ok) {
        window.location.reload();
        return;
      }
      if (r.status === 429) {
        setErro("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        setErro("Código inválido. Confira com o time do SOMMA Club.");
      }
      setCodigo("");
      input.current?.focus();
    } catch {
      setErro("Não deu para verificar agora. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }, [codigo, enviando]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-5 py-16 text-white">
      <div className="relative z-10 w-full max-w-md text-center">
        <Image
          src="/logo-somma.svg"
          alt="SOMMA Club"
          width={140}
          height={38}
          className="mx-auto h-8 w-auto"
          priority
        />

        <p className="mt-10 font-display text-[11px] font-semibold uppercase tracking-[0.4em] text-primary">
          Acesso exclusivo
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl">
          Parceiro
          <br />
          SOMMA Club
        </h1>
        <p className="mt-6 text-sm font-light text-white/60">
          Informe o seu código de acesso para acompanhar as inscrições do check-in aberto.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void enviar();
          }}
          className="mt-10"
        >
          <label htmlFor="codigo" className="sr-only">
            Código de acesso do parceiro
          </label>
          <input
            ref={input}
            id="codigo"
            name="codigo"
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value);
              setErro(null);
            }}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={Boolean(erro)}
            aria-describedby={erro ? "codigo-erro" : undefined}
            disabled={enviando}
            placeholder="Código"
            className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-4 text-center font-display text-xl font-semibold uppercase tracking-[0.2em] text-white placeholder:tracking-normal placeholder:text-white/25 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />

          <p
            id="codigo-erro"
            role="status"
            aria-live="polite"
            className="mt-4 min-h-5 text-sm text-primary"
          >
            {erro}
          </p>

          <button
            type="submit"
            disabled={!codigo.trim() || enviando}
            className="mt-2 w-full rounded-xl bg-primary py-4 font-display text-sm font-semibold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {enviando ? "Verificando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-10 text-[11px] text-white/25">Somma Club · Brasília, DF</p>
      </div>
    </main>
  );
}
