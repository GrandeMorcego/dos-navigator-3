const path = require('path');

const bits = process.env.ZW_WIN32_ARCH || '64';
const branch = process.env.ZW_APP_BRANCH || 'master';

/*
* Will be used for testing local packaging
* process.env.ZW_APP_SIGN = '/v /f D:\\smoraru\\Downloads\\cert\\cert\\zwSPC.pfx'
*/

const signWithParams = process.env.ZW_APP_SIGN || '/v /f C:\\tmp\\zipwhip_code_signing.pfx /p VGsHyL6WfqD86kHLcrctfT /d "Zipwhip Desktop App"';
const releasesRepo = `https://s3-us-west-2.amazonaws.com/zw-app-upload/win${bits}/${branch}`;

const config = {
// save for later Adds notarization for catalina macOS
//    hooks: {
//      postPackage: require("./scripts/notarizeApp.js")
//    },
  makers: [
    {
      name: '@electron-forge/maker-zip',
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        icon: 'images/z-icon.icns',
        background: 'images/bg_install.png',
        contents: [
          {
            x: 250,
            y: 235,
            type: 'file',
            path: path.resolve(process.cwd(), 'out/Zipwhip-darwin-x64/Zipwhip.app'),
          },
          {
            x: 460,
            y: 230,
            type: 'link',
            path: '/Applications',
          },
        ],
      },
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        loadingGif: 'images/zw-install.gif',
        signWithParams,
        setupIcon: 'images/z-icon.ico',
        iconUrl: 'https://s3-us-west-2.amazonaws.com/zw-app-upload/win32/z-icon.ico',
        name: 'zipwhip',
        remoteReleases: releasesRepo,
        remoteReleases64: 'https://s3-us-west-2.amazonaws.com/zw-app-upload/win64/master',
        remoteReleases32: 'https://s3-us-west-2.amazonaws.com/zw-app-upload/win32/master',
      }
    },
  ],
  packagerConfig: {
    packageManager: 'yarn',
    icon: 'images/z-icon',
// save for later Adds notarization for catalina macOS
//    entitlements: "./entitlements.mac.inherit.plist",
    ignore: [
      'zw-src',
      'scripts',
      'update-web',
      'Jenkinsfile',
      'Makefile',
      'yarn.lock',
      'eslintrc',
    ],
    osxSign: {
// save for later Adds notarization for catalina macOS
//      hardenedRuntime: true,
//      gatekeeperAssess: false,
      identity: 'Developer ID Application: Zipwhip (96NL5642U7)',
    },
    extendInfo: {
      NSUserNotificationAlertStyle: 'alert',
    },
    "protocols": [
      {
        "name": "Zipwhip Magic Link",
        "schemes": "zipwhip"
      },
      {
        "name": "Zipwhip SMS Link",
        "schemes": "sms"
      }
    ],
  },
  electronWinstallerConfig: {
    signWithParams,
  },
  electronInstallerDebian: {},
  electronInstallerRedhat: {},
  windowsStoreConfig: {
    packageName: '',
    name: 'zipwhip',
  },
};

module.exports = config;
