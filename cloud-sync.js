/* KH么Kozak 4.1 — optional cloud progress sync.
 * Requires supabase-config.js and @supabase/supabase-js v2.
 * Only selected game/progress keys are synced; chat, AI endpoints and tokens are excluded.
 */
(() => {
  'use strict';
  const config = window.KOZAK_SUPABASE_CONFIG || {};
  const sdk = window.supabase;
  const statusEvent = (detail) => window.dispatchEvent(new CustomEvent('kozak-cloud-status', { detail }));
  if (!config.url || !config.anonKey || !sdk || typeof sdk.createClient !== 'function') {
    window.KozakCloudSync = {
      enabled: false,
      client: null,
      status: () => ({ enabled: false, message: 'Хмара ще не налаштована. Прогрес зберігається на цьому пристрої.' }),
      syncNow: async () => ({ ok: false, reason: 'not-configured' })
    };
    statusEvent({ enabled: false, message: 'Локальний режим — підключи Supabase, щоб увімкнути синхронізацію.' });
    return;
  }

  const client = sdk.createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const TABLE = 'kozak_player_saves';
  const KEY_RE = /^(kh|kozak|pubg|game|player|arcade)[\w:.-]*$/i;
  const EXCLUDE_RE = /(auth|session|token|secret|api.?key|endpoint|assistant.?chat|ai.?chat|conversation)/i;
  let syncing = false;
  let queued = false;
  let timer = null;
  let lastMessage = 'Очікуємо вхід в акаунт.';

  function isProgressKey(key) {
    return typeof key === 'string' && KEY_RE.test(key) && !EXCLUDE_RE.test(key);
  }
  function readLocalProgress() {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!isProgressKey(key)) continue;
      try { result[key] = JSON.parse(localStorage.getItem(key)); }
      catch (_) { result[key] = localStorage.getItem(key); }
    }
    return result;
  }
  function applyProgress(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return;
    Object.entries(data).forEach(([key, value]) => {
      if (!isProgressKey(key)) return;
      try { localStorage.setItem(key, JSON.stringify(value)); }
      catch (_) { /* Keep the current page usable if storage is full. */ }
    });
  }
  async function currentUser() {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    return data.user || null;
  }
  async function syncNow() {
    if (syncing) return { ok: false, reason: 'busy' };
    syncing = true;
    statusEvent({ enabled: true, busy: true, message: 'Синхронізуємо прогрес…' });
    try {
      const user = await currentUser();
      if (!user) {
        lastMessage = 'Увійди в акаунт, щоб синхронізувати прогрес між пристроями.';
        statusEvent({ enabled: true, busy: false, signedIn: false, message: lastMessage });
        return { ok: false, reason: 'signed-out' };
      }
      const { data: row, error: readError } = await client
        .from(TABLE).select('data, updated_at').eq('user_id', user.id).maybeSingle();
      if (readError) throw readError;
      const local = readLocalProgress();
      const merged = row && row.data && typeof row.data === 'object'
        ? { ...local, ...row.data }
        : local;
      applyProgress(merged);
      const { error: writeError } = await client.from(TABLE).upsert({
        user_id: user.id,
        data: merged,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (writeError) throw writeError;
      lastMessage = 'Прогрес синхронізовано. Можна продовжити гру на іншому пристрої.';
      statusEvent({ enabled: true, busy: false, signedIn: true, email: user.email, message: lastMessage });
      return { ok: true, user, data: merged };
    } catch (error) {
      lastMessage = error && error.message ? error.message : 'Не вдалося синхронізувати прогрес.';
      statusEvent({ enabled: true, busy: false, error: true, message: lastMessage });
      return { ok: false, reason: 'error', error };
    } finally {
      syncing = false;
    }
  }
  function scheduleSync() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      syncNow().catch(() => {});
    }, 1800);
  }

  // Hook only progress-like keys, leaving auth credentials and AI settings untouched.
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    if (this === window.localStorage && isProgressKey(String(key))) scheduleSync();
  };
  window.addEventListener('storage', event => {
    if (event.storageArea === localStorage && isProgressKey(event.key)) scheduleSync();
  });
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) setTimeout(() => syncNow(), 0);
    if (event === 'SIGNED_OUT') statusEvent({ enabled: true, signedIn: false, message: 'Вийшли з акаунта. Локальний прогрес залишився на пристрої.' });
  });

  window.KozakCloudSync = {
    enabled: true,
    client,
    status: () => ({ enabled: true, message: lastMessage }),
    syncNow,
    readLocalProgress,
    getUser: currentUser
  };
  statusEvent({ enabled: true, message: 'Хмару підключено. Увійди в акаунт для синхронізації.' });
})();