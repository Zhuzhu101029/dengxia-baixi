let beat='',beatTimer=0,beatFrame=0,portraitRole='a';
function sceneBusy(){return Boolean(s.passage||beat&&beat!=='glimpse')}
function lockStage(locked){
  document.querySelector('.controls').inert=locked;
  el('object').inert=locked;
  el('drawer').inert=locked||!wide||s.role!=='a'||![1,3].includes(s.stage);
}
function closePerformance(){
  clearTimeout(beatTimer);cancelAnimationFrame(beatFrame);
  visual.work=null;stageNode.classList.remove('working');
  beat='';el('performance').hidden=true;el('performance').classList.remove('glimpse');
  lockStage(Boolean(s.passage));
}
function paintBeat(kind,progress,role){
  window.performBeat(el('performFrame'),kind,Math.max(0,Math.min(1,progress)),role);
}
function openBeat(mode){
  closePerformance();stopMovement();beat=mode;
  el('performance').hidden=false;el('faceLine').hidden=mode!=='portrait';el('carryControl').hidden=mode!=='chair';
  el('otherFace').hidden=mode!=='portrait';el('leaveBeat').hidden=mode==='lamp';
  lockStage(true);
}
const portraitLines={
  a:['我收工前亲手倒的灯油。你摸摸，壶嘴还干着呢。','这把椅子看着轻，左后腿里灌过铅。来，搭把手。','师父教我，唱错了就接着唱。可这锣鼓点，怎么从桥底下传上来了？','那窗棂我小时候钻过。最底下那格，衣裳一勾就破。','先别灭灯。我还想看一眼门外。'],
  b:['没亮灯的时候，我只听得见。方才敲门的那位，手上戴着个顶针。','那块袖口别丢。我就这么一身行头，少了一角，上台漏风。','我认得这个声儿。东头那只铃裂过，最后一下总有点哑。','我娘针脚密，只有这儿缝歪了。那天我急着上台，一直催她。','方才那个人冲我招手。阿照，我没跟他说过我叫什么。']
};
function inspectFace(role){
  openBeat('portrait');portraitRole=role;el('faceLine').textContent=portraitLines[role][s.stage];
  el('performTitle').textContent=role==='a'?'阿照 · 掌灯人':'拾影 · 幕中小生';
  el('otherFace').textContent=role==='a'?'看拾影':'看阿照';paintBeat('portrait',0,role);
  el('leaveBeat').focus({preventScroll:true});
}
function showCarry(value){
  if(beat!=='chair'){
    if(beat&&beat!=='glimpse')return;
    beat='glimpse';el('performance').classList.add('glimpse');el('performance').hidden=false;
    clearTimeout(beatTimer);beatTimer=setTimeout(closePerformance,1000);
  }
  el('carryRead').value=value;el('carryRange').value=value;
  paintBeat('chair',value/100,'a');
}
function lightWick(){
  openBeat('lamp');el('performTitle').textContent='阿照 · 点灯';
  const start=performance.now(),duration=reduced?500:1550;
  let lit=false;
  function frame(now){
    if(beat!=='lamp')return;
    const p=Math.min(1,(now-start)/duration);paintBeat('lamp',p,'a');
    if(!lit&&p>=.59){stageSound.play('lamp');lit=true}
    if(p<1)beatFrame=requestAnimationFrame(frame);
    else{closePerformance();action();el('action').focus({preventScroll:true})}
  }
  frame(start);
}
function openPassage(target){
  closePerformance();stopMovement();s.passage=target;save();lockStage(true);
  const gate=el('passage');gate.hidden=false;gate.dataset.destination=String(target);
  el('gateTitle').textContent=target===2?'穿过后台角门':'回到旧戏楼';
  el('gateTask').textContent=target===2?'向右抽出门闩':'向下拉绳，升起门帘';
  el('enterGate').textContent=target===2?'走上雨桥':'走进戏楼';
  el('gateRange').value=s.latch;drawGate();el('gateRange').focus({preventScroll:true});
}
function drawGate(){
  const p=s.latch/100,gate=el('passage');
  gate.style.setProperty('--bolt',p*94+'%');
  gate.style.setProperty('--hinge',Math.max(0,p-.6)*180+'deg');
  gate.style.setProperty('--lift',(-p*94)+'%');
  el('enterGate').disabled=s.latch<98;
}
function moveLatch(value){
  s.latch=Math.max(0,Math.min(100,Math.round(value)));
  el('gateRange').value=s.latch;drawGate();stageSound.play(s.passage===2?'slide':'turn');save();
}
el('gateRange').oninput=e=>moveLatch(+e.target.value);
const gateHandle=el('passage').querySelector('.barrier');
let gateDrag=null;
gateHandle.onpointerdown=e=>{
  if(!s.passage||e.button!==0||gateDrag)return;
  e.preventDefault();gateHandle.setPointerCapture(e.pointerId);
  gateDrag={id:e.pointerId,x:e.clientX,y:e.clientY,base:s.latch};
};
gateHandle.onpointermove=e=>{
  if(!gateDrag||e.pointerId!==gateDrag.id)return;
  const rect=gateHandle.parentElement.getBoundingClientRect();
  const delta=s.passage===2?(e.clientX-gateDrag.x)/(.28*rect.width):(e.clientY-gateDrag.y)/(.38*rect.height);
  moveLatch(gateDrag.base+delta*100);
};
gateHandle.onlostpointercapture=gateHandle.onpointerup=gateHandle.onpointercancel=()=>{gateDrag=null};
el('enterGate').onclick=()=>{
  if(!s.passage||s.latch<98)return;
  const next=s.passage;s.passage=0;s.latch=0;el('passage').hidden=true;
  changeStage(next,true);el('action').focus({preventScroll:true});
};
el('portrait').onclick=()=>inspectFace(s.role);
el('otherFace').onclick=()=>inspectFace(portraitRole==='a'?'b':'a');
el('carry').onclick=()=>{
  openBeat('chair');
  if(draw){visual.work={position:s.chair,height:0,moving:0};stageNode.classList.add('working')}
  el('performTitle').textContent='阿照 · 搬椅';
  showCarry(s.chair);el('carryRange').focus({preventScroll:true});
};
el('carryRange').oninput=e=>adjustProp('chair',+e.target.value);
el('leaveBeat').onclick=()=>{const trigger=beat==='chair'?'carry':'portrait';closePerformance();el(trigger).focus({preventScroll:true})};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(beat==='chair'||beat==='portrait'))el('leaveBeat').click()});

function advanceCarry(dt){
  const w=visual.work;if(!w)return;
  const delta=s.chair-w.position;
  w.position+=Math.sign(delta)*Math.min(Math.abs(delta),dt*30);
  const rate=Math.abs(delta)>.03?1:0;
  w.moving+=(rate-w.moving)*(1-Math.exp(-dt*12));
  w.height=.115*w.moving;
  redrawUntil=performance.now()+300;
}
