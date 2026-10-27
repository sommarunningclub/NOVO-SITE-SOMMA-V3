'use client'

import { useCallback, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Calendar, Lock, MapPin, Sparkles } from 'lucide-react'
import {
  AGENDA_NOVEMBRO,
  SOMMA_DAY,
  diasAte,
  textoContagem,
  type ItemAgenda,
} from '../agenda-novembro'
import { Folha } from './Folha'
import { Grupo, IconeQuadrado, Linha } from './ios'

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function partes(data: string) {
  const [y, m, d] = data.split('-').map(Number)
  const semana = DIAS[new Date(y, m - 1, d).getDay()]
  return { dia: String(d).padStart(2, '0'), mes: MESES[m - 1], semana }
}

type Detalhe = {
  titulo: string
  lamina: string
  alt: string
  data: string
  local?: string
  localDetalhe?: string
  destaques: string[]
  aviso?: string
}

/**
 * Vitrine dos encontros que ainda vão abrir check-in. `datasReais` são as
 * datas que já têm evento cadastrado na gestão: essas saem daqui, porque o
 * card de verdade aparece na lista de cima.
 */
export function Agenda({ hoje, datasReais }: { hoje: string; datasReais: Set<string> }) {
  const [aberto, setAberto] = useState<Detalhe | null>(null)
  const fechar = useCallback(() => setAberto(null), [])

  const itens = AGENDA_NOVEMBRO.filter(i => i.data >= hoje && !datasReais.has(i.data))
  const mostraSommaDay = SOMMA_DAY.data >= hoje && !datasReais.has(SOMMA_DAY.data)
  if (itens.length === 0 && !mostraSommaDay) return null

  return (
    <>
      {itens.length > 0 ? (
        <section aria-labelledby="ck-agenda" className="mt-9">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <h2 id="ck-agenda" className="text-[22px] font-bold leading-tight tracking-[-0.03em] sm:text-[26px]">
                Agenda de novembro
              </h2>
              <p className="mt-0.5 text-[15px] text-[var(--ck-sec)]">
                {itens.length === 4 ? '4 sábados, 4 vibes. Escolha a sua!' : 'O que vem por aí no SOMMA.'}
              </p>
            </div>
            <span className="mb-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-[var(--ck-sec)]">
              <Lock className="h-3 w-3" /> Em breve
            </span>
          </div>

          <ul className="flex flex-col gap-2.5 sm:gap-3">
            {itens.map((item, i) => (
              <li key={item.data} className="ck-sobe" style={{ animationDelay: `${80 + i * 70}ms` }}>
                <Ingresso
                  item={item}
                  hoje={hoje}
                  onAbrir={
                    item.lamina
                      ? () =>
                    setAberto({
                      titulo: item.titulo,
                      lamina: item.lamina!,
                      alt: `Arte do ${item.titulo}, ${partes(item.data).dia} de ${partes(item.data).mes}`,
                      data: item.data,
                      local: item.local,
                      localDetalhe: item.localDetalhe,
                      destaques: item.destaques,
                      aviso: item.aviso,
                    })
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
          <p className="mt-3 px-1 text-[13px] leading-snug text-[var(--ck-sec)]">
            O check-in de cada encontro libera aqui, mais perto da data. Toque num ingresso para ver os detalhes.
          </p>
        </section>
      ) : null}

      {mostraSommaDay ? (
        <button
          type="button"
          onClick={() =>
            setAberto({
              titulo: 'SOMMA DAY',
              lamina: SOMMA_DAY.lamina,
              alt: 'Arte do SOMMA DAY, 5 de dezembro',
              data: SOMMA_DAY.data,
              destaques: ['O último do ano, pra fechar 2026 juntos', 'Detalhes em breve'],
            })
          }
          className="ck-toque ck-sobe mt-6 flex w-full items-center gap-4 overflow-hidden rounded-[18px] bg-[#F7F4E9] p-4 text-left text-[#101010] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-tint)] sm:p-5"
          style={{ animationDelay: '380ms' }}
          aria-label="SOMMA DAY, sábado 5 de dezembro, o último do ano. Ver detalhes"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0148F9]">Guarda essa data</p>
            <p className="ck-fonte-anton mt-2 inline-block -rotate-2 border-[3px] border-[#101010] bg-[#FA3606] px-2.5 pb-1 pt-0.5 text-[30px] uppercase leading-none tracking-[0.01em] text-[#F7F4E9] shadow-[4px_4px_0_#101010] sm:text-[36px]">
              SOMMA DAY
            </p>
            <p className="mt-3 text-[15px] leading-snug">
              <b>Sábado, 05/12.</b> O último do ano.
            </p>
          </div>
          <div className="grid h-[76px] w-[76px] shrink-0 rotate-6 place-items-center rounded-[14px] border-[3px] border-[#101010] bg-white text-center shadow-[4px_4px_0_#101010] sm:h-[88px] sm:w-[88px]">
            <div>
              <p className="ck-fonte-anton text-[12px] uppercase tracking-[0.06em] text-[#0148F9]">dez</p>
              <p className="ck-fonte-anton text-[34px] leading-none text-[#FA3606] sm:text-[40px]">05</p>
            </div>
          </div>
        </button>
      ) : null}

      <AnimatePresence>
        {aberto ? <FolhaAgenda key={aberto.data} detalhe={aberto} hoje={hoje} onFechar={fechar} /> : null}
      </AnimatePresence>
    </>
  )
}

function Ingresso({ item, hoje, onAbrir }: { item: ItemAgenda; hoje: string; onAbrir?: () => void }) {
  const { dia, mes, semana } = partes(item.data)
  const localCurto = item.local?.replace('Parque da Cidade, Estacionamento ', 'Parque, Est. ')
  const contagem = textoContagem(diasAte(item.data, hoje))
  // Sem folha para abrir (o evento surpresa), o ingresso é só leitura.
  const Raiz = onAbrir ? 'button' : 'div'

  return (
    <Raiz
      {...(onAbrir ? { type: 'button' as const, onClick: onAbrir } : { role: 'group' })}
      className={`ck-tk ck-tk-${item.identidade} ${onAbrir ? 'ck-toque' : ''} outline-none focus-visible:ring-2 focus-visible:ring-white`}
      aria-label={
        onAbrir
          ? `${item.titulo}, ${semana} ${dia} de ${mes}, ${item.local}. Check-in ainda não liberado. Ver detalhes`
          : `${item.titulo}, ${semana} ${dia} de ${mes}. ${item.subtitulo}.`
      }
    >
      <span className="ck-tk-dia" aria-hidden>
        <b>{dia}</b>
        <span>{semana}</span>
      </span>
      <span className="ck-tk-txt" aria-hidden>
        <strong className="line-clamp-2 text-[15.5px] font-bold leading-[1.15] tracking-[-0.03em] sm:text-[19px]">
          {item.identidade === 'bora' ? (
            <>
              SOMMA Club <span className="font-light">ft.</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/check-in/novembro/bora-logo.png" alt="" className="ck-logo-bora" />
            </>
          ) : item.titulo.includes(' ft. ') ? (
            <>
              {item.titulo.split(' ft. ')[0]} <span className="font-light">ft.</span> {item.titulo.split(' ft. ')[1]}
            </>
          ) : (
            item.titulo
          )}
        </strong>
        <span className="truncate text-[12.5px] opacity-85 sm:text-[14px]">
          {item.subtitulo}
          {localCurto ? ` · ${localCurto}` : ''}
          {item.selo ? (
            <span className="ml-1.5 rounded-[5px] bg-[#D22030] px-1.5 py-[1px] text-[10.5px] font-bold text-white">{item.selo}</span>
          ) : null}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 self-start rounded-full bg-black/20 px-2 py-[3px] text-[11px] font-semibold sm:text-[12px]">
          <Lock className="h-[11px] w-[11px]" strokeWidth={2.6} /> {contagem}
        </span>
      </span>
      <span className="ck-tk-marca" aria-hidden>
        <Marca identidade={item.identidade} />
        <span className="ck-tk-cadeado">
          <Lock className="h-3 w-3" strokeWidth={2.8} />
        </span>
      </span>
    </Raiz>
  )
}

/* eslint-disable @next/next/no-img-element */
function Marca({ identidade }: { identidade: ItemAgenda['identidade'] }) {
  if (identidade === 'dex') return <img src="/check-in/novembro/dex-coracao.png" alt="" />
  if (identidade === 'mu') return <img src="/check-in/novembro/tampinha-michelob.png" alt="" />
  if (identidade === 'bora')
    return (
      <span className="ck-disco">
        <img src="/check-in/novembro/bora-simbolo.png" alt="" className="h-[62%] w-[62%] object-contain" />
      </span>
    )
  return (
    <span className="ck-disco ck-fonte-anton !bg-white/10 text-[30px] leading-none text-white/80 sm:text-[40px]">?</span>
  )
}

function FolhaAgenda({ detalhe, hoje, onFechar }: { detalhe: Detalhe; hoje: string; onFechar: () => void }) {
  const { dia, mes, semana } = partes(detalhe.data)
  const contagem = textoContagem(diasAte(detalhe.data, hoje))

  return (
    <Folha
      titulo={detalhe.titulo}
      onFechar={onFechar}
      rodape={
        <>
          <button
            type="button"
            disabled
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-white/10 text-[17px] font-semibold text-white/45"
          >
            <Lock className="h-4 w-4" /> Check-in abre em breve
          </button>
          <p className="mt-2 text-center text-[12px] text-[var(--ck-sec)]">
            Ainda não dá para se inscrever. Volte aqui mais perto da data.
          </p>
        </>
      }
    >
      <img
        src={detalhe.lamina}
        alt={detalhe.alt}
        width={1080}
        height={1440}
        className="aspect-[3/4] w-full rounded-[14px] bg-black object-cover"
      />

      <Grupo className="mt-4">
        <Linha icone={<IconeQuadrado cor="#FF2C03"><Calendar /></IconeQuadrado>}>
          <span className="block text-[13px] text-[var(--ck-sec)]">Data</span>
          <span className="block text-[16px]">
            {semana[0].toUpperCase() + semana.slice(1)}, {dia} de {mes}
          </span>
        </Linha>
        {detalhe.local ? (
          <Linha icone={<IconeQuadrado cor="#30D158"><MapPin /></IconeQuadrado>}>
            <span className="block text-[13px] text-[var(--ck-sec)]">Local</span>
            <span className="block text-[16px]">{detalhe.local}</span>
            {detalhe.localDetalhe ? (
              <span className="block text-[13px] text-[var(--ck-sec)]">{detalhe.localDetalhe}</span>
            ) : null}
          </Linha>
        ) : null}
        <Linha icone={<IconeQuadrado cor="#8E8E93"><Lock /></IconeQuadrado>}>
          <span className="block text-[13px] text-[var(--ck-sec)]">Check-in</span>
          <span className="block text-[16px]">Libera em breve</span>
        </Linha>
      </Grupo>

      {detalhe.destaques.length > 0 ? (
        <Grupo className="mt-5" titulo="O que esperar" rodape={detalhe.aviso}>
          {detalhe.destaques.map(d => (
            <Linha key={d} icone={<IconeQuadrado cor="#FF9F0A"><Sparkles /></IconeQuadrado>}>
              <span className="block text-[16px] leading-snug">{d}</span>
            </Linha>
          ))}
        </Grupo>
      ) : null}

      <p className="mt-5 text-center text-[13px] text-[var(--ck-sec)]">{contagem}.</p>
    </Folha>
  )
}
