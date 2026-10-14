# Firebase integration setup — isolated branch

Branch: `firebase-integration-setup` (based on `firebase-migration`).

## Status
- Production `main` is unchanged.
- Existing Render API and Supabase resources are unchanged.
- This branch adds only a configuration template and this validation note. It does **not** switch the app's API or claim Firebase is connected.
- The existing app uses a custom REST API for accounts, rewards, leaderboard and community. Replacing its URL with Firebase would break those flows; a compatibility adapter and trusted server-side reward functions are required.

## Supplied values checked
The values sent in chat are not a valid complete Firebase Web App configuration:
- `projectId: "KH Kozak Battle Hub"` contains spaces. Firebase project IDs are lowercase IDs with hyphens, not the display name. The likely ID may be `kh-kozak-battle-hub`, but this must be copied from Firebase Console rather than guessed.
- `authDomain: "kh-kozak-battle-hub"` looks incomplete. A standard Firebase web config commonly uses `<project-id>.firebaseapp.com`; copy the exact value shown in the console.
- `apiKey: "200909508144"` is only a short numeric value and does not look like a Firebase Web API key. It may be a project number or another identifier. Do not use it as `apiKey`.

## What to copy
Firebase Console → Project settings (gear) → General → Your apps → select the Web app → SDK setup and configuration → Config.

Copy the exact values for `apiKey`, `authDomain`, `projectId`, and `appId`. The appId is also needed for reliable Firebase initialization. Do not send service-account JSON, private keys, database passwords, or tokens.

## Next integration stages
1. Insert verified web config into a branch-only config file.
2. Add Firebase SDK initialization and test Authentication without changing the current production API.
3. Implement an adapter for the app's existing account API contract.
4. Add restrictive Firestore rules and server-side Cloud Functions for rewards, coins, XP, inventory purchases and leaderboard writes.
5. Test registration/login/logout/profile, game rewards, leaderboard, community, desktop browser and Android.
6. Only after the tests pass, propose a reviewed pull request; do not merge or deploy to production automatically.
