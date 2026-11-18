import { Home } from '#/components/Home'
import { getCurrentUser, isAdmin } from '#/lib/auth'
import { todayInNewHaven } from '#/lib/dates'
import { upcomingEvents } from '#/lib/supabase/events'
import { loadMyChecklist } from '#/lib/supabase/progress'

export default async function HomePage() {
  // Reading the session cookie renders this on each request, so "today" isn't
  // the day the site was built. proxy.ts sends signed-out visitors to /login,
  // and loadMyChecklist sends postdocs without an appointment to Settings.
  const [user, checklist, events, admin] = await Promise.all([
    getCurrentUser(),
    loadMyChecklist(),
    upcomingEvents(3),
    isAdmin(),
  ])
  return (
    <Home
      name={user?.firstName ?? 'Guest'}
      today={todayInNewHaven()}
      checklist={checklist}
      events={events}
      isAdmin={admin}
    />
  )
}
