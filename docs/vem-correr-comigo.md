# Vem Correr Comigo (Dexcomplica Love Run)

Comunidade de quem está inscrito no Love Run (07/11/2026): encontrar companhia e formar duplas, trios e quartetos.

Rota: `/dexcomplica/vem-correr-comigo` (links: `/p/<codigo>` e `/g/<codigo>`). Chamada na LP: seção `#vem-correr-comigo`.

## Estado atual

Registro feito para não depender do histórico do chat. Atualizar a cada etapa.

- Branch `feat/vem-correr-comigo`, no worktree `NOVO-SITE-SOMMA-V3-dex`.
- **Nada em produção.** Migration e deploy dependem de autorização explícita do Alex.
- Acesso: **só CPF**, sem código por e-mail, por decisão do Alex em 06/11/2026. Alternativa oferecida e não escolhida: CPF + e-mail da inscrição, sem envio de código.

## Como funciona

- **Acesso:** `POST /api/dexcomplica-love-run/corre/acesso` confere o CPF (inscrito no Love Run **ou** Insider ativo em `dados_insiders`) e grava um cookie httpOnly assinado, de 5 dias, com a vaga e a pessoa. Insider sem inscrição ganha uma vaga provisionada no evento (`metadata.origem = insider`).
- **Transferência:** troca o titular na mesma linha de `evento_participantes`, por isso o par vaga + pessoa. Quem transferiu perde a sessão e o perfil sozinho, em `dex_corre__limpar`.
- **Banco:** só tabelas `dex_corre_*`, sem trigger nem alteração em tabela existente. Toda leitura e escrita passa por funções. RLS ligada sem política e `REVOKE` para anon e authenticated: só a service role, no servidor, acessa.
- **Grupos:** capacidade = menor preferência entre os integrantes. Limite de 2 homens e 2 mulheres e paridade do quarteto em `dex_corre_config`. Advisory lock por evento em toda escrita, mais índice único de um vínculo ativo por pessoa.
- **Gênero:** vem de `metadata.sexo` ou `cadastro_site.sexo`. Só é perguntado se faltar, e não aparece para outras pessoas.
- **Fotos:** obrigatórias (faz parte da brincadeira). Bucket privado `dex-corre-fotos`, recorte no aparelho, servidas por `/corre/foto/<codigo>` só com sessão. Sem foto o perfil não entra na vitrine nem conecta.
- **Grupos abertos:** quem está fora pode abrir dupla/trio/quarteto e ver os membros.
- **Chat público:** cada grupo tem bate-papo aberto à comunidade (`dex_corre_mensagens` / `dex_corre_reacoes`): enviar, editar, apagar e reagir com emoji. Atualiza por consulta curta.
- **Comentários do Correio:** anônimos para quem lê; a API devolve só a inicial. O autor fica guardado para a organização agir em caso de denúncia.
- **Atualização:** consulta a cada 20 s (chat a cada 4 s com o painel aberto). Sem Realtime porque as tabelas são fechadas para o navegador.
- **Métricas:** `select public.dex_corre_metricas('dexcomplica-love-run')`.
- **Visual:** fundo branco na página da comunidade.

## Rodar localmente, sem tocar em produção

```bash
npm i --no-save @electric-sql/pglite
scripts/dex-corre-local/iniciar.sh      # http://localhost:3108/dexcomplica/vem-correr-comigo
```

Banco local em disco (`scripts/dex-corre-local/.dados` e `.arquivos`): perfil, grupos, chat e fotos sobrevivem a sair/entrar e a reiniciar o `iniciar.sh`. Migration real e inscritos fictícios em `http://localhost:54399/inscritos`. Qualquer CPF válido vira inscrito de teste, só nesse banco. Não envia e-mail.

## Testes

```bash
node scripts/dex-corre-banco.test.cjs   # regras no Postgres (PGlite)
```

O PGlite tem uma conexão só: a corrida pela última vaga foi testada em sequência, e a trava conferida no código. Disputa real entre conexões só em Postgres de servidor.

## Publicar (depois de autorizado)

Ordem obrigatória: migration antes do código.

```bash
supabase db query --linked -f supabase/migrations/20261106190000_dex_corre_comunidade.sql
supabase migration repair --status applied 20261106190000
```

Depois, PR + merge na `main`. Nenhuma variável de ambiente nova. Upstash recomendado para o limite de tentativas valer entre instâncias.

## Registro

- 06/11 20h30: comentários anônimos no Correio Elegante (migration 20261106233000): só a inicial do nome sai do banco; denúncia, apagar (autor do comentário, autor do recado, Insider) e limite de 20 por hora. Banco 187/187, navegador 13/13, build aprovado.
- 06/11 19h45: cópia congelada na branch deploy/vem-correr-comigo; entrada de Insider corrigida para o esquema real; banco 157/157, build e teste do build aprovados. Migrations bloqueadas para o agente: rodar scripts/dex-corre-aplicar-migrations.sh. Merge só depois.
- 06/11: Alex reconfirmou o acesso só com CPF ("logar com CPF e já entrar"). Falta só a autorização para migration e deploy.
- 06/11 19h05: build de produção passou (compilação, tipos, 91 páginas), numa cópia com fontes simuladas: o carregador de fontes do Next falha neste computador, em layout do admin sem relação com esta página. A Vercel publicou a main normalmente no mesmo dia.
- 06/11 18h23: inspeção. 699 inscritos, todos com e-mail, sem CPF duplicado, 17 e-mails repetidos, percursos 4/6/8 km, sexo preenchido para todos.
- 06/11 18h50: migration, API, telas e testes. Fluxo completo aprovado em tamanho de celular.
- 06/11 19h00: local aceita qualquer CPF válido como inscrito de teste (só no banco de mentira).
- 06/11 18h52: verificação por e-mail removida a pedido do Alex; acesso só com CPF. Banco 107/107, navegador 33/33.
- 06/11 19h10: fundo branco; foto obrigatória; abrir grupo para ver membros; chat público por grupo (enviar/editar/apagar/reagir).
- 06/11 19h25: Insiders ativos (`dados_insiders`) também entram com CPF; vaga provisionada no Love Run na primeira entrada.

## 06/11/2026: distância liberada

A pedido do Alex, qualquer inscrito pode correr com qualquer outro, seja qual for o KM. Migration `20261106235000_dex_corre_sem_distancia.sql`.

- Saiu o bloqueio em `dex_corre_interesse`, `dex_corre__responder` e na vitrine. A ação `distancia` deixou de existir.
- `dex_corre__limpar` não tira mais ninguém do grupo por diferença de pelotão, inclusive quando a gestão troca o pelotão de alguém.
- Cada pessoa continua com o pelotão da própria inscrição. `dex_corre_grupos.pelotao` ficou só como registro de quem formou o grupo.
- O cartão do grupo mostra as distâncias dos membros ("4 e 8 km") e o painel do grupo mostra o KM de cada pessoa. O filtro acha o grupo por qualquer membro.
- A vitrine mostra primeiro quem dá para chamar e, dentro disso, quem corre a mesma distância.
- A regra de composição por gênero e o tamanho do grupo não mudaram.

## 07/11/2026: fechado

O Love Run aconteceu e o Alex mandou fechar as páginas abaixo de /dexcomplica. O Vem Correr Comigo, o ingresso, a transferência e a agenda redirecionam para a LP, e as APIs desses fluxos também (next.config.mjs). A LP continua no ar, com a mensagem "O Love Run já aconteceu" e sem os atalhos de ingresso e agenda (`EVENTO_REALIZADO` em lib/dexcomplica-love-run/event.config.ts). O banco não foi alterado.
