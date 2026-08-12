import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { getProductCoverImage } from '../utils/images';
import { colors, spacing, borderRadius, fontSizes } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 3;
const COLUMNS = 2;
const CARD_WIDTH = (width - spacing.sm * 2 - CARD_MARGIN * COLUMNS * 2) / COLUMNS;
const IMAGE_ASPECT = 0.75; // portrait 3:4

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
  compact?: boolean;
}

export function ProductCard({
  product,
  onPress,
  onAddToCart,
  compact = false,
}: ProductCardProps) {
  const imageUri = getProductCoverImage(product);

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.imageContainer, compact && styles.compactImageContainer]}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.description} numberOfLines={1}>
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    flex: 1,
    margin: CARD_MARGIN,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  compactCard: {
    width: CARD_WIDTH,
    maxWidth: CARD_WIDTH,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: IMAGE_ASPECT,
    backgroundColor: colors.background,
  },
  compactImageContainer: {
    height: CARD_WIDTH / IMAGE_ASPECT,
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
