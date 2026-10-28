"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { EstadoInscricao } from "@/lib/dexcomplica-love-run/event.config";
import { INSTAGRAM_SOMMA, POLITICA_PRIVACIDADE } from "@/lib/dexcomplica-love-run/event.config";
import { camposComErro, inscricaoSchema, mascararCpf, mascararTelefone, recuperarSchema, SEXO_ROTULO, SEXOS, sugestaoEmail } from "@/lib/dexcomplica-love-run/schema";
import { rastrear } from "@/lib/dexcomplica-love-run/analytics";
import { lembrarIngresso } from "./meuIngresso";
import Transicao from "./Transicao";

type Pelotao = { valor: string; rotulo: string };

type Fase =
  | { tipo: "inicial" }
  | { tipo: "enviando" }
  | { tipo: "erro_validacao" }
  | { tipo: "falha"; mensagem: string }
  | { tipo: "ja_inscrito"; reenviado: boolean }
  | { tipo: "redirecionando" }
  | { tipo: "celebrando"; url: string; jaInscrito: boolean }
  | { tipo: "fechado"; estado: Exclude<EstadoInscricao, "abertas"> };

const UTM_CHAVES = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

function lerUtm() {
  if (typeof window === "undefined") return undefined;
  const q = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const k of UTM_CHAVES) {
    const v = q.get(k);
    if (v) utm[k] = v.slice(0, 120);
  }
  if (document.referrer && !document.referrer.includes(window.location.host)) utm.referral = document.referrer.slice(0, 200);
  return Object.keys(utm).length ? utm : undefined;
}

export default function Inscricao({ estado, pelotoes }: { estado: EstadoInscricao; pelotoes: Pelotao[] }) {
  const [fase, setFase] = useState<Fase>(estado === "abertas" ? { tipo: "inicial" } : { tipo: "fechado", estado });
  const [recuperando, setRecuperando] = useState(false);
  const router = useRouter();

  // Link "Abrir meu ingresso" dos e-mails para a base (…#meu-ingresso): no
  // aparelho da inscrição abre o ingresso; em outro, a recuperação por CPF.
  useEffect(() => {
    if (window.location.hash !== "#meu-ingresso") return;
    let caminho: string | null = null;
    try {
      caminho = localStorage.getItem("love-run:ingresso");
    } catch {
      caminho = null;
    }
    if (caminho && /^\/dexcomplica\/ingresso\/[A-Za-z0-9_-]{40,60}$/.test(caminho)) {
      router.replace(caminho);
      return;
    }
    setRecuperando(true);
    window.setTimeout(() => document.getElementById("meu-ingresso")?.scrollIntoView({ block: "center" }), 300);
  }, [router]);

  return (
    <div className="lr-form-caixa" id="formulario">
      {fase.tipo === "fechado" ? (
        <Fechado estado={fase.estado} />
      ) : fase.tipo === "ja_inscrito" ? (
        <JaInscrito reenviado={fase.reenviado} onVoltar={() => setFase({ tipo: "inicial" })} />
      ) : (
        <Formulario fase={fase} setFase={setFase} pelotoes={pelotoes} />
      )}

      <div className="lr-recuperar" id="meu-ingresso">
        <button
          type="button"
          className="lr-recuperar__abrir"
          aria-expanded={recuperando}
          aria-controls="lr-recuperar"
          onClick={() => setRecuperando((v) => !v)}
        >
          Já me inscrevi: recuperar meu ingresso
        </button>
        {recuperando ? <Recuperar /> : null}
      </div>
    </div>
  );
}

/* ─── Formulário ─────────────────────────────────────────────────────────── */

