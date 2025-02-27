import PassKit

struct CardInfo {
  let network: PKPaymentNetwork
  let cardHolderTitle: String
  let cardHolderName: String
  let lastDigits: String
  let cardDescription: String
  let cardDescriptionComment: String

  init?(cardData: NSDictionary) {
    guard let networkString = cardData["network"] as? String,
          let cardHolderTitle = cardData["cardHolderTitle"] as? String,
          let cardHolderName = cardData["cardHolderName"] as? String,
          let lastDigits = cardData["lastDigits"] as? String,
          let cardDescription = cardData["cardDescription"] as? String,
          let cardDescriptionComment = cardData["cardDescriptionComment"] as? String,
          let network = CardInfo.getNetwork(from: networkString) else {
      return nil
    }
    
    // After ensuring all data needed is gathered and valid
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
