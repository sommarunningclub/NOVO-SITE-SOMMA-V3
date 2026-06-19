"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Copy, ArrowUpRight, Camera } from "lucide-react";
import { SOMMA } from "@/lib/somma-data";

export function FocoRadical() {
  const [copied, setCopied] = useState(false);
  const cupom = SOMMA.focoRadical.cupom;

  async function copy() {
    try {
      await navigator.clipboard.writeText(cupom);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencioso
    }
  }

  return (
    <div className="mt-12 overflow-hidden rounded-3xl border border-black/5 bg-light">
      <div className="grid items-center gap-8 p-7 md:grid-cols-2 md:p-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Camera className="h-3.5 w-3.5" />
            Fotos do corre
          </span>
          <h3 className="mt-4 text-2xl font-semibold text-ink md:text-3xl">
            As fotos dos treinos estão no Foco Radical
          </h3>
          <p className="mt-3 text-muted">
            Encontre suas fotos das corridas do SOMMA Club no Foco Radical e use o cupom especial
            para garantir desconto. É só copiar o código abaixo e aplicar no site.
          </p>

          {/* Cupom copiável */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={copy}
              aria-label={`Copiar cupom ${cupom}`}
              className="group flex items-center justify-between gap-4 rounded-xl border-2 border-dashed border-primary/40 bg-white px-5 py-3 transition-colors hover:border-primary"
            >
              <span className="font-mono text-lg font-bold tracking-widest text-ink">{cupom}</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copiar
                  </>
                )}
              </span>
            </button>

            <a
              href={SOMMA.links.focoRadical}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Ver no Foco Radical
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Logo Foco Radical */}
        <div className="flex justify-center md:justify-end">
          <a
            href={SOMMA.links.focoRadical}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Foco Radical"
            className="block w-full max-w-xs"
          >
            <Image
              src={SOMMA.focoRadical.logo}
              alt="Foco Radical"
              width={1920}
              height={677}
              className="h-auto w-full"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
