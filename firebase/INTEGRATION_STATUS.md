# Firebase integration status — isolated branch

Branch: `firebase-integration-setup`. Production `main` is intentionally unchanged.

## Implemented in this branch
- Added the supplied Firebase Web App configuration.
- Initializes Firebase App, Authentication, and Firestore SDK when the CDN SDKs load.
- Exposes an additive profile adapter for loading/creating `users/{uid}` and updating a small allowlist of public profile fields.
- Emits `kh-firebase-auth-state` when Firebase Authentication changes state.
- Added `app-v6/firebase-auth.js`, which routes the existing register/login/logout buttons through Firebase Email/Password Authentication and creates the user's Firestore profile.
- The auth adapter keeps Firebase sessions separate from the legacy REST API token and explicitly warns that game progression is not yet synced.
- Added restrictive starter rules in `firebase/firestore.rules`: profile owner access only, zeroed progression at profile creation, cosmetic-only client updates, and no client-side profile deletion.
- Added `firebase/README.md` with console setup steps and current security boundaries.

## Not yet verified
- Browser runtime against the live Firebase project.
- Whether Email/Password is enabled and the rules have been published in the Firebase console.
- Live end-to-end test of the existing account form against the Firebase project.
- Connecting coins, XP, purchases, rewards, leaderboard and community to Firebase.
- Cloud Functions or server-side validation for reward operations.

The current app still uses its existing REST API for its online features. Do not switch production until Firebase Authentication, Firestore rules, and trusted reward functions have been tested. Client code must never directly grant itself coins, XP, inventory, or leaderboard points.
