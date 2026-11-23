// Blocking for a single prop interaction. The shot change starts only after
// the performer's fingers have left the prop and the resting pose is on screen.
let contactRun=null, pendingCut=null;
function dissolve(next){
  if(pendingCut||contactRun)return;
  const veil=el('shutter');
  veil.getAnimations().forEach(a=>a.cancel());
  const fade=veil.animate([{opacity:0},{opacity:.96}],{duration:reduced?70:180,easing:'ease-in-out',fill:'forwards'});
  pendingCut=fade;
  fade.onfinish=()=>{
    if(pendingCut!==fade)return;
    pendingCut=null;fade.cancel();next();revealScene();
  };
}
const eased=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
function cancelContact(){
  if(pendingCut){pendingCut.cancel();pendingCut=null}
  if(contactRun)cancelAnimationFrame(contactRun.frame);
  contactRun=null;visual.contact=null;
  el('caseArea').inert=false;el('evidenceDetail').inert=false;
  const scrim=el('shutter');scrim.getAnimations().forEach(a=>a.cancel());scrim.style.opacity='';
}
function revealScene(){
  const scrim=el('shutter');scrim.style.opacity='';
  scrim.animate?.([{opacity:.96},{opacity:0}],{duration:reduced?90:340,easing:'ease-out'});
}
function playContact(point,role,ground,done,kind='touch',slot=-1){
  if(pendingCut||contactRun||!playing||!inReach(point,role))return;
  stopMovement();visual.work=null;
  const run={frame:0},previousWide=wide;contactRun=run;
  const scrim=el('shutter');scrim.getAnimations().forEach(a=>a.cancel());
  const rect=el('stage3d').parentElement.getBoundingClientRect();
  if(rect.top>innerHeight*.42||rect.top+Math.min(rect.height,480)<innerHeight*.35){
    el('stage3d').parentElement.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
  }
  const fade=reduced?75:190, action=reduced?640:1520, settle=reduced?50:160;
  let elapsed=0,last=0,started=false;
  const pose={point,role,ground,kind,slot,chapter:s.stage,step:0,reach:0,pull:0,transferred:false};
  lockStage(true);el('caseArea').inert=true;el('evidenceDetail').inert=true;
  function frame(now){
    if(run!==contactRun)return;
    elapsed+=last?Math.min(55,now-last):0;last=now;
    if(elapsed<fade)scrim.style.opacity=String(.96*eased(elapsed/fade));
    else{
      if(!started){
        started=true;wide=true;visual.contact=pose;syncImmersion();lockStage(true);
      }
      const local=elapsed-fade,p=Math.min(1,local/action);
      pose.step=eased(p/.34);
      pose.reach=eased((p-.28)/.27)*(1-eased((p-.76)/.21));
      if(!run.sounded&&p>=.58){run.sounded=true;stageSound.play(kind==='pull'?'bell':kind==='light'?'lamp':'tick')}
      pose.progress=p;pose.transferred=p>=.58;
      pose.pull=kind==='pull'?.12*eased((p-.54)/.18)*pose.reach:0;
      const out=local-action-settle;
      scrim.style.opacity=String(out>0?.96*eased(out/fade):.96*(1-eased(local/fade)));
      redrawUntil=now+400;
      if(out>=fade){
        contactRun=null;visual.contact=null;wide=previousWide;
        el('caseArea').inert=false;el('evidenceDetail').inert=false;lockStage(false);
        done();syncImmersion();revealScene();return;
      }
    }
    run.frame=requestAnimationFrame(frame);
  }
  run.frame=requestAnimationFrame(frame);
}
const bellLaneZ=-1.61;
function stageProp(name){
  if(name==='lamp')return [wx(17+s.lamp*.09)+.42,1.28,.25];
  if(name==='chair')return [wx(36+s.chair*.24),1.20,.49];
  if(name==='window')return window.relicSpots(3)[2];
  if(name==='lock')return window.relicSpots(1)[2];
  return [wx(s.stage===2?74:25),1.80,bellLaneZ];
}

