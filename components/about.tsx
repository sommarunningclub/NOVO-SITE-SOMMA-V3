import Image from "next/image";
import { SOMMA, PHOTOS } from "@/lib/somma-data";
import { Reveal } from "./reveal";

export function About() {
  return (
    <section id="sobre" className="bg-white py-20 md:py-28">
      <div className="container-somma grid items-center gap-12 md:grid-cols-2">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            A comunidade
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-5xl">
            Mais que corrida, comunidade.
          </h2>
          <p className="mt-5 max-w-prose text-base leading-relaxed text-muted md:text-lg">
            O Somma Club é uma comunidade gratuita de corrida, wellness e conexões
            reais em Brasília. Um espaço aberto para quem quer se movimentar,
            conhecer pessoas e viver a cidade com mais energia.
          </p>
          <a
            href={SOMMA.links.inscricao}
            className="mt-8 inline-flex rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Quero me juntar à comunidade
          </a>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
            <Image
              src={PHOTOS.about}
              alt="Membros do SOMMA Club reunidos após o treino"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
