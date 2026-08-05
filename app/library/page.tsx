import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { allProducts } from '@/lib/db';
import { ownedKeys } from '@/lib/entitlements';

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ bought?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in?next=/library');

  const { bought } = await searchParams;
  const owned = await ownedKeys();
  const mine = allProducts().filter((p) => owned.has(p.entitlementKey));

  return (
    <div className="py-4">
      <h1 className="text-2xl font-medium tracking-tight">Your library</h1>
      <p className="mt-1 text-neutral-600 dark:text-neutral-400">{session.user.email}</p>

      {bought && !mine.some((p) => p.slug === bought) && (
        <p className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          Payment received. The purchase appears here as soon as the provider
          confirms it, which is usually seconds. Reload if it is not here yet.
        </p>
      )}

      {mine.length > 0 ? (
        <ul className="mt-8 divide-y divide-neutral-200 dark:divide-neutral-800">
          {mine.map((p) => (
            <li key={p.slug} className="flex items-center gap-4 py-4">
              <span
                className="h-10 w-10 shrink-0 rounded-md"
                style={{ backgroundColor: p.accent }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="truncate text-sm text-neutral-600 dark:text-neutral-400">{p.blurb}</p>
              </div>
              <a
                href={`/api/download/${p.slug}`}
                className="shrink-0 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
          <p className="text-neutral-600 dark:text-neutral-400">Nothing here yet.</p>
          <Link href="/" className="mt-2 inline-block text-sm underline">
            Have a look at the shop
          </Link>
        </div>
      )}
    </div>
  );
}
