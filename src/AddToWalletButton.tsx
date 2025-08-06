import React from 'react';
import type {ViewStyle, GestureResponderEvent, HostComponent, StyleProp} from 'react-native';
import {requireNativeComponent, StyleSheet, TouchableOpacity} from 'react-native';

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
  borderRadius?: number;
  onPress?: (e: GestureResponderEvent) => void;
};

function AddToWalletButton({style, buttonStyle = 'black', borderRadius = 4, onPress}: Props) {
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const {width = 120, height = 40, ...rest} = flattenedStyle;

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
