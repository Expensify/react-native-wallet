package com.expensify.wallet

import android.app.Activity
import android.app.Activity.RESULT_CANCELED
import android.app.Activity.RESULT_OK
import android.content.ActivityNotFoundException
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.PromiseImpl
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.tapandpay.TapAndPay
import com.google.android.gms.tapandpay.TapAndPayClient
import com.google.android.gms.tapandpay.issuer.PushTokenizeRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.expensify.wallet.Utils.getAsyncResult
import com.expensify.wallet.Utils.toCardData
import com.expensify.wallet.error.InvalidNetworkError
import com.expensify.wallet.event.OnCardActivatedEvent
import com.expensify.wallet.model.CardStatus
import com.expensify.wallet.model.WalletData
import com.google.android.gms.common.api.ApiException
import kotlinx.coroutines.Deferred
import java.nio.charset.Charset
import java.util.Locale


class WalletModule internal constructor(context: ReactApplicationContext) : NativeWalletSpec(context) {
  companion object {
    const val NAME = "Wallet"
    const val REQUEST_CODE_PUSH_TOKENIZE: Int = 0xA001
    const val REQUEST_CREATE_WALLET: Int = 0xA002

    const val TSP_VISA: String = "VISA"

    const val E_SDK_API = "SDK API Error"
    const val E_OPERATION_FAILED = "E_OPERATION_FAILED"
    const val E_NO_TOKENS_AVAILABLE = "E_NO_TOKENS_AVAILABLE"
    const val E_INVALID_DATA = "E_INVALID_DATA"
    const val E_INIT = "E_INIT"
  }

  private val tapAndPayClient: TapAndPayClient = TapAndPay.getClient(currentActivity!!)
  private var pendingCreateWalletPromise: Promise? = null

  override fun initialize() {
    super.initialize()
    reactApplicationContext.addActivityEventListener(cardListener)
  }

  private val cardListener = object : ActivityEventListener {
    override fun onActivityResult(
      activity: Activity?, requestCode: Int, resultCode: Int, intent: Intent?
    ) {
      if (requestCode == REQUEST_CREATE_WALLET) {
        pendingCreateWalletPromise?.resolve(resultCode == RESULT_OK)
        pendingCreateWalletPromise = null
      } else if (requestCode == REQUEST_CODE_PUSH_TOKENIZE) {
        if (resultCode == RESULT_OK) {
          intent?.let{
            val tokenId = it.getStringExtra(TapAndPay.EXTRA_ISSUER_TOKEN_ID).toString()
            sendEvent(context, OnCardActivatedEvent.NAME, OnCardActivatedEvent("active", tokenId).toMap())
          }
        } else if (resultCode == RESULT_CANCELED) {
          sendEvent(context, OnCardActivatedEvent.NAME, OnCardActivatedEvent("canceled", null).toMap())
        }
      }
    }
    override fun onNewIntent(p0: Intent?) {}
  }

  @ReactMethod
  override fun checkWalletAvailability(promise: Promise) {
    val localPromise = PromiseImpl({ _ ->
      promise.resolve(true)
    }, { _ ->
      pendingCreateWalletPromise = promise
      tapAndPayClient.createWallet(currentActivity!!, REQUEST_CREATE_WALLET)
    })
    getWalletId(localPromise)
  }

  @ReactMethod
  override fun getSecureWalletInfo(promise: Promise) {
    CoroutineScope(Dispatchers.Main).launch {
      try {
        val walletId = getWalletIdAsync()
        val hardwareId = getHardwareIdAsync()
        val walletData = WalletData(
          platform = "android", deviceID = hardwareId.await(), walletAccountID = walletId.await()
        )

        val walletDataMap: WritableMap = Arguments.createMap().apply {
          putString("platform", walletData.platform)
          putString("deviceID", walletData.deviceID)
          putString("walletAccountID", walletData.walletAccountID)
        }

        promise.resolve(walletDataMap)
      } catch (e: ApiException) {
        promise.reject(E_SDK_API, e.localizedMessage)
      } catch (e: Exception) {
        promise.reject(E_OPERATION_FAILED, "Failed to retrieve IDs: ${e.localizedMessage}")
      }
    }
  }

  @ReactMethod
  override fun getCardStatus(last4Digits: String, promise: Promise) {
    tapAndPayClient.listTokens()
      .addOnCompleteListener { task ->
        if (!task.isSuccessful || task.result == null) {
          promise.reject(E_NO_TOKENS_AVAILABLE, "No tokens available")
          return@addOnCompleteListener
        }
        task.result.find { it.fpanLastFour == last4Digits }?.let {
          promise.resolve(
            getCardStatusCode(it.tokenState)
          )
        } ?: promise.resolve(CardStatus.NOT_FOUND_IN_WALLET.code)
      }
      .addOnFailureListener { e ->
        promise.reject(E_OPERATION_FAILED, "getCardStatus function failed", e)
      }
  }

