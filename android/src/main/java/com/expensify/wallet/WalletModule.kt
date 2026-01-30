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
import com.expensify.wallet.model.TokenizationStatus
import com.expensify.wallet.model.WalletData
import com.google.android.gms.common.api.ApiException
import kotlinx.coroutines.Deferred
import java.nio.charset.Charset
import java.util.Locale


class WalletModule internal constructor(context: ReactApplicationContext) :
  NativeWalletSpec(context) {
  companion object {
    const val NAME = "RNWallet"
    const val REQUEST_CODE_PUSH_TOKENIZE: Int = 0xA001
    const val REQUEST_CREATE_WALLET: Int = 0xA002

    const val E_SDK_API = "SDK API Error"
    const val E_OPERATION_FAILED = "E_OPERATION_FAILED"
    const val E_INVALID_DATA = "E_INVALID_DATA"
  }

  private val activity: Activity
    get() = reactApplicationContext.currentActivity ?: throw ActivityNotFoundException()

  private val tapAndPayClient: TapAndPayClient
    get() = TapAndPay.getClient(activity)
  private var pendingCreateWalletPromise: Promise? = null
  private var pendingPushTokenizePromise: Promise? = null

  override fun initialize() {
    super.initialize()
    reactApplicationContext.addActivityEventListener(cardListener)
  }

  override fun invalidate() {
    super.invalidate()
    reactApplicationContext.removeActivityEventListener(cardListener)
  }

  private val cardListener = object : ActivityEventListener {
    override fun onActivityResult(
      activity: Activity, requestCode: Int, resultCode: Int, data: Intent?
    ) {
      if (requestCode == REQUEST_CREATE_WALLET) {
        pendingCreateWalletPromise?.resolve(resultCode == RESULT_OK)
        pendingCreateWalletPromise = null
      } else if (requestCode == REQUEST_CODE_PUSH_TOKENIZE) {
        if (resultCode == RESULT_OK) {
          data?.let {
            val tokenId = it.getStringExtra(TapAndPay.EXTRA_ISSUER_TOKEN_ID).toString()
            sendEvent(
              context,
              OnCardActivatedEvent.NAME,
              OnCardActivatedEvent("active", tokenId).toMap()
            )
            pendingPushTokenizePromise?.resolve(TokenizationStatus.SUCCESS.code)
          }
        } else if (resultCode == RESULT_CANCELED) {
          sendEvent(
            context,
            OnCardActivatedEvent.NAME,
            OnCardActivatedEvent("canceled", null).toMap()
          )
          pendingPushTokenizePromise?.resolve(TokenizationStatus.CANCELED.code)
        }
      }
    }

    override fun onNewIntent(intent: Intent) {}
  }

  @ReactMethod
  override fun ensureGoogleWalletInitialized(promise: Promise) {
    val localPromise = PromiseImpl({ _ ->
      promise.resolve(true)
    }, { _ ->
      pendingCreateWalletPromise = promise
      tapAndPayClient.createWallet(activity, REQUEST_CREATE_WALLET)
    })
    getWalletId(localPromise)
  }

  @ReactMethod
  override fun checkWalletAvailability(promise: Promise) {
    tapAndPayClient.environment.addOnCompleteListener { task ->
      if (task.isSuccessful) {
        promise.resolve(true)
      } else {
        promise.resolve(false)
      }
    }.addOnFailureListener { e ->
      promise.reject(E_OPERATION_FAILED, "Checking Wallet availability failed: ${e.localizedMessage}")
    }
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
  override fun getCardStatusBySuffix(last4Digits: String, promise: Promise) {
    tapAndPayClient.listTokens()
      .addOnCompleteListener { task ->
        if (!task.isSuccessful || task.result == null) {
          promise.resolve(CardStatus.NOT_FOUND_IN_WALLET.code)
          return@addOnCompleteListener
        }
        task.result.find { it.fpanLastFour == last4Digits }?.let {
          promise.resolve(
            getCardStatusCode(it.tokenState)
          )
        } ?: promise.resolve(CardStatus.NOT_FOUND_IN_WALLET.code)
      }
      .addOnFailureListener { e ->
        promise.reject(E_OPERATION_FAILED, "getCardStatusBySuffix: ${e.localizedMessage}")
      }
  }

  @ReactMethod
  override fun getCardStatusByIdentifier(identifier: String, tsp: String, promise: Promise) {
    tapAndPayClient.getTokenStatus(getTokenServiceProvider(tsp), identifier)
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
        promise.reject(E_OPERATION_FAILED, "getCardStatusByIdentifier: ${e.localizedMessage}")
      }
  }

  @ReactMethod
  override fun addCardToGoogleWallet(
    data: ReadableMap, promise: Promise
  ) {
    try {
      val cardData = data.toCardData() ?: return promise.reject(E_INVALID_DATA, "Insufficient data")
      val cardNetwork = getCardNetwork(cardData.network)
      val tokenServiceProvider = getTokenServiceProvider(cardData.network)
      val displayName = getDisplayName(data, cardData.network)
      pendingPushTokenizePromise = promise

      val pushTokenizeRequest = PushTokenizeRequest.Builder()
        .setOpaquePaymentCard(cardData.opaquePaymentCard.toByteArray(Charset.forName("UTF-8")))
        .setNetwork(cardNetwork)
        .setTokenServiceProvider(tokenServiceProvider)
        .setDisplayName(displayName)
        .setLastDigits(cardData.lastDigits)
        .setUserAddress(cardData.userAddress)
        .build()

      tapAndPayClient.pushTokenize(
        activity, pushTokenizeRequest, REQUEST_CODE_PUSH_TOKENIZE
      )
    } catch (e: java.lang.Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  override fun resumeAddCardToGoogleWallet(data: ReadableMap, promise: Promise) {
    try {
      val tokenReferenceID = data.getString("tokenReferenceID")
        ?: return promise.reject(E_INVALID_DATA, "Missing tokenReferenceID")

      val network = data.getString("network")
        ?: return promise.reject(E_INVALID_DATA, "Missing network")

      val cardNetwork = getCardNetwork(network)
      val tokenServiceProvider = getTokenServiceProvider(network)
      val displayName = getDisplayName(data, network)
      pendingPushTokenizePromise = promise

      tapAndPayClient.tokenize(
        activity,
        tokenReferenceID,
        tokenServiceProvider,
        displayName,
        cardNetwork,
        REQUEST_CODE_PUSH_TOKENIZE
      )
    } catch (e: java.lang.Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  override fun listTokens(promise: Promise) {
    tapAndPayClient.listTokens()
      .addOnCompleteListener { task ->
        if (!task.isSuccessful || task.result == null) {
          promise.resolve(Arguments.createArray())
          return@addOnCompleteListener
        }
        
        val tokensArray = Arguments.createArray()
        task.result.forEach { tokenInfo ->
          val tokenData = Arguments.createMap().apply {
            putString("identifier", tokenInfo.issuerTokenId)
            putString("lastDigits", tokenInfo.fpanLastFour)
            putInt("tokenState", tokenInfo.tokenState)
          }
          tokensArray.pushMap(tokenData)
        }
        
        promise.resolve(tokensArray)
      }
      .addOnFailureListener { e ->
        promise.reject(E_OPERATION_FAILED, "listTokens: ${e.localizedMessage}")
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
      "VISA" -> TapAndPay.CARD_NETWORK_VISA
      "MASTERCARD" -> TapAndPay.CARD_NETWORK_MASTERCARD
      "AMEX" -> TapAndPay.CARD_NETWORK_AMEX
      "DISCOVER" -> TapAndPay.CARD_NETWORK_DISCOVER
      else -> throw InvalidNetworkError()
    }
  }

  private fun getTokenServiceProvider(network: String): Int {
    return when (network.uppercase(Locale.getDefault())) {
      "VISA" -> TapAndPay.TOKEN_PROVIDER_VISA
      "MASTERCARD" -> TapAndPay.TOKEN_PROVIDER_MASTERCARD
      "AMEX" -> TapAndPay.TOKEN_PROVIDER_AMEX
      "DISCOVER" -> TapAndPay.TOKEN_PROVIDER_DISCOVER
      else -> throw InvalidNetworkError()
    }
  }

  private suspend fun getWalletIdAsync(): Deferred<String> =
    getAsyncResult(String::class.java) { promise ->
      getWalletId(promise)
    }

  private suspend fun getHardwareIdAsync(): Deferred<String> =
    getAsyncResult(String::class.java) { promise ->
      getHardwareId(promise)
    }

  private fun getDisplayName(data: ReadableMap, network: String): String {
    data.getString("cardHolderName")?.let { name ->
      if (name.isNotEmpty()) return name
    }
    
    data.getString("lastDigits")?.let { digits ->
      if (digits.isNotEmpty()) {
        return "${network.uppercase(Locale.getDefault())} Card *$digits"
      }
    }
    
    return "${network.uppercase(Locale.getDefault())} Card"
  }

  private fun sendEvent(reactContext: ReactContext, eventName: String, params: WritableMap?) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  override fun IOSPresentAddPaymentPassView(cardData: ReadableMap?, promise: Promise?) {
    // no-op
  }

  override fun IOSHandleAddPaymentPassResponse(payload: ReadableMap?, promise: Promise?) {
    // no-op
  }

  override fun addListener(eventType: String?) {
    // no-op
  }

  override fun removeListeners(count: Double) {
    // no-op
  }

  override fun getName(): String {
    return NAME
  }
}
