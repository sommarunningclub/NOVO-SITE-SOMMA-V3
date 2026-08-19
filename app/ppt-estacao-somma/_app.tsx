"use client";

import { useEffect, useReducer, useRef } from "react";
import { gsap } from "gsap";
import { EvolveLogo, SommaLogo } from "./_marca";

/* ══════════════════════════════════════════════════════════════════════════
   Protótipo navegável da camada digital.

   Um telefone com onboarding e quatro áreas (agenda, check in, carteira,
   café), com estado real: o perfil escolhido muda benefícios, reservas ficam
   marcadas, o check in libera o locker, o pedido do café reconhece o plano.
   É simulação de interface para leitura da proposta, sem preços: onde o app
   real teria valores, aqui entra o benefício em texto.
   ══════════════════════════════════════════════════════════════════════════ */

const EVOLVE = "#DF271B";
const ORANGE = "#FF2C03";

type Perfil = "visitante" | "somma" | "evolve" | "evolve-plus";
type Tela = "onb-1" | "onb-2" | "onb-3" | "agenda" | "checkin" | "carteira" | "cafe" | "cafe-ok" | "recovery";

type Estado = {
  tela: Tela;
  perfil: Perfil;
  reservas: string[];
  checkin: boolean;
  recoveryReservado: string | null;
  creditos: number;
  pedido: string[];
};

type Acao =
  | { t: "ir"; tela: Tela }
  | { t: "perfil"; perfil: Perfil }
  | { t: "reserva"; id: string }
  | { t: "checkin" }
  | { t: "recovery"; hora: string }
  | { t: "pedido"; item: string }
  | { t: "pagar" }
  | { t: "reiniciar" };

const PERFIS: { id: Perfil; nome: string; sub: string }[] = [
  { id: "evolve-plus", nome: "Evolve+", sub: "Plano com experiências premium" },
  { id: "evolve", nome: "Aluno Evolve", sub: "Matrícula ativa em uma unidade" },
  { id: "somma", nome: "Membro SOMMA", sub: "Corre com o clube aos sábados" },
  { id: "visitante", nome: "Visitante", sub: "Frequenta o Parque" },
];

const NOME_PERFIL: Record<Perfil, string> = {
  visitante: "Visitante",
  somma: "Membro SOMMA",
  evolve: "Aluno Evolve",
  "evolve-plus": "Evolve+",
};

/** O que cada perfil encontra na Estação (texto da proposta, não regra final). */
const BENEFICIOS: Record<Perfil, string[]> = {
  visitante: ["Café e cardápio completo", "Recovery com valor integral", "Locker avulso", "Convite para os treinos SOMMA"],
  somma: ["Treinos e desafios SOMMA na agenda", "Locker SOMMA nos dias de treino", "Café no point do clube", "Condição especial para virar aluno Evolve"],
  evolve: ["Desconto no café", "Tarifa especial no recovery", "Locker de aluno", "Aulas outdoor da grade Evolve"],
  "evolve-plus": ["3 vouchers de recovery por mês", "1º mês da assessoria SOMMA grátis", "Prioridade nas reservas e na quadra", "Desconto maior no café"],
};

const CREDITOS_INICIAIS: Record<Perfil, number> = { visitante: 0, somma: 0, evolve: 1, "evolve-plus": 3 };

const AGENDA = [
  { id: "mob", h: "06:30", nome: "Mobilidade", local: "Estação SOMMA · outdoor", marca: "evolve" as const },
  { id: "run", h: "07:00", nome: "Long run SOMMA", local: "Parque da Cidade", marca: "somma" as const },
  { id: "forca", h: "08:15", nome: "Força para corredores", local: "Evolve Performance", marca: "evolve" as const },
  { id: "core", h: "09:00", nome: "Core e alongamento", local: "Estação SOMMA · gramado", marca: "evolve" as const },
];

const HORARIOS_RECOVERY = ["07:40", "08:00", "08:20", "08:40"];

