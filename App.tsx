import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initTelegram } from './src/lib/telegram';

function TelegramInitializer() {
  useEffect(() => {
    return initTelegram();
  }, []);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <TelegramInitializer />
      <AppNavigator />
      <StatusBar style="auto" />
    </AppProvider>
  );
}
