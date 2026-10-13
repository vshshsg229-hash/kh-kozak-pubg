/* KH么Kozak Gaming Hub — shared leaderboard */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const status = (id, message, state='') => {
    const el = $(id);
    if (el) { el.textContent = message; el.dataset.state = state; }
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const config = window.KOZAK_SUPABASE_CONFIG || {};
  let client = null, user = null, busy = false;

  function localScore() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem('khkozak:rewards-v1') || '{}') || {}; } catch (_) {}
    const xp = Math.max(0, Number(s.xp) || 0);
    const games = Math.max(0, Number(s.games) || 0);
    const achievements = Array.isArray(s.claimed) ? s.claimed.length : 0;
    const points = xp + games * 5 + achievements * 15;
    const rank = points >= 2000 ? '🔥 Легенда KH' : points >= 1000 ? '💎 Ветеран' : points >= 500 ? '⚡ Еліта' : points >= 250 ? '🛡 Боєць' : points >= 100 ? '🎯 Розвідник' : '🌱 Рекрут';
    return {points, xp, games, level: Math.floor(xp / 100) + 1, rank};
  }

  async function refresh() {
    if (!client) return;
    const tbody = $('lb-rows');
    if (!tbody) return;
    status('lb-status', 'Завантажуємо спільний рейтинг…');
    try {
      const {data, error} = await client.from('kozak_player_leaderboard')
        .select('user_id,nickname,points,xp,games,level,rank,updated_at')
        .order('points', {ascending:false}).order('updated_at', {ascending:true}).limit(100);
      if (error) throw error;
      const rows = data || [];
      $('lb-player-count').textContent = rows.length.toLocaleString('uk-UA');
      $('lb-total-points').textContent = rows.reduce((sum, row) => sum + (Number(row.points) || 0), 0).toLocaleString('uk-UA');
      tbody.innerHTML = rows.length ? rows.map((row, i) => `<tr class="${row.user_id === user?.id ? 'lb-me' : ''}"><td>${i+1}</td><td><strong>${esc(row.nickname)}</strong>${row.user_id === user?.id ? '<small>Це ти</small>' : ''}</td><td>${esc(row.rank || '🌱 Рекрут')}</td><td>${Number(row.level)||1}</td><td>${Number(row.games)||0}</td><td><strong>${(Number(row.points)||0).toLocaleString('uk-UA')}</strong></td></tr>`).join('') : '<tr><td colspan="6" class="lb-empty">Поки що рейтинг порожній. Будь першим гравцем!</td></tr>';
      status('lb-status', 'Оновлено щойно · ' + rows.length + ' гравців', 'success');
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="6" class="lb-empty">Рейтинг ще не підключено.</td></tr>';
      status('lb-status', /kozak_player_leaderboard|relation .* does not exist/i.test(error.message || '') ? 'Таблицю рейтингу ще не створено. Відкрий налаштування акаунта й виконай setup-all-supabase.sql у Supabase.' : (error.message || 'Не вдалося завантажити рейтинг.'), 'error');
    }
  }

  async function publish() {
    if (busy) return;
    if (!client || !user) {
      status('lb-publish-status', 'Підключаємо профіль гравця…', 'warning');
      return;
    }
    busy = true;
    const button = $('lb-publish');
    if (button) button.disabled = true;
    status('lb-publish-status', 'Публікуємо результат…');
    try {
      const nickname = String($('lb-nickname')?.value || localStorage.getItem('khkozak:community-nickname') || user.user_metadata?.nickname || 'Гравець').trim().slice(0,24) || 'Гравець';
      if (nickname.length < 2) throw new Error('Нік має містити щонайменше 2 символи.');
      const score = localScore();
      const {error} = await client.from('kozak_player_leaderboard').upsert({
        user_id:user.id, nickname, points:score.points, xp:score.xp, games:score.games, level:score.level, rank:score.rank, updated_at:new Date().toISOString()
      }, {onConflict:'user_id'});
      if (error) throw error;
      localStorage.setItem('khkozak:community-nickname', nickname);
      status('lb-publish-status', 'Готово! Твій результат опубліковано ✓', 'success');
      await refresh();
    } catch (error) {
      const message = /kozak_player_leaderboard|relation .* does not exist/i.test(error.message || '') ? 'Таблицю рейтингу ще не створено. Виконай setup-all-supabase.sql у Supabase.' : (error.message || 'Не вдалося опублікувати результат.');
      status('lb-publish-status', message, 'error');
    } finally {
      busy = false;
      if (button) button.disabled = false;
    }
  }

  async function boot() {
    $('lb-refresh')?.addEventListener('click', refresh);
    $('lb-publish')?.addEventListener('click', publish);
    if (!config.url || !config.anonKey || !window.supabase?.createClient) {
      status('lb-status', 'Хмару не підключено. Перевір supabase-config.js та завантаження Supabase SDK.', 'warning');
      status('lb-publish-status', 'Спершу підключи Supabase та увійди в акаунт.', 'warning');
      return;
    }
    client = window.KozakCloudSync?.client || window.supabase.createClient(config.url, config.anonKey, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    try {
      const session = await client.auth.getSession();
      if (session.error) throw session.error;
      user = session.data?.session?.user || null;
      if (!user) {
        const guest = await client.auth.signInAnonymously();
        if (!guest.error) user = guest.data?.user || null;
      }
      if (user) {
        $('lb-nickname').value = localStorage.getItem('khkozak:community-nickname') || user.user_metadata?.nickname || 'Гравець';
        status('lb-publish-status', 'Профіль готовий. Опублікуй свій локальний прогрес.', 'success');
      } else {
        status('lb-publish-status', 'Для публікації увійди в акаунт на сторінці «Мій акаунт».', 'warning');
      }
      await refresh();
      setInterval(refresh, 30000);
    } catch (error) {
      status('lb-status', error.message || 'Не вдалося підключитися до Supabase.', 'error');
      status('lb-publish-status', 'Перевір налаштування Supabase і спробуй ще раз.', 'warning');
    }
  }
  boot();
})();