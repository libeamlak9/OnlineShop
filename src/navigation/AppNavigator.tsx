import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useApp } from '../context/AppContext';
import { isTelegram } from '../lib/telegram';
import { UserTabNavigator } from './UserTabNavigator';
import { AdminStackNavigator } from './AdminStackNavigator';
import { ProductDetailScreen } from '../screens/user/ProductDetailScreen';

import { OrderDetailScreen } from '../screens/user/OrderDetailScreen';
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
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{ headerShown: !inTelegram, title: 'Order Details' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="UserTabs" component={UserTabNavigator} />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ headerShown: !inTelegram, title: 'Product' }}
            />

            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{ headerShown: !inTelegram, title: 'Order Details' }}
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
