-- Read the admin role from the user's account, not their session token, so
-- granting or removing it takes effect right away instead of at their next
-- sign-in. The app calls this too (supabase.rpc('is_admin')) to decide who can
-- open the staff pages, so seeing them and being able to edit always match.
--
-- Making someone an admin is still:
--
--   update auth.users
--   set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
--   where email = 'someone@yale.edu';
--
-- and removing it:
--
--   update auth.users
--   set raw_app_meta_data = raw_app_meta_data - 'role'
--   where email = 'someone@yale.edu';

create or replace function public.is_admin()
returns boolean
language sql
stable
-- Runs as its owner so it can read auth.users, which signed-in users can't.
-- It only ever looks at the caller's own row.
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select raw_app_meta_data ->> 'role' = 'admin'
      from auth.users
      where id = auth.uid()
    ),
    false
  )
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
