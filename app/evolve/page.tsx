"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, MapPin, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from "lucide-react"

type Unit = {
  nome: string
  link: string
}

type StateData = {
  estado: string
  cidades: Unit[]
}

const data: StateData[] = [
  {
    estado: "Distrito Federal",
    cidades: [
      { nome: "Arniqueira", link: "https://checkout.academiaevolve.com.br/evolveacademia/29/site/landing-page/checkout/1375/0/SOMMAMEMBROS" },
      { nome: "Asa Norte", link: "https://checkout.academiaevolve.com.br/evolveacademia/24/site/landing-page/checkout/686/0/SOMMAMEMBROS" },
      { nome: "Asa Sul", link: "https://checkout.academiaevolve.com.br/evolveacademia/25/site/landing-page/checkout/99/0/SOMMAMEMBROS" },
      { nome: "Águas Claras", link: "https://checkout.academiaevolve.com.br/evolveacademia/14/site/landing-page/checkout/121/0/SOMMAMEMBROS" },
      { nome: "Águas Claras II", link: "https://checkout.academiaevolve.com.br/evolveacademia/21/site/landing-page/checkout/540/0/SOMMAMEMBROS" },
      { nome: "Brasil 21", link: "https://checkout.academiaevolve.com.br/evolveacademia/1/site/landing-page/checkout/108/0/SOMMAMEMBROS" },
      { nome: "Ceilândia", link: "https://checkout.academiaevolve.com.br/evolveacademia/13/site/landing-page/checkout/120/0/SOMMAMEMBROS" },
      { nome: "Gama", link: "https://checkout.academiaevolve.com.br/evolveacademia/18/site/landing-page/checkout/125/0/SOMMAMEMBROS" },
      { nome: "Jardim Botânico", link: "https://checkout.academiaevolve.com.br/evolveacademia/32/site/landing-page/checkout/1419/0/SOMMAMEMBROS" },
      { nome: "Planaltina", link: "https://checkout.academiaevolve.com.br/evolveacademia/5/site/landing-page/checkout/112/0/SOMMAMEMBROS" },
      { nome: "Nucleo Bandeirante", link: "https://checkout.academiaevolve.com.br/evolveacademia/30/site/landing-page/checkout/1455/0/SOMMAMEMBROS" },
      { nome: "Ponte Alta", link: "https://checkout.academiaevolve.com.br/evolveacademia/27/site/landing-page/checkout/1359/0/SOMMAMEMBROS" },
      { nome: "Recanto das Emas", link: "https://checkout.academiaevolve.com.br/evolveacademia/17/site/landing-page/checkout/124/0/SOMMAMEMBROS" },
      { nome: "Samambaia", link: "https://checkout.academiaevolve.com.br/evolveacademia/12/site/landing-page/checkout/119/0/SOMMAMEMBROS" },
      { nome: "Santa Maria", link: "https://checkout.academiaevolve.com.br/evolveacademia/4/site/landing-page/checkout/111/0/SOMMAMEMBROS" },
      { nome: "Santa Maria II", link: "https://checkout.academiaevolve.com.br/evolveacademia/6/site/landing-page/checkout/113/0/SOMMAMEMBROS" },
      { nome: "Sobradinho", link: "https://checkout.academiaevolve.com.br/evolveacademia/8/site/landing-page/checkout/115/0/SOMMAMEMBROS" },
      { nome: "Sudoeste", link: "https://checkout.academiaevolve.com.br/evolveacademia/26/site/landing-page/checkout/1276/0/SOMMAMEMBROS" },
      { nome: "Taguatinga", link: "https://checkout.academiaevolve.com.br/evolveacademia/3/site/landing-page/checkout/110/0/SOMMAMEMBROS" },
      { nome: "Taguatinga II", link: "https://checkout.academiaevolve.com.br/evolveacademia/16/site/landing-page/checkout/123/0/SOMMAMEMBROS" },
      { nome: "Vicente Pires", link: "https://checkout.academiaevolve.com.br/evolveacademia/19/site/landing-page/checkout/126/0/SOMMAMEMBROS" },
    ],
  },
  {
    estado: "Goiás",
    cidades: [
      { nome: "Águas Lindas", link: "https://checkout.academiaevolve.com.br/evolveacademia/23/site/landing-page/checkout/99/0/SOMMAMEMBROS" },
      { nome: "Anápolis", link: "https://checkout.academiaevolve.com.br/evolveacademia/28/site/landing-page/checkout/1391/0/SOMMAMEMBROS" },
      { nome: "Catalão", link: "https://checkout.academiaevolve.com.br/evolveacademia/11/site/landing-page/checkout/118/0/SOMMAMEMBROS" },
      { nome: "Formosa", link: "https://checkout.academiaevolve.com.br/evolveacademia/7/site/landing-page/checkout/114/0/SOMMAMEMBROS" },
      { nome: "Goiânia", link: "https://checkout.academiaevolve.com.br/evolveacademia/15/site/landing-page/checkout/122/0/SOMMAMEMBROS" },
      { nome: "Jataí", link: "https://checkout.academiaevolve.com.br/evolveacademia/20/site/landing-page/checkout/127/0/SOMMAMEMBROS" },
      { nome: "Luziânia", link: "https://checkout.academiaevolve.com.br/evolveacademia/22/site/landing-page/checkout/54/0/SOMMAMEMBROS" },
      { nome: "Rio Verde", link: "https://checkout.academiaevolve.com.br/evolveacademia/10/site/landing-page/checkout/117/0/SOMMAMEMBROS" },
      { nome: "Valparaíso (Shopping Sul)", link: "https://checkout.academiaevolve.com.br/evolveacademia/2/site/landing-page/checkout/109/0/SOMMAMEMBROS" },
    ],
  },
  {
    estado: "Bahia",
    cidades: [
      { nome: "LEM", link: "https://checkout.academiaevolve.com.br/evolveacademia/9/site/landing-page/checkout/116/0/SOMMAMEMBROS" },
    ],
  },
]

