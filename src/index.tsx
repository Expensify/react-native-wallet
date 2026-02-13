/* eslint-disable no-console */
/* eslint-disable @lwc/lwc/no-async-await */
import {NativeEventEmitter, Platform} from 'react-native';
import type {EmitterSubscription} from 'react-native';
import Wallet, {PACKAGE_NAME} from './NativeWallet';
import type {
  TokenizationStatus,
  AndroidCardData,
  AndroidResumeCardData,
  CardStatus,
  IOSCardData,
  IOSEncryptPayload,
  AndroidWalletData,
  onCardActivatedPayload,
  onPaymentCredentialsRequestPayload,
  IOSAddPaymentPassData,
  TokenInfo,
  AndroidPaymentCredentialsResponse,
} from './NativeWallet';
import {getCardState, getTokenizationStatus} from './utils';
import AddToWalletButton from './AddToWalletButton';

function getModuleLinkingRejection() {
  return Promise.reject(new Error(`Failed to load Wallet module, make sure to link ${PACKAGE_NAME} correctly`));
}

const eventEmitter = new NativeEventEmitter(Wallet);
let paymentCredentialsHandler: ((data: onPaymentCredentialsRequestPayload) => Promise<AndroidPaymentCredentialsResponse>) | null = null;

if (Platform.OS === 'android' && Wallet) {
  eventEmitter.addListener('onPaymentCredentialsRequest', async (data: onPaymentCredentialsRequestPayload) => {
    if (paymentCredentialsHandler) {
      try {
        const responseData = await paymentCredentialsHandler(data);
        await Wallet?.AndroidProvidePaymentCredentials(data.requestId, responseData);
      } catch (error) {
        console.error('[react-native-wallet] Error handling payment credentials request:', error);
      }
    } else {
      console.warn('[react-native-wallet] Received payment credentials request but no handler is set. Call setPaymentCredentialsHandler() to handle this event.');
    }
  });
}

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

async function getSecureWalletInfo(): Promise<AndroidWalletData> {
  if (Platform.OS === 'ios') {
    throw new Error('getSecureWalletInfo is not available on iOS');
  }

  if (!Wallet) {
    return getModuleLinkingRejection();
  }
  const isWalletInitialized = await Wallet.ensureGoogleWalletInitialized();
  if (!isWalletInitialized) {
    throw new Error('Wallet could not be initialized');
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

/**
 * Returns the state of a card based on a platform-specific identifier.
 * @param identifier - The card identifier. On Android, it's `Token Reference ID` and on iOS, it's `Primary Account Identifier`
 * @param tsp - The Token Service Provider, e.g. `VISA`, `MASTERCARD`
 * @returns CardStatus - The card status
 */
async function getCardStatusByIdentifier(identifier: string, tsp: string): Promise<CardStatus> {
  if (!Wallet) {
    return getModuleLinkingRejection();
  }

  const tokenState = await Wallet.getCardStatusByIdentifier(identifier, tsp.toUpperCase());
  return getCardState(tokenState);
}

async function addCardToGoogleWallet(
  cardData: AndroidCardData,
  handlePaymentCredentialsGeneration: (data: onPaymentCredentialsRequestPayload) => Promise<AndroidPaymentCredentialsResponse>,
): Promise<TokenizationStatus> {
  if (Platform.OS === 'ios') {
    throw new Error('addCardToGoogleWallet is not available on iOS');
  }

  if (!Wallet) {
    return getModuleLinkingRejection();
  }
  const isWalletInitialized = await Wallet.ensureGoogleWalletInitialized();
  if (!isWalletInitialized) {
    throw new Error('Wallet could not be initialized');
  }

  paymentCredentialsHandler = handlePaymentCredentialsGeneration;
  const tokenizationStatus = await Wallet.addCardToGoogleWallet(cardData);
  paymentCredentialsHandler = null;
  return getTokenizationStatus(tokenizationStatus);
}

async function resumeAddCardToGoogleWallet(cardData: AndroidResumeCardData): Promise<TokenizationStatus> {
  if (Platform.OS === 'ios') {
    throw new Error('resumeAddCardToGoogleWallet is not available on iOS');
  }

  if (!Wallet) {
    return getModuleLinkingRejection();
  }
  const isWalletInitialized = await Wallet.ensureGoogleWalletInitialized();
  if (!isWalletInitialized) {
    throw new Error('Wallet could not be initialized');
  }
  const tokenizationStatus = await Wallet.resumeAddCardToGoogleWallet(cardData);
  return getTokenizationStatus(tokenizationStatus);
}

async function listTokens(): Promise<TokenInfo[]> {
  if (Platform.OS === 'ios') {
    return Promise.resolve([]);
  }

  if (!Wallet) {
    return getModuleLinkingRejection();
  }
  const isWalletInitialized = await Wallet.ensureGoogleWalletInitialized();
  if (!isWalletInitialized) {
    throw new Error('Wallet could not be initialized');
  }
  return Wallet.listTokens();
}

async function addCardToAppleWallet(
  cardData: IOSCardData,
  issuerEncryptPayloadCallback: (nonce: string, nonceSignature: string, certificate: string[]) => Promise<IOSEncryptPayload>,
): Promise<TokenizationStatus> {
  if (Platform.OS === 'android') {
    throw new Error('addCardToAppleWallet is not available on Android');
  }

  const passData = await Wallet?.IOSPresentAddPaymentPassView(cardData);
  if (!passData || passData.status !== 0) {
    return getTokenizationStatus(passData?.status || -1);
  }

  async function addPaymentPassToWallet(paymentPassData: IOSAddPaymentPassData): Promise<number> {
    const responseData = await issuerEncryptPayloadCallback(paymentPassData.nonce, paymentPassData.nonceSignature, paymentPassData.certificates);
    const response = await Wallet?.IOSHandleAddPaymentPassResponse(responseData);
    // Response is null when a pass is successfully added to the wallet or the user cancels the process
    // In case the user presses the `Try again` option, new pass data is returned, and it should reenter the function
    if (response) {
      return addPaymentPassToWallet(response);
    }
    return 0;
  }
  const status = await addPaymentPassToWallet(passData);
  return getTokenizationStatus(status);
}

export type {
  AndroidCardData,
  AndroidWalletData,
  CardStatus,
  IOSEncryptPayload,
  IOSCardData,
  IOSAddPaymentPassData,
  onCardActivatedPayload,
  onPaymentCredentialsRequestPayload,
  TokenizationStatus,
  TokenInfo,
  AndroidPaymentCredentialsResponse,
};
export {
  AddToWalletButton,
  checkWalletAvailability,
  getSecureWalletInfo,
  getCardStatusBySuffix,
  getCardStatusByIdentifier,
  addCardToGoogleWallet,
  resumeAddCardToGoogleWallet,
  listTokens,
  addCardToAppleWallet,
  addListener,
  removeListener,
};
