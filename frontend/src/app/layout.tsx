import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { SiteHeader } from '#/components/SiteHeader'

import '../styles.css'

export const metadata: Metadata = {
  title: 'Postdoc Onboarding | Yale University',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  )
}
