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
    form.hidden = true;
    signOut.hidden = false;
    $('account-email').textContent = user.email || 'Гравець KH么Kozak';
    $('account-userid').textContent = 'ID гравця: ' + user.id;
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
  function waitForClient() {
    const sync = window.KozakCloudSync;
    if (sync && sync.enabled && sync.client) {
      client = sync.client;
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
        const { data, error } = await client.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + window.location.pathname }
        });
        if (error) throw error;
        if (data.session) {
          showUser(data.user);
          const result = window.KozakCloudSync ? await window.KozakCloudSync.syncNow() : null;
          show(result && result.ok ? 'Акаунт створено. Прогрес збережено у хмарі!' : 'Акаунт створено. Якщо ввімкнене підтвердження пошти, перевір лист і підтверди адресу.', 'success');
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
  showMode('signup');
  waitForClient();
})();