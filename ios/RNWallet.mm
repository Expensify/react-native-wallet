#import <PassKit/PassKit.h>
#import "RNWallet.h"

#if __has_include(<react_native_wallet/react_native_wallet-Swift.h>)
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
#ifdef RCT_NEW_ARCH_ENABLED
                 IOSPresentAddPaymentPassView:(JS::NativeWallet::IOSCardData &)cardData
#else
                 IOSPresentAddPaymentPassView:(NSDictionary *)cardData
#endif
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSMutableDictionary *cardDataDict = nil;
    NSString *primaryAccountIdentifier = nil;

#ifdef RCT_NEW_ARCH_ENABLED
    cardDataDict = [@{
      @"network": [self safeString:cardData.network()],
      @"cardHolderName": [self safeString:cardData.cardHolderName()],
      @"lastDigits": [self safeString:cardData.lastDigits()],
      @"cardDescription": [self safeString:cardData.cardDescription()],
    } mutableCopy];
    primaryAccountIdentifier = [self safeString:cardData.primaryAccountIdentifier()];
#else
    cardDataDict = [@{
      @"network": [self safeString:cardData[@"network"]],
      @"cardHolderName": [self safeString:cardData[@"cardHolderName"]],
      @"lastDigits": [self safeString:cardData[@"lastDigits"]],
      @"cardDescription": [self safeString:cardData[@"cardDescription"]],
    } mutableCopy];
    id rawIdentifier = cardData[@"primaryAccountIdentifier"];
    primaryAccountIdentifier = [self safeString:[rawIdentifier isKindOfClass:[NSString class]] ? rawIdentifier : nil];
#endif

    if (primaryAccountIdentifier.length > 0) {
      cardDataDict[@"primaryAccountIdentifier"] = primaryAccountIdentifier;
    }

    dispatch_async(dispatch_get_main_queue(), ^{
      [self->walletManager IOSPresentAddPaymentPassViewWithCardData:cardDataDict completion:^(OperationResult result, NSDictionary* data) {
        [self handleWalletResponse:result data:data resolveValue:data completedBlock:resolve errorPrefix:@"present_payment_pass_view_failed" defaultErrorMessage:@"Failed to present the payment pass view" rejecter:reject];
      }];
    });
  } @catch (NSException *exception) {
    [self rejectWithErrorType:@"present_payment_pass_view_failed" code:500 description:exception.reason ?: @"An unexpected error occurred." rejecter:reject];
  }
}

RCT_REMAP_METHOD(IOSHandleAddPaymentPassResponse,
#ifdef RCT_NEW_ARCH_ENABLED
                 IOSHandleAddPaymentPassResponse:(JS::NativeWallet::IOSEncryptPayload &)payload
#else
                 IOSHandleAddPaymentPassResponse:(NSDictionary *)payload
#endif
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSDictionary *payloadDict = nil;

#ifdef RCT_NEW_ARCH_ENABLED
    payloadDict = @{
      @"encryptedPassData": [self safeString:payload.encryptedPassData()],
      @"activationData": [self safeString:payload.activationData()],
      @"ephemeralPublicKey": [self safeString:payload.ephemeralPublicKey()],
    };
#else
    payloadDict = @{
      @"encryptedPassData": [self safeString:payload[@"encryptedPassData"]],
      @"activationData": [self safeString:payload[@"activationData"]],
      @"ephemeralPublicKey": [self safeString:payload[@"ephemeralPublicKey"]],
    };
#endif

    dispatch_async(dispatch_get_main_queue(), ^{
      [self->walletManager IOSHandleAddPaymentPassResponseWithPayload:payloadDict completion:^(OperationResult result, NSDictionary* data) {
        [self handleWalletResponse:result data:data resolveValue:data completedBlock:resolve errorPrefix:@"add_card_failed" defaultErrorMessage:@"Failed to add the card to the wallet" rejecter:reject];
      }];
    });
  } @catch (NSException *exception) {
    [self rejectWithErrorType:@"add_card_failed" code:500 description:exception.reason ?: @"An unexpected error occurred." rejecter:reject];
  }
}

RCT_REMAP_METHOD(IOSFailAddPaymentPass,
                 IOSFailAddPaymentPass:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->walletManager IOSFailAddPaymentPass];
    resolve(nil);
  });
}

RCT_REMAP_METHOD(getCardStatusBySuffix,
                 getCardStatusBySuffix:(NSString *)last4Digits
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  resolve([walletManager getCardStatusBySuffixWithLast4Digits:last4Digits]);
}

RCT_REMAP_METHOD(presentAppleWalletPass,
                 presentAppleWalletPass:(NSString *)lastDigits
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve(@([self->walletManager presentAppleWalletPassWithLastDigits:lastDigits]));
  });
}

