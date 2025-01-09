package com.expensify.wallet

import android.app.Activity
import android.app.Activity.RESULT_CANCELED
import android.app.Activity.RESULT_OK
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.PromiseImpl
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.google.android.gms.tapandpay.TapAndPay
import com.google.android.gms.tapandpay.TapAndPayClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import com.wallet.Utils.getAsyncResult
import com.wallet.model.CardStatus
import com.wallet.model.WalletData


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

  @ReactMethod
  override fun getSecureWalletInfo(promise: Promise) {
    CoroutineScope(Dispatchers.Main).launch {
      try {
        val walletId = async { getWalletIdAsync() }
        val hardwareId = async { getHardwareIdAsync() }
        val walletData = WalletData(
          platform = "android", deviceID = hardwareId.await(), walletAccountID = walletId.await()
        )

        val walletDataMap: WritableMap = Arguments.createMap().apply {
          putString("platform", walletData.platform)
          putString("deviceID", walletData.deviceID)
          putString("walletAccountID", walletData.walletAccountID)
        }

        promise.resolve(walletDataMap)
      } catch (e: Exception) {
        promise.reject("Error", "Failed to retrieve IDs: ${e.localizedMessage}")
      }
    }
  }

  @ReactMethod
  override fun getCardStatus(last4Digits: String, promise: Promise) {
    if (!ensureTapAndPayClientInitialized(promise)) {
      return
    }

    tapAndPayClient!!.listTokens()
      .addOnCompleteListener { task ->
        if (!task.isSuccessful || task.result == null) {
          promise.reject("Error", "No tokens available")
          return@addOnCompleteListener
        }
        task.result.find { it.fpanLastFour == last4Digits }?.let {
          Log.i("getCardStatus", "Card Token State: ${it.tokenState}")
          promise.resolve(
            getCardStatusCode(it.tokenState)
          )
        } ?: promise.resolve(CardStatus.NOT_FOUND_IN_WALLET.code)
      }
      .addOnFailureListener { e -> promise.reject("getCardStatus function failed", e) }
      .addOnCanceledListener {
        promise.reject(
          "Reject",
          "Card status retrieval canceled"
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

  private fun getHardwareId(promise: Promise) {
    if (!ensureTapAndPayClientInitialized(promise)) {
      return
    }
    tapAndPayClient!!.stableHardwareId.addOnCompleteListener { task ->
      if (task.isSuccessful) {
        val hardwareId = task.result
        promise.resolve(hardwareId)
      }
    }.addOnFailureListener { e ->
      promise.reject("Stable hardware id retrieval failed", e)
    }.addOnCanceledListener {
      promise.reject(
        "Reject: ", "Stable hardware id retrieval canceled"
      )
    }
  }

  private fun getCardStatusCode(code: Int): Int {
    return when (code) {
      TapAndPay.TOKEN_STATE_ACTIVE -> CardStatus.ACTIVE.code
      TapAndPay.TOKEN_STATE_PENDING -> CardStatus.PENDING.code
      TapAndPay.TOKEN_STATE_SUSPENDED -> CardStatus.SUSPENDED.code
      TapAndPay.TOKEN_STATE_NEEDS_IDENTITY_VERIFICATION -> CardStatus.REQUIRE_IDENTITY_VERIFICATION.code
      TapAndPay.TOKEN_STATE_FELICA_PENDING_PROVISIONING -> CardStatus.PENDING.code
      else -> CardStatus.NOT_FOUND_IN_WALLET.code
    }
  }

  private suspend fun getWalletIdAsync(): String = getAsyncResult (String::class.java) { promise ->
    getWalletId(promise)
  }

  private suspend fun getHardwareIdAsync(): String = getAsyncResult(String::class.java) { promise ->
    getHardwareId(promise)
  }

  override fun getName(): String {
    return NAME
  }
}
