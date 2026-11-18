'use client'

import { DueInfo, SaveError, UnsavedNote } from '#/components/Checklist'
import { GHOST_BUTTON, PRIMARY_BUTTON } from '#/components/Form'
import { Pill } from '#/components/Pill'
import { PlanTimeline } from '#/components/PlanTimeline'
import { TASKS } from '#/data/checklist'
import type { PostdocEvent } from '#/data/events'
import { appliesTo, nextTask, taskStatus } from '#/lib/checklist'
import {
  daysBetween,
  formatDate,
  formatTimeRange,
  parseDate,
} from '#/lib/dates'
import { buildPlan } from '#/lib/plan'
import type { MyChecklist } from '#/lib/supabase/progress'
import { useChecklistProgress } from '#/lib/use-checklist-progress'
import Link from 'next/link'

// TODO: OPA's orientation date for the postdoc's cohort
const ORIENTATION_DATE = parseDate('2026-10-05')

// TODO: from the backend. Nothing is set up yet, so these are empty.
const COMING_UP: { date: Date; title: string }[] = []
const WORKBOOK_MODULES_DONE = 0

const CARD_SHAPE = 'rounded bg-paper p-4.5 shadow-card md:p-6'
const CARD = `${CARD_SHAPE} border border-card-line`
const LABEL =
  'mb-2 text-label font-semibold tracking-label text-ink-2 uppercase'
const MORE_LINK = 'mt-3 inline-block font-semibold'

