# KH么Kozak Gaming Hub 4.6

## Глобальне оновлення 4.6
- Додано глобальну спільноту: публічна стрічка дописів гравців і список користувачів онлайн.
- Оновлено іконку застосунку в чорно-фіолетовій гамі з червоними акцентами та позначкою 4.6.
- Для активації глобальної стрічки виконай `global-community-schema.sql` у Supabase SQL Editor після ввімкнення Anonymous Sign-Ins.

- Додано універсальне швидке меню розділів із пошуком: `Ctrl+K` на ПК або кнопка `⌘` на екрані; `/` відкриває пошук, `Esc` закриває меню.
- Додано статус підключення до мережі, повідомлення про зміну зв’язку та адаптивний стиль швидкого меню.
- Оновлено версію PWA, кеш офлайн-оболонки та позначення версії в основних розділах.
- Збережено існуючі мініігри, профіль, XP/монети, магазин, музику, друзів і чат.

# KH么Kozak: Гра • Музика

Преміальний чорно-золотий мобільний ігровий простір із музикою та профілем.

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
- KH Hub navigation, PWA install prompt, and progress backup/restore.
- Service-worker offline shell cache.
- Black-and-gold application icon and navigation for Game, Music, and My Profile.
- Public privacy policy at `privacy.html`.
- Google Play preparation notes in `play-store/STORE_LISTING.md` and `android/README.md`.

## Local data and limitations
- Coins, XP, cosmetics, settings, and progress are stored in the current browser's localStorage. The JSON backup can help move this local progress to another browser/device.
- Shop items are website-only cosmetics; they do not change official PUBG inventory.
- The Kozak AI helper is a scripted FAQ. Real AI requires a server-side API integration; never put private API keys in frontend code.
- A Telegram bot is not connected yet. A working bot needs a bot token, a secure backend/webhook, and hosting; the token must never be exposed in public website JavaScript.
- Music playback depends on YouTube availability and embed permissions.
- The website can link to Google Play or try to launch the installed PUBG Mobile app on Android; it cannot guarantee that PUBG starts on every browser/device.

## Deploy
Publish the repository's main branch with GitHub Pages. The public Pages URL depends on the repository owner and Pages settings.


## Kozak AI: підключення справжньої AI-моделі

Віджет працює у двох режимах: локальні підказки (без сервера) і генеративний AI (після налаштування бекенду). API-ключ не можна додавати в `ai-helper.js` або інші публічні файли сайту.

1. Створи Cloudflare Worker і встав код із `ai-worker.js`.
2. У налаштуваннях Worker додай Secret `OPENAI_API_KEY` зі своїм ключем. Не надсилай ключ у чат і не публікуй його.
3. Обов’язково задай змінну `ALLOWED_ORIGIN` рівно на origin GitHub Pages, наприклад `https://vshshsg229.github.io` (використай фактичний домен свого опублікованого сайту). Без неї Worker відхилятиме запити. Налаштуй обмеження частоти запитів перед публічним використанням.
4. Опублікуй Worker та скопіюй його URL.
5. Відкрий Kozak AI на сайті й надішли команду `/ai-endpoint https://YOUR-WORKER.workers.dev/chat`.
6. Для відключення введи `/ai-off`. Команда `/forget` очищає локальну історію чату.

Адреса Worker зберігається лише в локальному сховищі браузера цього пристрою. Для роботи на іншому пристрої команду потрібно повторити. Генеративний AI потребує окремого API-ключа та може створювати витрати залежно від використання.


## Gaming Hub 4.1 — акаунт і хмарне збереження

The 4.1 update adds a dark PUBG black-and-gold theme, an account page, and an optional Supabase-backed save sync. GitHub Pages alone cannot host a private database, so cloud sync stays in local-only mode until a Supabase project is configured.

### One-time Supabase setup
1. Create a project at https://supabase.com/.
2. In the Supabase SQL Editor, run `account-schema.sql`. It creates `public.kozak_player_saves` and row-level security policies so authenticated users can read/write only their own row.
3. In `supabase-config.js`, set `url` to the project URL and `anonKey` to the project's publishable/anon key. Never use a `service_role` key in browser code.
4. In Supabase Authentication URL settings, set the Site URL to the published GitHub Pages origin and add the exact account page URL as a Redirect URL.
5. Publish the main branch and open `account.html`. Create an account, confirm the email if required, then sign in and press “Синхронізувати прогрес”.

Only selected localStorage keys that look like game/progress keys are eligible for sync; auth tokens, AI chat history, API keys and endpoint settings are excluded. Existing game pages may use different key names, so additional keys can be added to the allowlist in `cloud-sync.js` after checking each game’s storage keys. This sync does not connect to official PUBG inventory or UC.


## Global Community — Gaming Hub 4.6
- Public community feed, online presence heartbeat, searchable feed, editable local nickname, and support reactions.
- Run `global-community-schema.sql` in the configured Supabase SQL Editor to create the posts, presence, and reactions tables with row-level security. Anonymous Sign-Ins must be enabled for guest profiles.
- Community posts and presence are shared across users only after the schema is applied to the same Supabase project configured in `supabase-config.js`.
