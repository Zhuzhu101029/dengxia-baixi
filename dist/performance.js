/* The engine supplies normalized gesture progress. All geometry is in a
   960-by-540 close-up, with the original hand-to-prop registration preserved. */
(() => {
  const ns = 'http://www.w3.org/2000/svg';
  const assetBase = new URL('.', document.currentScript?.src || document.baseURI);
  const instances = new WeakMap();
  const clamp = v => Math.max(0, Math.min(1, v));
  const smooth = v => { const t = clamp(v); return t*t*(3-2*t); };
  let nextId = 0;

  function node(parent, tag, attrs) {
    const element = document.createElementNS(ns, tag);
    for (const [name, value] of Object.entries(attrs || {})) element.setAttribute(name, value);
    if (parent) parent.append(element);
    return element;
  }
  function picture(parent, file, x, y, width, height, fit = 'none') {
    return node(parent, 'image', {href:new URL(file, assetBase).href, x, y, width, height, preserveAspectRatio:fit});
  }
  function gradient(defs, id, stops) {
    const g = node(defs, 'radialGradient', {id});
    for (const [offset,color,opacity] of stops) node(g,'stop',{offset,'stop-color':color,'stop-opacity':opacity});
    return 'url(#' + id + ')';
  }
  function make(host, kind, role) {
    const id = 'shadowPlayBeat' + (++nextId);
    const root = node(null,'svg',{viewBox:'0 0 960 540',preserveAspectRatio:'xMidYMid meet',role:'img',
      'aria-label': kind==='chair'?'阿照用双手抬起木椅，搬到光圈后落稳':kind==='lamp'?'阿照把火折子递向铜灯，点燃灯芯':role==='b'?'拾影的小生妆特写':'阿照的近景'});
    root.style.cssText='display:block;width:100%;height:100%;overflow:hidden;background:#17100c;pointer-events:none';
    host.append(root);
    const defs=node(root,'defs');
    const shadowFill=gradient(defs,id+'shadow',[[0,'#0e0907',.9],[.55,'#100b09',.68],[1,'#100b09',0]]);
    const glowFill=gradient(defs,id+'glow',[[0,'#ffebaa',.9],[.18,'#ffae48',.56],[1,'#ff9732',0]]);
    const room=picture(root,kind==='portrait'?'room-opera.jpg':'room-shop.jpg',0,0,960,540,'xMidYMid slice');
    room.style.filter='blur(3px) brightness(.44) saturate(.8)';
    if (kind==='portrait') {
      const face=role==='b'?'face-shiying.webp':'face-azhao.webp';
      const wash=picture(root,face,0,0,960,540,'xMidYMid slice');
      wash.style.filter='blur(16px) brightness(.46)';
      picture(root,face,0,0,960,540,'xMidYMid meet');
      return {root, update(){}};
    }
    if (kind==='chair') {
      const target=node(root,'ellipse',{cx:613,cy:489,rx:125,ry:24,fill:glowFill,opacity:.37});
      const shadow=node(root,'ellipse',{cy:491,ry:20,fill:shadowFill});
      const assembly=node(root,'g');
      root.setAttribute('viewBox','230 35 640 490');
      picture(assembly,'hands-chair.webp',0,0,539,428);
      return {root,update(p) {
        const travel=smooth((p-.12)/.72);
        const lift=60*smooth(p/.23)*(1-smooth((p-.76)/.24));
        const x=30+travel*170;
        const tilt=-4.6*Math.sin(Math.PI*p);
        assembly.setAttribute('transform', 'translate('+x+' '+(63-lift)+') rotate('+tilt+' 310 428)');
        shadow.setAttribute('cx',x+368);
        shadow.setAttribute('rx',143+lift*.22);
        shadow.setAttribute('opacity',.84-lift*.007);
        target.setAttribute('opacity',.40-.27*travel);
      }};
    }
    const lampX=592, lampY=249, lampWidth=286, factor=lampWidth/462;
    const wickX=lampX+232*factor, wickY=lampY+11*factor;
    node(root,'ellipse',{cx:736,cy:477,rx:152,ry:18,fill:shadowFill});
    const halo=node(root,'ellipse',{cx:wickX,cy:wickY-23,rx:173,ry:150,fill:glowFill});
    picture(root,'oil-lamp.webp',lampX,lampY,lampWidth,381*factor);
    const hand=node(root,'g');
    const extra=node(hand,'svg',{x:-200,y:0,width:200,height:409,viewBox:'0 0 6 409',preserveAspectRatio:'none',overflow:'hidden'});
    picture(extra,'hand-taper.webp',0,0,875,409);
    picture(hand,'hand-taper.webp',0,0,875,409);
    const coal=node(hand,'ellipse',{cx:862,cy:88,rx:24,ry:22,fill:glowFill});
    const flame=node(root,'g');
    node(flame,'path',{d:'M0 1 C-15 -2 -13 -19 -5 -34 C-1 -42 0 -50 0 -62 C16 -41 3 -31 13 -22 C22 -9 12 1 0 1Z',fill:'#ffad3d',opacity:.94});
    node(flame,'path',{d:'M1 0 C-7 -2 -8 -11 -2 -21 C1 -26 2 -30 2 -35 C10 -23 7 -18 10 -13 C15 -3 8 1 1 0Z',fill:'#fff7ce'});
    return {root,update(p) {
      const approach=smooth(p/.59), retreat=smooth((p-.72)/.28);
      const tx=wickX-226*(1-approach)-194*retreat;
      const ty=wickY+58*(1-approach)-38*retreat;
      const scale=.75, angle=-6*(1-approach)+3*retreat;
      hand.setAttribute('transform','translate('+tx+' '+ty+') rotate('+angle+') scale('+scale+') translate(-862 -88)');
      const ignition=smooth((p-.59)/.22);
      coal.setAttribute('opacity',.45+.4*approach-.4*retreat);
      halo.setAttribute('opacity',ignition*.7);
      flame.setAttribute('transform','translate('+wickX+' '+wickY+') scale('+ignition+')');
      root.style.backgroundColor=ignition>.5?'#21140b':'#17100c';
    }};
  }

  window.performBeat=function(host, kind, progress=0, role='a') {
    if (!host || !['chair','lamp','portrait'].includes(kind)) return;
    const key=kind+(kind==='portrait'?role:'');
    let state=instances.get(host);
    if (!state || state.key!==key || state.root.parentNode!==host) {
      state?.root.remove();
      state=make(host,kind,role);
      state.key=key;
      instances.set(host,state);
    }
    state.update(clamp(Number(progress)||0));
    return state.root;
  };
})();
