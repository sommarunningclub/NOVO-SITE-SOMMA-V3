'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Home, Briefcase, Calendar, Shield, Settings } from 'lucide-react'

type IconComponentType = React.ElementType<{ className?: string }>
export interface InteractiveMenuItem {
  label: string
  icon: IconComponentType
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[]
  accentColor?: string
  /** chamado ao clicar num item (além de marcar como ativo) */
  onItemClick?: (index: number, item: InteractiveMenuItem) => void
  /** índice ativo inicial */
  defaultIndex?: number
}

const defaultItems: InteractiveMenuItem[] = [
  { label: 'home', icon: Home },
  { label: 'strategy', icon: Briefcase },
  { label: 'period', icon: Calendar },
  { label: 'security', icon: Shield },
  { label: 'settings', icon: Settings },
]

const defaultAccentColor = 'var(--component-active-color-default)'

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ items, accentColor, onItemClick, defaultIndex = 0 }) => {
  const finalItems = useMemo(() => {
    const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 5
    if (!isValid) return defaultItems
    return items
  }, [items])

  const [activeIndex, setActiveIndex] = useState(defaultIndex)

  useEffect(() => {
    if (activeIndex >= finalItems.length) setActiveIndex(0)
  }, [finalItems, activeIndex])

  const textRefs = useRef<(HTMLElement | null)[]>([])
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex]
      const activeTextElement = textRefs.current[activeIndex]
      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`)
      }
    }
    setLineWidth()
    window.addEventListener('resize', setLineWidth)
    return () => window.removeEventListener('resize', setLineWidth)
  }, [activeIndex, finalItems])

  const handleItemClick = (index: number) => {
    setActiveIndex(index)
    onItemClick?.(index, finalItems[index])
  }

  const navStyle = useMemo(() => {
    const activeColor = accentColor || defaultAccentColor
    return { '--component-active-color': activeColor } as React.CSSProperties
  }, [accentColor])

  return (
    // O estilo vive aqui: a folha de CSS que acompanhava o componente original
    // nunca entrou no projeto, e sem ela os itens saíam empilhados e sem fundo.
    <nav
      className="menu flex items-stretch gap-0.5 rounded-2xl border border-white/10 bg-black/75 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      role="navigation"
      style={navStyle}
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex
        const IconComponent = item.icon
        return (
          <button
            key={item.label}
            className={`menu__item flex min-h-[48px] min-w-[54px] flex-col items-center justify-center gap-1 rounded-xl px-2 transition-colors ${isActive ? 'active bg-white/10 text-[color:var(--component-active-color)]' : 'text-white/60'}`}
            onClick={() => handleItemClick(index)}
            ref={(el) => { itemRefs.current[index] = el }}
            style={{ '--lineWidth': '0px' } as React.CSSProperties}
          >
            <div className="menu__icon">
              <IconComponent className="icon h-5 w-5" />
            </div>
            <strong
              className={`menu__text relative whitespace-nowrap text-[10px] font-semibold leading-none tracking-wide ${isActive ? "active after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-[var(--lineWidth)] after:rounded-full after:bg-[color:var(--component-active-color)] after:content-['']" : ''}`}
              ref={(el) => { textRefs.current[index] = el }}
            >
              {item.label}
            </strong>
          </button>
        )
      })}
    </nav>
  )
}

export { InteractiveMenu }
