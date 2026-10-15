const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { defineSecret } = require('firebase-functions/params');

const SUPABASE_URL = defineSecret('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = defineSecret('SUPABASE_SERVICE_ROLE_KEY');

initializeApp();
const db = getFirestore();
const REGION = 'us-central1';

// Rewards are fixed on the trusted server. Client-provided coin/XP amounts are ignored.
// This is a first secure baseline, not a complete anti-cheat system: game outcomes still
// need stronger validation before high-value rewards or competitive rankings are enabled.
const ALLOWED_GAMES = new Set([
  'reaction','aim','quiz','memory','loot','pubg','metro','classic','arena','zombie',
  'dropzone','lootbox','grenade','recoil','sniper','footsteps','zone','medkit','weaponpick',
  'mapquiz','headshot','supply','duel','parachute','memorycards','reload','survival','drone',
  'rank','soundcheck','combo','bridge','vehicle','crate','teamcall','finalcircle','dailyarena',
  'fishing','signal','bossrush','vault','smoke','flank','medicrush','armorcheck','ammo','scope',
  'pistol','shotgun','smg','dmr','sniper2','lootvalue','inventory','airdrop','scout','compass',
  'weather','bridge2','warehouse','rooftop','forest','desert','snow','river','tunnel','vehicle2',
  'fuel','roadblock','convoy','duo','squad','revive','ping','radar','footprint','sound2',
  'reaction2','targetgrid','tracking','burst','peek','cover','grenade2','molotov','flash','trap',
  'escape','laststand','zone2','endgame2','rank2','training','dailyquest','memory2','logic',
  'quickmath','cardbattle','coinrush','cratecode','boss2','arena2','escapezone','supply2','champion'
]);

const REWARD = Object.freeze({ coins: 8, points: 5, xp: 10 });

function kyivDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const part = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return part.year + '-' + part.month + '-' + part.day;
}
function previousDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}


exports.finishGame = onCall({ region: REGION, enforceAppCheck: false }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Спочатку увійди через Firebase.');
  const uid = request.auth.uid;
  const rawGame = String(request.data?.game || '');
  const game = rawGame.startsWith('arcade-') ? rawGame.slice(7) : rawGame;
  const eventId = String(request.data?.eventId || '');
  if (!ALLOWED_GAMES.has(game)) throw new HttpsError('invalid-argument', 'Невідомий ігровий режим.');
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(eventId)) {
    throw new HttpsError('invalid-argument', 'Некоректний ідентифікатор ігрової події.');
  }

  const userRef = db.collection('users').doc(uid);
  const eventRef = userRef.collection('gameEvents').doc(eventId);
  const result = await db.runTransaction(async (tx) => {
    const [userSnap, eventSnap] = await Promise.all([tx.get(userRef), tx.get(eventRef)]);
    if (eventSnap.exists) throw new HttpsError('already-exists', 'Цю ігрову подію вже зараховано.');
    if (!userSnap.exists) throw new HttpsError('failed-precondition', 'Профіль відсутній. Вийди та увійди знову.');
    const user = userSnap.data();
    const now = Date.now();
    const lastGameAt = Number(user.lastGameAtMs || 0);
    if (lastGameAt && now - lastGameAt < 3000) {
      throw new HttpsError('resource-exhausted', 'Зачекай кілька секунд перед наступною нагородою.');
    }
    const today = kyivDateKey(new Date(now));
    const dailyBonus = user.dailyBonusDate !== today;
    const reward = {
      coins: REWARD.coins + (dailyBonus ? 15 : 0),
      points: REWARD.points + (dailyBonus ? 10 : 0),
      xp: REWARD.xp + (dailyBonus ? 10 : 0)
    };
    const updated = {
      coins: Number(user.coins || 0) + reward.coins,
      points: Number(user.points || 0) + reward.points,
      xp: Number(user.xp || 0) + reward.xp,
      played: Number(user.played || 0) + 1,
      games: { ...(user.games || {}), [game]: Number(user.games?.[game] || 0) + 1 },
      lastGameAtMs: now,
      updatedAt: FieldValue.serverTimestamp()
    };
    if (dailyBonus) updated.dailyBonusDate = today;
    tx.create(eventRef, { game, reward, createdAt: FieldValue.serverTimestamp() });
    tx.update(userRef, updated);
    return { user: { id: uid, username: String(user.username || 'Player').slice(0, 32), coins: updated.coins, points: updated.points, xp: updated.xp, played: updated.played, games: updated.games, dailyClaimDate: user.dailyClaimDate || '', lastDailyDate: user.lastDailyDate || '', dailyStreak: Number(user.dailyStreak || 0) }, reward, dailyBonus };
  });
  return result;
});

