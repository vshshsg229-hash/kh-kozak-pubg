# KH么Kozak Elite — production setup

The app now contains a Monobank acquiring adapter, signed-webhook verification, atomic/idempotent Elite fulfillment, premium idea storage, and Telegram admin notifications. **Payments remain inactive until the merchant credentials, database migration, and Edge Function deployment are completed.** Do not collect card numbers, CVV, or banking passwords in the app or chat.

## 1. Database migration

First apply the base schema `supabase/schema.sql` in the Supabase SQL Editor if this project does not already have the Battle Hub tables and RPCs. Then apply the migrations in timestamp order:

1. `supabase/migrations/20261014142000_elite_ideas_and_payments.sql` — verified Elite entitlements, payment-order ledger, skin-aware inventory/equipment, and premium idea inbox.
2. `supabase/migrations/20261014173000_fix_skin_inventory_purchase.sql` — hotfix ensuring online purchases of character and weapon skins are actually granted to inventory.

Use the Supabase SQL Editor or `supabase db push --project-ref xacqretciujzrcqjvvgz` from an authenticated CLI session. Review the migrations before applying them to production. The second migration is safe to apply after the first and replaces the purchase RPC without resetting player data.

## 2. Deploy permissions

GitHub Actions deploys `hub-api` from `.github/workflows/deploy-supabase.yml`. The current deployment is blocked because the configured `SUPABASE_ACCESS_TOKEN` cannot list/deploy functions for this project. Open [GitHub Actions secrets](https://github.com/vshshsg229-hash/kh-kozak-pubg/settings/secrets/actions) and replace `SUPABASE_ACCESS_TOKEN` with a Supabase Personal Access Token that belongs to an account with access to the correct organization and project (the token format begins with `sbp_`). A correct-looking `sbp_` prefix alone does not guarantee project permissions. Keep `SUPABASE_PROJECT_REF` set to `xacqretciujzrcqjvvgz`. Never use the anon/publishable key or service-role key as this token, and do not paste tokens into chat.

## 3. Supabase Edge Function secrets

Configure these in Supabase → Edge Functions → Secrets:

- `MONOBANK_ACQUIRING_TOKEN` — merchant acquiring token from the project's Monobank merchant account.
- `TELEGRAM_BOT_TOKEN` — bot token used for notifications and account linking.
- `TELEGRAM_WEBHOOK_SECRET` — strong random secret for the Telegram webhook.
- `ADMIN_TELEGRAM_CHAT_ID` — the existing admin notification chat ID, if needed.
- `ELITE_IDEA_TELEGRAM_CHAT_ID` — destination for ELITE IDEA LAB submissions; defaults to `@rryy899` if omitted. Add the bot to the `@rryy899` Telegram channel as an administrator with permission to post messages.
- Existing `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` must remain available to the function.

The Monobank merchant account must be approved and configured to settle funds to the account you control. The site cannot route money directly to an arbitrary card number; payout destination is controlled by the merchant/payment provider.

## 4. Package entitlements

- Supporter — UAH 99, 30 days of verified Elite; Pathfinder title and Crimson frame.
- Elite — UAH 249, 90 days; verified check, Shadow Ops character skin, Ember Core weapon skin, ACE title, Crimson frame, and ACE badge.
- Legend — UAH 499, 365 days; verified check, Gold Commander skin, Cryo Steel weapon skin, Legend title/banner, Commander avatar, and ACE badge.

The checkout endpoint creates a Monobank invoice. The server grants entitlements only after verifying the signed Monobank webhook and matching the invoice amount/currency. Repeated callbacks are idempotent.

## 5. Premium ideas

Only a server-confirmed `elite_verified` entitlement can submit up to three ideas per day. The function stores the idea in `hub_premium_ideas` and sends it to `ELITE_IDEA_TELEGRAM_CHAT_ID` (default `@rryy899`) when `TELEGRAM_BOT_TOKEN` is configured. The bot must be an administrator in the target channel with permission to post. If the bot is not configured or cannot post, the idea can still be saved, but the response reports that the notification was not sent.

## 6. Safe activation checklist

1. Apply the database migration.
2. Replace the GitHub `SUPABASE_ACCESS_TOKEN` with a token that has deployment permissions.
3. Add the Monobank and Telegram secrets in Supabase.
4. Deploy `hub-api` and verify its health endpoint.
5. Test Monobank acquiring in test mode, confirm webhook signatures and tier entitlements, then enable live merchant payments.
