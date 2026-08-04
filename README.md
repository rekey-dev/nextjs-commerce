# Shelf: a digital shop on Next.js, SQLite and Rekey

A working storefront. The catalogue is a SQLite file, accounts and payments are
[Rekey](https://rekey.dev), and what a buyer owns is an entitlement rather than
a row somebody has to remember to update.

- Next.js 16 (App Router, Turbopack, React 19)
- SQLite via better-sqlite3, seeded from a JSON file
- Tailwind CSS 4
- `@rekey.dev/nextjs`, `@rekey.dev/react`, `@rekey.dev/node`

## What this is, and what it is not

It sells **digital goods, one at a time**. There is no basket, and that is a
property of the billing model rather than a corner cut: Rekey checkout sells a
plan, so four things in a basket would be four checkouts. For downloads, fonts,
presets, books and licences that is usually the right shape anyway.

If you need a real multi-item basket with one payment, this template is the
wrong starting point today. `app/actions/buy.ts` is the file that would have to
change, and [the tracking issue is here](https://github.com/rekey-dev/rekey/issues/16).

## Getting it running

You need a Rekey Application. Sign up at [rekey.dev](https://rekey.dev), or run
it yourself from [the open source repo](https://github.com/rekey-dev/rekey).

```bash
git clone https://github.com/rekey-dev/nextjs-commerce my-shop
cd my-shop
npm install
cp .env.example .env.local     # fill in from Panel -> Developer -> API keys
npm run seed
npm run dev
```

`npm run seed` creates `shop.db` from `data/products.json` and then prints the
plans you need, like this:

```
grid-icons             49.00 USD  grants  product_grid_icons
field-notes-preset     29.00 USD  grants  product_field_notes
```

Create each one in **Panel → Billing → Plans** with that slug and price, and
give it a feature entitlement with that key. Connect a payment provider under
Billing → Providers. That is the whole setup.

### Environment

| Variable | What it is |
| --- | --- |
| `REKEY_SECRET` | Server-only. Full API access for this Application. Never commit it. |
| `REKEY_URL` | `https://api.rekey.dev`, or your own API if you self-host. |
| `NEXT_PUBLIC_REKEY_PUBLIC_KEY` | Safe in the browser. Identifies the Application. |
| `NEXT_PUBLIC_REKEY_URL` | Same API, the browser-visible copy. |
| `NEXT_PUBLIC_APP_URL` | Where the shop is reachable. Checkout returns the buyer here. |
| `DATABASE_FILE` | Where `shop.db` lives. Anywhere writable. |

## The one idea worth taking

**The catalogue and the ownership record are separate systems, on purpose.**

SQLite holds what a product *is*: name, copy, price, which file it ships. Rekey
holds who *paid*, and answers "does this person own it" as an entitlement.

The temptation is an `orders` table, because it is five minutes of work and it
feels like the shop owns its own data. Then a refund happens, or a chargeback,
or a card expires, and there are two answers to the same question with no rule
about which wins. The shop keeps serving files to somebody who got their money
back, and nothing anywhere looks broken.

So `lib/db.ts` opens the database **read-only**. The app physically cannot write
an ownership fact. `npm run seed` is the only writer.

## What is where

| File | What it does |
| --- | --- |
| `data/products.json` | The catalogue, in the form you edit. |
| `scripts/seed.mts` | Loads it into SQLite. The only thing that writes. |
| `lib/db.ts` | Read-only queries. Opens lazily, which matters at build time. |
| `lib/entitlements.ts` | What the signed-in buyer owns. Fails closed. |
| `app/actions/buy.ts` | One product, one checkout. |
| `app/api/download/[slug]/route.ts` | The only route that hands over a file. |
| `app/library/page.tsx` | What they bought, with download links. |
| `app/actions/auth.ts` | Sign up, sign in, sign out. |
| `proxy.ts` | A cookie-presence gate at the edge. The pages still do the real check. |

## Buying

```ts
const { url } = await rekey().billing.createCheckout(session.accessToken, {
  planSlug: product.planSlug,
  successUrl: `${appUrl}/library?bought=${slug}`,
  cancelUrl: `${appUrl}/p/${slug}?checkout=canceled`,
});
redirect(url);
```

The subscription is `PENDING` until the provider webhook confirms payment, which
is why `/library` says "usually seconds" instead of showing an empty shelf as if
the purchase failed. Rekey handles that webhook; you do not need an endpoint.

## Downloads

The download route checks the entitlement itself rather than trusting the page
that rendered the link, because a link is a string and anyone can type one. It
also resolves the path inside `downloads/` and refuses anything that escapes,
so a bad row in the catalogue cannot become an arbitrary file read.

`lib/entitlements.ts` returns an empty set if the entitlements call fails. A
billing outage should mean nobody can download for a minute, not that everybody
can.

For real files, put them behind signed object-storage URLs rather than streaming
from the app server. The check stays exactly the same; only the last three lines
of the route change.

## Growing out of SQLite

A file is the right call for a starter and the wrong call once somebody who is
not you needs to edit product copy. When that happens, move the catalogue into
a CMS and leave everything else alone: only `lib/db.ts` knows where products
come from, and it is thirty lines.

[Payload](https://payloadcms.com) is the natural fit, and a Rekey plugin for it
is [tracked here](https://github.com/rekey-dev/rekey/issues/13). Until then,
Payload's local API drops into `allProducts()` and `productBySlug()` directly.

## Deploying

The catalogue is a file, so it needs to exist wherever the app runs: run
`npm run seed` as part of the build, or point `DATABASE_FILE` at a mounted
volume. `downloads/` is the same story, and is the first thing you should move
to object storage.

Set `NEXT_PUBLIC_APP_URL` to the real origin and add it to the Application's
allowed origins in the panel.

## Licence

MIT. Take it apart.
