import Foundation
import PassKit
import UIKit
import React

public typealias PresentAddPassHandler = (OperationResult, NSDictionary?) -> Void

@objc public protocol WalletDelegate {
  func sendEvent(name: String, result: NSDictionary)
}

@objc
open class WalletManager: UIViewController {
  
  @objc public weak var delegate: WalletDelegate? = nil

  private var presentAddPaymentPassCompletionHandler: (PresentAddPassHandler)?

  private var addPassHandler: ((PKAddPaymentPassRequest) -> Void)?
  
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
  public func IOSPresentAddPaymentPassView(cardData: NSDictionary, completion: @escaping PresentAddPassHandler) {
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
    configuration.localizedDescription = NSLocalizedString(card.cardDescription,
                                                           value: card.cardDescription,
                                                           comment: card.cardDescriptionComment)

    guard let enrollViewController = PKAddPaymentPassViewController(requestConfiguration: configuration, delegate: self) else {
      completion(.error, [
        "errorMessage": "InApp enrollment controller configuration fails"
      ])
      return
    }
    
    presentAddPaymentPassCompletionHandler = completion
    DispatchQueue.main.async {
      RCTPresentedViewController()?.present(enrollViewController, animated: true, completion: nil)
    }
  }
  
  @objc
  public func IOSHandleAddPaymentPassResponse(payload: NSDictionary, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    guard addPassHandler != nil else {
      reject("add_card_failed", "addPassHandler unavailable", NSError(domain: "", code: 500, userInfo: nil))
      return
    }
    
    let walletData: WalletEncryptedPayload
    do {
      walletData = try WalletEncryptedPayload(data: payload)
    } catch {
      reject("add_card_failed", "Invalid payload data", NSError(domain: "", code: 1002, userInfo: nil))
      return
    }
    
    
    let addPaymentPassRequest = PKAddPaymentPassRequest()
    addPaymentPassRequest.encryptedPassData = walletData.encryptedPassData
    addPaymentPassRequest.activationData = walletData.activationData
    addPaymentPassRequest.ephemeralPublicKey = walletData.ephemeralPublicKey
    addPassHandler?(addPaymentPassRequest)
    self.addPassHandler = nil
    resolve(nil)
  }
  
  @objc
  public func getCardStatus(last4Digits: NSString) -> NSNumber {
    let passLibrary = PKPassLibrary()
    let securePasses = passLibrary.remoteSecureElementPasses
    
    if securePasses.isEmpty {
      print("[react-native-wallet] No passes found in Wallet.")
      return -1
    } else {
      for pass in securePasses {
        guard let securePassElement = pass.secureElementPass else { continue }
        if securePassElement.primaryAccountNumberSuffix.hasSuffix(last4Digits as String) {
          return NSNumber(value: securePassElement.passActivationState.rawValue)
        }
      }
    }
    return -1;
  }
  
  private func isPassKitAvailable() -> Bool {
    return PKAddPaymentPassViewController.canAddPaymentPass()
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
    
          if let presentPasshandler = presentAddPaymentPassCompletionHandler {
            addPassHandler = handler
            let reqestCardData = AddPassResponse(status: .completed, nonce: stringNonce, nonceSignature: stringNonceSignature, certificates: stringCertificates)
            presentPasshandler(.completed, reqestCardData.toNSDictionary())
            presentAddPaymentPassCompletionHandler = nil
          }
  }
    
  public func addPaymentPassViewController(
        _ controller: PKAddPaymentPassViewController,
        didFinishAdding pass: PKPaymentPass?,
        error: Error?) {
          // This method will be called when enroll process ends (with success / error)
          RCTPresentedViewController()?.dismiss(animated: true, completion: nil)
            
          if let handler = presentAddPaymentPassCompletionHandler {
            let response = AddPassResponse(status: .canceled, nonce: nil, nonceSignature: nil, certificates: nil)
            handler(.canceled, response.toNSDictionary())
            presentAddPaymentPassCompletionHandler = nil
          }
          
          if let error = error as? NSError {
            print("[react-native-wallet] \(error)")
            delegate?.sendEvent(name: Event.onCardActivated.rawValue, result:  [
              "state": "canceled"
            ]);
          }
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
