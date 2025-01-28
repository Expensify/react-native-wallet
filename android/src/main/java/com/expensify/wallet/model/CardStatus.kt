package com.expensify.wallet.model

enum class CardStatus(val code: Int, val message: String) {
  NOT_FOUND_IN_WALLET(0, "The card can't be found in your active wallet"),
  REQUIRE_AUTHORIZATION(1, "The card requires identity verification."),
  PENDING(2, "The card is pending."),
  ACTIVE(3, "The card is ready to use."),
  SUSPENDED(4, "The card has been suspended."),
  DEACTIVATED(5, "The card is deactivated.");

  override fun toString(): String {
    return "$message (Code: $code)"
  }
}
