import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, ColorPalette } from '../constants/theme';

interface DownloadButtonProps {
  onPress: () => unknown;
  size?: number;
}

export function DownloadButton({ onPress, size = 20 }: DownloadButtonProps) {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [pending, setPending] = useState(false);

  async function handlePress() {
    if (pending) return;
    const result = onPress();
    if (result instanceof Promise) {
      setPending(true);
      try {
        await result;
      } catch {
        // The download helper already surfaces failures via alert.
      } finally {
        setPending(false);
      }
    }
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      disabled={pending}
      activeOpacity={0.7}
      accessibilityLabel="Download image"
    >
      {pending ? (
        <ActivityIndicator size="small" color={colors.surface} />
      ) : (
        <Ionicons name="download-outline" size={size} color={colors.surface} />
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
  });
