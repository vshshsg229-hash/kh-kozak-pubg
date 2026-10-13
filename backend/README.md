# KH么Kozak Battle Hub 7.0 — optional backend

This folder contains a starter Node.js backend for the Telegram bot and AI assistant. GitHub Pages only serves static files, so this server must be deployed separately (for example, to a Node.js hosting service).

## Run locally

1. Install Node.js 18 or newer.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env` and set the values privately.
4. Run `npm start`.
5. Check `/api/health`.

## Environment variables

- `FRONTEND_ORIGIN`: exact origin of the public frontend. Set it to `https://vshshsg229-hash.github.io` if that is where the site is hosted.
- `AI_API_KEY`: secret AI provider key. Keep it only in the backend environment, never in HTML/JavaScript.
- `AI_BASE_URL` and `AI_MODEL`: optional AI-compatible endpoint and model.
- `TELEGRAM_BOT_TOKEN`: token from BotFather. Store it only as a backend secret.
- `TELEGRAM_WEBHOOK_SECRET`: a long random secret used to verify Telegram webhook requests.

## Connect the website assistant

After deploying the backend, put the backend's public base URL in the `kh-api-base` meta tag in `app-v6/index.html`, for example:

```html
<meta name="kh-api-base" content="https://YOUR-BACKEND-HOST">
```

The assistant will then call `POST /api/chat`. If the meta value is empty, it uses its built-in local help responses.

## Connect Telegram

1. Create the bot using Telegram's official `@BotFather` and store the token in the backend's `TELEGRAM_BOT_TOKEN` secret.
2. Set a strong `TELEGRAM_WEBHOOK_SECRET` in the backend environment.
3. Set the bot webhook to `https://YOUR-BACKEND-HOST/telegram/webhook` and configure Telegram's webhook secret token to match.
4. Set the public bot username in the website's Telegram tab to make the “open bot” button point to it.

This starter supports /start and replies to text messages. It does **not** yet synchronize browser coin balances with a shared database, create accounts, or validate cross-device rewards. Those require a database and authenticated user accounts. Do not put bot tokens or AI keys into the frontend.

## Security note

The API limits chat input length and keeps provider secrets server-side. Before public production use, add rate limiting, abuse monitoring, and any provider-specific usage limits.
