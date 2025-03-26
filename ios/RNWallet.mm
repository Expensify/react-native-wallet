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
  @try {    
    NSDictionary *cardDataDict = @{
      @"network": [self safeString:cardData.network()],
      @"cardHolderName": [self safeString:cardData.cardHolderName()],
      @"lastDigits": [self safeString:cardData.lastDigits()],
      @"cardDescription": [self safeString:cardData.cardDescription()],
    };
    
    dispatch_async(dispatch_get_main_queue(), ^{
      [self->walletManager IOSPresentAddPaymentPassViewWithCardData:cardDataDict completion:^(OperationResult result, NSDictionary* data) {
        if (result < 3) { // completed or canceled
          resolve(data);
        } else {
          [self rejectWithErrorType:@"present_payment_pass_view_failed"
                               code:1001
                        description:data[@"errorMessage"] ?: @"Failed to present Add Payment Pass View"
                           rejecter:reject];
        }
      }];
    });
  } @catch (NSException *exception) {
    NSString *errorDescription = exception.reason ?: @"An unexpected error occurred.";
    [self rejectWithErrorType:@"present_payment_pass_view_failed"
                         code:500
                  description:errorDescription
                     rejecter:reject];
  }
}

RCT_REMAP_METHOD(IOSHandleAddPaymentPassResponse,
                 IOSHandleAddPaymentPassResponse:(JS::NativeWallet::IOSEncryptPayload &)payload
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSDictionary *payloadDict = @{
      @"encryptedPassData": [self safeString:payload.encryptedPassData()],
      @"activationData": [self safeString:payload.activationData()],
      @"ephemeralPublicKey": [self safeString:payload.ephemeralPublicKey()],
    };
    
    dispatch_async(dispatch_get_main_queue(), ^{
      [self->walletManager IOSHandleAddPaymentPassResponseWithPayload:payloadDict completion:^(OperationResult result, NSDictionary* data) {
        if (result < 3) { // completed or canceled or retry
          resolve(data);
        } else {
          NSError *error = [NSError errorWithDomain:@"com.expensify.wallet"
                                               code:1002
                                           userInfo:@{NSLocalizedDescriptionKey: data[@"errorMessage"] ?: @""}];
          reject(@"add_card_failed", data[@"errorMessage"] ?: @"Failed to add card to wallet", error);
        }
      }];
    });
  } @catch (NSException *exception) {
    NSString *errorDescription = exception.reason ?: @"An unexpected error occurred.";
    [self rejectWithErrorType:@"add_card_failed"
                         code:500
                  description:errorDescription
                     rejecter:reject];
  }
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

- (NSArray<NSString *> *)supportedEvents {
  return [WalletManager supportedEvents];
}

- (void)sendEventWithName:(NSString * _Nonnull)name result:(NSDictionary *)result {
  [self sendEventWithName:name body:result];
}

- (void)rejectWithErrorType:(NSString *)type
                       code:(NSInteger)code
                description:(NSString *)description
                   rejecter:(RCTPromiseRejectBlock)reject {
  NSDictionary *userInfo = @{NSLocalizedDescriptionKey: description};
  NSString *errorWithDomain = @"com.expensify.wallet";
  NSError *error = [NSError errorWithDomain:errorWithDomain
                                       code:code
                                   userInfo:userInfo];

  NSString *errorMessage = [NSString stringWithFormat:@"%@ - %@", errorWithDomain, description];
  reject(type, errorMessage, error);
}

- (NSString *)safeString:(NSString *)value {
  return value ?: @"";
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeWalletSpecJSI>(params);
}
#endif


@end
