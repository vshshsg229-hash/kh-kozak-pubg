import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const allowedOrigins = (Deno.env.get("FRONTEND_ORIGIN") ?? "https://vshshsg229-hash.github.io")
  .split(",").map((x) => x.trim()).filter(Boolean);

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const rewards: Record<string, { coins: number; points: number; xp: number }> = {
  reaction: { coins: 12, points: 15, xp: 20 },
  aim: { coins: 15, points: 20, xp: 25 },
  quiz: { coins: 15, points: 20, xp: 25 },
  memory: { coins: 18, points: 25, xp: 25 },
  loot: { coins: 15, points: 20, xp: 20 },
  pubg: { coins: 25, points: 35, xp: 35 },
  metro: { coins: 25, points: 35, xp: 35 },
  classic: { coins: 25, points: 35, xp: 35 },
  arena: { coins: 25, points: 35, xp: 35 },
};

function response(body: unknown, status = 200, origin: string | null = null) {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  if (origin && allowedOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-client-info");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Cache-Control", "no-store");
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}
function safeError(message: string, status = 400) { return { error: message, status }; }
function safeUser(row: any) {
  return {
    id: String(row.id), username: row.username, coins: row.coins,
    points: row.points, xp: row.xp, played: row.played,
    games: row.games ?? {}, createdAt: row.created_at,
  };
}
function validEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
function cleanName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/[<>]/g, "").slice(0, 20) : "";
}
async function getUser(req: Request) {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
async function getProfile(userId: string) {
  const { data, error } = await admin.from("hub_profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
const ADMIN_USER_IDS = new Set((Deno.env.get("ADMIN_USER_IDS") ?? "").split(",").map((x) => x.trim()).filter(Boolean));

async function telegramCall(method: string, payload: Record<string, unknown>) {
  if (!TELEGRAM_BOT_TOKEN) throw new Error("Telegram bot is not configured.");
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.description ?? "Telegram API request failed.");
  return data.result;
}
async function telegramSend(chatId: number | string, text: string) {
  return await telegramCall("sendMessage", { chat_id: chatId, text: text.slice(0, 4000), disable_web_page_preview: true });
}
async function notifyTelegram(userId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
  const { data, error } = await admin.from("hub_telegram_links").select("chat_id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (data?.chat_id) await telegramSend(data.chat_id, text);
}
async function hashLinkCode(code: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function isAdmin(req: Request) {
  const user = await getUser(req);
  return user && ADMIN_USER_IDS.has(user.id) ? user : null;
}
async function telegramWebhook(req: Request, origin: string | null) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_WEBHOOK_SECRET) {
    return response({ error: "Telegram bot secrets are not configured." }, 503, origin);
  }
  if (req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== TELEGRAM_WEBHOOK_SECRET) {
    return response({ error: "Unauthorized webhook." }, 401, origin);
  }
  const update = await req.json().catch(() => ({}));
  const message = update?.message;
  const chat = message?.chat;
  const from = message?.from;
  const text = typeof message?.text === "string" ? message.text.trim() : "";
  if (!chat?.id || !from?.id || !text || chat.type !== "private") return response({ ok: true }, 200, origin);
  const command = text.split(/\s+/)[0].split("@")[0].toLowerCase();
  const args = text.split(/\s+/).slice(1);
  try {
    if (command === "/start" || command === "/help") {
      await telegramSend(chat.id, "Вітаю в KH么Kozak Battle Hub! Команди:\n/link КОД — зв’язати Telegram з акаунтом на сайті\n/profile — твоя статистика\n/daily — щоденна нагорода (+25 монет, +20 очок, +20 XP)\n/top — топ гравців\n/help — допомога\n\nСпочатку увійди на сайті, відкрий вкладку Telegram і створи код зв’язування.");
    } else if (command === "/link") {
      const code = (args[0] ?? "").toUpperCase();
      if (!/^[0-9]{8}$/.test(code)) {
        await telegramSend(chat.id, "Формат: /link 12345678. Створи одноразовий код у вкладці Telegram на сайті після входу в акаунт.");
      } else {
        const codeHash = await hashLinkCode(code);
        const { data: pending, error } = await admin.from("hub_telegram_link_codes").select("user_id,expires_at").eq("code_hash", codeHash).gt("expires_at", new Date().toISOString()).maybeSingle();
        if (error) throw error;
        if (!pending) {
          await telegramSend(chat.id, "Код не знайдено або він прострочений. Створи новий код на сайті.");
        } else {
          const { data: claimedCode, error: claimError } = await admin.from("hub_telegram_link_codes").delete().eq("user_id", pending.user_id).eq("code_hash", codeHash).gt("expires_at", new Date().toISOString()).select("user_id").maybeSingle();
          if (claimError) throw claimError;
          if (!claimedCode) {
            await telegramSend(chat.id, "Цей код уже використано або він прострочений. Створи новий код на сайті.");
            return response({ ok: true }, 200, origin);
          }
          const { error: linkError } = await admin.from("hub_telegram_links").upsert({
            user_id: pending.user_id, telegram_user_id: from.id, chat_id: chat.id,
            username: typeof from.username === "string" ? from.username.slice(0, 64) : null, linked_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
          if (linkError) throw linkError;
          await telegramSend(chat.id, "Готово! Telegram прив’язано до твого KH么Kozak акаунта. Тепер працюють /profile, /daily і /top.");
        }
      }
    } else if (command === "/profile" || command === "/daily") {
      const { data: link, error: linkError } = await admin.from("hub_telegram_links").select("user_id").eq("telegram_user_id", from.id).maybeSingle();
      if (linkError) throw linkError;
      if (!link) {
        await telegramSend(chat.id, "Акаунт ще не прив’язано. Увійди на сайті → Telegram → створи код → надішли /link КОД цьому боту.");
      } else if (command === "/profile") {
        const profile = await getProfile(link.user_id);
        if (!profile) await telegramSend(chat.id, "Профіль не знайдено. Увійди на сайті та спробуй знову.");
        else await telegramSend(chat.id, `🎮 KH么Kozak — ${profile.username}\n◈ Монети: ${profile.coins}\n✧ Очки: ${profile.points}\n⚡ XP: ${profile.xp}\n🏆 Ігор зіграно: ${profile.played}`);
      } else {
        const { data: claim, error } = await admin.rpc("hub_claim_telegram_daily", { p_user_id: link.user_id });
        if (error) throw error;
        if (claim?.already_claimed) await telegramSend(chat.id, "Щоденну нагороду вже забрано. Повертайся завтра!");
        else if (claim?.error === "profile_not_found") await telegramSend(chat.id, "Профіль не знайдено. Увійди на сайт і повтори.");
        else {
          await telegramSend(chat.id, "🎁 Щоденна нагорода отримана! +25 монет · +20 очок · +20 XP.");
        }
      }
    } else if (command === "/top") {
      const { data, error } = await admin.from("hub_profiles").select("username,points,xp").order("points", { ascending: false }).order("xp", { ascending: false }).limit(5);
      if (error) throw error;
      const lines = (data ?? []).map((p, i) => `${i + 1}. ${p.username} — ${p.points} очок · ${p.xp} XP`);
      await telegramSend(chat.id, lines.length ? "🏆 ТОП KH么Kozak\n" + lines.join("\n") : "Поки немає гравців у рейтингу.");
    } else {
      await telegramSend(chat.id, "Не знаю такої команди. Напиши /help.");
    }
  } catch (error) {
    console.error("telegram webhook error:", error?.message ?? error);
    try { await telegramSend(chat.id, "Тимчасова помилка. Спробуй ще раз трохи пізніше."); } catch { /* ignore secondary delivery errors */ }
  }
  return response({ ok: true }, 200, origin);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return response({}, 204, origin);
  const path = new URL(req.url).pathname.split("/hub-api").pop() || "/";
  try {
    if (req.method === "GET" && path === "/api/health") {
      const { error } = await admin.from("hub_profiles").select("id").limit(1);
      if (error) return response({ ok: false, database: "unavailable", error: "Перевір таблиці Supabase: SQL schema ще не застосована." }, 503, origin);
      return response({ ok: true, database: "connected", service: "KH么Kozak Battle Hub Supabase API", version: "1.0.0" }, 200, origin);
    }

    if (req.method === "POST" && path === "/api/telegram/webhook") return await telegramWebhook(req, origin);

    if (req.method === "POST" && path === "/api/telegram/link-code") {
      const user = await getUser(req);
      if (!user) return response({ error: "Увійди в акаунт перед зв’язуванням Telegram." }, 401, origin);
      const profile = await getProfile(user.id);
      if (!profile) return response({ error: "Профіль не знайдено." }, 404, origin);
      const random = new Uint32Array(1);
      crypto.getRandomValues(random);
      const code = String(10000000 + (random[0] % 90000000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error } = await admin.from("hub_telegram_link_codes").upsert({ user_id: user.id, code_hash: await hashLinkCode(code), expires_at: expiresAt, created_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw error;
      return response({ code, expiresAt, expiresInSeconds: 600, botConfigured: Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_WEBHOOK_SECRET) }, 200, origin);
    }

    if (req.method === "GET" && path === "/api/telegram/status") {
      const user = await getUser(req);
      if (!user) return response({ error: "Увійди в акаунт." }, 401, origin);
      const { data, error } = await admin.from("hub_telegram_links").select("username,linked_at").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return response({ linked: Boolean(data), username: data?.username ?? null, linkedAt: data?.linked_at ?? null, botConfigured: Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_WEBHOOK_SECRET) }, 200, origin);
    }

    if (req.method === "GET" && path === "/api/admin/overview") {
      const user = await isAdmin(req);
      if (!user) return response({ error: "Адмін-доступ не налаштований для цього акаунта." }, 403, origin);
      const [profiles, links, events, recent] = await Promise.all([
        admin.from("hub_profiles").select("id", { count: "exact", head: true }),
        admin.from("hub_telegram_links").select("user_id", { count: "exact", head: true }),
        admin.from("hub_game_events").select("id", { count: "exact", head: true }),
        admin.from("hub_profiles").select("username,coins,points,xp,played,created_at").order("created_at", { ascending: false }).limit(8),
      ]);
      for (const result of [profiles, links, events, recent]) if (result.error) throw result.error;
      return response({ admin: true, profiles: profiles.count ?? 0, linkedTelegram: links.count ?? 0, gameEvents: events.count ?? 0, recentPlayers: recent.data ?? [] }, 200, origin);
    }

    if (req.method === "POST" && path === "/api/admin/broadcast") {
      const user = await isAdmin(req);
      if (!user) return response({ error: "Адмін-доступ не налаштований для цього акаунта." }, 403, origin);
      if (!TELEGRAM_BOT_TOKEN) return response({ error: "Додай TELEGRAM_BOT_TOKEN у secrets Edge Function." }, 503, origin);
      const body = await req.json().catch(() => ({}));
      const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";
      if (message.length < 2) return response({ error: "Напиши повідомлення довжиною 2–1000 символів." }, 400, origin);
      const { data: recipients, error } = await admin.from("hub_telegram_links").select("chat_id").limit(500);
      if (error) throw error;
      let sent = 0, failed = 0;
      for (const recipient of recipients ?? []) {
        try { await telegramSend(recipient.chat_id, "📣 KH么Kozak Battle Hub\n\n" + message); sent++; }
        catch { failed++; }
      }
      return response({ sent, failed, total: (recipients ?? []).length }, 200, origin);
    }

    if (req.method === "POST" && path === "/api/auth/register") {
      const body = await req.json().catch(() => ({}));
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";
      const username = cleanName(body.username);
      if (!validEmail(email)) return response({ error: "Введи коректну електронну пошту." }, 400, origin);
      if (password.length < 8 || password.length > 72) return response({ error: "Пароль має містити від 8 до 72 символів." }, 400, origin);
      if (username.length < 3) return response({ error: "Ігровий нік має містити щонайменше 3 символи." }, 400, origin);
      const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await auth.auth.signUp({ email, password, options: { data: { username } } });
      if (error) return response({ error: error.message }, 400, origin);
      if (!data.user) return response({ error: "Supabase не повернув користувача. Перевір налаштування Auth." }, 500, origin);
      if (!data.session) {
        return response({
          confirmationRequired: true,
          message: "Акаунт створено. Перевір пошту та підтвердь адресу, після чого увійди.",
          user: { id: data.user.id, username, coins: 0, points: 0, xp: 0, played: 0, games: {} },
        }, 201, origin);
      }
      const profile = await getProfile(data.user.id);
      return response({ token: data.session.access_token, refreshToken: data.session.refresh_token, user: safeUser(profile) }, 201, origin);
    }

    if (req.method === "POST" && path === "/api/auth/refresh") {
      const body = await req.json().catch(() => ({}));
      const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken : "";
      if (!refreshToken) return response({ error: "Сесія завершилася. Увійди знову." }, 401, origin);
      const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await auth.auth.refreshSession({ refresh_token: refreshToken });
      if (error || !data.session || !data.user) return response({ error: "Сесія завершилася. Увійди знову." }, 401, origin);
      const profile = await getProfile(data.user.id);
      if (!profile) return response({ error: "Профіль не знайдено." }, 404, origin);
      return response({ token: data.session.access_token, refreshToken: data.session.refresh_token, user: safeUser(profile) }, 200, origin);
    }

    if (req.method === "POST" && path === "/api/auth/login") {
      const body = await req.json().catch(() => ({}));
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";
      if (!validEmail(email) || !password || password.length > 72) return response({ error: "Перевір електронну пошту й пароль." }, 400, origin);
      const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await auth.auth.signInWithPassword({ email, password });
      if (error || !data.session || !data.user) return response({ error: "Неправильна пошта/пароль або пошта ще не підтверджена." }, 401, origin);
      const profile = await getProfile(data.user.id);
      if (!profile) return response({ error: "Профіль не створився. Перевір SQL-тригер у Supabase." }, 500, origin);
      return response({ token: data.session.access_token, refreshToken: data.session.refresh_token, user: safeUser(profile) }, 200, origin);
    }

    if (req.method === "GET" && path === "/api/auth/me") {
      const user = await getUser(req);
      if (!user) return response({ error: "Сесія завершилася. Увійди ще раз." }, 401, origin);
      const profile = await getProfile(user.id);
      if (!profile) return response({ error: "Профіль не знайдено." }, 404, origin);
      return response({ user: safeUser(profile) }, 200, origin);
    }

    if (req.method === "GET" && path === "/api/leaderboard") {
      const limit = Math.max(1, Math.min(20, Number.parseInt(new URL(req.url).searchParams.get("limit") ?? "10", 10) || 10));
      const { data, error } = await admin.from("hub_profiles").select("username,points,xp,played")
        .order("points", { ascending: false }).order("xp", { ascending: false }).order("played", { ascending: false }).limit(limit);
      if (error) throw error;
      return response({ leaderboard: (data ?? []).map((r, i) => ({ rank: i + 1, ...r })) }, 200, origin);
    }

    if (req.method === "POST" && path === "/api/games/finish") {
      const user = await getUser(req);
      if (!user) return response({ error: "Увійди в онлайн-акаунт, щоб отримати серверну нагороду." }, 401, origin);
      const body = await req.json().catch(() => ({}));
      const game = typeof body.game === "string" ? body.game : "";
      const eventId = typeof body.eventId === "string" ? body.eventId : "";
      if (!rewards[game]) return response({ error: "Невідомий режим гри." }, 400, origin);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) return response({ error: "Некоректний ідентифікатор результату." }, 400, origin);

      const base = rewards[game];
      const { data: result, error: rewardError } = await admin.rpc("hub_finish_game", {
        p_user_id: user.id,
        p_event_id: eventId,
        p_game: game,
        p_base_coins: base.coins,
        p_base_points: base.points,
        p_base_xp: base.xp,
      });
      if (rewardError) throw rewardError;
      if (result?.error === "daily_limit") return response({ error: "Досягнуто денний ліміт 40 нагород за ігри. Повернись завтра." }, 429, origin);
      if (result?.error === "profile_not_found") return response({ error: "Профіль не знайдено." }, 404, origin);
      if (result?.duplicate) return response({ duplicate: true, reward: { coins: 0, points: 0, xp: 0 }, user: safeUser(result.user) }, 200, origin);
      try {
        await notifyTelegram(user.id, `🎮 Матч завершено: +${result.reward?.coins ?? 0} монет · +${result.reward?.points ?? 0} очок · +${result.reward?.xp ?? 0} XP. Тепер у тебе ${result.user?.coins ?? 0} монет.`);
      } catch (notifyError) { console.error("Telegram reward notification failed:", notifyError?.message ?? notifyError); }
      return response({ user: safeUser(result.user), reward: result.reward, dailyBonus: result.dailyBonus }, 200, origin);
    }
    return response({ error: "Маршрут не знайдено." }, 404, origin);
  } catch (error) {
    console.error("hub-api error:", error?.message ?? error);
    return response({ error: "Помилка сервера. Перевір таблиці та налаштування Supabase." }, 500, origin);
  }
});
