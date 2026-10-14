/* Optional Firebase bootstrap for the isolated integration branch.
 * Existing Render API remains the source of app account/game data until an adapter is tested.
 */
(() => {
  'use strict';
  const config = window.KH_FIREBASE_CONFIG;
  if (!config || !config.apiKey || !config.projectId || !config.appId) {
    console.warn('[KH Firebase] Config is missing; existing app continues without Firebase.');
    window.KH_FIREBASE_STATUS = { ready: false, reason: 'missing-config' };
    return;
  }
  if (!window.firebase || typeof window.firebase.initializeApp !== 'function') {
    console.warn('[KH Firebase] SDK did not load; existing app continues without Firebase.');
    window.KH_FIREBASE_STATUS = { ready: false, reason: 'sdk-unavailable' };
    return;
  }
  try {
    const app = window.firebase.apps.length
      ? window.firebase.app()
      : window.firebase.initializeApp(config);
    const auth = window.firebase.auth();
    window.KH_FIREBASE_APP = app;
    window.KH_FIREBASE_AUTH = auth;
    window.KH_FIREBASE_STATUS = { ready: true, projectId: config.projectId, auth };
    console.info('[KH Firebase] SDK initialized. Existing Render API remains active.');
  } catch (error) {
    console.error('[KH Firebase] Initialization failed; existing app continues.', error);
    window.KH_FIREBASE_STATUS = { ready: false, reason: 'initialization-failed' };
  }
})();
