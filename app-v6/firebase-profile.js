/* KH么Kozak Firebase account/profile adapter.
 * This module is intentionally additive: existing REST API flows are not silently replaced.
 * Firestore rules must allow an authenticated user to access only users/{their UID}.
 */
(() => {
  'use strict';
  const getAuth = () => window.KH_FIREBASE_AUTH;
  const getDb = () => window.KH_FIREBASE_DB;
  const requireFirebase = () => {
    const auth = getAuth(), db = getDb();
    if (!auth) throw new Error('Firebase Authentication SDK не готовий. Перезавантаж сторінку.');
    if (!db) throw new Error('Firestore SDK не готовий. Перевір підключення Firebase.');
    if (!auth.currentUser) throw new Error('Спочатку увійди через Firebase.');
    return { auth, db, user: auth.currentUser };
  };
  async function loadProfile() {
    const { db, user } = requireFirebase();
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
    return snap.exists ? { uid: user.uid, ...snap.data() } : null;
  }
  async function createProfileIfMissing(username) {
    const { db, user } = requireFirebase();
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
    if (snap.exists) {
      const existing = snap.data();
      if (!existing.usernameLower && window.firebase?.app && typeof window.firebase.app().functions === 'function') {
        try {
          await window.firebase.app().functions('us-central1').httpsCallable('updateMyProfile')({ username: String(existing.username || user.displayName || 'Player').slice(0, 20) });
          const refreshed = await ref.get();
          if (refreshed.exists) return { uid: user.uid, ...refreshed.data() };
        } catch (error) { console.warn('[KH Firebase] Existing nickname index was not migrated:', error?.message || error); }
      }
      return { uid: user.uid, ...existing };
    }
    const profile = {
      uid: user.uid,
      username: String(username || user.displayName || (user.email || 'player').split('@')[0]).slice(0, 32),
      usernameLower: String(username || user.displayName || (user.email || 'player').split('@')[0]).slice(0, 32).toLowerCase(),
      email: user.email || null,
      coins: 0, points: 0, xp: 0, played: 0,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };
    await ref.set(profile);
    return { ...profile, uid: user.uid };
  }
  async function updatePublicProfile(fields) {
    const { user } = requireFirebase();
    const input = fields || {};
    const callable = window.firebase.app().functions('us-central1').httpsCallable('updateMyProfile');
    await callable({
      username: String(input.username ?? user.displayName ?? (user.email || 'player').split('@')[0]).trim(),
      ...(Object.prototype.hasOwnProperty.call(input, 'bio') ? { bio: String(input.bio ?? '').slice(0, 240) } : {}),
      ...(Object.prototype.hasOwnProperty.call(input, 'avatar') ? { avatar: String(input.avatar ?? '').slice(0, 64) } : {})
    });
    return loadProfile();
  }
  window.KHFirebaseProfile = Object.freeze({
    load: loadProfile,
    createIfMissing: createProfileIfMissing,
    updatePublicProfile
  });
})();