// ─── CPF helpers ──────────────────────────────────────────────────────────────

function formatarCPF(value: string) {
  const n = value.replace(/\D/g, "").slice(0, 11)
  if (n.length <= 3) return n
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="w-full py-5 px-4 sm:px-6 border-b border-gray-100">
      <div className="max-w-2xl mx-auto flex items-center justify-center gap-4 sm:gap-8">
        <Image
          src="https://cdn.prod.website-files.com/618d15b3edde403578e4bf94/63824efaf12be120af8090f5_logo.png"
          alt="Academia Evolve"
          width={130}
          height={44}
          className="object-contain h-9 sm:h-12 w-auto"
          unoptimized
        />
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="w-5 sm:w-8 h-px bg-gray-300" />
          <span className="text-gray-400 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">x</span>
          <div className="w-5 sm:w-8 h-px bg-gray-300" />
        </div>
        <Image
          src="https://cdn.shopify.com/s/files/1/0788/1932/8253/files/02.2026_-_LOGOS_EM_VETOR_-_SOMMA.svg?v=1771962169"
          alt="Somma Running Club"
          width={130}
          height={44}
          className="object-contain h-9 sm:h-12 w-auto"
          unoptimized
        />
      </div>
    </header>
  )
}

// ─── Verificação de CPF ───────────────────────────────────────────────────────

function CPFVerification({ onVerified }: { onVerified: () => void }) {
  const [cpf, setCpf] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "notfound">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")

    try {
      const res = await fetch("/api/verify-cpf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf }),
      })
      const json = await res.json()

      if (json.found) {
        onVerified()
      } else {
        setStatus("notfound")
      }
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-black text-center mb-2 text-balance">
            Área exclusiva
          </h1>
          <p className="text-gray-500 text-center text-sm sm:text-base mb-8 text-balance">
            Digite seu CPF cadastrado no Somma Running Club para ter acesso ao benefício exclusivo com a Academia Evolve.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => {
                  setCpf(formatarCPF(e.target.value))
                  setStatus("idle")
                }}
                maxLength={14}
                className={`w-full px-5 py-4 text-lg font-bold border-2 rounded-2xl outline-none transition-all duration-200 bg-white
                  ${status === "notfound" || status === "error"
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-200 focus:border-black"
                  }
                `}
              />
            </div>

            {status === "notfound" && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">CPF não encontrado</p>
                  <p className="text-sm text-red-600 mt-0.5">
                    Acesse a{" "}
                    <a href="/" className="underline font-semibold hover:text-red-800 transition-colors">
                      página inicial
                    </a>
                    , preencha o formulário &quot;Faça parte do clube&quot; e aguarde a liberação.
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">Erro ao verificar. Tente novamente.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={cpf.replace(/\D/g, "").length < 11 || status === "loading"}
              className="w-full flex items-center justify-center gap-3 py-4 bg-black text-white font-bold text-lg rounded-2xl transition-all duration-200 hover:bg-gray-900 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/10"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Verificar acesso
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Seus dados são usados apenas para verificar o cadastro.
          </p>
        </div>
      </main>
    </div>
  )
}

// ─── Dropdown components ──────────────────────────────────────────────────────

function DropdownSelect({
  label,
  value,
  isOpen,
  onToggle,
  children,
  disabled,
}: {
  label: string
  value: string | null
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <div className="relative w-full">
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-5 py-4 sm:py-5 border-2 rounded-2xl bg-white transition-all duration-200 group
          ${disabled ? "opacity-40 cursor-not-allowed border-gray-200" : "cursor-pointer border-gray-200 hover:border-gray-400 active:scale-[0.99]"}
          ${isOpen ? "border-black shadow-md" : ""}
        `}
      >
        <span className={`text-lg sm:text-xl font-bold truncate pr-3 ${value ? "text-black" : "text-gray-400"}`}>
          {value ?? label}
        </span>
        <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200
          ${isOpen ? "bg-black" : "bg-black group-hover:bg-gray-800"}`}
        >
          {isOpen
            ? <ChevronUp className="text-white w-4 h-4 sm:w-5 sm:h-5" />
            : <ChevronDown className="text-white w-4 h-4 sm:w-5 sm:h-5" />
          }
        </span>
      </button>

      <div
        className={`mt-2 border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-lg transition-all duration-300 origin-top
          ${isOpen ? "opacity-100 scale-y-100 max-h-72" : "opacity-0 scale-y-95 max-h-0 pointer-events-none border-0 shadow-none"}
        `}
        style={{ overflowY: isOpen ? "auto" : "hidden" }}
      >
        {children}
      </div>
    </div>
  )
}

