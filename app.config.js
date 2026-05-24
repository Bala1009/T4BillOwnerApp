// =============================================================================
// app.config.js  —  Dynamic Expo configuration
// =============================================================================
// WHY THIS FILE EXISTS:
//   google-services.json is git-ignored for security reasons.
//   EAS Build only uploads git-tracked files, so we use an EAS File
//   environment variable (GOOGLE_SERVICES_JSON) to supply the file at build
//   time.  In local dev the file is already present on disk, so the env var
//   is not needed there.
//
// HOW IT WORKS:
//   1. `eas secret:create --type file` uploads google-services.json to EAS
//      and sets GOOGLE_SERVICES_JSON to the path of the injected file during
//      the build.
//   2. This config reads that env var and passes it to `googleServicesFile`.
//   3. Locally, we fall back to "./google-services.json" (the file on disk).
//
// REFERENCE:
//   https://docs.expo.dev/eas/environment-variables/#file-environment-variables
// =============================================================================

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'T4BillOwnerApp',
  slug: 'ownerapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './Src/assets/images/app-icon.png',
  scheme: 't4billownerapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
  },

  android: {
    package: 'com.t4bill.ownerapp',

    // EAS injects the file and sets the env var to its path.
    // Locally the file lives at ./google-services.json.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',

    permissions: ['NOTIFICATIONS'],

    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './Src/assets/images/app-icon.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './Src/assets/images/app-icon.png',
    },

    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },

  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './Src/assets/images/app-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
    [
      'expo-notifications',
      {
        icon: './Src/assets/images/app-icon.png',
        color: '#ffffff',
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    router: {},
    eas: {
      projectId: 'dafc54a4-c437-4ea4-96ac-2ee6f23be5bd',
    },
  },

  owner: 't4bill2025',
};

export default config;
