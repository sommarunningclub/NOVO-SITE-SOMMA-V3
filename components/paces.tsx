import { Footprints, Gauge, Zap } from "lucide-react";
import { PACES } from "@/lib/somma-data";
import { Reveal } from "./reveal";

const ICONS = [Footprints, Gauge, Zap];

export function Paces() {
  return (
    <section id="ritmos" className="bg-white py-20 md:py-28">
      <div className="container-somma">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Treinos</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-5xl">
            Tem um ritmo para você.
          </h2>
          <p className="mt-4 text-base text-muted md:text-lg">
            Não importa seu nível: você corre no seu pace, com acompanhamento e na companhia certa.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PACES.map((p, i) => {
            const Icon = ICONS[i] ?? Footprints;
            return (
              <Reveal key={p.titulo} delay={i * 0.1}>
                <div className="group h-full rounded-3xl border border-black/5 bg-light p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-ink">{p.titulo}</h3>
                  <p className="mt-2 text-muted">{p.descricao}</p>
                  <dl className="mt-5 space-y-2 border-t border-black/5 pt-5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted">Distância</dt>
                      <dd className="font-medium text-ink">{p.distancia}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Pace</dt>
                      <dd className="font-medium text-ink">{p.pace}</dd>
                    </div>
                  </dl>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
