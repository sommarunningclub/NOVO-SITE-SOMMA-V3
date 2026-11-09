import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUpRight, Check, Instagram, MapPin } from "lucide-react";
import { altone } from "@/components/bora/fonte";
import { ContatoBora } from "@/components/bora/contato-bora";
import { RegistrarVisita } from "@/components/bora/registrar-visita";
import { PROFESSORES_BORA } from "@/lib/nova-assessoria/professores";
import {
  BENEFICIOS,
  CIDADES,
  FOTOS,
  METODO,
  MODALIDADES,
  PAGINA_RASTREIO,
  PARCEIROS,
  PERGUNTAS,
  PONTOS,
  PROGRAMACAO,
  RUNY,
  URL_LP,
  VIDEOS,
  YANN,
} from "@/lib/boracomsomma/config";
import { buscarEvento, horarioCurto, partesDaData } from "@/lib/boracomsomma/evento";
import { CheckIn } from "./_components/CheckIn";
import { Contagem } from "./_components/Contagem";
import { VideoBora } from "./_components/VideoBora";
import { VideoHero } from "./_components/VideoHero";
import { MapaEncontro } from "./_components/MapaEncontro";

/**
 * /boracomsomma: LP do corre de 14/11/2026, o anúncio oficial da BORA como
 * assessoria do SOMMA Club, com o Yann Rodrigues.
 *
 * Ligações com o resto do sistema:
 * - Evento: linha de `eventos` com slug `boracomsomma` (gestão). Data, horário,
 *   local, pelotões e status do check-in vêm de lá a cada 15 s.
 * - Check-in: /api/boracomsomma/checkin grava em `checkins` com o evento_id,
 *   e a inscrição aparece no módulo de Check-in da gestão.
 * - Assessoria: o "Falar com um professor" entra no rodízio da Nova Assessoria
 *   com página `boracomsomma`, que o admin mostra separada de /assessoria.
 */

export const revalidate = 15;

const DESCRICAO =
  "Sábado, 14 de novembro, no Parque da Cidade: o corre que anuncia a BORA como assessoria oficial do SOMMA Club, com Yann Rodrigues e o desafio mais irado do dia. Check-in gratuito.";

export const metadata: Metadata = {
  title: "BORA com SOMMA | 14/11 no Parque da Cidade",
  description: DESCRICAO,
  alternates: { canonical: "/boracomsomma" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: URL_LP,
    siteName: "SOMMA Club",
    title: "BORA com SOMMA | 14/11 no Parque da Cidade",
    description: DESCRICAO,
    images: [{ url: "/boracomsomma/fotos/bora-5.jpg", width: 1339, height: 1600 }],
  },
  twitter: { card: "summary_large_image" },
};

