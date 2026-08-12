# OnlineShop — Agent Guide

This file is written for AI coding agents working on the **OnlineShop** project. It summarizes the technology stack, architecture, conventions, and how to build and run the app. When in doubt, prefer the actual source code over this document, and always consult the exact versioned docs for the framework versions listed below.

---

## Project overview

OnlineShop is a cross-platform mobile app built with **Expo SDK 54** and **React Native**. It is a student shopping MVP that lets users browse school supplies, add items to a cart, and check out. It also provides an admin mode where products can be created, edited, and deleted.

Key facts:

- Single-user, local-only data. Products and orders are persisted on the device with `@react-native-async-storage/async-storage`.
- No real backend or payment gateway. Online payment is simulated.
- Supports **iOS**, **Android**, and **web** targets through Expo.
- Entry point: `index.ts` registers `App.tsx` as the root component.

---

## Technology stack

| Layer | Technology | Version / Notes |
|-------|------------|-----------------|
| Framework | Expo SDK | `~54.0.36` (managed workflow) |
| UI library | React Native | `0.81.5` |
| Web runtime | react-native-web | `^0.21.0` |
| React | react / react-dom | `19.1.0` |
| Language | TypeScript | `~5.9.2`, strict mode enabled |
| Navigation | React Navigation v7 | `@react-navigation/native` + native-stack + bottom-tabs |
| State | React Context + `useReducer` | Global state in `src/context/AppContext.tsx` |
| Persistence | AsyncStorage | `@react-native-async-storage/async-storage@2.2.0` |
| Styling | React Native `StyleSheet` | Design tokens in `src/constants/theme.ts` |
| Icons | `@expo/vector-icons` | Ionicons glyph set |
| Image handling | `expo-image-picker`, `expo-image-manipulator` | Admin product images |
| Picker | `@react-native-picker/picker` | Category selector |

Always consult the exact versioned docs before writing code: <https://docs.expo.dev/versions/v54.0.0/>.

---

## Project structure

```
.
├── App.tsx                         # Root component: AppProvider + AppNavigator
├── index.ts                        # Registers the root component with Expo
├── app.json                        # Expo app manifest
├── package.json                    # Dependencies and npm scripts
├── tsconfig.json                   # Extends expo/tsconfig.base, strict: true
├── start-app.bat                   # Windows quick-start helper
├── assets/                         # App icons, splash, favicon
└── src/
    ├── components/                 # Reusable UI components
    │   ├── Button.tsx              # Primary / secondary / danger / outline buttons
    │   ├── CartItemRow.tsx         # Cart line item with quantity controls
    │   ├── CategoryFilter.tsx      # Horizontal category chips + "More" dropdown
    │   ├── EmptyState.tsx          # Empty list placeholder with icon
    │   ├── ProductCard.tsx         # Product grid card
    │   ├── Screen.tsx              # Safe-area wrapper with optional scroll/padding
    │   └── SearchBar.tsx           # Text input with search/clear icons
    ├── constants/
    │   ├── categories.ts           # Category list and category colors
    │   └── theme.ts                # Colors, spacing, font sizes, border radius, breakpoints
    ├── context/
    │   └── AppContext.tsx          # Global state, reducer, actions, and persistence hooks
    ├── data/
    │   └── seedProducts.ts         # Default product catalog
    ├── hooks/
    │   └── useResponsive.ts        # useWindowDimensions-based breakpoint helper
    ├── navigation/
    │   ├── AppNavigator.tsx        # Root native-stack navigator; role-based routing
    │   ├── AdminStackNavigator.tsx # Admin screens stack
    │   └── UserTabNavigator.tsx    # Student bottom-tabs (Home, Cart, Orders)
    ├── screens/
    │   ├── RoleSelectScreen.tsx    # Landing role chooser
    │   ├── admin/
    │   │   ├── AdminDashboardScreen.tsx
    │   │   ├── AdminOrdersScreen.tsx
    │   │   └── AddEditItemScreen.tsx
    │   └── user/
    │       ├── HomeScreen.tsx
    │       ├── ProductDetailScreen.tsx
    │       ├── CartScreen.tsx
    │       ├── CheckoutScreen.tsx
    │       ├── OrdersScreen.tsx
    │       └── OrderDetailScreen.tsx
    ├── types/
    │   ├── index.ts                # Domain types (Product, Order, CartItem, etc.)
    │   └── navigation.ts           # React Navigation param lists
    └── utils/
        ├── images.ts               # Placeholder image generation + resize helper
        └── storage.ts              # AsyncStorage read/write for products and orders
```

---

