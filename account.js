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
  let currentUser = null;
  let authActionInProgress = false;

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
    if (/signup is disabled|signups not allowed|new user signups disabled/i.test(message)) return 'Реєстрацію вимкнено в Supabase. Увімкни Allow new users to sign up у налаштуваннях Authentication.';
    if (/email rate limit exceeded|rate limit/i.test(message)) return 'Supabase тимчасово обмежив надсилання листів. Зачекай і спробуй пізніше або налаштуй SMTP.';
    if (/anonymous.*disabled|anonymous sign.?ins.*disabled/i.test(message)) return 'Гостьовий режим вимкнений у Supabase. Реєстрація через email має працювати окремо; увімкни Anonymous Sign-Ins для інших функцій.';
    if (/failed to fetch|networkerror|load failed/i.test(message)) return 'Немає зв’язку із сервером реєстрації. Перевір інтернет і спробуй ще раз.';
    if (/redirect.*not allowed|invalid redirect/i.test(message)) return 'Supabase відхилив адресу повернення. Додай URL сторінки account.html у Authentication → URL Configuration.';
    return message;
  }
  function showUser(user) {
    currentUser = user || null;
    const tiktokPanel = $('account-tiktok-panel');
    if (tiktokPanel) tiktokPanel.hidden = !user;
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
    loadTikTokProfile(user);
  }
  function normalizeTikTok(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    let handle = raw;
    if (/^https:\/\//i.test(raw)) {
      let u; try { u = new URL(raw); } catch (_) { throw new Error('Посилання виглядає некоректно.'); }
      if (!['tiktok.com','www.tiktok.com'].includes(u.hostname.toLowerCase()) || u.protocol !== 'https:') throw new Error('Додай посилання саме на tiktok.com.');
      const match = u.pathname.match(/^\/@([A-Za-z0-9._]{2,24})\/?$/);
      if (!match) throw new Error('Посилання має вести прямо на профіль виду tiktok.com/@username.');
      handle = match[1];
    } else {
      handle = raw.replace(/^@/, '');
      if (!/^[A-Za-z0-9._]{2,24}$/.test(handle)) throw new Error('Введи TikTok-нік від 2 до 24 символів або посилання на профіль.');
    }
    return 'https://www.tiktok.com/@' + handle;
  }
  function tiktokStatus(message, state='') { const el=$('account-tiktok-status'); if(el){el.textContent=message;el.dataset.state=state;} }
  async function loadTikTokProfile(user) {
    if(!client||!user||!$('account-tiktok-form')) return;
    const input=$('account-tiktok-url'),open=$('account-tiktok-open');
    tiktokStatus('Завантажуємо налаштування профілю…');
    try {
      const {data,error}=await client.from('kozak_player_profiles').select('nickname,tiktok_url').eq('user_id',user.id).maybeSingle();
      if(error) throw error;
      const url=data?.tiktok_url||'';
      if(input) input.value=url;
      if(open){open.href=url||'#';open.hidden=!url;}
      tiktokStatus(url?'TikTok прив’язано до твого акаунта KH么Kozak ✓':'Додай @нік або посилання на свій TikTok-профіль.');
    } catch(error) {
      tiktokStatus('Таблиця профілів ще не налаштована. Виконай оновлений video-community-schema.sql у Supabase.','warning');
    }
  }
  async function saveTikTokProfile(value) {
    if(!client||!currentUser) return;
    const button=$('account-tiktok-save');button.disabled=true;
    try {
      const url=normalizeTikTok(value);
      const nickname=String(localStorage.getItem('khkozak:community-nickname')||currentUser.user_metadata?.nickname||'Гравець').trim().slice(0,24)||'Гравець';
      const {error}=await client.from('kozak_player_profiles').upsert({user_id:currentUser.id,nickname,tiktok_url:url||null,updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if(error) throw error;
      $('account-tiktok-url').value=url;
      const open=$('account-tiktok-open');if(open){open.href=url||'#';open.hidden=!url;}
      await client.auth.updateUser({data:{tiktok_url:url||null}}).catch(()=>{});
      tiktokStatus(url?'TikTok успішно прив’язано! Посилання видно у твоїх кліпах спільноти ✓':'TikTok відв’язано від профілю KH么Kozak.','success');
    } catch(error) { tiktokStatus(error.message||'Не вдалося зберегти TikTok-профіль.','error'); }
    finally {button.disabled=false;}
  }
  $('account-tiktok-form')?.addEventListener('submit',event=>{event.preventDefault();saveTikTokProfile($('account-tiktok-url').value);});
  $('account-tiktok-remove')?.addEventListener('click',()=>{ $('account-tiktok-url').value='';saveTikTokProfile(''); });
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
        if (!authActionInProgress && ['SIGNED_IN','SIGNED_OUT','USER_UPDATED','TOKEN_REFRESHED'].includes(event)) setTimeout(() => refreshSession(), 0);
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
    if (!client) {
      show('Ще підключаємо сервер акаунтів. Зачекай секунду й натисни ще раз.', 'warning');
      await waitForClient();
      if (!client) return;
    }
    const email = $('account-email-input').value.trim();
    const password = $('account-password').value;
    submit.disabled = true;
    authActionInProgress = true;
    show(mode === 'signup' ? 'Створюємо акаунт…' : 'Входимо…');
    try {
      if (mode === 'signup') {
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        const wasGuest = Boolean(sessionData?.session?.user?.is_anonymous);
        // A guest session can interfere with ordinary signUp and email/password linking
        // requires extra Supabase identity-linking configuration. Keep local progress,
        // sign out the temporary guest, and use the standard email signup flow instead.
        if (wasGuest) {
          const { error: signOutError } = await client.auth.signOut();
          if (signOutError) throw signOutError;
        }
        const { data, error } = await client.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin + window.location.pathname,
            data: { nickname: localStorage.getItem('khkozak:community-nickname') || 'Гравець' }
          }
        });
        if (error) {
          // Restore guest access if signup fails; local progress remains on this device.
          if (wasGuest) await client.auth.signInAnonymously().catch(() => {});
          throw error;
        }
        if (!data.user && !data.session) throw new Error('Supabase не повернув створений акаунт. Перевір налаштування реєстрації та спробуй ще раз.');
        if (data.session) {
          showUser(data.user);
          const result = window.KozakCloudSync ? await window.KozakCloudSync.syncNow() : null;
          show(result && result.ok ? 'Акаунт створено, прогрес збережено у хмарі!' : 'Акаунт створено успішно!', 'success');
        } else {
          if (wasGuest) await client.auth.signInAnonymously().catch(() => {});
          show('Запит на створення акаунта прийнято. Перевір пошту та папку «Спам», підтверди адресу, а потім увійди тут. Локальний прогрес залишився на пристрої.', 'success');
        }
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await refreshSession();
      }
    } catch (error) {
      show(friendlyError(error), 'error');
    } finally {
      authActionInProgress = false;
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