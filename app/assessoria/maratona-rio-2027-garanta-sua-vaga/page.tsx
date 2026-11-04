import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, X } from "lucide-react";
import { altone } from "@/components/bora/fonte";
import { CabecalhoBora } from "@/components/bora/cabecalho-bora";
import { getServiceSupabase } from "@/lib/supabase";
import {
  EMAIL_SAC,
  LIMITE_VAGAS,
  PROVA_INSCRICAO,
  VALOR_ESTRUTURA,
  VALOR_INSCRICAO,
  reais,
} from "@/lib/maratona-rio-2027/inscricao";
import { PROFESSORES_BORA } from "@/lib/nova-assessoria/professores";
import { FormularioInscricao } from "./_components/FormularioInscricao";

/**
 * /assessoria/maratona-rio-2027-garanta-sua-vaga: inscrição da Meia Maratona
 * do Rio 2027 pelas vagas da assessoria (2º lote, só kit sem camisa,
 * exclusivo para atletas BORA). A pessoa reserva a vaga aqui e paga por Pix
 * à BORA; a equipe confirma no painel (./admin).
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Garanta sua vaga: Meia Maratona do Rio 2027 | BORA × SOMMA Club",
  description: `Só ${LIMITE_VAGAS} vagas da assessoria para a Meia Maratona do Rio 2027, exclusivas para atletas BORA. ${reais(VALOR_INSCRICAO)}, kit sem camisa, vaga garantida sem sorteio.`,
  alternates: { canonical: "/assessoria/maratona-rio-2027-garanta-sua-vaga" },
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SOMMA Club",
    title: "Meia Maratona do Rio 2027: garanta sua vaga",
    description: `Só ${LIMITE_VAGAS} vagas, exclusivas para atletas BORA. ${reais(VALOR_INSCRICAO)}, vaga garantida sem sorteio.`,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

/** Vagas que sobram. null quando o banco não respondeu (o formulário segue aberto e o banco decide). */
async function vagasRestantes(): Promise<number | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { count, error } = await supabase
    .from("maratona_rio_2027_inscricoes")
    .select("id", { count: "exact", head: true })
    .neq("status", "cancelado");
  if (error) {
    console.error("[maratona-rio-2027] Falha ao contar vagas:", error.message);
    return null;
  }
  return Math.max(LIMITE_VAGAS - (count ?? 0), 0);
}

const CAMINHOS = [
  {
    titulo: "1º lote da assessoria",
    preco: "R$ 349",
    itens: ["Já esgotado"],
    destaque: false,
    esgotado: true,
  },
  {
    titulo: "Vagas da assessoria agora",
    preco: reais(VALOR_INSCRICAO),
    itens: [`Só ${LIMITE_VAGAS} vagas neste lote`, "Vaga garantida, sem sorteio", "Kit básico, sem camisa", "Exclusivo para atletas BORA"],
    destaque: true,
    esgotado: false,
  },
  {
    titulo: "Sorteio da organização",
    preco: "R$ 399",
    itens: [
      "Com camiseta",
      "Só acontece depois que fecham as vagas das assessorias",
      "Não foi sorteado? Fica sem vaga",
    ],
    destaque: false,
    esgotado: false,
  },
];

const PERGUNTAS = [
  {
    p: "O que mudou no calendário de inscrições?",
    r: "Em 2027 cada prova tem a sua janela de venda, e agora é a vez da Meia Maratona. A Maratona (42 km) vendeu em agosto; 5 km e 10 km devem abrir em fevereiro. Toda prova tem pré-venda de patrocinadores, venda por sorteio e ações promocionais com regras próprias. A vaga pela assessoria é a forma de garantir a inscrição com comodidade, sem depender de sorte.",
  },
  {
    p: "E se eu deixar para o sorteio?",
    r: "O sorteio só acontece depois que fecham as vagas das assessorias, custa R$ 399 (com camiseta) e não garante nada: quem não for sorteado fica sem vaga. Depois disso, o único caminho costuma ser agência de viagem, comprando pacote mais inscrição.",
  },
  {
    p: "Qual é o kit?",
    r: "Neste lote só existe o Kit Básico, sem camisa.",
  },
  {
    p: "Como pago?",
    r: "Só por Pix ou transferência para a BORA Assessoria, sem parcelamento. Ao enviar o formulário você recebe o Pix com o valor certo para copiar e colar.",
  },
  {
    p: "Como sei que deu tudo certo?",
    r: `Depois de pagar, mande o comprovante para ${EMAIL_SAC}. A equipe confere e confirma a sua inscrição.`,
  },
  {
    p: "Como vai ser a entrega dos kits no Rio?",
    r: "A organização só define em abril ou maio de 2027. A tendência é que os kits venham todos para a assessoria e a assessoria entregue aos atletas, em local e horário a definir.",
  },
  {
    p: "Vai ter estrutura de apoio da BORA no Rio?",
    r: `Sim, como em todo grande evento (Maratona do Rio, Volta da Pampulha, Maratona de Floripa). Pela proporção da estrutura, há uma taxa de participação. Pagando junto com a inscrição, ela sai por ${reais(VALOR_ESTRUTURA)}, valor promocional. É um valor único por atleta, mesmo para quem corre em mais de um dia.`,
  },
];

