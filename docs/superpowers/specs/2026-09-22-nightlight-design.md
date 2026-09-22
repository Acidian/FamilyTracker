# Nightlight implementation scope

Approved from the product discussion and Nightlight concept selection. Build immediately as requested.

React/TypeScript mobile web application packaged with Capacitor for Android. Installable PWA serves iPhone users. Four destinations: Today, Calendar, Medicines, Family. Parent-managed profiles, persistent medicine courses with explicit times and doses, given/skipped dose records, notes and photo attachment, browser-supported dictation, event creation and ICS export. A device-only mode works without services; a Supabase adapter enables authenticated shared households after provisioning.

Medicine schedules are local wall-clock times with explicit course start and duration. Never convert frequency into inferred intervals or recommend amounts. Generate a slot per day/time. A slot can have at most one active dose record. Corrections keep the original record as voided with a reason. A late record does not shift the schedule. Discontinued courses stop future reminders. Stored timestamps are ISO; course dates stay date-only. Travel timezone changes require reviewing schedules.

Cloud writes use optimistic revision checks and replay against current data, preventing simultaneous duplicate slots. No cloud offline writes: display cached data but require reconnection to record changes. RLS restricts households to authenticated members. Invite codes are high entropy and rotated by parents. Local storage is explicitly device-only and not encrypted by the app.

Calendar export is supported immediately. Direct Gmail/Outlook inbox reading and ongoing calendar OAuth sync require provider applications and are deferred; never show them as connected. Android local reminders require permission and are best effort, not an alarm guarantee. Web closed-app medicine notifications are not claimed.

GitHub Actions runs tests, builds the web application and packages a debug APK for every push to main and manual run. Release signing can be configured using repository secrets; never commit signing keys. Web hosting is opt-in via a separate manual Pages workflow. No actual family medical records go in the repository.

Validation: domain tests for date boundaries, duplicate/conflicting writes, late doses, corrections, stopped courses, calendar escaping; TypeScript production build; browser verification on mobile/desktop; GitHub APK workflow with artifact inspection.
