"use client";

import { useState } from "react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdvisoryPlanCard } from "@/lib/somma-data";

type Billing = "mensal" | "total";

export function SommaPricing({ plans, dark = false }: { plans: AdvisoryPlanCard[]; dark?: boolean }) {
  const [billing, setBilling] = useState<Billing>("mensal");
  const activeLabel = dark ? "text-white" : "text-ink";
  const idleLabel = dark ? "text-white/50" : "text-muted";

  return (
    <div className="relative mx-auto flex max-w-5xl flex-col items-center justify-center">
      {/* Toggle Por mês / Total */}
      <div className="flex items-center justify-center gap-4">
        <span className={cn("text-sm font-medium transition-colors", billing === "mensal" ? activeLabel : idleLabel)}>
          Por mês
        </span>
        <button
          type="button"
          onClick={() => setBilling((p) => (p === "mensal" ? "total" : "mensal"))}
          aria-label="Alternar entre valor por mês e valor total"
          role="switch"
          aria-checked={billing === "total"}
          className="relative h-6 w-12 rounded-full bg-primary transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span
            className={cn(
              "absolute left-1 top-1 inline-flex h-4 w-4 rounded-full bg-white transition-all duration-300 ease-in-out",
              billing === "total" ? "translate-x-6" : "translate-x-0"
            )}
          />
        </button>
        <span className={cn("text-sm font-medium transition-colors", billing === "total" ? activeLabel : idleLabel)}>
          Total
        </span>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 pt-10 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} billing={billing} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, billing }: { plan: AdvisoryPlanCard; billing: Billing }) {
  const recommended = plan.isRecommended;
  const value = billing === "mensal" ? plan.price : plan.total;
  const isInternal = plan.href.startsWith("/");

  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-3xl border bg-white transition-all",
        recommended ? "border-primary" : "border-black/10"
      )}
    >
      {/* Glow do recomendado */}
      {recommended && (
        <div className="absolute inset-x-0 top-1/2 -z-10 mx-auto h-12 w-full -rotate-45 rounded-3xl bg-primary blur-[8rem]" />
      )}

      <div className="flex w-full flex-col items-start p-7">
        <div className="flex w-full items-center justify-between">
          <h3 className="text-xl font-semibold text-ink">{plan.name}</h3>
          {recommended && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              Recomendado
            </span>
          )}
        </div>

        <h4 className="mt-4 flex items-baseline gap-1 text-3xl font-bold tracking-tight text-ink">
          <NumberFlow
            value={value}
            locales="pt-BR"
            format={{
              style: "currency",
              currency: "BRL",
              currencyDisplay: "narrowSymbol",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }}
          />
          {billing === "mensal" && (
            <span className="text-base font-medium text-muted">/mês</span>
          )}
        </h4>

        <div className="h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={billing}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mt-1 block text-sm text-muted"
            >
              {billing === "mensal" ? "cobrado por mês" : plan.note}
            </motion.span>
          </AnimatePresence>
        </div>

        <p className="mt-4 text-sm text-muted">{plan.description}</p>
      </div>

      <div className="w-full px-7">
        <a
          href={plan.href}
          {...(isInternal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          className={cn(
            "block w-full rounded-full px-5 py-3 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            recommended ? "bg-primary text-white hover:bg-primary-hover" : "bg-ink text-white hover:bg-ink/90"
          )}
        >
          {plan.buttonText}
        </a>
      </div>

      <div className="mt-2 flex w-full flex-col gap-2.5 p-7">
        <span className="text-sm font-medium text-ink">Inclui:</span>
        {plan.features.map((feature, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {feature.included ? (
              <Check className="size-4 shrink-0 text-primary" strokeWidth={3} />
            ) : (
              <X className="size-4 shrink-0 text-muted" />
            )}
            <span className={cn("text-sm", feature.included ? "text-ink" : "text-muted line-through")}>
              {feature.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
