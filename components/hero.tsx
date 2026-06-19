"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { SOMMA, PHOTOS } from "@/lib/somma-data";

export function Hero() {
  return (
    <section id="topo" className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink text-white">
      {/* Foto real do Somma em grupo */}
      <Image
        src={PHOTOS.hero}
        alt="Comunidade SOMMA Club correndo no Parque da Cidade"
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Overlay escuro + spotlight (mecânica do Marun) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/75" />
      <div className="hero-spotlight absolute inset-0" />

      <div className="container-somma relative z-10 py-28">
        {/* Tipografia gigante (wordmark, estilo Marun) */}
        <motion.span
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="block select-none text-[22vw] font-bold leading-[0.85] tracking-tight md:text-[16vw] lg:text-[180px]"
        >
          somma<span className="text-primary">.</span>
        </motion.span>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-2xl"
        >
          <h1 className="text-2xl font-semibold sm:text-4xl">
            O maior running club do Distrito Federal
          </h1>
          <p className="mt-3 text-base text-white/80 sm:text-lg">
            +5.000 membros · Gratuito · Todo sábado às 7h, no Parque da Cidade.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={SOMMA.links.inscricao}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Inscreva-se grátis
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={SOMMA.links.proximoTreino}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Ver próximo treino
            </a>
          </div>
        </motion.div>
      </div>

      <a
        href="#sobre"
        aria-label="Rolar para saber mais"
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/70 transition-colors hover:text-white"
      >
        <ChevronDown className="h-7 w-7 animate-bounce" />
      </a>
    </section>
  );
}