## Build and run commands

Requirements:

- Node.js `22+`
- npm `10+`
- Expo Go app on a physical device, or an Android/iOS emulator

Install dependencies and start the development server:

```bash
npm install
npm start
```

Run on a specific platform:

```bash
npm run android   # Android emulator or connected device
npm run ios       # iOS simulator (macOS only)
npm run web       # Web browser
```

Windows quick start: double-click `start-app.bat`, which simply runs `npm start` from the project folder.

---

## Architecture notes

### State management

All shared state lives in `src/context/AppContext.tsx`:

- A single `useReducer` manages `role`, `products`, `cart`, and `orders`.
- On first mount, products and orders are hydrated from `AsyncStorage`. If no products exist, `seedProducts` are loaded and saved.
- Every change to `products` or `orders` is persisted via `useEffect`.
- Derived values (`cartTotal`, `cartCount`) are computed at render time.

Actions:

- `SET_ROLE`, `SET_PRODUCTS`, `ADD_PRODUCT`, `UPDATE_PRODUCT`, `DELETE_PRODUCT`
- `ADD_TO_CART`, `REMOVE_FROM_CART`, `UPDATE_CART_QUANTITY`, `CLEAR_CART`
- `SET_ORDERS`, `ADD_ORDER`

### Navigation

`AppNavigator.tsx` switches the root navigator based on `role`:

- `role === null` → `RoleSelectScreen`
- `role === 'admin'` → `AdminStack` plus shared `ProductDetail` and `OrderDetail`
- `role === 'user'` → `UserTabs` plus `ProductDetail`, `Checkout`, and `OrderDetail`

Param lists are defined in `src/types/navigation.ts`.

### Data model

- `Product`: `id`, `name`, `description`, `price`, `category`, `image`, `stock`, `createdAt`
- `CartItem`: `{ product, quantity }`
- `Order`: `id`, `items`, `total`, `paymentMethod`, `status`, `createdAt`
- `Category`: one of `School Uniform`, `Stationery`, `Books`, `Sports`, `Electronics`, `Accessories`
- `PaymentMethod`: `cash_on_delivery` | `online_payment`
- `OrderStatus`: `pending` | `paid` | `delivered`

### Images

- Placeholder images are generated with `placehold.co`, colored by category.
- Admin image uploads are resized to a max width of 800px and saved as JPEG.
- `utils/images.ts:getProductImage` falls back to a placeholder when no image URL is provided.

### Persistence keys

- `@onlineshop_products`
- `@onlineshop_orders`

---

## Code style guidelines

- TypeScript is configured with `"strict": true`. Avoid implicit `any` and keep types explicit.
- Use named exports for components and helpers (`export function Foo()`).
- Components live in `src/components/` or `src/screens/`.
- Prefer functional components and hooks; the project does not use class components.
- Styles are colocated in each file using `StyleSheet.create()` and reference tokens from `src/constants/theme.ts`.
- Import order observed in existing files: React / navigation hooks, then components, then context, then types, then constants.
- Use `colors.surface` for white/card backgrounds and `colors.background` for page backgrounds.
- Use `SafeAreaView` from `react-native-safe-area-context` via the `Screen` component.
- Keep screens pure of layout concerns where possible; reuse `Screen`, `Button`, and `EmptyState`.

---

## Testing instructions

The project currently has **no test framework configured** and no test files. Before adding tests, choose a stack consistent with the Expo/React Native ecosystem (for example, Jest with `jest-expo` and React Native Testing Library) and update `package.json` scripts accordingly.

Type checking can be run manually with the installed TypeScript compiler:

```bash
npx tsc --noEmit
```

There is no ESLint or Prettier configuration present. If you add one, keep rules aligned with the existing code style.

---

## Security considerations

- **No real authentication.** Role selection (`user` vs `admin`) is purely client-side state and can be switched at any time.
- **No real payment processing.** Card details entered on the checkout screen are validated only by length and are never transmitted or stored securely.
- **Local storage only.** AsyncStorage data is stored unencrypted on the device. Do not store real payment data, passwords, or PII in this app.
- **Placeholder images** are loaded from an external service (`placehold.co`) over HTTPS. If network access is restricted, those images will not render.
- Admin product images are picked from the device media library and stored as local file URIs. These URIs may not be portable across app reinstalls or devices.

---

## Useful references

- Expo SDK 54 docs: <https://docs.expo.dev/versions/v54.0.0/>
- React Navigation v7: <https://reactnavigation.org/docs/getting-started/>
- AsyncStorage: <https://react-native-async-storage.github.io/async-storage/>
