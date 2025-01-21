package com.expensify.wallet

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod


class WalletModule internal constructor(context: ReactApplicationContext) : NativeWalletSpec(context) {
  companion object {
    const val NAME = "Wallet"
  }

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  override fun multiply(a: Double, b: Double, promise: Promise) {
    return promise.resolve(a * b)
  }
}
