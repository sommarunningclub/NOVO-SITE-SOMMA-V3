"use client";

import { useState } from "react";
import { API_CORRE, MENSAGENS } from "@/lib/vem-correr-comigo/regras";
import { mascararCpf, soDigitos } from "@/lib/dexcomplica-love-run/schema";
import { rastrearCorre } from "@/lib/vem-correr-comigo/analytics";

/** Entrada pelo CPF da inscrição. */
export default function Acesso({ onEntrou, compartilhado }: { onEntrou: () => void; compartilhado: boolean }) {
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    if (soDigitos(cpf).length !== 11) return setErro("Digite os 11 números do CPF.");
    setErro("");
    setEnviando(true);
    rastrearCorre("access_started");
    try {
      const res = await fetch(`${API_CORRE}/acesso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf }),
      });
      const j = await res.json();
      if (!j.ok) return setErro(j.error ?? MENSAGENS.rede);
      rastrearCorre("access_verified");
      onEntrou();
    } catch {
      setErro(MENSAGENS.rede);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="cr-acesso">
      <p className="lr-eyebrow lr-eyebrow--claro">Exclusivo para inscritos</p>
      <h1 className="cr-titulo">Bora descomplicar seu corre?</h1>
      <form className="cr-form" onSubmit={entrar} noValidate>
        <p className="cr-lead">
          {compartilhado
            ? "Alguém te chamou para o corre. Entre com seu CPF para ver."
            : "Entre com seu CPF e descubra quem vai correr com você."}
        </p>
        <label className="cr-campo">
          <span>Digite seu CPF</span>
          <input
            className="cr-input"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            maxLength={14}
            value={cpf}
            onChange={(e) => { setCpf(mascararCpf(e.target.value)); if (erro) setErro(""); }}
          />
        </label>
        {erro ? <p className="cr-erro" role="alert">{erro}</p> : null}
        <button className="lr-btn lr-btn--vermelho lr-btn--bloco" disabled={enviando}>
          {enviando ? "Conferindo…" : "Entrar no meu corre"}
        </button>
      </form>
    </section>
  );
}
