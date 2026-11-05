'use client'

import { FilterButtons } from '#/components/FilterButtons'
import { INPUT, LINK_BUTTON } from '#/components/Form'
import type { Resource, ResourceTopic } from '#/data/resources'
import { RESOURCE_TOPICS } from '#/data/resources'
import Link from 'next/link'
import { useState } from 'react'

type TopicFilter = ResourceTopic | 'all'

const TOPIC_OPTIONS: { value: TopicFilter; label: string }[] = [
  { value: 'all', label: 'All topics' },
  ...RESOURCE_TOPICS.map((topic) => ({ value: topic.id, label: topic.label })),
]

function matches(resource: Resource, search: string, topic: TopicFilter) {
  if (topic !== 'all' && resource.topic !== topic) return false
  if (!search) return true
  return [resource.name, resource.description, resource.host]
    .join(' ')
    .toLowerCase()
    .includes(search)
}

/** The postdoc Resources page: a searchable list of links from the workbook. */
export function Resources({
  resources,
  loadError,
  isAdmin,
}: {
  resources: Resource[]
  /** Set when the resources couldn't be loaded. */
  loadError: boolean
  /** Shows a link to the staff editing page. */
  isAdmin: boolean
}) {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<TopicFilter>('all')
  const search = query.trim().toLowerCase()
  const shown = resources.filter((r) => matches(r, search, topic))
  const sections = RESOURCE_TOPICS.map((t) => ({
    ...t,
    items: shown.filter((r) => r.topic === t.id),
  })).filter((section) => section.items.length > 0)

  const clear = () => {
    setQuery('')
    setTopic('all')
  }

  return (
    <main className="mx-auto max-w-page px-4 pt-6 pb-12 md:px-10 md:pt-10 md:pb-18">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-195">
          <h1 className="mb-2.5 text-h1 text-yale-blue">Resources</h1>
          <p className="max-w-[65ch] text-lede text-pretty text-ink-2">
            Offices, programs, and tools from the OPA workbook, in one place.
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/resources"
            className="font-semibold text-link underline underline-offset-3"
          >
            Edit resources
          </Link>
        )}
      </div>

      {loadError ? (
        <p role="alert" className="rounded bg-wash px-4 py-3">
          Resources couldn’t be loaded right now. Try again in a few minutes.
        </p>
      ) : (
        <>
          <div className="mb-7 grid gap-3.5">
            <div className="grid max-w-130 gap-1.5">
              <label htmlFor="resource-search" className="font-semibold">
                Search resources
              </label>
              <input
                id="resource-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try “writing” or “gym”"
                className={INPUT}
              />
            </div>
            <FilterButtons
              label="Filter by topic"
              options={TOPIC_OPTIONS}
              value={topic}
              onChange={setTopic}
            />
          </div>

          <div role="status" className="sr-only">
            {search || topic !== 'all'
              ? `${shown.length} ${shown.length === 1 ? 'resource' : 'resources'} shown`
              : ''}
          </div>

          {sections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`topic-${section.id}`}
              className="mb-7.5"
            >
              <h2
                id={`topic-${section.id}`}
                className="border-b-2 border-ink pb-2 text-h2"
              >
                {section.label}
              </h2>
              <ul className="grid grid-cols-1 gap-x-9 md:grid-cols-2">
                {section.items.map((resource) => (
                  <li key={resource.id} className="border-b border-line py-3.5">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-large font-semibold text-link underline-offset-3 hover:underline"
                    >
                      {resource.name}
                      <span aria-hidden="true"> ↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    {resource.description && (
                      <p className="mt-0.5 text-small text-ink-2">
                        {resource.description}
                      </p>
                    )}
                    {resource.host && (
                      <p className="mt-0.5 text-caption text-ink-2">
                        {resource.host}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {sections.length === 0 &&
            (resources.length === 0 ? (
              <p className="rounded bg-wash px-4 py-3">No resources yet.</p>
            ) : (
              <p className="rounded bg-wash px-4 py-3">
                No resources match
                {search ? ` “${query.trim()}”` : ' that topic'}. Try another
                word, or{' '}
                <button
                  type="button"
                  onClick={clear}
                  className={`${LINK_BUTTON} text-link`}
                >
                  show all resources
                </button>
                .
              </p>
            ))}
        </>
      )}
    </main>
  )
}
