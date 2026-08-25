import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { CartItemRow } from '../../components/CartItemRow';
import { EmptyState } from '../../components/EmptyState';
import { WebHeader } from '../../components/WebHeader';
import { Button } from '../../components/Button';
import { useApp } from '../../context/AppContext';

import {
  buildNotificationPayload,
  sendOrderNotification,
} from '../../services/notifications';
import { hapticNotification, openTelegramChat, showAlert } from '../../lib/telegram';
import { RootStackParamList } from '../../types/navigation';
import { Order } from '../../types';
import { useThemeColors, spacing, borderRadius, fontSizes, ColorPalette } from '../../constants/theme';

const MAX_WIDTH = 900;

export function CartScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cart, cartTotal, cartCount, updateCartQuantity, removeFromCart, addOrder, clearCart } = useApp();
  const colors = useThemeColors();
  const styles = makeStyles(colors);

  const isWeb = Platform.OS === 'web';

  function getAdminTelegramUsername(): string | undefined {
    return process.env.EXPO_PUBLIC_ADMIN_TELEGRAM_USERNAME;
  }

  async function handleSubmitOrder() {
    if (cart.length === 0) return;

    const paymentMethod = 'cash_on_delivery';
    const baseTime = Date.now();
    const orders: Order[] = cart.map((cartItem, index) => ({
      id: (baseTime + index).toString(),
      items: [cartItem],
      total: cartItem.product.price * cartItem.quantity,
      paymentMethod,
      status: 'pending',
      location: '',
      phoneNumber: '',
      createdAt: new Date().toISOString(),
    }));

    try {
      await Promise.all(orders.map((order) => addOrder(order)));

      let notificationResult: { success: boolean; chatId?: string } = { success: false };
      try {
        const notificationPayload = buildNotificationPayload(
          cart,
          cartTotal,
          colors,
          '',
          ''
        );
        notificationResult = await sendOrderNotification(notificationPayload);
        console.log('Order notification result:', notificationResult);
      } catch (notificationError) {
        console.error('Failed to send order notification:', notificationError);
      }

      clearCart();
      hapticNotification('success');
      await showAlert(
        'Order Submitted',
        `Thank you! Your ${orders.length} order${orders.length > 1 ? 's' : ''} have been submitted.\n\nChat ID: ${notificationResult.chatId ?? 'unknown'}`
      );

      const adminUsername = getAdminTelegramUsername();
      if (adminUsername) {
        await openTelegramChat(adminUsername);
      }
    } catch {
      hapticNotification('error');
      await showAlert('Error', 'Failed to place order. Please check your connection and try again.');
    }
  }

  if (cart.length === 0) {
    return (
      <>
        {isWeb && <WebHeader showSearch={false} />}
        <Screen>
          <EmptyState message="Your cart is empty." icon="cart-outline" />
        </Screen>
      </>
    );
  }

  return (
    <>
      {isWeb && <WebHeader showSearch={false} />}
      <Screen noPadding edges={['top', 'left', 'right']}>
        <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Shopping Cart</Text>
          {isWeb && (
            <TouchableOpacity
              style={styles.homeLink}
              onPress={() => navigation.navigate('UserTabs', { screen: 'Home' })}
            >
              <Ionicons name="arrow-back" size={16} color={colors.primary} />
              <Text style={styles.homeLinkText}>Continue Shopping</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={cart}
          keyExtractor={(item) => `${item.product.id}-${item.selectedImageIndex}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <CartItemRow
              item={item}
              onIncrease={() =>
                updateCartQuantity(
                  item.product.id,
                  item.selectedImageIndex,
                  item.quantity + 1
                )
              }
              onDecrease={() =>
                updateCartQuantity(
                  item.product.id,
                  item.selectedImageIndex,
                  item.quantity - 1
                )
              }
              onRemove={() =>
                removeFromCart(item.product.id, item.selectedImageIndex)
              }
            />
          )}
        />
      </View>

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
            title="Submit Order"
            onPress={handleSubmitOrder}
            disabled={cart.length === 0}
          />
        </View>
      </View>
    </Screen>
    </>
  );
}

const makeStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      maxWidth: MAX_WIDTH,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: fontSizes.xxl,
      fontWeight: '700',
      color: colors.text,
    },
    homeLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    homeLinkText: {
      fontSize: fontSizes.md,
      color: colors.primary,
      fontWeight: '600',
    },
    list: {
      paddingBottom: Platform.OS === 'web' ? 24 : 200,
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
  });