RCT_REMAP_METHOD(getCardStatusByIdentifier,
                 getCardStatusByIdentifier:(NSString *)identifier
                 tsp:(NSString *)tsp
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  resolve([walletManager getCardStatusByIdentifierWithIdentifier:identifier]);
}

RCT_REMAP_METHOD(listAppleWalletPasses,
                 listAppleWalletPasses:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  resolve([walletManager listAppleWalletPasses]);
}

RCT_REMAP_METHOD(activateAppleWalletPass,
#ifdef RCT_NEW_ARCH_ENABLED
                 activateAppleWalletPass:(JS::NativeWallet::IOSPassActivationData &)passData
#else
                 activateAppleWalletPass:(NSDictionary *)passData
#endif
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSMutableDictionary *passDataDict = nil;

#ifdef RCT_NEW_ARCH_ENABLED
    passDataDict = [@{
      @"passTypeIdentifier": [self safeString:passData.passTypeIdentifier()],
      @"serialNumber": [self safeString:passData.serialNumber()],
      @"activationData": [self safeString:passData.activationData()],
    } mutableCopy];
    std::optional<bool> isRemote = passData.isRemote();
    if (isRemote.has_value()) {
      passDataDict[@"isRemote"] = @(isRemote.value());
    }
#else
    passDataDict = [@{
      @"passTypeIdentifier": [self safeString:passData[@"passTypeIdentifier"]],
      @"serialNumber": [self safeString:passData[@"serialNumber"]],
      @"activationData": [self safeString:passData[@"activationData"]],
    } mutableCopy];
    id rawIsRemote = passData[@"isRemote"];
    if ([rawIsRemote isKindOfClass:[NSNumber class]]) {
      passDataDict[@"isRemote"] = rawIsRemote;
    }
#endif

    [self->walletManager activateAppleWalletPassWithPassData:passDataDict completion:^(OperationResult result, NSDictionary* data) {
      [self handleWalletResponse:result data:data resolveValue:@([data[@"success"] boolValue]) completedBlock:resolve errorPrefix:@"activate_card_failed" defaultErrorMessage:@"Failed to activate the Apple Wallet pass" rejecter:reject];
    }];
  } @catch (NSException *exception) {
    [self rejectWithErrorType:@"activate_card_failed" code:500 description:exception.reason ?: @"An unexpected error occurred." rejecter:reject];
  }
}

RCT_REMAP_METHOD(canAddCardToAppleWallet,
                 canAddCardToAppleWallet:(NSString *)primaryAccountIdentifier
                 lastDigits:(NSString *)lastDigits
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  resolve(@([walletManager canAddCardToAppleWalletWithPrimaryAccountIdentifier:primaryAccountIdentifier lastDigits:lastDigits]));
}

- (void)addCardToGoogleWallet:
#ifdef RCT_NEW_ARCH_ENABLED
  (JS::NativeWallet::AndroidCardData &)cardData
#else
  (NSDictionary *)cardData
#endif
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
{
  // no-op
}

- (void)hasEligibleTokenizationTarget:(NSString *)last4Digits
  network:(NSString *)network
  issuerName:(NSString *)issuerName
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
{
  // no-op
}

- (void)AndroidProvidePaymentCredentials:(NSString *)requestId
  responseData:
#ifdef RCT_NEW_ARCH_ENABLED
  (JS::NativeWallet::AndroidPaymentCredentialsResponse &)responseData
#else
  (NSDictionary *)responseData
#endif
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
{
  // no-op
}

- (void)AndroidRejectPaymentCredentials:(NSString *)requestId
  errorMessage:(NSString *)errorMessage
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
{
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
  NSString *errorWithDomain = walletManager.packageName;
  NSError *error = [NSError errorWithDomain:errorWithDomain
                                       code:code
                                   userInfo:userInfo];

  NSString *errorMessage = [NSString stringWithFormat:@"%@ - %@", errorWithDomain, description];
  reject(type, errorMessage, error);
}

- (void)handleWalletResponse:(OperationResult)result
                        data:(NSDictionary *)data
                resolveValue:(id)resolveValue
              completedBlock:(RCTPromiseResolveBlock)resolve
                 errorPrefix:(NSString *)errorPrefix
         defaultErrorMessage:(NSString *)defaultErrorMsg
                    rejecter:(RCTPromiseRejectBlock)reject {
  if (result < 3) {
    resolve(resolveValue);
  } else {
    NSString *errorMessage = data[@"errorMessage"] ?: defaultErrorMsg ?: @"Operation failed";
    [self rejectWithErrorType:errorPrefix code:1001 description:errorMessage rejecter:reject];
  }
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
