'use server';

import { redirect } from 'next/navigation';
import { RekeyError } from '@rekey.dev/node';
import { auth } from '@rekey.dev/nextjs/server';
import { rekey } from '@/lib/rekey';
import { productBySlug } from '@/lib/db';

/**
 * Read at call time, from a server-only variable.
 *
 * `NEXT_PUBLIC_*` is substituted into the bundle at build time, so an image
 * built in CI without it freezes `http://localhost:3000` and no amount of
 * setting it on the container helps. The buyer pays and is returned to a dead
 * address. A server-only name read inside the function is evaluated per
 * request, which is what a return URL needs.
 */
function appUrl(): string {
  const url = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    throw new Error('APP_URL is not set. Checkout needs it to send the buyer back here.');
  }
  return url.replace(/\/$/, '');
}

/**
 * One product, one checkout.
 *
 * There is no cart, and that is a property of the billing model rather than an
 * omission: Rekey checkout sells a plan, so a basket of four things would be
 * four checkouts. For a digital shop that is usually fine. If you need a real
 * basket, this is the file that would have to change.
 *
 * `redirect()` throws, so it stays outside the try. Wrapping both would catch
 * the redirect and report a successful checkout as a failure.
 */
export async function buyAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '');
  const product = productBySlug(slug);
  if (!product) redirect('/');

  const session = await auth();
  if (!session) {
    redirect(`/sign-in?next=${encodeURIComponent(`/p/${slug}`)}`);
  }

  let destination: string;
  try {
    const { url } = await rekey().billing.createCheckout(session.accessToken, {
      planSlug: product.planSlug,
      successUrl: `${appUrl()}/library?bought=${slug}`,
      cancelUrl: `${appUrl()}/p/${slug}?checkout=canceled`,
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
