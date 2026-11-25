-- Each postdoc's appointment details (entered in Settings) and the checklist
-- tasks they've checked off, for Home, the Checklist page and the admin
-- Completion overview.
--
-- Postdocs read and write only their own rows. Admins (public.is_admin(), see
-- 20261105000000_live_admin_check.sql) can read everyone's but not change them.
-- Guests ("Continue as guest", Supabase anonymous users) can't save anything.
--
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run.

-- Whether the caller signed in as a guest.
create or replace function public.is_guest()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
$$;

revoke execute on function public.is_guest() from public, anon;
grant execute on function public.is_guest() to authenticated;

-- Profiles ---------------------------------------------------------------

-- Keep in sync with Visa in frontend/src/data/checklist.ts.
create type public.visa as enum ('j1', 'f1-opt', 'domestic');

create table public.profiles (
  user_id uuid primary key default auth.uid()
    references auth.users (id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) between 1 and 200),
  -- '' until they have one: getting a NetID is one of the first-day tasks.
  net_id text not null default '' check (net_id ~ '^[a-z0-9]{0,20}$'),
  department text not null check (length(btrim(department)) between 1 and 200),
  -- Appointment start. Checklist due dates count from this.
  start_date date not null,
  visa public.visa not null,
  -- Set by the triggers below whenever they save their profile or check or
  -- uncheck a task. Shown as "Last active" on the Completion overview.
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create function public.profiles_touch_last_active()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.last_active_at := now();
  return new;
end;
$$;

create trigger profiles_touch_last_active
before insert or update on public.profiles
for each row execute function public.profiles_touch_last_active();

alter table public.profiles enable row level security;

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

create policy "Postdocs see their own profile, admins see everyone's"
on public.profiles for select
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Postdocs add their own profile"
on public.profiles for insert
to authenticated
with check (user_id = (select auth.uid()) and not (select public.is_guest()));

create policy "Postdocs change their own profile"
on public.profiles for update
to authenticated
using (user_id = (select auth.uid()) and not (select public.is_guest()))
with check (user_id = (select auth.uid()));

-- Checklist progress -----------------------------------------------------

-- One row per task a postdoc has checked off. Unchecking deletes the row.
create table public.checklist_progress (
  -- References profiles, not auth.users, so the overview can load each
  -- profile with its tasks in one query. Postdocs save a profile first.
  user_id uuid not null default auth.uid()
    references public.profiles (user_id) on delete cascade,
  -- An id from TASKS in frontend/src/data/checklist.ts.
  task_id text not null check (task_id ~ '^[a-z0-9-]{1,60}$'),
  done_at timestamptz not null default now(),
  primary key (user_id, task_id)
);

alter table public.checklist_progress enable row level security;

revoke all on public.checklist_progress from anon;
grant select, insert, delete on public.checklist_progress to authenticated;

create policy "Postdocs see their own progress, admins see everyone's"
on public.checklist_progress for select
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Postdocs check off their own tasks"
on public.checklist_progress for insert
to authenticated
with check (user_id = (select auth.uid()) and not (select public.is_guest()));

create policy "Postdocs uncheck their own tasks"
on public.checklist_progress for delete
to authenticated
using (user_id = (select auth.uid()));

-- Checking or unchecking a task counts as activity.
create function public.checklist_progress_touch_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Runs as the postdoc, so row-level security limits it to their profile.
  -- The profiles trigger sets the time.
  update public.profiles
  set last_active_at = now()
  where user_id = coalesce(new.user_id, old.user_id);
  return null;
end;
$$;

create trigger checklist_progress_touch_profile
after insert or delete on public.checklist_progress
for each row execute function public.checklist_progress_touch_profile();