const CARDAPIO = [
  { grupo: "Antes", itens: ["Café especial", "Pré treino", "Bebida funcional"] },
  { grupo: "Depois", itens: ["Açaí", "Bowl", "Smoothie"] },
  { grupo: "Para ficar", itens: ["Breakfast", "Sanduíche", "Brunch"] },
];

const inicial = (): Estado => ({
  tela: "onb-1",
  perfil: "evolve",
  reservas: [],
  checkin: false,
  recoveryReservado: null,
  creditos: CREDITOS_INICIAIS.evolve,
  pedido: [],
});

function reducer(e: Estado, a: Acao): Estado {
  switch (a.t) {
    case "ir":
      return { ...e, tela: a.tela };
    case "perfil":
      return { ...e, perfil: a.perfil, creditos: CREDITOS_INICIAIS[a.perfil], tela: "onb-3" };
    case "reserva":
      return { ...e, reservas: e.reservas.includes(a.id) ? e.reservas.filter((r) => r !== a.id) : [...e.reservas, a.id] };
    case "checkin":
      return { ...e, checkin: true };
    case "recovery":
      return { ...e, recoveryReservado: a.hora, creditos: Math.max(0, e.creditos - 1), tela: "carteira" };
    case "pedido":
      return { ...e, pedido: e.pedido.includes(a.item) ? e.pedido.filter((p) => p !== a.item) : [...e.pedido, a.item] };
    case "pagar":
      return { ...e, tela: "cafe-ok" };
    case "reiniciar":
      return inicial();
  }
}

/* ── Peças ─────────────────────────────────────────────────────────────── */

function Botao({
  children,
  onClick,
  cor,
  vazado,
}: {
  children: React.ReactNode;
  onClick: () => void;
  cor?: string;
  vazado?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-3 py-3 text-center font-display text-[11px] font-semibold uppercase tracking-[0.25em] transition-opacity hover:opacity-80"
      style={
        vazado
          ? { border: `1px solid ${cor ?? "rgba(255,255,255,0.35)"}`, color: cor ?? "#F5F3EF" }
          : { backgroundColor: cor ?? "#F5F3EF", color: cor ? "#F5F3EF" : "#0A0A0A" }
      }
    >
      {children}
    </button>
  );
}

function Topo({ direita, voltar }: { direita?: string; voltar?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      {voltar ? (
        <button type="button" onClick={voltar} className="font-mono text-[10px] tracking-[0.2em] text-white/50 hover:text-white">
          VOLTAR
        </button>
      ) : (
        <div className="flex items-center gap-2.5">
          <EvolveLogo className="h-[0.75rem]" />
          <span className="h-3 w-px bg-white/25" aria-hidden />
          <SommaLogo className="h-[0.75rem]" />
        </div>
      )}
      {direita ? <span className="font-mono text-[9px] tracking-[0.2em] text-white/40">{direita}</span> : null}
    </div>
  );
}

function Titulo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <>
      <p className="mt-6 font-display text-[9px] font-semibold uppercase tracking-[0.3em] text-white/45">{rotulo}</p>
      <p className="mt-1 font-display text-[1.55rem] font-bold uppercase leading-[0.95] tracking-tight">{children}</p>
    </>
  );
}

const ABAS: { id: Tela; nome: string }[] = [
  { id: "agenda", nome: "Agenda" },
  { id: "checkin", nome: "Check in" },
  { id: "carteira", nome: "Carteira" },
  { id: "cafe", nome: "Café" },
];

function Abas({ ativa, ir }: { ativa: Tela; ir: (t: Tela) => void }) {
  const atual = ativa === "cafe-ok" ? "cafe" : ativa === "recovery" ? "carteira" : ativa;
  return (
    <div className="mt-auto grid grid-cols-4 border-t border-white/15 pt-3">
      {ABAS.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => ir(a.id)}
          className="py-1 font-display text-[9px] font-semibold uppercase tracking-[0.2em] transition-colors"
          style={{ color: atual === a.id ? "#F5F3EF" : "rgba(245,243,239,0.4)" }}
        >
          {a.nome}
          <span className="mx-auto mt-1.5 block h-px w-5" style={{ backgroundColor: atual === a.id ? ORANGE : "transparent" }} />
        </button>
      ))}
    </div>
  );
}

