# KH么Kozak — Version 3.0

Personal PUBG Mobile blogger/player website. Built as a static site for GitHub Pages.

## Included
- Responsive mobile-first layout, dark/light theme, Ukrainian/English toggle.
- PUBG Mobile launch link that attempts Android app launch and falls back to Google Play.
- Clips/video links, avatar gallery, search/favorites/download tools.
- Browser mini-games: Victor Battle Arena, aim training, reaction test, memory matching.
- Local coins/XP progression, daily reward, missions, cosmetic shop/locker, player titles.
- Random match loadout/challenge generator and KH Squad Lab.
- KH Radio music page with YouTube-based playback/search.
- Kozak AI helper (local scripted site guide; not an LLM service).
- KH Hub 3.0 on every page: quick links, PWA install prompt, progress backup/restore.
- Service-worker offline shell cache.

## Local data and limitations
- Coins, XP, cosmetics, settings, and progress are stored in the current browser's localStorage. The JSON backup can help move this local progress to another browser/device.
- Shop items are website-only cosmetics; they do not change official PUBG inventory.
- The Kozak AI helper is a scripted FAQ. Real AI requires a server-side API integration; never put private API keys in frontend code.
- A Telegram bot is not connected yet. A working bot needs a bot token, a secure backend/webhook, and hosting; the token must never be exposed in public website JavaScript.
- Music playback depends on YouTube availability and embed permissions.
- The website can link to Google Play or try to launch the installed PUBG Mobile app on Android; it cannot guarantee that PUBG starts on every browser/device.

## Deploy
Publish the repository's main branch with GitHub Pages. The public Pages URL depends on the repository owner and Pages settings.
