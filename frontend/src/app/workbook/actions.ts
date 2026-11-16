'use server'

import type { Answer, PickPrompt, Prompt } from '#/data/workbook'
import {
  MAX_OWN_OPTION_LENGTH,
  MAX_TEXT_LENGTH,
  MODULES,
} from '#/data/workbook'
import { createClient } from '#/lib/supabase/server'

/** `value` as an answer to `prompt`, or null if it isn't a valid one. */
function cleanAnswer(prompt: Prompt, value: unknown): Answer | null {
  if (prompt.kind === 'text') {
    return typeof value === 'string' && value.length <= MAX_TEXT_LENGTH
      ? value
      : null
  }
  return cleanPicks(prompt, value)
}

function cleanPicks(prompt: PickPrompt, value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > prompt.max) return null
  const picks: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') return null
    const pick = item.trim()
    const own = !prompt.options.includes(pick)
    if (
      !pick ||
      picks.includes(pick) ||
      (own && (!prompt.allowOwn || pick.length > MAX_OWN_OPTION_LENGTH))
    ) {
      return null
    }
    picks.push(pick)
  }
  return picks
}

const isEmpty = (answer: Answer) =>
  typeof answer === 'string' ? answer.trim() === '' : answer.length === 0

/**
 * Saves the signed-in person's answers to some of one section's prompts, by
 * prompt id. Empty answers are removed.
 */
export async function saveAnswers(
  sectionId: string,
  answers: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  const section = MODULES.flatMap((module) => module.sections).find(
    (s) => s.id === sectionId,
  )
  if (!section || typeof answers !== 'object' || answers === null) {
    return { ok: false }
  }

  const toSave: { prompt_id: string; answer: Answer }[] = []
  const toRemove: string[] = []
  for (const [promptId, value] of Object.entries(answers)) {
    const prompt = section.prompts.find((p) => p.id === promptId)
    const answer = prompt ? cleanAnswer(prompt, value) : null
    if (answer === null) return { ok: false }
    if (isEmpty(answer)) toRemove.push(promptId)
    else toSave.push({ prompt_id: promptId, answer })
  }

  const supabase = await createClient()
  // Check here too, not just in proxy.ts: Server Actions can be called directly.
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) return { ok: false }

  const [saved, removed] = await Promise.all([
    toSave.length > 0
      ? supabase.from('workbook_answers').upsert(
          toSave.map((row) => ({
            user_id: userId,
            section_id: sectionId,
            ...row,
          })),
        )
      : null,
    toRemove.length > 0
      ? supabase
          .from('workbook_answers')
          .delete()
          .eq('user_id', userId)
          .eq('section_id', sectionId)
          .in('prompt_id', toRemove)
      : null,
  ])
  const error = saved?.error ?? removed?.error
  if (error) {
    console.error('Saving workbook answers failed:', error)
    return { ok: false }
  }
  return { ok: true }
}
