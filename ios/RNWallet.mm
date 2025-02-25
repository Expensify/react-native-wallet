#import <PassKit/PassKit.h>
#import "RNWallet.h"
#import "react_native_wallet-Swift.h"


static WalletManager *walletManager = [WalletManager new];

@implementation RNWallet

RCT_EXPORT_MODULE()

RCT_REMAP_METHOD(checkWalletAvailability,
                 checkWalletAvailability:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  resolve(@([walletManager checkWalletAvailability]));
}

RCT_REMAP_METHOD(addCardToWallet,
                 addCardToWallet:(JS::NativeWallet::IOSCardData &)cardData
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  NSDictionary *cardDataDict = @{
    @"network": cardData.network(),
    @"cardHolderTitle":cardData.cardHolderTitle(),
    @"cardHolderName":cardData.cardHolderName(),
    @"lastDigits":cardData.lastDigits(),
    @"cardDescription":cardData.cardDescription(),
    @"cardDescriptionComment":cardData.cardDescriptionComment(),
  };
  
  resolve(@([walletManager addCardToWalletWithCardData:cardDataDict]));
}



#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeWalletSpecJSI>(params);
}
#endif


@end
