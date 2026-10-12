# KH么Kozak — Telegram bot bridge (starter)

Це підготовлена основа для підключення сайту до Telegram-бота. Сам сайт працює на GitHub Pages, тому **токен бота не можна зберігати в HTML або frontend JavaScript**. Worker нижче призначений для Cloudflare Workers; це окремий серверний шар.

## Що вже закладено
- `/start` — меню бота
- `/site` — посилання на сайт
- `/challenge` — PUBG-челендж + кнопка отримати ще один
- `/vote` — голосування за карту з підрахунком голосів у KV
- `/id` — PUBG ID KH么Kozak
- `GET /health` — перевірка Worker
- `GET /api/challenge` — JSON-челендж для майбутнього підключення сайту
- захист webhook через `X-Telegram-Bot-Api-Secret-Token`

## Потрібно налаштувати перед запуском
1. Створи бота через офіційний `@BotFather` у Telegram і скопіюй токен.
2. Створи Cloudflare Worker та завантаж `worker.js` як його код.
3. У Worker → Settings → Variables and Secrets додай **секрети**:
   - `BOT_TOKEN` — токен від BotFather (Secret)
   - `WEBHOOK_SECRET` — випадковий довгий секрет (Secret; тільки літери/цифри/підкреслення/дефіси)
   - `SITE_URL` — повна URL-адреса GitHub Pages сайту
4. Створи Cloudflare KV namespace і прив'яжи його до Worker з ім'ям binding `BOT_KV`.
5. Після деплою встанови webhook, замінивши значення на свої:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<WORKER-DOMAIN>/telegram-webhook" \
  -d "secret_token=<WEBHOOK_SECRET>"
```

Не вставляй справжній токен у сайт, GitHub-репозиторій або скриншоти. Якщо токен випадково опублікувався, відклич його через BotFather.

## Як сайт і бот будуть працювати разом
- Наразі «Сквад-центр» і голосування на сайті зберігаються локально в браузері, щоб фішки працювали відразу без сервера.
- Telegram-бот працюватиме через Worker. Його голосування зберігається в KV і спільне для користувачів бота.
- Після розгортання Worker можна буде підставити його URL у конфіг сайту та підключити спільні челенджі/голоси.
- Для персональної синхронізації профілю між сайтом і Telegram потрібна перевірка Telegram Mini App `initData` на сервері; не слід довіряти Telegram user ID, переданому з браузера без перевірки.

## Перевірка після налаштування
- Відкрий `https://<WORKER-DOMAIN>/health` — має повернути `{"ok":true,...}`.
- Напиши боту `/start`, потім перевір `/challenge`, `/site`, `/vote`.
- GitHub Pages не запускає `worker.js` як backend: його потрібно окремо розгорнути у Cloudflare Workers.
