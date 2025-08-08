package com.expensify.wallet.components

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext

class AddToWalletButtonViewManager : SimpleViewManager<AddToWalletButtonView>() {

  override fun getName(): String = "AddToWalletButton"

  override fun createViewInstance(reactContext: ThemedReactContext): AddToWalletButtonView {
    return AddToWalletButtonView(reactContext)
  }
}
