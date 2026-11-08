import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Droplets, Instagram, MapPin, MessageCircle, Shirt, Smartphone, Sun, Zap } from "lucide-react";
import { altone } from "@/components/bora/fonte";
import { ContatoBora } from "@/components/bora/contato-bora";
import { GRUPO_ATUAL } from "@/lib/whatsapp-grupos";
import { MAPA, PAGINA_RASTREIO, PELOTOES, URL_LP, YANN } from "@/lib/boracomsomma/config";
import { linkGoogleAgenda } from "@/lib/boracomsomma/agenda";
import { horarioCurto, partesDaData } from "@/lib/boracomsomma/evento";
import { lerIngresso } from "@/lib/boracomsomma/ingresso";
import { AcoesIngresso } from "../_components/AcoesIngresso";
import { RetirarIngresso } from "../_components/RetirarIngresso";
import { MapaEncontro } from "../_components/MapaEncontro";

/**
 * /boracomsomma/obrigado?t=<token>: página de obrigado do check-in, com a
 * retirada do ingresso (imagem para baixar e postar, agenda, como chegar).
 * O token vem da rota de check-in ou da retirada por CPF + e-mail.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seu ingresso | BORA com SOMMA",
  robots: { index: false, follow: false },
};

const ANTES_DE_SAIR = [
  { icone: Smartphone, texto: "Ingresso no celular (ou o código anotado)" },
  { icone: Droplets, texto: "Garrafinha de água" },
  { icone: Shirt, texto: "Roupa leve e o tênis de sempre" },
  { icone: Sun, texto: "Protetor solar e boné" },
];

export default async function ObrigadoPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const ingresso = await lerIngresso(t);

  if (!ingresso || !t) {
    return (
      <main className={`${altone.variable} min-h-screen bg-black text-white`}>
        <style>{"html,body{background:#000}"}</style>
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
          <Image src="/bora/logo-white.png" alt="BORA" width={640} height={164} className="h-6 w-auto" />
          <h1 className="mt-10 font-bora text-5xl font-black uppercase italic leading-[0.92]">Ingresso não encontrado</h1>
          <p className="mt-4 text-white/65">O link pode estar incompleto. Retire de novo com o CPF e o e-mail do check-in.</p>
          <RetirarIngresso abertoDeInicio className="mt-8" />
          <Link href="/boracomsomma#checkin" className="mt-8 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Ainda não fiz check-in
          </Link>
        </div>
      </main>
    );
  }

  const ev = ingresso.evento;
  const d = partesDaData(ev.data);
  const hora = horarioCurto(ev.horario);
  const dataExtenso = `${d.semana[0].toUpperCase()}${d.semana.slice(1)}, ${Number(d.dia)} de ${d.mesLongo}`;
  const pelotao = ingresso.pelotao ? PELOTOES[ingresso.pelotao] : null;
  const convite = encodeURIComponent(
    `Bora correr comigo no BORA com SOMMA? Sábado, 14/11, ${hora}, Parque da Cidade (Estacionamento 10). Tem Yann Rodrigues e desafio! Check-in gratuito: ${URL_LP}`,
  );

  return (
    <main className={`${altone.variable} min-h-screen overflow-x-hidden bg-black text-white`}>
      <style>{"html,body{background:#000}"}</style>

      {/* ───────── Abertura ───────── */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 -z-10 h-[620px] w-[620px] rounded-full bg-bora/25 blur-[150px]" />
        <Image
          src="/bora/pattern-bora-white.webp"
          alt=""
          aria-hidden="true"
          width={900}
          height={1000}
          className="pointer-events-none absolute -right-48 top-0 -z-10 w-[640px] opacity-[0.06]"
          priority
        />
        <header className="mx-auto flex h-20 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/boracomsomma" aria-label="BORA com SOMMA" className="flex items-center gap-4">
            <Image src="/logo-somma.svg" alt="SOMMA Club" width={120} height={32} className="h-6 w-auto sm:h-7" priority />
            <span aria-hidden="true" className="font-bora text-lg font-bold text-white/40">
              ×
            </span>
            <Image src="/bora/logo-white.png" alt="BORA" width={640} height={164} className="h-5 w-auto sm:h-6" priority />
          </Link>
        </header>

        <div className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 md:pt-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-bora px-4 py-2 font-bora text-xs font-black uppercase italic tracking-wider text-black sm:text-sm">
            <Check className="h-4 w-4" strokeWidth={3} /> Check-in confirmado
          </span>
          <h1 className="mt-6 max-w-4xl font-bora text-[52px] font-black uppercase italic leading-[0.88] sm:text-8xl">
            {ingresso.primeiroNome}, <span className="text-bora">você está no corre!</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/75">
            Sua vaga no BORA com SOMMA está garantida. Retire seu ingresso aqui embaixo, guarde no celular e chama a galera.
          </p>
        </div>
      </section>

      {/* ───────── Ingresso + retirada ───────── */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <article aria-label="Seu ingresso" className="relative overflow-hidden rounded-[36px] bg-bora text-black shadow-[0_40px_140px_-30px_rgba(206,255,0,0.45)]">
          <div className="p-6 sm:p-10">
            <div className="flex items-center justify-between gap-4">
              <p className="font-bora text-xs font-bold uppercase tracking-[0.25em] sm:text-sm">Ingresso</p>
              <Image src="/boracomsomma/marca/simbolo-white.png" alt="" aria-hidden="true" width={600} height={765} className="h-9 w-auto brightness-0" />
            </div>
            <p className="mt-6 font-bora text-[44px] font-black uppercase italic leading-[0.9] sm:text-6xl">
              <span className="block">BORA</span>
              <span className="block">com SOMMA</span>
            </p>
            <p className="mt-6 font-bora text-2xl font-black uppercase italic leading-tight sm:text-3xl">{ingresso.nome}</p>
            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
              {[
                { t: "Quando", v: dataExtenso },
                { t: "Concentração", v: `A partir das ${hora}` },
                { t: "Onde", v: "Parque da Cidade, Estacionamento 10" },
                {
                  t: "Pelotão",
                  v: ingresso.pelotao ? `${ingresso.pelotao.replace("km", " km")}${pelotao ? ` · ${pelotao.rotulo}` : ""}` : "Escolhe no dia",
                },
              ].map((x) => (
                <div key={x.t}>
                  <dt className="text-[11px] font-bold uppercase tracking-widest text-black/55">{x.t}</dt>
                  <dd className="mt-1 font-semibold leading-snug">{x.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          {/* picote */}
          <div aria-hidden="true" className="relative h-0">
            <span className="absolute -left-5 -top-5 h-10 w-10 rounded-full bg-black" />
            <span className="absolute -right-5 -top-5 h-10 w-10 rounded-full bg-black" />
            <span className="absolute left-8 right-8 top-0 border-t-2 border-dashed border-black/30" />
          </div>
          <div className="flex items-center justify-between gap-6 p-6 sm:p-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-black/55">Código</p>
              <p className="mt-1 whitespace-nowrap font-bora text-[26px] font-black italic sm:text-4xl">{ingresso.codigo}</p>
              <p className="mt-2 text-sm text-black/65">Gratuito · aberto a todos</p>
            </div>
            <div
              className="h-28 w-28 shrink-0 sm:h-32 sm:w-32 [&>svg]:h-full [&>svg]:w-full"
              role="img"
              aria-label={`QR do ingresso ${ingresso.codigo}`}
              dangerouslySetInnerHTML={{ __html: ingresso.qrSvg }}
            />
          </div>
        </article>

        <div>
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Retirada do ingresso</p>
          <h2 className="mt-3 font-bora text-4xl font-black uppercase italic leading-[0.95] sm:text-5xl">Leva ele no bolso</h2>
          <ol className="mt-6 space-y-3 text-white/75">
            <li className="flex gap-3">
              <span className="font-bora text-xl font-black italic text-bora">1</span> Baixe a imagem do ingresso ou poste nos stories.
            </li>
            <li className="flex gap-3">
              <span className="font-bora text-xl font-black italic text-bora">2</span> Salve a data na agenda: o convite já vem com lembrete na véspera.
            </li>
            <li className="flex gap-3">
              <span className="font-bora text-xl font-black italic text-bora">3</span> No sábado, chegue ao Estacionamento 10 a partir das {hora} com o ingresso no celular.
            </li>
          </ol>
          <div className="mt-8">
            <AcoesIngresso
              token={t}
              codigo={ingresso.codigo}
              primeiroNome={ingresso.primeiroNome}
              pelotao={ingresso.pelotao ?? ""}
              agendaGoogle={linkGoogleAgenda({ data: ev.data, horario: ev.horario, local: ev.local })}
            />
          </div>
          <p className="mt-4 text-xs text-white/40">
            Perdeu este link? Na página do corre, use &quot;Retirar meu ingresso&quot; com o CPF e o e-mail do check-in.
          </p>
        </div>
      </section>

      {/* ───────── Como chegar ───────── */}
      <section className="border-t border-white/10 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Ponto de encontro</p>
            <h2 className="mt-3 font-bora text-4xl font-black uppercase italic leading-[0.95] sm:text-5xl">
              Estacionamento 10, <span className="text-bora">Parque da Cidade</span>
            </h2>
            <p className="mt-4 text-white/65">
              {dataExtenso}, concentração a partir das {hora}. Chegue um pouco antes para estacionar com calma e aquecer com a turma.
            </p>
            <a
              href={ev.localUrl || MAPA.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-bold text-black hover:bg-white/90"
            >
              <MapPin className="h-5 w-5" /> Abrir no Google Maps
            </a>
            <ul className="mt-10 grid grid-cols-2 gap-3">
              {ANTES_DE_SAIR.map(({ icone: Icone, texto }) => (
                <li key={texto} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/80">
                  <Icone className="mt-0.5 h-4 w-4 shrink-0 text-bora" /> {texto}
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-[28px] border border-white/10">
            <MapaEncontro className="h-[340px] sm:h-[440px]" />
          </div>
        </div>
      </section>

      {/* ───────── Desafio + grupo ───────── */}
      <section className="border-t border-white/10 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2">
          <div className="rounded-[28px] bg-bora p-7 text-black sm:p-10">
            <Zap className="h-8 w-8" />
            <p className="mt-5 font-bora text-sm font-bold uppercase tracking-[0.2em]">O desafio do Yann</p>
            <h2 className="mt-2 font-bora text-4xl font-black uppercase italic leading-[0.95]">Chama o amigo mais rápido</h2>
            <p className="mt-3 text-black/75">
              O {YANN.nome} vem com o desafio mais irado do dia. Manda o convite para aquele amigo que voa e vem ver quem topa.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={`https://wa.me/?text=${convite}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 font-bold text-white"
              >
                <MessageCircle className="h-5 w-5" /> Convidar no WhatsApp
              </a>
              <a
                href={YANN.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-black px-6 py-3 font-bold"
              >
                <Instagram className="h-5 w-5" /> {YANN.arroba}
              </a>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-white/[0.03] p-7 sm:p-10">
            <div>
              <MessageCircle className="h-8 w-8 text-bora" />
              <p className="mt-5 font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Comunidade</p>
              <h2 className="mt-2 font-bora text-4xl font-black uppercase italic leading-[0.95]">Entra no grupo do SOMMA</h2>
              <p className="mt-3 text-white/65">Avisos do corre, os próximos encontros e a turma toda no mesmo lugar.</p>
            </div>
            <a
              href={GRUPO_ATUAL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 self-start rounded-full bg-white px-6 py-3.5 font-bold text-black"
            >
              Entrar no grupo
            </a>
          </div>
        </div>
      </section>

      {/* ───────── BORA ───────── */}
      <section className="border-t border-white/10 py-16 md:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Assessoria oficial do SOMMA Club</p>
            <h2 className="mt-3 max-w-2xl font-bora text-4xl font-black uppercase italic leading-[0.95] sm:text-5xl">
              Quer treinar com a <span className="text-bora">BORA</span>?
            </h2>
            <p className="mt-3 max-w-xl text-white/65">Planilha individual, professor de perto e app no relógio. Fala com um professor e começa.</p>
          </div>
          <ContatoBora pagina={PAGINA_RASTREIO} rotulo="Falar com um professor" className="shrink-0" />
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/boracomsomma" className="inline-flex items-center gap-2 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar para o BORA com SOMMA
        </Link>
        <Image src="/bora/sticker-letz-bora-green.webp" alt="letz BORAAA!!" width={720} height={336} className="h-12 w-auto" />
      </footer>
    </main>
  );
}
