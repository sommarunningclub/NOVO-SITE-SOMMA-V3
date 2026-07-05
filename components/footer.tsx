import Image from "next/image";
import Link from "next/link";
import { Instagram, Mail, Phone, MapPin } from "lucide-react";
import { SOMMA } from "@/lib/somma-data";
import { StravaIcon } from "./icons/strava";
import { TikTokIcon } from "./icons/tiktok";

// Mensagens de WhatsApp (mesmas do site atual)
const WA = "https://wa.me/5561995372477?text=";
const WA_ATENDIMENTO = WA + encodeURIComponent("Olá, tudo bem? Vim do Site do Somma e quero falar com o atendimento.");
const WA_EVENTOS = WA + encodeURIComponent("Olá, tudo bem? Quero saber mais sobre como realizar um evento ou corrida com o Somma Club.");
const WA_MIDIA = WA + encodeURIComponent("Olá, tudo bem? Quero saber mais como funciona a contratação de mídia do Somma Club.");
const WA_ASSESSORIA = WA + encodeURIComponent("Olá, tudo bem? Quero saber mais sobre a Assessoria Somma Club");

export function Footer() {
  return (
    <footer className="bg-dark-bg pt-16 text-white">
      <div className="container-somma grid gap-10 pb-12 md:grid-cols-2 lg:grid-cols-4">
        {/* Logo + descrição + social */}
        <div className="space-y-4">
          <Link href="/" aria-label="SOMMA Club — início">
            <Image src="/logo-somma.svg" alt="SOMMA Club" width={150} height={40} className="h-9 w-auto" />
          </Link>
          <p className="max-w-xs text-sm text-white/60">
            Junte-se ao SOMMA Running Club, o maior running club do Distrito Federal. Comunidade gratuita e
            democrática, com mais de 5 mil membros cadastrados. Encontros todo sábado às 7h no Parque da Cidade,
            em Brasília.
          </p>
          <div className="flex gap-3">
            <a
              href={SOMMA.links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram do SOMMA Club"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-primary"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={SOMMA.links.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok do SOMMA Club"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-primary"
            >
              <TikTokIcon className="h-5 w-5" />
            </a>
            <a
              href={SOMMA.links.strava}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Strava do SOMMA Club"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-primary"
            >
              <StravaIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Contato */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/40">Contato</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>
              <a href="mailto:contato@sommaclub.com.br" className="flex items-center gap-2 hover:text-primary">
                <Mail className="h-4 w-4 shrink-0" /> contato@sommaclub.com.br
              </a>
            </li>
            <li>
              <a href={WA_ATENDIMENTO} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary">
                <Phone className="h-4 w-4 shrink-0" /> +55 (61) 9537-2477
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Srps 53WV+RX
                <br />
                Plano Piloto, Brasília - DF
                <br />
                70655-775
              </span>
            </li>
          </ul>
        </div>

        {/* Mais do Somma */}
        <nav aria-label="Mais do Somma">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/40">Mais do Somma</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            <li><a href="/seja-parceiro" className="hover:text-primary">Seja um Parceiro Somma Club</a></li>
            <li><a href="/evolve" className="hover:text-primary">Somma &amp; Evolve</a></li>
            <li><a href="/assessoria" className="hover:text-primary">Assessoria Somma Club</a></li>
            <li><a href={SOMMA.links.loja} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Loja Somma</a></li>
          </ul>
        </nav>

        {/* Corporativo */}
        <nav aria-label="Corporativo">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/40">Corporativo</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            <li><a href={WA_EVENTOS} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Somma Eventos</a></li>
            <li><a href={WA_MIDIA} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Somma Mídia</a></li>
            <li><a href={WA_ASSESSORIA} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Assessoria Somma Club</a></li>
            <li><a href="/insider-conect" className="hover:text-primary">Insider Conect</a></li>
            <li><a href="/parceiro-somma-club" className="hover:text-primary">Acesso Exclusivo Parceiro Somma</a></li>
            <li><a href="/politica-de-privacidade" className="hover:text-primary">Política de Privacidade</a></li>
          </ul>
        </nav>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 py-6">
        <div className="container-somma flex flex-col gap-1 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Somma Running Club. All rights reserved.</p>
          <p className="text-xs">CNPJ {SOMMA.cnpj}</p>
        </div>
      </div>
    </footer>
  );
}
