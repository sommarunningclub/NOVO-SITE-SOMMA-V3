"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { signupSchema, maskPhone, maskCpf, maskDate, maskCep, isValidBirthDate } from "@/lib/validation";

const emailOk = (v: string) => /\S+@\S+\.\S+/.test(v);

// Cada campo aparece quando o anterior está "suficientemente" preenchido (jornada leve).
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

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    cpf: "",
    data_nascimento: "",
    cep: "",
    whatsapp: "",
    sexo: "",
  });
  const [consentLgpd, setConsentLgpd] = useState(false);
  const [consentImagem, setConsentImagem] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  // Condições da jornada (cada uma libera o próximo passo, sem recolher o anterior)
  const nomeOk = form.nome_completo.trim().length >= 2;
  const mailOk = emailOk(form.email);
  const cpfOk = form.cpf.replace(/\D/g, "").length === 11;
  const dataOk = isValidBirthDate(form.data_nascimento);
  const cepOk = form.cep.replace(/\D/g, "").length === 8;
  const zapOk = form.whatsapp.replace(/\D/g, "").length >= 10;
  const sexoOk = form.sexo === "masculino" || form.sexo === "feminino";

  const showEmail = nomeOk;
  const showCpf = showEmail && mailOk;
  const showNasc = showCpf && cpfOk;
  const showCep = showNasc && dataOk;
  const showWhats = showCep && cepOk;
  const showSexo = showWhats && zapOk;
  const showFinish = showSexo && sexoOk;

  const inputCls =
    "w-full rounded-xl border border-black/10 px-4 py-3 text-ink outline-none transition-colors focus:border-primary";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = signupSchema.safeParse({
      ...form,
      consent_lgpd: consentLgpd,
      consent_imagem: consentImagem,
      website,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os dados.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/cadastro-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar.");
      router.push("/obrigado");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Erro ao enviar.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md rounded-3xl bg-white p-7 shadow-lg md:p-8" noValidate>
      {/* Honeypot */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Não preencha</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {/* Sempre visível: Nome */}
      <div>
        <label htmlFor="nome_completo" className="mb-1.5 block text-sm font-medium text-ink">
          Nome completo
        </label>
        <input
          id="nome_completo"
          type="text"
          autoComplete="name"
          autoFocus
          value={form.nome_completo}
          onChange={(e) => setForm((f) => ({ ...f, nome_completo: e.target.value }))}
          className={inputCls}
          placeholder="João Silva Santos"
        />
      </div>

      <Reveal show={showEmail}>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={inputCls}
          placeholder="seu@email.com"
        />
      </Reveal>

      <Reveal show={showCpf}>
        <label htmlFor="cpf" className="mb-1.5 block text-sm font-medium text-ink">CPF</label>
        <input
          id="cpf"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={form.cpf}
          onChange={(e) => setForm((f) => ({ ...f, cpf: maskCpf(e.target.value) }))}
          className={inputCls}
          placeholder="000.000.000-00"
        />
      </Reveal>

      <Reveal show={showNasc}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="data_nascimento" className="mb-1.5 block text-sm font-medium text-ink">
              Data de nascimento
            </label>
            <input
              id="data_nascimento"
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              value={form.data_nascimento}
              onChange={(e) => setForm((f) => ({ ...f, data_nascimento: maskDate(e.target.value) }))}
              className={inputCls}
              placeholder="DD/MM/AAAA"
            />
          </div>
          <div>
            <label htmlFor="cep" className="mb-1.5 block text-sm font-medium text-ink">CEP</label>
            <input
              id="cep"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              value={form.cep}
              onChange={(e) => setForm((f) => ({ ...f, cep: maskCep(e.target.value) }))}
              className={inputCls}
              placeholder="00000-000"
            />
          </div>
        </div>
      </Reveal>

      <Reveal show={showWhats}>
        <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-medium text-ink">WhatsApp</label>
        <input
          id="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={form.whatsapp}
          onChange={(e) => setForm((f) => ({ ...f, whatsapp: maskPhone(e.target.value) }))}
          className={inputCls}
          placeholder="(61) 99999-9999"
        />
      </Reveal>

      <Reveal show={showSexo}>
        <label htmlFor="sexo" className="mb-1.5 block text-sm font-medium text-ink">Sexo</label>
        <select
          id="sexo"
          value={form.sexo}
          onChange={(e) => setForm((f) => ({ ...f, sexo: e.target.value }))}
          className={`${inputCls} bg-white`}
        >
          <option value="">Selecione uma opção</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
        </select>
      </Reveal>

      {/* Termos condensados + botão (aparecem ao final da jornada) */}
      <Reveal show={showFinish}>
        <div className="space-y-2.5">
          <label htmlFor="consent_lgpd" className="flex items-center gap-2.5 text-sm text-muted">
            <input
              id="consent_lgpd"
              type="checkbox"
              checked={consentLgpd}
              onChange={(e) => setConsentLgpd(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-primary"
            />
            <span>
              Li e aceito a{" "}
              <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">
                Política de Privacidade
              </a>{" "}
              (LGPD).
            </span>
          </label>

          <label htmlFor="consent_imagem" className="flex items-center gap-2.5 text-sm text-muted">
            <input
              id="consent_imagem"
              type="checkbox"
              checked={consentImagem}
              onChange={(e) => setConsentImagem(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-primary"
            />
            <span>
              Autorizo o uso da minha imagem.{" "}
              <a href="/politica-de-privacidade#uso-de-imagem" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">
                Saiba mais
              </a>
            </span>
          </label>
        </div>

        {error && <p className="mt-4 text-sm font-medium text-accent">{error}</p>}

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-70"
        >
          {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          Quero fazer parte
          {status !== "loading" && <ArrowRight className="h-4 w-4" />}
        </button>
      </Reveal>

      {error && !showFinish && <p className="mt-4 text-sm font-medium text-accent">{error}</p>}
    </form>
  );
}
