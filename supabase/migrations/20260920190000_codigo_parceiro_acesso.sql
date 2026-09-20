-- Fecha a leitura anônima dos códigos de acesso do parceiro.
--
-- A policy `Allow reading active codes` valia para PUBLIC, ou seja: qualquer um
-- com a chave anônima — que é pública, vai no HTML do site — conseguia listar
-- todos os códigos ativos direto na API do Supabase. Uma trava cujo segredo o
-- visitante baixa junto com a página não tranca nada.
--
-- A validação de /parceiro-somma-club passou a ser server-side, com a service
-- role (lib/parceiro/auth.ts), que ignora RLS. Então a policy anônima não é
-- mais necessária para o site funcionar.
--
-- O que fica no lugar: leitura para `authenticated`, preservando quem
-- administra os códigos logado no painel. Anônimo não lê mais nada.

drop policy if exists "Allow reading active codes" on public.codigo_parceiro;

create policy "Códigos ativos visíveis para autenticados"
  on public.codigo_parceiro
  for select
  to authenticated
  using (ativo = true);
