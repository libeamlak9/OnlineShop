export type Category = string;

export type Role = 'user' | 'admin' | null;

export type PaymentMethod = 'cash_on_delivery' | 'online_payment';

export type OrderStatus = 'pending' | 'paid' | 'delivered';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  images: string[];
  coverImageIndex: number;
  stock: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  location: string;
  phoneNumber: string;
  createdAt: string;
}

export interface AppState {
  role: Role;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  categories: Category[];
}

export type AppAction =
  | { type: 'SET_ROLE'; payload: Role }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'REMOVE_CATEGORY'; payload: Category };
