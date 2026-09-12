import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ABERTURA,
  BENEFICIOS,
  CRONOGRAMA,
  DATA_CURTA,
  DATA_EXTENSO,
  ENCERRAMENTO,
  ENDERECO_COMPLETO,
  EVENTO_EDICAO,
  LARGADA,
  LOCAL_COMPLETO,
  MOTE,
  PELOTOES_ROTULO,
  type Pelotao,
} from "@/lib/somma-day/event.config";
import { getEvento, getParticipantePorToken } from "@/lib/somma-day/db";
import { ticketQrSvg } from "@/lib/somma-day/qr";
import AcoesTicket from "../../_components/AcoesTicket";
import "../../somma-day.css";

// Página pessoal atrás de um token: nunca cacheada em edge, nunca indexada.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tá dentro — SOMMA DAY",
  robots: { index: false, follow: false },
};

/** Mostra o bastante para a pessoa conferir, sem reimprimir o dado inteiro na tela. */
function mascararEmail(email: string | null): string {
  if (!email) return "—";
  const [usuario, dominio] = email.split("@");
  if (!dominio) return "—";
  const visivel = usuario.slice(0, 2);
  return `${visivel}${"•".repeat(Math.max(usuario.length - 2, 2))}@${dominio}`;
}

function mascararTelefone(tel: string | null): string {
  if (!tel) return "—";
  const d = tel.replace(/\D/g, "");
  if (d.length < 10) return "—";
  return `(${d.slice(0, 2)}) ${"•".repeat(d.length - 6)}${d.slice(-4)}`;
}

