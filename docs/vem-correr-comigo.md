# Vem Correr Comigo (Dexcomplica Love Run)

Comunidade de quem está inscrito no Love Run (07/11/2026): encontrar companhia e formar duplas, trios e quartetos.

Rota: `/dexcomplica/vem-correr-comigo` (links: `/p/<codigo>` e `/g/<codigo>`). Chamada na LP: seção `#vem-correr-comigo`.

## Estado atual

Registro feito para não depender do histórico do chat. Atualizar a cada etapa.

- Branch `feat/vem-correr-comigo`, no worktree `NOVO-SITE-SOMMA-V3-dex`.
- **Nada em produção.** Migration e deploy dependem de autorização explícita do Alex.
- Acesso: **só CPF**, sem código por e-mail, por decisão do Alex em 06/11/2026. Alternativa oferecida e não escolhida: CPF + e-mail da inscrição, sem envio de código.

## Como funciona

- **Acesso:** `POST /api/dexcomplica-love-run/corre/acesso` confere o CPF e grava um cookie httpOnly assinado, de 5 dias, com a vaga e a pessoa.
- **Transferência:** troca o titular na mesma linha de `evento_participantes`, por isso o par vaga + pessoa. Quem transferiu perde a sessão e o perfil sozinho, em `dex_corre__limpar`.
- **Banco:** só tabelas `dex_corre_*`, sem trigger nem alteração em tabela existente. Toda leitura e escrita passa por funções. RLS ligada sem política e `REVOKE` para anon e authenticated: só a service role, no servidor, acessa.
- **Grupos:** capacidade = menor preferência entre os integrantes. Limite de 2 homens e 2 mulheres e paridade do quarteto em `dex_corre_config`. Advisory lock por evento em toda escrita, mais índice único de um vínculo ativo por pessoa.
- **Gênero:** vem de `metadata.sexo` ou `cadastro_site.sexo`. Só é perguntado se faltar, e não aparece para outras pessoas.
- **Fotos:** bucket privado `dex-corre-fotos`, recorte no aparelho, servidas por `/corre/foto/<codigo>` só com sessão.
- **Atualização:** consulta a cada 20 s. Sem Realtime porque as tabelas são fechadas para o navegador.
- **Métricas:** `select public.dex_corre_metricas('dexcomplica-love-run')`.

## Rodar localmente, sem tocar em produção

```bash
npm i --no-save @electric-sql/pglite
scripts/dex-corre-local/iniciar.sh      # http://localhost:3108/dexcomplica/vem-correr-comigo
```

Banco em memória com a migration real e inscritos fictícios, listados em `http://localhost:54399/inscritos`. Qualquer CPF válido vira inscrito de teste em memória, só nesse banco. Não envia e-mail.

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

- 06/11 18h23: inspeção. 699 inscritos, todos com e-mail, sem CPF duplicado, 17 e-mails repetidos, percursos 4/6/8 km, sexo preenchido para todos.
- 06/11 18h50: migration, API, telas e testes. Fluxo completo aprovado em tamanho de celular.
- 06/11 19h00: local aceita qualquer CPF válido como inscrito de teste (só no banco de mentira).
- 06/11 18h52: verificação por e-mail removida a pedido do Alex; acesso só com CPF. Banco 107/107, navegador 33/33.
