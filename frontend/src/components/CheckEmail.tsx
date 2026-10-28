import { LINK_BUTTON } from '#/components/Form'

/** Shown after we email someone a sign-in link or a confirm-your-account link. */
export function CheckEmail({
  email,
  kind,
  onDifferentEmail,
}: {
  email: string
  kind: 'magic-link' | 'confirm'
  onDifferentEmail: () => void
}) {
  return (
    <>
      <h1 className="mb-2.5 text-signin-title text-yale-blue">
        Check your email
      </h1>
      <p role="status">
        We sent{' '}
        {kind === 'magic-link'
          ? 'a sign-in link'
          : 'a link to confirm your account'}{' '}
        to <strong>{email}</strong>. Open it in this browser to sign in.
      </p>
      <button
        type="button"
        onClick={onDifferentEmail}
        className={`${LINK_BUTTON} mt-4 text-link`}
      >
        Use a different email
      </button>
    </>
  )
}
