/* KOZAK NEXUS — persistent music controls and Android Media Session support.
   Background playback depends on the browser/Android WebView and the music provider's rules. */
(() => {
  'use strict';
  if (window.__kozakMusicSessionV2) return;
  window.__kozakMusicSessionV2 = true;

  const $ = (s, root = document) => root.querySelector(s);
  const mediaSession = navigator.mediaSession;
  const uaEmbed = $('#uaMusicEmbed');
  const ytWrap = $('#youtubeFrameWrap');
  const ytInput = $('#youtubeUrl');
  const fallbackArtwork = [{ src: './icon.svg', sizes: 'any', type: 'image/svg+xml' }];
  let current = { title: 'KOZAK NEXUS MUSIC', artist: 'KOZAK NEXUS', album: 'Music player' };
  let lastProvider = 'youtube';
  let playbackRequested = false;
  let activeFrame = null;
  let activeContainer = null;
  let activeContainerOrigin = null;

  function setPlaybackState(state) {
    if (!mediaSession) return;
    try { mediaSession.playbackState = state; } catch (_) {}
  }

  function setMetadata(title, artist, album = 'KOZAK NEXUS') {
    current = { title: title || 'KOZAK NEXUS MUSIC', artist: artist || 'KOZAK NEXUS', album };
    if (!mediaSession || typeof MediaMetadata === 'undefined') return;
    try {
      mediaSession.metadata = new MediaMetadata({
        title: current.title, artist: current.artist, album: current.album,
        artwork: fallbackArtwork
      });
    } catch (_) {}
  }

  function getYouTubeFrames() {
    const frames = [];
    if (uaEmbed && /youtube(?:-nocookie)?\.com/i.test(uaEmbed.src)) frames.push(uaEmbed);
    if (ytWrap) frames.push(...ytWrap.querySelectorAll('iframe'));
    return [...new Set(frames)];
  }

  function sendYouTubeCommand(func) {
    getYouTubeFrames().forEach(frame => {
      try {
        const target = new URL(frame.src).origin;
        if (!/youtube(?:-nocookie)?\.com$/i.test(new URL(frame.src).hostname)) return;
        frame.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), target);
      } catch (_) {}
    });
  }

  function play() {
    playbackRequested = true;
    sendYouTubeCommand('playVideo');
    if (dockStatus) dockStatus.textContent = 'НАДІСЛАНО КОМАНДУ ВІДТВОРЕННЯ';
  }

  function pause() {
    sendYouTubeCommand('pauseVideo');
    setPlaybackState('paused');
    if (dockButton) dockButton.textContent = '▶';
    if (dockStatus) dockStatus.textContent = 'ПАУЗА';
  }

  let dock, dockButton, dockStatus;
  function createDock() {
    if ($('#kozakMusicDock')) return;
    dock = document.createElement('aside');
    dock.id = 'kozakMusicDock';
    dock.setAttribute('aria-label', 'Мініплеєр KOZAK NEXUS');
    dock.innerHTML = `
      <style>
        #kozakMusicDock{position:fixed;z-index:9998;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));display:none;align-items:center;gap:11px;padding:10px 12px;border:1px solid rgba(245,206,56,.45);border-radius:16px;background:rgba(7,11,18,.96);color:#f5f7fb;box-shadow:0 8px 30px rgba(0,0,0,.42);backdrop-filter:blur(14px);font:inherit}
        #kozakMusicDock .kmd-note{width:38px;height:38px;flex:0 0 38px;display:grid;place-items:center;border-radius:11px;background:linear-gradient(135deg,#f5ce38,#8e6a08);color:#080b10;font-size:21px}
        #kozakMusicDock .kmd-info{min-width:0;flex:1}
        #kozakMusicDock .kmd-player{display:none;flex:1 1 100%;width:100%;min-width:0;overflow:hidden;border-radius:10px;background:#000}
        #kozakMusicDock .kmd-player iframe{display:block;width:100%;height:100%;min-height:0;border:0}
        #kozakMusicDock .kmd-player .media-frame-wrap,#kozakMusicDock .kmd-player .ua-music-embed-wrap{display:block!important;width:100%!important;height:110px!important;min-height:110px!important;margin:0!important;padding:0!important;border:0!important;border-radius:10px!important;overflow:hidden!important}
        #kozakMusicDock .kmd-player .media-frame-wrap iframe,#kozakMusicDock .kmd-player .ua-music-embed-wrap iframe{width:100%!important;height:110px!important;min-height:110px!important}
        #kozakMusicDock .kmd-controls{display:flex;gap:5px;align-items:center}
        #kozakMusicDock .kmd-controls button{min-width:38px;padding:0 8px}
        @media(max-width:430px){#kozakMusicDock{left:7px;right:7px;gap:6px;padding:8px}#kozakMusicDock .kmd-note{display:none}#kozakMusicDock .kmd-open{min-width:52px;font-size:9px}#kozakMusicDock .kmd-title{max-width:110px}}
        #kozakMusicDock.has-player{flex-wrap:wrap}
        #kozakMusicDock.has-player .kmd-player{display:block}
        #kozakMusicDock.has-player .kmd-info{flex:1 1 100px}
        #kozakMusicDock .kmd-title{font-weight:800;font-size:12px;letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        #kozakMusicDock .kmd-status{font-size:10px;opacity:.7;margin-top:3px}
        #kozakMusicDock button{border:1px solid rgba(245,206,56,.35);border-radius:11px;background:#151b26;color:#f5ce38;min-width:40px;min-height:40px;font-size:17px;font-weight:800}
        #kozakMusicDock .kmd-open{font-size:10px;min-width:60px;padding:0 8px}
        @media(min-width:760px){#kozakMusicDock{left:auto;right:20px;bottom:20px;width:330px}}
      </style>
      <div class="kmd-note" aria-hidden="true">♫</div>
      <div class="kmd-player" id="kozakMusicDockPlayer" aria-label="Мініплеєр"></div>
      <div class="kmd-info"><div class="kmd-title">KOZAK NEXUS MUSIC</div><div class="kmd-status" id="kozakMusicDockStatus">ВІДКРИЙ МУЗИКУ, ЩОБ ПОЧАТИ</div></div>
      <div class="kmd-controls"><button id="kozakMusicDockPrev" type="button" aria-label="Попередній трек">⏮</button><button id="kozakMusicDockToggle" type="button" aria-label="Відтворити або призупинити музику">▶</button><button id="kozakMusicDockNext" type="button" aria-label="Наступний трек">⏭</button></div>
      <button class="kmd-open" id="kozakMusicDockOpen" type="button">МУЗИКА ↗</button>`;
    document.body.appendChild(dock);
    dockButton = $('#kozakMusicDockToggle', dock);
    dockStatus = $('#kozakMusicDockStatus', dock);
    $('#kozakMusicDockPrev', dock).addEventListener('click', previousTrack);
    $('#kozakMusicDockNext', dock).addEventListener('click', nextTrack);
    dockButton.addEventListener('click', () => {
      if (mediaSession?.playbackState === 'playing') pause();
      else play();
    });
    $('#kozakMusicDockOpen', dock).addEventListener('click', () => {
      const nav = $('[data-tab="music"]');
      if (nav) nav.click();
      else $('#tab-music')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function activeTabIsMusic() {
    const tab = $('#tab-music');
    return !!tab && (tab.classList.contains('active') || tab.classList.contains('is-active') ||
      getComputedStyle(tab).display !== 'none');
  }

  function resolveActiveContainer() {
    if (activeFrame === uaEmbed) return uaEmbed?.closest('.ua-music-embed-wrap') || uaEmbed;
    if (activeFrame) return activeFrame.closest('.media-frame-wrap') || activeFrame;
    return null;
  }

  // Keep the provider iframe in its original music tab. Moving live
  // YouTube/Spotify iframes between DOM trees can break app navigation and games.
  function movePlayerForTab() {
    if (dock) dock.classList.remove('has-player');
  }

  function previousTrack() {
    if (typeof window.khMusicPreviousTrack === 'function') window.khMusicPreviousTrack();
    else sendYouTubeCommand('previousVideo');
    if (dockStatus) dockStatus.textContent = 'ПОПЕРЕДНІЙ ТРЕК';
  }

  function nextTrack() {
    if (typeof window.khMusicNextTrack === 'function') window.khMusicNextTrack();
    else sendYouTubeCommand('nextVideo');
    if (dockStatus) dockStatus.textContent = 'НАСТУПНИЙ ТРЕК';
  }

  function openPersistentModule(url, title) {
    let shell = $('#kozakPersistentModuleShell');
    if (!shell) {
      shell = document.createElement('section');
      shell.id = 'kozakPersistentModuleShell';
      shell.innerHTML = `
        <style>
          #kozakPersistentModuleShell{position:fixed;inset:0;z-index:9997;display:none;background:#070b12;color:#f5f7fb}
          #kozakPersistentModuleShell.is-open{display:flex;flex-direction:column}
          #kozakPersistentModuleShell .kpm-head{display:flex;align-items:center;gap:12px;min-height:54px;padding:8px 12px;background:#0c1420;border-bottom:1px solid rgba(245,206,56,.35)}
          #kozakPersistentModuleShell .kpm-title{flex:1;min-width:0;font-weight:900;font-size:13px;letter-spacing:.06em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          #kozakPersistentModuleShell button{min-width:44px;min-height:40px;border:1px solid #8b7024;border-radius:10px;background:#171d28;color:#f5ce38;font-weight:900}
          #kozakPersistentModuleShell iframe{display:block;flex:1;width:100%;height:100%;border:0;background:#070b12}
        </style>
        <header class="kpm-head"><strong class="kpm-title">KOZAK NEXUS MODULE</strong><button type="button" aria-label="Повернутися до KOZAK NEXUS">← НАЗАД</button></header>
        <iframe title="Модуль KOZAK NEXUS" allow="autoplay; fullscreen; picture-in-picture"></iframe>`;
      document.body.appendChild(shell);
      shell.querySelector('button').addEventListener('click', () => {
        const frame = shell.querySelector('iframe');
        frame.src = 'about:blank';
        shell.classList.remove('is-open');
        updateDock();
      });
    }
    const frame = shell.querySelector('iframe');
    const safeUrl = new URL(url, location.href);
    if (safeUrl.origin !== location.origin) return;
    shell.querySelector('.kpm-title').textContent = title || 'KOZAK NEXUS MODULE';
    shell.classList.add('is-open');
    frame.src = safeUrl.href;
    updateDock();
  }

  // These modules used to navigate the top-level page, which destroys its
  // music iframe. Keep them inside an app-owned frame so the parent player
  // remains alive while the user explores the standalone module.
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const link = target.closest('a[href]');
    const atlasButton = target.closest('.atlas-zero-nav');
    let url = '';
    let title = '';
    if (link && /(?:^|\\/)casefile\\.html(?:[?#]|$)/i.test(link.getAttribute('href') || '')) {
      url = link.href; title = 'CASEFILE · АРХІВ СПРАВ';
    } else if (link && /(?:^|\\/)kozak-life\\.html(?:[?#]|$)/i.test(link.getAttribute('href') || '')) {
      url = link.href; title = 'KOZAK LIFE';
    } else if (atlasButton) {
      url = new URL('atlas-zero.html?v=1.2.2', location.href).href; title = 'ATLAS ZERO';
    }
    if (!url) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openPersistentModule(url, title);
  }, true);

  function updateDock() {
    if (!dock) return;
    const nextDisplay = playbackRequested && !activeTabIsMusic() ? 'flex' : 'none';
    if (dock.style.display !== nextDisplay) dock.style.display = nextDisplay;
  }

  createDock();
  activeFrame = uaEmbed;
  // React only to navigation clicks instead of observing every style/class
  // mutation across the entire app (which caused excessive work in WebViews).
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('[data-tab], [data-tab-link], [data-go]')) queueMicrotask(updateDock);
  });
  window.addEventListener('popstate', updateDock);
  window.addEventListener('hashchange', updateDock);
  document.addEventListener('click', event => {
    const button = event.target.closest('#khUkrainianTracks .music-play-btn, #khPlaylistTracks .music-play-btn');
    if (button) {
      const row = button.closest('.kh-playlist-track');
      const title = row?.querySelector('.music-track-info b')?.textContent?.trim();
      const artist = row?.querySelector('.music-track-info small')?.textContent?.trim();
      setMetadata(title || 'Українська музика', artist || 'YouTube', 'KOZAK NEXUS MUSIC');
      lastProvider = 'youtube';
      activeFrame = $('#khYouTubeMusicFrame') || uaEmbed;
      playbackRequested = true;
      if (dockStatus) dockStatus.textContent = 'ТРЕК ОБРАНО';
      updateDock();
    }
    if (event.target.closest('#shuffleKhPlaylist')) {
      setMetadata('Випадковий трек', 'KOZAK NEXUS MIX', 'KOZAK NEXUS MUSIC');
      lastProvider = 'youtube';
      activeFrame = $('#khYouTubeMusicFrame') || uaEmbed;
      playbackRequested = true;
      updateDock();
    }
  });

  $('#youtubeForm')?.addEventListener('submit', () => {
    if (!ytInput?.value?.trim()) return;
    setMetadata('YouTube music', 'KOZAK NEXUS', 'YouTube player');
    lastProvider = 'youtube';
    playbackRequested = true;
    setTimeout(() => { activeFrame = $('#khYouTubeMusicFrame') || (ytWrap && ytWrap.querySelector('iframe')); updateDock(); }, 250);
    updateDock();
  });

  $('#uaMusicPlaylistSelect')?.addEventListener('change', event => {
    const select = event.target;
    const option = select?.selectedOptions?.[0];
    lastProvider = select?.value === 'youtube' ? 'youtube' : 'spotify';
    activeFrame = uaEmbed;
    setMetadata(option?.textContent?.trim() || 'Українська музика',
      lastProvider === 'youtube' ? 'YouTube' : 'Spotify', 'Український музичний архів');
    playbackRequested = true;
    if (dockStatus) dockStatus.textContent = 'ДОБІРКУ ОБРАНО';
    updateDock();
  });

  if (mediaSession) {
    try {
      mediaSession.setActionHandler('play', play);
      mediaSession.setActionHandler('pause', pause);
      mediaSession.setActionHandler('stop', pause);
      mediaSession.setActionHandler('previoustrack', () => sendYouTubeCommand('previousVideo'));
      mediaSession.setActionHandler('nexttrack', () => sendYouTubeCommand('nextVideo'));
    } catch (_) {}
  }

  // Preserve the iframe when navigating the app's single-page tabs; don't claim playback is guaranteed after force-close.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && mediaSession && typeof MediaMetadata !== 'undefined') {
      try { mediaSession.metadata = new MediaMetadata({ ...current, artwork: fallbackArtwork }); } catch (_) {}
    }
  });
  document.addEventListener('khkozak-music-playing', () => { activeFrame = $('#khYouTubeMusicFrame') || uaEmbed; playbackRequested = true; setPlaybackState('playing'); if (dockButton) dockButton.textContent = 'Ⅱ'; if (dockStatus) dockStatus.textContent = 'МУЗИКА ГРАЄ · ПЕРЕХОДЬ МІЖ РЕЖИМАМИ'; updateDock(); });
  document.addEventListener('khkozak-music-paused', () => { setPlaybackState('paused'); if (dockButton) dockButton.textContent = '▶'; if (dockStatus) dockStatus.textContent = 'ПАУЗА'; });
  window.addEventListener('pageshow', updateDock);
  window.khMusicMediaSession = {
    setMetadata,
    play,
    pause,
    getCurrent: () => ({ ...current }),
    getPlaybackRequested: () => playbackRequested
  };
  updateDock();
})();
