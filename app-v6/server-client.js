(() => {
  "use strict";
  const PROJECT_URL = "https://xacqretciujzrcqjvvgz.supabase.co";
  const API_SUFFIX = "/functions/v1/hub-api";
  const KEY = "khkozak_online_session_v1";
  const $ = (id) => document.getElementById(id);
  const state = { base: PROJECT_URL + API_SUFFIX, token: "", refreshToken: "", user: null, busy: false };

  function setMessage(message, kind = "") {
    const el = $("onlineAccountMessage");
    if (el) { el.textContent = message; el.dataset.state = kind; }
  }
  function setStatus(text, good = false) {
    const el = $("onlineStatusPill");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("online-connected", good);
    el.setAttribute("aria-label", text);
  }
  function normalizeBase(value) {
    let url = String(value || "").trim().replace(/\/+$/, "");
    if (!url) url = PROJECT_URL;
    if (!/^https:\/\//i.test(url)) throw new Error("URL має починатися з https://");
    url = url.replace(/\/functions\/v1\/hub-api$/i, "").replace(/\/functions\/v1$/i, "");
    if (!/\.supabase\.co$/i.test(new URL(url).hostname)) throw new Error("Вкажи URL проєкту Supabase, а не посилання на іншу сторінку.");
    return url + API_SUFFIX;
  }
  function loadSession() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
      if (saved.base) state.base = normalizeBase(saved.base.replace(API_SUFFIX, ""));
      state.token = saved.token || "";
      state.refreshToken = saved.refreshToken || "";
      state.user = saved.user || null;
    } catch (_) {}
    const url = $("onlineApiUrl");
    if (url) url.value = state.base.replace(API_SUFFIX, "");
    const key = $("onlineSupabaseKey");
    if (key) {
      key.value = "";
      key.placeholder = "Не потрібен: авторизація йде через hub-api";
      key.disabled = true;
      key.setAttribute("aria-label", "Публічний ключ не потрібен для підключення до hub-api");
    }
  }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        base: state.base, token: state.token, refreshToken: state.refreshToken, user: state.user
      }));
    } catch (_) {}
  }
  async function request(path, options = {}, allowRefresh = true) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (state.token) headers.Authorization = "Bearer " + state.token;
    let response;
    try {
      response = await fetch(state.base + path, { ...options, headers, cache: "no-store" });
    } catch (_) {
      throw new Error("Не вдалося зв’язатися із сервером. Перевір інтернет або чи розгорнуто hub-api у Supabase.");
    }
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && allowRefresh && state.refreshToken && path !== "/api/auth/refresh") {
      const refresh = await fetch(state.base + "/api/auth/refresh", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: state.refreshToken }), cache: "no-store"
      }).then(r => r.json()).catch(() => null);
      if (refresh && refresh.token) {
        state.token = refresh.token; state.refreshToken = refresh.refreshToken || state.refreshToken; state.user = refresh.user || state.user; persist();
        return request(path, options, false);
      }
      clearSession(false);
    }
    if (!response.ok) throw new Error(data.error || ("Помилка сервера (" + response.status + ")."));
    return data;
  }
  function clearSession(show = true) {
    state.token = ""; state.refreshToken = ""; state.user = null; persist();
    const logout = $("onlineLogout"); if (logout) logout.hidden = true;
    if (show) setMessage("Вийшов з онлайн-акаунта. Локальний прогрес залишився на пристрої.");
    renderUser();
  }
  function renderUser() {
    const user = state.user;
    const logout = $("onlineLogout"); if (logout) logout.hidden = !user;
    const nickname = $("onlineNickname");
    if (user && nickname) nickname.value = user.username || "";
    if (user) {
      setStatus("ОНЛАЙН · " + (user.username || "АКАУНТ"), true);
      const name = $("profileName"); if (name) name.textContent = user.username || "Гравець";
      const profileNick = $("nickname"); if (profileNick) profileNick.value = user.username || "";
      const profileXp = $("profileXp"); if (profileXp) profileXp.textContent = (user.xp || 0) + " XP";
      const profileCoins = $("profileCoins"); if (profileCoins) profileCoins.textContent = String(user.coins || 0);
      const profilePlayed = $("profilePlayed"); if (profilePlayed) profilePlayed.textContent = String(user.played || 0);
    } else {
      setStatus("СЕРВЕР ДОСТУПНИЙ · УВІЙДИ", true);
    }
  }
  async function connect() {
    if (state.busy) return;
    state.busy = true;
    const button = $("connectOnlineApi");
    if (button) { button.disabled = true; button.textContent = "ПЕРЕВІРЯЮ СЕРВЕР…"; }
    try {
      state.base = normalizeBase($("onlineApiUrl")?.value || PROJECT_URL);
      const data = await request("/api/health", { method: "GET", headers: {} }, false);
      persist();
      setStatus("СЕРВЕР ПІДКЛЮЧЕНО", true);
      setMessage("Зв’язок із hub-api успішний. " + (data.database ? "База даних: " + data.database + "." : "Сервер відповідає.") + " Тепер можеш створити акаунт або увійти.", "success");
      await loadLeaderboard();
    } catch (error) {
      setStatus("СЕРВЕР НЕДОСТУПНИЙ", false);
      setMessage(error.message + " URL перевірки: " + state.base + "/api/health", "error");
    } finally {
      state.busy = false;
      if (button) { button.disabled = false; button.textContent = "ПЕРЕВІРИТИ / ПІДКЛЮЧИТИ СЕРВЕР"; }
    }
  }
  async function auth(mode) {
    if (state.busy) return;
    const email = $("onlineEmail")?.value.trim() || "";
    const password = $("onlinePassword")?.value || "";
    const username = $("onlineNickname")?.value.trim() || "";
    if (!email || !password) { setMessage("Введи електронну пошту та пароль.", "error"); return; }
    if (mode === "register" && username.length < 3) { setMessage("Ігровий нік має містити щонайменше 3 символи.", "error"); return; }
    state.busy = true;
    const button = $(mode === "register" ? "onlineRegister" : "onlineLogin");
    const original = button?.textContent;
    if (button) { button.disabled = true; button.textContent = mode === "register" ? "СТВОРЮЮ…" : "ВХІД…"; }
    try {
      state.base = normalizeBase($("onlineApiUrl")?.value || PROJECT_URL);
      const payload = mode === "register" ? { email, password, username } : { email, password };
      const data = await request("/api/auth/" + mode, { method: "POST", body: JSON.stringify(payload) }, false);
      if (data.confirmationRequired) {
        setMessage(data.message || "Перевір пошту, щоб підтвердити акаунт.", "success");
        return;
      }
      if (!data.token || !data.user) throw new Error("Сервер не повернув сесію. Перевір налаштування Supabase Auth.");
      state.token = data.token; state.refreshToken = data.refreshToken || ""; state.user = data.user; persist(); renderUser();
      setMessage((mode === "register" ? "Акаунт створено!" : "Успішний вхід!") + " Тепер цей профіль прив’язаний до серверного акаунта.", "success");
      await loadLeaderboard();
    } catch (error) {
      setMessage(error.message, "error");
    } finally {
      state.busy = false;
      if (button) { button.disabled = false; button.textContent = original; }
    }
  }
  async function loadLeaderboard() {
    const box = $("onlineLeaderboard");
    if (!box) return;
    box.innerHTML = '<p class="online-empty">Завантажую глобальний рейтинг…</p>';
    try {
      const data = await request("/api/leaderboard?limit=10", { method: "GET" });
      const rows = Array.isArray(data.leaderboard) ? data.leaderboard : [];
      if (!rows.length) { box.innerHTML = '<p class="online-empty">Поки немає гравців у рейтингу. Зареєструйся та зіграй першу гру.</p>'; return; }
      box.innerHTML = rows.map((p, i) => {
        const row = document.createElement("div");
        row.className = "online-leader-row";
        const rank = document.createElement("b"); rank.className = "online-leader-rank"; rank.textContent = String(p.rank || i + 1).padStart(2, "0");
        const name = document.createElement("span"); name.className = "online-leader-name"; name.textContent = p.username || "Гравець";
        const stats = document.createElement("small"); stats.textContent = (p.points || 0) + " оч. · " + (p.xp || 0) + " XP";
        row.append(rank, name, stats);
        return row.outerHTML;
      }).join("");
    } catch (error) {
      box.innerHTML = "";
      const p = document.createElement("p"); p.className = "online-empty"; p.textContent = "Рейтинг поки недоступний: " + error.message;
      box.appendChild(p);
    }
  }
  async function restore() {
    if (!state.token) { setStatus("НЕ ВИКОНАНО ВХІД", false); return; }
    try {
      const data = await request("/api/auth/me", { method: "GET" });
      state.user = data.user || state.user; persist(); renderUser();
      setMessage("Онлайн-акаунт відновлено: " + (state.user?.username || "гравець") + ".", "success");
    } catch (_) {
      clearSession(false);
      setMessage("Сесію завершено. Підключи сервер і ввійди знову.");
    }
  }
  function init() {
    loadSession();
    $("connectOnlineApi")?.addEventListener("click", connect);
    $("onlineRegister")?.addEventListener("click", () => auth("register"));
    $("onlineLogin")?.addEventListener("click", () => auth("login"));
    $("onlineLogout")?.addEventListener("click", () => clearSession());
    $("refreshLeaderboard")?.addEventListener("click", loadLeaderboard);
    $("onlinePassword")?.addEventListener("keydown", e => { if (e.key === "Enter") auth("login"); });
    connect().then(restore).then(loadLeaderboard);
  }
  window.KHKozakOnline = {
    request: (path, options) => request(path, options),
    getSession: () => ({ token: state.token, user: state.user }),
    refreshProfile: async () => { if (!state.token) return null; const d = await request("/api/auth/me"); state.user = d.user; persist(); renderUser(); return d.user; },
    syncGameFinish: async (game, eventId) => {
      if (!state.token) throw new Error("Увійди в онлайн-акаунт, щоб синхронізувати нагороду.");
      const d = await request("/api/games/finish", { method: "POST", body: JSON.stringify({ game, eventId }) });
      state.user = d.user; persist(); renderUser(); return d;
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();