exports.getLeaderboard = onCall({ region: REGION }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Увійди, щоб переглянути рейтинг.');
  const snap = await db.collection('users').orderBy('points', 'desc').limit(10).get();
  const leaderboard = snap.docs.map((doc, index) => {
    const data = doc.data();
    return { rank: index + 1, username: String(data.username || 'Player').slice(0, 32), points: Number(data.points || 0) };
  });
  return { leaderboard };
});

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Спочатку увійди через Firebase.');
  return request.auth.uid;
}
function publicPlayer(uid, data) {
  return {
    uid,
    username: String(data.username || 'Гравець').slice(0, 32),
    points: Number(data.points || 0),
    xp: Number(data.xp || 0),
    played: Number(data.played || 0)
  };
}
function pairId(a, b) {
  return [String(a), String(b)].sort().join('__');
}
async function requireAcceptedFriendship(uid, friendId) {
  if (!friendId || uid === friendId) throw new HttpsError('invalid-argument', 'Обери іншого гравця.');
  const ref = db.collection('friendships').doc(pairId(uid, friendId));
  const snap = await ref.get();
  if (!snap.exists || snap.data().status !== 'accepted' ||
      !Array.isArray(snap.data().members) || !snap.data().members.includes(uid) ||
      !snap.data().members.includes(friendId)) {
    throw new HttpsError('permission-denied', 'Приватний чат доступний лише друзям.');
  }
  return ref;
}

exports.searchCommunityPlayers = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request);
  const query = String(request.data?.query || '').trim().toLowerCase();
  if (query.length < 2 || query.length > 32) {
    throw new HttpsError('invalid-argument', 'Введи від 2 до 32 символів ігрового ніка.');
  }
  const snap = await db.collection('users').orderBy('usernameLower')
    .startAt(query).endAt(query + '\uf8ff').limit(15).get();
  return { players: snap.docs.filter(d => d.id !== uid).map(d => publicPlayer(d.id, d.data())) };
});

exports.sendFriendRequest = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request);
  const targetId = String(request.data?.targetId || '');
  if (!targetId || targetId === uid) throw new HttpsError('invalid-argument', 'Не можна додати себе в друзі.');
  const [meSnap, targetSnap] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('users').doc(targetId).get()
  ]);
  if (!meSnap.exists || !targetSnap.exists) throw new HttpsError('not-found', 'Профіль гравця не знайдено.');
  const ref = db.collection('friendships').doc(pairId(uid, targetId));
  const result = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (snap.exists && snap.data().status === 'accepted') {
      return { ok: true, message: 'Ви вже друзі.' };
    }
    if (snap.exists && snap.data().status === 'pending') {
      const data = snap.data();
      if (data.requestedBy !== uid) {
        tx.update(ref, { status: 'accepted', updatedAt: FieldValue.serverTimestamp(), acceptedAt: FieldValue.serverTimestamp() });
        return { ok: true, message: 'Запит підтверджено — ви тепер друзі.' };
      }
      return { ok: true, message: 'Запит уже очікує відповіді.' };
    }
    tx.set(ref, {
      members: [uid, targetId].sort(),
      requestedBy: uid,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    return { ok: true, message: 'Запит у друзі надіслано.' };
  });
  return result;
});

exports.respondFriendRequest = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request);
  const targetId = String(request.data?.friendId || '');
  const accept = request.data?.accept === true;
  const ref = db.collection('friendships').doc(pairId(uid, targetId));
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Запит не знайдено.');
    const data = snap.data();
    if (!Array.isArray(data.members) || !data.members.includes(uid) || data.requestedBy === uid || data.status !== 'pending') {
      throw new HttpsError('permission-denied', 'Цей запит не очікує на твою відповідь.');
    }
    tx.update(ref, {
      status: accept ? 'accepted' : 'rejected',
      updatedAt: FieldValue.serverTimestamp(),
      ...(accept ? { acceptedAt: FieldValue.serverTimestamp() } : { rejectedAt: FieldValue.serverTimestamp() })
    });
    return { ok: true, message: accept ? 'Запит прийнято.' : 'Запит відхилено.' };
  });
});

