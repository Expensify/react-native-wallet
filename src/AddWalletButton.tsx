import React, {useMemo} from 'react';
import {Image, TouchableOpacity, StyleSheet} from 'react-native';
import type {ImageSourcePropType, ViewStyle} from 'react-native';
import PATH_MAP from './constants';
import type {Platform} from './NativeWallet';

type ButtonProps = {
  onPress: () => void;
  locale: string;
  platform: Platform;
  buttonStyle?: ViewStyle;
};

function AddToWalletButton({onPress, locale, platform, buttonStyle}: ButtonProps) {
  const image = useMemo(() => {
    const platformImages = PATH_MAP[platform];
    return platformImages[locale] ?? platformImages.default;
  }, [locale, platform]);

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle]}
      onPress={onPress}
    >
      <Image
        source={image as ImageSourcePropType}
        style={styles.image}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default AddToWalletButton;
