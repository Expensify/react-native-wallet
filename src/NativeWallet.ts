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

export interface Spec extends TurboModule {
  checkWalletAvailability(): Promise<boolean>;
  getSecureWalletInfo(): Promise<WalletData>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Wallet');

export type {WalletData, AndroidWalletData};
