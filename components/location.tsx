import { CalendarDays, Clock, MapPin, Navigation, Footprints, BadgeCheck } from "lucide-react";
import { SOMMA } from "@/lib/somma-data";
import { Reveal } from "./reveal";
import { StyledMap } from "./styled-map";
import { LocationMap } from "./ui/expand-map";

const { lat, lng } = SOMMA.geo;
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

const INFO = [
  { icon: CalendarDays, label: "Quando", value: "Todo sábado" },
  { icon: Clock, label: "Horário", value: "7h (chegue 10 min antes)" },
  {
    icon: MapPin,
    label: "Onde",
    value: "Parque da Cidade Sarah Kubitschek · Estacionamento 10 · Brasília-DF",
  },
  {
    icon: Footprints,
    label: "Ritmos",
    value: "Iniciante (4 km) · Confortável (4–8 km) · Mais rápido (4–8 km)",
  },
  { icon: BadgeCheck, label: "Quanto", value: "100% gratuito — é só aparecer" },
];

export function Location() {
  return (
    <section id="local" className="bg-light py-20 md:py-28">
      <div className="container-somma">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Onde a gente corre
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-5xl">
            Te esperamos no Estacionamento 10.
          </h2>
          <p className="mt-4 text-base text-muted md:text-lg">
            Ponto de encontro oficial do SOMMA Club no Parque da Cidade. Já fez seu cadastro?
            Então faça o check-in e bora correr.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-stretch">
          {/* Mapa — desktop: Google Maps estilizado (branco/laranja); mobile: card interativo */}
          <Reveal className="order-2 lg:order-1">
            {/* Desktop / tablet */}
            <StyledMap className="hidden h-full min-h-[420px] w-full overflow-hidden rounded-3xl border border-black/5 shadow-sm md:block" />

            {/* Mobile */}
            <div className="flex min-h-[200px] items-center justify-center md:hidden">
              <LocationMap
                location="Estacionamento 10 · Parque da Cidade"
                coordinates="15.8017° S, 47.9041° W"
              />
            </div>
          </Reveal>

          {/* Infos + CTAs */}
          <Reveal delay={0.1} className="order-1 lg:order-2">
            <div className="flex h-full flex-col rounded-3xl bg-white p-7 shadow-sm md:p-9">
              <ul className="space-y-5">
                {INFO.map((item) => (
                  <li key={item.label} className="flex gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {item.label}
                      </p>
                      <p className="mt-0.5 font-medium text-ink">{item.value}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={SOMMA.links.checkin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <BadgeCheck className="h-5 w-5" />
                  Fazer check-in
                </a>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-black/15 px-7 py-3.5 text-base font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
                >
                  <Navigation className="h-5 w-5" />
                  Como chegar
                </a>
              </div>
              <p className="mt-3 text-center text-xs text-muted sm:text-left">
                O check-in é para membros já cadastrados no SOMMA Club.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
