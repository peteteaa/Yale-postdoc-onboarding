'use client'

import { saveAnswers } from '#/app/workbook/actions'
import type {
  Answer,
  PickPrompt,
  SectionAnswers,
  TextPrompt,
  WorkbookAnswers,
  WorkbookModule,
  WorkbookSection,
} from '#/data/workbook'
import {
  MAX_OWN_OPTION_LENGTH,
  MAX_TEXT_LENGTH,
  MODULES,
} from '#/data/workbook'
import type { FormEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

/** A new answer, or a function that builds it from the latest one. */
type AnswerUpdate = Answer | ((prev: Answer | undefined) => Answer)

/** How long to wait after the last change before saving. */
const SAVE_DELAY_MS = 1000

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// Same look as the admin forms' fields and ghost button.
const INPUT =
  'w-full min-w-0 rounded border-[1.5px] border-field-line bg-paper px-3 py-2.5 text-large leading-[1.45]'
const GHOST_BUTTON =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded border-[1.5px] border-yale-blue bg-paper px-4.5 py-2.5 leading-tight font-semibold text-yale-blue hover:bg-tint disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-paper'

export function Workbook({
  savedAnswers,
  loadError,
}: {
  savedAnswers: WorkbookAnswers
  /** Set when the saved answers couldn't be loaded. */
  loadError: boolean
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

      {/* Without the saved answers, saving would overwrite them, so don't show the form. */}
      {loadError ? (
        <p role="alert" className="rounded bg-wash px-4 py-3">
          Your answers couldn’t be loaded right now. Try again in a few minutes.
        </p>
      ) : (
        // TODO: a way to move between workbook sections, once there are more of them
        <div className="grid gap-12">
          {MODULES.map((module) => (
            <ModuleBlock
              key={module.id}
              module={module}
              savedAnswers={savedAnswers}
            />
          ))}
        </div>
      )}
    </main>
  )
}

function ModuleBlock({
  module,
  savedAnswers,
}: {
  module: WorkbookModule
  savedAnswers: WorkbookAnswers
}) {
  const headingId = `module-${module.id}`

  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className={`text-h2 ${module.description ? 'mb-1' : 'mb-4'}`}
      >
        {module.title}
      </h2>
      {module.description && (
        <p className="mb-4 text-small text-pretty text-ink-2">
          {module.description}
        </p>
      )}
      <div className="grid gap-5">
        {module.sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            savedAnswers={savedAnswers[section.id] ?? {}}
          />
        ))}
      </div>
    </section>
  )
}

function SectionCard({
  section,
  savedAnswers,
}: {
  section: WorkbookSection
  savedAnswers: SectionAnswers
}) {
  const headingId = `section-${section.id}`
  const [answers, setAnswers] = useState(savedAnswers)
  // The latest answers, for building the next one in event handlers. Quick
  // clicks can come before a re-render, when `answers` is still the old one.
  const latest = useRef(savedAnswers)
  const { status, queueSave, saveNow } = useAutosave(section.id)

  const onAnswer = (promptId: string, update: AnswerUpdate) => {
    const answer =
      typeof update === 'function' ? update(latest.current[promptId]) : update
    latest.current = { ...latest.current, [promptId]: answer }
    setAnswers(latest.current)
    queueSave(promptId, answer)
  }

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
      <h3 id={headingId} className="mb-2 text-h3">
        {section.title}
      </h3>
      {section.description && (
        <p className="mb-5 text-pretty text-ink-2">{section.description}</p>
      )}
      {section.prompts.map((prompt) => {
        const answer = answers[prompt.id]
        return prompt.kind === 'text' ? (
          <TextField
            key={prompt.id}
            prompt={prompt}
            value={typeof answer === 'string' ? answer : ''}
            onChange={(value) => onAnswer(prompt.id, value)}
          />
        ) : (
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
      })}
      <SaveMessage status={status} onRetry={saveNow} />
      {/* TODO: Previous/Next section buttons */}
    </section>
  )
}

/**
 * Saves a section's answers a moment after the last change. Answers that
 * don't save are kept and sent again with the next save.
 */
function useAutosave(sectionId: string) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  // Answers that haven't been saved yet, by prompt id.
  const unsaved = useRef(new Map<string, Answer>())
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const saveNow = useCallback(async () => {
    clearTimeout(timer.current)
    if (unsaved.current.size === 0) return
    const sending = new Map(unsaved.current)
    setStatus('saving')

    let ok = false
    try {
      ok = (await saveAnswers(sectionId, Object.fromEntries(sending))).ok
    } catch (error) {
      // e.g. offline
      console.error('Saving workbook answers failed:', error)
    }
    if (!ok) {
      setStatus('error')
      return
    }
    // Forget what was saved, unless it changed again while saving.
    for (const [promptId, answer] of sending) {
      if (unsaved.current.get(promptId) === answer) {
        unsaved.current.delete(promptId)
      }
    }
    if (unsaved.current.size === 0) setStatus('saved')
  }, [sectionId])

  const queueSave = useCallback(
    (promptId: string, answer: Answer) => {
      unsaved.current.set(promptId, answer)
      setStatus('saving')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => void saveNow(), SAVE_DELAY_MS)
    },
    [saveNow],
  )

  // Save right away when leaving the page for another one in the app.
  useEffect(() => () => void saveNow(), [saveNow])

  // Ask before closing the tab or reloading while answers aren't saved.
  useEffect(() => {
    if (status !== 'saving' && status !== 'error') return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [status])

  return { status, queueSave, saveNow }
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
          <span className="text-small font-normal text-ink-2"> (optional)</span>
        )}
      </label>
      {prompt.hint && (
        <p id={hintId} className="mb-2 text-small text-ink-2">
          {prompt.hint}
        </p>
      )}
      <textarea
        id={inputId}
        rows={3}
        maxLength={MAX_TEXT_LENGTH}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={prompt.hint ? hintId : undefined}
        className={`${INPUT} block min-h-21 resize-y`}
      />
    </div>
  )
}

/**
 * Toggle buttons for each option, plus an optional box to add your own. Your
 * own options show up as selected buttons; unselecting one removes it.
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
  const full = value.length >= prompt.max
  const ownValues = value.filter((v) => !prompt.options.includes(v))
  const ownId = `prompt-${prompt.id}-own`

  const toggle = (option: string) =>
    onChange((prev) =>
      prev.includes(option)
        ? prev.filter((v) => v !== option)
        : prev.length >= prompt.max
          ? prev
          : [...prev, option],
    )

  const addOwn = (event: FormEvent) => {
    event.preventDefault()
    const typed = own.trim()
    if (!typed) return
    onChange((prev) => {
      if (prev.length >= prompt.max) return prev
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
      <legend className="mb-1.5 leading-[1.4] font-semibold text-pretty">
        {prompt.question}
      </legend>
      <p aria-live="polite" className="mb-2 text-small text-ink-2">
        {value.length} chosen · up to {prompt.max}
      </p>
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
      {prompt.allowOwn && (
        <form
          onSubmit={addOwn}
          className="mt-4 flex flex-wrap items-end gap-2.5"
        >
          <div className="grid w-full max-w-80 gap-1.5">
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
      {prompt.hint && (
        <p className="mt-3 text-caption text-ink-2">{prompt.hint}</p>
      )}
    </fieldset>
  )
}
