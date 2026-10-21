import { addDays, addMonths, daysBetween } from '#/lib/dates'

/**
 * How far into the appointment `today` is. The start date is day 1 of week 1,
 * so both are 0 or less before it.
 */
export function planPosition(
  start: Date,
  today: Date,
): { week: number; day: number } {
  const days = daysBetween(start, today)
  return { week: Math.floor(days / 7) + 1, day: days + 1 }
}

/** The first and last day of a week of the plan. */
export function weekRange(start: Date, week: number): [Date, Date] {
  return [addDays(start, (week - 1) * 7), addDays(start, week * 7 - 1)]
}

/** The Initial IDP meeting with the faculty mentor is 3 months in. */
export function idpMeetingDate(start: Date): Date {
  return addMonths(start, 3)
}
