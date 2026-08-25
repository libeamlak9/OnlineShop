import { CartItem } from '../types';
import { ColorPalette } from '../constants/theme';
import { createWebSummaryImage } from '../utils/summaryImage';

interface OrderNotificationPayload {
  items: { name: string; quantity: number; price: number; imageUrl?: string }[];
  total: number;
  phoneNumber?: string;
  location?: string;
  chatId?: string;
  summaryImageBase64?: string;
  productImageUrls?: string[];
}

function getSupabaseProjectRef(): string | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const parts = host.split('.');
    if (parts.length >= 3 && parts.slice(-2).join('.') === 'supabase.co') {
      return parts[0];
    }
  } catch {
    // ignore invalid URL
  }
  return null;
}

function getEdgeFunctionUrl(functionName: string): string | null {
  const projectRef = getSupabaseProjectRef();
  if (!projectRef) return null;
  return `https://${projectRef}.supabase.co/functions/v1/${functionName}`;
}

export async function sendOrderNotification(
  payload: OrderNotificationPayload
): Promise<{ success: boolean; chatId?: string }> {
  const url = getEdgeFunctionUrl('send-order-notification');
  if (!url) {
    throw new Error('Supabase project URL is not configured');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || `Notification failed (${response.status})`);
  }

  return result;
}

export function buildNotificationPayload(
  cart: CartItem[],
  cartTotal: number,
  colors: ColorPalette,
  phoneNumber?: string,
  location?: string,
  chatId?: string
): OrderNotificationPayload {
  const summaryImageBase64 =
    typeof document !== 'undefined' ? createWebSummaryImage(cart, cartTotal, colors) : undefined;

  const productImageUrls = cart
    .map((item) => item.product.images[item.selectedImageIndex ?? item.product.coverImageIndex ?? 0])
    .filter((url): url is string => Boolean(url));

  return {
    items: cart.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      imageUrl: item.product.images[item.selectedImageIndex ?? item.product.coverImageIndex ?? 0],
    })),
    total: cartTotal,
    phoneNumber,
    location,
    chatId,
    summaryImageBase64: summaryImageBase64 ?? undefined,
    productImageUrls,
  };
}
