import * as React from 'react';
import {useState, useEffect} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {checkWalletAvailability} from '@expensify/react-native-wallet';
import {PlatformInfo} from './PlatformInfo';

export default function App() {
  const [isWalletAvailable, setIsWalletAvailable] = useState(false);

  useEffect(() => {
    checkWalletAvailability().then(test => {
      setIsWalletAvailable(test);
    });
  }, []);

  return (
    <View style={styles.container}>
      <PlatformInfo />
      <Text>Is wallet available: {`${isWalletAvailable}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
