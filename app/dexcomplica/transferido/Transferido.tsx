"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EVENTO_NOME, EVENTO_PATH } from "@/lib/dexcomplica-love-run/event.config";
import { rastrear } from "@/lib/dexcomplica-love-run/analytics";
import { lerTransferencia } from "../_components/meuIngresso";
import Interacoes from "../_components/Interacoes";
import type { ReciboTransferencia } from "@/lib/dexcomplica-love-run/transferencia";

export default function Transferido() {
  const [recibo, setRecibo] = useState<ReciboTransferencia | null>(null);

  useEffect(() => {
    const d = lerTransferencia();
    setRecibo(d);
    rastrear("transferencia_pagina", { agora: d?.agora === true });
  }, []);

  const agora = recibo?.agora === true;
  const depois = Boolean(recibo) && !agora;
  const nome = recibo?.nome?.trim() ?? "";
  const email = recibo?.email?.trim() ?? "";

  return (
    <main className="lr-ing lr-ing--transferido">
      <Interacoes />
      <div className="lr-ing__topo">
        <p className="lr-eyebrow lr-eyebrow--claro">{agora ? "Transferência concluída" : EVENTO_NOME}</p>
        <h1 className="lr-h2 lr-h2--claro">
          {depois ? "Este ingresso já foi transferido." : "Ingresso transferido."}
        </h1>
        <p className="lr-lead lr-lead--claro">
          {depois
            ? "Você não possui mais ingresso para este evento. A vaga passou para outra pessoa e o QR que você tinha não vale mais."
            : "A vaga saiu da sua inscrição. Você não possui mais ingresso para o Dexcomplica Love Run."}
        </p>
      </div>

      <div className="lr-recibo">
        <div className="lr-recibo__icone" aria-hidden="true">
          <IconeTransferir />
        </div>
        {agora && (nome || email) ? (
          <p>
            {nome ? (
              <>
                A vaga agora é de <strong>{nome}</strong>.{" "}
              </>
            ) : null}
            {email ? (
              <>
                Enviamos o QR para <strong>{email}</strong>.
              </>
            ) : (
              "O novo titular recebe o ingresso no e-mail."
            )}
          </p>
        ) : nome ? (
          <p>
            A transferência foi feita. A vaga não está mais no seu CPF — passou para <strong>{nome}</strong>.
          </p>
        ) : (
          <p>Se você passou a vaga, ela não está mais no seu CPF. Quem corre é o novo titular, com o QR que chegou no e-mail dele.</p>
        )}
        <p>No check-in, só entra quem estiver com o QR válido. O seu deixou de funcionar.</p>
      </div>

      <section className="lr-ing__info" aria-label="O que isso significa">
        <h2>O que isso significa</h2>
        <ul>
          <li>
            <strong>Você não tem mais ingresso</strong> neste evento. A inscrição saiu do seu CPF.
          </li>
          <li>
            <strong>O QR antigo não vale.</strong> Link, print e código que você tinha deixam de abrir.
          </li>
          <li>
            <strong>O novo titular</strong> recebe o ingresso no e-mail e é quem apresenta o QR no sábado.
          </li>
        </ul>
        <Link href={EVENTO_PATH} className="lr-btn lr-btn--vermelho">
          Voltar para o evento
        </Link>
      </section>
    </main>
  );
}

function IconeTransferir() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3l4 4-4 4" />
      <path d="M20 7H8" />
      <path d="M8 21l-4-4 4-4" />
      <path d="M4 17h12" />
    </svg>
  );
}
