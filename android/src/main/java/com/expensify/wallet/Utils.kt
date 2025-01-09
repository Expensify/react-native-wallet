package com.expensify.wallet

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
              "Prefer passing a module-specific error code to JS. Using this method will pass the error code UNSPECIFIED",
              replaceWith = ReplaceWith("reject(code, message)")
            )
            override fun reject(message: String) {
              continuation.resumeWithException(
                Exception("Error: $message")
              )
            }

            override fun reject(code: String, userInfo: WritableMap) {
              val errorMessage = "Error: $code\nUserInfo: $userInfo"
              continuation.resumeWithException(
                Exception(errorMessage)
              )
            }

            override fun reject(code: String, message: String?) {
              val errorMessage = "Error: $code\nMessage: ${message ?: "No message provided"}"
              continuation.resumeWithException(
                Exception(errorMessage)
              )
            }

            override fun reject(code: String, message: String?, userInfo: WritableMap) {
              val errorMessage =
                "Error: $code\nMessage: ${message ?: "No message provided"}\nUserInfo: $userInfo"
              continuation.resumeWithException(
                Exception(errorMessage)
              )
            }

            override fun reject(code: String, message: String?, throwable: Throwable?) {
              val errorMessage = "Error: $code\nMessage: ${message ?: "No message provided"}"
              continuation.resumeWithException(
                throwable ?: Exception(errorMessage)
              )
            }

            override fun reject(code: String, throwable: Throwable?) {
              val errorMessage = "Error: $code"
              continuation.resumeWithException(
                throwable ?: Exception(errorMessage)
              )
            }

            override fun reject(code: String, throwable: Throwable?, userInfo: WritableMap) {
              val errorMessage = "Error: $code\nUserInfo: $userInfo"
              continuation.resumeWithException(
                throwable ?: Exception(errorMessage)
              )
            }

            override fun reject(
              code: String?,
              message: String?,
              throwable: Throwable?,
              userInfo: WritableMap?
            ) {
              val errorMessage = buildString {
                append("Error: ${code ?: "Unknown code"}")
                if (message != null) append("\nMessage: $message")
                if (userInfo != null) append("\nUserInfo: $userInfo")
              }
              continuation.resumeWithException(
                throwable ?: Exception(errorMessage)
              )
            }

            override fun reject(throwable: Throwable) {
              continuation.resumeWithException(
                throwable
              )
            }

            override fun reject(throwable: Throwable, userInfo: WritableMap) {
              val errorMessage = "Exception occurred\nUserInfo: $userInfo"
              continuation.resumeWithException(
                Exception(errorMessage, throwable)
              )
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
