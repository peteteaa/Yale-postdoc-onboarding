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

const MONTH = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** "Sep 1", or "Sep 1, 2026" with `withYear`. */
export function formatDate(date: Date, withYear = false): string {
  return (withYear ? WITH_YEAR : SHORT).format(date)
}

/** "September 2026" */
export function formatMonth(date: Date): string {
  return MONTH.format(date)
}

/**
 * "12:00–1:00 pm", or "11:30 am–1:00 pm" when the times are on either side of
 * noon. Takes 24-hour 'HH:MM' times. `end` can be ''.
 */
export function formatTimeRange(start: string, end: string): string {
  if (!start) return ''
  const parts = (time: string) => {
    const [hour, minute] = time.split(':').map(Number)
    return {
      time: `${hour % 12 || 12}:${String(minute).padStart(2, '0')}`,
      period: hour >= 12 ? 'pm' : 'am',
    }
  }
  const from = parts(start)
  if (!end) return `${from.time} ${from.period}`
  const to = parts(end)
  return from.period === to.period
    ? `${from.time}–${to.time} ${to.period}`
    : `${from.time} ${from.period}–${to.time} ${to.period}`
}
