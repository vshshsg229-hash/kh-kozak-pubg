(() => {
  'use strict';
  const CURRENT_VERSION = '9.5.0';
  const VERSION_URL = 'https://vshshsg229-hash.github.io/kh-kozak-pubg/app-v6/version.json';
  const APP_URL = 'https://vshshsg229-hash.github.io/kh-kozak-pubg/app-v6/';
  const RELEASE_URL = version => 'https://github.com/vshshsg229-hash/kh-kozak-pubg/releases/tag/pc-v' + version;
  const isElectron = /Electron/i.test(navigator.userAgent);
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
    banner.innerHTML = '<span class="kh-update-icon" aria-hidden="true">↻</span><span class="kh-update-copy"><strong>Доступне оновлення KH么Kozak</strong><small data-update-message>Нова версія готова.</small></span><a class="kh-update-action" data-update-action href="#" rel="noopener noreferrer">ОНОВИТИ ДОДАТОК</a><button class="kh-update-close" type="button" aria-label="Закрити сповіщення">×</button>';
    document.body.appendChild(banner);
    message = banner.querySelector('[data-update-message]');
    action = banner.querySelector('[data-update-action]');
    closeButton = banner.querySelector('.kh-update-close');
    closeButton.addEventListener('click', () => banner.classList.add('is-dismissed'));
    action.addEventListener('click', async event => {
      if (isElectron) {
        action.href = RELEASE_URL(latestVersion);
        action.target = '_blank';
        return;
      }
      event.preventDefault();
      action.textContent = 'ОНОВЛЮЄМО…';
      action.setAttribute('aria-busy', 'true');
      try {
        const reg = await navigator.serviceWorker?.getRegistration('./');
        if (reg) {
          await reg.update().catch(() => {});
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            await new Promise(resolve => {
              const timeout = setTimeout(resolve, 3500);
              navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timeout); resolve(); }, { once: true });
            });
          }
        }
      } catch (_) {}
      window.location.replace(APP_URL + '?v=' + encodeURIComponent(latestVersion) + '&updated=1');
    });
  }
  function showUpdate(version) {
    latestVersion = version;
    buildBanner();
    message.textContent = isElectron
      ? 'Версія ' + version + ' готова для Windows. Завантаж інсталятор і запусти його.'
      : 'Версія ' + version + ' готова. Натисни, щоб завантажити та застосувати оновлення.';
    action.href = isElectron ? RELEASE_URL(version) : APP_URL + '?v=' + encodeURIComponent(version);
    action.target = isElectron ? '_blank' : '_self';
    banner.classList.remove('is-dismissed');
    banner.classList.add('is-visible');
  }
  async function checkVersion() {
    try {
      const response = await fetch(VERSION_URL + '?check=' + Date.now(), { cache: 'no-store', mode: 'cors' });
      if (!response.ok) return;
      const data = await response.json();
      if (data && typeof data.version === 'string' && compare(data.version, CURRENT_VERSION) > 0) showUpdate(data.version);
      else if (banner) banner.classList.remove('is-visible');
    } catch (_) {
      // Offline mode is supported; the updater stays hidden until the version endpoint is reachable.
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', checkVersion, { once: true });
  else checkVersion();
  window.setInterval(checkVersion, 5 * 60 * 1000);
})();