function Rotulo({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora ${className}`}>{children}</p>;
}

function Titulo({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`mt-4 font-bora text-[40px] font-black uppercase italic leading-[0.92] sm:text-6xl md:text-7xl ${className}`}>
      {children}
    </h2>
  );
}

export default async function BoraComSommaPage() {
  const evento = await buscarEvento();
  const d = partesDaData(evento.data);
  const hora = horarioCurto(evento.horario);
  const dataExtenso = `${d.semana[0].toUpperCase()}${d.semana.slice(1)}, ${Number(d.dia)} de ${d.mesLongo}`;
  const localCurto = evento.local.replace(/,?\s*Brasília,?\s*DF\s*$/i, "");
  const checkinAberto = evento.estado === "aberto";
  const ctaCheckin = evento.estado === "encerrado" ? "Ver o corre" : checkinAberto ? "Fazer meu check-in" : "Check-in em breve";

  return (
    <main className={`${altone.variable} min-h-screen overflow-x-hidden bg-black text-white`}>
      {/* O body do site é branco: sem isso, o "quique" do scroll no iOS mostra branco. */}
      <style>{"html,body{background:#000}"}</style>
      <RegistrarVisita pagina={PAGINA_RASTREIO} />

      {/* ───────── Abertura ───────── */}
      <section className="relative isolate min-h-[100svh] overflow-hidden lg:min-h-0">
        {/* Celular: o vídeo é o fundo. */}
        <VideoHero className="absolute inset-0 -z-20 h-full w-full scale-105 object-cover blur-[3px] lg:hidden" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/55 to-black lg:hidden" />
        <Image
          src="/bora/pattern-bora-white.webp"
          alt=""
          aria-hidden="true"
          width={900}
          height={1000}
          className="pointer-events-none absolute -right-40 top-0 -z-10 hidden w-[760px] opacity-[0.07] lg:block"
          priority
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-1/3 -z-10 hidden h-[520px] w-[520px] rounded-full bg-bora/20 blur-[140px] lg:block"
        />

        <header className="relative z-10 mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="SOMMA Club">
              <Image src="/logo-somma.svg" alt="SOMMA Club" width={120} height={32} className="h-6 w-auto sm:h-7" priority />
            </Link>
            <span aria-hidden="true" className="font-bora text-lg font-bold text-white/40">
              ×
            </span>
            <Image src="/bora/logo-white.png" alt="BORA" width={640} height={164} className="h-5 w-auto sm:h-6" priority />
          </div>
          <a
            href="#checkin"
            className="hidden rounded-full bg-bora px-5 py-2.5 font-bora text-sm font-black uppercase italic text-black sm:inline-flex"
          >
            {ctaCheckin}
          </a>
        </header>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-14 pt-16 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:pb-24 lg:pt-12">
          <div>
            <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-bora/40 bg-black/40 px-4 py-2 font-bora text-xs font-bold uppercase tracking-[0.18em] text-bora backdrop-blur sm:text-sm">
              <span>
                {d.dia}.{evento.data.slice(5, 7)}
              </span>
              <span className="text-white/30">/</span>
              <span>{d.semana}</span>
              <span className="text-white/30">/</span>
              <span>{hora}</span>
            </p>
            <h1 className="mt-6 font-bora text-[64px] font-black uppercase italic leading-[0.84] tracking-tight sm:text-8xl md:text-[128px]">
              <span className="text-bora">BORA</span>
              <br />
              com
              <br />
              SOMMA
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
              O corre que abre um novo ciclo: a <strong className="text-white">BORA agora é a assessoria oficial do SOMMA Club</strong>. E o{" "}
              <strong className="text-white">Yann Rodrigues</strong> vem correr com a gente e trazer o desafio mais irado do dia.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#checkin"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-bora px-8 py-4 font-bora text-lg font-black uppercase italic text-black transition hover:brightness-110"
              >
                {ctaCheckin} <ArrowDown className="h-5 w-5" />
              </a>
              <p className="text-sm text-white/55">Gratuito e aberto a todo mundo.</p>
            </div>
          </div>

          {/* Computador: o vídeo vira um card vertical. */}
          <div className="relative mx-auto hidden w-full max-w-[340px] lg:block">
            <div className="rotate-[2.5deg] overflow-hidden rounded-[32px] border-4 border-bora shadow-[0_30px_120px_-20px_rgba(206,255,0,0.35)]">
              <VideoHero className="aspect-[9/16] w-full object-cover" />
            </div>
            <Image
              src="/bora/sticker-letz-bora-green.webp"
              alt=""
              aria-hidden="true"
              width={720}
              height={336}
              className="absolute -bottom-8 -left-16 w-52 -rotate-6"
            />
          </div>
        </div>

        {/* Ingresso: as informações do dia */}
        <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <dl className="grid grid-cols-2 overflow-hidden rounded-3xl border border-white/15 bg-black/60 backdrop-blur md:grid-cols-4">
            {[
              { t: "Quando", v: dataExtenso },
              { t: "Concentração", v: `A partir das ${hora}` },
              { t: "Onde", v: localCurto },
              { t: "Pelotões", v: evento.pelotoes.map((p) => p.replace("km", " km")).join(", ") },
            ].map((item, i) => (
              <div
                key={item.t}
                className={`p-5 sm:p-6 ${i % 2 === 1 ? "border-l border-white/10" : ""} ${i >= 2 ? "border-t border-white/10 md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
              >
                <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-bora">{item.t}</dt>
                <dd className="mt-2 font-semibold leading-snug">{item.v}</dd>
              </div>
            ))}
          </dl>
          <a
            href={evento.localUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <MapPin className="h-4 w-4" /> Estacionamento 10 no mapa
          </a>
        </div>
      </section>

      {/* ───────── Contagem ───────── */}
      <section className="border-t border-white/10 py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Rotulo>Contagem para a largada</Rotulo>
          <div className="mt-6">
            <Contagem alvo={`${evento.data}T${evento.horario}:00-03:00`} />
          </div>
        </div>
      </section>

      {/* ───────── O que vai rolar ───────── */}
      <section className="border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Rotulo>O que vai rolar</Rotulo>
          <Titulo>
            Um sábado para <span className="text-bora">marcar o começo</span>
          </Titulo>
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMACAO.map((item, i) => (
              <li key={item.titulo} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <span className="font-bora text-5xl font-black italic text-bora">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 font-bora text-2xl font-black uppercase italic leading-tight">{item.titulo}</h3>
                <p className="mt-3 text-white/65">{item.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Yann ───────── */}
      <section className="relative overflow-hidden border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[1339/1600] -rotate-2 overflow-hidden rounded-[32px] border-4 border-bora">
              <Image
                src={YANN.foto}
                alt="Yann Rodrigues com a camiseta da BORA"
                fill
                sizes="(min-width: 1024px) 448px, 90vw"
                className="object-cover"
              />
            </div>
            <span className="absolute -right-2 -top-4 rotate-6 rounded-full bg-bora px-4 py-2 font-bora text-sm font-black uppercase italic text-black sm:-right-6">
              Presença confirmada
            </span>
          </div>
          <div>
            <Rotulo>Convidado especial</Rotulo>
            <Titulo>
              Yann Rodrigues <span className="text-bora">corre com o SOMMA</span>
            </Titulo>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">{YANN.bio}</p>
            <div className="mt-8 rounded-3xl bg-bora p-6 text-black sm:p-8">
              <p className="font-bora text-sm font-bold uppercase tracking-[0.2em]">O desafio mais irado</p>
              <p className="mt-3 font-bora text-3xl font-black uppercase italic leading-[0.95] sm:text-4xl">Quem topa esse desafio?</p>
              <p className="mt-3 text-black/75">
                Os desafios de corrida do Yann rodam o Brasil e chamam o corredor mais rápido da cidade para encarar. No dia 14 o palco é o
                Parque da Cidade. Faça seu check-in, chama aquele amigo que voa e vem ver de perto.
              </p>
              <a
                href={YANN.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-white"
              >
                <Instagram className="h-4 w-4" /> Ver os desafios no {YANN.arroba}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── A BORA ───────── */}
      <section className="relative overflow-hidden border-t border-white/10 py-20 md:py-28">
        <Image
          src="/boracomsomma/marca/pattern-bora-green.webp"
          alt=""
          aria-hidden="true"
          width={1800}
          height={2014}
          className="pointer-events-none absolute -left-60 top-10 w-[700px] opacity-[0.06]"
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Rotulo>Assessoria oficial do SOMMA Club</Rotulo>
          <Titulo className="max-w-4xl">
            A assessoria do SOMMA agora é <span className="text-bora">BORA</span>
          </Titulo>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
            Os mesmos professores, o mesmo cuidado, agora com uma estrutura nacional. A comunidade SOMMA Club continua aberta a todo mundo; o
            que muda é a assessoria, que agora é BORA.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { n: "12", t: "praças", s: "11 cidades no Brasil e Miami" },
              { n: "2", t: "pontos em Brasília", s: "Parque da Cidade e Noroeste" },
              { n: "1", t: "app", s: "Treino do dia no celular e no relógio" },
            ].map((x) => (
              <div key={x.t} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <p className="font-bora text-6xl font-black italic leading-none text-bora">{x.n}</p>
                <p className="mt-2 font-bora text-xl font-black uppercase italic">{x.t}</p>
                <p className="mt-1 text-sm text-white/55">{x.s}</p>
              </div>
            ))}
          </div>

          <h3 className="mt-20 font-bora text-3xl font-black uppercase italic md:text-4xl">O que você tem na BORA</h3>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bora text-black">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
                <span className="font-semibold">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── Método ───────── */}
      <section className="border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Rotulo>Metodologia</Rotulo>
          <Titulo>
            Evoluir é um <span className="text-bora">ciclo</span>
          </Titulo>
          <ol className="mt-12 grid gap-8 md:grid-cols-5 md:gap-5">
            {METODO.map((m, i) => (
              <li key={m.titulo} className="border-t-2 border-bora pt-5">
                <span className="font-bora text-4xl font-black italic text-bora">{i + 1}</span>
                <h3 className="mt-2 font-bora text-xl font-black uppercase italic leading-tight">{m.titulo}</h3>
                <p className="mt-2 text-sm text-white/65">{m.texto}</p>
              </li>
            ))}
          </ol>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {MODALIDADES.map((m) => (
              <div key={m.nome} className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <Image src={m.icone} alt="" aria-hidden="true" width={240} height={240} className="h-14 w-14 object-contain" />
                <div>
                  <p className="font-bora text-2xl font-black uppercase italic">{m.nome}</p>
                  <p className="mt-1 text-sm text-white/60">{m.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── App Runy ───────── */}
      <section className="overflow-hidden border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <Rotulo>Aplicativo exclusivo</Rotulo>
            <Titulo>
              Seu treino no <span className="text-bora">Runy</span>
            </Titulo>
            <ul className="mt-8 space-y-3">
              {[...RUNY.recursos, ...RUNY.desafios].map((r) => (
                <li key={r} className="flex items-start gap-3 text-white/80">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-bora" strokeWidth={3} />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-white/45">Conecta com</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-5">
              {RUNY.relogios.map((r) => (
                <Image
                  key={r.nome}
                  src={r.logo}
                  alt={r.nome}
                  width={700}
                  height={190}
                  className="h-8 w-auto rounded-md"
                />
              ))}
            </div>
          </div>
          <div className="relative flex justify-center gap-3 sm:gap-5">
            {RUNY.telas.map((t, i) => (
              <div
                key={t}
                className={`relative w-[30%] max-w-[190px] overflow-hidden rounded-[22px] border border-white/15 bg-white/5 ${
                  i === 1 ? "-translate-y-6" : "translate-y-6"
                }`}
              >
                <Image src={t} alt="Tela do app Runy" width={510} height={1100} className="h-auto w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Pontos e rede ───────── */}
      <section className="border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Rotulo>Treino presencial em Brasília</Rotulo>
          <Titulo>
            Pontos <span className="text-bora">BORA</span>
          </Titulo>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {PONTOS.map((p) => (
              <div key={p.nome} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <Image
                    src="/boracomsomma/marca/icon-ponto-bora-green.png"
                    alt=""
                    aria-hidden="true"
                    width={240}
                    height={346}
                    className="h-9 w-auto"
                  />
                  <p className="font-bora text-3xl font-black uppercase italic">{p.nome}</p>
                </div>
                <dl className="mt-6 space-y-4">
                  {p.horarios.map((h) => (
                    <div key={h.dia} className="flex flex-col gap-1 border-t border-white/10 pt-4 sm:flex-row sm:justify-between">
                      <dt className="font-semibold">{h.dia}</dt>
                      <dd className="text-white/65">{h.faixas.join(" · ")}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          <h3 className="mt-20 font-bora text-3xl font-black uppercase italic md:text-4xl">
            Uma comunidade em <span className="text-bora">{CIDADES.length} praças</span>
          </h3>
          <ul className="mt-8 flex flex-wrap gap-2">
            {CIDADES.map((c) => (
              <li
                key={c}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                  c === "Brasília" ? "border-bora bg-bora text-black" : "border-white/15 text-white/80"
                }`}
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── Professores ───────── */}
      <section className="border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Rotulo>Professores BORA</Rotulo>
          <Titulo>Quem treina você</Titulo>
          <p className="mt-5 max-w-xl text-white/65">
            Os professores que você já conhece do SOMMA seguem com você, agora como professores BORA.
          </p>
          <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {PROFESSORES_BORA.map((p) => (
              <li key={p.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="relative aspect-[4/5] overflow-hidden bg-white">
                  <Image
                    src={p.foto}
                    alt={p.nome}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover object-top grayscale transition duration-500 group-hover:grayscale-0"
                  />
                </div>
                <div className="p-4 sm:p-5">
                  <p className="font-bora text-lg font-black uppercase italic leading-none sm:text-2xl">{p.nome}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-widest text-bora">
                    Professor BORA{p.apelido ? ` · ${p.apelido}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ContatoBora pagina={PAGINA_RASTREIO} rotulo="Falar com um professor" />
            <p className="text-sm text-white/50">Nome e WhatsApp. A conversa abre direto com um professor.</p>
          </div>
        </div>
      </section>

      {/* ───────── BORA em movimento ───────── */}
      <section className="border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Rotulo>BORA em movimento</Rotulo>
          <Titulo>
            Letz <span className="text-bora">BORA</span>
          </Titulo>
          <div className="mt-12 grid gap-4 md:grid-cols-[1fr_1fr_1.3fr]">
            {VIDEOS.map((v) => (
              <VideoBora key={v.src} {...v} />
            ))}
            <div className="grid grid-cols-2 gap-4 md:h-full md:grid-rows-2">
              {FOTOS.slice(0, 4).map((f) => (
                <div key={f.src} className="relative aspect-[3/4] overflow-hidden rounded-3xl md:aspect-auto">
                  <Image src={f.src} alt={f.alt} fill sizes="(min-width: 768px) 20vw, 50vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {FOTOS.slice(4).map((f) => (
              <div key={f.src} className="relative aspect-[4/3] overflow-hidden rounded-3xl md:aspect-[16/9]">
                <Image src={f.src} alt={f.alt} fill sizes="(min-width: 768px) 50vw, 50vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Parceiros ───────── */}
      <section className="border-t border-white/10 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Rotulo className="text-center">Quem corre com a BORA</Rotulo>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {PARCEIROS.map((p) => (
              <Image
                key={p.nome}
                src={p.logo}
                alt={p.nome}
                width={400}
                height={140}
                className={`h-8 w-auto sm:h-10 ${
                  p.filtro === "branco" ? "brightness-0 invert" : ""
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Ponto de encontro ───────── */}
      <section className="border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <Rotulo>Ponto de encontro</Rotulo>
            <Titulo className="md:text-6xl">
              Estacionamento 10, <span className="text-bora">Parque da Cidade</span>
            </Titulo>
            <p className="mt-5 text-white/65">
              {dataExtenso}, concentração a partir das {hora}. Chegue um pouco antes para estacionar com calma e aquecer com a turma.
            </p>
            <a
              href={evento.localUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-bold text-black hover:bg-white/90"
            >
              <MapPin className="h-5 w-5" /> Abrir no Google Maps
            </a>
          </div>
          <div className="overflow-hidden rounded-[28px] border border-white/10">
            <MapaEncontro className="h-[320px] sm:h-[420px]" />
          </div>
        </div>
      </section>

      {/* ───────── Check-in ───────── */}
      <section id="checkin" className="scroll-mt-4 border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Rotulo>Check-in</Rotulo>
          <Titulo>
            Garante seu lugar <span className="text-bora">no corre</span>
          </Titulo>
          <p className="mt-5 text-white/65">
            {dataExtenso}, a partir das {hora}, {localCurto}. Gratuito e aberto a todo mundo, aluno ou não.
          </p>
          <div className="mt-10">
            <CheckIn
              estado={evento.estado}
              titulo={evento.titulo}
              data={evento.data}
              horario={evento.horario}
              local={evento.local}
              localUrl={evento.localUrl}
              pelotoes={evento.pelotoes}
              dataExtenso={dataExtenso}
              horarioCurto={hora}
            />
          </div>
        </div>
      </section>

      {/* ───────── Perguntas ───────── */}
      <section className="border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Rotulo>Perguntas</Rotulo>
          <Titulo>Ficou alguma dúvida?</Titulo>
          <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {PERGUNTAS.map((q) => (
              <details key={q.p} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-lg [&::-webkit-details-marker]:hidden">
                  {q.p}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/20 text-bora transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-white/65">{q.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Fechamento ───────── */}
      <section className="relative overflow-hidden bg-bora text-black">
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-center md:justify-between md:py-24">
          <div>
            <p className="font-bora text-sm font-bold uppercase tracking-[0.2em]">
              {d.dia}.{evento.data.slice(5, 7)} · {localCurto}
            </p>
            <h2 className="mt-4 max-w-2xl font-bora text-5xl font-black uppercase italic leading-[0.9] md:text-7xl">
              Te vejo no parque. Letz BORA!
            </h2>
          </div>
          <a
            href="#checkin"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-black px-8 py-4 font-bora text-lg font-black uppercase italic text-bora"
          >
            {ctaCheckin} <ArrowUpRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <Link href="/" className="inline-flex items-center gap-2 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> SOMMA Club
          </Link>
          <Link href="/assessoria" className="hover:text-white">
            BORA Assessoria
          </Link>
          <Link href="/check-in" className="hover:text-white">
            Agenda de encontros
          </Link>
        </div>
        <Image src="/bora/sticker-letz-bora-green.webp" alt="letz BORAAA!!" width={720} height={336} className="h-12 w-auto" />
      </footer>
    </main>
  );
}
