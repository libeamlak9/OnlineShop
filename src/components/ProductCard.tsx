import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { getProductCoverImage } from '../utils/images';
import { colors, spacing, borderRadius, fontSizes } from '../constants/theme';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
  compact?: boolean;
}

export function ProductCard({ product, onPress, onAddToCart }: ProductCardProps) {
  const imageUri = getProductCoverImage(product);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          {onAddToCart && (
            <TouchableOpacity style={styles.cartButton} onPress={onAddToCart}>
              <Ionicons name="cart-outline" size={18} color={colors.surface} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    margin: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        } as any)
      : {}),
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: spacing.sm,
    gap: 2,
  },
  name: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    minHeight: 32,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  price: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.price,
  },
  cartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
