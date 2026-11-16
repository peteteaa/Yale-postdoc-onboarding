// The Initial IDP as a PDF, laid out like the worksheet at the end of the paper
// workbook. Built in the browser with @react-pdf/renderer, which is large, so
// only the IDP builder's Download button loads this file.

import type { IdpAnswers } from '#/data/idp'
import {
  IDP_ACKNOWLEDGEMENT,
  IDP_ALIGNMENT,
  IDP_INTRO,
  IDP_QUESTIONS,
  IDP_SUMMARY,
  IDP_TIMELINE,
} from '#/data/idp'
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer'
import type { ReactNode } from 'react'

// Wrap at spaces only. By default words get hyphenated across lines.
Font.registerHyphenationCallback((word) => [word])

// Colors from styles.css.
const YALE_BLUE = '#00356b'
const INK = '#222222'
const INK_2 = '#4a4a4a'
const LINE = '#dddddd'
const FIELD_LINE = '#978d85'
const WASH = '#f9f9f9'

// PDF built-in fonts stand in for Cardo and Source Sans 3.
// TODO: embed the site's fonts. The built-in ones only cover Western European
// letters, so names or answers in other scripts don't come out right.
const SERIF = 'Times-Roman'
const SANS = 'Helvetica'

const s = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 60,
    paddingHorizontal: 58,
    fontFamily: SANS,
    fontSize: 10,
    lineHeight: 1.45,
    color: INK,
  },
  kicker: {
    fontWeight: 'bold',
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: INK_2,
    marginBottom: 6,
  },
  title: {
    fontFamily: SERIF,
    fontSize: 22,
    lineHeight: 1.15,
    color: YALE_BLUE,
    marginBottom: 14,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1.2,
    borderTopColor: INK,
    borderBottomWidth: 0.75,
    borderBottomColor: LINE,
    paddingVertical: 8,
    marginBottom: 20,
  },
  metaItem: { width: '50%', paddingVertical: 3, paddingRight: 12 },
  label: {
    fontWeight: 'bold',
    fontSize: 7.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: INK_2,
  },
  h2: {
    fontFamily: SERIF,
    fontSize: 15,
    lineHeight: 1.25,
    color: YALE_BLUE,
    marginTop: 18,
    marginBottom: 6,
  },
  h3: {
    fontWeight: 'bold',
    fontSize: 10.5,
    marginBottom: 2,
  },
  p: { marginBottom: 6 },
  muted: { color: INK_2 },
  italic: { fontStyle: 'italic', color: INK_2 },
  bullet: { flexDirection: 'row', marginBottom: 2 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1 },
  columns: { flexDirection: 'row', gap: 16, marginBottom: 6 },
  column: { flex: 1 },
  table: {
    borderWidth: 0.75,
    borderColor: LINE,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: 0.75,
    borderTopColor: LINE,
  },
  headRow: { flexDirection: 'row', backgroundColor: WASH },
  cell: { padding: 5, borderLeftWidth: 0.75, borderLeftColor: LINE },
  firstCell: { padding: 5 },
  question: { marginTop: 12 },
  answerLabel: {
    fontWeight: 'bold',
    fontSize: 8.5,
    color: INK_2,
    marginTop: 6,
    marginBottom: 2,
  },
  box: {
    borderWidth: 0.75,
    borderColor: FIELD_LINE,
    borderRadius: 2,
    paddingVertical: 5,
    paddingHorizontal: 7,
    minHeight: 40,
  },
  mentorBox: { borderColor: LINE, backgroundColor: WASH },
  signatures: { marginTop: 14, gap: 18 },
  signatureLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  rule: {
    borderBottomWidth: 0.75,
    borderBottomColor: INK,
    height: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 58,
    right: 58,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: INK_2,
  },
})

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={s.p}>
      {items.map((item) => (
        <View key={item} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

/** A bordered answer box. Empty boxes are left blank to fill in by hand. */
function AnswerBox({
  text,
  mentor = false,
  minHeight,
}: {
  text: string
  mentor?: boolean
  minHeight?: number
}) {
  return (
    <View
      style={[s.box, mentor ? s.mentorBox : {}, minHeight ? { minHeight } : {}]}
    >
      <Text>{text.trim()}</Text>
    </View>
  )
}

/** Keeps a heading on the same page as the start of what follows it. */
function Heading({ children }: { children: ReactNode }) {
  return (
    <Text style={s.h2} minPresenceAhead={60}>
      {children}
    </Text>
  )
}

export function IdpDocument({
  answers,
  exportedOn,
}: {
  answers: IdpAnswers
  /** e.g. "Nov 16, 2026" */
  exportedOn: string
}) {
  const name = answers.postdocName.trim()

  return (
    <Document
      title={`Initial IDP${name ? ` – ${name}` : ''}`}
      author={name || undefined}
      subject="Initial Individual Development Plan (IDP) Worksheet"
      creator="Yale Postdoc Onboarding"
    >
      <Page size="LETTER" style={s.page}>
        <Text style={s.kicker}>
          Yale University · Office of Postdoctoral Affairs
        </Text>
        <Text style={s.title}>
          Initial Individual Development Plan (IDP) Worksheet
        </Text>

        <View style={s.meta}>
          {[
            ['Postdoctoral Associate/Fellow', name],
            ['Faculty/Research Mentor', answers.mentorName.trim()],
            ['Department', answers.department.trim()],
            ['Date', exportedOn],
          ].map(([label, value]) => (
            <View key={label} style={s.metaItem}>
              <Text style={s.label}>{label}</Text>
              <Text>{value || ' '}</Text>
            </View>
          ))}
        </View>

        <Text style={[s.h2, { marginTop: 0 }]}>Purpose and Scope</Text>
        <Text style={s.p}>{IDP_INTRO.purpose}</Text>
        <View style={s.columns}>
          <View style={s.column}>
            <Text style={s.h3}>What this IDP is not</Text>
            <Bullets items={IDP_INTRO.isNot} />
          </View>
          <View style={s.column}>
            <Text style={s.h3}>What this IDP is</Text>
            <Bullets items={IDP_INTRO.is} />
          </View>
        </View>

        <Heading>IDP Development and Review Timeline</Heading>
        <Text style={s.p}>
          The IDP should be used as a reference during regular check-ins on
          progress and development. The key milestones and timepoints are as
          below:
        </Text>
        <View style={s.table}>
          <View style={s.headRow}>
            <Text style={[s.firstCell, s.label, { width: '20%' }]}>
              Time Point
            </Text>
            <Text style={[s.cell, s.label, { width: '45%' }]}>
              Key Activities / Milestones
            </Text>
            <Text style={[s.cell, s.label, { width: '35%' }]}>
              Notes / Check-ins
            </Text>
          </View>
          {IDP_TIMELINE.map((row) => (
            <View key={row.when} style={s.row} wrap={false}>
              <Text style={[s.firstCell, { width: '20%', fontWeight: 'bold' }]}>
                {row.when}
              </Text>
              <Text style={[s.cell, { width: '45%' }]}>{row.activities}</Text>
              <Text style={[s.cell, { width: '35%' }]}>{row.checkins}</Text>
            </View>
          ))}
        </View>
        <Text style={[s.p, { fontWeight: 'bold' }]}>{IDP_INTRO.deadline}</Text>

        <Heading>Guidance for the Postdoc</Heading>
        <Text style={s.p}>{IDP_INTRO.guidance}</Text>
        {IDP_QUESTIONS.map((q) => (
          <View key={q.id} style={s.question}>
            {/* Title, prompt and the response box stay together */}
            <View wrap={false}>
              <Text style={s.h3}>
                {q.n}. {q.title}
              </Text>
              <Text style={s.italic}>{q.prompt}</Text>
              <Text style={s.answerLabel}>Your response:</Text>
              <AnswerBox text={answers.responses[q.id] ?? ''} />
            </View>
            {q.mentorInput && (
              <View wrap={false}>
                <Text style={s.answerLabel}>Mentor input/changes:</Text>
                <AnswerBox text={answers.mentorInput[q.id] ?? ''} mentor />
              </View>
            )}
          </View>
        ))}

        <Heading>Aligning Expectations with Your Mentor</Heading>
        <Text style={s.p}>
          If you did not get an opportunity to discuss the areas below in your
          first few weeks of your postdoc training, take the opportunity to do
          so now. If you have already discussed any/all of these areas, take a
          few minutes to revisit and make any changes as needed.
        </Text>
        <View style={s.table}>
          <View style={s.headRow}>
            <Text style={[s.firstCell, s.label, { width: '42%' }]}>
              Question
            </Text>
            <Text style={[s.cell, s.label, { width: '58%' }]}>
              Notes from Discussion
            </Text>
          </View>
          {IDP_ALIGNMENT.map((row) => (
            <View key={row.id} style={[s.row, { minHeight: 34 }]} wrap={false}>
              <Text style={[s.firstCell, { width: '42%' }]}>
                {row.question}
              </Text>
              <Text style={[s.cell, { width: '58%' }]}>
                {(answers.alignment[row.id] ?? '').trim()}
              </Text>
            </View>
          ))}
        </View>

        <Heading>Summary & Mutual Expectations</Heading>
        <Text style={s.p}>{IDP_SUMMARY.intro}</Text>
        <Bullets items={IDP_SUMMARY.schedule} />
        <Text style={s.h3}>Individual and Mutual Commitments</Text>
        <Bullets items={IDP_SUMMARY.commitments} />
        <View wrap={false}>
          <Text style={s.answerLabel}>Additional notes:</Text>
          <AnswerBox text={answers.summaryNotes} />
        </View>

        <View wrap={false}>
          <Heading>Acknowledgement</Heading>
          <Text style={s.p}>{IDP_ACKNOWLEDGEMENT}</Text>
          <View style={s.signatures}>
            {[
              ['Postdoctoral Associate/Fellow', name],
              ['Faculty/Research Mentor', answers.mentorName.trim()],
            ].map(([role, person]) => (
              <View key={role}>
                <Text>
                  <Text style={{ fontWeight: 'bold' }}>{role} (Name): </Text>
                  {person}
                </Text>
                <View style={s.signatureLine}>
                  <Text style={s.muted}>Signature:</Text>
                  <View style={[s.rule, { flex: 3 }]} />
                  <Text style={s.muted}>Date:</Text>
                  <View style={[s.rule, { flex: 1.2 }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>Initial IDP{name ? ` · ${name}` : ''}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}

/** Builds the PDF and has the browser download it. */
export async function downloadIdpPdf(answers: IdpAnswers, exportedOn: string) {
  const blob = await pdf(
    <IdpDocument answers={answers} exportedOn={exportedOn} />,
  ).toBlob()
  const name = answers.postdocName.trim()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Initial IDP${name ? ` - ${name}` : ''}.pdf`
  document.body.append(link)
  link.click()
  link.remove()
  // Give the download a moment to start before freeing the file.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
