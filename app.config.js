
const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
    if (IS_DEV) {
      return 'com.pavelpotocek.workouttracker.dev';
    }
  
    if (IS_PREVIEW) {
      return 'com.pavelpotocek.workouttracker.preview';
    }
  
    return 'com.pavelpotocek.workouttracker';
  };
  
  const getAppName = () => {
    if (IS_DEV) {
      return 'Workout Tracker (Dev)';
    }
  
    if (IS_PREVIEW) {
      return 'Workout Tracker (Preview)';
    }
  
    return 'Workout Tracker';
  };
  

  export default ({ config }) => ({
    ...config,
    name: getAppName(),
    ios: {
      ...config.ios,
      bundleIdentifier: getUniqueIdentifier(),
    },
    android: {
      ...config.android,
      package: getUniqueIdentifier(),
    },
  });
  