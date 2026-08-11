import Image from "next/image";
import { Icon, type IconName } from "./_icons";

/* ══════════════════════════════════════════════════════════════════════════
   Sistema visual do deck Somma × Silver Care.

   Duas bases alternadas: preto (fotografia e manifesto) e bone (produto,
   planos e tabelas). Cada slide publica as cores em variáveis CSS, e todos os
   componentes leem essas variáveis, por isso o mesmo card funciona nos dois
   temas sem duplicação.
   ══════════════════════════════════════════════════════════════════════════ */

export const INK = "#0A0A0A";
export const BONE = "#F2EEE6";
export const ORANGE = "#FF2C04";
export const SUN = "#FFB020";

export type Tema = "escuro" | "claro";

/** Variáveis de cor de cada base. Entram no `style` do slide e cascateiam. */
export const TEMAS: Record<Tema, Record<string, string>> = {
  escuro: {
    "--fg": "#F5F1EA",
    "--fg-soft": "rgba(245,241,234,0.64)",
    "--fg-faint": "rgba(245,241,234,0.34)",
    "--line": "rgba(245,241,234,0.14)",
    "--surface": "rgba(245,241,234,0.05)",
    "--surface-2": "rgba(245,241,234,0.09)",
  },
  claro: {
    "--fg": "#0A0A0A",
    "--fg-soft": "rgba(10,10,10,0.66)",
    "--fg-faint": "rgba(10,10,10,0.38)",
    "--line": "rgba(10,10,10,0.14)",
    "--surface": "rgba(255,255,255,0.72)",
    "--surface-2": "rgba(10,10,10,0.05)",
  },
};

/* ── Estrutura ─────────────────────────────────────────────────────────── */

export function Slide({
  index,
  name,
  tema = "escuro",
  bg,
  className = "",
  children,
}: {
  index: number;
  name: string;
  tema?: Tema;
  /** Cor de fundo. Padrão: preto no tema escuro, bone no claro. */
  bg?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-slide={name}
      data-index={index}
      style={
        {
          ...TEMAS[tema],
          backgroundColor: bg ?? (tema === "claro" ? BONE : INK),
        } as React.CSSProperties
      }
      className={`relative flex min-h-[100svh] w-full snap-start flex-col justify-center overflow-hidden px-2 py-16 text-[color:var(--fg)] md:py-20 ${className}`}
    >
      {children}
    </section>
  );
}

/** Foto de fundo com véu. `veil` controla quanta imagem sobra por baixo do texto. */
export function BgPhoto({
  src,
  alt,
  veil = "forte",
  position = "center",
  priority = false,
}: {
  src: string;
  alt: string;
  veil?: "leve" | "medio" | "forte" | "lateral";
  position?: string;
  priority?: boolean;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={90}
        sizes="100vw"
        className="parallax scale-[1.08] object-cover"
        style={{ objectPosition: position }}
      />
      {veil === "lateral" ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-[#0A0A0A]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/50" />
        </>
      ) : veil === "leve" ? (
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/35 to-[#0A0A0A]/25" />
      ) : veil === "medio" ? (
        <>
          <div className="absolute inset-0 bg-[#0A0A0A]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-[#0A0A0A]/55" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[#0A0A0A]/[0.78]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-[#0A0A0A]/70" />
        </>
      )}
    </div>
  );
}

/** Retrato emoldurado, usado nos slides editoriais em duas colunas. */
export function PhotoFrame({
  src,
  alt,
  className = "",
  ratio = "aspect-[3/4]",
  position = "center",
}: {
  src: string;
  alt: string;
  className?: string;
  ratio?: string;
  position?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl ${ratio} ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        quality={90}
        sizes="(max-width: 768px) 100vw, 45vw"
        className="object-cover"
        style={{ objectPosition: position }}
      />
    </div>
  );
}

/** Sol nascendo: anéis concêntricos, marca gráfica da campanha. */
export function SunRings({
  className = "",
  cor = SUN,
  disco = true,
}: {
  className?: string;
  cor?: string;
  /** O disco cheio no centro. Desligado quando os anéis passam atrás de texto. */
  disco?: boolean;
}) {
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden>
      <svg viewBox="0 0 400 400" className="h-full w-full">
        {[60, 100, 140, 180].map((r, i) => (
          <circle
            key={r}
            cx="200"
            cy="200"
            r={r}
            fill="none"
            stroke={cor}
            strokeWidth="1"
            opacity={0.5 - i * 0.1}
          />
        ))}
        {disco ? <circle cx="200" cy="200" r="26" fill={cor} opacity="0.9" /> : null}
      </svg>
    </div>
  );
}

/** Malha sutil para os slides sem foto. */
export function Grid({ tema = "escuro" }: { tema?: Tema }) {
  const linha = tema === "claro" ? "rgba(10,10,10,.5)" : "rgba(245,241,234,.6)";
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      aria-hidden
      style={{
        backgroundImage: `linear-gradient(${linha} 1px, transparent 1px), linear-gradient(90deg, ${linha} 1px, transparent 1px)`,
        backgroundSize: "76px 76px",
        maskImage: "radial-gradient(70% 60% at 50% 40%, #000 20%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(70% 60% at 50% 40%, #000 20%, transparent 100%)",
      }}
    />
  );
}

