// AI product naming: sends each unnamed product's cover image to the Kimi
// vision model (kimi-k3) and fills in a short name plus 1-2 categories.
//
// Usage:
//   node scripts/suggest-names.js --propose-categories [--sample 40]
//       Samples unnamed products, asks Kimi for a free-form category per item,
//       and prints an aggregated taxonomy proposal. Writes nothing.
//   node scripts/suggest-names.js --dry-run [--limit 5]
//       Prints name + category suggestions. Writes nothing.
//   node scripts/suggest-names.js
//       Real run: updates `name` and `categories` for every product still
//       named "No name yet". Safe to re-run (named products are skipped).
//
// Requires MOONSHOT_API_KEY and SUPABASE_ACCESS_TOKEN in .env.
// Requires TELEGRAM_PROXY (or HTTPS_PROXY) pointing at a working local proxy:
// product images live on *.supabase.co, which is blocked direct on this
// network. Moonshot and the Supabase Management API are reached directly.
// Note: the Moonshot account is limited to 3 requests/minute, so a full run
// takes roughly (product count / 3) minutes.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_NAME = 'No name yet';
const KIMI_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_MODEL = 'kimi-k3';
// The Moonshot account is limited to 3 requests/minute.
const CALL_SPACING_MS = 21000;
const RATE_LIMIT_WAIT_MS = 65000;

const DRY_RUN = process.argv.includes('--dry-run');
const PROPOSE = process.argv.includes('--propose-categories');
const sampleArg = process.argv.find((a) => a.startsWith('--sample='));
const SAMPLE_SIZE = sampleArg ? Number(sampleArg.split('=')[1]) : 40;
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : 0;

// ---------------------------------------------------------------------------
// .env loading (same pattern as scripts/import-channel.js)
// ---------------------------------------------------------------------------

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv();

const { EXPO_PUBLIC_SUPABASE_URL, SUPABASE_ACCESS_TOKEN, MOONSHOT_API_KEY } = process.env;

for (const [key, value] of Object.entries({
  EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ACCESS_TOKEN,
  MOONSHOT_API_KEY,
})) {
  if (!value) {
    console.error(`Missing ${key} in .env`);
    process.exit(1);
  }
}

