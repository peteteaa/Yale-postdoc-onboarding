// Orientation workbook content, from the OPA workbook (titles, wording and
// structure follow the workbook, not the mockup). Section 1 so far; the rest
// get added one at a time.

/** What every kind of prompt has. */
type PromptBase = {
  /** Unique within its section. */
  id: string
  question: string
  /** Extra guidance shown under the question. */
  hint?: string
  /** Only show this prompt once another prompt in the section has this answer. */
  showIf?: { promptId: string; answer: string }
}

/** A free-text answer. */
export type TextPrompt = PromptBase & {
  kind: 'text'
  /** Short category shown above the question, e.g. "Communication skills". */
  label?: string
  /**
   * Marks the prompt as optional, in the workbook's words, e.g. "if applicable".
   * Shown in parentheses after the question.
   */
  optional?: string
}

/** Pick some options from a list, and optionally write your own. */
export type PickPrompt = PromptBase & {
  kind: 'pick'
  options: string[]
  min?: number
  /** No limit if not set. */
  max?: number
  /** Whether people can add their own options. */
  allowOwn: boolean
  /** Chips for short options (the default), or a checklist for long ones. */
  layout?: 'chips' | 'checklist'
}

/** Pick exactly one option. */
export type ChoicePrompt = PromptBase & {
  kind: 'choice'
  options: string[]
}

export type Prompt = TextPrompt | PickPrompt | ChoicePrompt

/** Longest answer to a text prompt. */
export const MAX_TEXT_LENGTH = 10_000
/** Longest option someone can write for a pick prompt. */
export const MAX_OWN_OPTION_LENGTH = 200
/** Most options someone can pick for a pick prompt without a `max`. */
export const MAX_PICKS = 50

/** Free text, or the options picked for a pick prompt. */
export type Answer = string | string[]
/** One section's answers, by prompt id. */
export type SectionAnswers = Record<string, Answer | undefined>
/** Someone's answers, by section id. */
export type WorkbookAnswers = Record<string, SectionAnswers | undefined>

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
  prompts?: Prompt[]
  /** Numbered sub-parts with their own headings, e.g. 1.3.1. */
  parts?: WorkbookPart[]
}

/** A sub-part of a section, e.g. 1.3.1, shown under its own heading. */
export type WorkbookPart = {
  ref: string
  title: string
  description?: string
  /** When it differs from the section's. */
  when?: string
  prompts: Prompt[]
}

