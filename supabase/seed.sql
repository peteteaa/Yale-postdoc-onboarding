-- Sample events from the mockup. Optional: run after the events migration to
-- have something to look at.

insert into public.events
  (title, date, start_time, end_time, location, category, host, description, link, status)
values
  ('Initial IDP: How to Get Started', '2026-10-14', '12:00', '13:00', 'Online (Zoom)', 'career', 'Office of Postdoctoral Affairs',
   'A walkthrough of the Initial IDP worksheet and how to prepare for your 3-month meeting with your mentor.', 'https://example.com/idp', 'published'),
  ('Tax Basics for International Scholars', '2026-10-15', '16:00', '17:00', 'Online', 'international', 'OISS',
   'Which tax forms to file and when, for J-1 and F-1 OPT scholars.', 'https://example.com/tax', 'published'),
  ('Drop-in Meditation', '2026-10-16', '12:15', '12:45', 'Central campus', 'wellness', 'Being Well at Yale',
   'A 30-minute guided session. No experience needed.', 'https://example.com/meditation', 'published'),
  ('YPA Fall Mixer', '2026-10-20', '17:30', '19:30', 'Science Hill', 'community', 'Yale Postdoc Association',
   'Meet postdocs from other departments. Food provided.', 'https://example.com/mixer', 'published'),
  ('Practicing Leadership: Leading Without Authority', '2026-10-22', '15:00', '16:30', 'Central campus', 'career', 'Office of Postdoctoral Affairs',
   'Part of OPA’s fall leadership program. Practice moving projects forward when you aren’t the one in charge.', 'https://example.com/leadership', 'published'),
  ('Academic Job Search: Research Statements', '2026-10-28', '12:00', '13:00', 'Online', 'career', 'Office of Career Strategy',
   'What search committees look for, with sample statements.', 'https://example.com/research-statements', 'published'),
  ('YBPA Community Lunch', '2026-11-04', '12:00', '13:30', 'Medical campus', 'community', 'Yale Black Postdoc Association',
   'Monthly lunch and conversation. All postdocs welcome.', 'https://example.com/ybpa-lunch', 'published'),
  ('Winter New Postdoc Orientation', '2027-01-14', '09:00', '12:00', 'Online and in person', 'orientation', 'Office of Postdoctoral Affairs',
   'For postdocs starting in December or January. Covers benefits, the workbook, and the Initial IDP.', 'https://example.com/orientation', 'published'),
  ('Spring Career Symposium', '2027-03-18', '13:00', '17:00', 'Central campus', 'career', 'Office of Postdoctoral Affairs',
   'Panels on academic and non-academic careers.', '', 'draft');
