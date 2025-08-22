import React, { useMemo } from 'react';
import { StyleSheet, Pressable, Platform, Text } from 'react-native';
import type { ViewStyle } from 'react-native';
import LOCALIZED_BUTTONS from './constants';

type ButtonProps = {
  onPress: () => void;
  locale: string;
  buttonStyle?: ViewStyle;
};

const platform = Platform.OS === 'ios' ? 'ios' : 'android';

function AddToWalletButton({ onPress, locale, buttonStyle }: ButtonProps) {
  const IconComponent = useMemo(() => {
    const platformIcons = LOCALIZED_BUTTONS[platform];
    return platformIcons[locale] ?? platformIcons.default;
  }, [locale]);

  return (
    <Pressable
      style={[styles.button, buttonStyle]}
      onPress={onPress}
    >
      <Text>{IconComponent}</Text>
    </Pressable>
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
