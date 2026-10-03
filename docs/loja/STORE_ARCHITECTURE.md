# SOMMA Club Store · arquitetura

A loja vive em `sommaclub.com.br/loja`, dentro deste site (Next.js 15, App
Router). A Shopify é a única fonte de produto, variante, preço, estoque,
coleção, mídia, carrinho e checkout. Não há catálogo local nem banco próprio de
produto.

## Rotas

| Rota | O que é |
|---|---|
| `/loja` | home |
| `/loja/collections/[handle]` | coleção; se for de um drop, abre como campanha |
| `/loja/products/[handle]` | produto; esgotado vira peça de arquivo |
| `/loja/archive` | drops anteriores |
| `/loja/api/search` | busca enquanto digita (GET, sem cache) |

O link "Club" leva para `/`, o site do clube. Endereço desconhecido cai em
`[...rota]`, que mostra o 404 da loja.

## Pastas

```
app/loja/
  layout.tsx        fontes, header, rodapé, sacola, busca
  loja.css          sistema visual (ver DESIGN_SYSTEM.md)
  _motion.ts        gramática de movimento (ver MOTION_SYSTEM.md)
  _actions/         server actions: cart.ts, drop-access.ts
  _components/      interface; Page.tsx é a casca de toda página
  _lib/             format.ts (dinheiro, datas, estoque), analytics.ts
lib/shopify/
  config.ts         env, tempos de cache, tags
  client.ts         fetch da Storefront API (só servidor)
  fragments.ts      fragments GraphQL
  queries/          uma query por rota
  mutations/        carrinho
  mappers.ts        Storefront → tipos de domínio
  types.ts          tipos de domínio (o que as telas conhecem)
  handles.ts        handles e rotas pelo nome
  index.ts          API usada pelas telas
  preview.ts        prévia local (só dev)
```

As telas importam de `@/lib/shopify` (servidor) ou de `@/lib/shopify/types` e
`@/lib/shopify/handles` (cliente). Nenhum componente monta GraphQL.

## Ambiente

| Variável | Para quê |
|---|---|
| `SHOPIFY_STORE_DOMAIN` | `sfjsua-je.myshopify.com` |
| `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` | token privado do canal Headless; só servidor |
| `SHOPIFY_STOREFRONT_API_VERSION` | versão da API (padrão `2026-07`) |

O token privado nunca chega ao navegador: `lib/shopify/config.ts` e
`client.ts` importam `server-only`. A busca passa por `/loja/api/search`
justamente para isso.

Ao trocar a versão da API: `npx tsx scripts/loja-valida-queries.mts`.

## Prévia local

Sem token, `next dev` lê `.loja-preview/catalog.json`, uma foto do catálogo
real tirada pela Admin API (`scripts/loja-preview-snapshot.mjs`). O arquivo fica
fora do git e a prévia **não existe em produção**: loja sem token mostra a tela
de erro. A curadoria dentro do script (o que é drop, o que é arquivo, nomes
limpos) é a proposta de organização; na loja real ela vem da Shopify. O carrinho
da prévia vive na memória do processo e não tem checkout.

## Conteúdo editável na Shopify

Criado por `scripts/loja-shopify-setup.mjs` (só acrescenta; pode rodar de novo).

Metaobjetos (Conteúdo > Metaobjetos):

| Tipo | Papel |
|---|---|
| `somma_drop` | um lançamento: nome, código, texto, data, estado, coleção, foto de campanha |
| `somma_lookbook` | fotos do trilho horizontal e as peças que aparecem nelas |
| `somma_size_guide` | tabela de medidas (uma medida por linha, colunas com `;`) |
| `somma_editorial` | história com texto e fotos (ainda sem tela) |
| `somma_home` | conteúdo da home; uma entrada só, identificador `principal` |

Campos de produto (namespace `somma`): `drop`, `fit`, `model_height_cm`,
`model_weight_kg`, `model_size`, `story`, `badge`, `keep_in_archive`,
`size_guide`, `color_siblings`. A cor vem do campo padrão da Shopify
`shopify.color-pattern`.

Campo vazio em `somma_home` usa o padrão de `HOME_DEFAULTS` em
`lib/shopify/index.ts`. Os campos de foto do topo (`hero_media`,
`hero_media_mobile`) existem na Shopify mas não são lidos: a hero é a arte
tribal animada. Entrada de metaobjeto só aparece na loja com estado
**Ativo**.

Coleções e menu que o código espera (ver `lib/shopify/handles.ts`):

- coleção `todos`: tudo o que está à venda
- coleção `archive`: peças de arquivo
- menu `loja-categorias`: itens apontando para coleções; é o índice da home

