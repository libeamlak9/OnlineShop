import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../types/navigation';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AddEditItemScreen } from '../screens/admin/AddEditItemScreen';
import { AdminOrdersScreen } from '../screens/admin/AdminOrdersScreen';
import { AdminUserOrdersScreen } from '../screens/admin/AdminUserOrdersScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: Platform.OS !== 'web' }}>
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Admin Dashboard' }}
      />
      <Stack.Screen
        name="AddEditItem"
        component={AddEditItemScreen}
        options={{ title: 'Item' }}
      />
      <Stack.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{ title: 'All Orders' }}
      />
      <Stack.Screen
        name="AdminUserOrders"
        component={AdminUserOrdersScreen}
        options={{ title: 'Customer Orders' }}
      />
    </Stack.Navigator>
  );
}
