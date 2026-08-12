import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { useApp } from '../../context/AppContext';
import { AdminStackParamList } from '../../types/navigation';
import { Order } from '../../types';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';

interface UserOrderGroup {
  phoneNumber: string;
  orders: Order[];
  count: number;
  total: number;
  latestDate: Date;
}

export function AdminOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const { orders } = useApp();

  const grouped = orders.reduce<Record<string, UserOrderGroup>>((acc, order) => {
    const phoneNumber = order.phoneNumber?.trim() || 'No phone number';
    if (!acc[phoneNumber]) {
      acc[phoneNumber] = {
        phoneNumber,
        orders: [],
        count: 0,
        total: 0,
        latestDate: new Date(order.createdAt),
      };
    }
    acc[phoneNumber].orders.push(order);
    acc[phoneNumber].count += 1;
    acc[phoneNumber].total += order.total;
    const orderDate = new Date(order.createdAt);
    if (orderDate > acc[phoneNumber].latestDate) {
      acc[phoneNumber].latestDate = orderDate;
    }
    return acc;
  }, {});

  const userGroups = Object.values(grouped).sort(
    (a, b) => b.latestDate.getTime() - a.latestDate.getTime()
  );

  if (userGroups.length === 0) {
    return (
      <Screen>
        <EmptyState message="No orders yet." icon="receipt-outline" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Orders by Customer</Text>
      <FlatList
        data={userGroups}
        keyExtractor={(item) => item.phoneNumber}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('AdminUserOrders', { phoneNumber: item.phoneNumber })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.phoneNumber} numberOfLines={1}>
                {item.phoneNumber}
              </Text>
              <Text style={styles.orderCount}>
                {item.count} order{item.count === 1 ? '' : 's'}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.total}>${item.total.toFixed(2)}</Text>
              <Text style={styles.date}>
                Last order: {item.latestDate.toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  phoneNumber: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
    marginRight: spacing.md,
  },
  orderCount: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.primary,
  },
  date: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
