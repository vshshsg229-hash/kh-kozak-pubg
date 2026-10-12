(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const characters=[
{id:'victor',name:'Victor',icon:'🪖',tag:'UNIQUE CHARACTER',bio:'Ветеран ближнього бою · спеціалізація на SMG',skill:'⚡ Швидке перезаряджання SMG в окремих режимах',role:'Сміливий штурмовик'},
{id:'sara',name:'Sara',icon:'🏍️',tag:'VEHICLE SPECIALIST',bio:'Механік команди · любить швидкі ротації',skill:'🚙 Зменшення шкоди транспорту в окремих режимах',role:'Водійка та механік'},
{id:'carlo',name:'Carlo',icon:'🕶️',tag:'TACTICAL SPECIALIST',bio:'Тактичний боєць · холодний розрахунок',skill:'🪂 Менша шкода від падіння в окремих режимах',role:'Тактик'},
{id:'andy',name:'Andy',icon:'🎩',tag:'WEAPON SPECIALIST',bio:'Майстер зброї · швидке перемикання',skill:'🔫 Швидше діставання та ховання зброї в окремих режимах',role:'Оператор зброї'},
{id:'anna',name:'Anna',icon:'🩺',tag:'SPECIAL CHARACTER',bio:'Окремий стиль персонажа для колекції',skill:'✨ Візуальний персонаж сайту; не додає ігрових бонусів',role:'Медик'},
{id:'default',name:'Боєць',icon:'🎖️',tag:'CUSTOM OPERATOR',bio:'Твій універсальний боєць KH么Kozak',skill:'🛡️ Збалансований образ для будь-якого настрою',role:'Універсальний'}
];
let activeChar='victor',activeMode='classic',activeTrack=null;
const charRoot=$('#bh-character-list');
function renderCharacters(){charRoot.innerHTML='';characters.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='bh-character-card'+(c.id===activeChar?' active':'');b.innerHTML='<span class="bh-char-icon">'+c.icon+'</span><span><strong>'+c.name+'</strong><small>'+c.role+'</small><small class="bh-selected">'+(c.id===activeChar?'✓ Обраний':'Обрати →')+'</small></span>';b.addEventListener('click',()=>{activeChar=c.id;renderCharacters();renderCharacter()});charRoot.appendChild(b)})}
function renderCharacter(){const c=characters.find(x=>x.id===activeChar)||characters[0];$('#bh-avatar').dataset.character=c.id;$('#bh-character-tag').textContent=c.tag;$('#bh-active-name').textContent=c.name;$('#bh-active-bio').textContent=c.bio;$('#bh-active-skill').textContent=c.skill}
const modes={classic:{icon:'🪂',kicker:'SURVIVE TO THE END',title:'Класичний режим',copy:'Висаджуйся з командою, збирай лут, тримайся зони та залишайся останнім загоном.',tips:['Заздалегідь обери місце висадки.','Підбери зброю для ближньої та середньої дистанції.','Стеж за зоною й не забувай про дими.']},metro:{icon:'🚇',kicker:'LOOT · FIGHT · EXTRACT',title:'Metro Royale',copy:'Підготуй спорядження, заходь на рейд за лутом і плануй евакуацію. Втрата спорядження залежить від правил конкретного сезону/режиму.',tips:['Бери комплект, який готовий ризикнути втратити.','Не затримуйся з лутом, якщо шлях до виходу небезпечний.','Слухай кроки та плануй маршрут евакуації заздалегідь.']}}
function setMode(mode){activeMode=mode;$$('.bh-mode-card').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('active',active);b.querySelector('.bh-mode-cta').textContent=active?'Обрано ✓':'Обрати режим →'});const m=modes[mode];$('#bh-mode-details-icon').textContent=m.icon;$('#bh-mode-kicker').textContent=m.kicker;$('#bh-mode-title').textContent=m.title;$('#bh-mode-copy').textContent=m.copy;$('#bh-mode-tips').innerHTML=m.tips.map(t=>'<li>'+t+'</li>').join('')}
$$('.bh-mode-card').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
renderCharacters();renderCharacter();setMode('classic');
})();