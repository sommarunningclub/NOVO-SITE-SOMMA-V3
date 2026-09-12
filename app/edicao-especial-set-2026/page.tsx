import { SOMMA } from "@/lib/somma-data";
import {
  ABERTURA,
  BEBIDA_HORA,
  BENEFICIOS,
  CIDADE,
  CRONOGRAMA,
  DATA_CURTA,
  DATA_EXTENSO,
  ENCERRAMENTO,
  ESCASSEZ_PUBLICA,
  IDADE_MINIMA_BEBIDA,
  JORNADA,
  LARGADA,
  LOCAL_COMPLETO,
  MOTE,
  PELOTOES,
  PELOTOES_ROTULO,
  STATUS,
} from "@/lib/somma-day/event.config";
import { getEvento } from "@/lib/somma-day/db";
import Capa from "./_components/Capa";
import Entra from "./_components/Entra";
import Foto from "./_components/Foto";
import Inscricao from "./_components/Inscricao";
import Letreiro from "./_components/Letreiro";
import MapaLocal from "./_components/MapaLocal";
import Rastreio from "./_components/Rastreio";
import "./somma-day.css";

// A página é a peça mais compartilhada da edição. 60s de cache tira o banco do
// caminho sem atrasar a abertura ou o fechamento das inscrições.
export const revalidate = 60;

/** Cabeçalho de seção. Uma pergunta por seção, respondida logo abaixo. */
function Titulo({
  numero,
  chapeu,
  children,
  claro = false,
}: {
  numero: string;
  chapeu: string;
  children: React.ReactNode;
  claro?: boolean;
}) {
  return (
    <Entra>
      <p className={`text-[11px] font-extrabold uppercase tracking-[0.3em] ${claro ? "opacity-80" : "opacity-60"}`}>
        <span className="text-[var(--sd-vermelho)]">{numero}</span>
        <span className="px-3">·</span>
        {chapeu}
      </p>
      <h2 className="sd-display mt-4 text-[clamp(2.4rem,7vw,4.4rem)] leading-[0.95]">{children}</h2>
    </Entra>
  );
}

