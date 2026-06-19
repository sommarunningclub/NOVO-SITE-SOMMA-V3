"use client";

import { TRUST_ITEMS } from "@/lib/somma-data";
import { Reveal } from "./reveal";

export function TrustBar() {
  return (
    <section aria-label="Em números" className="border-y border-black/5 bg-light">
      <div className="container-somma grid grid-cols-2 gap-px md:grid-cols-4">
        {TRUST_ITEMS.map((item, i) => (
          <Reveal
            key={item.label}
            delay={i * 0.08}
            className="flex flex-col items-center justify-center px-4 py-8 text-center"
          >
            <span className="text-2xl font-bold text-primary md:text-3xl">{item.value}</span>
            <span className="mt-1 text-sm text-muted">{item.label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
