package com.wallet

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.google.android.gms.tapandpay.issuer.UserAddress
import com.wallet.model.CardData
import kotlinx.coroutines.Dispatchers
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
  ): String = withContext(Dispatchers.IO) {
    suspendCancellableCoroutine { continuation ->
      val promise = object : Promise {
        override fun resolve(result: Any?) {
          if (resultType.isInstance(result)) {
            continuation.resume(result as String)
          } else {
            continuation.resumeWithException(
              RuntimeException("Expected result of type ${resultType.simpleName}, but got ${result?.javaClass?.simpleName}")
            )
          }
        }

        override fun reject(code: String?, message: String?) {
          var errorMessage = "Unknown error during async operation"
          if (code != null || message != null) {
            errorMessage = "Error during async operation\nCode: $code\nMessage: $message"
          }
          continuation.resumeWithException(
            Exception(errorMessage)
          )
        }

        override fun reject(message: String?, e: Throwable?) {
          continuation.resumeWithException(
            e ?: Exception(message ?: "Unknown error during async operation")
          )
        }

        override fun reject(p0: String?, p1: String?, e: Throwable?) {
          var message = "Unknown error during async operation"
          if(p0 != null || p1 != null){
            message = "Error during async operation: $p0\n$p1"
          }
          continuation.resumeWithException(
            e ?: Exception(message)
          )
        }

        override fun reject(e: Throwable?) {
          continuation.resumeWithException(
            e ?: Exception("Unknown error during async operation")
          )
        }

        override fun reject(p0: Throwable?, p1: WritableMap?) {
          TODO("Not yet implemented")
        }

        override fun reject(p0: String?, p1: WritableMap) {
          TODO("Not yet implemented")
        }

        override fun reject(p0: String?, p1: Throwable?, p2: WritableMap?) {
          TODO("Not yet implemented")
        }

        override fun reject(p0: String?, p1: String?, p2: WritableMap) {
          TODO("Not yet implemented")
        }

        override fun reject(p0: String?, p1: String?, p2: Throwable?, p3: WritableMap?) {
          TODO("Not yet implemented")
        }

        override fun reject(message: String?) {
          continuation.resumeWithException(
            Exception(message ?: "Unknown error during async operation")
          )
        }

      }
      getPromiseOperation(promise)
    }
  }

}
