alter table public.profiles
add column if not exists deletion_requested_at timestamptz,
add column if not exists scheduled_hard_delete_at timestamptz;

alter table public.profiles
drop constraint if exists profiles_status_check;

alter table public.profiles
add constraint profiles_status_check
check (status in ('active', 'blocked', 'deleted', 'pending_deletion'));

alter table public.profiles
drop constraint if exists profiles_pending_deletion_schedule_check;

alter table public.profiles
add constraint profiles_pending_deletion_schedule_check
check (
  (
    status = 'pending_deletion'
    and deletion_requested_at is not null
    and scheduled_hard_delete_at is not null
  )
  or (
    status <> 'pending_deletion'
    and scheduled_hard_delete_at is null
  )
);

create index if not exists profiles_pending_deletion_due_idx
on public.profiles (scheduled_hard_delete_at)
where status = 'pending_deletion';

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
  and status = 'active'
)
with check (
  (select auth.uid()) = id
  and status = 'active'
);

drop policy if exists "Users can manage own catch logs" on public.catch_logs;
create policy "Users can manage own catch logs"
on public.catch_logs
for all
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
  )
);

drop policy if exists "Users can manage own catch images" on public.catch_images;
create policy "Users can manage own catch images"
on public.catch_images
for all
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
  )
);

drop policy if exists "Users can manage own AI species predictions"
on public.ai_species_predictions;
create policy "Users can manage own AI species predictions"
on public.ai_species_predictions
for all
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
  )
);

drop policy if exists "Users can read own catch image objects" on storage.objects;
create policy "Users can read own catch image objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'catch-images'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
  )
);

drop policy if exists "Users can upload own catch image objects" on storage.objects;
create policy "Users can upload own catch image objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'catch-images'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
  )
);

drop policy if exists "Users can update own catch image objects" on storage.objects;
create policy "Users can update own catch image objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'catch-images'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
  )
)
with check (
  bucket_id = 'catch-images'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
  )
);

drop policy if exists "Users can delete own catch image objects" on storage.objects;
create policy "Users can delete own catch image objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'catch-images'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
  )
);

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'purge-pending-deleted-accounts-daily',
  '30 19 * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'project_url'
    ) || '/functions/v1/purge-deleted-accounts',
    headers := jsonb_build_object(
      'Content-Type',
      'application/json',
      'Authorization',
      'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'anon_key'
      ),
      'x-purge-secret',
      (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'account_delete_purge_secret'
      )
    ),
    body := jsonb_build_object('triggered_at', now()),
    timeout_milliseconds := 120000
  ) as request_id;
  $$
);
