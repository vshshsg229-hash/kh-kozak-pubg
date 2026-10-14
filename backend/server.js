import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import crypto from "node:crypto";

const { Pool } = pg;
const app = express();
const PORT = Number(process.env.PORT || 3000);
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN || "https://vshshsg229-hash.github.io").split(",").map(x => x.trim()).filter(Boolean);
const DATABASE_URL = process.env.DATABASE_URL || "";
const JWT_SECRET = process.env.JWT_SECRET || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_BASE_URL = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

if (!DATABASE_URL) throw new Error("DATABASE_URL is required. Create a PostgreSQL database and set DATABASE_URL.");
if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error("JWT_SECRET is required and must be at least 32 characters.");

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "20kb" }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && FRONTEND_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "false");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Забагато спроб. Спробуй через 15 хвилин." } });
const gameLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Забагато результатів за хвилину." } });

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      username VARCHAR(20) NOT NULL,
      password_hash TEXT NOT NULL,
      coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
      points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
      xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
      played INTEGER NOT NULL DEFAULT 0 CHECK (played >= 0),
      games JSONB NOT NULL DEFAULT '{}'::jsonb,
      last_daily_bonus_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS users_leaderboard_points_idx ON users (points DESC, xp DESC);
    CREATE TABLE IF NOT EXISTS game_events (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_id UUID NOT NULL,
      game VARCHAR(16) NOT NULL,
      coins INTEGER NOT NULL,
      points INTEGER NOT NULL,
      xp INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, event_id)
    );
    CREATE INDEX IF NOT EXISTS game_events_user_date_idx ON game_events (user_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS friendships (
      id BIGSERIAL PRIMARY KEY,
      requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      addressee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (requester_id <> addressee_id),
      UNIQUE (requester_id, addressee_id)
    );
    CREATE INDEX IF NOT EXISTS friendships_addressee_status_idx ON friendships (addressee_id, status);
    CREATE TABLE IF NOT EXISTS community_messages (
      id BIGSERIAL PRIMARY KEY,
      friendship_id BIGINT NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
      sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body VARCHAR(2000) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS community_messages_friendship_idx ON community_messages (friendship_id, created_at);
  `);
}

function safeUser(row) {
  return {
    id: String(row.id),
    username: row.username,
    coins: row.coins,
    points: row.points,
    xp: row.xp,
    played: row.played,
    games: row.games || {},
    createdAt: row.created_at
  };
}
function issueToken(user) {
  return jwt.sign({ sub: String(user.id) }, JWT_SECRET, { expiresIn: "7d", issuer: "khkozak-battle-hub" });
}
function authRequired(req, res, next) {
  const header = req.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Увійди в акаунт, щоб продовжити." });
  try {
    const claims = jwt.verify(token, JWT_SECRET, { issuer: "khkozak-battle-hub" });
    req.userId = Number(claims.sub);
    if (!Number.isSafeInteger(req.userId) || req.userId < 1) throw new Error("Invalid subject");
    next();
  } catch {
    return res.status(401).json({ error: "Сесія завершилася. Увійди ще раз." });
  }
}
function cleanUsername(value) {
  return typeof value === "string" ? value.trim().replace(/[<>]/g, "").slice(0, 20) : "";
}
function validEmail(value) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
function handleDbError(error, res) {
  if (error.code === "23505") return res.status(409).json({ error: "Ця електронна пошта вже зареєстрована." });
  console.error("Database request failed:", error.message);
  return res.status(500).json({ error: "Помилка сервера. Спробуй пізніше." });
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: "connected", service: "KH么Kozak Battle Hub API", version: "1.0.0" });
  } catch {
    res.status(503).json({ ok: false, database: "unavailable", service: "KH么Kozak Battle Hub API" });
  }
});

app.post("/api/auth/register", authLimiter, async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const username = cleanUsername(req.body?.username);
  if (!validEmail(email)) return res.status(400).json({ error: "Введи коректну електронну пошту." });
  if (password.length < 8 || password.length > 72) return res.status(400).json({ error: "Пароль має містити від 8 до 72 символів." });
  if (username.length < 3) return res.status(400).json({ error: "Ігровий нік має містити щонайменше 3 символи." });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO users (email, username, password_hash) VALUES ($1,$2,$3) RETURNING *",
      [email, username, passwordHash]
    );
    const user = safeUser(result.rows[0]);
    res.status(201).json({ token: issueToken(user), user });
  } catch (error) {
    handleDbError(error, res);
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!validEmail(email) || !password || password.length > 72) return res.status(400).json({ error: "Перевір електронну пошту й пароль." });
  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const row = result.rows[0];
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      return res.status(401).json({ error: "Неправильна пошта або пароль." });
    }
    await pool.query("UPDATE users SET updated_at=NOW() WHERE id=$1", [row.id]);
    const user = safeUser(row);
    res.json({ token: issueToken(user), user });
  } catch (error) {
    handleDbError(error, res);
  }
});

app.get("/api/auth/me", authRequired, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id=$1", [req.userId]);
    if (!result.rows[0]) return res.status(401).json({ error: "Акаунт не знайдено." });
    res.json({ user: safeUser(result.rows[0]) });
  } catch (error) { handleDbError(error, res); }
});

app.get("/api/leaderboard", async (req, res) => {
  const limit = Math.max(1, Math.min(20, Number.parseInt(req.query.limit, 10) || 10));
  try {
    const result = await pool.query(
      "SELECT username, points, xp, played FROM users ORDER BY points DESC, xp DESC, played DESC, created_at ASC LIMIT $1",
      [limit]
    );
    res.json({ leaderboard: result.rows.map((r, i) => ({ rank: i + 1, username: r.username, points: r.points, xp: r.xp, played: r.played })) });
  } catch (error) { handleDbError(error, res); }
});


app.get("/api/community/players", authRequired, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 20) : "";
  if (q.length < 2) return res.json({ players: [] });
  try {
    const result = await pool.query(
      "SELECT id, username, points, xp, played FROM users WHERE id<>$1 AND username ILIKE $2 ORDER BY points DESC, xp DESC LIMIT 20",
      [req.userId, "%" + q.replace(/[\\%_]/g, ch => "\\" + ch) + "%"]
    );
    res.json({ players: result.rows.map(r => ({ id: String(r.id), username: r.username, points: r.points, xp: r.xp, played: r.played })) });
  } catch (error) { handleDbError(error, res); }
});

app.get("/api/community/friends", authRequired, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.id::text AS id, f.requester_id::text AS requester_id,
        f.addressee_id::text AS addressee_id, f.status, f.created_at,
        json_build_object('id', requester.id::text, 'username', requester.username,
          'points', requester.points, 'xp', requester.xp, 'played', requester.played) AS requester,
        json_build_object('id', addressee.id::text, 'username', addressee.username,
          'points', addressee.points, 'xp', addressee.xp, 'played', addressee.played) AS addressee
      FROM friendships f
      JOIN users requester ON requester.id=f.requester_id
      JOIN users addressee ON addressee.id=f.addressee_id
      WHERE f.requester_id=$1 OR f.addressee_id=$1
      ORDER BY CASE WHEN f.status='pending' THEN 0 ELSE 1 END, f.updated_at DESC
      LIMIT 100
    `, [req.userId]);
    res.json({ userId: String(req.userId), friendships: result.rows });
  } catch (error) { handleDbError(error, res); }
});

