package com.expensify.wallet.model

import com.google.android.gms.tapandpay.issuer.UserAddress

data class CardData(
  val platform: String = "android",
  val network: String,
  val opaquePaymentCard: String,
  val cardHolderName: String,
  val lastDigits: String,
  val userAddress: UserAddress,
)
