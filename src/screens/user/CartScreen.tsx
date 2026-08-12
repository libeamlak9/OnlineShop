import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { CartItemRow } from '../../components/CartItemRow';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../types/navigation';
import { colors, spacing, fontSizes } from '../../constants/theme';

const MAX_WIDTH = 900;

export function CartScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cart, cartTotal, cartCount, updateCartQuantity, removeFromCart } = useApp();

  if (cart.length === 0) {
    return (
      <Screen>
        <EmptyState message="Your cart is empty." icon="cart-outline" />
      </Screen>
    );
  }

  return (
    <Screen noPadding edges={['top', 'left', 'right']}>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onIncrease={() =>
              updateCartQuantity(item.product.id, item.quantity + 1)
            }
            onDecrease={() =>
              updateCartQuantity(item.product.id, item.quantity - 1)
            }
            onRemove={() => removeFromCart(item.product.id)}
          />
        )}
      />
      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <View style={styles.row}>
            <Text style={styles.label}>Items</Text>
            <Text style={styles.value}>{cartCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${cartTotal.toFixed(2)}</Text>
          </View>
          <Button
            title="Proceed to Checkout"
            onPress={() => navigation.navigate('Checkout')}
            style={styles.checkoutButton}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'web' ? 24 : 200,
    maxWidth: MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  footer: {
    ...Platform.select({
      default: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
      },
      web: {
        position: 'relative',
      },
    }),
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  footerInner: {
    maxWidth: MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  value: {
    fontSize: fontSizes.md,
    color: colors.text,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  checkoutButton: {
    marginTop: 8,
  },
});
