// Dates here are calendar days at midnight UTC, so time zones and daylight
// saving can't move a due date by a day.

const DAY_MS = 24 * 60 * 60 * 1000

/** Parses a 'YYYY-MM-DD' string as a calendar date. */
export function parseDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/**
 * The nth working day (Monday to Friday), counting `start` as day 1 if it's a
 * weekday. `n` must be 1 or more.
 */
export function nthWorkday(start: Date, n: number): Date {
  let date = start
  let count = 0
  for (;;) {
    const weekday = date.getUTCDay()
    if (weekday !== 0 && weekday !== 6) count++
    if (count === n) return date
    date = addDays(date, 1)
  }
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS)
}

const SHORT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})
const WITH_YEAR = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

/** "Sep 1", or "Sep 1, 2026" with `withYear`. */
export function formatDate(date: Date, withYear = false): string {
  return (withYear ? WITH_YEAR : SHORT).format(date)
}

/** The same day of the month, `months` later. */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setUTCMonth(result.getUTCMonth() + months)
  return result
}

/** "Oct 6–12", or "Sep 29 – Oct 5" across two months. */
export function formatRange(from: Date, to: Date): string {
  if (from.getUTCMonth() === to.getUTCMonth())
    return `${formatDate(from)}–${to.getUTCDate()}`
  return `${formatDate(from)} – ${formatDate(to)}`
}
