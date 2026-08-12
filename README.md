# OnlineShop

Cross-platform mobile app built with **Expo SDK 54** and **React Native** for student online shopping.

## Features

- **Role selection**: Shop as a student or manage items as an admin.
- **Admin**: Add, edit, delete products with name, description, price, category, and stock.
- **Student**: Browse products, search by name/description, filter by category.
- **Cart**: Add items, adjust quantities, remove items, view total.
- **Checkout**: Choose between cash on delivery or online payment (simulated).
- **Orders**: View order history and order details.
- **Persistence**: Products and orders are saved locally using AsyncStorage.

## Requirements

- Node.js 22+ (current: v22.18.0)
- npm 10+ (current: 10.9.3)
- Expo Go app on your physical device, or an emulator/simulator

## Get started

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

### Windows quick start

Double-click **`start-app.bat`** in the project folder. It will open a terminal, start the Expo dev server, and display the QR code you can scan with the Expo Go app.

## Run on a specific platform

```bash
npm run android   # Android emulator or connected device
npm run ios       # iOS simulator (macOS only)
npm run web       # Web browser
```

## Project structure

```
.
├── App.tsx                 # App entry point
├── app.json                # Expo configuration
├── src/
│   ├── components/         # Reusable UI components
│   ├── constants/          # Theme, spacing, categories
│   ├── context/            # Global state management
│   ├── data/               # Seed products
│   ├── hooks/              # Custom React hooks
│   ├── navigation/         # React Navigation setup
│   ├── screens/            # App screens
│   │   ├── admin/          # Admin screens
│   │   └── user/           # Student screens
│   ├── types/              # TypeScript types
│   └── utils/              # Storage helpers
└── assets/                 # Images, fonts, icons
```

## Notes

- Online payment is simulated in this MVP. No real payment gateway is integrated.
- Data is stored locally on the device using AsyncStorage.
