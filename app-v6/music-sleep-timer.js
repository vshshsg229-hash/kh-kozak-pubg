/* KH么Kozak Battle Hub — music sleep timer.
   Pauses supported embedded YouTube players and HTML media after a chosen interval.
   Browser background throttling and force-closing can prevent a timer from firing. */
(() => {
  'use strict';

  function installSleepTimer() {
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
          <p style="margin:0;opacity:.78;font-size:13px">Призупиняє підтримуваний плеєр через обраний час.</p>
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
    let ticker = null;

    function pauseSupportedPlayers() {
      const frames = [...musicTab.querySelectorAll('iframe')].filter(frame => {
        try { return /youtube(?:-nocookie)?\.com$/i.test(new URL(frame.src).hostname); }
        catch (_) { return false; }
      });
      frames.forEach(frame => {
        try {
          const targetOrigin = new URL(frame.src).origin;
          frame.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), targetOrigin);
        } catch (_) {}
      });

      const media = [...musicTab.querySelectorAll('audio, video')];
      media.forEach(player => { try { player.pause(); } catch (_) {} });

      if (!frames.length && !media.length) {
        status.textContent = 'Час минув, але підтримуваний плеєр не знайдено. Зупини відтворення вручну.';
      } else {
        status.textContent = 'Таймер завершено — надіслано команду паузи плеєру.';
      }
      clearInterval(ticker);
      ticker = null;
      deadline = 0;
    }

    function tick() {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (seconds === 0) {
        pauseSupportedPlayers();
        return;
      }
      status.textContent = 'Музика зупиниться приблизно через ' +
        Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0') +
        '. Браузер може призупиняти таймери у фоні.';
    }

    start.addEventListener('click', () => {
      clearInterval(ticker);
      deadline = Date.now() + Number(duration.value) * 60 * 1000;
      tick();
      ticker = setInterval(tick, 1000);
    });

    cancel.addEventListener('click', () => {
      clearInterval(ticker);
      ticker = null;
      deadline = 0;
      status.textContent = 'Таймер скасовано.';
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && deadline) tick();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installSleepTimer, { once: true });
  } else {
    installSleepTimer();
  }
})();
