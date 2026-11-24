/* The props are built in object space and projected through a perspective camera.
   Interactive handles share their geometry's projected position. */
(() => {
  const tau = 2 * Math.PI;
  const gold = [169,119,61], bright = [224,176,98], brass = [110,82,51],
    patina = [62,81,67], iron = [58,53,44], wood = [109,58,34],
    lacquer = [94,32,23], amber = [226,152,61], ivory = [222,198,144];
  const style = document.createElement('style');
  style.textContent = `
    .prop-surface{position:absolute;inset:0;width:100%;height:100%;touch-action:none}
    .prop-hot{position:absolute;transform:translate(-50%,-50%);background:linear-gradient(130deg,#271e16ef,#191816ed);border:1px solid #c09c61;border-radius:20px;color:#ffdfab;min-height:31px;padding:4px 12px;font:500 clamp(12px,1.4vw,16px)/1.35 system-ui;white-space:nowrap;touch-action:none;box-shadow:0 2px 10px #08050380;cursor:pointer}
    .prop-hot[role=slider]{cursor:ew-resize}.prop-hot:focus-visible{outline:2px solid #ffdc8f;outline-offset:3px}.prop-hot:active{background:#70502e}
  `;
  document.head.append(style);
  window.makeMechanism = (host,{allowed,onMove,onAction,onSound,onClue}) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'prop-surface';
    canvas.setAttribute('aria-hidden','true');
    host.append(canvas);
    const ctx = canvas.getContext('2d');
    const controls = new Map();
    let stage = -1, values = {}, playing = false, signature = '', points = [], drag = null;
    let press=0, pull=0, actionTimer=null, actionTime=0, role=null;
    let width=1,height=1,scale=1,faces=[],frame=0,swing=0,rotation=-0.27,lookDrag=null;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let targetYaw=rotation,zoom=1,targetZoom=1,drawer=0,drawerOpen=false,lastDraw=0;
    const clues=[
      '匣背贴着半张旧戏单。写到“小生过桥”，往后的纸叫人反复摸过，毛了边。',
      '匣底摹着一道椅影。桥头画了只椅脚，桥尾是一盏灯，再往东，有人添了个很小的铃。',
      '听铃的规矩刻在匣壁：“东岸报场，后台取衣。”下面留着一片薄铜磨出的印子。',
      '匣壁有三道并排的浅痕。拾影用指甲试了一下：“娘戴顶针，就这么敲。三下，是叫我伸袖子。”',
      '匣底那道椅影还在。桥的另一头，多了一大一小两枚指印。'
    ];
    const drawerDepth=()=>[2.16,2.72,1.78,1.88,2.16][stage]||2;
    function rearDrawer(){
      const end=-drawerDepth()/2-.06, z=end-drawer*.84;
      block(0,.32,z+.48,1.65,.075,.88,iron,.025);
      block(0,.395,z+.46,1.39,.035,.72,gold,.01);
      for(let i=-2;i<=2;i++)block(i*.22,.43,z+.46,.045,.015,.32+.12*(2-Math.abs(i)),lacquer,.001);
      block(0,.32,z,1.81,.29,.10,wood,.04,'paint');
      for(const x of [-.82,.82])block(x,.32,z-.05,.07,.29,.06,gold,.014);
      block(0,.40,z-.08,.44,.08,.20,bright,.025);
      if(Math.cos(rotation)<-.40)handle('drawer',drawerOpen?'合上暗格':'拉开暗格',[0,.45,z-.14],[0,.86,z-.24]);
    }
    function inspectRear(){
      if(!playing||!allowed('drawer'))return;
      const toRear=Math.cos(targetYaw)>0;
      const goal=toRear?Math.PI-.16:-.27;
      targetYaw+=Math.atan2(Math.sin(goal-targetYaw),Math.cos(goal-targetYaw));
      targetZoom=toRear?1.18:1;
      onSound('turn');schedule();
    }
    function operateDrawer(){
      if(!playing||!allowed('drawer')||Math.cos(rotation)>=-.4)return;
      drawerOpen=!drawerOpen;onSound('slide');
      if(drawerOpen)onClue(clues[stage]);
      schedule();
    }
    function project([x,y,z]){
      const co=Math.cos(rotation),si=Math.sin(rotation),side=x*co-z*si,depth=x*si+z*co;
      const h=y-1.55, d=depth*.938+h*.345;
      const f=scale*zoom*14/(14-d);
      return [width*.5+side*f,height*.52-(h*.938-depth*.345)*f,d];
    }
    const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const sub=(a,b)=>a.map((v,i)=>v-b[i]);
    function face(vertices,pigment,grain=false){
      const dots=vertices.map(project);
      const n=cross(sub(vertices[1],vertices[0]),sub(vertices[2],vertices[0]));
      const length=Math.hypot(...n)||1;
      const light=(-.48*n[0]+.77*n[1]+.42*n[2])/length;
      const viewDot=(Math.sin(rotation)*n[0]+.36*n[1]+Math.cos(rotation)*n[2])/length;
      const highlight=Math.max(0,.62*light+.38*viewDot);
      const shine=grain?0:Math.pow(highlight,10)*82;
      const color='rgb('+pigment.map((v,i)=>Math.min(255,Math.round(v*(.65+.45*light)+shine*(1-i*.22)))).join(',')+')';
      faces.push({dots,depth:dots.reduce((s,p)=>s+p[2],0)/dots.length,color,grain});
    }
    function lathe(x,z,profile,segments=32,lean=null){
      const ring=(r,y,i)=>[x+(lean?lean(y):0)+r*Math.cos(tau*i/segments),y,z+r*Math.sin(tau*i/segments)];
      for(let j=1;j<profile.length;j++){
        const [r,y,c]=profile[j],[old,base]=profile[j-1];
        for(let i=0;i<segments;i++)face([ring(old,base,i),ring(r,y,i),ring(r,y,i+1),ring(old,base,i+1)],c);
      }
      const [r,y,c]=profile.at(-1);
      if(r>.001)face(Array.from({length:segments},(_,i)=>ring(r,y,-i)),c);
    }
    // A small silk-ground frieze for the case and bell rack. Paint once per
    // chapter, then project it onto each long lacquer face as the player turns it.
    const friezes = new Map();
    function frieze() {
      const kind = stage===2 ? 'river' : stage===3 ? 'opera' : 'bench';
      if(friezes.has(kind))return friezes.get(kind);
      const tile=document.createElement('canvas');
      tile.width=480;tile.height=96;
      const brush=tile.getContext('2d');
      brush.fillStyle=kind==='opera'?'#74473c':kind==='river'?'#435c56':'#4d635d';
      brush.fillRect(0,0,480,96);
      for(const y of [7,13,82,88]){
        brush.fillStyle=y===7||y===88?'#ba9865':'#91774d';
        brush.fillRect(0,y,480,y===7||y===88?2:1);
      }
      brush.translate(240,48);
      for(const dir of [-1,1]){
        brush.save();brush.scale(dir,1);
        brush.strokeStyle='#c1a97c';brush.lineWidth=2;
        brush.beginPath();brush.moveTo(10,1);
        brush.bezierCurveTo(45,30,90,26,118,2);
        brush.bezierCurveTo(153,-27,177,-20,202,-8);
        brush.bezierCurveTo(220,3,215,15,205,12);brush.stroke();
        for(const [x,y,angle] of [[38,15,-.71],[70,20,-.40],[109,8,-.78],[153,-14,.28],[185,-13,.46]]){
          brush.save();brush.translate(x,y);brush.rotate(angle);
          brush.beginPath();brush.moveTo(0,0);brush.quadraticCurveTo(7,-12,28,-9);
          brush.quadraticCurveTo(16,1,0,0);brush.fillStyle='#a4aa83';brush.fill();
          brush.strokeStyle='#526953';brush.lineWidth=1;brush.stroke();brush.restore();
        }
        brush.restore();
      }
      for(let i=0;i<6;i++){
        brush.save();brush.rotate(Math.PI*i/3);
        brush.beginPath();brush.moveTo(0,1);brush.bezierCurveTo(-8,-2,-8,-13,0,-19);
        brush.bezierCurveTo(8,-12,8,-2,0,1);brush.fillStyle='#a46850';brush.fill();
        brush.lineWidth=1.4;brush.strokeStyle='#cfb788';brush.stroke();brush.restore();
      }
      brush.beginPath();brush.arc(0,0,3.4,0,tau);brush.fillStyle='#d1b37c';brush.fill();
      friezes.set(kind,tile);return tile;
    }
    function block(x,y,z,w,h,d,c,bevel=.06,grain=false){
      const b=Math.min(bevel,w/5,h/3,d/5);
      const ring=(shrink,yy)=>{
        const a=w/2-shrink,e=d/2-shrink,t=Math.min(.1,a/4,e/4);
        const points=[];
        for(let corner=0;corner<4;corner++){
          const cx=corner===1||corner===2?-a+t:a-t,cz=corner<2?e-t:-e+t;
          for(let step=0;step<=3;step++){
            const angle=(corner+step/3)*Math.PI/2;
            points.push([x+cx+t*Math.cos(angle),yy,z+cz+t*Math.sin(angle)]);
          }
        }
        return points;
      };
      const rings=[ring(b,y),ring(b*.28,y+b*.28),ring(0,y+b),ring(0,y+h-b),ring(b*.28,y+h-b*.28),ring(b,y+h)];
      for(let j=1;j<rings.length;j++)for(let i=0;i<rings[j].length;i++){
        const a=rings[j-1],k=rings[j],n=(i+1)%k.length;
        const finish=j===3&&grain==='paint'&&i%4===3?'paint':Boolean(grain&&j===3);
        face([a[i],k[i],k[n],a[n]],c,finish);
      }
      face([...rings.at(-1)].reverse(),c,grain);
    }
    function screw(x,y,z,r=.065){
      lathe(x,z,[[r*.8,y,brass],[r,y+.018,gold],[r*.8,y+.034,bright]],12);
      block(x,y+.035,z,r*1.1,.008,r*.17,iron,.001);
    }
    function base(w,d){
      // The joinery and four feet form a continuous load path to the floor.
      const span=w+.70,depth=d+.88;
      for(let i=0;i<5;i++)block(0,-.12,(i-2)*depth/5,span,.16,depth/5-.006,i%2?[85,59,43]:[94,66,48],.027,true);
      for(const side of [-1,1]){
        block(0,-.28,side*(depth/2-.18),span-.20,.17,.13,wood,.025,true);
        for(const end of [-1,1]){
          const x=end*(span/2-.26),z=side*(depth/2-.23);
          block(x,-.59,z,.19,.47,.19,wood,.024,true);
          block(x,-.635,z,.25,.08,.24,brass,.015);
          block(x,-.69,z,.39,.055,.38,[78,70,58],.012);
        }
      }
      for(const a of [-1,1])for(const b of [-1,1])block(a*(w/2-.4),.04,b*(d/2-.32),.58,.21,.45,brass);
      block(0,.18,0,w,.13,d,gold);
      // The tray runs in a hollow case. Only the stiles flank its opening.
      const opening=1.87,sideWidth=(w-.09-opening)/2;
      for(const side of [-1,1])block(side*(opening+sideWidth)/2,.28,0,sideWidth,.48,d-.08,wood,.035,true);
      block(0,.28,d/2-.14,opening,.48,.20,wood,.035,'paint');
      block(0,.63,0,opening,.13,d-.08,wood,.035,true);
      block(0,.65,0,w,.07,d,brass);
      block(0,.72,0,w-.18,.14,d-.16,wood,.045,true);
      for(const a of [-1,1])for(const b of [-1,1])screw(a*(w/2-.28),.86,b*(d/2-.25));
    }
    function lantern(x,z,baseY,k=1){
      const profile=[[.77,0,brass],[.85,.06,gold],[.82,.15,bright],[.68,.2,brass],[.66,.3,patina],[.77,.34,gold],[.78,.41,bright],[.58,.48,brass],[.52,.57,iron],[.53,.65,amber],[.69,.96,amber],[.63,1.49,ivory],[.46,1.75,amber],[.55,1.79,brass],[.72,1.84,gold],[.74,1.9,bright],[.57,1.96,brass],[.40,2.17,patina],[.13,2.28,gold],[.12,2.39,bright],[.04,2.44,gold]];
      const cold=stage===0 && actionTimer===null;
      lathe(x,z,profile.map(([r,y,c])=>[r*k,y*k+baseY,cold&&c===amber?[125,108,82]:cold&&c===ivory?[153,143,114]:c]),36);
      for(let i=0;i<8;i++){
        const t=tau*i/8,c=Math.cos(t),s=Math.sin(t);
        for(const [lo,hi,r] of [[.44,.98,.70],[.98,1.85,.70]])
          block(x+c*r*k,baseY+lo*k,z+s*r*k,.055*k,(hi-lo)*k,.055*k,gold,.01);
      }
      lathe(x,z,[[.70*k,baseY+1.0*k,cold?[133,84,65]:[187,100,56]],[.70*k,baseY+1.045*k,cold?[148,99,76]:[213,141,72]]],36);
      lathe(x,z,[[.74*k,baseY+1.85*k,patina],[.745*k,baseY+1.88*k,[93,127,105]]],32);
      for(const y of [1.04,1.1,1.46])lathe(x,z,[[.69*k,baseY+y*k,gold],[.70*k,baseY+(y+.026)*k,brass]],32);
    }
    function handle(id,label,anchor,tag=anchor){
      points.push({id,label,pt:project(anchor),tag:project(tag)});
    }
    function rail(id,z,c,target){
      block(0,.86,z,4.8,.1,.43,iron);
      for(const zz of [-.18,.18])block(0,.96,z+zz,4.85,.055,.05,bright,.01);
      for(let i=0;i<=20;i++)block((i/20-.5)*4.3,1.02,z+.16,.02,.01,i%5===0?.22:.09,ivory,.002);
      const x=(values[id]/100-.5)*4.3;
      const targetX=(target/100-.5)*4.3, seated=Math.abs(values[id]-target)<=5;
      block(targetX,1,z-.38,.1,.12,.17,bright);
      // A spring pin sinks flush into its keeper when the carriage reaches the mark.
      lathe(targetX,z+.40,[[.095,.89,iron],[.095,.99,brass],[.065,seated?1.0:1.13,seated?patina:bright]],12);
      for(const side of [-1,1])block(x,.995,z+side*.18,.62,.07,.07,brass,.01);
      block(x,1.03,z,.78,.17,.55,brass);
      if(id==='lamp')lantern(x,z,1.18,.45);
      else{
        block(x,1.31,z,.76,.13,.50,c,.05,true);
        for(const side of [-1,1]){
          block(x+.30*side,1.16,z-.17,.08,.94,.09,c);
          block(x+.30*side,1.16,z+.17,.08,.22,.09,c);
        }
        block(x,1.89,z-.17,.75,.22,.10,c,.04,true);
        block(x,1.62,z-.17,.66,.07,.07,gold);
      }
      handle(id,id==='lamp'?'灯座':'椅轨',[x,1.55,z],[x,id==='lamp'?1.0:2.42,z+ (id==='lamp'?.4:0)]);
    }
    function bell(x,z,y,k=1){
      const tilt=reduced?0:Math.sin(swing*tau)*swing*.20+pull*.14;
      const lean=yy=>(y+1.4*k-yy)*tilt;
      const p=[[.64,0,brass],[.76,.04,bright],[.78,.13,gold],[.69,.21,brass],[.65,.27,gold],[.46,.59,patina],[.40,.91,patina],[.43,.96,gold],[.38,1.05,bright],[.27,1.16,patina],[.12,1.19,brass],[.10,1.4,gold]];
      lathe(x,z,p.map(([r,h,c])=>[r*k,y+h*k,c]),40,lean);
      const end=y-(.48+pull*.36)*k;
      const gripX=x+lean(end);
      lathe(x,z,[[.038*k,end,wood],[.043*k,y+.18*k,gold]],12,lean);
      lathe(gripX,z,[[.045*k,end-.12*k,brass],[.13*k,end-.06*k,lacquer],[.12*k,end+.025*k,bright],[.04*k,end+.11*k,gold]],16);
    }
    function wheel(){
      const t=(values.angle-70)*Math.PI/100,r=1.19,cy=2.29;
      const vertex=(rr,a,z)=>[rr*Math.cos(a),cy+rr*Math.sin(a),z];
      for(let i=0;i<40;i++){
        const a=t+i*tau/40,b=a+tau/40;
        face([vertex(r,a,.04),vertex(r,b,.04),vertex(r,b,-.14),vertex(r,a,-.14)],brass);
        face([vertex(r-.12,a,.08),vertex(r,a,.08),vertex(r,b,.08),vertex(r-.12,b,.08)],i%5?gold:bright);
      }
      const pane=(x,y,z)=>[x*Math.cos(t)-y*Math.sin(t),cy+x*Math.sin(t)+y*Math.cos(t),z];
      for(let i=-2;i<=2;i++){
        const x=i*.36,span=Math.sqrt((r-.09)**2-x*x);
        face([pane(x-.039,-span,.052),pane(x+.039,-span,.052),pane(x+.039,span,.052),pane(x-.039,span,.052)],wood);
        face([pane(-span,x-.033,.055),pane(span,x-.033,.055),pane(span,x+.033,.055),pane(-span,x+.033,.055)],wood);
      }
      for(let i=0;i<8;i++){
        const a=t+i*tau/8;
        face([vertex(.72,a,.09),vertex(.89,a+.13,.09),vertex(1.06,a,.09),vertex(.89,a-.13,.09)],bright);
      }
      const tip=t+Math.PI/2;
      face([vertex(.82,tip-.105,.11),vertex(1.14,tip,.11),vertex(.82,tip+.105,.11)],ivory);
      face([[-.1,3.65,0],[0,3.48,.04],[.10,3.65,0]],bright);
    }
    function draw(now){
      frame=0;
      const dt=Math.min(.05,(now-lastDraw)/1000||.016);lastDraw=now;
      const k=reduced?1:1-Math.exp(-dt*14);
      rotation+=(targetYaw-rotation)*k;zoom+=(targetZoom-zoom)*k;
      const drawerGoal=drag?.id==='drawer'?drag.goal:Number(drawerOpen);
      drawer+=Math.sign(drawerGoal-drawer)*Math.min(Math.abs(drawerGoal-drawer),dt*2.8);
      if(!ctx||!width||!height)return;
      ctx.clearRect(0,0,width,height);
      // Painted first because every part of the furniture sits above this plane.
      for(let j=-2;j<2;j++)for(let i=-3;i<3;i++){
        const x=i*1.13,z=j*.95, corners=[[x,z],[x+1.12,z],[x+1.12,z+.94],[x,z+.94]];
        ctx.beginPath();corners.forEach(([a,b],k)=>{const q=project([a,-.692,b]);if(k)ctx.lineTo(q[0],q[1]);else ctx.moveTo(q[0],q[1])});
        ctx.closePath();
        const lit=project([x,-.692,z]),far=project([x+1.12,-.692,z+.94]);
        const wash=ctx.createLinearGradient(lit[0],lit[1],far[0],far[1]);
        const pair=stage===2?['#64716ce8','#404f4ee8']:stage>=3?['#6c4940e8','#49302de8']:['#66503ce8','#45382de8'];
        wash.addColorStop(0,pair[(i+j)%2===0?0:1]);wash.addColorStop(1,pair[(i+j)%2===0?1:0]);
        ctx.fillStyle=wash;ctx.fill();
      }
      const ground=project([0,-.686,0]);
      ctx.save();ctx.translate(ground[0],ground[1]);ctx.scale(1,.20);
      const rad=scale*(stage===1?3.3:2.4);
      const shade=ctx.createRadialGradient(0,0,0,0,0,rad);shade.addColorStop(0,'#080402ce');shade.addColorStop(1,'#08040200');ctx.fillStyle=shade;ctx.fillRect(-rad,-rad,rad*2,rad*2);ctx.restore();
      // The captured action plays out before its chapter can advance.
      const progress=actionTimer===null?0:Math.min(1,(performance.now()-actionTime)/180);
      const travel=reduced?0:Math.max(press,Math.sin(progress*Math.PI/2));
      faces=[];points=[];
      if(stage===0||stage===4){
        base(3.15,2.16);lantern(0,-.12,.86,1.16);
        lathe(.75,.70,[[.23,.86,brass],[.26,.91,gold],[.21,.97,brass],[.21,1.08-.095*travel,bright],[.17,1.11-.095*travel,ivory]],20);
        if(stage===0)handle('act','按灯芯',[.75,1.08,.70],[1.30,1.16,1.05]);
      }else if(stage===1){
        base(5.45,2.72);rail('chair',-.61,wood,placementMarks.chair);rail('lamp',.63,patina,placementMarks.lamp);
        block(2.05,.86,.04,.98,.09,.42,iron);
        for(const x of [1.65,2.36])block(x,.94,.04,.12,.16,.42,brass);
        block(2.12-travel*.37,.97,.04,.74,.12,.22,gold);handle('act','扣锁栓',[2.12,1,.04],[2.35,1.47,.09]);
      }else if(stage===2){
        base(3.72,1.78);
        for(const x of [-1.34,1.34]){
          block(x,.85,0,.38,2.61,.38,wood,.07,true);
          for(const y of [.94,1.09,3.06])block(x,y,0,.42,.10,.42,gold);
        }
        block(0,3.38,0,3.55,.27,.46,lacquer,.06,'paint');
        block(0,3.34,0,.22,.12,.24,brass);
        bell(0,0,1.91,1.07);handle('act','拉铃绳',[0,1.34,0],[.68,1.25,.3]);
      }else if(stage===3){
        base(4.05,1.88);
        for(const x of [-.65,.65])block(x,.85,-.33,.14,2.83,.18,wood,.025,true);
        block(0,2.19,-.32,1.42,.19,.20,wood,.03,true);
        block(0,2.19,-.16,.19,.20,.40,brass);
        block(0,3.59,-.33,1.48,.14,.22,wood,.025,true);
        block(0,3.61,-.15,.19,.075,.46,brass);
        wheel();
        bell(1.52,.12,1.44,.47);
        block(1.52,.86,-.10,.12,1.30,.12,brass);block(1.52,2.08,0,.18,.09,.39,gold);
        handle('angle','转窗棂',[0,2.29,.1],[-.25,1.08,.45]);handle('act','牵袖拉铃',[1.52,1.24,.12],[1.78,1.71,.42]);
      }
      rearDrawer();
      if(Math.cos(rotation)<-.4)points=points.filter(point=>point.id==='drawer');
      faces.sort((a,b)=>a.depth-b.depth);
      for(const f of faces){
        const d=f.dots;ctx.beginPath();ctx.moveTo(d[0][0],d[0][1]);for(const p of d.slice(1))ctx.lineTo(p[0],p[1]);ctx.closePath();ctx.fillStyle=f.color;ctx.fill();ctx.strokeStyle=f.color;ctx.lineWidth=.55;ctx.stroke();
        if(f.grain==='paint' && d.length===4){
          const [a,b,,e]=d, tile=frieze();
          ctx.save();ctx.clip();
          ctx.transform((e[0]-a[0])/480,(e[1]-a[1])/480,(a[0]-b[0])/96,(a[1]-b[1])/96,b[0],b[1]);
          ctx.globalAlpha=.87;ctx.drawImage(tile,0,0);ctx.restore();
        }else if(f.grain && d.length===4){
          ctx.save();ctx.clip();ctx.lineWidth=.7;
          for(let i=1;i<=12;i++){
            const t=i/13,a=d[0],b=d[1],c=d[3],e=d[2];
            ctx.strokeStyle=i%3?'#30170844':'#f1b16a30';
            ctx.beginPath();ctx.moveTo(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);
            ctx.lineTo(c[0]+(e[0]-c[0])*t,c[1]+(e[1]-c[1])*t);ctx.stroke();
          }ctx.restore();
        }
      }
      if(stage===1 || stage===4 || (stage===0 && progress>0)){
        const small=stage===1;
        const center=small?[(values.lamp/100-.5)*4.3,1.77,.63]:[0,2.28,-.12];
        const [x,y]=project(center),r=Math.max(1,scale*(small?.50:1.03)*zoom);
        const strength=stage===0?progress:1;
        const light=ctx.createRadialGradient(x,y,0,x,y,r);
        light.addColorStop(0,'rgba(255,224,151,'+(.51*strength)+')');
        light.addColorStop(.39,'rgba(249,170,70,'+(.23*strength)+')');
        light.addColorStop(1,'rgba(249,146,40,0)');
        ctx.fillStyle=light;ctx.fillRect(x-r,y-r,2*r,2*r);
      }
      if(playing&&Math.cos(rotation)>-.4){
        const toScreen=p=>{const q=project(p);return [q[0],q[1],1]};
        const line=(pts,done,dash)=>traceLine(ctx,toScreen,pts,done,dash);
        if(stage===1){
          for(const [key,z] of [['chair',-.61],['lamp',.63]])if(allowed(key)){
            drawPlacement(key,(placementMarks[key]/100-.5)*4.3,1.18,z,values[key],line,true);
          }
        }else if(stage===3&&allowed('angle'))drawPlacement('angle',0,2.29,.13,values.angle,line,true);
        if(stage===0&&allowed('act'))seal(ctx,toScreen([.75,1.34,.7]),'flame');
        if(stage===1&&allowed('act'))line([[1.94,1.15,.05],[1.65,1.15,.05],[1.74,1.24,.05]],false,false);
        if((stage===2||stage===3)&&allowed('act')){
          const [x,y,z]=stage===2?[0,1.28,0]:[1.52,1.18,.12];
          line([[x,y,z],[x,y-.32,z],[x-.09,y-.21,z]],false,false);
          line([[x,y-.32,z],[x+.09,y-.21,z]],false,false);
        }
      }else if(playing&&allowed('drawer')&&Math.cos(rotation)<-.4){
        const z=-drawerDepth()/2-.90;
        traceLine(ctx,p=>{const q=project(p);return [q[0],q[1],1]},[[-.90,.32,z],[.90,.32,z],[.90,.61,z],[-.90,.61,z],[-.90,.32,z]],drawerOpen);
      }
      const inspect=document.getElementById('inspect');
      inspect.textContent=Math.cos(targetYaw)<0?'查看正面':'查看匣背';
      if(Math.abs(targetYaw-rotation)>.001||Math.abs(zoom-targetZoom)>.001||Math.abs(drawerGoal-drawer)>.00001)schedule();
      placeControls();if(actionTimer!==null&&!reduced)schedule();
      if(swing>.01){swing=Math.max(0,swing-dt*1.92);schedule()}
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(draw)}
    function resize(){
      width=host.clientWidth;height=host.clientHeight;
      const ratio=Math.min(window.devicePixelRatio||1,2);
      const pixelsW=Math.round(width*ratio),pixelsH=Math.round(height*ratio);
      if(canvas.width!==pixelsW||canvas.height!==pixelsH){
        canvas.width=pixelsW;canvas.height=pixelsH;ctx?.setTransform(ratio,0,0,ratio,0,0);
      }
      scale=Math.min(width/(stage===1?6.5:5.7),height/4.65);
      schedule();
    }
    const isBell=()=>stage===2||stage===3;
    function abortGesture(){
      drag=null;lookDrag=null;press=0;pull=0;
      schedule();
    }
    function abortAction(){
      if(actionTimer!==null)clearTimeout(actionTimer);
      actionTimer=null;abortGesture();
    }
    function fire(){
      if(!playing||!allowed('act')||stage===4||actionTimer!==null)return;
      if(isBell()&&!reduced)swing=1;
      actionTime=performance.now();schedule();
      actionTimer=setTimeout(()=>{
        actionTimer=null;press=0;pull=0;onAction();schedule();
      },reduced?0:210);
    }
    function start(id,e){
      if(!playing||!allowed(id)||!e.isPrimary||e.button!==0||drag||lookDrag||actionTimer!==null)return;
      e.preventDefault();e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag={id,start:e.clientX,top:e.clientY,value:id==='drawer'?drawer:values[id],pointer:e.pointerId,goal:drawer,distance:0};
      if(id==='act'){press=.55;pull=0;schedule()}
    }
    function move(e){
      if(!drag||e.pointerId!==drag.pointer)return;
      if(drag.id==='drawer'){
        drag.goal=Math.max(0,Math.min(1,drag.value+(e.clientY-drag.top)/Math.max(26,scale*.6)));
        schedule();return;
      }
      if(drag.id==='act'){
        const dx=e.clientX-drag.start,dy=e.clientY-drag.top;
        drag.distance=Math.max(drag.distance,Math.hypot(dx,dy));
        pull=Math.max(0,Math.min(1,dy/Math.max(24,Math.min(55,.55*scale))));
        press=Math.min(1,.55+pull*.45);schedule();return;
      }
      const delta=(e.clientX-drag.start) / Math.max(1,scale*(drag.id==='angle'?2.6:4.3));
      onMove(drag.id,Math.max(0,Math.min(100,Math.round(drag.value+100*delta))));
    }
    function finish(e){
      if(!drag||e.pointerId!==drag.pointer)return;
      if(drag.id==='drawer'){const tap=Math.hypot(e.clientX-drag.start,e.clientY-drag.top)<7;
        move(e);const pulledOpen=drag.goal>=.5;drag=null;
        if(tap||pulledOpen!==drawerOpen)operateDrawer();else schedule();
        return}
      if(drag.id!=='act'){drag=null;return}
      move(e);
      const engage=drag.distance<=7||(isBell()&&pull>=.76);
      drag=null;
      if(engage){press=0;fire()}else abortGesture();
    }
    function placeControls(){
      for(const [id,btn] of controls)if(!points.some(p=>p.id===id)){btn.remove();controls.delete(id)}
      for(const {id,label,tag} of points){
        let btn=controls.get(id);
        if(!btn){
          btn=document.createElement('button');btn.type='button';btn.className='prop-hot';
          if(id!=='act'&&id!=='drawer'){
            btn.setAttribute('role','slider');btn.setAttribute('aria-valuemin','0');btn.setAttribute('aria-valuemax','100');
          }
          btn.onpointerdown=e=>start(id,e);btn.onpointermove=move;btn.onpointerup=finish;btn.onpointercancel=cancelPointer;
          btn.onkeydown=e=>{
            if(!playing)return;
            if((id==='act'||id==='drawer')&&[' ','Enter'].includes(e.key)){e.stopPropagation();e.preventDefault();if(!e.repeat){if(id==='drawer')operateDrawer();else fire()}return}
            if(id==='act'||id==='drawer'||!['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
            e.stopPropagation();e.preventDefault();
            onMove(id,e.key==='Home'?0:e.key==='End'?100:Math.max(0,Math.min(100,requestedMark(id)+(['ArrowLeft','ArrowDown'].includes(e.key)?-1:1)*(e.shiftKey?5:1))));
          };
          btn.onclick=e=>{if(!e.detail){if(id==='act')fire();if(id==='drawer')operateDrawer()}};
          host.append(btn);controls.set(id,btn);
        }
        btn.style.left=tag[0]+'px';btn.style.top=tag[1]+'px';
        btn.disabled=!allowed(id);btn.hidden=!playing||btn.disabled;btn.textContent=id==='act'&&isBell()&&drag?.id==='act'?(pull>=.76?'松手响铃':'向下拉绳'):label+(id==='act'||id==='drawer'?'':' · '+values[id]);
        btn.setAttribute('aria-label',id==='act'||id==='drawer'?label:label+'，左右拖动或用方向键调整');
        if(id!=='act'&&id!=='drawer')btn.setAttribute('aria-valuenow',values[id]);

      }
    }
    canvas.onpointerdown=e=>{
      if(!playing||!e.isPrimary||drag||lookDrag||e.button!==0)return;
      const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      const nearest=points.map(p=>[p,Math.hypot(x-p.pt[0],y-p.pt[1])]).sort((a,b)=>a[1]-b[1])[0];
      if(nearest&&nearest[1]<Math.max(22,scale*(stage===3?.75:.66)))start(nearest[0].id,e);
      else {lookDrag={id:e.pointerId,x:e.clientX,rotation:targetYaw};canvas.setPointerCapture(e.pointerId)}
    };
    canvas.onpointermove=e=>{
      if(lookDrag?.id===e.pointerId){targetYaw=lookDrag.rotation+(e.clientX-lookDrag.x)*.009;schedule()}
      else move(e);
    };
    canvas.onpointerup=e=>{if(lookDrag?.id===e.pointerId)lookDrag=null;finish(e)};canvas.onpointercancel=cancelPointer;
    window.addEventListener('blur',abortAction);
    function cancelPointer(e){
      if(drag?.pointer!==e.pointerId&&lookDrag?.id!==e.pointerId)return;
      stopPropTravel();abortGesture();
    }
    const lostCapture=cancelPointer;
    host.addEventListener('lostpointercapture',lostCapture);
    const observer=new ResizeObserver(resize);observer.observe(host);
    return {inspectRear,update(next,state,active){
      const sig=[next,state.role,state.chair,state.lamp,state.angle,active].join('/');
      if(sig===signature)return;
      signature=sig;
      if(stage!==next||role!==state.role||!active)abortAction();
      role=state.role;
      if(stage!==next){rotation=targetYaw=-.27;zoom=targetZoom=1;drawer=0;drawerOpen=false;swing=0}
      stage=next;values={chair:state.chair,lamp:state.lamp,angle:state.angle};playing=active;
      scale=Math.min(width/(stage===1?6.5:5.7),height/4.65);schedule();
    },destroy(){abortAction();window.removeEventListener('blur',abortAction);host.removeEventListener('lostpointercapture',lostCapture);observer.disconnect();cancelAnimationFrame(frame);canvas.remove();for(const b of controls.values())b.remove()}};
  };
})();
