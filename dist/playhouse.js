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
let previousChair=s.chair;
function adjustProp(k,v){
  if(!playing||s.role!=='a'){render('此处需要阿照掌灯，先切换角色。');return}
  if((s.stage===1&&!['chair','lamp'].includes(k))||(s.stage===3&&k!=='angle')||![1,3].includes(s.stage))return;
  if(s.stage===3&&s.b>31&&s.b<69){render('等拾影走到岸边，才能转动窗棂。');return}
  const value=Math.max(0,Math.min(100,Math.round(v)));
  if(!Number.isFinite(value)||s[k]===value)return;
  const aligned=isAligned();if(k==='chair')previousChair=s.chair;s[k]=value;
  stageSound.play(!aligned&&isAligned()?'tick':k==='angle'?'turn':'slide');
  render();save();
  if(k==='chair')showCarry(value);
}
function objectAction(){
  if(!playing||sceneBusy())return;
  if(s.stage===0&&s.a<=28){playContact(stageProp('lamp'),'a',0,action,'light');return}

  action();
}
const mechanism=window.makeMechanism(el('object'),{onMove:adjustProp,onAction:objectAction,onClue:text=>caption('匣中手记',text),onSound:name=>stageSound.play(name)});
el('action').onclick=objectAction;
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
  el('switch').textContent=s.role==='a'?'换拾影':'换阿照';
  el('action').textContent=['点灯','固定影桥','拉响铜铃','牵袖拉铃','谢幕'][s.stage];
  el('guide').textContent=act[2]+(wide?'　可拖动画面环视，或切回机关特写。':'　移动时切至戏台全景。');
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
  syncTraveller();syncCase();
}
el('view').onclick=()=>{
  if(sceneBusy())return;
  const toggle=()=>{stopMovement();wide=!wide;stageSound.play('open');render()};
  if(wide&&s.stage<4){const name=['lamp','lock','bell',s.role==='a'?'window':'bell'][s.stage];
    playContact(stageProp(name),name==='bell'?'b':'a',name==='bell'?.98:0,toggle);
  }else dissolve(toggle)
};



el('inspect').onclick=()=>mechanism.inspectRear();
