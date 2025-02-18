import * as React from 'react';
import {useState, useEffect} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {add} from '@expensify/react-native-wallet';

export default function App() {
  const [result, setResult] = useState<number | undefined>();

  useEffect(() => {
    add(3, 7).then(setResult);
  }, []);

  return (
    <View style={styles.container}>
      {/* <PlatformInfo /> */}
      <Text>Result: {result}</Text>
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
