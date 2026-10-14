/* Firebase email/password auth adapter for KH么Kozak Battle Hub.
 * Keeps Firebase sessions separate from the legacy REST API token.
 * No coins, XP, purchases, or game rewards are written by this client adapter.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let busy = false;

  function message(text, error = false) {
    const el = $('onlineAccountMessage');
    if (el) {
      el.textContent = text;
      el.classList.toggle('error', !!error);
    }
  }
  function status(text, ready = false) {
    const pill = $('onlineStatusPill');
    if (!pill) return;
    pill.textContent = text;
    pill.classList.toggle('online-ready', !!ready);
    pill.classList.toggle('firebase-status', true);
    const logout = $('onlineLogout');
    const register = $('onlineRegister');
    const login = $('onlineLogin');
    const signedIn = !!window.KH_FIREBASE_AUTH?.currentUser;
    if (logout) logout.hidden = !signedIn;
    if (register) register.disabled = busy || signedIn;
    if (login) login.disabled = busy || signedIn;
  }
  function friendlyError(error) {
    const code = error && error.code;
    const known = {
      'auth/email-already-in-use': 'Ця пошта вже зареєстрована. Натисни «Увійти».',
      'auth/invalid-email': 'Перевір адресу електронної пошти.',
      'auth/weak-password': 'Пароль надто простий. Використай щонайменше 8 символів.',
      'auth/invalid-credential': 'Неправильна пошта або пароль.',
      'auth/user-not-found': 'Акаунт не знайдено. Спочатку створи акаунт.',
      'auth/wrong-password': 'Неправильна пошта або пароль.',
      'auth/too-many-requests': 'Забагато спроб. Зачекай і повтори пізніше.',
      'auth/network-request-failed': 'Немає з’єднання. Перевір інтернет і повтори.',
      'permission-denied': 'Firebase відхилив доступ до профілю. Перевір, чи опубліковано firestore.rules.',
      'unavailable': 'Firestore тимчасово недоступний. Спробуй пізніше.'
    };
    return known[code] || error?.message || 'Не вдалося виконати дію Firebase.';
  }
  async function run(mode) {
    if (busy) return;
    const auth = window.KH_FIREBASE_AUTH;
    if (!auth || !window.KH_FIREBASE_STATUS?.ready) {
      status('FIREBASE НЕ ГОТОВИЙ', false);
      message('Firebase ще не ініціалізований. Перевір конфігурацію та перезавантаж сторінку.', true);
      return;
    }
    const email = $('onlineEmail')?.value.trim();
    const password = $('onlinePassword')?.value || '';
    const username = $('onlineNickname')?.value.trim() || 'KH么Kozak';
    if (!email || !password) {
      message('Заповни електронну пошту та пароль.', true);
      return;
    }
    if (mode === 'register' && username.length < 3) {
      message('Ігровий нік має містити щонайменше 3 символи.', true);
      return;
    }
    if (mode === 'register' && password.length < 8) {
      message('Пароль має містити щонайменше 8 символів.', true);
      return;
    }
    busy = true;
    status('З’ЄДНАННЯ З FIREBASE…', false);
    message(mode === 'register' ? 'Створюю акаунт у Firebase Authentication…' : 'Виконую вхід через Firebase Authentication…');
    try {
      if (mode === 'register') {
        await auth.createUserWithEmailAndPassword(email, password);
        if (auth.currentUser && username) await auth.currentUser.updateProfile({ displayName: username });
      } else {
        await auth.signInWithEmailAndPassword(email, password);
      }
      if (window.KHFirebaseProfile) {
        await window.KHFirebaseProfile.createIfMissing(username);
      }
      status('FIREBASE: ВХІД ВИКОНАНО', true);
      message('Акаунт Firebase підключено. Увага: синхронізація монет, XP, магазину та ігрового прогресу ще не під’єднана.');
      const pass = $('onlinePassword');
      if (pass) pass.value = '';
    } catch (error) {
      status('FIREBASE: ПОТРІБНА ПЕРЕВІРКА', false);
      message(friendlyError(error), true);
    } finally {
      busy = false;
      status(auth.currentUser ? 'FIREBASE: ВХІД ВИКОНАНО' : 'FIREBASE ГОТОВИЙ', !!auth.currentUser);
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
  intercept('onlineRegister', () => run('register'));
  intercept('onlineLogin', () => run('login'));
  intercept('onlineLogout', async () => {
    const auth = window.KH_FIREBASE_AUTH;
    if (!auth) return;
    try {
      await auth.signOut();
      message('Вихід із Firebase виконано. Локальний прогрес на пристрої не видалено.');
      status('FIREBASE: НЕ ВИКОНАНО ВХІД', false);
    } catch (error) {
      message(friendlyError(error), true);
    }
  });
  const password = $('onlinePassword');
  password?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopImmediatePropagation();
      run('login');
    }
  }, true);

  window.addEventListener('kh-firebase-auth-state', event => {
    const user = event.detail?.user;
    if (user) {
      status('FIREBASE: ВХІД ВИКОНАНО', true);
      message('Firebase-акаунт активний. Синхронізація ігрового прогресу ще не під’єднана.');
    } else {
      status(window.KH_FIREBASE_STATUS?.ready ? 'FIREBASE ГОТОВИЙ' : 'FIREBASE НЕ ГОТОВИЙ', false);
    }
  });
  window.addEventListener('load', () => {
    const auth = window.KH_FIREBASE_AUTH;
    if (!auth) {
      status('FIREBASE НЕ ГОТОВИЙ', false);
      message('Не вдалося ініціалізувати Firebase. Перевір підключення SDK і конфігурацію.', true);
    } else if (auth.currentUser) {
      status('FIREBASE: ВХІД ВИКОНАНО', true);
      message('Firebase-акаунт активний. Синхронізація ігрового прогресу ще не під’єднана.');
    } else {
      status('FIREBASE ГОТОВИЙ', false);
      message('Реєстрація та вхід працюють через Firebase. Ігровий прогрес буде підключено окремим етапом.');
    }
  });
})();
