// One-time helper: resolves your numeric Telegram chat ID for bot DM notifications.
//
// Usage:
//   1. Open a DM with your bot in Telegram and tap Start (send any message).
//   2. Run: node scripts/get-chat-id.js
//   The numeric ID is printed and saved to ADMIN_TELEGRAM_CHAT_ID in .env.

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

function saveEnvValue(key, value) {
  const envPath = path.join(ROOT, '.env');
  const content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  const next = re.test(content) ? content.replace(re, line) : `${content.trimEnd()}\n${line}\n`;
  fs.writeFileSync(envPath, next);
}

loadEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN in .env');
  process.exit(1);
}

// Optional proxy for networks where Telegram is blocked.
const { ProxyAgent } = require('undici');
const proxyUrl = process.env.TELEGRAM_PROXY || process.env.HTTPS_PROXY;
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

async function main() {
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, { dispatcher });
  const json = await res.json();
  if (!json.ok) {
    console.error('Telegram API error:', json);
    process.exit(1);
  }

  const chats = new Map();
  for (const update of json.result) {
    const msg = update.message || update.channel_post || update.edited_channel_post;
    if (msg && msg.chat && msg.chat.type === 'private') {
      const label = msg.chat.username ? `@${msg.chat.username}` : msg.chat.first_name;
      chats.set(msg.chat.id, label);
    }
  }

  if (chats.size === 0) {
    console.log('No DM found yet. Open a DM with your bot, tap Start, then re-run this script.');
    process.exit(1);
  }

  console.log('Private chats that messaged the bot:');
  for (const [id, label] of chats) console.log(`  ${id}  ${label}`);

  const target = process.env.ADMIN_TELEGRAM_USERNAME || 'SignoreAB';
  const match = [...chats.entries()].find(([, label]) => label === `@${target.replace('@', '')}`);
  const [id] = match || [...chats.entries()][0];
  saveEnvValue('ADMIN_TELEGRAM_CHAT_ID', String(id));
  console.log(`\nSaved ADMIN_TELEGRAM_CHAT_ID=${id} to .env`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
