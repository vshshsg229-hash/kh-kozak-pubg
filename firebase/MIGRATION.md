# Firebase integration staging plan

Status: **staging preparation only**. This branch does not change the production branch or the live GitHub Pages app.

## Findings from the current main branch

- `app-v6/index.html` still points to the existing Render API: `https://khkozak-battle-hub-api-uftt.onrender.com`.
- `app-v6/app.js` uses a custom REST API contract for account/auth, player state, rewards, leaderboard and community features. Replacing the API URL with a Firebase URL would break those features.
- `supabase/functions/hub-api/index.ts` is an existing Supabase Edge Function implementation. Its existence in the repository does not prove it is deployed or configured.
- There is no root `firebase.json` in the checked main branch.

## Firebase values supplied so far

The supplied values do not yet form a valid, verifiable Firebase Web App configuration:

- `projectId: "KH Kozak Battle Hub"` looks like a display name. Firebase project IDs are machine identifiers and do not contain spaces. The actual value may be `kh-kozak-battle-hub`, but it must be copied from Firebase Console rather than guessed.
- `authDomain: "kh-kozak-battle-hub"` is missing the normal Firebase Auth domain suffix (commonly `.firebaseapp.com`, unless a custom domain is configured). Copy the exact value from the Web App config.
- `apiKey: "200909508144"` appears incomplete for a Firebase Web API key. Copy the full `apiKey` string from the Firebase Web App configuration. Do not send service-account keys or other private secrets.

## Planned migration design

1. Keep the current Render API and production branch unchanged while testing.
2. Add Firebase Web App configuration as a client-side config only after values are verified.
3. Use Firebase Authentication for identity and a Cloud Functions adapter to preserve the current REST API contract. Do not simply replace the API base URL.
4. Move profile/inventory/achievement storage to Firestore only with explicit, restrictive security rules.
5. Validate coin, XP, point and achievement awards on the server; the browser must not be able to grant itself rewards by writing directly to Firestore.
6. Keep secrets (Admin SDK/service account, Telegram bot token, webhook secrets) in Cloud Functions secrets/environment, never in browser files or Git.
7. Test registration, login, logout/session refresh, account persistence, rewards, leaderboard, inventory/shop, achievements, community/friends/chat, CORS and mobile/PC flows on staging.
8. Only propose a production switch after staging tests pass and a rollback path is documented.

## Current test status

- Repository code inspection: completed for the files listed above.
- Firebase project connectivity/authentication: **not tested**; valid Web App config and a deployed backend are not yet confirmed.
- Production: unchanged.
