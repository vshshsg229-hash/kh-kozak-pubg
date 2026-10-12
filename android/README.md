# Android / Google Play — наступні кроки

Вебзастосунок KH么Kozak залишається на GitHub Pages. Для Google Play потрібна Android-збірка; рекомендований шлях для вже існуючого PWA — Trusted Web Activity (TWA) через Bubblewrap або PWABuilder.

## Поточний стан
- PWA manifest: `../manifest.webmanifest`
- Стартова сторінка: `https://vshshsg229-hash.github.io/kh-kozak-pubg/minigames.html?app=1`
- Політика конфіденційності: `https://vshshsg229-hash.github.io/kh-kozak-pubg/privacy.html`
- Іконка бренду: `../app-icon.svg`
- Бажана назва: `KH么Kozak: Гра • Музика`
- Package ID для розгляду: `app.khkozak.gamemusicprofile` (має бути остаточно затверджений до першого релізу; після публікації не можна довільно змінювати).

## Збірка TWA
1. На комп'ютері встановити актуальний Node.js та Java/Android build tools або дозволити Bubblewrap налаштувати їх.
2. Виконати `npm i -g @bubblewrap/cli`.
3. Ініціалізувати TWA з опублікованого маніфесту: `bubblewrap init --manifest https://vshshsg229-hash.github.io/kh-kozak-pubg/manifest.webmanifest`.
4. Підтвердити application ID, назву, URL і налаштування. Згенерувати й зберегти signing keystore у безпечному місці; ніколи не комітити його до GitHub і не надсилати в чат.
5. Перевірити/оновити Android target SDK відповідно до актуальних правил Google Play; створити підписаний AAB командою `bubblewrap build`.
6. Завантажити AAB у Play Console для внутрішнього тестування.
7. Налаштувати Digital Asset Links у `/.well-known/assetlinks.json` з правильним SHA-256 fingerprint ключа, яким підписаний реліз. Не публікувати вигаданий fingerprint.
8. Заповнити сторінку магазину, Data safety, віковий рейтинг та інші форми, протестувати, потім подати на перевірку.

## Що не можна зробити автоматично з цього репозиторію
Потрібен власник для входу в Play Console, прийняття угод, підтвердження особи/платежу, зберігання signing key і відповідей у формах. Ці приватні дії не слід делегувати через пароль або секрети в чаті.
