# Gold Fashion — Telegram Mini App — Agent Guide

This file is written for AI coding agents working on the **Gold Fashion** project. It summarizes the technology stack, architecture, conventions, and how to build and run the app. When in doubt, prefer the actual source code over this document, and always consult the exact versioned docs for the framework versions listed below.

---

## Project overview

Gold Fashion is a **Telegram Mini App** built with **Expo SDK 54** and **React Native** (rendered via `react-native-web`). It is a product-catalog MVP that lets users browse products, search by name, and filter by category. It also provides an admin mode where products and categories can be created, edited, and deleted.

Key facts:

- **Supabase** is the source of truth for products and categories. AsyncStorage is used as a local cache for instant UI rendering.
- Reads are cache-first: the app shows cached data immediately and refreshes from Supabase in the background.
- Writes are optimistic: the UI updates immediately, then syncs to Supabase. Realtime subscriptions keep clients in sync.
- No real shopper authentication in this phase. Row Level Security policies allow public read/write for the MVP.
- This is a product viewer only; there is no cart, checkout, or payment flow.
- The app is delivered as a **Telegram Mini App**: a static web export loaded inside Telegram's webview on Android, iOS, desktop, and Web Telegram.
- Entry point: `index.ts` registers `App.tsx` as the root component.
- Inside Telegram, the app uses Telegram-native UX primitives (`MainButton`, `BackButton`, popup, haptics) and hides React Navigation headers and web-only headers (`WebHeader`, `AdminHeader`). Outside Telegram, the app still runs as a normal web app for development.

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
| Backend / Database | Supabase | `@supabase/supabase-js` — Postgres + Realtime |
| Local cache | AsyncStorage | `@react-native-async-storage/async-storage@2.2.0` |
| File storage | Supabase Storage | `product-images` bucket for admin uploads |
| Styling | React Native `StyleSheet` | Design tokens in `src/constants/theme.ts` |
| Icons | `@expo/vector-icons` | Ionicons glyph set |
| Image handling | `expo-image-picker`, `expo-image-manipulator` | Admin product images; multi-image gallery support |
| Picker | `@react-native-picker/picker` | Category selector |
| Telegram SDK | `@tma.js/sdk`, `@tma.js/sdk-react` | Mini App initialization, theme, viewport, MainButton, BackButton |

Always consult the exact versioned docs before writing code: <https://docs.expo.dev/versions/v54.0.0/> and <https://docs.telegram-mini-apps.com/>.

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
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Supabase tables, RLS, storage bucket
└── src/
    ├── components/                 # Reusable UI components
    │   ├── AdminHeader.tsx         # Web-only admin navigation header
    │   ├── Button.tsx              # Primary / secondary / danger / outline buttons
    │   ├── CartItemRow.tsx         # Cart line item with quantity controls
    │   ├── CategoryFilter.tsx      # Horizontal category chips + "More" dropdown
    │   ├── EmptyState.tsx          # Empty list placeholder with icon
    │   ├── ProductCard.tsx         # Product grid card
    │   ├── Screen.tsx              # Safe-area wrapper with optional scroll/padding
    │   ├── SearchBar.tsx           # Text input with search/clear icons
    │   └── WebHeader.tsx           # Web-only Gold Fashion header
    ├── constants/
    │   ├── categories.ts           # Default category list, colors, and color helper
    │   └── theme.ts                # Colors, spacing, font sizes, border radius, breakpoints
    ├── context/
    │   └── AppContext.tsx          # Global state, reducer, actions, and persistence hooks
    ├── data/
    │   └── seedProducts.ts         # Default product catalog
    ├── hooks/
    │   ├── useResponsive.ts        # useWindowDimensions-based breakpoint helper
    │   ├── useTelegram.ts          # Telegram state hook
    │   ├── useTelegramBackButton.ts # Telegram native back button hook
    │   └── useTelegramMainButton.ts # Telegram native main button hook
    ├── lib/
    │   ├── supabase.ts             # Supabase client initialization
    │   └── telegram.ts             # Telegram Mini Apps SDK helpers
    ├── navigation/
    │   ├── AppNavigator.tsx        # Root navigator; role-based routing; hides headers in Telegram
    │   ├── AdminStackNavigator.tsx # Admin screens stack
    │   └── UserTabNavigator.tsx    # Shopper bottom-tabs (Home)
    ├── screens/
    │   ├── admin/
    │   │   ├── AdminDashboardScreen.tsx  # Product/category management and stats
    │   │   └── AddEditItemScreen.tsx     # Create/edit product with multi-image upload
    │   └── user/
    │       ├── HomeScreen.tsx            # Product grid with search and category filter
    │       └── ProductDetailScreen.tsx   # Product gallery and details
    ├── services/
    │   ├── cache.ts                # AsyncStorage cache helpers
    │   ├── categories.ts           # Category CRUD + realtime
    │   ├── images.ts               # Supabase Storage upload/delete
    │   └── products.ts             # Product CRUD + realtime
    ├── types/
    │   ├── index.ts                # Domain types (Product, Order, CartItem, etc.)
    │   └── navigation.ts           # React Navigation param lists
    └── utils/
        ├── images.ts               # Placeholder image generation + cover/gallery helpers
        ├── storage.ts              # AsyncStorage read/write for theme only
        └── validation.ts           # Ethiopian phone number validation
