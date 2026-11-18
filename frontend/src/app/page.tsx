import { Home } from '#/components/Home'
import { getCurrentUser, isAdmin } from '#/lib/auth'
import { todayInNewHaven } from '#/lib/dates'
import { upcomingEvents } from '#/lib/supabase/events'

export default async function HomePage() {
  // Reading the session cookie renders this on each request, so "today" isn't
  // the day the site was built. proxy.ts sends signed-out visitors to /login.
  const [user, events, admin] = await Promise.all([
    getCurrentUser(),
    upcomingEvents(3),
    isAdmin(),
  ])
  return (
    <Home
      name={user?.firstName ?? 'Guest'}
      today={todayInNewHaven()}
      events={events}
      isAdmin={admin}
    />
  )
}
