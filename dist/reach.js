// The game has two horizontal walking lanes. Props on the floor belong to
// Azhao's lane; Shiying can touch the bell on the raised bridge.
const reachRadius=.77;
function inReach(point,role){
  return s.role===role&&Math.abs(wx(s[role])-point[0])<=reachRadius;
}
function mainProp(){
  return ['lamp','lock','bell','bell'][s.stage];
}
function nearMain(){
  return playing&&s.stage<4&&inReach(stageProp(mainProp()),s.stage<2?'a':'b');
}
function nearSite(i){
  return s.stage>=1&&s.stage<=3&&inReach(window.relicSpots(s.stage)[i],'a');
}
function nearTool(k){
  if(!playing||s.role!=='a')return false;
  if(k==='angle')return s.stage===3&&inReach(stageProp('window'),'a');
  return s.stage===1&&['lamp','chair'].includes(k)&&inReach(stageProp(k),'a');
}
function closeupProp(){
  if(nearMain())return mainProp();
  if(nearTool('chair'))return 'chair';
  if(nearTool('lamp'))return 'lamp';
  if(nearTool('angle'))return 'window';
  return null;
}
function allowHandle(id){
  if(sceneBusy()||!playing)return false;
  if(id==='act')return nearMain();
  if(id==='drawer')return !!closeupProp();
  return nearTool(id);
}
function nearestInteraction(){
  if(!playing||s.stage===4)return null;
  const name=['点灯','固定影桥','拉响铜铃','牵袖拉铃'][s.stage];
  if(nearMain()&&(s.stage!==1||clueReady()))return {name,run:objectAction};
  if(s.role==='a'&&s.stage>0){
    const i=window.relicSpots(s.stage).findIndex((_,i)=>nearSite(i));
    if(i>=0)return {name:'查看'+evidence[s.stage].sites[i],run:()=>startExamine(i)};
    if(nearTool('chair'))return {name:'搬动木椅',run:()=>el('carry').click()};
    if(nearTool('lamp'))return {name:'调整灯座',run:()=>{showConsole('tools');el('lamp').focus({preventScroll:true})}};
  }
  return null;
}
function interactHere(){
  if(!sceneBusy())nearestInteraction()?.run();
}
function refreshReach(){
  const local=nearestInteraction(),active=playing&&s.stage<4;
  el('action').disabled=!local||sceneBusy();el('action').textContent=local?.name||'互动';
  for(const k of ['chair','lamp','angle'])el(k).disabled=!nearTool(k);
  el('carry').disabled=!nearTool('chair');
  el('view').disabled=!playing||wide&&!closeupProp()&&s.stage!==4;
  el('inspect').disabled=!closeupProp();
  el('caseTab').disabled=s.stage<1;
  const siteButtons=el('siteList').children;
  for(let i=0;i<siteButtons.length;i++){
    const enabled=nearSite(i);siteButtons[i].disabled=!enabled;
    const base=evidence[s.stage]?.sites[i];
    if(base){
      const direction=wx(s.a)<window.relicSpots(s.stage)[i][0]?'右侧':'左侧';
      const name=enabled?base:base+' · '+(s.role==='a'?direction:'台前');
      if(siteButtons[i].textContent!==name)siteButtons[i].textContent=name;
    }
    const pin=el('worldPins').children[i];if(pin)pin.disabled=!enabled;
  }
  const names=['灯架','影轨尺座','东岸铜铃','左岸铜铃'];
  const goal=active?stageProp(mainProp())[0]:0;
  el('reachStatus').textContent=!active?'':local?'身旁 · '+local.name:
    s.stage>1&&s.role==='a'?'阿照可调查台前物件，拾影可触碰桥铃。':
    s.stage===1&&s.role==='b'?'台前的灯、椅和尺座由阿照操作。':
    '向'+(wx(s[s.role])<goal?'右':'左')+'靠近'+names[s.stage]+'后可互动';
}
function showConsole(which){
  const bag=which==='case';el('toolsPage').hidden=bag;el('itemsPage').hidden=!bag;
  el('toolsTab').setAttribute('aria-pressed',String(!bag));el('caseTab').setAttribute('aria-pressed',String(bag));
  el('consoleScroll').scrollTop=0;
}