exports.listCommunityFriends = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request);
  const snap = await db.collection('friendships').where('members', 'array-contains', uid).limit(100).get();
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const ids = [...new Set(rows.flatMap(r => r.members || []).filter(id => id !== uid))];
  const profiles = await Promise.all(ids.map(id => db.collection('users').doc(id).get()));
  const byId = new Map(profiles.filter(p => p.exists).map(p => [p.id, publicPlayer(p.id, p.data())]));
  return { friendships: rows.map(r => ({
    id: r.id, status: r.status, requestedBy: r.requestedBy,
    friend: byId.get((r.members || []).find(id => id !== uid)) || null
  })).filter(r => r.friend) };
});

exports.sendCommunityMessage = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request);
  const friendId = String(request.data?.friendId || '');
  const body = String(request.data?.message || '').trim();
  if (!body || body.length > 1000) throw new HttpsError('invalid-argument', 'Повідомлення має містити від 1 до 1000 символів.');
  await requireAcceptedFriendship(uid, friendId);
  const conversationId = pairId(uid, friendId);
  const ref = db.collection('conversations').doc(conversationId).collection('messages').doc();
  await ref.set({ senderId: uid, body, createdAt: FieldValue.serverTimestamp() });
  return { ok: true, id: ref.id };
});

exports.listCommunityMessages = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request);
  const friendId = String(request.data?.friendId || '');
  await requireAcceptedFriendship(uid, friendId);
  const snap = await db.collection('conversations').doc(pairId(uid, friendId))
    .collection('messages').orderBy('createdAt', 'desc').limit(100).get();
  return { messages: snap.docs.reverse().map(d => ({
    id: d.id, senderId: d.data().senderId, body: String(d.data().body || ''),
    createdAt: d.data().createdAt?.toDate?.().toISOString?.() || null
  })) };
});

exports.updateMyProfile = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request);
  const input = request.data || {};
  const username = String(input.username || '').trim();
  if (username.length < 3 || username.length > 20 || !/^[\p{L}\p{N}_ .-]+$/u.test(username)) {
    throw new HttpsError('invalid-argument', 'Нік має містити 3–20 символів: літери, цифри, пробіл, крапку, дефіс або підкреслення.');
  }
  const usernameLower = username.toLowerCase();
  const ref = db.collection('users').doc(uid);
  const duplicate = await db.collection('users').where('usernameLower', '==', usernameLower).limit(2).get();
  if (duplicate.docs.some(doc => doc.id !== uid)) {
    throw new HttpsError('already-exists', 'Цей ігровий нік уже зайнятий.');
  }
  const patch = { username, usernameLower, updatedAt: FieldValue.serverTimestamp() };
  if (typeof input.bio === 'string') patch.bio = input.bio.trim().slice(0, 240);
  if (typeof input.avatar === 'string') patch.avatar = input.avatar.slice(0, 64);
  await ref.update(patch);
  const updated = await ref.get();
  return { profile: publicPlayer(uid, updated.data()), bio: String(updated.data().bio || ''), avatar: String(updated.data().avatar || '') };
});

exports.claimDailyReward = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request);
  const userRef = db.collection('users').doc(uid);
  const now = new Date();
  const today = kyivDateKey(now);
  const yesterday = previousDateKey(today);
  return db.runTransaction(async tx => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new HttpsError('failed-precondition', 'Профіль не знайдено. Перезайди в акаунт.');
    const user = snap.data();
    if (user.dailyClaimDate === today) throw new HttpsError('already-exists', 'Сьогоднішній дроп уже забрано.');
    const streak = user.lastDailyDate === yesterday ? Number(user.dailyStreak || 0) + 1 : 1;
    let coins = 25, points = 20, xp = 25;
    if (streak === 3) { coins += 50; xp += 40; }
    if (streak === 7) { coins += 150; points += 100; xp += 100; }
    const updated = {
      coins: Number(user.coins || 0) + coins,
      points: Number(user.points || 0) + points,
      xp: Number(user.xp || 0) + xp,
      dailyClaimDate: today,
      lastDailyDate: today,
      dailyStreak: streak,
      updatedAt: FieldValue.serverTimestamp()
    };
    tx.update(userRef, updated);
    return {
      user: {
        id: uid, username: String(user.username || 'Player').slice(0, 32),
        coins: updated.coins, points: updated.points, xp: updated.xp,
        played: Number(user.played || 0), games: user.games || {},
        dailyClaimDate: today, lastDailyDate: today, dailyStreak: streak
      },
      reward: { coins, points, xp }, streak
    };
  });
});


