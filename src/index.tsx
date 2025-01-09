import Wallet from './NativeWallet';
import type {WalletData} from './NativeWallet';

function checkWalletAvailability(): Promise<boolean> {
  return Wallet.checkWalletAvailability();
}

function getSecureWalletInfo(): Promise<WalletData> {
  return Wallet.getSecureWalletInfo();
}

// eslint-disable-next-line import/prefer-default-export
export {checkWalletAvailability, getSecureWalletInfo};
