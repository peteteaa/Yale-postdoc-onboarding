// Postdoc progress shown to OPA staff. Completion status only: workbook
// answers and IDPs are private to the postdoc and never appear here.
// Stored in the Supabase `profiles` and `checklist_progress` tables (see
// supabase/migrations).

import type { Visa } from '#/data/checklist'

// TODO: from the workbook content once the Workbook page exists
export const WORKBOOK_MODULES = 7

/** A postdoc's appointment details, which they enter in Settings. */
export type Profile = {
  fullName: string
  /** '' until they have one. */
  netId: string
  department: string
  /** Appointment start date, 'YYYY-MM-DD'. Due dates count from this. */
  start: string
  visa: Visa
}

/** One postdoc on the admin Completion overview. */
export type PostdocProgress = Profile & {
  userId: string
  /** Ids of the checklist tasks they've checked off. */
  done: string[]
  /** 'YYYY-MM-DD', in New Haven: when they last saved their profile or checked or unchecked a task. */
  lastActive: string
}
