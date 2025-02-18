#import <Foundation/Foundation.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNWalletSpec.h"
@interface RNWallet : NSObject <NativeWalletSpec>

#else
#import <React/RCTBridgeModule.h>

@interface RNWallet : NSObject <RCTBridgeModule>
#endif

@end
