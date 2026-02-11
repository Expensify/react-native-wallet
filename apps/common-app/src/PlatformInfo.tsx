import {Platform, Text, View, StyleSheet} from 'react-native';
import React from 'react';

function isBridgeless() {
  // eslint-disable-next-line no-underscore-dangle
  return (global as Record<string, unknown>)._IS_BRIDGELESS;
}

function getPlatform() {
  return Platform.OS;
}

function getPlatformVersion() {
  return Platform.Version;
}

function getBundle() {
  return __DEV__ ? 'dev' : 'production';
}

function getRuntime() {
  if ('HermesInternal' in global) {
    const version =
      // @ts-expect-error this is fine
      global.HermesInternal?.getRuntimeProperties?.()['OSS Release Version'];
    return `Hermes (${version})`;
  }
  if ('_v8runtime' in global) {
    // @ts-expect-error this is fine
    // eslint-disable-next-line no-underscore-dangle
    const version = global._v8runtime().version;
    return `V8 (${version})`;
  }
  return 'JSC';
}

function getArchitecture() {
  return 'nativeFabricUIManager' in global ? 'Fabric' : 'Paper';
}

function getReactNativeVersion() {
  const {major, minor, patch} = Platform.constants.reactNativeVersion;
  return `${major}.${minor}.${patch}`;
}

function isExpo() {
  // Try to detect via Constants.expoConfig which is only present in Expo
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-unresolved
    const Constants = require('expo-constants').default;
    return Constants?.expoConfig !== undefined || Constants?.expoVersion !== undefined;
  } catch {
    return false;
  }
}

export default function PlatformInfo() {
  return (
    <View style={styles.platform}>
      <Text>
        Platform: {getPlatform()} {getPlatformVersion()}
      </Text>
      <Text>Bundle: {getBundle()}</Text>
      <Text>Architecture: {getArchitecture()}</Text>
      <Text>Bridgeless: {isBridgeless() ? 'yes' : 'no'}</Text>
      <Text>Expo: {isExpo() ? 'yes' : 'no'}</Text>
      <Text>RN version: {getReactNativeVersion()}</Text>
      <Text>RN runtime: {getRuntime()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  platform: {
    alignItems: 'center',
    marginBottom: 20,
  },
});