// Two network paths:
// - apiFetch: direct, for Moonshot (api.moonshot.cn) and the Supabase
//   Management API (api.supabase.com) — both reachable without a proxy.
// - imageFetch: through the local proxy, for product images on *.supabase.co,
//   which is blocked direct on this network.
const apiFetch = fetch;
let imageFetch = null;
async function initFetch() {
  const proxyUrl = process.env.TELEGRAM_PROXY || process.env.HTTPS_PROXY;
  if (!proxyUrl) {
    console.error('No proxy configured (TELEGRAM_PROXY in .env). Product images');
    console.error('on *.supabase.co are not reachable without one. Turn on your');
    console.error('local proxy (e.g. Clash on http://127.0.0.1:7890) and re-run.');
    process.exit(1);
  }
  const { fetch: undiciFetch, ProxyAgent } = require('undici');
  const dispatcher = new ProxyAgent(proxyUrl);
  imageFetch = (input, init) => undiciFetch(input, { ...init, dispatcher });
  try {
    const probe = await imageFetch(`${EXPO_PUBLIC_SUPABASE_URL}/storage/v1/bucket/${'product-images'}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!probe.ok && probe.status !== 401 && probe.status !== 400) {
      throw new Error(`probe status ${probe.status}`);
    }
    console.log(`Using proxy ${proxyUrl} for image downloads.`);
  } catch (err) {
    console.error(`Proxy ${proxyUrl} cannot reach Supabase storage (${err.message}).`);
    console.error('Turn on your local proxy and re-run.');
    process.exit(1);
  }
}

// DB access goes through the Supabase Management API (api.supabase.com),
// because the project REST domain (*.supabase.co) is blocked on some networks.
const projectRef = new URL(EXPO_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const MGMT_URL = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

async function pg(query) {
  const res = await apiFetch(MGMT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`DB ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

const sqlString = (value) => `'${String(value).replace(/'/g, "''")}'`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries network-flaky operations (proxy resets, socket errors) with backoff.
async function withRetry(fn, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const wait = 2000 * (i + 1);
      console.log(`Transient error (${err.message}), retrying in ${wait / 1000}s...`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

function coverImage(product) {
  return product.images[product.cover_image_index] ?? product.images[0];
}

// Downloads a product image (via the proxy) and returns a base64 data URL.
async function downloadImageAsDataUrl(url) {
  const res = await imageFetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`image download ${res.status}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

// Sends one image (as a base64 data URL) to Kimi vision and returns the raw
// text reply. Retries rate limits with long waits (account is capped at 3 RPM).
async function askKimi(imageDataUrl, prompt, attempts = 6) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await apiFetch(KIMI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${MOONSHOT_API_KEY}`,
        },
        body: JSON.stringify({
          model: KIMI_MODEL,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: imageDataUrl } },
                { type: 'text', text: prompt },
              ],
            },
          ],
        }),
      });
      if (res.status === 429) {
        console.log(`Rate limited, waiting ${RATE_LIMIT_WAIT_MS / 1000}s...`);
        await sleep(RATE_LIMIT_WAIT_MS);
        continue;
      }
      if (!res.ok) {
        throw new Error(`Kimi API ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
      const data = await res.json();
      return (data.choices?.[0]?.message?.content ?? '').trim();
    } catch (err) {
      lastErr = err;
      const wait = 2000 * (i + 1);
      console.log(`Transient error (${err.message}), retrying in ${wait / 1000}s...`);
      await sleep(wait);
    }
  }
  throw lastErr ?? new Error('Kimi API: rate limit retries exhausted');
}

// Splits a two-line Kimi reply into [name, categoriesLine], stripping any
// numbering/markdown the model might add.
function parseTwoLines(text) {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/^[\s\d.\-*•]+/, '').trim())
    .filter(Boolean);
  return [lines[0] ?? '', lines[1] ?? ''];
}

// ---------------------------------------------------------------------------
// Mode A: propose a category taxonomy from a sample
// ---------------------------------------------------------------------------

async function proposeCategories(products) {
  const withImages = products.filter((p) => p.images.length > 0);
  const step = Math.max(1, Math.floor(withImages.length / SAMPLE_SIZE));
  const sample = withImages.filter((_, i) => i % step === 0).slice(0, SAMPLE_SIZE);
  console.log(`Sampling ${sample.length} of ${withImages.length} unnamed products...\n`);

  const prompt = [
    'Look at this product photo from an online clothing/variety shop.',
    'Reply with exactly two lines:',
    'Line 1: a short product name (2-5 words).',
    'Line 2: ONE general category for it — a brief, shopper-friendly word or',
    'short phrase (e.g. Dresses, Shoes, Bags). No explanation.',
  ].join('\n');

  const counts = new Map(); // normalized -> { label, count, examples }
  let done = 0;
  for (const product of sample) {
    try {
      const dataUrl = await withRetry(() => downloadImageAsDataUrl(coverImage(product)));
      const reply = await askKimi(dataUrl, prompt);
      const [name, category] = parseTwoLines(reply);
      const key = category.toLowerCase();
      const entry = counts.get(key) ?? { label: category, count: 0, examples: [] };
      entry.count += 1;
      if (entry.examples.length < 3) entry.examples.push(name);
      counts.set(key, entry);
    } catch (err) {
      console.log(`Failed on ${product.id}: ${err.message}`);
    }
    done += 1;
    if (done % 10 === 0) console.log(`...${done}/${sample.length}`);
    await sleep(CALL_SPACING_MS);
  }

  console.log('\nProposed categories (raw, by frequency):');
  const sorted = [...counts.values()].sort((a, b) => b.count - a.count);
  for (const { label, count, examples } of sorted) {
    console.log(`  ${count}x  ${label}    (e.g. ${examples.join('; ')})`);
  }
}

// ---------------------------------------------------------------------------
// Mode B: name + categorize every unnamed product
// ---------------------------------------------------------------------------

async function suggestNames(products, categoryList) {
  const withImages = products.filter((p) => p.images.length > 0);
  const targets = LIMIT > 0 ? withImages.slice(0, LIMIT) : withImages;
  const skipped = products.length - withImages.length;
  console.log(
    `${DRY_RUN ? '[DRY RUN] ' : ''}Processing ${targets.length} unnamed products` +
      (skipped > 0 ? ` (${skipped} skipped: no images)` : '') +
      ` against ${categoryList.length} categories.\n`
  );

  const prompt = [
    'Look at this product photo from an online clothing/variety shop.',
    'Reply with exactly two lines:',
    'Line 1: a short generic product name (1-4 words) — just the item type,',
    'e.g. "Midi Dress", "Sneakers", "Trench Coat". NO color, NO brand names.',
    'Line 2: 1-2 categories for it, chosen ONLY from this exact list, copied',
    `verbatim and comma-separated: ${categoryList.join(', ')}`,
    'Combine an audience category (Ladies, Men, Kids) with an item-type',
    'category when the audience is identifiable, e.g. "Ladies, Dresses".',
    'No explanation.',
  ].join('\n');

  const listByLower = new Map(categoryList.map((c) => [c.toLowerCase(), c]));
  let updated = 0;
  let failed = 0;
  for (const product of targets) {
    try {
      const dataUrl = await withRetry(() => downloadImageAsDataUrl(coverImage(product)));
      const reply = await askKimi(dataUrl, prompt);
      const [name, categoriesLine] = parseTwoLines(reply);
      const matched = categoriesLine
        .split(',')
        .map((c) => listByLower.get(c.trim().toLowerCase()))
        .filter(Boolean);
      if (!name || matched.length === 0) {
        console.log(`Unparseable reply for ${product.id}: ${JSON.stringify(reply)} — skipped`);
        failed += 1;
        continue;
      }
      const categories = [...new Set(matched)];
      if (DRY_RUN) {
        console.log(`[DRY] ${product.id} :: ${name} :: ${categories.join(', ')}`);
      } else {
        await pg(
          `update products set name = ${sqlString(name)}, ` +
            `categories = array[${categories.map(sqlString).join(',')}]::text[] ` +
            `where id = ${sqlString(product.id)};`
        );
        console.log(`${product.id} :: ${name} :: ${categories.join(', ')}`);
      }
      updated += 1;
      if (updated % 50 === 0) console.log(`--- progress: ${updated}/${targets.length} ---`);
    } catch (err) {
      console.log(`Failed on ${product.id}: ${err.message}`);
      failed += 1;
    }
    await sleep(CALL_SPACING_MS);
  }

  console.log(`\nDone. ${updated} ${DRY_RUN ? 'would be ' : ''}updated, ${failed} failed.`);
}

// ---------------------------------------------------------------------------

async function main() {
  await initFetch();

  const products = await pg(
    `select id, name, images, cover_image_index from products ` +
      `where name = ${sqlString(DEFAULT_NAME)} order by created_at;`
  );

  if (products.length === 0) {
    console.log('No unnamed products found. Nothing to do.');
    return;
  }

  if (PROPOSE) {
    await proposeCategories(products);
    return;
  }

  const categoryRows = await pg(`select name from categories order by name;`);
  const categoryList = categoryRows.map((c) => c.name);
  if (categoryList.length === 0) {
    console.error('No categories in the database. Add the approved category list first.');
    process.exit(1);
  }

  await suggestNames(products, categoryList);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
