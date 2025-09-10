package com.expensify.wallet.components

import android.content.Context
import android.widget.FrameLayout
import com.expensify.wallet.R
import android.view.LayoutInflater
import android.view.View

class RNAddToWalletButtonView(context: Context) : FrameLayout(context) {

  private var buttonView: View? = null
  private var buttonType: String = "basic"

  init {
    setupButton()
  }

  fun setButtonType(type: String) {
    if (buttonType != type) {
      buttonType = type
      setupButton()
    }
  }

  private fun setupButton() {
    removeAllViews()

    val inflater = LayoutInflater.from(context)
    val layoutId = when (buttonType.lowercase()) {
      "badge" -> R.layout.add_to_googlewallet_badge
      else -> R.layout.add_to_googlewallet_button
    }
    buttonView = inflater.inflate(layoutId, this, false).apply {
      layoutParams = LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.MATCH_PARENT
      )
    }

    addView(buttonView)
  }
}
