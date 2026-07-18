module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-paper/babel',
      'react-native-worklets/plugin', // 👈🏼 add this as the LAST item in plugins
    ],
  };
};
