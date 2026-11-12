import Image from "next/image";
import { IMAGENS } from "@/lib/evp/config";
import type { Profissional } from "@/lib/evp/tipos";
import { Secao, Titulo } from "./Secao";

const ORG = { bora: "BORA Assessoria", somma: "SOMMA Club" } as const;

export function Conduzem({ profissionais }: { profissionais: Profissional[] }) {
  return (
    <Secao id="conduzem" marco="05" rotulo="Quem vai conduzir">
      <Titulo id="conduzem" linhas={["Comunidade e técnica", "na mesma sala."]} />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div data-sobe className="mt-cartao flex items-center gap-5 p-5 sm:p-6">
          <Image src={IMAGENS.logoSomma} alt="SOMMA Club" width={120} height={28} style={{ height: 24, width: "auto" }} className="shrink-0" />
          <p className="text-[0.95rem] leading-relaxed text-[#d4d4d4]">A comunidade que recebe você.</p>
        </div>
        <div data-sobe className="mt-cartao flex items-center gap-5 p-5 sm:p-6">
          <Image src={IMAGENS.logoBora} alt="BORA Assessoria" width={100} height={28} style={{ height: 22, width: "auto" }} className="shrink-0" />
          <p className="text-[0.95rem] leading-relaxed text-[#d4d4d4]">Os treinadores que conduzem a apresentação.</p>
        </div>
      </div>

      {profissionais.length === 0 ? (
        <p data-sobe className="mt-pendente mt-6">Treinadores em definição</p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profissionais.map((p) => (
            <li key={p.nome} data-sobe className="mt-cartao overflow-hidden">
              <div className="relative aspect-[4/5] bg-[color:var(--mt-grafite)]">
                {p.foto_url ? (
                  // Foto enviada pelo painel (endereço externo): <img> simples, com tamanho reservado pela proporção.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.foto_url} alt={`Foto de ${p.nome}`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span aria-hidden className="mt-display absolute inset-0 grid place-items-center text-[5rem] text-[color:var(--mt-linha-forte)]">
                    {p.nome.split(/\s+/).slice(0, 2).map((x) => x[0]).join("")}
                  </span>
                )}
                <span className="mt-selo absolute left-3 top-3 bg-[rgba(8,8,8,0.85)] text-white">{ORG[p.organizacao]}</span>
              </div>
              <div className="p-5">
                <p className="mt-display text-[1.9rem]">{p.nome}</p>
                {p.funcao && <p className="mt-rotulo mt-2 !text-[color:var(--mt-laranja)]">{p.funcao}</p>}
                {p.descricao && <p className="mt-3 text-[0.92rem] leading-relaxed text-[#cfcfcf]">{p.descricao}</p>}
                {p.especialidade && (
                  <p className="mt-3 border-t border-[color:var(--mt-linha)] pt-3 text-[0.85rem] leading-relaxed text-[color:var(--mt-cinza)]">{p.especialidade}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Secao>
  );
}