export default async function EdicaoEspecialSet2026() {
  // Quem abre e fecha a inscrição é a gestão, no banco. O config só vale
  // enquanto a linha do evento não existir.
  const evento = await getEvento();
  const aberto = evento
    ? evento.checkin_status === "aberto" && evento.evento_encerrado !== true
    : STATUS === "inscricoes_abertas";

  return (
    <main>
      <Rastreio />
      <Capa />
      <Letreiro cor="var(--sd-amarelo)" texto="var(--sd-tinta)" />

      {/* ══ 01 · O que é ═══════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 md:py-24">
        <Titulo numero="01" chapeu="O que é">
          Não é prova.
          <br />
          <span className="text-[var(--sd-vermelho)]">É o nosso dia.</span>
        </Titulo>

        <div className="mt-12 grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-14">
          <Entra>
            <Foto
              src="/midiakit/comunidade.jpg"
              alt="Dois membros do SOMMA Club correndo lado a lado, sorrindo"
              ratio={4 / 3}
              parallax={10}
              legenda="Todo sábado, desde sempre"
              sizes="(max-width: 768px) 100vw, 55vw"
            />
          </Entra>

          <Entra stagger className="grid gap-5">
            {[
              {
                t: "Sem cronômetro",
                d: "Ninguém mede seu tempo, ninguém sobe em pódio. Você escolhe a distância e corre do seu jeito.",
              },
              {
                t: "Aberto a todo nível",
                d: "Tem gente no primeiro 5 km e gente vindo de maratona. O pelotão sai junto e ninguém fica para trás.",
              },
              {
                t: "A manhã inteira",
                d: `Abre às ${ABERTURA} e vai até ${ENCERRAMENTO}. A corrida ocupa uma hora; o resto do dia é o evento.`,
              },
            ].map((c) => (
              <article key={c.t} className="sd-sticker bg-white px-7 py-6">
                <h3 className="sd-display text-[clamp(1.4rem,3.6vw,1.9rem)] leading-none">{c.t}</h3>
                <p className="mt-3 text-[15px] font-medium leading-relaxed">{c.d}</p>
              </article>
            ))}
          </Entra>
        </div>
      </section>

      {/* ══ 02 · Quando e onde ═════════════════════════════════════════════ */}
      <section className="bg-[var(--sd-tinta)] px-5 py-16 text-[var(--sd-creme)] md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <Titulo numero="02" chapeu="Quando e onde" claro>
            <span className="text-[var(--sd-amarelo)]">{DATA_CURTA}</span>
            <br />
            {LOCAL_COMPLETO}
          </Titulo>

          <Entra stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Data", DATA_EXTENSO.replace("Sábado, ", "Sáb, ")],
              ["Abertura", `${ABERTURA} — credenciamento`],
              ["Largada", `${LARGADA} — 5, 6 e 8 km`],
              ["Encerramento", `${ENCERRAMENTO}`],
            ].map(([chave, valor]) => (
              <div key={chave} className="sd-sticker-creme bg-[var(--sd-tinta)] px-6 py-7">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] opacity-70">{chave}</p>
                <p className="sd-display mt-2 text-[clamp(1.5rem,4vw,2rem)] leading-none">{valor}</p>
              </div>
            ))}
          </Entra>

          <Entra className="mt-10">
            <MapaLocal />
          </Entra>
        </div>
      </section>

      {/* ══ 03 · Como se inscrever ═════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 md:py-24">
        <Titulo numero="03" chapeu="Como entrar">
          Três passos.
          <br />
          <span className="text-[var(--sd-azul)]">Dois minutos.</span>
        </Titulo>

        <Entra stagger className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Informe seu CPF",
              d: "Se você já é do Somma, a gente te reconhece e não pede nada de novo. Se não, é um cadastro rápido que vale para as próximas edições.",
              cor: "var(--sd-vermelho)",
            },
            {
              n: "02",
              t: "Escolha seu pelotão",
              d: "5, 6 ou 8 km. Dá para trocar no dia, falando com a organização no credenciamento.",
              cor: "var(--sd-azul)",
            },
            {
              n: "03",
              t: "Receba seu código",
              d: "Ele aparece na tela e chega no seu e-mail. É esse código que vira sua pulseira na entrada.",
              cor: "var(--sd-petroleo)",
            },
          ].map((p) => (
            <article key={p.n} className="sd-sticker px-7 py-8 text-[var(--sd-creme)]" style={{ background: p.cor }}>
              <p className="sd-display text-[2.8rem] leading-none opacity-70">{p.n}</p>
              <h3 className="sd-display mt-2 text-[clamp(1.5rem,4vw,2rem)] leading-none">{p.t}</h3>
              <p className="mt-4 text-[15px] font-semibold leading-relaxed">{p.d}</p>
            </article>
          ))}
        </Entra>

        <Entra className="mt-10">
          <p className="text-[14px] font-bold uppercase tracking-[0.12em]">
            Evento gratuito · Inscrição obrigatória · {ESCASSEZ_PUBLICA}
          </p>
        </Entra>
      </section>

      <Letreiro cor="var(--sd-vermelho)" texto="var(--sd-creme)" />

      {/* ══ 04 · Pelotões ══════════════════════════════════════════════════ */}
      <section className="bg-[var(--sd-azul)] px-5 py-16 text-[var(--sd-creme)] md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <Titulo numero="04" chapeu={`Largada às ${LARGADA}`} claro>
            5K. 6K. 8K.
            <br />
            <span className="text-[var(--sd-amarelo)]">Você escolhe.</span>
          </Titulo>

          <div className="mt-12 grid gap-10 md:grid-cols-[1fr_1fr] md:items-center md:gap-14">
            <Entra stagger className="grid gap-4">
              {PELOTOES.map((p) => (
                <div
                  key={p}
                  className="sd-sticker-creme flex items-baseline justify-between gap-4 bg-[var(--sd-azul)] px-7 py-6"
                >
                  <span className="sd-display text-[clamp(2.4rem,7vw,3.4rem)] leading-none">
                    {PELOTOES_ROTULO[p]}
                  </span>
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] opacity-80">
                    {p === "5km" ? "Primeira vez" : p === "6km" ? "O de sempre" : "Pernas prontas"}
                  </span>
                </div>
              ))}
            </Entra>

            <Entra>
              <Foto
                src="/somma/IMG_1479_JPG.jpg"
                alt="Corredores do SOMMA Club em movimento"
                ratio={3 / 4}
                parallax={14}
                direcao="right"
                sizes="(max-width: 768px) 100vw, 45vw"
              />
            </Entra>
          </div>

          <Entra className="mt-10">
            <p className="max-w-xl text-[15px] font-semibold leading-relaxed opacity-90">
              Não é categoria competitiva: é a distância que você quer fazer. A escolha entra na
              inscrição só para a largada sair organizada.
            </p>
          </Entra>
        </div>
      </section>

      {/* ══ 05 · O que acontece no dia ═════════════════════════════════════ */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 md:py-24">
        <Titulo numero="05" chapeu="O arco do dia">
          Corre cedo,
          <br />
          fica até mais tarde
        </Titulo>

        <Entra stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {JORNADA.map((j, i) => (
            <article
              key={j.titulo}
              className={`sd-sticker ${i % 2 === 0 ? "sd-t3" : "sd-t2"} p-7`}
              style={{ background: j.cor, color: j.cor === "#F2B002" ? "#101010" : "#F7F4E9" }}
            >
              <p className="sd-display text-[2.4rem] leading-none opacity-70">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="sd-display mt-2 text-[clamp(1.6rem,4vw,2.1rem)]">{j.titulo}</h3>
              <p className="mt-3 text-[15px] font-semibold leading-relaxed">{j.texto}</p>
            </article>
          ))}
        </Entra>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          <Entra>
            <Foto
              src="/midiakit/treino.jpg"
              alt="Participantes numa disputa de cabo de guerra em evento do SOMMA Club"
              ratio={1}
              parallax={10}
              legenda="Experiências"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </Entra>
          <Entra delay={0.08}>
            <Foto
              src="/midiakit/wellness.jpg"
              alt="Participantes com brindes de parceiros do SOMMA Club"
              ratio={1}
              parallax={10}
              legenda="Sorteios"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </Entra>
          <Entra delay={0.16}>
            <Foto
              src="/midiakit/eixao3.jpg"
              alt="Duas participantes comemorando durante um encontro do SOMMA Club"
              ratio={1}
              parallax={10}
              legenda="Celebração"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </Entra>
        </div>
      </section>

      {/* ══ 06 · Cronograma ════════════════════════════════════════════════ */}
      <section className="bg-[#fffdf6] px-5 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <Titulo numero="06" chapeu={`${ABERTURA} às ${ENCERRAMENTO}`}>
            O dia inteiro,
            <br />
            hora a hora
          </Titulo>

          <Entra stagger className="mt-12">
            {CRONOGRAMA.map((item) => (
              <div
                key={item.hora}
                className="sd-linha grid items-baseline gap-2 border-b-[3px] border-[var(--sd-tinta)] py-5 sm:grid-cols-[128px_1fr] sm:gap-6"
              >
                <p className="sd-display text-[clamp(1.6rem,4vw,2.1rem)] leading-none" style={{ color: item.cor }}>
                  {item.hora}
                </p>
                <div>
                  <h3 className="sd-display text-[clamp(1.4rem,3.4vw,1.9rem)] leading-none">{item.titulo}</h3>
                  <p className="mt-2 max-w-2xl text-[15px] font-medium leading-relaxed">{item.texto}</p>
                </div>
              </div>
            ))}
          </Entra>
        </div>
      </section>

      {/* ══ 07 · A pulseira ════════════════════════════════════════════════ */}
      <section className="bg-[var(--sd-vermelho)] px-5 py-16 text-[var(--sd-creme)] md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <Titulo numero="07" chapeu="O passaporte do dia" claro>
            Sem pulseira,
            <br />
            <span className="text-[var(--sd-amarelo)]">sem o resto.</span>
          </Titulo>

          <div className="mt-12 grid gap-11 md:grid-cols-[1fr_1fr] md:gap-16">
            <Entra className="min-w-0">
              <p className="max-w-md text-[16px] font-semibold leading-relaxed">
                Você se inscreve aqui, faz o check-in no Estacionamento 9 e recebe a pulseira
                oficial. Ela é a sua identificação e o que libera tudo que o Somma serve no dia.
              </p>
              <p className="mt-5 max-w-md text-[14px] font-medium leading-relaxed opacity-85">
                O parque é público: dá para aparecer e correr sem inscrição. Os benefícios
                oficiais, não — esses são de quem está com a pulseira.
              </p>
              <p className="mt-5 max-w-md text-[13px] font-bold uppercase leading-relaxed tracking-[0.08em] opacity-85">
                Bebida alcoólica a partir das {BEBIDA_HORA}, com identificação para maiores de{" "}
                {IDADE_MINIMA_BEBIDA}.
              </p>
            </Entra>

            <Entra stagger className="grid content-start gap-3 sm:grid-cols-2">
              {BENEFICIOS.map((b) => (
                <div
                  key={b}
                  className="sd-sticker-creme bg-[var(--sd-vermelho)] px-5 py-4 text-[15px] font-extrabold uppercase tracking-[0.04em]"
                >
                  {b}
                </div>
              ))}
            </Entra>
          </div>
        </div>
      </section>

      {/* ══ 08 · A comunidade ══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 md:py-24">
        <Titulo numero="08" chapeu="Quem faz">
          5.000 pessoas
          <br />
          <span className="text-[var(--sd-azul)]">e um sábado só</span>
        </Titulo>

        <Entra className="mt-8">
          <p className="max-w-xl text-[16px] font-semibold leading-relaxed">
            O SOMMA Club corre de graça toda semana, às 7h, no Parque da Cidade. O SOMMA DAY é o
            que acontece quando esse sábado vira festa.
          </p>
        </Entra>

        <div className="mt-12 grid gap-5 md:grid-cols-[1.3fr_1fr]">
          <Entra>
            <Foto
              src="/somma/EXQTSMM-284.jpg"
              alt="Foto oficial do grupo do SOMMA Club reunido no Parque da Cidade"
              ratio={16 / 10}
              parallax={12}
              priority={false}
              sizes="(max-width: 768px) 100vw, 60vw"
            />
          </Entra>
          <Entra delay={0.1} className="grid gap-5">
            <Foto
              src="/midiakit/eixao2.jpg"
              alt="Pelotão do SOMMA Club correndo com a bandeira do clube"
              ratio={16 / 11}
              parallax={8}
              direcao="left"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
            <Foto
              src="/midiakit/espacos.jpg"
              alt="Ativação de parceiro em um evento do SOMMA Club"
              ratio={16 / 11}
              parallax={8}
              direcao="right"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </Entra>
        </div>
      </section>

      {/* ══ 09 · Inscrição ═════════════════════════════════════════════════ */}
      <section id="inscricao" className="bg-[var(--sd-amarelo)] px-5 py-16 md:py-24">
        <div className="mx-auto grid max-w-[1100px] gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-14">
          <Entra className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] opacity-70">
              09 · Sua vaga
            </p>
            <h2 className="sd-display mt-4 text-[clamp(2.6rem,8vw,4.4rem)] leading-[0.95]">
              Garanta
              <br />
              <span className="text-[var(--sd-vermelho)]">sua</span>
              <br />
              pulseira
            </h2>
            <p className="mt-6 max-w-sm text-[15px] font-semibold leading-relaxed">
              Gratuito, com inscrição obrigatória e {ESCASSEZ_PUBLICA.toLowerCase()}. Uma inscrição
              por CPF: se você já se inscreveu, o mesmo CPF devolve o seu código.
            </p>
            <p className="mt-6 text-[13px] font-bold uppercase tracking-[0.16em] opacity-70">
              Dúvida? Chama no{" "}
              <a href={SOMMA.links.whatsapp} className="underline decoration-2 underline-offset-4">
                WhatsApp
              </a>
            </p>
          </Entra>

          <Entra>
            <Inscricao aberto={aberto} />
          </Entra>
        </div>
      </section>

      {/* ══ 10 · Perguntas ═════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 md:py-24">
        <Titulo numero="10" chapeu="Antes de perguntar">
          O básico
        </Titulo>

        <Entra stagger className="mt-10 grid gap-4 md:grid-cols-2">
          {[
            { p: "Quanto custa?", r: "Nada. O evento é gratuito — o que existe é inscrição obrigatória e vaga limitada." },
            { p: "Preciso correr?", r: `A corrida é o começo, não a obrigação. Largada às ${LARGADA}, e o evento segue até ${ENCERRAMENTO}.` },
            { p: "Posso levar alguém?", r: "O parque é público, então qualquer pessoa pode estar lá. Só quem tem pulseira acessa os benefícios oficiais." },
            { p: "Perdi meu código.", r: "Volte aqui e informe o mesmo CPF: o sistema reconhece sua inscrição e devolve o código. Ele também está no seu e-mail." },
            { p: "Dá para trocar de pelotão?", r: "No dia, fale com a organização no credenciamento. O pelotão da inscrição serve para organizar a largada." },
            { p: "Tem chopp?", r: `Tem, a partir das ${BEBIDA_HORA}, junto com o pagode. Com identificação para maiores de ${IDADE_MINIMA_BEBIDA}.` },
          ].map((item) => (
            <article key={item.p} className="sd-sticker bg-white px-6 py-6">
              <h3 className="sd-display text-[1.4rem] leading-none">{item.p}</h3>
              <p className="mt-3 text-[15px] font-medium leading-relaxed">{item.r}</p>
            </article>
          ))}
        </Entra>
      </section>

      <Letreiro cor="var(--sd-amarelo)" texto="var(--sd-tinta)" />

      {/* ── Rodapé ───────────────────────────────────────────────────────── */}
      <footer className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-5 py-14 text-center">
        <p className="sd-display text-[clamp(1.6rem,5vw,2.6rem)] leading-none">{MOTE}</p>
        <a
          href="#inscricao"
          className="sd-botao bg-[var(--sd-vermelho)] px-9 py-5 text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--sd-creme)]"
        >
          Garanta sua pulseira
        </a>
        <p className="text-[12px] font-extrabold uppercase tracking-[0.2em]">SOMMA Club · {CIDADE}</p>
        <div className="flex flex-wrap justify-center gap-5 text-[12px] font-extrabold uppercase tracking-[0.16em]">
          <a href={SOMMA.links.instagram} className="underline decoration-2 underline-offset-4">
            Instagram
          </a>
          <a href="/" className="underline decoration-2 underline-offset-4">
            sommaclub.com.br
          </a>
          <a href="/check-in" className="underline decoration-2 underline-offset-4">
            Check-in do sábado
          </a>
        </div>
      </footer>
    </main>
  );
}
