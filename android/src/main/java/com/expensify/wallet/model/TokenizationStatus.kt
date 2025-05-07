package com.expensify.wallet.model

enum class TokenizationStatus(val code: Int,  val message: String) {
  CANCELED(1, "The tokenization has been canceled"),
  SUCCESS(0, "The tokenization has succeeded"),
  ERROR(-1, "There has been an error in tokenization")
}
