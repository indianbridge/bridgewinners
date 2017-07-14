# BridgeWinners Mobile App
This repository contains all the html and javacript code implementing the [bridgewinners](http://bridgewinners.com) mobile app. The backend code is part of the core bridgewinners repository under [bw_restapi](https://github.com/Humper/bridgewinners/tree/master/bw_restapi) folder.

## Installation
After checkout, run `cordova prepare` in the root folder. This should setup all the plugins as well as android and ios platforms.

### iOS
To build run `cordova build ios --release`. A project will be created in platforms/ios which can be loaded in Xcode.

### Android
To build run `cordova build android --release`. The build will create apk files in platforms/android/build/outputs/apk folder. To run the app in an android emulator you can point [Android Studio](https://developer.android.com/studio/index.html) to the platforms/android folder.

**Note: for release build to work you need release-signing.properties. This file is included in the root of the repository but needs to be copied to platforms/android.**

**Note: Android Studio has problem starting emulator if Docker is also running so you will have to stop Docker to run emulator.**

## Running in browser
Most of the functionality should work in a browser as long as you are running an http server (`python -m SimpleHTTPServer 8080` for example) in the www folder. The you can open http://127.0.0.1:8080/ to run the app code. I recommend using the [device toolbar in chrome](https://developers.google.com/web/tools/chrome-devtools/device-mode/emulate-mobile-viewports) to test how the app will look on different mobile devices.

## Backends
The app is connected to [bridgewinners production site](https://www.bridgewinners.com). This can be controlled by changing this.sitePrefix variable in index.js. When running in a browser this can be done with a query parameter called site_prefix http://127.0.0.1:8080?site_prefix=https://52.4.5.8.

**Note: When using anything but the production site as the backend you will have to browse to the backend https://52.4.5.8 or https://localhost first to get rid of the untrusted SSL certificate warning.
