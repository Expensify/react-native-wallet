#import <PassKit/PassKit.h>
#import "RNWallet.h"

#if RNWallet_USE_FRAMEWORKS
#import <react_native_wallet/react_native_wallet-Swift.h>
#else
#import <react_native_wallet-Swift.h>
#endif


@interface RNWallet () <WalletDelegate>
@end

@implementation RNWallet {
  WalletManager *walletManager;
}

- (instancetype)init {
  self = [super init];
  if(self) {
    walletManager = [WalletManager new];
    walletManager.delegate = self;
  }
  return self;
}

RCT_EXPORT_MODULE()

RCT_REMAP_METHOD(checkWalletAvailability,
                 checkWalletAvailability:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  resolve(@([walletManager checkWalletAvailability]));
}

RCT_REMAP_METHOD(IOSPresentAddPaymentPassView,
                 IOSPresentAddPaymentPassView:(JS::NativeWallet::IOSCardData &)cardData
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
    [self->walletManager IOSPresentAddPaymentPassViewWithCardData:cardDataDict completion:^(OperationResult result, NSDictionary* data) {
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

RCT_REMAP_METHOD(IOSHandleAddPaymentPassResponse,
                 IOSHandleAddPaymentPassResponse:(JS::NativeWallet::IOSEncryptPayload &)payload
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  NSDictionary *payloadDict = @{
    @"encryptedPassData": payload.encryptedPassData(),
    @"activationData": payload.activationData(),
    @"ephemeralPublicKey": payload.ephemeralPublicKey(),
  };
  
  [walletManager IOSHandleAddPaymentPassResponseWithPayload:payloadDict resolve:resolve reject:reject];
}

RCT_REMAP_METHOD(getCardStatus,
                 getCardStatus:(NSString *)last4Digits
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  resolve([walletManager getCardStatusWithLast4Digits:last4Digits]);
}

- (void)addCardToGoogleWallet:(JS::NativeWallet::AndroidCardData &)cardData resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  // no-op
}


- (void)getCardTokenStatus:(NSString *)tsp tokenRefId:(NSString *)tokenRefId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  // no-op
}


- (void)getSecureWalletInfo:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  // no-op
}


+ (BOOL)requiresMainQueueSetup {
    return NO;
}

- (NSArray<NSString *> *)supportedEvents {
  return [WalletManager supportedEvents];
}

- (void)sendEventWithName:(NSString * _Nonnull)name result:(NSDictionary *)result {
  [self sendEventWithName:name body:result];
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeWalletSpecJSI>(params);
}
#endif


@end
