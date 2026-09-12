"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCPF } from "@/lib/cpf";
import { PELOTOES, PELOTOES_ROTULO, type Pelotao } from "@/lib/somma-day/event.config";
import { formatarNascimento } from "@/lib/somma-day/schema";
import { evento as rastrear } from "@/lib/somma-day/analytics";

/**
 * A inscrição, na ordem do briefing: o CPF primeiro.
 *
 * Quem já é do Somma não redigita nada — o CPF identifica, o sistema pergunta
 * só o que falta e vai direto ao pelotão. Quem nunca se cadastrou preenche uma
 * vez. Ninguém vira usuário duplicado, e ninguém consegue duas inscrições na
 * mesma edição.
 */
type Etapa = "cpf" | "dados" | "pelotao" | "indo";

/**
 * `auto` é o token de preenchimento automático do iOS. Com ele o teclado
 * oferece o nome, o e-mail e o telefone que a pessoa já tem salva no aparelho,
 * e a inscrição deixa de ser digitação. `nascimento` fica de fora de propósito:
 * é campo mascarado em dd/mm/aaaa e o autofill do sistema entrega em outro
 * formato, o que sujaria o campo em vez de ajudar.
 */
const CAMPOS = {
  nome: { rotulo: "Nome completo", placeholder: "Como está no documento", modo: "text", auto: "name" },
  email: { rotulo: "E-mail", placeholder: "voce@email.com", modo: "email", auto: "email" },
  telefone: { rotulo: "WhatsApp", placeholder: "(61) 90000-0000", modo: "tel", auto: "tel-national" },
  nascimento: { rotulo: "Nascimento", placeholder: "dd/mm/aaaa", modo: "numeric", auto: "off" },
} as const;

type CampoId = keyof typeof CAMPOS;
const TODOS: CampoId[] = ["nome", "email", "telefone", "nascimento"];

function mascararTelefone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function lerUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const c of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = p.get(c);
    if (v) utm[c] = v.slice(0, 160);
  }
  const ref = document.referrer;
  if (ref && !ref.includes(window.location.host)) utm.referral = ref.slice(0, 200);
  return utm;
}

