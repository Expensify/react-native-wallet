import type {AndroidCardData, UserAddress, IOSEncryptPayload, IOSCardData, AndroidResumeCardData} from '@expensify/react-native-wallet/src/NativeWallet';

const dummyAddress: UserAddress = {
  name: 'John Doe',
  addressOne: '1234 Fictional Road',
  addressTwo: 'Unit 5678',
  administrativeArea: 'Imaginary State',
  locality: '9090',
  countryCode: 'XX',
  postalCode: '99999',
  phoneNumber: '000-123-4567',
};

const AndroidDummyCardData: AndroidCardData = {
  network: 'VISA',
  opaquePaymentCard: 'encryptedCardInformation123456',
  cardHolderName: 'John Doe',
  lastDigits: '4321',
  userAddress: dummyAddress,
};

const AndroidDummyResumeCardData: AndroidResumeCardData = {
  network: 'VISA',
  cardHolderName: 'John Doe',
  lastDigits: '4321',
  tokenReferenceID: '',
};

const IOSDummyCardData: IOSCardData = {
  network: 'VISA',
  cardHolderName: 'John Doe',
  lastDigits: '4321',
  cardDescription: 'Card Description',
};

// Base 64 encoded values
const IOSDummyEncryptPayload: IOSEncryptPayload = {
  encryptedPassData: 'ZW5jcnlwdGVkUGFzc0RhdGExMjM=',
  activationData: 'YWN0aXZhdGlvbkRhdGExMjM=',
  ephemeralPublicKey: 'ZXBoZW1lcmFsUHVibGljS2V5MTIz',
};

export {AndroidDummyCardData, AndroidDummyResumeCardData, IOSDummyCardData, IOSDummyEncryptPayload};
