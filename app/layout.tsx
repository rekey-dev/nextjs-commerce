import type { Metadata } from 'next';
import { RekeyProvider } from '@rekey.dev/react';
import { auth } from '@rekey.dev/nextjs/server';
import { SiteHeader } from '@/app/site-header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shelf',
  description: 'A digital shop built on Next.js, SQLite and Rekey.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="min-h-dvh bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-50">
        <RekeyProvider
          publishableKey={process.env.NEXT_PUBLIC_REKEY_PUBLIC_KEY!}
          apiUrl={process.env.NEXT_PUBLIC_REKEY_URL ?? 'https://api.rekey.dev'}
          accessToken={session?.accessToken}
        >
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
        </RekeyProvider>
      </body>
    </html>
  );
}
