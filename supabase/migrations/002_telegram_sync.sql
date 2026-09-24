-- Telegram channel sync: message ID tracking on products + pending buffer for the live webhook.
-- Run this in the Supabase SQL Editor after 001_initial_schema.sql.

-- Products: Telegram source tracking + draft flag
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS telegram_message_ids bigint[],
  ADD COLUMN IF NOT EXISTS telegram_primary_message_id bigint,
  ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS products_telegram_primary_message_id_idx
  ON products (telegram_primary_message_id);

-- Buffer for live channel posts waiting to be grouped into a product.
-- Written/read only by the telegram-webhook edge function (service role).
CREATE TABLE IF NOT EXISTS telegram_pending_posts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  channel_id bigint NOT NULL,
  message_id bigint NOT NULL,
  media_group_id bigint,
  photo_file_id text,
  caption text,
  has_caption boolean NOT NULL DEFAULT false,
  posted_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, message_id)
);

CREATE INDEX IF NOT EXISTS telegram_pending_posts_channel_idx
  ON telegram_pending_posts (channel_id, posted_at);

-- No public policies: only the service role (edge function) can touch this table.
ALTER TABLE telegram_pending_posts ENABLE ROW LEVEL SECURITY;
