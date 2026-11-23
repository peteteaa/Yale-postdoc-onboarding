// Orientation workbook content, from the OPA workbook (titles, wording and
// structure follow the workbook, not the mockup). The workbook's Initial IDP
// worksheet isn't here: it's for the IDP Builder page.

import type { ResourceTopic } from '#/data/resources'

/** What every kind of prompt has. */
type PromptBase = {
  /** Unique within its section. */
  id: string
  question: string
  /** Extra guidance shown under the question. */
  hint?: string
  /** Where the prompt's content comes from, shown under the field. */
  source?: string
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
  /** A one-line box, for short answers like an amount of time. */
  short?: boolean
}

/** A date, saved as YYYY-MM-DD. */
export type DatePrompt = PromptBase & { kind: 'date' }

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
  /** Web pages for some of the options, by option. Shown in checklists. */
  links?: Record<string, string>
}

/** Pick exactly one option. */
export type ChoicePrompt = PromptBase & {
  kind: 'choice'
  options: string[]
}

/**
 * A small table to fill in, with a fixed number of rows. Its answer is the
 * cells, row by row. `question` names the table for screen readers only.
 */
export type TablePrompt = PromptBase & {
  kind: 'table'
  columns: string[]
  rows: number
}

/**
 * A grid that picks one of `options` for each row. Each row is saved as its own
 * answer, under the row's id.
 */
export type MatrixPrompt = PromptBase & {
  kind: 'matrix'
  /** Heading for the column of row labels. */
  rowHeader: string
  options: string[]
  groups: { label: string; rows: { id: string; label: string }[] }[]
}

export type Prompt =
  | TextPrompt
  | DatePrompt
  | PickPrompt
  | ChoicePrompt
  | TablePrompt
  | MatrixPrompt

/** A prompt with an answer of its own: every kind but a matrix. */
export type AnswerPrompt = Exclude<Prompt, MatrixPrompt>

/** Longest answer to a text prompt. */
export const MAX_TEXT_LENGTH = 10_000
/** Longest answer in one cell of a table prompt. */
export const MAX_CELL_LENGTH = 2_000
/** Longest option someone can write for a pick prompt. */
export const MAX_OWN_OPTION_LENGTH = 200
/** Most options someone can pick for a pick prompt without a `max`. */
export const MAX_PICKS = 50

/**
 * Free text or the option chosen, or a list: the options picked for a pick
 * prompt, or a table's cells.
 */
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
  /** Shown under the description. */
  lists?: InfoList[]
  prompts?: Prompt[]
  /** Numbered sub-parts with their own headings, e.g. 1.3.1. */
  parts?: WorkbookPart[]
  /** A sentence with a link, shown after the prompts, e.g. a policy reminder. */
  note?: { text: string; link: { label: string; url: string } }
  /** A last line, e.g. the source the section was adapted from. */
  footnote?: string
  /**
   * Links from one topic of the Resources page, so OPA staff can keep them up
   * to date in one place.
   */
  resources?: {
    topic: ResourceTopic
    title: string
    /** Before the prompts (the default) or after them, as in the workbook. */
    placement?: 'before' | 'after'
    /** A last line under the links. */
    footnote?: string
  }
}

/**
 * A sub-part of a section, shown under its own heading: a numbered one like
 * 1.3.1, or an unnumbered one like a case scenario.
 */
export type WorkbookPart = {
  /** Unique within its section. */
  ref: string
  title: string
  description?: string
  /** When it differs from the section's. */
  when?: string
  /** Shown under the description. */
  lists?: InfoList[]
  prompts?: Prompt[]
  /** A paragraph after the prompts, e.g. a reminder. */
  note?: string
}

/** A bulleted list to read, like tips or reflection questions, or links. */
export type InfoList = {
  heading?: string
  items: (string | { text: string; url: string })[]
}

/**
 * All of a section's prompts that have answers, including its parts'. Each
 * row of a matrix counts as a choice prompt.
 */
