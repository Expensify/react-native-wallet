package com.expensify.wallet.components

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class AddToWalletButtonViewManager : SimpleViewManager<AddToWalletButtonView>() {

  override fun getName(): String = "RNAddToWalletButton"

  override fun createViewInstance(reactContext: ThemedReactContext): AddToWalletButtonView {
    return AddToWalletButtonView(reactContext)
  }

  @ReactProp(name = "buttonType")
  fun setButtonType(view: AddToWalletButtonView, type: String) {
    view.setButtonType(type)
  }
}
