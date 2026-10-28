import type { Milestone } from '#/data/plan'
import { MILESTONES } from '#/data/plan'
import { addDays, addMonths, daysBetween, formatDate } from '#/lib/dates'

function milestoneDate(milestone: Milestone, orientation: Date): Date {
  return 'months' in milestone.offset
    ? addMonths(orientation, milestone.offset.months)
    : addDays(orientation, milestone.offset.weeks * 7)
}

/**
 * The first-year plan as a row of milestones counted from orientation, with a
 * "You are here" marker between the last one passed and the next. Milestones
 * are evenly spaced; the marker sits partway along its gap by date. On phones
 * the row turns into a column.
 */
export function PlanTimeline({
  orientation,
  today,
}: {
  orientation: Date
  today: Date
}) {
  const milestones = MILESTONES.map((milestone) => ({
    milestone,
    date: milestoneDate(milestone, orientation),
  }))
  // The last milestone passed (they're in date order), or -1 before
  // orientation. The marker only shows between two milestones.
  const current = milestones.filter(({ date }) => date <= today).length - 1
  const next = milestones[current + 1]
  const progress =
    current >= 0 && next
      ? daysBetween(milestones[current].date, today) /
        daysBetween(milestones[current].date, next.date)
      : null

  return (
    <section
      aria-labelledby="plan-h"
      className="rounded border border-card-line bg-paper p-4.5 shadow-card md:p-6"
    >
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="plan-h" className="text-h3">
          My plan
        </h2>
        {/* TODO: link to My first-year plan once it's built */}
        <a href="#" className="text-small font-semibold">
          View my plan<span aria-hidden="true"> ›</span>
        </a>
      </div>
      <ol className="md:grid md:auto-cols-fr md:grid-flow-col md:pt-8">
        {milestones.map(({ milestone, date }, i) => {
          const passed = date <= today
          return (
            <li
              key={milestone.id}
              className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4 pb-6 last:pb-0 md:flex md:flex-col md:items-center md:pb-0 md:text-center"
            >
              {i < milestones.length - 1 && (
                // The line to the next milestone, from this circle's center
                <span
                  aria-hidden="true"
                  className="absolute bg-line max-md:top-4.5 max-md:left-4.25 max-md:h-full max-md:w-0.5 md:top-4.25 md:left-1/2 md:h-0.5 md:w-full"
                />
              )}
              <MilestoneDot passed={passed} isKey={!!milestone.key} />
              <div className="pt-1.5 md:mt-3 md:pt-0">
                <p className="font-semibold">{milestone.label}</p>
                <p className="text-small text-ink-2">{formatDate(date)}</p>
              </div>
              {i === current && progress !== null && (
                <YouAreHere progress={progress} />
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function MilestoneDot({ passed, isKey }: { passed: boolean; isKey: boolean }) {
  // Status is in text too, not only the icon (WCAG 1.4.1)
  const label = passed ? 'Done' : isKey ? 'Key milestone' : 'Upcoming'
  return (
    <span
      className={`relative z-10 grid size-9 place-items-center rounded-full ${passed || isKey ? 'bg-yale-blue text-paper' : 'border-2 border-todo bg-paper'}`}
    >
      <span className="sr-only">{label}</span>
      {passed ? (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4.5">
          <path
            d="M5.8 10.3l2.8 2.8 5.6-6"
            className="fill-none stroke-current"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        isKey && (
          <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
            <path
              d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z"
              className="fill-current"
            />
          </svg>
        )
      )}
    </span>
  )
}

/**
 * On wide screens, sits on the line `progress` (0 to 1) of the way to the next
 * milestone, kept clear of both circles. On phones, it's a row under the
 * milestone's date.
 */
function YouAreHere({ progress }: { progress: number }) {
  return (
    <div
      // `left` only applies once md: makes this absolute
      style={{
        left: `calc(50% + clamp(2rem, ${progress * 100}%, 100% - 2rem))`,
      }}
      className="col-span-2 mt-4 flex items-center gap-4 md:absolute md:top-2 md:mt-0 md:-translate-x-1/2"
    >
      <span
        aria-hidden="true"
        className="relative z-10 ml-2 size-5 shrink-0 rounded-full border-5 border-yale-blue bg-paper md:ml-0"
      />
      <span className="text-small font-semibold text-yale-blue md:absolute md:bottom-full md:left-1/2 md:mb-2 md:-translate-x-1/2 md:whitespace-nowrap">
        You are here
      </span>
    </div>
  )
}
