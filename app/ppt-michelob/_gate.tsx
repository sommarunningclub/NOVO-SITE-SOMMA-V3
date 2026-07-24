"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const IMG = "/michelob";
const RED = "#D22030";
const GOLD = "#C6A664";
const DIGITOS = 6;

/**
 * Tela de acesso da apresentação.
 *
 * O campo é uma linha de seis caixas, mas por baixo existe um único input
 * numérico: assim o teclado do celular abre no modo numérico, colar o código
 * funciona e a navegação por teclado continua sendo a nativa.
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
        const r = await fetch("/api/ppt-michelob/auth", {
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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#060B1C] px-5 py-16 text-white">
      <Image
        src={`${IMG}/m-capa.jpg`}
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover object-center md:hidden"
      />
      <Image
        src={`${IMG}/capa.jpg`}
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="hidden object-cover object-center md:block"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#060B1C]/80 via-[#060B1C]/85 to-[#060B1C]" aria-hidden />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* logo da campanha */}
        <div className="flex items-center justify-center gap-5 md:gap-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${IMG}/logo-somma-white.png`} alt="Somma Club" className="h-6 w-auto md:h-7" />
          <span className="text-lg font-extralight md:text-xl" style={{ color: GOLD }} aria-hidden>
            ×
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${IMG}/logo-michelob-white.png`} alt="Michelob Ultra" className="h-7 w-auto md:h-8" />
        </div>

        <div className="mx-auto mt-8 h-px w-16" style={{ backgroundColor: GOLD, opacity: 0.6 }} aria-hidden />

        <p className="mt-7 font-display text-[11px] font-semibold uppercase tracking-[0.4em]" style={{ color: GOLD }}>
          Proposta de campanha · 2026
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.9] tracking-tight sm:text-5xl md:text-6xl">
          Michelob Ultra
          <br />
          <span style={{ color: RED }}>Social Run</span>
        </h1>
        <p className="mt-6 text-sm font-light text-white/60">
          Material confidencial. Informe o código de acesso para abrir a apresentação.
        </p>

        {/* campo numérico */}
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
                      borderColor: erro ? RED : d ? `${GOLD}99` : focado ? `${GOLD}66` : "rgba(255,255,255,0.15)",
                      backgroundColor: erro ? `${RED}14` : "rgba(255,255,255,0.04)",
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
            style={{ color: erro ? RED : "transparent" }}
          >
            {erro ? "Código incorreto. Tente de novo." : "."}
          </p>

          <button
            type="submit"
            disabled={codigo.length !== DIGITOS || enviando}
            className="mt-2 w-full rounded-xl py-4 font-display text-sm font-semibold uppercase tracking-[0.15em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            style={{ backgroundColor: RED }}
          >
            {enviando ? "Verificando..." : "Abrir apresentação"}
          </button>
        </form>

        <p className="mt-10 text-[11px] text-white/25">
          Consumo responsável. Material destinado ao público maior de 18 anos.
        </p>
      </div>
    </main>
  );
}
