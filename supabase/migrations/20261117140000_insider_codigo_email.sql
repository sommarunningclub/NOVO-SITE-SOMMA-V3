-- Código por e-mail no login do Insider Connect: alternativa ao Google
-- Authenticator para quem trocou de celular ou está sem o app.
-- Uma linha por insider com o código vigente. Só o hash do código fica aqui.

create table if not exists public.insider_codigo_email (
  insider_id uuid primary key references public.dados_insiders (id) on delete cascade,
  -- HMAC do código de 6 números (nunca o código em texto).
  codigo_hash text not null,
  expira_em timestamptz not null,
  -- Tentativas erradas contra o código vigente; no limite o código morre.
  tentativas integer not null default 0,
  enviado_em timestamptz not null default now(),
  -- Envios dentro da janela de 1 h (freio contra disparo em massa).
  envios integer not null default 1,
  envios_desde timestamptz not null default now()
);

alter table public.insider_codigo_email enable row level security;

comment on table public.insider_codigo_email is
  'Código de acesso por e-mail do Insider Connect (alternativa ao Google Authenticator). Só o service role lê.';

-- Gasta a tentativa ANTES de conferir o código. O update trava a linha, então
-- requisições em paralelo entram em fila e cada uma gasta uma tentativa.
create or replace function public.insider_codigo_email_tentativa(p_insider_id uuid)
returns table (codigo_hash text, expira_em timestamptz, tentativas integer)
language sql
security definer
set search_path = public
as $$
  update public.insider_codigo_email c
  set tentativas = c.tentativas + 1
  where c.insider_id = p_insider_id
  returning c.codigo_hash, c.expira_em, c.tentativas;
$$;

revoke all on function public.insider_codigo_email_tentativa(uuid) from public, anon, authenticated;
grant execute on function public.insider_codigo_email_tentativa(uuid) to service_role;
