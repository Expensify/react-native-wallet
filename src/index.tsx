/* eslint-disable @lwc/lwc/no-async-await */
import {NativeEventEmitter} from 'react-native';
import type {EmitterSubscription} from 'react-native';
import Wallet from './NativeWallet';
import type {AndroidCardData, CardStatus, IOSCardData, IOSEncryptPayload, WalletData, onCardActivatedPayload} from './NativeWallet';
import {getCardState} from './utils';
import AddToWalletButton from './AddWalletButton';

function checkWalletAvailability(): Promise<boolean> {
  return Wallet.checkWalletAvailability();
}

function getSecureWalletInfo(): Promise<WalletData> {
  return Wallet.getSecureWalletInfo();
}

async function getCardStatus(last4Digits: string): Promise<CardStatus> {
  const cardState = await Wallet.getCardStatus(last4Digits);
  return getCardState(cardState);
}

async function getCardTokenStatus(tsp: string, tokenRefId: string): Promise<CardStatus> {
  const tokenState = await Wallet.getCardTokenStatus(tsp, tokenRefId);
  return getCardState(tokenState);
}

const eventEmitter = new NativeEventEmitter();

function addListener(event: string, callback: (data: onCardActivatedPayload) => void): EmitterSubscription {
  return eventEmitter.addListener(event, callback);
}

function removeListener(subscription: EmitterSubscription): void {
  subscription.remove();
}

function addCardToGoogleWallet(cardData: AndroidCardData): Promise<void> {
  return Wallet.addCardToGoogleWallet(cardData);
}

async function addCardToAppleWallet(cardData: IOSCardData, issuerEncryptPayloadCallback: (nonce: string, nonceSignature: string, certificate: string[]) => IOSEncryptPayload): Promise<void> {
  const passData = await Wallet.presentAddPass(cardData);
  if (!passData || passData.status !== 'completed') {
    return;
  }
  const responseData = await issuerEncryptPayloadCallback(passData.nonce, passData.nonceSignature, passData.certificates);
  await Wallet.handleAppleWalletCreationResponse(responseData);
}

export {AddToWalletButton, checkWalletAvailability, getSecureWalletInfo, getCardStatus, getCardTokenStatus, addCardToGoogleWallet, addCardToAppleWallet, addListener, removeListener};
