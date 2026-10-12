import PassKit

struct AddPassResponse {
  let status: OperationResult
  let nonce: NSString?
  let nonceSignature: NSString?
  let certificates: [NSString]?
  let deviceType: NSString?

  init(status: OperationResult, nonce: NSString?, nonceSignature: NSString?, certificates: [NSString]?, deviceType: NSString? = nil) {
    self.status = status
    self.nonce = nonce
    self.nonceSignature = nonceSignature
    self.certificates = certificates
    self.deviceType = deviceType
  }
  
  func toNSDictionary() -> NSDictionary {
    if status.rawValue > 0 {
      var response: [String: Any] = [
        "status": status.rawValue,
      ]
      if let deviceType = deviceType {
        response["deviceType"] = deviceType
      }
      return response as NSDictionary
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
      response["deviceType"] = deviceType
    }
    return response as NSDictionary
  }
}

@objc public enum OperationResult: Int {
  case completed = 0
  case canceled
  case retry
  case error
}
