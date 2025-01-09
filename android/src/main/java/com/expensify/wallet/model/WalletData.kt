package com.wallet.model

data class WalletData(
  val platform: String = "android",
  val deviceID: String,
  val walletAccountID: String,
)
