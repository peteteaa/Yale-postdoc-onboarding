import type { IdpAnswers } from '#/data/idp'
import { idpFromFields } from '#/data/idp'
import { createClient } from '#/lib/supabase/server'

/**
 * The signed-in person's saved IDP answers. `error` is set when they can't be
 * read (for example, before the migration has been run).
 */
export async function getIdpAnswers(): Promise<{
  answers: IdpAnswers
  error: string | null
}> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  const userId = auth?.claims?.sub
  if (!userId) return { answers: idpFromFields({}), error: 'Not signed in' }

  // Row-level security already limits this to their own answers. Filtering by
  // user too keeps it that way if staff are ever allowed to read answers.
  const { data, error } = await supabase
    .from('idp_answers')
    .select('field_id, answer')
    .eq('user_id', userId)
    .overrideTypes<{ field_id: string; answer: string }[], { merge: false }>()

  if (error) {
    console.error('Loading IDP answers failed:', error)
    return { answers: idpFromFields({}), error: error.message }
  }
  return {
    answers: idpFromFields(
      Object.fromEntries(data.map((row) => [row.field_id, row.answer])),
    ),
    error: null,
  }
}
