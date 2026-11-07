"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, CalendarPlus, Check, Loader2, MapPin, MessageCircle } from "lucide-react";
import { TERMO_IMAGEM_URL } from "@/lib/aceites/termos";
import { GRUPO_ATUAL } from "@/lib/whatsapp-grupos";
import { PELOTOES } from "@/lib/boracomsomma/config";
import {
  cpfValido,
  emailValido,
  mascaraCpf,
  mascaraTelefone,
  nomeValido,
  telefoneValido,
  type Sexo,
} from "@/lib/boracomsomma/validacao";
import { cn } from "@/lib/utils";

type Props = {
  estado: "sem-evento" | "aberto" | "bloqueado" | "encerrado";
  titulo: string;
  data: string;
  horario: string;
  local: string;
  localUrl: string | null;
  pelotoes: string[];
  /** "Sábado, 14 de novembro" */
  dataExtenso: string;
  horarioCurto: string;
};

type Confirmado = { nome: string; pelotao: string };

const CHAVE_LOCAL = "boracomsomma:checkin";

function linkAgenda(p: Props) {
  // Brasília é UTC-3 o ano todo: 07:00 local vira 10:00Z. Duas horas de corre.
  const [h, m] = p.horario.split(":").map(Number);
  const [y, mo, d] = p.data.split("-").map(Number);
  const inicio = new Date(Date.UTC(y, mo - 1, d, h + 3, m));
  const fim = new Date(inicio.getTime() + 2 * 3_600_000);
  const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: "BORA com SOMMA",
    dates: `${fmt(inicio)}/${fmt(fim)}`,
    details: "Corre do SOMMA Club com a BORA Assessoria e o Yann Rodrigues. https://sommaclub.com.br/boracomsomma",
    location: p.local,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export function CheckIn(props: Props) {
  const { estado, pelotoes } = props;
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [sexo, setSexo] = useState<Sexo | "">("");
  const [pelotao, setPelotao] = useState("");
  const [aceite, setAceite] = useState(false);
  const [empresa, setEmpresa] = useState("");
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmado, setConfirmado] = useState<Confirmado | null>(null);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_LOCAL);
      if (salvo) setConfirmado(JSON.parse(salvo));
    } catch {
      /* sem armazenamento: a pessoa só não vê o ingresso de novo */
    }
  }, []);

  const digitosTel = telefone.replace(/\D/g, "");
  const digitosCpf = cpf.replace(/\D/g, "");
  const avisos = {
    nome: !nomeValido(nome) ? "Escreva nome e sobrenome." : "",
    email: !emailValido(email) ? "Confira o e-mail." : "",
    telefone: !telefoneValido(digitosTel) ? "WhatsApp com DDD." : "",
    cpf: !cpfValido(digitosCpf) ? "Confira o CPF." : "",
    sexo: !sexo ? "Escolha uma opção." : "",
    pelotao: !pelotao ? "Escolha o seu pelotão." : "",
    aceite: !aceite ? "Marque para confirmar." : "",
  };
  const valido = Object.values(avisos).every((a) => !a);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setTentou(true);
    if (!valido || enviando) return;
    setEnviando(true);
    setErro("");
    try {
      const res = await fetch("/api/boracomsomma/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          telefone: digitosTel,
          cpf: digitosCpf,
          sexo,
          pelotao,
          aceite_imagem: aceite,
          empresa,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok && !json.jaInscrito) {
        setErro(json.error || "Não deu para confirmar agora. Tente de novo.");
        return;
      }
      const ok = { nome: nome.trim().split(/\s+/)[0], pelotao };
      setConfirmado(ok);
      try {
        localStorage.setItem(CHAVE_LOCAL, JSON.stringify(ok));
      } catch {
        /* ignora */
      }
    } catch {
      setErro("Sem conexão. Confira a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (confirmado) return <Ingresso {...props} confirmado={confirmado} />;

  if (estado !== "aberto") {
    const textos = {
      "sem-evento": {
        t: "O check-in abre em breve",
        s: "Volte aqui nos próximos dias. A data já está guardada: sábado, 14 de novembro.",
      },
      bloqueado: { t: "Check-in fechado no momento", s: "Fique de olho: assim que abrir, é por aqui mesmo." },
      encerrado: { t: "Check-in encerrado", s: "Obrigado a todo mundo que veio. Nos vemos no próximo corre!" },
    }[estado];
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center sm:p-12">
        <p className="font-bora text-3xl font-black uppercase italic text-bora sm:text-4xl">{textos.t}</p>
        <p className="mx-auto mt-3 max-w-md text-white/65">{textos.s}</p>
        <a
          href={linkAgenda(props)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold hover:bg-white/10"
        >
          <CalendarPlus className="h-4 w-4" /> Guardar na agenda
        </a>
      </div>
    );
  }

  const campo =
    "w-full rounded-2xl border bg-white/[0.04] px-4 py-3.5 text-base text-white placeholder:text-white/35 outline-none transition focus:border-bora focus:bg-white/[0.07]";
  const borda = (aviso: string) => (tentou && aviso ? "border-red-400/70" : "border-white/15");

  return (
    <form onSubmit={enviar} noValidate className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-8">
      <fieldset>
        <legend className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">1. Seu pelotão</legend>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {pelotoes.map((id) => {
            const info = PELOTOES[id];
            const ativo = pelotao === id;
            return (
              <button
                type="button"
                key={id}
                onClick={() => setPelotao(id)}
                aria-pressed={ativo}
                className={cn(
                  "rounded-2xl border p-3 text-left transition sm:p-4",
                  ativo ? "border-bora bg-bora text-black" : "border-white/15 bg-white/[0.03] hover:border-white/40",
                )}
              >
                <span className="block font-bora text-2xl font-black italic leading-none sm:text-3xl">{id.replace("km", " km")}</span>
                {info && (
                  <>
                    <span className={cn("mt-2 block text-xs font-semibold leading-tight sm:text-sm", ativo ? "text-black" : "text-white")}>
                      {info.rotulo}
                    </span>
                    <span className={cn("mt-0.5 hidden text-xs sm:block", ativo ? "text-black/70" : "text-white/55")}>{info.descricao}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
        {tentou && avisos.pelotao && <p className="mt-2 text-sm text-red-300">{avisos.pelotao}</p>}
      </fieldset>

      <fieldset className="mt-8">
        <legend className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">2. Seus dados</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="sr-only">Nome completo</span>
            <input
              className={cn(campo, borda(avisos.nome))}
              placeholder="Nome completo"
              autoComplete="name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            {tentou && avisos.nome && <span className="mt-1 block text-sm text-red-300">{avisos.nome}</span>}
          </label>
          <label>
            <span className="sr-only">E-mail</span>
            <input
              className={cn(campo, borda(avisos.email))}
              placeholder="E-mail"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {tentou && avisos.email && <span className="mt-1 block text-sm text-red-300">{avisos.email}</span>}
          </label>
          <label>
            <span className="sr-only">WhatsApp com DDD</span>
            <input
              className={cn(campo, borda(avisos.telefone))}
              placeholder="WhatsApp com DDD"
              inputMode="tel"
              autoComplete="tel-national"
              value={telefone}
              onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
            />
            {tentou && avisos.telefone && <span className="mt-1 block text-sm text-red-300">{avisos.telefone}</span>}
          </label>
          <label>
            <span className="sr-only">CPF</span>
            <input
              className={cn(campo, borda(avisos.cpf))}
              placeholder="CPF"
              inputMode="numeric"
              value={cpf}
              onChange={(e) => setCpf(mascaraCpf(e.target.value))}
            />
            {tentou && avisos.cpf && <span className="mt-1 block text-sm text-red-300">{avisos.cpf}</span>}
          </label>
          <div>
            <div
              role="radiogroup"
              aria-label="Sexo"
              className={cn("grid grid-cols-2 gap-1 rounded-2xl border p-1", borda(avisos.sexo))}
            >
              {(["masculino", "feminino"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={sexo === s}
                  onClick={() => setSexo(s)}
                  className={cn(
                    "rounded-xl py-2.5 text-sm font-semibold capitalize transition",
                    sexo === s ? "bg-white text-black" : "text-white/70 hover:text-white",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {tentou && avisos.sexo && <span className="mt-1 block text-sm text-red-300">{avisos.sexo}</span>}
          </div>
        </div>
        {/* Campo invisível: gente não vê, robô preenche. */}
        <input
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          name="empresa"
        />
      </fieldset>

      <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-white/70">
        <input
          type="checkbox"
          checked={aceite}
          onChange={(e) => setAceite(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#CEFF00]"
        />
        <span>
          Li e aceito o{" "}
          <a href={TERMO_IMAGEM_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
            Termo de Uso de Imagem
          </a>
          . Fotos e vídeos do corre podem aparecer nos canais do SOMMA Club e da BORA.
        </span>
      </label>
      {tentou && avisos.aceite && <p className="mt-1 text-sm text-red-300">{avisos.aceite}</p>}

      {erro && (
        <p role="alert" className="mt-5 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-bora px-8 py-4 font-bora text-lg font-black uppercase italic text-black transition hover:brightness-110 disabled:opacity-60"
      >
        {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {enviando ? "Confirmando" : "Confirmar meu check-in"}
        {!enviando && <ArrowRight className="h-5 w-5" />}
      </button>
      <p className="mt-3 text-center text-xs text-white/40">Gratuito. Um check-in por CPF.</p>
    </form>
  );
}

function Ingresso(props: Props & { confirmado: Confirmado }) {
  const { confirmado } = props;
  const info = PELOTOES[confirmado.pelotao];
  return (
    <div className="overflow-hidden rounded-3xl bg-bora text-black">
      <div className="p-6 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black text-bora">
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em]">Check-in confirmado</p>
        </div>
        <p className="mt-6 font-bora text-4xl font-black uppercase italic leading-[0.95] sm:text-6xl">
          {confirmado.nome ? `${confirmado.nome}, ` : ""}você está no corre!
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 border-t-2 border-dashed border-black/25 pt-6 sm:grid-cols-4">
          <Dado rotulo="Quando" valor={props.dataExtenso} />
          <Dado rotulo="Horário" valor={`A partir das ${props.horarioCurto}`} />
          <Dado rotulo="Onde" valor={props.local} />
          <Dado
            rotulo="Pelotão"
            valor={confirmado.pelotao ? `${confirmado.pelotao.replace("km", " km")}${info ? ` · ${info.rotulo}` : ""}` : "No dia"}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 bg-black p-4 sm:flex-row sm:p-6">
        <a
          href={linkAgenda(props)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-bora px-5 py-3 text-sm font-bold text-black"
        >
          <CalendarPlus className="h-4 w-4" /> Adicionar à agenda
        </a>
        <a
          href={GRUPO_ATUAL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
        >
          <MessageCircle className="h-4 w-4" /> Grupo do SOMMA no WhatsApp
        </a>
        {props.localUrl && (
          <a
            href={props.localUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            <MapPin className="h-4 w-4" /> Como chegar
          </a>
        )}
      </div>
    </div>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-black/55">{rotulo}</p>
      <p className="mt-1 font-semibold leading-snug">{valor}</p>
    </div>
  );
}
