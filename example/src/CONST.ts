import type {
  AndroidCardData,
  UserAddress,
  IOSEncryptPayload,
  IOSCardData,
} from '../../src/NativeWallet';

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

const IOSDummyCardData: IOSCardData = {
  network: 'VISA',
  cardHolderName: 'John Doe',
  lastDigits: '4321',
  cardDescription: 'Card Description',
};

const IOSDummyEncryptPayload: IOSEncryptPayload = {
  encryptedPassData: 'encryptedPassData123',
  activationData: 'activationData123',
  ephemeralPublicKey: 'ephemeralPublicKey123',
};

export {AndroidDummyCardData, IOSDummyCardData, IOSDummyEncryptPayload};
