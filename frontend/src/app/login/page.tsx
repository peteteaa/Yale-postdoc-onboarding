import type { Metadata } from 'next'

import { LoginForm } from '#/components/LoginForm'
import { safeNextPath } from '#/lib/paths'

export const metadata: Metadata = {
  title: 'Sign in | Yale University',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { next } = await searchParams
  return <LoginForm next={safeNextPath(next)} />
}
