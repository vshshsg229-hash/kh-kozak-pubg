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
    if (snap.exists) return { uid: user.uid, ...snap.data() };
    const profile = {
      uid: user.uid,
      username: String(username || user.displayName || (user.email || 'player').split('@')[0]).slice(0, 32),
      email: user.email || null,
      coins: 0, points: 0, xp: 0, played: 0,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };
    await ref.set(profile);
    return { ...profile, uid: user.uid };
  }
  async function updatePublicProfile(fields) {
    const { db, user } = requireFirebase();
    const allowed = {};
    ['username', 'avatar', 'bio'].forEach(key => {
      if (Object.prototype.hasOwnProperty.call(fields || {}, key)) {
        allowed[key] = String(fields[key] ?? '').slice(0, key === 'bio' ? 240 : 64);
      }
    });
    allowed.updatedAt = window.firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('users').doc(user.uid).set(allowed, { merge: true });
    return loadProfile();
  }
  window.KHFirebaseProfile = Object.freeze({
    load: loadProfile,
    createIfMissing: createProfileIfMissing,
    updatePublicProfile
  });
})();
