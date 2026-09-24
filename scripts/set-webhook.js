// Registers the Telegram webhook for the channel-sync edge function.
// Run once after deploying the function:
//   node scripts/set-webhook.js
// Re-run any time to check status (it prints getWebhookInfo at the end).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

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

const { TELEGRAM_BOT_TOKEN, WEBHOOK_SECRET, EXPO_PUBLIC_SUPABASE_URL } = process.env;
if (!TELEGRAM_BOT_TOKEN || !WEBHOOK_SECRET || !EXPO_PUBLIC_SUPABASE_URL) {
  console.error('Missing TELEGRAM_BOT_TOKEN, WEBHOOK_SECRET or EXPO_PUBLIC_SUPABASE_URL in .env');
  process.exit(1);
}

// https://<project-ref>.supabase.co -> function URL
const functionUrl = `${EXPO_PUBLIC_SUPABASE_URL}/functions/v1/telegram-webhook`;

// Optional proxy for networks where Telegram is blocked.
const { ProxyAgent } = require('undici');
const proxyUrl = process.env.TELEGRAM_PROXY || process.env.HTTPS_PROXY;
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

async function api(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    dispatcher,
  });
  return res.json();
}

async function main() {
  const set = await api('setWebhook', {
    url: functionUrl,
    secret_token: WEBHOOK_SECRET,
    allowed_updates: ['channel_post', 'edited_channel_post', 'message'],
    drop_pending_updates: true,
  });
  console.log('setWebhook:', JSON.stringify(set));

  const info = await api('getWebhookInfo', {});
  console.log('getWebhookInfo:', JSON.stringify(info.result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
