struct WalletEncryptedPayload {
  let activationData: Data?
  let ephemeralPublicKey: Data?
  let encryptedPassData: Data?
  
  init(data: NSDictionary) throws {
    guard let activationDataString = data["activationData"] as? String,
          let ephemeralPublicKeyString = data["ephemeralPublicKey"] as? String,
          let encryptedPassDataString = data["encryptedPassData"] as? String else {
      throw WalletPayloadError.invalidData(description: "Required data fields are missing or invalid.")
    }
    
    guard let activationData = Data(base64Encoded: activationDataString, options: .ignoreUnknownCharacters),
          let ephemeralPublicKey = Data(base64Encoded: ephemeralPublicKeyString, options: .ignoreUnknownCharacters),
          let encryptedPassData = Data(base64Encoded: encryptedPassDataString, options: .ignoreUnknownCharacters) else {
      throw WalletPayloadError.invalidData(description: "Data encoding failed or data is corrupted.")
    }
    
    self.activationData = activationData
    self.ephemeralPublicKey = ephemeralPublicKey
    self.encryptedPassData = encryptedPassData
  }
}

enum WalletPayloadError: Error {
  case invalidData(description: String)
}
