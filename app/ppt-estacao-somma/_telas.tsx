import { EvolveLogo, SommaLogo } from "./_marca";

/* ══════════════════════════════════════════════════════════════════════════
   Simulações de tela da camada digital. São conceitos de interface para
   leitura da proposta, não um produto pronto: preto e branco, tipografia do
   deck, logos oficiais das duas marcas. Nada de dashboard.
   ══════════════════════════════════════════════════════════════════════════ */

const EVOLVE = "#DF271B";
const ORANGE = "#FF2C03";

function Moldura({
  children,
  rotulo,
  className = "",
}: {
  children: React.ReactNode;
  rotulo: string;
  className?: string;
}) {
  return (
    <div className={`a-up w-full ${className}`}>
      <div
        className="flex flex-col border border-white/15 bg-[#0A0A0A] p-5 text-[#F5F3EF]"
        style={{ aspectRatio: "9 / 17.5" }}
      >
        {children}
      </div>
      <p className="mt-3 font-display text-[10px] font-medium uppercase tracking-[0.22em] text-[color:var(--fg-faint)]">
        {rotulo}
      </p>
    </div>
  );
}

function Topo({ direita }: { direita?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <EvolveLogo className="h-[0.72rem]" />
        <span className="h-3 w-px bg-white/25" aria-hidden />
        <SommaLogo className="h-[0.72rem]" />
      </div>
      {direita ? <span className="font-mono text-[9px] tracking-[0.2em] text-white/40">{direita}</span> : null}
    </div>
  );
}

function Linha({ a, b, c, cor }: { a: string; b: string; c?: string; cor?: string }) {
  return (
    <div className="flex items-baseline gap-3 border-t border-white/15 py-2.5">
      <span className="w-10 shrink-0 font-mono text-[9px] text-white/50">{a}</span>
      <div className="min-w-0">
        <p className="truncate font-display text-[13px] font-semibold uppercase leading-none tracking-tight" style={cor ? { color: cor } : undefined}>
          {b}
        </p>
        {c ? <p className="mt-1 text-[9.5px] text-white/45">{c}</p> : null}
      </div>
    </div>
  );
}

/** Tela 1: agenda unificada, unidades Evolve + Estação + SOMMA. */
export function TelaAgenda({ className = "" }: { className?: string }) {
  return (
    <Moldura rotulo="01 · Agenda unificada" className={className}>
      <Topo direita="SÁB" />
      <p className="mt-7 font-display text-[9px] font-semibold uppercase tracking-[0.3em] text-white/45">Hoje</p>
      <p className="mt-1 font-display text-2xl font-bold uppercase leading-none tracking-tight">Sua agenda</p>
      <div className="mt-5">
        <Linha a="06:30" b="Mobilidade" c="Estação SOMMA · outdoor" />
        <Linha a="07:00" b="Long run SOMMA" c="Parque da Cidade" cor={ORANGE} />
        <Linha a="08:15" b="Recovery" c="Estação SOMMA · 30 min" />
        <Linha a="18:00" b="Força" c="Evolve · unidade" cor={EVOLVE} />
        <div className="border-t border-white/15" />
      </div>
      <div className="mt-auto border border-white/25 px-3 py-2.5 text-center font-display text-[10px] font-semibold uppercase tracking-[0.25em]">
        Reservar aula outdoor
      </div>
    </Moldura>
  );
}

/** Tela 2: check in na Estação com o mesmo QR da unidade. */
export function TelaCheckin({ className = "" }: { className?: string }) {
  // Padrão de blocos só para sugerir um QR na simulação.
  const blocos = [
    "1101101", "1000101", "1011001", "1010111", "1101001", "1000011", "1111101",
  ];
  return (
    <Moldura rotulo="02 · Check in único" className={className}>
      <Topo direita="QR" />
      <p className="mt-7 font-display text-[9px] font-semibold uppercase tracking-[0.3em] text-white/45">Check in</p>
      <p className="mt-1 font-display text-2xl font-bold uppercase leading-none tracking-tight">Estação SOMMA</p>
      <div className="mx-auto mt-6 grid w-[68%] grid-cols-7 gap-[3px]" aria-hidden>
        {blocos.flatMap((linha, i) =>
          linha.split("").map((b, j) => (
            <span key={`${i}-${j}`} className="aspect-square" style={{ backgroundColor: b === "1" ? "#F5F3EF" : "transparent" }} />
          )),
        )}
      </div>
      <p className="mt-5 text-center text-[10px] text-white/50">Mesmo QR da catraca da unidade</p>
      <div className="mt-auto">
        <div className="flex items-baseline justify-between border-t border-white/15 py-2.5">
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-white/60">Locker</span>
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.15em]">Liberado</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-white/15 py-2.5">
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-white/60">Plano</span>
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: EVOLVE }}>
            Evolve+
          </span>
        </div>
        <div className="border-t border-white/15" />
      </div>
    </Moldura>
  );
}

/** Tela 3: carteira de créditos e benefícios valendo no café. */
export function TelaCarteira({ className = "" }: { className?: string }) {
  return (
    <Moldura rotulo="03 · Carteira e benefícios" className={className}>
      <Topo />
      <p className="mt-7 font-display text-[9px] font-semibold uppercase tracking-[0.3em] text-white/45">Carteira</p>
      <p className="mt-1 font-display text-2xl font-bold uppercase leading-none tracking-tight">Seus benefícios</p>
      <div className="mt-5">
        <Linha a="Café" b="Desconto do plano" c="Aplicado no pedido" />
        <Linha a="Recov." b="Créditos do mês" c="Saldo disponível" cor={EVOLVE} />
        <Linha a="SOMMA" b="Desafio do mês" c="Treino de hoje somado" cor={ORANGE} />
        <div className="border-t border-white/15" />
      </div>
      <div className="mt-5 border border-white/20 px-3 py-3">
        <p className="font-display text-[9px] font-semibold uppercase tracking-[0.25em] text-white/45">Pedido · balcão</p>
        <p className="mt-1.5 font-display text-[13px] font-semibold uppercase leading-tight tracking-tight">Café especial + bowl</p>
        <p className="mt-1 text-[9.5px] text-white/45">Benefício Evolve reconhecido</p>
      </div>
      <div className="mt-auto border px-3 py-2.5 text-center font-display text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ borderColor: ORANGE, color: ORANGE }}>
        Pagar com a carteira
      </div>
    </Moldura>
  );
}
