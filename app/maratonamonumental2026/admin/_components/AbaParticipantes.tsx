"use client";

import { useMemo, useState } from "react";
import { DISTANCIAS_INSCRICAO, ROTULO_CURTO } from "@/lib/evp/config";
import { dataHora } from "@/lib/evp/formato";
import { cpfMascarado, mascararTelefone, normalizarBusca } from "@/lib/evp/schema";
import { Carregando, STATUS_ROTULO, STATUS_SELO, useSecao, type Participante } from "./api";
import { FichaParticipante } from "./FichaParticipante";

type Coluna = "nome" | "created_at" | "status" | "distancia";
const ORDEM_STATUS = { confirmada: 0, lista_espera: 1, cancelada: 2 } as const;

export function AbaParticipantes() {
  const { dados, erro, carregando, recarregar } = useSecao<Participante[]>("participantes");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [distancia, setDistancia] = useState("todas");
  const [checkin, setCheckin] = useState("todos");
  const [ordem, setOrdem] = useState<{ col: Coluna; dir: 1 | -1 }>({ col: "created_at", dir: -1 });
  const [aberta, setAberta] = useState<string | null>(null);

  const linhas = useMemo(() => {
    const termo = normalizarBusca(busca);
    const filtradas = (dados ?? []).filter((p) => {
      if (status !== "todos" && p.status !== status) return false;
      if (distancia !== "todas" && p.distancia !== distancia) return false;
      if (checkin === "sim" && !p.checkin_em) return false;
      if (checkin === "nao" && p.checkin_em) return false;
      if (!termo) return true;
      return (
        normalizarBusca(p.nome).includes(termo) ||
        p.email.toLowerCase().includes(termo) ||
        p.codigo.toLowerCase().includes(termo)
      );
    });
    const { col, dir } = ordem;
    return filtradas.sort((a, b) => {
      let c = 0;
      if (col === "nome") c = a.nome.localeCompare(b.nome, "pt-BR");
      else if (col === "created_at") c = a.created_at.localeCompare(b.created_at);
      else if (col === "status") c = ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status];
      else c = DISTANCIAS_INSCRICAO.indexOf(a.distancia) - DISTANCIAS_INSCRICAO.indexOf(b.distancia);
      return c * dir;
    });
  }, [dados, busca, status, distancia, checkin, ordem]);

  if (!dados) return <Carregando erro={erro} carregando={carregando} tentar={recarregar} />;

  const ordenar = (col: Coluna) => setOrdem((o) => ({ col, dir: o.col === col ? (o.dir === 1 ? -1 : 1) : 1 }));
  // Função comum, não componente: assim o botão não é recriado (e não perde o foco) a cada ordenação.
  const th = (col: Coluna, children: string) => (
    <th key={col} scope="col" aria-sort={ordem.col === col ? (ordem.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => ordenar(col)} className="mt-mono inline-flex items-center gap-1" style={{ minHeight: 44, color: "inherit", font: "inherit", letterSpacing: "inherit" }}>
        {children}
        <span aria-hidden="true">{ordem.col === col ? (ordem.dir === 1 ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <label className="mt-campo">
          <span className="mt-rotulo">Buscar</span>
          <input className="mt-input" type="search" placeholder="Nome, e-mail ou código" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        <label className="mt-campo">
          <span className="mt-rotulo">Status</span>
          <select className="mt-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="confirmada">Confirmada</option>
            <option value="lista_espera">Lista de espera</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </label>
        <label className="mt-campo">
          <span className="mt-rotulo">Distância</span>
          <select className="mt-input" value={distancia} onChange={(e) => setDistancia(e.target.value)}>
            <option value="todas">Todas</option>
            {DISTANCIAS_INSCRICAO.map((d) => (
              <option key={d} value={d}>{ROTULO_CURTO[d]}</option>
            ))}
          </select>
        </label>
        <label className="mt-campo">
          <span className="mt-rotulo">Check-in</span>
          <select className="mt-input" value={checkin} onChange={(e) => setCheckin(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="sim">Feito</option>
            <option value="nao">Não feito</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="mt-rotulo" role="status" aria-live="polite">
          {linhas.length} de {dados.length} inscrição(ões)
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" onClick={() => void recarregar()} disabled={carregando}>
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
          <a className="mt-botao mt-botao--linha mt-botao--pequeno" href="/api/evp/admin/exportar" download>
            Exportar CSV
          </a>
        </div>
      </div>
      <p className="text-sm" style={{ color: "var(--mt-cinza)" }}>
        O CSV sai com o CPF mascarado, e cada exportação fica no histórico.
      </p>

      {linhas.length === 0 ? (
        <div className="mt-cartao p-6 text-sm" style={{ color: "var(--mt-cinza)" }}>
          {dados.length === 0 ? "Ainda não há inscrições." : "Nenhuma inscrição com esses filtros."}
        </div>
      ) : (
        <>
          {/* Celular: cartões. */}
          <ul className="grid gap-3 md:hidden">
            {linhas.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => setAberta(p.id)} className="mt-cartao block w-full p-4 text-left">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0 break-words font-semibold">{p.nome}</span>
                    <span className={STATUS_SELO[p.status]}>{STATUS_ROTULO[p.status]}</span>
                  </span>
                  <span className="mt-1 block break-all text-sm" style={{ color: "var(--mt-cinza)" }}>{p.email}</span>
                  <span className="mt-mono mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: "var(--mt-cinza)" }}>
                    <span>{p.codigo}</span>
                    <span>{ROTULO_CURTO[p.distancia]}</span>
                    <span>{dataHora(p.created_at)}</span>
                    {p.checkin_em ? <span style={{ color: "var(--mt-verde)" }}>Presente</span> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* Telas maiores: tabela. */}
          <div className="mt-cartao mt-rolagem-x hidden md:block">
            <table className="mt-tabela">
              <thead>
                <tr>
                  {th("nome", "Nome")}
                  <th scope="col">Contato</th>
                  <th scope="col">CPF</th>
                  {th("distancia", "Distância")}
                  {th("status", "Status")}
                  <th scope="col">Check-in</th>
                  {th("created_at", "Inscrição em")}
                </tr>
              </thead>
              <tbody>
                {linhas.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <button type="button" onClick={() => setAberta(p.id)} className="text-left font-semibold underline-offset-4 hover:underline" style={{ minHeight: 44 }}>
                        {p.nome}
                      </button>
                      <div className="mt-mono text-xs" style={{ color: "var(--mt-cinza)" }}>{p.codigo}</div>
                    </td>
                    <td>
                      <div className="break-all">{p.email}</div>
                      <div style={{ color: "var(--mt-cinza)" }}>{mascararTelefone(p.telefone)}</div>
                    </td>
                    <td className="mt-mono text-xs whitespace-nowrap">{cpfMascarado(p.cpf_final)}</td>
                    <td className="whitespace-nowrap">
                      {ROTULO_CURTO[p.distancia]}
                      {p.primeira_vez ? <div className="text-xs" style={{ color: "var(--mt-cinza)" }}>Primeira vez</div> : null}
                    </td>
                    <td><span className={STATUS_SELO[p.status]}>{STATUS_ROTULO[p.status]}</span></td>
                    <td className="whitespace-nowrap">{p.checkin_em ? dataHora(p.checkin_em) : <span style={{ color: "var(--mt-cinza-fraco)" }}>Não</span>}</td>
                    <td className="whitespace-nowrap">{dataHora(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {aberta ? <FichaParticipante id={aberta} fechar={() => setAberta(null)} mudou={() => void recarregar()} /> : null}
    </div>
  );
}
