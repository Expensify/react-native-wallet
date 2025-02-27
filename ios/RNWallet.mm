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

RCT_REMAP_METHOD(presentAddPass,
                 presentAddPass:(JS::NativeWallet::IOSCardData &)cardData
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
  
  dispatch_async(dispatch_get_main_queue(), ^{
    [walletManager presentAddPassWithCardData:cardDataDict completion:^(OperationResult result, NSDictionary* data) {
      if (result < 2) { // completed or canceled
        resolve(data);
      } else {
        NSError *error = [NSError errorWithDomain:@"com.expensify.wallet"
                                             code:1001
                                         userInfo:@{NSLocalizedDescriptionKey: data[@"errorMessage"] ?: @""}];
        reject(@"add_card_failed", data[@"errorMessage"] ?: @"Failed to add card to wallet", error);
      }
    }];
  });
}

RCT_REMAP_METHOD(handleAppleWalletCreationResponse,
                 handleAppleWalletCreationResponse:(JS::NativeWallet::IOSEncryptPayload &)payload
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  NSDictionary *payloadDict = @{
    @"encryptedPassData": payload.encryptedPassData(),
    @"activationData": payload.activationData(),
    @"ephemeralPublicKey": payload.ephemeralPublicKey(),
  };
  
  [walletManager handleAppleWalletCreationResponseWithResponseData:payloadDict resolve:resolve reject:reject];
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeWalletSpecJSI>(params);
}
#endif


@end
