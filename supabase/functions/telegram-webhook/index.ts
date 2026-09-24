// Telegram channel webhook: automatically turns new channel posts into products.
//
// Grouping rule (mirrors scripts/import-channel.js): a post WITH a caption anchors
// a product group and includes any immediately preceding caption-less photo posts.
// New captions are structured: line 1 = name, line 2 = categories (comma-separated), line 3 = price.
//
// Pending posts are buffered in the telegram_pending_posts table. Publishing is
// debounced (~45s) so all members of a media group (album) land in one item.
//
// Setup:
//   supabase functions deploy telegram-webhook
//   supabase secrets set TELEGRAM_BOT_TOKEN=... ADMIN_TELEGRAM_CHAT_ID=... WEBHOOK_SECRET=... TELEGRAM_CHANNEL=@santabeijing
//   node scripts/set-webhook.js

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const ADMIN_CHAT_ID = Deno.env.get('ADMIN_TELEGRAM_CHAT_ID') ?? '';
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? '';
const CHANNEL = (Deno.env.get('TELEGRAM_CHANNEL') ?? '').replace('@', '');

const BUCKET = 'product-images';
const DEFAULT_NAME = 'No name yet';
const PRICE_RE = /price\s*:?\s*\$?\s*(\d+(?:[.,]\d+)?)/i;
const DEBOUNCE_MS = 45_000; // wait for late album members before publishing
const GROUP_WINDOW_MS = 5 * 60_000; // posts within 5 minutes belong together
const PURGE_AGE_MS = 10 * 60_000; // orphan caption-less posts expire

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Telegram Bot API helpers
// ---------------------------------------------------------------------------

async function botApi(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function notifyAdmin(text: string): Promise<void> {
  if (!ADMIN_CHAT_ID) return;
  try {
    await botApi('sendMessage', { chat_id: ADMIN_CHAT_ID, text });
  } catch (err) {
    console.error('Failed to notify admin:', err);
  }
}

async function downloadTelegramFile(fileId: string): Promise<Uint8Array | null> {
  const file = await botApi('getFile', { file_id: fileId });
  if (!file.ok) return null;
  const res = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${file.result.file_path}`);
  if (!res.ok) return null;
  return new Uint8Array(await res.arrayBuffer());
}

// ---------------------------------------------------------------------------
// Caption parsing
// ---------------------------------------------------------------------------

interface ParsedCaption {
  name: string | null;
  categoryLine: string | null;
  price: number | null;
}

function parseCaption(caption: string): ParsedCaption {
  const lines = caption.split('\n').map((line) => line.trim()).filter(Boolean);
  const name = lines[0] || null;
  const categoryLine = lines[1] || null;
  // Price is expected on line 3, but fall back to the whole caption.
  const priceMatch = (lines[2] ?? '').match(PRICE_RE) ?? caption.match(PRICE_RE);
  return {
    name,
    categoryLine,
    price: priceMatch ? Number(priceMatch[1].replace(',', '.')) : null,
  };
}

// Matches a comma-separated category line against the category list.
// Returns the matched categories (verbatim from the list) and any unmatched parts.
async function matchCategories(
  categoryLine: string | null
): Promise<{ categories: string[]; unmatched: string[] }> {
  const { data } = await supabase.from('categories').select('name').order('name');
  const all = (data ?? []).map((row: { name: string }) => row.name);
  const byLower = new Map(all.map((name: string) => [name.toLowerCase(), name]));
  const parts = (categoryLine ?? '').split(',').map((p) => p.trim()).filter(Boolean);
  const categories: string[] = [];
  const unmatched: string[] = [];
  for (const part of parts) {
    const match = byLower.get(part.toLowerCase());
    if (match) {
      if (!categories.includes(match)) categories.push(match);
    } else {
      unmatched.push(part);
    }
  }
  return { categories, unmatched };
}

// ---------------------------------------------------------------------------
// Pending posts buffer
// ---------------------------------------------------------------------------

interface PendingPost {
  channel_id: number;
  message_id: number;
  media_group_id: number | null;
  photo_file_id: string | null;
  caption: string | null;
  has_caption: boolean;
  posted_at: string;
}

function largestPhotoFileId(photos?: { file_id: string; width: number }[]): string | null {
  if (!photos || photos.length === 0) return null;
  return photos[photos.length - 1].file_id;
}

async function bufferPost(msg: {
  chat: { id: number };
  message_id: number;
  media_group_id?: string;
  photo?: { file_id: string; width: number }[];
  caption?: string;
  date: number;
}): Promise<void> {
  const fileId = largestPhotoFileId(msg.photo);
  if (!fileId) return; // only photo posts are catalog material
  const row: PendingPost = {
    channel_id: msg.chat.id,
    message_id: msg.message_id,
    media_group_id: msg.media_group_id ? Number(msg.media_group_id) : null,
    photo_file_id: fileId,
    caption: msg.caption ?? null,
    has_caption: Boolean(msg.caption && msg.caption.trim()),
    posted_at: new Date(msg.date * 1000).toISOString(),
  };
  const { error } = await supabase
    .from('telegram_pending_posts')
    .upsert(row, { onConflict: 'channel_id,message_id', ignoreDuplicates: true });
  if (error) console.error('Failed to buffer post:', error);
}

// ---------------------------------------------------------------------------
// Group finalization
// ---------------------------------------------------------------------------

async function uploadGroupImages(members: PendingPost[], primaryId: number): Promise<string[]> {
  const urls: string[] = [];
  let index = 0;
  for (const member of members) {
    if (!member.photo_file_id) continue;
    const bytes = await downloadTelegramFile(member.photo_file_id);
    if (!bytes) continue;
    const filePath = `telegram/${primaryId}/${index}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    urls.push(data.publicUrl);
    index += 1;
  }
  return urls;
}

