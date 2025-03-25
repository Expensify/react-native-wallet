import PassKit

struct CardInfo {
  let network: PKPaymentNetwork
  let cardHolderTitle: String
  let cardHolderName: String
  let lastDigits: String
  let cardDescription: String
  let cardDescriptionComment: String

  init(cardData: NSDictionary) throws {
    guard let networkString = cardData["network"] as? String,
          let network = CardInfo.getNetwork(from: networkString),
          let cardHolderTitle = cardData["cardHolderTitle"] as? String,
          let cardHolderName = cardData["cardHolderName"] as? String,
          let lastDigits = cardData["lastDigits"] as? String,
          let cardDescription = cardData["cardDescription"] as? String,
          let cardDescriptionComment = cardData["cardDescriptionComment"] as? String else {
      throw CardInfoError.invalidData(description: "Required data fields are missing or invalid.")
    }
    
    self.network = network
    self.cardHolderTitle = cardHolderTitle
    self.cardHolderName = cardHolderName
    self.lastDigits = lastDigits
    self.cardDescription = cardDescription
    self.cardDescriptionComment = cardDescriptionComment
  }

  private static func getNetwork(from identifier: String) -> PKPaymentNetwork? {
    switch identifier.lowercased() {
    case "visa": return .visa
    default: return nil
    }
  }
}

enum CardInfoError: Error {
  case invalidData(description: String)
}
