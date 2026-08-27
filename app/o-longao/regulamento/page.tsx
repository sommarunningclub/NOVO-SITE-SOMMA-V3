import type { Metadata } from "next";
import Link from "next/link";
import {
  EVENTO,
  EVENT_URL,
  FORMATO,
  LINKS,
  PREMIACAO,
  PREMIACAO_POR_CATEGORIA,
  formataReais,
} from "@/lib/o-longao/config";
import { PREMIO } from "@/lib/o-longao/copy";

/**
 * Regulamento do O LONGÃO em versão preliminar.
 *
 * Server Component puro, sem animação: é página de leitura. Todo número vem de
 * `config.ts` (FORMATO, PREMIACAO, EVENTO) ou do copy derivado dele, para que a
 * regra escrita aqui nunca discorde da landing.
 */

const DESCRIPTION =
  "Regulamento do O Longão: elegibilidade, formato da seletiva, final de 24 horas, premiação e conduta. Versão preliminar.";

export const metadata: Metadata = {
  title: "Regulamento | O Longão",
  description: DESCRIPTION,
  alternates: { canonical: `${EVENT_URL}/regulamento` },
  robots: { index: true, follow: true },
};

type Secao = {
  id: string;
  numero: string;
  titulo: string;
  paragrafos?: readonly string[];
  itens?: readonly string[];
};

const REALIZACAO = EVENTO.realizacao.join(" e ");

