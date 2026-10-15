-- =====================================================================
-- 5) A cada 5 minutos, chama a Edge Function "enviar-para-make".
--
-- ANTES de rodar este arquivo, guarde dois segredos no Vault
-- (o README explica o passo a passo):
--
--   select vault.create_secret('https://SEU-PROJETO.supabase.co', 'url_projeto');
--   select vault.create_secret('O MESMO VALOR DE CRON_SECRET', 'cron_secret');
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'enviar-posts-para-make',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'url_projeto')
           || '/functions/v1/enviar-para-make',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{"modo": "cron"}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
