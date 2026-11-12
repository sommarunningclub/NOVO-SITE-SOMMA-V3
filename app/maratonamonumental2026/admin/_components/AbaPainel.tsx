"use client";

import { useState } from "react";
import { ROTULO_CURTO, type DistanciaInscricao } from "@/lib/evp/config";
import type { ModoVagas } from "@/lib/evp/tipos";
import { Bloco, Carregando, Mensagem, useApi, useSecao, type Aviso, type DadosPainel, type Operacao } from "./api";
import { ControleInscricoes } from "./ControleInscricoes";

const MODO: Record<ModoVagas, { texto: string; selo: string }> = {
  em_breve: { texto: "Em breve (formulário fechado)", selo: "mt-selo mt-selo--fora" },
  aberta: { texto: "Abertas", selo: "mt-selo mt-selo--ok" },
  lista_espera: { texto: "Lotado, recebendo lista de espera", selo: "mt-selo mt-selo--espera" },
  esgotada: { texto: "Esgotado", selo: "mt-selo mt-selo--alerta" },
  encerrada: { texto: "Encerradas", selo: "mt-selo mt-selo--fora" },
};

function Numero({ rotulo, valor, apoio }: { rotulo: string; valor: string; apoio?: string }) {
  return (
    <div className="mt-cartao p-4 sm:p-5">
      <p className="mt-rotulo">{rotulo}</p>
      <p className="mt-display mt-2" style={{ fontSize: "clamp(2.25rem, 8vw, 3.5rem)" }}>
        {valor}
      </p>
      {apoio ? (
        <p className="mt-1 text-sm" style={{ color: "var(--mt-cinza)" }}>
          {apoio}
        </p>
      ) : null}
    </div>
  );
}

