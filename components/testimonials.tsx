import { Quote } from "lucide-react";
import { TESTIMONIALS } from "@/lib/somma-data";
import { Reveal } from "./reveal";

export function Testimonials() {
  return (
    <section className="bg-light py-20 md:py-28">
      <div className="container-somma">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Depoimentos</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-5xl">
            O que a galera está dizendo?
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={i * 0.1}>
              {/* TODO(conteúdo): substituir por depoimentos e avatares reais de membros. */}
              <figure className="flex h-full flex-col rounded-3xl bg-white p-7 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                <Quote className="h-7 w-7 text-primary" />
                <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-ink">
                  “{t.frase}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {t.nome.charAt(0)}
                  </span>
                  <span>
                    <span className="block font-medium text-ink">{t.nome}</span>
                    <span className="block text-sm text-muted">{t.contexto}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
