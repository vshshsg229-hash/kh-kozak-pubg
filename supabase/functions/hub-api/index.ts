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

      const { data: existing, error: existsError } = await admin.from("hub_game_events").select("id").eq("user_id", user.id).eq("event_id", eventId).maybeSingle();
      if (existsError) throw existsError;
      if (existing) {
        const profile = await getProfile(user.id);
        return response({ duplicate: true, reward: { coins: 0, points: 0, xp: 0 }, user: safeUser(profile) }, 200, origin);
      }
      const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
      const { count, error: countError } = await admin.from("hub_game_events").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).gte("created_at", todayStart.toISOString());
      if (countError) throw countError;
      if ((count ?? 0) >= 40) return response({ error: "Досягнуто денний ліміт 40 нагород за ігри. Повернись завтра." }, 429, origin);

      const profile = await getProfile(user.id);
      if (!profile) return response({ error: "Профіль не знайдено." }, 404, origin);
      const nowDay = new Date().toISOString().slice(0, 10);
      const firstToday = profile.last_daily_bonus_date !== nowDay;
      const base = rewards[game];
      const bonus = firstToday ? { coins: 15, points: 10, xp: 10 } : { coins: 0, points: 0, xp: 0 };
      const reward = { coins: base.coins + bonus.coins, points: base.points + bonus.points, xp: base.xp + bonus.xp };
      const games = { ...(profile.games ?? {}), [game]: (Number(profile.games?.[game]) || 0) + 1 };
      const { data: updated, error: updateError } = await admin.from("hub_profiles").update({
        coins: profile.coins + reward.coins, points: profile.points + reward.points,
        xp: profile.xp + reward.xp, played: profile.played + 1, games,
        last_daily_bonus_date: firstToday ? nowDay : profile.last_daily_bonus_date,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id).select("*").single();
      if (updateError) throw updateError;
      const { error: insertError } = await admin.from("hub_game_events").insert({
        user_id: user.id, event_id: eventId, game, coins: reward.coins, points: reward.points, xp: reward.xp,
      });
      if (insertError) {
        // Compensate the profile update if the unique event insert fails.
        await admin.from("hub_profiles").update({
          coins: profile.coins, points: profile.points, xp: profile.xp, played: profile.played,
          games: profile.games, last_daily_bonus_date: profile.last_daily_bonus_date,
        }).eq("id", user.id);
        if (insertError.code === "23505") return response({ error: "Цей результат уже був зарахований." }, 409, origin);
        throw insertError;
      }
      return response({ user: safeUser(updated), reward, dailyBonus: firstToday ? bonus : null }, 200, origin);
    }
    return response({ error: "Маршрут не знайдено." }, 404, origin);
  } catch (error) {
    console.error("hub-api error:", error?.message ?? error);
    return response({ error: "Помилка сервера. Перевір таблиці та налаштування Supabase." }, 500, origin);
  }
});
