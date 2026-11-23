'use server'

import { idpFieldIds, MAX_IDP_ANSWER_LENGTH } from '#/data/idp'
import { createClient } from '#/lib/supabase/server'

/**
 * Saves the signed-in person's IDP answers, by field id. Blank answers are
 * removed.
 */
export async function saveIdpAnswers(
  answers: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  if (typeof answers !== 'object' || answers === null) return { ok: false }

  const known = new Set(idpFieldIds())
  const toSave: { field_id: string; answer: string }[] = []
  const toRemove: string[] = []
  for (const [fieldId, value] of Object.entries(answers)) {
    if (
      !known.has(fieldId) ||
      typeof value !== 'string' ||
      value.length > MAX_IDP_ANSWER_LENGTH
    ) {
      return { ok: false }
    }
    if (value.trim() === '') toRemove.push(fieldId)
    else toSave.push({ field_id: fieldId, answer: value })
  }

  const supabase = await createClient()
  // Check here too, not just in proxy.ts: Server Actions can be called directly.
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) return { ok: false }

  const [saved, removed] = await Promise.all([
    toSave.length > 0
      ? supabase
          .from('idp_answers')
          .upsert(toSave.map((row) => ({ user_id: userId, ...row })))
      : null,
    toRemove.length > 0
      ? supabase
          .from('idp_answers')
          .delete()
          .eq('user_id', userId)
          .in('field_id', toRemove)
      : null,
  ])
  const error = saved?.error ?? removed?.error
  if (error) {
    console.error('Saving IDP answers failed:', error)
    return { ok: false }
  }
  return { ok: true }
}
