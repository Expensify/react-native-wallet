import Foundation
import React

@objc(AddToWalletButtonManager)
class AddToWalletButtonManager: RCTViewManager {
  override func view() -> UIView! {
    return AddToWalletButtonView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
