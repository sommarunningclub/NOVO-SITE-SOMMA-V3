"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TERMO_IMAGEM_URL, TERMO_LGPD_URL } from "@/lib/aceites/termos";
import { formatCPF } from "@/lib/cpf";
import { lerOrigem, medir } from "@/lib/evp/analytics";
import { CAMINHO, DESAFIOS, DISTANCIAS, DISTANCIAS_BASE, ROTULO_DISTANCIA, rotuloValor, SEM_PROVA, type DistanciaInscricao } from "@/lib/evp/config";
import {
  cadastroSchema, camposComErro, etapa1Schema, etapa2Schema, inscricaoSchema, mascararTelefone, regrasDaProva,
  SEXO_ROTULO, SEXOS, type InscricaoDados, type InscricaoForm,
} from "@/lib/evp/schema";
import type { Vagas } from "@/lib/evp/tipos";
import { EASE, gsap, semMovimento } from "../_motion";
import { Carregando, ESPERA_MS } from "./Carregando";
import { useEvento } from "./Contexto";
import { Secao, Titulo } from "./Secao";

const ETAPAS = ["CPF", "Seus dados", "Sua prova", "Revisão"] as const;
type Campo = keyof InscricaoForm;

/**
 * De onde vêm os dados da pessoa:
 *   novo    CPF que não está na base do clube: cadastro completo, criado junto com a inscrição
 *   membro  já é da base e confirmou quem é: os dados vêm preenchidos, só completa o que falta
 *   livre   já é da base mas não confirmou: preenche à mão, e o cadastro do clube não é tocado
 */
type Modo = "novo" | "membro" | "livre";
type Desafio = { tipo: "nascimento" | "whatsapp"; dica: string };
type DadosBase = { nome_completo: string; email: string; cpf: string; data_nascimento: string; whatsapp: string; cep: string; sexo: string };

type Aviso =
  | { tipo: "ja_inscrito"; email: string; lista: boolean }
  | { tipo: "fechada" | "lotado" }
  | { tipo: "erro"; texto: string }
  | null;

const etapa2ComRegras = z.object(etapa2Schema.shape).superRefine(regrasDaProva);
const CAMPOS_2: Campo[] = ["tem_assessoria", "assessoria_nome", "vai_correr", "distancia", "primeira_vez"];
const PESSOAIS: Campo[] = ["nome", "email", "telefone", "data_nascimento", "cep", "sexo"];
const SEM_CADASTRO: Campo[] = ["nome", "email", "telefone", "sexo"];

