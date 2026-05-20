select cron.schedule(
  'sync-weather-forecast-twice-daily',
  '20 6,18 * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'project_url'
    ) || '/functions/v1/sync-weather-forecast',
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
    body := jsonb_build_object(
      'bucketIndex',
      bucket_index,
      'bucketCount',
      8,
      'triggered_at',
      now()
    ),
    timeout_milliseconds := 120000
  ) as request_id
  from generate_series(0, 7) as bucket_index;
  $$
);
