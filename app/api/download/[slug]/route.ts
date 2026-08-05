import { createReadStream, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { productBySlug } from '@/lib/db';
import { ownedKeys } from '@/lib/entitlements';

/**
 * The only route that hands over a file, so it is the only one where getting
 * the check wrong costs money.
 *
 * The entitlement is checked here rather than trusted from the page that
 * rendered the link. A link is a string; anyone can type one.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const product = productBySlug(slug);
  if (!product) return new Response('Not found', { status: 404 });

  const owned = await ownedKeys();
  if (!owned.has(product.entitlementKey)) {
    return new Response('Not yours', { status: 403 });
  }

  // Resolve inside the downloads directory and refuse anything that escapes it,
  // so a bad row in the catalogue cannot turn into an arbitrary file read.
  const root = path.join(process.cwd(), 'downloads');
  const file = path.resolve(root, product.file);
  if (!file.startsWith(root + path.sep)) return new Response('Not found', { status: 404 });

  let size: number;
  try {
    // resolve() compares strings and does not follow links, but the read does.
    // A symlink inside downloads/ pointing at .env would otherwise be served.
    const real = realpathSync(file);
    if (!real.startsWith(root + path.sep)) return new Response('Not found', { status: 404 });
    size = statSync(real).size;
  } catch {
    return new Response('The file is missing from downloads/', { status: 500 });
  }

  const stream = Readable.toWeb(createReadStream(file)) as WebReadableStream<Uint8Array>;
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'content-type': 'application/octet-stream',
      'content-length': String(size),
      // Interpolating a catalogue value straight into a header lets a row like
      // `x.zip"; filename="invoice.exe` rewrite it, and a CR/LF value throws.
      'content-disposition': `attachment; filename="${path
        .basename(product.file)
        .replace(/[^\w.\- ]/g, '_')}"`,
      'cache-control': 'private, no-store',
    },
  });
}
