create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  body text not null,
  category text not null default 'general',
  priority integer not null default 0,
  pinned boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  target_platform text not null default 'all',
  min_app_version text,
  max_app_version text,
  action_label text,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notices_title_not_blank check (char_length(btrim(title)) > 0),
  constraint notices_summary_not_blank check (
    summary is null or char_length(btrim(summary)) > 0
  ),
  constraint notices_body_not_blank check (char_length(btrim(body)) > 0),
  constraint notices_category_check check (
    category in ('general', 'maintenance', 'update', 'event')
  ),
  constraint notices_visible_window_check check (
    ends_at is null or starts_at is null or ends_at > starts_at
  ),
  constraint notices_target_platform_check check (
    target_platform in ('all', 'ios', 'android')
  ),
  constraint notices_min_app_version_not_blank check (
    min_app_version is null or char_length(btrim(min_app_version)) > 0
  ),
  constraint notices_max_app_version_not_blank check (
    max_app_version is null or char_length(btrim(max_app_version)) > 0
  ),
  constraint notices_action_label_not_blank check (
    action_label is null or char_length(btrim(action_label)) > 0
  ),
  constraint notices_action_url_not_blank check (
    action_url is null or char_length(btrim(action_url)) > 0
  ),
  constraint notices_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

comment on table public.notices is
  'App notices and announcements shown to users.';

comment on column public.notices.category is
  'general, maintenance, update, or event.';

comment on column public.notices.target_platform is
  'all, ios, or android.';

alter table public.notices enable row level security;

drop trigger if exists set_notices_updated_at on public.notices;
create trigger set_notices_updated_at
before update on public.notices
for each row
execute function public.set_updated_at();

create index if not exists notices_visible_idx
  on public.notices (
    target_platform,
    pinned desc,
    priority desc,
    published_at desc,
    created_at desc
  )
  where is_published = true;

create index if not exists notices_active_window_idx
  on public.notices (starts_at, ends_at)
  where is_published = true;

drop policy if exists "Anyone can view published notices" on public.notices;
create policy "Anyone can view published notices"
on public.notices
for select
to anon, authenticated
using (
  (
    is_published = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can insert notices" on public.notices;
create policy "Admins can insert notices"
on public.notices
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update notices" on public.notices;
create policy "Admins can update notices"
on public.notices
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete notices" on public.notices;
create policy "Admins can delete notices"
on public.notices
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);
