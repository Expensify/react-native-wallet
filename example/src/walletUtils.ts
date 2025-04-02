import {
  addCardToAppleWallet,
  addCardToGoogleWallet,
} from '@expensify/react-native-wallet';
import * as CONST from './CONST';
import {Platform} from 'react-native';

function issuerEncryptPayloadCallback(
  _nonce: string,
  _nonceSignature: string,
  _certificate: string[],
) {
  // Here send data to your server or you Issuer Host to encrypt the payload
  // for example: fetch('https://issuer.com/encrypt', {method: 'POST', body: {nonce, nonceSignature, certificate}})
  return Promise.resolve(CONST.IOSDummyEncryptPayload);
}

async function addCardToWallet() {
  if (Platform.OS === 'android') {
    return addCardToGoogleWallet(CONST.AndroidDummyCardData);
  } else {
    return addCardToAppleWallet(
      CONST.IOSDummyCardData,
      issuerEncryptPayloadCallback,
    );
  }
}

export {addCardToWallet};
