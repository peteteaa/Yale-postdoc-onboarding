import { Pill } from '#/components/Pill'
import type { Status } from '#/components/StatusIcon'
import { StatusIcon } from '#/components/StatusIcon'
import type { PhaseId } from '#/data/checklist'
import { TASKS } from '#/data/checklist'
import type { EventCategory, EventStatus, PostdocEvent } from '#/data/events'
import { EVENT_CATEGORIES, SAMPLE_EVENTS } from '#/data/events'
import type { PostdocProgress } from '#/data/postdocs'
import { POSTDOCS, WORKBOOK_MODULES } from '#/data/postdocs'
import { appliesTo, taskStatus } from '#/lib/checklist'
import {
  daysBetween,
  formatDate,
  formatMonth,
  formatTimeRange,
  parseDate,
} from '#/lib/dates'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react'

type View = 'overview' | 'events'

export const Route = createFileRoute('/admin')({
  validateSearch: (search: Record<string, unknown>): { view: View } => ({
    view: search.view === 'events' ? 'events' : 'overview',
  }),
  component: AdminPage,
})

// TODO: restrict to OPA staff once sign-in exists

// TODO: use the real date. Fixed so the page matches the mockup's sample data.
const TODAY = parseDate('2026-10-11')

const VIEWS: { value: View; label: string }[] = [
  { value: 'overview', label: 'Completion overview' },
  { value: 'events', label: 'Events' },
]

const BUTTON =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded border-[1.5px] border-yale-blue px-4.5 py-2.5 leading-tight font-semibold'
const PRIMARY_BUTTON = `${BUTTON} bg-yale-blue text-paper hover:brightness-115`
const GHOST_BUTTON = `${BUTTON} bg-paper text-yale-blue hover:bg-tint`
const LINK_BUTTON =
  'cursor-pointer px-0.5 py-1 text-small leading-none font-semibold underline underline-offset-3'
const INPUT =
  'w-full min-w-0 rounded border-[1.5px] border-field-line bg-paper px-3 py-2.5 text-large leading-[1.45] aria-invalid:border-late'

