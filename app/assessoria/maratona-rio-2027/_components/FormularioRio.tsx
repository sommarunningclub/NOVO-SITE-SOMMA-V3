"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { PROVAS_RIO, SEXOS, type ProvaRio, type Sexo } from "@/lib/maratona-rio-2027/provas";
import { isValidCpf, maskCpf, maskPhone } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Estado =
  | { fase: "preenchendo"; erro?: string }
  | { fase: "enviando" }
  | { fase: "pronto"; atualizado: boolean };

const campo =
  "mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white outline-none placeholder:text-white/30 focus:border-bora";

function Rotulo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-white/80">
      {titulo}
      {children}
    </label>
  );
}

export function FormularioRio() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [sexo, setSexo] = useState<Sexo | null>(null);
  const [prova, setProva] = useState<ProvaRio["id"] | null>(null);
  const [empresa, setEmpresa] = useState("");
  const [estado, setEstado] = useState<Estado>({ fase: "preenchendo" });

  function mexeu<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      if (estado.fase === "preenchendo" && estado.erro) setEstado({ fase: "preenchendo" });
    };
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const falha = (erro: string) => setEstado({ fase: "preenchendo", erro });
    if (nome.trim().split(/\s+/).length < 2) return falha("Digite seu nome completo.");
    if (telefone.replace(/\D/g, "").length < 10) return falha("Digite seu telefone com DDD.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return falha("Digite um e-mail válido.");
    if (!isValidCpf(cpf)) return falha("CPF inválido. Confira os números.");
    if (!sexo) return falha("Selecione o sexo.");
    if (!prova) return falha("Escolha a distância que você vai correr.");

    setEstado({ fase: "enviando" });
    try {
      const res = await fetch("/api/maratona-rio-2027/intencao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, email, cpf, sexo, prova, empresa }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) return falha(data.error || "Não deu certo. Tente de novo.");
      setEstado({ fase: "pronto", atualizado: Boolean(data.atualizado) });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      falha("Sem conexão. Tente de novo.");
    }
  }

  if (estado.fase === "pronto") {
    const escolhida = PROVAS_RIO.find((p) => p.id === prova);
    return (
      <div className="rounded-3xl border border-bora/40 bg-bora/[0.06] px-6 py-10 text-center sm:px-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-bora text-black">
          <Check className="h-7 w-7" strokeWidth={3} />
        </span>
        <p className="mt-6 font-bora text-sm font-bold uppercase tracking-widest text-bora">
          {estado.atualizado ? "Cadastro atualizado" : "Cadastro feito"}
        </p>
        <h2 className="mt-2 font-bora text-4xl font-black uppercase italic leading-none">Nos vemos no Rio!</h2>
        {escolhida && (
          <p className="mt-5 text-white/75">
            Você marcou <strong className="text-white">{escolhida.nome}</strong>
            {escolhida.nome !== escolhida.distancia && ` (${escolhida.distancia})`}.
          </p>
        )}
        <p className="mt-3 text-sm text-white/50">
          Mudou de ideia? Envie de novo com o mesmo CPF que a gente atualiza.
        </p>
        <button
          type="button"
          onClick={() => setEstado({ fase: "preenchendo" })}
          className="mt-6 text-sm font-medium text-bora underline underline-offset-4 hover:text-white"
        >
          Voltar ao formulário
        </button>
      </div>
    );
  }

  const erro = estado.fase === "preenchendo" ? estado.erro : undefined;

  return (
    <form onSubmit={enviar} noValidate className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Seus dados</legend>
        <Rotulo titulo="Nome completo">
          <input
            value={nome}
            onChange={(e) => mexeu(setNome)(e.target.value)}
            autoComplete="name"
            maxLength={120}
            className={campo}
            placeholder="Como está no seu documento"
          />
        </Rotulo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Rotulo titulo="Telefone (WhatsApp)">
            <input
              value={telefone}
              onChange={(e) => mexeu(setTelefone)(maskPhone(e.target.value))}
              autoComplete="tel-national"
              inputMode="tel"
              className={campo}
              placeholder="(61) 99999-9999"
            />
          </Rotulo>
          <Rotulo titulo="CPF">
            <input
              value={cpf}
              onChange={(e) => mexeu(setCpf)(maskCpf(e.target.value))}
              inputMode="numeric"
              autoComplete="off"
              className={campo}
              placeholder="000.000.000-00"
            />
          </Rotulo>
        </div>
        <Rotulo titulo="E-mail">
          <input
            value={email}
            onChange={(e) => mexeu(setEmail)(e.target.value)}
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={200}
            className={campo}
            placeholder="voce@email.com"
          />
        </Rotulo>
        <div>
          <p className="text-sm font-medium text-white/80">Sexo</p>
          <div className="mt-2 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Sexo">
            {SEXOS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={sexo === s.id}
                onClick={() => mexeu(setSexo)(s.id)}
                className={cn(
                  "rounded-xl border px-4 py-3.5 text-base font-medium transition-colors",
                  sexo === s.id
                    ? "border-bora bg-bora text-black"
                    : "border-white/15 bg-white/5 text-white hover:border-white/40"
                )}
              >
                {s.nome}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">
          Quanto você vai correr?
        </legend>
        <div className="mt-4 grid gap-3" role="radiogroup" aria-label="Distância">
          {PROVAS_RIO.map((p) => {
            const marcada = prova === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={marcada}
                onClick={() => mexeu(setProva)(p.id)}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-colors",
                  marcada ? "border-bora bg-bora text-black" : "border-white/15 bg-white/[0.03] hover:border-white/40"
                )}
              >
                <span>
                  <span className="block font-bora text-xl font-black uppercase italic leading-tight">{p.nome}</span>
                  {p.detalhe && (
                    <span className={cn("mt-1 block text-sm", marcada ? "text-black/70" : "text-white/55")}>
                      {p.detalhe}
                    </span>
                  )}
                </span>
                {/* 5 km e 10 km já têm a distância no nome. */}
                {p.nome !== p.distancia && (
                  <span
                    className={cn(
                      "shrink-0 font-bora text-2xl font-black italic",
                      marcada ? "text-black" : "text-bora"
                    )}
                  >
                    {p.distancia}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Isca para robô: fora da tela e fora do tab. */}
      <input
        value={empresa}
        onChange={(e) => setEmpresa(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div>
        {erro && (
          <p role="alert" className="mb-4 text-sm text-red-400">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={estado.fase === "enviando"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-bora px-6 py-4 font-bora text-base font-bold uppercase text-black transition-colors hover:bg-white disabled:opacity-60"
        >
          {estado.fase === "enviando" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Confirmar minha intenção <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
        <p className="mt-4 text-center text-xs text-white/40">
          Usamos seus dados só para organizar a ida da assessoria ao Rio.{" "}
          <a href="/politica-de-privacidade" className="underline hover:text-white/70">
            Política de privacidade
          </a>
        </p>
      </div>
    </form>
  );
}
