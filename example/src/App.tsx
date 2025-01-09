import * as React from 'react';
import {useState, useEffect} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {checkWalletAvailability} from '@expensify/react-native-wallet';
import PlatformInfo from './PlatformInfo';
import Label from './Label';

export default function App() {
  const [isWalletAvailable, setIsWalletAvailable] = useState(false);

  useEffect(() => {
    checkWalletAvailability().then(test => {
      setIsWalletAvailable(test);
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>react-native-wallet example app</Text>
        <PlatformInfo />
      </View>
      <Label text="Is wallet available:" value={`${isWalletAvailable}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  header: {
    gap: 10,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
