// Postdoc progress shown to OPA staff. Completion status only: workbook
// answers and IDPs are private to the postdoc and never appear here.

import type { Visa } from '#/data/checklist'

// TODO: from the workbook content once the Workbook page exists
export const WORKBOOK_MODULES = 7

export type PostdocProgress = {
  netId: string
  name: string
  department: string
  /** Appointment start date, 'YYYY-MM-DD'. */
  start: string
  visa: Visa
  /**
   * How many tasks are done in each overview column (first day, first week,
   * first 30 days, international), counted in checklist order.
   * TODO: replace with the real per-task progress from the backend
   */
  checklistDone: [number, number, number, number]
  workbookModulesDone: number
  /** 'YYYY-MM-DD' */
  lastActive: string
}

// TODO: load from the backend. Sample rows from the mockup: 10 of the 48
// postdocs in the Fall 2026 cohort.
export const POSTDOCS: PostdocProgress[] = [
  {
    netId: 'pr482',
    name: 'Priya Raman',
    department: 'Molecular Biophysics & Biochemistry',
    start: '2026-09-01',
    visa: 'j1',
    checklistDone: [2, 4, 2, 4],
    workbookModulesDone: 3,
    lastActive: '2026-10-11',
  },
  {
    netId: 'do215',
    name: 'Daniel Okafor',
    department: 'Chemistry',
    start: '2026-09-01',
    visa: 'j1',
    checklistDone: [2, 4, 3, 5],
    workbookModulesDone: 4,
    lastActive: '2026-10-09',
  },
  {
    netId: 'mc377',
    name: 'Mei Lin Chen',
    department: 'Genetics',
    start: '2026-09-01',
    visa: 'j1',
    checklistDone: [2, 3, 1, 3],
    workbookModulesDone: 1,
    lastActive: '2026-09-28',
  },
  {
    netId: 'sb104',
    name: 'Samuel Brooks',
    department: 'Psychology',
    start: '2026-09-01',
    visa: 'domestic',
    checklistDone: [2, 4, 3, 0],
    workbookModulesDone: 7,
    lastActive: '2026-10-10',
  },
  {
    netId: 'ag529',
    name: 'Ana Gutiérrez',
    department: 'Ecology & Evolutionary Biology',
    start: '2026-09-15',
    visa: 'f1-opt',
    checklistDone: [2, 4, 1, 1],
    workbookModulesDone: 0,
    lastActive: '2026-10-08',
  },
  {
    netId: 'jf640',
    name: 'Jonah Feld',
    department: 'Physics',
    start: '2026-09-01',
    visa: 'domestic',
    checklistDone: [2, 2, 0, 0],
    workbookModulesDone: 0,
    lastActive: '2026-09-12',
  },
  {
    netId: 'ab733',
    name: 'Aisha Bello',
    department: 'Immunobiology',
    start: '2026-08-17',
    visa: 'j1',
    checklistDone: [2, 4, 3, 5],
    workbookModulesDone: 3,
    lastActive: '2026-10-11',
  },
  {
    netId: 'lb318',
    name: 'Lukas Brandt',
    department: 'Computer Science',
    start: '2026-10-01',
    visa: 'j1',
    checklistDone: [2, 4, 0, 2],
    workbookModulesDone: 1,
    lastActive: '2026-10-07',
  },
  {
    netId: 'gw256',
    name: 'Grace Whitman',
    department: 'Neuroscience',
    start: '2026-09-01',
    visa: 'domestic',
    checklistDone: [2, 4, 2, 0],
    workbookModulesDone: 5,
    lastActive: '2026-10-06',
  },
  {
    netId: 'tr891',
    name: 'Tomás Rivera',
    department: 'Economics',
    start: '2026-09-15',
    visa: 'domestic',
    checklistDone: [2, 4, 1, 0],
    workbookModulesDone: 2,
    lastActive: '2026-10-02',
  },
]
