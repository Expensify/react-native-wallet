/* eslint-disable @lwc/lwc/no-async-await */
// import {NativeEventEmitter} from 'react-native';
// import type {EmitterSubscription} from 'react-native';
import Wallet from './NativeWallet';
// import type {onCardActivatedPayload} from './NativeWallet';
import AddToWalletButton from './AddWalletButton';

// function checkWalletAvailability(): Promise<boolean> {
//   return Wallet.checkWalletAvailability();
// }

// function getSecureWalletInfo(): Promise<WalletData> {
//   return Wallet.getSecureWalletInfo();
// }

// async function getCardStatus(last4Digits: string): Promise<CardStatus> {
//   const cardState = await Wallet.getCardStatus(last4Digits);
//   return getCardState(cardState);
// }

// async function getCardTokenStatus(tsp: string, tokenRefId: string): Promise<CardStatus> {
//   const tokenState = await Wallet.getCardTokenStatus(tsp, tokenRefId);
//   return getCardState(tokenState);
// }

// function addCardToWallet(cardData: CardData): Promise<void> {
//   return Wallet.addCardToWallet(cardData);
// }

// const eventEmitter = new NativeEventEmitter();

// function addListener(event: string, callback: (data: onCardActivatedPayload) => void): EmitterSubscription {
//   return eventEmitter.addListener(event, callback);
// }

// function removeListener(subscription: EmitterSubscription): void {
//   subscription.remove();
// }

function add(a: number, b: number): Promise<number> {
  return Wallet.add(a, b);
}

// eslint-disable-next-line import/prefer-default-export
export {AddToWalletButton, add};
