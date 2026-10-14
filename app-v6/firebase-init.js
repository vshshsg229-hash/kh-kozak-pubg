/* KH么Kozak Firebase bootstrap — isolated integration branch.
 * This initializes Firebase Auth and Firestore without switching production API routes.
 * Never put service-account credentials or private keys in this browser bundle.
 */
(() => {
  'use strict';
  const config = window.KH_FIREBASE_CONFIG;
  const fail = reason => {
    window.KH_FIREBASE_STATUS = { ready: false, reason };
    console.warn('[KH Firebase] Not ready:', reason);
  };
  if (!config || !config.apiKey || !config.projectId || !config.appId) {
    fail('missing-config');
    return;
  }
  if (!window.firebase || typeof window.firebase.initializeApp !== 'function') {
    fail('sdk-unavailable');
    return;
  }
  try {
    const app = window.firebase.apps.length
      ? window.firebase.app()
      : window.firebase.initializeApp(config);
    const auth = app.auth();
    const db = typeof app.firestore === 'function' ? app.firestore() : null;
    window.KH_FIREBASE_APP = app;
    window.KH_FIREBASE_AUTH = auth;
    window.KH_FIREBASE_DB = db;
    window.KH_FIREBASE_STATUS = {
      ready: true,
      projectId: config.projectId,
      authReady: !!auth,
      firestoreSdkReady: !!db,
      currentUser: auth.currentUser || null
    };
    auth.onAuthStateChanged(user => {
      window.KH_FIREBASE_STATUS = {
        ...(window.KH_FIREBASE_STATUS || {}),
        ready: true,
        projectId: config.projectId,
        authReady: true,
        firestoreSdkReady: !!db,
        currentUser: user || null,
        uid: user ? user.uid : null
      };
      window.dispatchEvent(new CustomEvent('kh-firebase-auth-state', {
        detail: { user: user || null }
      }));
    });
    console.info('[KH Firebase] Initialized for', config.projectId,
      'Auth:', !!auth, 'Firestore SDK:', !!db,
      'Existing account/game API is unchanged.');
  } catch (error) {
    console.error('[KH Firebase] Initialization failed; existing app continues.', error);
    fail('initialization-failed');
  }
})();
