import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { useApp } from '../../context/AppContext';
import { getProductCoverImage } from '../../utils/images';
import { RootStackParamList } from '../../types/navigation';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';

export function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { orders } = useApp();

  if (orders.length === 0) {
    return (
      <Screen>
        <EmptyState message="No orders yet." icon="receipt-outline" />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Text style={styles.title}>My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const firstItem = item.items[0];
          const imageUri = firstItem ? getProductCoverImage(firstItem.product) : '';
          const itemNames = item.items.map((i) => i.product.name).join(', ');

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            >
              <View style={styles.thumbnail}>
                <Image source={{ uri: imageUri }} style={styles.thumbnailImage} resizeMode="contain" />
              </View>
              <View style={styles.info}>
                <View style={styles.row}>
                  <Text style={styles.name} numberOfLines={1}>
                    {itemNames}
                  </Text>
                  <Text style={styles.price}>${item.total.toFixed(2)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.date}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      item.status === 'paid' && styles.paidBadge,
                      item.status === 'pending' && styles.pendingBadge,
                      item.status === 'delivered' && styles.deliveredBadge,
                    ]}
                  >
                    <Text style={styles.badgeText}>{item.status}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  card: {
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
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  price: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.primary,
  },
  date: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.border,
    marginLeft: spacing.sm,
  },
  pendingBadge: {
    backgroundColor: colors.warning,
  },
  paidBadge: {
    backgroundColor: colors.success,
  },
  deliveredBadge: {
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.surface,
    textTransform: 'capitalize',
  },
});
