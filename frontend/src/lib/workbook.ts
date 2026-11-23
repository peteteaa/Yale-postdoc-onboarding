import type { Answer, WorkbookAnswers } from '#/data/workbook'
import { createClient } from '#/lib/supabase/server'

/** A row of the `workbook_answers` table, without the user and timestamp. */
type AnswerRow = { section_id: string; prompt_id: string; answer: Answer }

/**
 * The signed-in person's id and saved answers. `error` is set when they can't
 * be read (for example, before the migration has been run).
 */
export async function getAnswers(): Promise<{
  userId: string | null
  answers: WorkbookAnswers
  error: string | null
}> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  const userId = auth?.claims?.sub
  if (!userId) return { userId: null, answers: {}, error: 'Not signed in' }

  // Row-level security already limits this to their own answers. Filtering by
  // user too keeps it that way if staff are ever allowed to read answers.
  const { data, error } = await supabase
    .from('workbook_answers')
    .select('section_id, prompt_id, answer')
    .eq('user_id', userId)
    .overrideTypes<AnswerRow[], { merge: false }>()

  if (error) {
    console.error('Loading workbook answers failed:', error)
    return { userId, answers: {}, error: error.message }
  }
  const answers: WorkbookAnswers = {}
  for (const row of data) {
    answers[row.section_id] = {
      ...answers[row.section_id],
      [row.prompt_id]: row.answer,
    }
  }
  return { userId, answers, error: null }
}
