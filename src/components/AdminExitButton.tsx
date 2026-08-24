import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { useThemeColors, spacing, borderRadius, fontSizes, ColorPalette } from '../constants/theme';

export function AdminExitButton() {
  const { signOutAdmin } = useApp();
  const colors = useThemeColors();
  const styles = makeStyles(colors);

  return (
    <TouchableOpacity style={styles.button} onPress={signOutAdmin}>
      <Text style={styles.text}>Exit admin</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    button: {
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignSelf: 'flex-start',
    },
    text: {
      color: colors.danger,
      fontSize: fontSizes.sm,
      fontWeight: '600',
    },
  });