  @ReactMethod
  override fun getCardTokenStatus(tsp: String, tokenRefId: String, promise: Promise) {
    tapAndPayClient.getTokenStatus(getTokenServiceProvider(tsp), tokenRefId)
      .addOnCompleteListener { task ->
        if (!task.isSuccessful || task.result == null) {
          promise.resolve(CardStatus.NOT_FOUND_IN_WALLET.code)
          return@addOnCompleteListener
        }
        task.result?.let {
          promise.resolve(
            getCardStatusCode(it.tokenState)
          )
        } ?: promise.resolve(CardStatus.NOT_FOUND_IN_WALLET.code)
      }
      .addOnFailureListener { e ->
        promise.reject(E_OPERATION_FAILED, "getCardStatus: ${e.localizedMessage}")
      }
  }

  @ReactMethod
  override fun addCardToWallet(
    data: ReadableMap, promise: Promise
  ) {
    try {
      val cardData = data.toCardData() ?: return promise.reject(E_INVALID_DATA, "Insufficient data")

      val cardNetwork = getCardNetwork(cardData.network)
      val tokenServiceProvider = getTokenServiceProvider(cardData.network)

      val pushTokenizeRequest = PushTokenizeRequest.Builder()
        .setOpaquePaymentCard(cardData.opaquePaymentCard.toByteArray(Charset.forName("UTF-8")))
        .setNetwork(cardNetwork)
        .setTokenServiceProvider(tokenServiceProvider)
        .setDisplayName(cardData.cardHolderName)
        .setLastDigits(cardData.lastDigits)
        .setUserAddress(cardData.userAddress)
        .build()

      tapAndPayClient.pushTokenize(
        currentActivity!!, pushTokenizeRequest, REQUEST_CODE_PUSH_TOKENIZE
      )
    } catch (e: java.lang.Exception) {
      promise.reject(e)
    }
  }

  private fun getWalletId(promise: Promise) {
    tapAndPayClient.activeWalletId.addOnCompleteListener { task ->
      if (task.isSuccessful) {
        val walletId = task.result
        if (walletId != null) {
          promise.resolve(walletId)
        }
      }
    }.addOnFailureListener { e ->
      promise.reject(E_OPERATION_FAILED, "Wallet id retrieval failed: ${e.localizedMessage}")
    }
  }

  private fun getHardwareId(promise: Promise) {
    tapAndPayClient.stableHardwareId.addOnCompleteListener { task ->
      if (task.isSuccessful) {
        val hardwareId = task.result
        promise.resolve(hardwareId)
      }
    }.addOnFailureListener { e ->
      promise.reject(E_OPERATION_FAILED, "Stable hardware id retrieval failed: ${e.localizedMessage}")
    }
  }

  private fun getCardStatusCode(code: Int): Int {
    return when (code) {
      TapAndPay.TOKEN_STATE_ACTIVE -> CardStatus.ACTIVE.code
      TapAndPay.TOKEN_STATE_PENDING -> CardStatus.PENDING.code
      TapAndPay.TOKEN_STATE_SUSPENDED -> CardStatus.SUSPENDED.code
      TapAndPay.TOKEN_STATE_NEEDS_IDENTITY_VERIFICATION -> CardStatus.REQUIRE_AUTHORIZATION.code
      TapAndPay.TOKEN_STATE_FELICA_PENDING_PROVISIONING -> CardStatus.PENDING.code
      else -> CardStatus.NOT_FOUND_IN_WALLET.code
    }
  }

  private fun getCardNetwork(network: String): Int {
    return when (network.uppercase(Locale.getDefault())) {
      TSP_VISA -> TapAndPay.CARD_NETWORK_VISA
      else -> throw InvalidNetworkError()
    }
  }

  private fun getTokenServiceProvider(network: String): Int {
    return when (network.uppercase(Locale.getDefault())) {
      TSP_VISA -> TapAndPay.TOKEN_PROVIDER_VISA
      else -> throw InvalidNetworkError()
    }
  }

  private suspend fun getWalletIdAsync(): Deferred<String> = getAsyncResult (String::class.java) { promise ->
    getWalletId(promise)
  }

  private suspend fun getHardwareIdAsync(): Deferred<String> = getAsyncResult(String::class.java) { promise ->
    getHardwareId(promise)
  }

  private fun sendEvent(reactContext: ReactContext, eventName: String, params: WritableMap?) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  override fun getName(): String {
    return NAME
  }
}
