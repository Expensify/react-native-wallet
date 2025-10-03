import Foundation
import React

@objc(RNAddToWalletButtonManager)
class RNAddToWalletButtonManager: RCTViewManager {
  override func view() -> UIView! {
    return RNAddToWalletButtonView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
