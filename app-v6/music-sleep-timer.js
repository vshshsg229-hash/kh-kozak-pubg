/* KH么Kozak Battle Hub — music sleep timer.
   Pauses supported embedded players after the selected interval while the page remains active.
   Browsers may suspend timers in the background; this cannot keep running after the app is force-closed. */
(() => {
  'use strict';
  const boot = () => {
    const musicTab = document.querySelector('#tab-music');
    if (!musicTab || document.querySelector('#khSleepTimer')) return;
    const panel = document.createElement('section');
    panel.id = 'khSleepTimer';
    panel.setAttribute('aria-labelledby', 'khSleepTimerTitle');
    panel.style.cssText = 'margin:0 0 18px;padding:16px;border:1px solid rgba(255,210,55,.28);border-radius:14px;background:linear-gradient(135deg,rgba(255,210,55,.09),rgba(10,17,28,.92));color:inherit;';
    panel.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between">
        <div style="min-width:180px;flex:1">
          <div style="font-size:11px;letter-spacing:.14em;color:#f5ce38;font-weight:800">KH MUSIC TOOLS</div>
          <h3 id="khSleepTimerTitle" style="margin:5px 0;font-size:18px">Таймер сну</h3>
          <p style="margin:0;opacity:.78;font-size:13px">Автоматично призупиняє підтримуваний плеєр через обраний час.</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <label for="khSleepDuration" style="font-size:13px">Час</label>
          <select id="khSleepDuration" style="min-height:40px;padding:8px;border-radius:8px;background:#101925;color:inherit;border:1px solid #46505d">
            <option value="15">15 хв</option><option value="30" selected>30 хв</option><option value="45">45 хв</option><option value="60">60 хв</option><option value="90">90 хв</option>
          </select>
          <button id="khSleepStart" type="button" style="min-height:40px;padding:9px 14px;border:0;border-radius:8px;background:#f5ce38;color:#111;font-weight:800">▶ Запустити</button>
          <button id="khSleepCancel" type="button" style="min-height:40px;padding:9px 12px;border:1px solid #657080;border-radius:8px;background:transparent;color:inherit">Скасувати</button>
        </div>
      </div>
      <p id="khSleepStatus" role="status" aria-live="polite" style="margin:12px 0 0;font-size:13px;opacity:.85">Таймер вимкнено.</p>`;
    musicTab.prepend(panel);
    const duration = panel.querySelector('#khSleepDuration');
    const start = panel.querySelector('#khSleepStart');
    const cancel = panel.querySelector('#khSleepCancel');
    const status = panel.querySelector('#khSleepStatus');
    let deadline = 0;
    let ticker = 0;
    const pausePlayers = () => {
      const frames = [...musicTab.querySelectorAll('iframe')].filter(frame => /youtube(?:-nocookie)?\.com/i.test(frame.src));
      frames.forEach(frame => {
        try {
          frame.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), 'https://www.youtube.com');
          frame.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), 'https://www.youtube-nocookie.com');
        } catch (_) {}
      });
      const audio = [...musicTab.querySelectorAll('audio, video')];
      audio.forEach(player => { try { player.pause(); } catch (_) {} });
      if (!frames.length && !audio.length) {
        status.textContent = 'Час минув. Відкритого підтримуваного плеєра не знайдено — зупини музику вручну.';
      } else {
        status.textContent = 'Таймер завершено — надіслано команду паузи плеєру.';
      }
      clearInterval(ticker);
      ticker = 0;
      deadline = 0;
    };
    const update = () => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (!seconds) return pausePlayers();
      const mins = Math.floor(seconds / 60);
      const secs = String(seconds % 60).padStart(2, '0');
      status.textContent = 'Музика зупиниться приблизно через ' + mins + ':' + secs + '. Не закривай сторінку примусово: браузер може призупиняти таймери у фоні.';
    };
    start.addEventListener('click', () => {
      clearInterval(ticker);
      deadline = Date.now() + Number(duration.value) * 60 * 1000;
      update();
      ticker = setInterval(update, 1000);
    });
    cancel.addEventListener('click', () => {
      clearInterval(ticker);
      ticker = 0;
      deadline = 0;
      status.textContent = 'Таймер скасовано.';
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && deadline) update();
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
