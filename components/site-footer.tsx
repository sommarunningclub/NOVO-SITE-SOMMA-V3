const LOGO_HORIZONTAL =
  'https://cdn.shopify.com/s/files/1/0788/1932/8253/files/HORIZONTAL_PRETA_LARANJA.png?v=1772322941'

export function SiteFooter() {
  return (
    <footer className="bg-background border-t border-orange-200">
      <div className="mx-auto max-w-7xl py-16 px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo and Social */}
          <div className="space-y-4">
            <img src={LOGO_HORIZONTAL} alt="SOMMA Logo" className="h-10 w-auto" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Junte-se ao SOMMA Running Club, o maior running club do Distrito Federal. Comunidade gratuita e
              democrática, com mais de 5 mil membros cadastrados. Encontros todo sábado às 7h no Parque da Cidade,
              em Brasília.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/somma.club/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-muted-foreground hover:text-orange-500 transition-colors duration-200 group"
                aria-label="Seguir SOMMA Running Club no Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" aria-hidden="true">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="https://www.strava.com/clubs/1608501?share_sig=D8C84ECD1759146345&_branch_match_id=1315308772546708809&_branch_referrer=H4sIAAAAAAAAA8soKSkottLXLy4pSixL1EcsKNDLzczL1jcxdsmPCgmrNA5Psq8rSk1LLSrKzEuPTyrKLy9OLbJ1zijKz00FAFnkwLM9AAAA"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-muted-foreground hover:text-orange-500 transition-colors duration-200 group"
                aria-label="Seguir SOMMA Running Club no Strava"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="226.172,26.001 90.149,288.345 170.29,288.345 226.172,184.036 281.605,288.345 361.116,288.345" fill="currentColor"></polygon>
                  <polygon points="361.116,288.345 321.675,367.586 281.605,288.345 220.871,288.345 321.675,485.999 421.851,288.345" fill="currentColor"></polygon>
                </svg>
              </a>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Contato</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="mailto:contato@sommaclub.com.br" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  contato@sommaclub.com.br
                </a>
              </li>
              <li>
                <a href="https://wa.me/5561995372477?text=Ol%C3%A1%2C%20tudo%20bem%3F%20Vim%20do%20Site%20do%20Somma%20e%20quero%20falar%20com%20o%20atendimento." target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +55 (61) 9537-2477
                </a>
              </li>
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
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
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Mais do Somma</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/seja-parceiro" className="text-muted-foreground hover:text-orange-500 transition-colors">Seja um Parceiro Somma Club</a></li>
              <li><a href="/evolve" className="text-muted-foreground hover:text-orange-500 transition-colors">Somma &amp; Evolve</a></li>
            </ul>
          </div>

          {/* Corporativo */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Corporativo</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://wa.me/5561995372477?text=Ol%C3%A1%2C%20tudo%20bem%3F%20Quero%20saber%20mais%20sobre%20como%20realizar%20um%20evento%20ou%20corrida%20com%20o%20Somma%20Club." target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-orange-500 transition-colors">Somma Eventos</a></li>
              <li><a href="https://wa.me/5561995372477?text=Ol%C3%A1%2C%20tudo%20bem%3F%20Quero%20saber%20mais%20como%20funciona%20a%20contrata%C3%A7%C3%A3o%20de%20m%C3%ADdia%20do%20Somma%20Club." target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-orange-500 transition-colors">Somma Mídia</a></li>
              <li><a href="https://wa.me/5561995372477?text=Ol%C3%A1%2C%20tudo%20bem%3F%20Quero%20saber%20mais%20sobre%20a%20Assessoria%20Somma%20Club" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-orange-500 transition-colors">Assessoria Somma Club</a></li>
              <li><a href="/insider-conect" className="text-muted-foreground hover:text-orange-500 transition-colors">Insider Conect</a></li>
              <li><a href="/seja-parceiro" className="text-muted-foreground hover:text-orange-500 transition-colors">Acesso Exclusivo Parceiro Somma</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-orange-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">© 2026 Somma Running Club. All rights reserved.</div>
              <div className="text-xs text-muted-foreground">CNPJ 61.315.987/0001-28</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
