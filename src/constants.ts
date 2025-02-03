import type {Platform} from './NativeWallet';

const PATH_MAP: Record<Platform, Record<string, string>> = {
  ios: {
    en: require('../assets/buttons/ios/en.svg'),
    es: require('../assets/buttons/ios/es.svg'),
    fr: require('../assets/buttons/ios/fr.svg'),
    default: require('../assets/buttons/ios/en.svg'),
  },
  // Here you can find the expansion of language abbreviations used in the android part
  // https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes (Set 1)
  android: {
    default: require('../assets/buttons/android/en.png'),
  },
};

export default PATH_MAP;
