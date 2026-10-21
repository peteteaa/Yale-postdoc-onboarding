// Onboarding checklist content, from workbook sections 2.1 (everyone) and
// 2.2 (international scholars).

export type Visa = 'j1' | 'f1-opt' | 'domestic'

/** Who a task applies to. "international" means any visa holder. */
export type Audience = 'everyone' | 'international' | 'j1'

/** When a task is due, counted from the appointment start date. */
export type DueRule = { days: number } | { workdays: number }

export type PhaseId =
  | 'first-day'
  | 'first-week'
  | 'first-30-days'
  | 'intl-first-3-days'
  | 'intl-first-30-days'

export type Phase = {
  id: PhaseId
  title: string
  group: 'everyone' | 'international'
}

export type ChecklistTask = {
  id: string
  phase: PhaseId
  audience: Audience
  required: boolean
  title: string
  description: string
  /** null when there's no fixed date, only `dueText`. */
  due: DueRule | null
  /** How the workbook words the deadline, shown next to the date. */
  dueText?: string
  link?: { label: string; href: string }
}

export const PHASES: Phase[] = [
  { id: 'first-day', title: 'First day', group: 'everyone' },
  { id: 'first-week', title: 'First week', group: 'everyone' },
  { id: 'first-30-days', title: 'First 30 days', group: 'everyone' },
  { id: 'intl-first-3-days', title: 'First 3 days', group: 'international' },
  { id: 'intl-first-30-days', title: 'First 30 days', group: 'international' },
]

// TODO: OPA to confirm which tasks are required. The workbook doesn't say.
// TODO: real link URLs
export const TASKS: ChecklistTask[] = [
  {
    id: 'i9-form',
    phase: 'first-day',
    audience: 'everyone',
    required: true,
    title: 'Complete your I-9 form in Workday',
    description: 'Fill in your section of the I-9 in Workday.',
    due: { days: 0 },
    dueText: 'On or before your first day',
    link: { label: 'Workday', href: '#' },
  },
  {
    id: 'i9-documents',
    phase: 'first-day',
    audience: 'everyone',
    required: true,
    title: 'Bring your I-9 documents to the I-9 Center',
    description:
      'Bring unexpired documents to the I-9 Center at 221 Whitney Avenue. International scholars: finish the OISS check-in first.',
    due: { workdays: 3 },
    dueText: 'By your third working day',
    link: { label: 'I-9 Center details', href: '#' },
  },
  {
    id: 'netid',
    phase: 'first-week',
    audience: 'everyone',
    required: true,
    title: 'Activate your NetID and Yale email',
    description: 'You can do this once your I-9 is complete.',
    due: { days: 6 },
    link: { label: 'NetID activation', href: '#' },
  },
  {
    id: 'id-card',
    phase: 'first-week',
    audience: 'everyone',
    required: true,
    title: 'Get your Yale ID card',
    description: 'Go to either ID Center: 55 Lock Street or 333 Cedar Street.',
    due: { days: 6 },
    link: { label: 'ID Center hours', href: '#' },
  },
  {
    id: 'first-meetings',
    phase: 'first-week',
    audience: 'everyone',
    required: true,
    title:
      'Set up a first meeting with your faculty mentor and business office',
    description:
      "Contact your department's business office and your faculty mentor.",
    due: { days: 6 },
  },
  {
    id: 'trainings',
    phase: 'first-week',
    audience: 'everyone',
    required: true,
    title: 'Complete your required trainings in Workday Learning',
    description:
      'Which trainings you need depends on your role and department.',
    due: { days: 6 },
    link: { label: 'Workday Learning', href: '#' },
  },
  {
    id: 'benefits',
    phase: 'first-30-days',
    audience: 'everyone',
    required: true,
    title: 'Enroll in benefits in Workday',
    description: 'Health and vision insurance and your other benefits.',
    due: { days: 30 },
    dueText: 'Within 30 days of your start date',
    link: { label: 'Benefits overview', href: '#' },
  },
  {
    id: 'vaccines',
    phase: 'first-30-days',
    audience: 'everyone',
    required: true,
    title: 'Check whether your work requires vaccine records',
    description:
      'This depends on your work. Check the vaccine page and ask your department.',
    due: { days: 30 },
    link: { label: 'Vaccine requirements', href: '#' },
  },
  {
    id: 'livesafe',
    phase: 'first-30-days',
    audience: 'everyone',
    required: false,
    title: 'Download the LiveSafe app',
    description: "Yale's campus safety app.",
    due: { days: 30 },
  },
  {
    id: 'oiss-orientation',
    phase: 'intl-first-3-days',
    audience: 'j1',
    required: true,
    title: 'Attend the OISS New Scholar Orientation',
    description:
      'Required for J-1 scholars. All postdocs are welcome to attend.',
    due: { days: 2 },
    link: { label: 'OISS orientation', href: '#' },
  },
  {
    id: 'oiss-check-in',
    phase: 'intl-first-3-days',
    audience: 'j1',
    required: true,
    title: 'Complete the OISS New Scholar Check-In',
    description:
      'Report your U.S. address and upload your I-94 in OISS Connect, about 4 days before your I-9 appointment. This is online only.',
    due: null,
    dueText: 'Within 72 hours of arriving in the U.S.',
    link: { label: 'OISS Connect', href: '#' },
  },
  {
    id: 'ssn-apply',
    phase: 'intl-first-30-days',
    audience: 'international',
    required: true,
    title: 'Apply for a U.S. Social Security number',
    description:
      'OISS recommends waiting two weeks after your DS-2019 is validated. F-1 OPT scholars can apply up to 30 days before their start date.',
    due: { days: 30 },
    link: { label: 'SSN guide (OISS)', href: '#' },
  },
  {
    id: 'ssn-add',
    phase: 'intl-first-30-days',
    audience: 'international',
    required: true,
    title: 'Add your SSN through the Employee Service Center',
    description: 'Do this as soon as your Social Security number arrives.',
    due: { days: 30 },
    link: { label: 'Employee Service Center', href: '#' },
  },
  {
    id: 'tax-office',
    phase: 'intl-first-30-days',
    audience: 'international',
    required: true,
    title: 'Register with the International Tax Office and complete the FNIS',
    description: 'Both are required in your first 30 days.',
    due: { days: 30 },
    dueText: 'Within 30 days of starting',
    link: { label: 'International Tax Office', href: '#' },
  },
]
