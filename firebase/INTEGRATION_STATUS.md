# Firebase integration setup — isolated branch

Branch: `firebase-integration-setup` (based on `firebase-migration`).

## Status
- Production `main` is unchanged.
- Existing Render API and Supabase resources are unchanged.
- The supplied Firebase Web App config has been saved to `firebase/firebase-config.js` on this branch only.
- A guarded Firebase SDK bootstrap is now included in `app-v6/index.html` and `app-v6/firebase-init.js` on this branch. It initializes Firebase App/Auth if the SDK and config load; otherwise it logs a warning and lets the existing app continue.
- This bootstrap is groundwork only: browser-based runtime tests have not yet been run, account registration/login UI is not yet connected to Firebase, and the app's existing API is unchanged.
- The existing app uses a custom REST API for accounts, rewards, leaderboard and community. Replacing its URL with Firebase would break those flows; a compatibility adapter and trusted server-side reward functions are required.

## Web configuration received
The user supplied a Firebase Web SDK config for project ID `kh-kozak-battle-hub`, including the Web App ID. The values were copied into the branch config file. These client config values are not service-account credentials; never place service-account JSON, private keys, database passwords, or tokens in client files.

## Next integration stages
1. Add Firebase SDK initialization in a way compatible with the app's current deployment and test it on this branch.
2. Test Firebase Authentication separately without changing the current production API.
3. Implement an adapter for the app's existing account API contract.
4. Add restrictive Firestore rules and server-side Cloud Functions for rewards, coins, XP, inventory purchases and leaderboard writes.
5. Test registration/login/logout/profile, game rewards, leaderboard, community, desktop browser and Android.
6. Only after tests pass, propose a reviewed pull request; do not merge or deploy to production automatically.
