-- Vem Correr Comigo: a distância deixa de limitar quem corre com quem.
-- Cada pessoa segue com o pelotão da própria inscrição. dex_corre_grupos.pelotao
-- fica só como registro de quem formou o grupo; a tela usa o pelotão dos membros.
-- Só troca corpo de função: não apaga dado nem muda tabela.

create or replace function public.dex_corre__limpar(p_evento uuid)
returns void language plpgsql as $$
declare r record;
begin
  if not exists (
    select 1 from public.dex_corre_perfis pf
    left join public.dex_corre_perfis_validos v on v.id = pf.id
    where pf.evento_id = p_evento and pf.ativo and v.id is null
  ) and not exists (
    select 1 from public.dex_corre_convites c
    join public.dex_corre_perfis p on p.id = c.remetente_id
    where p.evento_id = p_evento and c.status = 'pending' and c.expira_em <= now()
  ) then
    return;
  end if;

  perform public.dex_corre__travar(p_evento);

  for r in
    select pf.id, public.dex_corre__grupo_do(pf.id) as grupo
    from public.dex_corre_perfis pf
    left join public.dex_corre_perfis_validos v on v.id = pf.id
    where pf.evento_id = p_evento and pf.ativo and v.id is null
  loop
    if r.grupo is not null then
      perform public.dex_corre__remover(r.grupo, r.id, 'inscricao_invalida');
    end if;
    update public.dex_corre_convites set status = 'cancelled', respondido_em = now()
      where status = 'pending' and (remetente_id = r.id or destinatario_id = r.id);
    update public.dex_corre_perfis set ativo = false, atualizado_em = now() where id = r.id;
    perform public.dex_corre__registrar(p_evento, r.id, 'perfil_desativado');
  end loop;

  update public.dex_corre_convites c set status = 'expired', respondido_em = now()
    from public.dex_corre_perfis p
    where p.id = c.remetente_id and p.evento_id = p_evento
      and c.status = 'pending' and c.expira_em <= now();
end $$;

create or replace function public.dex_corre_vitrine(
  p_slug text, p_participacao uuid, p_pessoa bigint, p_filtros jsonb, p_limite int, p_offset int
) returns jsonb language plpgsql stable as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos := public.dex_corre__ator(p_participacao, p_pessoa);
  cfg public.dex_corre_config := public.dex_corre__config(ev);
  meu_grupo uuid;
  mi jsonb;
  f_pelotao text := nullif(p_filtros->>'pelotao', '');
  f_tamanho int := nullif(p_filtros->>'tamanho', '')::int;
  f_vagas boolean := coalesce((p_filtros->>'com_vagas')::boolean, false);
  f_busca text := public.dex_corre__sem_acento(nullif(btrim(p_filtros->>'busca'), ''));
  itens jsonb;
  total int;
