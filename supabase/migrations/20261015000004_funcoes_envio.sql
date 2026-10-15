-- =====================================================================
-- 4) Funções de envio e cálculo de status
-- =====================================================================

-- ---------------------------------------------------------------------
-- Recalcula o status geral de um post a partir dos destinos.
--   todos publicados                  -> concluido
--   todos finalizados, algum com erro -> concluido_com_erros
--   ainda falta algum                 -> enviando
-- Posts em rascunho/agendado não são alterados aqui.
-- ---------------------------------------------------------------------
create or replace function public.recalcular_status_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total int;
  v_publicados int;
  v_erros int;
  v_novo public.status_post;
begin
  select
    count(*),
    count(*) filter (where status = 'publicado'),
    count(*) filter (where status = 'erro')
  into v_total, v_publicados, v_erros
  from public.post_destinos
  where post_id = p_post_id;

  if v_total = 0 then
    return;
  end if;

  if v_publicados = v_total then
    v_novo := 'concluido';
  elsif v_publicados + v_erros = v_total then
    v_novo := 'concluido_com_erros';
  else
    v_novo := 'enviando';
  end if;

  update public.posts
  set status = v_novo
  where id = p_post_id
    and status in ('enviando', 'concluido', 'concluido_com_erros')
    and status <> v_novo;
end;
$$;

create or replace function public.gatilho_status_destino()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.recalcular_status_post(new.post_id);
  return null;
end;
$$;

create trigger post_destinos_recalcula_post
  after update of status on public.post_destinos
  for each row
  when (old.status is distinct from new.status)
  execute function public.gatilho_status_destino();

-- ---------------------------------------------------------------------
-- Reivindica posts vencidos (status 'agendado' e horário já passou).
-- Marca o post como 'enviando' de forma atômica (FOR UPDATE SKIP LOCKED),
-- então duas execuções simultâneas nunca pegam o mesmo post.
-- Destinos pendentes viram 'enviando' (vão para o Make) ou 'manual' (TikTok).
-- p_post_id: opcional, para o botão "Publicar agora".
-- ---------------------------------------------------------------------
create or replace function public.reivindicar_posts_vencidos(p_post_id uuid default null)
returns setof public.posts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_id uuid;
begin
  with alvo as (
    select p.id
    from public.posts p
    where p.status = 'agendado'
      and p.agendado_para <= now()
      and (p_post_id is null or p.id = p_post_id)
    order by p.agendado_para
    limit 20
    for update skip locked
  ),
  atualizados as (
    update public.posts p
    set status = 'enviando'
    from alvo
    where p.id = alvo.id
    returning p.id
  )
  select array_agg(id) into v_ids from atualizados;

  if v_ids is null then
    return;
  end if;

  update public.post_destinos
  set status = case when rede = 'tiktok' then 'manual'::public.status_destino
                    else 'enviando'::public.status_destino end,
      enviado_em = case when rede = 'tiktok' then null else now() end,
      mensagem_erro = null
  where post_id = any (v_ids)
    and status = 'pendente';

  foreach v_id in array v_ids loop
    perform public.recalcular_status_post(v_id);
  end loop;

  return query select * from public.posts where id = any (v_ids);
end;
$$;

-- ---------------------------------------------------------------------
-- Se o Make não devolver resultado em 2 horas, marca como erro
-- (assim aparece o botão "Tentar de novo").
-- ---------------------------------------------------------------------
create or replace function public.expirar_envios_sem_resposta()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_qtd integer;
begin
  update public.post_destinos
  set status = 'erro',
      mensagem_erro = 'O Make não devolveu resultado em 2 horas. Confira o histórico do cenário no Make e tente de novo.'
  where status = 'enviando'
    and enviado_em < now() - interval '2 hours';
  get diagnostics v_qtd = row_count;
  return v_qtd;
end;
$$;

-- ---------------------------------------------------------------------
-- Estas funções só podem ser chamadas pelo servidor (service role).
-- ---------------------------------------------------------------------
revoke all on function public.recalcular_status_post(uuid) from public, anon, authenticated;
revoke all on function public.gatilho_status_destino() from public, anon, authenticated;
revoke all on function public.reivindicar_posts_vencidos(uuid) from public, anon, authenticated;
revoke all on function public.expirar_envios_sem_resposta() from public, anon, authenticated;

grant execute on function public.recalcular_status_post(uuid) to service_role;
grant execute on function public.reivindicar_posts_vencidos(uuid) to service_role;
grant execute on function public.expirar_envios_sem_resposta() to service_role;
