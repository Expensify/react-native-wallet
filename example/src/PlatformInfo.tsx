import {Platform, Text, View, StyleSheet} from 'react-native';
import React from 'react';

function isBridgeless() {
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
      // @ts-ignore this is fine
      global.HermesInternal?.getRuntimeProperties?.()['OSS Release Version'];
    return `Hermes (${version})`;
  }
  if ('_v8runtime' in global) {
    // @ts-ignore this is fine
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

export default function PlatformInfo() {
  return (
    <View style={styles.platform}>
      <Text>
        Platform: {getPlatform()} {getPlatformVersion()}
      </Text>
      <Text>Bundle: {getBundle()}</Text>
      <Text>Architecture: {getArchitecture()}</Text>
      <Text>Bridgeless: {isBridgeless() ? 'yes' : 'no'}</Text>
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
