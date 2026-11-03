/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'AwradnaWidget',
  displayName: 'أورادنا',
  icon: '../../assets/icon.png',
  deploymentTarget: '17.0',
  colors: {
    $widgetBackground: '#0B1A15',
    $accent: '#E3C47A',
  },
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
