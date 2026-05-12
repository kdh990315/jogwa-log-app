revoke update on table public.profiles from anon, authenticated;

grant update (nickname, avatar_url)
on table public.profiles
to authenticated;
