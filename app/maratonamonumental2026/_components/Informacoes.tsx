"use client";

import { rotuloValor } from "@/lib/evp/config";
import { dataLonga, horario, linkComoChegar } from "@/lib/evp/formato";
import { useEvento } from "./Contexto";
import { MapaLocal } from "./MapaLocal";
import { Secao, Titulo } from "./Secao";


function Celula({ rotulo, valor, pendente }: { rotulo: string; valor: string | null; pendente: string }) {
  return (
    <div data-sobe className="bg-[color:var(--mt-preto)] p-5 sm:p-6">
      <dt className="mt-rotulo">{rotulo}</dt>
      <dd className="mt-2.5 text-[1.1rem] font-semibold leading-snug">
        {valor ?? <span className="mt-pendente">{pendente}</span>}
      </dd>
    </div>
  );
}

function textoDasVagas(v: ReturnType<typeof useEvento>["vagas"]): string | null {
  if (v.capacidade === null) return null;
  if (v.modo === "encerrada") return "Inscrições encerradas";
  if (v.modo === "em_breve") return `${v.capacidade} vagas no total`;
  if (v.modo === "esgotada") return "Vagas esgotadas";
  if (v.modo === "lista_espera") return "Vagas preenchidas, lista de espera aberta";
  return `${v.vagas_livres} de ${v.capacidade} vagas disponíveis`;
}

export function Informacoes() {
  const { evento, vagas } = useEvento();
  const rota = linkComoChegar(evento);
  const temMapa = evento.lat !== null && evento.lng !== null;

  return (
    <Secao id="encontro" marco="06" rotulo="Informações do encontro">
      <Titulo id="encontro" linhas={["Quando", "e onde."]} />

      <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[color:var(--mt-linha)] bg-[color:var(--mt-linha)] sm:grid-cols-2 lg:grid-cols-3">
        <Celula rotulo="Data" valor={dataLonga(evento.starts_at)} pendente="Em breve" />
        <Celula rotulo="Horário" valor={horario(evento.starts_at, evento.ends_at)} pendente="Em breve" />
        <Celula rotulo="Local" valor={evento.local_nome} pendente="Local em definição" />
        <Celula rotulo="Endereço" valor={evento.endereco} pendente="Em definição" />
        <Celula rotulo="Vagas" valor={textoDasVagas(vagas)} pendente="Em breve" />
        <Celula rotulo="Inscrição" valor={rotuloValor(evento.valor_centavos)} pendente="Em breve" />
      </dl>

      <div className="mt-3 grid gap-3 lg:grid-cols-12">
        <div data-sobe className="mt-cartao relative min-h-[18rem] overflow-hidden lg:col-span-7 lg:min-h-[24rem]">
          {temMapa ? (
            <div className="absolute inset-0">
              <MapaLocal lat={evento.lat as number} lng={evento.lng as number} nome={evento.local_nome ?? "Local do Meeting"} />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-start justify-end gap-3 p-6 sm:p-8">
              {/* Sem local cadastrado não há mapa: nenhum endereço é suposto. */}
              <svg aria-hidden viewBox="0 0 600 300" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-40">
                <path className="mt-rota" strokeDasharray="6 10" d="M-10 240 C 120 240, 150 120, 280 130 S 420 230, 520 90 S 590 40, 620 44" />
              </svg>
              <p className="mt-pendente relative">Local em definição</p>
              <p className="relative max-w-[28rem] text-[0.98rem] leading-relaxed text-[#d4d4d4]">
                O mapa do espaço e as orientações de chegada aparecem aqui assim que o local for confirmado.
              </p>
            </div>
          )}
        </div>

        <div data-sobe className="mt-cartao flex flex-col p-6 sm:p-8 lg:col-span-5">
          <h3 className="mt-rotulo">Como chegar</h3>
          <p className="mt-3 text-[0.98rem] leading-relaxed text-[#d4d4d4]">
            {evento.orientacoes_chegada ?? "As orientações de chegada serão publicadas junto com o local."}
          </p>
          <p className="mt-3 text-[0.98rem] leading-relaxed text-[#d4d4d4]">
            {evento.info_participacao ?? "Leve o QR Code do seu ingresso: ele é lido na recepção."}
          </p>
          {rota ? (
            <a href={rota} target="_blank" rel="noopener noreferrer" className="mt-botao mt-botao--linha mt-botao--pequeno mt-5 self-start">
              Como chegar<span className="mt-so-leitor">, abre o mapa em nova aba</span>
              <span aria-hidden className="mt-seta">→</span>
            </a>
          ) : (
            <button type="button" disabled className="mt-botao mt-botao--linha mt-botao--pequeno mt-5 self-start">
              Como chegar (em breve)
            </button>
          )}

        </div>
      </div>

    </Secao>
  );
}
