import { SOMMA } from "@/lib/somma-data";
import { StravaIcon } from "./icons/strava";
import { Reveal } from "./reveal";

export function StravaCta() {
  return (
    <section className="bg-white py-16">
      <div className="container-somma">
        <Reveal>
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-black/5 bg-light px-6 py-10 text-center md:flex-row md:justify-between md:text-left">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FC4C02]/10 text-[#FC4C02]">
                <StravaIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  Acompanhe o Somma também no Strava
                </h2>
                <p className="mt-1 text-muted">
                  Registre seus treinos, acompanhe a comunidade e mantenha a motivação durante a semana.
                </p>
              </div>
            </div>
            <a
              href={SOMMA.links.strava}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 rounded-full bg-[#FC4C02] px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Entrar no Strava
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
