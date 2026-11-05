'use client'

import { deleteResource, saveResource } from '#/app/admin/resources/actions'
import {
  BUSY,
  Field,
  GHOST_BUTTON,
  INPUT,
  LINK_BUTTON,
  PRIMARY_BUTTON,
} from '#/components/Form'
import type { Resource, ResourceTopic } from '#/data/resources'
import { RESOURCE_TOPICS } from '#/data/resources'
import type {
  ResourceErrors,
  ResourceField,
  ResourceInput,
} from '#/lib/resource-form'
import {
  BLANK_RESOURCE,
  cleanResource,
  validateResource,
} from '#/lib/resource-form'
import { useRef, useState, useTransition } from 'react'
import type { FormEvent } from 'react'

const CELL = 'px-3.5 py-3 text-left align-top'
const HEADER = `${CELL} border-b border-line bg-wash text-label-sm font-semibold tracking-label text-ink-2 uppercase`

const topicLabel = (id: ResourceTopic) =>
  RESOURCE_TOPICS.find((topic) => topic.id === id)?.label ?? id

/**
 * Staff → Resources: add, change, and remove the links on the postdoc
 * Resources page. Changes save to Supabase and show up there right away.
 */
export function ResourcesEditor({ resources }: { resources: Resource[] }) {
  const [topicFilter, setTopicFilter] = useState<ResourceTopic | 'all'>('all')
  const [form, setForm] = useState<ResourceInput>(BLANK_RESOURCE)
  const [errors, setErrors] = useState<ResourceErrors>({})
  const [formMessage, setFormMessage] = useState('')
  // The resource being edited, or null when the form adds a new one.
  const [editingId, setEditingId] = useState<number | null>(null)
  // The resource whose removal is waiting for confirmation.
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  // Result of the last action, read out by screen readers.
  const [notice, setNotice] = useState('')
  const [saving, startSaving] = useTransition()
  const [removing, startRemoving] = useTransition()
  const nameRef = useRef<HTMLInputElement>(null)

  const shown =
    topicFilter === 'all'
      ? resources
      : resources.filter((r) => r.topic === topicFilter)

  const startForm = (values: ResourceInput, id: number | null) => {
    setForm(values)
    setErrors({})
    setFormMessage('')
    setEditingId(id)
    nameRef.current?.focus()
  }

  const edit = ({ id, topic, name, url, host, description }: Resource) =>
    startForm({ topic, name, url, host, description }, id)

  const remove = (resource: Resource) =>
    startRemoving(async () => {
      const result = await deleteResource(resource.id)
      setConfirmingId(null)
      if (!result.ok) {
        setNotice(result.message)
        return
      }
      if (editingId === resource.id) startForm(BLANK_RESOURCE, null)
      setNotice(`Removed “${resource.name}.” Postdocs no longer see it.`)
    })

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const values = cleanResource(form)
    const found = validateResource(values)
    setErrors(found)
    setFormMessage('')
    const firstError = Object.keys(found)[0]
    if (firstError) {
      document.getElementById(`resource-${firstError}`)?.focus()
      return
    }
    startSaving(async () => {
      const result = await saveResource(editingId, values)
      if (!result.ok) {
        setErrors(result.errors ?? {})
        setFormMessage(result.message ?? '')
        return
      }
      setNotice(
        editingId === null
          ? `Added “${result.resource.name}” to ${topicLabel(result.resource.topic)}. Postdocs can see it now.`
          : `Saved “${result.resource.name}.”`,
      )
      setForm(BLANK_RESOURCE)
      setEditingId(null)
    })
  }

  const field = (key: ResourceField) => ({
    id: `resource-${key}`,
    error: errors[key],
  })
  const setField = (key: ResourceField, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-180">
          <h1 className="mb-2.5 text-h1 text-yale-blue">Resources</h1>
          <p className="max-w-[65ch] text-lede text-ink-2">
            The links on the postdoc Resources page. Changes show up there right
            away.
          </p>
        </div>
        <button
          type="button"
          className={PRIMARY_BUTTON}
          onClick={() => startForm(BLANK_RESOURCE, null)}
        >
          New resource
        </button>
      </div>

      <div role="status">
        {notice && (
          <p className="mb-5 rounded bg-tint px-4 py-3 text-small text-tint-ink">
            {notice}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div>
          <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
            <label htmlFor="resource-filter" className="font-semibold">
              Show
            </label>
            <select
              id="resource-filter"
              value={topicFilter}
              onChange={(e) =>
                setTopicFilter(e.target.value as ResourceTopic | 'all')
              }
              className={`${INPUT} w-auto`}
            >
              <option value="all">All topics ({resources.length})</option>
              {RESOURCE_TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.label} (
                  {resources.filter((r) => r.topic === topic.id).length})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded border border-card-line">
            <table className="w-full border-collapse text-small">
              <caption className="sr-only">Resources</caption>
              <thead>
                <tr>
                  <th scope="col" className={HEADER}>
                    Resource
                  </th>
                  <th scope="col" className={HEADER}>
                    Topic
                  </th>
                  <th scope="col" className={HEADER}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={3} className={CELL}>
                      No resources yet.
                    </td>
                  </tr>
                )}
                {shown.map((resource) =>
                  resource.id === confirmingId ? (
                    <tr
                      key={resource.id}
                      className="border-b border-line bg-wash last:border-b-0"
                    >
                      <td colSpan={3} className={CELL}>
                        <div
                          role="alert"
                          className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5"
                        >
                          <span>
                            Remove “{resource.name}”? Postdocs stop seeing it
                            right away.
                          </span>
                          <button
                            type="button"
                            disabled={removing}
                            onClick={() => remove(resource)}
                            className={`inline-flex min-h-9 cursor-pointer items-center rounded border-[1.5px] border-late bg-late px-3 py-1.5 text-small font-semibold text-paper ${BUSY}`}
                          >
                            {removing ? 'Removing…' : 'Remove resource'}
                          </button>
                          <button
                            type="button"
                            autoFocus
                            disabled={removing}
                            onClick={() => setConfirmingId(null)}
                            className="inline-flex min-h-9 cursor-pointer items-center rounded border-[1.5px] border-yale-blue bg-paper px-3 py-1.5 text-small font-semibold text-yale-blue hover:bg-tint"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={resource.id}
                      className="border-b border-line last:border-b-0 hover:bg-wash"
                    >
                      <th scope="row" className={`${CELL} min-w-50`}>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-link"
                        >
                          {resource.name}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                        {resource.host && (
                          <span className="block text-micro font-normal text-ink-2">
                            {resource.host}
                          </span>
                        )}
                      </th>
                      <td className={CELL}>{topicLabel(resource.topic)}</td>
                      <td className={`${CELL} whitespace-nowrap`}>
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => edit(resource)}
                            className={`${LINK_BUTTON} text-link`}
                          >
                            Edit
                            <span className="sr-only"> {resource.name}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(resource.id)}
                            className={`${LINK_BUTTON} text-late`}
                          >
                            Remove
                            <span className="sr-only"> {resource.name}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>

        <section
          aria-labelledby="resource-form-heading"
          className="rounded border border-card-line bg-paper p-4.5 shadow-card md:p-6"
        >
          <h2 id="resource-form-heading" className="mb-4 text-h3">
            {editingId === null ? 'New resource' : 'Edit resource'}
          </h2>
          <form noValidate onSubmit={submit}>
            <Field label="Name" {...field('name')}>
              {(props) => (
                <input
                  {...props}
                  ref={nameRef}
                  type="text"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className={INPUT}
                />
              )}
            </Field>
            <Field label="Link" {...field('url')}>
              {(props) => (
                <input
                  {...props}
                  type="url"
                  placeholder="https://"
                  value={form.url}
                  onChange={(e) => setField('url', e.target.value)}
                  className={INPUT}
                />
              )}
            </Field>
            <Field label="Topic" {...field('topic')}>
              {(props) => (
                <select
                  {...props}
                  value={form.topic}
                  onChange={(e) => setField('topic', e.target.value)}
                  className={INPUT}
                >
                  <option value="">Choose one</option>
                  {RESOURCE_TOPICS.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field
              label="Run by"
              hint="Optional. The office or group, e.g. “Office of Career Strategy.”"
              {...field('host')}
            >
              {(props) => (
                <input
                  {...props}
                  type="text"
                  value={form.host}
                  onChange={(e) => setField('host', e.target.value)}
                  className={INPUT}
                />
              )}
            </Field>
            <Field
              label="Description"
              hint="Optional. One or two sentences on what it’s for."
              {...field('description')}
            >
              {(props) => (
                <textarea
                  {...props}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className={`${INPUT} block min-h-21 resize-y`}
                />
              )}
            </Field>
            {formMessage && (
              <p
                role="alert"
                className="mb-4 text-small font-semibold text-late"
              >
                {formMessage}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
              <button
                type="submit"
                disabled={saving}
                className={`${PRIMARY_BUTTON} ${BUSY}`}
              >
                {saving
                  ? 'Saving…'
                  : editingId === null
                    ? 'Add resource'
                    : 'Save changes'}
              </button>
              {editingId !== null && (
                <button
                  type="button"
                  onClick={() => startForm(BLANK_RESOURCE, null)}
                  className={GHOST_BUTTON}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </>
  )
}
