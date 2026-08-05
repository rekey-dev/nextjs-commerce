import Link from 'next/link';
import { notFound } from 'next/navigation';
import { productBySlug } from '@/lib/db';
import { ownedKeys } from '@/lib/entitlements';
import { money } from '@/lib/money';
import { buyAction } from '@/app/actions/buy';

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkout?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { checkout, error } = await searchParams;

  const product = productBySlug(slug);
  if (!product) notFound();

  const owned = (await ownedKeys()).has(product.entitlementKey);

  return (
    <div className="py-4">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        Back to the shop
      </Link>

      <div className="mt-6 h-48 rounded-xl" style={{ backgroundColor: product.accent }} aria-hidden />

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_16rem]">
        <div className="max-w-xl">
          <h1 className="text-2xl font-medium tracking-tight">{product.name}</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">{product.blurb}</p>
          <p className="mt-6 leading-relaxed text-neutral-700 dark:text-neutral-300">
            {product.description}
          </p>
        </div>

        <aside className="h-fit rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          )}

          {checkout === 'canceled' && (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Checkout was canceled. Nothing was charged.
            </p>
          )}

          <p className="text-2xl tabular-nums">{money(product.priceCents, product.currency)}</p>
          <p className="mt-1 text-sm text-neutral-500">One payment. Yours to keep.</p>

          {owned ? (
            <Link
              href="/library"
              className="mt-5 block rounded-md bg-neutral-900 px-4 py-2 text-center text-sm text-white dark:bg-neutral-50 dark:text-neutral-900"
            >
              In your library
            </Link>
          ) : (
            <form action={buyAction} className="mt-5">
              <input type="hidden" name="slug" value={product.slug} />
              <button
                type="submit"
                className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm text-white transition hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Buy
              </button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
