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
- [ ] Define Member, Course, Dose, FamilyEvent, CaptureNote, FamilyData and Operation in src/domain.ts.
- [ ] Implement date-only slot generation and immutable applyOperation; reject duplicate active slots, future records, invalid doses and unsupported member references.
- [ ] Test duplicate logging, schedule end dates, late doses and void corrections with Vitest.
- [ ] Implement src/store.tsx with device storage and optional authenticated Supabase CAS writes.

## 2. Working interface
- [ ] Build src/App.tsx navigation and responsive src/styles.css using approved tokens.
- [ ] Add medicine, dose, event, profile and capture forms in src/components with native labelled inputs and inline errors.
- [ ] Add Today agenda, course detail/history, calendar month/date view, and household settings.
- [ ] Keep empty states actionable; provide an explicitly labelled optional demo family.

## 3. Platform services
- [ ] Implement src/calendar.ts ICS generation with escaped values and folded UTF-8 lines.
- [ ] Implement src/reminders.ts Android-only notification scheduling from future unrecorded slots.
- [ ] Add Supabase schema, RLS and household creation/join/CAS functions in supabase/schema.sql.
- [ ] Add Android project and permission-aware reminder controls. Camera attachment uses file capture; browser voice support is detected with typed-note fallback.

## 4. Delivery
- [ ] Add .github/workflows/android.yml with Node 22, Java 21, tests, production build, Capacitor sync, Gradle assembleDebug and uploaded APK artifact.
- [ ] Add optional manually triggered Pages workflow and signing documentation.
- [ ] Run npm run check, browser flows and viewport inspection, then commit and push to the requested repository.
- [ ] Follow the first GitHub build to completion and report the actual artifact and remaining service setup.
