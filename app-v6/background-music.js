/* KH么Kozak Battle Hub 16.52.0 — media-session support for background playback where the browser permits it.
   Note: a hosted PWA cannot keep audio alive after the browser/app process is fully terminated. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const mediaSession = navigator.mediaSession;
  const uaEmbed = $('#uaMusicEmbed');
  const ytWrap = $('#youtubeFrameWrap');
  const message = $('#youtubeMessage');
  const ytInput = $('#youtubeUrl');
  const fallbackArtwork = [
    { src: './icon.svg', sizes: 'any', type: 'image/svg+xml' }
  ];
  let current = { title: 'KH么Kozak Music', artist: 'Battle Hub', album: 'Music player' };
  let lastProvider = 'youtube';

  function setMetadata(title, artist, album = 'KH么Kozak Battle Hub') {
    current = { title: title || 'KH么Kozak Music', artist: artist || 'KH么Kozak', album };
    if (!mediaSession || typeof MediaMetadata === 'undefined') return;
    try {
      mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: current.album,
        artwork: fallbackArtwork
      });
      mediaSession.playbackState = 'playing';
    } catch (_) {}
  }

  function sendYouTubeCommand(func) {
    const frames = [];
    if (ytWrap) frames.push(...ytWrap.querySelectorAll('iframe'));
    if (uaEmbed && uaEmbed.dataset.provider === 'youtube') frames.push(uaEmbed);
    frames.forEach(frame => {
      try {
        frame.contentWindow?.postMessage(JSON.stringify({
          event: 'command',
          func,
          args: []
        }), 'https://www.youtube-nocookie.com');
        frame.contentWindow?.postMessage(JSON.stringify({
          event: 'command',
          func,
          args: []
        }), 'https://www.youtube.com');
      } catch (_) {}
    });
  }

  if (mediaSession) {
    try {
      mediaSession.setActionHandler('play', () => {
        if (lastProvider === 'youtube') sendYouTubeCommand('playVideo');
      });
      mediaSession.setActionHandler('pause', () => {
        if (lastProvider === 'youtube') sendYouTubeCommand('pauseVideo');
      });
      mediaSession.setActionHandler('stop', () => {
        if (lastProvider === 'youtube') sendYouTubeCommand('pauseVideo');
        try { mediaSession.playbackState = 'paused'; } catch (_) {}
      });
    } catch (_) {}
  }

  // The app is a single-page interface: changing tabs should never rebuild or remove the music iframe.
  document.addEventListener('visibilitychange', () => {
    // Keep the current media metadata available to Android/desktop media controls.
    if (document.hidden && mediaSession && current) {
      try { mediaSession.metadata = new MediaMetadata({ ...current, artwork: fallbackArtwork }); } catch (_) {}
    }
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('#khUkrainianTracks .music-play-btn, #khPlaylistTracks .music-play-btn');
    if (button) {
      const row = button.closest('.kh-playlist-track');
      const title = row?.querySelector('.music-track-info b')?.textContent?.trim();
      const artist = row?.querySelector('.music-track-info small')?.textContent?.trim();
      if (title) setMetadata(title, artist || 'YouTube', 'KH Music');
      lastProvider = 'youtube';
      return;
    }
    if (event.target.closest('#shuffleKhPlaylist')) {
      setMetadata('Випадковий трек', 'KH Gaming Mix', 'KH Music');
      lastProvider = 'youtube';
    }
  });

  $('#youtubeForm')?.addEventListener('submit', () => {
    const raw = ytInput?.value?.trim() || '';
    if (!raw) return;
    setMetadata('YouTube music', 'KH么Kozak Music', 'YouTube player');
    lastProvider = 'youtube';
  });

  $('#uaMusicPlaylistSelect')?.addEventListener('change', event => {
    const select = event.target;
    const option = select?.selectedOptions?.[0];
    const provider = select?.value === 'youtube' ? 'youtube' : 'spotify';
    lastProvider = provider;
    setMetadata(option?.textContent?.trim() || 'Українська музика', provider === 'youtube' ? 'YouTube' : 'Spotify', 'Український музичний архів');
  });

  // Add the JS API parameters to supported YouTube embeds without recreating the playing iframe.
  function enableYouTubeApi(frame) {
    if (!frame || !/youtube(?:-nocookie)?\.com/.test(frame.src)) return;
    try {
      const url = new URL(frame.src);
      if (!url.searchParams.has('enablejsapi')) url.searchParams.set('enablejsapi', '1');
      if (!url.searchParams.has('origin')) url.searchParams.set('origin', location.origin);
      if (url.toString() !== frame.src) frame.src = url.toString();
    } catch (_) {}
  }
  if (uaEmbed) enableYouTubeApi(uaEmbed);
  if (ytWrap) {
    const observer = new MutationObserver(() => ytWrap.querySelectorAll('iframe').forEach(enableYouTubeApi));
    observer.observe(ytWrap, { childList: true, subtree: true });
  }

  // Expose a small, app-scoped hook for existing player controls; no global playback service is claimed.
  window.khMusicMediaSession = {
    setMetadata,
    getCurrent: () => ({ ...current })
  };
})();
