-- ─────────────────────────────────────────────────────────────────────────────
-- Vem Correr Comigo: Insiders (dados_insiders) também entram com o CPF.
--
-- Se não há inscrição no Love Run, mas o CPF está ativo em dados_insiders,
-- abre (ou reabre) uma vaga no evento e segue o mesmo fluxo de sessão/perfil.
-- Não altera a tabela de insiders. Idempotente.
-- ─────────────────────────────────────────────────────────────────────────────

-- Stub só se a tabela ainda não existir (PGlite local). Produção já tem a completa.
create table if not exists public.dados_insiders (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text not null,
  email text,
  telefone text,
  sexo text,
  ativo boolean not null default true,
  consent_lgpd boolean not null default true,
  consent_imagem boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create or replace function public.dex_corre_entrar(p_slug text, p_cpf text)
returns jsonb language plpgsql as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  cpf_limpo text := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  n int;
  r record;
  ins record;
  pessoa bigint;
  part uuid;
  sexo_norm text;
begin
  if ev is null or length(cpf_limpo) <> 11 then return null; end if;

  -- 1) Inscrição do evento (regra antiga: exatamente uma vaga válida).
  select count(*) into n from public.evento_participantes
    where evento_id = ev
      and regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = cpf_limpo
      and status <> 'cancelado';
  if n > 1 then return null; end if;
  if n = 1 then
    select id, pessoa_id into r from public.evento_participantes
      where evento_id = ev
        and regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = cpf_limpo
        and status <> 'cancelado';
    perform public.dex_corre__registrar(ev, null, 'acesso',
      jsonb_build_object('participacao', r.id, 'origem', 'inscrito'));
    return jsonb_build_object('participacao_id', r.id, 'pessoa_id', r.pessoa_id);
  end if;

  -- 2) Sem inscrição: Insider ativo com esse CPF?
  select count(*) into n from public.dados_insiders i
    where i.ativo and regexp_replace(coalesce(i.cpf, ''), '\D', '', 'g') = cpf_limpo;
  if n <> 1 then return null; end if;

  select i.id, i.nome, i.cpf, i.email, i.telefone, i.sexo
    into ins
  from public.dados_insiders i
  where i.ativo and regexp_replace(coalesce(i.cpf, ''), '\D', '', 'g') = cpf_limpo;

  sexo_norm := lower(coalesce(ins.sexo, ''));
  if sexo_norm not in ('masculino', 'feminino') then sexo_norm := null; end if;

  -- Mesma função da inscrição oficial: acha a pessoa pelo CPF ou cria, sem sobrescrever dado.
  pessoa := public.upsert_pessoa_por_cpf(
    p_cpf => cpf_limpo, p_nome => ins.nome, p_email => ins.email, p_whatsapp => ins.telefone,
    p_sexo => sexo_norm, p_nascimento => null, p_cep => null, p_atualizar => false
  );

  -- Vaga no evento: reabre se estava cancelada; senão cria.
  select ep.id, ep.status into r from public.evento_participantes ep
    where ep.evento_id = ev and ep.pessoa_id = pessoa
    order by ep.criado_em desc nulls last
    limit 1;

  if r.id is not null then
    part := r.id;
    if r.status = 'cancelado' then
      update public.evento_participantes
        set status = 'inscrito',
            cpf = cpf_limpo,
            nome_completo = ins.nome,
            email = coalesce(email, ins.email),
            telefone = coalesce(telefone, ins.telefone),
            pelotao = coalesce(pelotao, '4km'),
            metadata = coalesce(metadata, '{}'::jsonb)
              || jsonb_build_object('origem', 'insider', 'insider_id', ins.id)
              || case when sexo_norm is not null then jsonb_build_object('sexo', sexo_norm) else '{}'::jsonb end
        where id = part;
    end if;
  else
    insert into public.evento_participantes (
      evento_id, pessoa_id, cpf, nome_completo, email, telefone, pelotao, ticket_code, ticket_token, status, metadata
    ) values (
      ev, pessoa, cpf_limpo, ins.nome, ins.email, ins.telefone, '4km',
      'DLR-' || upper(substr(md5(ins.id::text), 1, 6)),
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
      'inscrito',
      jsonb_build_object('origem', 'insider', 'insider_id', ins.id)
        || case when sexo_norm is not null then jsonb_build_object('sexo', sexo_norm) else '{}'::jsonb end
    ) returning id into part;
  end if;

  perform public.dex_corre__registrar(ev, null, 'acesso',
    jsonb_build_object('participacao', part, 'origem', 'insider', 'insider_id', ins.id));
  return jsonb_build_object('participacao_id', part, 'pessoa_id', pessoa);
end $$;

revoke all on function public.dex_corre_entrar(text, text) from public, anon, authenticated;
grant execute on function public.dex_corre_entrar(text, text) to service_role;
