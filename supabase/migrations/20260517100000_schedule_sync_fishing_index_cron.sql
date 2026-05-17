create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'sync-fishing-index-daily',
  '10 20 * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'project_url'
    ) || '/functions/v1/sync-fishing-index',
    headers := jsonb_build_object(
      'Content-Type',
      'application/json',
      'Authorization',
      'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'anon_key'
      ),
      'x-sync-secret',
      (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'sync_fishing_index_secret'
      )
    ),
    body := jsonb_build_object('triggered_at', now()),
    timeout_milliseconds := 30000
  ) as request_id;
  $$
);
