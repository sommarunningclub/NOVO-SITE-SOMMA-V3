"use client";

import { formatCPF } from "@/lib/cpf";
import { LINKS } from "@/lib/o-longao/config";
import { Aceite } from "./Campos";
import { categoriasAtivas, ROTULO_CATEGORIA, type FormValues } from "./tipos";
import type { Erros } from "./validacao";

/**
 * Etapa 5: a última chance de olhar tudo antes de enviar.
 *
 * Cada bloco tem seu próprio "editar" que devolve a pessoa à etapa certa, em
 * vez de um botão único de voltar que obrigaria a repassar por tudo. O CPF
 * aparece formatado, mas nunca mascarado: aqui quem lê é o dono do dado, e
 * mascarar impediria justamente a conferência que a etapa existe para permitir.
 */
function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[color:var(--line)] py-2.5">
      <dt className="lgo-label text-[color:rgba(242,240,236,0.45)]">{rotulo}</dt>
      <dd className="text-sm text-[color:var(--papel)]">{valor || "-"}</dd>
    </div>
  );
}

function Bloco({
  titulo,
  onEditar,
  children,
}: {
  titulo: string;
  onEditar: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="lgo-panel p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="lgo-display lgo-display-condensed text-lg">{titulo}</h3>
        <button
          type="button"
          onClick={onEditar}
          className="lgo-label min-h-[44px] px-1 text-[color:var(--sinal)] underline underline-offset-4"
        >
          editar
        </button>
      </div>
      {children}
    </section>
  );
}

export function Revisao({
  valores,
  erros,
  onIrPara,
  onAceite,
}: {
  valores: FormValues;
  erros: Erros;
  onIrPara: (etapa: number) => void;
  onAceite: (campo: keyof FormValues, v: boolean) => void;
}) {
  const categorias = categoriasAtivas(valores.crew.categoria);

  return (
    <div className="flex flex-col gap-4">
      <Bloco titulo="A CREW" onEditar={() => onIrPara(1)}>
        <dl>
          <Linha rotulo="Nome" valor={valores.crew.nome} />
          <Linha rotulo="Instagram" valor={valores.crew.instagram ? `@${valores.crew.instagram.replace(/^@/, "")}` : ""} />
          <Linha rotulo="Cidade" valor={valores.crew.cidade} />
          <Linha
            rotulo="Categoria"
            valor={categorias.map((c) => ROTULO_CATEGORIA[c].replace("EQUIPE ", "")).join(" + ")}
          />
        </dl>
      </Bloco>

      <Bloco titulo="RESPONSÁVEL E CAPITÃO" onEditar={() => onIrPara(2)}>
        <dl>
          <Linha rotulo="Responsável" valor={valores.responsavel.nome} />
          <Linha rotulo="CPF" valor={formatCPF(valores.responsavel.cpf)} />
          <Linha rotulo="WhatsApp" valor={valores.responsavel.whatsapp} />
          <Linha rotulo="E-mail" valor={valores.responsavel.email} />
          <Linha rotulo="Capitão" valor={valores.capitao.nome} />
          <Linha rotulo="Contato do capitão" valor={valores.capitao.telefone} />
        </dl>
      </Bloco>

      {categorias.map((categoria) => {
        const equipe = valores.equipes[categoria];
        return (
          <Bloco
            key={categoria}
            titulo={ROTULO_CATEGORIA[categoria]}
            onEditar={() => onIrPara(3)}
          >
            <ol className="flex flex-col">
              {equipe.atletas.map((a, i) => (
                <li
                  key={`t-${i}`}
                  className="flex items-baseline gap-3 border-b border-[color:var(--line)] py-2 text-sm"
                >
                  <span className="lgo-num w-6 shrink-0 text-[color:rgba(242,240,236,0.4)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{a.nome || "-"}</span>
                  <span className="lgo-mono shrink-0 text-xs text-[color:rgba(242,240,236,0.45)]">
                    {a.camiseta}
                  </span>
                </li>
              ))}
              {equipe.reservas.map((a, i) => (
                <li
                  key={`r-${i}`}
                  className="flex items-baseline gap-3 border-b border-[color:var(--line)] py-2 text-sm"
                >
                  <span className="lgo-num w-6 shrink-0 text-[color:var(--sinal)]">R{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{a.nome || "-"}</span>
                  <span className="lgo-mono shrink-0 text-xs text-[color:rgba(242,240,236,0.45)]">
                    {a.camiseta}
                  </span>
                </li>
              ))}
            </ol>
            {equipe.reservas.length === 0 ? (
              <p className="lgo-mono mt-2 text-xs text-[color:rgba(242,240,236,0.4)]">
                Sem reservas.{" "}
                <button
                  type="button"
                  onClick={() => onIrPara(4)}
                  className="underline underline-offset-4"
                >
                  adicionar
                </button>
              </p>
            ) : null}
          </Bloco>
        );
      })}

      <section className="lgo-panel p-4 md:p-5">
        <h3 className="lgo-display lgo-display-condensed mb-2 text-lg">TERMOS</h3>
        <Aceite
          id="aceite-regulamento"
          checked={valores.aceite_regulamento}
          onChange={(v) => onAceite("aceite_regulamento", v)}
          erro={erros.aceite_regulamento}
        >
          Li e aceito o{" "}
          <a
            href={LINKS.regulamento}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[color:var(--sinal)] underline underline-offset-4"
          >
            regulamento
          </a>
          .
        </Aceite>
        <Aceite
          id="aceite-imagem"
          checked={valores.aceite_imagem}
          onChange={(v) => onAceite("aceite_imagem", v)}
          erro={erros.aceite_imagem}
        >
          Autorizo uso de imagem conforme o regulamento.
        </Aceite>
        <Aceite
          id="aceite-veracidade"
          checked={valores.aceite_veracidade}
          onChange={(v) => onAceite("aceite_veracidade", v)}
          erro={erros.aceite_veracidade}
        >
          Confirmo que os dados fornecidos são verdadeiros.
        </Aceite>
      </section>
    </div>
  );
}
