"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { TERMO_IMAGEM_URL, TERMO_LGPD_URL } from "@/lib/aceites/termos";
import { formatCPF } from "@/lib/cpf";
import { lerOrigem, medir } from "@/lib/evp/analytics";
import { CAMINHO, DESAFIOS, DISTANCIAS, DISTANCIAS_BASE, ROTULO_DISTANCIA, rotuloValor, type DistanciaInscricao } from "@/lib/evp/config";
import { camposComErro, etapa1Schema, etapa2Schema, inscricaoSchema, mascararTelefone, SEXO_ROTULO, SEXOS, type InscricaoDados, type InscricaoForm } from "@/lib/evp/schema";
import type { Vagas } from "@/lib/evp/tipos";
import { EASE, gsap, semMovimento } from "../_motion";
import { Carregando, ESPERA_MS } from "./Carregando";
import { useEvento } from "./Contexto";
import { Secao, Titulo } from "./Secao";

const ETAPAS = ["Identificação", "Sua prova", "Revisão"] as const;
const CAMPOS: (keyof InscricaoForm)[][] = [
  Object.keys(etapa1Schema.shape) as (keyof InscricaoForm)[],
  Object.keys(etapa2Schema.shape) as (keyof InscricaoForm)[],
  ["aceite_termos", "aceite_imagem", "aceite_marketing"],
];

type Aviso =
  | { tipo: "ja_inscrito"; email: string; lista: boolean }
  | { tipo: "fechada" | "lotado" }
  | { tipo: "erro"; texto: string }
  | null;

function Erro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} role="alert" className="mt-erro">
      <span aria-hidden>!</span>
      {texto}
    </p>
  );
}

