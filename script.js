(() => {
 const challenges=[
  "Зіграй матч без транспортних засобів.",
  "Спробуй виграти перестрілку з незвичною для себе зброєю.",
  "Приземлись у новому для себе місці.",
  "Зайди в топ-10 завдяки позиції та терпінню.",
  "Допоможи напарнику в складній перестрілці.",
  "Використай дим, щоб безпечно змінити позицію.",
  "Зроби один матч без зайвого ризику заради луту.",
  "Спробуй виграти файт не поспіхом, а тактикою.",
  "Потренуй контроль віддачі улюбленої зброї.",
  "Дійди до фінальної зони, стежачи за ротацією."
 ];
 let last=-1;
 const text=document.querySelector('#kz-challenge-text');
 document.querySelector('#kz-next-challenge')?.addEventListener('click',()=>{
  let n=Math.floor(Math.random()*challenges.length);
  while(n===last&&challenges.length>1)n=Math.floor(Math.random()*challenges.length);
  last=n;if(text)text.textContent=challenges[n];
 });
 const year=document.querySelector('#kz-year');
 if(year)year.textContent=String(new Date().getFullYear());
})();