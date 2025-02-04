import React, {useMemo} from 'react';
import {Image, TouchableOpacity, StyleSheet} from 'react-native';
import type {ImageSourcePropType, ImageStyle, ViewStyle} from 'react-native';
import PATH_MAP from './constants';
import type {Platform} from './NativeWallet';

type ButtonProps = {
  onPress: () => void;
  locale: string;
  platform: Platform;
  buttonStyle?: ViewStyle;
  imageStyle?: ImageStyle;
};

function AddToWalletButton({onPress, locale, platform, buttonStyle, imageStyle}: ButtonProps) {
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
        style={[styles.image, imageStyle]}
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
    width: 200,
    height: 60,
    resizeMode: 'contain',
  },
});

export default AddToWalletButton;
