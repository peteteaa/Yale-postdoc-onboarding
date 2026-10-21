import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

// TODO: build the Home page from the mockup
function Home() {
  return (
    <main className="mx-auto max-w-page px-4 py-6 md:px-10 md:py-10">
      <h1 className="text-h1 text-yale-blue">Postdoc Onboarding</h1>
      <p className="mt-2.5 max-w-[65ch] text-lede text-ink-2">
        Your first year at Yale, in one place.
      </p>
    </main>
  )
}
