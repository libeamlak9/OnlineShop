import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, Order, Product } from '../types';

const PRODUCTS_KEY = '@onlineshop_products';
const ORDERS_KEY = '@onlineshop_orders';
const CATEGORIES_KEY = '@onlineshop_categories';

export async function loadProducts(): Promise<Product[] | null> {
  try {
    const json = await AsyncStorage.getItem(PRODUCTS_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export async function saveProducts(products: Product[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch {
    // ignore
  }
}

export async function loadOrders(): Promise<Order[] | null> {
  try {
    const json = await AsyncStorage.getItem(ORDERS_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export async function saveOrders(orders: Order[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

export async function loadCategories(): Promise<Category[] | null> {
  try {
    const json = await AsyncStorage.getItem(CATEGORIES_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export async function saveCategories(categories: Category[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch {
    // ignore
  }
}
