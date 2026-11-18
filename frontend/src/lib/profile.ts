import type { Visa } from '#/data/checklist'
import type { Profile } from '#/data/postdocs'

// The Settings appointment form, checked the same way in the browser and in
// the Server Action that saves it.

/** What the appointment form edits. `visa` is '' until they choose one. */
export type ProfileForm = Omit<Profile, 'visa'> & { visa: Visa | '' }
export type ProfileFormField = keyof ProfileForm
export type ProfileFormErrors = Partial<Record<ProfileFormField, string>>

export const BLANK_PROFILE_FORM: ProfileForm = {
  fullName: '',
  netId: '',
  department: '',
  start: '',
  visa: '',
}

/** The visa choices, in the order the form shows them. */
export const VISA_OPTIONS: { value: Visa; label: string; hint: string }[] = [
  {
    value: 'j1',
    label: 'J-1 scholar',
    hint: 'Shows the OISS and J-1 steps.',
  },
  {
    value: 'f1-opt',
    label: 'F-1 OPT',
    hint: 'Shows the OISS steps. Steps only for J-1 scholars are hidden.',
  },
  {
    value: 'domestic',
    label: 'Neither',
    hint: 'U.S. citizen, permanent resident, or another status that doesn’t need OISS check-in.',
  },
]

/**
 * What Home and the Checklist show to people with no saved profile (guests,
 * and OPA staff trying the postdoc pages), so the pages still have dates.
 */
export const PREVIEW_PROFILE: Pick<Profile, 'start' | 'visa'> = {
  start: '2026-09-01',
  visa: 'j1',
}

const FIELDS = Object.keys(BLANK_PROFILE_FORM) as ProfileFormField[]

export function isVisa(value: unknown): value is Visa {
  return value === 'j1' || value === 'f1-opt' || value === 'domestic'
}

/**
 * A ProfileForm from untrusted input (a Server Action's arguments), with text
 * trimmed and the NetID lowercased. Anything that isn't a string becomes ''.
 */
export function cleanProfileForm(input: unknown): ProfileForm {
  const record =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {}
  const form = {} as Record<ProfileFormField, string>
  for (const key of FIELDS) {
    const value = record[key]
    form[key] = typeof value === 'string' ? value.trim() : ''
  }
  form.netId = form.netId.toLowerCase()
  return form as ProfileForm
}

/** What's wrong with the form, by field. Empty when it can be saved. */
export function validateProfile(form: ProfileForm): ProfileFormErrors {
  const errors: ProfileFormErrors = {}
  if (!form.fullName.trim()) errors.fullName = 'Add your name.'
  else if (form.fullName.trim().length > 200)
    errors.fullName = 'Use 200 characters or fewer.'
  if (!/^[a-z0-9]{0,20}$/i.test(form.netId.trim()))
    errors.netId = 'Use only letters and numbers, like abc123.'
  if (!form.department.trim()) errors.department = 'Add your department.'
  else if (form.department.trim().length > 200)
    errors.department = 'Use 200 characters or fewer.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.start))
    errors.start = 'Choose your start date.'
  if (!isVisa(form.visa)) errors.visa = 'Choose one.'
  return errors
}
