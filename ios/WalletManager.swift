import Foundation
import PassKit
import UIKit
import React

public typealias PresentAddPassnHandler = (OperationResult, NSDictionary?) -> Void

@objc
open class WalletManager: UIViewController {

  private var presentAddPassCompletionHandler: (PresentAddPassnHandler)?
  
  @objc
  public func checkWalletAvailability() -> Bool {
    return isPassKitAvailable();
  }
  
  @objc
  public func presentAddPass(cardData: [String: Any], completion: @escaping PresentAddPassnHandler) {
    guard isPassKitAvailable() else {
      showErrorAlert(message: "InApp enrollment not available for this device", callback: completion)
      return
    }
    
    guard let card = CardInfo(cardData: cardData) else {
      showErrorAlert(message: "Invalid card data. Please check your card information and try again...", callback: completion)
      return
    }
    
    guard let configuration = PKAddPaymentPassRequestConfiguration(encryptionScheme: .ECC_V2) else {
      showErrorAlert(message: "InApp enrollment configuraton fails", callback: completion)
      return
    }
    
    configuration.cardholderName = card.cardHolderName
    configuration.primaryAccountSuffix = card.lastDigits
    configuration.localizedDescription = NSLocalizedString(card.cardDescription,
                                                           value: card.cardDescription,
                                                           comment: card.cardDescriptionComment)

    guard let enrollViewController = PKAddPaymentPassViewController(requestConfiguration: configuration, delegate: self) else {
      showErrorAlert(message: "InApp enrollment controller configuration fails", callback: completion)
      return
    }
    
    presentAddPassCompletionHandler = completion
    DispatchQueue.main.async {
      RCTPresentedViewController()?.present(enrollViewController, animated: true, completion: nil)
    }
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
  private func showErrorAlert(message: String, callback: (OperationResult, NSDictionary?)-> Void) {
    let alert = UIAlertController(title: "InApp Error",
                                  message: message,
                                  preferredStyle: .alert)
    let action = UIAlertAction(title: "Ok", style: .default, handler: nil)
    alert.addAction(action)

    DispatchQueue.main.async {
      RCTPresentedViewController()?.present(alert, animated: true, completion: nil)
    }
    callback(.error, [
      "errorMessage": message as NSString
    ])
  }
}

extension WalletManager: PKAddPaymentPassViewControllerDelegate {
  public func addPaymentPassViewController(
        _ controller: PKAddPaymentPassViewController,
        generateRequestWithCertificateChain certificates: [Data],
        nonce: Data, nonceSignature: Data,
        completionHandler handler: @escaping (PKAddPaymentPassRequest) -> Void) {
          // Perform the bridge from Apple -> Issuer -> Apple
          
          let stringNonce = nonce.base64EncodedString() as NSString
          let stringNonceSignature = nonceSignature.base64EncodedString() as NSString
          let stringCertificates = certificates.map {
            $0.base64EncodedString() as NSString
          }
          
          if let handler = presentAddPassCompletionHandler {
            let reqestCardData = AddPassResponse(status: .completed, nonce: stringNonce, nonceSignature: stringNonceSignature, certificates: stringCertificates)
            handler(.completed, reqestCardData.toNSDictionary())
            presentAddPassCompletionHandler = nil
          }
  }
    
  public func addPaymentPassViewController(
        _ controller: PKAddPaymentPassViewController,
        didFinishAdding pass: PKPaymentPass?,
        error: Error?) {
          // This method will be called when enroll process ends (with success / error)
          
          RCTPresentedViewController()?.dismiss(animated: true, completion: nil)
            
          if let handler = presentAddPassCompletionHandler {
            let response = AddPassResponse(status: .canceled, nonce: nil, nonceSignature: nil, certificates: nil)
            handler(.canceled, response.toNSDictionary())
            presentAddPassCompletionHandler = nil
          }
  }
}
