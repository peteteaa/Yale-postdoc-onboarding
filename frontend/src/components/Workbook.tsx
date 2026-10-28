'use client'

import type {
  PickPrompt,
  TextPrompt,
  WorkbookModule,
  WorkbookSection,
} from '#/data/workbook'
import { MODULES } from '#/data/workbook'
import type { FormEvent } from 'react'
import { useState } from 'react'

/** Free text, or the options picked for a pick prompt. */
type Answer = string | string[]
type Answers = Record<string, Answer | undefined>
/** A new answer, or a function that builds it from the latest one. */
type AnswerUpdate = Answer | ((prev: Answer | undefined) => Answer)
type OnAnswer = (promptId: string, update: AnswerUpdate) => void

// Same look as the admin forms' fields and ghost button.
const INPUT =
  'w-full min-w-0 rounded border-[1.5px] border-field-line bg-paper px-3 py-2.5 text-large leading-[1.45]'
const GHOST_BUTTON =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded border-[1.5px] border-yale-blue bg-paper px-4.5 py-2.5 leading-tight font-semibold text-yale-blue hover:bg-tint disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-paper'

export function Workbook() {
  // Answers by prompt id.
  // TODO: save to the backend instead of keeping them in memory
  const [answers, setAnswers] = useState<Answers>({})
  const setAnswer: OnAnswer = (promptId, update) =>
    setAnswers((prev) => ({
      ...prev,
      [promptId]:
        typeof update === 'function' ? update(prev[promptId]) : update,
    }))

  return (
    <main className="mx-auto max-w-page px-4 pt-6 pb-12 md:px-10 md:pt-10 md:pb-18">
      <div className="mb-7 max-w-195">
        <h1 className="mb-2.5 text-h1 text-yale-blue">Workbook</h1>
        <p className="max-w-[65ch] text-lede text-pretty text-ink-2">
          Bullet points are enough, and you can come back to any section later.
        </p>
      </div>
      <PrivacyNote />

      {/* TODO: a way to move between workbook sections, once there are more of them */}
      <div className="grid gap-12">
        {MODULES.map((module) => (
          <ModuleBlock
            key={module.id}
            module={module}
            answers={answers}
            onAnswer={setAnswer}
          />
        ))}
      </div>
    </main>
  )
}

function ModuleBlock({
  module,
  answers,
  onAnswer,
}: {
  module: WorkbookModule
  answers: Answers
  onAnswer: OnAnswer
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
            answers={answers}
            onAnswer={onAnswer}
          />
        ))}
      </div>
    </section>
  )
}

function SectionCard({
  section,
  answers,
  onAnswer,
}: {
  section: WorkbookSection
  answers: Answers
  onAnswer: OnAnswer
}) {
  const headingId = `section-${section.id}`

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
      {/* TODO: "Saved" status and Previous/Next section buttons, once answers are saved */}
    </section>
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
