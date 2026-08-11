"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, FileText, Loader2, Paperclip } from "lucide-react";
import {
  CURRICULO_ACCEPT,
  SEMESTRES,
  isAtLeastYearsOld,
  isValidBirthDate,
  maskCep,
  maskDate,
  maskPhone,
  slugifyFileName,
  vagaCandidaturaSchema,
  validateCurriculo,
} from "@/lib/validation";
import type { Vaga } from "./_vagas";

type CepResponse = {
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

const emailOk = (v: string) => /\S+@\S+\.\S+/.test(v);

// Mesma mecânica do formulário da home: cada campo aparece quando o anterior
// está "suficientemente" preenchido, sem recolher o que já foi respondido.
function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
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

const inputCls =
  "w-full rounded-xl border border-black/10 px-4 py-3 text-ink outline-none transition-colors focus:border-primary";
const labelCls = "mb-1.5 block text-sm font-medium text-ink";

export function CandidaturaForm({ vaga, onClose }: { vaga: Vaga; onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    data_nascimento: "",
    cep: "",
    logradouro: "",
    bairro: "",
    cidade: "",
    estado: "",
    complemento: "",
    instituicao: "",
    semestre: "",
    indicado_por: "",
  });
  const [indicado, setIndicado] = useState<boolean | null>(null);
  const [curriculo, setCurriculo] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  // Condições da jornada — cada uma libera o próximo passo.
  const nomeOk = form.nome.trim().length >= 3;
  const mailOk = emailOk(form.email);
  const telOk = form.telefone.replace(/\D/g, "").length >= 10;
  const dataOk =
    isValidBirthDate(form.data_nascimento) && isAtLeastYearsOld(form.data_nascimento, 16);
  const cepOk = form.cep.replace(/\D/g, "").length === 8;
  const instOk = form.instituicao.trim().length >= 2;
  const semOk = form.semestre !== "";
  // "Não" já responde a pergunta; "Sim" só avança com o nome de quem indicou.
  const indicacaoOk = indicado === false || (indicado === true && form.indicado_por.trim() !== "");
  const cvOk = curriculo !== null;

  const showEmail = nomeOk;
  const showTel = showEmail && mailOk;
  const showNascCep = showTel && telOk;
  const showEndereco = showNascCep && dataOk && cepOk;
  const showInst = showEndereco;
  const showSem = showInst && instOk;
  const showIndicacao = showSem && semOk;
  const showCv = showIndicacao && indicacaoOk;
  const showFinish = showCv && cvOk;

  // CEP → endereço completo pela BrasilAPI (a mesma usada no checkout do site).
  async function fetchAddress(cepDigits: string) {
    setCepLoading(true);
    setCepError(null);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepDigits}`);
      if (!res.ok) throw new Error();
      const data: CepResponse = await res.json();
      setForm((f) => ({
        ...f,
        logradouro: data.street || "",
        bairro: data.neighborhood || "",
        cidade: data.city || "",
        estado: data.state || "",
      }));
    } catch {
      // Falha na consulta não bloqueia a candidatura: liberamos o preenchimento manual.
      setCepError("Não encontramos esse CEP. Preencha o endereço manualmente.");
      setForm((f) => ({ ...f, logradouro: "", bairro: "", cidade: "", estado: "" }));
    } finally {
      setCepLoading(false);
    }
  }

  function handleCep(raw: string) {
    const masked = maskCep(raw);
    set("cep", masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length === 8) fetchAddress(digits);
    else setCepError(null);
  }

  function handleFile(file: File | null) {
    const message = file ? validateCurriculo(file) : null;
    if (message) {
      setCurriculo(null);
      setError(message);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setError(null);
    setCurriculo(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = vagaCandidaturaSchema.safeParse({
      ...form,
      vaga_slug: vaga.slug,
      vaga_titulo: vaga.titulo,
      indicado: indicado === true,
      // Se respondeu "não", o nome não vai junto — o banco tem CHECK proibindo
      // indicado_por sem indicação.
      indicado_por: indicado === true ? form.indicado_por : "",
      consent_lgpd: consent,
      website,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os dados.");
      return;
    }

    const curriculoError = validateCurriculo(curriculo);
    if (curriculoError) {
      setError(curriculoError);
      return;
    }

    setStatus("loading");
    try {
      const body = new FormData();
      for (const [key, value] of Object.entries(parsed.data)) {
        body.append(key, String(value ?? ""));
      }
      body.append("curriculo", curriculo!, slugifyFileName(curriculo!.name));

      const res = await fetch("/api/trabalhe-conosco", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar sua candidatura.");
      setStatus("success");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Erro ao enviar sua candidatura.");
    }
  }

  if (status === "success") {
    return (
      <div className="px-7 py-14 text-center md:px-8">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="h-8 w-8" />
        </span>
        <h3 className="mt-6 text-2xl font-semibold text-ink">Candidatura enviada!</h3>
        <p className="mx-auto mt-3 max-w-sm text-muted">
          Recebemos seu currículo para a vaga de <strong className="text-ink">{vaga.titulo}</strong>.
          Enviamos uma confirmação para o seu e-mail. Se o seu perfil combinar com o momento do
          time, a gente entra em contato.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-7 md:p-8" noValidate>
      {/* Honeypot */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Não preencha</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* Sempre visível: Nome */}
      <div>
        <label htmlFor="nome" className={labelCls}>
          Nome completo
        </label>
        <input
          id="nome"
          type="text"
          autoComplete="name"
          autoFocus
          value={form.nome}
          onChange={(e) => set("nome", e.target.value)}
          className={inputCls}
          placeholder="João Silva Santos"
        />
      </div>

      <Reveal show={showEmail}>
        <label htmlFor="email" className={labelCls}>
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          className={inputCls}
          placeholder="seu@email.com"
        />
      </Reveal>

      <Reveal show={showTel}>
        <label htmlFor="telefone" className={labelCls}>
          Telefone / WhatsApp
        </label>
        <input
          id="telefone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={form.telefone}
          onChange={(e) => set("telefone", maskPhone(e.target.value))}
          className={inputCls}
          placeholder="(61) 99999-9999"
        />
      </Reveal>

      <Reveal show={showNascCep}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="data_nascimento" className={labelCls}>
              Data de nascimento
            </label>
            <input
              id="data_nascimento"
              type="text"
              inputMode="numeric"
              // pattern numérico força o teclado de dígitos também no iOS antigo,
              // que ignora inputMode. O form é noValidate, então isto não bloqueia
              // o envio da máscara "DD/MM/AAAA".
              pattern="[0-9]*"
              autoComplete="bday"
              value={form.data_nascimento}
              onChange={(e) => set("data_nascimento", maskDate(e.target.value))}
              className={inputCls}
              placeholder="DD/MM/AAAA"
            />
          </div>
          <div>
            <label htmlFor="cep" className={labelCls}>
              CEP
            </label>
            <div className="relative">
              <input
                id="cep"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="postal-code"
                value={form.cep}
                onChange={(e) => handleCep(e.target.value)}
                className={inputCls}
                placeholder="00000-000"
              />
              {cepLoading && (
                <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
              )}
            </div>
          </div>
        </div>
        {cepError && <p className="mt-2 text-sm text-muted">{cepError}</p>}
      </Reveal>

      <Reveal show={showEndereco}>
        <label htmlFor="logradouro" className={labelCls}>
          Endereço
        </label>
        <input
          id="logradouro"
          type="text"
          autoComplete="street-address"
          value={form.logradouro}
          onChange={(e) => set("logradouro", e.target.value)}
          className={inputCls}
          placeholder="Preenchido pelo CEP"
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="bairro" className={labelCls}>
              Bairro
            </label>
            <input
              id="bairro"
              type="text"
              value={form.bairro}
              onChange={(e) => set("bairro", e.target.value)}
              className={inputCls}
              placeholder="Preenchido pelo CEP"
            />
          </div>
          <div>
            <label htmlFor="complemento" className={labelCls}>
              Número / complemento
            </label>
            <input
              id="complemento"
              type="text"
              value={form.complemento}
              onChange={(e) => set("complemento", e.target.value)}
              className={inputCls}
              placeholder="Bloco C, apto 204"
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cidade" className={labelCls}>
              Cidade
            </label>
            <input
              id="cidade"
              type="text"
              value={form.cidade}
              onChange={(e) => set("cidade", e.target.value)}
              className={inputCls}
              placeholder="Preenchido pelo CEP"
            />
          </div>
          <div>
            <label htmlFor="estado" className={labelCls}>
              UF
            </label>
            <input
              id="estado"
              type="text"
              value={form.estado}
              onChange={(e) => set("estado", e.target.value.toUpperCase().slice(0, 2))}
              className={inputCls}
              placeholder="DF"
            />
          </div>
        </div>
      </Reveal>

      <Reveal show={showInst}>
        <label htmlFor="instituicao" className={labelCls}>
          Faculdade / instituição
        </label>
        <input
          id="instituicao"
          type="text"
          value={form.instituicao}
          onChange={(e) => set("instituicao", e.target.value)}
          className={inputCls}
          placeholder="Onde você estuda"
        />
      </Reveal>

      <Reveal show={showSem}>
        <label htmlFor="semestre" className={labelCls}>
          Semestre atual
        </label>
        <select
          id="semestre"
          value={form.semestre}
          onChange={(e) => set("semestre", e.target.value)}
          className={`${inputCls} bg-white`}
        >
          <option value="">Selecione uma opção</option>
          {SEMESTRES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Reveal>

      <Reveal show={showIndicacao}>
        <span className={labelCls}>Alguém do Somma indicou você?</span>
        <div className="grid grid-cols-2 gap-3">
          {[
            { valor: true, rotulo: "Sim" },
            { valor: false, rotulo: "Não" },
          ].map(({ valor, rotulo }) => {
            const ativo = indicado === valor;
            return (
              <button
                key={rotulo}
                type="button"
                aria-pressed={ativo}
                onClick={() => {
                  setIndicado(valor);
                  if (!valor) set("indicado_por", "");
                }}
                className={`rounded-xl border px-4 py-3 text-base font-medium transition-colors ${
                  ativo
                    ? "border-primary bg-primary/[0.06] text-primary"
                    : "border-black/10 text-ink hover:border-primary/40"
                }`}
              >
                {rotulo}
              </button>
            );
          })}
        </div>

        <Reveal show={indicado === true}>
          <label htmlFor="indicado_por" className={labelCls}>
            Quem indicou você?
          </label>
          <input
            id="indicado_por"
            type="text"
            value={form.indicado_por}
            onChange={(e) => set("indicado_por", e.target.value)}
            placeholder="Nome de quem te falou da vaga"
            className={inputCls}
          />
        </Reveal>
      </Reveal>

      <Reveal show={showCv}>
        <span className={labelCls}>Currículo</span>
        <input
          ref={fileInputRef}
          id="curriculo"
          type="file"
          accept={CURRICULO_ACCEPT}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
        <label
          htmlFor="curriculo"
          className={`${inputCls} flex cursor-pointer items-center gap-3 hover:border-primary`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {curriculo ? <FileText className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">
              {curriculo ? curriculo.name : "Anexar currículo"}
            </span>
            <span className="block text-xs text-muted">
              {curriculo
                ? `${(curriculo.size / 1024 / 1024).toFixed(1)} MB · clique para trocar`
                : "PDF, DOC ou DOCX, até 5MB"}
            </span>
          </span>
        </label>
      </Reveal>

      {/* Termo + botão, ao final da jornada */}
      <Reveal show={showFinish}>
        <label htmlFor="consent_lgpd" className="flex items-center gap-2.5 text-sm text-muted">
          <input
            id="consent_lgpd"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-primary"
          />
          <span>
            Autorizo o uso dos meus dados e do meu currículo neste processo seletivo, conforme a{" "}
            <a
              href="/politica-de-privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline"
            >
              Política de Privacidade
            </a>
            .
          </span>
        </label>

        {error && <p className="mt-4 text-sm font-medium text-accent">{error}</p>}

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-70"
        >
          {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          Enviar candidatura
          {status !== "loading" && <ArrowRight className="h-4 w-4" />}
        </button>
      </Reveal>

      {error && !showFinish && <p className="mt-4 text-sm font-medium text-accent">{error}</p>}
    </form>
  );
}
