# KH么Kozak — підключення онлайн-рекордів Firebase

Мініігри розміщені на GitHub Pages, тому потрібна зовнішня база даних. Цей сайт використовує Firebase Realtime Database та анонімну автентифікацію.

## 1. Створи Firebase-проєкт
1. Відкрий https://console.firebase.google.com/ і створи проєкт.
2. У Project settings → General → Your apps додай Web app (іконка </>), зареєструй його та скопіюй конфігурацію.
3. У Build → Realtime Database створи базу. Скопіюй точний Database URL, який покаже Firebase.
4. У Build → Authentication → Sign-in method увімкни **Anonymous**.
5. У Authentication → Settings → Authorized domains додай `vshshsg229-hash.github.io`, якщо його ще немає.

## 2. Додай конфігурацію
Відкрий `firebase-config.js` у GitHub і заміни значення `PASTE_...` на значення свого Firebase Web app:
- `apiKey`
- `authDomain`
- `databaseURL` — саме URL створеної Realtime Database
- `projectId`
- `appId`

Firebase Web config не є сервісним секретом. **Ніколи не вставляй** у цей файл service-account JSON або приватний ключ адміністратора.

Після зміни конфігурації зміни номер `firebase-config.js?v=2` у `minigames.html` на `firebase-config.js?v=3`, щоб браузер не використав стару кешовану конфігурацію.

## 3. Установи правила бази
У Firebase Console → Realtime Database → Rules встав вміст файлу `database.rules.json` і натисни Publish. Правила дозволяють читати загальну таблицю, а записувати рекорд — лише в профіль поточного анонімного користувача. Рекорд не можна звичайним записом знизити або стерти.

## 4. Перевір
Зачекай, поки GitHub Pages опублікує зміни, відкрий https://vshshsg229-hash.github.io/kh-kozak-pubg/minigames.html і натисни «Опублікувати рекорди». Перевір сайт у другому браузері/на іншому телефоні.

## Важливе обмеження
Це онлайн-таблиця для дружніх змагань. Оскільки клієнтська гра працює в браузері, користувач із технічними знаннями все ще може спробувати підробити бал. Для турнірів із надійною перевіркою потрібна серверна логіка (наприклад Cloud Functions), яка сама перевіряє результат, а не довіряє числу від браузера. Не відкривай усі записи бази для запису: правила `.write: true` небезпечні.