function DropdownItem({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`px-5 py-4 text-base sm:text-lg cursor-pointer flex items-center justify-between transition-all duration-150 border-b border-gray-50 last:border-0
        ${selected ? "bg-gray-50 text-gray-500 font-semibold" : "text-black hover:bg-gray-50 active:bg-gray-100"}
      `}
    >
      <span>{label}</span>
      {selected && (
        <span className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0">
          <ChevronDown className="text-white w-3.5 h-3.5" />
        </span>
      )}
    </div>
  )
}

// ─── Seletor de unidade ───────────────────────────────────────────────────────

function UnitSelector() {
  const [estadoAberto, setEstadoAberto] = useState(false)
  const [cidadeAberta, setCidadeAberta] = useState(false)
  const [estadoSelecionado, setEstadoSelecionado] = useState<StateData | null>(null)
  const [cidadeSelecionada, setCidadeSelecionada] = useState<Unit | null>(null)
  const [mostrarBotao, setMostrarBotao] = useState(false)

  useEffect(() => {
    if (cidadeSelecionada) {
      const t = setTimeout(() => setMostrarBotao(true), 50)
      return () => clearTimeout(t)
    } else {
      setMostrarBotao(false)
    }
  }, [cidadeSelecionada])

  function selecionarEstado(estado: StateData) {
    setEstadoSelecionado(estado)
    setCidadeSelecionada(null)
    setEstadoAberto(false)
    setCidadeAberta(false)
  }

  function selecionarCidade(cidade: Unit) {
    setCidadeSelecionada(cidade)
    setCidadeAberta(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-start py-8 sm:py-14 px-4">
        <div className="w-full max-w-lg">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black leading-tight mb-2 text-balance">
            Escolha sua unidade:
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mb-8 sm:mb-10 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            Selecione o estado e a cidade mais próxima de você
          </p>

          {/* Estado */}
          <div className="mb-3">
            <DropdownSelect
              label="Selecione o estado"
              value={estadoSelecionado?.estado ?? null}
              isOpen={estadoAberto}
              onToggle={() => { setEstadoAberto(!estadoAberto); setCidadeAberta(false) }}
            >
              <div
                onClick={() => { setEstadoSelecionado(null); setCidadeSelecionada(null); setEstadoAberto(false) }}
                className="px-5 py-4 text-gray-400 text-base sm:text-lg cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50"
              >
                Selecione
              </div>
              {data.map((item) => (
                <DropdownItem
                  key={item.estado}
                  label={item.estado}
                  selected={estadoSelecionado?.estado === item.estado}
                  onClick={() => selecionarEstado(item)}
                />
              ))}
            </DropdownSelect>
          </div>

          {/* Cidade */}
          <div className={`mb-6 transition-all duration-300 ${estadoSelecionado ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
            <DropdownSelect
              label="Selecione a cidade"
              value={cidadeSelecionada?.nome ?? null}
              isOpen={cidadeAberta}
              onToggle={() => { setCidadeAberta(!cidadeAberta); setEstadoAberto(false) }}
              disabled={!estadoSelecionado}
            >
              <div
                onClick={() => { setCidadeSelecionada(null); setCidadeAberta(false) }}
                className="px-5 py-4 text-gray-400 text-base sm:text-lg cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50"
              >
                Selecione
              </div>
              {estadoSelecionado?.cidades.map((cidade) => (
                <DropdownItem
                  key={cidade.nome}
                  label={cidade.nome}
                  selected={cidadeSelecionada?.nome === cidade.nome}
                  onClick={() => selecionarCidade(cidade)}
                />
              ))}
            </DropdownSelect>
          </div>

          {/* Botão matrícula */}
          <div className={`transition-all duration-300 ${mostrarBotao ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
            <a
              href={cidadeSelecionada?.link ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full py-4 sm:py-5 px-6 bg-black text-white text-lg sm:text-xl font-bold rounded-2xl hover:bg-gray-900 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-black/10 group"
            >
              <span>Matricule-se agora</span>
              <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ArrowRight className="w-5 h-5 text-white" />
              </span>
            </a>
            {cidadeSelecionada && (
              <p className="text-center text-gray-400 text-xs sm:text-sm mt-3">
                Unidade selecionada: <span className="font-semibold text-black">{cidadeSelecionada.nome}</span>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function EvolvePage() {
  const [verificado, setVerificado] = useState(false)

  if (!verificado) {
    return <CPFVerification onVerified={() => setVerificado(true)} />
  }

  return <UnitSelector />
}
