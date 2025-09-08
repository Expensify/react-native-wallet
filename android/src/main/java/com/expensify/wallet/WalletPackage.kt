package com.expensify.wallet

import com.expensify.wallet.components.RNAddToWalletButtonManager
import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.NativeModule
import com.facebook.react.module.annotations.ReactModuleList
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.module.model.ReactModuleInfo
import java.util.HashMap
import com.facebook.react.uimanager.ViewManager

// Fool auto linking for older versions that do not support BaseReactPackage.
// public class WalletPackage implements TurboReactPackage {
@ReactModuleList(
  nativeModules = [
    WalletModule::class,
  ],
)
class WalletPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == WalletModule.NAME) {
      WalletModule(reactContext)
    } else {
      null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
      val isTurboModule: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      moduleInfos[WalletModule.NAME] = ReactModuleInfo(
        WalletModule.NAME,
        WalletModule.NAME,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        hasConstants = true,
        isCxxModule = false,
        isTurboModule
      )
      moduleInfos
    }
  }

  override fun createViewManagers(reactContext: com.facebook.react.bridge.ReactApplicationContext)
    : List<ViewManager<*, *>> = listOf(RNAddToWalletButtonManager())
}
