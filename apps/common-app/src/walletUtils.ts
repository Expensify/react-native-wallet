import {addCardToAppleWallet, addCardToGoogleWallet, listTokens, resumeAddCardToGoogleWallet} from '@expensify/react-native-wallet';
import type {AndroidPaymentCredentialsResponse, CardStatus, onPaymentCredentialsRequestPayload} from '@expensify/react-native-wallet';
import {Platform} from 'react-native';
import * as CONST from './CONST';

function issuerEncryptPayloadCallback(_nonce: string, _nonceSignature: string, _certificate: string[]) {
  // Here send data to your server or you Issuer Host to encrypt the payload
  // for example: fetch('https://issuer.com/encrypt', {method: 'POST', body: {nonce, nonceSignature, certificate}})
  return Promise.resolve(CONST.IOSDummyEncryptPayload);
}

function handlePaymentCredentialsGeneration(_data: onPaymentCredentialsRequestPayload): Promise<AndroidPaymentCredentialsResponse> {
  // Here send data to your server or you TSP to generate the payment credentials
  // for example: fetch('https://tsp.com/generatePaymentCredentials', {method: 'POST', body: data})
  return Promise.resolve(CONST.IOSDummyPaymentCredentialsResponse);
}

async function addCardToWallet(cardStatus?: CardStatus) {
  if (Platform.OS === 'android') {
    if (cardStatus === 'requireActivation') {
      const tokens = await listTokens();
      const existingToken = tokens.find((token) => token.lastDigits === CONST.AndroidDummyResumeCardData.lastDigits);

      if (!existingToken) {
        throw new Error(`Token not found for card ending with ${CONST.AndroidDummyResumeCardData.lastDigits}`);
      }

      return await resumeAddCardToGoogleWallet({
        ...CONST.AndroidDummyResumeCardData,
        tokenReferenceID: existingToken.identifier,
      });
    }
    return addCardToGoogleWallet(CONST.AndroidDummyCardData, handlePaymentCredentialsGeneration);
  } else {
    return addCardToAppleWallet(CONST.IOSDummyCardData, issuerEncryptPayloadCallback);
  }
}

export {addCardToWallet};