app.post("/api/community/friends/request", authRequired, async (req, res) => {
  const username = cleanUsername(req.body?.username);
  if (username.length < 2) return res.status(400).json({ error: "Вкажи нік гравця." });
  try {
    const target = await pool.query("SELECT id, username FROM users WHERE lower(username)=lower($1) AND id<>$2", [username, req.userId]);
    if (!target.rows[0]) return res.status(404).json({ error: "Гравця не знайдено." });
    const targetId = target.rows[0].id;
    const existing = await pool.query(
      "SELECT id, status FROM friendships WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1) LIMIT 1",
      [req.userId, targetId]
    );
    if (existing.rows[0]) {
      const row = existing.rows[0];
      if (row.status === "accepted") return res.status(409).json({ error: "Ви вже друзі." });
      if (row.status === "pending") return res.status(409).json({ error: "Запит дружби вже існує." });
      await pool.query("DELETE FROM friendships WHERE id=$1", [row.id]);
    }
    await pool.query("INSERT INTO friendships (requester_id, addressee_id) VALUES ($1,$2)", [req.userId, targetId]);
    res.status(201).json({ ok: true, message: "Запит на дружбу надіслано." });
  } catch (error) { handleDbError(error, res); }
});

app.post("/api/community/friends/respond", authRequired, async (req, res) => {
  const requestId = String(req.body?.requestId || "");
  const accept = req.body?.accept === true;
  if (!/^\\d{1,20}$/.test(requestId)) return res.status(400).json({ error: "Некоректний запит дружби." });
  try {
    const result = await pool.query(
      "UPDATE friendships SET status=$3, updated_at=NOW() WHERE id=$1 AND addressee_id=$2 AND status='pending' RETURNING id",
      [requestId, req.userId, accept ? "accepted" : "rejected"]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Запит не знайдено або його вже оброблено." });
    if (!accept) await pool.query("DELETE FROM friendships WHERE id=$1", [requestId]);
    res.json({ ok: true, message: accept ? "Тепер ви друзі!" : "Запит відхилено." });
  } catch (error) { handleDbError(error, res); }
});

app.get("/api/community/messages", authRequired, async (req, res) => {
  const friendId = String(req.query.friendId || "");
  if (!/^\\d{1,20}$/.test(friendId)) return res.status(400).json({ error: "Некоректний співрозмовник." });
  try {
    const friendship = await pool.query(
      "SELECT id FROM friendships WHERE status='accepted' AND ((requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1))",
      [req.userId, friendId]
    );
    if (!friendship.rows[0]) return res.status(403).json({ error: "Чат доступний лише друзям." });
    const result = await pool.query(
      "SELECT id::text AS id, sender_id::text AS sender_id, body, created_at FROM community_messages WHERE friendship_id=$1 ORDER BY created_at DESC LIMIT 100",
      [friendship.rows[0].id]
    );
    res.json({ messages: result.rows.reverse() });
  } catch (error) { handleDbError(error, res); }
});

app.post("/api/community/messages", authRequired, async (req, res) => {
  const friendId = String(req.body?.friendId || "");
  const body = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!/^\\d{1,20}$/.test(friendId)) return res.status(400).json({ error: "Некоректний співрозмовник." });
  if (!body || body.length > 2000) return res.status(400).json({ error: "Повідомлення має містити 1–2000 символів." });
  try {
    const friendship = await pool.query(
      "SELECT id FROM friendships WHERE status='accepted' AND ((requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1))",
      [req.userId, friendId]
    );
    if (!friendship.rows[0]) return res.status(403).json({ error: "Чат доступний лише друзям." });
    const result = await pool.query(
      "INSERT INTO community_messages (friendship_id, sender_id, body) VALUES ($1,$2,$3) RETURNING id::text AS id, sender_id::text AS sender_id, body, created_at",
      [friendship.rows[0].id, req.userId, body]
    );
    res.status(201).json({ message: result.rows[0] });
  } catch (error) { handleDbError(error, res); }
});

