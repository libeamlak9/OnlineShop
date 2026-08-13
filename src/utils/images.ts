import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { Category, Product } from '../types';
import { getCategoryColor } from '../constants/categories';

export function generatePlaceholderImage(category: Category, text: string): string {
  const color = getCategoryColor(category).replace('#', '');
  return `https://placehold.co/400x300/${color}/ffffff?text=${encodeURIComponent(text)}`;
}

export function getProductImage(category: Category, name: string, image?: string): string {
  if (image && image.trim().length > 0) {
    return image;
  }
  return generatePlaceholderImage(category, name.charAt(0));
}

export function getProductCoverImage(product: Product): string {
  const image = product.images[product.coverImageIndex ?? 0];
  return getProductImage(product.category, product.name, image);
}

export function getProductGalleryImages(product: Product): string[] {
  if (product.images.length > 0) {
    return product.images;
  }
  return [generatePlaceholderImage(product.category, product.name.charAt(0))];
}

export async function resizeImage(uri: string, maxWidth = 800): Promise<string> {
  try {
    const isWeb = Platform.OS === 'web';
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: isWeb }
    );
    if (isWeb && manipulated.base64) {
      return `data:image/jpeg;base64,${manipulated.base64}`;
    }
    return manipulated.uri;
  } catch {
    return uri;
  }
}
