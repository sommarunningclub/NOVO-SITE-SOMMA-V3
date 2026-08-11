"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Lockup } from "./_marca";

const ORANGE = "#FF2C04";
const SUN = "#FFB020";
const DIGITOS = 6;

/**
 * Tela de acesso da proposta Silver Care.
 *
 * Mesma mecânica dos outros decks comerciais: 6 dígitos, verificação no
 * servidor e cookie assinado próprio desta rota.
 */
export function Gate() {
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const enviar = useCallback(
    async (valor: string) => {
      if (valor.length !== DIGITOS || enviando) return;
      setEnviando(true);
      setErro(false);
      try {
        const r = await fetch("/api/ppt-silver-care/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo: valor }),
        });
        if (r.ok) {
          window.location.reload();
          return;
        }
        setErro(true);
        setCodigo("");
        input.current?.focus();
      } catch {
        setErro(true);
      } finally {
        setEnviando(false);
      }
    },
    [enviando],
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, DIGITOS);
    setCodigo(v);
    setErro(false);
    if (v.length === DIGITOS) void enviar(v);
  };

  const cells = Array.from({ length: DIGITOS }, (_, i) => codigo[i] ?? "");
  const ativo = Math.min(codigo.length, DIGITOS - 1);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0A0A] px-5 py-16 text-white">
      <Image
        src="/midiakit/ativacao.jpg"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/85 via-[#0A0A0A]/88 to-[#0A0A0A]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md text-center">
        <Lockup className="justify-center" size="md" />

        <div className="mx-auto mt-8 h-px w-16" style={{ backgroundColor: SUN, opacity: 0.7 }} aria-hidden />

        <p
          className="mt-7 font-display text-[11px] font-semibold uppercase tracking-[0.4em]"
          style={{ color: SUN }}
        >
          Proposta de parceria · 2026
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.88] tracking-tight sm:text-5xl">
          Viver lá fora
          <br />
          faz bem.
          <br />
          <span style={{ color: ORANGE }}>Se proteger também.</span>
        </h1>
        <p className="mt-6 text-sm font-light text-white/60">
          Material confidencial. Informe o código de acesso para abrir a apresentação.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void enviar(codigo);
          }}
          className="mt-10"
        >
          <label htmlFor="codigo" className="sr-only">
            Código de acesso de {DIGITOS} dígitos
          </label>
          <div className="relative">
            <input
              ref={input}
              id="codigo"
              name="codigo"
              value={codigo}
              onChange={onChange}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={DIGITOS}
              aria-invalid={erro}
              aria-describedby={erro ? "codigo-erro" : undefined}
              disabled={enviando}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            />
            <div className="pointer-events-none flex justify-center gap-2 sm:gap-3">
              {cells.map((d, i) => {
                const focado = codigo.length < DIGITOS && i === ativo;
                return (
                  <span
                    key={i}
                    className="flex h-14 w-11 items-center justify-center rounded-xl border font-display text-2xl font-bold tabular-nums transition-colors sm:h-16 sm:w-12 sm:text-3xl"
                    style={{
                      borderColor: erro
                        ? ORANGE
                        : d
                          ? `${SUN}99`
                          : focado
                            ? `${SUN}66`
                            : "rgba(255,255,255,0.15)",
                      backgroundColor: erro ? `${ORANGE}14` : "rgba(255,255,255,0.04)",
                      color: "#fff",
                    }}
                  >
                    {d || (focado ? <span className="h-5 w-px animate-pulse bg-white/50" /> : "")}
                  </span>
                );
              })}
            </div>
          </div>

          <p
            id="codigo-erro"
            role="status"
            aria-live="polite"
            className="mt-4 h-5 text-sm"
            style={{ color: erro ? ORANGE : "transparent" }}
          >
            {erro ? "Código incorreto. Tente de novo." : "."}
          </p>

          <button
            type="submit"
            disabled={codigo.length !== DIGITOS || enviando}
            className="mt-2 w-full rounded-xl py-4 font-display text-sm font-semibold uppercase tracking-[0.15em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            style={{ backgroundColor: ORANGE }}
          >
            {enviando ? "Verificando..." : "Abrir apresentação"}
          </button>
        </form>

        <p className="mt-10 text-[11px] text-white/25">
          Somma Club · Brasília, DF · 2026
        </p>
      </div>
    </main>
  );
}