const gameRewards = {
  reaction: { coins: 12, points: 15, xp: 20 },
  aim: { coins: 15, points: 20, xp: 25 },
  quiz: { coins: 15, points: 20, xp: 25 },
  memory: { coins: 18, points: 25, xp: 25 },
  loot: { coins: 15, points: 20, xp: 20 },
  pubg: { coins: 25, points: 35, xp: 35 },
  metro: { coins: 25, points: 35, xp: 35 },
  classic: { coins: 25, points: 35, xp: 35 },
  arena: { coins: 25, points: 35, xp: 35 }
};
app.post("/api/games/finish", authRequired, gameLimiter, async (req, res) => {
  const game = typeof req.body?.game === "string" ? req.body.game : "";
  const eventId = typeof req.body?.eventId === "string" ? req.body.eventId : "";
  if (!gameRewards[game]) return res.status(400).json({ error: "Невідомий режим гри." });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
    return res.status(400).json({ error: "Некоректний ідентифікатор результату." });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query("SELECT id FROM game_events WHERE user_id=$1 AND event_id=$2", [req.userId, eventId]);
    if (existing.rowCount) {
      await client.query("ROLLBACK");
      const current = await pool.query("SELECT * FROM users WHERE id=$1", [req.userId]);
      return res.json({ duplicate: true, reward: { coins: 0, points: 0, xp: 0 }, user: safeUser(current.rows[0]) });
    }
    const userResult = await client.query("SELECT * FROM users WHERE id=$1 FOR UPDATE", [req.userId]);
    const user = userResult.rows[0];
    if (!user) { await client.query("ROLLBACK"); return res.status(401).json({ error: "Акаунт не знайдено." }); }
    const dailyCount = await client.query("SELECT COUNT(*)::int AS count FROM game_events WHERE user_id=$1 AND created_at >= date_trunc('day', NOW())", [req.userId]);
    if (dailyCount.rows[0].count >= 40) { await client.query("ROLLBACK"); return res.status(429).json({ error: "Досягнуто денний ліміт 40 нагород за ігри. Повернись завтра." }); }
    const base = gameRewards[game];
    const firstToday = !user.last_daily_bonus_date || new Date(user.last_daily_bonus_date).toISOString().slice(0,10) !== new Date().toISOString().slice(0,10);
    const bonus = firstToday ? { coins: 15, points: 10, xp: 10 } : { coins: 0, points: 0, xp: 0 };
    const reward = { coins: base.coins + bonus.coins, points: base.points + bonus.points, xp: base.xp + bonus.xp };
    const updated = await client.query(
      `UPDATE users SET coins=coins+$2, points=points+$3, xp=xp+$4, played=played+1,
       games=COALESCE(games,'{}'::jsonb) || jsonb_build_object($5::text, COALESCE((games->>$5::text)::int,0)+1),
       last_daily_bonus_date=CASE WHEN $6 THEN CURRENT_DATE ELSE last_daily_bonus_date END,
       updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.userId, reward.coins, reward.points, reward.xp, game, firstToday]
    );
    await client.query("INSERT INTO game_events (user_id,event_id,game,coins,points,xp) VALUES ($1,$2,$3,$4,$5,$6)", [req.userId, eventId, game, reward.coins, reward.points, reward.xp]);
    await client.query("COMMIT");
    res.json({ user: safeUser(updated.rows[0]), reward, dailyBonus: firstToday ? bonus : null });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    handleDbError(error, res);
  } finally { client.release(); }
});

async function generateReply(message) {
  if (!AI_API_KEY) throw new Error("AI_API_KEY is not configured");
  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${AI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "Ти помічник KH么Kozak Battle Hub, фанатського хабу PUBG Mobile. Відповідай українською, доброзичливо й стисло. Допомагай із мінііграми, рівнями, монетами та використанням сайту. Не стверджуй, що можеш змінювати офіційний акаунт PUBG Mobile." },
        { role: "user", content: String(message).slice(0, 1200) }
      ],
      temperature: 0.6
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "AI provider request failed");
  return data.choices?.[0]?.message?.content?.trim() || "Не вдалося сформувати відповідь.";
}
app.post("/api/chat", rateLimit({ windowMs: 60 * 1000, limit: 15, standardHeaders: "draft-7", legacyHeaders: false }), async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message || message.length > 1200) return res.status(400).json({ error: "Повідомлення має містити від 1 до 1200 символів." });
  try { res.json({ reply: await generateReply(message) }); }
  catch (error) { console.error("AI request failed:", error.message); res.status(503).json({ error: "AI сервіс не налаштований або тимчасово недоступний." }); }
});

async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: String(text).slice(0, 3900) })
  });
  if (!response.ok) throw new Error("Telegram sendMessage failed");
}
app.post("/telegram/webhook", async (req, res) => {
  if (!TELEGRAM_WEBHOOK_SECRET || req.get("X-Telegram-Bot-Api-Secret-Token") !== TELEGRAM_WEBHOOK_SECRET) return res.sendStatus(401);
  res.sendStatus(200);
  const message = req.body?.message;
  const chatId = message?.chat?.id;
  const text = typeof message?.text === "string" ? message.text.trim() : "";
  if (!chatId || !text) return;
  try {
    let reply;
    if (/^\/start\b/i.test(text)) reply = "Вітаю в KH么Kozak Battle Hub! 🎮 Напиши запит про мініігри, рівні або монети.";
    else if (AI_API_KEY) reply = await generateReply(text);
    else reply = "Я бот KH么Kozak. AI ще не налаштований на сервері. Спробуй /start або відкрий сайт хабу.";
    await sendTelegramMessage(chatId, reply);
  } catch (error) { console.error("Telegram webhook handling failed:", error.message); }
});

await ensureSchema();
app.listen(PORT, () => console.log(`KH么Kozak API listening on ${PORT}`));
