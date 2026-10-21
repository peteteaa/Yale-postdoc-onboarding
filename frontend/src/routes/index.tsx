import { DueInfo } from '#/components/DueInfo'
import { Pill } from '#/components/Pill'
import { StatusIcon } from '#/components/StatusIcon'
import type { ChecklistTask } from '#/data/checklist'
import { PHASES, TASKS } from '#/data/checklist'
import { EVENTS } from '#/data/events'
import { PLAN_WEEKS } from '#/data/plan'
import {
  FIRST_NAME,
  INITIALLY_DONE,
  START_DATE,
  TODAY,
  VISA,
  WEEKS_DONE,
  WORKBOOK_PROGRESS,
} from '#/data/postdoc'
import type { TaskStatus } from '#/lib/checklist'
import { appliesTo, groupStatus, nextTask, taskStatus } from '#/lib/checklist'
import { daysBetween, formatDate, formatRange, parseDate } from '#/lib/dates'
import { idpMeetingDate, planPosition, weekRange } from '#/lib/plan'
import { Link, createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useState } from 'react'

export const Route = createFileRoute('/')({ component: Home })

const CARD = 'min-w-0 rounded p-4.5 shadow-card md:p-6'
const PLAIN_CARD = `${CARD} border border-card-line bg-paper`
const EYEBROW =
  'mb-2 text-label font-semibold tracking-label text-ink-2 uppercase'
const CARD_TITLE = 'mb-2 text-h3 text-balance'
const ACTIONS = 'mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-2.5'
const BUTTON =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded border-[1.5px] border-yale-blue px-4.5 py-2.5 text-medium leading-tight font-semibold no-underline'
const PRIMARY_BUTTON = `${BUTTON} bg-yale-blue text-paper hover:brightness-115`
const SECONDARY_BUTTON = `${BUTTON} bg-paper text-yale-blue hover:bg-tint`
const MORE_LINK = 'mt-3 inline-block font-semibold'
const COUNT = 'text-small font-normal text-ink-2 tabular-nums'

type Row = { task: ChecklistTask; status: TaskStatus }

const IDP_DATE = idpMeetingDate(START_DATE)

function Home() {
  // TODO: save to the backend, so the checklist page sees the same progress
  const [done, setDone] = useState(() => new Set(INITIALLY_DONE))
  const [weeksDone, setWeeksDone] = useState(() => new Set(WEEKS_DONE))

  const rows: Row[] = TASKS.filter((task) => appliesTo(task, VISA)).map(
    (task) => ({
      task,
      status: taskStatus(task, {
        start: START_DATE,
        today: TODAY,
        done: done.has(task.id),
      }),
    }),
  )
  const next = nextTask(rows)
  const { week, day } = planPosition(START_DATE, TODAY)
  const started = day >= 1
  const inPlan = started && week <= PLAN_WEEKS.length

  return (
    <main className="mx-auto max-w-page px-4 pt-6 pb-12 md:px-10 md:pt-10 md:pb-18">
      <div className="mb-7 max-w-195">
        <p className={EYEBROW}>
          {started
            ? `Week ${week} · Day ${day}`
            : `Starts ${formatDate(START_DATE, true)}`}
        </p>
        <h1 className="mb-2.5 text-h1 text-yale-blue">
          Welcome back, {FIRST_NAME}
        </h1>
        <p className="max-w-[65ch] text-lede text-ink-2">
          {started
            ? `You started on ${formatDate(START_DATE, true)}. Here’s what needs your attention.`
            : 'Here’s how to get ready for your first day.'}
        </p>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-5">
          <NextStep
            row={next}
            onDone={(taskId) => setDone((prev) => new Set(prev).add(taskId))}
          />
          {inPlan && (
            <ThisWeek
              week={week}
              done={weeksDone.has(week)}
              onToggle={() => setWeeksDone((prev) => toggled(prev, week))}
            />
          )}
          <Progress rows={rows} />
        </div>
        <aside className="grid min-w-0 gap-5">
          <ComingUp week={started ? week : 0} weeksDone={weeksDone} />
          <UpcomingEvents />
        </aside>
      </div>
    </main>
  )
}

/** A copy of `set` with `item` added, or removed if it was there. */
function toggled<T>(set: Set<T>, item: T): Set<T> {
  const next = new Set(set)
  if (next.has(item)) next.delete(item)
  else next.add(item)
  return next
}

/** "in 3 days", "in 1 day", or "today". */
function inDays(days: number): string {
  if (days === 0) return 'today'
  return `in ${days} ${days === 1 ? 'day' : 'days'}`
}

