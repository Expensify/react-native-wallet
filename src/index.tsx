/* eslint-disable @lwc/lwc/no-async-await */
import Wallet from './NativeWallet';
import type {CardStatus, WalletData} from './NativeWallet';
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

// eslint-disable-next-line import/prefer-default-export
export {checkWalletAvailability, getSecureWalletInfo, getCardStatus, getCardTokenStatus};
