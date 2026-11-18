'use client'

import { deleteEvent, saveEvent } from '#/app/admin/events/actions'
import type { EventActionResult } from '#/app/admin/events/actions'
import {
  BUSY,
  Field,
  GHOST_BUTTON,
  INPUT,
  LINK_BUTTON,
  PRIMARY_BUTTON,
} from '#/components/Form'
import { Pill } from '#/components/Pill'
import type { Status } from '#/components/StatusIcon'
import { StatusIcon } from '#/components/StatusIcon'
import type { PhaseId } from '#/data/checklist'
import { TASKS } from '#/data/checklist'
import type { EventStatus, PostdocEvent } from '#/data/events'
import { EVENT_CATEGORIES } from '#/data/events'
import type { PostdocProgress } from '#/data/postdocs'
import { appliesTo, taskStatus } from '#/lib/checklist'
import {
  daysBetween,
  formatDate,
  formatMonth,
  formatTimeRange,
  parseDate,
} from '#/lib/dates'
import type { EventForm, EventFormErrors, EventFormField } from '#/lib/events'
import { BLANK_EVENT_FORM, validateEvent } from '#/lib/events'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import type { FormEvent, ReactNode } from 'react'

const VIEWS: { href: string; label: string }[] = [
  { href: '/admin/overview', label: 'Completion overview' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/resources', label: 'Resources' },
]

/** The staff tabs around each admin page. Used by the admin layout. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <>
      <nav aria-label="Staff pages" className="border-b border-line">
        <ul className="mx-auto flex max-w-page flex-wrap gap-x-7 px-4 md:px-10">
          {VIEWS.map((option) => (
            <li key={option.href}>
              <Link
                href={option.href}
                aria-current={option.href === pathname ? 'page' : undefined}
                className="block border-b-3 border-transparent pt-3.5 pb-2.75 text-medium text-ink no-underline hover:border-line aria-[current=page]:border-yale-blue aria-[current=page]:font-semibold"
              >
                {option.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="mx-auto max-w-page px-4 pt-6 pb-12 md:px-10 md:pt-10 md:pb-18">
        {children}
      </main>
    </>
  )
}

/* Completion overview */

/** Table columns for checklist progress, each covering one or more phases. */
const COLUMNS: { label: string; phases: PhaseId[] }[] = [
  { label: 'First day', phases: ['first-day'] },
  { label: 'First week', phases: ['first-week'] },
  { label: 'First 30 days', phases: ['first-30-days'] },
  {
    label: 'International',
    phases: ['intl-first-3-days', 'intl-first-30-days'],
  },
]

type CohortTotal = {
  label: string
  value: string
  detail: string
  percent?: number
  warn?: boolean
}

type ColumnProgress = { done: number; total: number; overdue: boolean }

type Row = {
  postdoc: PostdocProgress
  /** One per column. null when none of its tasks apply to this postdoc. */
  columns: (ColumnProgress | null)[]
  overdue: boolean
}

function rowFor(postdoc: PostdocProgress, today: Date): Row {
  const start = parseDate(postdoc.start)
  const doneIds = new Set(postdoc.done)
  const columns = COLUMNS.map((column) => {
    const tasks = TASKS.filter(
      (task) =>
        column.phases.includes(task.phase) && appliesTo(task, postdoc.visa),
    )
    if (tasks.length === 0) return null
    return {
      done: tasks.filter((task) => doneIds.has(task.id)).length,
      total: tasks.length,
      overdue: tasks.some(
        (task) =>
          taskStatus(task, { start, today, done: doneIds.has(task.id) })
            .kind === 'overdue',
      ),
    }
  })
  return {
    postdoc,
    columns,
    overdue: columns.some((column) => column?.overdue),
  }
}

const isComplete = (column: ColumnProgress | null) =>
  column === null || column.done === column.total

/** Totals over every row, so filtering the table doesn't change them. */
function cohortTotals(rows: Row[]): CohortTotal[] {
  const count = rows.length
  const percentCard = (label: string, n: number): CohortTotal =>
    count === 0
      ? { label, value: '—', detail: 'No postdocs yet' }
      : {
          label,
          value: `${Math.round((n / count) * 100)}%`,
          detail: `${n} of ${count} postdocs`,
          percent: Math.round((n / count) * 100),
        }
  const overdue = rows.filter((row) => row.overdue)
  return [
    percentCard(
      'First-day tasks done',
      rows.filter((row) => isComplete(row.columns[0])).length,
    ),
    percentCard(
      'Checklist done',
      rows.filter((row) => row.columns.every(isComplete)).length,
    ),
    {
      label: 'Have an overdue required task',
      value: String(overdue.length),
      detail: `postdocs, ${overdue.filter((row) => row.postdoc.visa !== 'domestic').length} of them international`,
      warn: true,
    },
    {
      label: 'Started the workbook',
      value: '—',
      detail: 'Not tracked yet',
    },
  ]
}

type Filters = {
  search: string
  department: string
  startMonth: string
  group: 'all' | 'international' | 'domestic'
  // TODO: add 'workbook-not-started' back once workbook progress is saved.
  status: 'all' | 'overdue'
}

const NO_FILTERS: Filters = {
  search: '',
  department: 'all',
  startMonth: 'all',
  group: 'all',
  status: 'all',
}

function matches(row: Row, filters: Filters): boolean {
  const { postdoc } = row
  const search = filters.search.trim().toLowerCase()
  return (
    (!search ||
      postdoc.fullName.toLowerCase().includes(search) ||
      postdoc.netId.toLowerCase().includes(search)) &&
    (filters.department === 'all' ||
      postdoc.department === filters.department) &&
    (filters.startMonth === 'all' ||
      postdoc.start.startsWith(filters.startMonth)) &&
    (filters.group === 'all' ||
      (filters.group === 'international') === (postdoc.visa !== 'domestic')) &&
    (filters.status === 'all' || row.overdue)
  )
}

/**
 * /admin/overview. `postdocs` comes from Supabase (null if it couldn’t be
 * loaded); `today` is 'YYYY-MM-DD' in New Haven.
 */
export function OverviewView({
  postdocs,
  today,
}: {
  postdocs: PostdocProgress[] | null
  today: string
}) {
  const [filters, setFilters] = useState(NO_FILTERS)
  const setFilter = <TKey extends keyof Filters>(
    key: TKey,
    value: Filters[TKey],
  ) => setFilters((prev) => ({ ...prev, [key]: value }))

  const todayDate = parseDate(today)
  const allRows = (postdocs ?? []).map((postdoc) => rowFor(postdoc, todayDate))
  const departments = [...new Set(allRows.map((r) => r.postdoc.department))]
    .filter(Boolean)
    .sort()
  // 'YYYY-MM' of each start date, oldest first
  const startMonths = [
    ...new Set(allRows.map((r) => r.postdoc.start.slice(0, 7))),
  ].sort()
  const totals = cohortTotals(allRows)
  const rows = allRows.filter((row) => matches(row, filters))

  const heading = (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-180">
        <h1 className="mb-2.5 text-h1 text-yale-blue">Completion overview</h1>
        <p className="max-w-[65ch] text-lede text-ink-2">
          Checklist and workbook status for each postdoc. Workbook answers and
          IDPs are never shown here.
        </p>
      </div>
      {postdocs && (
        <button
          type="button"
          className={GHOST_BUTTON}
          onClick={() => downloadCsv(rows)}
        >
          Export CSV
        </button>
      )}
    </div>
  )

  if (postdocs === null)
    return (
      <>
        {heading}
        <p role="alert" className="font-semibold text-late">
          Couldn’t load postdoc progress. Reload the page to try again.
        </p>
      </>
    )

  return (
    <>
      {heading}

      <ul
        aria-label="Cohort totals"
        className="mb-7.5 grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {totals.map((total) => (
          <li
            key={total.label}
            className="rounded border border-card-line bg-paper px-4.5 pt-4.5 pb-4"
          >
            <p className="mb-1.5 text-small text-ink-2">{total.label}</p>
            <p
              className={`mb-1.5 font-serif text-stat tabular-nums ${total.warn ? 'text-late' : 'text-yale-blue'}`}
            >
              {total.value}
            </p>
            <p className="mb-2.5 text-caption text-ink-2">{total.detail}</p>
            {total.percent !== undefined && (
              <div
                aria-hidden="true"
                className="h-2 overflow-hidden rounded-full bg-line"
              >
                <div
                  className="h-full rounded-full bg-yale-blue"
                  style={{ width: `${total.percent}%` }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="mb-4 grid grid-cols-2 items-end gap-3 md:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
        <div className="col-span-2 md:col-span-1">
          <label
            htmlFor="filter-search"
            className="mb-1 block text-caption font-semibold"
          >
            Search
          </label>
          <input
            id="filter-search"
            type="search"
            placeholder="Name or NetID"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className={INPUT}
          />
        </div>
        <SelectFilter
          id="filter-department"
          label="Department"
          value={filters.department}
          onChange={(value) => setFilter('department', value)}
          options={[
            { value: 'all', label: 'All departments' },
            ...departments.map((d) => ({ value: d, label: d })),
          ]}
        />
        <SelectFilter
          id="filter-start"
          label="Start date"
          value={filters.startMonth}
          onChange={(value) => setFilter('startMonth', value)}
          options={[
            { value: 'all', label: 'Any month' },
            ...startMonths.map((month) => ({
              value: month,
              label: formatMonth(parseDate(`${month}-01`)),
            })),
          ]}
        />
        <SelectFilter
          id="filter-group"
          label="International"
          value={filters.group}
          onChange={(value) => setFilter('group', value)}
          options={[
            { value: 'all', label: 'Everyone' },
            { value: 'international', label: 'International' },
            { value: 'domestic', label: 'Domestic' },
          ]}
        />
        <SelectFilter
          id="filter-status"
          label="Status"
          value={filters.status}
          onChange={(value) => setFilter('status', value)}
          options={[
            { value: 'all', label: 'Any status' },
            { value: 'overdue', label: 'Has an overdue task' },
          ]}
        />
      </div>

      <div className="overflow-x-auto rounded border border-card-line">
        <table className="w-full border-collapse text-small">
          <caption className="sr-only">Postdoc completion status</caption>
          <thead>
            <tr>
              <TableHeader>Postdoc</TableHeader>
              <TableHeader>Department</TableHeader>
              <TableHeader>Start</TableHeader>
              {COLUMNS.map((column) => (
                <TableHeader key={column.label}>{column.label}</TableHeader>
              ))}
              <TableHeader>Workbook</TableHeader>
              <TableHeader>Last active</TableHeader>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={row.postdoc.userId}
                  className="border-b border-line last:border-b-0 hover:bg-wash"
                >
                  {/* TODO: link to the postdoc detail page */}
                  <th scope="row" className={CELL}>
                    <span className="font-semibold">
                      {row.postdoc.fullName}
                    </span>
                    {row.postdoc.netId && (
                      <span className="block text-micro text-ink-2">
                        {row.postdoc.netId}
                      </span>
                    )}
                  </th>
                  <td className={`${CELL} min-w-37.5`}>
                    {row.postdoc.department}
                  </td>
                  <td className={NO_WRAP}>
                    {formatDate(parseDate(row.postdoc.start))}
                  </td>
                  {row.columns.map((column, i) => (
                    <td key={COLUMNS[i].label} className={CELL}>
                      <ProgressCell progress={column} />
                    </td>
                  ))}
                  <td className={CELL}>
                    <span className="text-ink-2">Not tracked yet</span>
                  </td>
                  <td className={NO_WRAP}>
                    {lastActive(row.postdoc, todayDate)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5 + COLUMNS.length} className={CELL}>
                  {allRows.length === 0 ? (
                    'No postdocs have added their appointment details yet.'
                  ) : (
                    <>
                      No postdocs match these filters.{' '}
                      <button
                        type="button"
                        onClick={() => setFilters(NO_FILTERS)}
                        className={`${LINK_BUTTON} text-link`}
                      >
                        Clear filters
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2.5 flex flex-wrap justify-between gap-2.5 text-small text-ink-2">
        <p>
          {rows.length} shown of {allRows.length} postdocs.
        </p>
        <p>Totals above cover everyone, not just the rows shown.</p>
      </div>
    </>
  )
}

// Cells wrap so the tables fit the page. Dates use NO_WRAP so they stay on one line.
const CELL = 'px-3.5 py-3 text-left align-top'
const NO_WRAP = `${CELL} whitespace-nowrap`

function TableHeader({ children }: { children?: ReactNode }) {
  return (
    <th
      scope="col"
      className={`${CELL} border-b border-line bg-wash text-label-sm font-semibold tracking-label text-ink-2 uppercase`}
    >
      {children}
    </th>
  )
}

function SelectFilter<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-caption font-semibold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={INPUT}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function StatusCell({
  status,
  children,
}: {
  status: Status
  children: ReactNode
}) {
  return (
    <span className="inline-flex items-start gap-1.75">
      <StatusIcon status={status} />
      {children}
    </span>
  )
}

function ProgressCell({ progress }: { progress: ColumnProgress | null }) {
  if (!progress)
    return (
      <span className="text-ink-2">
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not applicable</span>
      </span>
    )
  const { done, total, overdue } = progress
  if (done === total) return <StatusCell status="done">Done</StatusCell>
  if (overdue)
    return (
      <StatusCell status="overdue">
        {done} of {total} · overdue
      </StatusCell>
    )
  if (done === 0)
    return <StatusCell status="not-started">Not started</StatusCell>
  return (
    <StatusCell status="in-progress">
      {done} of {total}
    </StatusCell>
  )
}

function lastActive(postdoc: PostdocProgress, today: Date): string {
  const date = parseDate(postdoc.lastActive)
  return daysBetween(date, today) === 0 ? 'Today' : formatDate(date)
}

/** Downloads the rows as a CSV file, with the same columns as the table. */
function downloadCsv(rows: Row[]) {
  const header = [
    'Name',
    'NetID',
    'Department',
    'Start date',
    ...COLUMNS.map((column) => column.label),
    'Workbook',
    'Last active',
  ]
  const lines = rows.map(({ postdoc, columns }) => [
    postdoc.fullName,
    postdoc.netId,
    postdoc.department,
    postdoc.start,
    ...columns.map((column) =>
      column
        ? `${column.done} of ${column.total}${column.overdue ? ' (overdue)' : ''}`
        : 'N/A',
    ),
    'Not tracked',
    postdoc.lastActive,
  ])
  const csv = [header, ...lines]
    .map((line) => line.map(csvField).join(','))
    .join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'postdoc-completion.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function csvField(value: string): string {
  // A leading = + - or @ would make spreadsheets run the cell as a formula.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

/* Manage events */

/** The result of the last save or delete. */
type Notice = { kind: 'done' | 'failed'; text: string }

const byDate = (a: PostdocEvent, b: PostdocEvent) =>
  (a.date + a.start).localeCompare(b.date + b.start)

/**
 * /admin/events. `events` comes from Supabase (null if it couldn't be
 * loaded); saving or deleting reloads it from the server.
 */
export function EventsView({ events }: { events: PostdocEvent[] | null }) {
  const [form, setForm] = useState(BLANK_EVENT_FORM)
  const [errors, setErrors] = useState<EventFormErrors>({})
  // The event being edited, or null when the form makes a new one.
  const [editingId, setEditingId] = useState<string | null>(null)
  // The event whose delete is waiting for confirmation.
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  // Result of the last action, read out by screen readers.
  const [notice, setNotice] = useState<Notice | null>(null)
  // A save or delete is on its way to Supabase.
  const [saving, startSaving] = useTransition()
  const titleRef = useRef<HTMLInputElement>(null)

  const startForm = (values: EventForm, id: string | null) => {
    setForm(values)
    setErrors({})
    setEditingId(id)
    titleRef.current?.focus()
  }

  const edit = ({ id, category, ...rest }: PostdocEvent) =>
    startForm({ ...rest, category }, id)

  /** Shows the errors and focuses the first. Returns whether there were any. */
  const showErrors = (found: EventFormErrors) => {
    setErrors(found)
    const firstError = Object.keys(found)[0]
    if (firstError) document.getElementById(`event-${firstError}`)?.focus()
    return Boolean(firstError)
  }

  const failed = (result: Extract<EventActionResult, { ok: false }>) => {
    if (result.errors) showErrors(result.errors)
    setNotice(result.message ? { kind: 'failed', text: result.message } : null)
  }

  const remove = (event: PostdocEvent) => {
    startSaving(async () => {
      const result = await deleteEvent(event.id)
      setConfirmingId(null)
      if (!result.ok) return failed(result)
      if (editingId === event.id) startForm(BLANK_EVENT_FORM, null)
      setNotice({ kind: 'done', text: `Deleted “${event.title}.”` })
    })
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter
    const status: EventStatus =
      submitter?.dataset.status === 'draft' ? 'draft' : 'published'
    if (showErrors(validateEvent(form))) return
    const title = form.title.trim()
    startSaving(async () => {
      const result = await saveEvent(editingId, form, status)
      if (!result.ok) return failed(result)
      setForm(BLANK_EVENT_FORM)
      setEditingId(null)
      setNotice({
        kind: 'done',
        text:
          status === 'published'
            ? `Published “${title}.” Postdocs can see it on Events & programs now.`
            : `Saved “${title}” as a draft. Postdocs can’t see it yet.`,
      })
    })
  }

  const field = (key: EventFormField) => ({
    id: `event-${key}`,
    error: errors[key],
  })
  const setField = (key: EventFormField, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-180">
          <h1 className="mb-2.5 text-h1 text-yale-blue">Events</h1>
          <p className="max-w-[65ch] text-lede text-ink-2">
            Published events show up right away on the postdoc Events &amp;
            programs page. Drafts stay here until you publish them.
          </p>
        </div>
        <button
          type="button"
          className={PRIMARY_BUTTON}
          onClick={() => startForm(BLANK_EVENT_FORM, null)}
        >
          New event
        </button>
      </div>

      <div role="status">
        {notice?.kind === 'done' && (
          <p className="mb-5 rounded bg-tint px-4 py-3 text-small text-tint-ink">
            {notice.text}
          </p>
        )}
      </div>
      <div role="alert">
        {notice?.kind === 'failed' && (
          <p className="mb-5 rounded border-[1.5px] border-late bg-paper px-4 py-3 text-small font-semibold text-late">
            {notice.text}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="overflow-x-auto rounded border border-card-line">
          <table className="w-full border-collapse text-small">
            <caption className="sr-only">All events</caption>
            <thead>
              <tr>
                <TableHeader>Event</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>
                  <span className="sr-only">Actions</span>
                </TableHeader>
              </tr>
            </thead>
            <tbody>
              {events?.length === 0 && (
                <tr>
                  <td colSpan={4} className={CELL}>
                    No events yet.
                  </td>
                </tr>
              )}
              {events === null && (
                <tr>
                  <td colSpan={4} className={`${CELL} text-late`}>
                    Couldn’t load events. Reload the page to try again.
                  </td>
                </tr>
              )}
              {[...(events ?? [])].sort(byDate).map((event) =>
                event.id === confirmingId ? (
                  <tr
                    key={event.id}
                    className="border-b border-line bg-wash last:border-b-0"
                  >
                    <td colSpan={4} className={CELL}>
                      <div
                        role="alert"
                        className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5"
                      >
                        <span>
                          Delete “{event.title}”? Postdocs stop seeing it right
                          away.
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(event)}
                          disabled={saving}
                          className={`inline-flex min-h-9 cursor-pointer items-center rounded border-[1.5px] border-late bg-late px-3 py-1.5 text-small font-semibold text-paper ${BUSY}`}
                        >
                          Delete event
                        </button>
                        <button
                          type="button"
                          autoFocus
                          onClick={() => setConfirmingId(null)}
                          className="inline-flex min-h-9 cursor-pointer items-center rounded border-[1.5px] border-yale-blue bg-paper px-3 py-1.5 text-small font-semibold text-yale-blue hover:bg-tint"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={event.id}
                    className="border-b border-line last:border-b-0 hover:bg-wash"
                  >
                    <th scope="row" className={`${CELL} min-w-37.5`}>
                      <span className="font-semibold">{event.title}</span>
                      <span className="block text-micro text-ink-2">
                        {EVENT_CATEGORIES[event.category]} · {event.host}
                      </span>
                    </th>
                    <td className={NO_WRAP}>
                      {formatDate(parseDate(event.date), true)}
                      <span className="block text-micro text-ink-2">
                        {formatTimeRange(event.start, event.end)}
                      </span>
                    </td>
                    <td className={CELL}>
                      <Pill variant={event.status}>
                        {event.status === 'published' ? 'Published' : 'Draft'}
                      </Pill>
                    </td>
                    <td className={NO_WRAP}>
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => edit(event)}
                          className={`${LINK_BUTTON} text-link`}
                        >
                          Edit<span className="sr-only"> {event.title}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(event.id)}
                          className={`${LINK_BUTTON} text-late`}
                        >
                          Delete<span className="sr-only"> {event.title}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <section
          aria-labelledby="event-form-heading"
          className="rounded border border-card-line bg-paper p-4.5 shadow-card md:p-6"
        >
          <h2 id="event-form-heading" className="mb-4 text-h3">
            {editingId ? 'Edit event' : 'New event'}
          </h2>
          <form noValidate onSubmit={submit}>
            <Field label="Title" {...field('title')}>
              {(props) => (
                <input
                  {...props}
                  ref={titleRef}
                  type="text"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  className={INPUT}
                />
              )}
            </Field>
            <Field label="Date" {...field('date')}>
              {(props) => (
                <input
                  {...props}
                  type="date"
                  value={form.date}
                  onChange={(e) => setField('date', e.target.value)}
                  className={INPUT}
                />
              )}
            </Field>
            <div className="grid grid-cols-2 gap-x-3">
              <Field label="Starts" {...field('start')}>
                {(props) => (
                  <input
                    {...props}
                    type="time"
                    value={form.start}
                    onChange={(e) => setField('start', e.target.value)}
                    className={INPUT}
                  />
                )}
              </Field>
              <Field label="Ends" {...field('end')}>
                {(props) => (
                  <input
                    {...props}
                    type="time"
                    value={form.end}
                    onChange={(e) => setField('end', e.target.value)}
                    className={INPUT}
                  />
                )}
              </Field>
            </div>
            <Field
              label="Location"
              hint="A room, a campus area, or “Online.”"
              {...field('location')}
            >
              {(props) => (
                <input
                  {...props}
                  type="text"
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  className={INPUT}
                />
              )}
            </Field>
            <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
              <Field label="Category" {...field('category')}>
                {(props) => (
                  <select
                    {...props}
                    value={form.category}
                    onChange={(e) => setField('category', e.target.value)}
                    className={INPUT}
                  >
                    <option value="">Choose one</option>
                    {Object.entries(EVENT_CATEGORIES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Organizer" {...field('host')}>
                {(props) => (
                  <input
                    {...props}
                    type="text"
                    value={form.host}
                    onChange={(e) => setField('host', e.target.value)}
                    className={INPUT}
                  />
                )}
              </Field>
            </div>
            <Field label="Description" {...field('description')}>
              {(props) => (
                <textarea
                  {...props}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className={`${INPUT} block min-h-21 resize-y`}
                />
              )}
            </Field>
            <Field
              label="Registration link"
              hint="Optional. Postdocs see a Register link that opens this page."
              {...field('link')}
            >
              {(props) => (
                <input
                  {...props}
                  type="url"
                  placeholder="https://"
                  value={form.link}
                  onChange={(e) => setField('link', e.target.value)}
                  className={INPUT}
                />
              )}
            </Field>
            <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
              <button
                type="submit"
                data-status="published"
                disabled={saving}
                className={`${PRIMARY_BUTTON} ${BUSY}`}
              >
                Publish
              </button>
              <button
                type="submit"
                data-status="draft"
                disabled={saving}
                className={`${GHOST_BUTTON} ${BUSY}`}
              >
                Save as draft
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => startForm(BLANK_EVENT_FORM, null)}
                  className={`${LINK_BUTTON} text-link`}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </>
  )
}
