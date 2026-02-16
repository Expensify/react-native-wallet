package com.expensify.wallet.model

import com.google.android.gms.tapandpay.issuer.UserAddress

data class CardData(
  val platform: String = "android",
  val network: String,
  val opaquePaymentCard: String, // TSP OPC
  val googleOpaquePaymentCard: String? = null,
  val cardHolderName: String,
  val lastDigits: String,
  val userAddress: UserAddress,
  val isVirtualCard: Boolean = false,
  val isBounceProvisioned: Boolean = false,
)
