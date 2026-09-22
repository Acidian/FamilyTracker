# Nightlight

A mobile-first family organiser for two parents and three children, with the approved navy, lavender and peach Nightlight design.

## Available in this version

- Editable family profiles; Today, Calendar, Medicines and Family screens.
- Medicine courses with explicit amounts, units, dates and chosen dose times.
- Given/skipped dose records, duplicate-slot protection and corrections that retain the original record.
- Family events and private-title medicine calendar exports (.ics).
- Typed notes, browser-supported dictation and photo attachments. These are reference notes; automatic label reading and voice-to-dose interpretation are not implemented.
- Device-only storage, backup export, optional Supabase family sharing, and Android local reminders.
- Installable web app for iPhone and Android APK packaging through GitHub Actions.

Direct Google/Outlook calendar sync and email import are not implemented. Importing an exported calendar file creates a snapshot, not a live connection. This app records instructions you enter; it does not calculate or recommend medicine doses.

## Run locally

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

`npm run check` runs the domain/calendar tests and production build. `npm run android:sync` builds and copies the web app into Android.

## Android APK

Every push to `main` and pull request runs **Actions → Android APK**. You can also select **Run workflow** manually. Open a successful run, download the `nightlight-android-debug` artifact, unzip it and install `app-debug.apk` on your Android phone. Android may require allowing installation from the app used to open the file.

This is a debug-signed test APK, not a Play Store release. GitHub runners may generate a different debug signing key on each run; Android may then require uninstalling the old build, which removes device-only records. Export a backup first. Backup import is not available in this version. For regular upgrades, configure a persistent release signing key as described in [Android signing](docs/android-signing.md).

Reminders must be enabled in **Family → Medicine reminders**. Open the app regularly: it schedules at most 60 upcoming reminders within a 14-day lookahead. Phone settings can delay delivery. Reminders on a second device refresh when that device opens/syncs the app; always check the latest dose record before giving medicine.

## iPhone web app

In repository **Settings → Pages**, choose **GitHub Actions** as the source, then run **Actions → Publish web app**. The workflow reports the published address. Open it in Safari and use **Share → Add to Home Screen**.

The Pages workflow is manual. The website assets are public, while configured household records are protected by Supabase access policies. An APK cannot install on iPhone. The web version uses calendar exports for reminders and does not provide native background notifications.

## Shared family setup

Without backend settings, the app explicitly runs in device-only mode. Records on your phone will not appear on your wife's phone.

1. Create a Supabase project and run [supabase/schema.sql](supabase/schema.sql) once in its SQL editor.
2. Enable email/password authentication and configure the project's Site URL and allowed redirect URLs for the deployed web address. Confirm accounts through email if confirmation is enabled.
3. Copy `.env.example` to `.env` for local use and enter the project URL and public anonymous/publishable key. Never use a `service_role` or secret key in the app.
4. For GitHub builds, add repository **Actions variables** named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These are public client configuration embedded at build time. Re-run the APK and web workflows after setting them.
5. Each parent creates their own account in **Family**. One parent chooses **Share this family** to upload their current records, then creates a single-use invite. The other parent signs in and uses **Join family** with that code within 24 hours.

Joining displays the shared household; existing device-only records stay separate and are not merged. Shared changes require a connection. Writes use revision checks and retry against the latest household; the database also rejects duplicate active dose slots on shared saves. Polling refreshes every ten seconds and on focus; realtime replication is optional. Shared operation and simultaneous-device behavior still need verification against your configured Supabase project before relying on it.

## Data and limitations

Device-only data stays in this browser/app's local storage, including attached photos. Clearing browser data or uninstalling removes it. Exported backups contain private family and medicine information. The current backup export has no in-app restore flow. Shared data is stored as one household document; keep photo attachments modest. Schedule times follow each device's local timezone, so both parents should use the same timezone and review schedules when travelling.

Browser dictation support varies and may use the browser provider's speech service. Camera selection depends on the browser/device. Notification delivery, camera and dictation must be tested on the actual phones. Automated checks do not establish clinical reliability.
