// First-year plan milestones, from the workbook's "IDP Development and Review
// Timeline" (Initial IDP worksheet) and the week-by-week plan in section 4.3.

/** When a milestone falls, counted from orientation. */
export type MilestoneOffset = { weeks: number } | { months: number }

export type Milestone = {
  id: string
  label: string
  offset: MilestoneOffset
  /** The Initial IDP meeting, which the rest of the plan builds up to. */
  key?: boolean
}

export const MILESTONES: Milestone[] = [
  { id: 'orientation', label: 'Orientation', offset: { weeks: 0 } },
  { id: 'month-1', label: '1 month', offset: { months: 1 } },
  // Week 9 of section 4.3: schedule the meeting and fill in IDP sections 1–3
  { id: 'week-9', label: 'Week 9: fill in IDP', offset: { weeks: 8 } },
  { id: 'idp-meeting', label: 'IDP meeting', offset: { months: 3 }, key: true },
  { id: 'month-6', label: '6 months', offset: { months: 6 } },
  { id: 'month-9', label: '9 months', offset: { months: 9 } },
]
