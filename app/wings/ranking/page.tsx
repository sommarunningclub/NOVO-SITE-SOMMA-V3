import WingsRankingClient from '@/components/wings-cronometragem/WingsRankingClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Ranking ao vivo | Wings das Atléticas 2026',
  description: 'Ranking em tempo real do Revezamento 4×100m combinado (atletismo + dinâmica).',
}

export default function WingsRankingPage() {
  return <WingsRankingClient />
}
