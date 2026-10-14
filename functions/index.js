const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

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
    const dailyBonus = user.dailyBonusDate !== new Date(now).toISOString().slice(0, 10);
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
      lastGameAtMs: now,
      updatedAt: FieldValue.serverTimestamp()
    };
    if (dailyBonus) updated.dailyBonusDate = new Date(now).toISOString().slice(0, 10);
    tx.create(eventRef, { game, reward, createdAt: FieldValue.serverTimestamp() });
    tx.update(userRef, updated);
    return { user: { ...user, ...updated, id: uid, username: user.username || 'Player' }, reward, dailyBonus };
  });
  return result;
});

exports.getLeaderboard = onCall({ region: region.value() }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Увійди, щоб переглянути рейтинг.');
  const snap = await db.collection('users').orderBy('points', 'desc').limit(10).get();
  const leaderboard = snap.docs.map((doc, index) => {
    const data = doc.data();
    return { rank: index + 1, username: String(data.username || 'Player').slice(0, 32), points: Number(data.points || 0) };
  });
  return { leaderboard };
});