const SECOES: readonly Secao[] = [
  {
    id: "evento",
    numero: "01",
    titulo: "O EVENTO",
    paragrafos: [
      `${EVENTO.nome} é uma competição de revezamento em esteira com ${FORMATO.finalHoras} horas de duração, realizada em ${EVENTO.cidade}, ${EVENTO.uf}, por ${REALIZACAO}, com a ${EVENTO.masterSponsor} como fornecedora oficial das esteiras.`,
      `A disputa acontece em duas fases: uma seletiva classificatória de ${FORMATO.seletivaMinutos} minutos e uma final ininterrupta de ${FORMATO.finalHoras} horas. Vence a equipe que acumular a maior distância.`,
      "Este documento é a versão preliminar do regulamento. O regulamento oficial completo será publicado antes da abertura da seletiva e prevalecerá sobre qualquer versão anterior.",
    ],
  },
  {
    id: "elegibilidade",
    numero: "02",
    titulo: "ELEGIBILIDADE",
    itens: [
      "Podem se inscrever crews de corrida, assessorias esportivas, running clubs, clubes esportivos e grupos organizados de corredores do Distrito Federal e região.",
      "A inscrição é sempre por equipe. Não existe inscrição individual.",
      "A idade mínima para competir é de 14 anos completos na data da seletiva.",
      "Atletas menores de 18 anos só participam com autorização assinada do responsável legal, entregue à organização antes da largada.",
      "Cada CPF corre por uma única crew na edição. A mesma pessoa não pode integrar duas equipes.",
    ],
  },
  {
    id: "equipe",
    numero: "03",
    titulo: "A EQUIPE",
    itens: [
      `Cada equipe é formada por ${FORMATO.titulares} atletas titulares.`,
      `Cada equipe pode cadastrar até ${FORMATO.reservasMax} atletas reservas.`,
      "Cada equipe indica 1 capitão, que pode ser um dos atletas e responde pela escala e pelas trocas.",
      `As categorias são ${FORMATO.categorias.join(" e ")}, e competem separadamente.`,
      "Uma mesma crew pode inscrever equipe nas duas categorias, desde que com atletas diferentes em cada uma.",
    ],
  },
  {
    id: "seletiva",
    numero: "04",
    titulo: "A SELETIVA",
    paragrafos: [
      `A seletiva acontece em unidade Evolve, em baterias classificatórias. Cada equipe recebe ${FORMATO.esteirasPorEquipe} esteira ${EVENTO.masterSponsor} e tem ${FORMATO.seletivaMinutos} minutos para acumular a maior distância possível.`,
      `Janela prevista: ${EVENTO.seletiva.janela}. Local: ${EVENTO.seletiva.local}.`,
    ],
    itens: [
      "As trocas são livres em número e em duração.",
      `Todos os ${FORMATO.titulares} titulares precisam correr na esteira durante a bateria.`,
      "O relógio da bateria não para, mesmo com a esteira vazia.",
      "Após todas as baterias sai o ranking geral por distância acumulada.",
      `Classificam-se para a final ${FORMATO.finalistasPorCategoria} equipes de cada categoria, totalizando ${FORMATO.finalistasPorCategoria * FORMATO.categorias.length} finalistas.`,
    ],
  },
  {
    id: "final",
    numero: "05",
    titulo: "A FINAL",
    paragrafos: [
      `A final é uma competição ininterrupta de ${FORMATO.finalHoras} horas, de sábado às ${EVENTO.final.largada} até domingo às ${EVENTO.final.chegada}.`,
      `Janela prevista: ${EVENTO.final.janela}. Local: ${EVENTO.final.local}.`,
    ],
    itens: [
      `Cada equipe finalista recebe ${FORMATO.esteirasPorEquipe} esteira exclusiva para uso durante toda a prova.`,
      "Apenas um corredor por vez na esteira da equipe.",
      "As trocas são ilimitadas e a escala é livre, desde que só corram atletas inscritos.",
      "Vence a equipe com a maior distância acumulada ao final das 24 horas, em cada categoria.",
    ],
  },
  {
    id: "trocas",
    numero: "06",
    titulo: "TROCAS E PERMANÊNCIA",
    itens: [
      "O relógio da prova nunca para, do início ao fim.",
      "Esteira vazia não acumula distância. O tempo parado é quilometragem perdida e não é reposto.",
      "A esteira pode ser pausada pela equipe, por opção estratégica ou por segurança, sem qualquer compensação de tempo.",
      "O procedimento de troca, incluindo a área de transição e a sinalização, será definido no briefing técnico obrigatório antes da largada.",
    ],
  },
  {
    id: "premiacao",
    numero: "07",
    titulo: "PREMIAÇÃO",
    paragrafos: [
      `A crew campeã de cada categoria recebe ${formataReais(PREMIACAO_POR_CATEGORIA)}. São ${formataReais(PREMIACAO_POR_CATEGORIA)} para a campeã masculina e ${formataReais(PREMIACAO_POR_CATEGORIA)} para a campeã feminina, totalizando ${PREMIO.total} em dinheiro.`,
      PREMIO.nota,
    ],
    itens: [
      ...PREMIACAO.porCategoria.map((p) =>
        p.valor === null
          ? `${p.posicao}º lugar de cada categoria: premiação a ser divulgada pela organização.`
          : `${p.posicao}º lugar de cada categoria: ${formataReais(p.valor)}.`
      ),
      "O pagamento é feito à equipe, por meio do responsável pela inscrição ou do capitão indicado.",
      "O rateio interno do prêmio é decisão exclusiva da crew.",
    ],
  },
  {
    id: "saude",
    numero: "08",
    titulo: "SAÚDE E SEGURANÇA",
    itens: [
      "Todo atleta assina termo de responsabilidade no ato da inscrição, declarando estar apto à prática de atividade física de alta intensidade.",
      "A organização recomenda avaliação médica prévia a todos os participantes.",
      "A organização, por meio da equipe de saúde do evento, pode retirar da prova qualquer atleta cuja continuidade represente risco.",
      "A recusa em cumprir orientação da equipe de saúde pode levar à desclassificação da equipe.",
    ],
  },
  {
    id: "imagem",
    numero: "09",
    titulo: "USO DE IMAGEM",
    paragrafos: [
      "Ao aceitar os termos da inscrição, atletas e equipes autorizam o uso de imagem, voz e nome em fotos, vídeos e transmissões relacionadas ao evento, sem ônus, por prazo indeterminado.",
      "A autorização vale para os materiais do evento e de seus realizadores e patrocinadores, nos termos apresentados no formulário de inscrição.",
    ],
  },
  {
    id: "conduta",
    numero: "10",
    titulo: "CONDUTA",
    itens: [
      "Espera-se fair play entre atletas, equipes, staff e público, dentro e fora da arena.",
      "Manipular equipamento, adulterar dados de telemetria ou colocar em pista atleta não inscrito resulta em desclassificação.",
      "O uso de substância proibida resulta em eliminação da equipe inteira da competição.",
      "Agressão, discriminação ou assédio implicam remoção imediata da arena e eliminação da equipe.",
    ],
  },
  {
    id: "elenco",
    numero: "11",
    titulo: "ALTERAÇÕES DE ELENCO",
    itens: [
      `A substituição de titular por reserva é permitida mediante comunicação prévia à organização, respeitando o limite de ${FORMATO.reservasMax} reservas por equipe.`,
      "A comunicação deve ser feita pelo responsável pela inscrição ou pelo capitão, pelos canais oficiais.",
      "Após o briefing técnico, alterações só serão aceitas por motivo de saúde comprovado.",
      "Atleta substituído não retorna à disputa na mesma fase.",
    ],
  },
  {
    id: "gerais",
    numero: "12",
    titulo: "DISPOSIÇÕES GERAIS",
    paragrafos: [
      "Os casos omissos neste regulamento serão decididos pela organização, cuja decisão é soberana e não cabe recurso.",
      "A organização pode ajustar datas, locais e detalhes de formato, comunicando as equipes inscritas pelos canais oficiais.",
      `Dúvidas: ${LINKS.email} ou o Instagram do ${EVENTO.realizacao[0]}.`,
    ],
  },
];

