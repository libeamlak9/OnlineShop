export type Category = string;

export type Role = 'user' | 'admin';

export type Theme = 'light' | 'dark';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  images: string[];
  coverImageIndex: number;
  createdAt: string;
}

export interface AppState {
  role: Role;
  theme: Theme;
  isThemeSetByUser: boolean;
  products: Product[];
  categories: Category[];
}

export type AppAction =
  | { type: 'SET_ROLE'; payload: Role }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'REMOVE_CATEGORY'; payload: Category };
