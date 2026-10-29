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

  private var addPassPrimaryAccountIdentifier: String?
  
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
          "status": "activated",
          "tokenId": pass.serialNumber
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
    let primaryAccountIdentifier = card.primaryAccountIdentifier.map {
      resolvedPrimaryAccountIdentifier($0, lastDigits: card.lastDigits)
    }
    if let primaryAccountIdentifier = primaryAccountIdentifier {
      configuration.primaryAccountIdentifier = primaryAccountIdentifier
    }

    guard let enrollViewController = PKAddPaymentPassViewController(requestConfiguration: configuration, delegate: self) else {
      let alreadyOnEveryDevice = primaryAccountIdentifier.map {
        !passLibrary.canAddSecureElementPass(primaryAccountIdentifier: $0)
      } ?? false
      completion(.error, [
        "errorMessage": alreadyOnEveryDevice
          ? "This card has already been added to all available devices."
          : "InApp enrollment controller configuration fails"
      ])
      return
    }
    
    DispatchQueue.main.async {
      if let enrollVC = self.addPassViewController, enrollVC.isBeingPresented || enrollVC.presentingViewController != nil {
        self.logInfo(message: "EnrollViewController is already presented.")
        completion(.error, [
          "errorMessage": "EnrollViewController is already presented."
        ])
        return
      }

      let presentPassHandler = self.presentAddPaymentPassCompletionHandler
      let addPaymentPassHandler = self.addPaymentPassCompletionHandler
      self.addPassViewController = nil
      self.presentAddPaymentPassCompletionHandler = nil
      self.addPaymentPassCompletionHandler = nil
      self.addPassHandler = nil
      self.addPassPrimaryAccountIdentifier = nil

      let errorResponse: NSDictionary = [
        "errorMessage": "EnrollViewController is no longer presented."
      ]
      presentPassHandler?(.error, errorResponse)
      addPaymentPassHandler?(.error, errorResponse)

      guard let presentingViewController = RCTPresentedViewController() else {
        completion(.error, [
          "errorMessage": "Presenting view controller is unavailable."
        ])
        return
      }

      self.presentAddPaymentPassCompletionHandler = completion
      self.addPassViewController = enrollViewController
      self.addPassPrimaryAccountIdentifier = primaryAccountIdentifier
      presentingViewController.present(enrollViewController, animated: true, completion: nil)
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
      return NSNumber(value: -1)
    }
    
    for pass in paymentPasses {
      guard let securePassElement = pass.secureElementPass else { continue }
      if condition(securePassElement) {
        return NSNumber(value: securePassElement.passActivationState.rawValue)
      }
    }
    return NSNumber(value: -1)
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

  @objc public func listAppleWalletPasses() -> [NSDictionary] {
    let localPasses = passLibrary.passes(of: .secureElement).compactMap { pass -> NSDictionary? in
      guard pass.isRemotePass == false,
            let secureElementPass = pass.secureElementPass else {
        return nil
      }

      return makeAppleWalletPassDictionary(
        passTypeIdentifier: pass.passTypeIdentifier,
        serialNumber: pass.serialNumber,
        primaryAccountIdentifier: secureElementPass.primaryAccountIdentifier,
        lastDigits: secureElementPass.primaryAccountNumberSuffix,
        activationState: secureElementPass.passActivationState.rawValue,
        isRemote: pass.isRemotePass
      )
    }

    let remotePasses = passLibrary.remoteSecureElementPasses.map { pass in
      makeAppleWalletPassDictionary(
        passTypeIdentifier: pass.passTypeIdentifier,
        serialNumber: pass.serialNumber,
        primaryAccountIdentifier: pass.primaryAccountIdentifier,
        lastDigits: pass.primaryAccountNumberSuffix,
        activationState: pass.passActivationState.rawValue,
        isRemote: true
      )
    }

    return localPasses + remotePasses
  }

  @objc public func activateAppleWalletPass(passData: NSDictionary, completion: @escaping CompletionHandler) {
    guard passLibrary.isSecureElementPassActivationAvailable else {
      completion(.error, [
        "errorMessage": "Secure Element pass activation is not available for this device"
      ])
      return
    }

    guard
      let passTypeIdentifier = passData["passTypeIdentifier"] as? String,
      !passTypeIdentifier.isEmpty,
      let serialNumber = passData["serialNumber"] as? String,
      !serialNumber.isEmpty,
      let activationDataString = passData["activationData"] as? String,
      !activationDataString.isEmpty
    else {
      completion(.error, [
        "errorMessage": "Invalid pass activation data"
      ])
      return
    }

    let isRemote = passData["isRemote"] as? Bool

    guard let activationData = Data(base64Encoded: activationDataString) else {
      completion(.error, [
        "errorMessage": "activationData must be a valid base64 encoded string"
      ])
      return
    }

    guard let secureElementPass = findSecureElementPass(
      passTypeIdentifier: passTypeIdentifier,
      serialNumber: serialNumber,
      isRemote: isRemote
    ) else {
      completion(.error, [
        "errorMessage": "Secure Element pass not found"
      ])
      return
    }

    if secureElementPass.passActivationState == .activated {
      completion(.completed, ["success": true])
      return
    }

    guard secureElementPass.passActivationState == .requiresActivation else {
      completion(.error, [
        "errorMessage": "Secure Element pass is not eligible for activation. Current state: \(secureElementPass.passActivationState.rawValue)"
      ])
      return
    }

    passLibrary.activate(secureElementPass, activationData: activationData) { success, error in
      if let error = error {
        completion(.error, [
          "errorMessage": error.localizedDescription
        ])
        return
      }

      completion(.completed, ["success": success])
    }
  }

  @objc public func canAddCardToAppleWallet(primaryAccountIdentifier: NSString, lastDigits: NSString) -> Bool {
    let suffix = lastDigits as String
    let resolved = suffix.isEmpty
      ? primaryAccountIdentifier as String
      : resolvedPrimaryAccountIdentifier(primaryAccountIdentifier as String, lastDigits: suffix)
    return passLibrary.canAddSecureElementPass(primaryAccountIdentifier: resolved)
  }

  private func provisioningTargetDevice(for primaryAccountIdentifier: String?) -> ProvisioningDeviceType {
    guard let primaryAccountIdentifier = primaryAccountIdentifier else {
      return .unknown
    }

    let onPhone = hasProvisionedPass(identifier: primaryAccountIdentifier, in: passLibrary.passes(of: .secureElement))
    let onWatch = hasProvisionedPass(identifier: primaryAccountIdentifier, in: passLibrary.remoteSecureElementPasses)

    if onPhone && !onWatch {
      return .watch
    }
    if onWatch && !onPhone {
      return .phone
    }
    return .unknown
  }

  private func resolvedPrimaryAccountIdentifier(_ identifier: String, lastDigits: String) -> String {
    let passes = allSecureElementPasses()
    if passes.contains(where: { $0.primaryAccountIdentifier == identifier }) {
      return identifier
    }

    guard !lastDigits.isEmpty else {
      return identifier
    }

    let suffixMatches = passes.filter {
      $0.passActivationState != .deactivated && $0.primaryAccountNumberSuffix.hasSuffix(lastDigits)
    }
    let identifiers = Set(suffixMatches.map(\.primaryAccountIdentifier))
    if identifiers.count == 1, let resolvedIdentifier = identifiers.first {
      return resolvedIdentifier
    }
    return identifier
  }

  private func allSecureElementPasses() -> [PKSecureElementPass] {
    let localPasses = passLibrary.passes(of: .secureElement)
      .filter { !$0.isRemotePass }
      .compactMap(\.secureElementPass)
    return localPasses + passLibrary.remoteSecureElementPasses
  }

  private func hasProvisionedPass(identifier: String, in passes: [PKPass]) -> Bool {
    passes.contains { pass in
      guard !pass.isRemotePass, let securePass = pass.secureElementPass else {
        return false
      }
      return isProvisioned(securePass, identifier: identifier)
    }
  }

  private func hasProvisionedPass(identifier: String, in passes: [PKSecureElementPass]) -> Bool {
    passes.contains { isProvisioned($0, identifier: identifier) }
  }

  private func isProvisioned(_ pass: PKSecureElementPass, identifier: String) -> Bool {
    pass.primaryAccountIdentifier == identifier && pass.passActivationState != .deactivated
  }
  
  private func isPassKitAvailable() -> Bool {
    return PKAddPaymentPassViewController.canAddPaymentPass()
  }

  private func findSecureElementPass(passTypeIdentifier: String, serialNumber: String, isRemote: Bool?) -> PKSecureElementPass? {
    if isRemote == true {
      return passLibrary.remoteSecureElementPasses.first { pass in
        pass.passTypeIdentifier == passTypeIdentifier && pass.serialNumber == serialNumber
      }
    }

    if let pass = passLibrary.pass(withPassTypeIdentifier: passTypeIdentifier, serialNumber: serialNumber),
       pass.isRemotePass == false {
      return pass.secureElementPass
    }

    if isRemote == false {
      return nil
    }

    return passLibrary.remoteSecureElementPasses.first { pass in
      pass.passTypeIdentifier == passTypeIdentifier && pass.serialNumber == serialNumber
    }
  }

  private func makeAppleWalletPassDictionary(
    passTypeIdentifier: String,
    serialNumber: String,
    primaryAccountIdentifier: String?,
    lastDigits: String?,
    activationState: Int,
    isRemote: Bool
  ) -> NSDictionary {
    let result = NSMutableDictionary(dictionary: [
      "passTypeIdentifier": passTypeIdentifier,
      "serialNumber": serialNumber,
      "activationState": activationState,
      "isRemote": isRemote
    ])

    if let primaryAccountIdentifier = primaryAccountIdentifier, !primaryAccountIdentifier.isEmpty {
      result["primaryAccountIdentifier"] = primaryAccountIdentifier
    }

    if let lastDigits = lastDigits, !lastDigits.isEmpty {
      result["lastDigits"] = lastDigits
    }

    return result
  }
  
  private func hideModal() {
    guard let enrollVC = addPassViewController else {
      return
    }

    DispatchQueue.main.async {
      guard self.addPassViewController === enrollVC else {
        return
      }

      if enrollVC.isBeingPresented || enrollVC.presentingViewController != nil {
        enrollVC.dismiss(animated: true, completion: {
          if self.addPassViewController === enrollVC {
            self.addPassViewController = nil
          }
        })
      } else {
        self.addPassViewController = nil
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
      guard controller === addPassViewController else {
        return
      }

      let stringNonce = nonce.base64EncodedString() as NSString
      let stringNonceSignature = nonceSignature.base64EncodedString() as NSString
      let stringCertificates = certificates.map {
        $0.base64EncodedString() as NSString
      }
      let deviceType = provisioningTargetDevice(for: addPassPrimaryAccountIdentifier)
      let reqestCardData = AddPassResponse(status: .completed, nonce: stringNonce, nonceSignature: stringNonceSignature, certificates: stringCertificates, deviceType: deviceType)
      self.addPassHandler = handler
      
      // Retry the JS issuer callback if the user tries again to add a payment pass
      if let addPaymentPassHandler = addPaymentPassCompletionHandler {
        // The callback can synchronously register the next completion.
        addPaymentPassCompletionHandler = nil
        addPaymentPassHandler(.retry, reqestCardData.toNSDictionary())
        return
      }
      
      // Finish IOSPresentAddPaymentPassView function
      if let presentPassHandler = presentAddPaymentPassCompletionHandler {
        presentAddPaymentPassCompletionHandler = nil
        presentPassHandler(.completed, reqestCardData.toNSDictionary())
      }
    }
    
  // This method will be called when enroll process ends (with success/error)
  public func addPaymentPassViewController(
    _ controller: PKAddPaymentPassViewController,
    didFinishAdding pass: PKPaymentPass?,
    error: Error?) {
      guard controller === addPassViewController else {
        return
      }

      let presentPassHandler = presentAddPaymentPassCompletionHandler
      let addPaymentPassHandler = addPaymentPassCompletionHandler
      presentAddPaymentPassCompletionHandler = nil
      addPaymentPassCompletionHandler = nil
      addPassHandler = nil
      addPassPrimaryAccountIdentifier = nil

      let errorMessage = error?.localizedDescription ?? ""

      if error != nil {
        self.logInfo(message: "Error: \(errorMessage)")
        delegate?.sendEvent(name: Event.onCardActivated.rawValue, result:  [
          "status": "canceled"
        ]);
      }
      
      // Cancel the IOSPresentAddPaymentPassView function when the user cancelled the modal
      if let handler = presentPassHandler {
        let response = AddPassResponse(status: .canceled, nonce: nil, nonceSignature: nil, certificates: nil)
        handler(.canceled, response.toNSDictionary())
      }
      
      // If the pass is returned complete the IOSHandleAddPaymentPassResponse function.
      // A resolved dictionary (result < .error) carries the outcome. Rejecting
      // would hide whether Wallet already showed its own message.
      if let addPaymentPassHandler = addPaymentPassHandler {
        if let pass = pass {
          let activationState = (pass.secureElementPass?.passActivationState ?? pass.passActivationState).rawValue
          addPaymentPassHandler(.completed, [
            "status": NSNumber(value: OperationResult.completed.rawValue),
            "activationState": NSNumber(value: activationState),
          ])
        } else if let nsError = error as NSError?,
                  nsError.domain == PKPassKitErrorDomain,
                  nsError.code == PKAddPaymentPassError.userCancelled.rawValue {
          addPaymentPassHandler(.canceled, [
            "status": NSNumber(value: OperationResult.canceled.rawValue),
          ])
        } else if let nsError = error as NSError? {
          addPaymentPassHandler(.declined, [
            "status": NSNumber(value: OperationResult.declined.rawValue),
            "errorDomain": nsError.domain,
            "errorCode": NSNumber(value: nsError.code),
          ])
        } else {
          addPaymentPassHandler(.error, [
            "errorMessage": "Could not add card. \(errorMessage)."
          ])
        }
      }

      hideModal()
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
