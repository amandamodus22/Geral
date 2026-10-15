-- =====================================================================
-- 3) Storage: bucket PRIVADO para as mídias
-- O limite por arquivo do plano gratuito é 50 MB.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('midias', 'midias', false, 52428800)
on conflict (id) do update set public = false;

create policy "dona lê mídias" on storage.objects
  for select to authenticated
  using (bucket_id = 'midias' and (select public.eh_dona()));

create policy "dona envia mídias" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'midias' and (select public.eh_dona()));

create policy "dona altera mídias" on storage.objects
  for update to authenticated
  using (bucket_id = 'midias' and (select public.eh_dona()));

create policy "dona apaga mídias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'midias' and (select public.eh_dona()));
