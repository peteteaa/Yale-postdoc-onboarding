// Orientation workbook content, from the OPA workbook (titles, wording and
// structure follow the workbook, not the mockup). Section 1.1 and 1.2 so far;
// the rest get added one at a time.

/** A free-text answer. */
export type TextPrompt = {
  kind: 'text'
  id: string
  /** Short category shown above the question, e.g. "Communication skills". */
  label?: string
  question: string
  /** Extra guidance shown under the question. */
  hint?: string
  optional?: boolean
}

/** Pick a few options from a list, and optionally write your own. */
export type PickPrompt = {
  kind: 'pick'
  id: string
  question: string
  hint?: string
  options: string[]
  min: number
  max: number
  /** Whether people can add their own options. */
  allowOwn: boolean
}

export type Prompt = TextPrompt | PickPrompt

/** A numbered part of a workbook section, e.g. 1.1. */
export type WorkbookSection = {
  id: string
  /**
   * Section number in the paper workbook, e.g. "1.1", so content can be traced
   * back to its source.
   */
  ref: string
  title: string
  /** The workbook's intro sentence for this part, if it has one. */
  description?: string
  /** When the workbook says to do it, e.g. "At orientation". */
  when?: string
  prompts: Prompt[]
}

/** One of the workbook's top-level sections, e.g. Section 1. */
export type WorkbookModule = {
  id: string
  /** Section number in the paper workbook, e.g. "1". */
  ref: string
  title: string
  description?: string
  sections: WorkbookSection[]
}

// 1.1 and 1.2 aren't highlighted in gray, which the workbook uses to mark
// parts done after orientation.
export const MODULES: WorkbookModule[] = [
  {
    id: 'reflection-role-alignment',
    ref: '1',
    // The section's own heading. The workbook's overview page calls Section 1
    // "Planning & Resources" instead.
    title: 'Postdoc Reflection & Role Alignment',
    sections: [
      {
        id: 'self-reflection',
        ref: '1.1',
        // TODO: Nish will ask OPA if we can rename this "Self-reflection". Because goal prompts are in 1.3.
        title: 'Self-reflection and Defining Your Goals',
        description:
          'Reflect on how your prior experiences have prepared you for your postdoc role.',
        when: 'At orientation',
        prompts: [
          {
            kind: 'text',
            id: 'discipline-knowledge',
            label: 'Discipline-specific knowledge',
            question:
              'How have you developed expertise (coursework, research projects, conferences, workshops)?',
          },
          {
            kind: 'text',
            id: 'communication',
            label: 'Communication skills',
            question:
              'How have you improved in presenting, writing, or public speaking?',
          },
          {
            kind: 'text',
            id: 'collaboration',
            label: 'Collaboration skills',
            question:
              'How have you contributed to or led team projects or collaborative work?',
          },
          {
            kind: 'text',
            id: 'research-teaching',
            label: 'Research and teaching skills',
            question:
              'What experimental, analytical, or teaching skills have you developed?',
          },
          {
            kind: 'text',
            id: 'leadership',
            label: 'Leadership, management & mentorship',
            question:
              'How have you mentored others, led projects, or managed resources?',
          },
        ],
      },
      {
        id: 'values',
        ref: '1.2',
        title: 'Articulate Your Values',
        when: 'At orientation',
        prompts: [
          {
            kind: 'pick',
            id: 'values',
            question:
              'Choose 3–5 values that drive your engagement in your work, or write your own.',
            hint: 'List adapted from the Stanford Meaningful Work Toolkit.',
            min: 3,
            max: 5,
            allowOwn: true,
            // In the workbook's order.
            options: [
              'Well-being',
              'Social justice',
              'Spirituality',
              'Success',
              'Trust',
              'Simplicity',
              'Relationships',
              'Safety',
              'Prestige',
              'Personal development',
              'Learning',
              'Joy',
              'Intellectual challenge',
              'Integrity',
              'Impact',
              'Helping others',
              'Harmony',
              'Gratitude',
              'Fulfilling potential',
              'Family and friends',
              'Excellence',
              'Diversity',
              'Creativity',
              'Compassion',
              'Community',
              'Belonging',
              'Autonomy',
              'Authenticity',
              'Adventure',
              'Achievement',
            ],
          },
        ],
      },
    ],
  },
]