async function finalizeGroup(channelId: number, captionedMessageId: number): Promise<void> {
  // Load the captioned post; if it's gone, the group was already finalized.
  const { data: captionedRows } = await supabase
    .from('telegram_pending_posts')
    .select('*')
    .eq('channel_id', channelId)
    .eq('message_id', captionedMessageId);
  const captioned = captionedRows?.[0] as PendingPost | undefined;
  if (!captioned || !captioned.caption) return;

  // Idempotency: skip if a product already exists for this message.
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('telegram_primary_message_id', captionedMessageId)
    .limit(1);
  if (existing && existing.length > 0) {
    await supabase.from('telegram_pending_posts').delete()
      .eq('channel_id', channelId).eq('message_id', captionedMessageId);
    return;
  }

  // Collect group members: caption-less posts immediately preceding the
  // captioned one within the time window, plus same-album members.
  const windowStart = new Date(new Date(captioned.posted_at).getTime() - GROUP_WINDOW_MS).toISOString();
  const { data: preceding } = await supabase
    .from('telegram_pending_posts')
    .select('*')
    .eq('channel_id', channelId)
    .eq('has_caption', false)
    .lt('message_id', captionedMessageId)
    .gte('posted_at', windowStart);
  const { data: albumMembers } = captioned.media_group_id
    ? await supabase
        .from('telegram_pending_posts')
        .select('*')
        .eq('channel_id', channelId)
        .eq('media_group_id', captioned.media_group_id)
    : { data: [] };

  const byId = new Map<number, PendingPost>();
  for (const row of [...(preceding ?? []), ...(albumMembers ?? []), captioned]) {
    byId.set(row.message_id, row as PendingPost);
  }
  const members = [...byId.values()].sort((a, b) => a.message_id - b.message_id);
  const messageIds = members.map((m) => m.message_id);

  const caption = captioned.caption;
  const parsed = parseCaption(caption);
  const { categories, unmatched } = await matchCategories(parsed.categoryLine);

  const problems: string[] = [];
  if (!parsed.name) problems.push('missing name (line 1)');
  if (categories.length === 0) {
    problems.push(`category "${parsed.categoryLine ?? ''}" not in the category list`);
  } else if (unmatched.length > 0) {
    problems.push(`categories not in the list: ${unmatched.join(', ')}`);
  }
  if (parsed.price === null) problems.push('price not found (line 3)');
  const isDraft = problems.length > 0;

  const images = await uploadGroupImages(members, captionedMessageId);

  const { error } = await supabase.from('products').insert({
    id: `tg-${captionedMessageId}`,
    name: parsed.name ?? DEFAULT_NAME,
    description: caption,
    price: parsed.price ?? 0,
    categories,
    images,
    cover_image_index: 0,
    created_at: captioned.posted_at,
    telegram_message_ids: messageIds,
    telegram_primary_message_id: captionedMessageId,
    is_draft: isDraft,
  });
  if (error) {
    console.error('Failed to insert product:', error);
    return; // keep pending rows so the next finalize retries
  }

  await supabase.from('telegram_pending_posts').delete()
    .eq('channel_id', channelId).in('message_id', messageIds);

  const link = CHANNEL ? `https://t.me/${CHANNEL}/${captionedMessageId}` : `message ${captionedMessageId}`;
  if (isDraft) {
    await notifyAdmin(
      `⚠️ New channel post saved as DRAFT: ${problems.join('; ')}.\n` +
      `Fix it in the admin panel (it publishes when you save).\n${link}`
    );
  } else {
    console.log(`Published product tg-${captionedMessageId} with ${images.length} images`);
  }
}