## Cache

| O quê | Como |
|---|---|
| home, coleções, drops, conteúdo | 300s (`REVALIDATE.catalog`) |
| produto | 60s (`REVALIDATE.product`): estoque muda mais rápido |
| carrinho | nunca; é de um comprador só |
| busca | nunca |

As páginas não leem cookie no servidor, então continuam cacheáveis. A sacola é
carregada depois da hidratação, por server action. As tags (`TAGS` em
`config.ts`) já estão nas chamadas para um webhook da Shopify poder invalidar
por produto ou coleção no futuro.

## Carrinho e checkout

Carrinho da Shopify via Storefront API. O site guarda só o id, no cookie
httpOnly `somma_cart`, restrito a `/loja`, por 14 dias. As operações são
otimistas na tela e confirmadas pela resposta da Shopify; erro de estoque volta
como mensagem ao comprador. O checkout é o da Shopify, pela `checkoutUrl`.

Coleção: vem inteira (até 100 peças) e o filtro acontece no navegador, o que
permite a grade animada. Passando disso, o filtro vai para o servidor.

## Drop Access

Cadastro de e-mail em `loja_drop_access`, no Supabase da gestão
(`supabase/migrations/20261003190000_loja_drop_access.sql`). Só o servidor
grava; RLS ligado sem policy. O disparo sai pelo módulo de campanhas do admin.

## Analytics

`_lib/analytics.ts`, padrão GA4: `view_item_list`, `view_item`, `add_to_cart`,
`remove_from_cart`, `view_cart`, `begin_checkout`, `search`. Cada evento sai por
um caminho só (`gtag` quando existe, senão `dataLayer`), para não contar em
dobro. O container do GTM hoje não tem tag de e-commerce.

`purchase` não sai do site: a compra termina no checkout da Shopify. Para
medir, configurar o pixel do GA4 na própria Shopify.

## SEO

`generateMetadata` por rota, canonical, Open Graph, JSON-LD de `Product` e
`BreadcrumbList` montados só com dado real. **A loja está com `noindex`** em
`app/loja/layout.tsx` até o lançamento.

## Limite conhecido: status do 404

Página que não existe mostra o 404 da loja, mas a resposta HTTP sai como 200.
É o preço do `loading.tsx`: o Next começa a enviar a página antes de saber que
ela não existe. O Next marca essas respostas com `noindex`, então o Google não
indexa. Se um dia o status 404 real for exigência, o caminho é remover o
`loading.tsx`.

## Antes de lançar

A loja não sobe "para dentro" da Shopify: o código vai para o site (merge na
`main`, deploy da Vercel) e a Shopify guarda o que ele lê. Os passos, na ordem:

1. **Estrutura na Shopify.** Coleções `drop-001`, `todos`, `regatas`,
   `croppeds`, `camisetas`, `acessorios` e `archive`, o menu `loja-categorias`,
   o lookbook, o drop, a home e os campos `somma.*` das peças:

   ```
   node scripts/loja-shopify-catalogo.mjs            # mostra o plano
   node scripts/loja-shopify-catalogo.mjs --apply    # aplica
   ```

   Só acrescenta, e as coleções saem publicadas apenas no canal Headless. A
   organização (o que é drop, à venda e arquivo) mora em
   `scripts/loja-curadoria.mjs`, a mesma lista da prévia local.
2. **Nome, endereço e foto de capa das peças**: o mesmo script com
   `--renomear --capas --apply`. Mexe em produto que já existe (o nome aparece
   no PDV), por isso só roda com bandeira e com o OK de quem cuida da loja.
3. **Ativar as peças** e publicar só no canal Headless: `--ativar --apply`. O
   plano avisa as peças com estoque sem controle ou negativo.
4. **Token privado do canal Headless** nas variáveis da Vercel (e no
   `.env.local`, para testar com a Shopify de verdade antes do merge).
5. **Migration do Drop Access** aplicada no Supabase.
6. **Teste de compra** de ponta a ponta, com o checkout da Shopify.
7. **Merge do PR** e tirar o `noindex` de `app/loja/layout.tsx`.

Pendências que não travam o lançamento, mas precisam de dono:

- A vitrine antiga (`loja.sommaclub.com.br`, tema da Shopify) continua no ar.
  Depois do lançamento ela deve redirecionar para `/loja`.
- As coleções antigas `frontpage`, `todos-produtos` e `pdv` estão publicadas no
  canal Headless. Enquanto estiverem, abrem em `/loja/collections/<handle>`.
- Na taxonomia da Shopify o "Laranja" é `#FF8A00`, não o laranja da marca. É a
  cor que aparece no seletor de cores das peças.
