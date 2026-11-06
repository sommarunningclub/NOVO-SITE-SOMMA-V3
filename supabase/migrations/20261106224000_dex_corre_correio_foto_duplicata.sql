-- Correio: se republicar o mesmo texto com foto e o recado antigo não tinha,
-- aproveita a imagem em vez de descartá-la. Idempotente.

create or replace function public.dex_corre_correio_publicar(
  p_slug text, p_participacao uuid, p_pessoa bigint, p_dados jsonb
) returns jsonb language plpgsql as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  para_t text := btrim(coalesce(p_dados->>'para', ''));
  msg text := btrim(coalesce(p_dados->>'mensagem', ''));
  ident boolean := coalesce((p_dados->>'identificado')::boolean, false);
  ig boolean := ident and coalesce((p_dados->>'mostrar_instagram')::boolean, false);
  wa boolean := ident and coalesce((p_dados->>'mostrar_whatsapp')::boolean, false);
  recentes int;
  novo uuid;
  foto text := nullif(p_dados->>'foto_path', '');
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  if char_length(para_t) not between 1 and 60 or char_length(msg) not between 1 and 280 then
    return jsonb_build_object('ok', false, 'erro', 'texto');
  end if;
  if para_t ~ '[0-9]([ .()-]*[0-9]){8,}' or msg ~ '[0-9]([ .()-]*[0-9]){8,}' then
    return jsonb_build_object('ok', false, 'erro', 'contato_no_texto');
  end if;
  if ig and a.instagram is null then ig := false; end if;
  if wa and a.whatsapp is null then wa := false; end if;

  perform public.dex_corre__travar(ev);

  select id into novo from public.dex_corre_correio
    where perfil_id = a.id and para = para_t and mensagem = msg and status = 'publicado'
      and criado_em > now() - interval '2 minutes';
  if novo is not null then
    if foto is not null then
      update public.dex_corre_correio
        set foto_path = foto
        where id = novo and foto_path is null;
      if found then
        return jsonb_build_object('ok', true, 'id', novo, 'repetido', true, 'foto_salva', true);
      end if;
    end if;
    return jsonb_build_object('ok', true, 'id', novo, 'repetido', true);
  end if;

  select count(*) into recentes from public.dex_corre_correio
    where perfil_id = a.id and criado_em > now() - interval '1 hour';
  if recentes >= 5 then return jsonb_build_object('ok', false, 'erro', 'limite_recados'); end if;

  insert into public.dex_corre_correio (evento_id, perfil_id, para, mensagem, foto_path, identificado, mostrar_instagram, mostrar_whatsapp)
    values (ev, a.id, para_t, msg, foto, ident, ig, wa)
    returning id into novo;
  perform public.dex_corre__registrar(ev, a.id, 'recado_publicado', jsonb_build_object('recado', novo));
  return jsonb_build_object('ok', true, 'id', novo);
end $$;

revoke all on function public.dex_corre_correio_publicar(text, uuid, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.dex_corre_correio_publicar(text, uuid, bigint, jsonb) to service_role;
