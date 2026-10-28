"use client";

import { useEffect, useId, useRef, useState } from "react";
import { mascararTelefone } from "@/lib/dexcomplica-love-run/schema";
import { rastrear } from "@/lib/dexcomplica-love-run/analytics";
import { IconeWhatsapp } from "./GrupoWhatsapp";

/**
 * Para quem se inscreveu antes de o formulário pedir WhatsApp (28/10/2026):
 * um cartão no ingresso para completar o número. Só aparece se a inscrição
 * está sem telefone; o link do e-mail traz #whatsapp e rola até aqui.
 */
export default function CompletarWhatsapp({ token }: { token: string }) {
  const id = useId();
  const caixa = useRef<HTMLFormElement>(null);
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [estado, setEstado] = useState<"aberto" | "enviando" | "salvo">("aberto");

  useEffect(() => {
    if (window.location.hash === "#whatsapp") {
      window.setTimeout(() => caixa.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 900);
    }
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (estado !== "aberto") return;
    setEstado("enviando");
    setErro("");
    try {
      const res = await fetch("/api/dexcomplica-love-run/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, telefone }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setEstado("salvo");
        rastrear("whatsapp_completado");
        return;
      }
      setErro(json.campos?.telefone ?? json.error ?? "Não conseguimos salvar. Tente de novo.");
    } catch {
      setErro("Sem conexão. Tente de novo.");
    }
    setEstado("aberto");
  };

  if (estado === "salvo") {
    return (
      <p className="lr-completar lr-completar--ok" role="status">
        <IconeWhatsapp className="lr-btn__icone" /> WhatsApp salvo. Obrigado!
      </p>
    );
  }

  return (
    <form ref={caixa} id="whatsapp" className="lr-completar" onSubmit={salvar} noValidate>
      <p className="lr-completar__titulo">Falta seu WhatsApp</p>
      <p className="lr-completar__texto">Sua inscrição está confirmada. Só completa o número para a organização falar com você.</p>
      <label htmlFor={`${id}-tel`} className="sr-only">WhatsApp com DDD</label>
      <div className="lr-completar__linha">
        <input
          id={`${id}-tel`}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(61) 99999-9999"
          maxLength={15}
          value={telefone}
          onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${id}-erro` : undefined}
          required
        />
        <button type="submit" className="lr-btn lr-btn--whatsapp" disabled={estado === "enviando"}>
          {estado === "enviando" ? "Salvando…" : "Salvar"}
        </button>
      </div>
      {erro ? <p id={`${id}-erro`} className="lr-completar__erro" role="alert">{erro}</p> : null}
    </form>
  );
}