```

---

## Build and run commands

Requirements:

- Node.js `22+`
- npm `10+`
- A Telegram bot (for registering the Mini App with BotFather)
- A public HTTPS URL to host the static web export

Install dependencies and start the development server for the web target:

```bash
npm install
npm run web
```

Build the static web export for Telegram Mini App deployment:

```bash
npx expo export --platform web
```

Deploy the `dist/` folder to any static HTTPS host, then register the deployed URL with BotFather via `/myapps` or `/newapp`.

Type checking:

```bash
npx tsc --noEmit
```

---

## Architecture notes

### State management

All shared state lives in `src/context/AppContext.tsx`:

- A single `useReducer` manages `role`, `products`, and `categories`.
- On first mount the app loads products and categories from the AsyncStorage cache immediately so the UI renders without waiting on the network.
- A background sync then fetches fresh data from Supabase and replaces the local cache and state.
- Mutations are optimistic: the reducer updates local state first, the cache is updated, and then the change is sent to Supabase. If the call fails, the local change is rolled back.
- Supabase Realtime subscriptions listen for product and category changes and refresh the local state + cache automatically.

Actions:

- `SET_ROLE`, `SET_PRODUCTS`, `ADD_PRODUCT`, `UPDATE_PRODUCT`, `DELETE_PRODUCT`
- `SET_CATEGORIES`, `ADD_CATEGORY`, `REMOVE_CATEGORY`

### Navigation

`AppNavigator.tsx` switches the root navigator based on `role`:

- `role === 'user'` → `UserTabs` plus `ProductDetail` and a hidden `AdminLogin` route
- `role === 'admin'` → `AdminStack` plus shared `ProductDetail`

The app starts as a shopper by default. Inside Telegram, React Navigation screen headers are hidden and the app relies on Telegram's native `BackButton` (managed by `useTelegramBackButton`). Outside Telegram, the usual headers are shown.

Admins reach `AdminLogin` by typing the secret keyword (`ADMIN_KEYWORD` in `src/constants/admin.ts`) into the home-screen search bar, then entering the password configured in `EXPO_PUBLIC_ADMIN_PASSWORD`. The admin role is intentionally not restored on reload; refreshing the Mini App returns the user to the shopper experience. An **Exit admin** button is available on every admin screen to sign out manually.

Param lists are defined in `src/types/navigation.ts`.

### Telegram Mini App integration

- `src/lib/telegram.ts` initializes the `@tma.js/sdk`, mounts UI components, expands the viewport, and exposes safe helpers (`isTelegram`, `setMainButton`, `setBackButton`, `showAlert`, `hapticNotification`, etc.).
- `App.tsx` calls `initTelegram()` once on mount.
- `src/hooks/useTelegram.ts` exposes Telegram state (`isInTelegram`, `themeParams`, `viewport`, `telegramUser`) to React components.
- `src/hooks/useTelegramMainButton.ts` and `src/hooks/useTelegramBackButton.ts` manage the lifecycle of Telegram's native buttons.
- `src/constants/theme.ts` falls back to Telegram theme parameters when running inside Telegram.
- `WebHeader.tsx` and `AdminHeader.tsx` skip rendering inside Telegram.
- All `Alert.alert` calls route through `showAlert`, which uses Telegram's native popup when available.

### Data model

- `Product`: `id`, `name`, `description`, `price`, `category`, `images` (string array), `coverImageIndex`, `createdAt`
- `Category`: arbitrary string; defaults are `Clothing`, `Books`, `Sports`, `Electronics`, `Accessories`

### Images

- Placeholder images are generated with `placehold.co`, colored by category.
- Products support multiple images. `coverImageIndex` selects which image is shown in cards and lists.
- Admin image uploads allow multiple selections and are resized to a max width of 800px.
- Resized images are uploaded to the Supabase Storage `product-images` bucket; the product record stores the public URL.
- `utils/images.ts` provides `getProductCoverImage` and `getProductGalleryImages` for cover and gallery rendering.
- `services/images.ts` handles upload, deletion, and URL parsing.

### Persistence keys

AsyncStorage is only used for the local cache and theme:

- `@onlineshop_products` (cache)
- `@onlineshop_categories` (cache)
- `@onlineshop_theme`

---

## Supabase setup

1. Create a project at https://supabase.com.
2. Copy the **Project URL** and **anon public API key**.
3. Create a `.env` file in the project root from `.env.example`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
   ```
