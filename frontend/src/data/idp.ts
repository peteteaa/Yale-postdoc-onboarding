// The Initial Individual Development Plan (IDP) worksheet, from the end of the
// OPA orientation workbook. Wording and order follow the worksheet, so the
// web page and the exported PDF read like the paper version.

/** One of the worksheet's numbered questions ("sections 1–8" in workbook 4.3). */
export type IdpQuestion = {
  id: string
  /** 1–8. The worksheet's bullets aren't numbered, but workbook 4.3 refers to them by number. */
  n: number
  title: string
  prompt: string
  /** Workbook sections to draw the answer from, e.g. "1.3.2". */
  from?: string[]
  /** Whether the worksheet has a "Mentor input/changes" box for it. */
  mentorInput: boolean
}

export const IDP_QUESTIONS: IdpQuestion[] = [
  {
    id: 'goals',
    n: 1,
    title: 'Goals for your postdoc',
    prompt:
      'e.g., independent project, pedagogical approach, research question, manuscript, etc.',
    from: ['1.3.2'],
    mentorInput: true,
  },
  {
    id: 'experiences',
    n: 2,
    title: 'Relevant experiences and skills',
    prompt:
      'Which past academic or professional experiences have led you to these goals?',
    from: ['1.1'],
    mentorInput: true,
  },
  {
    id: 'tasks',
    n: 3,
    title: 'Tasks, responsibilities, and projects',
    prompt:
      'What are the main tasks or projects you expect to work on in your postdoc role?',
    from: ['1.3.1'],
    mentorInput: true,
  },
  {
    id: 'skills',
    n: 4,
    title: 'Skills development',
    prompt:
      'Which skills do you need to acquire or strengthen to meet your postdoc goals?',
    from: ['3.6', '3.6.1'],
    mentorInput: true,
  },
  {
    id: 'milestones',
    n: 5,
    title: 'Milestones and progress',
    prompt:
      'Identify concrete checkpoints (e.g., data generated, manuscripts submitted, figures drafted).',
    mentorInput: true,
  },
  {
    id: 'future-career',
    n: 6,
    title: 'Future career considerations',
    prompt:
      'Which professional contexts or roles are you considering after your postdoc?',
    from: ['1.4.1', '1.4.2'],
    mentorInput: true,
  },
  {
    id: 'career-prep',
    n: 7,
    title: 'Career preparation',
    prompt:
      'Discuss with your mentor about which experiences or skills will help you explore career options or become competitive for your next role.',
    from: ['1.4.3'],
    mentorInput: true,
  },
  {
    id: 'comments',
    n: 8,
    title: 'Additional comments',
    prompt:
      'Share any other relevant points, personal commitments, outreach or professional activities.',
    mentorInput: false,
  },
]

/** "Aligning Expectations with Your Mentor". Close to workbook 3.2, plus the question about tracking progress. */
export const IDP_ALIGNMENT: { id: string; question: string }[] = [
  {
    id: 'meetings',
    question:
      'How often do you expect to meet, and in what format (in person, Zoom, etc.)?',
  },
  {
    id: 'preparation',
    question:
      'What should be prepared for check-in meetings (work products, questions, agenda, etc.)?',
  },
  {
    id: 'tracking',
    question:
      'How will work, progress, and professional development be tracked?',
  },
  {
    id: 'communication',
    question:
      'Preferred communication methods and contexts (email, Slack, in-person, etc.)',
  },
  {
    id: 'presence',
    question:
      'Expectations for presence in office/department/online and workload patterns',
  },
  {
    id: 'feedback',
    question:
      'Feedback schedule: when and how will mentor give feedback? How will postdoc provide feedback?',
  },
  {
    id: 'decisions',
    question:
      'How are project decisions, manuscripts, and collaborations managed?',
  },
  {
    id: 'conferences',
    question: 'Conference participation expectations (number, contributions)',
  },
  { id: 'time-off', question: 'Time-off policies and request procedures' },
  {
    id: 'authorship',
    question: 'Authorship or contribution norms (if applicable)',
  },
]

export const IDP_INTRO = {
  purpose:
    'Postdoctoral training at Yale University is designed to support rigorous academic and/or research training while preparing you for long-term career success. Evidence from the National Institutes of Health (NIH) and National Postdoctoral Association (NPA) shows that early, structured conversations about expectations, mentorship, and development reduce conflict, improve productivity, and support well-being. This optional Initial IDP is designed to assist you in guiding these conversations and aligning expectations early on in your postdoc role.',
  is: [
    'A structured reflection on progress and challenges',
    'A planning tool to refine goals and priorities',
    'A shared document to support communication and mentoring',
  ],
  isNot: [
    'A performance evaluation',
    'Tied to funding or employment decisions',
    'A binding contract',
  ],
  guidance:
    'Using your orientation workbook, summarize the information prompted below and share it with your faculty mentor. Incorporate their input before finalizing and signing this document.',
  deadline:
    'Complete this Initial IDP Worksheet within the first three months of appointment.',
}

/** "IDP Development and Review Timeline". */
export const IDP_TIMELINE: {
  when: string
  activities: string
  checkins: string
}[] = [
  {
    when: 'Orientation (Week 0)',
    activities:
      'Complete initial survey; begin reflective exercises; attend IDP introduction session',
    checkins: 'Discuss IDP process and resources with OPA/mentor',
  },
  {
    when: '1 Month',
    activities:
      'Complete self-reflection; draft initial goals; identify training needs',
    checkins: 'Optional feedback from mentor or peer',
  },
  {
    when: '3 Months',
    activities:
      'Share completed Initial IDP; align expectations and roles; identify resources',
    checkins: 'Sign IDP; set recurring check-ins',
  },
  {
    when: '6 Months',
    activities:
      'Review progress; draft figures/manuscripts if applicable; complete initial training',
    checkins: 'Adjust goals and milestones',
  },
  {
    when: '9 Months',
    activities:
      'Review achievements; submit manuscripts/grants if applicable; assess mentoring needs',
    checkins: 'Update IDP for the next year',
  },
]

/** "Summary & Mutual Expectations". */
export const IDP_SUMMARY = {
  intro: 'This section establishes shared understanding and accountability:',
  schedule: [
    'Postdoc: Schedule regular reflection on goals and progress.',
    'Both: Schedule regular discussions to review progress and adjust plans as needed.',
  ],
  commitments: [
    'Postdoc: active engagement, open communication, professional development',
    'Mentor: guidance, constructive feedback, advocacy, support',
    'Mutual: ongoing assessment of progress, resources, and work environment',
  ],
}

export const IDP_ACKNOWLEDGEMENT =
  'We acknowledge that we have discussed the goals and expectations outlined in this Initial IDP Worksheet and agree that it reflects the framework for postdoctoral training at Yale University.'

/** Everything typed into the IDP builder. */
export type IdpAnswers = {
  postdocName: string
  mentorName: string
  /** Free text, e.g. "Molecular Biophysics & Biochemistry". */
  department: string
  /** Postdoc's own answer, by question id. */
  responses: Record<string, string>
  /** "Mentor input/changes", by question id. */
  mentorInput: Record<string, string>
  /** "Notes from Discussion", by alignment question id. */
  alignment: Record<string, string>
  /** Summary & Mutual Expectations → "Additional notes". */
  summaryNotes: string
}

export const EMPTY_IDP: IdpAnswers = {
  postdocName: '',
  mentorName: '',
  department: '',
  responses: {},
  mentorInput: {},
  alignment: {},
  summaryNotes: '',
}
