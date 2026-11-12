import { TOPICOS } from "@/lib/evp/config";
import type { EventoPublico } from "@/lib/evp/tipos";
import { Secao, Titulo } from "./Secao";

const RESUMO =
  "Um encontro presencial para entender o que importa antes da largada: os percursos da Monumental, a estratégia de cada distância e as orientações práticas dos treinadores da BORA.";

/** O que é o Meeting e o que se aprende nele, em uma tela. */
export function Essencial({ evento }: { evento: EventoPublico }) {
  return (
    <Secao id="meeting" marco="01" rotulo="O Meeting">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
        <Titulo id="meeting" className="lg:col-span-7" linhas={["Uma boa prova", "começa com uma", "boa estratégia."]} />
        <div className="lg:col-span-5">
          <p data-sobe className="mt-texto">{evento.conteudo.sobre_texto || RESUMO}</p>
          <p data-sobe className="mt-3 text-[0.95rem] font-medium leading-relaxed text-white">
            Não é treino nem shakeout: é uma apresentação técnica, com mapa, tela e perguntas.
          </p>
        </div>
      </div>

      <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[color:var(--mt-linha)] bg-[color:var(--mt-linha)] sm:grid-cols-2 lg:grid-cols-3">
        {TOPICOS.map((t) => (
          <li key={t.n} data-sobe className="group bg-[color:var(--mt-preto)] p-5 transition-colors duration-300 hover:bg-[color:var(--mt-carvao)] sm:p-6">
            <span className="mt-mono text-[0.72rem] text-[color:var(--mt-cinza)] transition-colors duration-300 group-hover:text-[color:var(--mt-laranja)]">{t.n}</span>
            <h3 className="mt-display mt-3 text-[1.9rem] sm:text-[2.1rem]">{t.titulo}</h3>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-[#cfcfcf]">{t.curto}</p>
          </li>
        ))}
      </ol>
    </Secao>
  );
}