4. Run the migration in `supabase/migrations/001_initial_schema.sql` from the Supabase SQL Editor.
5. Build the web export (`npx expo export --platform web`) and deploy the `dist/` folder to a public HTTPS URL.
6. Register the deployed URL as a Telegram Mini App with BotFather (`/myapps` or `/newapp`).

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
- Web-specific UI (headers, footers, hover cursors) is gated with `Platform.OS === 'web'` checks.
- Telegram-specific behavior is gated with `isTelegram()` from `src/lib/telegram.ts`. Prefer the provided hooks (`useTelegram`, `useTelegramMainButton`, `useTelegramBackButton`) over direct SDK calls in components.

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

- **Admin authentication.** Admin access requires signing in through Supabase Auth with the email/password configured in `EXPO_PUBLIC_ADMIN_EMAIL` and `EXPO_PUBLIC_ADMIN_PASSWORD`. Supabase RLS policies enforce that only authenticated admins can create, update, or delete products, categories, and product images. Shoppers remain unauthenticated.
- **No payment or checkout.** This app is a product viewer only.
- **Public reads, authenticated writes.** Products and categories are readable by everyone so shoppers can browse.
- **Local cache.** AsyncStorage data is stored unencrypted on the device. Do not store real payment data, passwords, or PII in this app.
- **Placeholder images** are loaded from an external service (`placehold.co`) over HTTPS. If network access is restricted, those images will not render.
- Admin product images are uploaded to Supabase Storage. Storage objects are not automatically deleted when a product is removed (deletion is best-effort).
- **Telegram initData.** The app reads `initData` to obtain the Telegram user context, but it does not validate the initData signature server-side in this MVP. If you use initData for authorization or personalization, validate the hash on your backend.
- **Telegram initData.** Do not expose sensitive tokens or secrets in the frontend.

---

## Useful references

- Expo SDK 54 docs: <https://docs.expo.dev/versions/v54.0.0/>
- Telegram Mini Apps docs: <https://docs.telegram-mini-apps.com/>
- React Navigation v7: <https://reactnavigation.org/docs/getting-started/>
- AsyncStorage: <https://react-native-async-storage.github.io/async-storage/>
- Supabase JavaScript client: <https://supabase.com/docs/reference/javascript/>
- Supabase Realtime: <https://supabase.com/docs/guides/realtime>
