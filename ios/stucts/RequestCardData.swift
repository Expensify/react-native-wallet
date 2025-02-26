import PassKit

struct RequestCardData {
    let nonce: String
    let nonceSignature: String
    let certificates: [String]
}

@objc public enum OperationResult: Int {
    case completed = 0
    case canceled
    case error
}