function mascararCpf(cpf: string): string {
  return `•••.•••.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

export default async function ObrigadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ ja?: string }>;
}) {
  const { token } = await params;
  // `?ja=1` vem de quem consultou o CPF e já estava na lista: a página abre
  // reconhecendo isso em vez de comemorar uma inscrição que não acabou de
  // acontecer.
  const { ja } = await searchParams;
  const jaEstava = ja === "1";
  const participante = await getParticipantePorToken(token);
  if (!participante) notFound();

  const evento = await getEvento();
  const qr = await ticketQrSvg(participante.ticket_token);
  const primeiroNome = participante.nome_completo.trim().split(/\s+/)[0];
  const pelotao = participante.pelotao
    ? PELOTOES_ROTULO[participante.pelotao as Pelotao] ?? participante.pelotao
    : "A definir";
  const cancelada = participante.status === "cancelado";
  const presente = participante.status === "presente";

  return (
    <main className="somma-day-root min-h-screen px-5 py-10 md:py-16">
      <div className="mx-auto max-w-[900px]">
        {/* ── 1. A confirmação ───────────────────────────────────────────── */}
        <header className="sd-nao-imprimir text-center">
          <Image
            src="/somma-day/logo-somma-day.svg"
            alt={`SOMMA DAY — ${EVENTO_EDICAO}`}
            width={320}
            height={320}
            priority
            unoptimized
            className="sd-t1 mx-auto h-auto w-[180px] sm:w-[220px]"
          />
          <p className="mt-7 text-[11px] font-extrabold uppercase tracking-[0.3em] opacity-60">
            {cancelada ? "Inscrição cancelada" : jaEstava ? "Você já estava dentro" : "Inscrição confirmada"}
          </p>
          <h1 className="sd-display mt-3 text-[clamp(2.8rem,10vw,5rem)] leading-[0.95]">
            Tá dentro,
            <br />
            <span className="text-[var(--sd-vermelho)]">{primeiroNome}.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[16px] font-semibold leading-relaxed">
            {MOTE}{" "}
            {jaEstava
              ? "Sua inscrição já estava feita — este é o mesmo ticket de sempre."
              : "Mandamos este ticket para o seu e-mail também: se não chegar em alguns minutos, olhe o spam."}
          </p>
        </header>

        {/* ── 2. O ticket (é isto que sai na impressão) ───────────────────── */}
        <section className="sd-ticket sd-sticker mt-10 bg-white">
          <div className="border-b-[3px] border-dashed border-[var(--sd-tinta)] px-6 py-6 text-center sm:px-10">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] opacity-60">
              {EVENTO_EDICAO} · {DATA_CURTA}
            </p>
            <p className="sd-display mt-2 text-[clamp(2rem,6vw,2.8rem)] leading-none text-[var(--sd-vermelho)]">
              SOMMA DAY
            </p>
          </div>

          <div className="grid gap-8 px-6 py-8 sm:grid-cols-[200px_1fr] sm:items-center sm:px-10">
            <div className="mx-auto w-[180px] sm:w-full">
              <div
                className="aspect-square rounded-[14px] border-[3px] border-[var(--sd-tinta)] bg-white p-2"
                dangerouslySetInnerHTML={{ __html: qr }}
              />
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] opacity-60">
                Código do ticket
              </p>
              <p className="sd-display mt-1 text-[clamp(2.2rem,7vw,3rem)] leading-none tracking-[0.06em]">
                {participante.ticket_code}
              </p>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["Nome", participante.nome_completo],
                  ["Pelotão", pelotao],
                  ["Quando", `${DATA_CURTA} · ${ABERTURA}`],
                  ["Onde", evento?.local ?? LOCAL_COMPLETO],
                ].map(([chave, valor]) => (
                  <div key={chave}>
                    <dt className="text-[10px] font-extrabold uppercase tracking-[0.2em] opacity-60">
                      {chave}
                    </dt>
                    <dd className="mt-1 text-[15px] font-extrabold leading-snug">{valor}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <p className="border-t-[3px] border-dashed border-[var(--sd-tinta)] px-6 py-4 text-center text-[13px] font-bold sm:px-10">
            {cancelada
              ? "Esta inscrição foi cancelada. Fale com a organização."
              : presente
                ? "Check-in já realizado. Bom evento!"
                : "Apresente este código no credenciamento para receber sua pulseira."}
          </p>
        </section>

        {/* ── 3. O que fazer com ele ─────────────────────────────────────── */}
        <div className="sd-nao-imprimir mt-8">
          <AcoesTicket />
        </div>

        {/* ── 4. Confira seus dados ──────────────────────────────────────── */}
        <section className="sd-nao-imprimir mt-14">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] opacity-60">
            Confira antes do dia
          </p>
          <h2 className="sd-display mt-3 text-[clamp(2rem,6vw,3rem)] leading-[0.95]">Seus dados</h2>

          <dl className="mt-7 grid gap-px overflow-hidden rounded-[18px] border-[3px] border-[var(--sd-tinta)] bg-[var(--sd-tinta)] sm:grid-cols-2">
            {[
              ["Nome completo", participante.nome_completo],
              ["CPF", mascararCpf(participante.cpf)],
              ["E-mail", mascararEmail(participante.email)],
              ["WhatsApp", mascararTelefone(participante.telefone)],
              ["Pelotão", pelotao],
              [
                "Situação",
                cancelada ? "Cancelada" : presente ? "Check-in feito" : "Inscrição confirmada",
              ],
            ].map(([chave, valor]) => (
              <div key={chave} className="bg-white px-6 py-5">
                <dt className="text-[10px] font-extrabold uppercase tracking-[0.2em] opacity-60">
                  {chave}
                </dt>
                <dd className="mt-1 text-[16px] font-extrabold leading-snug">{valor}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-[13px] font-medium leading-relaxed opacity-70">
            E-mail, telefone e CPF aparecem parciais de propósito: dá para conferir sem deixar o
            dado inteiro exposto na tela de quem estiver do seu lado. Algo errado? Fale com a
            organização no WhatsApp.
          </p>
        </section>

        {/* ── 5. O que acontece agora ────────────────────────────────────── */}
        <section className="sd-nao-imprimir mt-14">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] opacity-60">
            Passo a passo
          </p>
          <h2 className="sd-display mt-3 text-[clamp(2rem,6vw,3rem)] leading-[0.95]">
            O que acontece agora
          </h2>

          <ol className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              { n: "01", t: "Chegue cedo", d: `A abertura é às ${ABERTURA}. A largada sai às ${LARGADA}.` },
              { n: "02", t: "Credencie-se", d: "Mostre o QR ou o código na entrada do Estacionamento 9." },
              { n: "03", t: "Pegue a pulseira", d: "É ela que libera comida, bebida, ativações e sorteios." },
            ].map((p, i) => (
              <li
                key={p.n}
                className={`sd-sticker ${i % 2 === 0 ? "sd-t3" : "sd-t2"} px-6 py-7`}
                style={{
                  background: i === 0 ? "var(--sd-vermelho)" : i === 1 ? "var(--sd-azul)" : "var(--sd-amarelo)",
                  color: i === 2 ? "#101010" : "#F7F4E9",
                }}
              >
                <p className="sd-display text-[2.4rem] leading-none opacity-70">{p.n}</p>
                <h3 className="sd-display mt-2 text-[1.6rem] leading-none">{p.t}</h3>
                <p className="mt-3 text-[14px] font-semibold leading-relaxed">{p.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── 6. O dia ───────────────────────────────────────────────────── */}
        <section className="sd-nao-imprimir mt-14">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] opacity-60">
            {ABERTURA} às {ENCERRAMENTO} · {DATA_EXTENSO}
          </p>
          <h2 className="sd-display mt-3 text-[clamp(2rem,6vw,3rem)] leading-[0.95]">Seu dia</h2>

          <ol className="mt-7 overflow-hidden rounded-[18px] border-[3px] border-[var(--sd-tinta)]">
            {CRONOGRAMA.map((item, i) => (
              <li
                key={item.hora}
                className="grid items-baseline gap-1 border-b-[3px] border-[var(--sd-tinta)] bg-white px-6 py-4 last:border-b-0 sm:grid-cols-[110px_1fr] sm:gap-5"
                style={i % 2 === 1 ? { background: "#fffdf6" } : undefined}
              >
                <p className="sd-display text-[1.4rem] leading-none" style={{ color: item.cor }}>
                  {item.hora}
                </p>
                <div>
                  <h3 className="text-[15px] font-extrabold uppercase tracking-[0.04em]">{item.titulo}</h3>
                  <p className="mt-1 text-[14px] font-medium leading-relaxed opacity-80">{item.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── 7. A pulseira ──────────────────────────────────────────────── */}
        <section className="sd-nao-imprimir mt-14 rounded-[18px] border-[3px] border-[var(--sd-tinta)] bg-[var(--sd-vermelho)] px-7 py-9 text-[var(--sd-creme)]">
          <h2 className="sd-display text-[clamp(1.8rem,5vw,2.6rem)] leading-[0.95]">
            Sua pulseira libera
          </h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {BENEFICIOS.map((b) => (
              <li
                key={b}
                className="rounded-full border-[3px] border-[var(--sd-creme)] px-4 py-2 text-[13px] font-extrabold uppercase tracking-[0.04em]"
              >
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-xl text-[14px] font-semibold leading-relaxed opacity-90">
            {ENDERECO_COMPLETO}. Sem pulseira, não há acesso aos benefícios oficiais — por isso o
            credenciamento vem antes de tudo.
          </p>
        </section>

        <p className="sd-nao-imprimir mt-12 text-center text-[12px] font-extrabold uppercase tracking-[0.2em] opacity-60">
          SOMMA Club · Brasília, DF
        </p>
      </div>
    </main>
  );
}
