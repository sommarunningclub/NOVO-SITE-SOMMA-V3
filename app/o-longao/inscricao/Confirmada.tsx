"use client";

import Link from "next/link";
import { useState } from "react";
import { EVENT_PATH, EVENT_URL } from "@/lib/o-longao/config";
import { CONFIRMACAO } from "@/lib/o-longao/copy";
import { track } from "@/lib/o-longao/analytics";
import { ROTULO_CATEGORIA } from "./tipos";
import type { Categoria } from "@/lib/o-longao/config";

/**
 * Etapa 6: a inscrição entrou.
 *
 * O código é o que a crew precisa guardar, então ele é a maior coisa da tela,
 * em dígitos de cronômetro. O `crew_token` nunca aparece aqui: ele é o segredo
 * que autoriza ações da crew, e tela é lugar de print e de foto.
 */
export function Confirmada({
  crew,
  codigo,
  categorias,
}: {
  crew: string;
  codigo: string;
  categorias: Categoria[];
}) {
  const [copiado, setCopiado] = useState(false);

  const compartilhar = async () => {
    const texto = `Nossa crew está no O LONGÃO, o único que dura 24 horas. ${EVENT_URL}`;
    track("share_registration");
    try {
      if (navigator.share) {
        await navigator.share({ title: "O Longão", text: texto, url: EVENT_URL });
        return;
      }
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2400);
    } catch {
      // cancelar o compartilhamento não é erro
    }
  };

  return (
    <div className="py-6 text-center md:py-10">
      <p className="lgo-label text-[color:var(--sinal)]">INSCRIÇÃO RECEBIDA</p>

      <h1 className="lgo-display mt-4 text-[clamp(2rem,9vw,4.5rem)] leading-[0.9]">
        {CONFIRMACAO.titulo}
      </h1>
      <p className="lgo-display lgo-display-condensed mt-2 text-[clamp(1rem,4vw,1.6rem)] text-[color:rgba(242,240,236,0.6)]">
        {CONFIRMACAO.subtitulo}
      </p>

      <div className="lgo-panel mx-auto mt-8 max-w-md p-5 text-left">
        <dl>
          <div className="border-b border-[color:var(--line)] pb-3">
            <dt className="lgo-label text-[color:rgba(242,240,236,0.45)]">CREW</dt>
            <dd className="lgo-display lgo-display-condensed mt-1 text-xl">{crew}</dd>
          </div>
          <div className="border-b border-[color:var(--line)] py-3">
            <dt className="lgo-label text-[color:rgba(242,240,236,0.45)]">CATEGORIA</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {categorias.map((c) => (
                <span
                  key={c}
                  className="lgo-label border border-[color:var(--line)] px-2 py-1 text-[color:var(--papel)]"
                >
                  {ROTULO_CATEGORIA[c].replace("EQUIPE ", "")}
                </span>
              ))}
            </dd>
          </div>
          <div className="pt-3">
            <dt className="lgo-label text-[color:rgba(242,240,236,0.45)]">CÓDIGO DA INSCRIÇÃO</dt>
            <dd className="lgo-clock mt-1 text-[clamp(1.75rem,8vw,2.5rem)] text-[color:var(--sinal)]">
              {codigo}
            </dd>
          </div>
        </dl>
      </div>

      <ol className="mx-auto mt-8 max-w-md text-left">
        <p className="lgo-label mb-3 text-[color:rgba(242,240,236,0.45)]">PRÓXIMOS PASSOS</p>
        {CONFIRMACAO.proximosPassos.map((passo, i) => (
          <li
            key={passo}
            className="flex gap-3 border-b border-[color:var(--line)] py-3 text-sm text-[color:rgba(242,240,236,0.8)]"
          >
            <span className="lgo-num shrink-0 text-[color:var(--sinal)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            {passo}
          </li>
        ))}
      </ol>

      <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
        <button type="button" onClick={compartilhar} className="lgo-btn">
          {copiado ? "LINK COPIADO" : CONFIRMACAO.compartilhar}
        </button>
        <Link href={EVENT_PATH} className="lgo-btn lgo-btn--ghost">
          VOLTAR PARA O LONGÃO
        </Link>
      </div>
    </div>
  );
}
