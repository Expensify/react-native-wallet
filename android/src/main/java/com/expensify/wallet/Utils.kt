package com.expensify.wallet

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
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

    return CardData(
      network = this.getString("network") ?: "",
      opaquePaymentCard = this.getString("opaquePaymentCard") ?: "",
      cardHolderName = this.getString("cardHolderName") ?: "",
      lastDigits = this.getString("lastDigits") ?: "",
      userAddress = userAddress
    )
  }

  suspend fun getAsyncResult(
    resultType: Class<String>,
    getPromiseOperation: (Promise) -> Unit
  ): Deferred<String> = coroutineScope {
    async {
      withContext(Dispatchers.IO) {
        suspendCancellableCoroutine { continuation ->
          val promise = object : Promise {
            @Deprecated(
              "Prefer passing a module-specific error code to JS. Using this method will pass the\n        error code EUNSPECIFIED",
              replaceWith = ReplaceWith("reject(code, message)")
            )
            override fun reject(message: String) {
              continuation.resumeWithException(
                Exception(message)
              )
            }

            override fun reject(code: String, userInfo: WritableMap) {
              TODO("Not yet implemented")
            }

            override fun reject(code: String, message: String?) {
              var errorMessage = "Unknown error during async operation"
              if (message != null) {
                errorMessage = "Error during async operation\nCode: $code\nMessage: $message"
              }
              continuation.resumeWithException(
                Exception(errorMessage)
              )
            }

            override fun reject(code: String, message: String?, userInfo: WritableMap) {
              TODO("Not yet implemented")
            }

            override fun reject(code: String, message: String?, throwable: Throwable?) {
              var errorMessage = "Unknown error during async operation"
              if (message != null) {
                errorMessage = "Error during async operation: $code\n$message"
              }
              continuation.resumeWithException(
                throwable ?: Exception(errorMessage)
              )
            }

            override fun reject(code: String, throwable: Throwable?) {
              continuation.resumeWithException(
                throwable ?: Exception(code)
              )
            }

            override fun reject(code: String, throwable: Throwable?, userInfo: WritableMap) {
              TODO("Not yet implemented")
            }

            override fun reject(
              code: String?,
              message: String?,
              throwable: Throwable?,
              userInfo: WritableMap?
            ) {
              TODO("Not yet implemented")
            }

            override fun reject(throwable: Throwable) {
              continuation.resumeWithException(
                throwable
              )
            }

            override fun reject(throwable: Throwable, userInfo: WritableMap) {
              TODO("Not yet implemented")
            }

            override fun resolve(value: Any?) {
              if (resultType.isInstance(value)) {
                continuation.resume(value as String)
              } else {
                continuation.resumeWithException(
                  RuntimeException("Expected result of type ${resultType.simpleName}, but got ${value?.javaClass?.simpleName}")
                )
              }
            }

          }
          getPromiseOperation(promise)
        }
      }
    }
  }

}
