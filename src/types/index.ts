export type Category = string;

export type Role = 'user' | 'admin';

export type Theme = 'light' | 'dark';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: Category[];
  images: string[];
  coverImageIndex: number;
  createdAt: string;
  /** Telegram message IDs of the channel posts this product was imported from. */
  telegramMessageIds?: number[];
  /** The captioned Telegram message that anchors the product group. */
  telegramPrimaryMessageId?: number;
  /** Drafts are hidden from shoppers; saving in the admin panel publishes them. */
  isDraft?: boolean;
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
