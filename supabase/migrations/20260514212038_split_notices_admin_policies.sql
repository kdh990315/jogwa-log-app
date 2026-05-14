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

drop policy if exists "Admins can manage notices" on public.notices;

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
