
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
      return 'Workouts (Dev)';
    }
  
    if (IS_PREVIEW) {
      return 'Workouts';
    }
  
    return 'Workouts';
  };

  const getIconBackground = () => {
    if (IS_DEV) {
      return '#4d4d4d';
    }

    return "#7166ff";
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
  