import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

type WalletData = AndroidWalletData | IOSWalletData;

type AndroidWalletData = {
  platform: 'android';
  deviceID: string;
  walletAccountID: string;
};

type IOSWalletData = {
  platform: 'ios';
  nonce: string;
  nonceSignature: string;
  certificates: string;
};

type CardStatus = 'not found' | 'requireActivation' | 'pending' | 'active' | 'suspended' | 'deactivated';

type Platform = 'android' | 'ios';

type UserAddress = {
  name: string;
  addressOne: string;
  addressTwo?: string;
  administrativeArea: string;
  locality: string;
  countryCode: string;
  postalCode: string;
  phoneNumber: string;
};

type CardData = AndroidCardData | IOSCardData;

type AndroidCardData = {
  platform: 'android';
  network: string;
  opaquePaymentCard: string;
  cardHolderName: string;
  lastDigits: string;
  userAddress: UserAddress;
};

type IOSCardData = {
  platform: 'ios';
  network: string;
  activationData: string;
  encryptedPassData: string;
  ephemeralPublicKey: string;
  cardHolderTitle: string;
  cardHolderName: string;
  lastDigits: string;
  cardDescription: string;
  cardDescriptionComment: string;
};

type onCardActivatedPayload = {
  tokenId: string;
  actionStatus: 'active' | 'canceled';
};

export interface Spec extends TurboModule {
  // checkWalletAvailability(): Promise<boolean>;
  // getSecureWalletInfo(): Promise<WalletData>;
  // getCardStatus(last4Digits: string): Promise<number>;
  // getCardTokenStatus(tsp: string, tokenRefId: string): Promise<number>;
  // addCardToWallet(cardData: CardData): Promise<void>;
  add(a: number, b: number): Promise<number>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNWallet');

export type {WalletData, AndroidWalletData, CardStatus, CardData, UserAddress, onCardActivatedPayload, Platform};
