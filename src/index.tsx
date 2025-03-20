/* eslint-disable @lwc/lwc/no-async-await */
import {NativeEventEmitter, Platform} from 'react-native';
import type {EmitterSubscription} from 'react-native';
import Wallet from './NativeWallet';
import type {AndroidCardData, CardStatus, IOSCardData, IOSEncryptPayload, AndroidWalletData, onCardActivatedPayload} from './NativeWallet';
import {getCardState} from './utils';
import AddToWalletButton from './AddWalletButton';

const eventEmitter = new NativeEventEmitter(Wallet);

function addListener(event: string, callback: (data: onCardActivatedPayload) => void): EmitterSubscription {
  return eventEmitter.addListener(event, callback);
}

function removeListener(subscription: EmitterSubscription): void {
  subscription.remove();
}

function checkWalletAvailability(): Promise<boolean> {
  return Wallet.checkWalletAvailability();
}

function getSecureWalletInfo(): Promise<AndroidWalletData> {
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line no-console
    console.warn('getSecureWalletInfo is not available on iOS');
    return Promise.resolve({} as unknown as AndroidWalletData);
  }
  return Wallet.getSecureWalletInfo();
}

async function getCardStatus(last4Digits: string): Promise<CardStatus> {
  const cardState = await Wallet.getCardStatus(last4Digits);
  return getCardState(cardState);
}

async function getCardTokenStatus(tsp: string, tokenRefId: string): Promise<CardStatus> {
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line no-console
    console.warn('getCardTokenStatus is not available on iOS');
    return Promise.resolve('not found');
  }

  const tokenState = await Wallet.getCardTokenStatus(tsp, tokenRefId);
  return getCardState(tokenState);
}
function addCardToGoogleWallet(cardData: AndroidCardData): Promise<void> {
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line no-console
    console.warn('addCardToGoogleWallet is not available on iOS');
    return Promise.resolve();
  }
  return Wallet.addCardToGoogleWallet(cardData);
}

async function addCardToAppleWallet(cardData: IOSCardData, issuerEncryptPayloadCallback: (nonce: string, nonceSignature: string, certificate: string[]) => IOSEncryptPayload): Promise<void> {
  if (Platform.OS === 'android') {
    // eslint-disable-next-line no-console
    console.warn('addCardToAppleWallet is not available on Andorid');
    return Promise.resolve();
  }

  const passData = await Wallet.IOSPresentAddPaymentPassView(cardData);
  if (!passData || passData.status !== 0) {
    return;
  }
  const responseData = await issuerEncryptPayloadCallback(passData.nonce, passData.nonceSignature, passData.certificates);
  await Wallet.IOSHandleAddPaymentPassResponse(responseData);
}

export {AddToWalletButton, checkWalletAvailability, getSecureWalletInfo, getCardStatus, getCardTokenStatus, addCardToGoogleWallet, addCardToAppleWallet, addListener, removeListener};
