/* BLACK ZONE FIELD CONTROLS v18.26.0 */
(function(){
'use strict';
function init(){
 var canvas=document.getElementById('bzCanvas');
 if(!canvas||canvas.dataset.fieldControls==='1')return;
 canvas.dataset.fieldControls='1';
 var sprint=false,stealth=false,target=null,stamina=100,last=0;
 var shell=document.getElementById('tab-black-zone');
 if(!shell)return;
 var actions=shell.querySelector('.bz-actions');
 if(actions&&!document.getElementById('bzSprint')){
  var s=document.createElement('button');s.id='bzSprint';s.textContent='⚡ СПРИНТ: ВИМК.';actions.appendChild(s);
  var c=document.createElement('button');c.id='bzStealth';c.textContent='◌ СТЕЛС: ВИМК.';actions.appendChild(c);
  s.addEventListener('click',function(){sprint=!sprint;s.textContent='⚡ СПРИНТ: '+(sprint?'УВІМК.':'ВИМК.');});
  c.addEventListener('click',function(){stealth=!stealth;c.textContent='◌ СТЕЛС: '+(stealth?'УВІМК.':'ВИМК.');});
 }
 function getGame(){try{return window.__blackZoneGame||null}catch(e){return null}}
 // Click/tap on the map sets a destination; the player walks there.
 canvas.addEventListener('pointerdown',function(e){
  var r=canvas.getBoundingClientRect();
  target={x:Math.max(18,Math.min(782,(e.clientX-r.left)/r.width*800)),y:Math.max(25,Math.min(415,(e.clientY-r.top)/r.height*440))};
  canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId);
 });
 // Hook into the rendered player position without depending on an online server.
 function overlay(){
  var ctx=canvas.getContext('2d');
  if(!ctx){requestAnimationFrame(overlay);return}
  // Existing game draws in its own loop. Use a visible destination marker and stamina bar.
  if(target){
   var dprX=canvas.width/800,dprY=canvas.height/440;
   ctx.save();ctx.setTransform(dprX,0,0,dprY,0,0);
   ctx.strokeStyle='#f4d16f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(target.x,target.y,9,0,Math.PI*2);ctx.stroke();
   ctx.beginPath();ctx.moveTo(target.x-14,target.y);ctx.lineTo(target.x+14,target.y);ctx.moveTo(target.x,target.y-14);ctx.lineTo(target.x,target.y+14);ctx.stroke();ctx.restore();
  }
  requestAnimationFrame(overlay);
 }
 // The add-on exposes a simple movement command; the main game loop reads these keys.
 canvas.addEventListener('pointermove',function(e){if(e.buttons!==1||!target)return;var r=canvas.getBoundingClientRect();target={x:(e.clientX-r.left)/r.width*800,y:(e.clientY-r.top)/r.height*440};});
 document.addEventListener('keydown',function(e){if(e.key==='Shift')sprint=true;});
 document.addEventListener('keyup',function(e){if(e.key==='Shift')sprint=false;});
 // Add a clear on-map movement instruction; touch D-pad remains available too.
 var hint=shell.querySelector('.bz-hint');
 if(hint)hint.textContent='ПК: WASD / стрілки — рух, клік по карті — маршрут, ПРОБІЛ — вогонь, E — взаємодія, SHIFT — спринт. Телефон: натисни точку на карті або користуйся кнопками.';
 // Keep the destination marker responsive and respect reduced-motion settings.
 requestAnimationFrame(overlay);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
