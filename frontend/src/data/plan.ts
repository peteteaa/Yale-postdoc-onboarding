// The first-year plan: the onboarding checklist plus the workbook's IDP steps,
// as points on a timeline counted from the appointment start date, the way
// the Initial IDP worksheet counts ("within the first three months of
// appointment").

import type { PhaseId } from '#/data/checklist'

/** A date counted from the start date or from the orientation session. */
export type PlanOffset = {
  from: 'start' | 'orientation'
} & ({ days: number } | { months: number })

/** A labeled point on the timeline, like "Week 1". */
export type PlanPoint = {
  id: string
  label: string
  /** What happens then, when the label alone doesn't say. */
  detail?: string
  at: PlanOffset
  /** Checklist phases whose tasks belong here. */
  checklistPhases: PhaseId[]
}

/** A workbook step. It goes on the first point on or after its date. */
export type PlanItem = {
  id: string
  title: string
  due: PlanOffset
  /** How the workbook words the deadline. */
  dueText: string
  /** A point to put it on instead. */
  point?: string
}

// The checklist's phases, then the IDP timeline's. Points with nothing on
// them for this postdoc (Day 3 for domestic postdocs) are left out.
export const PLAN_POINTS: PlanPoint[] = [
  {
    id: 'day-1',
    label: 'Day 1',
    at: { from: 'start', days: 0 },
    checklistPhases: ['first-day'],
  },
  {
    id: 'day-3',
    label: 'Day 3',
    at: { from: 'start', days: 2 },
    checklistPhases: ['intl-first-3-days'],
  },
  {
    id: 'week-1',
    label: 'Week 1',
    at: { from: 'start', days: 6 },
    checklistPhases: ['first-week'],
  },
  {
    id: 'month-1',
    label: 'Month 1',
    at: { from: 'start', days: 30 },
    checklistPhases: ['first-30-days', 'intl-first-30-days'],
  },
  {
    id: 'orientation',
    label: 'Orientation',
    at: { from: 'orientation', days: 0 },
    checklistPhases: [],
  },
  {
    id: 'month-3',
    label: 'Month 3',
    detail: 'Initial IDP',
    at: { from: 'start', months: 3 },
    checklistPhases: [],
  },
  {
    id: 'month-6',
    label: 'Month 6',
    detail: 'Progress review',
    at: { from: 'start', months: 6 },
    checklistPhases: [],
  },
  {
    id: 'month-9',
    label: 'Month 9',
    detail: 'Update your IDP',
    at: { from: 'start', months: 9 },
    checklistPhases: [],
  },
]

// The workbook counts some steps from orientation, so they keep that rule and
// land wherever their date falls.
export const PLAN_ITEMS: PlanItem[] = [
  {
    id: 'orientation',
    title: 'Attend Postdoc Orientation',
    due: { from: 'orientation', days: 0 },
    dueText: 'Your orientation session',
    point: 'orientation',
  },
  {
    // Workbook 2.3
    id: 'boundaries',
    title: 'Plan boundaries and time management',
    due: { from: 'orientation', days: 28 },
    dueText: 'Within 4 weeks of orientation',
  },
  {
    // Workbook 1.3.1 and 1.3.2
    id: 'role-and-goals',
    title: 'Add detail to your role and postdoc goals',
    due: { from: 'orientation', days: 56 },
    dueText: 'Within 8 weeks of orientation',
  },
  {
    // Initial IDP worksheet, and the "3 Months" row of its timeline
    id: 'idp-meeting',
    title: 'Share your Initial IDP with your mentor and meet',
    due: { from: 'start', months: 3 },
    dueText: 'Within your first three months',
    point: 'month-3',
  },
  {
    // "6 Months" row of the IDP timeline
    id: 'six-month-review',
    title: 'Review progress and adjust your goals',
    due: { from: 'start', months: 6 },
    dueText: 'At 6 months',
    point: 'month-6',
  },
  {
    // "9 Months" row of the IDP timeline
    id: 'nine-month-review',
    title: 'Review achievements and update your IDP for next year',
    due: { from: 'start', months: 9 },
    dueText: 'At 9 months',
    point: 'month-9',
  },
]
