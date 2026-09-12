"use client";

import { useState } from "react";
import { MAPS_URL } from "@/lib/somma-day/event.config";
import { evento as rastrear } from "@/lib/somma-day/analytics";

/** 07h–13h de Brasília em UTC, no formato do Google Calendar. */
const CALENDARIO_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" + encodeURIComponent("SOMMA DAY — Edição Especial SET") +
  "&dates=20260926T100000Z/20260926T160000Z" +
  "&location=" + encodeURIComponent("Estacionamento 9, Parque da Cidade, Brasília - DF") +
  "&details=" + encodeURIComponent("A corrida é só o começo. Leve seu código: o check-in libera a pulseira.");

/**
 * O que dá para fazer com o ticket.
 *
 * "Imprimir" é o mesmo caminho do "salvar em PDF" em todo navegador moderno —
 * daí o rótulo dizer as duas coisas. O CSS de impressão esconde a página
 * inteira e deixa só o bilhete, então o papel (ou o PDF) sai com o QR, o código
 * e o essencial, sem menu nem cronograma.
 */
export default function AcoesTicket() {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = window.location.href;
    const texto = "Tô dentro do SOMMA DAY, 26.09, Parque da Cidade.";
    rastrear("compartilhou");
    if (navigator.share) {
      try {
        await navigator.share({ title: "SOMMA DAY", text: texto, url });
        return;
      } catch {
        /* menu nativo cancelado — cai para a cópia */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* sem permissão de área de transferência: o link já está na barra do navegador */
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => {
          rastrear("ticket_impresso");
          window.print();
        }}
        className="sd-botao bg-[var(--sd-tinta)] px-6 py-4 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--sd-creme)]"
      >
        Salvar ou imprimir
      </button>

      <a
        href={CALENDARIO_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => rastrear("calendario_adicionado")}
        className="sd-botao bg-white px-6 py-4 text-[12px] font-extrabold uppercase tracking-[0.14em]"
      >
        Agenda
      </a>

      <a
        href={MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => rastrear("mapa_aberto")}
        className="sd-botao bg-white px-6 py-4 text-[12px] font-extrabold uppercase tracking-[0.14em]"
      >
        Como chegar
      </a>

      <button
        type="button"
        onClick={compartilhar}
        className="sd-botao bg-white px-6 py-4 text-[12px] font-extrabold uppercase tracking-[0.14em]"
      >
        {copiado ? "Link copiado" : "Compartilhar"}
      </button>
    </div>
  );
}
