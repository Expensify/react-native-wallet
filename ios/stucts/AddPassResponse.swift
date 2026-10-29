import PassKit

enum ProvisioningDeviceType: String {
  case phone
  case watch
  case unknown
}

struct AddPassResponse {
  let status: OperationResult
  let nonce: NSString?
  let nonceSignature: NSString?
  let certificates: [NSString]?
  let deviceType: ProvisioningDeviceType?

  init(status: OperationResult, nonce: NSString?, nonceSignature: NSString?, certificates: [NSString]?, deviceType: ProvisioningDeviceType? = nil) {
    self.status = status
    self.nonce = nonce
    self.nonceSignature = nonceSignature
    self.certificates = certificates
    self.deviceType = deviceType
  }
  
  func toNSDictionary() -> NSDictionary {
    if status.rawValue > 0 {
      return [
        "status": status.rawValue,
      ] as NSDictionary
    }
    
    guard let nonce = nonce,
          let nonceSignature = nonceSignature,
          let certificates = certificates else {
      return [:]
    }
    
    var response: [String: Any] = [
      "status": status.rawValue,
      "nonce": nonce,
      "nonceSignature": nonceSignature,
      "certificates": certificates,
    ]
    if let deviceType = deviceType {
      response["deviceType"] = deviceType.rawValue
    }
    return response as NSDictionary
  }
}

@objc public enum OperationResult: Int {
  case declined = -1
  case completed = 0
  case canceled
  case retry
  case error
}
