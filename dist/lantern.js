// The same wick drives the visible flame, light on nearby surfaces, and exposure.
const cueLamp={x:1.65,y:3.14,z:-1.42,power:0,focus:0,active:false};
const nightVeil=document.getElementById('nightVeil');
let handoff=null;
function lamplightCurve(keys,t){
  for(let i=1;i<keys.length;i++){
    if(t<=keys[i][0]){
      let u=(t-keys[i-1][0])/(keys[i][0]-keys[i-1][0]);u=u*u*(3-2*u);
      return keys[i-1][1]+(keys[i][1]-keys[i-1][1])*u;
    }
  }
  return keys.at(-1)[1];
}
const wickOut=[[0,1],[.30,.44],[.5,.78],[1,0]];
const wickIn=[[0,0],[.22,.68],[.38,.46],[.67,.94],[1,1]];
function ambientWick(now){
  return (1+Math.sin(now*.00102+.6*Math.sin(now*.00043)))*.5;
}
function beginLampPassage(destination){
  if(handoff)return;
  stopMovement();stopCue();s.passage=destination;save();
  handoff={destination,start:performance.now(),initialPower:cueLamp.power,initialShade:Number(nightVeil.style.opacity),switched:false,lit:false};
  if(s.alcove&&!wide){wide=true;syncImmersion()}
  cueLamp.active=true;document.body.classList.add('passing-lamp');
  document.querySelector('main').inert=true;
  nightVeil.style.pointerEvents='auto';
  el('shutter').getAnimations().forEach(a=>a.cancel());el('shutter').style.opacity='';
}
function lightFrame(now){
  let shade=0;
  if(handoff){
    const fadeOut=reduced?320:2450,hold=reduced?160:850,fadeIn=reduced?460:3600;
    const elapsed=Math.max(0,now-handoff.start);
    if(elapsed<fadeOut){
      const t=elapsed/fadeOut;
      const wick=reduced?1-t:lamplightCurve(wickOut,t);
      cueLamp.power=handoff.initialPower*wick;
      cueLamp.focus=reduced?0:.48*t*t*(3-2*t);
      shade=1-(1-handoff.initialShade)*wick;
    }else if(!handoff.switched){
      // Keep at least one complete black frame either side of the actual scene change.
      cueLamp.power=0;cueLamp.focus=reduced?0:1;shade=1;
      if(handoff.darkAt===undefined)handoff.darkAt=now;
      if(now-handoff.darkAt>=hold){
        const n=handoff.destination;handoff.switched=true;handoff.arrived=now;
        delete s.passage;enterStage(n,true);
      }
    }else{
      const t=Math.min(1,(now-handoff.arrived)/fadeIn);
      const wick=reduced?t:lamplightCurve(wickIn,t);
      const wave=ambientWick(now);
      cueLamp.power=wick*(reduced?1:.75+.25*wave);
      const pullback=Math.max(0,(t-.23)/.77);
      cueLamp.focus=reduced?0:1-pullback*pullback*(3-2*pullback);
      shade=(1-wick)*.95+.05*(1-t)+(reduced?0:wick*.17*(1-wave));
      if(!handoff.lit&&t>.06){handoff.lit=true;stageSound.play('lamp')}
      if(t===1){
        const n=handoff.destination;handoff=null;cueLamp.active=false;document.body.classList.remove('passing-lamp');
        nightVeil.style.pointerEvents='none';document.querySelector('main').inert=false;
        showTransfer(n===2?'lock':'bell',n===2?'bridge':'key');
        if(n===3)fieldNote('第三声落下，一枚三齿铜签滑入手中。已放入随身装备。');
        el('action').focus({preventScroll:true});
      }
    }
    redrawUntil=Math.max(redrawUntil,now+120);
  }else if(playing&&s.stage>0){
    const wave=ambientWick(now);
    cueLamp.power=reduced?1:.75+.25*wave;
    shade=reduced?0:.17*(1-wave);
  }else{cueLamp.power=0;cueLamp.focus=0}
  const opacity=shade.toFixed(3);
  if(nightVeil.style.opacity!==opacity)nightVeil.style.opacity=opacity;
}
for(const type of ['keydown','keyup'])window.addEventListener(type,event=>{
  if(cueLamp.active&&!event.metaKey&&!event.ctrlKey&&!event.altKey){
    event.preventDefault();event.stopImmediatePropagation();
  }
},true);

