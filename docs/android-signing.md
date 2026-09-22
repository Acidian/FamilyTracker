# Android release signing

The supplied workflow produces a debug APK for evaluation. It does not publish to an app store or establish a permanent release signing identity.

For durable upgrades, create and securely back up a dedicated Android release keystore. Keep the keystore, alias and passwords out of Git. Add its base64 content and passwords as GitHub Actions secrets, decode it to the runner's temporary directory, and configure a Gradle release signing configuration to read those values from environment variables. Change the build task to `assembleRelease` and upload the release APK. Keep the application ID `com.acidian.familytracker` unchanged and increase `versionCode` for each distributed release.

Do not reuse the ephemeral debug key for production. Loss of the release key can prevent updating existing installations. A Play Store submission uses a signed Android App Bundle and Play App Signing; it is a separate delivery step.
