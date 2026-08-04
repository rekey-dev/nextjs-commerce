import { rekeyMiddleware } from '@rekey.dev/nextjs/middleware';

/**
 * A cheap first gate: it checks that a session cookie is *present* and sends
 * everyone else to sign-in. It deliberately does not call Rekey, so it costs
 * nothing per request and it cannot tell you whether the token is still valid.
 *
 * That check is the page's job, and the pages still do it. This is the doormat,
 * not the lock. Anything not listed below needs a cookie to reach.
 *
 * Next 16 renamed this file convention from `middleware` to `proxy`. On Next 15
 * rename it back; same export, older name.
 */
export default rekeyMiddleware({
  publicRoutes: ['/', '/sign-in', '/sign-up', /^\/p\//],
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
