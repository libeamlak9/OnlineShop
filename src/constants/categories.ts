import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  'School Uniform',
  'Stationery',
  'Books',
  'Sports',
  'Electronics',
  'Accessories',
];

export const CATEGORY_COLORS: Record<string, string> = {
  'School Uniform': '#4A90E2',
  Stationery: '#F5A623',
  Books: '#7ED321',
  Sports: '#D0021B',
  Electronics: '#9013FE',
  Accessories: '#50E3C2',
};

const FALLBACK_PALETTE = [
  '#4A90E2',
  '#F5A623',
  '#7ED321',
  '#D0021B',
  '#9013FE',
  '#50E3C2',
  '#E65100',
  '#00BCD4',
  '#8BC34A',
  '#FF5722',
];

export function getCategoryColor(category: Category): string {
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index];
}
