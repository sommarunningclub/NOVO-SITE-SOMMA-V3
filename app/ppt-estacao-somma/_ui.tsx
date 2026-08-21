import Image from "next/image";

/* ══════════════════════════════════════════════════════════════════════════
   Sistema visual da apresentação Estação SOMMA.

   Três bases: preto (fotografia, renders e manifesto), grafite (transição) e
   branco (conteúdo, comparativos). Cada slide publica as cores em variáveis
   CSS e os componentes leem essas variáveis, então a mesma peça funciona nas
   três bases. Sem cantos arredondados, sem ícones, sem formas decorativas:
   a hierarquia é tipográfica e as divisões são linhas finas.
   ══════════════════════════════════════════════════════════════════════════ */

export const INK = "#0A0A0A";
export const GRAFITE = "#161616";
export const BRANCO = "#FFFFFF";
export const ORANGE = "#FF2C03";
export const EVOLVE = "#DF271B";

export type Tema = "escuro" | "grafite" | "claro";

export const TEMAS: Record<Tema, Record<string, string>> = {
  escuro: {
    "--bg": INK,
    "--fg": "#F5F3EF",
    "--fg-soft": "rgba(245,243,239,0.68)",
    "--fg-faint": "rgba(245,243,239,0.38)",
    "--line": "rgba(245,243,239,0.16)",
    "--surface": "rgba(245,243,239,0.04)",
  },
  grafite: {
    "--bg": GRAFITE,
    "--fg": "#F5F3EF",
    "--fg-soft": "rgba(245,243,239,0.68)",
    "--fg-faint": "rgba(245,243,239,0.38)",
    "--line": "rgba(245,243,239,0.16)",
    "--surface": "rgba(245,243,239,0.05)",
  },
  claro: {
    "--bg": BRANCO,
    "--fg": INK,
    "--fg-soft": "rgba(10,10,10,0.66)",
    "--fg-faint": "rgba(10,10,10,0.4)",
    "--line": "rgba(10,10,10,0.14)",
    "--surface": "rgba(10,10,10,0.035)",
  },
};

/* ── Estrutura ─────────────────────────────────────────────────────────── */

export function Slide({
  index,
  name,
  tema = "escuro",
  className = "",
  children,
}: {
  index: number;
  name: string;
  tema?: Tema;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-slide={name}
      data-index={index}
      data-tema={tema}
      style={{ ...TEMAS[tema], backgroundColor: TEMAS[tema]["--bg"] } as React.CSSProperties}
      className={`relative flex min-h-[100svh] w-full snap-start flex-col justify-center overflow-hidden py-16 text-[color:var(--fg)] md:py-20 ${className}`}
    >
      {children}
    </section>
  );
}

