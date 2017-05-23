const packager = require('electron-packager');
const rebuild = require('electron-rebuild').default;

packager({
  dir: './',
  out: 'build',
  overwrite: true,
  name: 'Oikon 2',
  appBundleId: 'com.emotionloop.Oikon2Mac',
  appCategoryType: 'public.app-category.finance',
  appCopyright: `${new Date().getFullYear()} emotionLoop`,
  // osxSign: {
  //   entitlements: './entitlements.plist',
  // },
  platform: 'mas',
  arch: 'x64',
  icon: 'assets/logo.icns',
  ignore: [
    /build\.js/,
    /entitlements\.plist/,
    /\.travis\.yml/,
    /\/test\//,
    /\/expenses\//,
    /\/types\//,
    /\/expenses-mrview(.*)/,
    /\/types-mrview(.*)/,
  ],
  afterCopy: [(buildPath, electronVersion, platform, arch, callback) => {
    rebuild(buildPath, electronVersion, arch)
      .then(() => callback())
      .catch((error) => callback(error));
  }],
}, () => {});
