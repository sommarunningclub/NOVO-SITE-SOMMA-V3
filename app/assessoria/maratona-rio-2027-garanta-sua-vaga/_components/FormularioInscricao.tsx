"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { SEXOS, type Sexo } from "@/lib/maratona-rio-2027/provas";
import { PARCEIRA, PRAZO_LEGIVEL, TERMO_URL, VALOR_ESTRUTURA, reais, valorTotal } from "@/lib/maratona-rio-2027/inscricao";
import { isValidBirthDate, isValidCpf, maskCpf, maskDate, maskPhone } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { Pagamento, type DadosPagamento } from "./Pagamento";

type Estado =
  | { fase: "preenchendo"; erro?: string }
  | { fase: "enviando" }
  | { fase: "pronto"; dados: DadosPagamento; nome: string }
  | { fase: "esgotado" }
  | { fase: "fechado" }
  | { fase: "prazo" };

// Quem vai pagar no app do banco e volta encontra o Pix e o anexo, não o
// formulário vazio. Fica só neste aparelho.
const GUARDADO = "mdr27-inscricao";

function lerGuardado(): { dados: DadosPagamento; nome: string } | null {
  try {
    const bruto = localStorage.getItem(GUARDADO);
    const salvo = bruto ? JSON.parse(bruto) : null;
    return salvo?.dados?.token && salvo?.dados?.pix ? salvo : null;
  } catch {
    return null;
  }
}

function guardar(valor: { dados: DadosPagamento; nome: string } | null) {
  try {
    if (valor) localStorage.setItem(GUARDADO, JSON.stringify(valor));
    else localStorage.removeItem(GUARDADO);
  } catch {
    // Navegação privada ou armazenamento bloqueado: segue sem lembrar.
  }
}

const campo =
  "mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white outline-none placeholder:text-white/30 focus:border-bora";

function Rotulo({ titulo, dica, children }: { titulo: string; dica?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-white/80">
      {titulo}
      {dica && <span className="mt-0.5 block text-xs font-normal text-white/45">{dica}</span>}
      {children}
    </label>
  );
}

function Opcao({
  marcada,
  onClick,
  children,
  className,
}: {
  marcada: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={marcada}
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-3.5 text-left text-base transition-colors",
        marcada ? "border-bora bg-bora text-black" : "border-white/15 bg-white/5 text-white hover:border-white/40",
        className
      )}
    >
      {children}
    </button>
  );
}

