/* Firebase Phone Auth adapter for KH么Kozak Battle Hub.
 * Existing profile/progression documents remain at users/{Firebase UID}.
 * If an existing email-auth user is already signed in, the SMS flow links phone
 * auth to that same Firebase account so its UID, profile and progress are retained.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let busy = false;
  let confirmationResult = null;
  let recaptchaVerifier = null;
  let recaptchaWidgetId = null;
  let linkingExistingAccount = false;

  function message(text, error = false) {
    const el = $('onlineAccountMessage');
    if (el) {
      el.textContent = text;
      el.classList.toggle('error', !!error);
    }
  }
  function hasPhoneProvider(user) {
    return !!user?.providerData?.some(p => p.providerId === 'phone');
  }
  function status(text, ready = false) {
    const pill = $('onlineStatusPill');
    if (pill) {
      pill.textContent = text;
      pill.classList.toggle('online-ready', !!ready);
      pill.classList.add('firebase-status');
    }
    const send = $('onlineRegister');
    const verify = $('onlineLogin');
    const logout = $('onlineLogout');
    const signedIn = !!window.KH_FIREBASE_AUTH?.currentUser;
    if (logout) logout.hidden = !signedIn;
    if (send) send.disabled = busy || (signedIn && hasPhoneProvider(window.KH_FIREBASE_AUTH.currentUser));
    if (verify) verify.disabled = busy || !confirmationResult;
  }
  function friendlyError(error) {
    const known = {
      'auth/invalid-phone-number': 'Перевір номер. Потрібен міжнародний формат, наприклад +380501234567.',
      'auth/missing-phone-number': 'Введи номер телефону з кодом країни.',
      'auth/too-many-requests': 'Забагато спроб. Зачекай і повтори пізніше.',
      'auth/quota-exceeded': 'Ліміт SMS вичерпано. Спробуй пізніше або перевір ліміти Firebase.',
      'auth/captcha-check-failed': 'Перевірка reCAPTCHA не пройдена. Онови сторінку та спробуй ще раз.',
      'auth/invalid-verification-code': 'Неправильний SMS-код. Перевір його та повтори.',
      'auth/code-expired': 'Код застарів. Надішли новий SMS-код.',
      'auth/session-expired': 'Сесія підтвердження завершилася. Надішли код повторно.',
      'auth/credential-already-in-use': 'Цей номер уже прив’язаний до іншого Firebase-акаунта. Не створюй новий профіль; увійди у старий акаунт і перенеси номер через прив’язку.',
      'auth/provider-already-linked': 'До цього акаунта вже прив’язаний номер телефону.',
      'auth/operation-not-allowed': 'У Firebase Console не ввімкнено Phone Authentication.',
      'auth/network-request-failed': 'Немає з’єднання. Перевір інтернет і повтори.',
      'permission-denied': 'Firebase відхилив доступ до профілю. Перевір, чи опубліковано firestore.rules.',
      'unavailable': 'Firestore тимчасово недоступний. Спробуй пізніше.'
    };
    return known[error?.code] || error?.message || 'Не вдалося виконати дію Firebase.';
  }
  async function getRecaptcha() {
    const auth = window.KH_FIREBASE_AUTH;
    if (!auth || !window.firebase?.auth?.RecaptchaVerifier) {
      throw new Error('Firebase Auth або reCAPTCHA SDK не завантажився. Перезавантаж сторінку.');
    }
    if (recaptchaVerifier) {
      try { await recaptchaVerifier.clear(); } catch (_) {}
      recaptchaVerifier = null;
      recaptchaWidgetId = null;
    }
    recaptchaVerifier = new window.firebase.auth.RecaptchaVerifier('recaptcha-container', {
      size: 'normal',
      callback: () => message('Перевірку reCAPTCHA пройдено. Можна надсилати SMS-код.'),
      'expired-callback': () => message('Перевірка reCAPTCHA завершилась. Підтверди її ще раз.', true)
    });
    recaptchaWidgetId = await recaptchaVerifier.render();
    return recaptchaVerifier;
  }
  async function sendCode() {
    if (busy) return;
    const auth = window.KH_FIREBASE_AUTH;
    if (!auth || !window.KH_FIREBASE_STATUS?.ready) {
      status('FIREBASE НЕ ГОТОВИЙ', false);
      message('Firebase ще не ініціалізований. Перевір конфігурацію та перезавантаж сторінку.', true);
      return;
    }
    const phone = $('onlinePhone')?.value.trim() || '';
    const username = $('onlineNickname')?.value.trim() || '';
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      message('Введи номер у міжнародному форматі: +380XXXXXXXXX.', true);
      return;
    }
    const current = auth.currentUser;
    if (!current && username.length < 3) {
      message('Ігровий нік має містити щонайменше 3 символи.', true);
      return;
    }
    busy = true;
    confirmationResult = null;
    linkingExistingAccount = !!current && !hasPhoneProvider(current);
    status('ГОТУЮ SMS…', false);
    message(linkingExistingAccount
      ? 'Цей пристрій уже авторизований. Після підтвердження номер буде прив’язано до поточного акаунта — профіль і прогрес залишаться на місці.'
      : 'Підготуй перевірку reCAPTCHA, після чого Firebase надішле SMS-код.');
    try {
      const verifier = await getRecaptcha();
      confirmationResult = linkingExistingAccount
        ? await current.linkWithPhoneNumber(phone, verifier)
        : await auth.signInWithPhoneNumber(phone, verifier);
      const code = $('onlineSmsCode');
      if (code) { code.value = ''; code.focus(); }
      message('SMS-код надіслано. Введи 6 цифр і натисни «Підтвердити код».');
    } catch (error) {
      confirmationResult = null;
      message(friendlyError(error), true);
    } finally {
      busy = false;
      status(auth.currentUser ? 'FIREBASE: АКАУНТ АКТИВНИЙ' : 'FIREBASE ГОТОВИЙ', !!auth.currentUser);
    }
  }
  async function verifyCode() {
    if (busy || !confirmationResult) return;
    const auth = window.KH_FIREBASE_AUTH;
    const code = $('onlineSmsCode')?.value.trim() || '';
    const username = $('onlineNickname')?.value.trim() || '';
    if (!/^\d{6}$/.test(code)) {
      message('Введи 6 цифр із SMS.', true);
      return;
    }
    busy = true;
    status('ПЕРЕВІРЯЮ SMS-КОД…', false);
    message('Перевіряю код у Firebase…');
    try {
      const credential = await confirmationResult.confirm(code);
      const user = credential.user || auth.currentUser;
      if (!user) throw new Error('Firebase не повернув авторизованого користувача.');
      if (!linkingExistingAccount && username.length >= 3 && !user.displayName) {
        await user.updateProfile({ displayName: username });
      }
      // If linking to a pre-existing email account, this UID is unchanged, so its
      // Firestore profile, coins, XP, achievements and inventory remain attached.
      const profileName = username.length >= 3 ? username : (user.displayName || ('Player' + (user.phoneNumber || '').slice(-4)));
      if (window.KHFirebaseProfile) {
        await window.KHFirebaseProfile.createIfMissing(profileName);
      }
      confirmationResult = null;
      const sms = $('onlineSmsCode');
      if (sms) sms.value = '';
      window.dispatchEvent(new CustomEvent('kh-firebase-profile-ready', { detail: { user } }));
      status('FIREBASE: ВХІД ВИКОНАНО', true);
      message(linkingExistingAccount
        ? 'Номер телефону прив’язано до наявного акаунта. Твій UID, профіль і прогрес збережено.'
        : 'Вхід через номер телефону виконано. Профіль і прогрес синхронізуються через Firebase.');
    } catch (error) {
      message(friendlyError(error), true);
    } finally {
      busy = false;
      status(auth?.currentUser ? 'FIREBASE: АКАУНТ АКТИВНИЙ' : 'FIREBASE ГОТОВИЙ', !!auth?.currentUser);
    }
  }
  function intercept(id, action) {
    const button = $(id);
    if (!button) return;
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      action();
    }, true);
  }
  intercept('onlineRegister', sendCode);
  intercept('onlineLogin', verifyCode);
  intercept('onlineLogout', async () => {
    const auth = window.KH_FIREBASE_AUTH;
    if (!auth) return;
    try {
      await auth.signOut();
      confirmationResult = null;
      message('Вихід виконано. Хмарний профіль і прогрес у Firebase не видалено.');
      status('FIREBASE ГОТОВИЙ', false);
    } catch (error) {
      message(friendlyError(error), true);
    }
  });
  $('onlineSmsCode')?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      verifyCode();
    }
  });
  window.addEventListener('kh-firebase-auth-state', event => {
    const user = event.detail?.user;
    status(user ? 'FIREBASE: ВХІД ВИКОНАНО' : (window.KH_FIREBASE_STATUS?.ready ? 'FIREBASE ГОТОВИЙ' : 'FIREBASE НЕ ГОТОВИЙ'), !!user);
  });
  window.addEventListener('load', async () => {
    const auth = window.KH_FIREBASE_AUTH;
    if (!auth) {
      status('FIREBASE НЕ ГОТОВИЙ', false);
      message('Не вдалося ініціалізувати Firebase. Перевір підключення SDK і конфігурацію.', true);
      return;
    }
    if (auth.currentUser) {
      status('FIREBASE: ВХІД ВИКОНАНО', true);
      try {
        const user = auth.currentUser;
        const existing = window.KHFirebaseProfile ? await window.KHFirebaseProfile.load().catch(() => null) : null;
        const username = existing?.username || user.displayName || ('Player' + (user.phoneNumber || '').slice(-4));
        if (window.KHFirebaseProfile) await window.KHFirebaseProfile.createIfMissing(username);
        window.dispatchEvent(new CustomEvent('kh-firebase-profile-ready', { detail: { user } }));
        message(hasPhoneProvider(user)
          ? 'Акаунт через телефон активний. Профіль і прогрес завантажено.'
          : 'Твій старий акаунт ще активний на цьому пристрої. Введи номер і підтверди SMS, щоб прив’язати телефон та зберегти той самий профіль.');
      } catch (error) {
        message(friendlyError(error), true);
      }
    } else {
      status('FIREBASE ГОТОВИЙ', false);
      message('Введи номер телефону та ігровий нік, щоб зареєструватися або увійти через SMS.');
    }
  });
})();