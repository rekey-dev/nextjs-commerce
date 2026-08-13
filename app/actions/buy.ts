'use server';

import { redirect } from 'next/navigation';
import { RekeyError } from '@rekey.dev/node';
import { auth } from '@rekey.dev/nextjs/server';
import { rekey } from '@/lib/rekey';
import { appUrl } from '@/lib/app-url';
import { productBySlug } from '@/lib/db';

/**
 * One product, one checkout.
 *
 * There is no cart, and that is a property of the billing model rather than an
 * omission: Rekey checkout sells a plan, so a basket of four things would be
 * four checkouts. For a digital shop that is usually fine. If you need a real
 * basket, this is the file that would have to change.
 *
 * Three shapes of failure, kept apart deliberately:
 *
 * **Configuration.** `appUrl()` is resolved BEFORE the try, so a missing
 * `APP_URL` escapes as a real error naming the real cause. Inside the try it
 * was caught alongside declined cards and rendered to the buyer as "Could not
 * start checkout", which is an operator's misconfiguration reported as a
 * payment failure. Read the note in `lib/app-url.ts`; that ordering is the
 * whole point of the file.
 *
 * **Checkout.** A missing provider, a plan that was never created for this
 * product and a declined card all arrive as a `RekeyError`. Those are worth
 * catching: the API's own message beats a 500 for you and a blank page for the
 * buyer.
 *
 * **Success.** `redirect()` works by throwing, so it stays outside the try.
 * Wrapping both would catch the redirect and report a working checkout as a
 * failure.
 */
export async function buyAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '');
  const product = productBySlug(slug);
  if (!product) redirect('/');

  const session = await auth();
  if (!session) {
    redirect(`/sign-in?next=${encodeURIComponent(`/p/${slug}`)}`);
  }

  // Before the try. See the note above.
  const origin = appUrl();

  let destination: string;
  try {
    const { url } = await rekey().billing.createCheckout(session.accessToken, {
      planSlug: product.planSlug,
      successUrl: `${origin}/library?bought=${slug}`,
      cancelUrl: `${origin}/p/${slug}?checkout=canceled`,
    });
    destination = url;
  } catch (err) {
    // A missing provider, a plan that was never created for this product, and
    // a declined card all arrive here with different messages. Showing the
    // API's own beats a 500 for you and a blank page for the buyer.
    const message =
      err instanceof RekeyError ? err.message : 'Could not start checkout.';
    destination = `/p/${slug}?error=${encodeURIComponent(message)}`;
  }

  redirect(destination);
}
