import PassKit

struct AddPassResponse {
  let status: OperationResult
  let nonce: NSString?
  let nonceSignature: NSString?
  let certificates: [NSString]?
  
  func toNSDictionary() -> NSDictionary {
    if status.rawValue > 0 {
      return [
        "status": status.rawValue,
      ]
    }
    
    guard let nonce = nonce,
          let nonceSignature = nonceSignature,
          let certificates = certificates else {
      return [:]
    }
    
    return [
      "status": status.rawValue,
      "nonce": nonce,
      "nonceSignature": nonceSignature,
      "certificates": certificates
    ]
  }
}

@objc public enum OperationResult: Int {
  case completed = 0
  case canceled
  case retry
  case error
}
