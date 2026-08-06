"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Building2, Check, Loader2, User } from "lucide-react";
import { partnerSchema, maskPhone, maskCpf, maskCnpj, isValidCpf } from "@/lib/validation";

type DocType = "cpf" | "cnpj" | "";

type CompanyData = {
  razao_social: string;
  nome_fantasia: string;
  atividade_principal: string;
};

const inputCls =
  "w-full rounded-xl border border-black/10 px-4 py-3 text-ink outline-none transition-colors focus:border-primary";

const DOC_TYPES = [
  { value: "cpf" as const, label: "CPF", Icon: User },
  { value: "cnpj" as const, label: "CNPJ", Icon: Building2 },
];

export function PartnerForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    tipo_documento: "" as DocType,
    documento: "",
    nome_da_empresa: "",
    instagram: "",
    descricao: "",
  });
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  // Ao completar 14 dígitos de CNPJ, busca os dados públicos da empresa.
  async function handleDocumento(raw: string) {
    const masked = form.tipo_documento === "cpf" ? maskCpf(raw) : maskCnpj(raw);
    setForm((f) => ({ ...f, documento: masked }));
    clearFieldError("documento");

    if (form.tipo_documento !== "cnpj") return;

    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 14) {
      setCompany(null);
      return;
    }

    setLoadingCnpj(true);
    try {
      const res = await fetch(`https://publica.cnpj.ws/cnpj/${digits}`);
      if (!res.ok) throw new Error("CNPJ não encontrado");
      const data = await res.json();
      setCompany({
        razao_social: data.razao_social ?? "",
        nome_fantasia: data.estabelecimento?.nome_fantasia ?? "",
        atividade_principal: data.estabelecimento?.atividade_principal?.descricao ?? "",
      });
      // Sugere o nome da empresa quando o campo ainda está vazio.
      setForm((f) =>
        f.nome_da_empresa.trim()
          ? f
          : { ...f, nome_da_empresa: data.estabelecimento?.nome_fantasia || data.razao_social || "" }
      );
    } catch {
      setCompany(null);
    } finally {
      setLoadingCnpj(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = partnerSchema.safeParse({
      ...form,
      instagram: form.instagram.startsWith("@") ? form.instagram : `@${form.instagram}`,
      razao_social: company?.razao_social ?? null,
      nome_fantasia: company?.nome_fantasia ?? null,
      atividade_principal: company?.atividade_principal ?? null,
      website,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "");
        if (field && !errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      setError("Confira os campos destacados antes de enviar.");
      return;
    }

    setFieldErrors({});
    setStatus("loading");
    try {
      const res = await fetch("/api/seja-parceiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar candidatura.");
      router.push("/seja-parceiro/obrigado");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Erro ao enviar candidatura.");
    }
  }

  const cpfDigits = form.documento.replace(/\D/g, "");
  const showCpfFeedback = form.tipo_documento === "cpf" && cpfDigits.length === 11;
  const cpfOk = showCpfFeedback && isValidCpf(form.documento);

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-xl rounded-3xl bg-white p-7 shadow-lg md:p-8"
      noValidate
    >
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

      <div className="space-y-5">
        {/* Nome */}
        <div>
          <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-ink">
            Nome completo
          </label>
          <input
            id="nome"
            type="text"
            autoComplete="name"
            value={form.nome}
            onChange={(e) => {
              setForm((f) => ({ ...f, nome: e.target.value }));
              clearFieldError("nome");
            }}
            className={inputCls}
            placeholder="João Silva Santos"
          />
          {fieldErrors.nome && <p className="mt-1.5 text-sm text-accent">{fieldErrors.nome}</p>}
        </div>

        {/* E-mail */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => {
              setForm((f) => ({ ...f, email: e.target.value }));
              clearFieldError("email");
            }}
            className={inputCls}
            placeholder="seu@email.com"
          />
          {fieldErrors.email && <p className="mt-1.5 text-sm text-accent">{fieldErrors.email}</p>}
        </div>

        {/* Telefone */}
        <div>
          <label htmlFor="telefone" className="mb-1.5 block text-sm font-medium text-ink">
            Telefone
          </label>
          <input
            id="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.telefone}
            onChange={(e) => {
              setForm((f) => ({ ...f, telefone: maskPhone(e.target.value) }));
              clearFieldError("telefone");
            }}
            className={inputCls}
            placeholder="(61) 99999-9999"
          />
          {fieldErrors.telefone && (
            <p className="mt-1.5 text-sm text-accent">{fieldErrors.telefone}</p>
          )}
        </div>

        {/* Tipo de documento */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Tipo de documento</span>
          <div className="grid grid-cols-2 gap-3">
            {DOC_TYPES.map(({ value, label, Icon }) => {
              const active = form.tipo_documento === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setForm((f) => ({ ...f, tipo_documento: value, documento: "" }));
                    setCompany(null);
                    clearFieldError("documento");
                    clearFieldError("tipo_documento");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-black/10 text-muted hover:border-black/25"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
          {fieldErrors.tipo_documento && (
            <p className="mt-1.5 text-sm text-accent">{fieldErrors.tipo_documento}</p>
          )}
        </div>

        {/* Documento */}
        {form.tipo_documento && (
          <div>
            <label htmlFor="documento" className="mb-1.5 block text-sm font-medium text-ink">
              Número do {form.tipo_documento.toUpperCase()}
            </label>
            <input
              id="documento"
              type="text"
              inputMode="numeric"
              value={form.documento}
              onChange={(e) => handleDocumento(e.target.value)}
              className={inputCls}
              placeholder={form.tipo_documento === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
            />
            {showCpfFeedback && (
              <p
                className={`mt-1.5 flex items-center gap-1.5 text-sm font-medium ${
                  cpfOk ? "text-green-600" : "text-accent"
                }`}
              >
                {cpfOk ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {cpfOk ? "CPF válido" : "CPF inválido"}
              </p>
            )}
            {loadingCnpj && (
              <p className="mt-1.5 flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando dados da empresa...
              </p>
            )}
            {fieldErrors.documento && (
              <p className="mt-1.5 text-sm text-accent">{fieldErrors.documento}</p>
            )}
          </div>
        )}

        {/* Dados públicos do CNPJ */}
        {company && (
          <div className="rounded-xl border border-green-600/25 bg-green-50 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-700">
              <Check className="h-4 w-4" />
              Dados da empresa encontrados
            </p>
            <dl className="space-y-2.5 text-sm">
              {company.razao_social && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Razão social
                  </dt>
                  <dd className="text-ink">{company.razao_social}</dd>
                </div>
              )}
              {company.nome_fantasia && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Nome fantasia
                  </dt>
                  <dd className="text-ink">{company.nome_fantasia}</dd>
                </div>
              )}
              {company.atividade_principal && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Atividade principal
                  </dt>
                  <dd className="text-ink">{company.atividade_principal}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Nome da empresa */}
        <div>
          <label htmlFor="nome_da_empresa" className="mb-1.5 block text-sm font-medium text-ink">
            Nome da empresa
          </label>
          <input
            id="nome_da_empresa"
            type="text"
            autoComplete="organization"
            value={form.nome_da_empresa}
            onChange={(e) => {
              setForm((f) => ({ ...f, nome_da_empresa: e.target.value }));
              clearFieldError("nome_da_empresa");
            }}
            className={inputCls}
            placeholder="Nome da sua empresa"
          />
          {fieldErrors.nome_da_empresa && (
            <p className="mt-1.5 text-sm text-accent">{fieldErrors.nome_da_empresa}</p>
          )}
        </div>

        {/* Instagram */}
        <div>
          <label htmlFor="instagram" className="mb-1.5 block text-sm font-medium text-ink">
            Instagram
          </label>
          <input
            id="instagram"
            type="text"
            autoCapitalize="none"
            autoComplete="off"
            value={form.instagram}
            onChange={(e) => {
              const v = e.target.value;
              setForm((f) => ({ ...f, instagram: v && !v.startsWith("@") ? `@${v}` : v }));
              clearFieldError("instagram");
            }}
            className={inputCls}
            placeholder="@suaempresa"
          />
          {fieldErrors.instagram && (
            <p className="mt-1.5 text-sm text-accent">{fieldErrors.instagram}</p>
          )}
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor="descricao" className="mb-1.5 block text-sm font-medium text-ink">
            Descrição da parceria
          </label>
          <textarea
            id="descricao"
            rows={5}
            value={form.descricao}
            onChange={(e) => {
              setForm((f) => ({ ...f, descricao: e.target.value }));
              clearFieldError("descricao");
            }}
            className={`${inputCls} resize-none`}
            placeholder="Conte para a gente o que você imagina como parceria com o Somma Club..."
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            {fieldErrors.descricao ? (
              <p className="text-sm text-accent">{fieldErrors.descricao}</p>
            ) : (
              <span />
            )}
            <span
              className={`shrink-0 text-xs ${
                form.descricao.trim().length >= 50 ? "text-green-600" : "text-muted"
              }`}
            >
              {form.descricao.trim().length}/50
            </span>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-5 flex items-start gap-2 text-sm font-medium text-accent">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-70"
      >
        {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Enviar candidatura
        {status !== "loading" && <ArrowRight className="h-4 w-4" />}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted">
        Ao enviar, você concorda com o uso dos seus dados para contato comercial, conforme a{" "}
        <a
          href="/politica-de-privacidade"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline"
        >
          Política de Privacidade
        </a>
        .
      </p>
    </form>
  );
}
