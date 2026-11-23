let beat='',portraitRole='a';
function sceneBusy(){return Boolean(pendingCut||contactRun||examining!==null||s.alcove||beat&&beat!=='glimpse')}
function lockStage(locked){
  document.querySelector('.controls').inert=locked;el('extras').inert=locked;
  el('object').inert=locked;el('propCommands').inert=locked;
  syncCase();refreshReach();
  el('drawer').inert=locked||!wide||s.role!=='a'||![1,3].includes(s.stage);
}
function closePerformance(){
  propDrag=null;stopPropTravel();
  visual.tuning=null;visual.work=null;visual.shot=null;stageNode.classList.remove('model-shot');redrawUntil=performance.now()+900;
  beat='';el('performance').hidden=true;el('performance').classList.remove('glimpse');
  lockStage(Boolean(s.alcove));
}
function paintBeat(kind,progress,role){
  if(draw){
    visual.shot={kind,progress,role};stageNode.classList.add('model-shot');redrawUntil=performance.now()+900;
  }else window.performBeat(el('performFrame'),kind,Math.max(0,Math.min(1,progress)),role);
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
el('portrait').onclick=()=>inspectFace(s.role);
el('otherFace').onclick=()=>dissolve(()=>inspectFace(portraitRole==='a'?'b':'a'));
el('carry').onclick=()=>playContact(stageProp('chair'),'a',0,()=>{
  openBeat('chair');
  s.a=36+s.chair*.24;visual.a=s.a;save();
  if(draw)visual.work={height:0,moving:0};
  el('performTitle').textContent='阿照 · 搬椅';
  el('carryCaption').textContent='椅轨';el('carryRead').value=el('carryRange').value=s.chair;paintBeat('chair',s.chair/100,'a');el('carryRange').focus({preventScroll:true});
},'lift');
el('carryRange').oninput=e=>{const k=visual.tuning||'chair';adjustProp(k,+e.target.value);el('carryRead').value=s[k]};
function openTuning(k){
  if(!nearTool(k)||sceneBusy())return;
  const name=k==='angle'?'window':'lamp';
  playContact(stageProp(name),'a',0,()=>{
    openBeat('tune');visual.tuning=k;visual.shot={kind:'tune',role:'a',progress:0};stageNode.classList.add('model-shot');
    el('performTitle').textContent=k==='angle'?'旧窗棂':'铜灯座';
    el('carryCaption').textContent=k==='angle'?'窗轴':'灯轨';
    el('carryControl').hidden=false;el('carryRange').value=s[k];el('carryRead').value=s[k];
    el('carryRange').focus({preventScroll:true});redrawUntil=performance.now()+800;
  });
}
const returnButton=el('leaveBeat');
function returnToStage(){
  if(!beat||pendingCut||contactRun)return;
  dissolve(()=>{closePerformance();el('options').focus({preventScroll:true})});
}
returnButton.onclick=returnToStage;
// A touch immediately following a drag can end without a synthesized click.
let returnTouch=null;
returnButton.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'&&e.isPrimary)returnTouch={id:e.pointerId,x:e.clientX,y:e.clientY};
});
returnButton.addEventListener('pointerup',e=>{
  if(returnTouch?.id!==e.pointerId)return;
  const travel=Math.hypot(e.clientX-returnTouch.x,e.clientY-returnTouch.y);
  returnTouch=null;
  if(travel<12&&returnButton.contains(document.elementFromPoint(e.clientX,e.clientY)))returnToStage();
});
for(const event of ['pointercancel','lostpointercapture'])returnButton.addEventListener(event,e=>{
  if(returnTouch?.id===e.pointerId)returnTouch=null;
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(beat==='chair'||beat==='tune'||beat==='portrait'))el('leaveBeat').click()});

function advanceCarry(dt,moved){
  const w=visual.work;if(!w)return;
  const rate=moved?1:0;
  w.moving+=(rate-w.moving)*(1-Math.exp(-dt*12));
  w.height=.115*w.moving;
  redrawUntil=performance.now()+300;
}
