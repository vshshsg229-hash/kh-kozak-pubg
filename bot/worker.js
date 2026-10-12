const MAPS = ["Erangel", "Miramar", "Sanhok", "Livik"];
const CHALLENGES = [
  "Виграй матч без транспорту.",
  "Зіграй матч лише з двома видами зброї.",
  "Приземлись у новому для себе місці.",
  "Використовуй димову гранату для безпечної ротації.",
  "Зроби матч із незвичною для себе зброєю.",
  "Дійди до топ-10, уникаючи непотрібних перестрілок.",
  "Після кожної перестрілки зміни позицію.",
  "Зіграй матч, зробивши акцент на командній грі."
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(env) });
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "KH Kozak Telegram bridge" }, 200, env);
    }
    if (url.pathname === "/api/challenge" && request.method === "GET") {
      const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
      return json({ challenge }, 200, env);
    }
    if (url.pathname !== "/telegram-webhook" || request.method !== "POST") {
      return json({ error: "Not found" }, 404, env);
    }
    if (!env.BOT_TOKEN || !env.WEBHOOK_SECRET) {
      return json({ error: "Missing server secrets" }, 500, env);
    }
    if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) {
      return json({ error: "Unauthorized" }, 401, env);
    }
    let update;
    try { update = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400, env); }
    try {
      if (update.message) await handleMessage(update.message, env);
      if (update.callback_query) await handleCallback(update.callback_query, env);
    } catch (error) {
      console.error("Telegram update failed", error);
      // Return 200 to avoid endless webhook retries; inspect Worker logs to debug.
    }
    return new Response("ok", { status: 200 });
  }
};

function corsHeaders(env) {
  const origin = env.SITE_URL || "*";
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
}
function json(data, status, env) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders(env), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
async function telegram(method, env, payload) {
  const response = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/" + method, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Telegram API returned " + response.status);
  return response.json();
}
async function sendMessage(chatId, text, extra = {}, env) {
  return telegram("sendMessage", env, { chat_id: chatId, text, ...extra });
}
async function handleMessage(message, env) {
  const text = (message.text || "").trim();
  const chatId = message.chat.id;
  if (text.startsWith("/start")) {
    return sendMessage(chatId,
      "🎮 Вітаю у KH么Kozak PUBG-боті!\n\n/start — меню\n/site — відкрити сайт\n/challenge — отримати челендж\n/vote — проголосувати за карту\n/id — PUBG ID власника сайту",
      { reply_markup: { keyboard: [[{ text: "/challenge" }, { text: "/vote" }], [{ text: "/site" }, { text: "/id" }]], resize_keyboard: true } }, env);
  }
  if (text.startsWith("/site")) return sendMessage(chatId, "🌐 Сайт KH么Kozak:\n" + (env.SITE_URL || "Додай SITE_URL у налаштування Worker."), {}, env);
  if (text.startsWith("/challenge")) {
    const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    return sendMessage(chatId, "🎯 Твій PUBG-челендж:\n" + challenge, { reply_markup: { inline_keyboard: [[{ text: "Ще один челендж ↻", callback_data: "challenge:next" }]] } }, env);
  }
  if (text.startsWith("/id")) return sendMessage(chatId, "🎮 PUBG ID KH么Kozak: 52179256850", {}, env);
  if (text.startsWith("/vote")) {
    return sendMessage(chatId, "🗳️ Яку карту беремо в наступний матч?", { reply_markup: { inline_keyboard: [MAPS.slice(0, 2).map(m => ({ text: m, callback_data: "vote:" + m })), MAPS.slice(2).map(m => ({ text: m, callback_data: "vote:" + m }))] } }, env);
  }
  return sendMessage(chatId, "Не знаю такої команди. Натисни /start, щоб побачити меню.", {}, env);
}
async function handleCallback(query, env) {
  const data = query.data || "";
  const chatId = query.message?.chat?.id;
  const userId = query.from?.id;
  if (data === "challenge:next") {
    const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    await telegram("answerCallbackQuery", env, { callback_query_id: query.id, text: "Новий челендж!" });
    if (chatId) return sendMessage(chatId, "🎯 Твій PUBG-челендж:\n" + challenge, {}, env);
    return;
  }
  if (data.startsWith("vote:")) {
    const map = data.slice(5);
    if (!MAPS.includes(map) || !env.BOT_KV) {
      return telegram("answerCallbackQuery", env, { callback_query_id: query.id, text: "Голосування ще не налаштоване.", show_alert: true });
    }
    const userKey = "vote:user:" + userId;
    const old = await env.BOT_KV.get(userKey);
    if (old !== map) {
      if (old && MAPS.includes(old)) {
        const oldCount = Number(await env.BOT_KV.get("vote:count:" + old) || 0);
        await env.BOT_KV.put("vote:count:" + old, String(Math.max(0, oldCount - 1)));
      }
      const count = Number(await env.BOT_KV.get("vote:count:" + map) || 0);
      await env.BOT_KV.put("vote:count:" + map, String(count + 1));
      await env.BOT_KV.put(userKey, map);
    }
    const lines = await Promise.all(MAPS.map(async m => m + ": " + (await env.BOT_KV.get("vote:count:" + m) || "0")));
    await telegram("answerCallbackQuery", env, { callback_query_id: query.id, text: "Твій голос: " + map });
    if (chatId) return sendMessage(chatId, "📊 Голоси скваду:\n" + lines.join("\n"));
  }
}
