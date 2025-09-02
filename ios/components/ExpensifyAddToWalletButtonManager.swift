import Foundation
import React

@objc(ExpensifyAddToWalletButtonManager)
class ExpensifyAddToWalletButtonManager: RCTViewManager {
  override func view() -> UIView! {
    return AddToWalletButtonView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
