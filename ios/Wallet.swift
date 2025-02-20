import Foundation
import PassKit

@objc
open class Wallet: NSObject {
  
  @objc
  public static func checkWalletAvailability() -> Bool {
    return PKPassLibrary.isPassLibraryAvailable();
  }
}
