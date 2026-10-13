/* KH么Kozak Gaming Hub 4.6 — shared online arcade leaderboard.
 * Game mechanics run in the browser; this file shares saved scores between players/devices.
 * Requires community.js + online-arcade-v46.sql in Supabase.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const TABLE = 'kozak_arcade_scores';
  const keys = [
    ['Kozak Run','arcade-best-run','max'],
    ['Тренування прицілу','aim-best','max'],
    ['Музичний челендж','arcade-best-music','max'],
    ['Пам’ять','memory-best','min-nonzero'],
    ['Колесо удачі','arcade-best-wheel','max'],
    ['Хрестики-нулики','arcade-xo-wins','max'],
    ['Код пам’яті','extra-code-best','max'],
    ['Влуч у ціль','extra-dodge-best','max']
  ];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function localScores() {
    const scores = {};
    let total = 0;
    for (const [, key, mode] of keys) {
      let value = 0;
      try { value = Math.max(0, Number(localStorage.getItem('khkozak:' + key)) || 0); } catch (_) {}
      scores[key] = value;
      if (mode === 'min-nonzero') { if (value > 0) total += Math.max(0, 100 - Math.min(value, 100)); }
      else total += value;
    }
    try {
      const rewards = JSON.parse(localStorage.getItem('khkozak:rewards-v1') || '{}');
      total += Math.max(0, Number(rewards.xp) || 0) + Math.max(0, Number(rewards.games) || 0) * 5;
    } catch (_) {}
    return { scores, total_points: Math.floor(total) };
  }
  function status(message, error = false) {
    const el = $('arcade-global-status');
    if (!el) return;
    el.textContent = message;
    el.dataset.state = error ? 'error' : 'success';
  }
  function renderRows(rows) {
    const root = $('arcade-global-scores');
    if (!root) return;
    if (!rows.length) {
      root.innerHTML = '<p class="ap-note">Ще немає опублікованих результатів. Зіграй і натисни «Опублікувати рекорди».</p>';
      return;
    }
    root.innerHTML = '<div class="ap-online-board"><div class="ap-online-board-head"><strong>Місце</strong><strong>Гравець</strong><strong>Очки</strong></div>' +
      rows.map((r, i) => '<div class="ap-online-board-row"><span>#' + (i + 1) + '</span><span><b>' + escape(r.nickname || 'Гравець') + '</b><small>' + escape(new Date(r.updated_at || Date.now()).toLocaleDateString('uk-UA')) + '</small></span><strong>' + Math.max(0, Number(r.total_points) || 0).toLocaleString('uk-UA') + '</strong></div>').join('') + '</div>';
  }
  async function clientReady() {
    for (let i = 0; i < 60; i++) {
      if (window.KozakCommunity?.client && window.KozakCommunity?.user) return window.KozakCommunity;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error('Онлайн-підключення ще не готове. Онови сторінку або перевір налаштування Supabase.');
  }
  async function loadBoard() {
    const { client } = await clientReady();
    const { data, error } = await client.from(TABLE).select('user_id,nickname,scores,total_points,updated_at').order('total_points', { ascending: false }).order('updated_at', { ascending: false }).limit(50);
    if (error) throw error;
    renderRows(data || []);
    status('🌐 Онлайн-таблиця оновлена · ' + (data || []).length + ' гравців');
  }
  async function publish() {
    const button = $('arcade-submit-score');
    if (button) button.disabled = true;
    try {
      const { client, user } = await clientReady();
      const input = $('arcade-nickname');
      let nickname = String(input?.value || '').trim();
      if (nickname.length < 2) nickname = String(user.user_metadata?.nickname || ('Kozak-' + user.id.slice(0, 5)));
      nickname = nickname.slice(0, 24);
      if (input) input.value = nickname;
      const local = localScores();
      const { error } = await client.from(TABLE).upsert({
        user_id: user.id,
        nickname,
        scores: local.scores,
        total_points: local.total_points,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (error) throw error;
      await loadBoard();
      status('Опубліковано в глобальній таблиці! Твої рекорди тепер видно іншим гравцям.');
    } catch (e) {
      const message = /kozak_arcade_scores|schema cache|relation/i.test(e.message || '')
        ? 'Треба один раз виконати online-arcade-v46.sql у Supabase SQL Editor.'
        : (e.message || 'Не вдалося опублікувати результат.');
      status(message, true);
    } finally { if (button) button.disabled = false; }
  }
  $('arcade-submit-score')?.addEventListener('click', publish);
  window.addEventListener('khkozak:rewards-updated', () => {
    clearTimeout(window.__kozakArcadePublishTimer);
    window.__kozakArcadePublishTimer = setTimeout(() => publish().catch(() => {}), 2500);
  });
  window.addEventListener('storage', event => {
    if (event.key && /arcade-best|aim-best|memory-best|extra-|rewards-v1/.test(event.key)) {
      clearTimeout(window.__kozakArcadePublishTimer);
      window.__kozakArcadePublishTimer = setTimeout(() => publish().catch(() => {}), 2500);
    }
  });
  clientReady().then(loadBoard).catch(e => status(e.message, true));
  setInterval(() => loadBoard().catch(() => {}), 45000);
})();
