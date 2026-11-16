-- The Workbook page's answers: what each postdoc writes or picks for each
-- prompt. Only the person who wrote an answer can read or change it. OPA staff
-- (admins) can't read answers; they'll see only whether each section is done.
-- (Anyone with access to the Supabase dashboard can still see them.)
--
-- Apply with: supabase migration up --linked

create table public.workbook_answers (
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  -- The ids in frontend/src/data/workbook.ts, e.g. "self-reflection" and
  -- "communication". Prompt ids only need to be unique within their section.
  section_id text not null check (length(section_id) between 1 and 100),
  prompt_id text not null check (length(prompt_id) between 1 and 100),
  -- Free text as a JSON string, or the options picked as a JSON array of
  -- strings.
  answer jsonb not null check (
    jsonb_typeof(answer) in ('string', 'array')
    and length(answer::text) <= 20000
  ),
  updated_at timestamptz not null default now(),
  primary key (user_id, section_id, prompt_id)
);

create function public.workbook_answers_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger workbook_answers_touch_updated_at
before update on public.workbook_answers
for each row execute function public.workbook_answers_touch_updated_at();

alter table public.workbook_answers enable row level security;

-- Signed-out visitors never need this table.
revoke all on public.workbook_answers from anon;

-- Guests (anonymous users) are "authenticated" too, so they can try it out.
-- There's deliberately no policy for admins.
create policy "People can read their own answers"
on public.workbook_answers for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "People can add their own answers"
on public.workbook_answers for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "People can change their own answers"
on public.workbook_answers for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "People can remove their own answers"
on public.workbook_answers for delete
to authenticated
using ((select auth.uid()) = user_id);
