package com.expensify.wallet.components

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class RNAddToWalletButtonManager : SimpleViewManager<RNAddToWalletButtonView>() {

  override fun getName(): String = "RNAddToWalletButton"

  override fun createViewInstance(reactContext: ThemedReactContext): RNAddToWalletButtonView {
    return RNAddToWalletButtonView(reactContext)
  }

  @ReactProp(name = "buttonType")
  fun setButtonType(view: RNAddToWalletButtonView, type: String) {
    view.setButtonType(type)
  }
}
