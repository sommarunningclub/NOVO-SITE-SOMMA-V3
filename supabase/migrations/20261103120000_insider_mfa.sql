-- Google Authenticator (TOTP) no login do Insider Connect.
-- Tabela separada de dados_insiders para o segredo nunca sair num select de perfil.
-- Sem linha aqui = o insider ainda não cadastrou o autenticador (o próximo login pede o cadastro).
-- Para resetar quem perdeu o celular: delete from public.insider_mfa where insider_id = '<uuid>';

create table if not exists public.insider_mfa (
  insider_id uuid primary key references public.dados_insiders (id) on delete cascade,
  -- Segredo base32 lido pelo app autenticador.
  totp_secret text not null,
  ativado_em timestamptz not null default now(),
  ultimo_uso_em timestamptz,
  -- Último passo de 30 s aceito: impede reusar o mesmo código.
  ultimo_passo bigint,
  -- Tentativas de código desde `tentativas_desde` (janela de 15 min); zera no acerto.
  tentativas integer not null default 0,
  tentativas_desde timestamptz
);

alter table public.insider_mfa enable row level security;

comment on table public.insider_mfa is
  'Segundo fator (Google Authenticator) do Insider Connect. Só o service role lê. Apagar a linha obriga a cadastrar de novo.';

-- Conta a tentativa ANTES de conferir o código. O update trava a linha, então
-- requisições em paralelo entram em fila e cada uma gasta uma tentativa.
create or replace function public.insider_mfa_registrar_tentativa(p_insider_id uuid)
returns table (tentativas integer, tentativas_desde timestamptz)
language sql
security definer
set search_path = public
as $$
  update public.insider_mfa m
  set
    tentativas = case
      when m.tentativas_desde is null or m.tentativas_desde < now() - interval '15 minutes' then 1
      else m.tentativas + 1
    end,
    tentativas_desde = case
      when m.tentativas_desde is null or m.tentativas_desde < now() - interval '15 minutes' then now()
      else m.tentativas_desde
    end
  where m.insider_id = p_insider_id
  returning m.tentativas, m.tentativas_desde;
$$;

revoke all on function public.insider_mfa_registrar_tentativa(uuid) from public, anon, authenticated;
grant execute on function public.insider_mfa_registrar_tentativa(uuid) to service_role;
