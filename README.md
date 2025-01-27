# react-native-wallet

A React Native module designed for seamless integration of Card Push Provisioning into Apple Wallet and Google Wallet, enabling easy and secure addition of payment cards directly from your application.

## Getting started

Using the `react-native-wallet` Push Provisioning features requires proper configuration and access from both Google and Apple. Please follow the instructions below before installing the library: 

### Android

To be able to interact with the Google Wallet on the Android please make sure to complete all of the steps below following [the Google Push Provisioning documentation](https://developers.google.com/pay/issuers/apis/push-provisioning/android/setup):

#### Step 1: Get access to Google TapAndPay SDK

Visit [the Google Pay Android Push Provisioning API documentation](https://developers.google.com/pay/issuers/apis/push-provisioning/android/) and request access to it. 

Once getting an approval from the Google team, download the [TapAndPay SDK](https://developers.google.com/pay/issuers/apis/push-provisioning/android/releases). Unzip it and extract the SDK into the `/android/libs` folder in your React Native project (if there is no `libs` folder, create one). Add `/android/libs` to `.gitignore`.

Then connect the SDK to your project in `build.gradle`, for example like in [example/android/build.gradle](https://github.com/Expensify/react-native-wallet/blob/main/example/android/build.gradle):

```groovy
allprojects {
    // ...
    repositories {
        // ...
        google()
        maven { url "file://${rootDir}/libs" }
    }
}
```

#### Step 2: Whitelist your app for SDK use.

To use the Google SDK in your app, you will need to whitelist your app details. Without it, calling some functions will result in a `Not verified` error. To resolve it, please follow the instructions from [the official Google documentation](https://developers.google.com/pay/issuers/apis/push-provisioning/android/allowlist).

For your builds, you will need to prepare your app's `package name` and `fingerprint` following [these steps](https://developers.google.com/pay/issuers/apis/push-provisioning/android/allowlist#how_to_get_your_apps_fingerprint). The values should, for example, look like this:

```
Package name: com.app.package.name  
Fingerprint: SHA256: 36:38:63:59:6E:...:00:82:16:4E:FF
```

You can display your SHA-256 certificate checksum using `apksigner` or `keytool`.
With all the required data, submit the form and wait for Google's response. After successfully whitelisting your app you will be able to use Google SDK within our library.

#### Step 3: Test your app

Before publishing your app with implemented In-App Push Provisioning, you will need to send your app for Google review. More information about it can be found in the [Deploying your app](#deploying-your-app) section below.



## Installation

After completing the setup from the section above, install the `react-native-wallet` package from npm:
```sh
npm install @expensify/react-native-wallet
or
yarn add @expensify/react-native-wallet
```

## Usage

```js
import {multiply} from '@expensify/react-native-wallet';

// ...

const result = multiply(3, 7);
```

# Deploying your app 

To successfully publish your app, you will need to navigate through a series of mandatory test cases on both platforms. 

### Android

Before deploying your app to the Google Play Store, make sure you have taken care of the security when implementing Push Provisioning and properly tested your code. To accopmlish it, please familiarize yourself with [the Google's App Push Provisioning best practices](https://developers.google.com/pay/issuers/apis/push-provisioning/android/best-practices).

The latest information about deploying apps with Google TapAndPay SDK can be found in the [pre-launch process](https://developers.google.com/pay/issuers/apis/push-provisioning/android/launch-process#step_3_issuer_app_product_review) and [beta tests](https://developers.google.com/pay/issuers/apis/push-provisioning/android/beta-testing) sections in Google documentation. Make sure to complete all of the steps specified by Google connected to the _Google's branding_, _API safety_, and _app stability_. 

Before publishing your app, it will need to be reviewed by Google. During this process, it will need to pass 4 mandatory test cases that are specified [here](https://developers.google.com/pay/issuers/apis/push-provisioning/android/test-cases). They verify how your app handles card state tracking in different scenarios. Please make sure to hide the `Add to Google Wallet` buttons when cards are already added to the wallet. 


# Deploying

This repo automatically publishes to NPM when PRs are merged to main.

# Contributing

Right now, contributions to this library are done under https://github.com/Expensify/App. Please refer to that repo and all it's guidelines for contributing.

## License

MIT

---

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="./assets/signature-light.png" />
    <source media="(prefers-color-scheme: dark)" srcset="./assets/signature-dark.png" />
    <img alt="Brought to you by Software Mansion + Expensify" src="./assets/signature-light.png" width="600" />
  </picture>
</p>
