import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

type AndroidWalletData = {
  deviceID: string;
  walletAccountID: string;
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

type AndroidCardData = {
  network: string;
  opaquePaymentCard: string;
  cardHolderName: string;
  lastDigits: string;
  userAddress: UserAddress;
};

type IOSCardData = {
  network: string;
  cardHolderName: string;
  lastDigits: string;
  cardDescription: string;
};

type onCardActivatedPayload = {
  tokenId: string;
  actionStatus: 'active' | 'canceled';
};

type IOSAddPaymentPassData = {
  status: number;
  nonce: string;
  nonceSignature: string;
  certificates: string[];
};

type IOSEncryptPayload = {
  encryptedPassData: string;
  activationData: string;
  ephemeralPublicKey: string;
};

export interface Spec extends TurboModule {
  checkWalletAvailability(): Promise<boolean>;
  getSecureWalletInfo(): Promise<AndroidWalletData>;
  getCardStatus(last4Digits: string): Promise<number>;
  getCardTokenStatus(tsp: string, tokenRefId: string): Promise<number>;
  addCardToGoogleWallet(cardData: AndroidCardData): Promise<void>;
  IOSPresentAddPaymentPassView(cardData: IOSCardData): Promise<IOSAddPaymentPassData>;
  IOSHandleAddPaymentPassResponse(payload: IOSEncryptPayload): Promise<IOSAddPaymentPassData | null>;
  addListener: (eventType: string) => void;
  removeListeners: (count: number) => void;
}

// Try catch block to prevent crashing in case the module is not linked.
// Especialy useful for builds where Google SDK is not available
// eslint-disable-next-line import/no-mutable-exports
let Wallet: Spec | undefined;
try {
  Wallet = TurboModuleRegistry.getEnforcing<Spec>('RNWallet');
} catch (error) {
  // eslint-disable-next-line no-console
  console.warn('Failed to load Wallet module', error);
}
export default Wallet;

export type {AndroidCardData, IOSCardData, AndroidWalletData, CardStatus, UserAddress, onCardActivatedPayload, Platform, IOSAddPaymentPassData, IOSEncryptPayload};
