import type { Status } from '#/components/StatusIcon'
import type { Visa } from '#/data/checklist'
import { TASKS } from '#/data/checklist'
import type { PlanOffset, PlanPhase } from '#/data/plan'
import { PLAN_ITEMS, PLAN_PHASES } from '#/data/plan'
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

export type PlanPhaseView = {
  phase: PlanPhase
  ends: Date
  rows: PlanRow[]
  status: Status
  /** The phase today falls in. At most one phase is current. */
  current: boolean
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
 * The first-year plan for one postdoc. Checklist tasks go in their own
 * phase; workbook steps go in the first phase that hasn't ended by their date.
 * A phase is done only when everything in it is marked done, never just
 * because its dates have passed.
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
}): PlanPhaseView[] {
  const dates = { start, orientation }
  const phases = PLAN_PHASES.map((phase) => ({
    phase,
    ends: planDate(phase.ends, dates),
    rows: [] as PlanRow[],
  }))

  for (const task of TASKS) {
    if (!appliesTo(task, visa)) continue
    const due = dueDate(task, start)
    phases
      .find(({ phase }) => phase.checklistPhases.includes(task.phase))
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
    // Steps due after the last phase go in the last phase
    const phase =
      phases.find(({ ends }) => due <= ends) ?? phases[phases.length - 1]
    phase.rows.push({
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

  for (const p of phases) {
    // Dated rows in date order; ones with no fixed date last
    p.rows.sort(
      (a, b) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity),
    )
    // A phase lasts until its last task is due: "First day" holds the I-9
    // documents, due by the third working day
    for (const row of p.rows) if (row.due && row.due > p.ends) p.ends = row.due
  }

  const currentIndex = phases.findIndex(({ ends }) => today <= ends)
  return phases.map((p, i) => ({
    ...p,
    status: phaseStatus(p.rows),
    current: i === currentIndex,
  }))
}

function phaseStatus(rows: PlanRow[]): Status {
  const doneCount = rows.filter((row) => row.status.kind === 'done').length
  if (rows.length > 0 && doneCount === rows.length) return 'done'
  if (rows.some((row) => row.status.kind === 'overdue')) return 'overdue'
  return doneCount > 0 ? 'in-progress' : 'not-started'
}
