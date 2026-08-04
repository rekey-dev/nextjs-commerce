import { redirect } from 'next/navigation';
import { auth } from '@rekey.dev/nextjs/server';
import { allProducts } from '@/lib/db';
import { ownedKeys } from '@/lib/entitlements';

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect('/sign-in?next=/account');

  const owned = await ownedKeys();
  const mine = allProducts().filter((p) => owned.has(p.entitlementKey));

  return (
    <div className="max-w-xl py-4">
      <h1 className="text-2xl font-medium tracking-tight">Account</h1>

      <dl className="mt-8 divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        <div className="flex justify-between p-4 text-sm">
          <dt className="text-neutral-500">Email</dt>
          <dd>{session.user.email}</dd>
        </div>
        <div className="flex justify-between p-4 text-sm">
          <dt className="text-neutral-500">Email verified</dt>
          <dd>{session.user.emailVerified ? 'Yes' : 'Not yet'}</dd>
        </div>
        <div className="flex justify-between p-4 text-sm">
          <dt className="text-neutral-500">Purchases</dt>
          <dd>{mine.length}</dd>
        </div>
      </dl>

      <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">
        Everything here is sold outright, so there is no subscription to manage.
        For recurring plans and cancellation, see the
        {' '}
        <a href="https://github.com/rekey-dev/nextjs-starter" className="underline">
          auth and billing starter
        </a>
        .
      </p>
    </div>
  );
}
