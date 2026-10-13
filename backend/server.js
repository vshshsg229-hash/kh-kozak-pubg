import express from "express";

const app = express();
app.use(express.json({ limit: "20kb" }));

const PORT = Number(process.env.PORT || 3000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_BASE_URL = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (FRONTEND_ORIGIN && origin === FRONTEND_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "KH么Kozak Battle Hub API" });
});

async function generateReply(message) {
  if (!AI_API_KEY) throw new Error("AI_API_KEY is not configured");
  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "Ти помічник KH么Kozak Battle Hub, фанатського хабу PUBG Mobile. Відповідай українською, доброзичливо й стисло. Допомагай із мінііграми, рівнями, монетами та використанням сайту. Не стверджуй, що можеш змінювати офіційний акаунт PUBG Mobile."
        },
        { role: "user", content: String(message).slice(0, 1200) }
      ],
      temperature: 0.6
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "AI provider request failed");
  return data.choices?.[0]?.message?.content?.trim() || "Не вдалося сформувати відповідь.";
}

app.post("/api/chat", async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message || message.length > 1200) {
    return res.status(400).json({ error: "Message must contain 1–1200 characters." });
  }
  try {
    res.json({ reply: await generateReply(message) });
  } catch (error) {
    console.error("AI request failed:", error.message);
    res.status(503).json({ error: "AI service is not configured or temporarily unavailable." });
  }
});

async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: String(text).slice(0, 3900) })
  });
  if (!response.ok) throw new Error("Telegram sendMessage failed");
}

app.post("/telegram/webhook", async (req, res) => {
  if (!TELEGRAM_WEBHOOK_SECRET ||
      req.get("X-Telegram-Bot-Api-Secret-Token") !== TELEGRAM_WEBHOOK_SECRET) {
    return res.sendStatus(401);
  }
  res.sendStatus(200);
  const message = req.body?.message;
  const chatId = message?.chat?.id;
  const text = typeof message?.text === "string" ? message.text.trim() : "";
  if (!chatId || !text) return;
  try {
    let reply;
    if (/^\/start\b/i.test(text)) {
      reply = "Вітаю в KH么Kozak Battle Hub! 🎮 Напиши запит про мініігри, рівні або монети.";
    } else if (AI_API_KEY) {
      reply = await generateReply(text);
    } else {
      reply = "Я бот KH么Kozak. AI ще не налаштований на сервері. Спробуй /start або відкрий сайт хабу.";
    }
    await sendTelegramMessage(chatId, reply);
  } catch (error) {
    console.error("Telegram webhook handling failed:", error.message);
  }
});

app.listen(PORT, () => console.log(`KH么Kozak API listening on ${PORT}`));
