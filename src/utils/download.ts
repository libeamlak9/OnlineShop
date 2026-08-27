import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { showAlert } from '../lib/telegram';

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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Delay revoking to give the browser time to start the download.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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
