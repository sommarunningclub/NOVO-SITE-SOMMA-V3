import { Footprints, Ruler, Users, Trophy, Award, Sigma } from 'lucide-react'

const fontDisplay = { fontFamily: 'var(--font-bebas), sans-serif' }
const fontBody = { fontFamily: 'var(--font-dm-sans-wfl), sans-serif' }

const summaryCards = [
  { icon: Footprints, title: 'Formato', body: '4 atletas por equipe (2M + 2F)' },
  { icon: Ruler, title: 'Distância', body: '100m por atleta · 400m por prova' },
  { icon: Sigma, title: 'Resultado', body: 'Soma do tempo das 2 provas' },
  { icon: Users, title: 'Baterias', body: '4 equipes por bateria · 1 staff por equipe' },
  { icon: Trophy, title: 'Classificação', body: '8 menores somas vão à final' },
  { icon: Award, title: 'Premiação', body: 'Top 3 atléticas levam prêmios' },
]

const dinamicas = [
  {
    n: 1,
    title: 'Corrida saltada',
    body: 'Avança em saltos consecutivos com os dois pés juntos.',
  },
  {
    n: 2,
    title: 'Corrida lateral esquerda',
    body: 'Percorre os 100m correndo de lado, deslocando para o lado esquerdo.',
  },
  {
    n: 3,
    title: 'Corrida de costas',
    body: 'Pode olhar pra trás, mas é proibido girar o tronco para a frente.',
  },
  {
    n: 4,
    title: 'Corrida lateral direita',
    body: 'Percorre os 100m correndo de lado, deslocando para o lado direito.',
  },
]

export default function WingsCompetition() {
  return (
    <section className="bg-white py-12 sm:py-24 px-4 sm:px-8" style={fontBody}>
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="inline-block bg-wfl-yellow px-3 py-2 sm:px-4 max-w-full">
          <h2 className="text-sm sm:text-xl font-extrabold tracking-wider uppercase text-wfl-navy leading-tight">
            Atividade competitiva — 2 revezamentos 4×100m
          </h2>
        </div>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-wfl-dark/70 max-w-2xl">
          A competição é composta por <strong>duas provas independentes</strong> que somam pra um
          único resultado da equipe. O <strong>menor tempo combinado</strong> vence.
        </p>

        {/* Cards de resumo */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {summaryCards.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="relative bg-wfl-card border-t-2 border-wfl-red px-3 sm:px-4 pt-3 pb-3 sm:pt-4 sm:pb-4"
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-wfl-red mb-1.5 sm:mb-2" aria-hidden="true" />
              <p className="text-xs sm:text-sm font-bold text-wfl-navy">{title}</p>
              <p className="mt-1 text-xs text-wfl-dark/70 leading-snug">{body}</p>
            </div>
          ))}
        </div>

        {/* Prova 1 */}
        <div className="mt-10 sm:mt-14">
          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <span
              className="bg-wfl-navy text-wfl-yellow px-2.5 py-1 text-xs sm:text-sm font-extrabold tracking-wider uppercase"
            >
              Prova 1
            </span>
            <h3
              className="text-2xl sm:text-4xl uppercase text-wfl-navy leading-none"
              style={fontDisplay}
            >
              Revezamento 4×100m atletismo
            </h3>
          </div>
          <p className="mt-2 sm:mt-3 text-sm text-wfl-dark/70 max-w-2xl">
            Revezamento tradicional de atletismo. 4 atletas, 100m cada, corrida normal.
            <strong> Resultado:</strong> tempo total da equipe.
          </p>
        </div>

        {/* Prova 2 */}
        <div className="mt-10 sm:mt-14">
          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <span className="bg-wfl-red text-white px-2.5 py-1 text-xs sm:text-sm font-extrabold tracking-wider uppercase">
              Prova 2
            </span>
            <h3
              className="text-2xl sm:text-4xl uppercase text-wfl-navy leading-none"
              style={fontDisplay}
            >
              Revezamento 4×100m dinâmico
            </h3>
          </div>
          <p className="mt-2 sm:mt-3 text-sm text-wfl-dark/70 max-w-2xl">
            Cada atleta corre 100m em um estilo diferente. A ordem é fixa por modalidade — sua
            equipe define quem faz cada uma antes da bateria.
          </p>

          <ol className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3">
            {dinamicas.map(m => (
              <li
                key={m.n}
                className="flex items-start gap-3 sm:gap-4 border border-wfl-border bg-white hover:bg-wfl-card/40 transition-colors px-4 py-3.5 sm:px-6 sm:py-5 rounded-2xl sm:rounded-full"
              >
                <span
                  className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-wfl-red text-white font-bold flex items-center justify-center text-sm sm:text-base"
                  aria-hidden="true"
                >
                  {m.n}
                </span>
                <div className="min-w-0">
                  <p className="text-sm sm:text-lg font-bold text-wfl-navy leading-tight">{m.title}</p>
                  <p className="mt-1 text-xs sm:text-sm text-wfl-dark/70 leading-relaxed">{m.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Cálculo do resultado */}
        <div className="mt-10 sm:mt-14 bg-wfl-navy text-white p-5 sm:p-7">
          <p className="text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase text-wfl-yellow">
            Cálculo do resultado
          </p>
          <p
            className="mt-3 text-2xl sm:text-3xl leading-tight"
            style={fontDisplay}
          >
            <span className="text-wfl-yellow">Tempo combinado</span> = Atletismo + Dinâmica
          </p>
          <p className="mt-2 text-sm text-white/80">
            O <strong>menor tempo combinado</strong> = melhor colocação. Cronometragem oficial é
            feita pelo staff Somma e atualiza o ranking ao vivo na hora.
          </p>
        </div>

        {/* Linha de regras finais */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-wfl-card border border-wfl-border p-4 sm:p-6">
            <p className="text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase text-wfl-red">
              Classificatórias
            </p>
            <p className="mt-2 text-sm text-wfl-dark/80 leading-relaxed">
              Cada equipe corre as 2 provas. As{' '}
              <span className="text-wfl-red font-semibold">8 menores somas combinadas</span>{' '}
              avançam para a final.
            </p>
          </div>
          <div className="bg-wfl-red text-white p-4 sm:p-6">
            <p className="text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase text-wfl-yellow">
              Final
            </p>
            <p className="mt-2 text-sm text-white/90 leading-relaxed">
              Mesma estrutura: 2 provas combinadas. As{' '}
              <span className="text-wfl-yellow font-semibold">3 atléticas</span> com menor tempo
              total levam{' '}
              <span className="text-wfl-yellow font-semibold">premiação no pódio</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
