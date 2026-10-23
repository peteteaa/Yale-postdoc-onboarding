// Events that OPA staff publish to the postdoc Events & programs page.

export type EventCategory =
  'orientation' | 'career' | 'wellness' | 'community' | 'international'

export const EVENT_CATEGORIES: Record<EventCategory, string> = {
  orientation: 'Orientation',
  career: 'Career',
  wellness: 'Wellness',
  community: 'Community',
  international: 'International',
}

/** Drafts are only visible to staff. */
export type EventStatus = 'published' | 'draft'

export type PostdocEvent = {
  id: string
  title: string
  /** 'YYYY-MM-DD' */
  date: string
  /** 'HH:MM', 24-hour */
  start: string
  /** 'HH:MM', 24-hour, or '' when there's no set end time. */
  end: string
  location: string
  category: EventCategory
  /** The office or group running the event. */
  host: string
  description: string
  /** Registration page, or '' when no registration is needed. */
  link: string
  status: EventStatus
}

// TODO: load from the backend. Sample events from the mockup.
export const SAMPLE_EVENTS: PostdocEvent[] = [
  {
    id: 'e1',
    title: 'Initial IDP: How to Get Started',
    date: '2026-10-14',
    start: '12:00',
    end: '13:00',
    location: 'Online (Zoom)',
    category: 'career',
    host: 'Office of Postdoctoral Affairs',
    description:
      'A walkthrough of the Initial IDP worksheet and how to prepare for your 3-month meeting with your mentor.',
    link: 'https://example.com/idp',
    status: 'published',
  },
  {
    id: 'e2',
    title: 'Tax Basics for International Scholars',
    date: '2026-10-15',
    start: '16:00',
    end: '17:00',
    location: 'Online',
    category: 'international',
    host: 'OISS',
    description:
      'Which tax forms to file and when, for J-1 and F-1 OPT scholars.',
    link: 'https://example.com/tax',
    status: 'published',
  },
  {
    id: 'e3',
    title: 'Drop-in Meditation',
    date: '2026-10-16',
    start: '12:15',
    end: '12:45',
    location: 'Central campus',
    category: 'wellness',
    host: 'Being Well at Yale',
    description: 'A 30-minute guided session. No experience needed.',
    link: 'https://example.com/meditation',
    status: 'published',
  },
  {
    id: 'e4',
    title: 'YPA Fall Mixer',
    date: '2026-10-20',
    start: '17:30',
    end: '19:30',
    location: 'Science Hill',
    category: 'community',
    host: 'Yale Postdoc Association',
    description: 'Meet postdocs from other departments. Food provided.',
    link: 'https://example.com/mixer',
    status: 'published',
  },
  {
    id: 'e5',
    title: 'Practicing Leadership: Leading Without Authority',
    date: '2026-10-22',
    start: '15:00',
    end: '16:30',
    location: 'Central campus',
    category: 'career',
    host: 'Office of Postdoctoral Affairs',
    description:
      'Part of OPA’s fall leadership program. Practice moving projects forward when you aren’t the one in charge.',
    link: 'https://example.com/leadership',
    status: 'published',
  },
  {
    id: 'e6',
    title: 'Academic Job Search: Research Statements',
    date: '2026-10-28',
    start: '12:00',
    end: '13:00',
    location: 'Online',
    category: 'career',
    host: 'Office of Career Strategy',
    description: 'What search committees look for, with sample statements.',
    link: 'https://example.com/research-statements',
    status: 'published',
  },
  {
    id: 'e7',
    title: 'YBPA Community Lunch',
    date: '2026-11-04',
    start: '12:00',
    end: '13:30',
    location: 'Medical campus',
    category: 'community',
    host: 'Yale Black Postdoc Association',
    description: 'Monthly lunch and conversation. All postdocs welcome.',
    link: 'https://example.com/ybpa-lunch',
    status: 'published',
  },
  {
    id: 'e8',
    title: 'Winter New Postdoc Orientation',
    date: '2027-01-14',
    start: '09:00',
    end: '12:00',
    location: 'Online and in person',
    category: 'orientation',
    host: 'Office of Postdoctoral Affairs',
    description:
      'For postdocs starting in December or January. Covers benefits, the workbook, and the Initial IDP.',
    link: 'https://example.com/orientation',
    status: 'published',
  },
  {
    id: 'e9',
    title: 'Spring Career Symposium',
    date: '2027-03-18',
    start: '13:00',
    end: '17:00',
    location: 'Central campus',
    category: 'career',
    host: 'Office of Postdoctoral Affairs',
    description: 'Panels on academic and non-academic careers.',
    link: '',
    status: 'draft',
  },
]
