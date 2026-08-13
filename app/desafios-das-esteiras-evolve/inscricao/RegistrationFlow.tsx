"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CATEGORIAS,
  EVENT,
  EVENT_PATH,
  PARTICIPACAO_LABELS,
  SOMMA_BASE,
  UNITS,
  UNIT_LABELS,
  VAGAS_POR_CATEGORIA,
  getUnit,
  inscricoesAbertas,
  vagasStatus,
  vagasTexto,
  type EventUnit,
  type Participacao,
  type Sexo,
} from "@/lib/desafio-esteiras/event.config";
import { formatCPF } from "@/lib/cpf";
import { formatBirthDate, formatPhone, step2Schema } from "@/lib/desafio-esteiras/schema";
import { readAttribution, track } from "@/lib/desafio-esteiras/analytics";
import { gsap, prefersReducedMotion } from "../_motion";
import { Logos } from "../_components/Logos";
import { FotoPicker } from "../_components/FotoPicker";
import { statsPorUnidade, useLiveStats, type StatsIniciais } from "../_components/useLiveStats";

type Etapa = 1 | 2 | 3 | 4;

/** Espelha o schema do servidor, sem os campos que só a API preenche. */
const formSchema = step2Schema.extend({
  aceite_termos: z.boolean().refine((v) => v, "É necessário aceitar os termos"),
});
type FormValues = z.input<typeof formSchema>;

const ETAPAS: { n: Etapa; titulo: string }[] = [
  { n: 1, titulo: "Sua unidade" },
  { n: 2, titulo: "Sua participação" },
  { n: 3, titulo: "Seus dados" },
  { n: 4, titulo: "Confirmação" },
];

