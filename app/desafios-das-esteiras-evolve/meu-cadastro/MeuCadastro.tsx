"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  CATEGORIAS,
  EVENT,
  EVENT_PATH,
  PARTICIPACAO_LABELS,
  UNITS,
  inscricoesAbertas,
  type Participacao,
  type Sexo,
} from "@/lib/desafio-esteiras/event.config";
import { formatCPF } from "@/lib/cpf";
import { nomeDigitando } from "@/lib/desafio-esteiras/nome";
import { formatBirthDate, formatPhone, toISODate } from "@/lib/desafio-esteiras/schema";
import { Logos } from "../_components/Logos";
import { FotoPicker } from "../_components/FotoPicker";

interface Cadastro {
  full_name: string;
  email: string;
  phone: string;
  unit_id: string;
  sexo: Sexo | null;
  participacao: Participacao;
  foto_url: string | null;
  ticket_code: string;
  ticket_token: string;
}

/**
 * "Alterar meus dados".
 *
 * O acesso pede CPF + data de nascimento; o servidor devolve um token curto e é
 * ele que autoriza a escrita. Assim o CPF nunca vira credencial permanente, e a
 * sessão de edição expira sozinha em 20 minutos.
 */
export function MeuCadastro() {
  const [etapa, setEtapa] = useState<"acesso" | "editar" | "salvo">("acesso");
  const [token, setToken] = useState<string | null>(null);
  const [cadastro, setCadastro] = useState<Cadastro | null>(null);
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [removerFoto, setRemoverFoto] = useState(false);
  const [transferindo, setTransferindo] = useState(false);
  const [transferido, setTransferido] = useState<{ nome: string; email: string } | null>(null);
  const transferRef = useRef<HTMLFormElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function acessar(e: React.FormEvent) {
    e.preventDefault();
    if (ocupado) return;
    setErro(null);
    setOcupado(true);

    try {
      const res = await fetch("/api/desafio-esteiras/meu-cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, birth_date: toISODate(nascimento) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível acessar.");
        return;
      }
      setToken(data.token);
      setCadastro(data.cadastro);
      setEtapa("editar");
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setOcupado(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !cadastro || ocupado) return;
    setErro(null);
    setOcupado(true);

    const form = new FormData(formRef.current!);
    const dados = {
      full_name: String(form.get("full_name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      unit_id: String(form.get("unit_id") ?? ""),
      sexo: String(form.get("sexo") ?? ""),
      participacao: String(form.get("participacao") ?? ""),
      remover_foto: removerFoto,
    };

    try {
      const res = await fetch("/api/desafio-esteiras/meu-cadastro", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, dados }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível salvar.");
        return;
      }

      // A foto sobe depois, com o mesmo token de edição.
      if (foto) {
        const fd = new FormData();
        fd.append("foto", foto);
        fd.append("token", token);
        const up = await fetch("/api/desafio-esteiras/foto", { method: "POST", body: fd });
        if (!up.ok) {
          const upErro = await up.json().catch(() => ({}));
          setErro(
            `Seus dados foram salvos, mas a foto não subiu: ${upErro.error ?? "tente de novo."}`
          );
          setEtapa("salvo");
          return;
        }
      }

      setEtapa("salvo");
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setOcupado(false);
    }
  }

  /**
   * Passa o ticket para outra pessoa. A vaga, a unidade e o horário continuam
   * os mesmos — muda o titular, e o link antigo deixa de valer.
   */
  async function transferir(e: React.FormEvent) {
    e.preventDefault();
    if (!token || transferindo) return;
    setErro(null);
    setTransferindo(true);

    const f = new FormData(transferRef.current!);
    try {
      const res = await fetch("/api/desafio-esteiras/meu-cadastro/transferir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          novo: {
            full_name: String(f.get("t_nome") ?? ""),
            cpf: String(f.get("t_cpf") ?? ""),
            birth_date: toISODate(String(f.get("t_nasc") ?? "")),
            email: String(f.get("t_email") ?? ""),
            phone: String(f.get("t_tel") ?? ""),
            sexo: String(f.get("t_sexo") ?? ""),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível transferir.");
        return;
      }
      setTransferido({ nome: data.novo_titular, email: data.email });
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setTransferindo(false);
    }
  }

  return (
    <div className="dst-wrap py-6 md:py-10">
      <div className="flex items-center justify-between gap-4 border-b border-[color:var(--line)] pb-5">
        <Link href={EVENT_PATH} aria-label="Voltar para o evento" className="flex min-h-[44px] items-center">
          <Logos className="h-5" />
        </Link>
        <span className="dst-label text-[color:rgba(242,240,236,0.45)]">
          {EVENT.dataLabel} · {EVENT.horaLabel}
        </span>
      </div>

      {/* ── ACESSO ── */}
      {etapa === "acesso" && (
        <section className="mx-auto mt-10 max-w-[440px] md:mt-16" aria-labelledby="acesso-titulo">
          <h1 id="acesso-titulo" className="dst-display text-[clamp(2rem,8vw,3.4rem)]">
            ALTERAR
            <br />
            MEUS DADOS
          </h1>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.6)]">
            Informe o CPF e a data de nascimento que você usou na inscrição. Pedimos os dois para
            garantir que ninguém acesse o seu cadastro.
          </p>

          <form onSubmit={acessar} className="mt-8">
            <div className="dst-field-wrap">
              <input
                id="acesso-cpf"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                inputMode="numeric"
                maxLength={14}
                placeholder=" "
                className="dst-field"
                required
              />
              <label htmlFor="acesso-cpf" className="dst-field-label">
                CPF
              </label>
            </div>

            <div className="dst-field-wrap mt-5">
              <input
                id="acesso-nasc"
                type="text"
                inputMode="numeric"
                autoComplete="bday"
                value={formatBirthDate(nascimento)}
                onChange={(e) => setNascimento(formatBirthDate(e.target.value))}
                maxLength={10}
                placeholder=" "
                className="dst-field"
                required
              />
              <label htmlFor="acesso-nasc" className="dst-field-label">
                Data de nascimento
              </label>
            </div>

            {erro && (
              <p role="alert" className="dst-label mt-4 leading-relaxed text-[color:var(--evolve)]">
                {erro}
              </p>
            )}

            <button type="submit" disabled={ocupado} className="dst-btn mt-7 w-full disabled:opacity-60">
              {ocupado ? "Verificando…" : "Acessar meu cadastro"}
            </button>
          </form>

          <p className="dst-label mt-8 leading-relaxed text-[color:rgba(242,240,236,0.4)]">
            Ainda não se inscreveu?{" "}
            <Link
              href={`${EVENT_PATH}/inscricao`}
              className="underline underline-offset-4 hover:text-[color:var(--somma)]"
            >
              Fazer inscrição
            </Link>
          </p>
        </section>
      )}

      {/* ── EDIÇÃO ── */}
      {etapa === "editar" && cadastro && (
        <section className="mx-auto mt-10 max-w-[560px]" aria-labelledby="editar-titulo">
          <h1 id="editar-titulo" className="dst-display text-[clamp(1.8rem,7vw,3rem)]">
            OI, {cadastro.full_name.split(" ")[0].toUpperCase()}
          </h1>
          <p className="dst-label mt-3 text-[color:rgba(242,240,236,0.45)]">
            Ticket {cadastro.ticket_code}
          </p>

          <form ref={formRef} onSubmit={salvar} className="mt-8">
            <div className="dst-field-wrap">
              <input
                id="e-nome"
                name="full_name"
                defaultValue={cadastro.full_name}
                placeholder=" "
                className="dst-field"
                autoCapitalize="characters"
                spellCheck={false}
                onInput={(e) => {
                  e.currentTarget.value = nomeDigitando(e.currentTarget.value);
                }}
              />
              <label htmlFor="e-nome" className="dst-field-label">
                Nome e sobrenome
              </label>
            </div>

            <div className="dst-field-wrap mt-5">
              <input
                id="e-email"
                name="email"
                type="email"
                defaultValue={cadastro.email}
                placeholder=" "
                className="dst-field"
              />
              <label htmlFor="e-email" className="dst-field-label">
                E-mail
              </label>
            </div>

            <div className="dst-field-wrap mt-5">
              <input
                id="e-tel"
                name="phone"
                defaultValue={formatPhone(cadastro.phone)}
                onChange={(e) => (e.target.value = formatPhone(e.target.value))}
                inputMode="tel"
                maxLength={16}
                placeholder=" "
                className="dst-field"
              />
              <label htmlFor="e-tel" className="dst-field-label">
                Telefone / WhatsApp
              </label>
            </div>

            <fieldset className="mt-8">
              <legend className="dst-label mb-3 text-[color:rgba(242,240,236,0.45)]">Unidade</legend>
              {!inscricoesAbertas() && (
                <p className="dst-label mb-3 text-[color:var(--evolve)]">
                  As inscrições encerraram. A unidade não pode mais ser trocada.
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {UNITS.map((u) => (
                  <label
                    key={u.id}
                    className="dst-panel flex min-h-[56px] cursor-pointer items-center justify-center p-3 text-center has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)]"
                  >
                    <input
                      type="radio"
                      name="unit_id"
                      value={u.id}
                      defaultChecked={cadastro.unit_id === u.id}
                      disabled={!inscricoesAbertas() && cadastro.unit_id !== u.id}
                      className="sr-only"
                    />
                    <span className="dst-display text-[0.95rem]">{u.curto}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-8">
              <legend className="dst-label mb-3 text-[color:rgba(242,240,236,0.45)]">
                Vai competir ou só assistir?
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(PARTICIPACAO_LABELS) as Participacao[]).map((p) => (
                  <label
                    key={p}
                    className="dst-panel flex min-h-[56px] cursor-pointer items-center p-4 has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)]"
                  >
                    <input
                      type="radio"
                      name="participacao"
                      value={p}
                      defaultChecked={cadastro.participacao === p}
                      className="sr-only"
                    />
                    <span className="dst-display text-[0.95rem]">
                      {PARTICIPACAO_LABELS[p].titulo}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-8">
              <legend className="dst-label mb-3 text-[color:rgba(242,240,236,0.45)]">Categoria</legend>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIAS.map((c) => (
                  <label
                    key={c.id}
                    className="dst-panel flex min-h-[56px] cursor-pointer items-center justify-center p-3 has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)]"
                  >
                    <input
                      type="radio"
                      name="sexo"
                      value={c.id}
                      defaultChecked={cadastro.sexo === c.id}
                      className="sr-only"
                    />
                    <span className="dst-display text-[0.95rem]">{c.curto}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-8">
              <p className="dst-label mb-3 text-[color:rgba(242,240,236,0.45)]">Foto de perfil</p>
              <FotoPicker
                nome={cadastro.full_name}
                unitId={cadastro.unit_id}
                fotoAtualUrl={cadastro.foto_url}
                onChange={setFoto}
                onRemover={() => setRemoverFoto(true)}
              />
            </div>

            {erro && (
              <p role="alert" className="dst-label mt-6 leading-relaxed text-[color:var(--evolve)]">
                {erro}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={ocupado} className="dst-btn flex-1 disabled:opacity-60">
                {ocupado ? "Salvando…" : "Salvar alterações"}
              </button>
              <Link
                href={`${EVENT_PATH}/confirmado/${cadastro.ticket_token}`}
                className="dst-btn dst-btn--ghost sm:w-auto"
              >
                Ver meu ticket
              </Link>
            </div>
          </form>

          {/* ── Transferir o ticket ── */}
          <section className="mt-14 border-t border-[color:var(--line)] pt-10" aria-labelledby="transf-titulo">
            {transferido ? (
              <div className="dst-panel p-6" style={{ borderColor: "rgba(255,44,4,0.5)" }}>
                <h2 className="dst-display text-[1.4rem]" style={{ color: "var(--somma)" }}>
                  TICKET TRANSFERIDO
                </h2>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
                  A vaga agora é de <strong>{transferido.nome}</strong>. Enviamos o novo ticket para{" "}
                  <strong>{transferido.email}</strong>, com o QR Code válido.
                </p>
                <p className="mt-3 text-[0.88rem] leading-relaxed text-[color:rgba(242,240,236,0.55)]">
                  O seu ticket anterior deixou de valer. Você não aparece mais na grade de
                  competidores.
                </p>
                <Link href={EVENT_PATH} className="dst-btn mt-6">
                  Voltar para o evento
                </Link>
              </div>
            ) : (
              <>
                <h2 id="transf-titulo" className="dst-display text-[clamp(1.5rem,6vw,2.2rem)]">
                  TRANSFERIR MEU TICKET
                </h2>
                <p className="mt-4 max-w-[58ch] text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.65)]">
                  Não vai conseguir ir? Passe sua vaga para outra pessoa. A unidade, a categoria e o
                  horário continuam os mesmos. Muda só o titular. Informe os dados de quem vai no
                  seu lugar e o novo ticket vai direto para o e-mail dela.
                </p>
                <p className="dst-label mt-4 leading-relaxed" style={{ color: "var(--evolve)" }}>
                  Atenção: assim que confirmar, seu ticket atual deixa de valer.
                </p>

                <form ref={transferRef} onSubmit={transferir} className="mt-8 max-w-[560px]">
                  <div className="dst-field-wrap">
                    <input
                      id="t-nome"
                      name="t_nome"
                      placeholder=" "
                      className="dst-field"
                      autoCapitalize="characters"
                      spellCheck={false}
                      required
                      onInput={(e) => {
                        e.currentTarget.value = nomeDigitando(e.currentTarget.value);
                      }}
                    />
                    <label htmlFor="t-nome" className="dst-field-label">Nome e sobrenome de quem vai receber</label>
                  </div>
                  <div className="dst-field-wrap mt-5">
                    <input
                      id="t-cpf" name="t_cpf" inputMode="numeric" maxLength={14} placeholder=" " className="dst-field" required
                      onChange={(e) => (e.target.value = formatCPF(e.target.value))}
                    />
                    <label htmlFor="t-cpf" className="dst-field-label">CPF</label>
                  </div>
                  <div className="dst-field-wrap mt-5">
                    <input
                      id="t-nasc" name="t_nasc" inputMode="numeric" maxLength={10} placeholder=" " className="dst-field" required
                      onChange={(e) => (e.target.value = formatBirthDate(e.target.value))}
                    />
                    <label htmlFor="t-nasc" className="dst-field-label">Data de nascimento (dd/mm/aaaa)</label>
                  </div>
                  <div className="dst-field-wrap mt-5">
                    <input id="t-email" name="t_email" type="email" placeholder=" " className="dst-field" required />
                    <label htmlFor="t-email" className="dst-field-label">E-mail</label>
                  </div>
                  <div className="dst-field-wrap mt-5">
                    <input
                      id="t-tel" name="t_tel" inputMode="tel" maxLength={16} placeholder=" " className="dst-field" required
                      onChange={(e) => (e.target.value = formatPhone(e.target.value))}
                    />
                    <label htmlFor="t-tel" className="dst-field-label">Telefone / WhatsApp</label>
                  </div>

                  <fieldset className="mt-7">
                    <legend className="dst-label mb-3 text-[color:rgba(242,240,236,0.45)]">
                      Categoria de quem vai receber
                    </legend>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIAS.map((c) => (
                        <label
                          key={c.id}
                          className="dst-panel flex min-h-[56px] cursor-pointer items-center justify-center p-3 has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)]"
                        >
                          <input
                            type="radio" name="t_sexo" value={c.id}
                            defaultChecked={cadastro.sexo === c.id} className="sr-only" required
                          />
                          <span className="dst-display text-[0.95rem]">{c.curto}</span>
                        </label>
                      ))}
                    </div>
                    <p className="dst-label mt-3 leading-relaxed text-[color:rgba(242,240,236,0.4)]">
                      Se a categoria for diferente da sua, a vaga muda de fila e só rola se ainda houver
                      vaga nela.
                    </p>
                  </fieldset>

                  <button
                    type="submit"
                    disabled={transferindo}
                    className="dst-btn mt-8 w-full disabled:opacity-60"
                    style={{ background: "var(--evolve)" }}
                  >
                    {transferindo ? "Transferindo…" : "Confirmar transferência"}
                  </button>
                </form>
              </>
            )}
          </section>
        </section>
      )}

      {/* ── SALVO ── */}
      {etapa === "salvo" && cadastro && (
        <section className="mx-auto mt-16 max-w-[440px] text-center" aria-live="polite">
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-full"
            style={{ background: "var(--somma)" }}
            aria-hidden
          >
            <svg width="22" height="17" viewBox="0 0 18 14" fill="none">
              <path d="M1.5 7.2 6.2 12 16.5 1.5" stroke="#08080a" strokeWidth="2.6" strokeLinecap="square" />
            </svg>
          </span>
          <h1 className="dst-display mt-6 text-[clamp(1.8rem,7vw,3rem)]">TUDO CERTO</h1>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.65)]">
            Seus dados foram atualizados. Se você marcou que vai competir, sua foto e categoria
            aparecem na grade da página do evento em instantes.
          </p>
          {erro && (
            <p role="alert" className="dst-label mt-5 leading-relaxed text-[color:var(--evolve)]">
              {erro}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3">
            <Link href={`${EVENT_PATH}#competidores`} className="dst-btn">
              Ver a grade de competidores
            </Link>
            <Link
              href={`${EVENT_PATH}/confirmado/${cadastro.ticket_token}`}
              className="dst-btn dst-btn--ghost"
            >
              Ver meu ticket
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