/** The checklist task to do next, with a button to check it off. */
function NextStep({
  row,
  onDone,
}: {
  row: Row | undefined
  onDone: (taskId: string) => void
}) {
  if (!row)
    return (
      <section aria-labelledby="next-heading" className={PLAIN_CARD}>
        <p className={EYEBROW}>Next step</p>
        <h2 id="next-heading" className={CARD_TITLE}>
          Your checklist is done
        </h2>
        <p className="text-ink-2">
          Nice work. Keep going with this week’s plan.
        </p>
      </section>
    )

  const { task, status } = row
  return (
    <section
      aria-labelledby="next-heading"
      className={`${CARD} bg-paper ${status.kind === 'overdue' ? 'border-2 border-late' : 'border border-card-line'}`}
    >
      <p className={EYEBROW}>Next step</p>
      <h2 id="next-heading" className={CARD_TITLE}>
        {task.title}
      </h2>
      <div className="my-1.75 flex flex-wrap items-center gap-x-3 gap-y-2 text-small text-ink-2">
        <Pill variant={task.required ? 'required' : 'default'}>
          {task.required ? 'Required' : 'Optional'}
        </Pill>
        <DueInfo task={task} status={status} />
      </div>
      <p className="max-w-[68ch] text-ink-2">{task.description}</p>
      <div className={ACTIONS}>
        <button
          type="button"
          onClick={() => onDone(task.id)}
          className={PRIMARY_BUTTON}
        >
          Mark as done
        </button>
        <Link to="/checklist" className={SECONDARY_BUTTON}>
          See all tasks
        </Link>
      </div>
    </section>
  )
}

/** This week's first-year plan activity. */
function ThisWeek({
  week,
  done,
  onToggle,
}: {
  week: number
  done: boolean
  onToggle: () => void
}) {
  const plan = PLAN_WEEKS[week - 1]
  const [from, to] = weekRange(START_DATE, week)

  return (
    <section
      aria-labelledby="week-heading"
      className={`${CARD} border border-tint bg-tint`}
    >
      <p className={EYEBROW}>
        This week · Week {week}, {formatRange(from, to)}
      </p>
      <h2 id="week-heading" className={CARD_TITLE}>
        {plan.title}
      </h2>
      <p className="max-w-[68ch]">{plan.description}</p>
      <p className="mt-1 text-small text-ink-2">
        Suggested time: {plan.suggestedTime}
      </p>
      <div className={ACTIONS}>
        {/* TODO: link to the workbook section or page once they exist */}
        <a href="#" className={SECONDARY_BUTTON}>
          {plan.workbookSection ? 'Open in workbook' : `Open ${plan.page}`}
        </a>
        <label className="inline-flex cursor-pointer items-center gap-2 text-medium">
          <input
            type="checkbox"
            checked={done}
            onChange={onToggle}
            className="size-5 cursor-pointer accent-yale-blue"
          />
          Mark this week done
        </label>
      </div>
    </section>
  )
}

