"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Check, MessageCircle, ShieldCheck } from "lucide-react";
import { signupSchema, maskPhone, maskCpf, maskDate, maskCep, isValidBirthDate } from "@/lib/validation";
import { abrirGrupo } from "@/lib/whatsapp-grupos";

/**
 * INSCRIÇÃO DA HOME
 *
 * O CPF é a porta de entrada. A partir dele a pessoa cai em um de três
 * caminhos, sem nunca precisar saber em qual base está:
 *
 *   novo        → formulário completo, na ordem das colunas do cadastro
 *   incompleto  → confirma quem é e completa só o que falta
 *   completo    → confirma quem é e vai direto para o grupo do WhatsApp
 *
 * Entre o CPF e qualquer dado pessoal existe sempre uma pergunta de
 * confirmação (data de nascimento ou os 4 últimos dígitos do WhatsApp). É o
 * que impede alguém com uma lista de CPFs de ler a base do clube.
 */

type Etapa = "cpf" | "confirmar" | "completo" | "formulario" | "salvo";
type Desafio = "nascimento" | "whatsapp";

const emailOk = (v: string) => /\S+@\S+\.\S+/.test(v);

const CAMPO =
  "w-full rounded-xl border border-black/10 px-4 py-3 text-ink outline-none transition-colors focus:border-primary disabled:bg-black/[0.03] disabled:text-muted";

function Bloco({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="pt-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Rotulo({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
      {children} <span className="text-primary">*</span>
    </label>
  );
}

