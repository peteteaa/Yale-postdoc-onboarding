'use client'

import { saveIdpAnswers } from '#/app/idp/actions'
import { SaveMessage, useAutosave } from '#/components/Autosave'
import { BUSY, INPUT, PRIMARY_BUTTON } from '#/components/Form'
import type {
  IdpAnswers,
  IdpMapField,
  IdpQuestion,
  IdpTextField,
} from '#/data/idp'
import {
  IDP_ACKNOWLEDGEMENT,
  IDP_ALIGNMENT,
  IDP_INTRO,
  IDP_QUESTIONS,
  IDP_SUMMARY,
  idpFieldId,
} from '#/data/idp'
import { formatDate, parseDate, todayInNewHaven } from '#/lib/dates'
import type { ReactNode } from 'react'
import { useState } from 'react'

const CARD = 'rounded border border-card-line bg-paper p-4.5 shadow-card md:p-6'
const TEXTAREA = `${INPUT} block min-h-21 resize-y`
const SMALL_LABEL =
  'mb-1.5 block text-label font-semibold tracking-label text-ink-2 uppercase'

/**
 * The Initial IDP worksheet from the end of the workbook, as a form, with a
 * button that turns the questions and answers into a PDF to share with your
 * mentor.
 */
export function IdpBuilder({
  savedAnswers,
  loadError,
  defaultName,
}: {
  savedAnswers: IdpAnswers
  /** Set when the saved answers couldn't be loaded. */
  loadError: boolean
  defaultName: string
}) {
  // TODO: fill in answers from the workbook sections each question draws on.
  const [answers, setAnswers] = useState<IdpAnswers>(() => ({
    ...savedAnswers,
    // Start with their name until they've saved one of their own.
    postdocName: savedAnswers.postdocName || defaultName,
  }))
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(false)
  // One save per card, so each card says whether its own changes saved, like
  // the workbook's sections.
  const detailsSave = useAutosave(saveIdpAnswers)
  const questionsSave = useAutosave(saveIdpAnswers)
  const alignmentSave = useAutosave(saveIdpAnswers)
  const summarySave = useAutosave(saveIdpAnswers)

  const setField = (field: IdpTextField, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }))
    const save = field === 'summaryNotes' ? summarySave : detailsSave
    save.queueSave(idpFieldId(field), value)
  }
  const setMapped = (map: IdpMapField, id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [map]: { ...prev[map], [id]: value } }))
    const save = map === 'alignment' ? alignmentSave : questionsSave
    save.queueSave(idpFieldId(map, id), value)
  }

  const download = async () => {
    setExporting(true)
    setExportError(false)
    try {
      // Loaded on demand: the PDF library is too big to send with the page.
      const { downloadIdpPdf } = await import('#/components/IdpPdf')
      await downloadIdpPdf(
        answers,
        formatDate(parseDate(todayInNewHaven()), true),
      )
    } catch (error) {
      console.error('Building the IDP PDF failed:', error)
      setExportError(true)
    } finally {
      setExporting(false)
    }
  }

  const downloadButton = (
    <div className="grid justify-items-start gap-2">
      <button
        type="button"
        onClick={download}
        disabled={exporting}
        className={`${PRIMARY_BUTTON} ${BUSY}`}
      >
        {exporting ? 'Building PDF…' : 'Download PDF'}
      </button>
      {exportError && (
        <p role="alert" className="text-small font-semibold text-late">
          The PDF couldn’t be built. Try again.
        </p>
      )}
    </div>
  )

  return (
    <main className="mx-auto max-w-page px-4 pt-6 pb-12 md:px-10 md:pt-10 md:pb-18">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="max-w-195">
          <h1 className="mb-2.5 text-h1 text-yale-blue">IDP builder</h1>
          <p className="max-w-[65ch] text-lede text-pretty text-ink-2">
            Your Initial Individual Development Plan. Fill it in from your
            workbook, download it as a PDF, and share it with your mentor before
            your 3-month meeting.
          </p>
        </div>
        {!loadError && downloadButton}
      </div>
      <p className="mb-10 w-fit max-w-full rounded bg-wash px-3.5 py-3 text-small text-ink-2">
        Nothing is shared until you send the PDF yourself.
      </p>

      {/* Without the saved answers, saving would overwrite them, so don't show the form. */}
      {loadError ? (
        <p role="alert" className="rounded bg-wash px-4 py-3">
          Your answers couldn’t be loaded right now. Try again in a few minutes.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          <Card title="Your details">
            <div className="grid gap-4.5 md:grid-cols-2">
              <TextInput
                id="idp-postdoc"
                label="Postdoctoral Associate/Fellow (Name)"
                value={answers.postdocName}
                onChange={(v) => setField('postdocName', v)}
              />
              <TextInput
                id="idp-mentor"
                label="Faculty/Research Mentor (Name)"
                value={answers.mentorName}
                onChange={(v) => setField('mentorName', v)}
              />
              <TextInput
                id="idp-department"
                label="Department"
                value={answers.department}
                onChange={(v) => setField('department', v)}
              />
            </div>
            <SaveMessage
              status={detailsSave.status}
              onRetry={detailsSave.saveNow}
            />
          </Card>

          <Card
            title="Guidance for the Postdoc"
            description={IDP_INTRO.guidance}
          >
            <ol className="grid gap-8">
              {IDP_QUESTIONS.map((question) => (
                <QuestionField
                  key={question.id}
                  question={question}
                  response={answers.responses[question.id] ?? ''}
                  mentorInput={answers.mentorInput[question.id] ?? ''}
                  onResponse={(v) => setMapped('responses', question.id, v)}
                  onMentorInput={(v) =>
                    setMapped('mentorInput', question.id, v)
                  }
                />
              ))}
            </ol>
            <SaveMessage
              status={questionsSave.status}
              onRetry={questionsSave.saveNow}
            />
          </Card>

          <Card
            title="Aligning Expectations with Your Mentor"
            description="If you did not get an opportunity to discuss the areas below in your first few weeks of your postdoc training, take the opportunity to do so now. If you have already discussed any/all of these areas, take a few minutes to revisit and make any changes as needed."
          >
            <div className="grid gap-6">
              {IDP_ALIGNMENT.map((row) => {
                const id = `idp-align-${row.id}`
                return (
                  <div key={row.id}>
                    <label
                      htmlFor={id}
                      className="mb-1.5 block leading-[1.4] font-semibold text-pretty"
                    >
                      {row.question}
                    </label>
                    <textarea
                      id={id}
                      rows={2}
                      placeholder="Notes from discussion"
                      value={answers.alignment[row.id] ?? ''}
                      onChange={(e) =>
                        setMapped('alignment', row.id, e.target.value)
                      }
                      className={TEXTAREA}
                    />
                  </div>
                )
              })}
            </div>
            <SaveMessage
              status={alignmentSave.status}
              onRetry={alignmentSave.saveNow}
            />
          </Card>

          <Card
            title="Summary & Mutual Expectations"
            description={IDP_SUMMARY.intro}
          >
            <BulletList items={IDP_SUMMARY.schedule} />
            <h3 className="mt-5 mb-1.5 font-sans text-h4 font-bold">
              Individual and Mutual Commitments
            </h3>
            <BulletList items={IDP_SUMMARY.commitments} />
            <label
              htmlFor="idp-summary-notes"
              className="mt-6 mb-1.5 block font-semibold"
            >
              Additional notes
            </label>
            <textarea
              id="idp-summary-notes"
              rows={3}
              value={answers.summaryNotes}
              onChange={(e) => setField('summaryNotes', e.target.value)}
              className={TEXTAREA}
            />
            <SaveMessage
              status={summarySave.status}
              onRetry={summarySave.saveNow}
            />
          </Card>

          <Card title="Acknowledgement">
            <p className="mb-3 max-w-[70ch] text-pretty">
              {IDP_ACKNOWLEDGEMENT}
            </p>
            <p className="mb-6 text-small text-ink-2">
              The PDF has signature and date lines for you and your mentor. Sign
              it together at your 3-month meeting.
            </p>
            {downloadButton}
          </Card>
        </div>
      )}
    </main>
  )
}

