import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { SiteFooter } from '#/components/SiteFooter'
import { SiteHeader } from '#/components/SiteHeader'
import { getCurrentUser } from '#/lib/auth'

import '../styles.css'

export const metadata: Metadata = {
  title: 'Postdoc Onboarding | Yale University',
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <html lang="en">
      {/* A column the height of the window, so the footer sits at the bottom of short pages */}
      <body className="flex min-h-dvh flex-col">
        <SiteHeader user={user} />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
