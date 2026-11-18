import Link from 'next/link'
import type { ReactNode } from 'react'

import { AdminShell } from '#/components/Admin'
import { isAdmin } from '#/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  // proxy.ts has already sent signed-out visitors to /login. This only decides
  // what to show: row-level security and the Server Actions guard the data.
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto max-w-page px-4 pt-6 pb-12 md:px-10 md:pt-10 md:pb-18">
        <h1 className="mb-2.5 text-h1 text-yale-blue">OPA staff only</h1>
        <p className="mb-4 max-w-[65ch] text-lede text-ink-2">
          These pages are for Office of Postdoctoral Affairs staff. If you’re on
          staff, ask an admin to give your account access.
        </p>
        <Link href="/" className="font-semibold">
          Go to Home
        </Link>
      </main>
    )
  }

  return <AdminShell>{children}</AdminShell>
}