export function FormularioInscricao({
  professores,
  bloqueio = null,
}: {
  professores: { slug: string; nome: string }[];
  /** Lote cheio, fechado pelo painel ou prazo vencido: some o formulário, mas quem já reservou ainda vê o Pix. */
  bloqueio?: "esgotado" | "fechado" | "prazo" | null;
}) {
  const semFormulario: Estado = bloqueio ? { fase: bloqueio } : { fase: "preenchendo" };
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [sexo, setSexo] = useState<Sexo | null>(null);
  const [treinador, setTreinador] = useState<string | null>(null);
  const [treinadorOutro, setTreinadorOutro] = useState("");
  const [estrutura, setEstrutura] = useState<boolean | null>(null);
  const [termo, setTermo] = useState(false);
  const [empresa, setEmpresa] = useState("");
  const [estado, setEstado] = useState<Estado>(semFormulario);

  useEffect(() => {
    const salvo = lerGuardado();
    if (salvo) setEstado({ fase: "pronto", ...salvo });
  }, []);

  function mexeu<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      if (estado.fase === "preenchendo" && estado.erro) setEstado({ fase: "preenchendo" });
    };
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const falha = (erro: string) => setEstado({ fase: "preenchendo", erro });
    if (nome.trim().split(/\s+/).length < 2) return falha("Digite seu nome completo, com sobrenome.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return falha("Digite um e-mail válido.");
    if (telefone.replace(/\D/g, "").length < 10) return falha("Digite seu telefone com DDD.");
    if (!isValidCpf(cpf)) return falha("CPF inválido. Confira os números.");
    if (!isValidBirthDate(nascimento)) return falha("Data de nascimento inválida. Use DD/MM/AAAA.");
    if (!sexo) return falha("Selecione o sexo.");
    if (!treinador) return falha("Escolha o seu treinador.");
    if (treinador === "outro" && treinadorOutro.trim().length < 2) return falha("Digite o nome do seu treinador.");
    if (estrutura === null) return falha("Diga se quer a estrutura de apoio da BORA no Rio.");
    if (!termo) return falha("Para seguir, aceite o termo de adesão.");

    setEstado({ fase: "enviando" });
    try {
      const res = await fetch("/api/maratona-rio-2027/inscricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          telefone,
          cpf,
          nascimento,
          sexo,
          treinador,
          treinadorOutro,
          estrutura,
          termo,
          empresa,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.esgotado) return setEstado({ fase: "esgotado" });
      if (data.prazo) return setEstado({ fase: "prazo" });
      if (data.fechado) return setEstado({ fase: "fechado" });
      if (!res.ok || !data.ok) return falha(data.error || "Não deu certo. Tente de novo.");
      guardar({ dados: data, nome: nome.trim() });
      setEstado({ fase: "pronto", dados: data, nome: nome.trim() });
      requestAnimationFrame(() =>
        document.getElementById("inscricao")?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    } catch {
      falha("Sem conexão. Tente de novo.");
    }
  }

  if (estado.fase === "pronto") {
    return (
      <Pagamento
        dados={estado.dados}
        nome={estado.nome}
        onNovaInscricao={() => {
          guardar(null);
          setEstado(semFormulario);
        }}
      />
    );
  }

  if (estado.fase === "esgotado" || estado.fase === "fechado" || estado.fase === "prazo") {
    return (
      <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-10 text-center">
        <p className="font-bora text-3xl font-black uppercase italic">
          {estado.fase === "esgotado" ? "Vagas esgotadas" : estado.fase === "prazo" ? "Inscrições encerradas" : "Inscrições fechadas"}
        </p>
        <p className="mt-3 text-white/70">
          {estado.fase === "esgotado"
            ? "Todas as vagas deste lote foram preenchidas."
            : estado.fase === "prazo"
            ? `O prazo da ${PARCEIRA} para estas condições terminou ${PRAZO_LEGIVEL}.`
            : "A assessoria fechou as inscrições deste lote."}{" "}
          Fale com o seu treinador para saber das próximas.
        </p>
      </div>
    );
  }

  const erro = estado.fase === "preenchendo" ? estado.erro : undefined;

  return (
    <form onSubmit={enviar} noValidate className="space-y-10">
      <fieldset className="space-y-4">
        <legend className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Seus dados</legend>
        <Rotulo titulo="Nome completo" dica="Com todos os sobrenomes, como no documento.">
          <input
            value={nome}
            onChange={(e) => mexeu(setNome)(e.target.value)}
            autoComplete="name"
            maxLength={120}
            className={campo}
          />
        </Rotulo>
        <Rotulo titulo="E-mail" dica="É por aqui que chegam as informações da estrutura de apoio no Rio.">
          <input
            value={email}
            onChange={(e) => mexeu(setEmail)(e.target.value)}
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={200}
            className={campo}
            placeholder="voce@email.com"
          />
        </Rotulo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Rotulo titulo="Telefone (WhatsApp)">
            <input
              value={telefone}
              onChange={(e) => mexeu(setTelefone)(maskPhone(e.target.value))}
              autoComplete="tel-national"
              inputMode="tel"
              className={campo}
              placeholder="(61) 99999-9999"
            />
          </Rotulo>
          <Rotulo titulo="CPF">
            <input
              value={cpf}
              onChange={(e) => mexeu(setCpf)(maskCpf(e.target.value))}
              inputMode="numeric"
              autoComplete="off"
              className={campo}
              placeholder="000.000.000-00"
            />
          </Rotulo>
        </div>
        <Rotulo titulo="Data de nascimento">
          <input
            value={nascimento}
            onChange={(e) => mexeu(setNascimento)(maskDate(e.target.value))}
            inputMode="numeric"
            autoComplete="bday"
            className={campo}
            placeholder="DD/MM/AAAA"
          />
        </Rotulo>
        <div>
          <p className="text-sm font-medium text-white/80">Sexo</p>
          <div className="mt-2 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Sexo">
            {SEXOS.map((s) => (
              <Opcao key={s.id} marcada={sexo === s.id} onClick={() => mexeu(setSexo)(s.id)} className="text-center">
                {s.nome}
              </Opcao>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Quem é seu treinador?</legend>
        <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Treinador">
          {professores.map((p) => (
            <Opcao key={p.slug} marcada={treinador === p.slug} onClick={() => mexeu(setTreinador)(p.slug)}>
              {p.nome}
            </Opcao>
          ))}
          <Opcao
            marcada={treinador === "outro"}
            onClick={() => mexeu(setTreinador)("outro")}
            className="col-span-2"
          >
            Outro treinador BORA
          </Opcao>
        </div>
        {treinador === "outro" && (
          <div className="mt-4">
            <Rotulo titulo="Nome do treinador">
              <input
                value={treinadorOutro}
                onChange={(e) => mexeu(setTreinadorOutro)(e.target.value)}
                maxLength={80}
                autoFocus
                className={campo}
              />
            </Rotulo>
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">
          Estrutura de apoio da BORA no Rio
        </legend>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          A BORA vai ter a maior estrutura para os seus atletas na Cidade Maravilhosa. Garantindo agora, junto com a
          inscrição, a estrutura sai por {reais(VALOR_ESTRUTURA)}, valor promocional e único por atleta.
        </p>
        <div className="mt-4 grid gap-3" role="radiogroup" aria-label="Estrutura de apoio">
          <Opcao marcada={estrutura === true} onClick={() => mexeu(setEstrutura)(true)}>
            <span className="block font-medium">Sim, quero garantir a estrutura agora</span>
            <span className={cn("block text-sm", estrutura === true ? "text-black/70" : "text-white/50")}>
              + {reais(VALOR_ESTRUTURA)} no Pix da inscrição
            </span>
          </Opcao>
          <Opcao marcada={estrutura === false} onClick={() => mexeu(setEstrutura)(false)}>
            <span className="block font-medium">Não, vou decidir depois</span>
            <span className={cn("block text-sm", estrutura === false ? "text-black/70" : "text-white/50")}>
              Depois o valor pode ser maior
            </span>
          </Opcao>
        </div>
      </fieldset>

      <label className="flex cursor-pointer gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-white/75">
        <input
          type="checkbox"
          checked={termo}
          onChange={(e) => mexeu(setTermo)(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#CEFF00]"
        />
        <span>
          Li e aceito o{" "}
          <a href={TERMO_URL} target="_blank" rel="noreferrer" className="text-bora underline underline-offset-2">
            termo de adesão da Maratona do Rio
          </a>
          . Sei que a inscrição só vale depois do pagamento e que o kit deste lote é sem camisa.
        </span>
      </label>

      {/* Isca para robô: fora da tela e fora do tab. */}
      <input
        value={empresa}
        onChange={(e) => setEmpresa(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div>
        <div className="mb-4 flex items-baseline justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <span className="text-sm text-white/65">Total a pagar no Pix</span>
          <span className="font-bora text-3xl font-black italic text-bora tabular-nums">
            {reais(valorTotal(estrutura === true))}
          </span>
        </div>
        {erro && (
          <p role="alert" className="mb-4 text-sm text-red-400">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={estado.fase === "enviando"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-bora px-6 py-4 font-bora text-base font-bold uppercase text-black transition-colors hover:bg-white disabled:opacity-60"
        >
          {estado.fase === "enviando" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Reservar minha vaga <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
        <p className="mt-4 text-center text-xs text-white/40">
          Seus dados vão para a BORA Assessoria fazer a sua inscrição.{" "}
          <a href="/politica-de-privacidade" className="underline hover:text-white/70">
            Política de privacidade
          </a>
        </p>
      </div>
    </form>
  );
}
