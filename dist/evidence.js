// One pair of recoverable pieces and one physical mounting point per chapter.
const evidence=[
  null,
  {sites:['木工案','账夹','影轨尺座'], pieces:['椅纹断尺','灯纹断尺','双纹校尺'],
   findings:['刨花里露出半截竹尺。椅背形的烙印旁，划着六道长痕和一道半痕。断口往左缺了一牙。',
     '账纸夹着一截薄竹。油灯烙印旁是五道长痕和一道半痕。纸边的小字说，这家铺子的长痕一律算十刻。',
     '轨槽两侧各有半个燕尾口。槽里木色发白，像有一件东西在这儿嵌了许多年。'],
   joined:'两个断口咬上了。椅纹下是六长半，灯纹下是五长半，尺背的小字说一长抵十刻。',
   fitted:'校尺卡进轨槽，椅纹朝着椅轨，灯纹朝着灯座。两边的刻度终于有了来处。',
   blocked:'锁栓一压就偏。尺座两边的燕尾口还空着。'},
  {sites:['船匠工具盘','绕线辘轳','东岸铃架'],pieces:['穿孔铜舌','一截蜡绳','系绳铃舌'],
   findings:['盘底的铜坠一头磨得发亮，一头穿孔。敲一敲，有点像方才桥下的回声。','辘轳上剩了一截绳，抹过蜡，头上有两股拧痕。桥风吹过，也散不开。','铃腹空着。往上摸，里面只有一道磨圆了的吊环。'],
   joined:'蜡绳穿过铜舌，铜坠悬垂下来。空出的绳套正好搭在一根小指上。',
   fitted:'铃舌系稳了。铃腹内沿刻着旧戏班的规矩：头一声要沉，末一声要脆，三只铃各应一次。',
   blocked:'拾影扯动铃绳，只有吊环撞木头的声音。'},
  {sites:['针插','戏衣箱','断穗绣框'],pieces:['细钩针','朱砂线','穿线钩针'],
   findings:['针插上斜着一枚小钩针。针尖往里弯，针尾的长孔里还沾着一点红蜡。','箱盖内侧压着一缕朱线。拾影捻了捻：“我娘收针，总是把这一寸藏起来。”','窗口压着半截断穗，手指够不到。绣框边的小孔透出一点红。'],
   joined:'朱线穿进针尾，针钩还能伸进一指宽的窄缝。',
   fitted:'钩针穿过小孔，挑回半截穗子。穗根露出七个结，窗轴铜圈上每十刻也有一个结纹。',
   blocked:'袖口挂在断穗里。纱缝太窄，光拉铃绳只会越扯越紧。'}
];
function freshCase(){return [null,...Array.from({length:3},()=>({mask:0,made:false,installed:false}))]}
function readCase(old,stage,alcove){
  const rows=freshCase();
  for(let i=1;i<=3;i++){
    const row=old.kit?.[i],legacy=!Array.isArray(old.kit);
    const installed=i<stage||(i===stage&&legacy&&Boolean(alcove))||row?.installed===true;
    const made=installed||row?.made===true;
    rows[i]={mask:made?3:Number.isInteger(row?.mask)?row.mask&3:0,made,installed,opened:installed||made||Boolean(row?.opened)||Boolean(row?.mask&2)};
  }
  return rows;
}
let selectedPieces=[],examining=null,lastKitView='',returnToWide=true;
const evNode=id=>document.getElementById(id);
function cluesActive(){return !pendingCut&&!contactRun&&playing&&s.stage>=1&&s.stage<=3&&!s.alcove&&!beat}
function clueReady(){return !!s.kit[s.stage]?.installed}
function fieldNote(message){evNode('caseNote').textContent=message}
function markScene(){lastKitView='';redrawUntil=performance.now()+700;syncCase()}
function startExamine(slot){
  if(!cluesActive())return;
  if(examining===null)returnToWide=wide;
  const begin=()=>{wide=true;examining=slot;visual.probe=slot;
  fieldNote('');syncImmersion();lockStage(true);
  evNode('propCommands').inert=true;
  markScene();evNode('inspectHeading').focus({preventScroll:true});
  };
  playContact(window.relicSpots(s.stage)[slot],s.role,0,begin);
}
function finishExamine(){
  if(examining===null)return;
  dissolve(()=>{
  const previous=examining;examining=null;visual.probe=null;wide=returnToWide;
  lockStage(false);syncImmersion();markScene();
  evNode('siteList').children[previous]?.focus({preventScroll:true});
  });
}
function verifyMount(){
  if(clueReady())return true;
  caption('现场',evidence[s.stage].blocked);return false;
}
function changeItem(slot){
  if(contactRun||examining!==slot)return;
  const row=s.kit[s.stage],book=evidence[s.stage];
  const chest=s.stage===3&&slot===1&&!row.opened;
  if(chest&&!(selectedPieces.length===1&&selectedPieces[0]===3)){
    fieldNote('扣眼里有三道豁口，得找一件边缘同样的薄片。');stageSound.play('blocked');return;
  }
  if(slot===2&&!row.installed&&(!row.made||selectedPieces.length!==1||selectedPieces[0]!==2)){
    fieldNote(selectedPieces.length?'接口合不上。手里的物件仍在装备区。':'先在装备区选一件，再试这处接口。');stageSound.play('blocked');return;
  }
  playContact(window.relicSpots(s.stage)[slot],s.role,0,()=>{
  if(chest){row.opened=true;selectedPieces=[];fieldNote('铜签在三齿扣里转了半圈。箱盖一松，底下压着一卷朱线。');stageSound.play('open')}
  else if(slot<2){
    if(row.mask&(1<<slot))return;
    row.mask|=1<<slot;stageSound.play('open');
    fieldNote('已收起「'+book.pieces[slot]+'」。');
  }else if(row.installed){
    fieldNote(book.fitted);
  }else{
    row.installed=true;selectedPieces=[];stageSound.play('tick');fieldNote(book.fitted);
  }
  save();markScene();lockStage(true);
  },chest?'unlock':slot<2?'take':'fit',slot);
}
function combinePieces(){
  const row=s.kit[s.stage],book=evidence[s.stage];
  if(row.made||selectedPieces.length!==2)return;
  if(!selectedPieces.includes(0)||!selectedPieces.includes(1)){fieldNote('两件的接头对不上。');stageSound.play('blocked');return}
  row.made=true;selectedPieces=[2];stageSound.play('tick');fieldNote(book.joined);save();markScene();
}
function buttonFor(name,onclick){
  const button=document.createElement('button');button.type='button';button.textContent=name;button.onclick=onclick;return button;
}
function syncCase(){
  const area=evNode('caseArea');if(!area)return;
  area.hidden=!playing||s.stage<1||Boolean(beat);
  evNode('worldPins').hidden=!cluesActive()||!wide||!draw||examining!==null;
  const detail=evNode('evidenceDetail');
  detail.hidden=examining===null||!cluesActive();
  if(area.hidden)return;
  const book=evidence[s.stage],row=s.kit[s.stage];
  const signature=JSON.stringify([s.stage,s.kit,s.alcove,examining,selectedPieces]);
  if(lastKitView===signature)return;lastKitView=signature;
  const sites=evNode('siteList'),bag=evNode('bagSlots');sites.replaceChildren();bag.replaceChildren();
  evNode('fieldSites').hidden=!cluesActive();
  if(cluesActive())book.sites.forEach((name,i)=>{
    sites.append(buttonFor(name,()=>startExamine(i)));
    evNode('worldPins').children[i].setAttribute('aria-label','调查'+name);
  });
  if(!detail.hidden){
    const closed=s.stage===3&&examining===1&&!row.opened;
    evNode('inspectHeading').textContent=book.sites[examining];
    evNode('inspectText').textContent=closed?'箱扣有三个浅浅的豁口。阿照掰了一下，纹丝不动。':examining===2&&row.installed?book.fitted:book.findings[examining];
    const take=evNode('handleItem'),picked=examining<2&&Boolean(row.mask&(1<<examining));
    take.disabled=picked||examining===2&&row.installed;
    take.textContent=closed?'试开箱扣':examining===2?(row.installed?'已装入':'试用手中物件'):picked?'已收入装备区':'收起'+book.pieces[examining];
  }
  const slots=!row||row.installed?[]:row.made?[2]:[0,1].filter(i=>row.mask&(1<<i));
  if(s.stage===3&&!row.opened)slots.push(3);
  for(const i of slots){
    const b=buttonFor(i===3?"三齿铜签":book.pieces[i],()=>{
      selectedPieces=selectedPieces.includes(i)?selectedPieces.filter(n=>n!==i):selectedPieces.length===2?[i]:[...selectedPieces,i];
      fieldNote(selectedPieces.length===2?'两件都已选中，可以试着拼合。':selectedPieces.length?(i===3?'从铃架底下滑出的薄铜签，边缘锉出了三道齿。':i===2?book.joined:book.findings[i]):'已放回装备区。');markScene();
      evNode('bagSlots').querySelector('[data-slot="'+i+'"]')?.focus({preventScroll:true});
    });b.dataset.slot=i;b.setAttribute('aria-pressed',String(selectedPieces.includes(i)));bag.append(b);
  }
  if(!slots.length)bag.textContent=row?.installed?'本关物件已装入机关。':s.stage===4?'三处机关都已复原。':'装备区暂空。调查场景中的物件可以收下线索。';
  evNode('combine').hidden=slots.length<2;evNode('combine').disabled=selectedPieces.length!==2;
  const journal=evNode('caseHistory');journal.replaceChildren();
  for(let chapter=1;chapter<=Math.min(s.stage,3);chapter++){
    const r=s.kit[chapter],entry=evidence[chapter];
    for(let i=0;i<2;i++)if(r.mask&(1<<i)){
      const p=document.createElement('p');p.textContent=entry.pieces[i]+' · '+entry.findings[i];journal.append(p);
    }
    if(r.made||r.installed){const p=document.createElement('p');p.textContent=entry.pieces[2]+' · '+(r.installed?entry.fitted:entry.joined);journal.append(p)}
  }
  if(s.stage>=3){const p=document.createElement('p');p.textContent='三齿铜签 · 雨桥最后一声铃响，铃架吐出一片薄铜，边缘有三道齿。';journal.append(p)}
  if(!journal.childElementCount)journal.textContent='这里会留下你亲自查到的痕迹。';
}
function projectClues(coords){
  const holder=evNode('worldPins');if(holder.hidden)return;
  const placed=[];
  coords.forEach(([x,y,depth],i)=>{
    const btn=holder.children[i],px=x*holder.clientWidth,py=y*holder.clientHeight;
    btn.hidden=depth<=0||px<20||px>holder.clientWidth-20||py<20||py>holder.clientHeight-20||placed.some(([a,b])=>Math.hypot(a-px,b-py)<42);
    if(!btn.hidden){placed.push([px,py]);btn.style.left=px+'px';btn.style.top=py+'px'}
  });
}
function resetCaseView(){selectedPieces=[];examining=null;visual.probe=null;lastKitView='';fieldNote('')}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&examining!==null)finishExamine()});

