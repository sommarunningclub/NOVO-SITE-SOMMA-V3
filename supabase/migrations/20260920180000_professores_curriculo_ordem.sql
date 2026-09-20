-- Ordem de exibição dos professores no checkout.
--
-- Até aqui a lista saía sem `order by`: o Postgres devolvia na ordem que quisesse
-- e ela podia mudar sozinha entre um acesso e outro. A ordem é uma decisão
-- comercial, então vira dado — assim dá para remanejar sem novo deploy.
--
-- Quem entrar sem `ordem` cai no fim da lista, em ordem alfabética.

alter table public.professores_curriculo_assessoria
  add column if not exists ordem smallint;

comment on column public.professores_curriculo_assessoria.ordem is
  'Ordem de exibição no checkout (menor primeiro). Nulo vai para o fim, alfabético.';

update public.professores_curriculo_assessoria set ordem = 1 where nome = 'Alexandre Alves';
update public.professores_curriculo_assessoria set ordem = 2 where nome = 'Joseph Pereira';
update public.professores_curriculo_assessoria set ordem = 3 where nome = 'Gabriel Brito';
update public.professores_curriculo_assessoria set ordem = 4 where nome = 'Mateus Fonseca';
