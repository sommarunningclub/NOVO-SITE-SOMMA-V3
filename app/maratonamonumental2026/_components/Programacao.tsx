import type { Momento } from "@/lib/evp/tipos";
import { Secao, Titulo } from "./Secao";

/** Jornada do encontro, em seis passos. Horário só aparece quando o painel confirma. */
export function Programacao({ momentos }: { momentos: Momento[] }) {
  const temHorario = momentos.some((m) => m.horario);
  return (
    <Secao id="programacao" marco="04" rotulo="Como será o Meeting">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Titulo id="programacao" linhas={["Do credenciamento", "à última pergunta."]} />
        {!temHorario && <p data-sobe className="mt-pendente">Horários em breve</p>}
      </div>
      <ol className="mt-10 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        {momentos.map((m, i) => (
          <li key={`${i}-${m.titulo}`} data-sobe className="flex gap-4 border-t border-[color:var(--mt-linha-forte)] py-5">
            <span className="mt-mono pt-1 text-[0.72rem] tracking-normal text-[color:var(--mt-laranja)]">{String(i + 1).padStart(2, "0")}</span>
            <div>
              {m.horario && <p className="mt-mono text-[0.72rem] text-[color:var(--mt-cinza)]">{m.horario}</p>}
              <h3 className="text-[1.05rem] font-semibold leading-snug">{m.titulo}</h3>
            </div>
          </li>
        ))}
      </ol>
    </Secao>
  );
}
