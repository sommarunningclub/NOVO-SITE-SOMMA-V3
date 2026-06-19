"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ContratoAssessoria } from "./contrato-assessoria";

export function ContratoCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <label htmlFor="aceite_contrato" className="flex items-start gap-3 text-sm text-white/80">
        <input
          id="aceite_contrato"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
        />
        <span>
          Declaro que li e aceito o{" "}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-semibold text-primary underline underline-offset-2 hover:text-primary-hover"
          >
            Contrato de Prestação de Serviços
          </button>{" "}
          da Assessoria Somma Club, incluindo as regras de plano, pagamento, fidelidade,
          cancelamento, recomposição de desconto, inadimplência, responsabilidade pela prática
          esportiva, uso de imagem e tratamento de dados pessoais (LGPD).
        </span>
      </label>

      {/* Modal do contrato */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Contrato de Prestação de Serviços"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink">
                Contrato de Prestação de Serviços
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar contrato"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-light"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-6 sm:px-7">
              <ContratoAssessoria />
            </div>

            <div className="flex flex-col gap-3 border-t border-black/10 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-black/15 px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-light"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(true);
                  setOpen(false);
                }}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Li e aceito o contrato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
