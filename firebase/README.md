# Firebase setup — KH么Kozak Battle Hub

This integration branch uses Firebase Authentication, Firestore, and callable Cloud Functions. The production `main` branch has not been changed.

## One-time Firebase Console setup

1. Open Firebase Console for project `kh-kozak-battle-hub`.
2. In **Authentication → Sign-in method**, enable **Email/Password**.
3. Create a **Cloud Firestore** database if one does not exist.
4. In **Authentication → Settings → Authorized domains**, confirm `vshshsg229-hash.github.io` is authorized.
5. Confirm the project is on the **Blaze billing plan** before deploying Cloud Functions; Firebase requires billing for deployed Functions. Set budget alerts before enabling production traffic.
6. Do not publish the app to production until the staging browser checks below pass.

## Optional one-click deployment through GitHub Actions

A manual deployment workflow is included at **Actions → Deploy Firebase backend (manual)**. It is deliberately manual and requires you to choose `yes` before deploying.

Before running it:
1. In Google Cloud Console, create or select a service account with permission to deploy Firebase Functions and Firestore rules to `kh-kozak-battle-hub`.
2. Store its JSON key in the GitHub repository as an Actions secret named `FIREBASE_SERVICE_ACCOUNT_KH_KOZAK_BATTLE_HUB`. Never paste the key into chat or commit it.
3. Confirm Firebase is on the Blaze plan and that you intend to update the project's live rules and Functions.
4. Open the repository's **Actions** tab, choose **Deploy Firebase backend (manual)**, select `yes`, and run the workflow.

This workflow deploys to the real Firebase project. It does not publish the website or merge the code into `main`.

## Deploy from a trusted development machine

Install Node.js 20 and the Firebase CLI, authenticate with an account that has access to this Firebase project, then run from the repository root:

```sh
npm --prefix functions install
firebase use kh-kozak-battle-hub
firebase deploy --only firestore:rules,functions
```

If the project is not selected in the CLI, use `firebase projects:list` and then `firebase use kh-kozak-battle-hub`. Never place an Admin SDK service-account private key in browser code or commit it to this repository.

## What is implemented in this branch

- Email/password registration, login and logout through Firebase Authentication.
- Firestore profile creation with initial coins, points, XP and played count set to zero.
- `finishGame` callable function applies fixed server-side rewards, checks for duplicate event IDs and enforces a short cooldown.
- `claimDailyReward` awards the daily drop and streak bonuses once per Kyiv calendar day; client-side reward amounts are not trusted.
- `getLeaderboard` callable function returns a top-10 public leaderboard without granting browsers direct read access to other users' private profile documents.
- `searchCommunityPlayers`, `sendFriendRequest`, `respondFriendRequest`, and `listCommunityFriends` provide server-validated player search and friend requests.
- `sendCommunityMessage` and `listCommunityMessages` provide private chat restricted to accepted friends.
- `updateMyProfile` saves online nicknames and keeps the searchable lowercase nickname index synchronized.
- The community interface, profile sync, and account status are wired to Firebase callable functions; legacy Render routes are not used for these features.
- Firestore rules restrict profile reads to the owner, allow only cosmetic profile edits from the browser, and deny client profile deletion.
- The legacy Render API request path is disabled in `app-v6/app.js` on this branch.

## Security notes / known limitations

- Game rewards are calculated by the server, not accepted from client-supplied coin/XP values. However, the current game-completion call is still initiated by browser code. The cooldown and idempotency checks are a baseline, **not a complete anti-cheat system**. Do not use this for valuable purchases, cash prizes, or competitive rankings without stronger server-verifiable gameplay validation and App Check.
- The old REST API's inventory, shop purchases, achievements, and admin flows have not all been migrated. Community, profile edits, leaderboard, game rewards, and daily drops are wired to Firebase callable functions in this branch, but still require deployment and browser verification.
- The Firebase web config is public client config; it is not a secret. Never commit service-account credentials.
- Live authentication, Firestore rules, Functions deployment and end-to-end game reward tests have not been performed by this repository edit. Deploy and verify on staging before merging to `main`.
