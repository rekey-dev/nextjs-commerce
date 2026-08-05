import Database from 'better-sqlite3';
import path from 'node:path';

/**
 * The catalogue lives in SQLite so this repo runs with no setup: clone, seed,
 * go. That is the right trade for a starter and the wrong one for a shop with
 * a merchandising team, which is what the README says about moving it to a CMS
 * later.
 *
 * What is deliberately *not* in here: anything about who paid. Ownership is an
 * entitlement, read from Rekey. Two sources of truth for "has this person paid"
 * is how people end up shipping a shop that gives away files after a refund.
 */

const file = process.env.DATABASE_FILE ?? path.join(process.cwd(), 'shop.db');

declare global {
  var __shopDb: Database.Database | undefined;
}

/**
 * Opened on first query, not at import.
 *
 * A connection opened at module scope is opened by every one of Next's build
 * workers at once, and the first `PRAGMA` they race on fails with SQLITE_BUSY.
 * Opening lazily also means a build that never reads the catalogue does not
 * need the file to exist.
 *
 * Read-only, because the app has no business writing the catalogue. `npm run
 * seed` is the only writer.
 */
function conn(): Database.Database {
  if (globalThis.__shopDb) return globalThis.__shopDb;
  try {
    const db = new Database(file, { readonly: true, fileMustExist: true });
    globalThis.__shopDb = db;
    return db;
  } catch (err) {
    // Keep the underlying message. "Run seed" is the right advice when the file
    // is missing and useless advice when it exists but the directory is
    // read-only, and those two produce very different SQLite errors.
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not open the catalogue at ${file}: ${reason}. If it does not exist, run \`npm run seed\`.`,
    );
  }
}

export interface Product {
  slug: string;
  name: string;
  blurb: string;
  description: string;
  priceCents: number;
  currency: string;
  /** The Rekey plan this product is sold as. */
  planSlug: string;
  /** The entitlement a purchase grants. Owning the product means having this. */
  entitlementKey: string;
  file: string;
  accent: string;
}

export function allProducts(): Product[] {
  return conn().prepare('SELECT * FROM products ORDER BY rowid').all() as Product[];
}

export function productBySlug(slug: string): Product | undefined {
  return conn().prepare('SELECT * FROM products WHERE slug = ?').get(slug) as Product | undefined;
}
