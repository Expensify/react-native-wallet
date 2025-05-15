import Foundation
import PassKit
import UIKit
import React

public typealias CompletionHandler = (OperationResult, NSDictionary?) -> Void

@objc public protocol WalletDelegate {
  func sendEvent(name: String, result: NSDictionary)
}

@objc
open class WalletManager: UIViewController {
  
  @objc public weak var delegate: WalletDelegate? = nil
  
  private var addPassViewController: PKAddPaymentPassViewController?

  private var presentAddPaymentPassCompletionHandler: (CompletionHandler)?
  
  private var addPaymentPassCompletionHandler: (CompletionHandler)?

  private var addPassHandler: ((PKAddPaymentPassRequest) -> Void)?
  
  @objc public var packageName = "react-native-wallet"
  
  let passLibrary = PKPassLibrary()

  override init(nibName: String?, bundle: Bundle?) {
    super.init(nibName: nibName, bundle: bundle)
    addPassObserver()
  }
  
  required public init?(coder: NSCoder) {
    super.init(coder: coder)
    addPassObserver()
  }
  
  deinit {
    NotificationCenter.default.removeObserver(self)
  }
  
  func addPassObserver() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(passLibraryDidChange),
      name: NSNotification.Name(rawValue: PKPassLibraryNotificationName.PKPassLibraryDidChange.rawValue),
      object: passLibrary
    )
  }
  
  @objc func passLibraryDidChange(_ notification: Notification) {
    guard let userInfo = notification.userInfo else {
      return
    }
    
    // Check if passes were added or status changed
    if let addedPasses = userInfo[PKPassLibraryNotificationKey.addedPassesUserInfoKey] as? [PKPass] {
      checkPassActivationStatus(addedPasses)
    }
    
    // Check for updated passes
    if let replacedPasses = userInfo[PKPassLibraryNotificationKey.replacementPassesUserInfoKey] as? [PKPass] {
      checkPassActivationStatus(replacedPasses)
    }
  }
  
  func checkPassActivationStatus(_ passes: [PKPass]) {
    for pass in passes {
      if pass.secureElementPass?.passActivationState == .activated {
        delegate?.sendEvent(name: Event.onCardActivated.rawValue, result:  [
          "state": "activated",
          "serialNumber": pass.serialNumber
        ]);
      }
    }
  }

  @objc
  public func checkWalletAvailability() -> Bool {
    return isPassKitAvailable();
  }
  
  @objc
  public func IOSPresentAddPaymentPassView(cardData: NSDictionary, completion: @escaping CompletionHandler) {
    guard isPassKitAvailable() else {
      completion(.error, [
        "errorMessage": "InApp enrollment not available for this device"
      ])
      return
    }
    
    let card: CardInfo
    do {
      card = try CardInfo(cardData: cardData)
    }
    catch {
      completion(.error, [
        "errorMessage": "Invalid card data. Please check your card information and try again..."
      ])
      return
    }
    
    guard let configuration = PKAddPaymentPassRequestConfiguration(encryptionScheme: .ECC_V2) else {
      completion(.error, [
        "errorMessage": "InApp enrollment configuraton fails"
      ])
      return
    }
    
    configuration.cardholderName = card.cardHolderName
    configuration.primaryAccountSuffix = card.lastDigits
    configuration.localizedDescription = String(card.cardDescription)

    guard let enrollViewController = PKAddPaymentPassViewController(requestConfiguration: configuration, delegate: self) else {
      completion(.error, [
        "errorMessage": "InApp enrollment controller configuration fails"
      ])
      return
    }
    
    presentAddPaymentPassCompletionHandler = completion
    DispatchQueue.main.async {
      if self.addPassViewController == nil {
        self.addPassViewController = enrollViewController
        RCTPresentedViewController()?.present(enrollViewController, animated: true, completion: nil)
      } else {
        self.logInfo(message: "EnrollViewController is already presented.")
      }
    }
  }
  
  @objc
  public func IOSHandleAddPaymentPassResponse(payload: NSDictionary, completion: @escaping CompletionHandler) {
    guard addPassHandler != nil else {
      hideModal()
      completion(.error, [
        "errorMessage": "addPassHandler unavailable"
      ])
      return
    }

    let walletData: WalletEncryptedPayload
    do {
      walletData = try WalletEncryptedPayload(data: payload)
    } catch {
      hideModal()
      completion(.error, [
        "errorMessage": "Invalid payload data"
      ])
      return
    }
    
    self.addPaymentPassCompletionHandler = completion
    
    let addPaymentPassRequest = PKAddPaymentPassRequest()
    addPaymentPassRequest.encryptedPassData = walletData.encryptedPassData
    addPaymentPassRequest.activationData = walletData.activationData
    addPaymentPassRequest.ephemeralPublicKey = walletData.ephemeralPublicKey
    self.addPassHandler?(addPaymentPassRequest)
    self.addPassHandler = nil
  }
  
  private func getPassActivationState(matching condition: (PKSecureElementPass) -> Bool) -> NSNumber {
    let paymentPasses = passLibrary.passes(of: .payment)
    if paymentPasses.isEmpty {
      self.logInfo(message: "No passes found in Wallet.")
      return -1
    }
    
    for pass in paymentPasses {
      guard let securePassElement = pass.secureElementPass else { continue }
      if condition(securePassElement) {
        return NSNumber(value: securePassElement.passActivationState.rawValue)
      }
    }
    return -1
  }
  
  @objc public func getCardStatusBySuffix(last4Digits: NSString) -> NSNumber {
    return getPassActivationState { pass in
      return pass.primaryAccountNumberSuffix.hasSuffix(last4Digits as String)
    }
  }

  @objc public func getCardStatusByIdentifier(identifier: NSString) -> NSNumber {
    return getPassActivationState { pass in
      return pass.primaryAccountIdentifier == identifier as String
    }
  }
  
  private func isPassKitAvailable() -> Bool {
    return PKAddPaymentPassViewController.canAddPaymentPass()
  }
  
  private func hideModal() {
    DispatchQueue.main.async {
      if let enrollVC = self.addPassViewController, enrollVC.isBeingPresented || enrollVC.presentingViewController != nil {
        enrollVC.dismiss(animated: true, completion: {
          self.addPassViewController = nil
        })
      } else {
        self.logInfo(message: "EnrollViewController is not presented currently.")
      }
    }
  }
  
  private func logInfo(message: String) {
    print("[\(packageName)] \(message)")
  }
}

