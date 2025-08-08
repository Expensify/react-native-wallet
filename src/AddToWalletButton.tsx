import React from 'react';
import type {ViewStyle, GestureResponderEvent, HostComponent, StyleProp} from 'react-native';
import {Platform, requireNativeComponent, StyleSheet, TouchableOpacity} from 'react-native';

type ButtonStyle = 'black' | 'blackOutline';

interface NativeWalletButtonProps {
  style?: StyleProp<ViewStyle>;
  buttonStyle?: ButtonStyle;
  borderRadius?: number;
}

const NativeWalletButton: HostComponent<NativeWalletButtonProps> = requireNativeComponent('AddToWalletButton');

type Props = {
  style?: ViewStyle;
  buttonStyle?: ButtonStyle;
  buttonType?: 'basic' | 'badge';
  borderRadius?: number;
  onPress?: (e: GestureResponderEvent) => void;
};

const buttonDimensions = {
  basic: {
    ios: {width: 300, height: 40},
    android: {width: 300, height: 48},
  },
  badge: {
    ios: {width: 120, height: 40},
    android: {width: 200, height: 56},
  },
};

function AddToWalletButton({style, buttonStyle = 'black', buttonType = 'basic', borderRadius = 4, onPress}: Props) {
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const currentDimensions = buttonDimensions[buttonType][Platform.OS as 'ios' | 'android'];
  const {width = currentDimensions.width, height = currentDimensions.height, ...rest} = flattenedStyle;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          width,
          height,
          margin: 10,
        },
        rest,
        styles.touchable,
      ]}
    >
      <NativeWalletButton
        style={styles.fill}
        buttonStyle={buttonStyle}
        borderRadius={borderRadius}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default AddToWalletButton;
