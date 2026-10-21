import { addDays, daysBetween, nthWorkday } from '#/lib/dates'
import type { Status } from '#/components/StatusIcon'
import type { ChecklistTask, Visa } from '#/data/checklist'

/** Whether a task shows for someone with this visa status. */
export function appliesTo(task: ChecklistTask, visa: Visa): boolean {
  switch (task.audience) {
    case 'everyone':
      return true
    case 'international':
      return visa !== 'domestic'
    case 'j1':
      return visa === 'j1'
  }
}

/** The task's due date for this start date, or null if it has no fixed date. */
export function dueDate(task: ChecklistTask, start: Date): Date | null {
  if (!task.due) return null
  return 'days' in task.due
    ? addDays(start, task.due.days)
    : nthWorkday(start, task.due.workdays)
}

export type TaskStatus =
  | { kind: 'done' }
  | { kind: 'overdue'; due: Date }
  /** An optional task whose date has passed. */
  | { kind: 'suggested'; due: Date }
  /** Due today or within the next 7 days. */
  | { kind: 'due-soon'; due: Date; daysLeft: number }
  | { kind: 'open'; due: Date | null }

export function taskStatus(
  task: ChecklistTask,
  { start, today, done }: { start: Date; today: Date; done: boolean },
): TaskStatus {
  if (done) return { kind: 'done' }
  const due = dueDate(task, start)
  if (!due) return { kind: 'open', due: null }
  const daysLeft = daysBetween(today, due)
  if (daysLeft < 0)
    return task.required ? { kind: 'overdue', due } : { kind: 'suggested', due }
  if (daysLeft <= 7) return { kind: 'due-soon', due, daysLeft }
  return { kind: 'open', due }
}

/** The status icon for a group of tasks, such as a phase. */
export function groupStatus(statuses: TaskStatus[]): Status {
  const doneCount = statuses.filter((s) => s.kind === 'done').length
  if (doneCount === statuses.length) return 'done'
  if (statuses.some((s) => s.kind === 'overdue')) return 'overdue'
  return doneCount > 0 ? 'in-progress' : 'not-started'
}

/**
 * The open task to do next: overdue tasks first, then required ones, then
 * optional ones, soonest due first within each.
 */
export function nextTask<T extends { task: ChecklistTask; status: TaskStatus }>(
  rows: T[],
): T | undefined {
  const rank = ({ task, status }: T) =>
    status.kind === 'overdue' ? 0 : task.required ? 1 : 2
  const dueTime = ({ status }: T) =>
    'due' in status && status.due ? status.due.getTime() : Infinity
  return rows
    .filter((row) => row.status.kind !== 'done')
    .sort((a, b) => rank(a) - rank(b) || dueTime(a) - dueTime(b))[0]
}
