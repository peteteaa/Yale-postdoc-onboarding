// The signed-in postdoc's profile and saved progress.
// TODO: from the backend. This is the mockup's sample postdoc, Priya Raman.

import type { Visa } from '#/data/checklist'
import { parseDate } from '#/lib/dates'

export const FULL_NAME = 'Priya Raman'
export const FIRST_NAME = 'Priya'
export const START_DATE = parseDate('2026-09-01')
export const VISA: Visa = 'j1'

/** Ids of the checklist tasks that are checked off. */
export const INITIALLY_DONE = [
  'i9-form',
  'i9-documents',
  'netid',
  'id-card',
  'first-meetings',
  'trainings',
  'benefits',
  'vaccines',
  'oiss-orientation',
  'oiss-check-in',
  'ssn-apply',
  'tax-office',
]

/** First-year plan weeks marked done. */
export const WEEKS_DONE = [1, 2, 3]

// TODO: count from the workbook answers once the workbook exists
export const WORKBOOK_PROGRESS = { done: 3, total: 7 }

// TODO: use the real date. Fixed so the pages match the mockup's sample data.
export const TODAY = parseDate('2026-10-11')
