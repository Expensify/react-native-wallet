package com.expensify.wallet.model

enum class CardStatus(val code: Int, val message: String) {
  NOT_FOUND_IN_WALLET(-1, "The card can't be found in your active wallet"),
  ACTIVE(0, "The card is ready to use."),
  REQUIRE_AUTHORIZATION(1, "The card requires identity verification."),
  PENDING(2, "The card is pending."),
  SUSPENDED(3, "The card has been suspended."),
  DEACTIVATED(4, "The card is deactivated.");


  override fun toString(): String {
    return "$message (Code: $code)"
  }
}
