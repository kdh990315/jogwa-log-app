create index if not exists weather_forecasts_source_forecast_date_idx
on public.weather_forecasts (source, forecast_date);

select cron.unschedule('sync-weather-forecast-twice-daily')
where exists (
  select 1
  from cron.job
  where jobname = 'sync-weather-forecast-twice-daily'
);

select cron.schedule(
  format('sync-weather-forecast-bucket-%s-twice-daily', bucket_index),
  format('%s 6,18 * * *', 20 + bucket_index * 3),
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
        8,
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
from generate_series(0, 7) as bucket_index;

select cron.schedule(
  'cleanup-old-weather-forecasts-daily',
  '50 5 * * *',
  $$
  delete from public.weather_forecasts
  where source = 'data-go-kr-kma-vilage-fcst-2.0'
    and forecast_date < current_date - 14;
  $$
);
