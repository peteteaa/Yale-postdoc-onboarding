// The first-year plan: the onboarding checklist plus the workbook's IDP steps,
// grouped into phases counted from the appointment start date, the way the
// Initial IDP worksheet counts ("within the first three months of
// appointment").

import type { PhaseId } from '#/data/checklist'

/** A date counted from the start date or from the orientation session. */
export type PlanOffset = {
  from: 'start' | 'orientation'
} & ({ days: number } | { months: number })

export type PlanPhase = {
  id: string
  title: string
  /** The phase's last day, or later if one of its tasks is due later. */
  ends: PlanOffset
  /** Checklist phases whose tasks belong here. */
  checklistPhases: PhaseId[]
}

/** A workbook step, placed in the phase its date falls in. */
export type PlanItem = {
  id: string
  title: string
  due: PlanOffset
  /** How the workbook words the deadline. */
  dueText: string
}

export const PLAN_PHASES: PlanPhase[] = [
  {
    id: 'first-day',
    title: 'First day',
    ends: { from: 'start', days: 0 },
    checklistPhases: ['first-day'],
  },
  {
    id: 'first-week',
    title: 'First week',
    ends: { from: 'start', days: 6 },
    checklistPhases: ['first-week', 'intl-first-3-days'],
  },
  {
    id: 'first-30-days',
    title: 'First 30 days',
    ends: { from: 'start', days: 30 },
    checklistPhases: ['first-30-days', 'intl-first-30-days'],
  },
  {
    id: 'months-2-3',
    title: 'Months 2–3',
    ends: { from: 'start', months: 3 },
    checklistPhases: [],
  },
  {
    id: 'months-4-6',
    title: 'Months 4–6',
    ends: { from: 'start', months: 6 },
    checklistPhases: [],
  },
  {
    id: 'months-7-9',
    title: 'Months 7–9',
    ends: { from: 'start', months: 9 },
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
  },
  {
    // "6 Months" row of the IDP timeline
    id: 'six-month-review',
    title: 'Review progress and adjust your goals',
    due: { from: 'start', months: 6 },
    dueText: 'At 6 months',
  },
  {
    // "9 Months" row of the IDP timeline
    id: 'nine-month-review',
    title: 'Review achievements and update your IDP for next year',
    due: { from: 'start', months: 9 },
    dueText: 'At 9 months',
  },
]
