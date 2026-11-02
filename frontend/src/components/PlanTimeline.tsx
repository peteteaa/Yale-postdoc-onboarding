import { DueInfo } from '#/components/Checklist'
import { Pill } from '#/components/Pill'
import { StatusIcon } from '#/components/StatusIcon'
import type { PlanPhaseView } from '#/lib/plan'
import { formatDate } from '#/lib/dates'

/**
 * The first-year plan as a list of phases, like a 30-60-90 day onboarding
 * plan. The phase today falls in is marked "Now" and shows its steps; the
 * others show how many of their steps are done.
 */
export function PlanTimeline({
  phases,
  start,
}: {
  phases: PlanPhaseView[]
  start: Date
}) {
  return (
    <section
      aria-labelledby="plan-h"
      className="rounded border border-card-line bg-paper p-4.5 shadow-card md:p-6"
    >
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="plan-h" className="text-h3">
          My first-year plan
        </h2>
        {/* TODO: link to My first-year plan once it's built */}
        <a href="#" className="text-small font-semibold">
          View my plan<span aria-hidden="true"> ›</span>
        </a>
      </div>
      <p className="mb-4 text-small text-ink-2">
        Counted from your start date, {formatDate(start, true)}.
      </p>
      <ol>
        {phases.map((view) => (
          <PhaseRow key={view.phase.id} view={view} />
        ))}
      </ol>
    </section>
  )
}

function PhaseRow({
  view: { phase, ends, rows, status, current },
}: {
  view: PlanPhaseView
}) {
  const doneCount = rows.filter((row) => row.status.kind === 'done').length
  const overdueCount = rows.filter(
    (row) => row.status.kind === 'overdue',
  ).length

  return (
    <li
      aria-current={current ? 'step' : undefined}
      className={`border-t border-line ${current ? 'rounded bg-wash' : ''}`}
    >
      <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-3">
        <StatusIcon status={status} />
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="font-semibold">{phase.title}</span>
          <span className="text-small text-ink-2">By {formatDate(ends)}</span>
          {current && <Pill variant="required">Now</Pill>}
        </p>
        <p className="text-right text-small text-ink-2 tabular-nums">
          {overdueCount > 0 && (
            <span className="font-semibold text-late">
              {overdueCount} overdue ·{' '}
            </span>
          )}
          {doneCount} of {rows.length} done
        </p>
      </div>
      {current && rows.length > 0 && (
        <ul className="px-3 pb-3 md:pl-11">
          {rows.map((row) => (
            <li
              key={row.id}
              className="border-t border-line py-2.5 first:border-t-0 first:pt-0"
            >
              <p
                className={`text-medium font-semibold ${row.status.kind === 'done' ? 'text-ink-2' : ''}`}
              >
                {row.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 text-small text-ink-2">
                <DueInfo task={row} status={row.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
