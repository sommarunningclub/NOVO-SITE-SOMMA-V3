-- Correio Elegante: autor ou Insider ativo pode apagar qualquer recado.
-- Idempotente.

create or replace function public.dex_corre__eh_moderador(p_participacao uuid, p_pessoa bigint)
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.evento_participantes ep
    join public.dados_insiders i
      on i.ativo
     and regexp_replace(coalesce(i.cpf, ''), '\D', '', 'g')
       = regexp_replace(coalesce(ep.cpf, ''), '\D', '', 'g')
    where ep.id = p_participacao
      and ep.pessoa_id = p_pessoa
      and ep.status <> 'cancelado'
  )
$$;

create or replace function public.dex_corre_correio_mural(
  p_slug text, p_participacao uuid, p_pessoa bigint, p_limite int, p_offset int
) returns jsonb language plpgsql stable as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  modera boolean := public.dex_corre__eh_moderador(p_participacao, p_pessoa);
  itens jsonb; total int;
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;

  select count(*) into total from public.dex_corre_correio m
    join public.dex_corre_perfis_validos v on v.id = m.perfil_id
    where m.evento_id = ev and m.status = 'publicado';

  select coalesce(jsonb_agg(x.j order by x.criado_em desc, x.id), '[]'::jsonb) into itens
  from (
    select m.id, m.criado_em, jsonb_build_object(
      'id', m.id,
      'para', m.para,
      'mensagem', m.mensagem,
      'foto', m.foto_path is not null,
      'criado_em', m.criado_em,
      'meu', m.perfil_id = a.id,
      'pode_apagar', m.perfil_id = a.id or modera,
      'denunciei', exists (select 1 from public.dex_corre_correio_denuncias d where d.recado_id = m.id and d.perfil_id = a.id),
      'autor', case when m.identificado then jsonb_build_object(
        'codigo', v.codigo,
        'nome', public.dex_corre__nome_curto(v.nome),
        'foto', case when v.foto_path is not null then v.foto_versao end,
        'instagram', case when m.mostrar_instagram then v.instagram end,
        'whatsapp', case when m.mostrar_whatsapp then v.whatsapp end
      ) end
    ) as j
    from public.dex_corre_correio m
    join public.dex_corre_perfis_validos v on v.id = m.perfil_id
    where m.evento_id = ev and m.status = 'publicado'
    order by m.criado_em desc, m.id
    limit p_limite offset p_offset
  ) x;

  return jsonb_build_object('ok', true, 'itens', itens, 'total', total);
end $$;

/** Autor ou Insider ativo apaga. Devolve a foto para a rota tirar do Storage. */
create or replace function public.dex_corre_correio_apagar(p_participacao uuid, p_pessoa bigint, p_recado uuid)
returns jsonb language plpgsql as $$
declare
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  m public.dex_corre_correio;
  caminho text;
  modera boolean := public.dex_corre__eh_moderador(p_participacao, p_pessoa);
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  select * into m from public.dex_corre_correio where id = p_recado for update;
  if not found or m.status = 'removido' then
    return jsonb_build_object('ok', false, 'erro', 'nao_encontrado');
  end if;
  if m.perfil_id <> a.id and not modera then
    return jsonb_build_object('ok', false, 'erro', 'nao_encontrado');
  end if;
  caminho := m.foto_path;
  update public.dex_corre_correio set status = 'removido', foto_path = null where id = p_recado;
  perform public.dex_corre__registrar(a.evento_id, a.id, 'recado_apagado',
    jsonb_build_object('recado', p_recado, 'moderacao', m.perfil_id <> a.id));
  return jsonb_build_object('ok', true, 'foto', caminho);
end $$;

revoke all on function public.dex_corre__eh_moderador(uuid, bigint) from public, anon, authenticated;
grant execute on function public.dex_corre__eh_moderador(uuid, bigint) to service_role;
revoke all on function public.dex_corre_correio_mural(text, uuid, bigint, int, int) from public, anon, authenticated;
grant execute on function public.dex_corre_correio_mural(text, uuid, bigint, int, int) to service_role;
revoke all on function public.dex_corre_correio_apagar(uuid, bigint, uuid) from public, anon, authenticated;
grant execute on function public.dex_corre_correio_apagar(uuid, bigint, uuid) to service_role;