export function SignupForm() {
  const router = useRouter();

  const [etapa, setEtapa] = useState<Etapa>("cpf");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  // Identificação
  const [cpf, setCpf] = useState("");
  const [desafio, setDesafio] = useState<Desafio>("nascimento");
  const [dica, setDica] = useState("");
  const [resposta, setResposta] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [origem, setOrigem] = useState<"cadastro" | "checkin" | "nenhuma">("nenhuma");
  const [faltando, setFaltando] = useState<string[]>([]);

  // Cadastro
  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    data_nascimento: "",
    whatsapp: "",
    cep: "",
    sexo: "",
  });
  const [endereco, setEndereco] = useState<string | null>(null);
  const [consentLgpd, setConsentLgpd] = useState(false);
  const [consentImagem, setConsentImagem] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot

  const cpfOk = cpf.replace(/\D/g, "").length === 11;
  const criando = origem !== "cadastro"; // cadastro novo ou vindo de check-in

  /** CEP resolve o endereço na hora: confirma visualmente que o número está certo. */
  const cepBuscado = useRef("");
  useEffect(() => {
    const digitos = form.cep.replace(/\D/g, "");
    if (digitos.length !== 8 || cepBuscado.current === digitos) return;
    cepBuscado.current = digitos;
    let vivo = true;

    fetch(`https://brasilapi.com.br/api/cep/v1/${digitos}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivo || !d) return setEndereco(null);
        const partes = [d.street, d.neighborhood, d.city && `${d.city}/${d.state}`].filter(Boolean);
        setEndereco(partes.join(", ") || null);
      })
      .catch(() => vivo && setEndereco(null));

    return () => {
      vivo = false;
    };
  }, [form.cep]);

  /** Passo 1: o CPF existe em alguma base? */
  async function identificar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/cadastro-site/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "Não foi possível consultar agora.");

      if (data.situacao === "novo") {
        setOrigem("nenhuma");
        setEtapa("formulario");
      } else {
        setDesafio(data.desafio);
        setDica(data.dica ?? "");
        setEtapa("confirmar");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao consultar.");
    } finally {
      setStatus("idle");
    }
  }

  /** Passo 2: a pessoa prova que é ela mesma. */
  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/cadastro-site/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, resposta }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "Não conseguimos confirmar.");

      setToken(data.token);
      setOrigem(data.origem);
      setFaltando(data.faltando ?? []);
      setForm({
        nome_completo: data.dados.nome_completo ?? "",
        email: data.dados.email ?? "",
        data_nascimento: formatarDataBr(data.dados.data_nascimento),
        whatsapp: data.dados.whatsapp ? maskPhone(data.dados.whatsapp) : "",
        cep: data.dados.cep ? maskCep(data.dados.cep) : "",
        sexo: data.dados.sexo ?? "",
      });
      setEtapa(data.situacao === "completo" ? "completo" : "formulario");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao confirmar.");
    } finally {
      setStatus("idle");
    }
  }

  /** Passo 3: grava. Cadastro novo usa a rota de sempre; o resto, a de atualização. */
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (criando && (!consentLgpd || !consentImagem)) {
      setError("É preciso aceitar os dois termos para continuar.");
      return;
    }

    setStatus("loading");
    try {
      if (origem === "nenhuma") {
        const parsed = signupSchema.safeParse({
          ...form,
          cpf,
          consent_lgpd: consentLgpd,
          consent_imagem: consentImagem,
          website,
        });
        if (!parsed.success) {
          setStatus("idle");
          setError(parsed.error.issues[0]?.message ?? "Verifique os dados.");
          return;
        }

        const res = await fetch("/api/cadastro-site", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro ao enviar.");
        router.push("/obrigado");
        return;
      }

      const res = await fetch("/api/cadastro-site/atualizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "Erro ao salvar.");
      setEtapa("salvo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setStatus("idle");
    }
  }

  const caixa = "mx-auto max-w-md rounded-3xl bg-white p-7 shadow-lg md:p-8";

  // ── Etapa: CPF ────────────────────────────────────────────────────────────
  if (etapa === "cpf") {
    return (
      <form onSubmit={identificar} className={caixa} noValidate>
        <h3 className="text-xl font-bold text-ink">Comece pelo seu CPF</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Se você já participou de algum evento do Somma, a gente reconhece e adianta o resto.
        </p>

        <div className="mt-5">
          <Rotulo htmlFor="cpf">CPF</Rotulo>
          <input
            id="cpf"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={cpf}
            onChange={(e) => setCpf(maskCpf(e.target.value))}
            className={CAMPO}
            placeholder="000.000.000-00"
          />
        </div>

        {error && <p className="mt-3 text-sm text-primary">{error}</p>}

        <button
          type="submit"
          disabled={!cpfOk || status === "loading"}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continuar <ArrowRight className="h-5 w-5" /></>}
        </button>
      </form>
    );
  }

  // ── Etapa: confirmação de identidade ──────────────────────────────────────
  if (etapa === "confirmar") {
    const ehData = desafio === "nascimento";
    const respostaOk = ehData
      ? isValidBirthDate(resposta)
      : resposta.replace(/\D/g, "").length === 4;

    return (
      <form onSubmit={confirmar} className={caixa} noValidate>
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Já te conhecemos</span>
        </div>

        <h3 className="mt-3 text-xl font-bold text-ink">Confirme que é você</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {ehData
            ? "Informe sua data de nascimento para abrirmos seu cadastro."
            : "Informe os 4 últimos dígitos do seu WhatsApp para abrirmos seu cadastro."}
          {dica && <span className="mt-1 block text-ink/70">{dica}</span>}
        </p>

        <div className="mt-5">
          <Rotulo htmlFor="resposta">{ehData ? "Data de nascimento" : "4 últimos dígitos"}</Rotulo>
          <input
            id="resposta"
            type="text"
            inputMode="numeric"
            autoFocus
            value={resposta}
            onChange={(e) =>
              setResposta(ehData ? maskDate(e.target.value) : e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            className={CAMPO}
            placeholder={ehData ? "dd/mm/aaaa" : "0000"}
          />
        </div>

        {error && <p className="mt-3 text-sm text-primary">{error}</p>}

        <button
          type="submit"
          disabled={!respostaOk || status === "loading"}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Confirmar <ArrowRight className="h-5 w-5" /></>}
        </button>

        <button
          type="button"
          onClick={() => {
            setEtapa("cpf");
            setResposta("");
            setError(null);
          }}
          className="mt-3 w-full text-sm text-muted underline underline-offset-4"
        >
          Digitei o CPF errado
        </button>
      </form>
    );
  }

  // ── Etapa: cadastro em dia ────────────────────────────────────────────────
  if (etapa === "completo") {
    const primeiroNome = form.nome_completo.trim().split(" ")[0];
    return (
      <div className={caixa}>
        <div className="flex items-center gap-2 text-primary">
          <Check className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Cadastro em dia</span>
        </div>

        <h3 className="mt-3 text-xl font-bold text-ink">
          {primeiroNome ? `Tudo certo, ${primeiroNome}.` : "Tudo certo."}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Seu cadastro já está completo. Quer só entrar no grupo do WhatsApp?
        </p>

        <button
          type="button"
          onClick={abrirGrupo}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-5 w-5" />
          Entrar no grupo do WhatsApp
        </button>

        {/* Sem token não há como gravar: some o botão em vez de oferecer um
            caminho que terminaria em erro. */}
        {token && (
          <button
            type="button"
            onClick={() => setEtapa("formulario")}
            className="mt-3 w-full rounded-full border border-black/10 px-6 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-black/[0.03]"
          >
            Atualizar meus dados
          </button>
        )}
      </div>
    );
  }

  // ── Etapa: salvo ──────────────────────────────────────────────────────────
  if (etapa === "salvo") {
    return (
      <div className={caixa}>
        <div className="flex items-center gap-2 text-primary">
          <Check className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Dados atualizados</span>
        </div>
        <h3 className="mt-3 text-xl font-bold text-ink">Cadastro completo.</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Agora é só entrar no grupo e aparecer no próximo encontro, sábado às 7h.
        </p>
        <button
          type="button"
          onClick={abrirGrupo}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-5 w-5" />
          Entrar no grupo do WhatsApp
        </button>
      </div>
    );
  }

  // ── Etapa: formulário (novo cadastro ou completar o que falta) ────────────
  const nomeOk = form.nome_completo.trim().length >= 2;
  const mailOk = emailOk(form.email);
  const dataOk = isValidBirthDate(form.data_nascimento);
  const zapOk = form.whatsapp.replace(/\D/g, "").length >= 10;
  const cepOk = form.cep.replace(/\D/g, "").length === 8;
  const sexoOk = form.sexo === "masculino" || form.sexo === "feminino";
  const tudoOk = nomeOk && mailOk && dataOk && zapOk && cepOk && sexoOk;

  const novo = origem === "nenhuma";
  const precisa = (campo: string) => novo || faltando.includes(campo);

  return (
    <form onSubmit={salvar} className={caixa} noValidate>
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Não preencha</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <h3 className="text-xl font-bold text-ink">
        {novo ? "Complete sua inscrição" : faltando.length > 0 ? "Falta pouco" : "Seus dados"}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {novo
          ? "Todos os campos são obrigatórios."
          : origem === "checkin"
            ? "Aproveitamos o que já tínhamos do seu check-in. Confira e complete o restante."
            : "Confira o que está preenchido e complete o que falta. Todos os campos são obrigatórios."}
      </p>

      {/* A ordem é a mesma das colunas do cadastro */}
      <div className="mt-5">
        <Rotulo htmlFor="nome_completo">Nome completo</Rotulo>
        <input
          id="nome_completo"
          type="text"
          autoComplete="name"
          autoFocus={precisa("nome_completo")}
          value={form.nome_completo}
          onChange={(e) => setForm((f) => ({ ...f, nome_completo: e.target.value }))}
          className={CAMPO}
          placeholder="João Silva Santos"
        />
      </div>

      <Bloco show>
        <Rotulo htmlFor="email">E-mail</Rotulo>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={CAMPO}
          placeholder="seu@email.com"
        />
      </Bloco>

      <Bloco show>
        <Rotulo htmlFor="cpf_fixo">CPF</Rotulo>
        <input id="cpf_fixo" type="text" value={cpf} disabled className={CAMPO} />
      </Bloco>

      <Bloco show>
        <Rotulo htmlFor="data_nascimento">Data de nascimento</Rotulo>
        <input
          id="data_nascimento"
          type="text"
          inputMode="numeric"
          value={form.data_nascimento}
          onChange={(e) => setForm((f) => ({ ...f, data_nascimento: maskDate(e.target.value) }))}
          className={CAMPO}
          placeholder="dd/mm/aaaa"
        />
      </Bloco>

      <Bloco show>
        <Rotulo htmlFor="whatsapp">WhatsApp</Rotulo>
        <input
          id="whatsapp"
          type="tel"
          autoComplete="tel"
          value={form.whatsapp}
          onChange={(e) => setForm((f) => ({ ...f, whatsapp: maskPhone(e.target.value) }))}
          className={CAMPO}
          placeholder="(61) 99999-9999"
        />
      </Bloco>

      <Bloco show>
        <Rotulo htmlFor="cep">CEP</Rotulo>
        <input
          id="cep"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          value={form.cep}
          onChange={(e) => setForm((f) => ({ ...f, cep: maskCep(e.target.value) }))}
          className={CAMPO}
          placeholder="70000-000"
        />
        {endereco && <p className="mt-1.5 text-xs text-muted">{endereco}</p>}
      </Bloco>

      <Bloco show>
        <Rotulo htmlFor="sexo">Sexo</Rotulo>
        <div className="grid grid-cols-2 gap-3">
          {(["masculino", "feminino"] as const).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setForm((f) => ({ ...f, sexo: op }))}
              className={`rounded-xl border px-4 py-3 text-sm font-medium capitalize transition-colors ${
                form.sexo === op ? "border-primary bg-primary/5 text-primary" : "border-black/10 text-ink"
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      </Bloco>

      {criando && (
        <div className="mt-5 space-y-3 border-t border-black/5 pt-5">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
            <input type="checkbox" checked={consentLgpd} onChange={(e) => setConsentLgpd(e.target.checked)} className="mt-1 h-4 w-4 accent-[#ff2c03]" />
            <span>Aceito o Termo de Consentimento de Dados (LGPD).</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
            <input type="checkbox" checked={consentImagem} onChange={(e) => setConsentImagem(e.target.checked)} className="mt-1 h-4 w-4 accent-[#ff2c03]" />
            <span>Aceito o Termo de Uso de Imagem.</span>
          </label>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-primary">{error}</p>}

      <button
        type="submit"
        disabled={!tudoOk || status === "loading"}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-40"
      >
        {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{novo ? "Fazer parte" : "Salvar e continuar"} <ArrowRight className="h-5 w-5" /></>}
      </button>
    </form>
  );
}

/** A base grava nascimento em ISO; o formulário fala dd/mm/aaaa. */
function formatarDataBr(valor: string | null | undefined): string {
  if (!valor) return "";
  const iso = String(valor).slice(0, 10);
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return maskDate(String(valor));
  return `${m[3]}/${m[2]}/${m[1]}`;
}
