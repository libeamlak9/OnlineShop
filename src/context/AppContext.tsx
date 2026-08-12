import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import { AppAction, AppState, CartItem, Order, Product, Role } from '../types';
import {
  loadCategories,
  loadOrders,
  loadProducts,
  saveCategories,
  saveOrders,
  saveProducts,
} from '../utils/storage';
import { seedProducts } from '../data/seedProducts';
import { DEFAULT_CATEGORIES } from '../constants/categories';

const initialState: AppState = {
  role: null,
  products: [],
  cart: [],
  orders: [],
  categories: DEFAULT_CATEGORIES,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.payload };

    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };

    case 'ADD_PRODUCT':
      return { ...state, products: [action.payload, ...state.products] };

    case 'UPDATE_PRODUCT': {
      const updated = state.products.map((p) =>
        p.id === action.payload.id ? action.payload : p
      );
      return { ...state, products: updated };
    }

    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };

    case 'ADD_TO_CART': {
      const existing = state.cart.find(
        (item) => item.product.id === action.payload.id
      );
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.product.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { product: action.payload, quantity: 1 }],
      };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter((item) => item.product.id !== action.payload),
      };

    case 'UPDATE_CART_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter(
            (item) => item.product.id !== action.payload.productId
          ),
        };
      }
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'SET_ORDERS':
      return { ...state, orders: action.payload };

    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };

    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    case 'ADD_CATEGORY':
      if (state.categories.includes(action.payload)) return state;
      return { ...state, categories: [...state.categories, action.payload] };

    case 'REMOVE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((c) => c !== action.payload),
      };

    default:
      return state;
  }
}

function migrateLegacyProducts(products: Product[]): Product[] {
  return products.map((product) => {
    const legacy = product as Product & { image?: string };
    if (legacy.image && (!legacy.images || legacy.images.length === 0)) {
      return {
        ...legacy,
        images: [legacy.image],
        coverImageIndex: legacy.coverImageIndex ?? 0,
      };
    }
    return product;
  });
}

interface AppContextValue extends AppState {
  setRole: (role: Role) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addOrder: (order: Order) => void;
  setCategories: (categories: string[]) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  cartTotal: number;
  cartCount: number;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function hydrate() {
      const storedProducts = await loadProducts();
      const storedOrders = await loadOrders();
      const storedCategories = await loadCategories();

      const migratedProducts = migrateLegacyProducts(storedProducts ?? seedProducts);
      dispatch({
        type: 'SET_PRODUCTS',
        payload: migratedProducts,
      });
      if (storedProducts === null || JSON.stringify(storedProducts) !== JSON.stringify(migratedProducts)) {
        await saveProducts(migratedProducts);
      }

      dispatch({
        type: 'SET_ORDERS',
        payload: storedOrders ?? [],
      });

      dispatch({
        type: 'SET_CATEGORIES',
        payload: storedCategories ?? DEFAULT_CATEGORIES,
      });
      if (storedCategories === null) {
        await saveCategories(DEFAULT_CATEGORIES);
      }
    }
    hydrate();
  }, []);

  useEffect(() => {
    saveProducts(state.products);
  }, [state.products]);

  useEffect(() => {
    saveOrders(state.orders);
  }, [state.orders]);

  useEffect(() => {
    saveCategories(state.categories);
  }, [state.categories]);

  const cartTotal = state.cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  const value: AppContextValue = {
    ...state,
    setRole: (role) => dispatch({ type: 'SET_ROLE', payload: role }),
    addProduct: (product) => dispatch({ type: 'ADD_PRODUCT', payload: product }),
    updateProduct: (product) => dispatch({ type: 'UPDATE_PRODUCT', payload: product }),
    deleteProduct: (id) => dispatch({ type: 'DELETE_PRODUCT', payload: id }),
    addToCart: (product) => dispatch({ type: 'ADD_TO_CART', payload: product }),
    removeFromCart: (productId) =>
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId }),
    updateCartQuantity: (productId, quantity) =>
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId, quantity } }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    addOrder: (order) => dispatch({ type: 'ADD_ORDER', payload: order }),
    setCategories: (categories) =>
      dispatch({ type: 'SET_CATEGORIES', payload: categories }),
    addCategory: (category) => dispatch({ type: 'ADD_CATEGORY', payload: category }),
    removeCategory: (category) =>
      dispatch({ type: 'REMOVE_CATEGORY', payload: category }),
    cartTotal,
    cartCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
