# KH么Kozak Battle Hub — interface lock

## Permanent navigation rule

The navigation/menu structure currently shipped in `index.html` is the approved, locked interface. Treat it as the baseline for all future updates.

- **Do not redesign, reorder, rename, regroup, remove, or add menu buttons/tabs** on the phone layout unless the user explicitly asks to change the menu.
- Keep the current grouped sidebar, group headings, button labels, button order, icons, active-tab indicator, and mobile menu open/close behavior.
- Future visual updates may change **colors, background images, textures, gradients, shadows, borders, typography details, and decorative effects only**. These must not move or restructure the menu controls or make them harder to tap/read.
- Keep existing `data-tab` values and their matching `id="tab-…"` panels intact. Do not break navigation behavior while changing visuals.
- Maintain the same menu structure across phone orientations; responsive adjustments may improve spacing/readability but must not reorganize the buttons.
- Before committing a visual update, compare the navigation markup and `data-tab` values with the approved version and verify all tabs still target existing panels.

## Approved menu groups

1. **ГОЛОВНА** — Головна
2. **ІГРИ** — Ігри та режими, 3D Арена, Бункер
3. **ЗАВДАННЯ ТА ПЛАНИ** — Місії та завдання, Події хабу, Арсенал і тактика, Тактичний штаб, Приколи та рандом
4. **КОНТЕНТ** — Музика, Мої відео TikTok
5. **МІЙ ПРОГРЕС** — Royale Pass, Магазин нагород, Мій профіль
6. **ЗВʼЯЗОК** — Особистий Telegram, Telegram, Напарник KH

This contract applies to the phone interface first and should be respected for all future KH么Kozak Battle Hub work.

## Permanent offline-only rule

KH么Kozak Battle Hub is offline-only for account/progression features. Do not add a backend, online account, server login, remote sync, server-authoritative rewards, online shop, friend/community/leaderboard APIs, server upload feed, or deployment configuration for an app backend. Coins, XP, inventory, daily rewards, games and cosmetics stay on the current device/browser. Keep the approved navigation unchanged. This rule can only be changed if the user explicitly reverses it; the user has specifically instructed that the online server must never be added again.