export default function Inscricao({ aberto }: { aberto: boolean }) {
  const [etapa, setEtapa] = useState<Etapa>("cpf");
  const [cpf, setCpf] = useState("");
  const [primeiroNome, setPrimeiroNome] = useState<string | null>(null);
  const [pedir, setPedir] = useState<CampoId[]>([]);
  const [dados, setDados] = useState<Record<CampoId, string>>({
    nome: "", email: "", telefone: "", nascimento: "",
  });
  const [pelotao, setPelotao] = useState<Pelotao | "">("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [parceiro, setParceiro] = useState<string | null>(null);
  const topo = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("parceiro");
    if (p) setParceiro(p.slice(0, 60));
  }, []);

  function avancar(proxima: Etapa) {
    setEtapa(proxima);
    setAviso(null);
    // O card troca de conteúdo e pode ficar mais alto que a viewport: sem isso,
    // a pessoa não vê que a etapa mudou.
    requestAnimationFrame(() => topo.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  async function identificar(e: React.FormEvent) {
    e.preventDefault();
    if (carregando) return;
    setCarregando(true);
    setErros({});
    setAviso(null);
    rastrear("inscricao_iniciada");

    try {
      const r = await fetch("/api/edicao-especial-set-2026/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf }),
      });
      const d = await r.json().catch(() => ({}));

      if (!r.ok) {
        setErros({ cpf: d?.error ?? "Não conseguimos validar seu CPF." });
        return;
      }

      rastrear("cpf_identificado", { ja_cadastrado: Boolean(d.existe), ja_inscrito: Boolean(d.ja_inscrito) });

      if (d.ja_inscrito) {
        // Já está na lista: vai direto para a confirmação, que mostra o ticket
        // e os dados. `?ja=1` faz a página abrir dizendo "você já estava dentro"
        // em vez de comemorar uma inscrição que não acabou de acontecer.
        rastrear("ja_inscrito");
        setEtapa("indo");
        router.push(`${d.ja_inscrito.credencial_url}?ja=1`);
        return;
      }

      setPrimeiroNome(d.primeiro_nome ?? null);
      const faltando: CampoId[] = d.existe ? (d.faltando ?? []) : TODOS;
      setPedir(faltando);
      avancar(faltando.length > 0 ? "dados" : "pelotao");
    } catch {
      setAviso("Sua conexão caiu no meio do caminho. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  function confirmarDados(e: React.FormEvent) {
    e.preventDefault();
    const faltou: Record<string, string> = {};
    for (const campo of pedir) {
      if (!dados[campo].trim()) faltou[campo] = "Preencha este campo";
    }
    if (Object.keys(faltou).length > 0) {
      setErros(faltou);
      return;
    }
    rastrear("cadastro_completado", { campos: pedir.length });
    avancar("pelotao");
  }

  async function inscrever() {
    if (!pelotao) {
      setErros({ pelotao: "Escolha seu pelotão" });
      return;
    }
    if (carregando) return;
    setCarregando(true);
    setErros({});
    setAviso(null);

    try {
      const corpo: Record<string, unknown> = { cpf, pelotao, parceiro, utm: lerUtm() };
      for (const campo of pedir) corpo[campo] = dados[campo];

      const r = await fetch("/api/edicao-especial-set-2026/inscricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const d = await r.json().catch(() => ({}));

      if (!r.ok) {
        if (d?.lotado) {
          rastrear("evento_lotado");
          setAviso("As vagas desta edição acabaram. Siga o @somma.club para a próxima.");
          return;
        }
        if (d?.campos) {
          // Faltou algo no cadastro antigo: volta a perguntar, só o que falta.
          const campos = Object.keys(d.campos).filter((c): c is CampoId => c in CAMPOS);
          if (campos.length > 0) {
            setPedir(campos);
            setErros(d.campos);
            avancar("dados");
            return;
          }
          setErros(d.campos);
        }
        setAviso(d?.error ?? "Não conseguimos concluir sua inscrição.");
        return;
      }

      rastrear("inscricao_concluida", { pelotao, novo_cadastro: pedir.length === TODOS.length });
      setEtapa("indo");
      router.push(d.obrigado_url);
    } catch {
      setAviso("Sua conexão caiu no meio do caminho. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  /* ─── Inscrições fechadas ───────────────────────────────────────────────── */
  if (!aberto) {
    return (
      <div ref={topo} className="sd-sticker sd-t2 bg-white px-6 py-10 text-center sm:px-10">
        <p className="sd-display text-[clamp(2rem,6vw,3.2rem)] leading-[1] text-[var(--sd-vermelho)]">
          Inscrições
          <br />
          fechadas
        </p>
        <p className="mx-auto mt-4 max-w-md text-[15px] font-medium leading-relaxed">
          Quem segue o @somma.club fica sabendo primeiro quando abrir.
        </p>
        <a
          href="https://instagram.com/somma.club"
          target="_blank"
          rel="noopener noreferrer"
          className="sd-botao mt-7 inline-block bg-[var(--sd-tinta)] px-8 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--sd-creme)]"
        >
          Seguir o SOMMA
        </a>
      </div>
    );
  }

  if (etapa === "indo") {
    return (
      <div ref={topo} className="sd-sticker bg-white px-6 py-14 text-center">
        <p className="sd-display text-[clamp(1.8rem,5vw,2.6rem)] leading-none text-[var(--sd-vermelho)]">
          Tá dentro…
        </p>
        <p className="mt-3 text-[14px] font-semibold">Abrindo seu ticket.</p>
      </div>
    );
  }

  /* ─── Etapas do formulário ──────────────────────────────────────────────── */
  return (
    <div ref={topo} className="sd-sticker bg-white px-5 py-7 sm:px-9 sm:py-9">
      <div className="flex items-center gap-2">
        {["cpf", "dados", "pelotao"].map((e) => (
          <span
            key={e}
            className="h-[6px] flex-1 rounded-full border-2 border-[var(--sd-tinta)]"
            style={{
              background: e === etapa ? "var(--sd-vermelho)" : "transparent",
              // A etapa de dados some do indicador quando não há o que perguntar.
              opacity: e === "dados" && pedir.length === 0 && etapa !== "cpf" ? 0.25 : 1,
            }}
          />
        ))}
      </div>

      {etapa === "cpf" && (
        <form onSubmit={identificar} noValidate className="mt-7">
          <p className="sd-display text-[clamp(1.8rem,5vw,2.6rem)] leading-[1]">Começa pelo CPF</p>
          <p className="mt-3 text-[14px] font-semibold leading-relaxed">
            Se você já é do Somma, a gente te reconhece e não pede nada de novo.
          </p>

          <label className="sd-rotulo mt-6" htmlFor="sd-cpf">CPF</label>
          <input
            id="sd-cpf"
            className="sd-campo"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="go"
            value={cpf}
            onChange={(e) => {
              setCpf(formatCPF(e.target.value));
              setErros({});
            }}
            aria-invalid={Boolean(erros.cpf)}
            placeholder="000.000.000-00"
          />
          {erros.cpf && <p className="sd-erro">{erros.cpf}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="sd-botao mt-6 w-full bg-[var(--sd-vermelho)] px-8 py-5 text-base font-extrabold uppercase tracking-[0.14em] text-[var(--sd-creme)]"
          >
            {carregando ? "Procurando…" : "Continuar"}
          </button>
        </form>
      )}

      {etapa === "dados" && (
        <form onSubmit={confirmarDados} noValidate className="mt-7">
          <p className="sd-display text-[clamp(1.8rem,5vw,2.6rem)] leading-[1]">
            {primeiroNome ? `Oi, ${primeiroNome}` : "Seu cadastro"}
          </p>
          <p className="mt-3 text-[14px] font-semibold leading-relaxed">
            {primeiroNome
              ? "Falta pouco: só o que ainda não temos no seu cadastro."
              : "Primeira vez por aqui. É rápido e vale para as próximas edições."}
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {pedir.map((campo) => {
              const meta = CAMPOS[campo];
              const largo = campo === "nome";
              return (
                <div key={campo} className={largo ? "sm:col-span-2" : undefined}>
                  <label className="sd-rotulo" htmlFor={`sd-${campo}`}>{meta.rotulo}</label>
                  <input
                    id={`sd-${campo}`}
                    className="sd-campo"
                    type={meta.modo === "email" ? "email" : meta.modo === "tel" ? "tel" : "text"}
                    inputMode={meta.modo === "numeric" || meta.modo === "tel" ? "numeric" : undefined}
                    autoComplete={meta.auto}
                    autoCapitalize={campo === "nome" ? "words" : "off"}
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint={campo === pedir[pedir.length - 1] ? "go" : "next"}
                    value={dados[campo]}
                    placeholder={meta.placeholder}
                    aria-invalid={Boolean(erros[campo])}
                    onChange={(e) => {
                      const bruto = e.target.value;
                      const valor =
                        campo === "telefone" ? mascararTelefone(bruto)
                        : campo === "nascimento" ? formatarNascimento(bruto)
                        : bruto;
                      setDados((d) => ({ ...d, [campo]: valor }));
                      setErros((x) => (x[campo] ? { ...x, [campo]: "" } : x));
                    }}
                  />
                  {erros[campo] && <p className="sd-erro">{erros[campo]}</p>}
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            className="sd-botao mt-7 w-full bg-[var(--sd-tinta)] px-8 py-5 text-base font-extrabold uppercase tracking-[0.14em] text-[var(--sd-creme)]"
          >
            Continuar
          </button>
        </form>
      )}

      {etapa === "pelotao" && (
        <div className="mt-7">
          <p className="sd-display text-[clamp(1.8rem,5vw,2.6rem)] leading-[1]">
            {primeiroNome && pedir.length === 0 ? `Oi, ${primeiroNome}` : "Escolha seu pelotão"}
          </p>
          <p className="mt-3 text-[14px] font-semibold leading-relaxed">
            Largada às 08h. Não é prova nem categoria: é a distância que você quer fazer.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {PELOTOES.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={pelotao === p}
                onClick={() => {
                  setPelotao(p);
                  setErros({});
                  rastrear("pelotao_escolhido", { pelotao: p });
                }}
                className="sd-pelotao"
              >
                {PELOTOES_ROTULO[p]}
              </button>
            ))}
          </div>
          {erros.pelotao && <p className="sd-erro">{erros.pelotao}</p>}

          <button
            type="button"
            onClick={inscrever}
            disabled={carregando}
            className="sd-botao mt-7 w-full bg-[var(--sd-vermelho)] px-8 py-5 text-base font-extrabold uppercase tracking-[0.14em] text-[var(--sd-creme)]"
          >
            {carregando ? "Confirmando…" : "Garantir minha pulseira"}
          </button>
        </div>
      )}

      {aviso && (
        <p className="mt-6 border-[3px] border-[var(--sd-vermelho)] px-4 py-3 text-sm font-bold text-[var(--sd-vermelho)]">
          {aviso}
        </p>
      )}

      <p className="mt-5 text-center text-[12px] font-medium leading-relaxed text-[#6b6659]">
        Evento gratuito, inscrição obrigatória. Seus dados servem para organizar o evento e te
        avisar das próximas edições.
      </p>
    </div>
  );
}
