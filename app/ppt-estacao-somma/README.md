# Estação SOMMA · apresentação executiva (SOMMA Club + Evolve)

Rota: `/ppt-estacao-somma` (protegida por código de 6 dígitos, igual aos outros decks).

- Código padrão: `101010`. Troque com `PPT_ESTACAO_SOMMA_CODE` (e, se quiser, `PPT_ESTACAO_SOMMA_SECRET`).
- Navegação: scroll, setas, PageUp/PageDown, Home/End. Animações de entrada com GSAP + ScrollTrigger.
- `/ppt-estacao-somma/app`: a mesma experiência em tela cheia para o telefone de quem assiste, aberta pelo QR do
  slide 16 (o QR só aparece no desktop). Não passa pelo código de acesso. Em desenvolvimento o QR aponta para o host
  da requisição (abra o deck pelo IP da máquina para testar no celular); `?qr=prod` ou `ESTACAO_SOMMA_APP_URL`
  forçam a URL de produção.
- Slide 16 (Camada digital) tem um protótipo navegável do app (`_app.tsx`): onboarding com escolha de perfil, agenda com
  reservas, check in, carteira/recovery e pedido no café. Botão REINICIAR volta ao onboarding. Sem preços: onde o
  app real teria valores, entra o benefício em texto.
- Slide 06 (Localização): sobrevoo em tiles 3D com HUD de drone (REC, tempo, lat/lng, altitude, rumo lidos da câmera);
  no fallback estático o sobrevoo é simulado com movimento da imagem e telemetria animada.
- PDF 16:9: `node scripts/export-estacao-somma-pdf.mjs` (precisa de `playwright` e `pdf-lib`, como o export do Silver Care).

## Imagens

- Espaço Cerrado hoje e o gramado do entorno: exportados de `Apresentacao-Evolve/Projeto Estação Somma Club`
  para `public/estacao-somma/espaco-cerrado-*.jpg` e `entorno-*.jpg` (slide 05).
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
  (`CREDITOS`).
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
