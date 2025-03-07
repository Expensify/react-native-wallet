struct WalletEncryptedPayload {
  let activationData: Data?
  let ephemeralPublicKey: Data?
  let encryptedPassData: Data?

  init?(data: NSDictionary) {
    guard let activationData = data["activationData"] as? String,
          let ephemeralPublicKey = data["ephemeralPublicKey"] as? String,
          let encryptedPassData = data["encryptedPassData"] as? String else {
      return nil
    }
    
    self.activationData = Data(base64Encoded: activationData, options: .ignoreUnknownCharacters)
    self.ephemeralPublicKey = Data(base64Encoded: ephemeralPublicKey, options: .ignoreUnknownCharacters)
    self.encryptedPassData = Data(base64Encoded: encryptedPassData, options: .ignoreUnknownCharacters)
  }
}
