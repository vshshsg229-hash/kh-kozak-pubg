(() => {
  'use strict';
  const WEB_VERSION = '15.0.0';
  const VERSION_URL = 'https://vshshsg229-hash.github.io/kh-kozak-pubg/app-v6/version.json';
  const APP_URL = 'https://vshshsg229-hash.github.io/kh-kozak-pubg/app-v6/';
  const RELEASE_URL = version => 'https://github.com/vshshsg229-hash/kh-kozak-pubg/releases/download/pc-v' + encodeURIComponent(version) + '/KH.Kozak.Battle.Hub.Setup.' + encodeURIComponent(version) + '.exe';
  const isElectron = /Electron/i.test(navigator.userAgent);
  const params = new URLSearchParams(window.location.search);
  const DESKTOP_VERSION = params.get('desktopVersion') || '0.0.0';
  const CURRENT_VERSION = isElectron ? DESKTOP_VERSION : WEB_VERSION;
  let banner, message, action, closeButton, latestVersion = '';
  const compare = (a, b) => {
    const aa = String(a).split('.').map(n => Number(n) || 0);
    const bb = String(b).split('.').map(n => Number(n) || 0);
    for (let i = 0; i < Math.max(aa.length, bb.length); i++) {
      const delta = (aa[i] || 0) - (bb[i] || 0);
      if (delta) return delta > 0 ? 1 : -1;
    }
    return 0;
  };
  function buildBanner() {
    if (banner) return;
    banner = document.createElement('aside');
    banner.className = 'kh-update-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = '<span class="kh-update-icon" aria-hidden="true">↻</span><span class="kh-update-copy"><strong>Доступне оновлення KH么Kozak</strong><small data-update-message>Перевіряємо нову версію…</small></span><a class="kh-update-action" data-update-action href="#" rel="noopener noreferrer">ОНОВИТИ ДОДАТОК</a><button class="kh-update-close" type="button" aria-label="Закрити сповіщення">×</button>';
    document.body.appendChild(banner);
    message = banner.querySelector('[data-update-message]');
    action = banner.querySelector('[data-update-action]');
    closeButton = banner.querySelector('.kh-update-close');
    closeButton.addEventListener('click', () => banner.classList.add('is-dismissed'));
    action.addEventListener('click', async event => {
      if (isElectron) {
        event.preventDefault();
        action.textContent = 'ВІДКРИВАЄМО ЗАВАНТАЖЕННЯ…';
        window.open(RELEASE_URL(latestVersion), '_blank', 'noopener,noreferrer');
        return;
      }
      event.preventDefault();
      action.textContent = 'ОНОВЛЮЄМО…';
      action.setAttribute('aria-busy', 'true');
      action.style.pointerEvents = 'none';
      const finish = version => window.location.replace(APP_URL + '?v=' + encodeURIComponent(version || latestVersion || WEB_VERSION) + '&updated=' + Date.now());
      try {
        let versionToLoad = latestVersion || WEB_VERSION;
        try {
          const fresh = await fetch(VERSION_URL + '?refresh=' + Date.now(), { cache: 'no-store' });
          if (fresh.ok) {
            const data = await fresh.json();
            if (typeof data?.version === 'string') versionToLoad = data.version;
          }
        } catch (_) {}
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration('./');
          if (reg) {
            const controllerChanged = new Promise(resolve => {
              const done = () => resolve();
              navigator.serviceWorker.addEventListener('controllerchange', done, { once: true });
              window.setTimeout(done, 5000);
            });
            await reg.update();
            if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            await controllerChanged;
          }
        }
        finish(versionToLoad);
      } catch (_) {
        finish(latestVersion || WEB_VERSION);
      }
    });
  }
  function showUpdate(version) {
    latestVersion = version;
    buildBanner();
    message.textContent = isElectron
      ? 'Windows: версія ' + version + ' готова. Завантаж новий інсталятор і встанови поверх старої програми.'
      : 'Версія ' + version + ' готова. Натисни, щоб перезавантажити застосунок без старого кешу.';
    action.href = isElectron ? RELEASE_URL(version) : APP_URL + '?v=' + encodeURIComponent(version);
    action.target = isElectron ? '_blank' : '_self';
    banner.classList.remove('is-dismissed');
    banner.classList.add('is-visible');
  }
  async function checkVersion() {
    try {
      const response = await fetch(VERSION_URL + '?check=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('Version endpoint returned ' + response.status);
      const data = await response.json();
      const targetVersion = isElectron ? data?.windowsVersion : data?.version;
      if (typeof targetVersion === 'string' && compare(targetVersion, CURRENT_VERSION) > 0) {
        showUpdate(targetVersion);
      } else if (banner) {
        banner.classList.remove('is-visible');
      }
    } catch (_) {
      if (banner) {
        message.textContent = 'Не вдалося перевірити версію. Перевір інтернет і натисни перезавантажити сторінку.';
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', checkVersion, { once: true });
  else checkVersion();
  window.setInterval(checkVersion, 2 * 60 * 1000);
})();