import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '../types';
import { shareOrder } from '../utils/share';
import { createWebSummaryImage } from '../utils/summaryImage';
import { showAlert } from '../lib/telegram';
import { useThemeColors, spacing, borderRadius, fontSizes, ColorPalette } from '../constants/theme';

interface OrderShareButtonProps {
  cart: CartItem[];
  cartTotal: number;
  onShared: () => void;
}

const SUMMARY_WIDTH = 640;

export function OrderShareButton({
  cart,
  cartTotal,
  onShared,
}: OrderShareButtonProps) {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const summaryRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (sharing) return;
    setSharing(true);

    try {
      let summaryUri: string | undefined;

      if (Platform.OS === 'web') {
        summaryUri = createWebSummaryImage(cart, cartTotal, colors) ?? undefined;
      } else if (summaryRef.current) {
        try {
          summaryUri = await captureRef(summaryRef, {
            format: 'png',
            quality: 1,
            result: 'tmpfile',
          });
        } catch (error) {
          console.warn('Failed to capture order summary on native:', error);
        }
      }

      const shared = await shareOrder(cart, cartTotal, summaryUri);
      if (shared) {
        onShared();
      } else if (
        Platform.OS === 'web' &&
        (typeof navigator === 'undefined' || !navigator.share)
      ) {
        await showAlert(
          'Sharing not supported',
          'Your browser does not support sharing files. Try Chrome on Android or Safari on iOS.'
        );
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
      <TouchableOpacity
        style={styles.telegramButton}
        onPress={handleShare}
        activeOpacity={0.8}
        disabled={sharing}
      >
        {sharing ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <>
            <Ionicons name="paper-plane" size={20} color={colors.surface} />
            <Text style={styles.telegramText}>Send Order via Telegram</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Hidden summary view rendered for screenshot capture on native and web. */}
      <View style={styles.hiddenContainer} pointerEvents="none">
        <View
          ref={summaryRef}
          id="order-summary-capture"
          style={styles.summaryCard}
          collapsable={false}
        >
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <Text style={styles.summarySubtitle}>
            {new Date().toLocaleDateString()}
          </Text>

          <View style={styles.divider} />

          {cart.map((item) => {
            const variantLabel =
              item.product.images.length > 1
                ? ` (Variant ${item.selectedImageIndex + 1})`
                : '';
            return (
              <View key={`${item.product.id}-${item.selectedImageIndex}`} style={styles.summaryRow}>
                <Text style={styles.summaryItemName} numberOfLines={2}>
                  {item.quantity} × {item.product.name}
                  {variantLabel}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  ${(item.product.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            );
          })}

          <View style={styles.divider} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              ${cartTotal.toFixed(2)}
            </Text>
          </View>

          <Text style={styles.summaryFooter}>
            Sent from OnlineShop
          </Text>
        </View>
      </View>
    </>
  );
}

const makeStyles = (colors: ColorPalette) => StyleSheet.create({
  telegramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#0088cc',
    paddingVertical: spacing.md,
    marginTop: 8,
  },
  telegramText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.surface,
  },
  hiddenContainer: {
    ...Platform.select({
      default: {
        position: 'absolute',
        top: 0,
        left: -9999,
        opacity: 0,
      },
      web: {
        position: 'absolute',
        top: 0,
        left: -9999,
        opacity: 1,
        pointerEvents: 'none',
      } as any,
    }),
  },
  summaryCard: {
    width: SUMMARY_WIDTH,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  summaryTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  summarySubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  summaryItemName: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  summaryItemPrice: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.text,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.text,
  },
  summaryTotalValue: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.primary,
  },
  summaryFooter: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