export function sectionPrompts(section: WorkbookSection): AnswerPrompt[] {
  return [
    ...(section.prompts ?? []),
    ...(section.parts ?? []).flatMap((part) => part.prompts ?? []),
  ].flatMap((prompt): AnswerPrompt[] =>
    prompt.kind === 'matrix'
      ? prompt.groups.flatMap((group) =>
          group.rows.map((row) => ({
            kind: 'choice',
            id: row.id,
            question: row.label,
            options: prompt.options,
          })),
        )
      : [prompt],
  )
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

// The workbook highlights in gray what's done after orientation: the "Add more
// detail" prompts in 1.3, and all of 1.4.2, 2.3, 3.2, 3.3 and 3.7.
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
            source: 'List adapted from the Stanford Meaningful Work Toolkit.',
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
                source:
                  'List adapted from the Stanford Meaningful Work Toolkit.',
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
  {
    id: 'benefits-policies',
    ref: '2',
    // The workbook's overview page calls it "Benefits and Policies".
    title: 'Postdoc Benefits & Policies',
    // 2.1 and 2.2, the onboarding checklists, are on the Checklist page.
    sections: [
      {
        id: 'boundaries-time',
        ref: '2.3',
        title: 'Boundary Setting & Time Management',
        when: 'Within 4 weeks of orientation',
        prompts: [
          {
            kind: 'text',
            id: 'time-askers',
            question: 'Who will regularly ask for your time?',
          },
          {
            kind: 'text',
            id: 'communication-plan',
            question: 'How will you communicate with these groups?',
          },
          {
            kind: 'text',
            id: 'online-hours',
            question: 'How often will you be online / monitoring emails?',
          },
          {
            kind: 'text',
            id: 'development-time',
            question: 'How will you protect time for professional development?',
          },
          {
            kind: 'text',
            id: 'boundary-phrasing',
            question: 'Sample phrasing to discuss boundaries with your mentor',
          },
        ],
        note: {
          // The workbook says "Refer to Yale Postdoctoral…", without "the".
          text: 'Reminder: Refer to the',
          link: {
            label: 'Yale Postdoctoral Associate/Fellow PTO policy',
            url: 'https://postdocs.yale.edu/postdocs/being-a-postdoc-at-yale/benefits-summary',
          },
        },
        // The workbook also lists "EOW sweep" as an approach, without a link.
        resources: {
          topic: 'time',
          title: 'Time Management Resources',
          placement: 'after',
        },
      },
      {
        id: 'wellness',
        ref: '2.4',
        title: 'Wellness Resources',
        description:
          'Planning your first year in your role holistically to include your emotional and physical wellbeing as priorities is imperative.',
        when: 'At orientation',
        resources: {
          topic: 'wellness',
          title: 'Wellness Resources at Yale',
          // The workbook says "Taichi".
          footnote:
            'Search for your particular wellness or physical activity (e.g., tai chi, Runner’s Club) using Google, Yale Connect, and/or the YPA Slack.',
        },
        // Examples tidied from the workbook: consistent capitals and
        // semicolons, and hyphens in "drop-in" and "30-minute check-in".
        prompts: [
          {
            kind: 'text',
            id: 'emotional',
            question:
              'What do you want to do and/or explore to promote your emotional wellbeing?',
            hint: 'Examples: Use Calm app daily; find a therapist; attend drop-in meditation',
          },
          {
            kind: 'text',
            id: 'physical',
            question:
              'What do you want to do and/or explore to promote your physical wellbeing?',
            hint: 'Examples: Try out New Haven Road Runners club; walk outside for at least 10 minutes each day; sign up for Yale or New Haven gym or sporting club (ask for ideas on the YPA Slack channel!)',
          },
          {
            kind: 'text',
            id: 'accountability',
            question:
              'What will you do to ensure accountability for your above emotional and physical wellbeing?',
            hint: 'Examples: Schedule a 30-minute check-in moment in your calendar once per month to reflect on your wellness and balance; find a colleague/family member/friend to share your commitments with and act as accountability partner',
          },
        ],
      },
    ],
  },
  {
    id: 'mentorship-communication',
    ref: '3',
    title: 'Mentorship & Communication',
    description:
      'Effective mentorship depends on explicit communication. Early alignment on expectations around feedback, meetings, and decision-making helps reduce stress, build trust, and support your independence as a scholar.',
    sections: [
      {
        id: 'mentorship-values',
        ref: '3.1',
        title: 'Articulating Your Mentorship Values',
        description:
          'Reflect on the values and actions you find most important in an effective mentoring relationship. Here are some examples: transparency, active listening, flexibility, respect, accountability, two-way feedback, career guidance, mutual growth.',
        when: 'At orientation',
        prompts: [
          {
            kind: 'table',
            id: 'values',
            question: 'Your mentorship values and actions',
            columns: ['Mentorship Value/Action', 'Why This Matters to Me'],
            rows: 3,
          },
        ],
      },
      {
        id: 'mentor-expectations',
        ref: '3.2',
        title: 'Aligning Expectations with Your Mentor',
        // The workbook says "Use this table to capture…".
        description:
          'Discuss the topics below with your mentor following orientation (during your initial meeting or early check-ins). Use the notes below to capture agreed-upon expectations.',
        when: 'After orientation',
        parts: [
          {
            ref: '3.2',
            // The table's caption. The workbook says "building and effective".
            title:
              'Understanding Position Expectations and Building an Effective Mentorship Relationship',
            description:
              'Your notes on your mentor’s response or joint discussion.',
            prompts: [
              {
                kind: 'text',
                id: 'meetings',
                label: 'Meeting structure',
                question:
                  'How often should we meet, and in what format (in person, Zoom, hybrid)?',
              },
              {
                kind: 'text',
                id: 'meeting-preparation',
                label: 'Meeting preparation',
                question:
                  'What preparation is expected for check-in meetings (e.g., agenda, written updates, data, questions)?',
              },
              {
                kind: 'text',
                id: 'communication-norms',
                label: 'Communication norms',
                question:
                  'What communication channels are preferred in different situations (email, Slack/Teams, in-person), and what response times are expected?',
              },
              {
                kind: 'text',
                id: 'availability',
                label: 'Availability and workload',
                question:
                  'What are the expectations for presence in the office/department/online, and how do workload demands vary over time?',
              },
              {
                kind: 'text',
                id: 'feedback',
                label: 'Feedback exchange',
                question:
                  'How and when will feedback be provided by the mentor, and how should the mentee provide feedback upward?',
              },
              {
                kind: 'text',
                id: 'decisions',
                label: 'Decision-making',
                question:
                  'How are decisions typically made regarding project direction, manuscripts, and collaborations (as applicable)?',
              },
              {
                kind: 'text',
                id: 'conferences',
                label: 'Conferences and visibility',
                question:
                  'What are the expectations around conference attendance and types of contributions (posters, talks, networking)?',
              },
              {
                kind: 'text',
                id: 'time-off',
                label: 'Time off',
                // The workbook links "postdoctoral PTO policy" to the benefits
                // summary, like 2.3's reminder.
                question:
                  'How should time off be requested, planned, and respected? (Refer to Yale postdoctoral PTO policy.)',
              },
              {
                kind: 'text',
                id: 'authorship',
                label: 'Authorship and credit',
                question:
                  'If applicable, what are the norms and expectations around authorship and intellectual contribution?',
              },
              {
                kind: 'text',
                id: 'anything-else',
                question: 'Anything else you would like to discuss?',
              },
            ],
          },
          {
            ref: '3.2.1',
            title: 'Additional Context for My Mentor',
            prompts: [
              {
                kind: 'text',
                id: 'context',
                question:
                  'Is there anything your mentor should know to better support you and build a trusting, professional relationship?',
                hint: 'Consider external commitments, work carried over from previous roles, or mentoring approaches that have or have not worked well for you.',
              },
            ],
          },
        ],
      },
      {
        id: 'mentoring-needs',
        ref: '3.3',
        title: 'Identifying Your Specific Mentoring Needs',
        when: 'Around month 3 or later',
        prompts: [
          {
            kind: 'matrix',
            id: 'needs',
            // The workbook has two columns, "Mentorship Support Needed?
            // (Yes/No)" and "Right now / Short-term (≤6 months) / Long-term
            // (1–2 years)". Choosing a time here means yes.
            question: 'Mentorship support needed?',
            source:
              'Adapted from Branchaw, J., Pfund, C., & Rediske, R. (2010). Entering Research: Workshops for Students Beginning Research in Science. W.H. Freeman & Co.',
            rowHeader: 'Specific Mentoring Need',
            options: [
              'No',
              'Right now',
              'Short-term (≤6 months)',
              'Long-term (1–2 years)',
            ],
            groups: [
              {
                label: 'Research Skills',
                rows: [
                  {
                    id: 'research-skills',
                    label:
                      'Develop research skills specific to my area of focus',
                  },
                  {
                    id: 'communication',
                    label: 'Improve communication (presenting and writing)',
                  },
                  {
                    id: 'collaboration',
                    label: 'Learn to collaborate effectively',
                  },
                  {
                    id: 'grants',
                    label: 'Write grant proposals and seek funding',
                  },
                ],
              },
              {
                label: 'Sponsorship Skills',
                rows: [
                  { id: 'independence', label: 'Foster my independence' },
                  {
                    id: 'visibility',
                    label: 'Support networking and professional visibility',
                  },
                  { id: 'work-life', label: 'Support work–life balance' },
                ],
              },
              {
                label: 'Interpersonal Skills',
                rows: [
                  {
                    id: 'expectations',
                    label:
                      'Define and align expectations in the mentoring relationship',
                  },
                  { id: 'feedback', label: 'Receive constructive feedback' },
                  {
                    id: 'trust',
                    label: 'Build honest, trusting communication',
                  },
                ],
              },
              {
                label: 'Psychosocial Skills',
                rows: [
                  {
                    id: 'research-efficacy',
                    label: 'Build research self-efficacy',
                  },
                  {
                    id: 'career-efficacy',
                    label: 'Build career self-efficacy',
                  },
                  { id: 'motivation', label: 'Maintain motivation' },
                ],
              },
              {
                label: 'Cultural & Inclusivity Skills',
                rows: [
                  {
                    id: 'belonging',
                    label:
                      'Develop a sense of belonging in my program/department',
                  },
                  {
                    id: 'diversity',
                    label:
                      'Engage in conversations about diversity and its impact on training',
                  },
                  { id: 'bias', label: 'Address bias and stereotype threat' },
                ],
              },
              {
                label: 'Career Exploration',
                rows: [
                  {
                    id: 'academic-paths',
                    label: 'Explore academic career paths',
                  },
                  {
                    id: 'non-academic-paths',
                    label: 'Explore non-academic career paths',
                  },
                  {
                    id: 'next-step-skills',
                    label:
                      'Identify skills needed for my next career step and resources to develop them',
                  },
                  {
                    id: 'viability',
                    label:
                      'Assess viability of the career options I am pursuing',
                  },
                ],
              },
            ],
          },
        ],
      },
      // The workbook has no 3.4.
      {
        id: 'crucial-conversations',
        ref: '3.5',
        title: 'Having Crucial Conversations with Your Mentor',
        description:
          'Use the guidance below to practice approaching challenging but important conversations with your faculty mentor.',
        when: 'At orientation',
        parts: [
          {
            ref: 'Case Scenario 1',
            title: 'Case Scenario 1: Time Off and Burnout',
            description:
              'Your mentor rarely takes time off and does not raise PTO use, despite being aware of the postdoctoral PTO policy. You find yourself working intensively without breaks and beginning to feel exhausted and burned out.',
            lists: [
              {
                heading: 'Reflection prompts',
                items: [
                  'How might you raise this concern constructively with your mentor?',
                  'How could you frame the conversation around sustainability and productivity?',
                  'What additional resources (people, policies, offices) could help you prepare?',
                ],
              },
            ],
            prompts: [
              { kind: 'text', id: 'scenario-1', question: 'Your notes' },
            ],
          },
          {
            ref: 'Guidance',
            title: 'Guidance for Having a Crucial Conversation',
            lists: [
              {
                heading: 'A. Clarify Your Goal (Before the Conversation)',
                items: [
                  'What do you hope to accomplish or change by having this conversation?',
                  'What factors might influence this conversation? (e.g., assumptions, past experiences, cultural differences, power dynamics)',
                ],
              },
              {
                heading: 'B. Prepare Your Message',
                items: [
                  'What do you want to share or ask your mentor?',
                  'What concerns or reactions might your mentor have, and how could you address them proactively?',
                  'What concrete next steps or accountability would be helpful? (e.g., follow-up email, shared document, check-in date)',
                ],
              },
              {
                // The workbook says "During the Conversation- Reminders".
                heading: 'C. During the Conversation: Reminders',
                items: [
                  'Listen to understand, not to respond',
                  'Reflect back what you hear (“It sounds like…”)',
                  'Identify shared goals (“We both want to make the deadline, but…”)',
                  // The workbook has no ellipsis or commas between the quotes.
                  'Stay curious & patient (“I noticed that…”, “What might I be missing?”, “How do you see it?”)',
                  'Understanding does not require agreement',
                ],
              },
              {
                heading: 'D. Reflect After the Conversation',
                items: [
                  'What went well? What could be improved or followed up on?',
                  'Next steps or additional support needed (e.g., another mentor, OPA, association leaders)',
                ],
              },
            ],
          },
          {
            // In the workbook this comes after 3.6.1, but it builds on the
            // guidance above.
            ref: 'Case Scenario 2',
            title:
              'Case Scenario 2: Aligning Expectations and Career Development',
            description:
              'Four months into your first year, your mentor has not asked about your goals or longer-term plans. Meetings focus exclusively on immediate research needs, and your mentor appears overwhelmed.',
            lists: [
              {
                heading: 'Reflection prompts',
                items: [
                  'How can you proactively “mentor up” to clarify expectations and goals?',
                  'How can you align your contributions with your mentor’s priorities while advancing your own development?',
                  'Use the above guidance on crucial conversations to inform your approach.',
                ],
              },
            ],
            prompts: [
              { kind: 'text', id: 'scenario-2', question: 'Your notes' },
            ],
          },
        ],
        footnote:
          'Informed by the Postdoc Academy Productive Conversation Worksheet and Crucial Conversations (Patterson et al.).',
      },
      {
        id: 'skills-development',
        ref: '3.6',
        title: 'Mentorship & Your Skills Development',
        // The workbook says "Circle the skills".
        description:
          'Choose the skills (or add your own) you wish to build or strengthen to meet your goals.',
        when: 'At orientation',
        // The workbook lists each area's skills in one sentence, in lower case.
        prompts: [
          {
            kind: 'pick',
            id: 'academic-skills',
            question: 'Academic, Research & Technical Skills',
            allowOwn: true,
            options: [
              'Critical reading',
              'Experimental design and techniques',
              'Data/statistical analysis',
              'Computational or archival methods',
              'Documentation',
              'Responsible conduct of research',
              'Identification of new research directions',
              'Conference presentations',
              'Publications',
            ],
          },
          {
            kind: 'pick',
            id: 'professional-skills',
            question: 'Professional & Interpersonal Skills',
            allowOwn: true,
            options: [
              'Communication (oral and written)',
              'Grant writing',
              'Manuscript writing',
              'Mentoring up',
              'Mentoring others',
              'Teamwork',
              'Giving and receiving feedback',
              'Collegiality',
              'Networking',
            ],
          },
          {
            kind: 'pick',
            id: 'management-skills',
            question: 'Management & Leadership Skills',
            allowOwn: true,
            options: [
              'Time management',
              'Prioritization',
              'Project management',
              'Budgeting',
              'Supervision',
              'Delegation',
              'Motivating others',
            ],
          },
        ],
        parts: [
          {
            ref: '3.6.1',
            title:
              'Initial Actions and Resources for Your Skills Development Areas',
            // The workbook says "circle (or add your own)".
            description:
              'Review the resources below and choose (or add your own) which ones you wish to explore.',
            prompts: [
              {
                kind: 'pick',
                id: 'goal-setting',
                question: 'Goal Setting Actions & Resources',
                allowOwn: true,
                layout: 'checklist',
                options: [
                  'Explore OPA webpage with planning resources',
                  'Attend a YPA career event',
                  'Try out WOOP goal-setting method',
                  'Take the “Succeeding as a Postdoc” course at The Postdoc Academy',
                ],
                links: {
                  'Explore OPA webpage with planning resources':
                    'https://postdocs.yale.edu/professional-career-development/postdoctoral-appointment/goal-setting-and-career-planning',
                  'Try out WOOP goal-setting method': 'https://woopmylife.org/',
                  'Take the “Succeeding as a Postdoc” course at The Postdoc Academy':
                    'https://www.postdocacademy.org/',
                },
              },
              {
                kind: 'pick',
                id: 'planning-tools',
                // Under "Goal Setting Actions & Resources" in the workbook.
                question: 'Try out an asynchronous planning tool',
                allowOwn: true,
                layout: 'checklist',
                // The workbook writes "MyIDP" and "Imagine PhD".
                options: [
                  'Stanford Meaningful Work Kit',
                  'myIDP – STEM disciplines',
                  'ImaginePhD – Social Sciences & Humanities',
                  'Designing Your Career: Yale OCS Online Tool',
                ],
                links: {
                  'Stanford Meaningful Work Kit': 'https://mwk.stanford.edu/',
                  'myIDP – STEM disciplines':
                    'https://myidp.sciencecareers.org/',
                  'ImaginePhD – Social Sciences & Humanities':
                    'https://www.imaginephd.com/',
                  'Designing Your Career: Yale OCS Online Tool':
                    'https://ocs.yale.edu/designing-your-career/',
                },
              },
              {
                kind: 'pick',
                id: 'communication-resources',
                question:
                  'Communication Skills, Grants & Funding and Teaching Development',
                allowOwn: true,
                layout: 'checklist',
                options: [
                  'Graduate Writing Lab – sign up for newsletter for resources and events',
                  'Writing Consultations – sign up for feedback on a piece of writing',
                  'Poorvu Center for Teaching & Learning – sign up for newsletter to learn about teaching events and postdoc teaching certificate',
                  'English Language Program – check out website and sign up for a class at start of next semester',
                  // The workbook says "many skills areas".
                  'Yale Workday Learning – explore courses addressing many skill areas',
                  'OPA Funding Page – review for opportunities',
                  'OPA webpage with more resources – review for ideas and resources',
                  'Join YPA grant, communication or teaching events',
                ],
                links: {
                  'Graduate Writing Lab – sign up for newsletter for resources and events':
                    'https://poorvucenter.yale.edu/writing/graduate-writing-lab/the-graduate-writing-lab-newsletter',
                  'Writing Consultations – sign up for feedback on a piece of writing':
                    'https://poorvucenter.yale.edu/writing/graduate-writing-lab/writing-consultations',
                  'Poorvu Center for Teaching & Learning – sign up for newsletter to learn about teaching events and postdoc teaching certificate':
                    'https://poorvucenter.yale.edu/',
                  'English Language Program – check out website and sign up for a class at start of next semester':
                    'https://cls.yale.edu/programs/english-language-program',
                  'Yale Workday Learning – explore courses addressing many skill areas':
                    'https://your.yale.edu/working-at-yale/learn-grow/learning',
                  'OPA Funding Page – review for opportunities':
                    'https://postdocs.yale.edu/professional-career-development/postdoctoral-appointment/funding-opportunities',
                  'OPA webpage with more resources – review for ideas and resources':
                    'https://postdocs.yale.edu/professional-career-development/postdoctoral-appointment/communication-skills',
                },
              },
              {
                kind: 'pick',
                id: 'leadership-resources',
                question: 'Leadership, Mentorship & Management',
                allowOwn: true,
                layout: 'checklist',
                // The workbook lists the three programs under "OPA
                // programming", and writes "in person" without a hyphen.
                options: [
                  'OPA webpage – review for resources (including asynchronous online courses)',
                  'Yale Workday Learning – explore courses addressing leadership and management skills',
                  'OPA programming: LMAP synchronous online program offered each spring',
                  'OPA programming: Practicing Leadership in-person program offered each fall',
                  'OPA programming: one-off in-person workshops offered each fall',
                ],
                links: {
                  'OPA webpage – review for resources (including asynchronous online courses)':
                    'https://postdocs.yale.edu/professional-career-development/postdoctoral-appointment/leadership-and-management-skills',
                  'Yale Workday Learning – explore courses addressing leadership and management skills':
                    'https://your.yale.edu/working-at-yale/learn-grow/learning',
                  'OPA programming: LMAP synchronous online program offered each spring':
                    'https://yaleconnect.yale.edu/feeds?type=club&type_id=61914&tab=about',
                  'OPA programming: Practicing Leadership in-person program offered each fall':
                    'https://yaleconnect.yale.edu/feeds?type=club&type_id=61914&tab=about',
                  'OPA programming: one-off in-person workshops offered each fall':
                    'https://yaleconnect.yale.edu/feeds?type=club&type_id=61914&tab=about',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'mentoring-team',
        ref: '3.7',
        title: 'Developing Your Mentoring Team',
        description:
          'While your faculty mentor is your primary supervisor, a mentoring team can:',
        when: 'In your first few weeks and months',
        lists: [
          {
            items: [
              'Provide diverse perspectives',
              'Offer targeted skill or psychosocial support',
              'Expand professional networks and career insight',
            ],
          },
        ],
        parts: [
          {
            ref: '3.7 Identifying Additional Mentors',
            title: 'Identifying Additional Mentors',
            description:
              'Fill this in with ideas in the first few weeks and months of your postdoc role and continue building. Add notes and contacts for each.',
            prompts: [
              {
                kind: 'text',
                id: 'current-mentors',
                question: 'Who do you already have that you consider a mentor?',
              },
              {
                kind: 'text',
                id: 'faculty-recommendations',
                question: 'Faculty mentor recommendations',
              },
              {
                kind: 'text',
                id: 'colleagues',
                question: 'Colleagues or peers',
              },
              {
                kind: 'text',
                id: 'conferences',
                question: 'Conferences or professional societies',
              },
              {
                kind: 'text',
                id: 'networks',
                question: 'LinkedIn or alumni networks',
              },
              {
                kind: 'text',
                id: 'programs',
                // TODO(Nish): the workbook says "ODPA". Confirm with OPA that it
                // means OPA.
                question: 'OPA / YPA mentorship programs',
              },
            ],
          },
          {
            ref: '3.7 Initiating & Sustaining',
            title: 'Initiating & Sustaining Mentoring Relationships',
            lists: [
              {
                items: [
                  'Introduce yourself and express interest in their expertise',
                  'Ask to meet to discuss career path or skill development',
                  'If the fit is good, suggest a follow-up meeting',
                  'If not, reflect and identify another mentor',
                  'Come prepared with topics or materials (drafts, grant outlines, job descriptions)',
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'community-next-steps',
    ref: '4',
    // TODO(Nish): ask OPA which title to use. The section's own heading,
    // "Connection, Career Direction & Self-Assessment (Exploratory)", repeats
    // 1.4's title, so this uses the overview page's name for it.
    title: 'Community & Next Steps',
    sections: [
      {
        id: 'associations',
        ref: '4.1',
        title: 'Connection: Yale Postdoc Associations',
        lists: [
          {
            items: [
              {
                text: 'Yale Postdoc Association (YPA)',
                url: 'https://ypa.yale.edu/',
              },
              {
                text: 'YPA Buddy Program',
                url: 'https://ypa.yale.edu/committees/mentorship-committee/buddy-program',
              },
              {
                text: 'Yale Black Postdoc Association (YBPA)',
                url: 'https://medicine.yale.edu/ybpa/',
              },
            ],
          },
        ],
      },
      {
        id: 'community',
        ref: '4.2',
        title: 'Community & Belonging',
        description:
          'Connecting with others, especially outside your unit/lab, can help you grow your personal and professional network and sense of belonging.',
        when: 'At orientation',
        prompts: [
          {
            kind: 'pick',
            id: 'community-actions',
            // The workbook says "circle (or add your own)", and "Your ideas"
            // for adding your own.
            question:
              'Review the resources below and choose (or add your own) which ones you wish to explore',
            allowOwn: true,
            layout: 'checklist',
            options: [
              'Join YPA to see Yale Postdoc Association Events and attend one!',
              'Join YBPA to see Yale Black Postdoc Association Events and attend one!',
              'Join YPA Slack Channel',
              'Office of International Students and Scholars – sign up for newsletter to learn about events',
              'Check out events offered by the Social & Affinity Groups at Yale',
              'Check out Yale Postdoc Association’s Welcome to Yale page',
              'Check out the Yale Postdoc Association webpage',
              // The workbook leaves out "the" here.
              'Check out the Yale Black Postdoc Association webpage',
              'Follow up with someone you met at orientation for coffee',
              'Look up events in Yale Connect',
            ],
            links: {
              'Join YPA to see Yale Postdoc Association Events and attend one!':
                'https://yaleconnect.yale.edu/PDYPA/club_signup',
              'Join YBPA to see Yale Black Postdoc Association Events and attend one!':
                'https://yaleconnect.yale.edu/PDYBPDA/club_signup',
              'Join YPA Slack Channel':
                'https://ypa-yale.slack.com/join/shared_invite/enQtODM3Mjc0NDg3MTU5LTFjZDA4ZGUwYjEwMzdkNmQzMjFkMTY2NDhjYTVhMTY1MmRiMTIwNWM1MjIyM2JmNTU3ZjRhZDVjYTYxZDYyNzI',
              'Office of International Students and Scholars – sign up for newsletter to learn about events':
                'https://oiss.yale.edu/programs-events/newsletter-social-media',
              'Check out events offered by the Social & Affinity Groups at Yale':
                'https://ypa.yale.edu/resources/social-and-affinity-groups',
              'Check out Yale Postdoc Association’s Welcome to Yale page':
                'https://docs.google.com/document/d/1Yq_jvbiUsewjDPfwoMLNnSQUfBR77hZixivyU9btYi4/edit?tab=t.0',
              'Check out the Yale Postdoc Association webpage':
                'https://ypa.yale.edu/',
              'Check out the Yale Black Postdoc Association webpage':
                'https://medicine.yale.edu/ybpa/',
              'Look up events in Yale Connect':
                'https://yaleconnect.yale.edu/home_login',
            },
          },
        ],
      },
      {
        id: 'first-three-months',
        ref: '4.3',
        // The workbook says "Your To Do list".
        title: 'Initial Steps: Your To-Do List and Prioritizing',
        when: 'At orientation',
        prompts: [
          {
            kind: 'date',
            id: 'idp-date',
            question: 'What is the date approximately 3 months from now?',
            // The workbook ends with "- see next section", the Initial IDP
            // worksheet.
            hint: 'This is when we recommend meeting with your mentor with your Initial Development Plan (IDP).',
          },
        ],
        // The workbook points back to sections by number, e.g. "from section
        // 2.4 Wellness". These use the sections' titles instead.
        // TODO: show what they wrote in those sections, instead of asking them
        // to write it again.
        parts: [
          {
            ref: '4.3 Month 1',
            title: 'Month 1 (Next 4 Weeks): Explore the Resources',
            description: 'Suggestion: Block off 1 hour each week.',
            prompts: [
              {
                kind: 'text',
                id: 'wellness-plan',
                label: 'Wellness',
                // The workbook says "Insert below…" in each area.
                question:
                  'Add what you wanted to explore in Wellness Resources and what goals and accountability you articulated',
              },
              {
                kind: 'text',
                id: 'wellness-time',
                question:
                  'How much time do you want to spend to explore and to plan how you will implement your wellness goals and accountability?',
                hint: 'Suggestion: 1 hour',
                short: true,
              },
              {
                kind: 'text',
                id: 'wellness-when',
                question: 'When in your first 4 weeks will you do this?',
                hint: 'Suggestion: Week 1 (next week) after orientation',
                short: true,
              },
              {
                kind: 'text',
                id: 'community-plan',
                label: 'Community & Belonging',
                // The workbook says "you circled".
                question:
                  'Add the areas to explore/actions to take you chose in Community & Belonging',
              },
              {
                kind: 'text',
                id: 'community-time',
                question:
                  'How much time do you want to spend to explore these/take these actions?',
                hint: 'Suggestion: 1 hour',
                short: true,
              },
              {
                kind: 'text',
                id: 'community-when',
                question: 'When in your first 4 weeks will you do this?',
                hint: 'Suggestion: Week 2 after orientation',
                short: true,
              },
              {
                kind: 'text',
                id: 'skills-plan',
                label: 'Skills Development',
                question:
                  'Add the areas to explore/actions to take you chose in Initial Actions and Resources for Your Skills Development Areas',
              },
              {
                kind: 'text',
                id: 'skills-time',
                question:
                  'How much time do you want to spend to explore these/take these actions?',
                hint: 'Suggestion: minimum 1 hour',
                short: true,
              },
              {
                kind: 'text',
                id: 'skills-when',
                question: 'When in your first 4 weeks will you do this?',
                hint: 'Suggestion: Week 3 after orientation',
                short: true,
              },
              {
                kind: 'text',
                id: 'career-plan',
                label: 'Career Discernment',
                question:
                  'Add the areas to explore/actions from Career Discernment & Preparation based on your current stage',
              },
              {
                kind: 'text',
                id: 'career-time',
                question:
                  'How much time do you want to spend to explore these/take these actions?',
                // The workbook has "(suggestion: minimum 1 hour)" here.
                hint: 'Suggestion: minimum 1 hour',
                short: true,
              },
              {
                kind: 'text',
                id: 'career-when',
                question: 'When in your first 4 weeks will you do this?',
                hint: 'Suggestion: Week 4 after orientation',
                short: true,
              },
            ],
            // TODO(Nish): ask OPA what "3.4" means here. The workbook says
            // "(sections 3.2 and 3.4)", and has no 3.4.
            note: 'Don’t forget to align expectations with your mentor (see Aligning Expectations with Your Mentor). You don’t have to address all areas in a single meeting or conversation, but be sure to take notes (Aligning Expectations with Your Mentor is a good place for this!).',
          },
          {
            ref: '4.3 Month 2',
            title: 'Month 2: Choose What to Prioritize and Start Engaging',
            // Each area is a to-do list to tick off. The workbook puts the
            // suggested time and week in their own columns.
            prompts: [
              {
                kind: 'pick',
                id: 'month-2-role',
                question: 'Articulating Your Role & Your Goals',
                hint: 'Suggestion: Block off 30–60 minutes to do this. Complete this in Week 5.',
                allowOwn: false,
                layout: 'checklist',
                options: [
                  'Fill out “Add more detail” under Project Title(s) or Research Area(s) with full details about your role’s responsibilities & projects',
                  'Fill out “Add more detail” under Identify Your Postdoc Goals with more details about your goal(s)',
                ],
              },
              {
                kind: 'pick',
                id: 'month-2-wellness',
                question: 'Wellness, Boundary Setting & Time Management',
                hint: 'Suggestion: Block off 30–60 minutes to do this. Complete this in Week 6.',
                allowOwn: false,
                layout: 'checklist',
                options: [
                  'Fill out Boundary Setting & Time Management and check out the time management resources',
                  'Check in on your wellness goals and accountability: make adjustments and/or explore further resources as needed',
                ],
              },
              {
                kind: 'pick',
                id: 'month-2-community',
                question: 'Community & Belonging',
                hint: 'Suggestion: Block off 30 minutes to do this. Complete this in Week 7.',
                allowOwn: false,
                layout: 'checklist',
                options: [
                  'Reflect on events or groups you’ve engaged with thus far in terms of socializing and community',
                  'Decide and sign up for an event either with the same group or try out a new one',
                ],
              },
              {
                kind: 'pick',
                id: 'month-2-skills-career',
                question: 'Skills Development & Career Discernment',
                hint: 'Reflect on your skills development and career discernment activities thus far. Suggestion: Block off 60–90 minutes to do this. Complete this in Week 8.',
                allowOwn: false,
                layout: 'checklist',
                options: [
                  'Look back at the skills areas and resources/initial actions in Mentorship & Your Skills Development, along with the next career steps you are considering. Make any changes to what skills you wish to prioritize for development.',
                  // The workbook has "identify: what kinds of resources do you
                  // need…" and ends the examples with "etc.".
                  'Reflect on the events and resources with which you’ve already engaged – are these helping you develop the skills you wish? If not, identify what kinds of resources you need to work on those skills (e.g., a mentor in this area to offer feedback, a workshop/training, opportunity to practice).',
                  // The workbook says "Office for Postdoc Affairs".
                  'Find and engage with the resources and events you need to develop those skills (use the workbook, the Office of Postdoctoral Affairs website, and/or ask your mentoring team for guidance).',
                ],
              },
            ],
          },
          {
            ref: '4.3 Month 3',
            title:
              'Month 3: Prepare for Your Initial Development Plan (IDP) Meeting',
            // TODO: link to the Initial IDP once the IDP Builder page exists.
            prompts: [
              {
                kind: 'pick',
                id: 'month-3-role',
                question: 'Your Role, Goals and Reflection',
                hint: 'Suggestion: Block off 30–60 minutes to do this. Complete this in Week 9.',
                allowOwn: false,
                layout: 'checklist',
                // The workbook says "Fill our".
                options: [
                  'Schedule the Initial IDP meeting with your faculty mentor',
                  'Fill out sections 1, 2 and 3 of your Initial IDP',
                ],
              },
              {
                kind: 'pick',
                id: 'month-3-skills',
                question:
                  'Skills & Professional Development, Career Preparation',
                hint: 'Suggestion: Block off 60–90 minutes to do this. Complete this in Week 10.',
                allowOwn: false,
                layout: 'checklist',
                options: [
                  'Fill out sections 4, 5, 6, 7 and 8 of your Initial IDP',
                ],
              },
              {
                kind: 'pick',
                id: 'month-3-mentorship',
                question: 'Mentorship and Building Your Mentoring Team',
                hint: 'Suggestion: Block off 30–60 minutes to do this. Complete this in Week 11.',
                allowOwn: false,
                layout: 'checklist',
                options: [
                  'Now knowing more about your faculty mentor and your own needs, fill out Identifying Your Specific Mentoring Needs (or note down your own additional/different needs)',
                  'Continue filling in Developing Your Mentoring Team with any additional mentors',
                  'Prepare to ask your faculty mentor for suggestions for further mentors based on your needs and career interests',
                ],
              },
              {
                kind: 'pick',
                id: 'month-3-meeting',
                question: 'Preparing for Your Meeting',
                hint: 'Suggestion: Block off 60–90 minutes to do this. Complete this in Week 12.',
                allowOwn: false,
                layout: 'checklist',
                // The workbook says "Share Initial IDP".
                options: [
                  'Make any final inputs or changes to your Initial IDP',
                  'Share your Initial IDP with your mentor prior to the meeting',
                  'Review your workbook and your IDP to prepare for your meeting',
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]
