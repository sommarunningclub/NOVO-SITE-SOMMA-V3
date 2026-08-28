# Estação SOMMA · versão 2 · apresentação executiva (SOMMA Club + Evolve + Bugu)

Rota: `/ppt-estacao-somma-2` (protegida por código de 6 dígitos, igual aos outros decks).

Cópia do deck `/ppt-estacao-somma` atualizada para o **novo local**, definido depois da conversa com a Evolve e
das propostas do Adriano. O deck original continua no ar, intacto, com o Espaço Cerrado.

## O que mudou em relação ao deck 1

- **O local.** Saiu o Espaço Cerrado (quiosque, ~1 km ao norte) e entrou o complexo já construído na SRPS
  Estacionamento 10, registrado no Google Places como `#VEMPROPLAY` (`-15.8024, -47.9075`, plus code `53XV+24`).
  Fica a 260 m do ponto onde o SOMMA já se encontra todo fim de semana, e não a um quilômetro dele: por isso o
  slide `nova-casa` deixou de dizer que o point "muda de endereço" e passou a dizer que ele "ganha um endereço".
- **Slide `espaco`** reescrito: o argumento agora é que não é um terreno, é uma estrutura pronta.
- **Slide `espaco-ativos`** (novo): o que já está de pé — galpão coberto, palco, praça de alimentação, portaria,
  pátio aberto e beira do lago. A conversa deixa de ser sobre construir e passa a ser sobre adequar.
- **Slide `alinhamento`** (novo, antes dos próximos passos): SOMMA, Evolve e Bugu na mesma mesa. O que cada parte
  traz, o que cada parte ainda precisa dizer e a pauta em aberto (administração, limpeza, custos, investimento,
  receita, exclusividade, nome, governança, saída). Nada ali está decidido, e o slide diz isso.
- **Estudos conceituais** (slides `conceito` e `visao`) continuam, mas legendados como referência de linguagem
  desenhada antes da definição do novo espaço — eles foram feitos para o quiosque antigo.

## Acesso

- Código de acesso: `PPT_ESTACAO_SOMMA_2_CODE`, com queda para `PPT_ESTACAO_SOMMA_CODE` quando a primeira não
  existe. Sem nenhuma das duas o deck não abre — diferente dos outros decks, aqui não existe código padrão no fonte,
  e nenhum código fica versionado. A trava vem de `lib/ppt/auth.ts`, módulo novo que os outros decks ainda não usam.
  O cookie é assinado com o segredo de sessão da aplicação e é independente do cookie do deck 1: quem abriu um ainda
  precisa do código para abrir o outro.
- Navegação: scroll, setas, PageUp/PageDown, Home/End. Animações de entrada com GSAP + ScrollTrigger.
- `/ppt-estacao-somma-2/app`: a mesma experiência em tela cheia para o telefone de quem assiste, aberta pelo QR do
  slide 16 (o QR só aparece no desktop). Não passa pelo código de acesso. Em desenvolvimento o QR aponta para o host
  da requisição (abra o deck pelo IP da máquina para testar no celular); `?qr=prod` ou `ESTACAO_SOMMA_APP_URL`
  forçam a URL de produção.
- Slide 16 (Camada digital) tem um protótipo navegável do app (`_app.tsx`): onboarding com escolha de perfil, agenda com
  reservas, check in, carteira/recovery e pedido no café. Botão REINICIAR volta ao onboarding. Sem preços: onde o
  app real teria valores, entra o benefício em texto.
- Slide Localização: sobrevoo em tiles 3D com HUD de drone (REC, tempo, lat/lng, altitude, rumo lidos da câmera);
  no fallback estático o sobrevoo é simulado com movimento da imagem e telemetria animada.
- PDF 16:9: `node scripts/export-estacao-somma-pdf.mjs` (precisa de `playwright` e `pdf-lib`) — o script aponta
  para `/ppt-estacao-somma`; para exportar esta versão é preciso ajustar a rota nele.

## Imagens

- O novo espaço: fotografias de agosto de 2026 em `Apresentacao-Evolve/Novos-Espaço-Estacao-2026`, convertidas de
  HEIC com `sips` (o `sharp` deste projeto não lê HEIC) e reduzidas para 1920 px em
  `public/estacao-somma/novo-espaco/`. Usadas nos slides `espaco` e `espaco-ativos`. A seleção evita os
  registros com material de campanha eleitoral, que aparece em boa parte das fotos do interior.
- As capturas de tela do Google Maps (`visao-mapa-cima-*.png`) serviram só para localizar o espaço: não entram no
  deck, porque trazem a interface e os marcadores do Google por cima. A vista aérea do slide de localização vem do
  próprio Google Maps 3D, em tempo real.