/** Checklist progress by phase, plus the workbook and the Initial IDP. */
function Progress({ rows }: { rows: Row[] }) {
  const doneCount = rows.filter((row) => row.status.kind === 'done').length
  // Each phase for everyone, then the international phases together.
  const groups = [
    ...PHASES.filter((phase) => phase.group === 'everyone').map((phase) => ({
      label: phase.title,
      phases: [phase.id],
    })),
    {
      label: 'International steps',
      phases: PHASES.filter((phase) => phase.group === 'international').map(
        (phase) => phase.id,
      ),
    },
  ]
    .map((group) => ({
      label: group.label,
      rows: rows.filter((row) => group.phases.includes(row.task.phase)),
    }))
    .filter((group) => group.rows.length > 0)
  const idpDaysLeft = daysBetween(TODAY, IDP_DATE)

  return (
    <section aria-labelledby="progress-heading" className={PLAIN_CARD}>
      <h2 id="progress-heading" className={CARD_TITLE}>
        Your progress
      </h2>

      <ProgressLabel label="Checklist">
        {doneCount} of {rows.length} tasks
      </ProgressLabel>
      <ProgressBar done={doneCount} total={rows.length} />
      <ul className="mb-4.5 grid gap-2">
        {groups.map((group) => {
          const status = groupStatus(group.rows.map((row) => row.status))
          const groupDone = group.rows.filter(
            (row) => row.status.kind === 'done',
          ).length
          return (
            <li
              key={group.label}
              className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2.5 text-medium"
            >
              <StatusIcon status={status} />
              <span>{group.label}</span>
              <span className={COUNT}>
                {groupDone} of {group.rows.length}
                {status === 'overdue' && (
                  <span className="sr-only">, with an overdue task</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      <ProgressLabel label="Workbook">
        {WORKBOOK_PROGRESS.done} of {WORKBOOK_PROGRESS.total} modules
      </ProgressLabel>
      <ProgressBar
        done={WORKBOOK_PROGRESS.done}
        total={WORKBOOK_PROGRESS.total}
      />

      <ProgressLabel label="Initial IDP">
        {idpDaysLeft >= 0
          ? `Meeting by ${formatDate(IDP_DATE)} · ${inDays(idpDaysLeft)}`
          : `Was due ${formatDate(IDP_DATE)}`}
      </ProgressLabel>
      {/* TODO: link to the IDP builder once it exists */}
      <a href="#" className={MORE_LINK}>
        Open IDP builder
      </a>
    </section>
  )
}

function ProgressLabel({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <p className="mb-1.5 flex items-baseline justify-between gap-3 font-semibold">
      <span>{label}</span>
      <span className={COUNT}>{children}</span>
    </p>
  )
}

/** Decorative: the count next to it says the same thing. */
function ProgressBar({ done, total }: { done: number; total: number }) {
  return (
    <div
      aria-hidden="true"
      className="mb-3.5 h-2 overflow-hidden rounded-full bg-line"
    >
      <div
        className="h-full rounded-full bg-yale-blue"
        style={{ width: `${Math.round((done / total) * 100)}%` }}
      />
    </div>
  )
}

/** Plan weeks and deadlines in the next few weeks. */
function ComingUp({
  week,
  weeksDone,
}: {
  /** The current plan week, or 0 before the start date. */
  week: number
  weeksDone: Set<number>
}) {
  const items: DatedItem[] = []
  if (week >= 1) {
    for (let w = week + 1; w <= Math.min(PLAN_WEEKS.length, week + 2); w++) {
      if (weeksDone.has(w)) continue
      items.push({
        key: `week-${w}`,
        date: formatRange(...weekRange(START_DATE, w)),
        text: `Week ${w}: ${PLAN_WEEKS[w - 1].title}`,
      })
    }
  }
  // Week 5 is for adding detail to your projects and goals. Until the end of
  // week 8, remind people who skipped it.
  // TODO: base this on the workbook answers instead
  if (week > 5 && week <= 8 && !weeksDone.has(5)) {
    items.push({
      key: 'goals-detail',
      date: formatDate(weekRange(START_DATE, 8)[1]),
      text: (
        <>
          Add more detail to your projects and goals (
          {/* TODO: link to workbook section 1.3 once it exists */}
          <a href="#">workbook 1.3</a>)
        </>
      ),
    })
  }
  if (daysBetween(TODAY, IDP_DATE) >= 0) {
    items.push({
      key: 'idp-meeting',
      date: formatDate(IDP_DATE),
      text: 'Initial IDP meeting with your mentor',
    })
  }

  return (
    <section aria-labelledby="coming-up-heading" className={PLAIN_CARD}>
      <h2 id="coming-up-heading" className={CARD_TITLE}>
        Coming up
      </h2>
      {items.length > 0 ? (
        <DatedList items={items} />
      ) : (
        <p className="text-small text-ink-2">Nothing scheduled.</p>
      )}
      {/* TODO: link to the first-year plan once it exists */}
      <a href="#" className={MORE_LINK}>
        See your first-year plan
      </a>
    </section>
  )
}

/** The next three published events. */
function UpcomingEvents() {
  const upcoming = EVENTS.filter(
    (event) => daysBetween(TODAY, parseDate(event.date)) >= 0,
  )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)

  return (
    <section aria-labelledby="events-heading" className={PLAIN_CARD}>
      <h2 id="events-heading" className={CARD_TITLE}>
        Upcoming events
      </h2>
      {upcoming.length > 0 ? (
        <DatedList
          items={upcoming.map((event) => ({
            key: event.id,
            date: formatDate(parseDate(event.date)),
            text: (
              <>
                {event.title}
                <span className="block text-micro text-ink-2">
                  {event.host}
                </span>
              </>
            ),
          }))}
        />
      ) : (
        <p className="text-small text-ink-2">No events scheduled.</p>
      )}
      {/* TODO: link to Events & programs once it exists */}
      <a href="#" className={MORE_LINK}>
        All events
      </a>
    </section>
  )
}

type DatedItem = { key: string; date: string; text: ReactNode }

function DatedList({ items }: { items: DatedItem[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li
          key={item.key}
          className="grid gap-0.5 border-t border-line py-3 text-medium first:border-t-0 first:pt-0 md:grid-cols-[5.75rem_minmax(0,1fr)] md:gap-3"
        >
          <span className="text-small font-semibold text-yale-blue tabular-nums">
            {item.date}
          </span>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  )
}