function Fechado({ vagas }: { vagas: Vagas }) {
  const { evento } = useEvento();
  const textos: Record<string, { titulo: string; texto: string }> = {
    em_breve: {
      titulo: "Inscrições em breve",
      texto:
        "As inscrições abrem assim que data, horário e local estiverem confirmados. Tudo será publicado nesta página.",
    },
    esgotada: { titulo: "Vagas esgotadas", texto: "Todas as vagas do Meeting foram preenchidas. Se uma vaga for liberada, as inscrições reabrem aqui." },
    encerrada: { titulo: "Inscrições encerradas", texto: "O período de inscrição do Meeting Técnico terminou." },
  };
  const t = textos[vagas.modo] ?? textos.em_breve;
  return (
    <div className="mt-cartao p-6 sm:p-9" data-sobe>
      <p className="mt-pendente">{t.titulo}</p>
      <p className="mt-5 max-w-[32rem] text-[1.1rem] leading-relaxed text-[#e2e2e2]">{t.texto}</p>
      {vagas.modo === "em_breve" && (
        <a
          href={evento.contato.instagram || "https://instagram.com/somma.club"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-botao mt-botao--linha mt-6"
          onClick={() => medir("evp_cta_click", { local: "inscricao-em-breve", destino: "instagram" })}
        >
          Acompanhar pelo Instagram<span className="mt-so-leitor">, abre em nova aba</span>
        </a>
      )}
    </div>
  );
}

export function Inscricao() {
  const { vagas, evento, distanciaForm, escolherNoFormulario, atualizarVagas, definirVagas } = useEvento();
  const router = useRouter();
  const [etapa, setEtapa] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [reenvio, setReenvio] = useState<"" | "enviando" | "feito">("");
  const selo = useRef<{ valor: string; em: number } | null>(null);
  const pedindoSelo = useRef<Promise<void> | null>(null);
  const chave = useRef<string>("");
  const inicioEspera = useRef(0);
  const passo = useRef<HTMLDivElement>(null);
  const direcao = useRef(1);
  const primeira = useRef(true);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    setFocus,
    getValues,
    watch,
    formState: { errors },
  } = useForm<InscricaoForm, unknown, InscricaoDados>({
    resolver: zodResolver(inscricaoSchema),
    mode: "onTouched",
    defaultValues: { nome: "", email: "", telefone: "", cpf: "", aceite_marketing: false, site: "" } as unknown as InscricaoForm,
  });

  const valores = watch();
  const aberto = vagas.modo === "aberta" || vagas.modo === "lista_espera";
  const espera = vagas.modo === "lista_espera";

  useEffect(() => {
    chave.current = crypto.randomUUID();
  }, []);

  // A distância escolhida no seletor ou no mapa já chega marcada aqui.
  useEffect(() => {
    if (distanciaForm && getValues("distancia") !== distanciaForm) setValue("distancia", distanciaForm, { shouldValidate: false });
  }, [distanciaForm, getValues, setValue]);

  // Troca de etapa: o bloco entra pelo lado para onde a pessoa está indo.
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    const el = passo.current;
    if (!el) return;
    el.querySelector<HTMLElement>("[data-foco]")?.focus({ preventScroll: true });
    const topo = el.getBoundingClientRect().top;
    if (topo < 72 || topo > window.innerHeight * 0.6) {
      window.scrollTo({ top: window.scrollY + topo - 96, behavior: semMovimento() ? "auto" : "smooth" });
    }
    if (semMovimento()) return;
    const ctx = gsap.context(() => {
      gsap.from(el, { x: 28 * direcao.current, autoAlpha: 0, duration: 0.5, ease: EASE.out, clearProps: "all" });
    });
    return () => ctx.revert();
  }, [etapa]);

  function pedirSelo(contar: boolean): Promise<void> {
    if (pedindoSelo.current) return pedindoSelo.current;
    pedindoSelo.current = fetch("/api/evp/selo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contar, origem: lerOrigem() }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { selo?: string } | null) => {
        if (j?.selo) selo.current = { valor: j.selo, em: Date.now() };
      })
      .catch(() => {})
      .finally(() => {
        pedindoSelo.current = null;
      });
    return pedindoSelo.current;
  }

  const aoComecar = () => {
    if (selo.current || pedindoSelo.current) return;
    medir("evp_form_start", {}, "form");
    void pedirSelo(true);
  };

  /**
   * Valida só a etapa atual, direto no schema dela. O resultado não depende do
   * estado interno do formulário: corrigiu o campo, o próximo clique avança.
   */
  function avancar() {
    const r = (etapa === 0 ? etapa1Schema : etapa2Schema).safeParse(getValues());
    clearErrors(CAMPOS[etapa]);
    if (!r.success) {
      const campos = camposComErro(r.error.issues) as Partial<Record<keyof InscricaoForm, string>>;
      const nomes = Object.keys(campos) as (keyof InscricaoForm)[];
      nomes.forEach((c) => setError(c, { type: "manual", message: campos[c] }));
      if (nomes[0]) setFocus(nomes[0]);
      medir("evp_form_error", { etapa: etapa + 1, campo: String(nomes[0] ?? "") });
      return;
    }
    direcao.current = 1;
    medir("evp_form_step", { etapa: etapa + 2 });
    setEtapa((e) => Math.min(e + 1, 2));
  }

  function irPara(n: number) {
    direcao.current = n > etapa ? 1 : -1;
    setAviso(null);
    setEtapa(n);
  }

  async function enviar(dados: InscricaoDados, segundaTentativa = false): Promise<void> {
    setEnviando(true);
    setAviso(null);
    // A tela de espera entra já no clique e dura 5 s contados daqui, com a inscrição sendo gravada por trás.
    const comecou = segundaTentativa ? 0 : Date.now();
    if (!segundaTentativa) {
      inicioEspera.current = comecou;
      setCarregando(true);
    }
    try {
      if (!selo.current) await pedirSelo(true);
      // O servidor recusa selo com menos de 4 s. Quem preencheu tudo já passou disso; quem acabou de renovar, espera.
      const idade = selo.current ? Date.now() - selo.current.em : 0;
      if (selo.current && idade < 4300) await new Promise((r) => setTimeout(r, 4300 - idade));

      const r = await fetch("/api/evp/inscricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...getValues(),
          cpf: dados.cpf,
          telefone: dados.telefone,
          email: dados.email,
          nome: dados.nome,
          idempotency_key: chave.current,
          selo: selo.current?.valor ?? "",
          origem: lerOrigem(),
        }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        ok?: boolean; status?: string; ticket_token?: string; error?: string; campos?: Record<string, string>;
        ja_inscrito?: boolean; lista_espera?: boolean; email?: string; lotado?: boolean; fechada?: boolean;
        renovar_selo?: boolean; vagas?: Vagas;
      };

      if (r.ok && j.ok && j.ticket_token) {
        medir(j.status === "lista_espera" ? "evp_waitlist_join" : "evp_sign_up", { distancia: dados.distancia }, "inscricao");
        router.prefetch(`${CAMINHO}/obrigado?t=${encodeURIComponent(j.ticket_token)}`);
        const falta = ESPERA_MS - (Date.now() - inicioEspera.current);
        if (falta > 0) await new Promise((r) => setTimeout(r, falta));
        router.push(`${CAMINHO}/obrigado?t=${encodeURIComponent(j.ticket_token)}`);
        return; // a tela de espera fica até a página de obrigado abrir
      }
      if (j.renovar_selo && !segundaTentativa) {
        selo.current = null;
        await pedirSelo(false);
        return enviar(dados, true); // a tela de espera continua a mesma
      }
      if (j.vagas) definirVagas(j.vagas);
      if (r.status === 422 && j.campos) {
        const nomes = Object.keys(j.campos) as (keyof InscricaoForm)[];
        nomes.forEach((c) => setError(c, { message: j.campos![c] }));
        const alvo = CAMPOS.findIndex((grupo) => grupo.some((c) => nomes.includes(c)));
        medir("evp_form_error", { etapa: alvo + 1, campo: String(nomes[0] ?? "") });
        if (alvo >= 0 && alvo !== etapa) irPara(alvo);
        setAviso({ tipo: "erro", texto: j.error ?? "Confira os campos destacados." });
      } else if (j.ja_inscrito) {
        setAviso({ tipo: "ja_inscrito", email: j.email ?? "seu e-mail", lista: Boolean(j.lista_espera) });
      } else if (j.lotado || j.fechada) {
        setAviso({ tipo: j.lotado ? "lotado" : "fechada" });
        void atualizarVagas();
      } else {
        setAviso({ tipo: "erro", texto: j.error ?? "Não conseguimos concluir agora. Seus dados continuam aqui: tente de novo." });
      }
    } catch {
      setAviso({ tipo: "erro", texto: "Sem conexão com o servidor. Seus dados continuam aqui: confira a internet e tente de novo." });
    }
    // Não deu certo: a tela de espera sai e o aviso aparece no formulário.
    setCarregando(false);
    setEnviando(false);
  }

  async function reenviar() {
    setReenvio("enviando");
    await fetch("/api/evp/reenviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf: getValues("cpf") }),
    }).catch(() => {});
    setReenvio("feito");
  }

  const valor = rotuloValor(evento.valor_centavos);
  const campo = (nome: keyof InscricaoForm) => ({
    "aria-invalid": errors[nome] ? ("true" as const) : undefined,
    "aria-describedby": errors[nome] ? `erro-${nome}` : undefined,
  });

  return (
    <Secao id="inscricao" marco="07" rotulo="Inscrições">
      {carregando && <Carregando espera={espera} />}
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Titulo id="inscricao" linhas={["A largada", "começa com", "uma decisão."]} />
            <p data-sobe className="mt-texto mt-6 max-w-[26rem]">
              Garanta sua participação no Meeting Técnico e venha descobrir como se preparar para cada quilômetro
              da Monumental.
            </p>
            {aberto && (
              <dl data-sobe className="mt-8 grid max-w-[26rem] grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[color:var(--mt-linha)] bg-[color:var(--mt-linha)]">
                <div className="bg-[color:var(--mt-preto)] p-4">
                  <dt className="mt-rotulo">Vagas</dt>
                  <dd className="mt-mono mt-2 text-[1.25rem] tracking-normal" aria-live="polite">
                    {espera ? "Lista de espera" : `${vagas.vagas_livres} de ${vagas.capacidade}`}
                  </dd>
                </div>
                <div className="bg-[color:var(--mt-preto)] p-4">
                  <dt className="mt-rotulo">Inscrição</dt>
                  <dd className="mt-mono mt-2 text-[1.25rem] tracking-normal">{valor ?? "Em breve"}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          {!aberto ? (
            <Fechado vagas={vagas} />
          ) : (
            <form
              noValidate
              onSubmit={handleSubmit((d) => enviar(d))}
              onFocusCapture={aoComecar}
              className="mt-cartao p-5 sm:p-8"
              aria-labelledby="inscricao-titulo"
              data-sobe
            >
              {espera && (
                <p className="mb-6 rounded-xl border border-[#ffc400] bg-[rgba(255,196,0,0.08)] p-4 text-[0.95rem] leading-relaxed text-[#ffe08a]">
                  As vagas estão preenchidas. Você pode entrar na lista de espera: se uma vaga abrir, ela vai para
                  quem chegou primeiro, e a gente avisa por e-mail.
                </p>
              )}

              <ol className="mb-7 flex gap-2" aria-label="Etapas da inscrição">
                {ETAPAS.map((nome, i) => (
                  <li key={nome} className="flex-1" aria-current={i === etapa ? "step" : undefined}>
                    <span className="block h-1 overflow-hidden rounded-full bg-[color:var(--mt-linha-forte)]">
                      <span className="block h-full origin-left bg-[color:var(--mt-laranja)] transition-transform duration-500" style={{ transform: `scaleX(${i <= etapa ? 1 : 0})` }} />
                    </span>
                    <span className="mt-mono mt-2 block text-[0.62rem]" style={{ color: i === etapa ? "var(--mt-branco)" : "var(--mt-cinza-fraco)" }}>
                      {i + 1}. {nome}
                    </span>
                  </li>
                ))}
              </ol>

              {/* Campo isca: fora da tela e fora da tabulação. */}
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>Site<input type="text" tabIndex={-1} autoComplete="off" {...register("site" as keyof InscricaoForm)} /></label>
              </div>

              <div ref={passo}>
                {etapa === 0 && (
                  <fieldset className="space-y-5">
                    <legend data-foco tabIndex={-1} className="mt-display mb-6 text-[2.2rem] outline-none">Quem é você</legend>
                    <label className="mt-campo">
                      <span className="mt-rotulo">Nome completo</span>
                      <input className="mt-input" type="text" autoComplete="name" autoCapitalize="words" enterKeyHint="next" {...register("nome")} {...campo("nome")} />
                      <Erro id="erro-nome" texto={errors.nome?.message} />
                    </label>
                    <label className="mt-campo">
                      <span className="mt-rotulo">E-mail</span>
                      <input className="mt-input" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} enterKeyHint="next" placeholder="voce@exemplo.com" {...register("email")} {...campo("email")} />
                      <Erro id="erro-email" texto={errors.email?.message} />
                    </label>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="mt-campo">
                        <span className="mt-rotulo">WhatsApp com DDD</span>
                        <input className="mt-input" type="tel" inputMode="tel" autoComplete="tel-national" enterKeyHint="next" placeholder="(61) 99999-9999"
                          {...register("telefone", { onChange: (e) => setValue("telefone", mascararTelefone(e.target.value)) })} {...campo("telefone")} />
                        <Erro id="erro-telefone" texto={errors.telefone?.message} />
                      </label>
                      <label className="mt-campo">
                        <span className="mt-rotulo">CPF</span>
                        <input className="mt-input" type="text" inputMode="numeric" autoComplete="off" enterKeyHint="next" placeholder="000.000.000-00" maxLength={14}
                          {...register("cpf", { onChange: (e) => setValue("cpf", formatCPF(e.target.value)) })} {...campo("cpf")} />
                        <Erro id="erro-cpf" texto={errors.cpf?.message} />
                      </label>
                    </div>
                    <fieldset>
                      <legend className="mt-rotulo mb-2">Sexo</legend>
                      <div className="grid grid-cols-2 gap-3">
                        {SEXOS.map((s) => (
                          <label key={s} className="mt-opcao">
                            <input type="radio" value={s} {...register("sexo", { onChange: () => clearErrors("sexo") })} {...campo("sexo")} />
                            <span className="mt-bolinha" aria-hidden />
                            {SEXO_ROTULO[s]}
                          </label>
                        ))}
                      </div>
                      <Erro id="erro-sexo" texto={errors.sexo?.message} />
                    </fieldset>
                  </fieldset>
                )}

                {etapa === 1 && (
                  <div className="space-y-7">
                    <fieldset>
                      <legend data-foco tabIndex={-1} className="mt-display mb-2 text-[2.2rem] outline-none">Sua prova</legend>
                      <p className="mt-rotulo mb-3">Qual distância você vai correr?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {DISTANCIAS_BASE.map((d) => (
                          <label key={d} className="mt-opcao">
                            <input type="radio" value={d} {...register("distancia", { onChange: (e) => { clearErrors("distancia"); escolherNoFormulario(e.target.value as DistanciaInscricao); } })} {...campo("distancia")} />
                            <span className="mt-bolinha" aria-hidden />
                            <span>
                              <span className="block font-semibold">{DISTANCIAS[d].oficial}</span>
                              <span className="block text-[0.78rem] text-[color:var(--mt-cinza)]">{DISTANCIAS[d].dia}, {DISTANCIAS[d].largada}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                      <p className="mt-rotulo mb-3 mt-5">Desafio Monumental (duas provas)</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {DESAFIOS.map((d) => (
                          <label key={d} className="mt-opcao">
                            <input type="radio" value={d} {...register("distancia", { onChange: (e) => { clearErrors("distancia"); escolherNoFormulario(e.target.value as DistanciaInscricao); } })} />
                            <span className="mt-bolinha" aria-hidden />
                            {ROTULO_DISTANCIA[d].replace("Desafio Monumental · ", "")}
                          </label>
                        ))}
                      </div>
                      <Erro id="erro-distancia" texto={errors.distancia?.message} />
                    </fieldset>
                    <fieldset>
                      <legend className="mt-rotulo mb-3">É a primeira vez que você corre essa distância?</legend>
                      <div className="grid grid-cols-2 gap-3">
                        {(["sim", "nao"] as const).map((v) => (
                          <label key={v} className="mt-opcao">
                            <input type="radio" value={v} {...register("primeira_vez", { onChange: () => clearErrors("primeira_vez") })} {...campo("primeira_vez")} />
                            <span className="mt-bolinha" aria-hidden />
                            {v === "sim" ? "Sim, é a primeira" : "Não, já corri"}
                          </label>
                        ))}
                      </div>
                      <Erro id="erro-primeira_vez" texto={errors.primeira_vez?.message} />
                    </fieldset>
                  </div>
                )}

                {etapa === 2 && (
                  <div>
                    <h3 data-foco tabIndex={-1} className="mt-display mb-6 text-[2.2rem] outline-none">Confira e confirme</h3>
                    <dl className="divide-y divide-[color:var(--mt-linha)] rounded-xl border border-[color:var(--mt-linha)]">
                      {[
                        { r: "Nome", v: valores.nome, e: 0 },
                        { r: "E-mail", v: valores.email, e: 0 },
                        { r: "WhatsApp", v: valores.telefone, e: 0 },
                        { r: "CPF", v: valores.cpf, e: 0 },
                        { r: "Sexo", v: valores.sexo ? SEXO_ROTULO[valores.sexo] : "", e: 0 },
                        { r: "Distância", v: valores.distancia ? ROTULO_DISTANCIA[valores.distancia] : "", e: 1 },
                        { r: "Primeira vez na distância", v: valores.primeira_vez === "sim" ? "Sim" : valores.primeira_vez === "nao" ? "Não" : "", e: 1 },
                      ].map((l) => (
                        <div key={l.r} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <dt className="mt-rotulo">{l.r}</dt>
                            <dd className="mt-1 break-words text-[1rem] font-medium">{l.v}</dd>
                          </div>
                          <button type="button" onClick={() => irPara(l.e)} className="mt-mono min-h-11 shrink-0 px-2 text-[0.68rem] text-[color:var(--mt-laranja)] underline underline-offset-4">
                            Corrigir<span className="mt-so-leitor"> {l.r}</span>
                          </button>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-6 space-y-3">
                      <label className="mt-check">
                        <input type="checkbox" {...register("aceite_termos", { onChange: () => clearErrors("aceite_termos") })} {...campo("aceite_termos")} />
                        <span className="text-[0.92rem] leading-relaxed text-[#d4d4d4]">
                          Aceito participar do Meeting Técnico e autorizo o uso dos meus dados para inscrição,
                          credenciamento e avisos sobre este evento, conforme a{" "}
                          <a href={TERMO_LGPD_URL} target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.
                        </span>
                      </label>
                      <Erro id="erro-aceite_termos" texto={errors.aceite_termos?.message} />
                      <label className="mt-check">
                        <input type="checkbox" {...register("aceite_imagem", { onChange: () => clearErrors("aceite_imagem") })} {...campo("aceite_imagem")} />
                        <span className="text-[0.92rem] leading-relaxed text-[#d4d4d4]">
                          Aceito o <a href={TERMO_IMAGEM_URL} target="_blank" rel="noopener noreferrer">Termo de Uso de Imagem</a> do
                          SOMMA Club: o encontro pode ser fotografado e filmado.
                        </span>
                      </label>
                      <Erro id="erro-aceite_imagem" texto={errors.aceite_imagem?.message} />
                      <label className="mt-check border-t border-[color:var(--mt-linha)] pt-4">
                        <input type="checkbox" {...register("aceite_marketing")} />
                        <span className="text-[0.92rem] leading-relaxed text-[#d4d4d4]">
                          Quero receber novidades e convites do SOMMA Club e da BORA Assessoria por e-mail e
                          WhatsApp. <span className="text-[color:var(--mt-cinza)]">Opcional: a inscrição vale sem isso.</span>
                        </span>
                      </label>
                    </div>
                    <p className="mt-5 text-[0.8rem] leading-relaxed text-[color:var(--mt-cinza)]">
                      Seu CPF é guardado cifrado e serve só para garantir uma inscrição por pessoa. Ele não aparece
                      no ingresso nem no QR Code.
                    </p>
                  </div>
                )}
              </div>

              <div aria-live="assertive" className="mt-6">
                {aviso?.tipo === "erro" && <p role="alert" className="rounded-xl border border-[#ff6b6b] bg-[rgba(255,107,107,0.08)] p-4 text-[0.95rem] text-[#ffb3b3]">{aviso.texto}</p>}
                {(aviso?.tipo === "lotado" || aviso?.tipo === "fechada") && (
                  <p role="alert" className="rounded-xl border border-[#ffc400] bg-[rgba(255,196,0,0.08)] p-4 text-[0.95rem] text-[#ffe08a]">
                    {aviso.tipo === "lotado"
                      ? "As vagas acabaram enquanto você preenchia. Sua inscrição não foi registrada."
                      : "As inscrições foram encerradas. Sua inscrição não foi registrada."}
                  </p>
                )}
                {aviso?.tipo === "ja_inscrito" && (
                  <div role="alert" className="rounded-xl border border-[color:var(--mt-linha-forte)] bg-[color:var(--mt-preto)] p-4">
                    <p className="text-[1rem] font-semibold">Este CPF já tem inscrição no Meeting{aviso.lista ? ", na lista de espera" : ""}.</p>
                    <p className="mt-1.5 text-[0.92rem] leading-relaxed text-[#cfcfcf]">
                      A confirmação foi enviada para {aviso.email}. Não achou? A gente manda de novo para o mesmo e-mail.
                    </p>
                    <button type="button" onClick={reenviar} disabled={reenvio !== ""} className="mt-botao mt-botao--linha mt-botao--pequeno mt-3">
                      {reenvio === "feito" ? "Confirmação reenviada" : reenvio === "enviando" ? "Enviando" : "Reenviar confirmação"}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                {etapa > 0 ? (
                  <button type="button" className="mt-botao mt-botao--linha" onClick={() => irPara(etapa - 1)} disabled={enviando}>Voltar</button>
                ) : <span />}
                {etapa < 2 ? (
                  <button type="button" className="mt-botao mt-botao--cheio" onClick={avancar}>
                    Continuar<span aria-hidden className="mt-seta">→</span>
                  </button>
                ) : (
                  <button type="submit" className="mt-botao mt-botao--cheio" disabled={enviando} aria-busy={enviando}>
                    {enviando ? "Confirmando" : espera ? "Entrar na lista de espera" : "Garantir minha vaga"}
                    {!enviando && <span aria-hidden className="mt-seta">→</span>}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </Secao>
  );
}