/* ── Tipografia ────────────────────────────────────────────────────────── */

export function Kicker({
  children,
  className = "",
  cor = ORANGE,
}: {
  children: React.ReactNode;
  className?: string;
  cor?: string;
}) {
  return (
    <p
      className={`a-up flex items-center gap-2.5 font-display text-[10px] font-semibold uppercase tracking-[0.24em] sm:gap-3 sm:text-xs sm:tracking-[0.38em] ${className}`}
      style={{ color: cor }}
    >
      <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: cor }} aria-hidden />
      {children}
    </p>
  );
}

export function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="a-mask mt-5 overflow-hidden py-1">
      <h2
        className={`font-display text-[2rem] font-bold uppercase leading-[0.92] tracking-[-0.01em] sm:text-5xl md:text-[4.2rem] ${className}`}
      >
        {children}
      </h2>
    </div>
  );
}

export function Lead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`a-up mt-5 max-w-3xl text-[15px] font-light leading-relaxed text-[color:var(--fg-soft)] sm:mt-6 md:text-lg ${className}`}
    >
      {children}
    </p>
  );
}

export function Accent({ children, cor = ORANGE }: { children: React.ReactNode; cor?: string }) {
  return <span style={{ color: cor }}>{children}</span>;
}

/** Frase-manifesto em serifa: o respiro editorial do deck. */
export function Manifesto({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`a-up text-[1.7rem] font-normal italic leading-[1.22] tracking-[-0.01em] sm:text-4xl md:text-[3.2rem] ${className}`}
      style={{ fontFamily: "var(--font-editorial), Georgia, serif" }}
    >
      {children}
    </p>
  );
}

/** Faixa de destaque com barra lateral. */
export function Destaque({ children, cor = ORANGE }: { children: React.ReactNode; cor?: string }) {
  return (
    <p
      className="a-up mt-8 max-w-3xl border-l-2 pl-5 font-display text-lg font-medium uppercase leading-snug tracking-tight md:text-2xl"
      style={{ borderColor: cor }}
    >
      {children}
    </p>
  );
}

export function Nota({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`a-up mt-6 text-xs leading-relaxed text-[color:var(--fg-faint)] ${className}`}>
      {children}
    </p>
  );
}

/* ── Peças ─────────────────────────────────────────────────────────────── */

export function Chip({ icon, label }: { icon?: IconName; label: string }) {
  return (
    <span className="a-up inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3.5 py-2 backdrop-blur-sm">
      {icon ? (
        <span style={{ color: ORANGE }}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
      ) : null}
      <span className="text-[12px] font-medium text-[color:var(--fg-soft)]">{label}</span>
    </span>
  );
}

export function Selo({
  children,
  cor = ORANGE,
}: {
  children: React.ReactNode;
  cor?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.2em]"
      style={{ backgroundColor: `${cor}1F`, color: cor }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cor }} aria-hidden />
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
  destaque,
}: {
  children: React.ReactNode;
  className?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`a-up rounded-3xl border p-6 backdrop-blur-sm ${className}`}
      style={
        destaque
          ? { borderColor: `${ORANGE}59`, backgroundColor: `${ORANGE}0F` }
          : { borderColor: "var(--line)", backgroundColor: "var(--surface)" }
      }
    >
      {children}
    </div>
  );
}

/** Bloco rótulo/valor das fichas técnicas. */
export function Bloco({
  rotulo,
  valor,
  apoio,
  destaque,
}: {
  rotulo: string;
  valor: string;
  apoio?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className="a-up rounded-2xl border p-4 backdrop-blur-sm sm:p-5"
      style={
        destaque
          ? { borderColor: `${ORANGE}59`, backgroundColor: `${ORANGE}12` }
          : { borderColor: "var(--line)", backgroundColor: "var(--surface)" }
      }
    >
      <p className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--fg-faint)]">
        {rotulo}
      </p>
      <p
        className="mt-2 font-display text-xl font-bold uppercase leading-tight tracking-tight sm:text-2xl"
        style={destaque ? { color: ORANGE } : undefined}
      >
        {valor}
      </p>
      {apoio ? <p className="mt-1 text-xs text-[color:var(--fg-faint)]">{apoio}</p> : null}
    </div>
  );
}

