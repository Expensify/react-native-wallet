package com.expensify.wallet.model

enum class TokenizationStatus(val code: Int) {
  CANCELED(1),
  SUCCESS(0),
  ERROR(-1)
}
