
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNWalletSpec.h"

@interface Wallet : NSObject <NativeWalletSpec>
#else
#import <React/RCTBridgeModule.h>

@interface Wallet : NSObject <RCTBridgeModule>
#endif

@end
