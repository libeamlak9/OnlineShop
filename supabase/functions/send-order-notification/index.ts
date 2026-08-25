import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface OrderPayload {
  items: OrderItem[];
  total: number;
  phoneNumber?: string;
  location?: string;
  summaryImageBase64?: string;
  productImageUrls?: string[];
}

function base64ToBlob(base64: string): Blob {
  const match = base64.match(/^data:(.+);base64,(.*)$/);
  if (!match) {
    throw new Error('Invalid base64 data URI');
  }
  const mime = match[1];
  const byteString = atob(match[2]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uintArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uintArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { type: mime });
}

const MAX_CAPTION_LENGTH = 1000;

function formatCaption(payload: OrderPayload): string {
  const lines = payload.items.map(
    (item) =>
      `${item.quantity} × ${item.name} — $${(item.price * item.quantity).toFixed(2)}`
  );

  let caption = '🛒 New Order\n\n' + lines.join('\n') + '\n\n';
  caption += `💰 Total: $${payload.total.toFixed(2)}\n`;
  if (payload.location) caption += `📍 Location: ${payload.location}\n`;
  if (payload.phoneNumber) caption += `📞 Phone: ${payload.phoneNumber}\n`;

  if (caption.length > MAX_CAPTION_LENGTH) {
    caption = caption.slice(0, MAX_CAPTION_LENGTH - 3) + '...';
  }

  return caption;
}

async function sendSummaryPhoto(
  token: string,
  chatId: string,
  summaryImageBase64: string,
  caption: string
): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/sendPhoto`;
  const blob = base64ToBlob(summaryImageBase64);
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('photo', blob, 'order-summary.png');
  formData.append('caption', caption);

  const response = await fetch(url, { method: 'POST', body: formData });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.description || 'Failed to send summary photo');
  }
}

async function sendProductMediaGroup(
  token: string,
  chatId: string,
  imageUrls: string[]
): Promise<void> {
  if (imageUrls.length === 0) return;

  // sendMediaGroup requires 2-10 items. If only one, use sendPhoto.
  if (imageUrls.length === 1) {
    const url = `https://api.telegram.org/bot${token}/sendPhoto`;
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', imageUrls[0]);

    const response = await fetch(url, { method: 'POST', body: formData });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.description || 'Failed to send product photo');
    }
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMediaGroup`;
  const media = imageUrls.map((url) => ({
    type: 'photo',
    media: url,
  }));

  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('media', JSON.stringify(media));

  const response = await fetch(url, { method: 'POST', body: formData });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.description || 'Failed to send product media group');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const defaultChatId = Deno.env.get('TARGET_CHAT_ID');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Server configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: OrderPayload = await req.json();
    const chatId = defaultChatId;

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: 'No chat ID provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending order notification to chat:', chatId);
    const caption = formatCaption(payload);

    if (payload.summaryImageBase64) {
      await sendSummaryPhoto(token, chatId, payload.summaryImageBase64, caption);
    } else {
      // No summary image; send caption as a plain message.
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: caption }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.description || 'Failed to send message');
      }
    }

    if (payload.productImageUrls && payload.productImageUrls.length > 0) {
      await sendProductMediaGroup(token, chatId, payload.productImageUrls);
    }

    return new Response(
      JSON.stringify({ success: true, chatId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('send-order-notification error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
