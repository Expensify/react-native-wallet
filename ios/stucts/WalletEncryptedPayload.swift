struct WalletEncryptedPayload {
  let activationData: Data?
  let ephemeralPublicKey: Data?
  let encryptedPassData: Data?

  init?(data: NSDictionary) {
    guard let activationData = data["activationData"] as? Data?,
          let ephemeralPublicKey = data["ephemeralPublicKey"] as? Data?,
          let encryptedPassData = data["encryptedPassData"] as? Data? else {
      return nil
    }
    
    self.activationData = activationData
    self.ephemeralPublicKey = ephemeralPublicKey
    self.encryptedPassData = encryptedPassData
  }
}
