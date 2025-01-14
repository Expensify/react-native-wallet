package com.wallet

import com.facebook.react.bridge.ReactApplicationContext

abstract class WalletSpec internal constructor(context: ReactApplicationContext) :
  NativeWalletSpec(context) {
}
