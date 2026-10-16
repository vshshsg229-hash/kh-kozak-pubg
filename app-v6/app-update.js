(() => {
  'use strict';
  const WEB_VERSION = '17.36.1';
  const VERSION_URL = new URL('./version.json', location.href).toString();
  const APP_URL = new URL('./', location.href).toString();
  const RELEASE_URL = version => 'https://github.com/vshshsg229-hash/kh-kozak-pubg/releases/download/pc-v' + encodeURIComponent(version) + '/KH.Kozak.Battle.Hub.Setup.' + encodeURIComponent(version) + '.exe';
  const isElectron = /Electron/i.test(navigator.userAgent);
  const CURRENT_VERSION = isElectron ? new URLSearchParams(location.search).get('desktopVersion') || '0.0.0' : WEB_VERSION;
  let banner, message, action, latestVersion = '';
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
    banner.querySelector('.kh-update-close').addEventListener('click', () => banner.classList.add('is-dismissed'));
    action.addEventListener('click', async event => {
      if (isElectron) {
        event.preventDefault();
        window.open(RELEASE_URL(latestVersion || '9.5.7'), '_blank', 'noopener,noreferrer');
        return;
      }
      event.preventDefault();
      const targetVersion = latestVersion || WEB_VERSION;
      const url = new URL(APP_URL);
      url.searchParams.set('v', targetVersion);
      url.searchParams.set('updated', String(Date.now()));
      url.searchParams.set('refresh', String(Date.now()));
      action.textContent = 'ВІДКРИВАЄМО ОНОВЛЕНУ ВЕРСІЮ…';
      action.setAttribute('aria-busy', 'true');
      action.style.pointerEvents = 'none';
      // Clear old app caches first, then navigate with a unique release URL.
      // Do not unregister the worker: it can race with navigation and leave a stale shell.
      try {
        if ('caches' in window) await Promise.all((await caches.keys()).filter(key => key.startsWith('kh-kozak-hub-')).map(key => caches.delete(key)));
      } catch (_) {}
      // Navigate immediately after cache cleanup; waiting for worker.update() can hang
      // on mobile/PWA shells and leave the update button permanently disabled.
      location.replace(url.toString());
    });
  }
  function showUpdate(version) {
    latestVersion = version;
    buildBanner();
    message.textContent = isElectron
      ? 'Windows: версія ' + version + ' готова. Завантаж новий інсталятор і встанови поверх старої програми.'
      : 'Версія ' + version + ' готова. Натисни, щоб очистити старий кеш і завантажити свіжу версію.';
    action.href = isElectron ? RELEASE_URL(version) : APP_URL + '?v=' + encodeURIComponent(version);
    action.target = isElectron ? '_blank' : '_self';
    banner.classList.remove('is-dismissed');
    banner.classList.add('is-visible');
  }
  async function checkVersion() {
    // Keep the update control available even when the published version matches.
    buildBanner();
    if (!latestVersion) {
      latestVersion = WEB_VERSION;
      message.textContent = 'Кнопка оновлення доступна завжди. Натисни, щоб перезавантажити свіжу версію.';
      action.href = APP_URL + '?v=' + encodeURIComponent(WEB_VERSION);
      action.target = '_self';
      banner.classList.add('is-visible');
    }
    try {
      const response = await fetch(VERSION_URL + '?check=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('Version endpoint returned ' + response.status);
      const data = await response.json();
      const targetVersion = isElectron ? data?.windowsVersion : data?.version;
      if (typeof targetVersion === 'string' && compare(targetVersion, CURRENT_VERSION) > 0) {
        showUpdate(targetVersion);
      } else {
        // Same version still gets a working refresh button instead of hiding it.
        showUpdate(WEB_VERSION);
        message.textContent = 'Версія актуальна. Натисни, щоб примусово перезавантажити додаток і очистити старий кеш.';
      }
    } catch (_) {
      if (banner && message) {
        message.textContent = 'Не вдалося перевірити сервер версій. Кнопка все одно доступна — натисни, щоб перезавантажити додаток.';
        action.href = APP_URL + '?v=' + encodeURIComponent(WEB_VERSION);
        banner.classList.add('is-visible');
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', checkVersion, { once: true });
  else checkVersion();
  window.setInterval(checkVersion, 2 * 60 * 1000);
})();