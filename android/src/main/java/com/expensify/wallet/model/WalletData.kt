package com.expensify.wallet.model

data class WalletData(
  val platform: String = "android",
  val deviceID: String,
  val walletAccountID: String,
)
