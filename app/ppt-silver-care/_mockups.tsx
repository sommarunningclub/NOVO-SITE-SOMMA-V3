import { Icon, type IconName } from "./_icons";
import { ORANGE, SUN, INK, BONE } from "./_ui";

/* ══════════════════════════════════════════════════════════════════════════
   Mockups conceituais.

   O que existe em foto (necessaire e totem) entra pelos arquivos de
   /public/silver. O resto é desenhado em CSS/SVG. A logo oficial entra sempre
   como arquivo, sem recorte, distorção ou recoloração: no stick e nas telas
   ela fica sobre uma placa branca.
   ══════════════════════════════════════════════════════════════════════════ */

const SILVER_LOGO = "/LOGO-SILVER_1_537x.webp";

/* ── Produto: protetor em stick ────────────────────────────────────────── */

export function SunStick({
  edition = "atual",
  className = "",
}: {
  /** `running` = conceito Somma × Silver Care (edição especial). */
  edition?: "atual" | "running";
  className?: string;
}) {
  const running = edition === "running";
  return (
    <div className={`relative ${className}`}>
      {/* sombra de apoio */}
      <div
        className="absolute -bottom-3 left-1/2 h-6 w-[86%] -translate-x-1/2 rounded-[50%] blur-md"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        aria-hidden
      />

      <div className="relative mx-auto w-[150px] sm:w-[176px]">
        {/* tampa */}
        <div
          className="relative h-[98px] rounded-t-[24px] rounded-b-[6px]"
          style={{
            background: running
              ? `linear-gradient(100deg, ${ORANGE} 0%, #ff5a33 42%, #c31d00 100%)`
              : "linear-gradient(100deg, #2b2b2b 0%, #4a4a4a 42%, #141414 100%)",
          }}
        >
          <span
            className="absolute left-[18%] top-2 h-[70%] w-[7px] rounded-full"
            style={{ background: "rgba(255,255,255,0.28)" }}
            aria-hidden
          />
        </div>
        <div className="h-[3px] w-full" style={{ background: "rgba(0,0,0,0.35)" }} aria-hidden />

        {/* corpo */}
        <div
          className="relative overflow-hidden rounded-b-[20px] rounded-t-[4px] pb-5 pt-4"
          style={{
            background:
              "linear-gradient(100deg, #ffffff 0%, #ffffff 34%, #efece4 62%, #cfc9be 100%)",
          }}
        >
          {/* brilho do cilindro: fica atrás do rótulo, nunca por cima do texto */}
          <span
            className="pointer-events-none absolute left-[16%] top-0 h-full w-[9px]"
            style={{ background: "rgba(255,255,255,0.55)" }}
            aria-hidden
          />

          <div className="relative">
          {running ? (
            <div
              className="mb-3 flex items-center justify-center py-1"
              style={{ backgroundColor: ORANGE }}
            >
              <span className="font-display text-[8px] font-bold uppercase tracking-[0.22em] text-white">
                Running Edition
              </span>
            </div>
          ) : null}

          <div className="px-3.5">
            {/* logo oficial, sobre o rótulo branco */}
            <img src={SILVER_LOGO} alt="Silver Care" className="mx-auto h-[22px] w-auto" />

            <div className="mx-auto mt-3 h-px w-8" style={{ backgroundColor: "rgba(10,10,10,0.2)" }} />

            <p
              className="mt-3 text-center font-display text-[13px] font-bold uppercase leading-none tracking-[0.12em]"
              style={{ color: INK }}
            >
              Sun Stick
            </p>
            <p
              className="mt-1.5 text-center font-display text-[9px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "rgba(10,10,10,0.5)" }}
            >
              Protetor solar facial
            </p>

            <div className="mt-3 flex items-center justify-center gap-1.5">
              <span
                className="rounded-full px-2 py-[3px] font-display text-[9px] font-bold tracking-wider text-white"
                style={{ backgroundColor: running ? ORANGE : INK }}
              >
                FPS 50
              </span>
              <span
                className="rounded-full border px-2 py-[3px] font-display text-[9px] font-bold tracking-wider"
                style={{ borderColor: "rgba(10,10,10,0.25)", color: "rgba(10,10,10,0.6)" }}
              >
                Toque seco
              </span>
            </div>

            {running ? (
              <div className="mt-3.5 flex items-center justify-center gap-2 border-t pt-3" style={{ borderColor: "rgba(10,10,10,0.12)" }}>
                <img src="/logo-somma-dark.png" alt="Somma Club" className="h-[9px] w-auto" />
                <span className="font-display text-[8px]" style={{ color: "rgba(10,10,10,0.4)" }}>
                  ×
                </span>
                <img src={SILVER_LOGO} alt="Silver Care" className="h-[11px] w-auto" />
              </div>
            ) : null}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Celular + telas ───────────────────────────────────────────────────── */

export function Phone({
  children,
  className = "",
  legenda,
}: {
  children: React.ReactNode;
  className?: string;
  legenda?: string;
}) {
  return (
    <div className={`w-full max-w-[232px] ${className}`}>
      <div
        className="relative aspect-[9/19] w-full rounded-[30px] p-[7px] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.8)]"
        style={{ background: "linear-gradient(160deg, #3a3a3a, #101010)" }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#0E0E0E]">
          <div
            className="absolute left-1/2 top-2 z-20 h-[5px] w-[54px] -translate-x-1/2 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
            aria-hidden
          />
          <div className="h-full w-full pt-5">{children}</div>
        </div>
      </div>
      {legenda ? (
        <p className="mt-3 text-center font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-faint)]">
          {legenda}
        </p>
      ) : null}
    </div>
  );
}

function TelaTopo({ titulo }: { titulo: string }) {
  return (
    <div className="flex items-center justify-between px-3.5 pb-2.5">
      <img src="/logo-somma.svg" alt="Somma Club" className="h-[9px] w-auto" />
      <span className="font-display text-[8px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {titulo}
      </span>
    </div>
  );
}

/** Rodapé de patrocínio: presença da marca dentro do produto digital. */
function TelaRodape() {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 border-t border-white/10 bg-white/[0.03] px-3 py-2.5">
      <span className="font-display text-[7px] uppercase tracking-[0.16em] text-white/35">
        Proteção por
      </span>
      <span className="rounded bg-white px-1.5 py-1">
        <img src={SILVER_LOGO} alt="Silver Care" className="h-[9px] w-auto" />
      </span>
    </div>
  );
}

export function TelaCheckin() {
  return (
    <div className="relative h-full text-white">
      <TelaTopo titulo="Check-in" />
      <div className="px-3.5">
        <p className="font-display text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
          Sábado · 7h
        </p>
        <p className="mt-1 font-display text-[15px] font-bold uppercase leading-tight">
          Parque da Cidade
        </p>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.05] p-3">
          <div className="flex items-center gap-1.5">
            <span style={{ color: SUN }}>
              <Icon name="sol" className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-[8px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Pergunta do dia
            </span>
          </div>
          <p className="mt-2 text-[12px] font-medium leading-snug">
            Você já protegeu sua pele hoje?
          </p>
          <div className="mt-3 flex gap-1.5">
            <span
              className="flex-1 rounded-lg py-2 text-center font-display text-[9px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: ORANGE }}
            >
              Sim
            </span>
            <span className="flex-1 rounded-lg border border-white/15 py-2 text-center font-display text-[9px] font-bold uppercase tracking-wider text-white/70">
              Ainda não
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 p-2.5">
          <QRCode size={34} />
          <p className="text-[9px] leading-snug text-white/55">
            Passe no Ponto de Proteção e escaneie para ganhar pontos.
          </p>
        </div>
      </div>
      <TelaRodape />
    </div>
  );
}

export function TelaPassaporte() {
  const missoes = [
    ["Check-in no Somma", "+20", true],
    ["Missão Silver", "+15", true],
    ["Experimentou o stick", "+15", true],
    ["Postou a experiência", "+20", false],
    ["Levou um amigo", "+20", false],
    ["Somma Day", "+30", false],
  ] as const;

  return (
    <div className="relative h-full text-white">
      <TelaTopo titulo="Passaporte" />
      <div className="px-3.5">
        <p className="font-display text-[15px] font-bold uppercase leading-none tracking-tight">
          Somma <span style={{ color: ORANGE }}>Protegido</span>
        </p>

        <div className="mt-3 flex items-end justify-between">
          <p className="font-display text-[30px] font-bold leading-none" style={{ color: SUN }}>
            120
          </p>
          <p className="font-display text-[8px] uppercase tracking-[0.18em] text-white/40">
            pontos · agosto
          </p>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <span className="block h-full w-[62%] rounded-full" style={{ backgroundColor: ORANGE }} />
        </div>
        <p className="mt-1.5 text-[8px] text-white/40">Faltam 80 pontos para o Kit Runner.</p>

        <div className="mt-3 space-y-1.5">
          {missoes.map(([nome, pts, feito]) => (
            <div
              key={nome}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-[7px]"
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full"
                  style={{ backgroundColor: feito ? ORANGE : "rgba(255,255,255,0.1)" }}
                >
                  {feito ? (
                    <svg viewBox="0 0 12 12" className="h-2 w-2" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
                      <path d="m2.5 6.2 2.4 2.4L9.5 3.6" />
                    </svg>
                  ) : null}
                </span>
                <span className="text-[9.5px] text-white/75">{nome}</span>
              </span>
              <span className="font-display text-[9px] font-bold" style={{ color: feito ? SUN : "rgba(255,255,255,0.35)" }}>
                {pts}
              </span>
            </div>
          ))}
        </div>
      </div>
      <TelaRodape />
    </div>
  );
}

export function TelaRanking() {
  const linhas = [
    ["01", "Mariana R.", "310"],
    ["02", "Pedro H.", "295"],
    ["03", "Tati L.", "280"],
    ["04", "João V.", "245"],
    ["05", "Bia F.", "230"],
    ["06", "Rafa M.", "215"],
  ] as const;

  return (
    <div className="relative h-full text-white">
      <TelaTopo titulo="Ranking" />
      <div className="px-3.5">
        <p className="font-display text-[15px] font-bold uppercase leading-none tracking-tight">
          Corre no <span style={{ color: SUN }}>Sol</span>
        </p>
        <p className="mt-1 text-[9px] text-white/45">Ranking de participação · agosto</p>

        <div className="mt-3 space-y-1.5">
          {linhas.map(([pos, nome, pts], i) => (
            <div
              key={pos}
              className="flex items-center gap-2 rounded-lg px-2.5 py-[7px]"
              style={{
                backgroundColor: i < 3 ? `${ORANGE}1A` : "rgba(255,255,255,0.04)",
                border: `1px solid ${i < 3 ? `${ORANGE}3D` : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <span
                className="font-display text-[10px] font-bold"
                style={{ color: i < 3 ? ORANGE : "rgba(255,255,255,0.35)" }}
              >
                {pos}
              </span>
              <span className="h-4 w-4 rounded-full bg-white/10" aria-hidden />
              <span className="flex-1 text-[9.5px] text-white/80">{nome}</span>
              <span className="font-display text-[10px] font-bold" style={{ color: SUN }}>
                {pts}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-dashed border-white/15 px-2.5 py-2">
          <p className="text-[8.5px] leading-snug text-white/50">
            Pontua quem participa, não quem corre mais rápido.
          </p>
        </div>
      </div>
      <TelaRodape />
    </div>
  );
}

export function TelaCupom() {
  return (
    <div className="relative h-full text-white">
      <TelaTopo titulo="Recompensa" />
      <div className="px-3.5">
        <p className="font-display text-[15px] font-bold uppercase leading-none tracking-tight">
          Seu cupom
        </p>
        <div
          className="mt-3 rounded-xl p-3 text-center"
          style={{ background: `linear-gradient(150deg, ${ORANGE}, #c31d00)` }}
        >
          <p className="font-display text-[8px] font-semibold uppercase tracking-[0.2em] text-white/75">
            Silver Care · exclusivo Somma
          </p>
          <p className="mt-1.5 font-display text-[19px] font-bold uppercase leading-none tracking-tight text-white">
            SOMMA15
          </p>
          <p className="mt-1 text-[8.5px] text-white/75">15% em toda a linha solar</p>
        </div>

        <div className="mt-3 flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <QRCode size={72} />
          <p className="mt-2 text-[8.5px] text-white/45">Escaneie na ativação</p>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 px-2.5 py-2">
          <span className="text-[8.5px] text-white/50">Válido até</span>
          <span className="font-display text-[9px] font-bold text-white/80">30 · SET</span>
        </div>
      </div>
      <TelaRodape />
    </div>
  );
}

/* ── QR Code conceitual ────────────────────────────────────────────────── */

/**
 * QR ilustrativo: padrão determinístico (sem Math.random, para não quebrar a
 * hidratação) com os três marcadores de canto reais. Serve de mockup, não de
 * código escaneável.
 */
export function QRCode({ size = 80, cor = "#0A0A0A", fundo = "#FFFFFF" }: { size?: number; cor?: string; fundo?: string }) {
  const n = 21;
  const finder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);

  const cells: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      // hash simples e estável
      const h = (x * 73856093) ^ (y * 19349663) ^ ((x + y) * 83492791);
      if (((h >>> 3) & 7) > 3) {
        cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={cor} />);
      }
    }
  }

  const Marcador = ({ x, y }: { x: number; y: number }) => (
    <>
      <rect x={x} y={y} width="7" height="7" fill={cor} />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill={fundo} />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill={cor} />
    </>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`-1 -1 ${n + 2} ${n + 2}`}
      className="shrink-0 rounded-[3px]"
      style={{ backgroundColor: fundo }}
      aria-hidden
    >
      {cells}
      <Marcador x={0} y={0} />
      <Marcador x={n - 7} y={0} />
      <Marcador x={0} y={n - 7} />
    </svg>
  );
}

/* ── Stickers ──────────────────────────────────────────────────────────── */

export function Sticker({
  children,
  variante = "laranja",
  forma = "pill",
  rotate = -4,
  className = "",
}: {
  children: React.ReactNode;
  variante?: "laranja" | "sol" | "preto" | "bone";
  forma?: "pill" | "circulo" | "retangulo";
  rotate?: number;
  className?: string;
}) {
  const cores = {
    laranja: { bg: ORANGE, fg: "#FFFFFF" },
    sol: { bg: SUN, fg: INK },
    preto: { bg: INK, fg: BONE },
    bone: { bg: BONE, fg: INK },
  }[variante];

  const raio = forma === "circulo" ? "rounded-full" : forma === "pill" ? "rounded-full" : "rounded-lg";
  const padding = forma === "circulo" ? "px-6 py-6" : "px-4 py-2";

  return (
    <span
      className={`a-up inline-flex max-w-[190px] items-center justify-center text-center font-display text-[11px] font-bold uppercase leading-[1.05] tracking-[0.08em] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.8)] sm:text-[13px] ${raio} ${padding} ${className}`}
      style={{
        backgroundColor: cores.bg,
        color: cores.fg,
        transform: `rotate(${rotate}deg)`,
        // o sticker bone precisa de contorno para não sumir no fundo claro
        border: variante === "bone" ? `1.5px solid ${INK}` : undefined,
      }}
    >
      {children}
    </span>
  );
}

/** Card de conteúdo social (post/reels). */
export function PostCard({
  foto,
  legenda,
  formato = "post",
  selo,
}: {
  foto: string;
  legenda: string;
  formato?: "post" | "story";
  selo?: string;
}) {
  return (
    <div className="a-up overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]">
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: formato === "story" ? "9 / 16" : "4 / 5" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto} alt="" aria-hidden className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25" />
        {selo ? (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white"
            style={{ backgroundColor: ORANGE }}
          >
            {selo}
          </span>
        ) : null}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-display text-[13px] font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-[15px]">
            {legenda}
          </p>
        </div>
        <span className="absolute right-3 top-3 rounded bg-white px-1.5 py-1">
          <img src={SILVER_LOGO} alt="Silver Care" className="h-[9px] w-auto" />
        </span>
      </div>
    </div>
  );
}

/** Painel de resultados: mostra o formato do relatório mensal. */
export function Dashboard({ className = "" }: { className?: string }) {
  const barras = [42, 68, 55, 88, 74, 96];
  const kpis = [
    ["Pessoas impactadas", "8.4k"],
    ["Samples entregues", "1.250"],
    ["QR escaneados", "612"],
    ["Cupons usados", "138"],
  ] as const;

  return (
    <div
      className={`a-up overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-faint)]">
          Relatório mensal
        </p>
        <span className="font-display text-[10px] uppercase tracking-[0.16em]" style={{ color: ORANGE }}>
          Somma × Silver Care
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(([label, valor]) => (
          <div key={label} className="rounded-xl border border-[color:var(--line)] p-3">
            <p className="font-display text-2xl font-bold leading-none">{valor}</p>
            <p className="mt-1.5 text-[10px] leading-tight text-[color:var(--fg-faint)]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex h-24 items-end gap-2">
        {barras.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-t-md"
            style={{
              height: `${h}%`,
              backgroundColor: i === barras.length - 1 ? ORANGE : "var(--surface-2)",
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-display text-[9px] uppercase tracking-[0.16em] text-[color:var(--fg-faint)]">
        <span>Semana 1</span>
        <span>Somma Day</span>
      </div>
    </div>
  );
}

/** Item ilustrado do kit: ícone + nome, no formato de etiqueta. */
export function ItemKit({ icon, nome, nota }: { icon: IconName; nome: string; nota?: string }) {
  return (
    <div className="a-up flex items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3.5">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${ORANGE}1A`, color: ORANGE }}
      >
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-display text-sm font-semibold uppercase tracking-wide">{nome}</span>
        {nota ? <span className="block text-[11px] text-[color:var(--fg-faint)]">{nota}</span> : null}
      </span>
    </div>
  );
}
