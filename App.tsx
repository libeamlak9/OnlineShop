import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initTelegram } from './src/lib/telegram';
import { isSupabaseConfigured } from './src/lib/supabase';
import { colors, fontSizes, spacing } from './src/constants/theme';

function TelegramInitializer() {
  useEffect(() => {
    return initTelegram();
  }, []);
  return null;
}

function ConfigErrorScreen() {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Configuration Error</Text>
      <Text style={styles.errorMessage}>
        Supabase environment variables are missing.{'\n\n'}
        Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then rebuild and redeploy.
      </Text>
    </View>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return <ConfigErrorScreen />;
  }

  return (
    <AppProvider>
      <TelegramInitializer />
      <AppNavigator />
      <StatusBar style="auto" />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: colors.danger,
    marginBottom: spacing.md,
  },
  errorMessage: {
    fontSize: fontSizes.md,
    color: colors.text,
    textAlign: 'center',
  },
});
