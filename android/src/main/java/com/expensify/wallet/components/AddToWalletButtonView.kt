package com.expensify.wallet.components

import android.content.Context
import android.widget.FrameLayout
import com.expensify.wallet.R
import android.view.LayoutInflater
import android.view.View

class AddToWalletButtonView(context: Context) : FrameLayout(context) {

  private var buttonView: View? = null

  init {
    setupButton()
  }

  private fun setupButton() {
    val inflater = LayoutInflater.from(context)
    buttonView = inflater.inflate(R.layout.add_to_googlewallet_badge, this, false)
    val layoutParams = LayoutParams(
      LayoutParams.MATCH_PARENT,
      LayoutParams.MATCH_PARENT
    )
    buttonView?.layoutParams = layoutParams

    addView(buttonView)
  }
}
