const { withAppBuildGradle } = require('@expo/config-plugins');

// Expo's template uses proguard-android.txt, which contains -dontoptimize.
// Switch to the -optimize variant so R8 actually optimizes the DEX code.
const withOptimizedProguard = (config) =>
  withAppBuildGradle(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      'getDefaultProguardFile("proguard-android.txt")',
      'getDefaultProguardFile("proguard-android-optimize.txt")',
    );
    return config;
  });

module.exports = withOptimizedProguard;
