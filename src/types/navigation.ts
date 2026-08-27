export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminProducts: undefined;
  AddEditItem: { productId?: string } | undefined;
};

export type RootStackParamList = {
  Home: undefined;
  AdminStack: undefined;
  AdminLogin: undefined;
  ProductDetail: { productId: string };
};
