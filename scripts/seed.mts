/**
 * Creates the table and loads data/products.json into it.
 *
 * Run it with `npm run seed`. It is idempotent, so editing the JSON and
 * running it again is the intended way to change the catalogue.
 */
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const file = process.env.DATABASE_FILE ?? path.join(process.cwd(), 'shop.db');
const db = new Database(file);

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    slug           TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    blurb          TEXT NOT NULL,
    description    TEXT NOT NULL,
    priceCents     INTEGER NOT NULL,
    currency       TEXT NOT NULL,
    planSlug       TEXT NOT NULL,
    entitlementKey TEXT NOT NULL,
    file           TEXT NOT NULL,
    accent         TEXT NOT NULL
  );
`);

const products = JSON.parse(
  readFileSync(path.join(process.cwd(), 'data', 'products.json'), 'utf8'),
);

const upsert = db.prepare(`
  INSERT INTO products (slug, name, blurb, description, priceCents, currency, planSlug, entitlementKey, file, accent)
  VALUES (@slug, @name, @blurb, @description, @priceCents, @currency, @planSlug, @entitlementKey, @file, @accent)
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name,
    blurb = excluded.blurb,
    description = excluded.description,
    priceCents = excluded.priceCents,
    currency = excluded.currency,
    planSlug = excluded.planSlug,
    entitlementKey = excluded.entitlementKey,
    file = excluded.file,
    accent = excluded.accent;
`);

db.transaction(() => products.forEach((p: Record<string, unknown>) => upsert.run(p)))();

// Leave the catalogue in DELETE mode and close cleanly. WAL buys a single
// short-lived writer nothing, and it costs something real: a WAL database
// cannot be opened read-only on a read-only filesystem, which is exactly what
// happens when you seed at build time and run the container immutably. It also
// leaves -wal/-shm siblings that get copied into images half-written.
db.pragma('journal_mode = DELETE');
db.close();

console.log(`Seeded ${products.length} products into ${file}`);
console.log('Each one needs a matching plan in Rekey. Panel -> Billing -> Plans:');
for (const p of products) {
  console.log(`  ${p.planSlug.padEnd(22)} ${(p.priceCents / 100).toFixed(2)} ${p.currency}  grants  ${p.entitlementKey}`);
}
