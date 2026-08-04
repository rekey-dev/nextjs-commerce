'use server';

import { redirect } from 'next/navigation';
import { auth } from '@rekey.dev/nextjs/server';
import { rekey } from '@/lib/rekey';
import { productBySlug } from '@/lib/db';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * One product, one checkout.
 *
 * There is no cart, and that is a property of the billing model rather than an
 * omission: Rekey checkout sells a plan, so a basket of four things would be
 * four checkouts. For a digital shop that is usually fine. If you need a real
 * basket, this is the file that would have to change.
 */
export async function buyAction(formData: FormData) {
  const slug = String(formData.get('slug') ?? '');
  const product = productBySlug(slug);
  if (!product) redirect('/');

  const session = await auth();
  if (!session) {
    redirect(`/sign-in?next=${encodeURIComponent(`/p/${slug}`)}`);
  }

  const { url } = await rekey().billing.createCheckout(session.accessToken, {
    planSlug: product.planSlug,
    successUrl: `${appUrl}/library?bought=${slug}`,
    cancelUrl: `${appUrl}/p/${slug}?checkout=canceled`,
  });

  redirect(url);
}
