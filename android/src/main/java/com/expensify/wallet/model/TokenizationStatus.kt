package com.expensify.wallet.model

enum class TokenizationStatus {
  SUCCESS,
  CANCELED,
  ERROR
}

fun TokenizationStatus.lowercaseName(): String = this.name.lowercase()
