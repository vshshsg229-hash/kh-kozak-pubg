(()=> {
'use strict';
const $ = (s) => document.querySelector(s);
const store = {
  get(k, fallback='') { try { return localStorage.getItem('khkozak:'+k) ?? fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem('khkozak:'+k, String(v)); } catch {} }
};
let toastTimer;
const toast = (message) => {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
};

/* Random PUBG challenge */
const challenges = [
  'Виграй матч без транспорту.',
  'Зіграй матч лише з двома видами зброї.',
  'Приземлись у новому для себе місці.',
  'Використовуй димову гранату для безпечної ротації.',
  'Зроби матч із незвичною для себе зброєю.',
  'Дійди до топ-10, уникаючи непотрібних перестрілок.',
  'Зіграй із другом і допомагай йому з лутом.',
  'Після кожного файту зміни позицію.',
  'Спробуй зіграти без прицілу 4x і вище.',
  'Зроби акцент на командній грі.'
];
const challengeEl = $('#mini-challenge');
$('#mini-challenge-next')?.addEventListener('click', () => {
  let next = challenges[Math.floor(Math.random() * challenges.length)];
  if (challenges.length > 1 && next === challengeEl?.textContent) {
    next = challenges[(challenges.indexOf(next) + 1) % challenges.length];
  }
  if (challengeEl) challengeEl.textContent = next;
  store.set('mini-challenge', next);
});
if (challengeEl && store.get('mini-challenge')) challengeEl.textContent = store.get('mini-challenge');

/* 1. Reaction test */
let reactionState = 'idle', reactionTimer = null, reactionStarted = 0;
const reactionPad = $('#reaction-pad');
const reactionStatus = $('#reaction-status');
const reactionScore = $('#reaction-score');
const reactionBest = $('#reaction-best');
const reactionBestValue = () => Number(store.get('reaction-best', '0')) || 0;
const showReactionBest = () => { if (reactionBest) reactionBest.textContent = reactionBestValue() ? reactionBestValue() + ' мс' : '—'; };
showReactionBest();

function startReaction() {
  clearTimeout(reactionTimer);
  reactionState = 'waiting';
  if (reactionScore) reactionScore.textContent = '—';
  if (reactionPad) {
    reactionPad.classList.remove('ready');
    reactionPad.classList.add('waiting');
    reactionPad.textContent = 'Чекай на зелений сигнал…';
  }
  if (reactionStatus) reactionStatus.textContent = 'Не натискай завчасно!';
  reactionTimer = setTimeout(() => {
    if (reactionState !== 'waiting') return;
    reactionState = 'ready';
    reactionStarted = performance.now();
    reactionPad?.classList.remove('waiting');
    reactionPad?.classList.add('ready');
    if (reactionPad) reactionPad.textContent = 'НАТИСКАЙ!';
    if (reactionStatus) reactionStatus.textContent = 'Зараз! Натисни якомога швидше.';
  }, 1200 + Math.random() * 2800);
}
$('#reaction-start')?.addEventListener('click', startReaction);
reactionPad?.addEventListener('click', () => {
  if (reactionState === 'idle') {
    if (reactionStatus) reactionStatus.textContent = 'Спочатку натисни «Старт».';
    return;
  }
  if (reactionState === 'waiting') {
    clearTimeout(reactionTimer);
    reactionState = 'idle';
    reactionPad.classList.remove('waiting');
    reactionPad.textContent = 'Фальстарт — спробуй ще';
    if (reactionStatus) reactionStatus.textContent = 'Фальстарт! Натисни «Старт» і спробуй знову.';
    return;
  }
  if (reactionState === 'ready') {
    const ms = Math.round(performance.now() - reactionStarted);
    reactionState = 'idle';
    reactionPad.classList.remove('ready');
    reactionPad.textContent = ms + ' мс — ще раз?';
    if (reactionScore) reactionScore.textContent = ms + ' мс';
    if (reactionStatus) reactionStatus.textContent = ms < 220 ? 'Блискавична реакція!' : ms < 300 ? 'Чудовий результат!' : 'Непогано — спробуй ще раз.';
    const old = reactionBestValue();
    if (!old || ms < old) {
      store.set('reaction-best', ms);
      showReactionBest();
      toast('Новий рекорд реакції!');
    }
  }
});

/* 2. Aim trainer */
let aimActive = false, aimCount = 0, aimLeft = 20, aimInterval = null;
const arena = $('#aim-arena'), target = $('#aim-target');
const aimScore = $('#aim-score'), aimTime = $('#aim-time'), aimBest = $('#aim-best'), aimStatus = $('#aim-status');
if (aimBest) aimBest.textContent = store.get('aim-best', '0');

function moveTarget() {
  if (!arena || !target) return;
  const margin = 28;
  const maxX = Math.max(margin, arena.clientWidth - margin);
  const maxY = Math.max(margin, arena.clientHeight - margin);
  target.style.left = (margin + Math.random() * Math.max(0, maxX - margin)) + 'px';
  target.style.top = (margin + Math.random() * Math.max(0, maxY - margin)) + 'px';
}
function finishAim() {
  clearInterval(aimInterval);
  aimActive = false;
  if (target) target.style.display = 'none';
  if (aimStatus) aimStatus.textContent = 'Час! Твій результат: ' + aimCount + ' влучань.';
  const best = Number(store.get('aim-best', '0')) || 0;
  if (aimCount > best) {
    store.set('aim-best', aimCount);
    if (aimBest) aimBest.textContent = String(aimCount);
    toast('Новий рекорд прицілу!');
  } else {
    toast('Тренування завершено!');
  }
}
$('#aim-start')?.addEventListener('click', () => {
  clearInterval(aimInterval);
  aimActive = true;
  aimCount = 0;
  aimLeft = 20;
  if (aimScore) aimScore.textContent = '0';
  if (aimTime) aimTime.textContent = '20';
  if (aimStatus) aimStatus.textContent = 'Влучай у ціль якомога швидше!';
  if (target) { target.style.display = 'block'; moveTarget(); }
  aimInterval = setInterval(() => {
    aimLeft -= 1;
    if (aimTime) aimTime.textContent = String(aimLeft);
    if (aimLeft <= 0) finishAim();
  }, 1000);
});
target?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (!aimActive) return;
  aimCount += 1;
  if (aimScore) aimScore.textContent = String(aimCount);
  moveTarget();
});
arena?.addEventListener('click', (event) => {
  if (aimActive && event.target === arena && aimStatus) aimStatus.textContent = 'Повз! Ціль — маленьке коло.';
});

