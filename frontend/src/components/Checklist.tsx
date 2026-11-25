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
import type { MyChecklist } from '#/lib/supabase/progress'
import { useChecklistProgress } from '#/lib/use-checklist-progress'
import Link from 'next/link'
import { useState } from 'react'

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

export function Checklist({
  start: startIso,
  visa,
  done: initiallyDone,
  unsaved,
  today: todayIso,
}: MyChecklist & {
  /** 'YYYY-MM-DD' */
  today: string
}) {
  const start = parseDate(startIso)
  const today = parseDate(todayIso)
  const { done, mark, error } = useChecklistProgress(
    initiallyDone,
    unsaved === null,
  )
  const [filter, setFilter] = useState<Filter>('all')

  const toggle = (id: string) => mark(id, !done.has(id))

  const rows: Row[] = TASKS.filter((task) => appliesTo(task, visa)).map(
    (task) => ({
      task,
      status: taskStatus(task, { start, today, done: done.has(task.id) }),
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
        <UnsavedNote reason={unsaved} />
        <SaveError message={error} />
      </div>

      <div className="mb-7 flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
        <FilterButtons
          label="Show tasks"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />
        <p className="text-small text-ink-2">
          Due dates are based on your start date, {formatDate(start, true)}.{' '}
          <Link href="/settings#appointment">Change it in Settings</Link>.
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
              {VISA_NOTE[visa]}{' '}
              <Link href="/settings#appointment">Change this in Settings</Link>.
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

/** Why tasks checked off on this page aren't saved. Nothing when they are. */
export function UnsavedNote({ reason }: { reason: MyChecklist['unsaved'] }) {
  if (!reason) return null
  return (
    <p className="mt-3 max-w-[65ch] text-small text-ink-2">
      {reason === 'guest' ? (
        'You’re using a guest account, so tasks you check off aren’t saved. Sign out and create an account to keep your progress.'
      ) : reason === 'no-profile' ? (
        <>
          Tasks you check off aren’t saved until you{' '}
          <Link href="/settings#appointment">add your appointment</Link>. Due
          dates below use a sample start date.
        </>
      ) : (
        'Couldn’t load your saved progress, so changes here won’t be saved. Reload the page to try again.'
      )}
    </p>
  )
}

/** Shown when checking a task off didn't save. */
export function SaveError({ message }: { message: string | null }) {
  // Always rendered, so screen readers announce the message when it appears.
  return (
    <p
      role="alert"
      className="mt-3 text-small font-semibold text-late empty:hidden"
    >
      {message}
    </p>
  )
}

/** The task's deadline: done, overdue, due soon, or the date. */
export function DueInfo({
  task,
  status,
}: {
  task: Pick<ChecklistTask, 'dueText'>
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
