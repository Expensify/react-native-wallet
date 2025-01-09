package com.wallet

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

object Utils {
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
