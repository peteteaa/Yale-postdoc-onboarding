'use client'

import { FilterButtons } from '#/components/FilterButtons'
import { Pill } from '#/components/Pill'
import type { Status } from '#/components/StatusIcon'
import { StatusIcon } from '#/components/StatusIcon'
import type { ChecklistTask, Phase, Visa } from '#/data/checklist'
import { PHASES, TASKS } from '#/data/checklist'
import type { TaskStatus } from '#/lib/checklist'
import { appliesTo, taskStatus } from '#/lib/checklist'
import { formatDate, parseDate } from '#/lib/dates'
import { useState } from 'react'

// TODO: from the signed-in postdoc's profile and saved progress
const START_DATE = parseDate('2026-09-01')
const VISA: Visa = 'j1'
const INITIALLY_DONE = [
  'i9-form',
  'i9-documents',
  'netid',
  'id-card',
  'first-meetings',
  'trainings',
  'benefits',
  'vaccines',
  'oiss-orientation',
  'oiss-check-in',
  'ssn-apply',
  'tax-office',
]
// TODO: use the real date. Fixed so the page matches the mockup's sample data.
const TODAY = parseDate('2026-10-11')

const VISA_NOTE: Record<Visa, string> = {
  j1: "Shown because your profile says you're a J-1 scholar.",
  'f1-opt':
    "Shown because your profile says you're on F-1 OPT. Steps only for J-1 scholars are hidden.",
  domestic: '',
}

type Filter = 'all' | 'open' | 'required'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All tasks' },
  { value: 'open', label: 'Still to do' },
  { value: 'required', label: 'Required only' },
]

type Row = { task: ChecklistTask; status: TaskStatus }

export function Checklist() {
  // Ids of the tasks that are checked off.
  // TODO: save to the backend instead of keeping it in memory
  const [done, setDone] = useState(() => new Set(INITIALLY_DONE))
  const [filter, setFilter] = useState<Filter>('all')

  const toggle = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

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
  const doneCount = rows.filter((row) => row.status.kind === 'done').length
  const overdueCount = rows.filter(
    (row) => row.status.kind === 'overdue',
  ).length

  // Phases in a group, each with its tasks. Phases with no tasks for this visa are left out.
  const phasesIn = (group: Phase['group']) =>
    PHASES.filter((phase) => phase.group === group)
      .map((phase) => ({
        phase,
        rows: rows.filter((row) => row.task.phase === phase.id),
      }))
      .filter((p) => p.rows.length > 0)
  const international = phasesIn('international')

  return (
    <main className="mx-auto max-w-page px-4 pt-6 pb-12 md:px-10 md:pt-10 md:pb-18">
      <div className="mb-7 max-w-195">
        <h1 className="mb-2.5 text-h1 text-yale-blue">Onboarding checklist</h1>
        <p className="max-w-[65ch] text-lede text-ink-2">
          {doneCount} of {rows.length} tasks done.{' '}
          {overdueCount === 0
            ? 'Nothing is overdue.'
            : `${overdueCount} required ${overdueCount === 1 ? 'task is' : 'tasks are'} overdue.`}
        </p>
      </div>

      <div className="mb-7 flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
        <FilterButtons
          label="Show tasks"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />
        <p className="text-small text-ink-2">
          Due dates are based on your start date, {formatDate(START_DATE, true)}
          .
        </p>
      </div>

      {phasesIn('everyone').map(({ phase, rows: phaseRows }) => (
        <PhaseSection
          key={phase.id}
          phase={phase}
          rows={phaseRows}
          filter={filter}
          headingLevel={2}
          onToggle={toggle}
        />
      ))}

      {international.length > 0 && (
        <>
          <div className="mt-11 mb-5.5 rounded bg-wash px-6 py-5">
            <h2 className="mb-3 text-h2">International scholars</h2>
            <p className="text-small text-ink-2">
              {VISA_NOTE[VISA]} {/* TODO: link to Settings */}
              <a href="#">Change this in Settings</a>.
            </p>
          </div>
          {international.map(({ phase, rows: phaseRows }) => (
            <PhaseSection
              key={phase.id}
              phase={phase}
              rows={phaseRows}
              filter={filter}
              headingLevel={3}
              onToggle={toggle}
            />
          ))}
        </>
      )}
    </main>
  )
}

function PhaseSection({
  phase,
  rows,
  filter,
  headingLevel,
  onToggle,
}: {
  phase: Phase
  rows: Row[]
  filter: Filter
  headingLevel: 2 | 3
  onToggle: (taskId: string) => void
}) {
  const doneCount = rows.filter((row) => row.status.kind === 'done').length
  const status: Status =
    doneCount === rows.length
      ? 'done'
      : rows.some((row) => row.status.kind === 'overdue')
        ? 'overdue'
        : doneCount > 0
          ? 'in-progress'
          : 'not-started'
  const shown = rows.filter(
    (row) =>
      filter === 'all' ||
      (filter === 'open' && row.status.kind !== 'done') ||
      (filter === 'required' && row.task.required),
  )
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const headingId = `phase-${phase.id}`

  return (
    <section aria-labelledby={headingId} className="mb-8.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b-2 border-ink pb-2">
        <Heading
          id={headingId}
          className={headingLevel === 2 ? 'text-h2' : 'text-h3'}
        >
          {phase.title}
        </Heading>
        <span className="inline-flex items-center gap-1.75 text-small text-ink-2">
          <StatusIcon status={status} />
          {doneCount} of {rows.length} done
        </span>
      </div>
      {shown.length > 0 ? (
        <ul>
          {shown.map((row) => (
            <TaskItem
              key={row.task.id}
              task={row.task}
              status={row.status}
              onToggle={() => onToggle(row.task.id)}
            />
          ))}
        </ul>
      ) : (
        <p className="py-3.5 text-small text-ink-2">
          {filter === 'open'
            ? 'Everything in this phase is done.'
            : 'No required tasks in this phase.'}
        </p>
      )}
    </section>
  )
}

function TaskItem({ task, status, onToggle }: Row & { onToggle: () => void }) {
  const done = status.kind === 'done'
  const inputId = `task-${task.id}`

  return (
    <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 border-b border-line py-4">
      <input
        id={inputId}
        type="checkbox"
        checked={done}
        onChange={onToggle}
        className="mt-0.75 size-5.5 cursor-pointer accent-yale-blue"
      />
      <div>
        <label
          htmlFor={inputId}
          className={`block cursor-pointer text-task-title font-semibold ${done ? 'text-ink-2' : ''}`}
        >
          {task.title}
        </label>
        <div className="my-1.75 flex flex-wrap items-center gap-x-3 gap-y-2 text-small text-ink-2">
          <Pill variant={task.required ? 'required' : 'default'}>
            {task.required ? 'Required' : 'Optional'}
          </Pill>
          <DueInfo task={task} status={status} />
        </div>
        <p className="mb-1.5 max-w-[68ch] text-ink-2">{task.description}</p>
        {task.link && (
          <a href={task.link.href} className="text-small font-semibold">
            {task.link.label}
            <span aria-hidden="true"> ↗</span>
          </a>
        )}
      </div>
    </li>
  )
}

/** The task's deadline: done, overdue, due soon, or the date. */
function DueInfo({ task, status }: Row) {
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
