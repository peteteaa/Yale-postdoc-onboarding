'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'

import { saveProfile } from '#/app/settings/profile-actions'
import { BUSY, Field, INPUT, PRIMARY_BUTTON } from '#/components/Form'
import {
  VISA_OPTIONS,
  validateProfile,
  type ProfileForm as ProfileFormValues,
  type ProfileFormErrors,
  type ProfileFormField,
} from '#/lib/profile'

/** Settings → Your appointment. */
export function ProfileForm({
  initial,
  setup,
}: {
  initial: ProfileFormValues
  setup: boolean
}) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<ProfileFormErrors>({})
  // Set after a save, cleared when they edit a field.
  const [saved, setSaved] = useState(false)
  // A problem that isn't about one field, like Supabase being down.
  const [message, setMessage] = useState<string | null>(null)
  // The save is on its way to Supabase.
  const [saving, startSaving] = useTransition()

  /** Shows the errors and focuses the first. Returns whether there were any. */
  const showErrors = (found: ProfileFormErrors) => {
    setErrors(found)
    const firstError = Object.keys(found)[0]
    if (firstError) document.getElementById(`profile-${firstError}`)?.focus()
    return Boolean(firstError)
  }

  const setField = (key: ProfileFormField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaved(false)
    setMessage(null)
    if (showErrors(validateProfile(form))) return
    startSaving(async () => {
      const result = await saveProfile(form)
      if (!result.ok) {
        if (result.errors) showErrors(result.errors)
        setMessage(result.message ?? null)
        return
      }
      if (setup) router.push('/')
      else setSaved(true)
    })
  }

  const field = (key: ProfileFormField) => ({
    id: `profile-${key}`,
    error: errors[key],
  })

  return (
    <form onSubmit={submit} noValidate>
      {message && (
        <p role="alert" className="mb-4.5 font-semibold text-late">
          {message}
        </p>
      )}
      <Field {...field('fullName')} label="Full name">
        {(props) => (
          <input
            {...props}
            name="fullName"
            type="text"
            autoComplete="name"
            value={form.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
            className={INPUT}
          />
        )}
      </Field>
      <Field
        {...field('netId')}
        label="NetID"
        hint="Leave this blank if you don’t have one yet."
      >
        {(props) => (
          <input
            {...props}
            name="netId"
            type="text"
            autoCapitalize="off"
            spellCheck={false}
            value={form.netId}
            onChange={(e) => setField('netId', e.target.value)}
            className={INPUT}
          />
        )}
      </Field>
      <Field
        {...field('department')}
        label="Department"
        hint="For example, Chemistry or Internal Medicine."
      >
        {(props) => (
          <input
            {...props}
            name="department"
            type="text"
            value={form.department}
            onChange={(e) => setField('department', e.target.value)}
            className={INPUT}
          />
        )}
      </Field>
      <Field
        {...field('start')}
        label="Start date"
        hint="Your appointment start date. Checklist due dates count from it."
      >
        {(props) => (
          <input
            {...props}
            name="start"
            type="date"
            value={form.start}
            onChange={(e) => setField('start', e.target.value)}
            className={INPUT}
          />
        )}
      </Field>
      <fieldset
        aria-describedby={errors.visa ? 'profile-visa-error' : undefined}
        className="mb-4.5 grid grid-cols-1 gap-1.5"
      >
        <legend className="mb-1.5 font-semibold">Visa status</legend>
        {VISA_OPTIONS.map((option, i) => (
          <label key={option.value} className="flex items-start gap-2.5 py-1">
            <input
              id={i === 0 ? 'profile-visa' : undefined}
              type="radio"
              name="visa"
              value={option.value}
              checked={form.visa === option.value}
              onChange={() => setField('visa', option.value)}
              className="mt-1.5"
            />
            <span>
              <span className="font-semibold">{option.label}</span>
              <span className="block text-small text-ink-2">{option.hint}</span>
            </span>
          </label>
        ))}
        {errors.visa && (
          <p
            id="profile-visa-error"
            className="text-small font-semibold text-late"
          >
            {errors.visa}
          </p>
        )}
      </fieldset>
      {saved && (
        <p role="status" className="mb-4.5 rounded bg-tint px-3.5 py-3">
          Saved.
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className={`${PRIMARY_BUTTON} ${BUSY}`}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
