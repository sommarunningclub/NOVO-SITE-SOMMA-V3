import { Bebas_Neue, DM_Sans } from 'next/font/google'

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans-wfl', display: 'swap' })

export default function WingsCompLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${bebas.variable} ${dmSans.variable}`}>{children}</div>
}
