// One-time backfill: imports every product from the Telegram channel history
// into the mini app's Supabase database.
//
// Grouping rule: a post WITH a caption ends/anchors a product group. It includes
// that post plus any immediately preceding caption-less photo posts (albums
// included). Caption-less posts are never standalone products.
//
// Usage:
//   node scripts/import-channel.js --dry-run   # print groups, write nothing
//   node scripts/import-channel.js             # real import (safe to re-run)
//   node scripts/import-channel.js --prune     # remove items whose channel posts were deleted
//
// First run requires a one-time Telegram login:
//   1. Run the script. It asks Telegram to send a login code to your app.
//   2. Write the code into a file named `.telegram-login-code` in the project root.
//   3. If you have 2FA enabled, write the password into `.telegram-2fa`.
//   The session is then saved to TELEGRAM_SESSION in .env and reused.

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');

const ROOT = path.resolve(__dirname, '..');
const BUCKET = 'product-images';
const DEFAULT_NAME = 'No name yet';
const PRICE_RE = /price\s*:?\s*\$?\s*(\d+(?:[.,]\d+)?)/i;
const DRY_RUN = process.argv.includes('--dry-run');
const PRUNE = process.argv.includes('--prune');

// ---------------------------------------------------------------------------
// .env loading (same pattern as scripts/setup-admin.js)
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

function saveEnvValue(key, value) {
  const envPath = path.join(ROOT, '.env');
  const content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  const next = re.test(content) ? content.replace(re, line) : `${content.trimEnd()}\n${line}\n`;
  fs.writeFileSync(envPath, next);
}

loadEnv();

const {
  EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  TELEGRAM_API_ID,
  TELEGRAM_API_HASH,
  TELEGRAM_PHONE,
  TELEGRAM_SESSION,
  TELEGRAM_CHANNEL,
} = process.env;

for (const [key, value] of Object.entries({
  EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  TELEGRAM_API_ID,
  TELEGRAM_API_HASH,
  TELEGRAM_PHONE,
  TELEGRAM_CHANNEL,
})) {
  if (!value) {
    console.error(`Missing ${key} in .env`);
    process.exit(1);
  }
}

// Optional proxy (e.g. TELEGRAM_PROXY=http://127.0.0.1:7890) for networks where
// Telegram/Supabase are blocked.
const proxyUrl = process.env.TELEGRAM_PROXY || process.env.HTTPS_PROXY;
let proxiedFetch;
if (proxyUrl) {
  const { fetch: undiciFetch, ProxyAgent } = require('undici');
  const dispatcher = new ProxyAgent(proxyUrl);
  proxiedFetch = (input, init) => undiciFetch(input, { ...init, dispatcher });
}

const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  ...(proxiedFetch ? { global: { fetch: proxiedFetch } } : {}),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries on Telegram FLOOD_WAIT errors, waiting the requested time.
async function withFloodWait(fn) {
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (err && err.seconds) {
        console.log(`Rate limited by Telegram, waiting ${err.seconds + 5}s...`);
        await sleep((err.seconds + 5) * 1000);
        continue;
      }
      throw err;
    }
  }
}

// Polls for a file the user writes interactively (login code / 2FA password).
function waitForFile(fileName, label) {
  const filePath = path.join(ROOT, fileName);
  console.log(`\n>>> ${label}`);
  console.log(`>>> Write it into the file "${fileName}" in the project root to continue.\n`);
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      if (!fs.existsSync(filePath)) return;
      const value = fs.readFileSync(filePath, 'utf-8').trim();
      if (!value) return;
      clearInterval(timer);
      fs.unlinkSync(filePath);
      resolve(value);
    }, 2000);
  });
}

function extractPrice(caption) {
  const match = caption.match(PRICE_RE);
  if (!match) return null;
  return Number(match[1].replace(',', '.'));
}

