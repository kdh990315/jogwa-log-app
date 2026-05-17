select cron.alter_job(
  job_id := (
    select jobid
    from cron.job
    where jobname = 'sync-fishing-index-daily'
  ),
  schedule := '10 */3 * * *'
);
