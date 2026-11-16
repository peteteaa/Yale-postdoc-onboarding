'use server'

import type { Answer, AnswerPrompt, PickPrompt } from '#/data/workbook'
import {
  MAX_CELL_LENGTH,
  MAX_OWN_OPTION_LENGTH,
  MAX_PICKS,
  MAX_TEXT_LENGTH,
  MODULES,
  sectionPrompts,
} from '#/data/workbook'
import { createClient } from '#/lib/supabase/server'

/** `value` as an answer to `prompt`, or null if it isn't a valid one. */
function cleanAnswer(prompt: AnswerPrompt, value: unknown): Answer | null {
  switch (prompt.kind) {
    case 'table':
      return Array.isArray(value) &&
        value.length === prompt.rows * prompt.columns.length &&
        value.every(
          (cell) => typeof cell === 'string' && cell.length <= MAX_CELL_LENGTH,
        )
        ? (value as string[])
        : null
    case 'text':
      return typeof value === 'string' && value.length <= MAX_TEXT_LENGTH
        ? value
        : null
    case 'date':
      // YYYY-MM-DD, or '' to clear it.
      return typeof value === 'string' &&
        (value === '' ||
          (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
            !Number.isNaN(Date.parse(value))))
        ? value
        : null
    case 'choice':
      // '' clears it.
      return typeof value === 'string' &&
        (value === '' || prompt.options.includes(value))
        ? value
        : null
    case 'pick':
      return cleanPicks(prompt, value)
  }
}

function cleanPicks(prompt: PickPrompt, value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > (prompt.max ?? MAX_PICKS)) {
    return null
  }
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

/** Blank text, nothing picked, or a table with only blank cells. */
const isEmpty = (answer: Answer) =>
  typeof answer === 'string'
    ? answer.trim() === ''
    : answer.every((item) => item.trim() === '')

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
  const prompts = sectionPrompts(section)
  for (const [promptId, value] of Object.entries(answers)) {
    const prompt = prompts.find((p) => p.id === promptId)
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
