/**
 * Where to send someone after they sign in. Only paths on this site are
 * allowed, so a crafted `?next=https://evil.example` link can't redirect
 * people off it.
 */
export function safeNextPath(next: unknown): string {
  if (typeof next !== 'string' || !next.startsWith('/')) return '/'
  // "//host" and "/\host" are treated as other sites by browsers.
  if (next.startsWith('//') || next.startsWith('/\\')) return '/'
  return next
}

/** `path`, carrying `?next=` along when it isn't just the home page. */
export function withNext(path: string, next: string): string {
  return next === '/' ? path : `${path}?next=${encodeURIComponent(next)}`
}
