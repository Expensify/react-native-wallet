/* eslint-disable @lwc/lwc/no-async-await */
import {NativeEventEmitter, Platform} from 'react-native';
import type {EmitterSubscription} from 'react-native';
import Wallet, {PACKAGE_NAME} from './NativeWallet';
import type {AndroidCardData, CardStatus, IOSCardData, IOSEncryptPayload, AndroidWalletData, onCardActivatedPayload, IOSAddPaymentPassData} from './NativeWallet';
import {getCardState} from './utils';
import AddToWalletButton from './AddToWalletButton';

function getModuleLinkingRejection() {
  return Promise.reject(new Error(`Failed to load Wallet module, make sure to link ${PACKAGE_NAME} correctly`));
}

const eventEmitter = new NativeEventEmitter(Wallet);

function addListener(event: string, callback: (data: onCardActivatedPayload) => void): EmitterSubscription {
  return eventEmitter.addListener(event, callback);
}

function removeListener(subscription: EmitterSubscription): void {
  subscription.remove();
}

function checkWalletAvailability(): Promise<boolean> {
  if (!Wallet) {
    return getModuleLinkingRejection();
  }
  return Wallet.checkWalletAvailability();
}

function getSecureWalletInfo(): Promise<AndroidWalletData> {
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line no-console
    console.warn('getSecureWalletInfo is not available on iOS');
    return Promise.resolve({} as unknown as AndroidWalletData);
  }

  if (!Wallet) {
    return getModuleLinkingRejection();
  }

  return Wallet.getSecureWalletInfo();
}

async function getCardStatusBySuffix(last4Digits: string): Promise<CardStatus> {
  if (!Wallet) {
    return getModuleLinkingRejection();
  }

  const cardState = await Wallet.getCardStatusBySuffix(last4Digits);
  return getCardState(cardState);
}

async function getCardStatusByIdentifier(identifier: string, tsp: string): Promise<CardStatus> {
  if (!Wallet) {
    return getModuleLinkingRejection();
  }

  const tokenState = await Wallet.getCardStatusByIdentifier(identifier, tsp);
  return getCardState(tokenState);
}
function addCardToGoogleWallet(cardData: AndroidCardData): Promise<void> {
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line no-console
    console.warn('addCardToGoogleWallet is not available on iOS');
    return Promise.resolve();
  }

  if (!Wallet) {
    return getModuleLinkingRejection();
  }

  return Wallet.addCardToGoogleWallet(cardData);
}

async function addCardToAppleWallet(
  cardData: IOSCardData,
  issuerEncryptPayloadCallback: (nonce: string, nonceSignature: string, certificate: string[]) => Promise<IOSEncryptPayload>,
): Promise<void> {
  if (Platform.OS === 'android') {
    // eslint-disable-next-line no-console
    console.warn('addCardToAppleWallet is not available on Andorid');
    return Promise.resolve();
  }

  const passData = await Wallet?.IOSPresentAddPaymentPassView(cardData);
  if (!passData || passData.status !== 0) {
    return;
  }

  async function addPaymentPassToWallet(paymentPassData: IOSAddPaymentPassData) {
    const responseData = await issuerEncryptPayloadCallback(paymentPassData.nonce, paymentPassData.nonceSignature, paymentPassData.certificates);
    const response = await Wallet?.IOSHandleAddPaymentPassResponse(responseData);
    // Response is null when a pass is successfully added to the wallet or the user cancels the process
    // In case the user presses the `Try again` option, new pass data is returned, and it should reenter the function
    if (response) {
      await addPaymentPassToWallet(response);
    }
  }
  await addPaymentPassToWallet(passData);
}

export {
  AddToWalletButton,
  checkWalletAvailability,
  getSecureWalletInfo,
  getCardStatusBySuffix,
  getCardStatusByIdentifier,
  addCardToGoogleWallet,
  addCardToAppleWallet,
  addListener,
  removeListener,
};
