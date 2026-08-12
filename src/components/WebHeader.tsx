import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchBar } from './SearchBar';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { RootStackParamList } from '../types/navigation';
import { colors, spacing, borderRadius, fontSizes } from '../constants/theme';

interface WebHeaderProps {
  searchValue?: string;
  onSearchChange?: (text: string) => void;
}

export function WebHeader({ searchValue = '', onSearchChange }: WebHeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cartCount, setRole } = useApp();
  const { isDesktop } = useResponsive();

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.header}>
      <View style={styles.inner}>
        <TouchableOpacity
          style={styles.brand}
          onPress={() => navigation.navigate('UserTabs', { screen: 'Home' })}
        >
          <Ionicons name="storefront-outline" size={28} color={colors.primary} />
          <Text style={styles.brandText}>Student Shop</Text>
        </TouchableOpacity>

        {isDesktop && onSearchChange && (
          <View style={styles.search}>
            <SearchBar value={searchValue} onChangeText={onSearchChange} />
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('UserTabs', { screen: 'Orders' })}
          >
            <Ionicons name="list-outline" size={22} color={colors.text} />
            <Text style={styles.iconLabel}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('UserTabs', { screen: 'Cart' })}
          >
            <View style={styles.cartIcon}>
              <Ionicons name="cart-outline" size={22} color={colors.text} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.iconLabel}>Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.roleButton} onPress={() => setRole(null)}>
            <Text style={styles.roleText}>Switch role</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    ...(Platform.OS === 'web'
      ? ({
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        } as any)
      : {}),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandText: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.text,
  },
  search: {
    flex: 1,
    marginHorizontal: spacing.xl,
    maxWidth: 500,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  iconLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cartIcon: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.price,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  roleButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  roleText: {
    color: colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});
