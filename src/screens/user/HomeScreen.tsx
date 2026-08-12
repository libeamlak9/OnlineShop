import { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { SearchBar } from '../../components/SearchBar';
import { CategoryFilter } from '../../components/CategoryFilter';
import { ProductCard } from '../../components/ProductCard';
import { EmptyState } from '../../components/EmptyState';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../types/navigation';
import { Category } from '../../types';
import { colors, spacing, fontSizes } from '../../constants/theme';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { products, addToCart, setRole } = useApp();

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

  return (
    <Screen noPadding edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setRole(null)}>
          <Text style={styles.switchRole}>Switch role</Text>
        </TouchableOpacity>
      </View>

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

      <View style={styles.searchContainer}>
        <SearchBar value={query} onChangeText={setQuery} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState message="No items found. Try a different search or category." />
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            compact
            onPress={() =>
              navigation.navigate('ProductDetail', { productId: item.id })
            }
            onAddToCart={() => addToCart(item)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.sm,
    paddingBottom: 0,
    flexGrow: 1,
  },
});
