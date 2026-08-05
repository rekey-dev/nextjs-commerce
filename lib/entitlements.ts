import { getSession } from './session';
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
  const session = await getSession();
  if (!session) return new Set();

  try {
    const { features } = await rekey().billing.getEntitlements(session.accessToken);

    // Only a genuine grant counts. `features` is a union of BOOL, INT and
    // STRING entitlements, so a plan granting a quota of 0, or the string
    // "false", must not hand over the file. Anything other than a real yes is
    // a no.
    return new Set(
      Object.entries(features)
        .filter(([, v]) => v === true || (typeof v === 'number' && v > 0))
        .map(([k]) => k),
    );
  } catch {
    // A billing outage should not hand out files. Fail closed.
    return new Set();
  }
}
