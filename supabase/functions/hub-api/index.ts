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
  zombie: { coins: 30, points: 40, xp: 45 },
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
    games: row.games ?? {}, inventory: row.inventory ?? [], achievements: row.achievements ?? [],
    equipped_title: row.equipped_title ?? null, equipped_frame: row.equipped_frame ?? null,
    equipped_avatar: row.equipped_avatar ?? null, equipped_theme: row.equipped_theme ?? null,
    equipped_badge: row.equipped_badge ?? null, equipped_banner: row.equipped_banner ?? null,
    createdAt: row.created_at,
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
async function getUserSnapshot(userId: string) {
  const { error: achievementError } = await admin.rpc("hub_refresh_achievements", { p_user_id: userId });
  if (achievementError) throw achievementError;
  const [profile, inventory, achievements] = await Promise.all([
    getProfile(userId),
    admin.from("hub_inventory").select("item_id").eq("user_id", userId),
    admin.from("hub_achievements").select("achievement_id").eq("user_id", userId),
  ]);
  if (!profile) return null;
  if (inventory.error) throw inventory.error;
  if (achievements.error) throw achievements.error;
  return { ...profile, inventory: (inventory.data ?? []).map((row) => row.item_id), achievements: (achievements.data ?? []).map((row) => row.achievement_id) };
}

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
const ADMIN_TELEGRAM_CHAT_ID = Deno.env.get("ADMIN_TELEGRAM_CHAT_ID") ?? "";
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
          const { data: existingLink, error: existingLinkError } = await admin.from("hub_telegram_links").select("user_id").eq("telegram_user_id", from.id).maybeSingle();
          if (existingLinkError) throw existingLinkError;
          if (existingLink && existingLink.user_id !== pending.user_id) {
            await telegramSend(chat.id, "Цей Telegram уже прив’язано до іншого акаунта Battle Hub. Спочатку надішли /unlink з того Telegram-акаунта, потім створи новий код.");
            return response({ ok: true }, 200, origin);
          }
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
    } else if (command === "/unlink") {
      const { data: removed, error } = await admin.from("hub_telegram_links").delete().eq("telegram_user_id", from.id).select("user_id").maybeSingle();
      if (error) throw error;
      if (!removed) await telegramSend(chat.id, "Цей Telegram не прив’язано до акаунта KH么Kozak.");
      else {
        await admin.rpc("hub_refresh_achievements", { p_user_id: removed.user_id });
        await telegramSend(chat.id, "Telegram відв’язано від акаунта. Сповіщення про ігрові нагороди більше не надходитимуть.");
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
      const checks = await Promise.all([
        admin.from("hub_profiles").select("id").limit(1),
        admin.from("hub_game_events").select("id").limit(1),
        admin.from("hub_telegram_links").select("user_id").limit(1),
        admin.from("hub_telegram_link_codes").select("user_id").limit(1),
        admin.from("hub_telegram_daily_claims").select("user_id").limit(1),
        admin.from("hub_shop_catalog").select("item_id").limit(1),
        admin.from("hub_inventory").select("item_id").limit(1),
        admin.from("hub_daily_shop_purchases").select("item_id").limit(1),
        admin.from("hub_achievements").select("achievement_id").limit(1),
        admin.from("hub_friendships").select("id").limit(1),
        admin.from("hub_chat_messages").select("id").limit(1),
      ]);
      const rpcChecks = await Promise.all([
        admin.rpc("hub_refresh_achievements", { p_user_id: "00000000-0000-4000-8000-000000000000" }),
        admin.rpc("hub_claim_telegram_daily", { p_user_id: "00000000-0000-4000-8000-000000000000" }),
        admin.rpc("hub_purchase_item", { p_user_id: "00000000-0000-4000-8000-000000000000", p_item_id: "health_probe", p_daily: false }),
        admin.rpc("hub_equip_item", { p_user_id: "00000000-0000-4000-8000-000000000000", p_item_id: "health_probe" }),
        admin.rpc("hub_finish_game", { p_user_id: "00000000-0000-4000-8000-000000000000", p_event_id: "00000000-0000-4000-8000-000000000001", p_game: "health_probe", p_base_coins: 0, p_base_points: 0, p_base_xp: 0 }),
      ]);
      if (checks.some((result) => result.error) || rpcChecks.some((result) => result.error)) {
        return response({ ok: false, database: "unavailable", error: "Потрібна актуальна схема: запусти повний supabase/schema.sql, щоб увімкнути Telegram, магазин та досягнення." }, 503, origin);
      }
      return response({
        ok: true, database: "connected", service: "KH么Kozak Battle Hub Supabase API", version: "1.2.0",
        features: { telegramConfigured: Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_WEBHOOK_SECRET), serverShop: true, serverAchievements: true, adminConfigured: ADMIN_USER_IDS.size > 0 },
      }, 200, origin);
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



    if (req.method === "POST" && path === "/api/shop/equip") {
      const user = await getUser(req);
      if (!user) return response({ error: "Увійди в онлайн-акаунт, щоб синхронізувати екіпірування." }, 401, origin);
      const body = await req.json().catch(() => ({}));
      const itemId = typeof body.itemId === "string" ? body.itemId.trim().slice(0, 64) : "";
      if (!/^[a-z0-9_]+$/.test(itemId)) return response({ error: "Некоректний ідентифікатор предмета." }, 400, origin);
      const { data: equipped, error } = await admin.rpc("hub_equip_item", { p_user_id: user.id, p_item_id: itemId });
      if (error) throw error;
      const equipMessages: Record<string, string> = { profile_not_found: "Профіль не знайдено.", item_not_equipable: "Цей предмет не можна екіпірувати.", not_owned: "Спочатку придбай цей предмет у магазині." };
      if (equipped?.error) return response({ error: equipMessages[equipped.error] ?? "Не вдалося екіпірувати предмет." }, 400, origin);
      const snapshot = await getUserSnapshot(user.id);
      return response({ user: safeUser(snapshot), itemId, equipped: true }, 200, origin);
    }

    if (req.method === "POST" && path === "/api/shop/purchase") {
      const user = await getUser(req);
      if (!user) return response({ error: "Увійди в онлайн-акаунт, щоб купувати нагороди на сервері." }, 401, origin);
      const body = await req.json().catch(() => ({}));
      const itemId = typeof body.itemId === "string" ? body.itemId.trim().slice(0, 64) : "";
      const daily = body.daily === true;
      if (!/^[a-z0-9_]+$/.test(itemId)) return response({ error: "Некоректний ідентифікатор предмета." }, 400, origin);
      const { data: purchase, error } = await admin.rpc("hub_purchase_item", { p_user_id: user.id, p_item_id: itemId, p_daily: daily });
      if (error) throw error;
      const messages: Record<string, string> = {
        profile_not_found: "Профіль не знайдено.",
        item_not_found: "Цей предмет більше недоступний.",
        daily_offer_invalid: "Предмет не входить до сьогоднішньої пропозиції магазину дня.",
        daily_already_bought: "Ти вже придбав цей предмет у магазині дня сьогодні.",
        already_owned: "Цей предмет уже є у твоїй колекції.",
        insufficient_coins: "Не вистачає монет.",
        collection_complete: "Ти вже зібрав усю косметичну колекцію. Кейс не списано.",
      };
      if (purchase?.error) return response({ error: messages[purchase.error] ?? "Не вдалося придбати предмет." }, purchase.error === "insufficient_coins" ? 409 : 400, origin);
      const snapshot = await getUserSnapshot(user.id);
      if (!snapshot) return response({ error: "Профіль не знайдено." }, 404, origin);
      try { await notifyTelegram(user.id, `🛒 Магазин KH: придбання успішне. ${purchase.won_item_id ? "Із кейса випав " + purchase.won_item_id : itemId}. Витрачено ${purchase.cost} монет.`); }
      catch (notifyError) { console.error("Telegram purchase notification failed:", notifyError?.message ?? notifyError); }
      return response({ user: safeUser(snapshot), purchased: true, itemId: purchase.item_id, itemKind: purchase.item_kind, wonItemId: purchase.won_item_id ?? null, cost: purchase.cost, daily: purchase.daily }, 200, origin);
    }

    if (req.method === "GET" && path === "/api/premium/status") {
      const user = await getUser(req);
      if (!user) return response({ error: "Увійди в акаунт, щоб перевірити Elite." }, 401, origin);
      const { data, error } = await admin.from("hub_profiles").select("elite_verified,elite_expires_at").eq("id", user.id).maybeSingle();
      if (error) throw error;
      if (!data) return response({ error: "Профіль не знайдено." }, 404, origin);
      const active = data.elite_verified === true && (!data.elite_expires_at || new Date(data.elite_expires_at).getTime() > Date.now());
      return response({ eliteVerified: active, expiresAt: data.elite_expires_at ?? null }, 200, origin);
    }

    if (req.method === "POST" && path === "/api/premium/ideas") {
      const user = await getUser(req);
      if (!user) return response({ error: "Увійди в онлайн-акаунт." }, 401, origin);
      const { data: profile, error: profileError } = await admin.from("hub_profiles").select("username,elite_verified,elite_expires_at").eq("id", user.id).maybeSingle();
      if (profileError) throw profileError;
      if (!profile) return response({ error: "Профіль не знайдено." }, 404, origin);
      const active = profile.elite_verified === true && (!profile.elite_expires_at || new Date(profile.elite_expires_at).getTime() > Date.now());
      if (!active) return response({ error: "Пропозиції доступні лише підтвердженим Elite Supporter. Преміум-пропуск за монети не є платною Elite-підпискою." }, 403, origin);
      const body = await req.json().catch(() => ({}));
      const ideaTitle = typeof body.title === "string" ? body.title.trim().replace(/[<>]/g, "").slice(0, 100) : "";
      const ideaBody = typeof body.body === "string" ? body.body.trim().replace(/[<>]/g, "").slice(0, 1200) : "";
      if (ideaTitle.length < 5 || ideaBody.length < 20) return response({ error: "Заголовок — від 5 символів, опис — від 20." }, 400, origin);
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await admin.from("hub_premium_ideas").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
      if (countError) throw countError;
      if ((count ?? 0) >= 3) return response({ error: "Ліміт: 3 ідеї на добу." }, 429, origin);
      const { data: saved, error: insertError } = await admin.from("hub_premium_ideas").insert({ user_id: user.id, title: ideaTitle, body: ideaBody }).select("id,created_at").single();
      if (insertError) throw insertError;
      let telegramNotified = false;
      if (TELEGRAM_BOT_TOKEN && ADMIN_TELEGRAM_CHAT_ID) {
        try {
          await telegramSend(ADMIN_TELEGRAM_CHAT_ID, "💡 НОВА ELITE-ІДЕЯ KH么KOZAK\nГравець: " + String(profile.username).slice(0, 20) + "\n" + ideaTitle + "\n\n" + ideaBody + "\nID: " + saved.id);
          telegramNotified = true;
        } catch (notifyError) { console.error("Premium idea Telegram notification failed:", notifyError?.message ?? notifyError); }
      }
      return response({ ok: true, id: saved.id, telegramNotified, message: telegramNotified ? "Ідею збережено й надіслано адміністратору в Telegram." : "Ідею збережено на сервері. Telegram-сповіщення потребує ADMIN_TELEGRAM_CHAT_ID та TELEGRAM_BOT_TOKEN." }, 201, origin);
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

    if (req.method === "POST" && path === "/api/admin/telegram/setup-webhook") {
      const user = await isAdmin(req);
      if (!user) return response({ error: "Адмін-доступ не налаштований для цього акаунта." }, 403, origin);
      if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_WEBHOOK_SECRET) {
        return response({ error: "Спочатку додай TELEGRAM_BOT_TOKEN і TELEGRAM_WEBHOOK_SECRET у secrets Supabase Edge Function." }, 503, origin);
      }
      const webhookUrl = SUPABASE_URL.replace(/\/$/, "") + "/functions/v1/hub-api/api/telegram/webhook";
      const result = await telegramCall("setWebhook", {
        url: webhookUrl,
        secret_token: TELEGRAM_WEBHOOK_SECRET,
        allowed_updates: ["message"],
        drop_pending_updates: false,
      });
      return response({ ok: true, webhookConfigured: true, webhookUrl, telegramResult: result }, 200, origin);
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
      return response({ token: data.session.access_token, refreshToken: data.session.refresh_token, user: safeUser(await getUserSnapshot(data.user.id)) }, 201, origin);
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
      return response({ token: data.session.access_token, refreshToken: data.session.refresh_token, user: safeUser(await getUserSnapshot(data.user.id)) }, 200, origin);
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
      return response({ token: data.session.access_token, refreshToken: data.session.refresh_token, user: safeUser(await getUserSnapshot(data.user.id)) }, 200, origin);
    }

    if (req.method === "GET" && path === "/api/auth/me") {
      const user = await getUser(req);
      if (!user) return response({ error: "Сесія завершилася. Увійди ще раз." }, 401, origin);
      const profile = await getUserSnapshot(user.id);
      if (!profile) return response({ error: "Профіль не знайдено." }, 404, origin);
      return response({ user: safeUser(profile) }, 200, origin);
    }

    if (path.startsWith("/api/community/")) {
      const user = await getUser(req);
      if (!user) return response({ error: "Увійди в акаунт, щоб користуватися спільнотою." }, 401, origin);

      if (req.method === "GET" && path === "/api/community/players") {
        const query = (new URL(req.url).searchParams.get("q") ?? "").trim().replace(/[<>]/g, "").slice(0, 20);
        let request = admin.from("hub_profiles").select("id,username,points,xp,played").neq("id", user.id).order("points", { ascending: false }).limit(20);
        if (query.length >= 2) request = request.ilike("username", "%" + query.replace(/[%_,]/g, "") + "%");
        const { data, error } = await request;
        if (error) throw error;
        return response({ players: data ?? [] }, 200, origin);
      }

      if (req.method === "GET" && path === "/api/community/friends") {
        const { data, error } = await admin.from("hub_friendships").select("id,requester_id,addressee_id,status,created_at,updated_at,requester:hub_profiles!hub_friendships_requester_id_fkey(username,points,xp,played),addressee:hub_profiles!hub_friendships_addressee_id_fkey(username,points,xp,played)").or("requester_id.eq." + user.id + ",addressee_id.eq." + user.id).order("updated_at", { ascending: false }).limit(100);
        if (error) throw error;
        return response({ userId: user.id, friendships: data ?? [] }, 200, origin);
      }

      if (req.method === "POST" && path === "/api/community/friends/request") {
        const body = await req.json().catch(() => ({}));
        const username = cleanName(body.username);
        if (username.length < 3) return response({ error: "Введи нік гравця (мінімум 3 символи)." }, 400, origin);
        const { data: target, error: targetError } = await admin.from("hub_profiles").select("id,username").ilike("username", username).maybeSingle();
        if (targetError) throw targetError;
        if (!target) return response({ error: "Гравця з таким ніком не знайдено." }, 404, origin);
        if (target.id === user.id) return response({ error: "Не можна додати самого себе." }, 400, origin);
        const { data: existing, error: existingError } = await admin.from("hub_friendships").select("id,status,requester_id,addressee_id").or("and(requester_id.eq." + user.id + ",addressee_id.eq." + target.id + "),and(requester_id.eq." + target.id + ",addressee_id.eq." + user.id + ")").maybeSingle();
        if (existingError) throw existingError;
        if (existing?.status === "accepted") return response({ error: "Ви вже друзі." }, 409, origin);
        if (existing?.status === "pending") return response({ error: existing.requester_id === user.id ? "Запит уже надіслано." : "Цей гравець уже надіслав тобі запит — прийми його у списку друзів." }, 409, origin);
        const { data: friendship, error } = await admin.from("hub_friendships").insert({ requester_id: user.id, addressee_id: target.id, status: "pending" }).select("id,status,requester_id,addressee_id,created_at").single();
        if (error) throw error;
        return response({ friendship, message: "Запит у друзі надіслано." }, 201, origin);
      }

      if (req.method === "POST" && path === "/api/community/friends/respond") {
        const body = await req.json().catch(() => ({}));
        const id = typeof body.requestId === "string" ? body.requestId : "";
        const accept = body.accept === true;
        if (!/^[0-9a-f-]{36}$/i.test(id)) return response({ error: "Некоректний запит у друзі." }, 400, origin);
        if (accept) {
          const { data, error } = await admin.from("hub_friendships").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", id).eq("addressee_id", user.id).eq("status", "pending").select("id").maybeSingle();
          if (error) throw error;
          if (!data) return response({ error: "Запит не знайдено або його вже оброблено." }, 404, origin);
        } else {
          const { data, error } = await admin.from("hub_friendships").delete().eq("id", id).eq("addressee_id", user.id).eq("status", "pending").select("id").maybeSingle();
          if (error) throw error;
          if (!data) return response({ error: "Запит не знайдено або його вже оброблено." }, 404, origin);
        }
        return response({ ok: true, message: accept ? "Запит прийнято. Тепер ви друзі!" : "Запит відхилено." }, 200, origin);
      }

      if (req.method === "GET" && path === "/api/community/messages") {
        const friendId = new URL(req.url).searchParams.get("friendId") ?? "";
        if (!/^[0-9a-f-]{36}$/i.test(friendId)) return response({ error: "Обери друга для чату." }, 400, origin);
        const { data: friendship, error: friendError } = await admin.from("hub_friendships").select("id").eq("status", "accepted").or("and(requester_id.eq." + user.id + ",addressee_id.eq." + friendId + "),and(requester_id.eq." + friendId + ",addressee_id.eq." + user.id + ")").maybeSingle();
        if (friendError) throw friendError;
        if (!friendship) return response({ error: "Чат доступний лише між друзями." }, 403, origin);
        const { data, error } = await admin.from("hub_chat_messages").select("id,sender_id,recipient_id,body,created_at").or("and(sender_id.eq." + user.id + ",recipient_id.eq." + friendId + "),and(sender_id.eq." + friendId + ",recipient_id.eq." + user.id + ")").order("created_at", { ascending: true }).limit(100);
        if (error) throw error;
        return response({ messages: data ?? [] }, 200, origin);
      }

      if (req.method === "POST" && path === "/api/community/messages") {
        const body = await req.json().catch(() => ({}));
        const friendId = typeof body.friendId === "string" ? body.friendId : "";
        const message = typeof body.message === "string" ? body.message.trim().replace(/[<>]/g, "").slice(0, 1000) : "";
        if (!/^[0-9a-f-]{36}$/i.test(friendId) || message.length < 1) return response({ error: "Напиши повідомлення (до 1000 символів) і обери друга." }, 400, origin);
        const { data: friendship, error: friendError } = await admin.from("hub_friendships").select("id").eq("status", "accepted").or("and(requester_id.eq." + user.id + ",addressee_id.eq." + friendId + "),and(requester_id.eq." + friendId + ",addressee_id.eq." + user.id + ")").maybeSingle();
        if (friendError) throw friendError;
        if (!friendship) return response({ error: "Спершу прийми запит у друзі." }, 403, origin);
        const { data, error } = await admin.from("hub_chat_messages").insert({ sender_id: user.id, recipient_id: friendId, body: message }).select("id,sender_id,recipient_id,body,created_at").single();
        if (error) throw error;
        return response({ message: data }, 201, origin);
      }
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
      const snapshot = await getUserSnapshot(user.id);
      if (!snapshot) return response({ error: "Профіль не знайдено." }, 404, origin);
      if (result?.duplicate) return response({ duplicate: true, reward: { coins: 0, points: 0, xp: 0 }, user: safeUser(snapshot) }, 200, origin);
      try {
        await notifyTelegram(user.id, `🎮 Матч завершено: +${result.reward?.coins ?? 0} монет · +${result.reward?.points ?? 0} очок · +${result.reward?.xp ?? 0} XP. Тепер у тебе ${snapshot.coins ?? 0} монет.`);
      } catch (notifyError) { console.error("Telegram reward notification failed:", notifyError?.message ?? notifyError); }
      return response({ user: safeUser(snapshot), reward: result.reward, dailyBonus: result.dailyBonus }, 200, origin);
    }
    return response({ error: "Маршрут не знайдено." }, 404, origin);
  } catch (error) {
    console.error("hub-api error:", error?.message ?? error);
    return response({ error: "Помилка сервера. Перевір таблиці та налаштування Supabase." }, 500, origin);
  }
});