/* 3. Memory matching */
const symbols = ['🎯','🪖','💣','🧭','🔫','🎒','🛡️','🚁'];
const board = $('#memory-board'), movesEl = $('#memory-moves'), pairsEl = $('#memory-pairs'), memoryStatus = $('#memory-status'), memoryBest = $('#memory-best');
let firstCard = null, memoryLocked = false, moves = 0, pairs = 0, mismatchTimer = null;
function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
function setupMemory() {
  if (!board) return;
  clearTimeout(mismatchTimer);
  board.innerHTML = '';
  const deck = shuffle([...symbols, ...symbols]);
  firstCard = null; memoryLocked = false; moves = 0; pairs = 0;
  if (movesEl) movesEl.textContent = '0';
  if (pairsEl) pairsEl.textContent = '0';
  if (memoryStatus) memoryStatus.textContent = 'Знайди всі 8 пар!';
  deck.forEach((symbol, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'memory-card';
    card.textContent = '?';
    card.setAttribute('aria-label', 'Закрита картка ' + (index + 1));
    card.dataset.symbol = symbol;
    card.addEventListener('click', () => {
      if (memoryLocked || card.classList.contains('matched') || card.classList.contains('flipped')) return;
      card.classList.add('flipped');
      card.textContent = symbol;
      card.setAttribute('aria-label', symbol);
      if (!firstCard) { firstCard = card; return; }

      moves += 1;
      if (movesEl) movesEl.textContent = String(moves);
      const previous = firstCard;
      firstCard = null;
      if (previous.dataset.symbol === card.dataset.symbol) {
        previous.classList.add('matched');
        card.classList.add('matched');
        pairs += 1;
        if (pairsEl) pairsEl.textContent = String(pairs);
        if (pairs === symbols.length) {
          if (memoryStatus) memoryStatus.textContent = 'Перемога! Усі пари знайдено за ' + moves + ' ходів.';
          const best = Number(store.get('memory-best', '0')) || 0;
          if (!best || moves < best) {
            store.set('memory-best', moves);
            if (memoryBest) memoryBest.textContent = moves + ' ходів';
            toast('Новий рекорд пам’яті!');
          }
        } else if (memoryStatus) memoryStatus.textContent = 'Є пара! Продовжуй.';
      } else {
        memoryLocked = true;
        mismatchTimer = setTimeout(() => {
          previous.classList.remove('flipped');
          card.classList.remove('flipped');
          previous.textContent = '?';
          card.textContent = '?';
          previous.setAttribute('aria-label', 'Закрита картка');
          card.setAttribute('aria-label', 'Закрита картка');
          memoryLocked = false;
        }, 700);
      }
    });
    board.appendChild(card);
  });
  const best = Number(store.get('memory-best', '0')) || 0;
  if (memoryBest) memoryBest.textContent = best ? best + ' ходів' : '—';
}
$('#memory-reset')?.addEventListener('click', setupMemory);
setupMemory();
})();