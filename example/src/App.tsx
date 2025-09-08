import * as React from 'react';
import {useState, useEffect, useMemo, useCallback} from 'react';
import {StyleSheet, View, Text, Alert, ScrollView} from 'react-native';
import {
  checkWalletAvailability,
  getSecureWalletInfo,
  getCardStatusBySuffix,
  getCardStatusByIdentifier,
  addListener,
  removeListener,
  AddToWalletButton,
} from '@expensify/react-native-wallet';
import type {
  CardStatus,
  AndroidWalletData,
} from '@expensify/react-native-wallet';
import PlatformInfo from './PlatformInfo';
import LabeledButton from './LabeledButton';
import {addCardToWallet} from './walletUtils';
import {SafeAreaView} from 'react-native-safe-area-context';

const CARD_LAST_4_DIGITS = '4321';
const TOKEN_REF_ID = 'tokenID123';

const getWalletInfoTextValue = (walletData: AndroidWalletData | undefined) => {
  return `{\n\t\twalletId: ${walletData?.walletAccountID}\n\t\thardwareId: ${walletData?.deviceID}\n}`;
};

export default function App() {
  const [isWalletAvailable, setIsWalletAvailable] = useState(false);
  const [walletData, setWalletData] = useState<AndroidWalletData | undefined>();
  const [cardStatus, setCardStatus] = useState<CardStatus | undefined>();
  const [tokenStatus, setTokenStatus] = useState<CardStatus | undefined>();
  const [addCardStatus, setAddCardStatus] = useState<string | undefined>();

  const handleCheckWalletAvailability = useCallback(() => {
    checkWalletAvailability().then(setIsWalletAvailable);
  }, []);

  const handleGetSecureWalletInfo = useCallback(() => {
    getSecureWalletInfo()
      .then(data => {
        setWalletData(data);
      })
      .catch(e => {
        if (e instanceof Error) {
          Alert.alert('Error', e.message);
        }
      });
  }, []);

  const handleGetCardStatus = useCallback(() => {
    getCardStatusBySuffix(CARD_LAST_4_DIGITS).then(setCardStatus);
  }, []);

  const handleGetCardTokenStatus = useCallback(() => {
    getCardStatusByIdentifier(TOKEN_REF_ID, 'VISA').then(setTokenStatus);
  }, []);

  const handleAddCardToWallet = useCallback(() => {
    addCardToWallet()
      .then(status => {
        setAddCardStatus(status);
      })
      .catch(e => {
        console.error(e);
        setAddCardStatus('failed');
      });
  }, []);

  const walletSecureInfo = useMemo(
    () => getWalletInfoTextValue(walletData),
    [walletData],
  );

  useEffect(() => {
    handleCheckWalletAvailability();

    const subscription = addListener('onCardActivated', data => {
      Alert.alert('onCardActivated listener', JSON.stringify(data));
    });

    return () => {
      removeListener(subscription);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
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
          buttonTitle="Get Secure Wallet Info"
          onPress={handleGetSecureWalletInfo}
        />

        <LabeledButton
          text={`Card status (${CARD_LAST_4_DIGITS}):`}
          value={cardStatus}
          buttonTitle="Get Card Status"
          onPress={handleGetCardStatus}
        />

        <LabeledButton
          text={`Token status (${TOKEN_REF_ID}):`}
          value={tokenStatus}
          buttonTitle="Get Token Status"
          onPress={handleGetCardTokenStatus}
        />

        <View style={styles.buttons}>
          <Text style={styles.label}>
            Add Card status:
            <Text style={styles.value}>{addCardStatus || '-'}</Text>
          </Text>
          <AddToWalletButton
            buttonType="badge"
            onPress={handleAddCardToWallet}
          />
          <AddToWalletButton
            onPress={handleAddCardToWallet}
            style={styles.longButton}
            borderRadius={50}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'white',
    flex: 1,
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
    marginTop: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  buttons: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  longButton: {
    width: '90%',
  },
});
