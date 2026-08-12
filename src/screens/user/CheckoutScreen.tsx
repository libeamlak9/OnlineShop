import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../types/navigation';
import { Order, PaymentMethod } from '../../types';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';

export function CheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cart, cartTotal, clearCart, addOrder } = useApp();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const canPlaceOrder =
    cart.length > 0 &&
    location.trim().length > 0 &&
    phoneNumber.trim().length >= 7 &&
    (paymentMethod === 'cash_on_delivery' ||
      (cardNumber.length >= 12 && expiry.length >= 4 && cvv.length >= 3));

  function handlePlaceOrder() {
    if (cart.length === 0) return;

    const baseTime = Date.now();
    cart.forEach((cartItem, index) => {
      const order: Order = {
        id: (baseTime + index).toString(),
        items: [cartItem],
        total: cartItem.product.price * cartItem.quantity,
        paymentMethod,
        status: paymentMethod === 'online_payment' ? 'paid' : 'pending',
        location: location.trim(),
        phoneNumber: phoneNumber.trim(),
        createdAt: new Date().toISOString(),
      };
      addOrder(order);
    });

    clearCart();

    navigation.navigate('UserTabs', { screen: 'Orders' });
    Alert.alert(
      'Order Placed',
      `Thank you! Your ${cart.length} order${cart.length > 1 ? 's' : ''} have been placed.`
    );
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>Checkout</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {cart.map((item) => (
          <View key={item.product.id} style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {item.quantity} × {item.product.name}
            </Text>
            <Text style={styles.summaryText}>
              ${(item.product.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalText}>${cartTotal.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter delivery location"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <TouchableOption
          label="Cash on Delivery"
          selected={paymentMethod === 'cash_on_delivery'}
          onPress={() => setPaymentMethod('cash_on_delivery')}
        />
        <TouchableOption
          label="Online Payment"
          selected={paymentMethod === 'online_payment'}
          onPress={() => setPaymentMethod('online_payment')}
        />
      </View>

      {paymentMethod === 'online_payment' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Card number"
            keyboardType="number-pad"
            value={cardNumber}
            onChangeText={setCardNumber}
            maxLength={19}
          />
          <View style={styles.cardRow}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="MM/YY"
              keyboardType="number-pad"
              value={expiry}
              onChangeText={setExpiry}
              maxLength={5}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="CVV"
              keyboardType="number-pad"
              value={cvv}
              onChangeText={setCvv}
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>
      )}

      <Button
        title="Place Order"
        onPress={handlePlaceOrder}
        disabled={!canPlaceOrder}
        style={styles.placeButton}
      />
    </Screen>
  );
}

function TouchableOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
    >
      <View style={[styles.radio, selected && styles.radioSelected]} />
      <Text style={styles.optionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  totalText: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0F7FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: fontSizes.md,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  placeButton: {
    marginTop: spacing.md,
  },
});
