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
  IOSPassActivationData,
  IOSWalletPass,
  IOSAddCardResult,
  IOSDeviceType,
  TokenInfo,
  AndroidPaymentCredentialsResponse,
} from './NativeWallet';
import {getCardState, getTokenizationStatus} from './utils';
import AddToWalletButton from './AddToWalletButton';

/** Result of IOSHandleAddPaymentPassResponse: a retry nonce, or a finished add. */
type AddPaymentPassResult = IOSAddPaymentPassData & {
  activationState?: number;
  errorDomain?: string;
  errorCode?: number;
};

function toCardStatus(stateId: number | undefined): CardStatus | undefined {
  switch (stateId) {
    case -1:
    case 0:
    case 1:
    case 2:
    case 3:
    case 4:
      return getCardState(stateId);
    default:
      return undefined;
  }
}

function getModuleLinkingRejection() {
  return Promise.reject(new Error(`Failed to load Wallet module, make sure to link ${PACKAGE_NAME} correctly`));
}

let eventEmitter: NativeEventEmitter | undefined;
let paymentCredentialsHandler: ((data: onPaymentCredentialsRequestPayload) => Promise<AndroidPaymentCredentialsResponse>) | null = null;

if (Platform.OS === 'android' && Wallet) {
  eventEmitter ??= new NativeEventEmitter(Wallet);
  eventEmitter.addListener('onPaymentCredentialsRequest', async (data: onPaymentCredentialsRequestPayload) => {
    if (!paymentCredentialsHandler) {
      console.warn(`[${PACKAGE_NAME}] Received payment credentials request but no handler is set`);
      await Wallet?.AndroidRejectPaymentCredentials(data.requestId, 'No payment credentials handler is set').catch(() => undefined);
      return;
    }
    try {
      const responseData = await paymentCredentialsHandler(data);
      await Wallet?.AndroidProvidePaymentCredentials(data.requestId, responseData);
    } catch (error) {
      console.error(`[${PACKAGE_NAME}] Error handling payment credentials request:`, error);
      await Wallet?.AndroidRejectPaymentCredentials(data.requestId, error instanceof Error ? error.message : String(error)).catch(() => undefined);
    }
  });
}

function addListener(event: string, callback: (data: onCardActivatedPayload) => void): EmitterSubscription {
  if (!Wallet) {
    // eslint-disable-next-line no-console
    console.warn(`[${PACKAGE_NAME}] Wallet module is not linked, addListener has no effect`);
    return {remove: () => undefined} as EmitterSubscription;
  }
  eventEmitter ??= new NativeEventEmitter(Wallet);
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

/**
 * Checks whether the card can still be added to a Google Wallet target: the phone or a paired wearable.
 * Use it to decide whether to show the "Add to Google Wallet" button when wearables are supported.
 * @param last4Digits - The last 4 digits of the card number (FPAN, not the token)
 * @param network - The card network, e.g. `VISA`, `MASTERCARD`
 * @param issuerName - The issuer name used for matching, as in the token metadata (not the card display name)
 * @returns `true` if at least one target can still receive the card
 */
async function hasEligibleTokenizationTarget(last4Digits: string, network: string, issuerName: string): Promise<boolean> {
  if (Platform.OS === 'ios') {
    throw new Error('hasEligibleTokenizationTarget is not available on iOS');
  }

  if (!Wallet) {
    return getModuleLinkingRejection();
  }

  return Wallet.hasEligibleTokenizationTarget(last4Digits, network.toUpperCase(), issuerName);
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
  try {
    const tokenizationStatus = await Wallet.addCardToGoogleWallet(cardData);
    return getTokenizationStatus(tokenizationStatus);
  } finally {
    paymentCredentialsHandler = null;
  }
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

function toIOSDeviceType(deviceType: string | undefined): IOSDeviceType {
  switch (deviceType) {
    case 'phone':
    case 'watch':
    case 'unknown':
      return deviceType;
    default:
      return 'unknown';
  }
}

async function canAddCardToAppleWallet(primaryAccountIdentifier: string, lastDigits?: string): Promise<boolean> {
  if (Platform.OS === 'android') {
    return false;
  }

  if (!Wallet) {
    return getModuleLinkingRejection();
  }

  return Wallet.canAddCardToAppleWallet(primaryAccountIdentifier, lastDigits ?? '');
}

async function listAppleWalletPasses(): Promise<IOSWalletPass[]> {
  if (Platform.OS === 'android') {
    return Promise.resolve([]);
  }

  if (!Wallet) {
    return getModuleLinkingRejection();
  }

  const passes = await Wallet.listAppleWalletPasses();
  return passes.map((pass) => ({
    ...pass,
    activationState: getCardState(pass.activationState),
  }));
}

async function addCardToAppleWallet(
  cardData: IOSCardData,
  issuerEncryptPayloadCallback: (nonce: string, nonceSignature: string, certificate: string[], deviceType: IOSDeviceType) => Promise<IOSEncryptPayload>,
): Promise<IOSAddCardResult> {
  if (Platform.OS === 'android') {
    throw new Error('addCardToAppleWallet is not available on Android');
  }

  if (!Wallet) {
    return getModuleLinkingRejection();
  }
  const wallet = Wallet;

  const passData = await wallet.IOSPresentAddPaymentPassView(cardData);

  if (!passData || passData.status !== 0) {
    return {status: getTokenizationStatus(passData?.status || -1)};
  }

  async function addPaymentPassToWallet(paymentPassData: IOSAddPaymentPassData): Promise<IOSAddCardResult> {
    const responseData = await issuerEncryptPayloadCallback(paymentPassData.nonce, paymentPassData.nonceSignature, paymentPassData.certificates, toIOSDeviceType(paymentPassData.deviceType));
    const response = (await wallet.IOSHandleAddPaymentPassResponse(responseData)) as AddPaymentPassResult | null;
    // Try again returns a new nonce. A finished add has no nonce, and status
    // matches OperationResult: declined, completed, or canceled.
    if (response?.nonce) {
      return addPaymentPassToWallet(response);
    }

    const activationState = toCardStatus(response?.activationState);
    return {
      status: getTokenizationStatus(response?.status ?? 0),
      ...(activationState ? {activationState} : {}),
      ...(typeof response?.errorDomain === 'string' ? {errorDomain: response.errorDomain} : {}),
      ...(typeof response?.errorCode === 'number' ? {errorCode: response.errorCode} : {}),
    };
  }
  return addPaymentPassToWallet(passData);
}

async function activateAppleWalletPass(passData: IOSPassActivationData): Promise<boolean> {
  if (Platform.OS === 'android') {
    throw new Error('activateAppleWalletPass is not available on Android');
  }

  if (!Wallet) {
    return getModuleLinkingRejection();
  }

  return Wallet.activateAppleWalletPass(passData);
}

export type {
  AndroidCardData,
  AndroidWalletData,
  CardStatus,
  IOSEncryptPayload,
  IOSCardData,
  IOSAddPaymentPassData,
  IOSPassActivationData,
  IOSWalletPass,
  IOSAddCardResult,
  IOSDeviceType,
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
  hasEligibleTokenizationTarget,
  addCardToGoogleWallet,
  resumeAddCardToGoogleWallet,
  listTokens,
  listAppleWalletPasses,
  canAddCardToAppleWallet,
  addCardToAppleWallet,
  activateAppleWalletPass,
  addListener,
  removeListener,
};
