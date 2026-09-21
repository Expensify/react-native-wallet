import PassKit

struct CardInfo {
  let network: PKPaymentNetwork
  let cardHolderName: String
  let lastDigits: String
  let cardDescription: String
  let primaryAccountIdentifier: String?

  init(cardData: NSDictionary) throws {
    guard let networkString = cardData["network"] as? String, !networkString.isEmpty,
          let network = CardInfo.getNetwork(from: networkString),
          let cardHolderName = cardData["cardHolderName"] as? String, !cardHolderName.isEmpty,
          let lastDigits = cardData["lastDigits"] as? String, !lastDigits.isEmpty,
          let cardDescription = cardData["cardDescription"] as? String, !cardDescription.isEmpty else {
      throw CardInfoError.invalidData(description: "Required data fields are missing or invalid.")
    }
    
    self.network = network
    self.cardHolderName = cardHolderName
    self.lastDigits = lastDigits
    self.cardDescription = cardDescription
    if let identifier = cardData["primaryAccountIdentifier"] as? String, !identifier.isEmpty {
      self.primaryAccountIdentifier = identifier
    } else {
      self.primaryAccountIdentifier = nil
    }
  }

  private static func getNetwork(from identifier: String) -> PKPaymentNetwork? {
    switch identifier.lowercased() {
    case "visa": return .visa
    case "mastercard": return .masterCard
    case "amex": return .amex
    case "discover": return .discover
    default: return nil
    }
  }
}

enum CardInfoError: Error {
  case invalidData(description: String)
}
