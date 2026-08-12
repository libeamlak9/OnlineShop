import { Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { colors, spacing, fontSizes } from '../constants/theme';

export function RoleSelectScreen() {
  const { setRole } = useApp();

  return (
    <Screen centered>
      <View style={styles.card}>
        <Text style={styles.title}>Student Shop</Text>
        <Text style={styles.subtitle}>
          School supplies, uniforms, books, and more.
        </Text>
        <View style={styles.buttons}>
          <Button
            title="Shop as Student"
            onPress={() => setRole('user')}
            style={styles.button}
          />
          <Button
            title="Manage as Admin"
            variant="secondary"
            onPress={() => setRole('admin')}
            style={styles.button}
          />
        </View>
      </View>
      <StatusBar style="auto" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 420 : '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    width: '100%',
  },
});
