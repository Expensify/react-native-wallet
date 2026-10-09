package com.expensify.wallet

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.PromiseImpl
import com.facebook.react.bridge.ReadableMap
import com.google.android.gms.tapandpay.issuer.UserAddress
import com.expensify.wallet.model.CardData
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

object Utils {
  fun ReadableMap.toCardData(): CardData? {
    val addressMap = this.getMap("userAddress") ?: return null

    val userAddress = UserAddress.newBuilder()
      .setName(addressMap.getString("name") ?: "")
      .setAddress1(addressMap.getString("addressOne") ?: "")
      .setAddress2(addressMap.getString("addressTwo") ?: "")
      .setLocality(addressMap.getString("locality") ?: "")
      .setAdministrativeArea(addressMap.getString("administrativeArea") ?: "")
      .setCountryCode(addressMap.getString("countryCode") ?: "")
      .setPostalCode(addressMap.getString("postalCode") ?: "")
      .setPhoneNumber(addressMap.getString("phoneNumber") ?: "")
      .build()

    val isVirtual = if (hasKey("isVirtualCard")) this.getBoolean("isVirtualCard") else false
    val isBounce = if (hasKey("isBounceProvisioned")) this.getBoolean("isBounceProvisioned") else false

    return CardData(
      network = this.getString("network") ?: "",
      opaquePaymentCard = this.getString("opaquePaymentCard") ?: "",
      googleOpaquePaymentCard = this.getString("googleOpaquePaymentCard") ?: "",
      cardHolderName = this.getString("cardHolderName") ?: "",
      lastDigits = this.getString("lastDigits") ?: "",
      userAddress = userAddress,
      isVirtualCard = isVirtual,
      isBounceProvisioned = isBounce,
    )
  }

  suspend fun getAsyncResult(
    resultType: Class<String>,
    getPromiseOperation: (Promise) -> Unit
  ): Deferred<String> = coroutineScope {
    async {
      withContext(Dispatchers.IO) {
        suspendCancellableCoroutine { continuation ->
          val promise = PromiseImpl({ args ->
            val value = args.getOrNull(0)
            if (resultType.isInstance(value)) {
              continuation.resume(value as String)
            } else {
              continuation.resumeWithException(
                RuntimeException("Expected result of type ${resultType.simpleName}, but got ${value?.javaClass?.simpleName}")
              )
            }
          }, { args ->
            val error = args.getOrNull(0) as? ReadableMap
            val code = error?.getString("code") ?: "Unknown code"
            val message = error?.getString("message") ?: "No message provided"
            continuation.resumeWithException(
              Exception("Error: $code\nMessage: $message")
            )
          })
          getPromiseOperation(promise)
        }
      }
    }
  }

}
