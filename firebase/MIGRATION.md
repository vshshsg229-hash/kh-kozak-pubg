# KH么Kozak Battle Hub — Firebase migration

This branch is a safe migration workspace. The production `main` branch and the existing Render/Supabase resources are intentionally unchanged until Firebase is configured and tested.

## Target architecture

- **Firebase Authentication**: email/password registration and login; each player has a Firebase UID.
- **Cloud Firestore**: profile, progression, achievements, inventory and leaderboard data, scoped to each UID.
- **Cloud Functions**: trusted operations for game rewards, coins, XP and leaderboard updates. The client must never be allowed to award itself currency directly.
- **Firebase App Check**: add after the app is configured to reduce unauthorized requests.

The current Battle Hub contains a custom REST API contract and PostgreSQL-backed account data. Switching only the URL to Firebase would break registration, login, rewards and community endpoints. Those calls must be migrated to a Firebase adapter in stages.

## Firebase Console setup

1. Create a Firebase project at https://console.firebase.google.com/.
2. Add a Web app named `KH Kozak Battle Hub` and copy its **web app configuration** (these values are public client configuration, not service-account credentials).
3. In **Authentication → Sign-in method**, enable Email/Password.
4. Create a **Cloud Firestore** database.
5. For server-side reward validation and protected account operations, enable **Cloud Functions**. Firebase may require the project to use the Blaze billing plan for deployed functions.
6. Do not paste service-account private keys, database passwords, API secrets or bot tokens into chat or frontend files.

## Proposed Firestore shape

- `users/{uid}`: username, email, createdAt, updatedAt, coins, points, xp, played, games, equipped cosmetics and progression.
- `users/{uid}/achievements/{achievementId}`: achievement state for that player.
- `users/{uid}/inventory/{itemId}`: owned cosmetics/items.
- `leaderboard/{uid}`: public-safe username, points, xp, played and updatedAt only.
- `gameSessions/{sessionId}`: server-validated game session/reward records; write access limited to trusted Functions.

Never store passwords in Firestore. Firebase Authentication owns credentials. Do not allow clients to directly update `coins`, `points`, `xp`, inventory purchases, or leaderboard scores.

## Migration / acceptance checklist

- [ ] Configure the Firebase web app.
- [ ] Deploy restrictive Firestore rules and Cloud Functions.
- [ ] Add Firebase SDK/config and a compatibility adapter for the current account UI.
- [ ] Verify register, login, logout and profile loading.
- [ ] Verify a player can only read/write their own private profile.
- [ ] Verify rewards are granted by trusted server code, not browser-side values.
- [ ] Test on GitHub Pages, desktop browser and Android.
- [ ] Only after all tests pass, switch the production app away from Render.
- [ ] Keep existing database/server backups until data migration is verified.

## Important

This documentation does **not** mean Firebase is already deployed or that existing accounts have been migrated. Production remains on its current configuration until the Firebase project and its rules/functions are ready.