export default function RegulamentoPage() {
  return (
    <main>
      <header className="border-b border-[var(--line)]">
        <div className="lgo-wrap flex items-center justify-between gap-4">
          <Link
            href="/o-longao"
            className="lgo-label inline-flex min-h-[44px] items-center text-[var(--cinza)]"
          >
            ← O LONGÃO
          </Link>
          <span className="lgo-label hidden text-[var(--sinal)] sm:inline">
            REGULAMENTO
          </span>
        </div>
      </header>

      <div className="lgo-paper">
        <div className="lgo-wrap py-16 sm:py-24">
          <div className="max-w-3xl">
            <h1 className="lgo-display text-[clamp(2.75rem,11vw,6rem)]">
              REGULAMENTO
            </h1>
            <p className="lgo-label mt-6 max-w-xl leading-[1.7] text-[var(--evolve)]">
              VERSÃO PRELIMINAR. O REGULAMENTO OFICIAL COMPLETO SERÁ PUBLICADO
              ANTES DA ABERTURA DA SELETIVA.
            </p>

            <nav className="mt-10 border-t border-[var(--line-dark)] pt-6">
              <p className="lgo-label opacity-60">ÍNDICE</p>
              <ol className="mt-3 grid gap-x-8 sm:grid-cols-2">
                {SECOES.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="lgo-mono flex min-h-[44px] items-center gap-3 text-[0.9rem]"
                    >
                      <span className="opacity-50">{s.numero}</span>
                      <span>{s.titulo}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="mt-16 space-y-14">
              {SECOES.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-16">
                  <p className="lgo-label opacity-50">{s.numero}</p>
                  <h2 className="lgo-display lgo-display-condensed mt-3 text-[clamp(1.5rem,4.5vw,2.25rem)]">
                    {s.titulo}
                  </h2>
                  <div className="mt-5 space-y-4 text-[1rem] leading-relaxed">
                    {s.paragrafos?.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                    {s.itens ? (
                      <ul className="space-y-3 border-l border-[var(--line-dark)] pl-5">
                        {s.itens.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>

            <footer className="mt-20 border-t border-[var(--line-dark)] pt-10">
              <p className="text-[1rem] leading-relaxed">
                O grid é limitado e a seletiva decide tudo. Coloque sua
                comunidade na disputa.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href={LINKS.inscricao}
                  className="lgo-btn inline-flex min-h-[44px] items-center"
                >
                  INSCREVA SUA CREW
                </Link>
                <Link
                  href="/o-longao"
                  className="lgo-label inline-flex min-h-[44px] items-center opacity-70"
                >
                  VOLTAR PARA O LONGÃO
                </Link>
              </div>
              <p className="lgo-label mt-10 opacity-50">
                {EVENTO.cidade}, {EVENTO.uf}
              </p>
              <div className="mt-3 flex flex-wrap gap-6">
                <a
                  href={`mailto:${LINKS.email}`}
                  className="lgo-mono inline-flex min-h-[44px] items-center text-[0.85rem]"
                >
                  {LINKS.email}
                </a>
                <a
                  href={LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lgo-mono inline-flex min-h-[44px] items-center text-[0.85rem]"
                >
                  INSTAGRAM
                </a>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
