// One pair of recoverable pieces and one physical mounting point per chapter.
const evidence=[
  null,
  {sites:['木工案','账夹','影轨尺座'], pieces:['椅纹断尺','灯纹断尺','双纹校尺'],
   findings:['半截竹尺刻着椅背，六道长痕带个半痕。拾影说：“师父每回搬椅，都要拿它贴一下椅脚。”',
     '“过桥”那页账里夹着另一半竹尺，灯纹下五长半。纸角写着“一长十刻”。断口凸出一牙，正好配一个缺口。',
     '轨槽两侧各有半个燕尾口。槽里木色发白，像有一件东西在这儿嵌了许多年。'],
   joined:'两个断口咬上了。椅纹下是六长半，灯纹下是五长半，尺背的小字说一长抵十刻。',
   fitted:'校尺贴平了。椅纹记桥头，灯纹记桥尾。尺背还有四个字：“东岸应铃”。师父连拾影该在哪儿停步都记下了。',
   blocked:'锁栓一压就偏。尺座两边的燕尾口还空着。'},
  {sites:['船匠工具盘','绕线辘轳','东岸铃架'],pieces:['穿孔铜舌','一截蜡绳','系绳铃舌'],
   findings:['盘底的铜坠刻着一个“东”字。拾影拿指节轻敲了一下：“就是它。那晚我走过去，铃铛张着嘴，一点声儿也没有。”','辘轳上还绕着换铃舌用的蜡绳。阿照搓了搓绳头，两股拧痕，恰能穿进一只小孔。','铃腹空着。往上摸，里面只有一道磨圆了的吊环。'],
   joined:'蜡绳穿过铜舌，铜坠悬垂下来。空出的绳套正好搭在一根小指上。',
   fitted:'铃舌系稳了。铃腹里刻着报场的次序：起声沉，收声脆，三铃各应一回。拾影低声说：“娘，听得见吗？”',
   blocked:'拾影扯动铃绳，只有吊环撞木头的声音。'},
  {sites:['针插','戏衣箱','断穗绣框'],pieces:['细钩针','朱砂线','穿线钩针'],
   findings:['针插上斜着一枚小钩针。针尖往里弯，针尾的长孔里还沾着一点红蜡。','箱盖里压着一缕朱线，跟门缝里那张戏单上粘的一样。线尾留了一寸，刚好够穿针。','窗口压着半截断穗，手指够不到。绣框边的小孔透出一点红。'],
   joined:'朱线穿进针尾，针钩还能伸进一指宽的窄缝。',
   fitted:'钩针挑出了断穗。穗根七个结，窗轴每十刻也刻一个结。拾影记起来了：“转回窗影，我就能回左岸。那根铃绳连着娘的绷架。”',
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
function fieldNote(message){evNode('caseNote').textContent=message;const reply=evNode('fieldReply');if(reply)reply.textContent=examining!==null?message:''}
function markScene(){lastKitView='';redrawUntil=performance.now()+700;syncCase();refreshReach()}
function startExamine(slot){
  if(!cluesActive()||!nearSite(slot))return;
  if(examining===null)returnToWide=wide;
  const begin=()=>{showConsole('case');wide=true;examining=slot;visual.probe=slot;
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
  if(contactRun||examining!==slot||!nearSite(slot))return;
  const row=s.kit[s.stage],book=evidence[s.stage];
  const chest=s.stage===3&&slot===1&&!row.opened;
  if(chest&&!(selectedPieces.length===1&&selectedPieces[0]===3)){
    fieldNote('扣眼里有三道豁口，得找一件边缘同样的薄片。');stageSound.play('blocked');return;
  }
  if(slot===2&&!row.installed&&(!row.made||selectedPieces.length!==1||selectedPieces[0]!==2)){
    fieldNote(selectedPieces.length?'接口合不上。手里的物件仍在装备区。':'先在装备区选一件，再试这处接口。');stageSound.play('blocked');return;
  }
  playContact(window.relicSpots(s.stage)[slot],s.role,0,()=>{
  if(chest){row.opened=true;selectedPieces=[];fieldNote('铜签一转，箱盖开了。里头是娘留的字：“铃若不响，我就拿顶针敲三下。听见就把袖子递来。”');stageSound.play('open')}
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
  const diagram=evNode('assemblyEtching');diagram.hidden=!row;
  if(row){
    const icons=etchSets[s.stage];
    diagram.innerHTML=[0,1,2].map((i)=>'<span class="'+((i===2?row.made:row.mask&(1<<i))?'inked':'imprint')+'">'+etchIcon(icons[i])+'</span>').join('');
  }
  if(cluesActive())book.sites.forEach((name,i)=>{
    sites.append(buttonFor(name,()=>startExamine(i)));
    const pin=evNode('worldPins').children[i];
    pin.setAttribute('aria-label','调查'+name);
    pin.innerHTML=etchIcon(s.stage===3&&i===1&&!row.opened?'key':etchSets[s.stage][i]);
    pin.classList.toggle('nextEtch',nextImpression()?.site===i);
  });
  if(!detail.hidden){
    const closed=s.stage===3&&examining===1&&!row.opened;
    evNode('inspectHeading').textContent=book.sites[examining];
    evNode('inspectText').textContent=closed?'箱扣有三个浅浅的豁口。阿照掰了一下，纹丝不动。':examining===2&&row.installed?book.fitted:book.findings[examining];
    const take=evNode('handleItem'),picked=examining<2&&Boolean(row.mask&(1<<examining));
    take.disabled=picked||examining===2&&row.installed;
    take.textContent=closed?'试开箱扣':examining===2?(row.installed?'已装入':'试用手中物件'):picked?'已收入装备区':'收起'+book.pieces[examining];
    take.insertAdjacentHTML('afterbegin',etchIcon(take.disabled?'check':closed?'key':etchSets[s.stage][examining]));
  }
  const slots=!row||row.installed?[]:row.made?[2]:[0,1].filter(i=>row.mask&(1<<i));
  if(s.stage===3&&!row.opened)slots.push(3);
  for(const i of slots){
    const b=buttonFor(i===3?"三齿铜签":book.pieces[i],()=>{
      selectedPieces=selectedPieces.includes(i)?selectedPieces.filter(n=>n!==i):selectedPieces.length===2?[i]:[...selectedPieces,i];
      fieldNote(selectedPieces.length===2?'两件都已选中，可以试着拼合。':selectedPieces.length?(i===3?'从铃架底下滑出的薄铜签，边缘锉出了三道齿。':i===2?book.joined:book.findings[i]):'已放回装备区。');markScene();
      evNode('bagSlots').querySelector('[data-slot="'+i+'"]')?.focus({preventScroll:true});
    });b.insertAdjacentHTML('afterbegin',etchIcon(etchSets[s.stage][i]));b.dataset.slot=i;b.setAttribute('aria-pressed',String(selectedPieces.includes(i)));bag.append(b);
  }
  if(!slots.length)bag.textContent=row?.installed?'本关物件已装入机关。':s.stage===4?'三处机关都已复原。':'装备区暂空。调查场景中的物件可以收下线索。';
  evNode('combine').hidden=slots.length<2;evNode('combine').disabled=selectedPieces.length!==2;
  const journal=evNode('caseHistory');journal.replaceChildren();
  // The same playbill acquires a handwritten line after each played scene.
  const bill=document.createElement('section');bill.className='oldPlaybill';
  const title=document.createElement('strong');title.textContent='旧戏单 · 借影搭桥';bill.append(title);
  const cue=document.createElement('p');cue.textContent='小生过桥，接娘下台。';bill.append(cue);
  const memories=['开灯　拾影记得袖子被扯住的那一刻。阿照提灯，陪他重走。','过桥　椅影落稳。尺背指向东岸。拾影要去那里补上当年没响的报场铃。','应铃　三声报场铃放出铜签。拾影认出，那是娘的戏衣箱钥匙。','谢幕　断袖接好。顶针敲过三下，拾影终于接住了娘的手。'];
  for(const memory of memories.slice(0,s.stage)){
    const p=document.createElement('p');p.textContent=memory;bill.append(p);
  }
  journal.append(bill);
  for(let chapter=1;chapter<=Math.min(s.stage,3);chapter++){
    const r=s.kit[chapter],entry=evidence[chapter];
    for(let i=0;i<2;i++)if(r.mask&(1<<i)){
      const p=document.createElement('p');p.textContent=entry.pieces[i]+' · '+entry.findings[i];journal.append(p);
    }
    if(r.made||r.installed){const p=document.createElement('p');p.textContent=entry.pieces[2]+' · '+(r.installed?entry.fitted:entry.joined);journal.append(p)}
  }
  if(s.kit[3].opened&&s.stage>=3){const p=document.createElement('p');p.textContent='箱盖内的字 · “铃若不响，我就拿顶针敲三下。听见就把袖子递来。”';journal.append(p)}
  if(s.stage>=3){const p=document.createElement('p');p.textContent='三齿铜签 · 雨桥最后一声铃响，铃架吐出一片薄铜，边缘有三道齿。';journal.append(p)}

}
function projectClues(coords){
  const holder=evNode('worldPins');if(holder.hidden)return;
  const placed=[];
  coords.forEach(([x,y,depth],i)=>{
    const btn=holder.children[i],px=x*holder.clientWidth,py=y*holder.clientHeight;
    btn.hidden=(i===2&&clueReady()&&(s.stage===1||s.stage===3))||depth<=0||px<20||px>holder.clientWidth-20||py<20||py>holder.clientHeight-20||placed.some(([a,b])=>Math.hypot(a-px,b-py)<42);
    if(!btn.hidden){placed.push([px,py]);btn.style.left=px+'px';btn.style.top=py+'px'}
  });
}
function resetCaseView(){selectedPieces=[];examining=null;visual.probe=null;lastKitView='';fieldNote('')}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&examining!==null)finishExamine()});

