# Firebase integration status — isolated branch

Branch: `firebase-integration-setup`. Production `main` is intentionally unchanged.

## Implemented in this branch
- Added the supplied Firebase Web App configuration.
- Initializes Firebase App, Authentication, and Firestore SDK when the CDN SDKs load.
- Exposes an additive profile adapter for loading/creating `users/{uid}` and updating a small allowlist of public profile fields.
- Emits `kh-firebase-auth-state` when Firebase Authentication changes state.

## Not yet verified
- Browser runtime against the live Firebase project.
- Email/password provider status and Firestore database/rules.
- Connecting existing account forms, coins, XP, purchases, rewards, leaderboard and community to Firebase.
- Cloud Functions or server-side validation for reward operations.

The current app still uses its existing REST API for its online features. Do not switch production until Firebase Authentication, Firestore rules, and trusted reward functions have been tested. Client code must never directly grant itself coins, XP, inventory, or leaderboard points.
