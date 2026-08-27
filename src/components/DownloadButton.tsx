import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, ColorPalette } from '../constants/theme';

interface DownloadButtonProps {
  onPress: () => void;
  size?: number;
}

export function DownloadButton({ onPress, size = 20 }: DownloadButtonProps) {
  const colors = useThemeColors();
  const styles = makeStyles(colors);

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel="Download image"
    >
      <Ionicons name="download-outline" size={size} color={colors.surface} />
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
