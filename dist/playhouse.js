const acts=[
  ['第一关 · 起灯','后台掌灯','按下灯芯，让火光穿过影窗。'],
  ['第一关 · 搭桥','后台置景','拖动椅轨和灯座，让影桥两端同时对准桥墩，再扣锁栓。'],
  ['第二关 · 听铃','雨桥听铃','换拾影，向右走到桥头，拉响铜铃。'],
  ['第三关 · 寻纹','戏楼寻纹','阿照转窗接通断桥，拾影回左岸牵袖拉铃。'],
  ['终幕','满堂灯火','阿照举灯，拾影登台。']
];
const plates=['room-shop.jpg','room-shop.jpg','room-river.jpg','room-opera.jpg','room-opera.jpg'];
let wide=false,previousPlate='',lastAct=-1,muted=false;
try{muted=localStorage.getItem('dengxia-muted')==='1'}catch{}
const stageNode=document.querySelector('.stage');
function displaySound(){
  stageSound.setMuted(muted);el('sound').textContent=muted?'声音关':'声音开';
  el('sound').setAttribute('aria-pressed',String(!muted));
}
displaySound();
el('sound').onclick=()=>{
  muted=!muted;stageSound.unlock();displaySound();
  if(!muted)stageSound.play('tick');
  try{localStorage.setItem('dengxia-muted',muted?'1':'0')}catch{}
};
// Input chooses a destination. Only the simulation advances a physical control.
let propTravel=null;
const propRates={chair:40,lamp:65,angle:75};
function mayAdjust(k){
  return playing&&Object.hasOwn(propRates,k)&&nearTool(k)&&!pendingCut&&!contactRun&&
    (!sceneBusy()||k==='chair'&&beat==='chair'||k===visual.tuning&&beat==='tune');
}
function requestedMark(k){return propTravel?.key===k?propTravel.goal:s[k]}
function stopPropTravel(){propTravel=null}
function adjustProp(k,v){
  if(!Number.isFinite(v)||!mayAdjust(k))return;
  if(k==='angle'&&s.b>31&&s.b<69){render('等拾影走到岸边，才能转动窗棂。');return}
  const goal=Math.max(0,Math.min(100,Math.round(v)));
  if(propTravel?.key===k){propTravel.goal=goal;return}
  if(goal!==s[k])propTravel={key:k,goal,position:s[k]};
}
function advanceProp(dt){
  const travel=propTravel;if(!travel)return false;
  const k=travel.key;
  if(!mayAdjust(k)||document.hidden||document.querySelector('dialog[open]')){stopPropTravel();return false}
  const delta=travel.goal-travel.position;
  const distance=Math.min(Math.abs(delta),propRates[k]*Math.min(dt,.05));
  travel.position=distance===Math.abs(delta)?travel.goal:travel.position+Math.sign(delta)*distance;
  const mark=Math.round(travel.position),previous=s[k],aligned=isAligned();
  if(travel.position===travel.goal)stopPropTravel();
  if(mark===previous){
    if(!propTravel)save();
    return false;
  }
  s[k]=mark;
  if(k!=='angle'){
    const scale=k==='chair'?.24:.09;s.a+=(mark-previous)*scale;
    visual.a=s.a;
  }
  if(!aligned&&isAligned())stageSound.play('tick');
  else if(Math.floor(mark/5)!==Math.floor(previous/5))stageSound.play(k==='angle'?'turn':'slide');
  render();
  if(beat==='chair'||beat==='tune'){
    el('carryRange').value=el('carryRead').value=mark;
    if(beat==='chair'&&!draw)paintBeat('chair',mark/100,'a');
  }
  if(!propTravel||performance.now()-lastSave>350){save();lastSave=performance.now()}
  return k==='chair';
}
function objectAction(){
  if(!nearMain()||sceneBusy())return;
  if(s.stage===0){playContact(stageProp('lamp'),'a',0,action,'light');return}

  action();
}
const mechanism=window.makeMechanism(el('object'),{allowed:allowHandle,onMove:adjustProp,onAction:objectAction,onClue:text=>caption('匣中手记',text),onSound:name=>stageSound.play(name)});
el('action').onclick=interactHere;
function syncTraveller(){
  const track=el('crossing');
  const show=playing&&!wide&&(s.stage===2||s.stage===3)&&s.role==='b';
  track.hidden=!show;
  if(show){
    track.style.setProperty('--facing',visual.dir.b);track.style.setProperty('--position',((s.b-21)/55*94+3)+'%');
    track.style.setProperty('--target',s.stage===2?'92%':'8%');
    track.classList.toggle('broken',s.stage===3&&!isAligned());
  }
}
function syncImmersion(){
  const act=acts[s.stage];
  el('portrait').disabled=!playing;el('carry').hidden=!playing||s.stage!==1||s.role!=='a';
  el('actNumber').textContent=act[0];el('place').textContent=act[1];
  const plate=plates[s.stage];
  if(plate!==previousPlate){el('backdrop').style.backgroundImage='url('+plate+')';stageNode.style.setProperty('--plate','url('+plate+')');previousPlate=plate}
  if(lastAct!==s.stage){stageSound.scene(s.stage);lastAct=s.stage}
  stageNode.dataset.act=String(s.stage);
  stageNode.classList.toggle('wide',wide);
  stageNode.classList.toggle('in-play',playing);
  el('view').textContent=wide?'机关特写':'戏台全景';
  el('view').disabled=!playing;el('inspect').hidden=!playing||wide;
  el('switch').setAttribute('aria-label',s.role==='a'?'换拾影':'换阿照');

  el('guide').textContent=act[2]+(wide?'　走近物件后可操作。':'　移动时切至戏台全景。');
  el('drawer').style.display=wide?'':'none';
  el('action').disabled=!playing||s.stage===4;
  el('left').disabled=el('right').disabled=!playing||s.stage===4;
  el('hint').disabled=!playing;
  const projection=el('projection');
  projection.hidden=!playing||![1,3].includes(s.stage);
  if(!projection.hidden){
    const [lo,hi]=ends();
    projection.style.setProperty('--left',lo+'%');projection.style.setProperty('--right',(100-hi)+'%');
    projection.classList.toggle('aligned',isAligned());
  }
  mechanism.update(s.stage,s,playing&&!wide);
  syncTraveller();syncCase();refreshReach();
}
el('view').onclick=()=>{
  if(sceneBusy())return;
  const toggle=()=>{stopMovement();wide=!wide;stageSound.play('open');render()};
  if(wide&&s.stage<4){const name=closeupProp();if(!name)return;
    playContact(stageProp(name),name==='bell'?'b':'a',name==='bell'?.98:0,toggle);
  }else dissolve(toggle)
};



el('inspect').onclick=()=>{if(allowHandle('drawer'))mechanism.inspectRear()};
