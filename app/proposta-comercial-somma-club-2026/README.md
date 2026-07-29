# Apresentação Comercial Somma Club 2026

Apresentação comercial digital, interativa e responsiva do **Somma Club** — comunidade, experiência e mídia para marcas do universo wellness.

Rota pública: **`/proposta-comercial-somma-club-2026`** → `https://sommaclub.com.br/proposta-comercial-somma-club-2026`

Faz parte do projeto Next.js `novo-site-somma-v3` (mesmo repositório que serve `sommaclub.com.br`).

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 3 (identidade em variáveis CSS)
- Framer Motion (transições, modais, acordeões, reveals)
- Lucide Icons
- Sem banco de dados nesta versão

> Recharts não foi adicionado: os únicos gráficos necessários (distribuição 70/30 e barras de formatos) são feitos em SVG/CSS leves, sem dependência extra. Se quiser gráficos mais ricos no futuro, `npm i recharts` e substitua os componentes `DonutSplit`/barras em `_components/sections/Reach.tsx`.

## Estrutura

```
app/proposta-comercial-somma-club-2026/
  layout.tsx            SEO / Open Graph / favicon
  page.tsx              server → renderiza <Presentation/>
  _data/                PAINEL DE CONFIGURAÇÃO (edite aqui)
    config.ts           contatos, WhatsApp, e-mail, URL, período, regras, brl()
    sommaMetrics.ts     números, impacto digital, formatos, base, presença, ecossistema, entregas, processo
    commercialPackages.ts  todas as 16 oportunidades (cotas) — fonte única
    sponsorshipPackages.ts patrocínios recorrentes (com totais)
    presentationSections.ts capítulos da navegação, pilares e campos do formulário
  _types/commercial.ts  tipos
  _components/          UI + seções + interações
    sections/           as 24 seções de conteúdo
```

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:3000/proposta-comercial-somma-club-2026
npm run build
npm run lint
```

## Publicar na Vercel

O domínio `sommaclub.com.br` é servido pelo projeto Vercel **novo-site-somma-v3** com deploy automático no push para a branch `main`:

```bash
git add app/proposta-comercial-somma-club-2026 app/globals.css
git commit -m "feat: apresentação comercial Somma Club 2026"
git push origin HEAD:main
```

Não use `vercel deploy --prod` (o `.vercel/project.json` aponta para outro projeto).

## Como o time comercial edita (sem tocar em componentes)

- **Valores, textos, entregas, duração das cotas** → `_data/commercialPackages.ts`
- **Métricas e números** → `_data/sommaMetrics.ts`
- **WhatsApp, e-mail, URL, período dos dados, regras** → `_data/config.ts`
- **Planos de patrocínio** → `_data/sponsorshipPackages.ts`
- **Cores da marca** → variáveis `--somma-*` em `app/globals.css` (bloco `.pcs-root`)

Todos os valores usam o formato brasileiro (`brl()` em `_data/config.ts`) e são apresentados como "a partir de".

## Interatividade

- Navegação por capítulos (topo) + barra de progresso + navegação por teclado (setas, PageUp/Down, Home/End)
- Modo tela cheia e botão "copiar link"
- Filtro de oportunidades por categoria
- Modal de detalhes (bottom-sheet no mobile) para cada cota
- Comparador de até 3 cotas lado a lado
- Simulador comercial (estimativa inicial pelos valores mínimos)
- Formulário comercial (valida e confirma no cliente; ver abaixo)

## Observações desta versão / o que ainda precisa

- **Formulário**: nesta primeira versão ele apenas **valida os campos e exibe uma confirmação** — não envia para nenhum destino. O objeto de dados já é montado em `ProposalForm.tsx` (`_proposta`), pronto para integração futura (e-mail, CRM ou WhatsApp).
- **Imagens**: a apresentação reaproveita as fotos do mídia kit em `public/midiakit/` (hero, comunidade, crowd, Somma Day, eixão). **Substituir por arte definitiva quando disponível**, principalmente:
  - `public/midiakit/capa.jpg` — hero e imagem de compartilhamento (Open Graph)
  - imagem OG dedicada 1200×630 (hoje aponta para a `capa.jpg`) em `layout.tsx` → `OG_IMAGE`
- **Contatos**: confirmar WhatsApp/e-mail em `_data/config.ts` (hoje: `5561995372477` / `comercial@sommaclub.com.br`).
- **Métricas**: números conforme o período **28/06–27/07/2026**; atualizar em `_data/sommaMetrics.ts` a cada novo período.
