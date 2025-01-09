import {Button, StyleSheet, Text, View} from 'react-native';
import React from 'react';

type LabelProps = {
  text: string;
  value?: string;
  buttonTitle: string;
  onPress?: () => void;
};

export default function LabeledButton({
  text,
  value,
  buttonTitle,
  onPress,
}: LabelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {text} <Text style={[styles.text, styles.value]}>{value || '-'}</Text>
      </Text>
      <Button title={buttonTitle} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
  value: {
    fontWeight: 'bold',
  },
});
