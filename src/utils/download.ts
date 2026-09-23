import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { downloadTelegramFile, isTelegram, showAlert } from '../lib/telegram';

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\u1200-\u137F\s-]/g, '') // keep letters, numbers, Ethiopic, spaces, dashes
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 80);
}

export function getImageFilename(productName: string, index: number): string {
  const base = sanitizeFilename(productName) || 'product';
  return `${base}-image-${index + 1}.jpg`;
}

async function downloadWeb(url: string, filename: string): Promise<void> {
  // Fetch the image as a blob and save it via a same-origin object URL so the
  // browser downloads immediately with the given filename — no save-as prompt,
  // no new tab. Supabase Storage public URLs allow cross-origin fetches.
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  }
}

function downloadWebFallback(url: string, filename: string): void {
  // Last resort when the blob fetch fails (e.g. CORS): a plain anchor. The
  // cross-origin URL ignores the download attribute and opens in a new tab.
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function downloadNative(url: string, filename: string): Promise<void> {
  const destination = `${FileSystem.cacheDirectory}${filename}`;
  const result = await FileSystem.downloadAsync(url, destination);

  if (result.status !== 200) {
    throw new Error(`Download failed with status ${result.status}`);
  }

  await showAlert(
    'Download complete',
    `Image saved to app cache:\n${destination}`
  );
}

export async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // The Telegram webview is a browser, so the instant blob download works
      // there too. Only fall back to slower paths when the fetch itself fails.
      try {
        await downloadWeb(url, filename);
      } catch {
        if (isTelegram()) {
          await downloadTelegramFile(url, filename);
        } else {
          downloadWebFallback(url, filename);
        }
      }
    } else {
      await downloadNative(url, filename);
    }
  } catch (error) {
    console.error('Failed to download image:', error);
    await showAlert('Download failed', 'Could not download the image. Please try again.');
    throw error;
  }
}
