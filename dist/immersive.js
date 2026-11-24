// The scene owns every visible control. The inventory and settings are opened
// on demand so that neither changes the camera viewport.
const immersiveRoot=el('gameLayout'), immersiveStage=document.querySelector('.stage');
const paths={
 bag:'M5 8h14l1 12H4L5 8Zm3 0V6a4 4 0 0 1 8 0v2',
 role:'M4 7h15l-3-3m4 13H5l3 3M7 10v4m10-4v4',
 menu:'M4 6h16M4 12h16M4 18h16',
 close:'M6 6l12 12M18 6 6 18',
 hand:'M6 13V9a1.3 1.3 0 0 1 2.6 0v2-6a1.3 1.3 0 0 1 2.6 0v6-7a1.3 1.3 0 0 1 2.6 0v7-5a1.3 1.3 0 0 1 2.6 0v7l1.6-2a1.5 1.5 0 0 1 2.3 1.8l-4 7H9l-5-6a1.3 1.3 0 0 1 2-1.7L8 15'
};
function pictogram(name){return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="'+paths[name]+'" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
function markButton(b,name,label){
 b.innerHTML=pictogram(name);b.setAttribute('aria-label',label);b.title=label;b.classList.add('symbol');
}
function makeButton(id,label){const b=document.createElement('button');b.id=id;b.type='button';b.textContent=label;return b}
const nav=document.createElement('nav');nav.id='sceneNav';nav.setAttribute('aria-label','随身物件和游戏设置');
const pocket=makeButton('pocket','随身装备'),options=makeButton('options','戏台菜单');
markButton(pocket,'bag','随身装备');markButton(options,'menu','戏台菜单');markButton(el('switch'),'role','切换人物');
nav.append(el('switch'),pocket,options);immersiveRoot.append(nav);
function makeSheet(id,title){
 const dialog=document.createElement('dialog');dialog.id=id;dialog.className='sceneSheet';
 const h=document.createElement('h2');h.id=id+'Title';h.textContent=title;dialog.setAttribute('aria-labelledby',h.id);
 const close=makeButton(id+'Close','合上');markButton(close,'close','合上');
 close.onclick=()=>dialog.close();dialog.append(h,close);dialog.addEventListener('click',e=>{
   const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();
 });document.body.append(dialog);return dialog;
}
const pack=makeSheet('pack','随身装备');pack.append(el('caseArea'));
const menu=makeSheet('sceneMenu','戏台');const expand=makeButton('expandView','进入全屏');
menu.append(el('sound'),el('portrait'),el('view'),el('inspect'),expand,el('reset'));
function showSheet(d){
 if(contactRun||pendingCut)return;
 if(d===pack&&(!playing||!s.stage||beat))return;
 stopMovement();syncCase();if(!d.open)d.showModal();
}
pocket.onclick=()=>showSheet(pack);options.onclick=()=>showSheet(menu);
for(const id of ['portrait','view','inspect'])el(id).addEventListener('click',()=>menu.close());
el('reset').addEventListener('click',()=>menu.close());
expand.hidden=!document.fullscreenEnabled;
expand.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();menu.close()}catch{expand.textContent='当前窗口已铺满'}};
document.addEventListener('fullscreenchange',()=>{expand.textContent=document.fullscreenElement?'退出全屏':'进入全屏'});
const paper=el('evidenceDetail');immersiveRoot.append(paper);const reply=document.createElement('p');reply.id='fieldReply';paper.firstElementChild.append(reply);
const inspectPack=makeButton('inspectPack','随身装备');inspectPack.onclick=()=>showSheet(pack);paper.querySelector('.caseActions').prepend(inspectPack);
const touch=document.createElement('div');touch.id='fieldTouch';
const pad=document.createElement('div');pad.id='crossPad';
const up=makeButton('stepUp','↑'),down=makeButton('stepDown','↓');const buttons=[up,el('left'),el('right'),down];
buttons.forEach((b,i)=>{b.textContent=['↑','←','→','↓'][i];b.setAttribute('aria-label',['向后方走','向左走','向右走','向前方走'][i]);pad.append(b)});
for(const [b,dir] of [[up,-1],[down,1]]){
 let origin=null;
 b.onpointerdown=e=>{if(!playing||sceneBusy()||e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);origin=s.depth[s.role];heldDepth=dir;depthTap=0};
 b.onpointerup=()=>{if(origin!==null)depthTap=dir*Math.max(0,.12-Math.abs(s.depth[s.role]-origin));origin=null;heldDepth=0};
 b.onpointercancel=b.onlostpointercapture=()=>{origin=null;heldDepth=0};
 b.onclick=e=>{if(!e.detail&&!sceneBusy())depthTap=dir*.12};
}
const interact=el('action');markButton(interact,'hand','互动');const legend=document.createElement('span');legend.textContent='互动';interact.append(legend);
touch.append(pad,interact);immersiveRoot.append(touch);
const carry=el('carryControl');carry.firstChild.textContent='';const captionLabel=document.createElement('span');captionLabel.id='carryCaption';captionLabel.textContent='椅轨';carry.prepend(captionLabel);
const trackMount=document.createElement('span');trackMount.className='markedTrack';
el('carryRange').before(trackMount);trackMount.append(el('carryRange'));
const propLayer=document.createElement('div');propLayer.id='sceneProps';immersiveStage.append(propLayer);
const propNames={lamp:'铜灯座',chair:'木椅',lock:'影轨尺座',window:'窗轴',bell:'铜铃'};
function useSceneProp(name){
 if(sceneBusy()||!playing)return;
 if(name==='lamp'&&s.stage===1&&nearTool('lamp'))return openTuning('lamp');
 if(name==='chair'&&nearTool('chair'))return el('carry').click();
 if(name==='window'&&nearTool('angle'))return clueReady()?openTuning('angle'):startExamine(2);
 if(name===mainProp()&&nearMain()){
   if(name==='lock'&&!clueReady())return startExamine(2);
   objectAction();
 }
}
const propButtons={};for(const [name,label] of Object.entries(propNames)){
 const b=makeButton('prop-'+name,'');b.innerHTML=etchIcon(name);b.className='propPoint';b.setAttribute('aria-label',label);b.title=label;b.hidden=true;b.onclick=()=>useSceneProp(name);propLayer.append(b);propButtons[name]=b;
}
function positionPropPins(hits){
 const show=playing&&wide&&!sceneBusy()&&s.stage<4;
 for(const [name,b] of Object.entries(propButtons)){
   const p=hits.find(h=>h.name===name);const allowed=name==='lamp'&&s.stage===1?nearTool('lamp'):name==='chair'?nearTool('chair'):name==='window'?nearTool('angle'):nearMain();
   // A mounted instrument and its evidence socket share the same physical spot.
   const shared=(name==='window'||name==='lock')&&!clueReady();
   b.hidden=!show||!p||p.d<=0||p.x<.025||p.x>.975||p.y<.03||p.y>.97||!allowed||shared;
   if(!b.hidden){b.style.left=p.x*100+'%';b.style.top=p.y*100+'%'}
 }
}
function syncImmersive(){
 const next=nextImpression(),free=!beat&&examining===null&&!contactRun&&!pendingCut;
 const holding=i=>selectedPieces.length===1&&selectedPieces[0]===i;
 const receiver=(examining===2&&!clueReady())||(examining===1&&s.stage===3&&!s.kit[3].opened);
 el('mountImprint').hidden=!receiver||!cluesActive()||!wide;
 el('mountImprint').setAttribute('aria-label',holding(examining===2?2:3)?'将手中物件嵌入轮廓':'为这处轮廓选择物件');
 const needsPiece=examining===2&&!clueReady()&&!holding(2)||s.stage===3&&examining===1&&!s.kit[3].opened&&!holding(3);
 for(const b of [pocket,el('switch'),inspectPack])b.classList.toggle('nextEtch',free&&b.id===next?.control||needsPiece&&b===inspectPack);
 for(const [name,b] of Object.entries(propButtons))b.classList.toggle('nextEtch',free&&next?.prop===name);
 const k=beat==='chair'?'chair':visual.tuning;
 if(k){carry.style.setProperty('--markRatio',placementMarks[k]/100);carry.classList.toggle('onMark',fitsMark(k,s[k]))}
 guideCanvas.hidden=!playing||!wide||!!(s.alcove||contactRun||pendingCut||beat==='portrait')||s.stage===4;
 const blocked=sceneBusy();
 el('portrait').disabled=!playing||blocked;
 el('view').disabled=el('view').disabled||blocked;
 el('inspect').disabled=el('inspect').disabled||blocked;
 touch.hidden=!playing||blocked||s.stage===4;
 nav.hidden=!playing||!!contactRun||!!pendingCut;
 pocket.disabled=!playing||s.stage<1||!!beat;el('switch').hidden=!!(examining!==null||beat||s.alcove||s.stage===0||s.stage===4);
 reply.textContent=examining!==null?el('caseNote').textContent:'';
 immersiveRoot.classList.toggle('examining',examining!==null);
}
el('mountImprint').onclick=()=>{
 if(!cluesActive()||examining===null||!nearSite(examining))return;
 const expected=examining===2?2:3;
 if(selectedPieces.length===1&&selectedPieces[0]===expected)changeItem(examining);
 else showSheet(pack);
};
function exitDetail(){if(examining!==null)finishExamine();else if(beat==='tune'||beat==='chair'||beat==='portrait')el('leaveBeat').click();else if(!wide)el('view').click()}
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 const k=e.key.toLowerCase(),d=document.querySelector('dialog[open]');
 if(d){
   // Closing the bag must leave the clue underneath it open.
   if(k==='escape'||(d===pack&&['i','b'].includes(k))){e.preventDefault();e.stopImmediatePropagation();d.close()}
   return;
 }
 if(!playing){if((k==='enter'||k===' ')&&!e.repeat&&!el('overlay').classList.contains('closed')){e.preventDefault();e.stopImmediatePropagation();el('start').click()}return}
 if(contactRun||pendingCut)return;
 if(k==='i'||k==='b'){e.preventDefault();if(!e.repeat)showSheet(pack);return}
 if(k==='v'&&!sceneBusy()){e.preventDefault();if(!e.repeat)el('view').click();return}
 if(k==='r'&&!wide&&allowHandle('drawer')){e.preventDefault();if(!e.repeat)el('inspect').click();return}
 if(k==='escape'){e.preventDefault();e.stopImmediatePropagation();if(examining!==null||beat||!wide)exitDetail();else if(!s.alcove)showSheet(menu);return}
 if((beat==='tune'||beat==='chair')&&['arrowleft','arrowright','a','d','arrowup','arrowdown','home','end'].includes(k)){
   e.preventDefault();e.stopImmediatePropagation();const field=visual.tuning||'chair';
   const direction=['a','arrowleft','arrowdown'].includes(k)?-1:1;
   adjustProp(field,k==='home'?0:k==='end'?100:requestedMark(field)+direction*(e.shiftKey?5:1));return;
 }
 if(k==='e'||k===' '){
   if(e.target.tagName==='BUTTON'&&k===' '&&document.activeElement?.matches('dialog button,#instruments button,#performBar button,#evidenceDetail button'))return;
   e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
   if(examining!==null){if(el('handleItem').disabled)finishExamine();else changeItem(examining)}
   else if(beat)exitDetail();else if(!s.alcove)interactHere();else if(el('instruments').contains(document.activeElement))document.activeElement.click();
 }else if(s.alcove&&['arrowleft','arrowright','arrowup','arrowdown'].includes(k)){
   const keys=Array.from(el('instruments').children),i=keys.indexOf(document.activeElement);e.preventDefault();keys[(i+(k==='arrowleft'||k==='arrowup'?-1:1)+keys.length)%keys.length].focus();
 }
},true);


let propDrag=null;
immersiveStage.addEventListener('pointerdown',e=>{
 if(propDrag||!e.isPrimary||e.target!==stageCanvas||!['tune','chair'].includes(beat)||e.button!==0)return;
 const k=visual.tuning||'chair';propDrag={id:e.pointerId,x:e.clientX,base:s[k],k};
 e.preventDefault();stageCanvas.setPointerCapture(e.pointerId);
});
immersiveStage.addEventListener('pointermove',e=>{
 if(!propDrag||propDrag.id!==e.pointerId||!['tune','chair'].includes(beat)||propDrag.k!==(visual.tuning||'chair'))return;
 const {x,base,k}=propDrag;adjustProp(k,base+(e.clientX-x)*100/(stageCanvas.clientWidth*.65));
 el('carryRead').value=el('carryRange').value=s[k];
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])immersiveStage.addEventListener(type,e=>{
 if(propDrag?.id!==e.pointerId)return;
 propDrag=null;if(type==='pointercancel')stopPropTravel();
});
window.addEventListener('blur',()=>{propDrag=null});
