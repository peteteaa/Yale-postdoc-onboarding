import type { Status } from '#/components/StatusIcon'
import type { Visa } from '#/data/checklist'
import { TASKS } from '#/data/checklist'
import type { PlanOffset, PlanPoint } from '#/data/plan'
import { PLAN_ITEMS, PLAN_POINTS } from '#/data/plan'
import type { TaskStatus } from '#/lib/checklist'
import { appliesTo, dueDate, dueStatus } from '#/lib/checklist'
import { addDays, addMonths } from '#/lib/dates'

/** A checklist task or workbook step, as the plan lists it. */
export type PlanRow = {
  id: string
  title: string
  due: Date | null
  dueText?: string
  status: TaskStatus
}

export type PlanPointView = {
  point: PlanPoint
  date: Date
  rows: PlanRow[]
  status: Status
  /** The first point on or after today. At most one point is next. */
  next: boolean
}

export function planDate(
  offset: PlanOffset,
  { start, orientation }: { start: Date; orientation: Date },
): Date {
  const from = offset.from === 'start' ? start : orientation
  return 'months' in offset
    ? addMonths(from, offset.months)
    : addDays(from, offset.days)
}

/**
 * The first-year plan for one postdoc, as timeline points in date order.
 * Checklist tasks go on their phase's point; workbook steps go on their own
 * point, or else the first point on or after their date. A point is done only
 * when everything on it is marked done, never just because its date has
 * passed.
 */
export function buildPlan({
  start,
  orientation,
  today,
  visa,
  done,
}: {
  start: Date
  orientation: Date
  today: Date
  visa: Visa
  /** Ids of the checklist tasks and plan items marked done. */
  done: Set<string>
}): PlanPointView[] {
  const dates = { start, orientation }
  // Orientation can fall anywhere, so sort. Ties keep the listed order.
  const points = PLAN_POINTS.map((point) => ({
    point,
    date: planDate(point.at, dates),
    rows: [] as PlanRow[],
  })).sort((a, b) => a.date.getTime() - b.date.getTime())

  for (const task of TASKS) {
    if (!appliesTo(task, visa)) continue
    const due = dueDate(task, start)
    points
      .find(({ point }) => point.checklistPhases.includes(task.phase))
      ?.rows.push({
        id: task.id,
        title: task.title,
        due,
        dueText: task.dueText,
        status: dueStatus(due, {
          today,
          done: done.has(task.id),
          required: task.required,
        }),
      })
  }

  for (const item of PLAN_ITEMS) {
    const due = planDate(item.due, dates)
    const target =
      points.find(({ point }) => point.id === item.point) ??
      points.find(({ date }) => due <= date) ??
      points[points.length - 1]
    target.rows.push({
      id: item.id,
      title: item.title,
      due,
      dueText: item.dueText,
      // The workbook and Initial IDP are optional, so a missed step is
      // never overdue
      status: dueStatus(due, {
        today,
        done: done.has(item.id),
        required: false,
      }),
    })
  }

  const shown = points.filter(({ rows }) => rows.length > 0)
  const nextIndex = shown.findIndex(({ date }) => today <= date)
  return shown.map((p, i) => ({
    ...p,
    status: pointStatus(p.rows),
    next: i === nextIndex,
  }))
}

function pointStatus(rows: PlanRow[]): Status {
  const doneCount = rows.filter((row) => row.status.kind === 'done').length
  if (rows.length > 0 && doneCount === rows.length) return 'done'
  if (rows.some((row) => row.status.kind === 'overdue')) return 'overdue'
  return doneCount > 0 ? 'in-progress' : 'not-started'
}
