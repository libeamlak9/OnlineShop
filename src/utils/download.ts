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
  // Cross-origin images (Supabase Storage, placehold.co, etc.) usually block
  // client-side fetch/CORS blob downloads. Use a plain anchor so the browser
  // can handle the URL directly: same-origin downloads save automatically;
  // cross-origin URLs open in a new tab where the user can save them.
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
    if (isTelegram()) {
      await downloadTelegramFile(url, filename);
    } else if (Platform.OS === 'web') {
      await downloadWeb(url, filename);
    } else {
      await downloadNative(url, filename);
    }
  } catch (error) {
    console.error('Failed to download image:', error);
    await showAlert('Download failed', 'Could not download the image. Please try again.');
    throw error;
  }
}
