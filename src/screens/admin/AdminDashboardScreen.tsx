import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useApp } from '../../context/AppContext';
import { AdminStackParamList } from '../../types/navigation';
import { getProductCoverImage } from '../../utils/images';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';

export function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const { products, orders, categories, deleteProduct, addCategory, removeCategory, setRole } = useApp();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  function handleDelete(id: string) {
    deleteProduct(id);
    setSuccessMessage('Item deleted successfully');
    setTimeout(() => setSuccessMessage(null), 2000);
  }

  function handleAddCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      Alert.alert('Duplicate', `${trimmed} already exists.`);
      return;
    }
    addCategory(trimmed);
    setNewCategory('');
    setSuccessMessage('Category added');
    setTimeout(() => setSuccessMessage(null), 2000);
  }

  function handleRemoveCategory(category: string) {
    const inUse = products.some((p) => p.category === category);
    if (inUse) {
      Alert.alert(
        'Cannot delete',
        'Some products are using this category. Reassign or delete those products first.'
      );
      return;
    }
    removeCategory(category);
    setSuccessMessage('Category removed');
    setTimeout(() => setSuccessMessage(null), 2000);
  }

  return (
    <Screen scroll>
      {successMessage && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity onPress={() => setRole(null)}>
          <Text style={styles.switchRole}>Switch role</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${revenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Add New Item"
          onPress={() => navigation.navigate('AddEditItem')}
          style={styles.actionButton}
        />
        <Button
          title="View Orders"
          variant="secondary"
          onPress={() => navigation.navigate('AdminOrders')}
          style={styles.actionButton}
        />
      </View>

      <Text style={styles.sectionTitle}>Manage Categories</Text>
      <View style={styles.categoryInputRow}>
        <TextInput
          style={styles.categoryInput}
          value={newCategory}
          onChangeText={setNewCategory}
          placeholder="New category name"
        />
        <TouchableOpacity style={styles.categoryAddButton} onPress={handleAddCategory}>
          <Ionicons name="add-outline" size={24} color={colors.surface} />
        </TouchableOpacity>
      </View>
      <View style={styles.categoryList}>
        {categories.map((category) => (
          <View key={category} style={styles.categoryChip}>
            <Text style={styles.categoryChipText} numberOfLines={1}>
              {category}
            </Text>
            <TouchableOpacity
              style={styles.categoryDelete}
              onPress={() => handleRemoveCategory(category)}
            >
              <Ionicons name="close-outline" size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Manage Items</Text>
      {products.length === 0 ? (
        <EmptyState message="No products yet. Add your first item." />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.productRow}>
              <View style={styles.thumbnail}>
                <Image
                  source={{ uri: getProductCoverImage(item) }}
                  style={styles.thumbnailImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.productMeta}>
                  {item.category} · ${item.price.toFixed(2)} · Stock {item.stock}
                </Text>
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity
                  style={[styles.iconButton, styles.editButton]}
                  onPress={() =>
                    navigation.navigate('AddEditItem', { productId: item.id })
                  }
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, styles.deleteButton]}
                  onPress={() => handleDelete(item.id)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.danger}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  successBanner: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  successText: {
    color: colors.surface,
    fontSize: fontSizes.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  switchRole: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  categoryInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  categoryAddButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  categoryChipText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    maxWidth: 160,
  },
  categoryDelete: {
    padding: spacing.xs,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  productName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
  },
  productMeta: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  productActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: '#F0F7FF',
    borderColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
    borderColor: colors.danger,
  },
});
