# KH么Kozak Telegram integration setup

The Telegram code is implemented in `supabase/functions/hub-api/index.ts`. It will not become live until the database migration, Edge Function deployment, and Telegram webhook are configured.

## 1. Apply the database changes

Open Supabase Dashboard → SQL Editor and run the complete current `supabase/schema.sql` file. It creates Telegram linking and daily-reward tables, the server-authoritative shop catalog/inventory, persistent achievements, and the purchase/equipment RPCs. Re-running it is intended to be safe.

## 2. Configure Edge Function secrets

In Supabase Dashboard → Edge Functions → `hub-api` → Secrets (or project secrets), set:

Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions by default. Do not place the service-role key in the website.

Set these custom function secrets:

- `TELEGRAM_BOT_TOKEN` — token from @BotFather; keep it secret.
- `TELEGRAM_WEBHOOK_SECRET` — a random 32+ character string using only A–Z, a–z, 0–9, underscore or hyphen.
- `ADMIN_USER_IDS` — comma-separated Supabase Auth user UUIDs allowed into the admin panel. This is **not** a Telegram username or email.

Redeploy the `hub-api` Edge Function after updating the code/secrets. A manual GitHub Actions workflow is available at **Actions → Deploy Supabase Hub API**. Before using it, add repository Actions secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` (this project's ref is `xacqretciujzrcqjvvgz`) in GitHub Settings → Secrets and variables → Actions, then run the workflow with its confirmation checkbox enabled. Apply the SQL schema first; the workflow only deploys the Edge Function.

## 3. Authorize the admin account

1. Create an online account in Battle Hub and sign in.
2. In Supabase Dashboard → SQL Editor, run `select id, email from auth.users order by created_at desc;` and copy the UUID (`id`) for your account.
3. Put that UUID in the Edge Function secret `ADMIN_USER_IDS`. Never put a Telegram ID or email in that variable.
4. Redeploy `hub-api` after changing secrets.

## 4. Register Telegram webhook

**Recommended:** open Battle Hub, sign in as the authorized admin, open **Адмін-панель**, and press **НАЛАШТУВАТИ** in the Telegram Webhook section. The server registers the webhook using the secrets without exposing the bot token to the browser.

Alternatively, set these environment variables in a trusted terminal (do not commit them or send the token in chat):

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `SUPABASE_URL` — the project URL such as `https://PROJECT_REF.supabase.co`

Then run:

```sh
curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  --data "$(printf '{"url":"%s/functions/v1/hub-api/api/telegram/webhook","secret_token":"%s","allowed_updates":["message"]}' "$SUPABASE_URL" "$TELEGRAM_WEBHOOK_SECRET")"
```

Check the result for `"ok":true`, then inspect:

```sh
curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

The webhook URL must be HTTPS and reachable. Telegram documents `setWebhook`, the secret header, and `sendMessage` in the [Bot API documentation](https://core.telegram.org/bots/api).

## 5. Link and test

1. Open the published Battle Hub and sign into an online account.
2. Open **Telegram і бот** and press **Створити код зв’язування**.
3. Open the bot's private chat and send `/link 12345678` with the generated code instead of the example.
4. Test `/profile`, `/daily`, `/top`, `/help`, and `/unlink`.
5. Finish a mini-game while logged in; the bot should notify the linked Telegram chat if the notification send succeeds.
6. The admin panel appears only for an account whose Supabase Auth UUID is included in `ADMIN_USER_IDS`. It can show hub counts and broadcast a message to linked chats.

## Important limits

- A user must start a private chat with the bot before Telegram can message them.
- Link codes are one-time and expire after ten minutes.
- `/daily` is one claim per account per database date; its award is committed by a SQL function.
- Bot API failures do not roll back a game reward; they are logged by the Edge Function.
- The GitHub Pages static site cannot hold the bot token or service-role key.
