'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@rekey.dev/react';
import { signOutAction } from '@/app/actions/auth';

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-medium tracking-tight">
          Shelf
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <SignedIn>
            <Link
              href="/library"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
            >
              Library
            </Link>
            <UserButton signOutAction={signOutAction} manageAccountUrl="/account" />
          </SignedIn>

          <SignedOut>
            <Link
              href="/sign-in"
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Create account
            </Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
