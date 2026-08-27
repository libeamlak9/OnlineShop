import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { UserTabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/user/HomeScreen';
import { useThemeColors } from '../constants/theme';
import { isTelegram } from '../lib/telegram';

const Tab = createBottomTabNavigator<UserTabParamList>();

export function UserTabNavigator() {
  const colors = useThemeColors();
  const inTelegram = isTelegram();
  const hideTabBar = Platform.OS === 'web' && !inTelegram;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: hideTabBar ? { display: 'none' } : {
          height: 50,
          paddingBottom: 4,
          paddingTop: 0,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          lineHeight: 12,
          marginTop: 0,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
