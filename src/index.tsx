import Wallet from './NativeWallet';

function checkWalletAvailability(): Promise<boolean> {
  return Wallet.checkWalletAvailability();
}

// eslint-disable-next-line import/prefer-default-export
export {checkWalletAvailability};
