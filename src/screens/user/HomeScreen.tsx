import { useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { SearchBar } from '../../components/SearchBar';
import { CategoryFilter } from '../../components/CategoryFilter';
import { ProductCard } from '../../components/ProductCard';
import { EmptyState } from '../../components/EmptyState';
import { WebHeader } from '../../components/WebHeader';
import { useApp } from '../../context/AppContext';
import { useResponsive } from '../../hooks/useResponsive';
import { RootStackParamList } from '../../types/navigation';
import { Category } from '../../types';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { products, addToCart, setRole } = useApp();
  const { breakpoint, isDesktop } = useResponsive();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [newArrivalsOnly, setNewArrivalsOnly] = useState(false);

  const filtered = useMemo(() => {
    let result = products.filter((product) => {
      const matchesCategory = selectedCategory
        ? product.category === selectedCategory
        : true;
      const matchesSearch =
        query.trim() === '' ||
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (newArrivalsOnly) {
      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [products, selectedCategory, query, newArrivalsOnly]);

  const numColumns = breakpoint === 'lg' ? 4 : breakpoint === 'md' ? 3 : 2;
  const isWeb = Platform.OS === 'web';
  const showInlineSearch = !isWeb || !isDesktop;

  return (
    <Screen noPadding edges={['top', 'left', 'right']}>
      {isWeb && <WebHeader searchValue={query} onSearchChange={setQuery} />}

      <View style={styles.content}>
        {!isWeb && (
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => setRole(null)}>
              <Text style={styles.switchRole}>Switch role</Text>
            </TouchableOpacity>
          </View>
        )}

        {isWeb && (
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Welcome to Student Shop</Text>
            <Text style={styles.heroSubtitle}>
              School uniforms, stationery, books, and more — all in one place.
            </Text>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => {
                setSelectedCategory(null);
                setNewArrivalsOnly(false);
              }}
            >
              <Text style={styles.heroButtonText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.filterSection}>
          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            showNewArrivals
            newArrivalsSelected={newArrivalsOnly}
            onNewArrivalsToggle={() => {
              setNewArrivalsOnly((prev) => !prev);
              setSelectedCategory(null);
            }}
          />

          {showInlineSearch && (
            <View style={styles.searchContainer}>
              <SearchBar value={query} onChangeText={setQuery} />
            </View>
          )}
        </View>

        <FlatList
          key={numColumns}
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState message="No items found. Try a different search or category." />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() =>
                navigation.navigate('ProductDetail', { productId: item.id })
              }
              onAddToCart={() => addToCart(item)}
            />
          )}
        />
      </View>

      {isWeb && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Student Shop. All rights reserved.
          </Text>
          <TouchableOpacity onPress={() => setRole(null)}>
            <Text style={styles.footerLink}>Switch role</Text>
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  switchRole: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  hero: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...Platform.select({
      web: {
        borderRadius: borderRadius.lg,
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
      },
    }),
  },
  heroTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: colors.surface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: fontSizes.md,
    color: colors.surface,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: spacing.lg,
    maxWidth: 500,
  },
  heroButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  heroButtonText: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
  },
  searchContainer: {
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  footer: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  footerText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '600',
  },
});
