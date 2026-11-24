// The side rooms finish the second and third acts. Save after each player gesture.
const bells=[
  {name:'中音',tone:'middle',size:.82},
  {name:'高音',tone:'high',size:.65},
  {name:'低音',tone:'low',size:1}
];
const bellScore=[2,0,1];
const threadPaths=[
  'M0 50 C17 50 19 22 36 22 C66 22 58 74 82 48 Q92 32 100 32',
  'M0 32 C24 32 16 70 40 66 C60 63 58 18 76 39 Q86 70 100 70',
  'M0 70 C22 70 24 33 45 37 C63 40 69 77 84 61 Q92 50 100 50'
];
let cueTimers=[];
function stopCue(){
  cueTimers.forEach(clearTimeout);cueTimers=[];
  for(const button of el('instruments').children)button.classList.remove('ringing');
  for(const stamp of el('bellEtching')?.children||[])stamp.classList.remove('echo');
}
function leaveAlcove(){
  stopCue();s.alcove='';el('alcove').hidden=true;
  el('alcove').parentElement.classList.remove('in-alcove');
  lockStage(false);
}
function hearScore(){
  if(s.alcove!=='bells')return;
  stopCue();
  const buttons=el('instruments').children;
  bellScore.forEach((index,i)=>{
    cueTimers.push(setTimeout(()=>{
      for(const button of buttons)button.classList.remove('ringing');
      [...el('bellEtching').children].forEach((stamp,n)=>stamp.classList.toggle('echo',n===i));
      buttons[index].classList.add('ringing');stageSound.play(bells[index].tone);
      el('alcoveFeedback').textContent='试音 · '+bells[index].name;
    },i*650));
  });
  cueTimers.push(setTimeout(()=>{
    stopCue();el('alcoveFeedback').textContent='轮到你了。已应铃 '+s.chimes+' / 3';
  },1950));
}
function turnPatch(button,i){
  s.tiles[i]=(s.tiles[i]+1)%4;stageSound.play('turn');setPatch(button,i);save();
  if(s.tiles.every(n=>n===0)){
    changeStage(4);endCard();
  }else el('alcoveFeedback').textContent='看红线的断头，让相邻两片在边缘接起来。';
}
function setPatch(button,i){
  button.classList.toggle('stitched',s.tiles[i]===0);
  button.querySelector('.silkPiece').style.transform='rotate('+s.tiles[i]*90+'deg)';
  button.setAttribute('aria-label',['左','中','右'][i]+'袖片，偏转'+s.tiles[i]*90+'度，按下顺时针转动');
}
function displayScore(){
  const plate=el('bellEtching');if(!plate)return;
  [...plate.children].forEach((stamp,i)=>stamp.classList.toggle('sounded',i<s.chimes));
}
function answerBell(index){
  stopCue();stageSound.play(bells[index].tone);
  const correct=index===bellScore[s.chimes];s.chimes=correct?s.chimes+1:0;
  displayScore();
  if(s.chimes===3){s.chimes=0;changeStage(3);caption('拾影','等等，有东西掉下来了。这片铜签……谁在边上锉了三道齿？');fieldNote('第三声落下，一枚三齿铜签滑入手中。已放入随身装备。');el('action').focus({preventScroll:true});return}
  el('alcoveFeedback').textContent=correct?'梁上的木簧应了一声。已应铃 '+s.chimes+' / 3':'声音散了。铃腹的刻字记着开场和落板的规矩。';
  save();
}
function openAlcove(kind){
  closePerformance();stopMovement();s.alcove=kind;save();lockStage(true);
  const section=el('alcove'), rack=el('instruments'),isBell=kind==='bells';
  section.hidden=false;section.dataset.kind=kind;section.parentElement.classList.add('in-alcove');
  el('alcoveAct').textContent=isBell?'第二关 · 雨桥内廊':'第三关 · 戏楼后房';
  el('alcoveTitle').textContent=isBell?'听铃阁':'缀袖间';
  el('alcoveClue').textContent=isBell?'铃架原是给后台报场的。铃腹里留着师父的旧规矩，谁还记得这出戏怎样开场？':'拆下的袖片还夹在绷架里。两枚金针各咬住一截红线，中间那一截去了哪儿？';
  el('repeatCue').hidden=!isBell;rack.replaceChildren();el('bellEtching')?.remove();
  if(isBell){
    const plate=document.createElement('div');plate.id='bellEtching';plate.setAttribute('role','img');
    plate.setAttribute('aria-label','铃架上的三枚拓印，由大到小');
    for(const id of bellScore){
      const stamp=document.createElement('span');stamp.style.setProperty('--size',bells[id].size);
      stamp.innerHTML=etchIcon('bell');plate.append(stamp);
    }
    el('repeatCue').before(plate);displayScore();
  }
  for(let i=0;i<3;i++){
    const button=document.createElement('button');button.type='button';rack.append(button);
    if(isBell){
      button.innerHTML='<span class="bronze-bell" aria-hidden="true"></span><span>'+bells[i].name+'</span>';
      button.style.setProperty('--bell-size',bells[i].size);
      button.onclick=()=>answerBell(i);
    }else{
      button.innerHTML='<svg class="silkPattern" aria-hidden="true" viewBox="0 0 100 100"><path d="'+threadPaths[i]+'" fill="none" stroke="#332719" stroke-width="8"/><path d="'+threadPaths[i]+'" fill="none" stroke="#ffe0a0" stroke-width="3" stroke-dasharray="4 4"/></svg><svg class="silkPiece" aria-hidden="true" viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="4" fill="none" stroke="#bb9d72" stroke-dasharray="2 4"/><path d="'+threadPaths[i]+'" fill="none" stroke="#74342e" stroke-width="7"/><path d="'+threadPaths[i]+'" fill="none" stroke="#f8ad82" stroke-width="2" stroke-dasharray="3 2"/></svg>';
      setPatch(button,i);button.onclick=()=>turnPatch(button,i);
    }
  }
  el('alcoveFeedback').textContent=isBell?'已应铃 '+s.chimes+' / 3':'布边的针孔都在，只有线头错了位。';
  window.paintAlcove(el('alcoveScene'),kind);
  showConsole('case');el('alcoveTitle').focus({preventScroll:true});

}
el('repeatCue').onclick=hearScore;
window.addEventListener('resize',()=>{if(!el('alcove').hidden)window.paintAlcove(el('alcoveScene'),s.alcove)});