export function Home({
  name,
  today: todayIso,
  checklist: { start: startIso, visa, done: initiallyDone, unsaved },
  events,
  isAdmin,
}: {
  /** First name to greet, or "Guest". */
  name: string
  /** 'YYYY-MM-DD' */
  today: string
  /** Their start date, visa and checked-off tasks. */
  checklist: MyChecklist
  /** The next few published events, soonest first. null if they didn't load. */
  events: PostdocEvent[] | null
  /** OPA staff, who get a link to manage events. */
  isAdmin: boolean
}) {
  const start = parseDate(startIso)
  const today = parseDate(todayIso)
  const { done, mark, error } = useChecklistProgress(
    initiallyDone,
    unsaved === null,
  )

  const rows = TASKS.filter((task) => appliesTo(task, visa)).map((task) => ({
    task,
    status: taskStatus(task, {
      start,
      today,
      done: done.has(task.id),
    }),
  }))
  const doneCount = rows.filter((row) => row.status.kind === 'done').length
  const next = nextTask(rows, start)

  const day = daysBetween(start, today) + 1
  const week = Math.floor((day - 1) / 7) + 1

  const plan = buildPlan({
    start,
    orientation: ORIENTATION_DATE,
    today,
    visa,
    done,
  })
  const idpMeeting = plan
    .flatMap((point) => point.rows)
    .find((row) => row.id === 'idp-meeting')!.due!
  const daysToIdp = daysBetween(today, idpMeeting)

  return (
    <main className="mx-auto max-w-page px-4 pt-6 pb-12 md:px-10 md:pt-10 md:pb-18">
      <div className="mb-7 max-w-195">
        <p className={LABEL}>
          {day >= 1
            ? `Week ${week} · Day ${day}`
            : `Starts ${formatDate(start, true)}`}
        </p>
        <h1 className="mb-2.5 text-h1 text-yale-blue">Welcome, {name}</h1>
        <p className="max-w-[65ch] text-lede text-ink-2">
          {day >= 1
            ? `You started on ${formatDate(start, true)}. Here’s what needs your attention.`
            : 'Here’s how to get ready for your first day.'}
        </p>
        <UnsavedNote reason={unsaved} />
        <SaveError message={error} />
      </div>

      <div className="mb-6">
        <PlanTimeline points={plan} start={start} />
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-5">
          {next ? (
            <section
              aria-labelledby="next-h"
              className={
                next.status.kind === 'overdue'
                  ? `${CARD_SHAPE} border-2 border-late`
                  : CARD
              }
            >
              <p className={LABEL}>Next step</p>
              <h2 id="next-h" className="mb-2 text-h3">
                {next.task.title}
              </h2>
              <div className="my-1.75 flex flex-wrap items-center gap-x-3 gap-y-2 text-small text-ink-2">
                <Pill variant={next.task.required ? 'required' : 'default'}>
                  {next.task.required ? 'Required' : 'Optional'}
                </Pill>
                <DueInfo task={next.task} status={next.status} />
              </div>
              <p className="mb-1.5 max-w-[68ch] text-ink-2">
                {next.task.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
                <button
                  type="button"
                  onClick={() => mark(next.task.id, true)}
                  className={PRIMARY_BUTTON}
                >
                  Mark as done
                </button>
                <Link
                  href="/checklist"
                  className={`${GHOST_BUTTON} no-underline`}
                >
                  See all tasks
                </Link>
              </div>
            </section>
          ) : (
            <section aria-labelledby="next-h" className={CARD}>
              <p className={LABEL}>Next step</p>
              <h2 id="next-h" className="mb-2 text-h3">
                Your checklist is done
              </h2>
              <p className="text-ink-2">
                Nice work. Keep going with your first-year plan.
              </p>
            </section>
          )}

          <section aria-labelledby="progress-h" className={CARD}>
            <h2 id="progress-h" className="mb-3 text-h3">
              Your progress
            </h2>
            <ProgressRow
              label="Checklist"
              value={`${doneCount} of ${rows.length} tasks`}
              fraction={doneCount / rows.length}
            />
            <ProgressRow
              label="Workbook"
              value={`${WORKBOOK_MODULES_DONE} modules done`}
              fraction={0}
            />
            <ProgressRow
              label="Initial IDP"
              value={
                daysToIdp >= 0
                  ? `Meeting by ${formatDate(idpMeeting)} · in ${daysToIdp} ${daysToIdp === 1 ? 'day' : 'days'}`
                  : `Was due ${formatDate(idpMeeting)}`
              }
            />
            <Link href="/idp" className={MORE_LINK}>
              Open IDP builder
            </Link>
          </section>
        </div>

        <aside aria-label="Coming up" className="grid min-w-0 gap-5">
          <section aria-labelledby="coming-up-h" className={CARD}>
            <h2 id="coming-up-h" className="mb-2 text-h3">
              Coming up
            </h2>
            {COMING_UP.length > 0 ? (
              <DateList
                items={COMING_UP.map((item) => ({
                  key: item.title,
                  date: item.date,
                  title: item.title,
                }))}
              />
            ) : (
              <p className="text-small text-ink-2">Nothing scheduled yet.</p>
            )}
            {/* TODO: link to My first-year plan once it's built */}
            <a href="#" className={MORE_LINK}>
              See your first-year plan
            </a>
          </section>

          <section aria-labelledby="events-h" className={CARD}>
            <h2 id="events-h" className="mb-2 text-h3">
              Upcoming events
            </h2>
            {events === null ? (
              <p className="text-small text-late">
                Couldn’t load events. Reload the page to try again.
              </p>
            ) : events.length > 0 ? (
              <DateList
                items={events.map((event) => ({
                  key: event.id,
                  date: parseDate(event.date),
                  title: event.title,
                  detail: `${formatTimeRange(event.start, event.end)} · ${event.host}`,
                }))}
              />
            ) : (
              <p className="text-small text-ink-2">No upcoming events.</p>
            )}
            <div className="flex flex-wrap gap-x-5">
              {/* TODO: link to Events & programs once it's built */}
              <a href="#" className={MORE_LINK}>
                All events
              </a>
              {isAdmin && (
                <Link href="/admin/events" className={MORE_LINK}>
                  Manage events
                </Link>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}

/** A heading line with its count, and a bar when there's a fraction to show. */
function ProgressRow({
  label,
  value,
  fraction,
}: {
  label: string
  value: string
  /** 0 to 1. Leave out for rows with no bar. */
  fraction?: number
}) {
  return (
    <>
      <p className="mb-1.5 flex items-baseline justify-between gap-3 font-semibold">
        <span>{label}</span>
        <span className="text-small font-normal text-ink-2 tabular-nums">
          {value}
        </span>
      </p>
      {fraction !== undefined && (
        // The count above says the same thing in text
        <div
          aria-hidden="true"
          className="mb-3.5 h-2 overflow-hidden rounded-full bg-line"
        >
          <span
            className="block h-full rounded-full bg-yale-blue"
            style={{ width: `${Math.round(fraction * 100)}%` }}
          />
        </div>
      )}
    </>
  )
}

/** Dated items, date first: reminders and events. */
function DateList({
  items,
}: {
  items: { key: string; date: Date; title: string; detail?: string }[]
}) {
  return (
    <ul>
      {items.map((item) => (
        <li
          key={item.key}
          className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-3 border-t border-line py-3 text-medium first:border-t-0 first:pt-0"
        >
          <span className="text-small font-semibold text-yale-blue tabular-nums">
            {formatDate(item.date)}
          </span>
          <span>
            {item.title}
            {item.detail && (
              <span className="block text-small text-ink-2">{item.detail}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}
