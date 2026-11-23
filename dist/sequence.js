let beat='',beatTimer=0,beatFrame=0,portraitRole='a';
function sceneBusy(){return Boolean(pendingCut||contactRun||examining!==null||s.alcove||beat&&beat!=='glimpse')}
function lockStage(locked){
  document.querySelector('.controls').inert=locked;
  el('object').inert=locked;el('propCommands').inert=locked;
  syncCase();
  el('drawer').inert=locked||!wide||s.role!=='a'||![1,3].includes(s.stage);
}
function closePerformance(){
  clearTimeout(beatTimer);cancelAnimationFrame(beatFrame);
  visual.work=null;visual.shot=null;stageNode.classList.remove('model-shot');redrawUntil=performance.now()+900;
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
function showCarry(value){
  if(beat!=='chair'){
    // Keep a wide-view drag on the stage, with both hands following the rail.
    if(!beat&&wide&&draw){
      if(!visual.work)visual.work={position:previousChair,height:0,moving:0};
      clearTimeout(beatTimer);const finish=()=>{if(beat)return;if(visual.work&&Math.abs(visual.work.position-s.chair)>.04){beatTimer=setTimeout(finish,160);return}visual.work=null;redrawUntil=performance.now()+900};
      beatTimer=setTimeout(finish,500);
    }
    return;
  }
  el('carryRead').value=value;el('carryRange').value=value;
  paintBeat('chair',value/100,'a');
}
el('portrait').onclick=()=>inspectFace(s.role);
el('otherFace').onclick=()=>dissolve(()=>inspectFace(portraitRole==='a'?'b':'a'));
el('carry').onclick=()=>playContact(stageProp('chair'),'a',0,()=>{
  openBeat('chair');
  if(draw){visual.work={position:s.chair,height:0,moving:0}}
  el('performTitle').textContent='阿照 · 搬椅';
  showCarry(s.chair);el('carryRange').focus({preventScroll:true});
},'lift');
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