begin
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  meu_grupo := public.dex_corre__grupo_do(a.id);
  if meu_grupo is not null then mi := public.dex_corre__grupo_info(meu_grupo); end if;

  with pessoas as (
    select
      v.id, 'pessoa'::text as tipo, array[v.pelotao] as pelotoes, v.preferencia as tamanho, true as com_vaga,
      v.criado_em as data, public.dex_corre__sem_acento(v.nome) as busca,
      public.dex_corre__cartao(v) as dados,
      case
        when exists (select 1 from public.dex_corre_convites c where c.status = 'pending' and c.remetente_id = a.id and c.destinatario_id = v.id) then 'aguardando'
        when exists (select 1 from public.dex_corre_convites c where c.status = 'pending' and c.remetente_id = v.id and c.destinatario_id = a.id) then 'aceitar'
        when meu_grupo is not null then
          case when public.dex_corre__cabe(cfg, (mi->>'total')::int, (mi->>'homens')::int, (mi->>'mulheres')::int, (mi->>'capacidade')::int, v.genero_grupo, v.preferencia)
            then 'convidar' else 'sem_vaga_no_meu' end
        when a.preferencia = 2 or v.preferencia = 2 then 'convidar'
        else 'conectar'
      end as acao
    from public.dex_corre_perfis_validos v
    where v.evento_id = ev and v.id <> a.id and public.dex_corre__grupo_do(v.id) is null
      and v.foto_path is not null
  ),
  grupos as (
    select
      g.id, 'grupo'::text as tipo,
      array(select v.pelotao from public.dex_corre_membros mb
        join public.dex_corre_perfis_validos v on v.id = mb.perfil_id
        where mb.grupo_id = g.id and mb.saiu_em is null) as pelotoes,
      (i.j->>'capacidade')::int as tamanho,
      not (i.j->>'completo')::boolean as com_vaga, g.atualizado_em as data,
      (select string_agg(public.dex_corre__sem_acento(v.nome), ' ') from public.dex_corre_membros mb
        join public.dex_corre_perfis_validos v on v.id = mb.perfil_id
        where mb.grupo_id = g.id and mb.saiu_em is null) as busca,
      public.dex_corre__grupo_json(g.id) as dados,
      case
        when g.id = meu_grupo then 'meu'
        when (i.j->>'completo')::boolean then 'completo'
        when meu_grupo is not null then 'ja_em_grupo'
        when public.dex_corre__cabe(cfg, (i.j->>'total')::int, (i.j->>'homens')::int, (i.j->>'mulheres')::int, (i.j->>'capacidade')::int, a.genero_grupo, a.preferencia) then 'entrar'
        else 'incompativel'
      end as acao
    from public.dex_corre_grupos g
    cross join lateral (select public.dex_corre__grupo_info(g.id) as j) i
    where g.evento_id = ev and g.status = 'ativo'
  ),
  tudo as (
    select * from pessoas union all select * from grupos
  ),
  filtrado as (
    select * from tudo t
    where (f_pelotao is null or f_pelotao = any(t.pelotoes))
      and (f_tamanho is null or t.tamanho = f_tamanho)
      and (not f_vagas or t.com_vaga)
      and (f_busca is null or position(f_busca in t.busca) > 0)
  ),
  pagina as (
    select * from filtrado t
    order by
      (t.acao in ('aceitar', 'conectar', 'convidar', 'entrar')) desc,
      coalesce(a.pelotao = any(t.pelotoes), false) desc,
      (t.tipo = 'grupo' and t.com_vaga) desc,
      t.data desc, t.id
    limit p_limite offset p_offset
  )
  select
    coalesce((select jsonb_agg(jsonb_build_object('tipo', p.tipo, 'acao', p.acao, 'dados', p.dados)) from pagina p), '[]'::jsonb),
    (select count(*) from filtrado)
  into itens, total;

  return jsonb_build_object('ok', true, 'itens', itens, 'total', total);
end $$;

create or replace function public.dex_corre__responder(
  a public.dex_corre_perfis_validos, p_convite uuid, p_aceitar boolean
) returns jsonb language plpgsql as $$
declare
  c public.dex_corre_convites;
  de public.dex_corre_perfis_validos;
  cfg public.dex_corre_config := public.dex_corre__config(a.evento_id);
  gid uuid; i jsonb; erro text;