/** All of a section's prompts, including its parts'. */
export function sectionPrompts(section: WorkbookSection): Prompt[] {
  return [
    ...(section.prompts ?? []),
    ...(section.parts ?? []).flatMap((part) => part.prompts),
  ]
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

/** 1.4.3's stages of career discernment and the possible actions for each. */
const CAREER_STAGES = [
  {
    id: 'actions-exploring',
    name: 'Discerning or Exploring',
    actions: [
      'Check out Office of Career Strategy (OCS) videos & resources',
      'Explore OPA webpage with planning resources',
      'Sign up for an OCS consultation',
      'Sign up for OCS newsletter to learn about workshops and job fairs',
      'Ask mentor for input on kinds of career paths in your discipline',
      'Ask mentor to suggest potential people in different career paths in your discipline with whom to connect',
    ],
  },
  {
    id: 'actions-building',
    name: 'Building Out Career Options',
    actions: [
      'Check out Office of Career Strategy (OCS) videos and resources',
      'Explore OPA webpage with planning resources',
      'Sign up for an OCS consultation',
      'Sign up for OCS newsletter to learn about workshops and job fairs',
      'Conduct informational interviews with people in different career paths in your discipline',
      // The workbook has a typo here: "Ask you mentoring team".
      'Ask your mentoring team about the kinds of skills needed for different kinds of career options you are considering',
      'Identify ways to cultivate the experiences and skills needed to be a viable candidate in the career options you are considering',
      'Take the “Building Skills for a Successful Career” course at The Postdoc Academy',
    ],
  },
  {
    id: 'actions-pursuing',
    name: 'Actively Pursuing Identified Options',
    actions: [
      'Create timeline for your job application process',
      'Create spreadsheet to track the jobs to which you apply',
      'Check out Office of Career Strategy (OCS) videos and resources related to job boards, application materials and interviewing',
      'Sign up for OCS consultation on application process',
      'Sign up for OCS newsletter to learn about workshops and job fairs',
      'Ask mentoring team for feedback on your application materials',
      'Sign up for a writing consultation for feedback on your application materials',
      'If applying to faculty jobs, attend events in the Academic Job Search Series',
    ],
  },
]

// The workbook highlights in gray what's done after orientation. In Section 1
// that's the "Add more detail" prompts in 1.3 and all of 1.4.2.
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
      {
        id: 'role-expectations',
        ref: '1.3',
        title: 'Understanding Your Postdoc Role & Expectations',
        description:
          'Define the primary expectations of your role (e.g., research, writing, teaching, skill development).',
        when: 'At orientation',
        parts: [
          {
            ref: '1.3.1',
            title: 'Project Title(s) or Research Area(s)',
            prompts: [
              {
                kind: 'text',
                id: 'projects',
                question:
                  'Your role’s main tasks/project(s) or research area(s) you’re aware of at orientation',
              },
              {
                kind: 'text',
                id: 'projects-detail',
                question: 'Add more detail within 8 weeks after orientation',
              },
              {
                kind: 'text',
                id: 'other-projects',
                question: 'Additional projects/services',
                optional: 'if applicable',
              },
            ],
          },
          {
            ref: '1.3.2',
            title: 'Identify Your Postdoc Goals',
            prompts: [
              {
                kind: 'text',
                id: 'goals',
                question:
                  'What do you plan to accomplish during this postdoc (e.g., lead an independent project, complete a manuscript, submit grants, develop teaching expertise)?',
              },
              {
                kind: 'text',
                id: 'goals-detail',
                question: 'Add more detail within 8 weeks after orientation',
              },
            ],
          },
        ],
      },
      {
        id: 'career-direction',
        ref: '1.4',
        title: 'Career Direction & Self-Assessment (Exploratory)',
        description:
          'Yale University recognizes postgraduate training as preparation for a broad range of careers. Early reflection is intended to normalize exploration, not force decisions. Career exploration ≠ commitment. Uncertainty at this stage is expected.',
        when: 'At orientation',
        parts: [
          {
            ref: '1.4.1',
            title: 'Understanding Your Work Priorities and Preferences',
            prompts: [
              {
                kind: 'pick',
                id: 'work-culture',
                question:
                  'Work culture: what helps me thrive? Select 3–5 priorities or add your own.',
                hint: 'List adapted from the Stanford Meaningful Work Toolkit.',
                min: 3,
                max: 5,
                allowOwn: true,
                // In the workbook's order, row by row.
                options: [
                  'Supportive environment',
                  'Alignment with personal values',
                  'Professional development',
                  'Workload sustainability',
                  'Mentoring',
                  'Life balance / flexibility',
                  'Autonomy / independence',
                  'Innovation',
                  'Collaboration / teamwork',
                  'Growth potential',
                  'Clear expectations / role clarity',
                  'Resource availability',
                  'Feedback culture',
                  'Geographic location',
                  'Accountability',
                  'Fairness / ethical leadership',
                  'Inclusive workplace',
                  'Fun / humor',
                  'Psychological safety',
                ],
              },
            ],
          },
          {
            ref: '1.4.2',
            title: 'Future Roles That Would Support Thriving',
            when: 'Around month 3 or later',
            prompts: [
              {
                kind: 'text',
                id: 'work-environments',
                question:
                  'Work environments you like or want to avoid (e.g., academia, industry, non-profit)',
              },
              {
                kind: 'text',
                id: 'ways-of-working',
                question:
                  'Ways you work best (e.g., alone, in teams, leading; in-person, remote, hybrid)',
              },
              {
                kind: 'text',
                id: 'roles-to-explore',
                question:
                  'Roles and/or graduate programs you know about in your field or want to explore',
              },
              {
                kind: 'text',
                id: 'other-factors',
                question:
                  'Other important factors for your next step (growth, balance, location, family, health)',
              },
            ],
          },
          {
            ref: '1.4.3',
            title: 'Career Discernment & Preparation',
            // The workbook says "circle possible initial actions".
            description:
              'Identify your stage of career discernment & preparation and choose possible initial actions.',
            prompts: [
              {
                kind: 'choice',
                id: 'career-stage',
                question: 'Your stage',
                options: CAREER_STAGES.map((stage) => stage.name),
              },
              // Only the chosen stage's actions show. Each stage has its own
              // list, since some actions are in more than one.
              ...CAREER_STAGES.map((stage): PickPrompt => ({
                kind: 'pick',
                id: stage.id,
                question: 'Possible actions (and add your own ideas!)',
                showIf: { promptId: 'career-stage', answer: stage.name },
                allowOwn: true,
                layout: 'checklist',
                options: stage.actions,
              })),
            ],
          },
        ],
      },
    ],
  },
]
