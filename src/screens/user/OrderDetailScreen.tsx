import { useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { useApp } from '../../context/AppContext';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';

export function OrderDetailScreen() {
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };
  const { orders } = useApp();

  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <Screen>
        <EmptyState message="Order not found." icon="alert-circle-outline" />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>Order Details</Text>
          <Text style={styles.date}>
            {new Date(order.createdAt).toLocaleString()}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            order.status === 'paid' && styles.paidBadge,
            order.status === 'pending' && styles.pendingBadge,
            order.status === 'delivered' && styles.deliveredBadge,
          ]}
        >
          <Text style={styles.badgeText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item) => (
          <View key={item.product.id} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {item.quantity} × {item.product.name}
            </Text>
            <Text style={styles.itemPrice}>
              ${(item.product.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Location</Text>
        <Text style={styles.paymentText}>{order.location || 'Not provided'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phone Number</Text>
        <Text style={styles.paymentText}>{order.phoneNumber || 'Not provided'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <Text style={styles.paymentText}>
          {order.paymentMethod === 'cash_on_delivery'
            ? 'Cash on Delivery'
            : 'Paid Online'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  orderId: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.text,
  },
  date: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.border,
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
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  itemName: {
    fontSize: fontSizes.md,
    color: colors.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  paymentText: {
    fontSize: fontSizes.md,
    color: colors.text,
    textTransform: 'capitalize',
  },
});