/** aaaa-mm-dd (como o banco guarda) para dd/mm/aaaa (como a pessoa digita). */
function dataBr(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v;
}
const mascararData = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2");
const mascararCep = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

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
      texto: "As inscrições abrem assim que data, horário e local estiverem confirmados. Tudo será publicado nesta página.",
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

  const [modo, setModo] = useState<Modo | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [desafio, setDesafio] = useState<Desafio | null>(null);
  const [resposta, setResposta] = useState("");
  const [erroCpf, setErroCpf] = useState("");
  const [visiveis, setVisiveis] = useState<Campo[]>(PESSOAIS);
  // Desafio Monumental: pergunta à parte. "nenhum" = vai correr só a distância escolhida.
  const [combo, setCombo] = useState<(typeof DESAFIOS)[number] | "nenhum">("nenhum");
  const cpfIdentificado = useRef("");
  const tokenCadastro = useRef<string | null>(null);

  const selo = useRef<{ valor: string; em: number } | null>(null);
  const pedindoSelo = useRef<Promise<void> | null>(null);
  const chave = useRef<string>("");
  const inicioEspera = useRef(0);
  const passo = useRef<HTMLDivElement>(null);
  const direcao = useRef(1);
  const primeira = useRef(true);

  const {
    register, handleSubmit, setValue, setError, clearErrors, setFocus, getValues, watch,
    formState: { errors },
  } = useForm<InscricaoForm, unknown, InscricaoDados>({
    resolver: zodResolver(inscricaoSchema),
    mode: "onTouched",
    defaultValues: { nome: "", email: "", telefone: "", cpf: "", data_nascimento: "", cep: "", assessoria_nome: "", aceite_marketing: false, site: "" } as unknown as InscricaoForm,
  });

  const valores = watch();
  const aberto = vagas.modo === "aberta" || vagas.modo === "lista_espera";
  const espera = vagas.modo === "lista_espera";
  const corre = valores.vai_correr === "sim";
  // O que vai para a inscrição: a combinação do Desafio, se houver; senão, a distância.
  const distanciaFinal: DistanciaInscricao | undefined = combo !== "nenhum" ? combo : valores.distancia;
  const desafiosPossiveis = DESAFIOS.filter((d) => valores.distancia && d.split("+").includes(valores.distancia));

  useEffect(() => {
    chave.current = crypto.randomUUID();
  }, []);

  // A distância escolhida no seletor ou no mapa já chega marcada aqui.
  useEffect(() => {
    if (distanciaForm && distanciaForm !== SEM_PROVA && !distanciaForm.includes("+") && getValues("distancia") !== distanciaForm) {
      setValue("distancia", distanciaForm, { shouldValidate: false });
    }
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

  function irPara(n: number) {
    direcao.current = n > etapa ? 1 : -1;
    setAviso(null);
    setEtapa(n);
  }

  function limparPessoais() {
    for (const c of PESSOAIS) setValue(c, (c === "sexo" ? undefined : "") as never);
  }

  function seguirComo(m: Modo, campos: Campo[]) {
    setModo(m);
    setVisiveis(campos);
    setDesafio(null);
    setResposta("");
    setErroCpf("");
    direcao.current = 1;
    medir("evp_form_step", { etapa: 2 });
    // Quem é da base e já tem tudo preenchido pula direto para as perguntas da prova.
    setEtapa(campos.length === 0 ? 2 : 1);
  }

  /** Etapa 1: o CPF diz se a pessoa já é da base do clube. Nenhum dado sai do servidor só com o CPF. */
  async function consultarCpf() {
    const r = etapa1Schema.shape.cpf.safeParse(getValues("cpf"));
    if (!r.success) {
      setErroCpf(r.error.issues[0]?.message ?? "CPF inválido");
      setFocus("cpf");
      medir("evp_form_error", { etapa: 1, campo: "cpf" });
      return;
    }
    const cpf = r.data;
    // Mesmo CPF de antes, já identificado: só segue.
    if (modo && cpfIdentificado.current === cpf) return irPara(visiveis.length === 0 ? 2 : 1);

    setErroCpf("");
    setConsultando(true);
    try {
      const res = await fetch("/api/cadastro-site/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf }),
      });
      const j = (await res.json().catch(() => ({}))) as { situacao?: string; desafio?: Desafio["tipo"]; dica?: string; erro?: string };
      if (res.status === 429) {
        setErroCpf(j.erro ?? "Muitas tentativas. Aguarde alguns minutos.");
      } else if (j.situacao === "confirmar" && j.desafio) {
        cpfIdentificado.current = cpf;
        tokenCadastro.current = null;
        setModo(null);
        setDesafio({ tipo: j.desafio, dica: j.dica ?? "" });
      } else {
        // CPF novo: cadastro completo. Consulta fora do ar: só os dados da inscrição.
        const novo = res.ok && j.situacao === "novo";
        cpfIdentificado.current = cpf;
        tokenCadastro.current = null;
        limparPessoais();
        seguirComo(novo ? "novo" : "livre", novo ? PESSOAIS : SEM_CADASTRO);
      }
    } catch {
      cpfIdentificado.current = cpf;
      limparPessoais();
      seguirComo("livre", SEM_CADASTRO);
    }
    setConsultando(false);
  }

  /** Confirmação de quem já é da base: acertando, os dados vêm preenchidos. */
  async function confirmarIdentidade() {
    if (!desafio) return;
    setErroCpf("");
    setConsultando(true);
    try {
      const res = await fetch("/api/cadastro-site/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpfIdentificado.current, resposta }),
      });
      const j = (await res.json().catch(() => ({}))) as { situacao?: string; token?: string | null; dados?: DadosBase; erro?: string };
      if (!res.ok || !j.dados) {
        setErroCpf(j.erro ?? "Não conseguimos confirmar. Confira e tente de novo.");
      } else {
        const d = j.dados;
        tokenCadastro.current = j.token ?? null;
        setValue("nome", d.nome_completo ?? "");
        setValue("email", d.email ?? "");
        setValue("telefone", mascararTelefone(d.whatsapp ?? ""));
        setValue("data_nascimento", dataBr(d.data_nascimento ?? ""));
        setValue("cep", mascararCep(d.cep ?? ""));
        if (d.sexo === "feminino" || d.sexo === "masculino") setValue("sexo", d.sexo);
        // Aparece na tela só o que falta ou o que veio fora do formato de hoje.
        const v = getValues();
        const ruins = new Set<string>([
          ...Object.keys(camposComErro(etapa1Schema.safeParse(v).error?.issues ?? [])),
          ...Object.keys(camposComErro(cadastroSchema.safeParse(v).error?.issues ?? [])),
        ]);
        seguirComo("membro", PESSOAIS.filter((c) => ruins.has(c)));
      }
    } catch {
      setErroCpf("Sem conexão. Confira a internet e tente de novo.");
    }
    setConsultando(false);
  }

  function validar(schema: z.ZodType, campos: Campo[], n: number): boolean {
    const r = schema.safeParse(getValues());
    clearErrors(campos);
    if (r.success) return true;
    const erros = camposComErro(r.error.issues) as Partial<Record<Campo, string>>;
    const nomes = (Object.keys(erros) as Campo[]).filter((c) => campos.includes(c));
    if (!nomes.length) return true;
    nomes.forEach((c) => setError(c, { type: "manual", message: erros[c] }));
    // Dado antigo da base que não passa na regra de hoje: o campo aparece para a pessoa corrigir.
    setVisiveis((atuais) => [...new Set([...atuais, ...nomes])]);
    setFocus(nomes[0]);
    medir("evp_form_error", { etapa: n, campo: String(nomes[0]) });
    return false;
  }

  function avancar() {
    if (etapa === 1) {
      const ok1 = validar(etapa1Schema, SEM_CADASTRO, 2);
      const ok2 = modo !== "livre" ? validar(cadastroSchema, ["data_nascimento", "cep"], 2) : true;
      if (!ok1 || !ok2) return;
    } else if (etapa === 2) {
      if (!validar(etapa2ComRegras, CAMPOS_2, 3)) return;
    }
    direcao.current = 1;
    medir("evp_form_step", { etapa: etapa + 2 });
    setEtapa((e) => Math.min(e + 1, 3));
  }

  function voltar() {
    // Da prova, quem pulou a etapa de dados volta direto para o CPF.
    irPara(etapa === 2 && visiveis.length === 0 ? 0 : etapa - 1);
  }

  /** Cadastro do clube: cria para quem é novo, completa para quem já era. Não segura a inscrição. */
  async function sincronizarCadastro(d: InscricaoDados) {
    const v = getValues();
    const base = {
      nome_completo: d.nome, email: d.email, whatsapp: mascararTelefone(d.telefone), data_nascimento: v.data_nascimento ?? "",
      cep: mascararCep(v.cep ?? ""), sexo: d.sexo, consent_lgpd: true, consent_imagem: true,
    };
    try {
      if (modo === "novo") {
        await fetch("/api/cadastro-site", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...base, cpf: formatCPF(d.cpf), website: "" }) });
      } else if (modo === "membro" && tokenCadastro.current && visiveis.length > 0) {
        await fetch("/api/cadastro-site/atualizar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...base, token: tokenCadastro.current }) });
      }
    } catch {
      /* a inscrição no Meeting já está garantida */
    }
  }

  async function enviar(dados: InscricaoDados, segundaTentativa = false): Promise<void> {
    setEnviando(true);
    setAviso(null);
    // A tela de espera entra já no clique e dura 5 s contados daqui, com a inscrição sendo gravada por trás.
    if (!segundaTentativa) {
      inicioEspera.current = Date.now();
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
          distancia: distanciaFinal,
          cpf: dados.cpf, telefone: dados.telefone, email: dados.email, nome: dados.nome,
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
        medir(j.status === "lista_espera" ? "evp_waitlist_join" : "evp_sign_up", { distancia: corre ? (distanciaFinal ?? "") : SEM_PROVA }, "inscricao");
        router.prefetch(`${CAMINHO}/obrigado?t=${encodeURIComponent(j.ticket_token)}`);
        const cadastro = sincronizarCadastro(dados);
        const falta = ESPERA_MS - (Date.now() - inicioEspera.current);
        await Promise.all([cadastro, falta > 0 ? new Promise((ok) => setTimeout(ok, falta)) : null]);
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
        const nomes = Object.keys(j.campos) as Campo[];
        nomes.forEach((c) => setError(c, { message: j.campos![c] }));
        const alvo = nomes.includes("cpf") ? 0 : nomes.some((c) => PESSOAIS.includes(c)) ? 1 : nomes.some((c) => CAMPOS_2.includes(c)) ? 2 : 3;
        setVisiveis((atuais) => [...new Set([...atuais, ...nomes.filter((c) => PESSOAIS.includes(c))])]);
        medir("evp_form_error", { etapa: alvo + 1, campo: String(nomes[0] ?? "") });
        if (alvo !== etapa) irPara(alvo);
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
    await fetch("/api/evp/reenviar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cpf: getValues("cpf") }) }).catch(() => {});
    setReenvio("feito");
  }

  const valor = rotuloValor(evento.valor_centavos);
  const campo = (nome: Campo) => ({
    "aria-invalid": errors[nome] ? ("true" as const) : undefined,
    "aria-describedby": errors[nome] ? `erro-${nome}` : undefined,
  });
  const mostra = (c: Campo) => visiveis.includes(c);
  const primeiroNome = (valores.nome ?? "").trim().split(/\s+/)[0];
  const radio = (c: "tem_assessoria" | "vai_correr" | "primeira_vez" | "sexo") => register(c, { onChange: () => clearErrors(c) });
  // O valor vem do evento: o register guarda um só onChange para todos os rádios do mesmo nome.
  const distancia = (_d: DistanciaInscricao) =>
    register("distancia", {
      onChange: (e) => {
        clearErrors("distancia");
        // Trocou a distância: a combinação escolhida antes pode não servir mais.
        setCombo("nenhum");
        escolherNoFormulario(e.target.value as DistanciaInscricao);
      },
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
            <form noValidate onSubmit={handleSubmit((d) => enviar(d))} onFocusCapture={aoComecar} className="mt-cartao p-5 sm:p-8" aria-labelledby="inscricao-titulo" data-sobe>
              {espera && (
                <p className="mb-6 rounded-xl border border-[#ffc400] bg-[rgba(255,196,0,0.08)] p-4 text-[0.95rem] leading-relaxed text-[#ffe08a]">
                  As vagas estão preenchidas. Você pode entrar na lista de espera: se uma vaga abrir, ela vai para
                  quem chegou primeiro, e a gente avisa por e-mail.
                </p>
              )}

              <ol className="mb-7 flex gap-2" aria-label="Etapas da inscrição">
                {ETAPAS.map((nome, i) => (
                  <li key={nome} className="min-w-0 flex-1" aria-current={i === etapa ? "step" : undefined}>
                    <span className="block h-1 overflow-hidden rounded-full bg-[color:var(--mt-linha-forte)]">
                      <span className="block h-full origin-left bg-[color:var(--mt-laranja)] transition-transform duration-500" style={{ transform: `scaleX(${i <= etapa ? 1 : 0})` }} />
                    </span>
                    <span className="mt-mono mt-2 block truncate text-[0.6rem]" style={{ color: i === etapa ? "var(--mt-branco)" : "var(--mt-cinza-fraco)" }}>
                      {i + 1}. {nome}
                    </span>
                  </li>
                ))}
              </ol>

              {/* Campo isca: fora da tela e fora da tabulação. */}
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>Site<input type="text" tabIndex={-1} autoComplete="off" {...register("site" as Campo)} /></label>
              </div>

              <div ref={passo}>
                {etapa === 0 && (
                  <div>
                    <h3 data-foco tabIndex={-1} className="mt-display mb-2 text-[2.2rem] outline-none">Comece pelo CPF</h3>
                    <p className="mb-6 text-[0.95rem] leading-relaxed text-[#cfcfcf]">
                      Se você já é do SOMMA Club, a gente aproveita o seu cadastro e você só completa o que faltar.
                    </p>
                    <label className="mt-campo">
                      <span className="mt-rotulo">CPF</span>
                      <input
                        className="mt-input" type="text" inputMode="numeric" autoComplete="off" enterKeyHint="next" placeholder="000.000.000-00" maxLength={14}
                        readOnly={Boolean(desafio)}
                        {...register("cpf", { onChange: (e) => { setValue("cpf", formatCPF(e.target.value)); setErroCpf(""); } })}
                        aria-invalid={erroCpf && !desafio ? "true" : undefined}
                        aria-describedby={erroCpf && !desafio ? "erro-cpf" : undefined}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void consultarCpf(); } }}
                      />
                      {!desafio && <Erro id="erro-cpf" texto={erroCpf || errors.cpf?.message} />}
                    </label>

                    {desafio && (
                      <div className="mt-5 rounded-xl border border-[color:var(--mt-laranja)] bg-[rgba(255,44,3,0.08)] p-4">
                        <p className="text-[1rem] font-semibold">Achamos um cadastro com este CPF.</p>
                        <p className="mt-1 text-[0.9rem] leading-relaxed text-[#d4d4d4]">Para a gente usar os seus dados, confirme que é você.</p>
                        <label className="mt-campo mt-4">
                          <span className="mt-rotulo">
                            {desafio.tipo === "nascimento" ? "Sua data de nascimento" : `Os 4 últimos dígitos do seu WhatsApp${desafio.dica ? ` (${desafio.dica})` : ""}`}
                          </span>
                          <input
                            className="mt-input" type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" autoFocus name="resposta"
                            placeholder={desafio.tipo === "nascimento" ? "dd/mm/aaaa" : "0000"}
                            maxLength={desafio.tipo === "nascimento" ? 10 : 4}
                            value={resposta}
                            onChange={(e) => { setErroCpf(""); setResposta(desafio.tipo === "nascimento" ? mascararData(e.target.value) : e.target.value.replace(/\D/g, "").slice(0, 4)); }}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void confirmarIdentidade(); } }}
                            aria-invalid={erroCpf ? "true" : undefined}
                            aria-describedby={erroCpf ? "erro-desafio" : undefined}
                          />
                          <Erro id="erro-desafio" texto={erroCpf} />
                        </label>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                          <button type="button" className="mt-mono min-h-11 text-left text-[0.68rem] text-[color:var(--mt-cinza)] underline underline-offset-4"
                            onClick={() => { limparPessoais(); tokenCadastro.current = null; seguirComo("livre", SEM_CADASTRO); }}>
                            Não lembro: preencher meus dados
                          </button>
                          <button type="button" className="mt-mono min-h-11 text-left text-[0.68rem] text-[color:var(--mt-cinza)] underline underline-offset-4"
                            onClick={() => { setDesafio(null); setResposta(""); setErroCpf(""); cpfIdentificado.current = ""; setFocus("cpf"); }}>
                            Usar outro CPF
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {etapa === 1 && (
                  <fieldset className="space-y-5">
                    <legend data-foco tabIndex={-1} className="mt-display mb-2 text-[2.2rem] outline-none">
                      {modo === "membro" ? `Oi, ${primeiroNome || "tudo certo"}` : "Seus dados"}
                    </legend>
                    <p className="!mt-0 text-[0.95rem] leading-relaxed text-[#cfcfcf]">
                      {modo === "membro"
                        ? "Seu cadastro no SOMMA Club já está com a gente. Falta só completar isto:"
                        : modo === "novo"
                          ? "Este CPF ainda não é da base do SOMMA Club. Com estes dados a gente faz a sua inscrição e o seu cadastro no clube."
                          : "Preencha os seus dados para a inscrição."}
                    </p>
                    {mostra("nome") && (
                      <label className="mt-campo">
                        <span className="mt-rotulo">Nome completo</span>
                        <input className="mt-input" type="text" autoComplete="name" autoCapitalize="words" enterKeyHint="next" {...register("nome")} {...campo("nome")} />
                        <Erro id="erro-nome" texto={errors.nome?.message} />
                      </label>
                    )}
                    {mostra("email") && (
                      <label className="mt-campo">
                        <span className="mt-rotulo">E-mail</span>
                        <input className="mt-input" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} enterKeyHint="next" placeholder="voce@exemplo.com" {...register("email")} {...campo("email")} />
                        <Erro id="erro-email" texto={errors.email?.message} />
                      </label>
                    )}
                    <div className="grid gap-5 sm:grid-cols-2">
                      {mostra("telefone") && (
                        <label className="mt-campo">
                          <span className="mt-rotulo">WhatsApp com DDD</span>
                          <input className="mt-input" type="tel" inputMode="tel" autoComplete="tel-national" enterKeyHint="next" placeholder="(61) 99999-9999"
                            {...register("telefone", { onChange: (e) => setValue("telefone", mascararTelefone(e.target.value)) })} {...campo("telefone")} />
                          <Erro id="erro-telefone" texto={errors.telefone?.message} />
                        </label>
                      )}
                      {mostra("data_nascimento") && modo !== "livre" && (
                        <label className="mt-campo">
                          <span className="mt-rotulo">Data de nascimento</span>
                          <input className="mt-input" type="text" inputMode="numeric" autoComplete="bday" enterKeyHint="next" placeholder="dd/mm/aaaa" maxLength={10}
                            {...register("data_nascimento", { onChange: (e) => setValue("data_nascimento", mascararData(e.target.value)) })} {...campo("data_nascimento")} />
                          <Erro id="erro-data_nascimento" texto={errors.data_nascimento?.message} />
                        </label>
                      )}
                      {mostra("cep") && modo !== "livre" && (
                        <label className="mt-campo">
                          <span className="mt-rotulo">CEP</span>
                          <input className="mt-input" type="text" inputMode="numeric" autoComplete="postal-code" enterKeyHint="next" placeholder="00000-000" maxLength={9}
                            {...register("cep", { onChange: (e) => setValue("cep", mascararCep(e.target.value)) })} {...campo("cep")} />
                          <Erro id="erro-cep" texto={errors.cep?.message} />
                        </label>
                      )}
                    </div>
                    {mostra("sexo") && (
                      <fieldset>
                        <legend className="mt-rotulo mb-2">Sexo</legend>
                        <div className="grid grid-cols-2 gap-3">
                          {SEXOS.map((s) => (
                            <label key={s} className="mt-opcao">
                              <input type="radio" value={s} {...radio("sexo")} {...campo("sexo")} />
                              <span className="mt-bolinha" aria-hidden />
                              {SEXO_ROTULO[s]}
                            </label>
                          ))}
                        </div>
                        <Erro id="erro-sexo" texto={errors.sexo?.message} />
                      </fieldset>
                    )}
                  </fieldset>
                )}

                {etapa === 2 && (
                  <div className="space-y-7">
                    <fieldset>
                      <legend data-foco tabIndex={-1} className="mt-display mb-4 text-[2.2rem] outline-none">Sua prova</legend>
                      <p className="mt-rotulo mb-3">Você já é de alguma assessoria de corrida?</p>
                      <div className="grid grid-cols-2 gap-3">
                        {(["sim", "nao"] as const).map((v) => (
                          <label key={v} className="mt-opcao">
                            <input type="radio" value={v} {...radio("tem_assessoria")} {...campo("tem_assessoria")} />
                            <span className="mt-bolinha" aria-hidden />
                            {v === "sim" ? "Sim" : "Não"}
                          </label>
                        ))}
                      </div>
                      <Erro id="erro-tem_assessoria" texto={errors.tem_assessoria?.message} />
                      {valores.tem_assessoria === "sim" && (
                        <label className="mt-campo mt-4">
                          <span className="mt-rotulo">Qual assessoria? (opcional)</span>
                          <input className="mt-input" type="text" autoComplete="organization" enterKeyHint="next" maxLength={80} {...register("assessoria_nome")} {...campo("assessoria_nome")} />
                          <Erro id="erro-assessoria_nome" texto={errors.assessoria_nome?.message} />
                        </label>
                      )}
                    </fieldset>

                    <fieldset>
                      <legend className="mt-rotulo mb-3">Você vai correr a Maratona Monumental?</legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="mt-opcao">
                          <input type="radio" value="sim" {...radio("vai_correr")} {...campo("vai_correr")} />
                          <span className="mt-bolinha" aria-hidden />
                          Vou correr
                        </label>
                        <label className="mt-opcao">
                          <input type="radio" value="nao" {...radio("vai_correr")} />
                          <span className="mt-bolinha" aria-hidden />
                          Não vou correr, só quero participar
                        </label>
                      </div>
                      <Erro id="erro-vai_correr" texto={errors.vai_correr?.message} />
                    </fieldset>

                    {corre && (
                      <>
                        <fieldset>
                          <legend className="mt-rotulo mb-3">Vai correr quanto?</legend>
                          <div className="grid grid-cols-2 gap-3">
                            {DISTANCIAS_BASE.map((d) => (
                              <label key={d} className="mt-opcao">
                                <input type="radio" value={d} {...distancia(d)} {...campo("distancia")} />
                                <span className="mt-bolinha" aria-hidden />
                                <span>
                                  <span className="block font-semibold">{DISTANCIAS[d].numero} km</span>
                                  <span className="block text-[0.78rem] text-[color:var(--mt-cinza)]">{DISTANCIAS[d].dia}, {DISTANCIAS[d].largada}</span>
                                </span>
                              </label>
                            ))}
                          </div>
                          <Erro id="erro-distancia" texto={errors.distancia?.message} />
                        </fieldset>
                        {valores.distancia && (
                          <fieldset>
                            <legend className="mt-rotulo mb-1">Vai fazer o Desafio Monumental (duas provas)?</legend>
                            <p className="mb-3 text-[0.85rem] leading-relaxed text-[color:var(--mt-cinza)]">
                              É a modalidade de quem corre uma prova no sábado e outra no domingo.
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {desafiosPossiveis.map((d) => (
                                <label key={d} className="mt-opcao">
                                  <input type="radio" name="desafio" value={d} checked={combo === d} onChange={() => setCombo(d)} />
                                  <span className="mt-bolinha" aria-hidden />
                                  {ROTULO_DISTANCIA[d].replace("Desafio Monumental · ", "")}
                                </label>
                              ))}
                              <label className="mt-opcao sm:col-span-2">
                                <input type="radio" name="desafio" value="nenhum" checked={combo === "nenhum"} onChange={() => setCombo("nenhum")} />
                                <span className="mt-bolinha" aria-hidden />
                                Nenhuma das opções acima
                              </label>
                            </div>
                          </fieldset>
                        )}
                        <fieldset>
                          <legend className="mt-rotulo mb-3">É a primeira vez que você corre essa distância?</legend>
                          <div className="grid grid-cols-2 gap-3">
                            {(["sim", "nao"] as const).map((v) => (
                              <label key={v} className="mt-opcao">
                                <input type="radio" value={v} {...radio("primeira_vez")} {...campo("primeira_vez")} />
                                <span className="mt-bolinha" aria-hidden />
                                {v === "sim" ? "Sim, é a primeira" : "Não, já corri"}
                              </label>
                            ))}
                          </div>
                          <Erro id="erro-primeira_vez" texto={errors.primeira_vez?.message} />
                        </fieldset>
                      </>
                    )}
                  </div>
                )}

                {etapa === 3 && (
                  <div>
                    <h3 data-foco tabIndex={-1} className="mt-display mb-6 text-[2.2rem] outline-none">Confira e confirme</h3>
                    <dl className="divide-y divide-[color:var(--mt-linha)] rounded-xl border border-[color:var(--mt-linha)]">
                      {[
                        { r: "CPF", v: valores.cpf, e: 0 },
                        { r: "Nome", v: valores.nome, e: 1 },
                        { r: "E-mail", v: valores.email, e: 1 },
                        { r: "WhatsApp", v: valores.telefone, e: 1 },
                        { r: "Assessoria", v: valores.tem_assessoria === "sim" ? (valores.assessoria_nome?.trim() || "Sim") : "Não", e: 2 },
                        { r: "Maratona Monumental", v: corre && distanciaFinal ? ROTULO_DISTANCIA[distanciaFinal] : "Não vou correr, só participar", e: 2 },
                        ...(corre ? [{ r: "Primeira vez na distância", v: valores.primeira_vez === "sim" ? "Sim" : "Não", e: 2 }] : []),
                      ].map((l) => (
                        <div key={l.r} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <dt className="mt-rotulo">{l.r}</dt>
                            <dd className="mt-1 break-words text-[1rem] font-medium">{l.v}</dd>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              // Corrigir um dado pessoal abre todos os campos, mesmo os que vieram do cadastro.
                              if (l.e === 1) setVisiveis(modo === "livre" ? SEM_CADASTRO : PESSOAIS);
                              irPara(l.e);
                            }}
                            className="mt-mono min-h-11 shrink-0 px-2 text-[0.68rem] text-[color:var(--mt-laranja)] underline underline-offset-4"
                          >
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
                          credenciamento{modo === "novo" ? ", cadastro no SOMMA Club" : ""} e avisos sobre este evento, conforme a{" "}
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
                  <button type="button" className="mt-botao mt-botao--linha" onClick={voltar} disabled={enviando}>Voltar</button>
                ) : <span />}
                {etapa === 0 ? (
                  <button type="button" className="mt-botao mt-botao--cheio" onClick={desafio ? confirmarIdentidade : consultarCpf} disabled={consultando} aria-busy={consultando}>
                    {consultando ? "Consultando" : desafio ? "Confirmar" : "Continuar"}
                    {!consultando && <span aria-hidden className="mt-seta">→</span>}
                  </button>
                ) : etapa < 3 ? (
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
