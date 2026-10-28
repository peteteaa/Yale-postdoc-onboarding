// The Supabase project to sign in with. Set in .env.local locally and in the
// Vercel project's environment variables. The publishable key is safe to send
// to the browser; never put the secret (service_role) key here.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to .env.local (and to the Vercel project's environment variables).`,
    )
  }
  return value
}

// Written out in full so Next.js can inline them at build time.
export const SUPABASE_URL = required(
  'NEXT_PUBLIC_SUPABASE_URL',
  process.env.NEXT_PUBLIC_SUPABASE_URL,
)
export const SUPABASE_KEY = required(
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
)
