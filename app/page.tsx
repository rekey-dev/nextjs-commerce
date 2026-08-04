import Link from 'next/link';
import { allProducts } from '@/lib/db';
import { ownedKeys } from '@/lib/entitlements';
import { money } from '@/lib/money';

export default async function StorefrontPage() {
  const products = allProducts();
  const owned = await ownedKeys();

  return (
    <div className="py-4">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Four things worth having.</h1>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">
          A demonstration shop. The catalogue is a SQLite file, accounts and
          payments are Rekey, and what you own is an entitlement rather than a
          row someone forgot to update.
        </p>
      </section>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={`/p/${p.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
          >
            <div className="h-32" style={{ backgroundColor: p.accent }} aria-hidden />
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-medium">{p.name}</h2>
                <span className="shrink-0 text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
                  {owned.has(p.entitlementKey) ? 'Owned' : money(p.priceCents, p.currency)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {p.blurb}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
