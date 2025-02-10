import React, {useMemo} from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import type {ViewStyle} from 'react-native';
import {Image} from 'expo-image';
import PATH_MAP from './constants';
import type {Platform} from './NativeWallet';

type ButtonProps = {
  onPress: () => void;
  locale: string;
  platform: Platform;
  buttonStyle?: ViewStyle;
};

function AddToWalletButton({onPress, locale, platform, buttonStyle}: ButtonProps) {
  const IconComponent = useMemo(() => {
    const platformIcons = PATH_MAP[platform];
    return platformIcons[locale] ?? platformIcons.default;
  }, [locale, platform]);

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle]}
      onPress={onPress}
    >
      <Image
        source={IconComponent}
        style={styles.image}
        contentFit="contain"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 200,
    height: 70,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default AddToWalletButton;
