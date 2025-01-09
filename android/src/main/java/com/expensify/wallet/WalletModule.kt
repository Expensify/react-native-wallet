package com.expensify.wallet

import android.app.Activity
import android.app.Activity.RESULT_CANCELED
import android.app.Activity.RESULT_OK
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.PromiseImpl
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.google.android.gms.tapandpay.TapAndPay
import com.google.android.gms.tapandpay.TapAndPayClient


class WalletModule internal constructor(context: ReactApplicationContext) : NativeWalletSpec(context) {
  companion object {
    const val NAME = "Wallet"
    const val REQUEST_CREATE_WALLET: Int = 4
  }

  private var tapAndPayClient: TapAndPayClient? = null
  private var pendingCreateWalletPromise: Promise? = null

  init {
    reactApplicationContext.addActivityEventListener(object : ActivityEventListener {
      override fun onActivityResult(
        activity: Activity?, requestCode: Int, resultCode: Int, intent: Intent?
      ) {
        if (requestCode == REQUEST_CREATE_WALLET) {
          pendingCreateWalletPromise?.resolve(resultCode == RESULT_OK)
          pendingCreateWalletPromise = null
        }
      }
      override fun onNewIntent(p0: Intent?) {}
    })
  }

  @ReactMethod
  override fun checkWalletAvailability(promise: Promise) {
    val localPromise = PromiseImpl({ _ ->
      promise.resolve(true)
    }, { _ ->
      pendingCreateWalletPromise = promise
      tapAndPayClient!!.createWallet(currentActivity!!, REQUEST_CREATE_WALLET)
    })
    getWalletId(localPromise)
  }

  private fun getWalletId(promise: Promise) {
    if (!ensureTapAndPayClientInitialized(promise)) {
      return
    }
    tapAndPayClient!!.activeWalletId.addOnCompleteListener { task ->
      if (task.isSuccessful) {
        val walletId = task.result
        if (walletId != null) {
          promise.resolve(walletId)
        }
      }
    }.addOnFailureListener { e ->
      promise.reject("Wallet id retrieval failed", e)
    }.addOnCanceledListener {
      promise.reject(
        "Reject: ", "Wallet id retrieval canceled"
      )
    }
  }

  private fun ensureTapAndPayClientInitialized(promise: Promise): Boolean {
    if (tapAndPayClient == null && currentActivity != null) {
      tapAndPayClient = TapAndPay.getClient(currentActivity!!)
    }
    if (tapAndPayClient == null) {
      promise.reject("Initialization error", "TapAndPay client initialization failed")
      return false
    }
    return true
  }

  override fun getName(): String {
    return NAME
  }
}
