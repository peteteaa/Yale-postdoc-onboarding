'use client'

import { Pill } from '#/components/Pill'
import type { Status } from '#/components/StatusIcon'
import type { PlanPointView } from '#/lib/plan'
import { formatDate } from '#/lib/dates'
import { useEffect, useRef } from 'react'

/**
 * The first-year plan as a row of points joined by a line, from Day 1 to
 * Month 9. When the row is wider than the card it scrolls sideways, starting
 * with the next point in view.
 */
export function PlanTimeline({
  points,
  start,
}: {
  points: PlanPointView[]
  start: Date
}) {
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scroller.current
    const next = el?.querySelector<HTMLElement>('[aria-current]')
    if (!el || !next) return
    // Center the next point, without scrolling the page
    el.scrollLeft = next.offsetLeft - (el.clientWidth - next.offsetWidth) / 2
  }, [points])

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
      <p className="mb-5 text-small text-ink-2">
        Counted from your start date, {formatDate(start, true)}.
      </p>
      {/* Focusable so keyboard users can scroll it */}
      <div
        ref={scroller}
        tabIndex={0}
        role="region"
        aria-label="Plan timeline"
        className="relative -mx-4.5 overflow-x-auto px-4.5 pb-2 md:-mx-6 md:px-6"
      >
        <ol className="grid w-max min-w-full auto-cols-[minmax(7.5rem,1fr)] grid-flow-col grid-rows-[repeat(6,auto)]">
          {points.map((view, i) => (
            <PointItem
              key={view.point.id}
              view={view}
              last={i === points.length - 1}
            />
          ))}
        </ol>
      </div>
    </section>
  )
}

function PointItem({
  view: { point, date, rows, status, next },
  last,
}: {
  view: PlanPointView
  last: boolean
}) {
  const doneCount = rows.filter((row) => row.status.kind === 'done').length
  const overdueCount = rows.filter(
    (row) => row.status.kind === 'overdue',
  ).length

  return (
    <li
      aria-current={next ? 'step' : undefined}
      // A subgrid so labels, dates and counts line up across points
      className="relative row-span-6 grid grid-rows-subgrid justify-items-center px-2 text-center"
    >
      {!last && (
        // The line to the next point, from this dot's center
        <span
          aria-hidden="true"
          className="absolute top-4.25 left-1/2 h-0.5 w-full bg-line"
        />
      )}
      <Dot status={status} next={next} />
      <p className="mt-3 font-semibold">{point.label}</p>
      <p className="text-small">{point.detail}</p>
      <p className="text-small text-ink-2">{formatDate(date)}</p>
      <p className="mt-1.5 text-small text-ink-2 tabular-nums">
        {status === 'done' ? (
          'Done'
        ) : overdueCount > 0 ? (
          <span className="font-semibold text-late">
            {overdueCount} overdue
          </span>
        ) : (
          `${doneCount} of ${rows.length} done`
        )}
      </p>
      <span className="mt-2">
        {next && <Pill variant="required">Up next</Pill>}
      </span>
    </li>
  )
}

/** The point's status as a dot. The text under it says the same thing. */
function Dot({ status, next }: { status: Status; next: boolean }) {
  const shape = 'relative z-10 grid size-9 place-items-center rounded-full'
  if (status === 'done')
    return (
      <span aria-hidden="true" className={`${shape} bg-ok text-paper`}>
        <svg viewBox="0 0 20 20" className="size-4.5">
          <path
            d="M5.8 10.3l2.8 2.8 5.6-6"
            className="fill-none stroke-current"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  if (status === 'overdue')
    return (
      <span aria-hidden="true" className={`${shape} bg-late text-paper`}>
        <svg viewBox="0 0 20 20" className="size-4.5">
          <path
            d="M10 5.2v6"
            className="fill-none stroke-current"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <circle cx="10" cy="14.6" r="1.3" className="fill-current" />
        </svg>
      </span>
    )
  return (
    <span
      aria-hidden="true"
      className={`${shape} bg-paper ${next ? 'border-3 border-yale-blue' : status === 'in-progress' ? 'border-2 border-prog' : 'border-2 border-todo'}`}
    >
      {(next || status === 'in-progress') && (
        <span
          className={`size-3 rounded-full ${next ? 'bg-yale-blue' : 'bg-prog'}`}
        />
      )}
    </span>
  )
}
