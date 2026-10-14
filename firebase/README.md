# Firebase setup — KH么Kozak Battle Hub

This folder contains the client configuration loader and initial Firestore security rules for the Firebase integration branch.

## Before testing

1. Open the Firebase console for project `kh-kozak-battle-hub`.
2. In **Authentication → Sign-in method**, enable **Email/Password** if it is not already enabled.
3. In **Firestore Database**, create the database if one does not exist yet.
4. Open **Firestore Database → Rules**, paste the contents of `firestore.rules`, and publish the rules.
5. In **Authentication → Settings → Authorized domains**, confirm the GitHub Pages domain is authorized:
   `vshshsg229-hash.github.io`.
6. Test only on the staging branch/deployment until sign-up, sign-in, profile creation, and denied progress edits have been verified.

## Current security boundary

- Each signed-in user can read only their own `users/{uid}` document.
- A client can create a profile only with zero initial coins, points, XP, and played count.
- A client can edit only `username`, `avatar`, `bio`, and `updatedAt`.
- A client cannot delete a profile or change progression fields through these rules.
- Public leaderboards, community profile discovery, purchases, rewards, and game-result updates need trusted server-side functions/rules before being enabled. Do not weaken the rules to make those features work.

## Important

The Firebase web configuration is public client configuration, not an Admin SDK credential. Never put a service-account private key in this repository or in browser code.

The existing app REST API flow has deliberately not been replaced in this branch. Firebase initialization and the profile adapter are additive; live Firebase access and end-to-end login still need testing before merging into `main`.
