-- =====================================================================
-- 2) Segurança: RLS em todas as tabelas
-- Só o e-mail cadastrado em config_painel enxerga ou altera dados.
-- =====================================================================

create or replace function public.eh_dona()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.config_painel c
    where lower(c.email_dona) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.eh_dona() from public;
grant execute on function public.eh_dona() to authenticated;

alter table public.config_painel enable row level security;
alter table public.config_conteudo enable row level security;
alter table public.posts enable row level security;
alter table public.post_destinos enable row level security;
alter table public.retornos_make enable row level security;

-- config_painel: sem políticas. Só o servidor (service role) lê e escreve.

create policy "dona lê a configuração de conteúdo" on public.config_conteudo
  for select to authenticated using ((select public.eh_dona()));
create policy "dona altera a configuração de conteúdo" on public.config_conteudo
  for update to authenticated
  using ((select public.eh_dona())) with check ((select public.eh_dona()));

create policy "dona gerencia posts" on public.posts
  for all to authenticated
  using ((select public.eh_dona())) with check ((select public.eh_dona()));

create policy "dona gerencia destinos" on public.post_destinos
  for all to authenticated
  using ((select public.eh_dona())) with check ((select public.eh_dona()));

create policy "dona lê retornos do Make" on public.retornos_make
  for select to authenticated using ((select public.eh_dona()));

-- Usuários anônimos não têm acesso a nada.
revoke all on all tables in schema public from anon;
