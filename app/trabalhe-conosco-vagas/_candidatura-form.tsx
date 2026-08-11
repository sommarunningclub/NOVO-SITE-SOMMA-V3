"use client";

import { useRef, useState } from "react";
import { AlertCircle, Check, FileText, Loader2, Paperclip, Send, X } from "lucide-react";
import {
  CURRICULO_ACCEPT,
  SEMESTRES,
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

const inputCls =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-primary";
const inputErrCls = "border-primary/60 bg-primary/[0.03]";
const labelCls = "mb-1.5 block text-sm font-medium text-ink";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-primary">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

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
  });
  const [curriculo, setCurriculo] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setField = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

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
      setCepError("Não encontramos esse CEP. Você pode preencher o endereço manualmente.");
      setForm((f) => ({ ...f, logradouro: "", bairro: "", cidade: "", estado: "" }));
    } finally {
      setCepLoading(false);
    }
  }

  function handleCep(raw: string) {
    const masked = maskCep(raw);
    setField("cep", masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length === 8) fetchAddress(digits);
    else setCepError(null);
  }

  function handleFile(file: File | null) {
    const message = file ? validateCurriculo(file) : null;
    if (message) {
      setCurriculo(null);
      setFieldErrors((prev) => ({ ...prev, curriculo: message }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setCurriculo(file);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.curriculo;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = vagaCandidaturaSchema.safeParse({
      ...form,
      vaga_slug: vaga.slug,
      vaga_titulo: vaga.titulo,
      consent_lgpd: consent,
      website,
    });

    const errors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "");
        if (field && !errors[field]) errors[field] = issue.message;
      }
    }

    const curriculoError = validateCurriculo(curriculo);
    if (curriculoError) errors.curriculo = curriculoError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Confira os campos destacados antes de enviar.");
      return;
    }

    setFieldErrors({});
    setStatus("loading");

    try {
      const body = new FormData();
      for (const [key, value] of Object.entries(parsed.data!)) {
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
      <div className="px-7 py-14 text-center md:px-10">
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
          className="mt-8 rounded-full bg-primary px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 pb-8 pt-6 md:px-9 md:pb-9" noValidate>
      {/* Honeypot anti-bot: invisível para humanos, irresistível para robôs. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nome" className={labelCls}>
            Nome completo
          </label>
          <input
            id="nome"
            value={form.nome}
            onChange={(e) => setField("nome", e.target.value)}
            placeholder="Como você assina seu currículo"
            className={`${inputCls} ${fieldErrors.nome ? inputErrCls : ""}`}
            autoComplete="name"
          />
          <FieldError message={fieldErrors.nome} />
        </div>

        <div>
          <label htmlFor="telefone" className={labelCls}>
            Telefone / WhatsApp
          </label>
          <input
            id="telefone"
            inputMode="tel"
            value={form.telefone}
            onChange={(e) => setField("telefone", maskPhone(e.target.value))}
            placeholder="(61) 90000-0000"
            className={`${inputCls} ${fieldErrors.telefone ? inputErrCls : ""}`}
            autoComplete="tel"
          />
          <FieldError message={fieldErrors.telefone} />
        </div>

        <div>
          <label htmlFor="email" className={labelCls}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="voce@email.com"
            className={`${inputCls} ${fieldErrors.email ? inputErrCls : ""}`}
            autoComplete="email"
          />
          <FieldError message={fieldErrors.email} />
        </div>

        <div>
          <label htmlFor="data_nascimento" className={labelCls}>
            Data de nascimento
          </label>
          <input
            id="data_nascimento"
            inputMode="numeric"
            value={form.data_nascimento}
            onChange={(e) => setField("data_nascimento", maskDate(e.target.value))}
            placeholder="DD/MM/AAAA"
            className={`${inputCls} ${fieldErrors.data_nascimento ? inputErrCls : ""}`}
          />
          <FieldError message={fieldErrors.data_nascimento} />
        </div>

        <div>
          <label htmlFor="cep" className={labelCls}>
            CEP
          </label>
          <div className="relative">
            <input
              id="cep"
              inputMode="numeric"
              value={form.cep}
              onChange={(e) => handleCep(e.target.value)}
              placeholder="00000-000"
              className={`${inputCls} ${fieldErrors.cep ? inputErrCls : ""}`}
              autoComplete="postal-code"
            />
            {cepLoading && (
              <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
            )}
          </div>
          <FieldError message={fieldErrors.cep} />
          {cepError && <p className="mt-1.5 text-sm text-muted">{cepError}</p>}
        </div>

        {/* Endereço vindo da BrasilAPI. Editável: CEP de quadra inteira em
            Brasília costuma voltar sem o detalhe da casa. */}
        <div className="sm:col-span-2">
          <label htmlFor="logradouro" className={labelCls}>
            Endereço
          </label>
          <input
            id="logradouro"
            value={form.logradouro}
            onChange={(e) => setField("logradouro", e.target.value)}
            placeholder="Preenchido pelo CEP"
            className={inputCls}
            autoComplete="street-address"
          />
        </div>

        <div>
          <label htmlFor="bairro" className={labelCls}>
            Bairro
          </label>
          <input
            id="bairro"
            value={form.bairro}
            onChange={(e) => setField("bairro", e.target.value)}
            placeholder="Preenchido pelo CEP"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-[1fr,88px] gap-3">
          <div>
            <label htmlFor="cidade" className={labelCls}>
              Cidade
            </label>
            <input
              id="cidade"
              value={form.cidade}
              onChange={(e) => setField("cidade", e.target.value)}
              placeholder="Preenchido pelo CEP"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="estado" className={labelCls}>
              UF
            </label>
            <input
              id="estado"
              value={form.estado}
              onChange={(e) => setField("estado", e.target.value.toUpperCase().slice(0, 2))}
              placeholder="DF"
              className={inputCls}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="complemento" className={labelCls}>
            Número e complemento <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            id="complemento"
            value={form.complemento}
            onChange={(e) => setField("complemento", e.target.value)}
            placeholder="Bloco C, apto 204"
            className={`${inputCls} ${fieldErrors.complemento ? inputErrCls : ""}`}
          />
          <FieldError message={fieldErrors.complemento} />
        </div>

        <div>
          <label htmlFor="instituicao" className={labelCls}>
            Faculdade / instituição
          </label>
          <input
            id="instituicao"
            value={form.instituicao}
            onChange={(e) => setField("instituicao", e.target.value)}
            placeholder="Onde você estuda"
            className={`${inputCls} ${fieldErrors.instituicao ? inputErrCls : ""}`}
          />
          <FieldError message={fieldErrors.instituicao} />
        </div>

        <div>
          <label htmlFor="semestre" className={labelCls}>
            Semestre atual
          </label>
          <select
            id="semestre"
            value={form.semestre}
            onChange={(e) => setField("semestre", e.target.value)}
            className={`${inputCls} ${fieldErrors.semestre ? inputErrCls : ""} ${
              form.semestre ? "" : "text-muted/60"
            }`}
          >
            <option value="">Selecione</option>
            {SEMESTRES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.semestre} />
        </div>

        {/* Currículo */}
        <div className="sm:col-span-2">
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
            className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-4 transition-colors hover:border-primary hover:bg-primary/[0.03] ${
              fieldErrors.curriculo ? "border-primary/60 bg-primary/[0.03]" : "border-black/15"
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {curriculo ? <FileText className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
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
          <FieldError message={fieldErrors.curriculo} />
        </div>
      </div>

      {/* LGPD */}
      <label className="mt-6 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.consent_lgpd;
              return next;
            });
          }}
          className="mt-1 h-4 w-4 shrink-0 accent-primary"
        />
        <span className="text-sm leading-relaxed text-muted">
          Autorizo o Somma Club a armazenar e usar os dados e o currículo enviados exclusivamente
          para este processo seletivo, conforme a{" "}
          <a
            href="/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            Política de Privacidade
          </a>
          .
        </span>
      </label>
      <FieldError message={fieldErrors.consent_lgpd} />

      {error && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-primary/[0.06] px-4 py-3 text-sm text-primary">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-6 py-3 text-base font-semibold text-ink transition-colors hover:bg-black/[0.04]"
        >
          <X className="h-4 w-4" /> Cancelar
        </button>
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
            </>
          ) : (
            <>
              Enviar candidatura <Send className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
