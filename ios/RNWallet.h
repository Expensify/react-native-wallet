#import <Foundation/Foundation.h>
#import <React/RCTEventEmitter.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNWalletSpec.h"
@interface RNWallet : RCTEventEmitter <NativeWalletSpec>

#else
#import <React/RCTBridgeModule.h>
@interface RNWallet : RCTEventEmitter <RCTBridgeModule>
#endif

@end
