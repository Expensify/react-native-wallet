import {execSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, readdirSync, statSync} from 'node:fs';
import {extname, join, resolve} from 'node:path';
import type {ConfigPlugin} from '@expo/config-plugins';
import {createRunOncePlugin, withInfoPlist, withProjectBuildGradle} from '@expo/config-plugins';
import {createGeneratedHeaderComment, removeGeneratedContents} from '@expo/config-plugins/build/utils/generateCode';

export type ReactNativeWalletConfig = {
  /**
   * Path to the Google TapAndPay SDK for Android
   * This should be the path to a ZIP file containing the Google TapAndPay SDK files,
   * or a directory containing the SDK files, or a single SDK file (.aar)
   */
  googleTapAndPaySdkPath?: string;
  /**
   * iOS Apple Pay In-App Provisioning entitlement
   * default true
   */
  enableApplePayProvisioning?: boolean;
};

interface AppendContentsParams {
  src: string;
  newSrc: string;
  tag: string;
  comment: string;
}

function appendContents({src, newSrc, tag, comment}: AppendContentsParams): {
  contents: string;
  didClear: boolean;
  didMerge: boolean;
} {
  const header = createGeneratedHeaderComment(newSrc, tag, comment);
  if (!src.includes(header)) {
    const sanitizedTarget = removeGeneratedContents(src, tag);
    const contentsToAdd = [header, newSrc, `${comment} @generated end ${tag}`].join('\n');

    return {
      contents: `${sanitizedTarget ?? src}\n${contentsToAdd}`,
      didClear: !!sanitizedTarget,
      didMerge: true,
    };
  }
  return {contents: src, didClear: false, didMerge: false};
}

/**
 * Copy Google TapAndPay SDK files to Android libs directory
 */
function copyGoogleTapAndPaySdk(projectRoot: string, sdkPath: string): void {
  const resolvedSdkPath = resolve(projectRoot, sdkPath);
  const androidLibsPath = join(projectRoot, 'android', 'libs');

  // Create libs directory if it doesn't exist
  if (!existsSync(androidLibsPath)) {
    mkdirSync(androidLibsPath, {recursive: true});
  }

  // Check if SDK path exists
  if (!existsSync(resolvedSdkPath)) {
    throw new Error(`Google TapAndPay SDK path not found: ${resolvedSdkPath}`);
  }

  const fileExtension = extname(resolvedSdkPath).toLowerCase();

  if (fileExtension === '.zip') {
    // Extract ZIP file contents using system unzip command
    try {
      execSync(`unzip -o "${resolvedSdkPath}" -d "${androidLibsPath}"`, {
        stdio: 'pipe',
      });
    } catch (error) {
      throw new Error(`Failed to extract ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else if (statSync(resolvedSdkPath).isDirectory()) {
    // Copy all files from SDK directory to libs
    const files = readdirSync(resolvedSdkPath);
    files.forEach((file) => {
      const srcFile = join(resolvedSdkPath, file);
      const destFile = join(androidLibsPath, file);

      if (statSync(srcFile).isFile()) {
        copyFileSync(srcFile, destFile);
      }
    });
  } else {
    // If it's a single file, copy it directly
    const fileName = resolvedSdkPath.split('/').pop() || 'google-tap-and-pay.aar';
    copyFileSync(resolvedSdkPath, join(androidLibsPath, fileName));
  }
}

/**
 * Config plugin for react-native-wallet
 * Configures native Android and iOS projects for wallet functionality
 */
const withReactNativeWallet: ConfigPlugin<ReactNativeWalletConfig> = (config, {googleTapAndPaySdkPath, enableApplePayProvisioning = true} = {}) => {
  // Configure iOS
  let modifiedConfig = withReactNativeWalletIOS(config, {
    enableApplePayProvisioning,
  });

  // Configure Android
  modifiedConfig = withReactNativeWalletAndroid(modifiedConfig, {
    googleTapAndPaySdkPath,
  });

  return modifiedConfig;
};

/**
 * Configure iOS for react-native-wallet
 */
const withReactNativeWalletIOS: ConfigPlugin<{
  enableApplePayProvisioning: boolean;
}> = (config, {enableApplePayProvisioning}) => {
  if (!enableApplePayProvisioning) {
    return config;
  }

  return withInfoPlist(config, (c) => {
    // Add Apple Pay In-App Provisioning entitlement
    // Following the structure from the documentation
    // eslint-disable-next-line no-param-reassign
    c.modResults['com.apple.developer.payment-pass-provisioning'] = true;

    return c;
  });
};

/**
 * Configure Android for react-native-wallet
 */
const withReactNativeWalletAndroid: ConfigPlugin<{
  googleTapAndPaySdkPath?: string;
}> = (config, {googleTapAndPaySdkPath}) => {
  if (!googleTapAndPaySdkPath) {
    return config;
  }

  return withProjectBuildGradle(config, (c) => {
    // Copy Google TapAndPay SDK files to android/libs
    copyGoogleTapAndPaySdk(c.modRequest.projectRoot, googleTapAndPaySdkPath);

    if (c.modResults.language === 'groovy') {
      // Configure gradle to use the local libs directory
      // This follows the pattern from react-native-wallet documentation
      const gradleMaven = `allprojects {
	repositories {
		google()
		maven { url "file://\${rootDir}/libs" }
	}
}`;
      // eslint-disable-next-line no-param-reassign
      c.modResults.contents = appendContents({
        comment: '//',
        newSrc: gradleMaven,
        src: c.modResults.contents,
        tag: 'react-native-wallet-libs-repository',
      }).contents;
    } else {
      throw new Error('Cannot add react-native-wallet maven repository because the build.gradle is not groovy');
    }
    return c;
  });
};

export default createRunOncePlugin(withReactNativeWallet, 'ReactNativeWallet', '0.1.0');
