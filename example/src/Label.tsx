import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

type LabelProps = {
  text: string;
  value: string;
};

export default function Label({text, value}: LabelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {text} <Text style={[styles.text, styles.value]}>{value}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  text: {
    fontSize: 16,
  },
  value: {
    fontWeight: 'bold',
  },
});
