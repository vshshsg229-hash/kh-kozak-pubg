(()=>{'use strict';
const STORAGE='khkozak_language';
const translations={
'Головне':['MAIN','GŁÓWNE','ANA MENÜ'],
'Головна':['Home','Strona główna','Ana sayfa'],
'Ігри та режими':['Games & modes','Gry i tryby','Oyunlar ve modlar'],
'Місії · завдання':['Missions & tasks','Misje i zadania','Görevler'],
'Приколи та рандом':['Fun & random','Zabawa i losowanie','Eğlence ve rastgele'],
'Магазин нагород':['Rewards shop','Sklep nagród','Ödül mağazası'],
'Мій профіль':['My profile','Mój profil','Profilim'],
'Telegram і бот':['Telegram & bot','Telegram i bot','Telegram ve bot'],
'Порадник KH':['KH assistant','Asystent KH','KH asistanı'],
'ТВОЯ ІГРОВА ЗОНА':['YOUR GAMING ZONE','TWOJA STREFA GRY','OYUN ALANIN'],
'ПАНЕЛЬ ГРАВЦЯ':['PLAYER DASHBOARD','PANEL GRACZA','OYUNCU PANELİ'],
'МОНЕТИ':['COINS','MONETY','JETONLAR'],
'ОЧКИ':['POINTS','PUNKTY','PUAN'],
'ЩОДЕННИЙ ДРОП':['DAILY DROP','CODZIENNY ZRZUT','GÜNLÜK ÖDÜL'],
'ЗАБРАТИ ДРОП ↗':['CLAIM DROP ↗','ODBierz DROP ↗','ÖDÜLÜ AL ↗'],
'ЗАБРАТИ НАГОРОДУ':['CLAIM REWARD','ODBierz NAGRODĘ','ÖDÜLÜ AL'],
'УСІ МІНІІГРИ ↗':['ALL MINI-GAMES ↗','WSZYSTKIE MINIGRY ↗','TÜM MİNİ OYUNLAR ↗'],
'ОБЕРИ СВІЙ РЕЖИМ':['CHOOSE YOUR MODE','WYBIERZ TRYB','MODUNU SEÇ'],
'Твоя наступна місія':['Your next mission','Twoja następna misja','Sıradaki görevin'],
'ІГРИ ТА РЕЖИМИ':['GAMES & MODES','GRY I TRYBY','OYUNLAR VE MODLAR'],
'МІСІЇ':['MISSIONS','MISJE','GÖREVLER'],
'АРСЕНАЛ НАГОРОД':['REWARD ARMORY','ARSENAŁ NAGRÓD','ÖDÜL ARSENALİ'],
'ПРОФІЛЬ':['PROFILE','PROFIL','PROFİL'],
'СЕЗОН / ПРОГРЕС':['SEASON / PROGRESS','SEZON / POSTĘP','SEZON / İLERLEME'],
'ЗБЕРЕГТИ ПРОФІЛЬ':['SAVE PROFILE','ZAPISZ PROFIL','PROFİLİ KAYDET'],
'ЗІГРАНО МІНІІГОР':['MINI-GAMES PLAYED','ROZEGRANE MINIGRY','OYNANAN MİNİ OYUN'],
'НАЛАШТУВАННЯ ГРАВЦЯ':['PLAYER SETTINGS','USTAWIENIA GRACZA','OYUNCU AYARLARI'],
'СТАТИСТИКА':['STATISTICS','STATYSTYKI','İSTATİSTİKLER'],
'ДОСЯГНЕННЯ':['ACHIEVEMENTS','OSIĄGNIĘCIA','BAŞARILAR'],
'Скинути локальний прогрес':['Reset local progress','Wyczyść lokalny postęp','Yerel ilerlemeyi sıfırla'],
'РЕЗЕРВНА КОПІЯ ПРОГРЕСУ':['PROGRESS BACKUP','KOPIA ZAPASOWA POSTĘPU','İLERLEME YEDEĞİ'],
'Зберегти монети':['Save coins','Zapisz monety','Jetonları kaydet'],
'⬇ Експортувати':['⬇ Export','⬇ Eksportuj','⬇ Dışa aktar'],
'⬆ Імпортувати':['⬆ Import','⬆ Importuj','⬆ İçe aktar'],
'ЗБЕРЕГТИ БОТА':['SAVE BOT','ZAPISZ BOTA','BOTU KAYDET'],
'ВІДКРИТИ TELEGRAM ↗':['OPEN TELEGRAM ↗','OTWÓRZ TELEGRAM ↗','TELEGRAM’I AÇ ↗'],
'ВІДКРИТИ БОТА ↗':['OPEN BOT ↗','OTWÓRZ BOTA ↗','BOTU AÇ ↗'],
'НАДІСЛАТИ ↗':['SEND ↗','WYŚLIJ ↗','GÖNDER ↗'],
'ТВОЯ ЗВЕДЕНА':['YOUR SUMMARY','TWOJE PODSUMOWANIE','ÖZETİN'],
'ВІДКРИТИ BATTLE PASS ↗':['OPEN BATTLE PASS ↗','OTWÓRZ BATTLE PASS ↗','BATTLE PASS’I AÇ ↗'],
'СИСТЕМА АКТИВНА':['SYSTEM ACTIVE','SYSTEM AKTYWNY','SİSTEM AKTİF'],
'МОВА ІНТЕРФЕЙСУ':['INTERFACE LANGUAGE','JĘZYK INTERFEJSU','ARAYÜZ DİLİ'],
'Поточний прогрес збережено на цьому пристрої.':['Progress is saved on this device.','Postęp jest zapisywany na tym urządzeniu.','İlerleme bu cihazda kaydedilir.'],
'КРУТИТИ КОЛЕСО 🎡':['SPIN THE WHEEL 🎡','ZAKRĘĆ KOŁEM 🎡','ÇARKI ÇEVİR 🎡'],
'Яку зброю взяти?':['Which weapon should I take?','Jaką broń wybrać?','Hangi silahı seçmeliyim?'],
'Челендж для загону':['Squad challenge','Wyzwanie dla drużyny','Takım görevi'],
'Місія дня':['Mission of the day','Misja dnia','Günün görevi'],
'Колесо нагород':['Reward wheel','Koło nagród','Ödül çarkı'],
'Секретний код дня':['Secret code of the day','Tajny kod dnia','Günün gizli kodu'],
'Сезонні нагород':['Season rewards','Nagrody sezonowe','Sezon ödülleri'],
'ГРАВЕЦЬ':['PLAYER','GRACZ','OYUNCU'],
'РЕКРУТ':['RECRUIT','REKRUT','ACEMİ'],
'ПІДКЛЮЧИТИ СЕРВЕР':['CONNECT SERVER','POŁĄCZ SERWER','SUNUCUYA BAĞLAN'],
'СТВОРИТИ АКАУНТ':['CREATE ACCOUNT','UTWÓRZ KONTO','HESAP OLUŞTUR'],
'УВІЙТИ':['LOG IN','ZALOGUJ SIĘ','GİRİŞ YAP'],
'ОНОВИТИ ↻':['REFRESH ↻','ODŚWIEŻ ↻','YENİLE ↻']
};
const attrTranslations={
'Введи свій нік':['Enter your nickname','Wpisz swój nick','Takma adını gir'],
'Напиши запит...':['Type a question...','Wpisz pytanie...','Bir soru yaz...'],
'Наприклад, KHkozakBot':['For example, KHkozakBot','Na przykład KHkozakBot','Örneğin, KHkozakBot'],
'Введи публічний username свого Telegram-бота, щоб кнопка відкривала його.':['Enter your Telegram bot username to link the button.','Wpisz nazwę użytkownika bota Telegram, aby połączyć przycisk.','Düğmeyi bağlamak için Telegram bot kullanıcı adını gir.']
};
let lang='uk';const originals=new WeakMap();let observer;
function normalized(s){return s.replace(/\s+/g,' ').trim()}
function translateNode(node){if(node.nodeType!==Node.TEXT_NODE||!node.parentElement||/^(SCRIPT|STYLE|OPTION)$/.test(node.parentElement.tagName))return;const original=originals.get(node)??node.nodeValue;originals.set(node,original);const key=normalized(original);if(!key)return;const item=translations[key];if(item){const lead=original.match(/^\s*/)?.[0]||'',trail=original.match(/\s*$/)?.[0]||'';const value=lang==='uk'?original:lead+item[['en','pl','tr'].indexOf(lang)]+trail;if(node.nodeValue!==value)node.nodeValue=value}}
function translateAttributes(root){const els=[...(root.matches?.('[placeholder],[title],[aria-label]')?[root]:[]),...(root.querySelectorAll?.('[placeholder],[title],[aria-label]')||[])];for(const el of els){for(const attr of ['placeholder','title','aria-label']){const v=el.getAttribute(attr);if(!v)continue;const marker='data-i18n-original-'+attr; if(!el.hasAttribute(marker))el.setAttribute(marker,v);const original=el.getAttribute(marker),t=attrTranslations[normalized(original)];if(t)el.setAttribute(attr,lang==='uk'?original:t[['en','pl','tr'].indexOf(lang)])}}}
function apply(root=document){root.querySelectorAll?.('*');const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))translateNode(node);if(root.nodeType===Node.ELEMENT_NODE)translateNode(root);translateAttributes(root)}
function setLanguage(value){lang=['uk','en','pl','tr'].includes(value)?value:'uk';try{localStorage.setItem(STORAGE,lang)}catch{}document.documentElement.lang=lang;apply();const select=document.getElementById('languageSelect');if(select&&select.value!==lang)select.value=lang;document.dispatchEvent(new CustomEvent('kh-language-change',{detail:{language:lang}}))}
function init(){const select=document.getElementById('languageSelect');let saved='uk';try{saved=localStorage.getItem(STORAGE)||'uk'}catch{}if(select){select.value=saved;select.addEventListener('change',()=>setLanguage(select.value))}setLanguage(saved);observer=new MutationObserver(records=>{for(const r of records){if(r.type==='characterData')translateNode(r.target);for(const n of r.addedNodes||[]){if(n.nodeType===Node.TEXT_NODE)translateNode(n);else if(n.nodeType===Node.ELEMENT_NODE)apply(n)}}});observer.observe(document.body,{subtree:true,childList:true,characterData:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();