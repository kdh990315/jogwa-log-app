select cron.unschedule(jobname)
from cron.job
where jobname like 'sync-weather-forecast-bucket-%-twice-daily';

select cron.schedule(
  format('sync-weather-forecast-bucket-%s-twice-daily', bucket_index),
  format('%s 6,18 * * *', 5 + bucket_index * 3),
  format(
    $job$
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
        %s,
        'bucketCount',
        16,
        'concurrency',
        4,
        'triggered_at',
        now()
      ),
      timeout_milliseconds := 120000
    ) as request_id;
    $job$,
    bucket_index
  )
)
from generate_series(0, 15) as bucket_index;
