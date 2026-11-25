// All pieces are drawn in their fitted positions. During inspection the
// second piece starts to the right of its matching socket.
const assemblyArt=[null,{
  fixed:'<path fill="#b98a54" d="M34 41 Q32 41 32 44 V62 Q32 65 36 65 H144 V57 H156 V49 H144 V41Z"/><path d="M44 46v8m10-8v8m10-8v8m10-8v8m10-8v8m10-8v8m10-8v4"/><path d="M114 48v10m0-5h17v6m-14-6v6"/>',
  loose:'<path fill="#d6ac72" d="M144 41 H225 Q228 41 228 44 V62 Q228 65 225 65 H144 V57 H156 V49 H144Z"/><path d="M164 46v8m8-8v8m8-8v8m8-8v8m8-8v8m8-8v4"/><path d="M212 49q5-6 10 0l-2 7h-6zm5 7v4"/>',
  socket:'M144 41v8h12v8h-12v8',name:'对合竹尺的燕尾断口'
},{
  fixed:'<path fill="#a88551" fill-rule="evenodd" d="M80 54 Q74 46 79 37 Q86 24 99 29 Q112 33 111 46 L107 65 Q116 75 110 84 Q101 97 80 88 Q68 80 77 68Z M86 43 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0Z"/><path d="M81 74q12 6 25 1" stroke="#ddbc7b"/>',
  loose:'<path class="cord" stroke="#c5a779" d="M92 44 Q100 37 111 41 C136 55 146 66 163 51 S192 31 198 42 Q207 61 230 50"/><path d="M93 44l7-3m10 0 2 4m12 4 1 5m12 3 1 4m15-3 3 2m10-14 4 2" stroke="#766850"/>',
  socket:'M86 43a8 8 0 1 0 16 0a8 8 0 1 0 -16 0',name:'把蜡绳穿进铜舌的孔'
},{
  fixed:'<path d="M40 65 Q32 62 38 55 Q39 61 46 59 L150 45" stroke="#dbc8a1" stroke-width="3"/><path fill="#a98a64" fill-rule="evenodd" d="M147 41 Q164 33 172 41 Q178 48 154 50 L147 49Z M155 43 Q171 36 167 43 Q164 46 155 46Z"/>',
  loose:'<path class="thread" stroke="#c86550" d="M160 44 Q177 38 184 49 C193 75 211 74 216 59 S229 42 237 46"/><path d="M160 44l7-2" stroke="#e9a588"/>',
  socket:'M154 43q19-9 15 0q-6 6-15 4Z',name:'把朱线穿过针尾的长孔'
}];
let assemblyDrag=null;
function renderAssembly(row){
  const bench=evNode('joinBench');
  assemblyDrag=null;
  const matched=selectedPieces.includes(0)&&selectedPieces.includes(1);
  bench.hidden=!row||row.installed||!(row.made||matched);
  evNode('assemblyEtching').hidden=!row||!bench.hidden;
  if(bench.hidden){bench.replaceChildren();return}
  const art=assemblyArt[s.stage];
  bench.dataset.joined=String(row.made);
  bench.setAttribute('aria-label',row.made?evidence[s.stage].pieces[2]:art.name);
  bench.innerHTML='<svg viewBox="0 0 320 112" aria-hidden="true"><g class="artifact">'+art.fixed+'</g>'+
    (row.made?'':'<path class="socket" d="'+art.socket+'"/>')+
    '<g class="artifact loose" transform="translate('+(row.made?0:66)+' 0)">'+art.loose+'</g></svg>';
}
function bindAssembly(){
  const bench=evNode('joinBench');
  const cancel=()=>{
    assemblyDrag=null;
    if(bench.dataset.joined==='false')bench.querySelector('.loose')?.setAttribute('transform','translate(66 0)');
  };
  const xAt=(event,svg)=>new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse()).x;
  bench.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||event.button!==0||bench.dataset.joined!=='false')return;
    const moving=bench.querySelector('.loose'),svg=moving.ownerSVGElement;
    const pos=new DOMPoint(event.clientX,event.clientY).matrixTransform(moving.getScreenCTM().inverse());
    const box=moving.getBBox();
    if(pos.x<box.x-12||pos.x>box.x+box.width+12||pos.y<box.y-13||pos.y>box.y+box.height+13)return;
    event.preventDefault();bench.setPointerCapture(event.pointerId);
    assemblyDrag={id:event.pointerId,start:xAt(event,svg),svg,moving};
  });
  function slide(event){
    if(!assemblyDrag||assemblyDrag.id!==event.pointerId)return;
    const {start,svg,moving}=assemblyDrag;
    const offset=Math.max(0,Math.min(66,66+xAt(event,svg)-start));
    moving.setAttribute('transform','translate('+offset+' 0)');
    return offset;
  }
  bench.addEventListener('pointermove',slide);
  bench.addEventListener('pointerup',event=>{
    const offset=slide(event);if(offset===undefined)return;
    cancel();if(offset<=7)combinePieces();
  });
  bench.addEventListener('pointercancel',cancel);
  bench.addEventListener('lostpointercapture',cancel);
  evNode('pack').addEventListener('close',cancel);
}