// One-time migration for an SMS-verified phone matching a legacy Supabase account.
// The client cannot provide balances; all imported values are read with the server-only key.
exports.migrateLegacyProfileByPhone = onCall({
  region: REGION,
  secrets: [SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY],
  enforceAppCheck: false
}, async (request) => {
  const uid = requireAuth(request);
  const phone = String(request.auth.token?.phone_number || '');
  if (!/^\\+[1-9]\\d{7,14}$/.test(phone)) {
    throw new HttpsError('failed-precondition', 'Firebase не підтвердив номер телефону. Повтори вхід через SMS.');
  }
  const targetRef = db.collection('users').doc(uid);
  if ((await targetRef.get()).exists) return { migrated: false, alreadyExists: true };

  const base = SUPABASE_URL.value().replace(/\\/+$/, '');
  const key = SUPABASE_SERVICE_ROLE_KEY.value();
  if (!base || !key) throw new HttpsError('failed-precondition', 'Міграцію старого прогресу ще не налаштовано на сервері.');
  const headers = { apikey: key, Authorization: 'Bearer ' + key };

  let legacyUser = null;
  for (let page = 1; page <= 100; page++) {
    const response = await fetch(base + '/auth/v1/admin/users?page=' + page + '&per_page=1000', { headers });
    if (!response.ok) throw new HttpsError('unavailable', 'Не вдалося перевірити старий акаунт. Прогрес не змінено.');
    const payload = await response.json();
    const users = Array.isArray(payload) ? payload : (payload.users || []);
    legacyUser = users.find(user => String(user.phone || '') === phone) || null;
    if (legacyUser || users.length < 1000) break;
  }
  if (!legacyUser?.id) return { migrated: false, alreadyExists: false };

  const getRows = async (path) => {
    const response = await fetch(base + path, { headers });
    if (!response.ok) throw new HttpsError('unavailable', 'Не вдалося прочитати старий профіль. Прогрес не змінено.');
    return response.json();
  };
  const [profiles, inventoryRows, achievementRows] = await Promise.all([
    getRows('/rest/v1/hub_profiles?select=*&id=eq.' + encodeURIComponent(legacyUser.id) + '&limit=1'),
    getRows('/rest/v1/hub_inventory?select=item_id&user_id=eq.' + encodeURIComponent(legacyUser.id)),
    getRows('/rest/v1/hub_achievements?select=achievement_id&user_id=eq.' + encodeURIComponent(legacyUser.id))
  ]);
  const old = profiles[0];
  if (!old) return { migrated: false, alreadyExists: false };
  const username = String(old.username || legacyUser.user_metadata?.username || ('Player' + phone.slice(-4))).slice(0, 32);
  const migratedProfile = {
    username, usernameLower: username.toLowerCase(), phoneNumber: phone,
    email: legacyUser.email || null,
    coins: Math.max(0, Number(old.coins || 0)), points: Math.max(0, Number(old.points || 0)),
    xp: Math.max(0, Number(old.xp || 0)), played: Math.max(0, Number(old.played || 0)),
    games: old.games && typeof old.games === 'object' ? old.games : {},
    inventory: inventoryRows.map(row => row.item_id).filter(Boolean),
    achievements: achievementRows.map(row => row.achievement_id).filter(Boolean),
    equipped_title: old.equipped_title || null, equipped_frame: old.equipped_frame || null,
    equipped_avatar: old.equipped_avatar || null, equipped_theme: old.equipped_theme || null,
    equipped_badge: old.equipped_badge || null, equipped_banner: old.equipped_banner || null,
    equipped_skin: old.equipped_skin || null, equipped_weapon_skin: old.equipped_weapon_skin || null,
    eliteVerified: old.elite_verified === true && (!old.elite_expires_at || new Date(old.elite_expires_at).getTime() > Date.now()),
    legacySupabaseUserId: legacyUser.id, migratedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
  };
  const migrated = await db.runTransaction(async tx => {
    const snap = await tx.get(targetRef);
    if (snap.exists) return false;
    tx.create(targetRef, migratedProfile);
    return true;
  });
  return { migrated, alreadyExists: !migrated, username, coins: migratedProfile.coins,
    points: migratedProfile.points, xp: migratedProfile.xp, played: migratedProfile.played,
    inventoryCount: migratedProfile.inventory.length, achievementCount: migratedProfile.achievements.length };
});
