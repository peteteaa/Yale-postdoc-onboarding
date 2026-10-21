import { Pill } from '#/components/Pill'
import { StatusIcon } from '#/components/StatusIcon'
import type { ChecklistTask } from '#/data/checklist'
import type { TaskStatus } from '#/lib/checklist'
import { formatDate } from '#/lib/dates'

/** A checklist task's deadline: done, overdue, due soon, or the date. */
export function DueInfo({
  task,
  status,
}: {
  task: ChecklistTask
  status: TaskStatus
}) {
  switch (status.kind) {
    case 'done':
      return (
        <span className="inline-flex items-center gap-1.75">
          <StatusIcon status="done" />
          Done
        </span>
      )
    case 'overdue':
      return (
        <>
          <Pill variant="overdue">Overdue</Pill>
          <span className="font-semibold text-late">
            Was due {formatDate(status.due)}
          </span>
        </>
      )
    case 'suggested':
      return <span>Suggested by {formatDate(status.due)}</span>
    case 'due-soon':
      return (
        <>
          <Pill variant="due-soon">
            {status.daysLeft === 0
              ? 'Due today'
              : `Due in ${status.daysLeft} ${status.daysLeft === 1 ? 'day' : 'days'}`}
          </Pill>
          <span>{formatDate(status.due)}</span>
        </>
      )
    case 'open':
      if (!status.due) return <span>{task.dueText}</span>
      return (
        <span>
          {task.dueText
            ? `${task.dueText} · ${formatDate(status.due)}`
            : `Due ${formatDate(status.due)}`}
        </span>
      )
  }
}
