// The first-year plan: one short activity a week for the first 12 weeks,
// leading up to the Initial IDP meeting at 3 months.

export type PlanWeek = {
  title: string
  description: string
  suggestedTime: string
  /** The workbook section to open, e.g. "2.3". */
  workbookSection?: string
  /** The page to open when there's no workbook section. */
  page?: 'Events & programs' | 'IDP builder'
}

/** Index 0 is week 1. */
export const PLAN_WEEKS: PlanWeek[] = [
  {
    title: 'Wellness: plan what you want to explore',
    description:
      'Look over the wellness resources and write down your emotional and physical wellbeing goals.',
    suggestedTime: '1 hour',
    workbookSection: '2.4',
  },
  {
    title: 'Community: pick groups and events to try',
    description:
      'Choose ways to connect outside your lab, such as YPA, YBPA, or Yale Connect.',
    suggestedTime: '1 hour',
    workbookSection: '4.2',
  },
  {
    title: 'Skills: choose skills and resources to explore',
    description:
      'Pick the skills you want to build and the resources that can help.',
    suggestedTime: '1 hour',
    workbookSection: '3.6',
  },
  {
    title: 'Career: choose actions for your career stage',
    description:
      'Pick your stage of career exploration and a few first actions.',
    suggestedTime: '1 hour',
    workbookSection: '1.4.3',
  },
  {
    title: 'Add detail to your role and goals',
    description:
      'Fill in the “add more detail” parts of your projects and goals.',
    suggestedTime: '30–60 min',
    workbookSection: '1.3',
  },
  {
    title: 'Boundaries, time management, and a wellness check-in',
    description:
      'Fill out the boundary-setting section and look at the time-management resources. Then check in on the wellness goals you set in week 1.',
    suggestedTime: '30–60 min',
    workbookSection: '2.3',
  },
  {
    title: 'Community check-in and an event',
    description:
      'Think about the groups you’ve tried so far, then sign up for an event.',
    suggestedTime: '30 min',
    page: 'Events & programs',
  },
  {
    title: 'Review your skills and career priorities',
    description:
      'Look back at the skills and career steps you chose. Find resources or people for the ones that still need work.',
    suggestedTime: '60–90 min',
    workbookSection: '3.6',
  },
  {
    title: 'Schedule your Initial IDP meeting',
    description:
      'Book the meeting with your faculty mentor and fill in IDP sections 1–3.',
    suggestedTime: '30–60 min',
    page: 'IDP builder',
  },
  {
    title: 'Fill in IDP sections 4–8',
    description:
      'The skills, milestones, and career sections of your Initial IDP.',
    suggestedTime: '60–90 min',
    page: 'IDP builder',
  },
  {
    title: 'Your mentoring needs and mentoring team',
    description:
      'Note where you want mentoring support and who else could mentor you.',
    suggestedTime: '30–60 min',
    workbookSection: '3.3',
  },
  {
    title: 'Finalize and share your IDP',
    description:
      'Make final changes and send your IDP to your mentor before the meeting.',
    suggestedTime: '60–90 min',
    page: 'IDP builder',
  },
]
