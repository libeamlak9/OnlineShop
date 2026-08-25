import { Platform, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { WebHeader } from '../../components/WebHeader';
import { useThemeColors, spacing, fontSizes, ColorPalette } from '../../constants/theme';

export function OrdersScreen() {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const isWeb = Platform.OS === 'web';

  return (
    <>
      {isWeb && <WebHeader showSearch={false} />}
      <Screen>
        <View style={styles.container}>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>Coming soon</Text>
        </View>
      </Screen>
    </>
  );
}

const makeStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      fontSize: fontSizes.xxl,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: fontSizes.md,
      color: colors.textSecondary,
    },
  });
