(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('account-form');
  const status = $('account-status');
  const profile = $('account-profile');
  const signOut = $('account-signout');
  const syncButton = $('account-sync');
  const submit = $('account-submit');
  let mode = 'signup';
  let client = null;

  function show(message, state = '') {
    status.textContent = message;
    status.dataset.state = state;
  }
  function showMode(next) {
    mode = next;
    $('account-submit').textContent = mode === 'signup' ? 'Створити акаунт' : 'Увійти';
    $('account-mode-toggle').textContent = mode === 'signup' ? 'Уже є акаунт? Увійти' : 'Новий гравець? Створити акаунт';
    $('account-password').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    show(mode === 'signup' ? 'Створи акаунт, щоб переносити прогрес між пристроями.' : 'Увійди, щоб завантажити свій хмарний прогрес.');
  }
  function friendlyError(error) {
    const message = error && error.message ? error.message : 'Невідома помилка.';
    if (/invalid login credentials/i.test(message)) return 'Не вдалося увійти. Перевір пошту та пароль.';
    if (/already registered/i.test(message)) return 'Ця пошта вже зареєстрована. Спробуй увійти.';
    if (/password should be at least/i.test(message)) return 'Пароль має містити щонайменше 6 символів.';
    if (/email not confirmed/i.test(message)) return 'Підтверди пошту за посиланням у листі, потім увійди.';
    return message;
  }
  function showUser(user) {
    if (!user) {
      profile.hidden = true;
      form.hidden = false;
      signOut.hidden = true;
      syncButton.disabled = true;
      return;
    }
    profile.hidden = false;
    form.hidden = !user.is_anonymous;
    signOut.hidden = false;
    $('account-email').textContent = user.email || (user.is_anonymous ? 'Гостьовий профіль KH么Kozak' : 'Гравець KH么Kozak');
    $('account-userid').textContent = 'ID гравця: ' + user.id + (user.is_anonymous ? ' · гість — прив’яжи email, щоб зберегти доступ' : '');
    if (user.is_anonymous) { showMode('signup'); show('Гостьовий профіль уже створено автоматично. Додай email і пароль, щоб перетворити його на постійний акаунт.'); }
    syncButton.disabled = false;
  }
  async function refreshSession() {
    if (!client) return;
    const { data, error } = await client.auth.getSession();
    if (error) show(friendlyError(error), 'error');
    showUser(data && data.session ? data.session.user : null);
    if (data && data.session && window.KozakCloudSync) {
      const result = await window.KozakCloudSync.syncNow();
      if (!result.ok && result.reason !== 'busy') show(result.error ? friendlyError(result.error) : 'Не вдалося синхронізувати прогрес.', 'error');
      else show('Ти увійшов. ' + (result.ok ? 'Прогрес синхронізовано з хмарою.' : ''), result.ok ? 'success' : '');
    }
  }
  let guestBootstrapAttempted = false;
  async function waitForClient() {
    const sync = window.KozakCloudSync;
    if (sync && sync.enabled && sync.client) {
      client = sync.client;
      client.auth.onAuthStateChange((event) => {
        if (['SIGNED_IN','SIGNED_OUT','USER_UPDATED','TOKEN_REFRESHED'].includes(event)) setTimeout(() => refreshSession(), 0);
      });
      const { data, error } = await client.auth.getSession();
      if (error) {
        show(friendlyError(error), 'error');
        return;
      }
      if (data && data.session) {
        return refreshSession();
      }
      // Create a guest profile once on first visit so progress can later be linked to email.
      // Do not auto-create a new guest after the user explicitly signs out.
      if (!guestBootstrapAttempted) {
        guestBootstrapAttempted = true;
        show('Створюємо гостьовий профіль…');
        const { error: guestError } = await client.auth.signInAnonymously();
        if (guestError) {
          const message = /anonymous.*disabled|anonymous sign.?ins.*disabled/i.test(guestError.message || '')
            ? 'Увімкни Anonymous Sign-Ins у Supabase → Authentication → Sign In / Providers, щоб автоматично створювати гостьовий профіль.'
            : friendlyError(guestError);
          show(message, 'warning');
          return;
        }
      }
      return refreshSession();
    }
    show('Хмарний акаунт ще не налаштовано. Спершу потрібно додати URL і publishable/anon key у supabase-config.js та виконати account-schema.sql у Supabase.', 'warning');
    submit.disabled = true;
    $('account-mode-toggle').disabled = true;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return;
    const email = $('account-email-input').value.trim();
    const password = $('account-password').value;
    submit.disabled = true;
    show(mode === 'signup' ? 'Створюємо акаунт…' : 'Входимо…');
    try {
      if (mode === 'signup') {
        const { data: sessionData } = await client.auth.getSession();
        const currentUser = sessionData?.session?.user;
        let data, error;
        const upgradingGuest = Boolean(currentUser?.is_anonymous);
        if (upgradingGuest) {
          ({ data, error } = await client.auth.updateUser({ email, password, data: { nickname: localStorage.getItem('khkozak:community-nickname') || 'Гравець' } }));
        } else {
          ({ data, error } = await client.auth.signUp({
            email, password,
            options: { emailRedirectTo: window.location.origin + window.location.pathname }
          }));
        }
        if (error) throw error;
        if (upgradingGuest) {
          showUser(data.user);
          const result = window.KozakCloudSync ? await window.KozakCloudSync.syncNow() : null;
          show(result && result.ok ? 'Гостьовий профіль став постійним, прогрес збережено у хмарі!' : 'Дані профілю оновлено. Якщо Supabase попросить підтвердити пошту, перевір лист.', 'success');
        } else if (data.session) {
          showUser(data.user);
          const result = window.KozakCloudSync ? await window.KozakCloudSync.syncNow() : null;
          show(result && result.ok ? 'Акаунт створено, прогрес збережено у хмарі!' : 'Акаунт створено. Якщо потрібно, підтверди пошту.', 'success');
        } else {
          show('Майже готово! Перевір пошту та підтверди акаунт, потім увійди на цьому сайті.', 'success');
        }
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await refreshSession();
      }
    } catch (error) {
      show(friendlyError(error), 'error');
    } finally {
      submit.disabled = false;
    }
  });
  $('account-mode-toggle').addEventListener('click', () => showMode(mode === 'signup' ? 'signin' : 'signup'));
  signOut.addEventListener('click', async () => {
    if (!client) return;
    signOut.disabled = true;
    const { error } = await client.auth.signOut();
    signOut.disabled = false;
    if (error) show(friendlyError(error), 'error');
    else { showUser(null); show('Вихід виконано. Локальний прогрес не видаляється.', 'success'); }
  });
  syncButton.addEventListener('click', async () => {
    if (!window.KozakCloudSync) return;
    syncButton.disabled = true;
    const result = await window.KozakCloudSync.syncNow();
    syncButton.disabled = false;
    if (result.ok) show('Готово! Прогрес синхронізовано.', 'success');
    else show(result.error ? friendlyError(result.error) : 'Увійди в акаунт, щоб синхронізувати прогрес.', 'error');
  });
  window.addEventListener('kozak-cloud-status', event => {
    if (event.detail && event.detail.message && !event.detail.busy) {
      if (!event.detail.signedIn && profile.hidden) show(event.detail.message, event.detail.enabled ? '' : 'warning');
    }
  });

  // Portable local save: only export/import KH Kozak game keys, never auth/session values.
  const saveKeyAllowed = key => typeof key === 'string' && /^khkozak:[a-z0-9:_-]+$/i.test(key) && !/(auth|session|token|secret|api.?key|endpoint|assistant.?chat|ai.?chat|conversation)/i.test(key);
  $('account-export').addEventListener('click', () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (saveKeyAllowed(key)) data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify({format:'khkozak-save',version:1,exportedAt:new Date().toISOString(),data},null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'khkozak-progress-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    show('Файл прогресу створено. Перенеси його на інший пристрій, а потім імпортуй тут.', 'success');
  });
  $('account-import-trigger').addEventListener('click', () => $('account-import-file').click());
  $('account-import-file').addEventListener('change', async event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Файл завеликий (максимум 2 МБ).');
      const payload = JSON.parse(await file.text());
      if (!payload || payload.format !== 'khkozak-save' || payload.version !== 1 || !payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) throw new Error('Це не файл збереження KH么Kozak.');
      const entries = Object.entries(payload.data).filter(([key,value]) => saveKeyAllowed(key) && typeof value === 'string');
      if (!entries.length) throw new Error('У файлі немає сумісного ігрового прогресу.');
      if (!window.confirm('Імпортувати ' + entries.length + ' записів? Існуючі значення з такими самими ключами будуть замінені.')) return;
      entries.forEach(([key,value]) => localStorage.setItem(key,value));
      show('Імпортовано ' + entries.length + ' записів. Оновлюємо сторінку, щоб завантажити прогрес…', 'success');
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      show(error && error.message ? error.message : 'Не вдалося імпортувати файл.', 'error');
    } finally {
      event.target.value = '';
    }
  });

  showMode('signup');
  waitForClient();
})();