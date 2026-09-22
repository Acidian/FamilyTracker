# Nightlight Implementation Plan

**Goal:** Deliver the approved Nightlight family tracker and a working GitHub APK build.

**Architecture:** React UI calls a typed operation store. Local mode persists on device; configured Supabase mode applies operations to a revision-checked household document. Capacitor wraps the web output for Android.

**Tech Stack:** TypeScript, React, Vite, Capacitor, Supabase, Vitest.

## Global constraints
- Preserve the approved Nightlight design, mobile-first with four primary destinations.
- No inferred medical instructions, fabricated cloud status or simulated integrations.
- Device-only mode must be explicitly identified. Shared mode must prevent simultaneous duplicate dose records.
- Build Android in GitHub Actions; do not claim an iOS binary from an APK.

## 1. Domain and persistence
- [x] Define Member, Course, Dose, FamilyEvent, CaptureNote, FamilyData and Operation in src/domain.ts.
- [x] Implement date-only slot generation and immutable applyOperation; reject duplicate active slots, future records, invalid doses and unsupported medicine-course member references.
- [x] Test duplicate logging, schedule end dates, late doses and void corrections with Vitest.
- [x] Implement src/store.tsx with device storage and optional authenticated Supabase CAS writes.

## 2. Working interface
- [x] Build src/App.tsx navigation and responsive src/styles.css using approved tokens.
- [x] Add medicine, dose, event, profile and capture forms in src/components with native labelled inputs and inline errors.
- [x] Add Today agenda, course detail/history, calendar month/date view, and household settings.
- [x] Keep empty states actionable; provide an explicitly labelled optional demo family.

## 3. Platform services
- [x] Implement src/calendar.ts ICS generation with escaped values and folded UTF-8 lines.
- [x] Implement src/reminders.ts Android-only notification scheduling from future unrecorded slots.
- [x] Add Supabase schema, RLS and household creation/join/CAS functions in supabase/schema.sql.
- [x] Add Android project and permission-aware reminder controls. Camera attachment uses file capture; browser voice support is detected with typed-note fallback.

## 4. Delivery
- [x] Add .github/workflows/android.yml with Node 22, Java 21, tests, production build, Capacitor sync, Gradle assembleDebug and uploaded APK artifact.
- [x] Add optional manually triggered Pages workflow and signing documentation.
- [x] Run npm run check, browser flows and viewport inspection, then commit and push to the requested repository.
- [x] Follow the first GitHub build to completion and report the actual artifact and remaining service setup.

## Completion evidence — 22 September 2026
- `npm run check`: 8 tests passed and production/PWA build passed locally and in GitHub Actions.
- Browser: created medicine course, confirmed dose, reloaded to verify persistence, created event and note. No console errors; no horizontal overflow at 320, 390 and 1440 pixel widths. Mobile and desktop screenshots inspected.
- Android build succeeded: https://github.com/Acidian/FamilyTracker/actions/runs/35732801515
- Downloaded `nightlight-android-debug` artifact and inspected APK entries: AndroidManifest.xml, classes.dex and assets/public/index.html present. APK size: 4,442,849 bytes.
- Shared Supabase integration is implemented but unverified against a provisioned backend. Actual-phone installation, camera, dictation and notification delivery remain device acceptance checks. Web hosting is prepared but not published.
