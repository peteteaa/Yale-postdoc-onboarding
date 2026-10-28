import type { Metadata } from 'next'

import { EmailLinkForm } from '#/components/EmailLinkForm'
import { safeNextPath } from '#/lib/paths'

export const metadata: Metadata = {
  title: 'Sign in with an email link | Yale University',
}

export default async function EmailLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { next, error } = await searchParams
  return (
    <EmailLinkForm next={safeNextPath(next)} linkFailed={error === 'link'} />
  )
}