/** Número grande + rótulo. Usado nas provas de comunidade e mensuração. */
export function Numero({
  valor,
  label,
  nota,
  cor,
}: {
  valor: string;
  label: string;
  nota?: string;
  cor?: string;
}) {
  return (
    <div className="a-up">
      <p
        className="font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl md:text-6xl"
        style={{ color: cor ?? "var(--fg)" }}
      >
        {valor}
      </p>
      <p className="mt-2.5 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-soft)]">
        {label}
      </p>
      {nota ? <p className="mt-1 text-[11px] text-[color:var(--fg-faint)]">{nota}</p> : null}
    </div>
  );
}

/** Passo numerado das jornadas (antes/durante/depois, etapas da campanha). */
export function Passo({
  n,
  icon,
  titulo,
  detalhe,
  itens,
  ultimo,
  cor = ORANGE,
}: {
  n: string;
  icon?: IconName;
  titulo: string;
  detalhe?: string;
  itens?: readonly string[];
  ultimo?: boolean;
  cor?: string;
}) {
  return (
    <div className="a-up relative">
      <div className="flex items-center gap-3">
        <span
          data-node
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-bold tracking-wider"
          style={{ backgroundColor: `${cor}1F`, color: cor }}
        >
          {n}
        </span>
        {!ultimo ? (
          <span className="a-rail hidden h-px flex-1 origin-left bg-[color:var(--line)] lg:block" aria-hidden />
        ) : null}
      </div>

      {icon ? (
        <span className="mt-5 block" style={{ color: cor }}>
          <Icon name={icon} className="h-7 w-7" />
        </span>
      ) : null}

      <h3 className="mt-4 font-display text-xl font-semibold uppercase leading-tight tracking-tight sm:text-2xl">
        {titulo}
      </h3>
      {detalhe ? (
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--fg-soft)]">{detalhe}</p>
      ) : null}
      {itens ? (
        <ul className="mt-3.5 space-y-1.5">
          {itens.map((i) => (
            <li key={i} className="flex gap-2 text-sm text-[color:var(--fg-soft)]">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
              {i}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ── Tabela ────────────────────────────────────────────────────────────── */

export type DTRow = { cells: readonly React.ReactNode[]; marco?: boolean };

export function DataTable({
  head,
  rows,
  colW,
  accent = ORANGE,
  compacto = false,
}: {
  head: readonly string[];
  rows: readonly DTRow[];
  colW?: readonly string[];
  accent?: string;
  /** Linhas mais baixas, para tabelas longas que precisam caber no slide. */
  compacto?: boolean;
}) {
  const pad = compacto ? "px-4 py-2.5 sm:px-5" : "px-4 py-3.5 sm:px-5";
  return (
    <div className="a-up overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          {colW ? (
            <colgroup>
              {colW.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
          ) : null}
          <thead>
            <tr>
              {head.map((h) => (
                <th
                  key={h}
                  className={`border-b border-[color:var(--line)] font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-faint)] ${pad}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={r.marco ? { backgroundColor: `${accent}0F` } : undefined}>
                {r.cells.map((c, j) => (
                  <td
                    key={j}
                    className={`border-b border-[color:var(--line)] align-middle text-[13px] leading-relaxed sm:text-sm ${pad} ${
                      j === 0
                        ? "font-display text-[13px] font-semibold uppercase tracking-wide sm:text-sm"
                        : "text-[color:var(--fg-soft)]"
                    }`}
                    style={j === 0 && r.marco ? { color: accent } : undefined}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Marca de presença/ausência no comparativo de planos. */
export function Marca({ value }: { value: string }) {
  if (value === "nao") {
    // Ausência marcada por um círculo vazado, na mesma caixa da marca de
    // presença, para as colunas ficarem alinhadas.
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center"
        role="img"
        aria-label="Não incluso"
      >
        <span
          className="h-2.5 w-2.5 rounded-full border"
          style={{ borderColor: "var(--fg-faint)" }}
        />
      </span>
    );
  }
  if (value === "•") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: `${ORANGE}24` }}>
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round">
          <path d="m2.5 6.2 2.4 2.4L9.5 3.6" />
        </svg>
      </span>
    );
  }
  return <span className="text-[13px] text-[color:var(--fg-soft)]">{value}</span>;
}
