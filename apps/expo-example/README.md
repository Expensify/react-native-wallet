# Expo Example App

Example Expo application demonstrating the `@expensify/react-native-wallet` library with Apple Pay and Google Pay integration.

## Prerequisites

- Node.js 18+
- Expo CLI
- For Android: Google TapAndPay SDK (see setup below)
- For iOS: Xcode and CocoaPods

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Google TapAndPay SDK (Android only)

The Google TapAndPay SDK is required for Android builds. Place the SDK file in the shared libs directory:

```bash
# SDK location
apps/libs/expo-example/tapandpay-v18.7.0.zip
```

The Expo config plugin will automatically extract the SDK during the prebuild process.

### 3. Generate native projects

```bash
npx expo prebuild --clean
```

This will:
- Generate iOS and Android native projects
- Apply the wallet plugin configuration
- Extract the Google TapAndPay SDK to `android/libs/`

## Running the App

### iOS

```bash
npm run ios
```

### Android

```bash
npm run android
```

## Development

### Start Metro bundler

```bash
npm start
```

### Rebuild after changes

If you modify the plugin configuration in `app.json`, run:

```bash
npx expo prebuild --clean
```

## Project Structure

- `index.ts` - Entry point
- `app.json` - Expo configuration with wallet plugin setup
- `metro.config.js` - Metro bundler configuration for monorepo
- `../common-app/` - Shared app code used by both example apps
- `../libs/` - Shared SDK files (Google TapAndPay)

## Configuration

The wallet plugin is configured in `app.json`:

```json
"plugins": [
  [
    "@expensify/react-native-wallet",
    {
      "googleTapAndPaySdkPath": "../libs/tapandpay-v18.7.0.zip"
    }
  ]
]
```

## Troubleshooting

### SDK not found

If you get errors about missing TapAndPay SDK:
1. Verify the SDK is at `apps/libs/tapandpay-v18.7.0.zip`
2. Run `npx expo prebuild --clean` to regenerate native projects
3. Check `android/libs/` contains the extracted SDK files

### Metro bundler issues

Clear cache and restart:
```bash
npm start -- --clear
```

### Native module issues

```bash
# iOS
cd ios && pod install && cd ..

# Android
cd android && ./gradlew clean && cd ..
```