export default async function GarantaSuaVagaPage() {
  const vagas = await vagasRestantes();
  const esgotado = vagas === 0;
  const professores = PROFESSORES_BORA.map((p) => ({ slug: p.slug, nome: p.nome }));

  return (
    <main className={`${altone.variable} min-h-screen overflow-x-hidden bg-black text-white`}>
      {/* O body do site é branco: sem isso, o "quique" do scroll no iOS mostra branco. */}
      <style>{"html,body{background:#000}"}</style>

      <section className="relative">
        <Image
          src="/bora/pattern-bora-white.webp"
          alt=""
          aria-hidden="true"
          width={900}
          height={1000}
          className="pointer-events-none absolute -right-40 top-0 w-[520px] opacity-[0.08] sm:-right-24 sm:w-[760px]"
          priority
        />
        <CabecalhoBora />
        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-8 sm:px-6 md:pt-14">
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">
            Exclusivo para atletas BORA
          </p>
          <h1 className="mt-4 font-bora text-[42px] font-black uppercase italic leading-[0.92] sm:text-7xl">
            Meia Maratona do Rio <span className="text-bora">2027</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/75">
            Vagas extras da assessoria para os 21 km. Garanta a sua inscrição sem passar pelo sorteio.
          </p>

          <div
            className={
              esgotado
                ? "mt-6 flex gap-3 rounded-2xl border border-red-500/50 bg-red-500/10 p-4"
                : "mt-6 flex gap-3 rounded-2xl border border-bora bg-bora p-4 text-black"
            }
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm leading-snug">
              <strong className="font-bora text-base font-black uppercase">
                Apenas {LIMITE_VAGAS} vagas disponíveis.
              </strong>{" "}
              {esgotado
                ? "Todas já foram preenchidas."
                : "Quando acabarem, as inscrições fecham automaticamente. Depois, só pelo sorteio."}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-widest text-white/50">Valor único</p>
              <p className="mt-1 font-bora text-2xl font-black italic sm:text-3xl">{reais(VALOR_INSCRICAO)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-widest text-white/50">Kit</p>
              <p className="mt-1 font-bora text-lg font-black uppercase italic leading-tight sm:text-xl">Sem camisa</p>
            </div>
            <div
              className={
                esgotado
                  ? "rounded-2xl border border-red-500/40 bg-red-500/10 p-4"
                  : "rounded-2xl border border-bora/50 bg-bora/10 p-4"
              }
            >
              <p className="text-[11px] uppercase tracking-widest text-white/50">Vagas</p>
              <p className="mt-1 font-bora text-2xl font-black italic text-bora sm:text-3xl">
                {vagas === null ? LIMITE_VAGAS : esgotado ? "0" : vagas}
              </p>
              <p className="text-[11px] text-white/50">
                {vagas === null ? "no lote" : esgotado ? "esgotado" : `${vagas === 1 ? "restante" : "restantes"} de ${LIMITE_VAGAS}`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Por que agora */}
      <section className="border-t border-white/10 py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Por que garantir agora</p>
          <h2 className="mt-3 font-bora text-3xl font-black uppercase italic leading-[0.95] sm:text-5xl">
            Os três caminhos para correr os 21 km
          </h2>
          <ol className="mt-8 grid gap-3 md:grid-cols-3">
            {CAMINHOS.map((c) => (
              <li
                key={c.titulo}
                className={
                  c.destaque
                    ? "rounded-3xl border-2 border-bora bg-bora/[0.08] p-5"
                    : "rounded-3xl border border-white/10 bg-white/[0.03] p-5"
                }
              >
                <p className={c.destaque ? "text-xs font-bold uppercase tracking-widest text-bora" : "text-xs font-bold uppercase tracking-widest text-white/50"}>
                  {c.titulo}
                </p>
                <p
                  className={
                    c.esgotado
                      ? "mt-2 font-bora text-4xl font-black italic text-white/35 line-through"
                      : "mt-2 font-bora text-4xl font-black italic"
                  }
                >
                  {c.preco}
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {c.itens.map((item) => {
                    const ruim = /esgotado|Fica sem vaga|depois que fecham/.test(item);
                    return (
                      <li key={item} className="flex gap-2 text-white/75">
                        {ruim ? (
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                        ) : (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-bora" />
                        )}
                        {item}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm leading-relaxed text-white/55">
            Quem fica de fora do sorteio normalmente só consegue correr comprando pacote de agência de viagem, com
            inscrição junto.
          </p>
        </div>
      </section>

      {/* Inscrição */}
      <section id="inscricao" className="border-t border-white/10 py-14">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Inscrição</p>
          <h2 className="mt-3 font-bora text-3xl font-black uppercase italic leading-[0.95] sm:text-5xl">
            Reserve a sua vaga
          </h2>
          <p className="mt-4 text-white/65">
            {PROVA_INSCRICAO.nome} · {PROVA_INSCRICAO.kit}. Preencha, reserve e pague o Pix que aparece no final.{" "}
            <strong className="text-white">São só {LIMITE_VAGAS} vagas</strong>: a sua só fica guardada depois de enviar.
          </p>
          <div className="mt-8">
            {esgotado ? (
              <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-10 text-center">
                <p className="font-bora text-3xl font-black uppercase italic">Vagas esgotadas</p>
                <p className="mt-3 text-white/70">
                  As {LIMITE_VAGAS} vagas deste lote acabaram. Fale com o seu treinador para saber das próximas.
                </p>
              </div>
            ) : (
              <FormularioInscricao professores={professores} />
            )}
          </div>
        </div>
      </section>

      {/* Perguntas */}
      <section className="border-t border-white/10 py-14">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Dúvidas</p>
          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {PERGUNTAS.map((q) => (
              <details key={q.p} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {q.p}
                  <span className="font-bora text-2xl text-bora transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-white/65">{q.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-3xl flex-col gap-4 border-t border-white/10 px-4 py-10 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/assessoria" className="inline-flex items-center gap-2 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Assessoria
        </Link>
        <Image
          src="/bora/sticker-letz-bora-green.webp"
          alt="letz BORAAA!!"
          width={720}
          height={336}
          className="h-12 w-auto"
        />
      </footer>
    </main>
  );
}
