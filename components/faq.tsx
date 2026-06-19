"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FAQ as FAQ_ITEMS } from "@/lib/somma-data";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-20 md:py-28">
      <div className="container-somma max-w-3xl">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Dúvidas</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-5xl">
            Perguntas frequentes
          </h2>
        </Reveal>

        <div className="mt-10 divide-y divide-black/10 border-y border-black/10">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="text-lg font-medium text-ink">{item.q}</span>
                    <Plus
                      className={cn(
                        "h-5 w-5 shrink-0 text-primary transition-transform duration-300",
                        isOpen && "rotate-45"
                      )}
                    />
                  </button>
                </h3>
                <div
                  className={cn(
                    "grid overflow-hidden transition-all duration-300",
                    isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="min-h-0">
                    <p className="text-muted">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
