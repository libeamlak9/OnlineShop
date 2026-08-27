import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useApp } from '../context/AppContext';
import { isTelegram } from '../lib/telegram';
import { AdminStackNavigator } from './AdminStackNavigator';
import { HomeScreen } from '../screens/user/HomeScreen';
import { ProductDetailScreen } from '../screens/user/ProductDetailScreen';
import { AdminLoginScreen } from '../screens/AdminLoginScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { role } = useApp();
  const inTelegram = isTelegram();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {role === 'admin' ? (
          <>
            <Stack.Screen name="AdminStack" component={AdminStackNavigator} />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ headerShown: !inTelegram, title: 'Product' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ headerShown: !inTelegram, title: 'Product' }}
            />
            <Stack.Screen
              name="AdminLogin"
              component={AdminLoginScreen}
              options={{ headerShown: !inTelegram, title: 'Admin Login' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