// Finalize every captioned group that has settled (older than the debounce).
async function finalizeSettledGroups(): Promise<void> {
  const cutoff = new Date(Date.now() - DEBOUNCE_MS).toISOString();
  const { data: settled } = await supabase
    .from('telegram_pending_posts')
    .select('channel_id, message_id')
    .eq('has_caption', true)
    .lt('posted_at', cutoff);
  for (const row of settled ?? []) {
    try {
      await finalizeGroup(row.channel_id, row.message_id);
    } catch (err) {
      console.error(`Finalize failed for message ${row.message_id}:`, err);
    }
  }

  // Expire orphan caption-less posts (never followed by a caption).
  const purgeCutoff = new Date(Date.now() - PURGE_AGE_MS).toISOString();
  await supabase.from('telegram_pending_posts').delete()
    .eq('has_caption', false).lt('posted_at', purgeCutoff);
}

function scheduleFinalize(channelId: number, messageId: number): void {
  const task = sleep(DEBOUNCE_MS).then(() => finalizeGroup(channelId, messageId));
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime) {
    EdgeRuntime.waitUntil(task);
  } else {
    task.catch((err) => console.error('Debounced finalize failed:', err));
  }
}

// ---------------------------------------------------------------------------
// Update handlers
// ---------------------------------------------------------------------------

async function handleEditedPost(msg: {
  chat: { id: number };
  message_id: number;
  caption?: string;
  date: number;
}): Promise<void> {
  const caption = (msg.caption ?? '').trim();
  if (!caption) return;

  const { data } = await supabase
    .from('products')
    .select('id')
    .eq('telegram_primary_message_id', msg.message_id)
    .limit(1);
  const product = data?.[0];
  if (!product) return; // edit of an unknown/untracked post

  const parsed = parseCaption(caption);
  const { categories, unmatched } = await matchCategories(parsed.categoryLine);
  const problems: string[] = [];
  if (!parsed.name) problems.push('missing name');
  if (categories.length === 0) {
    problems.push(`category "${parsed.categoryLine ?? ''}" not in list`);
  } else if (unmatched.length > 0) {
    problems.push(`categories not in the list: ${unmatched.join(', ')}`);
  }
  if (parsed.price === null) problems.push('price not found');

  const { error } = await supabase.from('products').update({
    name: parsed.name ?? DEFAULT_NAME,
    description: caption,
    price: parsed.price ?? 0,
    categories,
    is_draft: problems.length > 0,
  }).eq('id', product.id);
  if (error) console.error('Failed to update product after edit:', error);

  if (problems.length > 0) {
    const link = CHANNEL ? `https://t.me/${CHANNEL}/${msg.message_id}` : `message ${msg.message_id}`;
    await notifyAdmin(`⚠️ Edited post is now a DRAFT: ${problems.join('; ')}.\n${link}`);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('ok', { status: 200 });
  }
  if (WEBHOOK_SECRET && req.headers.get('x-telegram-bot-api-secret-token') !== WEBHOOK_SECRET) {
    return new Response('unauthorized', { status: 401 });
  }

  try {
    const update = await req.json();

    // Opportunistic finalize: settles groups whose debounce lapsed without a
    // follow-up event, and purges expired orphan posts.
    await finalizeSettledGroups();

    const post = update.channel_post;
    if (post) {
      await bufferPost(post);
      if (post.caption && post.caption.trim()) {
        scheduleFinalize(post.chat.id, post.message_id);
      }
    }

    // Convenience: reply to private DMs with the sender's chat ID, so the admin
    // can configure ADMIN_TELEGRAM_CHAT_ID without extra tooling.
    const dm = update.message;
    if (dm && dm.chat && dm.chat.type === 'private') {
      await botApi('sendMessage', {
        chat_id: dm.chat.id,
        text: `Your Telegram chat ID is: ${dm.chat.id}`,
      });
    }

    const edited = update.edited_channel_post;
    if (edited) {
      await handleEditedPost(edited);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('telegram-webhook error:', err);
    // Always 200 so Telegram does not retry endlessly on our bugs.
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
});
