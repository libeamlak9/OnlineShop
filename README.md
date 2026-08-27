# Gold Fashion — Telegram Mini App

A **Telegram Mini App** built with **Expo SDK 54** and **React Native** (rendered via `react-native-web`) for browsing a product catalog. The same mobile-style UI runs inside Telegram on Android, iOS, desktop, and Web Telegram.

## Features

### Shopper
- Browse products in a responsive grid.
- Search products by name.
- Filter products by category.
- Tap a product to view its gallery, price, and description.

### Admin
- Add, edit, and delete products.
- Upload multiple product images and choose the cover image displayed on the home page.
- Manage custom categories (add/remove).

## Tech stack

- **Framework**: Expo SDK `~54.0.36` (web target)
- **UI**: React Native `0.81.5`, react-native-web `^0.21.0`
- **React**: `19.1.0`
- **Language**: TypeScript `~5.9.2` (strict mode)
- **Navigation**: React Navigation v7
- **State**: React Context + `useReducer`
- **Persistence**: AsyncStorage (`@react-native-async-storage/async-storage`)
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Telegram**: `@tma.js/sdk`, `@tma.js/sdk-react`

## Requirements

- Node.js `22+`
- npm `10+`
- A Telegram bot (for registering the Mini App with BotFather)
- A public HTTPS URL to host the static web export

## Get started

```bash
# Install dependencies
npm install

# Start the development server for the web target
npm run web
```

Open the local URL in a browser. To test inside Telegram, deploy the build first (see below).

## Build for Telegram Mini App

```bash
# Create a static web export in dist/
npx expo export --platform web
```

Deploy the contents of `dist/` to any static HTTPS host (Vercel, Netlify, GitHub Pages, AWS S3, your own server, etc.).

## Register with BotFather

1. Create or open your Telegram bot with [@BotFather](https://t.me/BotFather).
2. Send `/myapps` or `/newapp` and follow the prompts.
3. Provide the deployed HTTPS URL when asked for the Mini App URL.
4. Save the changes and open the Mini App from the bot's menu or attachment button.

## Type checking

```bash
npx tsc --noEmit
```

## Project structure

```
.
├── App.tsx                         # Root component: AppProvider + AppNavigator + Telegram init
├── index.ts                        # Registers the root component with Expo
├── app.json                        # Expo app manifest (web-only target)
├── package.json                    # Dependencies and npm scripts
├── tsconfig.json                   # TypeScript configuration
├── assets/                         # App icons, splash, favicon
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Supabase tables, RLS, storage bucket
└── src/
    ├── components/                 # Reusable UI components
    │   ├── AdminHeader.tsx         # Web-only admin navigation header
    │   ├── Button.tsx              # Primary / secondary / danger / outline buttons
    │   ├── CategoryFilter.tsx      # Horizontal category chips + "More" dropdown
    │   ├── EmptyState.tsx          # Empty list placeholder with icon
    │   ├── ProductCard.tsx         # Product grid card
    │   ├── Screen.tsx              # Safe-area wrapper with optional scroll/padding
    │   ├── SearchBar.tsx           # Text input with search/clear icons
    │   └── WebHeader.tsx           # Web-only Gold Fashion header
    ├── constants/
    │   ├── admin.ts                # Admin keyword and credential helpers
    │   ├── categories.ts           # Default category list and colors
    │   └── theme.ts                # Colors, spacing, font sizes, border radius
    ├── context/
    │   └── AppContext.tsx          # Global state, reducer, actions, persistence
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
    │   ├── AppNavigator.tsx        # Root navigator; hides headers inside Telegram
    │   ├── AdminStackNavigator.tsx # Admin screens stack
    │   └── UserTabNavigator.tsx    # Shopper bottom-tabs
    ├── screens/
    │   ├── admin/
    │   │   ├── AdminDashboardScreen.tsx
    │   │   └── AddEditItemScreen.tsx
    │   └── user/
    │       ├── HomeScreen.tsx
    │       └── ProductDetailScreen.tsx
    ├── services/
    │   ├── cache.ts                # AsyncStorage cache helpers
    │   ├── categories.ts           # Category CRUD + realtime
    │   ├── images.ts               # Supabase Storage upload/delete
    │   └── products.ts             # Product CRUD + realtime
    ├── types/
    │   ├── index.ts                # Domain types
    │   └── navigation.ts           # React Navigation param lists
    └── utils/
        ├── images.ts               # Placeholder images + cover/gallery helpers
        └── storage.ts              # AsyncStorage read/write helpers
```

## Architecture notes

- All shared state lives in `src/context/AppContext.tsx` and is persisted to AsyncStorage.
- Products support multiple images; `coverImageIndex` controls which image is shown in lists.
- The Telegram Mini Apps SDK is initialized in `src/lib/telegram.ts` and bound to CSS variables for theme and safe-area insets.
- Inside Telegram, the app hides React Navigation headers and web-only headers; it uses Telegram's native **BackButton** and **Popup** instead.
- Outside Telegram, the app still runs as a normal web app for development and testing.

## Notes

- **No shopper authentication.** The catalog is public in this MVP.
- **Admin access** requires signing in through Supabase Auth with the credentials configured in `.env`.
- **No payment or checkout.** This app is a product viewer only.
- **Local storage only.** AsyncStorage data is stored unencrypted in the browser. Do not store passwords or sensitive PII in this app.
