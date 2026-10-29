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
  isVirtualCard?: boolean;
  isBounceProvisioned?: boolean;
};

type AndroidResumeCardData = {
  network: string;
  tokenReferenceID: string;
  cardHolderName?: string;
  lastDigits?: string;
};

type IOSCardData = {
  network: string;
  cardHolderName: string;
  lastDigits: string;
  cardDescription: string;
  primaryAccountIdentifier?: string;
};

type onCardActivatedPayload = {
  tokenId?: string | null;
  status: 'activated' | 'canceled';
};

type onPaymentCredentialsRequestPayload = {
  requestId: string;
  serverSessionId: string;
  walletId: string;
  tokenRequestorId: string | null;
  opaquePaymentCard: string;
};

type IOSAddPaymentPassData = {
  status: number;
  nonce: string;
  nonceSignature: string;
  certificates: string[];
  deviceType?: string;
};

type IOSDeviceType = 'phone' | 'watch' | 'unknown';

type IOSEncryptPayload = {
  encryptedPassData: string;
  activationData: string;
  ephemeralPublicKey: string;
};

type TokenizationStatus = 'canceled' | 'success' | 'error';

type IOSAddCardResult = {
  status: TokenizationStatus;
  activationState?: CardStatus;
  errorDomain?: string;
  errorCode?: number;
};

type TokenInfo = {
  identifier: string;
  lastDigits: string;
  tokenState: number;
};

type AndroidPaymentCredentialsResponse = {
  opaquePaymentCard: string;
  googleOpaquePaymentCard: string;
};

export interface Spec extends TurboModule {
  checkWalletAvailability(): Promise<boolean>;
  ensureGoogleWalletInitialized(): Promise<boolean>;
  getSecureWalletInfo(): Promise<AndroidWalletData>;
  getCardStatusBySuffix(last4Digits: string): Promise<number>;
  getCardStatusByIdentifier(identifier: string, tsp: string): Promise<number>;
  hasEligibleTokenizationTarget(last4Digits: string, network: string, issuerName: string): Promise<boolean>;
  addCardToGoogleWallet(cardData: AndroidCardData): Promise<number>;
  AndroidProvidePaymentCredentials(requestId: string, responseData: AndroidPaymentCredentialsResponse): Promise<boolean>;
  AndroidRejectPaymentCredentials(requestId: string, errorMessage: string): Promise<boolean>;
  resumeAddCardToGoogleWallet(cardData: AndroidResumeCardData): Promise<number>;
  listTokens(): Promise<TokenInfo[]>;
  IOSPresentAddPaymentPassView(cardData: IOSCardData): Promise<IOSAddPaymentPassData>;
  IOSHandleAddPaymentPassResponse(payload: IOSEncryptPayload): Promise<IOSAddPaymentPassData | null>;
  canAddCardToAppleWallet(primaryAccountIdentifier: string, lastDigits: string): Promise<boolean>;
  addListener: (eventType: string) => void;
  removeListeners: (count: number) => void;
}

const PACKAGE_NAME = '@expensify/react-native-wallet';
// Try catch block to prevent crashing in case the module is not linked.
// Especialy useful for builds where Google SDK is not available
// eslint-disable-next-line import/no-mutable-exports
let Wallet: Spec | undefined;
try {
  Wallet = TurboModuleRegistry.getEnforcing<Spec>('RNWallet');
} catch (error) {
  if (error instanceof Error) {
    // eslint-disable-next-line no-console
    console.warn(`[${PACKAGE_NAME}] Failed to load Wallet module, ${error.message}`);
  }
}
export default Wallet;
export {PACKAGE_NAME};
export type {
  AndroidCardData,
  AndroidResumeCardData,
  IOSCardData,
  AndroidWalletData,
  CardStatus,
  UserAddress,
  onCardActivatedPayload,
  onPaymentCredentialsRequestPayload,
  Platform,
  IOSAddPaymentPassData,
  IOSDeviceType,
  IOSEncryptPayload,
  IOSAddCardResult,
  TokenizationStatus,
  TokenInfo,
  AndroidPaymentCredentialsResponse,
};
