# Basic Example App

Example React Native application demonstrating the `@expensify/react-native-wallet` library with Apple Pay and Google Pay integration.

## Prerequisites

- Node.js 18+
- React Native development environment ([Setup Guide](https://reactnative.dev/docs/environment-setup))
- For Android: Google TapAndPay SDK (see setup below)
- For iOS: Xcode and CocoaPods

## Setup

### 1. Install dependencies

From the repository root:

```bash
npm install
```

### 2. Configure Google TapAndPay SDK (Android only)

The Google TapAndPay SDK is required for Android builds. Extract and place the SDK files in the Android libs directory:

```bash
# Create the libs directory if it doesn't exist
mkdir -p android/libs
```

Extract the SDK ZIP file contents into `android/libs/`
The extracted files should be directly in` android/libs/`, not in a subdirectory
Example structure:

```
android/libs/com/google/android/gms/play-services-tapandpay/[version]/...
```

**Important**: Place the **extracted contents** of the ZIP file into `android/libs/`, not the ZIP file itself. The Gradle build expects a Maven repository structure.

### 3. Install iOS dependencies

```bash
cd ios
pod install
cd ..
```

## Running the App

### Start Metro Bundler

```bash
npm start
```

### iOS

```bash
npm run ios
```

Or open in Xcode:
```bash
open ios/WalletExample.xcworkspace
```

### Android

```bash
npm run android
```

## Development

### Reload the app

- **iOS**: Press <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in the simulator
- **Android**: Press <kbd>R</kbd> twice or <kbd>Ctrl/Cmd</kbd> + <kbd>M</kbd> to open Developer Menu

### Clean build

```bash
# iOS
npm run clean-ios
npm run pods

# Android
npm run clean-android
```

## Project Structure

- `index.ts` - Entry point
- `app.json` - React Native configuration
- `android/libs/` - Google TapAndPay SDK location
- `../common-app/` - Shared app code used by both example apps

## Troubleshooting

### SDK not found (Android)

If you get errors about missing TapAndPay SDK:
1. Verify the SDK files are extracted into `android/libs/` directory
2. The structure should be: `android/libs/com/google/android/gms/play-services-tapandpay/...`
3. Do NOT place the .zip file directly - extract it first
4. Clean and rebuild: `cd android && ./gradlew clean && cd ..`

### Metro bundler issues

Clear cache and restart:
```bash
npm start -- --reset-cache
```

### iOS build issues

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android build issues

```bash
cd android
./gradlew clean
cd ..
```

## Learn More

- [@expensify/react-native-wallet](../../README.md) - Main library documentation

