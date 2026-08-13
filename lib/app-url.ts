/**
 * Where this shop is reachable, read at call time from a server-only variable.
 *
 * `NEXT_PUBLIC_*` is substituted into the bundle at build time, so an image
 * built in CI without it freezes `http://localhost:3000` and no amount of
 * setting it on the container helps. The buyer pays and is returned to a dead
 * address. A server-only name read inside a function is evaluated per request,
 * which is what a return URL needs.
 */

/** The configured origin with any trailing slash removed, or null if unset. */
export function appUrlOrNull(): string | null {
  const url = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  return url ? url.replace(/\/$/, '') : null;
}

/**
 * The same value, but throwing when it is missing.
 *
 * Call this **before** the try/catch around a checkout call, never inside it. A
 * missing environment variable is your misconfiguration, not the buyer's
 * declined card, and catching them in the same place turns "APP_URL is not set"
 * into "Could not start checkout" on a customer's screen. That mistake cost a
 * long afternoon on the Next.js starter: checkout looked broken end to end when
 * one variable was blank, and the only sentence naming the real cause had been
 * swallowed by the catch that exists for declined cards.
 *
 * Left as a throw rather than a boot-time check on purpose. `next build` runs
 * on machines that have no environment at all, which is most CI, and failing at
 * import would break the build rather than the request that actually needs the
 * value. See `lib/rekey.ts`, which is lazy for the same reason.
 */
export function appUrl(): string {
  const url = appUrlOrNull();
  if (!url) {
    throw new Error(
      'APP_URL is not set. Checkout needs it to send the buyer back here after paying. Set APP_URL in .env.local, or in the environment wherever this is deployed.',
    );
  }
  return url;
}
