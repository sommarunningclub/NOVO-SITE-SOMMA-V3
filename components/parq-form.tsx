"use client";

import { useState } from "react";
import { Check, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { PARQ_QUESTIONS } from "@/lib/parq";

type Status = "idle" | "loading" | "done" | "error";

export function ParqForm({ cpf }: { cpf: string }) {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [observacoes, setObservacoes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [apto, setApto] = useState<boolean | null>(null);

  const algumSim = Object.values(answers).some((v) => v === true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (PARQ_QUESTIONS.some((q) => answers[q.id] === undefined)) {
      setError("Responda todas as perguntas.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/parq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, answers, observacoes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar.");
      setApto(data.apto ?? null);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Erro ao enviar.");
    }
  }

  if (status === "done") {
    return (
      <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/[0.06] p-6 text-center sm:p-8">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 text-xl font-semibold text-white">Questionário recebido!</h2>
        <p className="mt-2 text-sm text-white/60">
          {apto === false
            ? "Recomendamos uma liberação médica antes de iniciar os treinos. Nossa equipe vai te orientar."
            : "Tudo certo. Suas respostas foram salvas no seu cadastro."}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
    >
      <div className="mb-6">
        <h2 className="text-sm font-medium uppercase tracking-wider text-white">
          Questionário de saúde (Par-Q)
        </h2>
        <p className="mt-2 text-sm text-white/50">
          Antes de começar, responda para sua segurança. Leva menos de 1 minuto.
        </p>
      </div>

      <div className="space-y-5">
        {PARQ_QUESTIONS.map((q, i) => (
          <div key={q.id} className="border-b border-white/5 pb-5 last:border-0">
            <p className="text-sm leading-relaxed text-white/90">
              <span className="mr-1 font-semibold text-primary">{i + 1}.</span>
              {q.label}
            </p>
            <div className="mt-3 flex gap-3">
              {[
                { label: "Sim", value: true },
                { label: "Não", value: false },
              ].map((opt) => {
                const active = answers[q.id] === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setAnswers((p) => ({ ...p, [q.id]: opt.value }))}
                    className={
                      "rounded-full border px-5 py-1.5 text-sm font-medium transition-colors " +
                      (active
                        ? "border-primary bg-primary text-white"
                        : "border-white/20 text-white/70 hover:border-white/40")
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {algumSim && (
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2 text-sm text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            Conte um pouco mais (opcional)
          </div>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            placeholder="Detalhe as respostas marcadas como 'Sim' para ajudarmos melhor."
            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-primary"
          />
        </div>
      )}

      {error && <p className="mt-4 text-sm font-medium text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-70"
      >
        {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
        Enviar questionário
      </button>
    </form>
  );
}
