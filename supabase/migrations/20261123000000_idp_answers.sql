-- The IDP builder's answers: what each postdoc types into each field of their
-- Initial IDP. One row per field, so saving one field never overwrites
-- another. Like workbook_answers, only the person who wrote an answer can read
-- or change it, and there's deliberately no policy for admins.
-- (Anyone with access to the Supabase dashboard can still see them.)
--
-- Apply with: supabase migration up --linked

create table public.idp_answers (
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  -- The field ids from idpFieldIds() in frontend/src/data/idp.ts, e.g.
  -- "mentorName", "responses.goals" or "alignment.meetings".
  field_id text not null check (length(field_id) between 1 and 100),
  answer text not null check (length(answer) between 1 and 10000),
  updated_at timestamptz not null default now(),
  primary key (user_id, field_id)
);

create function public.idp_answers_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger idp_answers_touch_updated_at
before update on public.idp_answers
for each row execute function public.idp_answers_touch_updated_at();

alter table public.idp_answers enable row level security;

-- Signed-out visitors never need this table.
revoke all on public.idp_answers from anon;

-- Guests (anonymous users) are "authenticated" too, so they can try it out.
create policy "People can read their own IDP answers"
on public.idp_answers for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "People can add their own IDP answers"
on public.idp_answers for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "People can change their own IDP answers"
on public.idp_answers for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "People can remove their own IDP answers"
on public.idp_answers for delete
to authenticated
using ((select auth.uid()) = user_id);
