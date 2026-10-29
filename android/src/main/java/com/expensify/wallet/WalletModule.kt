package com.expensify.wallet

import android.app.Activity
import android.app.Activity.RESULT_CANCELED
import android.app.Activity.RESULT_OK
import android.content.ActivityNotFoundException
import android.content.Intent
import androidx.core.content.IntentCompat
import com.expensify.wallet.Utils.getAsyncResult
import com.expensify.wallet.Utils.toCardData
import com.expensify.wallet.error.InvalidNetworkError
import com.expensify.wallet.event.OnCardActivatedEvent
import com.expensify.wallet.model.CardData
import com.expensify.wallet.model.CardStatus
import com.expensify.wallet.model.TokenizationStatus
import com.expensify.wallet.model.WalletData
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
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tapandpay.TapAndPay
import com.google.android.gms.tapandpay.TapAndPayClient
import com.google.android.gms.tapandpay.issuer.GeneratePaymentCredentialsException
import com.google.android.gms.tapandpay.issuer.GeneratePaymentCredentialsRequest
import com.google.android.gms.tapandpay.issuer.GeneratePaymentCredentialsResponse
import com.google.android.gms.tapandpay.issuer.GetTokenStatusRequest
import com.google.android.gms.tapandpay.issuer.HasEligibleTokenizationTargetRequest
import com.google.android.gms.tapandpay.issuer.ListTokensRequest
import com.google.android.gms.tapandpay.issuer.PaymentCredentialsGenerator
import com.google.android.gms.tapandpay.issuer.PushTokenizeExtraOptions
import com.google.android.gms.tapandpay.issuer.PushTokenizeRequest
import com.google.android.gms.tapandpay.issuer.PushTokenizeResult
import com.google.android.gms.tapandpay.issuer.TokenizeRequest
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.withTimeoutOrNull
import java.nio.charset.Charset
import java.util.Locale
import java.util.UUID
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Future


