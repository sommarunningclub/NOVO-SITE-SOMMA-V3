-- ─────────────────────────────────────────────────────────────────────────────
-- Dexcomplica Love Run (07/11/2026): a linha do evento e o teto de vagas.
--
-- 1. `eventos.capacidade`: teto de inscrições aceitas pela LP. Quem aplica é a
--    função `inscrever_no_evento`, sob advisory lock (o site passa este valor
--    em `p_capacidade`). null = sem teto; a LP do Love Run só abre inscrição
--    com o teto preenchido. A gestão edita no módulo Eventos.
--
-- 2. A linha do evento, com o mesmo slug da LP. É ela que o /check-in público
--    lista (o card leva para `lp_url`), que a gestão abre e fecha e que recebe
--    as inscrições em `evento_participantes` + `checkins`.
--
--    Entra FECHADA e SEM PELOTÕES de propósito: horário, pelotões e vagas
--    ainda não foram confirmados. Para abrir as inscrições, na gestão:
--      Eventos → Dexcomplica Love Run → pelotões + vagas + status "aberto".
--
-- Idempotente: pode reexecutar.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.eventos
  add column if not exists capacidade integer;

do $$ begin
  alter table public.eventos
    add constraint eventos_capacidade_check check (capacidade is null or capacidade >= 0);
exception when duplicate_object then null;
end $$;

comment on column public.eventos.capacidade is
  'Teto de inscrições aceitas pela LP do evento (evento_participantes, sem cancelados). null = sem teto.';

insert into public.eventos (
  titulo, descricao, data_evento, horario_inicio, local, local_url, lp_url,
  tipo, checkin_status, pelotoes, slug, oculto_no_checkin_publico, evento_encerrado, capacidade
)
select
  'Dexcomplica Love Run',
  'Somma Club e Dexcomplica, com produção da Monu: um corre especial de aquecimento para a festa Dexcomplica, com música, ativações e after no Oscarito. Gratuito, vagas limitadas.',
  date '2026-11-07',
  null,                                   -- PENDENTE: horário de concentração/largada
  'Parque da Cidade, Estacionamento 1 — Brasília, DF',
  'https://www.google.com/maps/search/?api=1&query=Estacionamento%201%20Parque%20da%20Cidade&query_place_id=ChIJH4nPHI46WpMRD2P1elhXBmM',
  'https://sommaclub.com.br/dexcomplica',
  'corrida',
  'bloqueado',
  '{}'::text[],                           -- PENDENTE: pelotões oficiais
  'dexcomplica-love-run',
  false,
  false,
  null                                    -- PENDENTE: quantidade de vagas
where not exists (select 1 from public.eventos where slug = 'dexcomplica-love-run');
