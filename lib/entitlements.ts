import { auth } from '@rekey.dev/nextjs/server';
import { rekey } from './rekey';

/**
 * What the signed-in buyer owns.
 *
 * Ownership is an entitlement resolved by Rekey from their purchases, which is
 * why nothing about payment is stored in SQLite. One source of truth for "has
 * this person paid", and it is the one that also knows about refunds and
 * chargebacks.
 */
export async function ownedKeys(): Promise<Set<string>> {
  const session = await auth();
  if (!session) return new Set();

  try {
    const { features } = await rekey().billing.getEntitlements(session.accessToken);
    return new Set(Object.entries(features).filter(([, v]) => v !== false).map(([k]) => k));
  } catch {
    // A billing outage should not hand out files. Fail closed.
    return new Set();
  }
}
