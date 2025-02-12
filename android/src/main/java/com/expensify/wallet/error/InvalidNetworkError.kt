package com.expensify.wallet.error

class InvalidNetworkError : Error {
  constructor() : super("Unsupported card network, please verify your card details")
  constructor(message: String) : super(message)
}
