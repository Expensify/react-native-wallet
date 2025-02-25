import Foundation
import PassKit
import UIKit


@objc
open class WalletManager: UIViewController {
  
  @objc
  public func checkWalletAvailability() -> Bool {
    return isPassKitAvailable();
  }
  
  @objc
  public func addCardToWallet(cardData: [String: Any]) -> Bool {
    guard isPassKitAvailable() else {
      showPassKitUnavailable(message: "InApp enrollment not available for this device")
      return false
    }
    
    guard let card = RequestCardInfo(cardData: cardData) else {
      showPassKitUnavailable(message: "Invalid card data. Please check your card information and try again...")
      return false
    }
    
    guard let configuration = PKAddPaymentPassRequestConfiguration(encryptionScheme: .ECC_V2) else {
      showPassKitUnavailable(message: "InApp enrollment configuraton fails")
      return false
    }
    
    print(card.cardHolderName)
    
    configuration.cardholderName = card.cardHolderName
    configuration.primaryAccountSuffix = card.lastDigits
    configuration.localizedDescription = NSLocalizedString( card.cardDescription,
                                                            value: card.cardDescription,
                                                            comment: card.cardDescriptionComment)


    guard let enrollViewController = PKAddPaymentPassViewController(requestConfiguration: configuration, delegate: self) else {
      showPassKitUnavailable(message: "InApp enrollment controller configuration fails")
      return false
    }
    
    let vc = findViewControllerPresenter(from: UIApplication.shared.delegate?.window??.rootViewController ?? UIViewController())
    
    DispatchQueue.main.async {
      vc.present(enrollViewController, animated: true, completion: nil)
    }
    
    return true;
  }
  
  
  /**
  Define if PassKit will be available for this device
  */
  private func isPassKitAvailable() -> Bool {
    return PKAddPaymentPassViewController.canAddPaymentPass()
  }

  /**
  Show an alert that indicates that PassKit isn't available for this device
  */
  private func showPassKitUnavailable(message: String) {
    let alert = UIAlertController(title: "InApp Error",
                                  message: message,
                                  preferredStyle: .alert)
    let action = UIAlertAction(title: "Ok", style: .default, handler: nil)
    alert.addAction(action)
    let vc = findViewControllerPresenter(from: UIApplication.shared.delegate?.window??.rootViewController ?? UIViewController())
    
    DispatchQueue.main.async {
      vc.present(alert, animated: true, completion: nil)
    }
  }

  /**
  Return the card information that Apple will display into enrollment screen
  */
  private func cardInformation() -> Card {
    return Card(panTokenSuffix: "1234", holder: "Carl Jonshon")
  }
  
  func findViewControllerPresenter(from uiViewController: UIViewController) -> UIViewController {
      // Note: creating a UIViewController inside here results in a nil window
      // This is a bit of a hack: We traverse the view hierarchy looking for the most reasonable VC to present from.
      // A VC hosted within a SwiftUI cell, for example, doesn't have a parent, so we need to find the UIWindow.
      var presentingViewController: UIViewController =
          uiViewController.view.window?.rootViewController ?? uiViewController

      // Find the most-presented UIViewController
      while let presented = presentingViewController.presentedViewController {
          presentingViewController = presented
      }

      return presentingViewController
  }
}

private struct Card {
  /// Last four digits of the `pan token` numeration for the card (****-****-****-0000)
  let panTokenSuffix: String
  /// Holder for the card
  let holder: String
}

extension WalletManager: PKAddPaymentPassViewControllerDelegate {
  public func addPaymentPassViewController(
        _ controller: PKAddPaymentPassViewController,
        generateRequestWithCertificateChain certificates: [Data],
        nonce: Data, nonceSignature: Data,
        completionHandler handler: @escaping (PKAddPaymentPassRequest) -> Void) {
        
        // Perform the bridge from Apple -> Issuer -> Apple
    }
    
  public func addPaymentPassViewController(
        _ controller: PKAddPaymentPassViewController,
        didFinishAdding pass: PKPaymentPass?,
        error: Error?) {
        
        // This method will be called when enroll process ends (with success / error)
    }
}
