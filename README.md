# react-native-wallet

A React Native module designed for seamless integration of Card Push Provisioning into Apple Wallet and Google Wallet, enabling easy and secure addition of payment cards directly from your application.

## Getting started

Using the `react-native-wallet` Push Provisioning features requires proper configuration and access from both Google and Apple. Please follow the instructions below before installing the library: 

### Android

To be able to interact with the Google Wallet on the Android please make sure to complete all of the steps below:

#### Step 1: Get access to Google TapAndPay SDK

Visit [the Google Pay Android Push Provisioning API documentation](https://developers.google.com/pay/issuers/apis/push-provisioning/android/) and request access to it. 

Once getting an approval from the Google team, download the [TapAndPay SDK](https://developers.google.com/pay/issuers/apis/push-provisioning/android/releases). Unzip it and extract the SDK into the `/android/libs` folder in your React Native project (if there is no `libs` folder, create one). Add `/android/libs` to `.gitignore`.

Then connect the SDK to your project in `build.gradle`, for example like in [example/android/build.gradle](https://github.com/Expensify/react-native-wallet/blob/main/example/android/build.gradle):

```groovy
allprojects {
    repositories {
        ...
        google()
        maven { url "file://${rootDir}/libs" }
    }
}
```



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