extension WalletManager: PKAddPaymentPassViewControllerDelegate {
  // Perform the bridge from Apple -> Issuer -> Apple
  public func addPaymentPassViewController(
    _ controller: PKAddPaymentPassViewController,
    generateRequestWithCertificateChain certificates: [Data],
    nonce: Data, nonceSignature: Data,
    completionHandler handler: @escaping (PKAddPaymentPassRequest) -> Void) {
      let stringNonce = nonce.base64EncodedString() as NSString
      let stringNonceSignature = nonceSignature.base64EncodedString() as NSString
      let stringCertificates = certificates.map {
        $0.base64EncodedString() as NSString
      }
      let reqestCardData = AddPassResponse(status: .completed, nonce: stringNonce, nonceSignature: stringNonceSignature, certificates: stringCertificates)
      self.addPassHandler = handler
      
      // Retry the JS issuer callback if the user tries again to add a payment pass
      if let addPaymentPassHandler = addPaymentPassCompletionHandler {
        addPaymentPassHandler(.retry, reqestCardData.toNSDictionary())
        addPaymentPassCompletionHandler = nil
        return
      }
      
      // Finish IOSPresentAddPaymentPassView function
      if let presentPassHandler = presentAddPaymentPassCompletionHandler {
        presentPassHandler(.completed, reqestCardData.toNSDictionary())
        presentAddPaymentPassCompletionHandler = nil
      }
    }
    
  // This method will be called when enroll process ends (with success/error)
  public func addPaymentPassViewController(
    _ controller: PKAddPaymentPassViewController,
    didFinishAdding pass: PKPaymentPass?,
    error: Error?) {
      if addPassViewController == nil {
        return
      }
      
      let errorMessage = error?.localizedDescription ?? ""

      if error != nil {
        self.logInfo(message: "Error: \(errorMessage)")
        delegate?.sendEvent(name: Event.onCardActivated.rawValue, result:  [
          "state": "canceled"
        ]);
      }
      
      // Cancel the IOSPresentAddPaymentPassView function when the user cancelled the modal
      if let handler = presentAddPaymentPassCompletionHandler {
        let response = AddPassResponse(status: .canceled, nonce: nil, nonceSignature: nil, certificates: nil)
        handler(.canceled, response.toNSDictionary())
      }
      
      // If the pass is returned complete the IOSHandleAddPaymentPassResponse function
      if let addPaymentPassHandler = addPaymentPassCompletionHandler {
        if pass != nil {
          addPaymentPassHandler(.completed, nil)
        } else {
          addPaymentPassHandler(.error, [
            "errorMessage": "Could not add card. \(errorMessage))."
          ])
        }
      }
      
      hideModal()
      addPaymentPassCompletionHandler = nil
      presentAddPaymentPassCompletionHandler = nil
    }
}

extension WalletManager {
  enum Event: String, CaseIterable {
    case onCardActivated
  }

  @objc
  public static var supportedEvents: [String] {
    return Event.allCases.map(\.rawValue);
  }
}
