# Firebase integration status — isolated branch

Branch: `firebase-integration-setup`. Production `main` is intentionally unchanged.

## Implemented in this branch
- Added the supplied Firebase Web App configuration.
- Initializes Firebase App, Authentication, and Firestore SDK when the CDN SDKs load.
- Added an additive Firestore profile adapter for `users/{uid}`.
- Added Email/Password registration, login and logout wiring for the existing account controls.
- Added restrictive Firestore rules: profile owner access only, zeroed progression at profile creation, cosmetic-only client edits, and no client-side profile deletion.
- Added Firebase Cloud Functions source:
  - `finishGame` applies fixed server-side rewards, uses event IDs for duplicate prevention, and adds a short cooldown.
  - `claimDailyReward` applies the daily drop and streak bonus server-side using Kyiv time.
  - `getLeaderboard` returns the top 10 without direct client reads of other users' private profile documents.
  - Community player search, friend requests, accepted-friend private chat, and online nickname updates.
- Updated authenticated game reward and leaderboard calls to use Firebase callable functions.
- Disabled the legacy Render API request path in `app-v6/app.js` on this branch.
- Added `firebase.json`, Functions package metadata, a setup/deployment guide, and a GitHub Actions syntax-check workflow.

## Validation status
- GitHub Actions JavaScript syntax checks and PWA/local-asset checks pass on the current staging head.
- Live Firebase deployment and browser end-to-end behavior are still not verified.

## Not yet verified
- Live browser registration, login, and profile creation against the Firebase project.
- Whether Email/Password and Firestore are enabled and the Firestore rules are published.
- Cloud Functions deployment and live reward/leaderboard calls.
- Community search/friend requests/private chat and profile/rating are wired to Firebase, but they are not live-verified until Cloud Functions are deployed. The shop, inventory, achievements, admin features, and all progression sync are not fully migrated.
- The reward cooldown and event ID checks are a baseline, not a complete anti-cheat system.

## Before production
Deploy rules and functions to the Firebase project from a trusted machine, run end-to-end tests on staging, and inspect the CI result. Do not merge this branch into `main` until the live tests pass. Never place service-account credentials in browser code or commit them to the repository.
