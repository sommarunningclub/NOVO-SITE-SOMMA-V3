import Image from "next/image";
import { PHOTOS, SOMMA } from "@/lib/somma-data";
import { Reveal } from "./reveal";
import { FocoRadical } from "./foco-radical";

export function Gallery() {
  return (
    <section id="fotos" className="bg-white py-20 md:py-28">
      <div className="container-somma">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Somma em ação</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-5xl">
            “{SOMMA.slogan}”
          </h2>
        </Reveal>

        <div className="mt-12 grid auto-rows-[180px] grid-cols-2 gap-3 md:auto-rows-[240px] md:grid-cols-4">
          {PHOTOS.gallery.map((src, i) => (
            <Reveal
              key={src}
              delay={(i % 4) * 0.06}
              className={
                i === 0 || i === 3
                  ? "col-span-2 row-span-1 md:row-span-2"
                  : "col-span-1 row-span-1"
              }
            >
              <div className="relative h-full w-full overflow-hidden rounded-2xl">
                <Image
                  src={src}
                  alt="SOMMA Club em movimento"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </Reveal>
          ))}
        </div>

        {/* Fotos disponíveis no Foco Radical + cupom */}
        <Reveal>
          <FocoRadical />
        </Reveal>
      </div>
    </section>
  );
}
