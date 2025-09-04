
const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
    if (IS_DEV) {
      return 'com.pavelpotocek.activitytracker.dev';
    }
  
    if (IS_PREVIEW) {
      return 'com.pavelpotocek.activitytracker.preview';
    }
  
    return 'com.pavelpotocek.activitytracker';
  };
  
  const getAppName = () => {
    if (IS_DEV) {
      return 'Activities (Dev)';
    }
  
    if (IS_PREVIEW) {
      return 'Activities';
    }
  
    return 'Activities';
  };

  const getIconBackground = () => {
    if (IS_DEV) {
      return '#4d4d4d';
    } else if (IS_PREVIEW) {
      return '#00caf2';
    } else {
      return '#7166ff';
    }
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
      adaptiveIcon: {
        ...config.android.adaptiveIcon,
        backgroundColor: getIconBackground(),
      },
    },
  });
  