/** Miolo do slide: margens largas, como uma página editorial. */
export function Miolo({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative z-10 mx-auto w-full max-w-[84rem] px-6 sm:px-10 md:px-14 lg:px-20 ${className}`}>
      {children}
    </div>
  );
}

/** Rodapé fixo do slide: número à esquerda, assinatura à direita. */
export function Rodape({ texto = "Estação SOMMA · Café, Cultura e Movimento" }: { texto?: string }) {
  return (
    <p className="pointer-events-none absolute bottom-6 right-6 z-10 hidden font-display text-[10px] uppercase tracking-[0.3em] text-[color:var(--fg-faint)] md:block md:right-10">
      {texto}
    </p>
  );
}

/* ── Imagem ────────────────────────────────────────────────────────────── */

/** Foto de fundo em sangria. `veil` controla quanta imagem sobra por baixo do texto. */
export function BgPhoto({
  src,
  alt,
  veil = "forte",
  position = "center",
  priority = false,
}: {
  src: string;
  alt: string;
  veil?: "leve" | "medio" | "forte" | "lateral" | "base";
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/75 to-[#0A0A0A]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-transparent to-[#0A0A0A]/40" />
        </>
      ) : veil === "base" ? (
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/55 to-[#0A0A0A]/15" />
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

/** Fotografia emoldurada, cantos retos, com legenda opcional. */
export function Foto({
  src,
  alt,
  legenda,
  className = "",
  ratio = "aspect-[4/5]",
  position = "center",
  sizes = "(max-width: 768px) 100vw, 45vw",
}: {
  src: string;
  alt: string;
  legenda?: string;
  className?: string;
  ratio?: string;
  position?: string;
  sizes?: string;
}) {
  return (
    <figure className={`a-up ${className}`}>
      <div className={`relative overflow-hidden ${ratio}`}>
        <Image src={src} alt={alt} fill quality={90} sizes={sizes} className="object-cover" style={{ objectPosition: position }} />
      </div>
      {legenda ? (
        <figcaption className="mt-2.5 font-display text-[10px] font-medium uppercase tracking-[0.22em] text-[color:var(--fg-faint)]">
          {legenda}
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * Prancha reservada: ocupa o lugar de um render ou fotografia que ainda não
 * existe no projeto. Visual de folha de arquitetura, sem fingir imagem.
 */
export function Prancha({
  rotulo,
  detalhe,
  className = "",
  ratio = "aspect-[4/5]",
  arquivo,
}: {
  rotulo: string;
  detalhe?: string;
  className?: string;
  ratio?: string;
  /** Nome do arquivo esperado em /public/estacao-somma (só para quem edita). */
  arquivo?: string;
}) {
  return (
    <figure className={`a-up ${className}`} data-arquivo={arquivo}>
      <div
        className={`relative flex ${ratio} flex-col justify-between border border-[color:var(--line)] bg-[color:var(--surface)] p-5`}
        style={{
          backgroundImage:
            "linear-gradient(var(--surface) 1px, transparent 1px), linear-gradient(90deg, var(--surface) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
          backgroundPosition: "center",
        }}
      >
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--fg-faint)]">
          {rotulo}
        </span>
        <div>
          <span className="block h-px w-10 bg-[color:var(--fg-faint)]" aria-hidden />
          <span className="mt-3 block font-display text-sm font-medium uppercase tracking-[0.12em] text-[color:var(--fg-soft)]">
            {detalhe ?? "Imagem em desenvolvimento"}
          </span>
        </div>
      </div>
    </figure>
  );
}

/** Usa a imagem se ela existir; senão, a prancha reservada no mesmo lugar. */
export function FotoOuPrancha({
  src,
  alt,
  rotulo,
  detalhe,
  legenda,
  arquivo,
  ...rest
}: {
  src: string | null;
  alt: string;
  rotulo: string;
  detalhe?: string;
  legenda?: string;
  arquivo?: string;
  className?: string;
  ratio?: string;
  position?: string;
  sizes?: string;
}) {
  if (src) return <Foto src={src} alt={alt} legenda={legenda} {...rest} />;
  return <Prancha rotulo={rotulo} detalhe={detalhe} arquivo={arquivo} className={rest.className} ratio={rest.ratio} />;
}

/* ── Tipografia ────────────────────────────────────────────────────────── */

export function Kicker({
  children,
  className = "",
  cor,
}: {
  children: React.ReactNode;
  className?: string;
  cor?: string;
}) {
  return (
    <p
      className={`a-up flex items-center gap-3 font-display text-[10px] font-semibold uppercase tracking-[0.32em] sm:text-[11px] sm:tracking-[0.4em] ${className}`}
      style={{ color: cor ?? "var(--fg-soft)" }}
    >
      <span className="h-px w-6" style={{ backgroundColor: cor ?? "var(--fg-soft)" }} aria-hidden />
      {children}
    </p>
  );
}

export function H2({
  children,
  className = "",
  tamanho = "md",
}: {
  children: React.ReactNode;
  className?: string;
  tamanho?: "md" | "lg" | "xl";
}) {
  const t =
    tamanho === "xl"
      ? "text-[2.8rem] sm:text-6xl md:text-[5.6rem] lg:text-[6.4rem]"
      : tamanho === "lg"
        ? "text-[2.4rem] sm:text-5xl md:text-[4.6rem] lg:text-[5.2rem]"
        : "text-[2.1rem] sm:text-5xl md:text-[3.9rem] lg:text-[4.3rem]";
  return (
    <div className="a-mask mt-5 overflow-hidden py-1">
      <h2 className={`font-display font-bold uppercase leading-[0.9] tracking-[-0.01em] ${t} ${className}`}>{children}</h2>
    </div>
  );
}

export function Lead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`a-up mt-6 max-w-2xl text-[15px] font-light leading-relaxed text-[color:var(--fg-soft)] md:text-lg xl:text-xl ${className}`}
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
      className={`a-up text-[1.6rem] font-normal italic leading-[1.2] tracking-[-0.01em] sm:text-3xl md:text-[2.8rem] ${className}`}
      style={{ fontFamily: "var(--font-editorial), Georgia, serif" }}
    >
      {children}
    </p>
  );
}

export function Nota({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`a-up mt-8 max-w-2xl text-[11.5px] leading-relaxed text-[color:var(--fg-faint)] ${className}`}>
      {children}
    </p>
  );
}

/* ── Peças tipográficas ────────────────────────────────────────────────── */

/** Índice pequeno, monoespaçado, que acompanha listas e passos. */
export function Indice({ n, cor }: { n: string; cor?: string }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.25em]" style={{ color: cor ?? "var(--fg-faint)" }}>
      {n}
    </span>
  );
}

/** Lista editorial: cada item é uma linha com régua superior, índice e texto. */
export function Linhas({
  itens,
  cor,
  colunas = 1,
  tamanho = "md",
  className = "",
}: {
  itens: readonly (string | { titulo: string; texto?: string })[];
  cor?: string;
  colunas?: 1 | 2 | 3 | 4;
  tamanho?: "sm" | "md" | "lg";
  className?: string;
}) {
  const grid =
    colunas === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : colunas === 3
        ? "sm:grid-cols-3"
        : colunas === 2
          ? "sm:grid-cols-2"
          : "";
  const tt =
    tamanho === "lg"
      ? "text-2xl sm:text-3xl md:text-[2.3rem]"
      : tamanho === "sm"
        ? "text-base sm:text-lg"
        : "text-xl sm:text-2xl";
  return (
    <div className={`grid gap-x-8 ${grid} ${className}`}>
      {itens.map((it, i) => {
        const item = typeof it === "string" ? { titulo: it } : it;
        return (
          <div key={item.titulo} className="a-up border-t border-[color:var(--line)] py-4">
            <div className="flex items-baseline gap-4">
              <Indice n={String(i + 1).padStart(2, "0")} cor={cor} />
              <div>
                <p className={`font-display font-semibold uppercase leading-none tracking-tight ${tt}`}>{item.titulo}</p>
                {item.texto ? (
                  <p className="mt-2 max-w-md text-[13.5px] font-light leading-relaxed text-[color:var(--fg-soft)]">
                    {item.texto}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Palavras soltas em sequência: um "menu" tipográfico, sem chips nem caixas. */
export function Palavras({
  itens,
  className = "",
  tamanho = "md",
  cor,
}: {
  itens: readonly string[];
  className?: string;
  tamanho?: "sm" | "md" | "lg" | "xl";
  cor?: string;
}) {
  const t =
    tamanho === "xl"
      ? "text-3xl sm:text-5xl md:text-6xl"
      : tamanho === "lg"
        ? "text-2xl sm:text-4xl md:text-5xl"
        : tamanho === "sm"
          ? "text-base sm:text-lg md:text-xl"
          : "text-xl sm:text-2xl md:text-3xl";
  return (
    <p className={`flex flex-wrap items-baseline gap-x-5 gap-y-1 font-display font-medium uppercase leading-[1.05] tracking-tight ${t} ${className}`}>
      {itens.map((p, i) => (
        <span key={p} className="a-up inline-flex items-baseline gap-5">
          <span style={cor ? { color: cor } : undefined}>{p}</span>
          {i < itens.length - 1 ? (
            <span className="h-[0.7em] w-px self-center bg-[color:var(--fg-faint)]" aria-hidden />
          ) : null}
        </span>
      ))}
    </p>
  );
}

/** Bloco de tópico: rótulo pequeno acima, palavra grande abaixo. */
export function Topico({
  rotulo,
  titulo,
  texto,
  cor,
  className = "",
}: {
  rotulo?: string;
  titulo: string;
  texto?: string;
  cor?: string;
  className?: string;
}) {
  return (
    <div className={`a-up ${className}`}>
      {rotulo ? (
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: cor ?? "var(--fg-faint)" }}>
          {rotulo}
        </p>
      ) : null}
      <p className="mt-3 font-display text-3xl font-bold uppercase leading-[0.9] tracking-tight sm:text-4xl md:text-5xl">
        {titulo}
      </p>
      {texto ? (
        <p className="mt-3 max-w-sm text-[14px] font-light leading-relaxed text-[color:var(--fg-soft)]">{texto}</p>
      ) : null}
    </div>
  );
}
