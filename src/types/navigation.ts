import { NavigatorScreenParams } from '@react-navigation/native';

export type UserTabParamList = {
  Home: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminProducts: undefined;
  AddEditItem: { productId?: string } | undefined;
};

export type RootStackParamList = {
  UserTabs: NavigatorScreenParams<UserTabParamList>;
  AdminStack: NavigatorScreenParams<AdminStackParamList>;
  AdminLogin: undefined;
  ProductDetail: { productId: string };
};
