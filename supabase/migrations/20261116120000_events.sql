-- Events that OPA staff publish, shown on Home and managed at /admin/events.
-- Everyone signed in (guests too) can read published events. Only admins can
-- see drafts or add, edit and delete events.
--
-- Admins are decided by public.is_admin() (20261105000000_live_admin_check.sql):
-- users with "role": "admin" in their app_metadata.

-- Keep in sync with EVENT_CATEGORIES in frontend/src/data/events.ts.
create type public.event_category as enum (
  'orientation',
  'career',
  'wellness',
  'community',
  'international'
);

-- Drafts are only visible to admins.
create type public.event_status as enum ('published', 'draft');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 200),
  date date not null,
  start_time time not null,
  -- null when there's no set end time
  end_time time,
  location text not null default '' check (length(location) <= 200),
  category public.event_category not null,
  -- The office or group running the event.
  host text not null default '' check (length(host) <= 200),
  description text not null default '' check (length(description) <= 2000),
  -- Registration page, or '' when no registration is needed.
  link text not null default '' check (
    link = '' or (link ~ '^https://\S+\.\S+' and length(link) <= 2000)
  ),
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now(),
  check (end_time is null or end_time > start_time)
);

create index events_date_idx on public.events (date, start_time);

alter table public.events enable row level security;

-- Signed-out visitors never need this table.
revoke all on public.events from anon;
grant select, insert, update, delete on public.events to authenticated;

create policy "Signed-in users see published events, admins see drafts too"
on public.events for select
to authenticated
using (status = 'published' or (select public.is_admin()));

create policy "Admins can add events"
on public.events for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins can change events"
on public.events for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can remove events"
on public.events for delete
to authenticated
using ((select public.is_admin()));
