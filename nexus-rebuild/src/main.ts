import Phaser from 'phaser';
import './style.css';

type Tile = 'grass'|'forest'|'water'|'house'|'farm'|'firestation'|'research'|'fire';
type Building = 'house'|'farm'|'firestation'|'research';
type WorldState = { year:number; population:number; food:number; wood:number; prosperity:number; buildings:{type:Building;x:number;y:number}[]; fires:{x:number;y:number;life:number}[]; animals:{x:number;y:number;kind:string}[]; people:{x:number;y:number;role:string;targetX:number;targetY:number}[]; tick:number };
const KEY='kozak-nexus-world-v1';
const W=18,H=12,S=42;
const initial:WorldState={year:1,population:12,food:48,wood:30,prosperity:12,tick:0,buildings:[{type:'house',x:8,y:6},{type:'farm',x:10,y:6}],fires:[],animals:[{x:3,y:3,kind:'🦌'},{x:14,y:2,kind:'🐗'},{x:4,y:9,kind:'🐇'}],people:Array.from({length:8},(_,i)=>({x:7+i%4,y:7+Math.floor(i/4),role:i<2?'builder':i<4?'farmer':i===4?'firefighter':'gatherer',targetX:8,targetY:6}))};
let state:WorldState;
try { state=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(initial); } catch { state=structuredClone(initial); }
let speed=1,acc=0,sceneRef:WorldScene;
const $=(id:string)=>document.getElementById(id)!;
function log(message:string){const box=$('events');const p=document.createElement('p');p.textContent='› '+message;box.prepend(p);while(box.children.length>6)box.lastElementChild?.remove();}
function save(){localStorage.setItem(KEY,JSON.stringify(state));log('Світ збережено на цьому пристрої.');}
function stats(){ const season=['🌱 ВЕСНА','☀️ ЛІТО','🍂 ОСІНЬ','❄️ ЗИМА'][Math.floor((state.tick%48)/12)]; $('season').textContent=season; $('era').textContent=(state.year<5?'СЕРЕДНЬОВІЧЧЯ':state.year<12?'ЕПОХА ВІДРОДЖЕННЯ':state.year<24?'ІНДУСТРІАЛЬНА ЕПОХА':'ТЕХНО-ЕПОХА')+' · РІК '+state.year;$('population').textContent=String(state.population);$('food').textContent=String(state.food);$('wood').textContent=String(state.wood);$('prosperity').textContent=String(state.prosperity);}
class WorldScene extends Phaser.Scene {
  graphics!:Phaser.GameObjects.Graphics; labels!:Phaser.GameObjects.Container;
  constructor(){super('world');}
  create(){sceneRef=this;this.graphics=this.add.graphics();this.labels=this.add.container(0,0);this.draw();this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{const x=Math.floor(p.x/S),y=Math.floor(p.y/S);if(x>=0&&x<W&&y>=0&&y<H)log('Ділянка '+(x+1)+', '+(y+1)+': '+this.describe(x,y));});}
  describe(x:number,y:number){if(state.fires.some(f=>f.x===x&&f.y===y))return 'пожежа';const b=state.buildings.find(b=>b.x===x&&b.y===y);if(b)return b.type;return 'територія для освоєння';}
  draw(){this.graphics.clear();this.labels.removeAll(true);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const water=(x<2&&y>7)||(x>14&&y<2);const forest=!water&&((x*7+y*11)%9<3);this.graphics.fillStyle(water?0x173c58:forest?0x173e35:0x263e36,1);this.graphics.fillRoundedRect(x*S+1,y*S+1,S-2,S-2,5);this.graphics.lineStyle(1,0x476354,.25);this.graphics.strokeRoundedRect(x*S+1,y*S+1,S-2,S-2,5);if(forest)this.text(x*S+S/2,y*S+S/2,'🌲',18);}
    for(const b of state.buildings)this.text(b.x*S+S/2,b.y*S+S/2,({house:'🏠',farm:'🌾',firestation:'🚒',research:'🔬'} as Record<Building,string>)[b.type],25);
    for(const a of state.animals)this.text(a.x*S+S/2,a.y*S+S/2,a.kind,19);
    for(const p of state.people)this.text(p.x*S+S/2,p.y*S+S/2,p.role==='firefighter'?'🧑‍🚒':'🧑',15);
    for(const f of state.fires){this.graphics.fillStyle(0xff4d24,.22);this.graphics.fillCircle(f.x*S+21,f.y*S+21,25);this.text(f.x*S+21,f.y*S+21,'🔥',26);}
  }
  text(x:number,y:number,t:string,size:number){const o=this.add.text(x,y,t,{fontSize:size+'px'}).setOrigin(.5);this.labels.add(o);}
  update(_:number,delta:number){if(speed===0)return;acc+=delta*speed;if(acc>1800){acc=0;simulate();this.draw();stats();}}
}
function free(x:number,y:number){return x>=0&&y>=0&&x<W&&y<H&&!state.buildings.some(b=>b.x===x&&b.y===y)&&!state.fires.some(f=>f.x===x&&f.y===y);}
function simulate(){
 state.tick++;if(state.tick%12===0){state.year++;state.prosperity+=1;if(state.food>0)state.food=Math.max(0,state.food-2);if(state.food===0&&state.population>4){state.population--;log('Нестача їжі: населення скоротилося.');}}
 if(state.tick%4===0){const season=Math.floor((state.tick%48)/12);const farms=state.buildings.filter(b=>b.type==='farm').length;state.food+=Math.max(0,farms*(season===3?1:season===2?2:4))+1;state.wood+=Math.max(1,Math.floor(state.people.length/5));}
 for(const a of state.animals){if(Math.random()<.28){a.x=Phaser.Math.Clamp(a.x+Phaser.Math.Between(-1,1),0,W-1);a.y=Phaser.Math.Clamp(a.y+Phaser.Math.Between(-1,1),0,H-1);}}\n for(const p of state.people){if(Math.random()<.18){p.x=Phaser.Math.Clamp(p.x+Phaser.Math.Between(-1,1),0,W-1);p.y=Phaser.Math.Clamp(p.y+Phaser.Math.Between(-1,1),0,H-1);}}
 for(const f of [...state.fires]){f.life--;const crew=state.buildings.some(b=>b.type==='firestation')&&state.people.some(p=>p.role==='firefighter'&&Math.abs(p.x-f.x)+Math.abs(p.y-f.y)<3);if(crew||f.life<=0){state.fires=state.fires.filter(x=>x!==f);log(crew?'Пожежники загасили вогонь.':'Пожежа згасла сама.');}else if(Math.random()<.22){const nx=f.x+Phaser.Math.Between(-1,1),ny=f.y+Phaser.Math.Between(-1,1);if(free(nx,ny)){state.fires.push({x:nx,y:ny,life:5});log('Вогонь поширюється лісом!');}}}
 if(state.tick%18===0&&Math.random()<.55){const x=Phaser.Math.Between(2,15),y=Phaser.Math.Between(1,10);if(free(x,y)){state.fires.push({x,y,life:7});log('У лісі спалахнула пожежа! Потрібна пожежна команда.');}}
 if(state.tick%30===0&&state.buildings.some(b=>b.type==='house')&&state.food>20){state.population++;log('До поселення приєдналася нова родина.');}
 if(state.tick%40===0&&state.buildings.some(b=>b.type==='research')){state.prosperity+=5;log('Дослідники відкрили нову технологію.');}
}
function build(type:Building){const costs:Record<Building,number>={house:12,farm:10,firestation:20,research:25};if(state.wood<costs[type]){log('Не вистачає деревини для будівництва.');return;}let spot:{x:number;y:number}|undefined;for(let r=1;r<7&&!spot;r++)for(let y=3;y<10&&!spot;y++)for(let x=4;x<14&&!spot;x++)if(Math.abs(x-9)+Math.abs(y-6)===r&&free(x,y))spot={x,y};if(!spot){log('Немає вільної ділянки.');return;}state.wood-=costs[type];state.buildings.push({type,...spot});if(type==='firestation'){state.people.push({x:spot.x,y:spot.y,role:'firefighter',targetX:spot.x,targetY:spot.y});log('Пожежна команда готова до виїзду!');}else log(({house:'Зведено новий будинок.',farm:'Створено ферму.',research:'Дослідницький центр відкрито.'} as Record<string,string>)[type]);sceneRef.draw();stats();}
new Phaser.Game({type:Phaser.AUTO,parent:'game',width:W*S,height:H*S,backgroundColor:'#0b1720',scene:[WorldScene],scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true}});
document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(b=>b.addEventListener('click',()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');}));
document.querySelectorAll<HTMLButtonElement>('[data-build]').forEach(b=>b.addEventListener('click',()=>build(b.dataset.build as Building)));
$('save').addEventListener('click',save);\n$('hunt').addEventListener('click',()=>{if(!state.animals.length){log('Поруч немає здобичі.');return;}const prey=state.animals.shift()!;state.food+=12;state.prosperity+=1;log('Мисливці вполювали '+prey.kind+' та принесли 12 одиниць їжі.');sceneRef.draw();stats();});\n$('plant').addEventListener('click',()=>{if(state.wood<2){log('Потрібно 2 деревини для саджанців.');return;}state.wood-=2;state.prosperity+=1;state.animals.push({x:Phaser.Math.Between(1,16),y:Phaser.Math.Between(1,10),kind:'🌳'});log('Мешканці висадили дерева та відновлюють ліс.');sceneRef.draw();stats();});
$('reset').addEventListener('click',()=>{if(confirm('Створити новий світ? Поточне збереження буде замінено.')){state=structuredClone(initial);save();sceneRef.draw();stats();log('Нова цивілізація заснована.');}});
window.addEventListener('beforeunload',()=>localStorage.setItem(KEY,JSON.stringify(state)));
stats();
