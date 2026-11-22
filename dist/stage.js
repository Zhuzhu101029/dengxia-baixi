// The supporting foot travels 138.24 pixels per 320-pixel cell over one cycle.
const apprenticeHeight=1.81;
const apprenticeCycle=apprenticeHeight*138.24/320;
// Perspective stage, lit extruded silhouettes, floor shadows and a travelling camera.
function theatre(canvas,software=false) {
  const gl = !software && canvas.getContext('webgl', { alpha:true, antialias:true, premultipliedAlpha:false });
  const paper = gl ? null : canvas.getContext('2d');
  if (!gl && !paper) return null;
  let buf, un;
  if (gl) {
  const program = gl.createProgram();
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader,source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program,shader);
  }
  compile(gl.VERTEX_SHADER,`attribute vec3 p,n;attribute vec3 pigment;
    uniform vec3 eye,right,up,forward,light;uniform float aspect,illum;
    varying mediump vec3 color;
    void main(){vec3 v=p-eye;float d=dot(v,forward);
    gl_Position=vec4(dot(v,right)*2.5/aspect,dot(v,up)*2.5,1.002*d-.201,d);
    vec3 ray=light-p;float sun=max(0.,dot(n,normalize(vec3(-.55,.95,.65))));
    float lamp=max(0.,dot(n,normalize(ray)))*min(1.,22./(2.+dot(ray,ray)));
    color=pigment*(vec3(.52,.55,.56)+.47*sun+illum*lamp*vec3(.89,.55,.23));}`);
  compile(gl.FRAGMENT_SHADER,'precision mediump float; varying mediump vec3 color;void main(){gl_FragColor=vec4(color,1.);}');
  gl.linkProgram(program); if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error('着色器连接失败');
  gl.useProgram(program); buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  ['p','n','pigment'].forEach((name,i)=>{const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,36,12*i)});
  un=Object.fromEntries(['eye','right','up','forward','light','aspect','illum'].map(k=>[k,gl.getUniformLocation(program,k)]));
  }
  const sub=(a,b)=>a.map((v,i)=>v-b[i]), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>a.map(v=>v/(Math.hypot(...a)||1));
  const colors=new Map();let data=[],origin=[0,0,0],yaw=0,orbit=-.11,focus=0,aim=0,camHeight=4.8,camRadius=12.65,velocity=[0,0,0,0,0];
  function point(x,y,z){return [origin[0]+Math.cos(yaw)*x+Math.sin(yaw)*z,origin[1]+y,origin[2]-Math.sin(yaw)*x+Math.cos(yaw)*z]}
  function tri(a,b,c,col){if(!colors.has(col))colors.set(col,[0,2,4].map(i=>parseInt(col.slice(i,i+2),16)/255));let normal=unit(cross(sub(b,a),sub(c,a)));for(const pt of [a,b,c])data.push(...pt,...normal,...colors.get(col))}
  function face(a,b,c,d,col){tri(a,b,c,col);tri(a,c,d,col)}
  function box(x,y,z,w,h,d,col){let pts=[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1]].map(([a,b,c])=>point(x+a*w/2,y+b*h/2,z+c*d/2));for(const f of [[0,1,2,3],[1,5,6,2],[3,2,6,7],[4,0,3,7],[5,4,7,6],[4,5,1,0]])face(...f.map(i=>pts[i]),col)}
  function panel(coords,z,depth,col){let a=coords.map(([x,y])=>point(x,y,z+depth/2)),b=coords.map(([x,y])=>point(x,y,z-depth/2));for(let i=1;i<a.length-1;i++){tri(a[0],a[i],a[i+1],col);tri(b[0],b[i+1],b[i],col)}for(let i=0;i<a.length;i++){let j=(i+1)%a.length;face(a[i],b[i],b[j],a[j],col)}}
  function oval(x,y,z,rx,ry,depth,col){panel(Array.from({length:16},(_,i)=>[x+rx*Math.cos(i*Math.PI/8),y+ry*Math.sin(i*Math.PI/8)]),z,depth,col)}
  function limb(x,y,ex,ey,r,z,col){const d=Math.hypot(ex-x,ey-y)||1,dx=-(ey-y)*r/d,dy=(ex-x)*r/d;panel([[x+dx,y+dy],[x-dx,y-dy],[ex-dx,ey-dy],[ex+dx,ey+dy]],z,r*1.6,col)}
  // A stack of elliptical cross sections describes the silhouette and folds of a garment.
  function shape(cx,cy,cz,rings,color,sides=12,pleat=0){
    let prev;
    for(const [h,rx,rz,shift=0] of rings){
      const ring=[];
      for(let j=0;j<sides;j++){
        const a=j*2*Math.PI/sides,fold=1+(j%2?pleat:-pleat);
        ring.push(point(cx+rx*Math.cos(a)*fold,cy+h,cz+shift+rz*Math.sin(a)*fold));
      }
      if(prev)for(let j=0;j<sides;j++){
        const k=(j+1)%sides;
        face(prev[j],ring[j],ring[k],prev[k],color);
      }
      prev=ring;
    }
  }
  // Tapered cloth around an articulated shoulder, elbow, hip or knee.
  function bone(start,end,r1,r2,color){
    const a=point(...start),b=point(...end),axis=unit(sub(b,a));
    const side=unit(cross(axis,Math.abs(axis[0])>.87?[0,0,1]:[1,0,0])),front=cross(axis,side);
    const at=(p,r,j)=>p.map((v,k)=>v+r*(side[k]*Math.cos(j*Math.PI/4)+front[k]*Math.sin(j*Math.PI/4)));
    for(let j=0;j<8;j++)face(at(a,r1,j),at(a,r1,j+1),at(b,r2,j+1),at(b,r2,j),color);
  }
  // Derive contacts from world distance. Within a stance interval the toe anchor
  // stays at one world point even while the torso turns or the player reverses.
  const footLanes=new Map();
  function footTarget(x,sign,facing,weight,opera){
    const stride=1.12, stance=.57, offset=sign<0?.5:0;
    const step=x/stride+offset, index=Math.floor(step), phase=step-index;
    const u=Math.max(0,(phase-stance)/(1-stance)), eased=u*u*(3-2*u);
    const anchor=(index+stance*.5-offset+eased)*stride;
    const desired=-sign*.115*Math.sin(facing);
    const laneId=(opera?2:0)+(sign>0?1:0);let foot=footLanes.get(laneId);
    if(!foot){foot={lane:desired};footLanes.set(laneId,foot)}
    if(u>0)foot.lane+=(desired-foot.lane)*Math.min(1,Math.sin(Math.PI*u)*.42);
    const dx=anchor-x,dz=foot.lane;
    return [Math.cos(facing)*dx-Math.sin(facing)*dz,
      .102+.145*Math.sin(Math.PI*u)**2*weight,
      Math.sin(facing)*dx+Math.cos(facing)*dz];
  }
  function actor(x,y,z,opera,motion,facing,t,sleeve,finale,grip=null){
    const {phase,weight}=motion, skin=opera?'eac9b1':'c99776',hair='302a29';
    const coat=opera?'446c77':'344154', sleeveColor=opera?'527d83':'45536a',hem=opera?'b88e5c':'61443b';
    origin=[x,y,z];yaw=facing;
    const pelvis=.88+.025*weight*Math.cos(2*phase)-(grip?.bend||0);
    const breath=.009*Math.sin(t*1.8+(opera?1.2:0)),torso=pelvis+breath;
    const greeting=finale;
    for(const sign of [-1,1]){
      const hip=[sign*.112,pelvis,0],ankle=footTarget(x,sign,facing,weight,opera);
      const axis=unit(sub(ankle,hip)),span=Math.hypot(...sub(ankle,hip));
      const forwardKnee=unit([-axis[0]*axis[2],-axis[1]*axis[2],1-axis[2]**2]);
      const bend=Math.sqrt(Math.max(0,.445**2-span**2/4));
      const knee=hip.map((v,i)=>(v+ankle[i])/2+forwardKnee[i]*bend);
      const reach=ankle[2]/.32;
      bone(hip,knee,.093,.075,'413c3a');bone(knee,ankle,.078,.056,opera?'393a3c':'494342');
      shape(ankle[0],ankle[1]-.101,ankle[2],[[0,.07,.126],[.027,.078,.14],[.068,.073,.136],[.11,.059,.079,-.035],[.112,0,0,-.035]],hair,10);
      const arm=-reach*.21,wristUp=sign>0?greeting:0;
      const shoulder=[sign*.215,torso+.48,.002],elbow=[sign*(.244+.07*wristUp),torso+.245+.135*wristUp,-.032+arm*.62];
      const hand=[sign*(.237+.10*wristUp),torso+.04+.345*wristUp,.074+arm+.17*wristUp];
      if(grip){
        // The back rail is modelled in this same local basis. Both wrists follow it.
        hand[0]=sign*.25;hand[1]=1.19+grip.height;hand[2]=.39;
        const axis=unit(sub(hand,shoulder)),span=Math.hypot(...sub(hand,shoulder));
        const guide=[sign*.45,-.85,-.20],along=dot(guide,axis);
        const out=unit(guide.map((v,i)=>v-along*axis[i]));
        const bend=Math.sqrt(Math.max(0,.30*.30-span*span/4));
        for(let i=0;i<3;i++)elbow[i]=(hand[i]+shoulder[i])/2+out[i]*bend;
      }
      bone(shoulder,elbow,.112,.098,sleeveColor);bone(elbow,hand,.098,opera?.105:.068,sleeveColor);
      const cuff=hand.map((v,k)=>v+(elbow[k]-v)*.12);
      bone(cuff,hand,opera?.107:.071,opera?.107:.071,opera?'e9d7b5':hem);
      shape(hand[0],hand[1]-.035,hand[2],[[ -.047,.027,.027],[.016,.048,.041],[.062,.038,.033]],skin,8);
      if(opera&&sleeve&&sign>0)bone(hand,[hand[0]+.028,hand[1]-.226,hand[2]-.09*weight],.08,.055,'ebddbe');
    }
    const robe=[[opera?-.50:-.31,.30,.19],[0,.209,.149],[.13,.175,.13],[.37,.22,.158],[.46,.224,.146],[.51,.135,.103],[.52,.084,.087]];
    shape(0,torso,0,robe,coat,16,.038);
    shape(0,torso,0,[[robe[0][0],.304,.194],[robe[0][0]+.033,.30,.192]],hem,16,.038);
    shape(0,torso,0,[[.09,.196,.147],[.157,.182,.144]],opera?'bba06e':'493b35',16);
    bone([-.085,torso+.508,.091],[.112,torso+.255,.139],.019,.018,opera?'e5d1a7':'c1997a');
    bone([.085,torso+.51,.093],[.005,torso+.405,.148],.014,.015,hem);
    shape(0,torso+.467,0,[[0,.08,.076],[.14,.074,.074]],skin);
    const head=torso+.57-.035*greeting;
    shape(0,head,.002,[[0,.041,.062,.027],[.028,.081,.083,.022],[.08,.107,.102,.016],[.144,.122,.109],[.205,.117,.105],[.251,.091,.088],[.269,.018,.024]],skin,16);
    const h=head+.13;
    for(const sign of [-1,1]){
      oval(sign*.114,h,.016,.021,.04,.04,skin);
      limb(.027*sign,h+.023,.078*sign,h+.028,.005,.100,hair);
      limb(.029*sign,h+.005,.076*sign,h+.010,.004,.106,'443330');
      if(opera)limb(.066*sign,h+.012,.093*sign,h+.024,.004,.087,'9a5049');
    }
    shape(0,h-.041,.11,[[0,.022,.013],[.016,.024,.029],[.066,.009,.007]],skin,8);
    limb(-.032,h-.068,.029,h-.067,.005,.107,'9b655b');
    shape(0,h,0,[[.035,.123,.108,-.012],[.088,.123,.113],[.133,.098,.095],[.151,.024,.03]],hair,14);
    if(opera){
      shape(0,h+.070,0,[[0,.132,.118],[.04,.143,.122],[.10,.125,.111],[.157,.087,.082],[.166,0,0]],'33494e',14);
      shape(0,h+.086,0,[[0,.145,.124],[.016,.144,.123]],'d1aa66',14);
      for(const sign of [-1,1]){limb(sign*.11,h+.14,sign*.264,h+.195,.012,0,'504d43');oval(sign*.269,h+.195,0,.035,.015,.017,'c3a269')}
      oval(0,h+.15,.105,.026,.033,.018,'ba644d');
    }else{
      shape(0,h+.104,-.07,[[0,.074,.072],[.073,.086,.077],[.113,.053,.047],[.125,0,0]],hair);
      limb(-.12,h+.16,.116,h+.20,.009,-.065,'bc986a');
    }
    origin=[0,0,0];yaw=0;
  }
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  // Paint the same projected triangles back to front on devices without a GPU context.
  function paint(eye,right,up,forward,light,brightness,w,h){
    paper.clearRect(0,0,w,h);
    const faces=[], sun=unit([-.55,.95,.65]), scale=h*1.25;
    for(let i=0;i<data.length;i+=27){
      const normal=data.slice(i+3,i+6);
      if(dot(normal,sub(eye,data.slice(i,i+3)))<=0)continue;
      const xy=[];let depth=0;
      for(let j=i;j<i+27;j+=9){
        const v=[data[j]-eye[0],data[j+1]-eye[1],data[j+2]-eye[2]], z=dot(v,forward);
        if(z<.1)break;
        xy.push(w/2+dot(v,right)*scale/z,h/2-dot(v,up)*scale/z);depth+=z;
      }
      if(xy.length!==6)continue;
      const n=data.slice(i+3,i+6),ray=sub(light,data.slice(i,i+3));
      const lamp=brightness*Math.max(0,dot(n,unit(ray)))*Math.min(1,22/(2+dot(ray,ray)));
      const day=.47*Math.max(0,dot(n,sun));
      const rgb=[.52,.55,.56].map((base,k)=>Math.min(255,Math.round(255*data[i+6+k]*(base+day+lamp*[.89,.55,.23][k]))));
      faces.push([depth,xy,'rgb('+rgb.join(',')+')']);
    }
    faces.sort((a,b)=>b[0]-a[0]);
    for(const [,xy,color] of faces){
      paper.beginPath();paper.moveTo(xy[0],xy[1]);paper.lineTo(xy[2],xy[3]);paper.lineTo(xy[4],xy[5]);paper.closePath();
      paper.fillStyle=color;paper.fill();paper.strokeStyle=color;paper.lineWidth=.55;paper.stroke();
    }
  }
  const wx=n=>(n-50)*.162;
  const apprentice=document.getElementById('apprentice');
  const actorFrames=['azhao-idle.png','azhao-walk.png'];
  for(const url of actorFrames){const image=new Image();image.src=url}
  const environments=new Map();
  let warmth, bridgeReveal, bellSide, finalPose=0;
  return function draw(s,visual,t,dt){
    const w=Math.max(2,Math.round(canvas.clientWidth*Math.min(devicePixelRatio||1,gl?1.6:1.1))),h=Math.max(2,Math.round(canvas.clientHeight*w/Math.max(1,canvas.clientWidth)));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    if(gl){gl.viewport(0,0,w,h);
    gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);}
    // Critically damped tracking preserves incoming camera velocity on cuts or reversed input.
    function track(current,destination,index,frequency) {
      const error=current-destination, carry=velocity[index]+frequency*error;
      const decay=Math.exp(-frequency*dt);
      velocity[index]=(velocity[index]-frequency*carry*dt)*decay;
      return destination+(error+carry*dt)*decay;
    }
    const turn=s.stage===3?(s.angle-50)*.006:s.stage===1?(s.lamp-50)*.0022:0;
    const lens=[11.4,11.8,10.9,11.35,13.8][s.stage];
    const subject=visual.work?36+visual.work.position*.24:s.role==='b'?visual.b:visual.a;
    orbit=track(orbit,(s.role==='b'?.115:-.11)+turn+visual.look,0,3.4);
    focus=track(focus,s.role==='b'? .18:0,1,3.8);
    aim=track(aim,s.stage===4?0:wx(subject)*(w/h<1.25?.92:.38),2,3.6);
    camHeight=track(camHeight,visual.work?2.95:s.stage===4?5.4:s.role==='b'?4.05:4.8,3,3.3);
    camRadius=track(camRadius,visual.work?6.7:s.stage===4?13.8:!visual.started?14.6:lens+(s.role==='b'?-.4:0),4,3.2);
    const eye=[aim+Math.sin(orbit)*camRadius,camHeight,Math.cos(orbit)*camRadius],target=[aim,1.72+focus,0],forward=unit(sub(target,eye)),right=unit(cross(forward,[0,1,0])),up=cross(right,forward);
    const targetWarmth=[.2,1,.88,.7,1.25][s.stage];
    warmth=(warmth??targetWarmth)+(targetWarmth-(warmth??targetWarmth))*(1-Math.exp(-dt*2.4));
    finalPose+=((s.stage===4?1:0)-finalPose)*(1-Math.exp(-dt*2));
    const light=[wx(18+s.lamp*.1),2.4,.4],brightness=warmth;
    canvas.parentElement.style.setProperty('--parallax',(50+orbit*18)+'%');
    if(gl){for(const [k,v] of Object.entries({eye,right,up,forward,light}))gl.uniform3fv(un[k],v);
    gl.uniform1f(un.aspect,w/h);gl.uniform1f(un.illum,brightness);}
    const room=s.stage<2?'shop':s.stage===2?'river':'opera';
    if(!environments.has(room)){
      data=[];
      const river=room==='river', opera=room==='opera';
      const wood=opera?'713d35':'644731',trim=opera?'cf9d5f':'ad8558';
      const planks=['68503f','745742','6e513c','604a3b'];
      const stone=['72716b','827d72','696b67','7e7b73'];
      // Front walkway and side masonry terminate at the water line. The channel
      // beneath the arch sits below the two banks, leaving an actual opening.
      for(let col=0;col<20;col++){
        const x=-8+(col+.5)*.8;
        for(let row=0;row<4;row++){
          const z=-1.92+row*1.28;
          if(river&&row<3&&Math.abs(x)<3.2)continue;
          box(x,-.095,z,.795,.19,1.275,(river?stone:planks)[(col+row*3)%4]);
        }
        box(x,-.37,2.47,.8,.54,.23,river?'625f59':wood);
        if(!river)box(x,-.36,2.60,.58,.22,.04,opera?'9d653e':'826045');
      }
      // The foreground path sits on a coursed retaining wall, the wooden stages on a plinth.
      for(let row=0;row<4;row++){
        for(let col=0;col<13;col++){
          const lo=Math.max(-8,-8+(col-(row%2)*.5)*1.34);
          const hi=Math.min(8,-8+(col+1-(row%2)*.5)*1.34);
          if(hi>lo)box((lo+hi)/2,-.72-row*.36,2.46,hi-lo-.009,.357,.26,river?stone[(row+col)%4]:'615346');
        }
      }
      if(river){
        box(0,-.85,-.90,6.45,.08,4.35,'3f6768');
        for(let j=0;j<19;j++){
          const x=-2.9+(j*1.37)%5.8,z=-2.65+(j*.79)%3.82;
          box(x,-.799,z,.17+(j%4)*.09,.008,.025,'73908c');
        }
        // Each wedge shares its radial edge with the next voussoir.
        const count=15;
        for(let j=0;j<count;j++){
          const a=j*Math.PI/count,b=(j+1)*Math.PI/count;
          const xy=(r,t)=>[r*Math.cos(t),-.77+r*.50*Math.sin(t)];
          panel([xy(2.69,a),xy(2.96,a),xy(2.96,b),xy(2.69,b)],-.88,.69,stone[j%4]);
          const ax=2.96*Math.cos(a),bx=2.96*Math.cos(b);
          panel([[ax,-.77+1.48*Math.sin(a)],[ax,.77],[bx,.77],[bx,-.77+1.48*Math.sin(b)]],-.88,.67,stone[(j+1)%4]);
        }
        for(const x of [-3.11,3.11])box(x,-.01,-.88,.39,1.59,.82,'696960');
        for(const x of [-4.65,4.65]){
          box(x,.43,-.88,2.74,.86,.82,'75726a');
          for(const offset of [-1,0,1])box(x+offset,1.21,-1.29,.13,.69,.14,'989487');
          box(x,1.51,-1.29,2.21,.10,.12,'858578');
        }
      }else{
        box(0,-.69,2.45,16.1,.10,.32,'49382d');
        box(0,-.13,2.58,16,.055,.07,trim);
        // Wings and solid window casings flank the opening into the scenic plate.
        for(const side of [-1,1]){
          const cx=side*5.47,z=-2.14;
          box(cx,1.81,z,3.3,3.62,.22,opera?'56352f':'a39175');
          box(cx,1.09,z+.14,2.66,1.86,.09,wood);
          box(cx,2.60,z+.14,2.58,1.05,.075,opera?'a88866':'c6b48d');
          for(const x of [-1.35,-.90,-.45,0,.45,.90,1.35])
            box(cx+x,2.58,z+.21,.054,1.21,.081,wood);
          for(const y of [2.0,2.34,2.83,3.18])box(cx,y,z+.21,2.75,.065,.081,wood);
          for(const xx of [3.80,7.12]){
            const x=side*xx;
            box(x,1.91,z+.18,.27,3.82,.33,wood);
            box(x,.16,z+.18,.48,.32,.48,'817d70');
            box(x,3.60,z+.18,.55,.22,.48,trim);
          }
          const lampX=side*6.75;
          box(lampX,2.28,z+.28,.22,.44,.10,'5a4938');
          box(lampX,2.48,z+.46,.07,.075,.39,'977a4c');
          box(lampX,2.40,z+.64,.03,.13,.035,'b29966');
          shape(lampX,1.89,z+.64,[[0,.10,.10],[.04,.155,.13],[.33,.153,.13],[.40,.115,.10],[.46,.025,.025]],'d7a86a',8);
          box(lampX,1.91,z+.64,.27,.05,.25,'66523b');
          if(opera){
            for(let j=0;j<7;j++){
              const x=side*(3.94+j*.115),bottom=1.85-j*.16;
              box(x,(bottom+3.67)/2,-1.80,.12,3.67-bottom,.09,'81392f');
              box(x,bottom,-1.80,.12,.05,.105,trim);
            }
          }else{
            for(const y of [.62,1.46])box(cx,y,-1.7,2.44,.09,.62,wood);
            for(const dx of [-1.08,1.08])box(cx+dx,.75,-1.7,.09,1.5,.4,wood);
            for(let k=0;k<3;k++)box(cx-.67+k*.52,1.67,-1.72,.41,.35,.33,k===1?'927b57':'80523b');
          }
        }
        box(0,3.83,-2.0,14.7,.28,.46,wood);
        box(0,3.69,-1.76,14.65,.055,.075,trim);
      }
      environments.set(room,data);
    }
    data=environments.get(room).slice();
    const left=wx(33),rightEnd=wx(67),z=-.88,deckY=.98;
    function deck(lo,hi){box((lo+hi)/2,deckY-.11,z,hi-lo,.22,.75,'504138');box((lo+hi)/2,deckY-.035,z+.38,hi-lo,.047,.03,'d3a975')}
    for(const x of room==='river'?[]:[wx(20),left-.18,rightEnd+.18,wx(78)]){
      box(x,.47,z,.115,.94,.28,'6e4b34');box(x,.12,z,.29,.24,.43,'8a6c52');
    }
    deck(wx(18),left);deck(rightEnd,wx(80));
    const lit=s.stage===0?0:1;
    bridgeReveal=(bridgeReveal??lit)+(lit-(bridgeReveal??lit))*(1-Math.exp(-5*dt));
    if(bridgeReveal>.007){
      const end=visual.lo+(visual.hi-visual.lo)*bridgeReveal;
      deck(visual.lo,end);
      for(let n=0;n<14;n++){
        const x=visual.lo+n*(end-visual.lo)/13;
        box(x,deckY-.075,z+.378,.073,.025,.023,'ffdc99');
      }
      if(room!=='river'){
        for(const f of [.22,.78]){
          const x=visual.lo+(end-visual.lo)*f;
          box(x,.39,z,.095,.78,.20,'72523b');
          box(x,.045,z,.48,.09,.52,'9c764f');
        }
      }
    }
    const work=visual.work;
    const cx=room==='river'?-3.9:wx(36+(work?work.position:s.chair)*.24);
    const chairHeight=work?work.height:0;
    origin=[cx,chairHeight,.24];yaw=work?0:-.3;
    for(let x of [-.29,.29])for(let z of [-.25,.25])box(x,.27,z,.085,.54,.085,'583c2e');
    box(0,.56,0,.72,.12,.64,'ab7650');for(let x of [-.29,.29])box(x,.91,-.25,.075,.74,.08,'80573d');box(0,1.20,-.25,.66,.14,.09,'a9784f');origin=[0,0,0];yaw=0;
    // A portable lamp is bolted to a vertical backboard and hooked to its bracket.
    const lx=wx(17+s.lamp*.09),lz=room==='river'?1.1:.1;
    box(lx,.065,lz,.49,.13,.46,'797369');box(lx,.91,lz,.24,1.72,.15,'644936');
    box(lx+.19,1.72,lz,.57,.09,.13,'76553c');
    limb(lx,1.42,lx+.34,1.69,.034,lz,'946b44');
    box(lx+.42,1.62,lz,.036,.17,.04,'a38250');
    box(lx+.42,1.51,lz,.35,.08,.36,'65462f');
    box(lx+.42,1.28,lz,.29,.39,.30,s.stage?'f4bc64':'957d5a');
    box(lx+.42,1.08,lz,.33,.05,.34,'65462f');
    const side=s.stage>=3?1:0;
    bellSide=(bellSide??side)+(side-(bellSide??side))*(1-Math.exp(-4.3*dt));
    for(const [gx,level] of [[wx(74),1-bellSide],[wx(25),bellSide]]){
      if(level<.02)continue;
      // A cantilever post is fixed to the stone or wooden landing at the rear.
      const back=z-.30,post=gx+.32;
      box(post,1.59,back,.12,1.24,.13,'71513a');
      box(post,1.04,back,.21,.13,.21,'ae8758');
      box(gx+.15,2.19,back,.52,.105,.16,'684c36');
      box(gx,2.17,z-.12,.09,.11,.45,'806246');
      box(gx,1.995,z,.042,.32,.042,'b99455');
      shape(gx,1.69,z,[[0,.13,.13],[.04,.115,.115],[.13,.078,.078],[.16,.044,.044]],'bb9758');
      box(gx,1.64,z,.032,.14,.033,'c7a263');
      oval(gx,1.56,z,.055,.056,.05,'e5c283');
    }
    // The apprentice walks downstage, the furniture sits midstage and the puppet walks on the raised rear deck.
    for(const k of ['a','b']){if(k==='b'&&!s.stage)continue;const x=wx(visual[k]),y=k==='a'?0:deckY,zp=k==='a'?1.65:z;
    origin=[x,y+.009,zp];yaw=0;
    for(let j=0;j<12;j++){
      const a=j*Math.PI/6,b=(j+1)*Math.PI/6;
      tri(point(0,0,0),point(.27*Math.cos(b),0,.12*Math.sin(b)),point(.27*Math.cos(a),0,.12*Math.sin(a)),'40352d');
    }
    if(k==='a'&&work){
      actor(cx,0,-.40,false,{phase:cx*2*Math.PI/1.12,weight:work.moving},0,t,false,0,{height:chairHeight,bend:.055+chairHeight*.18});
      origin=[0,0,0];yaw=0;continue;
    }
    if(k==='a'){
      const base=sub([x,y,zp],eye),top=sub([x,y+apprenticeHeight,zp],eye);
      const screenY=v=>.5-1.25*dot(v,up)/dot(v,forward);
      const floor=screenY(base);
      apprentice.style.left=(50+125*h/w*dot(base,right)/dot(base,forward))+'%';
      apprentice.style.top=(floor*canvas.clientHeight)+'px';
      apprentice.style.height=(Math.max(.03,floor-screenY(top))*canvas.clientHeight)+'px';
      const motion=visual.motion.a, walking=motion.weight>.045;
      const count=16,frame=Math.floor(motion.phase/(2*Math.PI)*count)%count;
      apprentice.classList.toggle('striding',walking);
      apprentice.style.transform='translate(-50%,-98.75%) scaleX('+visual.dir.a+')';
      apprentice.style.backgroundPositionX=walking?(100*frame/(count-1))+'%':'50%';
      origin=[0,0,0];yaw=0;continue;
    }
    actor(x,y+.014,zp,k==='b',visual.motion[k],visual.motion[k].yaw,t,s.stage>=3,finalPose)}
    if(!gl){paint(eye,right,up,forward,light,brightness,w,h);return}
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,data.length/9);
  }
}

