# Local Live test

This prototype publishes one Android camera and microphone to one LiveKit room.
The iOS simulator can join as a viewer. The token service is development-only;
it uses LiveKit's local development key and has no user authentication.

## Start the local services

Install the LiveKit server once, then start it in one terminal:

```sh
brew install livekit
npm run live:server
```

Start the development token service in a second terminal:

```sh
npm run live:tokens
```

The LiveKit server listens on port 7880, while the token service listens on
port 3001. Forward both host ports to the Android emulator before starting the
app:

```sh
adb reverse tcp:3001 tcp:3001
adb reverse tcp:7880 tcp:7880
```

The Android build uses the forwarded loopback address. The iOS simulator uses
the Mac's loopback address directly.

## Build and try

Build and install Android with a bundled JS release so it does not depend on
Metro:

```sh
cd android
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/release/app-release.apk
```

Open Stream Me, select **Stream → LIVE → Mulai siaran langsung** on Android,
then select **Stream → LIVE → Tonton siaran** in the iOS simulator. Android
asks for camera and microphone access when the broadcast starts. Tap **Akhiri**
on Android to stop the broadcast.

For an automated simulator check, set `STREAMME_SHOW_STREAM_ON_LAUNCH=1` and
`STREAMME_START_LIVE=1` in the iOS Simulator process environment. That opens the
LIVE page and joins the active room as a viewer.

The token service issues a publish token only to the broadcaster. Viewers can
subscribe but cannot publish. The room is fixed to `streamme-demo` for this
local prototype. A production deployment needs authenticated identities, a
production LiveKit endpoint, secure token issuance, and creator permissions.

The LiveKit React Native SDK cannot publish camera tracks from the iOS
simulator, so this flow deliberately uses Android as broadcaster and iOS as
viewer.
