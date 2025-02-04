/* eslint-disable @lwc/lwc/no-async-await */
import {NativeEventEmitter} from 'react-native';
import type {EmitterSubscription} from 'react-native';
import Wallet from './NativeWallet';
import type {CardData, CardStatus, WalletData, onCardActivatedPayload} from './NativeWallet';
import {getCardState} from './utils';

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

function addCardToWallet(cardData: CardData): Promise<void> {
  return Wallet.addCardToWallet(cardData);
}

const eventEmitter = new NativeEventEmitter();

function addListener(event: string, callback: (data: onCardActivatedPayload) => void): EmitterSubscription {
  return eventEmitter.addListener(event, callback);
}

function removeListener(subscription: EmitterSubscription): void {
  subscription.remove();
}

export {default as AddWalletButton} from './AddWalletButton';

// eslint-disable-next-line import/prefer-default-export
export {checkWalletAvailability, getSecureWalletInfo, getCardStatus, getCardTokenStatus, addCardToWallet, addListener, removeListener};
