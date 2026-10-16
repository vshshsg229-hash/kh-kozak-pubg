/**
 * Firebase Web App configuration template for KH么Kozak Battle Hub.
 *
 * Replace the empty strings with the exact values shown in:
 * Firebase Console -> Project settings -> General -> Your apps -> SDK setup and configuration.
 *
 * This template is intentionally NOT imported by app-v6 and does not change production.
 * Firebase web config is client configuration, not a place for service-account credentials.
 */
window.KH_FIREBASE_CONFIG = Object.freeze({
  apiKey: "",
  authDomain: "",
  projectId: "",
  appId: "",
  messagingSenderId: "",
  storageBucket: ""
});

window.KH_FIREBASE_CONFIG_STATUS = (() => {
  const c = window.KH_FIREBASE_CONFIG;
  const missing = ["apiKey", "authDomain", "projectId", "appId"]
    .filter((key) => typeof c[key] !== "string" || !c[key].trim());
  const invalidProjectId = !missing.includes("projectId") && /\s/.test(c.projectId);
  const invalidApiKey = !missing.includes("apiKey") && !/^AIza[\w-]{20,}$/.test(c.apiKey);
  return Object.freeze({
    ready: missing.length === 0 && !invalidProjectId && !invalidApiKey,
    missing,
    invalidProjectId,
    invalidApiKey
  });
})();
