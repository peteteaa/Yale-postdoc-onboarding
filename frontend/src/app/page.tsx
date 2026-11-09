import { Home } from '#/components/Home'
import { getCurrentUser } from '#/lib/auth'
import { todayInNewHaven } from '#/lib/dates'

export default async function HomePage() {
  // Reading the session cookie renders this on each request, so "today" isn't
  // the day the site was built. proxy.ts sends signed-out visitors to /login.
  const user = await getCurrentUser()
  return <Home name={user?.firstName ?? 'Guest'} today={todayInNewHaven()} />
}
