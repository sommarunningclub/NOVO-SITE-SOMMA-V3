'use client'

import { useRef, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

const PELOTON_COLORS: Record<string, string> = {
  '8km': '#CC0000',
  '6km': '#eab308',
  '4km': '#22c55e',
}

const PELOTON_LABELS: Record<string, string> = {
  '8km': 'Ritmo Avançado',
  '6km': 'Ritmo Moderado',
  '4km': 'Ritmo Iniciante',
}

interface TransferTicketProps {
  nomeDestino: string
  cpfDestino: string
  pelotao: string
  data: string
  local: string
  localUrl: string
}

export default function TransferTicket({
  nomeDestino,
  cpfDestino,
  pelotao,
  data,
  local,
  localUrl,
}: TransferTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null)
  const [baixando, setBaixando] = useState(false)
  const pelotaoColor = PELOTON_COLORS[pelotao] || '#F26522'
  const pelotaoLabel = PELOTON_LABELS[pelotao] || ''

  const cpfMasc = cpfDestino.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')

  const baixarTicket = async () => {
    if (!ticketRef.current) return
    try {
      setBaixando(true)
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#080808',
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `ticket-catcher-run-${cpfDestino.slice(0, 6)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Erro ao gerar ticket:', e)
      alert('Não foi possível gerar o arquivo. Tire um print da tela.')
    } finally {
      setBaixando(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#080808] px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-[#22c55e] text-xs uppercase tracking-[0.3em] mb-2">Transferência concluída</p>
        <h1
          className="text-3xl sm:text-4xl font-black uppercase text-white leading-tight"
          style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
        >
          Vaga transferida
        </h1>
        <p className="text-zinc-500 text-sm mt-2" style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
          Guarde este comprovante ou baixe o arquivo.
        </p>
      </div>

      <div ref={ticketRef} style={{ width: '100%', maxWidth: '340px', background: '#080808', padding: '16px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0a1a0a 0%, #111111 100%)',
            border: '1.5px solid #1f3a1f',
            borderRadius: '12px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
            <span
              style={{
                color: '#888',
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-dm-sans, sans-serif)',
              }}
            >
              Ticket transferido
            </span>
          </div>
        </div>

        <div style={{ height: '6px', background: '#0a0a0a', borderLeft: '1.5px solid #1f3a1f', borderRight: '1.5px solid #1f3a1f' }} />

        <div style={{ background: '#f9f9f9', borderRadius: '0 0 12px 12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0000 100%)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <img
              src="https://cdn.shopify.com/s/files/1/0788/1932/8253/files/HORIZONTAL_PRETA_LARANJA.png"
              alt="Somma Running Club"
              style={{ height: '22px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            />
            <span style={{ color: '#CC0000', fontSize: '18px', fontWeight: 300 }}>×</span>
            <img
              src="https://cdn.shopify.com/s/files/1/0788/1932/8253/files/RED_BULL_ED_LATA_GLASS_BRANCO_ABERTA.png?v=1776108606"
              alt="Red Bull"
              style={{ height: '42px', objectFit: 'contain' }}
            />
          </div>

          <div style={{ background: '#CC0000', padding: '10px 20px', textAlign: 'center' }}>
            <p
              style={{
                color: '#fff',
                fontSize: '11px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                margin: 0,
                fontFamily: 'var(--font-dm-sans, sans-serif)',
              }}
            >
              Catcher Run · Brasília 2026
            </p>
          </div>

          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ marginBottom: '14px' }}>
              <p style={{ color: '#999', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 3px', fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
                Novo titular
              </p>
              <p style={{ color: '#111', fontSize: '15px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-barlow-condensed, sans-serif)', letterSpacing: '0.03em' }}>
                {nomeDestino}
              </p>
              <p style={{ color: '#666', fontSize: '11px', margin: '2px 0 0', fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
                CPF: {cpfMasc}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <p style={{ color: '#999', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 3px', fontFamily: 'var(--font-dm-sans, sans-serif)' }}>Data</p>
                <p style={{ color: '#111', fontSize: '13px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}>
                  {data || 'Dom, 26 ABR 2026'}
                </p>
              </div>
              <div>
                <p style={{ color: '#999', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 3px', fontFamily: 'var(--font-dm-sans, sans-serif)' }}>Largada</p>
                <p style={{ color: '#111', fontSize: '13px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}>07h30</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ color: '#999', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 3px', fontFamily: 'var(--font-dm-sans, sans-serif)' }}>Local</p>
                <p style={{ color: '#111', fontSize: '13px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}>
                  {local || '106 Sul, Brasília DF'}
                </p>
              </div>
            </div>

            {pelotao && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ color: '#999', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 6px', fontFamily: 'var(--font-dm-sans, sans-serif)' }}>Pelotão</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f0f0f0', border: `2px solid ${pelotaoColor}`, borderRadius: '6px', padding: '6px 12px' }}>
                  <div style={{ width: '28px', height: '28px', background: pelotaoColor, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 900, fontSize: '11px', color: '#fff' }}>
                    {pelotao}
                  </div>
                  <span style={{ color: '#111', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-barlow-condensed, sans-serif)', letterSpacing: '0.05em' }}>
                    {pelotaoLabel}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div style={{ margin: '20px 0 0', borderTop: '2px dashed #e0e0e0', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '-12px', top: '-11px', width: '22px', height: '22px', borderRadius: '50%', background: '#080808' }} />
            <div style={{ position: 'absolute', right: '-12px', top: '-11px', width: '22px', height: '22px', borderRadius: '50%', background: '#080808' }} />
          </div>

          <div style={{ padding: '16px 20px 20px' }}>
            <p style={{ color: '#999', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 3px', fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
              Identificação
            </p>
            <p style={{ color: '#111', fontSize: '11px', margin: 0, fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
              Apresente o CPF acima na entrada do evento
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[340px] mt-6 flex flex-col gap-3">
        <button
          onClick={baixarTicket}
          disabled={baixando}
          className="w-full bg-[#F26522] hover:bg-[#CC0000] disabled:opacity-60 text-white font-black text-sm uppercase tracking-wider py-4 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
        >
          {baixando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {baixando ? 'Gerando...' : 'Baixar ticket'}
        </button>

        {localUrl && (
          <a
            href={localUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3.5 text-center border border-[#CC0000] text-[#CC0000] font-semibold text-sm rounded-sm"
            style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
          >
            Ver localização no mapa
          </a>
        )}
        <a
          href="/"
          className="block w-full py-3.5 text-center border border-zinc-800 text-zinc-400 font-semibold text-sm rounded-sm"
          style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
        >
          Voltar ao site
        </a>
      </div>
    </div>
  )
}