begin
  select * into c from public.dex_corre_convites where id = p_convite and destinatario_id = a.id for update;
  if not found then return jsonb_build_object('ok', false, 'erro', 'convite_invalido'); end if;

  if c.status = 'accepted' and p_aceitar then
    gid := public.dex_corre__grupo_do(a.id);
    return jsonb_build_object('ok', true, 'resultado', 'ja_no_grupo',
      'grupo', (select codigo from public.dex_corre_grupos where id = gid));
  end if;
  if c.status = 'rejected' and not p_aceitar then return jsonb_build_object('ok', true, 'resultado', 'recusado'); end if;
  if c.status <> 'pending' or c.expira_em <= now() then
    return jsonb_build_object('ok', false, 'erro', 'convite_invalido');
  end if;

  if not p_aceitar then
    update public.dex_corre_convites set status = 'rejected', respondido_em = now() where id = c.id;
    perform public.dex_corre__notificar(c.remetente_id, 'convite_recusado',
      jsonb_build_object('nome', public.dex_corre__nome_curto(a.nome)));
    return jsonb_build_object('ok', true, 'resultado', 'recusado');
  end if;

  select * into de from public.dex_corre_perfis_validos where id = c.remetente_id;
  if de.id is null then erro := 'perfil_indisponivel';
  elsif public.dex_corre__grupo_do(a.id) is not null then erro := 'ja_em_grupo';
  end if;

  if erro is null then
    gid := public.dex_corre__grupo_do(de.id);
    if c.grupo_id is null then
      if gid is not null then erro := 'convite_invalido'; end if;
    elsif gid is distinct from c.grupo_id then
      erro := 'convite_invalido';
    else
      i := public.dex_corre__grupo_info(gid);
      if not public.dex_corre__cabe(cfg, (i->>'total')::int, (i->>'homens')::int, (i->>'mulheres')::int,
        (i->>'capacidade')::int, a.genero_grupo, a.preferencia) then
        erro := case when (i->>'completo')::boolean then 'grupo_completo' else 'composicao' end;
      end if;
    end if;
  end if;

  if erro is not null then
    update public.dex_corre_convites set status = 'cancelled', respondido_em = now() where id = c.id;
    return jsonb_build_object('ok', false, 'erro', erro);
  end if;

  update public.dex_corre_convites set status = 'accepted', respondido_em = now() where id = c.id;
  perform public.dex_corre__registrar(a.evento_id, a.id, 'convite_aceito', jsonb_build_object('convite', c.id));

  if c.grupo_id is null then
    gid := public.dex_corre__formar(de.id, a.id, a.evento_id, coalesce(de.pelotao, a.pelotao, ''));
    perform public.dex_corre__notificar(de.id, 'convite_aceito', jsonb_build_object(
      'nome', public.dex_corre__nome_curto(a.nome),
      'grupo', (select codigo from public.dex_corre_grupos where id = gid), 'celebrar', 'dupla'));
    return jsonb_build_object('ok', true, 'resultado', 'grupo_formado',
      'grupo', (select codigo from public.dex_corre_grupos where id = gid), 'celebrar', 'dupla', 'total', 2);
  end if;

  insert into public.dex_corre_membros (grupo_id, perfil_id) values (gid, a.id);
  update public.dex_corre_grupos set atualizado_em = now() where id = gid;
  perform public.dex_corre__apos_entrar(gid, a.id);
  perform public.dex_corre__notificar(de.id, 'convite_aceito',
    jsonb_build_object('nome', public.dex_corre__nome_curto(a.nome)));
  return public.dex_corre__anunciar_entrada(gid, a.id, 'entrou_no_grupo');
end $$;

create or replace function public.dex_corre_interesse(
  p_slug text, p_participacao uuid, p_pessoa bigint, p_alvo_perfil text, p_alvo_grupo text
) returns jsonb language plpgsql as $$
declare
  ev uuid := public.dex_corre__evento(p_slug);
  a public.dex_corre_perfis_validos;
  b public.dex_corre_perfis_validos;
  cfg public.dex_corre_config := public.dex_corre__config(ev);
  g public.dex_corre_grupos;
  meu uuid; alvo uuid; i jsonb; gid uuid; volta uuid;
