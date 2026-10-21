// Published events from OPA and other Yale offices.
// TODO: from the backend, where OPA staff publish them

export type EventCategory =
  'orientation' | 'career' | 'wellness' | 'community' | 'international'

export type YaleEvent = {
  id: string
  title: string
  /** 'YYYY-MM-DD' */
  date: string
  /** 24-hour 'HH:MM' */
  start: string
  end: string
  location: string
  category: EventCategory
  host: string
  description: string
  /** The organizer's registration page. */
  link: string
}

// TODO: real registration links
export const EVENTS: YaleEvent[] = [
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
    link: '#',
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
    link: '#',
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
    link: '#',
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
    link: '#',
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
    link: '#',
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
    link: '#',
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
    link: '#',
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
    link: '#',
  },
]
