import { useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useApp } from '../../context/AppContext';
import { getProductGalleryImages } from '../../utils/images';
import { RootStackParamList } from '../../types/navigation';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 0.65;

export function ProductDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { productId } = route.params as { productId: string };
  const { products, addToCart } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<string>>(null);

  const product = products.find((p) => p.id === productId);

  if (!product) {
    return (
      <Screen>
        <EmptyState message="Product not found." icon="alert-circle-outline" />
      </Screen>
    );
  }

  const galleryImages = getProductGalleryImages(product);
  const outOfStock = product.stock <= 0;


  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.min(Math.max(index, 0), galleryImages.length - 1));
  }

  function renderImage({ item }: { item: string }) {
    return (
      <View style={styles.imageSlide}>
        <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
      </View>
    );
  }

  return (
    <Screen scroll noPadding edges={['top', 'left', 'right']}>
      <View style={styles.galleryContainer}>
        <FlatList
          ref={flatListRef}
          data={galleryImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={width}
          decelerationRate="fast"
          bounces={false}
          keyExtractor={(_, index) => `gallery-${index}`}
          onMomentumScrollEnd={handleScroll}
          renderItem={renderImage}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
        {galleryImages.length > 1 && (
          <View style={styles.dots}>
            {galleryImages.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === activeIndex && styles.activeDot]}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.category}>{product.category}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{product.description}</Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Add to Cart"
          onPress={() => {
            addToCart(product);
            navigation.goBack();
          }}
          disabled={outOfStock}
          style={styles.actionButton}
        />
        <Button
          title="Buy Now"
          variant="secondary"
          onPress={() => {
            addToCart(product);
            navigation.navigate('Checkout');
          }}
          disabled={outOfStock}
          style={styles.actionButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  galleryContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  imageSlide: {
    width,
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dots: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  activeDot: {
    backgroundColor: colors.primary,
    width: 18,
    height: 8,
    borderRadius: 4,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.text,
  },
  price: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.price,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  category: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});