function Barras({ itens }: { itens: { rotulo: string; n: number }[] }) {
  const total = itens.reduce((s, i) => s + i.n, 0);
  if (!total) return <p className="text-sm" style={{ color: "var(--mt-cinza)" }}>Ainda sem inscrições confirmadas.</p>;
  const maior = Math.max(...itens.map((i) => i.n), 1);
  return (
    <ul className="grid gap-3">
      {itens.map((i) => (
        <li key={i.rotulo}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>{i.rotulo}</span>
            <span className="mt-mono text-xs" style={{ color: "var(--mt-cinza)" }}>
              {i.n} · {Math.round((i.n * 100) / total)}%
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full" style={{ background: "var(--mt-grafite)" }} aria-hidden="true">
            <div className="h-full rounded-full" style={{ width: `${(i.n * 100) / maior}%`, background: "var(--mt-laranja)" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const CHECAGENS: { chave: keyof Operacao; nome: string; falta: string }[] = [
  { chave: "email", nome: "Envio de e-mail", falta: "Sem isso, ninguém recebe a confirmação (RESEND_API_KEY e VIP_EMAIL_FROM)." },
  { chave: "mapa", nome: "Google Maps", falta: "Sem a chave, a página mostra o conteúdo alternativo no lugar do mapa." },
  { chave: "senha_mestra", nome: "Senha mestra", falta: "Sem ela, só entram contas criadas na aba Equipe (EVP_ADMIN_SENHA)." },
  { chave: "limite_global", nome: "Limite de tentativas global", falta: "Sem Upstash, o limite contra abuso vale por servidor, não no total." },
  { chave: "segredo_dados", nome: "Segredo de dados próprio", falta: "Sem EVP_DADOS_SECRET, o CPF é protegido com o segredo de sessão do site. Funciona, mas esse segredo não pode mudar." },
];

export function AbaPainel({ abrirEvento }: { abrirEvento: () => void }) {
  const api = useApi();
  const { dados, erro, carregando, recarregar } = useSecao<DadosPainel>("painel");
  const operacao = useSecao<Operacao>("operacao");
  const [aviso, setAviso] = useState<Aviso>(null);
  const [promovendo, setPromovendo] = useState(false);

  async function promover() {
    setPromovendo(true);
    setAviso(null);
    const r = await api<{ promovidas: number; avisados: number }>("/api/evp/admin/participante", {
      method: "POST",
      body: JSON.stringify({ acao: "promover_fila" }),
    });
    setPromovendo(false);
    if (!r.ok) return setAviso({ tipo: "erro", texto: r.erro });
    setAviso({
      tipo: "ok",
      texto:
        r.corpo.promovidas === 0
          ? "Ninguém foi promovido: não há vaga livre ou a fila está vazia."
          : `${r.corpo.promovidas} pessoa(s) saíram da fila. ${r.corpo.avisados} aviso(s) por e-mail enviados.`,
    });
    void recarregar();
  }

  if (!dados) return <Carregando erro={erro} carregando={carregando} tentar={recarregar} />;

  const v = dados.vagas;
  const podePromover = v.fila > 0 && (v.vagas_livres ?? 0) > 0;
  const distancias = Object.entries(dados.por_distancia)
    .map(([d, n]) => ({ rotulo: ROTULO_CURTO[d as DistanciaInscricao] ?? d, n }))
    .sort((a, b) => b.n - a.n);
  const sexo = [
    { rotulo: "Feminino", n: dados.por_sexo.feminino ?? 0 },
    { rotulo: "Masculino", n: dados.por_sexo.masculino ?? 0 },
  ];
  const primeira = [
    { rotulo: "Primeira vez na distância", n: dados.primeira_vez.sim },
    { rotulo: "Já correu a distância", n: dados.primeira_vez.nao },
  ];

  return (
    <div className="grid gap-5">
      <ControleInscricoes
        status={dados.inscricoes_status ?? "em_breve"}
        modo={v.modo}
        aoMudar={() => void recarregar()}
        abrirEvento={abrirEvento}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mt-rotulo">Situação das vagas</span>
          <span className={MODO[v.modo].selo}>{MODO[v.modo].texto}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {podePromover ? (
            <button type="button" className="mt-botao mt-botao--cheio mt-botao--pequeno" onClick={promover} disabled={promovendo}>
              {promovendo ? "Promovendo..." : "Promover fila"}
            </button>
          ) : null}
          <button
            type="button"
            className="mt-botao mt-botao--linha mt-botao--pequeno"
            onClick={() => {
              void recarregar();
              void operacao.recarregar();
            }}
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>
      <Mensagem aviso={aviso} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Numero rotulo="Confirmados" valor={String(dados.confirmadas)} apoio={v.capacidade === null ? "Capacidade não definida" : `de ${v.capacidade} vagas`} />
        <Numero rotulo="Vagas disponíveis" valor={v.vagas_livres === null ? "–" : String(v.vagas_livres)} apoio={v.vagas_livres === null ? "Defina a capacidade na aba Evento" : undefined} />
        <Numero rotulo="Lista de espera" valor={String(dados.lista_espera)} apoio={`${dados.canceladas} cancelada(s)`} />
        <Numero rotulo="Presentes" valor={String(dados.presentes)} />
        <Numero rotulo="Comparecimento" valor={dados.taxa_comparecimento === null ? "–" : `${dados.taxa_comparecimento}%`} apoio="Presentes sobre confirmados" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Bloco titulo="Por distância"><Barras itens={distancias} /></Bloco>
        <Bloco titulo="Por sexo"><Barras itens={sexo} /></Bloco>
        <Bloco titulo="Primeira vez na distância"><Barras itens={primeira} /></Bloco>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Bloco titulo="Vai correr a Monumental">
          <Barras itens={[{ rotulo: "Vai correr", n: dados.vai_correr?.sim ?? 0 }, { rotulo: "Só quer participar", n: dados.vai_correr?.nao ?? 0 }]} />
        </Bloco>
        <Bloco titulo="Já é de assessoria">
          <Barras itens={[{ rotulo: "Sim", n: dados.assessoria?.sim ?? 0 }, { rotulo: "Não", n: dados.assessoria?.nao ?? 0 }]} />
        </Bloco>
        <Bloco titulo="Base do SOMMA Club">
          <Barras itens={[{ rotulo: "Já era da base", n: dados.base_somma?.sim ?? 0 }, { rotulo: "Cadastro novo", n: dados.base_somma?.nao ?? 0 }]} />
        </Bloco>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Bloco titulo="Conversão da página" descricao="Visitas e inícios de formulário contados pelo próprio site, sem dado pessoal.">
          <ol className="grid gap-3">
            {[
              { rotulo: "Visitas", n: dados.funil.visitas },
              { rotulo: "Começaram o formulário", n: dados.funil.inicios_form },
              { rotulo: "Inscrições (confirmadas e em espera)", n: dados.funil.inscricoes },
            ].map((e) => (
              <li key={e.rotulo} className="flex items-baseline justify-between gap-3 border-b pb-3" style={{ borderColor: "var(--mt-linha)" }}>
                <span className="text-sm">{e.rotulo}</span>
                <span className="mt-mono text-base">{e.n}</span>
              </li>
            ))}
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-bold">Conversão (inscrições por visita)</span>
              <span className="mt-mono text-base" style={{ color: "var(--mt-laranja-claro)" }}>
                {dados.funil.conversao === null ? "Sem visitas ainda" : `${dados.funil.conversao}%`}
              </span>
            </li>
          </ol>
        </Bloco>

        <Bloco titulo="Origem das inscrições" descricao="Pela UTM do link ou pelo site de onde a pessoa veio.">
          {dados.por_origem.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--mt-cinza)" }}>Ainda sem visitas registradas.</p>
          ) : (
            <div className="mt-rolagem-x">
              <table className="mt-tabela">
                <thead>
                  <tr><th scope="col">Origem</th><th scope="col">Visitas</th><th scope="col">Inícios</th><th scope="col">Inscrições</th></tr>
                </thead>
                <tbody>
                  {dados.por_origem.map((o) => (
                    <tr key={o.origem}>
                      <td>{o.origem}</td><td>{o.visitas}</td><td>{o.inicios_form}</td><td>{o.inscricoes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Bloco>
      </div>

      <Bloco titulo="Checagem operacional" descricao="O que está ligado neste ambiente. Aqui aparece só sim ou não, nunca o valor.">
        {operacao.dados ? (
          <ul className="grid gap-3">
            {CHECAGENS.map((c) => {
              const ok = operacao.dados![c.chave];
              return (
                <li key={c.chave} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{c.nome}</p>
                    {!ok ? <p className="text-sm" style={{ color: "var(--mt-cinza)" }}>{c.falta}</p> : null}
                  </div>
                  <span className={ok ? "mt-selo mt-selo--ok" : "mt-selo mt-selo--alerta"}>{ok ? "Sim" : "Não"}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <Carregando erro={operacao.erro} carregando={operacao.carregando} tentar={operacao.recarregar} />
        )}
      </Bloco>
    </div>
  );
}