function Linha({
  a,
  b,
  c,
  cor,
  acao,
  acaoAtiva,
  onAcao,
}: {
  a: string;
  b: string;
  c?: string;
  cor?: string;
  acao?: string;
  acaoAtiva?: boolean;
  onAcao?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-white/15 py-2.5">
      <span className="w-10 shrink-0 font-mono text-[9px] text-white/50">{a}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[13px] font-semibold uppercase leading-none tracking-tight" style={cor ? { color: cor } : undefined}>
          {b}
        </p>
        {c ? <p className="mt-1 text-[9.5px] text-white/45">{c}</p> : null}
      </div>
      {acao ? (
        <button
          type="button"
          onClick={onAcao}
          className="shrink-0 px-2 py-1 font-display text-[9px] font-semibold uppercase tracking-[0.2em] transition-colors"
          style={
            acaoAtiva
              ? { backgroundColor: "#F5F3EF", color: "#0A0A0A" }
              : { border: "1px solid rgba(255,255,255,0.3)", color: "#F5F3EF" }
          }
        >
          {acaoAtiva ? "OK" : acao}
        </button>
      ) : null}
    </div>
  );
}

/* ── Telas ─────────────────────────────────────────────────────────────── */

function Conteudo({ e, d }: { e: Estado; d: React.Dispatch<Acao> }) {
  const ir = (tela: Tela) => d({ t: "ir", tela });
  const plus = e.perfil === "evolve-plus";
  const aluno = e.perfil === "evolve" || plus;

  switch (e.tela) {
    case "onb-1":
      return (
        <>
          <div className="flex items-center gap-3">
            <EvolveLogo className="h-4" />
            <span className="h-4 w-px bg-white/25" aria-hidden />
            <SommaLogo className="h-4" />
          </div>
          <div className="my-auto">
            <p className="font-display text-[9px] font-semibold uppercase tracking-[0.3em]" style={{ color: ORANGE }}>
              Novidade no seu app
            </p>
            <p className="mt-3 font-display text-[2rem] font-bold uppercase leading-[0.9] tracking-tight">
              A Estação SOMMA
              <br />
              chegou ao Parque
            </p>
            <p className="mt-4 text-[11.5px] font-light leading-relaxed text-white/65">
              Agenda, check in, recovery, café e benefícios do seu plano, dentro do app que você já usa.
            </p>
          </div>
          <Botao onClick={() => ir("onb-2")}>Começar</Botao>
        </>
      );

    case "onb-2":
      return (
        <>
          <Topo direita="1 / 2" voltar={() => ir("onb-1")} />
          <Titulo rotulo="Onboarding">Como você chega na Estação?</Titulo>
          <div className="mt-5">
            {PERFIS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => d({ t: "perfil", perfil: p.id })}
                className="flex w-full items-center justify-between border-t border-white/15 py-3 text-left transition-colors hover:bg-white/5"
              >
                <span>
                  <span className="block font-display text-[14px] font-semibold uppercase leading-none tracking-tight" style={p.id === "evolve-plus" ? { color: EVOLVE } : undefined}>
                    {p.nome}
                  </span>
                  <span className="mt-1 block text-[9.5px] text-white/45">{p.sub}</span>
                </span>
                <span className="font-mono text-[10px] text-white/40">→</span>
              </button>
            ))}
            <div className="border-t border-white/15" />
          </div>
          <p className="mt-auto text-[9.5px] leading-relaxed text-white/40">
            Aluno e Evolve+ são reconhecidos pelo cadastro da academia. SOMMA e visitante entram com o mesmo login.
          </p>
        </>
      );

    case "onb-3":
      return (
        <>
          <Topo direita="2 / 2" voltar={() => ir("onb-2")} />
          <Titulo rotulo={NOME_PERFIL[e.perfil]}>O que muda para você</Titulo>
          <div className="mt-5">
            {BENEFICIOS[e.perfil].map((b, i) => (
              <div key={b} className="flex items-baseline gap-3 border-t border-white/15 py-2.5">
                <span className="font-mono text-[9px] tracking-[0.2em]" style={{ color: aluno ? EVOLVE : ORANGE }}>
                  0{i + 1}
                </span>
                <span className="font-display text-[13px] font-semibold uppercase leading-tight tracking-tight">{b}</span>
              </div>
            ))}
            <div className="border-t border-white/15" />
          </div>
          <div className="mt-auto space-y-2">
            <Botao onClick={() => ir("agenda")}>Entrar na Estação</Botao>
            {!aluno ? (
              <Botao onClick={() => ir("agenda")} vazado cor={EVOLVE}>
                Conhecer os planos Evolve
              </Botao>
            ) : null}
          </div>
        </>
      );

    case "agenda":
      return (
        <>
          <Topo direita="SÁB" />
          <Titulo rotulo={`Hoje · ${NOME_PERFIL[e.perfil]}`}>Sua agenda</Titulo>
          <div className="mt-4">
            {AGENDA.map((s) => (
              <Linha
                key={s.id}
                a={s.h}
                b={s.nome}
                c={s.local}
                cor={s.marca === "somma" ? ORANGE : undefined}
                acao={s.marca === "somma" ? "Bora" : "Reservar"}
                acaoAtiva={e.reservas.includes(s.id)}
                onAcao={() => d({ t: "reserva", id: s.id })}
              />
            ))}
            <div className="border-t border-white/15" />
          </div>
          <p className="mt-3 text-[9.5px] text-white/40">
            {e.reservas.length ? `${e.reservas.length} reserva${e.reservas.length > 1 ? "s" : ""} para hoje. Check in na chegada.` : "Toque em reservar para garantir a vaga na aula outdoor."}
          </p>
          <Abas ativa={e.tela} ir={ir} />
        </>
      );

    case "checkin":
      return (
        <>
          <Topo direita="QR" />
          <Titulo rotulo="Check in">Estação SOMMA</Titulo>
          <QR ativo={e.checkin} />
          <p className="mt-3 text-center text-[10px] text-white/50">
            {e.checkin ? "Check in feito. Bom treino." : "Mesmo QR da catraca da unidade"}
          </p>
          <div className="mt-4">
            <div className="flex items-baseline justify-between border-t border-white/15 py-2">
              <span className="font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-white/60">Locker</span>
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.15em]">{e.checkin ? "14 · liberado" : "aguardando"}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-white/15 py-2">
              <span className="font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-white/60">Perfil</span>
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.15em]" style={aluno ? { color: EVOLVE } : undefined}>
                {NOME_PERFIL[e.perfil]}
              </span>
            </div>
            <div className="border-t border-white/15" />
          </div>
          <div className="mt-3">
            {!e.checkin ? <Botao onClick={() => d({ t: "checkin" })}>Fazer check in</Botao> : null}
          </div>
          <Abas ativa={e.tela} ir={ir} />
        </>
      );

    case "carteira":
      return (
        <>
          <Topo />
          <Titulo rotulo="Carteira">Seus benefícios</Titulo>
          <div className="mt-4">
            <Linha a="Café" b={aluno ? (plus ? "Desconto maior" : "Desconto do plano") : "Cardápio completo"} c={aluno ? "Aplicado no pedido" : "Sem desconto neste perfil"} />
            <Linha
              a="Recov."
              b={plus ? `${e.creditos} voucher${e.creditos === 1 ? "" : "s"} no mês` : aluno ? "Tarifa especial" : "Valor integral"}
              c={e.recoveryReservado ? `Reservado às ${e.recoveryReservado}` : "Toque para reservar"}
              cor={aluno ? EVOLVE : undefined}
              acao={e.recoveryReservado ? "OK" : "Reservar"}
              acaoAtiva={!!e.recoveryReservado}
              onAcao={() => (e.recoveryReservado ? null : ir("recovery"))}
            />
            <Linha a="SOMMA" b="Desafio do mês" c={e.checkin ? "Treino de hoje somado" : "Faça o check in para somar"} cor={ORANGE} />
            <Linha a="Locker" b={e.checkin ? "14 · em uso" : "Na chegada"} c={plus ? "Incluso no Evolve+" : aluno ? "Incluso para aluno" : e.perfil === "somma" ? "SOMMA nos dias de treino" : "Avulso"} />
            <div className="border-t border-white/15" />
          </div>
          {!aluno ? (
            <div className="mt-3">
              <Botao onClick={() => ir("onb-2")} vazado cor={EVOLVE}>
                Virar aluno Evolve
              </Botao>
            </div>
          ) : null}
          <Abas ativa={e.tela} ir={ir} />
        </>
      );

    case "recovery":
      return (
        <>
          <Topo direita="Recovery" voltar={() => ir("carteira")} />
          <Titulo rotulo="Recovery by Evolve">Escolha o horário</Titulo>
          <p className="mt-3 text-[10px] text-white/50">
            {plus ? "Usa 1 voucher do mês. Depois, crédito com desconto." : aluno ? "Tarifa especial de aluno." : "Valor integral para visitante."}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {HORARIOS_RECOVERY.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => d({ t: "recovery", hora: h })}
                className="border border-white/25 py-3 font-display text-[14px] font-semibold tracking-wide transition-colors hover:bg-white/10"
              >
                {h}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[9.5px] leading-relaxed text-white/40">Banheira de gelo, compression boots e área de descanso. Sessão de 30 min.</p>
          <Abas ativa={e.tela} ir={ir} />
        </>
      );

    case "cafe":
      return (
        <>
          <Topo direita="Balcão" />
          <Titulo rotulo="O café">Seu pedido</Titulo>
          <div className="mt-3 space-y-2.5">
            {CARDAPIO.map((g) => (
              <div key={g.grupo}>
                <p className="font-display text-[8.5px] font-semibold uppercase tracking-[0.3em]" style={{ color: ORANGE }}>
                  {g.grupo}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {g.itens.map((it) => {
                    const on = e.pedido.includes(it);
                    return (
                      <button
                        key={it}
                        type="button"
                        onClick={() => d({ t: "pedido", item: it })}
                        className="px-2 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors"
                        style={on ? { backgroundColor: "#F5F3EF", color: "#0A0A0A" } : { border: "1px solid rgba(255,255,255,0.3)" }}
                      >
                        {it}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-white/15 pt-2">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-white/60">Itens</span>
              <span className="font-mono text-[11px]">{e.pedido.length}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-white/60">Benefício</span>
              <span className="font-display text-[10px] font-semibold uppercase tracking-[0.15em]" style={aluno ? { color: EVOLVE } : undefined}>
                {aluno ? (plus ? "Evolve+ aplicado" : "Aluno aplicado") : "Nenhum"}
              </span>
            </div>
          </div>
          <div className="mt-2">
            {e.pedido.length ? (
              <Botao onClick={() => d({ t: "pagar" })} cor={ORANGE}>
                Pagar com a carteira
              </Botao>
            ) : (
              <Botao onClick={() => null} vazado>
                Escolha os itens
              </Botao>
            )}
          </div>
          <Abas ativa={e.tela} ir={ir} />
        </>
      );

    case "cafe-ok":
      return (
        <>
          <Topo direita="Balcão" />
          <div className="my-auto text-center">
            <p className="font-display text-[9px] font-semibold uppercase tracking-[0.3em]" style={{ color: ORANGE }}>
              Pedido enviado
            </p>
            <p className="mt-3 font-display text-[1.8rem] font-bold uppercase leading-[0.92] tracking-tight">
              Retire no balcão
              <br />
              em instantes
            </p>
            <p className="mx-auto mt-4 max-w-[220px] text-[11px] font-light leading-relaxed text-white/60">
              {e.pedido.join(" · ")}.{aluno ? " Benefício do plano aplicado." : ""}
            </p>
            <p className="mt-5 font-mono text-[22px] tracking-[0.3em]">S 27</p>
          </div>
          <Abas ativa={e.tela} ir={ir} />
        </>
      );
  }
}

/** Padrão de blocos que sugere um QR, pulsando quando o check in é feito. */
function QR({ ativo }: { ativo: boolean }) {
  const blocos = ["1101101", "1000101", "1011001", "1010111", "1101001", "1000011", "1111101"];
  return (
    <div className="mx-auto mt-5 grid w-[56%] grid-cols-7 gap-[3px]" aria-hidden>
      {blocos.flatMap((linha, i) =>
        linha.split("").map((b, j) => (
          <span
            key={`${i}-${j}`}
            className="aspect-square transition-colors duration-500"
            style={{ backgroundColor: b === "1" ? (ativo ? ORANGE : "#F5F3EF") : "transparent" }}
          />
        )),
      )}
    </div>
  );
}

/* ── Aparelho ──────────────────────────────────────────────────────────── */

export function AppEstacao({ className = "", cheio = false }: { className?: string; cheio?: boolean }) {
  const [e, d] = useReducer(reducer, undefined, inicial);
  const tela = useRef<HTMLDivElement>(null);

  // Transição curta entre telas: entra de baixo com fade.
  useEffect(() => {
    if (!tela.current) return;
    const tw = gsap.fromTo(tela.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
    return () => {
      tw.kill();
    };
  }, [e.tela]);

  if (cheio) {
    // Modo tela cheia: o telefone de quem escaneou o QR é a própria moldura.
    return (
      <div className={`flex min-h-[100dvh] flex-col bg-[#0A0A0A] px-6 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-[#F5F3EF] sm:min-h-0 sm:border sm:border-white/15 sm:px-7 sm:pb-7 sm:pt-7 ${className}`} style={{ ["--fg-faint" as string]: "rgba(245,243,239,0.38)", ["--fg" as string]: "#F5F3EF", ["--line" as string]: "rgba(245,243,239,0.16)" }}>
        <div ref={tela} key={e.tela} className="app-cheio flex flex-1 flex-col sm:min-h-[680px]">
          <Conteudo e={e} d={d} />
        </div>
        {/* No telefone o conteúdo ganha um pouco mais de corpo; no desktop fica no tamanho do deck. */}
        <style>{`@media (max-width: 639px) { .app-cheio { zoom: 1.12; } }`}</style>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
          <p className="font-display text-[9px] font-medium uppercase tracking-[0.22em] text-white/35">
            Estação SOMMA · protótipo navegável
          </p>
          <button
            type="button"
            onClick={() => d({ t: "reiniciar" })}
            className="font-mono text-[10px] tracking-[0.2em] text-white/40 transition-colors hover:text-white"
          >
            REINICIAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`a-up w-full ${className}`}>
      <div className="border border-[color:var(--line)] bg-[#0A0A0A] p-5 text-[#F5F3EF]" style={{ aspectRatio: "9 / 17" }}>
        <div ref={tela} key={e.tela} className="flex h-full flex-col">
          <Conteudo e={e} d={d} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-[color:var(--fg-faint)]">
          Protótipo navegável · toque para usar
        </p>
        <button
          type="button"
          onClick={() => d({ t: "reiniciar" })}
          className="font-mono text-[10px] tracking-[0.2em] text-[color:var(--fg-faint)] transition-colors hover:text-[color:var(--fg)]"
        >
          REINICIAR
        </button>
      </div>
    </div>
  );
}
