'use client'

import { PRIMARY_BUTTON } from '#/components/Form'
import { StatusIcon } from '#/components/StatusIcon'
import type { AnswerUpdate, SaveStatus } from '#/components/WorkbookAnswers'
import {
  retrySave,
  useAllAnswers,
  useFailedSaves,
  useSectionAnswers,
} from '#/components/WorkbookAnswers'
import type { Resource } from '#/data/resources'
import type {
  ChoicePrompt,
  DatePrompt,
  InfoList,
  MatrixPrompt,
  PickPrompt,
  Prompt,
  SectionAnswers,
  SectionStatus,
  TablePrompt,
  TextPrompt,
  WorkbookSection,
} from '#/data/workbook'
import {
  MAX_CELL_LENGTH,
  MAX_OWN_OPTION_LENGTH,
  MAX_PICKS,
  MAX_TEXT_LENGTH,
  MODULES,
  SECTIONS,
  sectionHref,
  sectionPrompts,
  sectionStatus,
} from '#/data/workbook'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { FormEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

// Same look as the admin forms' fields and ghost button.
const INPUT =
  'w-full min-w-0 rounded border-[1.5px] border-field-line bg-paper px-3 py-2.5 text-large leading-[1.45]'
const GHOST_BUTTON =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded border-[1.5px] border-yale-blue bg-paper px-4.5 py-2.5 leading-tight font-semibold text-yale-blue hover:bg-tint disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-paper'

const STATUS_TEXT: Record<SectionStatus, string> = {
  done: 'Done',
  'in-progress': 'In progress',
  'not-started': 'Not started',
}

/** The section to focus when its page opens, after clicking Previous or Next. */
let focusOnArrival: string | null = null

/**
 * The workbook's heading, privacy note, and table of contents, around each
 * section's page. Used by the workbook layout, so it stays while moving
 * between sections.
 */
export function WorkbookShell({
  loadError,
  children,
}: {
  /** Set when the saved answers couldn't be loaded. */
  loadError: boolean
  children: ReactNode
}) {
  return (
    <main className="mx-auto max-w-page px-4 pt-6 pb-12 md:px-10 md:pt-10 md:pb-18">
      <div className="mb-7 max-w-195">
        <h1 className="mb-2.5 text-h1 text-yale-blue">Workbook</h1>
        <p className="max-w-[65ch] text-lede text-pretty text-ink-2">
          Bullet points are enough, and you can come back to any section later.
        </p>
      </div>
      <PrivacyNote />

      <div className="lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-10">
        <TableOfContents />
        <div>
          {/* Without the saved answers, saving would overwrite them, so don't show the form. */}
          {loadError ? (
            <p role="alert" className="rounded bg-wash px-4 py-3">
              Your answers couldn’t be loaded right now. Try again in a few
              minutes.
            </p>
          ) : (
            children
          )}
        </div>
      </div>
    </main>
  )
}

/**
 * Every section, under its module, with the current one marked. Beside the
 * section on wide screens; behind an "All sections" button on narrow ones.
 */
function TableOfContents() {
  const pathname = usePathname()
  const current = SECTIONS.findIndex(
    ({ module, section }) => sectionHref(module.id, section.id) === pathname,
  )
  const [open, setOpen] = useState(false)
  // Close the list on moving to another page, including with Back later.
  const [openedOn, setOpenedOn] = useState(pathname)
  if (pathname !== openedOn) {
    setOpenedOn(pathname)
    setOpen(false)
  }
  const toggle = useRef<HTMLButtonElement>(null)
  const answers = useAllAnswers()

  return (
    <nav
      aria-label="Workbook sections"
      className="mb-8 border-y border-line lg:sticky lg:top-6 lg:mb-0 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:border-0"
    >
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls="workbook-sections"
        onClick={() => setOpen(!open)}
        className="flex min-h-12.5 w-full cursor-pointer items-center justify-between gap-4 text-medium font-semibold lg:hidden"
      >
        All sections
        {current >= 0 && (
          <span className="font-normal text-ink-2">
            {current + 1} of {SECTIONS.length}
          </span>
        )}
      </button>
      <ol
        id="workbook-sections"
        className={`${open ? 'grid' : 'hidden'} gap-5 pt-2 pb-5 lg:grid lg:p-0`}
      >
        {MODULES.map((module) => (
          <li key={module.id}>
            <p className="mb-1.5 text-label font-semibold tracking-label text-ink-2 uppercase">
              {module.title}
            </p>
            <ol className="grid gap-0.5">
              {module.sections.map((section) => {
                const href = sectionHref(module.id, section.id)
                const status = sectionStatus(section, answers[section.id])
                return (
                  <li key={section.id}>
                    <Link
                      href={href}
                      aria-current={href === pathname ? 'page' : undefined}
                      onClick={() => {
                        // On narrow screens, close the list and keep focus
                        // where it was opened from, not on a hidden link.
                        if (open) {
                          setOpen(false)
                          toggle.current?.focus()
                        }
                      }}
                      className="flex gap-2.5 rounded px-3 py-2 text-small leading-snug text-pretty text-ink no-underline hover:bg-wash aria-[current=page]:bg-tint aria-[current=page]:font-semibold aria-[current=page]:text-tint-ink aria-[current=page]:shadow-[inset_3px_0_0_var(--color-yale-blue)]"
                    >
                      {/* Sections with nothing to answer get no status, but keep their title in line. */}
                      {status ? (
                        <StatusIcon status={status} />
                      ) : (
                        <span className="size-5 shrink-0" />
                      )}
                      <span>
                        {section.title}
                        {status && (
                          <span className="sr-only">
                            , {STATUS_TEXT[status]}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** One section's page: its module's heading, then the section. */
export function WorkbookSection({
  moduleId,
  sectionId,
  resources,
}: {
  moduleId: string
  sectionId: string
  /** The Resources page's links, or null if they couldn't be loaded. */
  resources: Resource[] | null
}) {
  const index = SECTIONS.findIndex(
    ({ module, section }) => module.id === moduleId && section.id === sectionId,
  )
  const { module, section } = SECTIONS[index]

  return (
    <>
      <OtherFailedSaves sectionId={section.id} />
      <h2 className={`text-h2 ${module.description ? 'mb-1' : 'mb-4'}`}>
        {module.title}
      </h2>
      {module.description && (
        <p className="mb-4 text-small text-pretty text-ink-2">
          {module.description}
        </p>
      )}
      <SectionCard
        section={section}
        resources={resources}
        footer={<SectionPager index={index} />}
      />
    </>
  )
}

/**
 * Other sections whose changes didn't save, e.g. after moving on before a
 * save went through. Shown here because their own Try again isn't on screen.
 */
function OtherFailedSaves({ sectionId }: { sectionId: string }) {
  const failedIds = useFailedSaves()
  const failed = SECTIONS.filter(
    ({ section }) => section.id !== sectionId && failedIds.includes(section.id),
  )
  if (failed.length === 0) return null

  return (
    <div role="alert" className="mb-8 grid gap-3 rounded bg-wash px-4 py-3">
      {failed.map(({ module, section }) => (
        <div
          key={section.id}
          className="flex flex-wrap items-center gap-x-4 gap-y-2"
        >
          <p className="font-semibold text-late">
            Your changes to{' '}
            <Link href={sectionHref(module.id, section.id)}>
              {section.title}
            </Link>{' '}
            didn’t save.
          </p>
          <button
            type="button"
            onClick={() => retrySave(section.id)}
            className={GHOST_BUTTON}
          >
            Try again
            <span className="sr-only"> to save {section.title}</span>
          </button>
        </div>
      ))}
    </div>
  )
}

/** Links to the sections before and after this one, across modules. */
function SectionPager({ index }: { index: number }) {
  const prev = SECTIONS[index - 1]
  const next = SECTIONS[index + 1]

  return (
    <nav
      aria-label="Previous and next sections"
      className="mt-5 flex flex-wrap justify-between gap-3 border-t border-card-line pt-5"
    >
      {prev && (
        <Link
          href={sectionHref(prev.module.id, prev.section.id)}
          onClick={() => (focusOnArrival = prev.section.id)}
          className={`${GHOST_BUTTON} no-underline max-sm:w-full`}
        >
          Previous<span className="sr-only">: {prev.section.title}</span>
        </Link>
      )}
      {next && (
        <Link
          href={sectionHref(next.module.id, next.section.id)}
          onClick={() => (focusOnArrival = next.section.id)}
          className={`${PRIMARY_BUTTON} ml-auto text-center text-balance no-underline max-sm:w-full`}
        >
          Next: {next.section.title}
        </Link>
      )}
    </nav>
  )
}

function SectionCard({
  section,
  resources,
  footer,
}: {
  section: WorkbookSection
  resources: Resource[] | null
  footer: ReactNode
}) {
  const headingId = `section-${section.id}`
  const { answers, status, onAnswer } = useSectionAnswers(section.id)

  // After Previous or Next, start from this section's heading, as if it were
  // a new page. The page has already scrolled to the top.
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (focusOnArrival !== section.id) return
    focusOnArrival = null
    heading.current?.focus()
  }, [section.id])

  const resourceBox = section.resources && (
    <ResourceBox
      title={section.resources.title}
      items={
        resources?.filter((r) => r.topic === section.resources?.topic) ?? null
      }
      footnote={section.resources.footnote}
    />
  )
  const resourcesAfter = section.resources?.placement === 'after'

  return (
    <section
      aria-labelledby={headingId}
      className="rounded border border-card-line bg-paper p-4.5 shadow-card md:p-6"
    >
      {section.when && (
        <p className="mb-2 text-label font-semibold tracking-label text-ink-2 uppercase">
          {section.when}
        </p>
      )}
      <h3 id={headingId} ref={heading} tabIndex={-1} className="mb-2 text-h3">
        {section.title}
      </h3>
      {section.description && (
        <p className="mb-5 text-pretty text-ink-2">{section.description}</p>
      )}
      {section.lists && <InfoLists lists={section.lists} />}
      {!resourcesAfter && resourceBox}
      {section.prompts && (
        <PromptList
          prompts={section.prompts}
          answers={answers}
          onAnswer={onAnswer}
        />
      )}
      {section.parts?.map((part, index) => (
        <div
          key={part.ref}
          className={
            index > 0 || section.prompts || section.lists
              ? 'mt-6 border-t border-card-line pt-5'
              : ''
          }
        >
          {part.when && (
            <p className="mb-1 text-label-sm font-semibold tracking-label text-ink-2 uppercase">
              {part.when}
            </p>
          )}
          <h4 className="mb-3 text-task-title font-bold text-balance">
            {part.title}
          </h4>
          {part.description && (
            <p className="-mt-1.5 mb-4 text-pretty text-ink-2">
              {part.description}
            </p>
          )}
          {part.lists && <InfoLists lists={part.lists} />}
          {part.prompts && (
            <PromptList
              prompts={part.prompts}
              answers={answers}
              onAnswer={onAnswer}
            />
          )}
          {part.note && <p className="mt-6 text-pretty">{part.note}</p>}
        </div>
      ))}
      {section.note && (
        <p className="my-6 text-pretty">
          {section.note.text}{' '}
          <ExternalLink url={section.note.link.url}>
            {section.note.link.label}
          </ExternalLink>
          .
        </p>
      )}
      {resourcesAfter && resourceBox}
      {section.footnote && (
        <p className="mt-6 text-caption text-pretty text-ink-2">
          {section.footnote}
        </p>
      )}
      {sectionPrompts(section).length > 0 && (
        <SaveMessage status={status} onRetry={() => retrySave(section.id)} />
      )}
      {footer}
    </section>
  )
}

/** Bulleted lists to read, each with an optional heading. */
function InfoLists({ lists }: { lists: InfoList[] }) {
  return lists.map((list, index) => (
    <div key={list.heading ?? index} className="mb-5">
      {list.heading && <h5 className="mb-1 font-semibold">{list.heading}</h5>}
      <ul className="grid list-disc gap-1 pl-5 text-pretty marker:text-ink-2">
        {list.items.map((item) =>
          typeof item === 'string' ? (
            <li key={item}>{item}</li>
          ) : (
            <li key={item.text}>
              <ExternalLink url={item.url}>{item.text}</ExternalLink>
            </li>
          ),
        )}
      </ul>
    </div>
  ))
}

/** Links from one topic of the Resources page. */
function ResourceBox({
  title,
  items,
  footnote,
}: {
  title: string
  /** null if the resources couldn't be loaded. */
  items: Resource[] | null
  footnote?: string
}) {
  return (
    <div className="my-6 rounded bg-wash px-4 py-4 md:px-5">
      <h4 className="mb-3 text-task-title font-bold text-balance">{title}</h4>
      {items === null ? (
        <p className="text-small text-ink-2">
          These resources couldn’t be loaded right now.
        </p>
      ) : (
        <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {items.map((resource) => (
            <li key={resource.id}>
              <ExternalLink
                url={resource.url}
                className="font-semibold text-pretty"
              >
                {resource.name}
              </ExternalLink>
              {resource.description && (
                <p className="mt-0.5 text-small text-pretty text-ink-2">
                  {resource.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {footnote && (
        <p className="mt-4 text-small text-pretty text-ink-2">{footnote}</p>
      )}
    </div>
  )
}

/** A link that opens in a new tab, so the workbook stays open. */
function ExternalLink({
  url,
  className,
  children,
}: {
  url: string
  className?: string
  children: ReactNode
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

/** The fields for some prompts, leaving out any whose `showIf` doesn't match. */
function PromptList({
  prompts,
  answers,
  onAnswer,
}: {
  prompts: Prompt[]
  answers: SectionAnswers
  onAnswer: (promptId: string, update: AnswerUpdate) => void
}) {
  return prompts
    .filter(
      (prompt) =>
        !prompt.showIf ||
        answers[prompt.showIf.promptId] === prompt.showIf.answer,
    )
    .map((prompt) => {
      const answer = answers[prompt.id]
      switch (prompt.kind) {
        case 'text':
          return (
            <TextField
              key={prompt.id}
              prompt={prompt}
              value={typeof answer === 'string' ? answer : ''}
              onChange={(value) => onAnswer(prompt.id, value)}
            />
          )
        case 'date':
          return (
            <DateField
              key={prompt.id}
              prompt={prompt}
              value={typeof answer === 'string' ? answer : ''}
              onChange={(value) => onAnswer(prompt.id, value)}
            />
          )
        case 'choice':
          return (
            <ChoiceField
              key={prompt.id}
              prompt={prompt}
              value={typeof answer === 'string' ? answer : ''}
              onChange={(value) => onAnswer(prompt.id, value)}
            />
          )
        case 'pick':
          return (
            <PickField
              key={prompt.id}
              prompt={prompt}
              value={Array.isArray(answer) ? answer : []}
              onChange={(update) =>
                onAnswer(prompt.id, (prev) =>
                  update(Array.isArray(prev) ? prev : []),
                )
              }
            />
          )
        case 'table':
          return (
            <TableField
              key={prompt.id}
              prompt={prompt}
              value={Array.isArray(answer) ? answer : []}
              onChange={(index, text) =>
                onAnswer(prompt.id, (prev) => {
                  const cells = Array.from(
                    { length: prompt.rows * prompt.columns.length },
                    (_, i) => (Array.isArray(prev) ? prev[i] : undefined) ?? '',
                  )
                  cells[index] = text
                  return cells
                })
              }
            />
          )
        case 'matrix':
          return (
            <MatrixField
              key={prompt.id}
              prompt={prompt}
              answers={answers}
              onChange={(rowId, option) => onAnswer(rowId, option)}
            />
          )
      }
    })
}

function SaveMessage({
  status,
  onRetry,
}: {
  status: SaveStatus
  onRetry: () => void
}) {
  if (status === 'error') {
    return (
      <div
        role="alert"
        className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2"
      >
        <p className="font-semibold text-late">Your changes didn’t save.</p>
        <button type="button" onClick={onRetry} className={GHOST_BUTTON}>
          Try again
        </button>
      </div>
    )
  }
  // Takes up its line even when empty, so cards below don't jump when it appears.
  return (
    <p className="mt-5 min-h-[1lh] text-small text-ink-2">
      {status === 'saving' && 'Saving…'}
      {status === 'saved' && 'Saved'}
    </p>
  )
}

function PrivacyNote() {
  return (
    <p className="mb-10 flex w-fit max-w-full items-start gap-2.5 rounded bg-wash px-3.5 py-3 text-small text-ink-2">
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="mt-0.5 size-4.5 shrink-0 fill-none stroke-current"
        strokeWidth={1.8}
        strokeLinejoin="round"
      >
        <rect x="4" y="9" width="12" height="8.5" rx="1.5" />
        <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
      </svg>
      Only you can see your answers. OPA staff see only whether each section is
      done.
    </p>
  )
}

function TextField({
  prompt,
  value,
  onChange,
}: {
  prompt: TextPrompt
  value: string
  onChange: (value: string) => void
}) {
  const inputId = `prompt-${prompt.id}`
  const hintId = `${inputId}-hint`

  return (
    <div className="mb-6 last:mb-0">
      <label
        htmlFor={inputId}
        className="mb-1.5 block leading-[1.4] font-semibold text-pretty"
      >
        {prompt.label && (
          <span className="mb-0.75 block text-label tracking-label text-ink-2 uppercase">
            {prompt.label}
          </span>
        )}
        {prompt.question}
        {prompt.optional && (
          <span className="text-small font-normal text-ink-2">
            {' '}
            ({prompt.optional})
          </span>
        )}
      </label>
      {prompt.hint && (
        <p id={hintId} className="mb-2 text-small text-pretty text-ink-2">
          {prompt.hint}
        </p>
      )}
      {prompt.short ? (
        <input
          id={inputId}
          type="text"
          maxLength={MAX_TEXT_LENGTH}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={prompt.hint ? hintId : undefined}
          className={`${INPUT} max-w-130`}
        />
      ) : (
        <textarea
          id={inputId}
          rows={3}
          maxLength={MAX_TEXT_LENGTH}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={prompt.hint ? hintId : undefined}
          className={`${INPUT} block min-h-21 resize-y`}
        />
      )}
      {prompt.source && <Source text={prompt.source} />}
    </div>
  )
}

function DateField({
  prompt,
  value,
  onChange,
}: {
  prompt: DatePrompt
  /** YYYY-MM-DD, or '' for none. */
  value: string
  onChange: (value: string) => void
}) {
  const inputId = `prompt-${prompt.id}`
  const hintId = `${inputId}-hint`

  return (
    <div className="mb-6 last:mb-0">
      <label
        htmlFor={inputId}
        className="mb-1.5 block leading-[1.4] font-semibold text-pretty"
      >
        {prompt.question}
      </label>
      {prompt.hint && (
        <p id={hintId} className="mb-2 text-small text-pretty text-ink-2">
          {prompt.hint}
        </p>
      )}
      <input
        id={inputId}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={prompt.hint ? hintId : undefined}
        className={`${INPUT} w-auto`}
      />
      {prompt.source && <Source text={prompt.source} />}
    </div>
  )
}

/** Guidance under a question that's a legend or a heading. */
function Hint({ text }: { text?: string }) {
  return text ? (
    <p className="mb-2 text-small text-pretty text-ink-2">{text}</p>
  ) : null
}

/** Where a prompt's content comes from, under the field. */
function Source({ text }: { text: string }) {
  return <p className="mt-3 text-caption text-pretty text-ink-2">{text}</p>
}

// Table and matrix columns, from md up. Sized for the workbook's tables: two
// columns (a short one, then a longer one), and a matrix with four options.
const TABLE_COLUMNS = 'md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'
const MATRIX_COLUMNS = 'md:grid-cols-[minmax(0,1fr)_repeat(4,6.5rem)]'

/**
 * A small table of text boxes. On wider screens the column names are shown
 * once, above the rows; on phones each box has its own label.
 */
function TableField({
  prompt,
  value,
  onChange,
}: {
  prompt: TablePrompt
  /** The cells, row by row. */
  value: string[]
  onChange: (index: number, text: string) => void
}) {
  const fieldId = `prompt-${prompt.id}`

  return (
    <fieldset className="mb-6 min-w-0 last:mb-0">
      <legend className="sr-only">{prompt.question}</legend>
      <Hint text={prompt.hint} />
      <div
        aria-hidden="true"
        className={`mb-1.5 hidden gap-3 font-semibold md:grid ${TABLE_COLUMNS}`}
      >
        {prompt.columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      <div className="grid gap-4 md:gap-3">
        {Array.from({ length: prompt.rows }, (_, row) => (
          <div
            key={row}
            className={`grid gap-3 border-t border-card-line pt-4 first:border-0 first:pt-0 md:border-0 md:pt-0 ${TABLE_COLUMNS}`}
          >
            {prompt.columns.map((column, col) => {
              const index = row * prompt.columns.length + col
              const inputId = `${fieldId}-${index}`
              return (
                <div key={column} className="grid content-start gap-1.5">
                  <label
                    htmlFor={inputId}
                    className="text-small font-semibold md:sr-only"
                  >
                    {column}
                    <span className="sr-only">, row {row + 1}</span>
                  </label>
                  <textarea
                    id={inputId}
                    rows={2}
                    maxLength={MAX_CELL_LENGTH}
                    value={value[index] ?? ''}
                    onChange={(e) => onChange(index, e.target.value)}
                    className={`${INPUT} block resize-y`}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {prompt.source && <Source text={prompt.source} />}
    </fieldset>
  )
}

/**
 * One choice per row, grouped. On wider screens it's a grid with the options
 * as column headers; on phones each row lists its options with labels.
 */
function MatrixField({
  prompt,
  answers,
  onChange,
}: {
  prompt: MatrixPrompt
  /** The section's answers. Each row's answer is under its id. */
  answers: SectionAnswers
  onChange: (rowId: string, option: string) => void
}) {
  const fieldId = `prompt-${prompt.id}`

  return (
    <div role="group" aria-labelledby={fieldId} className="mb-6 last:mb-0">
      <p id={fieldId} className="mb-3 leading-[1.4] font-semibold text-pretty">
        {prompt.question}
      </p>
      <Hint text={prompt.hint} />
      <div
        aria-hidden="true"
        className={`hidden items-end gap-x-2 border-b-2 border-ink pb-2 text-small font-semibold md:grid ${MATRIX_COLUMNS}`}
      >
        <span>{prompt.rowHeader}</span>
        {prompt.options.map((option) => (
          <span key={option} className="text-center text-balance">
            {option}
          </span>
        ))}
      </div>
      {prompt.groups.map((group) => (
        <div key={group.label} className="mt-5">
          <h4 className="mb-1 text-label font-semibold tracking-label text-ink-2 uppercase">
            {group.label}
          </h4>
          {group.rows.map((row) => (
            <fieldset
              key={row.id}
              className="min-w-0 border-t border-card-line py-2.5"
            >
              <legend className="sr-only">{row.label}</legend>
              <div className={`items-center gap-x-2 md:grid ${MATRIX_COLUMNS}`}>
                <p aria-hidden="true" className="mb-1.5 text-pretty md:mb-0">
                  {row.label}
                </p>
                {prompt.options.map((option) => (
                  <label
                    key={option}
                    className="mr-5 inline-flex cursor-pointer items-center gap-2 py-1 md:mr-0 md:flex md:justify-center"
                  >
                    <input
                      type="radio"
                      name={`${fieldId}-${row.id}`}
                      value={option}
                      checked={answers[row.id] === option}
                      onChange={() => onChange(row.id, option)}
                      className="size-5.5 shrink-0 cursor-pointer accent-yale-blue"
                    />
                    <span className="text-small md:sr-only">{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      ))}
      {prompt.source && <Source text={prompt.source} />}
    </div>
  )
}

/** One option, as radio buttons. */
function ChoiceField({
  prompt,
  value,
  onChange,
}: {
  prompt: ChoicePrompt
  value: string
  onChange: (value: string) => void
}) {
  return (
    <fieldset className="mb-6 min-w-0 last:mb-0">
      <legend className="mb-2 leading-[1.4] font-semibold text-pretty">
        {prompt.question}
      </legend>
      <Hint text={prompt.hint} />
      <div className="grid gap-2">
        {prompt.options.map((option) => (
          <label
            key={option}
            className="flex w-fit cursor-pointer items-start gap-2.5"
          >
            <input
              type="radio"
              name={`prompt-${prompt.id}`}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="mt-0.75 size-5.5 shrink-0 cursor-pointer accent-yale-blue"
            />
            {option}
          </label>
        ))}
      </div>
      {prompt.source && <Source text={prompt.source} />}
    </fieldset>
  )
}

/**
 * Each option as a toggle button (or a checkbox, for a checklist), plus an
 * optional box to add your own. Your own options show up selected;
 * unselecting one removes it.
 */
function PickField({
  prompt,
  value,
  onChange,
}: {
  prompt: PickPrompt
  value: string[]
  /** Builds the new selection from the latest one, so quick clicks don't overwrite each other. */
  onChange: (update: (prev: string[]) => string[]) => void
}) {
  const [own, setOwn] = useState('')
  const max = prompt.max ?? MAX_PICKS
  const full = value.length >= max
  const ownValues = value.filter((v) => !prompt.options.includes(v))
  const ownId = `prompt-${prompt.id}-own`
  const checklist = prompt.layout === 'checklist'

  const toggle = (option: string) =>
    onChange((prev) =>
      prev.includes(option)
        ? prev.filter((v) => v !== option)
        : prev.length >= max
          ? prev
          : [...prev, option],
    )

  const addOwn = (event: FormEvent) => {
    event.preventDefault()
    const typed = own.trim()
    if (!typed) return
    onChange((prev) => {
      if (prev.length >= max) return prev
      // Reuse an existing option if it matches, ignoring case.
      const option =
        [...prompt.options, ...prev].find(
          (v) => v.toLowerCase() === typed.toLowerCase(),
        ) ?? typed
      return prev.includes(option) ? prev : [...prev, option]
    })
    setOwn('')
  }

  return (
    <fieldset className="mb-6 min-w-0 last:mb-0">
      <legend className="mb-2 leading-[1.4] font-semibold text-pretty">
        {prompt.question}
      </legend>
      <Hint text={prompt.hint} />
      {prompt.max !== undefined && (
        <p aria-live="polite" className="-mt-0.5 mb-2 text-small text-ink-2">
          {value.length} chosen · up to {prompt.max}
        </p>
      )}
      {checklist ? (
        <ul className="grid gap-2">
          {[...prompt.options, ...ownValues].map((option) => {
            const selected = value.includes(option)
            return (
              <li key={option}>
                <label className="flex w-fit cursor-pointer items-start gap-2.5 text-pretty has-disabled:cursor-not-allowed has-disabled:opacity-45">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={full && !selected}
                    onChange={() => toggle(option)}
                    className="mt-0.75 size-5.5 shrink-0 cursor-pointer accent-yale-blue disabled:cursor-not-allowed"
                  />
                  {option}
                </label>
                {/* Outside the label, so following it doesn't tick the box */}
                {prompt.links?.[option] && (
                  <ExternalLink
                    url={prompt.links[option]}
                    className="ml-8 text-small"
                  >
                    Website
                    <span className="sr-only">: {option}</span>
                  </ExternalLink>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="flex flex-wrap gap-2">
          {[...prompt.options, ...ownValues].map((option) => {
            const selected = value.includes(option)
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                disabled={full && !selected}
                onClick={() => toggle(option)}
                className="cursor-pointer rounded-full border-[1.5px] border-field-line bg-paper px-3 py-1.75 text-small leading-[1.2] text-ink disabled:cursor-not-allowed disabled:opacity-45 aria-pressed:border-yale-blue aria-pressed:bg-yale-blue aria-pressed:font-semibold aria-pressed:text-paper"
              >
                {selected && <span aria-hidden="true">✓ </span>}
                {option}
              </button>
            )
          })}
        </div>
      )}
      {prompt.allowOwn && (
        <form
          onSubmit={addOwn}
          className="mt-4 flex flex-wrap items-end gap-2.5"
        >
          <div
            className={`grid w-full gap-1.5 ${checklist ? 'max-w-130' : 'max-w-80'}`}
          >
            <label htmlFor={ownId} className="text-small font-semibold">
              Add your own
            </label>
            <input
              id={ownId}
              type="text"
              maxLength={MAX_OWN_OPTION_LENGTH}
              value={own}
              onChange={(e) => setOwn(e.target.value)}
              disabled={full}
              className={`${INPUT} disabled:bg-wash`}
            />
          </div>
          <button
            type="submit"
            disabled={full || !own.trim()}
            className={GHOST_BUTTON}
          >
            Add
          </button>
        </form>
      )}
      {prompt.source && <Source text={prompt.source} />}
    </fieldset>
  )
}
