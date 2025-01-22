package com.expensify.wallet.event

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap


class OnCardActivatedEvent(private val status: String, private val tokenId: String?) {
  fun toMap(): WritableMap? {
    val params = Arguments.createMap()
    params.putString("status", status)
    params.putString("tokenId", tokenId)
    return params
  }

}