- Referências em vídeo (slide 03 · O movimento já existe): clipes públicos de Casa Marun by New Balance, Quiosque
  Smart Fit e The Simple Run Club, reencodados sem áudio em 540p e cortados para loop (`public/estacao-somma/videos/`,
  fonte em `Projeto Estação Somma Club/render/*.mp4`). Logos em `public/estacao-somma/logos/` (New Balance e Smart Fit
  do Wikimedia Commons, Marun e The Simple Run Club dos sites oficiais; a Smart Fit entrou na versão branca para fundo
  escuro). Os números do slide 04 (O que os dados dizem) estão em `_dados.ts` (`DADOS`) com a fonte de cada um.
- Estudos conceituais da Estação (`Projeto Estação Somma Club/render/render1.png`): a prancha foi separada em
  `render-estudo-a.jpg` (revitalização da estrutura existente, slide 08) e `render-estudo-b.jpg` (módulos com deck e
  terraço, slide 25). Legendadas como imagem de referência, não projeto executivo.
- Unidades Evolve: `Apresentacao-Evolve/Imagens-Evolve` copiada para `public/estacao-somma/evolve/` (capa, papel da
  Evolve, Performance, café, benefícios e Evolve+). São 960 px de largura: para as sangrias em 1920 px, vale pedir
  originais em resolução maior.
- Satélite (slide 06): tiles 3D fotorrealistas do Google (`maps3d`) com voo do Parque até o quiosque; sem WebGL
  ou sem permissão na chave, cai para a imagem estática de satélite no mesmo ponto. Usa
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

## Imagens opcionais (renders)

Renders arquitetônicos ainda não existem no projeto, então o deck usa fotografias reais do acervo SOMMA e
pranchas "em desenvolvimento" nesses lugares.

Para incluir uma imagem, basta salvar o arquivo em `public/estacao-somma/` com o nome abaixo. A página verifica
os arquivos a cada acesso, sem mexer em código.

| Arquivo                  | Slide                      | Enquanto não existe                         |
| ------------------------ | -------------------------- | ------------------------------------------- |
| `render-capa.jpg`        | 01 Capa                    | Foto da unidade Evolve Noroeste             |
| `parque-1.jpg`           | 02 Oportunidade            | Foto real do SOMMA no Parque                |
| `parque-2.jpg`           | 02 Oportunidade            | Foto real de corrida                        |
| `render-conceito.jpg`    | 08 O conceito              | Estudo conceitual A (render1)               |
| `render-performance.jpg` | 12 Evolve Performance      | Foto real da área funcional Evolve          |
| `render-recovery.jpg`    | 13 Recovery by Evolve      | Prancha reservada                           |
| `render-cafe.jpg`        | 18 O café                  | Quadro tipográfico do cardápio (sem imagem) |
| `render-visao.jpg`       | 25 Visão                   | Estudo conceitual B (render1)               |
| `render-encerramento.jpg`| 28 Encerramento            | Foto real do SOMMA no Parque                |

Formato sugerido: JPG, 16:9 para os renders de fundo (mínimo 1920 px de largura).

## Monetização e parceiros (slides 12 a 21)

- Academia Evolve (12): academia outdoor, alongamento, maquinário prático, esteira de teste/aquecimento e ponto de
  venda de planos. Conteúdo em `ACADEMIA_EVOLVE`.
- Recovery by Evolve+ (13): o Evolve+ assina o recovery; até 3 vouchers grátis por mês e depois crédito com
  desconto; aluno paga tarifa de aluno; público paga integral (`RECOVERY_MODELO`). Referência de mercado citada:
  Pass da The Simple Gym (R$ 67 membro / R$ 97 não membro, site em ago. 2026).
- Créditos avulsos (15): recovery, lockers e quadra desenhados; ducha, clínicas, eventos e loja como sugestão
  (`CREDITOS`). O slide traz um simulador de compra em loop (`_simulador.tsx`), na linha do Pass da The Simple Gym:
  alterna vínculo (Evolve+, aluno, SOMMA, não membro) e área sozinho; um toque pausa e deixa explorar. Valores
  ilustrativos, marcados no próprio cartão.
- App Estação SOMMA powered by Evolve (17): check in do corre de sábado, agenda, créditos, eventos e novidades das
  unidades; referência Na Praia + Mané Mercado.
- Bugu Delícias Caseiras (20): parceiro proposto para o café. Fotos e logo extraídas de bugudelicias.com.br
  (`public/estacao-somma/bugu/`, `logos/bugu-*.png`).
- Evolve+ (23): vouchers, espaço premium e ponte com a assessoria (1º mês grátis para Evolve+, condições por plano
  em `ASSESSORIA_CONDICOES`).

## Logos

`public/estacao-somma/` guarda as marcas oficiais vindas de `Apresentacao-Evolve`, sem redesenho ou recoloração:
`somma-branco-laranja.svg` e `evolve-branco.png` para fundo escuro; `somma-preto-laranja.png` e
`evolve-preto-vermelho.png` para fundo claro. Só as margens transparentes da Evolve foram aparadas para alinhar. As marcas Evolve+ oficiais (horizontal e símbolo, branca e preta) estão em `evolve-plus-*.png`, vindas da mesma pasta.