function AdminPage() {
  const { view } = Route.useSearch()
  // Kept here so edits survive switching views.
  // TODO: load from and save to the backend
  const [events, setEvents] = useState(SAMPLE_EVENTS)

  return (
    <>
      <nav aria-label="Staff pages" className="border-b border-line">
        <ul className="mx-auto flex max-w-page flex-wrap gap-x-7 px-4 md:px-10">
          {VIEWS.map((option) => (
            <li key={option.value}>
              <Link
                to="/admin"
                search={{ view: option.value }}
                aria-current={option.value === view ? 'page' : undefined}
                className="block border-b-3 border-transparent pt-3.5 pb-2.75 text-medium text-ink no-underline hover:border-line aria-[current=page]:border-yale-blue aria-[current=page]:font-semibold"
              >
                {option.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="mx-auto max-w-page px-4 pt-6 pb-12 md:px-10 md:pt-10 md:pb-18">
        {view === 'events' ? (
          <EventsView events={events} setEvents={setEvents} />
        ) : (
          <OverviewView />
        )}
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

// TODO: from the backend. These cover the whole cohort, not just the rows below.
const COHORT_TOTALS: {
  label: string
  value: string
  detail: string
  percent?: number
  warn?: boolean
}[] = [
  {
    label: 'First-day tasks done',
    value: '96%',
    detail: '46 of 48 postdocs',
    percent: 96,
  },
  {
    label: '30-day checklist done',
    value: '63%',
    detail: '30 of 48 postdocs',
    percent: 63,
  },
  {
    label: 'Have an overdue required task',
    value: '7',
    detail: 'postdocs, 4 of them international',
    warn: true,
  },
  {
    label: 'Started the workbook',
    value: '81%',
    detail: '39 of 48 postdocs',
    percent: 81,
  },
]

type ColumnProgress = { done: number; total: number; overdue: boolean }

type Row = {
  postdoc: PostdocProgress
  /** One per column. null when none of its tasks apply to this postdoc. */
  columns: (ColumnProgress | null)[]
  overdue: boolean
}

function rowFor(postdoc: PostdocProgress): Row {
  const start = parseDate(postdoc.start)
  const columns = COLUMNS.map((column, i) => {
    const tasks = TASKS.filter(
      (task) =>
        column.phases.includes(task.phase) && appliesTo(task, postdoc.visa),
    )
    if (tasks.length === 0) return null
    const done = Math.min(postdoc.checklistDone[i], tasks.length)
    return {
      done,
      total: tasks.length,
      overdue: tasks.some(
        (task, j) =>
          taskStatus(task, { start, today: TODAY, done: j < done }).kind ===
          'overdue',
      ),
    }
  })
  return {
    postdoc,
    columns,
    overdue: columns.some((column) => column?.overdue),
  }
}

const ROWS = POSTDOCS.map(rowFor)
const DEPARTMENTS = [...new Set(POSTDOCS.map((p) => p.department))].sort()
// 'YYYY-MM' of each start date, oldest first
const START_MONTHS = [
  ...new Set(POSTDOCS.map((p) => p.start.slice(0, 7))),
].sort()

type Filters = {
  search: string
  department: string
  startMonth: string
  group: 'all' | 'international' | 'domestic'
  status: 'all' | 'overdue' | 'workbook-not-started'
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
      postdoc.name.toLowerCase().includes(search) ||
      postdoc.netId.includes(search)) &&
    (filters.department === 'all' ||
      postdoc.department === filters.department) &&
    (filters.startMonth === 'all' ||
      postdoc.start.startsWith(filters.startMonth)) &&
    (filters.group === 'all' ||
      (filters.group === 'international') === (postdoc.visa !== 'domestic')) &&
    (filters.status === 'all' ||
      (filters.status === 'overdue'
        ? row.overdue
        : postdoc.workbookModulesDone === 0))
  )
}

function OverviewView() {
  const [filters, setFilters] = useState(NO_FILTERS)
  const setFilter = <TKey extends keyof Filters>(
    key: TKey,
    value: Filters[TKey],
  ) => setFilters((prev) => ({ ...prev, [key]: value }))
  const rows = ROWS.filter((row) => matches(row, filters))

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-180">
          <h1 className="mb-2.5 text-h1 text-yale-blue">Completion overview</h1>
          <p className="max-w-[65ch] text-lede text-ink-2">
            Checklist and workbook status for each postdoc. Workbook answers and
            IDPs are never shown here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <label htmlFor="cohort" className="sr-only">
            Cohort
          </label>
          {/* TODO: load the chosen cohort */}
          <select id="cohort" className={`${INPUT} w-auto`}>
            <option>Fall 2026 cohort (48)</option>
            <option>Summer 2026 cohort (31)</option>
            <option>All active postdocs (212)</option>
          </select>
          <button
            type="button"
            className={GHOST_BUTTON}
            onClick={() => downloadCsv(rows)}
          >
            Export CSV
          </button>
        </div>
      </div>

      <ul
        aria-label="Cohort totals"
        className="mb-7.5 grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {COHORT_TOTALS.map((total) => (
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
            ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
          ]}
        />
        <SelectFilter
          id="filter-start"
          label="Start date"
          value={filters.startMonth}
          onChange={(value) => setFilter('startMonth', value)}
          options={[
            { value: 'all', label: 'Any month' },
            ...START_MONTHS.map((month) => ({
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
            { value: 'workbook-not-started', label: 'Workbook not started' },
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
                  key={row.postdoc.netId}
                  className="border-b border-line last:border-b-0 hover:bg-wash"
                >
                  {/* TODO: link to the postdoc detail page */}
                  <th scope="row" className={CELL}>
                    <span className="font-semibold">{row.postdoc.name}</span>
                    <span className="block text-micro text-ink-2">
                      {row.postdoc.netId}
                    </span>
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
                    <WorkbookCell done={row.postdoc.workbookModulesDone} />
                  </td>
                  <td className={NO_WRAP}>{lastActive(row.postdoc)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5 + COLUMNS.length} className={CELL}>
                  No postdocs match these filters.{' '}
                  <button
                    type="button"
                    onClick={() => setFilters(NO_FILTERS)}
                    className={`${LINK_BUTTON} text-link`}
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2.5 flex flex-wrap justify-between gap-2.5 text-small text-ink-2">
        <p>
          {rows.length} shown. Sample data: {POSTDOCS.length} of the 48 postdocs
          in this cohort.
        </p>
        <p>Totals above cover the whole cohort.</p>
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

function WorkbookCell({ done }: { done: number }) {
  const status: Status =
    done === WORKBOOK_MODULES
      ? 'done'
      : done > 0
        ? 'in-progress'
        : 'not-started'
  return (
    <StatusCell status={status}>
      {done} of {WORKBOOK_MODULES}
    </StatusCell>
  )
}

function lastActive(postdoc: PostdocProgress): string {
  const date = parseDate(postdoc.lastActive)
  return daysBetween(date, TODAY) === 0 ? 'Today' : formatDate(date)
}

/** Downloads the rows as a CSV file, with the same columns as the table. */
function downloadCsv(rows: Row[]) {
  const header = [
    'Name',
    'NetID',
    'Department',
    'Start date',
    ...COLUMNS.map((column) => column.label),
    'Workbook modules done',
    'Last active',
  ]
  const lines = rows.map(({ postdoc, columns }) => [
    postdoc.name,
    postdoc.netId,
    postdoc.department,
    postdoc.start,
    ...columns.map((column) =>
      column
        ? `${column.done} of ${column.total}${column.overdue ? ' (overdue)' : ''}`
        : 'N/A',
    ),
    `${postdoc.workbookModulesDone} of ${WORKBOOK_MODULES}`,
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

type EventForm = Omit<PostdocEvent, 'id' | 'category' | 'status'> & {
  category: EventCategory | ''
}
type FormField = keyof EventForm
type FormErrors = Partial<Record<FormField, string>>

const BLANK_FORM: EventForm = {
  title: '',
  date: '',
  start: '',
  end: '',
  location: '',
  category: '',
  host: 'Office of Postdoctoral Affairs',
  description: '',
  link: '',
}

function validate(form: EventForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.title.trim()) errors.title = 'Add a title.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) errors.date = 'Choose a date.'
  if (!form.start) errors.start = 'Add a start time.'
  if (form.start && form.end && form.end <= form.start)
    errors.end = 'End time must be after the start time.'
  if (!form.category)
    errors.category = 'Choose a category so postdocs can filter for it.'
  if (form.link.trim() && !/^https:\/\/\S+\.\S+/.test(form.link.trim()))
    errors.link = 'Use a full link that starts with https://'
  return errors
}

const byDate = (a: PostdocEvent, b: PostdocEvent) =>
  (a.date + a.start).localeCompare(b.date + b.start)

function EventsView({
  events,
  setEvents,
}: {
  events: PostdocEvent[]
  setEvents: Dispatch<SetStateAction<PostdocEvent[]>>
}) {
  const [form, setForm] = useState(BLANK_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  // The event being edited, or null when the form makes a new one.
  const [editingId, setEditingId] = useState<string | null>(null)
  // The event whose delete is waiting for confirmation.
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  // Result of the last action, read out by screen readers.
  const [notice, setNotice] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  const startForm = (values: EventForm, id: string | null) => {
    setForm(values)
    setErrors({})
    setEditingId(id)
    titleRef.current?.focus()
  }

  const edit = ({ id, category, ...rest }: PostdocEvent) =>
    startForm({ ...rest, category }, id)

  const remove = (event: PostdocEvent) => {
    setEvents((prev) => prev.filter((e) => e.id !== event.id))
    setConfirmingId(null)
    if (editingId === event.id) startForm(BLANK_FORM, null)
    setNotice(`Deleted “${event.title}.”`)
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter
    const status: EventStatus =
      submitter?.dataset.status === 'draft' ? 'draft' : 'published'
    const found = validate(form)
    setErrors(found)
    const firstError = Object.keys(found)[0]
    if (firstError) {
      document.getElementById(`event-${firstError}`)?.focus()
      return
    }
    const event: PostdocEvent = {
      ...form,
      id: editingId ?? crypto.randomUUID(),
      title: form.title.trim(),
      link: form.link.trim(),
      category: form.category as EventCategory,
      status,
    }
    setEvents((prev) =>
      editingId
        ? prev.map((existing) => (existing.id === editingId ? event : existing))
        : [...prev, event],
    )
    setForm(BLANK_FORM)
    setEditingId(null)
    setNotice(
      status === 'published'
        ? `Published “${event.title}.” Postdocs can see it on Events & programs now.`
        : `Saved “${event.title}” as a draft. Postdocs can’t see it yet.`,
    )
  }

  const field = (key: FormField) => ({
    id: `event-${key}`,
    error: errors[key],
  })
  const setField = (key: FormField, value: string) =>
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
          onClick={() => startForm(BLANK_FORM, null)}
        >
          New event
        </button>
      </div>

      <div role="status">
        {notice && (
          <p className="mb-5 rounded bg-tint px-4 py-3 text-small text-tint-ink">
            {notice}
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
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className={CELL}>
                    No events yet.
                  </td>
                </tr>
              )}
              {[...events].sort(byDate).map((event) =>
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
                          className="inline-flex min-h-9 cursor-pointer items-center rounded border-[1.5px] border-late bg-late px-3 py-1.5 text-small font-semibold text-paper"
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
                className={PRIMARY_BUTTON}
              >
                Publish
              </button>
              <button
                type="submit"
                data-status="draft"
                className={GHOST_BUTTON}
              >
                Save as draft
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => startForm(BLANK_FORM, null)}
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

/** Props that tie a form control to its label, hint, and error. */
type ControlProps = {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

/** A labeled form control with an optional hint and error message. */
function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: (props: ControlProps) => ReactNode
}) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="mb-4.5 grid grid-cols-1 gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-small text-ink-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-small font-semibold text-late">
          {error}
        </p>
      )}
    </div>
  )
}
