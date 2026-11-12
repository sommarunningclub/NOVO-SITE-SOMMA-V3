"use client";

import { useState, type FormEvent } from "react";
import { dataHora } from "@/lib/evp/formato";
import { Bloco, Campo, Carregando, Mensagem, useApi, useSecao, type Aviso, type Conta } from "./api";

type Form = { id?: string; nome: string; email: string; papel: "admin" | "operador"; ativo: boolean; senha: string };
const NOVA: Form = { nome: "", email: "", papel: "operador", ativo: true, senha: "" };

export function AbaEquipe({ sessaoId }: { sessaoId: string }) {
  const api = useApi();
  const { dados, erro, carregando, recarregar } = useSecao<Conta[]>("equipe");
  const [form, setForm] = useState<Form | null>(null);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [salvando, setSalvando] = useState(false);

  async function enviar(f: Form, sucesso: string) {
    setSalvando(true);
    setAviso(null);
    const r = await api("/api/evp/admin/equipe", { method: "POST", body: JSON.stringify(f) });
    setSalvando(false);
    if (!r.ok) {
      setAviso({ tipo: "erro", texto: r.erro });
      return false;
    }
    setAviso({ tipo: "ok", texto: sucesso });
    void recarregar();
    return true;
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (await enviar(form, form.id ? "Conta atualizada." : "Conta criada. Passe a senha para a pessoa por um canal seguro.")) setForm(null);
  }

  if (!dados) return <Carregando erro={erro} carregando={carregando} tentar={recarregar} />;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm" style={{ color: "var(--mt-cinza)" }}>
          Operador faz o credenciamento e não vê dados de contato. Admin abre o painel inteiro. Conta desativada perde o
          acesso na hora.
        </p>
        <button type="button" className="mt-botao mt-botao--cheio mt-botao--pequeno" onClick={() => { setAviso(null); setForm({ ...NOVA }); }}>
          Nova conta
        </button>
      </div>
      <Mensagem aviso={aviso} />

      {form ? (
        <Bloco titulo={form.id ? "Editar conta" : "Nova conta"}>
          <form onSubmit={salvar} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Campo rotulo="Nome">
              <input className="mt-input" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoComplete="off" />
            </Campo>
            <Campo rotulo="E-mail">
              <input className="mt-input" type="email" inputMode="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="off" autoCapitalize="none" />
            </Campo>
            <Campo rotulo="Papel">
              <select className="mt-input" value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value as Form["papel"] })}>
                <option value="operador">Operador (credenciamento)</option>
                <option value="admin">Admin (painel inteiro)</option>
              </select>
            </Campo>
            <Campo rotulo={form.id ? "Nova senha" : "Senha"} dica={form.id ? "Deixe em branco para manter a senha atual. Mínimo de 10 caracteres." : "Mínimo de 10 caracteres."}>
              <input className="mt-input" type="password" autoComplete="new-password" minLength={10} value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
            </Campo>
            <label className="mt-check sm:col-span-2">
              <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
              <span>Conta ativa</span>
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button type="submit" className="mt-botao mt-botao--cheio mt-botao--pequeno" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
              <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" onClick={() => setForm(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </Bloco>
      ) : null}

      <ul className="grid gap-3">
        {dados.map((c) => (
          <li key={c.id} className="mt-cartao flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold">
                {c.nome}
                {c.id === sessaoId ? <span style={{ color: "var(--mt-cinza)" }}> (você)</span> : null}
              </p>
              {!c.mestre ? <p className="break-all text-sm" style={{ color: "var(--mt-cinza)" }}>{c.email}</p> : null}
              <p className="mt-2 flex flex-wrap gap-2">
                <span className={c.papel === "admin" ? "mt-selo mt-selo--alerta" : "mt-selo mt-selo--fora"}>{c.papel === "admin" ? "Admin" : "Operador"}</span>
                <span className={c.ativo ? "mt-selo mt-selo--ok" : "mt-selo mt-selo--fora"}>{c.ativo ? "Ativa" : "Desativada"}</span>
                <span className="mt-selo mt-selo--fora">{c.ultimo_acesso ? `Último acesso ${dataHora(c.ultimo_acesso)}` : "Nunca entrou"}</span>
              </p>
            </div>
            {c.mestre ? (
              <p className="max-w-xs text-sm" style={{ color: "var(--mt-cinza)" }}>
                Conta da senha mestra. Só leitura: a senha fica na variável de ambiente.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="mt-botao mt-botao--linha mt-botao--pequeno"
                  onClick={() => { setAviso(null); setForm({ id: c.id, nome: c.nome, email: c.email, papel: c.papel, ativo: c.ativo, senha: "" }); window.scrollTo({ top: 0 }); }}
                >
                  Editar ou trocar senha
                </button>
                {c.id !== sessaoId ? (
                  <button
                    type="button"
                    className="mt-botao mt-botao--linha mt-botao--pequeno"
                    disabled={salvando}
                    onClick={() => void enviar({ id: c.id, nome: c.nome, email: c.email, papel: c.papel, ativo: !c.ativo, senha: "" }, c.ativo ? "Conta desativada." : "Conta reativada.")}
                  >
                    {c.ativo ? "Desativar" : "Reativar"}
                  </button>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
