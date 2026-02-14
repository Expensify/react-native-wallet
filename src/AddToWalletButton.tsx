import React from 'react';
import type {ViewStyle, GestureResponderEvent, HostComponent, StyleProp} from 'react-native';
import {Platform, requireNativeComponent, StyleSheet, TouchableOpacity} from 'react-native';

type ButtonStyle = 'black' | 'blackOutline';
type ButtonType = 'basic' | 'badge';

interface NativeWalletButtonProps {
  style?: StyleProp<ViewStyle>;
  buttonStyle?: ButtonStyle;
  buttonType?: ButtonType;
  borderRadius?: number;
}

type Props = NativeWalletButtonProps & {
  onPress?: (e: GestureResponderEvent) => void;
};

const NativeWalletButton: HostComponent<NativeWalletButtonProps> = requireNativeComponent('RNAddToWalletButton');

const BUTTON_TYPE_BREAKPOINT = 236;
const BUTTON_DIMENSIONS = {
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
  const safeButtonType: ButtonType = buttonType === 'badge' ? 'badge' : 'basic';
  const currentDimensions = BUTTON_DIMENSIONS[safeButtonType][Platform.OS as 'ios' | 'android'];
  const {width = currentDimensions.width, height = currentDimensions.height, ...rest} = flattenedStyle;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        rest,
        // Android allows us to define the type of the button, however on iOS type depends on the width.
        // Adding this limits to ensure consistent behavior across platforms.
        buttonType === 'badge' ? {maxWidth: BUTTON_TYPE_BREAKPOINT - 1} : {minWidth: BUTTON_TYPE_BREAKPOINT},
        {
          width,
          height,
        },
        styles.touchable,
      ]}
    >
      <NativeWalletButton
        style={styles.fill}
        buttonStyle={buttonStyle}
        borderRadius={borderRadius}
        buttonType={safeButtonType}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default AddToWalletButton;
