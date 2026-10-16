/* KH么Kozak Battle Hub — visible music sleep timer. */
(() => {
  'use strict';
  function installSleepTimer() {
    const musicTab = document.querySelector('#tab-music');
    const panel = document.querySelector('#khSleepTimer');
    if (!musicTab || !panel || panel.dataset.ready === '1') return;
    panel.dataset.ready = '1';
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
          const origin = new URL(frame.src).origin;
          frame.contentWindow?.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}), origin);
        } catch (_) {}
      });
      const media = [...musicTab.querySelectorAll('audio,video')];
      media.forEach(player => { try { player.pause(); } catch (_) {} });
      status.textContent = frames.length || media.length
        ? 'Таймер завершено — надіслано команду паузи плеєру.'
        : 'Час минув, але підтримуваний плеєр не знайдено. Зупини відтворення вручну.';
      clearInterval(ticker); ticker = null; deadline = 0;
    }
    function tick() {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (!seconds) { pauseSupportedPlayers(); return; }
      status.textContent = 'Музика зупиниться приблизно через ' + Math.floor(seconds/60) + ':' + String(seconds%60).padStart(2,'0') + '. Браузер може призупиняти таймери у фоні.';
    }
    start.addEventListener('click', () => {
      clearInterval(ticker);
      deadline = Date.now() + Number(duration.value) * 60000;
      tick(); ticker = setInterval(tick, 1000);
    });
    cancel.addEventListener('click', () => {
      clearInterval(ticker); ticker = null; deadline = 0;
      status.textContent = 'Таймер скасовано.';
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && deadline) tick(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installSleepTimer, {once:true});
  else installSleepTimer();
})();