begin
  perform public.dex_corre__travar(ev);
  perform public.dex_corre__limpar(ev);
  a := public.dex_corre__ator(p_participacao, p_pessoa);
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil'); end if;
  if a.foto_path is null then return jsonb_build_object('ok', false, 'erro', 'sem_foto'); end if;
  meu := public.dex_corre__grupo_do(a.id);

  if p_alvo_perfil is not null then
    select * into b from public.dex_corre_perfis_validos v where v.codigo = p_alvo_perfil and v.evento_id = ev;
    if b.id is null then return jsonb_build_object('ok', false, 'erro', 'perfil_indisponivel'); end if;
    if b.foto_path is null then return jsonb_build_object('ok', false, 'erro', 'perfil_indisponivel'); end if;
    if b.id = a.id then return jsonb_build_object('ok', false, 'erro', 'proprio'); end if;
    alvo := public.dex_corre__grupo_do(b.id);
  else
    select id into alvo from public.dex_corre_grupos x
      where x.codigo = p_alvo_grupo and x.evento_id = ev and x.status = 'ativo';
    if alvo is null then return jsonb_build_object('ok', false, 'erro', 'grupo_indisponivel'); end if;
  end if;

  -- Alvo em grupo: a conversa é com o grupo.
  if alvo is not null then
    select * into g from public.dex_corre_grupos where id = alvo;
    if alvo = meu then
      return jsonb_build_object('ok', true, 'resultado', 'ja_no_grupo', 'grupo', g.codigo);
    end if;
    if meu is not null then return jsonb_build_object('ok', false, 'erro', 'ja_em_grupo'); end if;
    i := public.dex_corre__grupo_info(alvo);
    if (i->>'completo')::boolean then return jsonb_build_object('ok', false, 'erro', 'grupo_completo'); end if;
    if not public.dex_corre__cabe(cfg, (i->>'total')::int, (i->>'homens')::int, (i->>'mulheres')::int,
      (i->>'capacidade')::int, a.genero_grupo, a.preferencia) then
      return jsonb_build_object('ok', false, 'erro',
        case when (i->>'total')::int + 1 > a.preferencia then 'preferencia' else 'composicao' end);
    end if;
    insert into public.dex_corre_membros (grupo_id, perfil_id) values (alvo, a.id);
    update public.dex_corre_grupos set atualizado_em = now() where id = alvo;
    perform public.dex_corre__apos_entrar(alvo, a.id);
    return public.dex_corre__anunciar_entrada(alvo, a.id, 'entrou_no_grupo');
  end if;

  -- Alvo é uma pessoa sem grupo.
  if meu is not null then
    i := public.dex_corre__grupo_info(meu);
    if not public.dex_corre__cabe(cfg, (i->>'total')::int, (i->>'homens')::int, (i->>'mulheres')::int,
      (i->>'capacidade')::int, b.genero_grupo, b.preferencia) then
      return jsonb_build_object('ok', false, 'erro',
        case when (i->>'completo')::boolean then 'grupo_completo' else 'composicao' end);
    end if;
    -- Quem entra precisa manifestar interesse: aqui é a outra pessoa que decide.
    return public.dex_corre__convidar(a, b, meu);
  end if;

  -- O outro lado já tinha convidado: clicar é aceitar.
  select id into volta from public.dex_corre_convites
    where remetente_id = b.id and destinatario_id = a.id and status = 'pending' and expira_em > now();
  if volta is not null then return public.dex_corre__responder(a, volta, true); end if;

  if a.preferencia = 2 or b.preferencia = 2 then
    return public.dex_corre__convidar(a, b, null);
  end if;

  gid := public.dex_corre__formar(a.id, b.id, ev, coalesce(a.pelotao, b.pelotao, ''));
  perform public.dex_corre__notificar(b.id, 'novo_integrante', jsonb_build_object(
    'nome', public.dex_corre__nome_curto(a.nome),
    'grupo', (select codigo from public.dex_corre_grupos where id = gid), 'celebrar', 'dupla'));
  return jsonb_build_object('ok', true, 'resultado', 'grupo_formado',
    'grupo', (select codigo from public.dex_corre_grupos where id = gid), 'celebrar', 'dupla', 'total', 2);
end $$;
