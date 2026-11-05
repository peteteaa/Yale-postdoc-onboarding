-- The Resources page: links to the offices, programs, and tools named in the
-- POSTDOC Workbook. Everyone who's signed in (guests too) can read them; only
-- OPA staff (admins) can add, change, or remove them.
--
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. Then make someone an admin (see the bottom of this file).

-- Admins -----------------------------------------------------------------

-- An admin is a user whose app_metadata has "role": "admin". Only the service
-- role (the dashboard, SQL) can write app_metadata, so users can't make
-- themselves admins. It's in the session token, so this needs no table lookup.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- Resources --------------------------------------------------------------

create table public.resources (
  -- Also the order resources are listed in within their topic.
  id bigint generated always as identity primary key,
  -- Keep in sync with RESOURCE_TOPICS in frontend/src/data/resources.ts.
  topic text not null check (
    topic in (
      'getting-started',
      'international',
      'career',
      'skills',
      'leadership',
      'wellness',
      'time',
      'community'
    )
  ),
  name text not null check (length(btrim(name)) between 1 and 200),
  url text not null check (url ~ '^https?://\S+\.\S+' and length(url) <= 2000),
  -- Who runs it, e.g. "Office of Career Strategy".
  host text not null default '' check (length(host) <= 200),
  description text not null default '' check (length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.resources_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger resources_touch_updated_at
before update on public.resources
for each row execute function public.resources_touch_updated_at();

alter table public.resources enable row level security;

create policy "Signed-in users can read resources"
on public.resources for select
to authenticated
using (true);

create policy "Admins can add resources"
on public.resources for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins can change resources"
on public.resources for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can remove resources"
on public.resources for delete
to authenticated
using ((select public.is_admin()));

-- From the workbook ------------------------------------------------------

insert into public.resources (topic, name, host, description, url) values
  -- 2.1 Onboarding checklist (all postdocs) and 2.3 PTO reminder
  ('getting-started', 'I-9 form', 'Yale HR',
    'Complete it in Workday on or before your first day. Bring unexpired I-9 documents to the I-9 Center, 221 Whitney Avenue, by your third working day.',
    'https://your.yale.edu/work-yale/support/employee-services/submitting-your-i-9-form'),
  ('getting-started', 'Vaccination policy', 'Yale',
    'Depending on your work, you may need to get or provide documentation for certain vaccines. Check this page and speak with your department.',
    'http://covid19.yale.edu/covid-19-vaccination-policy'),
  ('getting-started', 'Postdoc benefits summary and PTO policy', 'Office of Postdoctoral Affairs',
    'Benefits and paid time off for postdoctoral associates and fellows.',
    'https://postdocs.yale.edu/postdocs/being-a-postdoc-at-yale/benefits-summary'),

  -- 2.2 Onboarding checklist (international postdocs) and 4.2
  ('international', 'J-1 scholars', 'Office of International Students & Scholars',
    'Immigration information for J-1 scholars.',
    'https://oiss.yale.edu/immigration/j-1-scholars'),
  ('international', 'OISS New Scholar Orientation and Check-In', 'Office of International Students & Scholars',
    'J-1 scholars: report your U.S. address and I-94 on OISS Connect within 72 hours of arriving, and at least about 4 days before your I-9 appointment. F-1 OPT scholars don’t need to check in.',
    'https://oiss.yale.edu/immigration/j-1-scholars/oiss-connect-requests/new-scholar-check-in'),
  ('international', 'OISS newsletter', 'Office of International Students & Scholars',
    'Sign up to learn about events.',
    'https://oiss.yale.edu/programs-events/newsletter-social-media'),

  -- 1.4.3 Career discernment & preparation and 3.6.1 Goal setting
  ('career', 'Office of Career Strategy for PhDs & postdocs', 'Office of Career Strategy',
    'Videos and resources, including job boards, application materials, and interviewing.',
    'https://ocs.yale.edu/channels/phds-postdocs/'),
  ('career', 'OCS consultation', 'Office of Career Strategy',
    'Sign up to talk through your career options or your application process.',
    'https://ocs.yale.edu/channels/meet-with-ocs/'),
  ('career', 'OCS newsletter', 'Office of Career Strategy',
    'Sign up to learn about workshops and job fairs.',
    'https://ocs.yale.edu/blog/2022/06/03/customize-the-new-ocs-weekly-newsletter/'),
  ('career', 'Goal setting and career planning', 'Office of Postdoctoral Affairs',
    'OPA webpage with planning resources.',
    'https://postdocs.yale.edu/professional-career-development/postdoctoral-appointment/goal-setting-and-career-planning'),
  ('career', 'The Postdoc Academy', 'The Postdoc Academy',
    'Courses including “Succeeding as a Postdoc” and “Building Skills for a Successful Career.”',
    'https://www.postdocacademy.org/'),
  ('career', 'WOOP goal-setting method', 'WOOP',
    'Try out this goal-setting method.',
    'https://woopmylife.org/'),
  ('career', 'Stanford Meaningful Work Kit', 'Stanford University',
    'An asynchronous planning tool.',
    'https://mwk.stanford.edu/'),
  ('career', 'myIDP', 'Science Careers',
    'Asynchronous planning tool for STEM disciplines.',
    'https://myidp.sciencecareers.org/'),
  ('career', 'ImaginePhD', 'ImaginePhD',
    'Asynchronous planning tool for the social sciences and humanities.',
    'https://www.imaginephd.com/'),
  ('career', 'Designing Your Career', 'Office of Career Strategy',
    'Yale OCS online planning tool.',
    'https://ocs.yale.edu/designing-your-career/'),

  -- 3.6.1 Communication skills, grants & funding and teaching development
  ('skills', 'Graduate Writing Lab', 'Poorvu Center for Teaching and Learning',
    'Sign up for the newsletter for resources and events.',
    'https://poorvucenter.yale.edu/writing/graduate-writing-lab/the-graduate-writing-lab-newsletter'),
  ('skills', 'Writing consultations', 'Poorvu Center for Teaching and Learning',
    'Sign up for feedback on a piece of writing, including application materials.',
    'https://poorvucenter.yale.edu/writing/graduate-writing-lab/writing-consultations'),
  ('skills', 'Poorvu Center for Teaching and Learning', 'Poorvu Center for Teaching and Learning',
    'Sign up for the newsletter to learn about teaching events and the postdoc teaching certificate.',
    'https://poorvucenter.yale.edu/'),
  ('skills', 'English Language Program', 'Center for Language Study',
    'Check out the website and sign up for a class at the start of next semester.',
    'https://cls.yale.edu/programs/english-language-program'),
  ('skills', 'Yale Workday Learning', 'Yale HR',
    'Courses addressing many skill areas, including leadership and management.',
    'https://your.yale.edu/working-at-yale/learn-grow/learning'),
  ('skills', 'OPA funding opportunities', 'Office of Postdoctoral Affairs',
    'Review for funding opportunities.',
    'https://postdocs.yale.edu/professional-career-development/postdoctoral-appointment/funding-opportunities'),
  ('skills', 'Communication skills', 'Office of Postdoctoral Affairs',
    'OPA webpage with ideas and resources.',
    'https://postdocs.yale.edu/professional-career-development/postdoctoral-appointment/communication-skills'),

  -- 3.6.1 Leadership, mentorship & management and 4.1
  ('leadership', 'Leadership and management skills', 'Office of Postdoctoral Affairs',
    'OPA webpage with resources, including asynchronous online courses.',
    'https://postdocs.yale.edu/professional-career-development/postdoctoral-appointment/leadership-and-management-skills'),
  ('leadership', 'OPA programming', 'Office of Postdoctoral Affairs',
    'The LMAP online program each spring, Practicing Leadership in person each fall, and one-off in-person workshops each fall.',
    'https://yaleconnect.yale.edu/feeds?type=club&type_id=61914&tab=about'),
  ('leadership', 'YPA Buddy Program', 'Yale Postdoc Association',
    'From the YPA Mentorship Committee.',
    'https://ypa.yale.edu/committees/mentorship-committee/buddy-program'),

  -- 2.4 Wellness resources
  ('wellness', 'Optum Support', 'Yale benefits',
    'Emotional wellbeing support.',
    'https://supportfinder.optum.com/yalesb/login?callbackUrl=%2Fyalesb'),
  ('wellness', 'Dedicated onsite counselors', 'Yale benefits',
    'Mental health consultations.',
    'https://your.yale.edu/working-at-yale/benefits/your-well-being/emotional-well-being-solutions/onsite-counseling-sessions'),
  ('wellness', 'Yale emotional well-being resources', 'Yale benefits',
    'Talkspace (virtual appointments with a licensed therapist) and the Calm app, free.',
    'https://your.yale.edu/working-at-yale/benefits/your-well-being/emotional-well-being-solutions'),
  ('wellness', 'Being Well at Yale', 'Being Well at Yale',
    'Health education info sessions and articles.',
    'https://beingwell.yale.edu/'),
  ('wellness', 'Being Well at Yale events', 'Being Well at Yale',
    'Office yoga, drop-in meditation, and more.',
    'https://beingwell.yale.edu/calendar'),
  ('wellness', 'Being Well at Yale programs', 'Being Well at Yale',
    'Programs in stress reduction, weight management, nutrition, and more.',
    'https://beingwell.yale.edu/programs'),
  ('wellness', 'Collective Wellbeing resources', 'Being Well at Yale',
    '',
    'https://beingwell.yale.edu/collective-well-being'),
  ('wellness', 'Physical activity resources', 'Being Well at Yale',
    '',
    'https://beingwell.yale.edu/physical-activity'),
  ('wellness', 'Payne Whitney Gymnasium', 'Yale Campus Recreation',
    'Central campus. Monthly fee.',
    'https://recreation.yale.edu/pwg/pwgmemberships/pwg-memberships'),
  ('wellness', 'Yale New Haven Hospital Fitness Center', 'Yale New Haven Hospital',
    'Medical campus. Monthly fee.',
    'https://medicine.yale.edu/news-article/ysm-community-eligible-to-join-the-ynhh-fitness-center/'),
  ('wellness', 'Yale Campus Recreation', 'Yale Campus Recreation',
    'Sports, fitness classes, and more.',
    'https://recreation.yale.edu/'),

  -- 2.3 Time management resources
  ('time', 'Time blocking', 'Todoist',
    'Approach: plan your day as blocks of time set aside for specific tasks.',
    'https://www.todoist.com/productivity-methods/time-blocking'),
  ('time', 'Eisenhower Matrix', 'Todoist',
    'Approach: sort tasks by how urgent and how important they are.',
    'https://www.todoist.com/productivity-methods/eisenhower-matrix'),
  ('time', 'Pomodoro Technique', 'Todoist',
    'Approach: work in short, focused intervals with breaks in between.',
    'https://www.todoist.com/productivity-methods/pomodoro-technique'),
  ('time', 'Getting Things Done (GTD)', 'Todoist',
    'Approach: capture everything on your plate and turn it into next actions.',
    'https://www.todoist.com/productivity-methods/getting-things-done'),
  ('time', 'Microsoft To Do', 'Microsoft',
    'Tool: task lists.',
    'https://to-do.office.com/tasks/'),
  ('time', 'Notion', 'Notion',
    'Tool: notes, documents, and planning.',
    'https://www.notion.com/desktop'),
  ('time', 'Monday', 'monday.com',
    'Tool: work and project management.',
    'https://monday.com/'),
  ('time', 'Todoist', 'Todoist',
    'Tool: task lists.',
    'https://www.todoist.com/'),

  -- 4.1 Yale Postdoc Associations and 4.2 Community & belonging
  ('community', 'Yale Postdoc Association (YPA)', 'Yale Postdoc Association',
    'The YPA webpage.',
    'https://ypa.yale.edu/'),
  ('community', 'Yale Postdoc Association events', 'Yale Postdoc Association',
    'Join YPA on Yale Connect to see its events, and attend one!',
    'https://yaleconnect.yale.edu/PDYPA/club_signup'),
  ('community', 'YPA Slack channel', 'Yale Postdoc Association',
    'Join to connect with other postdocs and ask for ideas.',
    'https://ypa-yale.slack.com/join/shared_invite/enQtODM3Mjc0NDg3MTU5LTFjZDA4ZGUwYjEwMzdkNmQzMjFkMTY2NDhjYTVhMTY1MmRiMTIwNWM1MjIyM2JmNTU3ZjRhZDVjYTYxZDYyNzI'),
  ('community', 'YPA Welcome to Yale page', 'Yale Postdoc Association',
    'A guide for postdocs who are new to Yale.',
    'https://docs.google.com/document/d/1Yq_jvbiUsewjDPfwoMLNnSQUfBR77hZixivyU9btYi4/edit?tab=t.0'),
  ('community', 'Yale Black Postdoc Association (YBPA)', 'Yale Black Postdoc Association',
    'The YBPA webpage.',
    'https://medicine.yale.edu/ybpa/'),
  ('community', 'Yale Black Postdoc Association events', 'Yale Black Postdoc Association',
    'Join YBPA on Yale Connect to see its events, and attend one!',
    'https://yaleconnect.yale.edu/PDYBPDA/club_signup'),
  ('community', 'Social & Affinity Groups at Yale', 'Yale Postdoc Association',
    'Check out events offered by social and affinity groups.',
    'https://ypa.yale.edu/resources/social-and-affinity-groups'),
  ('community', 'Yale Connect', 'Yale',
    'Look up events and groups across campus.',
    'https://yaleconnect.yale.edu/home_login');

-- Make someone an admin ---------------------------------------------------
--
-- Run this (with their email) in the SQL Editor. They need to sign out and in
-- again afterwards, since the role is read from their session token.
--
--   update auth.users
--   set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
--   where email = 'someone@yale.edu';