// Retries network-flaky operations (proxy resets, socket errors) with backoff.
async function withRetry(fn, attempts = 4) {
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

function getMessageCaption(msg) {
  return (msg.message || '').trim();
}

function isPhotoMessage(msg) {
  return msg && msg.media && msg.media.className === 'MessageMediaPhoto';
}

// ---------------------------------------------------------------------------
// Telegram login
// ---------------------------------------------------------------------------

async function connectTelegram() {
  // Optional proxy (e.g. TELEGRAM_PROXY=socks5://127.0.0.1:7890) for networks
  // where Telegram is blocked.
  let proxy;
  const proxyUrl = process.env.TELEGRAM_PROXY;
  if (proxyUrl) {
    const parsed = new URL(proxyUrl);
    proxy = {
      ip: parsed.hostname,
      port: Number(parsed.port),
      socksType: 5,
      timeout: 10,
    };
    console.log(`Using SOCKS5 proxy ${parsed.hostname}:${parsed.port}`);
  }

  const client = new TelegramClient(
    new StringSession(TELEGRAM_SESSION || ''),
    Number(TELEGRAM_API_ID),
    TELEGRAM_API_HASH,
    { connectionRetries: 5, proxy }
  );

  await client.start({
    phoneNumber: async () => TELEGRAM_PHONE,
    phoneCode: async () =>
      waitForFile('.telegram-login-code', 'Telegram sent you a login code in the app.'),
    password: async () =>
      waitForFile('.telegram-2fa', 'Your account has 2FA. Telegram password needed.'),
    onError: (err) => console.error('Telegram error:', err.message),
  });

  const session = client.session.save();
  if (session && session !== TELEGRAM_SESSION) {
    saveEnvValue('TELEGRAM_SESSION', session);
    console.log('Telegram session saved to .env (TELEGRAM_SESSION).');
  }
  return client;
}

// ---------------------------------------------------------------------------
// Channel history + grouping
// ---------------------------------------------------------------------------

async function fetchAllMessages(client, entity) {
  const all = [];
  let offsetId = 0;
  for (;;) {
    const batch = await withFloodWait(() =>
      client.getMessages(entity, { limit: 100, offsetId })
    );
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    offsetId = batch[batch.length - 1].id;
    console.log(`Fetched ${all.length} messages so far...`);
    await sleep(1000); // be polite with rate limits
    if (batch.length < 100) break;
  }
  // getMessages pages backwards from newest; reverse to chronological order.
  return all.reverse();
}

// Returns array of groups: { messages: [...], captioned: msg }.
// Orphan caption-less media (never followed by a caption) is dropped.
function groupMessages(messages) {
  const groups = [];
  let buffer = [];

  const flush = (captionedMsg) => {
    const groupMessagesAll = [...buffer, captionedMsg].sort((a, b) => a.id - b.id);
    groups.push({ messages: groupMessagesAll, captioned: captionedMsg });
    buffer = [];
  };

  for (const msg of messages) {
    if (!msg || msg.className !== 'Message') continue; // skip service messages
    const caption = getMessageCaption(msg);
    const hasPhoto = isPhotoMessage(msg);
    if (hasPhoto && caption) {
      flush(msg); // captioned photo post anchors the group
    } else if (hasPhoto) {
      buffer.push(msg); // caption-less photo: wait for its caption
    } else {
      buffer = []; // text-only or other media breaks the run; orphans dropped
    }
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Supabase writes
// ---------------------------------------------------------------------------

async function uploadGroupImages(client, group) {
  const urls = [];
  let index = 0;
  for (const msg of group.messages) {
    const buffer = await withFloodWait(() => client.downloadMedia(msg, {}));
    if (!buffer) continue;
    const filePath = `telegram/${group.captioned.id}/${index}.jpg`;
    const { error } = await withRetry(() =>
      supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, { contentType: 'image/jpeg', upsert: true })
    );
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    urls.push(data.publicUrl);
    index += 1;
  }
  return urls;
}

async function alreadyImported(messageIds) {
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .overlaps('telegram_message_ids', messageIds)
    .limit(1);
  if (error) throw error;
  return data && data.length > 0;
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

async function runImport() {
  const client = await connectTelegram();
  const entity = await client.getEntity(TELEGRAM_CHANNEL);
  console.log(`Reading history of ${TELEGRAM_CHANNEL}...`);
  const messages = await fetchAllMessages(client, entity);
  console.log(`Total messages: ${messages.length}`);

  const groups = groupMessages(messages);
  console.log(`Detected ${groups.length} product groups.\n`);

  let created = 0;
  let skipped = 0;
  let noPrice = 0;

  for (const [i, group] of groups.entries()) {
    const caption = getMessageCaption(group.captioned);
    const price = extractPrice(caption);
    const messageIds = group.messages.map((m) => m.id);
    const label = `[${i + 1}/${groups.length}] primary=${group.captioned.id} images=${group.messages.length} price=${price ?? 'NOT FOUND'}`;
    if (price === null) noPrice += 1;

    if (DRY_RUN) {
      console.log(`${label}\n    ${caption.split('\n')[0].slice(0, 80)}`);
      continue;
    }

    if (await alreadyImported(messageIds)) {
      console.log(`${label} — already imported, skipping`);
      skipped += 1;
      continue;
    }

    const images = await uploadGroupImages(client, group);
    const { error } = await withRetry(() =>
      supabase.from('products').insert({
        id: `tg-${group.captioned.id}`,
        name: DEFAULT_NAME,
        description: caption,
        price: price ?? 0,
        categories: [], // filled in later by scripts/suggest-names.js or the admin panel
        images,
        cover_image_index: 0,
        created_at: new Date(group.captioned.date * 1000).toISOString(),
        telegram_message_ids: messageIds,
        telegram_primary_message_id: group.captioned.id,
        is_draft: false,
      })
    );
    if (error) throw error;
    created += 1;
    console.log(`${label} — imported`);
    await sleep(500);
  }

  await client.disconnect();
  console.log(
    `\nDone. ${DRY_RUN ? '(dry run, nothing written) ' : ''}created=${created} skipped=${skipped} groups-without-price=${noPrice}`
  );
}

async function runPrune() {
  const client = await connectTelegram();
  const entity = await client.getEntity(TELEGRAM_CHANNEL);

  const { data: products, error } = await supabase
    .from('products')
    .select('id, images, telegram_primary_message_id')
    .not('telegram_primary_message_id', 'is', null);
  if (error) throw error;

  console.log(`Checking ${products.length} imported products against the channel...`);
  let removed = 0;
  const BATCH = 100;
  for (let i = 0; i < products.length; i += BATCH) {
    const slice = products.slice(i, i + BATCH);
    const found = await withFloodWait(() =>
      client.getMessages(entity, { ids: slice.map((p) => p.telegram_primary_message_id) })
    );
    for (let j = 0; j < slice.length; j += 1) {
      if (found[j]) continue; // message still exists
      const product = slice[j];
      if (DRY_RUN) {
        console.log(`Would remove product ${product.id} (message ${product.telegram_primary_message_id} deleted)`);
        continue;
      }
      // Best-effort image cleanup, mirroring src/services/images.ts deleteProductImage.
      const paths = (product.images || [])
        .map((url) => {
          const marker = `/object/public/${BUCKET}/`;
          const idx = url.indexOf(marker);
          return idx === -1 ? null : url.slice(idx + marker.length);
        })
        .filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET).remove(paths);
      }
      await supabase.from('products').delete().eq('id', product.id);
      removed += 1;
      console.log(`Removed product ${product.id}`);
    }
  }

  await client.disconnect();
  console.log(`\nPrune done. removed=${removed}${DRY_RUN ? ' (dry run)' : ''}`);
}

(PRUNE ? runPrune() : runImport()).catch((err) => {
  console.error(err);
  process.exit(1);
});