export function RegistrationFlow({ iniciais }: { iniciais: StatsIniciais }) {
  const router = useRouter();
  const params = useSearchParams();
  const stats = useLiveStats(iniciais, 60_000);
  const unidades = statsPorUnidade(stats);

  const unidadeDaUrl = useMemo(() => getUnit(params.get("unidade")), [params]);
  const [unidade, setUnidade] = useState<EventUnit | null>(unidadeDaUrl);
  const [etapa, setEtapa] = useState<Etapa>(unidadeDaUrl ? 2 : 1);
  const [foto, setFoto] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroApi, setErroApi] = useState<{ msg: string; token?: string } | null>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as never,
    mode: "onBlur",
    defaultValues: { aceite_termos: false, participacao: "competidor" },
  });

  const valores = watch();
  const participacao = (valores.participacao ?? "competidor") as Participacao;
  const competidor = participacao === "competidor";
  /** Vagas da unidade escolhida — é o que decide se a categoria ainda aceita gente. */
  const unidadeStats = unidade ? unidades.find((u) => u.id === unidade.id) : null;

  useEffect(() => {
    track("begin_registration", { origem: "pagina_inscricao", unidade: unidadeDaUrl?.id ?? null });
    if (unidadeDaUrl) track("select_unit", { unidade: unidadeDaUrl.id, origem: "deep_link" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animarEntrada = useCallback(() => {
    if (!painelRef.current || prefersReducedMotion()) return;
    gsap.fromTo(
      painelRef.current.querySelectorAll(".etapa-anim"),
      { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.06 }
    );
  }, []);

  useEffect(() => {
    animarEntrada();
    track("registration_step", { etapa, unidade: unidade?.id ?? null });
    painelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa]);

  function escolher(u: EventUnit) {
    setUnidade(u);
    track("select_unit", { unidade: u.id, origem: "fluxo_inscricao" });
    setEtapa(2);
  }

  async function avancarParticipacao() {
    const ok = await trigger(["participacao", "sexo"]);
    if (ok) setEtapa(3);
  }

  async function avancarDados() {
    const ok = await trigger(["full_name", "cpf", "birth_date", "email", "phone"]);
    if (ok) setEtapa(4);
  }

  /**
   * A foto é enviada depois da inscrição: o upload precisa de um registro a que
   * se vincular, e é o `ticket_token` recém-criado que autoriza. Se o upload
   * falhar, a inscrição continua válida — a pessoa adiciona a foto depois pela
   * tela "Alterar meus dados".
   */
  async function enviarFoto(ticketToken: string) {
    if (!foto) return;
    try {
      const fd = new FormData();
      fd.append("foto", foto);
      fd.append("ticket_token", ticketToken);
      await fetch("/api/desafio-esteiras/foto", { method: "POST", body: fd });
    } catch {
      /* silencioso de propósito: não travar a confirmação por causa da foto */
    }
  }

  async function enviar(values: FormValues) {
    if (!unidade || enviando) return;
    setErroApi(null);
    setEnviando(true);

    try {
      const res = await fetch("/api/desafio-esteiras/inscricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          unit_id: unidade.id,
          ...readAttribution(),
          website: honeypot.current?.value ?? "",
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        ticket_token?: string | null;
        error?: string;
        ja_inscrito?: boolean;
      };

      if (!res.ok) {
        setErroApi({ msg: data.error ?? "Não foi possível concluir.", token: data.ticket_token ?? undefined });
        setEnviando(false);
        return;
      }

      track("complete_registration", { unidade: unidade.id, participacao });

      if (data.ticket_token) {
        await enviarFoto(data.ticket_token);
        router.push(`${EVENT_PATH}/confirmado/${data.ticket_token}`);
      } else {
        router.push(EVENT_PATH);
      }
    } catch {
      setErroApi({ msg: "Falha de conexão. Verifique sua internet e tente novamente." });
      setEnviando(false);
    }
  }

  if (!inscricoesAbertas()) {
    return (
      <div className="dst-wrap flex min-h-[70svh] flex-col items-center justify-center text-center">
        <h1 className="dst-display text-[clamp(2rem,8vw,4rem)]">INSCRIÇÕES ENCERRADAS</h1>
        <p className="mt-4 max-w-[46ch] text-[color:rgba(242,240,236,0.65)]">
          As inscrições para o Desafio das Esteiras não estão abertas no momento.
        </p>
        <Link href={EVENT_PATH} className="dst-btn mt-8">
          Voltar para o evento
        </Link>
      </div>
    );
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

      <ol className="mt-6 flex gap-1.5" aria-label="Etapas da inscrição">
        {ETAPAS.map((e) => {
          const feita = etapa > e.n;
          const atual = etapa === e.n;
          return (
            <li key={e.n} className="min-w-0 flex-1">
              <button
                type="button"
                disabled={e.n > etapa}
                onClick={() => e.n < etapa && setEtapa(e.n)}
                aria-current={atual ? "step" : undefined}
                className="flex min-h-[44px] w-full flex-col justify-center text-left disabled:cursor-default"
              >
                <span
                  className="block h-[3px] w-full transition-colors duration-500"
                  style={{ background: feita || atual ? "var(--energia)" : "var(--line)" }}
                />
                <span
                  className="dst-label mt-2.5 block truncate"
                  style={{ color: atual ? "var(--somma)" : "rgba(242,240,236,0.4)" }}
                >
                  <span className="dst-num mr-1.5">0{e.n}</span>
                  <span className="hidden sm:inline">{e.titulo}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div ref={painelRef} className="mt-8 scroll-mt-6 md:mt-12">
        <form onSubmit={handleSubmit(enviar)} noValidate>
          <input
            ref={honeypot}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
          />

          {/* ── ETAPA 1 — unidade ── */}
          {etapa === 1 && (
            <section aria-labelledby="etapa1">
              <h1 id="etapa1" className="etapa-anim dst-display text-[clamp(2rem,8vw,4rem)]">
                ESCOLHA
                <br />
                SUA UNIDADE
              </h1>
              <p className="etapa-anim mt-4 max-w-[52ch] text-[color:rgba(242,240,236,0.6)]">
                As quatro unidades correm o mesmo desafio, na mesma hora. A equipe do SOMMA Club
                estará em Vicente Pires.
              </p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {UNITS.map((u) => {
                  const d = unidades.find((x) => x.id === u.id);
                  const st = d?.status ?? u.status;
                  const bloqueada = st === "esgotada" || st === "encerrada";
                  return (
                    <li key={u.id} className="etapa-anim">
                      <button
                        type="button"
                        disabled={bloqueada}
                        onClick={() => escolher(u)}
                        className="dst-panel group flex w-full items-center justify-between gap-4 p-5 text-left transition-colors disabled:opacity-45"
                        style={{ borderColor: u.sommaBase ? "rgba(255,44,4,0.5)" : undefined }}
                      >
                        <span className="min-w-0">
                          <span className="dst-display block text-[clamp(1.2rem,4.5vw,1.7rem)]">
                            {u.curto}
                          </span>
                          <span className="dst-label mt-1.5 block text-[color:rgba(242,240,236,0.4)]">
                            {u.cidade}/{u.uf}
                          </span>
                          {u.sommaBase && (
                            <span className="dst-label mt-2.5 inline-block bg-[color:var(--somma)] px-2 py-1 text-[0.5rem] text-[color:var(--ink)]">
                              {SOMMA_BASE.selo}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-right">
                          <span
                            className="dst-num block text-2xl font-bold"
                            style={{ color: bloqueada ? "rgba(242,240,236,0.4)" : "var(--somma)" }}
                          >
                            {(d?.inscritos ?? 0).toLocaleString("pt-BR")}
                          </span>
                          <span className="dst-label mt-1 block text-[0.5rem] text-[color:rgba(242,240,236,0.4)]">
                            {bloqueada ? UNIT_LABELS[st] : "inscritos"}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ── ETAPA 2 — participação, categoria e foto ── */}
          {etapa === 2 && unidade && (
            <section aria-labelledby="etapa2">
              <h1 id="etapa2" className="etapa-anim dst-display text-[clamp(2rem,8vw,4rem)]">
                COMO VOCÊ
                <br />
                VAI PARTICIPAR
              </h1>
              <p className="etapa-anim dst-label mt-4 flex flex-wrap items-center gap-2 text-[color:rgba(242,240,236,0.5)]">
                Unidade escolhida:
                <span style={{ color: "var(--somma)" }}>{unidade.nome}</span>
                <button
                  type="button"
                  onClick={() => setEtapa(1)}
                  className="underline underline-offset-4 hover:text-[color:var(--paper)]"
                >
                  trocar
                </button>
              </p>

              <fieldset className="etapa-anim mt-8">
                <legend className="dst-label mb-3 text-[color:rgba(242,240,236,0.45)]">
                  Vai competir ou só assistir?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(Object.keys(PARTICIPACAO_LABELS) as Participacao[]).map((p) => {
                    const ativo = participacao === p;
                    return (
                      <label
                        key={p}
                        className="dst-panel cursor-pointer p-5 transition-colors"
                        style={{
                          borderColor: ativo ? "var(--somma)" : "var(--line)",
                          background: ativo ? "rgba(255,44,4,0.08)" : "var(--ink-2)",
                        }}
                      >
                        <input
                          type="radio"
                          value={p}
                          {...register("participacao")}
                          className="sr-only"
                        />
                        <span className="dst-display block text-[1.15rem]">
                          {PARTICIPACAO_LABELS[p].titulo}
                        </span>
                        <span className="mt-2 block text-[0.88rem] leading-relaxed text-[color:rgba(242,240,236,0.6)]">
                          {PARTICIPACAO_LABELS[p].texto}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="etapa-anim mt-8">
                <legend className="dst-label mb-3 text-[color:rgba(242,240,236,0.45)]">
                  {competidor ? "Categoria em que vai disputar" : "Categoria"}
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIAS.map((c) => {
                    const ativo = valores.sexo === c.id;
                    const vagas = unidadeStats?.categorias?.[c.id];
                    const ocupadas = vagas?.ocupadas ?? 0;
                    // Só bloqueia quem vai competir: espectador não ocupa vaga.
                    const esgotada = competidor && vagasStatus(ocupadas) === "esgotada";
                    return (
                      <label
                        key={c.id}
                        className="dst-panel flex min-h-[84px] flex-col items-center justify-center gap-1.5 p-4 text-center transition-colors has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45"
                        style={{
                          borderColor: ativo ? "var(--somma)" : "var(--line)",
                          background: ativo ? "rgba(255,44,4,0.08)" : "var(--ink-2)",
                          cursor: esgotada ? "not-allowed" : "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          value={c.id}
                          disabled={esgotada}
                          {...register("sexo")}
                          className="sr-only"
                        />
                        <span className="dst-display text-[1.1rem]">{c.curto}</span>
                        {competidor && (
                          <span
                            className="dst-label text-[0.5rem]"
                            style={{
                              color: esgotada
                                ? "var(--evolve)"
                                : vagasStatus(ocupadas) === "ultimas"
                                  ? "var(--somma)"
                                  : "rgba(242,240,236,0.45)",
                            }}
                          >
                            {esgotada
                              ? `${c.curto.toUpperCase()} ESGOTADO`
                              : vagasTexto(ocupadas)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                {competidor && (
                  <p className="dst-label mt-3 leading-relaxed text-[color:rgba(242,240,236,0.4)]">
                    A disputa é separada em feminino e masculino.
                  </p>
                )}
                {errors.sexo && (
                  <p role="alert" className="dst-label mt-3 text-[color:var(--evolve)]">
                    {errors.sexo.message}
                  </p>
                )}
              </fieldset>

              {competidor && (
                <div className="etapa-anim mt-8">
                  <p className="dst-label mb-3 text-[color:rgba(242,240,236,0.45)]">
                    Foto de perfil
                  </p>
                  <FotoPicker
                    nome={valores.full_name ?? ""}
                    unitId={unidade.id}
                    onChange={setFoto}
                  />
                  <p className="dst-label mt-3 leading-relaxed text-[color:rgba(242,240,236,0.4)]">
                    Ela aparece na grade de competidores da página do evento.
                  </p>
                </div>
              )}

              <div className="etapa-anim mt-9 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={avancarParticipacao} className="dst-btn flex-1">
                  Continuar
                </button>
                <button
                  type="button"
                  onClick={() => setEtapa(1)}
                  className="dst-btn dst-btn--ghost sm:w-auto"
                >
                  Voltar
                </button>
              </div>
            </section>
          )}

          {/* ── ETAPA 3 — dados ── */}
          {etapa === 3 && unidade && (
            <section aria-labelledby="etapa3">
              <h1 id="etapa3" className="etapa-anim dst-display text-[clamp(2rem,8vw,4rem)]">
                SEUS DADOS
              </h1>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <Campo
                  id="full_name"
                  rotulo="Nome completo"
                  erro={errors.full_name?.message}
                  className="sm:col-span-2"
                  props={{ ...register("full_name"), autoComplete: "name", autoCapitalize: "words" }}
                />
                <Campo
                  id="cpf"
                  rotulo="CPF"
                  erro={errors.cpf?.message}
                  props={{
                    ...register("cpf"),
                    inputMode: "numeric",
                    maxLength: 14,
                    value: valores.cpf ?? "",
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                      setValue("cpf", formatCPF(e.target.value), { shouldValidate: false }),
                  }}
                />
                <Campo
                  id="birth_date"
                  rotulo="Data de nascimento"
                  erro={errors.birth_date?.message}
                  props={{
                    ...register("birth_date"),
                    type: "text",
                    inputMode: "numeric",
                    autoComplete: "bday",
                    maxLength: 10,
                    value: formatBirthDate(String(valores.birth_date ?? "")),
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                      setValue("birth_date", formatBirthDate(e.target.value), { shouldValidate: false }),
                  }}
                />
                <Campo
                  id="email"
                  rotulo="E-mail"
                  erro={errors.email?.message}
                  props={{ ...register("email"), type: "email", inputMode: "email", autoComplete: "email" }}
                />
                <Campo
                  id="phone"
                  rotulo="Telefone / WhatsApp"
                  erro={errors.phone?.message}
                  props={{
                    ...register("phone"),
                    inputMode: "tel",
                    autoComplete: "tel",
                    maxLength: 16,
                    value: valores.phone ?? "",
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                      setValue("phone", formatPhone(e.target.value), { shouldValidate: false }),
                  }}
                />
              </div>

              <div className="etapa-anim mt-9 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={avancarDados} className="dst-btn flex-1">
                  Continuar
                </button>
                <button
                  type="button"
                  onClick={() => setEtapa(2)}
                  className="dst-btn dst-btn--ghost sm:w-auto"
                >
                  Voltar
                </button>
              </div>
            </section>
          )}

          {/* ── ETAPA 4 — confirmação ── */}
          {etapa === 4 && unidade && (
            <section aria-labelledby="etapa4">
              <h1 id="etapa4" className="etapa-anim dst-display text-[clamp(2rem,8vw,4rem)]">
                CONFIRME SUA
                <br />
                PARTICIPAÇÃO
              </h1>

              <dl className="etapa-anim dst-panel mt-8 divide-y divide-[color:var(--line)]">
                {[
                  { k: "Nome", v: valores.full_name },
                  { k: "Participação", v: PARTICIPACAO_LABELS[participacao].titulo },
                  {
                    k: "Categoria",
                    v: CATEGORIAS.find((c) => c.id === (valores.sexo as Sexo))?.curto ?? "—",
                  },
                  { k: "Foto", v: foto ? foto.name : "Sem foto (avatar padrão)" },
                  { k: "Unidade", v: unidade.nome },
                  { k: "Endereço", v: unidade.endereco },
                  { k: "Data", v: EVENT.dataExtenso },
                  { k: "Horário", v: EVENT.horaExtenso },
                  { k: "E-mail", v: valores.email },
                  { k: "Telefone", v: valores.phone },
                ]
                  // quem só vai assistir não tem foto na grade, então a linha some
                  .filter((l) => l.k !== "Foto" || competidor)
                  .map((linha) => (
                    <div key={linha.k} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6 sm:p-5">
                      <dt className="dst-label w-32 shrink-0 pt-0.5 text-[color:rgba(242,240,236,0.4)]">
                        {linha.k}
                      </dt>
                      <dd className="break-words text-[0.98rem] leading-relaxed">{linha.v}</dd>
                    </div>
                  ))}
              </dl>

              <label className="etapa-anim mt-7 flex cursor-pointer items-start gap-3.5">
                <input
                  type="checkbox"
                  {...register("aceite_termos")}
                  className="mt-1 h-5 w-5 shrink-0 accent-[color:var(--somma)]"
                  aria-invalid={errors.aceite_termos ? "true" : undefined}
                />
                <span className="text-[0.9rem] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
                  Confirmo que os dados acima são meus e verdadeiros e autorizo o uso deles pela
                  Evolve e pelo SOMMA Club para a organização e comunicação deste evento.
                  {competidor && (
                    <>
                      {" "}
                      Como vou competir, autorizo que meu <strong>primeiro nome, categoria,
                      unidade e foto de perfil</strong> apareçam publicamente na página do evento.
                    </>
                  )}{" "}
                  Declaro estar ciente de que devo respeitar as regras operacionais da unidade no
                  dia.{" "}
                  <Link
                    href="/politica-de-privacidade"
                    target="_blank"
                    className="underline underline-offset-4 hover:text-[color:var(--somma)]"
                  >
                    Política de privacidade
                  </Link>
                  .
                </span>
              </label>
              {errors.aceite_termos && (
                <p role="alert" className="dst-label mt-2 text-[color:var(--evolve)]">
                  {errors.aceite_termos.message}
                </p>
              )}

              {erroApi && (
                <div
                  role="alert"
                  className="mt-6 border border-[color:var(--evolve)] bg-[rgba(224,38,27,0.1)] p-4"
                >
                  <p className="text-[0.95rem]">{erroApi.msg}</p>
                  {erroApi.token && (
                    <Link
                      href={`${EVENT_PATH}/confirmado/${erroApi.token}`}
                      className="dst-label mt-3 inline-block underline underline-offset-4"
                      style={{ color: "var(--somma)" }}
                    >
                      Ver meu ticket →
                    </Link>
                  )}
                  {erroApi.msg.includes("já tem inscrição") && (
                    <Link
                      href={`${EVENT_PATH}/meu-cadastro`}
                      className="dst-label mt-3 block underline underline-offset-4"
                      style={{ color: "var(--somma)" }}
                    >
                      Alterar meus dados →
                    </Link>
                  )}
                </div>
              )}

              <div className="etapa-anim mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="submit" disabled={enviando} className="dst-btn flex-1 disabled:opacity-60">
                  {enviando ? "Confirmando…" : "Confirmar minha inscrição"}
                </button>
                <button
                  type="button"
                  onClick={() => setEtapa(3)}
                  disabled={enviando}
                  className="dst-btn dst-btn--ghost sm:w-auto"
                >
                  Voltar
                </button>
              </div>
            </section>
          )}
        </form>

        <p className="dst-label mt-10 border-t border-[color:var(--line)] pt-5 text-[color:rgba(242,240,236,0.4)]">
          Já se inscreveu?{" "}
          <Link
            href={`${EVENT_PATH}/meu-cadastro`}
            className="underline underline-offset-4 hover:text-[color:var(--somma)]"
          >
            Alterar meus dados
          </Link>
        </p>
      </div>
    </div>
  );
}

function Campo({
  id,
  rotulo,
  erro,
  props,
  className = "",
}: {
  id: string;
  rotulo: string;
  erro?: string;
  props: Record<string, unknown>;
  className?: string;
}) {
  return (
    <div className={`etapa-anim ${className}`}>
      <div className="dst-field-wrap">
        <input
          id={id}
          placeholder=" "
          aria-invalid={erro ? "true" : undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
          className="dst-field"
          {...props}
        />
        <label htmlFor={id} className="dst-field-label">
          {rotulo}
        </label>
      </div>
      {erro && (
        <p id={`${id}-erro`} role="alert" className="dst-label mt-2 text-[color:var(--evolve)]">
          {erro}
        </p>
      )}
    </div>
  );
}