function Formulario({
  fase,
  setFase,
  pelotoes,
}: {
  fase: Fase;
  setFase: (f: Fase) => void;
  pelotoes: Pelotao[];
}) {
  const router = useRouter();
  const id = useId();
  const resumo = useRef<HTMLDivElement>(null);
  const iniciou = useRef(false);
  const enviandoRef = useRef(false);
  const [v, setV] = useState({ nome: "", email: "", telefone: "", cpf: "", sexo: "", pelotao: "", marketing: false });
  const [erros, setErros] = useState<Record<string, string>>({});

  const enviando = fase.tipo === "enviando" || fase.tipo === "redirecionando" || fase.tipo === "celebrando";

  const marcarInicio = () => {
    if (iniciou.current) return;
    iniciou.current = true;
    rastrear("formulario_iniciado");
  };

  const set = (campo: keyof typeof v) => (valor: string | boolean) => {
    marcarInicio();
    setV((a) => ({ ...a, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: "" }));
  };

  useEffect(() => {
    if (fase.tipo === "erro_validacao" || fase.tipo === "falha") resumo.current?.focus();
  }, [fase]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviandoRef.current) return; // clique duplo, Enter repetido
    const dados = { ...v, sexo: v.sexo || undefined, pelotao: v.pelotao, utm: lerUtm() };
    const local = inscricaoSchema.safeParse(dados);
    const campos = local.success ? {} : camposComErro(local.error.issues);
    if (v.pelotao && !pelotoes.some((p) => p.valor === v.pelotao)) campos.pelotao = "Escolha um dos pelotões disponíveis";
    if (Object.keys(campos).length) {
      setErros(campos);
      setFase({ tipo: "erro_validacao" });
      rastrear("inscricao_erro", { tipo: "validacao_local" });
      return;
    }

    enviandoRef.current = true;
    setFase({ tipo: "enviando" });
    try {
      const res = await fetch("/api/dexcomplica-love-run/inscricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.ok && typeof json.ingresso_url === "string") {
        rastrear(json.ja_inscrito ? "ja_inscrito" : "inscricao_concluida", { pelotao: v.pelotao });
        lembrarIngresso(json.ingresso_url);
        // Gravado no banco: a cena de carregamento vira celebração e leva ao
        // ingresso, que já vai sendo baixado enquanto ela toca.
        router.prefetch(json.ingresso_url);
        setFase({ tipo: "celebrando", url: json.ingresso_url, jaInscrito: Boolean(json.ja_inscrito) });
        return;
      }
      if (json.ja_inscrito) {
        rastrear("ja_inscrito", { reenviado: Boolean(json.email_reenviado) });
        setFase({ tipo: "ja_inscrito", reenviado: Boolean(json.email_reenviado) });
      } else if (res.status === 422 && json.campos) {
        setErros(json.campos);
        setFase({ tipo: "erro_validacao" });
        rastrear("inscricao_erro", { tipo: "validacao_servidor" });
      } else if (res.status === 409 && json.estado) {
        rastrear("inscricao_erro", { tipo: json.estado });
        setFase({ tipo: "fechado", estado: json.estado });
      } else {
        rastrear("inscricao_erro", { tipo: `http_${res.status}` });
        setFase({ tipo: "falha", mensagem: json.error ?? "Não conseguimos confirmar sua inscrição. Tente de novo." });
      }
    } catch {
      rastrear("inscricao_erro", { tipo: "rede" });
      setFase({
        tipo: "falha",
        mensagem: "Sem conexão com o servidor. Sua inscrição não foi confirmada: confira a internet e tente de novo.",
      });
    } finally {
      enviandoRef.current = false;
    }
  };

  const erroDe = (campo: string) => (erros[campo] ? `${id}-${campo}-erro` : undefined);
  const listaErros = Object.entries(erros).filter(([, m]) => m);

  return (
    <form className="lr-form" onSubmit={enviar} noValidate aria-busy={enviando} onFocus={marcarInicio}>
      {fase.tipo === "enviando" || fase.tipo === "celebrando" ? (
        <Transicao
          fase={fase.tipo === "celebrando" ? "confirmado" : "carregando"}
          jaInscrito={fase.tipo === "celebrando" && fase.jaInscrito}
          aoTerminar={() => fase.tipo === "celebrando" && router.push(fase.url)}
        />
      ) : null}
      <div ref={resumo} tabIndex={-1} className="lr-form__resumo" role={fase.tipo === "falha" ? "alert" : undefined}>
        {fase.tipo === "erro_validacao" && listaErros.length ? (
          <div className="lr-aviso lr-aviso--erro" role="alert">
            <strong>Confira {listaErros.length === 1 ? "o campo destacado" : "os campos destacados"}:</strong>
            <ul>
              {listaErros.map(([c, m]) => (
                <li key={c}>
                  <a href={`#${id}-${c}`}>{m}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {fase.tipo === "falha" ? (
          <div className="lr-aviso lr-aviso--erro">
            <strong>Inscrição não confirmada.</strong> {fase.mensagem}
          </div>
        ) : null}
      </div>

      <Campo id={`${id}-nome`} rotulo="Nome completo" erro={erros.nome} erroId={erroDe("nome")}>
        <input
          id={`${id}-nome`}
          name="nome"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          value={v.nome}
          onChange={(e) => set("nome")(e.target.value)}
          aria-invalid={Boolean(erros.nome)}
          aria-describedby={erroDe("nome")}
          required
        />
      </Campo>

      <Campo id={`${id}-email`} rotulo="E-mail" dica="Seu ingresso vai para este e-mail." erro={erros.email} erroId={erroDe("email")}>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="next"
          value={v.email}
          onChange={(e) => set("email")(e.target.value)}
          aria-invalid={Boolean(erros.email)}
          aria-describedby={[`${id}-email-dica`, erroDe("email")].filter(Boolean).join(" ")}
          required
        />
        {sugestaoEmail(v.email) ? (
          <p className="lr-campo__sugestao" role="status">
            Você quis dizer <strong>{sugestaoEmail(v.email)}</strong>?{" "}
            <button type="button" onClick={() => set("email")(sugestaoEmail(v.email) ?? v.email)}>
              Corrigir
            </button>
          </p>
        ) : null}
      </Campo>

      <Campo id={`${id}-telefone`} rotulo="WhatsApp com DDD" erro={erros.telefone} erroId={erroDe("telefone")}>
        <input
          id={`${id}-telefone`}
          name="telefone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(61) 99999-9999"
          enterKeyHint="next"
          maxLength={15}
          value={v.telefone}
          onChange={(e) => set("telefone")(mascararTelefone(e.target.value))}
          aria-invalid={Boolean(erros.telefone)}
          aria-describedby={erroDe("telefone")}
          required
        />
      </Campo>

      <Campo id={`${id}-cpf`} rotulo="CPF" erro={erros.cpf} erroId={erroDe("cpf")}>
        <input
          id={`${id}-cpf`}
          name="cpf"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          enterKeyHint="next"
          maxLength={14}
          value={v.cpf}
          onChange={(e) => set("cpf")(mascararCpf(e.target.value))}
          aria-invalid={Boolean(erros.cpf)}
          aria-describedby={erroDe("cpf")}
          required
        />
      </Campo>

      <fieldset className="lr-campo" aria-describedby={erroDe("sexo")} aria-invalid={Boolean(erros.sexo)}>
        <legend id={`${id}-sexo`} tabIndex={-1}>Sexo</legend>
        <div className="lr-opcoes lr-opcoes--2">
          {SEXOS.map((s) => (
            <label key={s} className="lr-opcao">
              <input type="radio" name="sexo" value={s} checked={v.sexo === s} onChange={() => set("sexo")(s)} required />
              <span>{SEXO_ROTULO[s]}</span>
            </label>
          ))}
        </div>
        {erros.sexo ? <p id={erroDe("sexo")} className="lr-campo__erro">{erros.sexo}</p> : null}
      </fieldset>

      <fieldset className="lr-campo" aria-describedby={erroDe("pelotao")} aria-invalid={Boolean(erros.pelotao)}>
        <legend id={`${id}-pelotao`} tabIndex={-1}>Pelotão</legend>
        <div className={`lr-opcoes lr-opcoes--${Math.min(pelotoes.length, 4)}`}>
          {pelotoes.map((p) => (
            <label key={p.valor} className="lr-opcao lr-opcao--pelotao">
              <input
                type="radio"
                name="pelotao"
                value={p.valor}
                checked={v.pelotao === p.valor}
                onChange={() => {
                  set("pelotao")(p.valor);
                }}
                required
              />
              <span>{p.rotulo}</span>
            </label>
          ))}
        </div>
        {erros.pelotao ? <p id={erroDe("pelotao")} className="lr-campo__erro">{erros.pelotao}</p> : null}
      </fieldset>

      <p className="lr-form__lgpd">
        Usamos seus dados para registrar sua inscrição, emitir o ingresso e organizar o evento, junto da Dexcomplica e
        da produção. Veja a <a href={POLITICA_PRIVACIDADE} target="_blank" rel="noopener noreferrer">política de privacidade</a>.
      </p>

      <label className="lr-check">
        <input type="checkbox" checked={v.marketing} onChange={(e) => set("marketing")(e.target.checked)} />
        <span>Quero receber novidades e convites do Somma Club por e-mail. (Opcional)</span>
      </label>

      <button type="submit" className="lr-btn lr-btn--vermelho lr-btn--g lr-btn--bloco" disabled={enviando}>
        {enviando ? (
          <>
            <span className="lr-giro" aria-hidden="true" />
            {fase.tipo === "enviando" ? "Confirmando inscrição…" : "Abrindo seu ingresso…"}
          </>
        ) : (
          "Garantir minha vaga"
        )}
      </button>
      <p className="sr-only" role="status" aria-live="polite">
        {fase.tipo === "enviando" ? "Enviando inscrição" : fase.tipo === "redirecionando" ? "Inscrição confirmada. Abrindo o ingresso." : ""}
      </p>
    </form>
  );
}

function Campo({
  id,
  rotulo,
  dica,
  erro,
  erroId,
  children,
}: {
  id: string;
  rotulo: string;
  dica?: string;
  erro?: string;
  erroId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="lr-campo" data-erro={Boolean(erro)}>
      <label htmlFor={id}>{rotulo}</label>
      {children}
      {dica ? <p id={`${id}-dica`} className="lr-campo__dica">{dica}</p> : null}
      {erro ? <p id={erroId} className="lr-campo__erro">{erro}</p> : null}
    </div>
  );
}

/* ─── Estados sem formulário ─────────────────────────────────────────────── */

function Fechado({ estado }: { estado: Exclude<EstadoInscricao, "abertas"> }) {
  const textos = {
    em_breve: ["As inscrições abrem em breve.", "Estamos fechando os últimos detalhes do corre. Fique de olho no @somma.club para não perder a abertura."],
    esgotado: ["As vagas acabaram.", "Obrigado pelo carinho! Se você já se inscreveu, recupere seu ingresso logo abaixo."],
    encerradas: ["Inscrições encerradas.", "Se você já se inscreveu, recupere seu ingresso logo abaixo."],
  } as const;
  const [titulo, texto] = textos[estado];
  return (
    <div className="lr-estado" role="status">
      <p className="lr-estado__selo">{estado === "em_breve" ? "Em breve" : estado === "esgotado" ? "Esgotado" : "Encerrado"}</p>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {estado === "em_breve" ? (
        <a className="lr-btn lr-btn--branco lr-btn--p" href={INSTAGRAM_SOMMA} target="_blank" rel="noopener noreferrer">
          Seguir @somma.club
        </a>
      ) : null}
    </div>
  );
}

function JaInscrito({ reenviado, onVoltar }: { reenviado: boolean; onVoltar: () => void }) {
  return (
    <div className="lr-estado" role="status">
      <p className="lr-estado__selo">Já inscrito</p>
      <h3>Esse CPF já tem inscrição no Love Run.</h3>
      <p>
        {reenviado
          ? "Por segurança, enviamos o ingresso de novo para o e-mail usado na inscrição. Confira também o spam."
          : "Por segurança, o ingresso só é enviado para o e-mail usado na inscrição. Se não encontrar, use “Recuperar meu ingresso” logo abaixo."}
      </p>
      <button type="button" className="lr-link-seta lr-link-seta--claro" onClick={onVoltar}>
        Corrigir os dados
      </button>
    </div>
  );
}

function Recuperar() {
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [enviando, setEnviando] = useState(false);
  const id = useId();

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    const p = recuperarSchema.safeParse({ cpf });
    if (!p.success) {
      setErro(p.error.issues[0]?.message ?? "CPF inválido");
      return;
    }
    setErro("");
    setEnviando(true);
    try {
      const res = await fetch("/api/dexcomplica-love-run/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg(json.mensagem);
        rastrear("recuperacao_solicitada");
      } else setErro(json.error ?? "Não conseguimos processar agora. Tente de novo.");
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form id="lr-recuperar" className="lr-recuperar__form" onSubmit={enviar} noValidate>
      {msg ? (
        <p className="lr-aviso lr-aviso--ok" role="status">{msg}</p>
      ) : (
        <>
          <div className="lr-campo" data-erro={Boolean(erro)}>
            <label htmlFor={`${id}-cpf`}>CPF usado na inscrição</label>
            <div className="lr-recuperar__linha">
              <input
                id={`${id}-cpf`}
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                maxLength={14}
                value={cpf}
                onChange={(e) => setCpf(mascararCpf(e.target.value))}
                aria-invalid={Boolean(erro)}
                aria-describedby={erro ? `${id}-erro` : `${id}-dica`}
              />
              <button type="submit" className="lr-btn lr-btn--branco lr-btn--p" disabled={enviando}>
                {enviando ? "Enviando…" : "Enviar"}
              </button>
            </div>
            <p id={`${id}-dica`} className="lr-campo__dica">Enviamos o ingresso para o e-mail cadastrado na inscrição.</p>
            {erro ? <p id={`${id}-erro`} className="lr-campo__erro" role="alert">{erro}</p> : null}
          </div>
        </>
      )}
    </form>
  );
}