function Card({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  const headingId = `idp-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`
  return (
    <section aria-labelledby={headingId} className={CARD}>
      <h2 id={headingId} className={`text-h3 ${description ? 'mb-2' : 'mb-5'}`}>
        {title}
      </h2>
      {description && (
        <p className="mb-6 max-w-[70ch] text-pretty text-ink-2">
          {description}
        </p>
      )}
      {children}
    </section>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid list-disc gap-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function TextInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      />
    </div>
  )
}

/** One numbered question: its prompt, your response, and the mentor's input. */
function QuestionField({
  question,
  response,
  mentorInput,
  onResponse,
  onMentorInput,
}: {
  question: IdpQuestion
  response: string
  mentorInput: string
  onResponse: (value: string) => void
  onMentorInput: (value: string) => void
}) {
  const baseId = `idp-q-${question.id}`
  const promptId = `${baseId}-prompt`

  return (
    <li>
      <h3 className="mb-1 font-sans text-task-title font-semibold">
        {question.n}. {question.title}
      </h3>
      <p id={promptId} className="mb-1 text-pretty text-ink-2 italic">
        {question.prompt}
      </p>
      {question.from && (
        <p className="text-caption text-ink-2">
          Draws on workbook {question.from.length > 1 ? 'sections' : 'section'}{' '}
          {question.from.join(' and ')}
        </p>
      )}
      <div className="mt-3 grid gap-4">
        <div>
          <label htmlFor={`${baseId}-response`} className={SMALL_LABEL}>
            Your response
          </label>
          <textarea
            id={`${baseId}-response`}
            rows={4}
            value={response}
            onChange={(e) => onResponse(e.target.value)}
            aria-describedby={promptId}
            className={TEXTAREA}
          />
        </div>
        {question.mentorInput && (
          <div>
            <label htmlFor={`${baseId}-mentor`} className={SMALL_LABEL}>
              Mentor input/changes
            </label>
            <textarea
              id={`${baseId}-mentor`}
              rows={2}
              placeholder="Add after you talk with your mentor, or leave blank for them to write on the PDF"
              value={mentorInput}
              onChange={(e) => onMentorInput(e.target.value)}
              className={`${TEXTAREA} bg-wash`}
            />
          </div>
        )}
      </div>
    </li>
  )
}
