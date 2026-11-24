// The etched pattern is shared by the loose piece, its inventory entry and its socket.
const placementMarks={chair:65,lamp:55,angle:70};
function fitsMark(key,value){return Math.abs(value-placementMarks[key])<=5}
const etchPaths={
 rulerL:'M5 15H31V21H25V28H31V34H5ZM11 16V24M16 16V20M21 16V24',
 rulerR:'M18 15H43V34H18V28H12V21H18ZM31 16V24M36 16V20',
 ruler:'M3 16H45V33H3ZM24 16V22H19V27H24V33M9 17V24M14 17V21M31 17V24M37 17V21',
 clapper:'M20 16A4 4 0 1 1 28 16L26 28Q33 31 31 36Q24 44 17 36Q15 31 22 28ZM23 16H25',
 cord:'M8 32C5 22 12 12 23 14C38 15 38 31 28 34C19 38 12 30 16 23C20 16 30 19 29 25Q27 31 22 26M8 32L5 39M31 33L39 39',
 tied:'M21 18C10 7 22 2 25 9C31 1 38 9 26 18L24 26Q32 29 31 35Q25 42 18 36Q15 30 21 26ZM19 19L28 16M19 22L27 19',
 needle:'M10 38L31 10Q36 3 39 9Q41 15 34 18M10 38Q5 44 6 38L11 31',
 thread:'M9 10H31V15H9ZM11 16L29 19L11 21L29 24L11 27L29 30M9 31H31V36H9ZM30 34Q39 41 43 32',
 threaded:'M8 36L29 10Q34 4 37 9Q39 15 32 17M9 36Q4 42 5 36L10 29M9 34C15 22 22 39 29 32S39 30 42 25',
 key:'M6 18H29V12H33V18H36V12H40V18H43V26H6ZM10 22H16',
 chair:'M10 8H33V24H35V28H9V24H10ZM12 13H31M13 28V39M31 28V39',
 lamp:'M13 12H33L37 16H9ZM12 17H34L31 33H15ZM11 35H35M23 6V12M19 18V31M27 18V31',
 flame:'M24 4C28 15 18 17 24 22Q30 21 30 15C42 31 29 40 21 38C7 34 11 24 16 18Q16 25 20 24Q15 16 24 4Z',
 lock:'M7 17H14V31H7ZM32 17H39V31H32ZM13 21H33V26H13ZM23 21V10H29V21',
 bell:'M8 31Q15 27 15 19Q16 10 24 10Q33 10 34 19Q34 27 40 31ZM7 33H41M20 36Q24 43 28 36M22 8V5H26V8',
 window:'M8 7H39V39H8ZM14 10V36M26 10V36M11 18H36M11 29H36',
 bag:'M8 17H39L42 39H5ZM16 17V13A7 7 0 0 1 30 13V17',
 bridge:'M4 25H44M4 29H44M9 29V38M39 29V38M8 23Q24 6 40 23M16 18V24M24 15V24M32 18V24',
 check:'M9 24L19 34L39 12',role:'M8 15H39L32 8M39 32H8L15 39',join:'M8 24H38M30 16L38 24L30 32'
};
const etchSets=[null,['rulerL','rulerR','ruler'],['clapper','cord','tied'],['needle','thread','threaded','key']];
function etchIcon(name){return '<svg class="etchIcon" aria-hidden="true" viewBox="0 0 48 48"><path d="'+etchPaths[name]+'"/></svg>'}
function nextImpression(){
 if(!playing||s.stage===4||s.alcove)return null;
 if(s.stage===0)return {prop:'lamp',icon:'flame'};
 const row=s.kit[s.stage],parts=etchSets[s.stage];
 if(!row.installed){
   if(s.role!=='a')return {control:'switch'};
   for(let i=0;i<2;i++)if(!(row.mask&(1<<i)))return {site:i,icon:s.stage===3&&i===1&&!row.opened?'key':parts[i]};
   if(!row.made)return {control:'pocket'};
   return {site:2,icon:parts[2]};
 }
 if(s.stage===1){
   if(s.role!=='a')return {control:'switch'};
   for(const k of ['chair','lamp'])if(!fitsMark(k,s[k]))return {prop:k,icon:k};
   return {prop:'lock',icon:'lock'};
 }
 if(s.stage===3&&!fitsMark('angle',s.angle))return s.role==='a'?{prop:'window',icon:'window'}:{control:'switch'};
 return s.role==='b'?{prop:'bell',icon:'bell'}:{control:'switch'};
}
const etchGold='#ffe0a0',etchJade='#a2ead0';
function traceLine(ctx,project,points,done=false,dashed=true){
 const xy=points.map(project);
 if(xy.some(p=>!Number.isFinite(p[0]+p[1])||p[2]<=0))return;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
 xy.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.strokeStyle='#2b1f15bd';ctx.lineWidth=4.4;ctx.stroke();
 ctx.strokeStyle=done?etchJade:etchGold;ctx.lineWidth=2;
 if(dashed&&!done)ctx.setLineDash([5,4]);ctx.stroke();ctx.restore();
}
const etchShapes=new Map();
function seal(ctx,point,name,done=false,r=17){
 const [x,y,d]=point;if(d<=0)return;
 ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);
 ctx.fillStyle='#2c241be8';ctx.fill();ctx.strokeStyle=done?etchJade:etchGold;ctx.lineWidth=1.5;ctx.stroke();
 ctx.scale(r/25,r/25);ctx.translate(-24,-24);ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=2.6;
 if(!etchShapes.has(name))etchShapes.set(name,new Path2D(etchPaths[name]));
 ctx.stroke(etchShapes.get(name));ctx.restore();
}
function drawPlacement(key,x,y,z,mark,line,mini=false){
 const done=fitsMark(key,mark);
 function path(coords,solid=false){line(coords.map(([a,b,c=0])=>[x+a,y+b,z+c]),done,!solid)}
 if(key==='angle'){
   if(mini){path([[-.14,.98],[0,1.15],[.14,.98],[0,.80],[-.14,.98]]);return}
   const a=Math.PI*(.12+.76*placementMarks.angle/100),c=Math.cos(a),s=Math.sin(a);
   path([[.065*c-.020*s,.065*s+.020*c],[.172*c-.028*s,.172*s+.028*c],[.215*c,.215*s],[.172*c+.028*s,.172*s-.028*c],[.065*c+.020*s,.065*s-.020*c],[.065*c-.020*s,.065*s+.020*c]],true);return;
 }
 const wide=key==='chair'?.36:.245,deep=key==='chair'?.32:.23;
 path([[-wide,.018,-deep],[wide,.018,-deep],[wide,.018,deep],[-wide,.018,deep],[-wide,.018,-deep]]);
 if(key==='chair'){
   const seat=mini?.26:.56,top=mini?.86:1.27,back=mini?-.17:.25;
   path([[-.36,seat,-deep],[.36,seat,-deep],[.36,seat,deep],[-.36,seat,deep],[-.36,seat,-deep]]);
   for(const a of [-.29,.29]){
     path([[a,.03,-.25],[a,seat,-.25]]);path([[a,.03,.25],[a,seat,.25]]);
     path([[a,seat,back],[a,top,back]]);
   }
   path([[-.32,top,back],[.32,top,back],[.32,top-.13,back],[-.32,top-.13,back],[-.32,top,back]]);
 }else if(mini){
   path([[-.26,.03],[-.35,.10],[-.27,.23],[-.30,.58],[-.20,.85],[0,1.10],[.20,.85],[.30,.58],[.27,.23],[.35,.10],[.26,.03],[-.26,.03]]);
 }else{
   path([[-.12,.13],[-.12,1.77],[.48,1.77],[.48,1.67],[.12,1.67],[.12,.13]]);
   path([[.42,1.67],[.42,1.52],[.24,1.52],[.24,1.06],[.60,1.06],[.60,1.52],[.42,1.52]]);
 }
}
const guideCanvas=document.getElementById('placementTraces'),guideInk=guideCanvas.getContext('2d');
function drawStageTraces(project){
 const ctx=guideInk;if(!ctx)return;
 const width=guideCanvas.clientWidth,height=guideCanvas.clientHeight;if(!width||!height)return;
 const scale=Math.min(devicePixelRatio||1,2);
 if(guideCanvas.width!==Math.round(width*scale)||guideCanvas.height!==Math.round(height*scale)){guideCanvas.width=Math.round(width*scale);guideCanvas.height=Math.round(height*scale)}
 ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,width,height);
 if(!playing||!wide||contactRun||pendingCut||s.alcove||beat==='portrait'||s.stage===4)return;
 const at=p=>{const [x,y,d]=project(p);return [x*width,y*height,d]};
 const line=(points,done,dashed)=>traceLine(ctx,at,points,done,dashed);
 const next=nextImpression();
 const adjusting=visual.work?'chair':visual.tuning;
 const guideKey=next?.prop==='window'?'angle':next?.prop;
 if(adjusting||examining===null&&((s.stage===1&&['chair','lamp'].includes(guideKey))||guideKey==='angle')){
   const key=adjusting||guideKey;
   if(key==='angle'){
     const [x,,z]=relicSpots(3)[2];drawPlacement(key,x+.37,1.13,z+.25,s.angle,line);
   }else{
     const x=wx(key==='chair'?36+placementMarks.chair*.24:17+placementMarks.lamp*.09),z=key==='chair'?.24:.1;
     const current=wx(key==='chair'?36+s.chair*.24:17+s.lamp*.09);
     line([[current,.025,z+.35],[x,.025,z+.35]],fitsMark(key,s[key]),true);
     drawPlacement(key,x,0,z,s[key],line);
   }
   if(adjusting)return;
 }
 let pos,name,done=false;
 if(examining!==null){
   const row=s.kit[s.stage];pos=relicSpots(s.stage)[examining];name=s.stage===3&&examining===1&&!row.opened?'key':etchSets[s.stage][examining];
   done=examining===2?row.installed:Boolean(row.mask&(1<<examining));
 }else if(next?.site!==undefined){pos=relicSpots(s.stage)[next.site];name=next.icon}
 else if(next?.prop){pos=stageProp(next.prop);name=next.icon}
 if(!pos)return;
 const site=examining!==null?examining:next?.site,stage=s.stage;
 const lockedChest=stage===3&&site===1&&!s.kit[3].opened;
 if(site===2||lockedChest){
   const [sx,,sz]=relicSpots(stage)[site];
   // Map the outline into the front plane of the actual fitting.
   const [mx,my,mz]=lockedChest?[sx,.85,sz+.37]:
     stage===1?[sx,1.035,sz+.105]:stage===2?[sx,1.13,sz+.075]:[sx-.10,1.39,sz+.145];
   let strokes;
   if(lockedChest){
     strokes=[[[-.14,-.025],[.14,-.025],[.14,.025],[.11,.025],[.11,.055],[.08,.055],[.08,.025],[.055,.025],[.055,.055],[.025,.055],[.025,.025],[-.14,.025],[-.14,-.025]]];
   }else if(stage===1){
     strokes=[[[-.62,0],[.62,0],[.62,.152],[-.62,.152],[-.62,0]],[[0,.152],[0,.09],[-.05,.09],[-.05,.045],[0,.045],[0,0]]];
   }else if(stage===2){
     strokes=[[[0,.18],[-.055,.24],[-.04,.27],[0,.26],[.046,.27],[.06,.24],[0,.18],[-.015,.05],[-.055,.012],[-.05,-.038],[0,-.065],[.05,-.038],[.055,.012],[.015,.05],[0,.18]]];
   }else{
     strokes=[[[0,0],[.019,.175],[.052,.199],[.060,.168]],[[0,0],[.06,-.03],[.12,-.012],[.18,.032]]];
   }
   const lines=strokes.map(stroke=>stroke.map(([dx,dy])=>[mx+dx,my+dy,mz]));
   for(const stroke of lines)line(stroke,done,true);
   const mount=document.getElementById('mountImprint');
   if(!mount.hidden){
     const points=lines.flat().map(at),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
     const left=Math.min(...xs),top=Math.min(...ys),w=Math.max(...xs)-left,h=Math.max(...ys)-top;
     mount.style.left=(left+w/2)+'px';mount.style.top=(top+h/2)+'px';
     mount.style.width=Math.max(44,w+10)+'px';mount.style.height=Math.max(44,h+10)+'px';
   }
   pos=[mx,my,mz];
 }

 // At arm's reach the matching stamp becomes the actual button.
 if(examining===null&&next){
   const station=next.site!==undefined?document.getElementById('worldPins').children[next.site]:null;
   const button=station||document.getElementById('prop-'+next.prop);
   if(button&&!button.hidden&&!button.disabled&&(!station||!station.parentNode.hidden))return;
 }
 const p=at(pos);if(p[2]<=0)return;
 const x=Math.min(width-23,Math.max(23,p[0])),y=Math.min(height*.72,Math.max(78,p[1]-44));
 // A lead from the stamp ends exactly at the object; off-screen marks point towards it.
 if(p[0]<0||p[0]>width){
   const dir=p[0]<0?-1:1,tip=x+dir*20;
   traceLine(ctx,q=>q,[[tip-dir*5,y-4,1],[tip,y,1],[tip-dir*5,y+4,1]],done,false);
 }else traceLine(ctx,q=>q,[[x,y,1],[p[0],p[1],1]],done,false);
 seal(ctx,[x,y,1],name,done);
}


function showTransfer(from,to){
 const parent=document.getElementById('sceneNav');document.getElementById('transferStamp')?.remove();
 const stamp=document.createElement('span');stamp.id='transferStamp';stamp.setAttribute('aria-hidden','true');
 stamp.innerHTML=etchIcon(from)+etchIcon('join')+etchIcon(to);parent.append(stamp);
 setTimeout(()=>stamp.remove(),3200);
}