class WalletModule internal constructor(context: ReactApplicationContext) :
  NativeWalletSpec(context) {
  companion object {
    const val NAME = "RNWallet"
    const val REQUEST_CODE_PUSH_TOKENIZE: Int = 0xA001
    const val REQUEST_CODE_RESUME_TOKENIZE: Int = 0xA003
    const val REQUEST_CREATE_WALLET: Int = 0xA002

    const val E_SDK_API = "SDK API Error"
    const val E_OPERATION_FAILED = "E_OPERATION_FAILED"
    const val E_INVALID_DATA = "E_INVALID_DATA"

    const val PAYMENT_CREDENTIALS_TIMEOUT_MS = 60_000L
  }

  private val activity: Activity
    get() = reactApplicationContext.currentActivity ?: throw ActivityNotFoundException()

  private val tapAndPayClient: TapAndPayClient
    get() = TapAndPay.getClient(activity)
  private var pendingCreateWalletPromise: Promise? = null
  private var pendingPushTokenizePromise: Promise? = null
  private val moduleScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

  private val pendingPaymentCredentials = ConcurrentHashMap<String, CompletableDeferred<GeneratePaymentCredentialsResponse>>()

  override fun initialize() {
    super.initialize()
    reactApplicationContext.addActivityEventListener(cardListener)
  }

  override fun invalidate() {
    super.invalidate()
    moduleScope.cancel()
    reactApplicationContext.removeActivityEventListener(cardListener)
    pendingPaymentCredentials.clear()
  }

  private val cardListener = object : ActivityEventListener {
    override fun onActivityResult(
      activity: Activity, requestCode: Int, resultCode: Int, data: Intent?
    ) {
      when (requestCode) {
        REQUEST_CREATE_WALLET -> {
          pendingCreateWalletPromise?.resolve(resultCode == RESULT_OK)
          pendingCreateWalletPromise = null
        }
        REQUEST_CODE_RESUME_TOKENIZE -> handleResumeTokenizeResult(resultCode, data)
        REQUEST_CODE_PUSH_TOKENIZE -> handlePushTokenizeResult(resultCode, data)
      }
    }

    override fun onNewIntent(intent: Intent) {}
  }

  private fun takePendingTokenizePromise(): Promise? =
    pendingPushTokenizePromise.also { pendingPushTokenizePromise = null }

  private fun sendCardActivatedEvent(status: String, tokenId: String?) {
    sendEvent(reactApplicationContext, OnCardActivatedEvent.NAME, OnCardActivatedEvent(status, tokenId).toMap())
  }

  private fun handleResumeTokenizeResult(resultCode: Int, data: Intent?) {
    val promise = takePendingTokenizePromise()
    when (resultCode) {
      RESULT_OK -> {
        sendCardActivatedEvent("activated", data?.getStringExtra(TapAndPay.EXTRA_ISSUER_TOKEN_ID))
        promise?.resolve(TokenizationStatus.SUCCESS.code)
      }
      RESULT_CANCELED -> {
        sendCardActivatedEvent("canceled", null)
        promise?.resolve(TokenizationStatus.CANCELED.code)
      }
      else -> promise?.resolve(TokenizationStatus.ERROR.code)
    }
  }

  private fun handlePushTokenizeResult(resultCode: Int, data: Intent?) {
    val promise = takePendingTokenizePromise()
    if (resultCode == RESULT_CANCELED) {
      sendCardActivatedEvent("canceled", null)
      promise?.resolve(TokenizationStatus.CANCELED.code)
      return
    }

    val result = data?.let {
      IntentCompat.getParcelableExtra(it, TapAndPay.EXTRA_PUSH_TOKENIZE_RESULT, PushTokenizeResult::class.java)
    }

    if (result == null) {
      handlePushTokenizeResultExtras(resultCode, data, promise)
      return
    }

    val successfulOutcome = result.tokenizationOutcomes.firstOrNull { it.tokenResult }
    if (result.cardResult || successfulOutcome != null) {
      sendCardActivatedEvent("activated", successfulOutcome?.issuerTokenId)
      promise?.resolve(TokenizationStatus.SUCCESS.code)
    } else {
      promise?.reject(E_OPERATION_FAILED, "Card not saved. Status: ${result.cardStatus}")
    }
  }

  // Google documents the result both as PushTokenizeResult and as separate extras, so read the extras when the object is missing
  private fun handlePushTokenizeResultExtras(resultCode: Int, data: Intent?, promise: Promise?) {
    val hasTokenResult = data?.hasExtra(TapAndPay.EXTRA_TOKEN_RESULT) == true
    val hasCardResult = data?.hasExtra(TapAndPay.EXTRA_CARD_RESULT) == true

    if (!hasTokenResult && !hasCardResult) {
      if (resultCode == RESULT_OK) {
        sendCardActivatedEvent("activated", data?.getStringExtra(TapAndPay.EXTRA_ISSUER_TOKEN_ID))
        promise?.resolve(TokenizationStatus.SUCCESS.code)
      } else {
        promise?.resolve(TokenizationStatus.ERROR.code)
      }
      return
    }

    val tokenResult = data?.getBooleanExtra(TapAndPay.EXTRA_TOKEN_RESULT, false) == true
    val cardResult = data?.getBooleanExtra(TapAndPay.EXTRA_CARD_RESULT, false) == true
    if (tokenResult || cardResult) {
      val tokenId = if (tokenResult) data?.getStringExtra(TapAndPay.EXTRA_ISSUER_TOKEN_ID) else null
      sendCardActivatedEvent("activated", tokenId)
      promise?.resolve(TokenizationStatus.SUCCESS.code)
    } else {
      promise?.reject(E_OPERATION_FAILED, "Card not saved")
    }
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
      promise.resolve(task.isSuccessful)
    }
  }

  @ReactMethod
  override fun getSecureWalletInfo(promise: Promise) {
    moduleScope.launch {
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
    tapAndPayClient.listTokens(ListTokensRequest.Builder().build())
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
    tapAndPayClient.getTokenStatus(
      GetTokenStatusRequest.Builder()
        .setTokenServiceProvider(getTokenServiceProvider(tsp))
        .setIssuerTokenId(identifier)
        .build()
    )
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
  override fun hasEligibleTokenizationTarget(last4Digits: String, network: String, issuerName: String, promise: Promise) {
    try {
      val request = HasEligibleTokenizationTargetRequest.Builder()
        .setIdentifier(last4Digits)
        .setNetwork(getCardNetwork(network))
        .setTokenServiceProvider(getTokenServiceProvider(network))
        .setIssuerName(issuerName)
        .build()
      tapAndPayClient.hasEligibleTokenizationTarget(request)
        .addOnSuccessListener { promise.resolve(it) }
        .addOnFailureListener { e ->
          promise.reject(E_OPERATION_FAILED, "hasEligibleTokenizationTarget: ${e.localizedMessage}")
        }
    } catch (e: InvalidNetworkError) {
      promise.reject(E_INVALID_DATA, e.message)
    }
  }

  @ReactMethod
  override fun addCardToGoogleWallet(
    data: ReadableMap, promise: Promise
  ) {
    if (pendingPushTokenizePromise != null) {
      return promise.reject(E_OPERATION_FAILED, "A tokenization request is already in progress")
    }
    try {
      val cardData = data.toCardData() ?: return promise.reject(E_INVALID_DATA, "Insufficient data")
      val cardNetwork = getCardNetwork(cardData.network)
      val tokenServiceProvider = getTokenServiceProvider(cardData.network)
      val displayName = getDisplayName(data, cardData.network)
      pendingPushTokenizePromise = promise

      val pushTokenizeExtraOptions = PushTokenizeExtraOptions.newBuilder()
        .setIsBounceProvisioned(cardData.isBounceProvisioned)
        .setEnrollForVirtualCards(cardData.isVirtualCard)
        .build()

      val pushTokenizeRequest = PushTokenizeRequest.Builder()
        .setOpaquePaymentCard(cardData.opaquePaymentCard.toByteArray(Charset.forName("UTF-8")))
        .setNetwork(cardNetwork)
        .setTokenServiceProvider(tokenServiceProvider)
        .setDisplayName(displayName)
        .setLastDigits(cardData.lastDigits)
        .setUserAddress(cardData.userAddress)
        .setPaymentCredentialsGenerator(createPaymentCredentialsGenerator(cardData))
        .setPushTokenizeExtraOptions(pushTokenizeExtraOptions)
        .build()

      tapAndPayClient.pushTokenize(pushTokenizeRequest)
        .addOnSuccessListener { pendingIntent ->
          try {
            activity.startIntentSenderForResult(
              pendingIntent.intentSender,
              REQUEST_CODE_PUSH_TOKENIZE,
              null, 0, 0, 0
            )
          } catch (e: Exception) {
            pendingPushTokenizePromise = null
            promise.reject(E_OPERATION_FAILED, "Failed to launch Google Pay: ${e.message}")
          }
        }
        .addOnFailureListener { e ->
          pendingPushTokenizePromise = null
          promise.reject(E_OPERATION_FAILED, "Google Pay API Error: ${e.message}")
        }
    } catch (e: java.lang.Exception) {
      pendingPushTokenizePromise = null
      promise.reject(e)
    }
  }

  // Google Wallet only understands GeneratePaymentCredentialsException; UNKNOWN_ERROR covers backend failures and timeouts
  private fun paymentCredentialsError() =
    GeneratePaymentCredentialsException(GeneratePaymentCredentialsException.UNKNOWN_ERROR)

  private fun createPaymentCredentialsGenerator(
    cardData: CardData
  ): PaymentCredentialsGenerator {
    return object : PaymentCredentialsGenerator {
      override fun generate(request: GeneratePaymentCredentialsRequest): Future<GeneratePaymentCredentialsResponse> {
        if (!request.googleOpaquePaymentCardRequested) {
          val response = GeneratePaymentCredentialsResponse.Builder()
            .setOpaquePaymentCard(cardData.opaquePaymentCard.toByteArray(Charsets.UTF_8))
            .build()

          return CompletableFuture.completedFuture(response)
        }

        val future = CompletableFuture<GeneratePaymentCredentialsResponse>()
        val credentials = CompletableDeferred<GeneratePaymentCredentialsResponse>()
        val requestId = UUID.randomUUID().toString()
        pendingPaymentCredentials[requestId] = credentials
        moduleScope.launch(start = CoroutineStart.UNDISPATCHED) {
          // null on timeout, on reject, or when invalidate() cancels the scope
          val response = runCatching {
            withTimeoutOrNull(PAYMENT_CREDENTIALS_TIMEOUT_MS) { credentials.await() }
          }.getOrNull()
          pendingPaymentCredentials.remove(requestId)
          if (response != null) {
            future.complete(response)
          } else {
            future.completeExceptionally(paymentCredentialsError())
          }
        }

        val params = Arguments.createMap().apply {
          putString("requestId", requestId)
          putString("serverSessionId", request.serverSessionId)
          putString("walletId", request.walletId)
          putString("tokenRequestorId", request.tokenRequestorId)
          putString("opaquePaymentCard", cardData.opaquePaymentCard)
        }

        // send event to the RN so the Google OPC can be generated on the backend
        sendEvent(reactApplicationContext, "onPaymentCredentialsRequest", params)
        return future
      }

      // This switch enables the UAPP flow
      override fun getGoogleOpaquePaymentCardSupported(): Boolean {
        return true
      }
    }
  }

  @ReactMethod
  override fun AndroidProvidePaymentCredentials(requestId: String, responseData: ReadableMap, promise: Promise) {
    val credentials = pendingPaymentCredentials.remove(requestId)
    if (credentials == null) {
      promise.reject(E_OPERATION_FAILED, "Request ID not found or timed out")
      return
    }

    try {
      val tspOpc = responseData.getString("opaquePaymentCard")
      val googleOpc = responseData.getString("googleOpaquePaymentCard")

      if (tspOpc == null) {
        throw Exception("opaquePaymentCard is required")
      }
      if (googleOpc == null) {
        throw Exception("googleOpaquePaymentCard is required")
      }
      val response = GeneratePaymentCredentialsResponse.Builder()
        .setGoogleOpaquePaymentCard(googleOpc.toByteArray(Charsets.UTF_8))
        .setOpaquePaymentCard(tspOpc.toByteArray(Charsets.UTF_8))
        .build()

      credentials.complete(response)
      promise.resolve(true)

    } catch (e: Exception) {
      credentials.completeExceptionally(paymentCredentialsError())
      promise.reject(E_OPERATION_FAILED, e.message)
    }
  }

  @ReactMethod
  override fun AndroidRejectPaymentCredentials(requestId: String, errorMessage: String, promise: Promise) {
    val credentials = pendingPaymentCredentials.remove(requestId)
    if (credentials == null) {
      promise.reject(E_OPERATION_FAILED, "Request ID not found or timed out")
      return
    }
    credentials.completeExceptionally(paymentCredentialsError())
    promise.resolve(true)
  }

  @ReactMethod
  override fun resumeAddCardToGoogleWallet(data: ReadableMap, promise: Promise) {
    if (pendingPushTokenizePromise != null) {
      return promise.reject(E_OPERATION_FAILED, "A tokenization request is already in progress")
    }
    try {
      val tokenReferenceID = data.getString("tokenReferenceID")
        ?: return promise.reject(E_INVALID_DATA, "Missing tokenReferenceID")

      val network = data.getString("network")
        ?: return promise.reject(E_INVALID_DATA, "Missing network")

      val cardNetwork = getCardNetwork(network)
      val tokenServiceProvider = getTokenServiceProvider(network)
      val displayName = getDisplayName(data, network)
      pendingPushTokenizePromise = promise

      val tokenizeRequest = TokenizeRequest.Builder()
        .setIssuerTokenId(tokenReferenceID)
        .setTokenServiceProvider(tokenServiceProvider)
        .setCardDisplayName(displayName)
        .setCardNetwork(cardNetwork)
        .build()
      tapAndPayClient.tokenize(activity, tokenizeRequest, REQUEST_CODE_RESUME_TOKENIZE)
    } catch (e: java.lang.Exception) {
      pendingPushTokenizePromise = null
      promise.reject(e)
    }
  }

  @ReactMethod
  override fun listTokens(promise: Promise) {
    tapAndPayClient.listTokens(ListTokensRequest.Builder().build())
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

  override fun presentAppleWalletPass(lastDigits: String, promise: Promise?) {
    promise?.resolve(false)
  }

  override fun IOSPresentAddPaymentPassView(cardData: ReadableMap?, promise: Promise?) {
    // no-op
  }

  override fun IOSHandleAddPaymentPassResponse(payload: ReadableMap?, promise: Promise?) {
    // no-op
  }

  override fun canAddCardToAppleWallet(primaryAccountIdentifier: String, lastDigits: String, promise: Promise) {
    promise.resolve(false)
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
