import * as React from 'react';
import {useState, useEffect, useMemo, useCallback} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {
  checkWalletAvailability,
  getSecureWalletInfo,
} from '@expensify/react-native-wallet';
import PlatformInfo from './PlatformInfo';
import type {WalletData} from '../../src/NativeWallet';
import LabeledButton from './LabeledButton';

const getWalletInfoTextValue = (walletData: WalletData | undefined) => {
  if (walletData?.platform === 'android') {
    return `{\n\t\tplatform: ${walletData?.platform}\n\t\twalletId: ${walletData?.walletAccountID}\n\t\thardwareId: ${walletData?.deviceID}\n}`;
  }
  if (walletData?.platform === 'ios') {
    return `{\n\t\tplatform: ${walletData?.platform}\n\t\tnonce: ${walletData?.nonce}\n\t\tnonceSignature: ${walletData?.nonceSignature}\n\t\tcertificates: ${walletData?.certificates}\n}`;
  }
  return '-';
};

export default function App() {
  const [isWalletAvailable, setIsWalletAvailable] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | undefined>();

  const handleCheckWalletAvailability = useCallback(() => {
    checkWalletAvailability().then(setIsWalletAvailable);
  }, []);

  const handleGetSecureWalletInfo = useCallback(() => {
    getSecureWalletInfo().then(data => {
      setWalletData(data);
    });
  }, []);

  const walletSecureInfo = useMemo(
    () => getWalletInfoTextValue(walletData),
    [walletData],
  );

  useEffect(() => {
    handleCheckWalletAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>react-native-wallet example app</Text>
        <PlatformInfo />
      </View>

      <LabeledButton
        text="Is wallet available:"
        value={`${isWalletAvailable}`}
        buttonTitle="Check Wallet Availability"
        onPress={handleCheckWalletAvailability}
      />

      <LabeledButton
        text="Wallet Info:"
        value={walletSecureInfo}
        buttonTitle="Check Wallet Availability"
        onPress={handleGetSecureWalletInfo}
      />
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
