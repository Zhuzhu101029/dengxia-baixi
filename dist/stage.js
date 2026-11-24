// Perspective stage, lit extruded silhouettes, floor shadows and a travelling camera.
function theatre(canvas,software=false) {
  const gl = !software && canvas.getContext('webgl', { alpha:true, antialias:true, premultipliedAlpha:false });
  const paper = gl ? null : canvas.getContext('2d');
  if (!gl && !paper) return null;
  let buf,un,attributes;
  const materials=new Map();
  const roomColors={shop:[1.055,1.015,.965],river:[.92,1.045,1.095],opera:[1.09,.985,.94]};
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
    varying mediump vec3 color,world,material,surface;
    void main(){world=p;material=pigment;vec3 v=p-eye;float d=dot(v,forward);
    gl_Position=vec4(dot(v,right)*2.5/aspect,dot(v,up)*2.5,1.002*d-.201,d);
    color=pigment; surface=n; }`);
  compile(gl.FRAGMENT_SHADER,`precision highp float;
    varying mediump vec3 world,material,surface;
    uniform vec3 roomTint,light,eye,clothOrigin;uniform float timber,printed,illum,cloth,atlasReady;
    uniform sampler2D wallPrint,oak,courtyard;
    void main(){
      vec3 n=normalize(surface), q=world-clothOrigin;
      float timberTone=step(.085, material.r-material.b)*(1.-step(.64,material.r));
      float stone=1.-smoothstep(.055,.14,material.r-material.b);
      vec2 tile=cloth>.5?vec2(.5,.5):timberTone>.5?vec2(0.):stone>.5?vec2(0.,.5):vec2(.5,0.);
      vec2 uv=abs(n.y)>.72?q.xz:abs(n.x)>.78?q.zy:q.xy;
      if(cloth>.5)uv=vec2(q.x+.52*q.z,q.y)*2.1;
      else uv*=vec2(.46,.69);
      vec2 mirrorUV=1.-abs(mod(uv,2.)-1.);
      vec3 samplePaint=texture2D(oak,tile+.004+.492*mirrorUV).rgb;
      float average=cloth>.5?.28:timberTone>.5?.31:stone>.5?.49:.73;
      float relief=dot(samplePaint,vec3(.30,.59,.11))-average;
      vec3 pigment=material*(1.+atlasReady*clamp(relief*1.85,-.38,.36));
      vec3 ray=light-world; float r2=dot(ray,ray);
      float fire=illum*(.28+.72*max(0.,dot(n,normalize(ray))))/(1.+.68*r2);
      float side=max(0.,dot(n,normalize(vec3(-.57,.74,.45))));
      float rim=cloth*.09*pow(1.-abs(dot(n,normalize(eye-world))),2.);
      vec3 finish=pigment*(vec3(.57,.62,.66)+side*.39+max(0.,n.y)*.09-rim);
      // A broad reflected highlight describes the curved profile of foreground pieces.
      vec3 viewDir=normalize(eye-world), halfway=normalize(viewDir+normalize(vec3(-.55,.82,.62)));
      float sheen=pow(max(0.,dot(n,halfway)),18.);
      finish+=(1.-timber)*(.026+.042*cloth)*sheen*vec3(1.,.86,.69);
      if(timber>.5 && printed>.5 && world.z>-2.99 && world.z< -2.925 && abs(world.x)<3.53 && world.y>.80 && world.y<4.29){
        finish=texture2D(wallPrint,vec2((world.x+3.53)/7.06,(4.29-world.y)/3.49)).rgb*.97;
      }
      // The painted outdoor view sits behind the lattice, with timber mullions left in front.
      float wing=abs(world.x)-5.47;
      if(timber>.5 && world.z>-1.967 && world.z< -1.958 && abs(wing)<1.29 && world.y>2.075 && world.y<3.125){
        vec2 view=vec2((world.x+7.)/14.,.28+(3.125-world.y)*.26);
        finish=mix(pigment,texture2D(courtyard,view).rgb,.87)*.94;
      }
      float scroll=abs(world.x)-8.60;
      if(timber>.5 && world.z>-3.081 && world.z< -3.074 && abs(scroll)<.66 && world.y>1.61 && world.y<4.25){
        vec2 view=vec2((world.x<0.?.21:.75)+scroll*.20,.12+(4.25-world.y)*.30);
        finish=texture2D(courtyard,view).rgb*.96;
      }
      vec2 wall=vec2(abs(world.x)-4.,world.y-4.2);
      float spill=.11/(1.+2.*dot(wall,wall)+1.4*(world.z+2.8)*(world.z+2.8));
      finish=finish*roomTint+vec3(.99,.52,.16)*(pigment+.085)*fire+spill*vec3(1.,.57,.23);
      gl_FragColor=vec4(finish,1.);
    }`);
  gl.linkProgram(program); if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error('着色器连接失败');
  gl.useProgram(program); buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  attributes=['p','n','pigment'].map(name=>gl.getAttribLocation(program,name));
  for(const a of attributes)gl.enableVertexAttribArray(a);
  un=Object.fromEntries(['eye','right','up','forward','light','aspect','illum','timber','printed','roomTint','cloth','clothOrigin','atlasReady'].map(k=>[k,gl.getUniformLocation(program,k)]));
  gl.uniform1i(gl.getUniformLocation(program,'wallPrint'),0);
  gl.uniform1i(gl.getUniformLocation(program,'oak'),1);
  gl.uniform1i(gl.getUniformLocation(program,'courtyard'),2);
  for(const name of ['shop','river','opera','oak','courtyard']){
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([128,128,128,255]));
    for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    const material={texture,ready:false};materials.set(name,material);
    if(location.protocol==='file:')continue;
    const img=new Image();
    img.onload=()=>{if(gl.isContextLost())return;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);material.ready=true;redrawUntil=performance.now()+400};
    img.src=name==='courtyard'?'night-playhouse.jpg':name==='oak'?'painted-materials.jpg':'screen-'+name+'.jpg';
  }
  }
  if (paper) {
    for (const name of ['shop','river','opera']){
      const img=new Image();img.onload=()=>{materials.set(name,img);redrawUntil=performance.now()+400};
      img.src='screen-'+name+'.jpg';
    }
  }
  const sub=(a,b)=>a.map((v,i)=>v-b[i]), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>a.map(v=>v/(Math.hypot(...a)||1));
  const colors=new Map();let data=[],origin=[0,0,0],yaw=0,orbit=-.11,focus=0,aim=0,camHeight=2.6,camRadius=12.65,velocity=[0,0,0,0,0];
  function point(x,y,z){return [origin[0]+Math.cos(yaw)*x+Math.sin(yaw)*z,origin[1]+y,origin[2]-Math.sin(yaw)*x+Math.cos(yaw)*z]}
  function tri(a,b,c,col){if(!colors.has(col))colors.set(col,[0,2,4].map(i=>parseInt(col.slice(i,i+2),16)/255));let normal=unit(cross(sub(b,a),sub(c,a)));for(const pt of [a,b,c])data.push(...pt,...normal,...colors.get(col))}
  function face(a,b,c,d,col){tri(a,b,c,col);tri(a,c,d,col)}
  function box(x,y,z,w,h,d,col){let pts=[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1]].map(([a,b,c])=>point(x+a*w/2,y+b*h/2,z+c*d/2));for(const f of [[0,1,2,3],[1,5,6,2],[3,2,6,7],[4,0,3,7],[5,4,7,6],[4,5,1,0]])face(...f.map(i=>pts[i]),col)}
  // Rounded furniture retains its original outer dimensions and contact surfaces.
  const edgeProfiles=new Map();
  function roundedBox(x,y,z,w,h,d,col,radius=.025){
    const r=Math.min(radius,w*.40,h*.40,d*.40);
    const key=[w,h,d,r].join('/');
    let profile=edgeProfiles.get(key);
    if(!profile){
      const rings=[];
      for(const [height,angle] of [[-h/2+r,-Math.PI/2],[-h/2+r,-Math.PI/4],[-h/2+r,0],[h/2-r,0],[h/2-r,Math.PI/4],[h/2-r,Math.PI/2]]){
        const ring=[];
        for(let corner=0;corner<4;corner++){
          const sx=corner===0||corner===3?1:-1,sz=corner<2?1:-1;
          for(let j=0;j<=3;j++){
            const a=(corner+j/3)*Math.PI/2;
            const nx=Math.cos(a)*Math.cos(angle),nz=Math.sin(a)*Math.cos(angle),ny=Math.sin(angle);
            ring.push([sx*(w/2-r)+r*nx,height+r*ny,sz*(d/2-r)+r*nz,nx,ny,nz]);
          }
        }
        rings.push(ring);
      }
      profile=[];
      for(let j=0;j<16;j++){
        const k=(j+1)%16;
        for(let i=1;i<rings.length;i++){
          const lo=rings[i-1],hi=rings[i];profile.push(lo[j],hi[j],hi[k],lo[j],hi[k],lo[k]);
        }
        profile.push([0,-h/2,0,0,-1,0],rings[0][j],rings[0][k],[0,h/2,0,0,1,0],rings[5][k],rings[5][j]);
      }
      edgeProfiles.set(key,profile);
    }
    if(!colors.has(col))colors.set(col,[0,2,4].map(i=>parseInt(col.slice(i,i+2),16)/255));
    const rgb=colors.get(col),c=Math.cos(yaw),sn=Math.sin(yaw),center=point(x,y,z);
    for(const [u,v,w0,nx,ny,nz] of profile)data.push(center[0]+c*u+sn*w0,center[1]+v,center[2]-sn*u+c*w0,c*nx+sn*nz,ny,-sn*nx+c*nz,...rgb);
  }
  function panel(coords,z,depth,col){let a=coords.map(([x,y])=>point(x,y,z+depth/2)),b=coords.map(([x,y])=>point(x,y,z-depth/2));for(let i=1;i<a.length-1;i++){tri(a[0],a[i],a[i+1],col);tri(b[0],b[i+1],b[i],col)}for(let i=0;i<a.length;i++){let j=(i+1)%a.length;face(a[i],b[i],b[j],a[j],col)}}
  function oval(x,y,z,rx,ry,depth,col){panel(Array.from({length:16},(_,i)=>[x+rx*Math.cos(i*Math.PI/8),y+ry*Math.sin(i*Math.PI/8)]),z,depth,col)}
  function limb(x,y,ex,ey,r,z,col){const d=Math.hypot(ex-x,ey-y)||1,dx=-(ey-y)*r/d,dy=(ex-x)*r/d;panel([[x+dx,y+dy],[x-dx,y-dy],[ex-dx,ey-dy],[ex+dx,ey+dy]],z,r*1.6,col)}
  // A stack of elliptical cross sections describes the silhouette and folds of a garment.
  function shape(cx,cy,cz,rings,color,sides=12,pleat=0){
    const levels=rings.map(([h,rx,rz,shift=0])=>Array.from({length:sides},(_,j)=>{
      const a=j*2*Math.PI/sides,fold=1+(j%2?pleat:-pleat);
      return point(cx+rx*Math.cos(a)*fold,cy+h,cz+shift+rz*Math.sin(a)*fold);
    }));
    if(!colors.has(color))colors.set(color,[0,2,4].map(i=>parseInt(color.slice(i,i+2),16)/255));
    const rgb=colors.get(color);
    const smooth=levels.map((ring,i)=>ring.map((v,j)=>{
      const prev=levels[Math.max(0,i-1)],next=levels[Math.min(levels.length-1,i+1)];
      const tangent=sub(ring[(j+1)%sides],ring[(j+sides-1)%sides]);
      const n=unit(cross(sub(next[j],prev[j]),tangent));
      return Math.hypot(...n)>.1?n:[0,i?1:-1,0];
    }));
    for(let i=1;i<levels.length;i++)for(let j=0;j<sides;j++){
      const k=(j+1)%sides;
      for(const [layer,index] of [[i-1,j],[i,j],[i,k],[i-1,j],[i,k],[i-1,k]])
        data.push(...levels[layer][index],...smooth[layer][index],...rgb);
    }
  }
  // Tapered cloth around an articulated shoulder, elbow, hip or knee.
  function bone(start,end,r1,r2,color){
    const a=point(...start),b=point(...end),axis=unit(sub(b,a));
    const side=unit(cross(axis,Math.abs(axis[0])>.87?[0,0,1]:[1,0,0])),front=cross(axis,side);
    const count=r1>.047?16:8, length=Math.hypot(...sub(b,a))||1;
    if(!colors.has(color))colors.set(color,[0,2,4].map(i=>parseInt(color.slice(i,i+2),16)/255));
    const rgb=colors.get(color);
    const lo=[],hi=[];
    for(let j=0;j<count;j++){
      const angle=2*Math.PI*j/count,radial=side.map((v,i)=>v*Math.cos(angle)+front[i]*Math.sin(angle));
      const normal=unit(radial.map((v,i)=>v+axis[i]*(r1-r2)/length));
      lo.push([...a.map((v,i)=>v+r1*radial[i]),...normal,...rgb]);
      hi.push([...b.map((v,i)=>v+r2*radial[i]),...normal,...rgb]);
    }
    for(let j=0;j<count;j++){
      const k=(j+1)%count;data.push(...lo[j],...lo[k],...hi[k],...lo[j],...hi[k],...hi[j]);
    }
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
  // Keep stance feet on the floor in world coordinates. Only the lifted foot
  // travels, including the short recovery steps after stopping or turning.
  const gaits=new Map();
  function walkFeet(role,x,z,facing,time){
    const c=Math.cos(facing),sn=Math.sin(facing);
    const rest=[-1,1].map(k=>[x+k*.12*c,z-k*.12*sn]);
    let g=gaits.get(role);
    if(!g||time<g.time||Math.hypot(x-g.x,z-g.z)>.58||time-g.time>1){
      g={feet:rest.map(pt=>pt.slice()),x,z,time,step:null,last:1};
      gaits.set(role,g);
    }
    const dt=Math.max(.001,time-g.time),vx=(x-g.x)/dt,vz=(z-g.z)/dt;
    const speed=Math.hypot(vx,vz),heights=[0,0];
    if(!g.step){
      const errors=rest.map((pt,i)=>Math.hypot(pt[0]-g.feet[i][0],pt[1]-g.feet[i][1]));
      const other=1-g.last;
      const i=errors[other]>.024?other:1-other;
      if(errors[i]>(speed>.03?.105:.024)){
        const lead=Math.min(.19,.17/Math.max(.01,speed));
        g.step={i,start:time,from:g.feet[i].slice(),to:[rest[i][0]+vx*lead,rest[i][1]+vz*lead],duration:speed>.03?.205:.18};
      }
    }
    if(g.step){
      const {i,from,to,start,duration}=g.step;
      const f=Math.min(1,(time-start)/duration),u=f*f*(3-2*f);
      g.feet[i]=from.map((v,j)=>v+(to[j]-v)*u);
      heights[i]=Math.min(.105,Math.hypot(to[0]-from[0],to[1]-from[1])*.42)*Math.sin(Math.PI*f)**2;
      if(f===1){g.last=i;g.step=null}
    }
    if(g.step || rest.some((pt,i)=>Math.hypot(pt[0]-g.feet[i][0],pt[1]-g.feet[i][1])>.024))
      redrawUntil=Math.max(redrawUntil,time*1000+260);
    g.x=x;g.z=z;g.time=time;
    return g.feet.map(([fx,fz],i)=>[c*(fx-x)-sn*(fz-z),.102+heights[i],sn*(fx-x)+c*(fz-z)]);
  }
  function actor(x,y,z,opera,motion,facing,t,sleeve,finale,grip=null,wick=null,touch=null){
    const {phase,weight}=motion, skin=opera?'eac9b1':'c99776',hair='302a29';
    const coat=opera?'326e73':'334762', sleeveColor=opera?'579391':'506682',hem=opera?'b47743':'6e4346';
    origin=[x,y,z];yaw=facing;
    const freeWalk=!grip&&!touch&&wick===null;
    const feet=freeWalk?walkFeet(opera,x,z,facing,t):null;
    if(!freeWalk)gaits.delete(opera);
    const pelvis=.88-.011*weight*(1-Math.cos(2*phase))-(grip?.bend||0)-(touch?.reach||0)*.055;
    const breath=.009*Math.sin(t*1.8+(opera?1.2:0)),torso=pelvis+breath;
    const greeting=finale;
    for(const sign of [-1,1]){
      const hip=[sign*.112,pelvis,0];
      let ankle;
      if(grip){
        // For a side-step each shoe stays on its own side of the other shoe.
        const stride=.36, offset=sign<0?.5:0, step=x/stride+offset;
        const phase=step-Math.floor(step), swing=Math.max(0,(phase-.5)*2);
        const planted=(Math.floor(step)+.25-offset+eased(swing))*stride;
        ankle=[sign*.18-(planted-x)*weight,.102+.07*Math.sin(Math.PI*swing)**2*weight,0];
      }else if(feet){
        ankle=feet[sign<0?0:1];
      }else{
        ankle=motion.depthWalk?footTarget(z,sign,facing+Math.PI*.5,weight,opera):footTarget(x,sign,facing,weight,opera);
        ankle[0]=sign*.12+(ankle[0]-sign*.12)*weight;
        ankle[2]*=weight;
      }
      const axis=unit(sub(ankle,hip)),span=Math.hypot(...sub(ankle,hip));
      const forwardKnee=unit([-axis[0]*axis[2],-axis[1]*axis[2],1-axis[2]**2]);
      // Resting hip-to-ankle distance is .778. A slight forward bias
      // keeps the relaxed knee just off lock without forcing a permanent squat.
      const bend=Math.sqrt(Math.max(.012**2,.3895**2-span**2/4));
      const knee=hip.map((v,i)=>(v+ankle[i])/2+forwardKnee[i]*bend);
      const reach=ankle[2]/.32;
      bone(hip,knee,.093,.075,'413c3a');bone(knee,ankle,.078,.056,opera?'393a3c':'494342');
      shape(ankle[0],ankle[1]-.101,ankle[2],[[0,.07,.126],[.027,.078,.14],[.068,.073,.136],[.11,.059,.079,-.035],[.112,0,0,-.035]],hair,10);
      const arm=-reach*.21,wristUp=sign>0?greeting:0;
      const shoulder=[sign*.215,torso+.48,.002],elbow=[sign*(.244+.07*wristUp),torso+.245+.135*wristUp,-.032+arm*.62];
      const hand=[sign*(.237+.10*wristUp),torso+.04+.345*wristUp,.074+arm+.17*wristUp];
      if(grip || ((wick!==null||touch) && sign===1)){
        // The back rail is modelled in this same local basis. Both wrists follow it.
        if(grip){
          const target=[sign*.25,1.21+grip.height,.35];
          for(let i=0;i<3;i++)hand[i]+=(target[i]-hand[i])*grip.blend;
        }
        else if(touch){
          const [tx,ty,tz]=touch.point,dx=tx-x,dz=tz-z;
          const local=[Math.cos(facing)*dx-Math.sin(facing)*dz,ty-y-touch.pull,Math.sin(facing)*dx+Math.cos(facing)*dz];
          // Approach the visible front surface; the torso stays outside the station.
          if(!touch.ground&&touch.kind!=='light')local[2]-=.16;
          if(touch.kind==='light'){local[1]-=.15;local[2]-=.11}
          for(let i=0;i<3;i++)hand[i]+=(local[i]-hand[i])*touch.reach;
          if(touch.kind==='light'){
            const tip=[hand[0],hand[1]+.15,hand[2]+.11];bone(hand,tip,.016,.012,'ad8050');
            shape(...tip,[[0,.019,.019],[.036,.016,.016],[.072,.001,.001]],'ffd28b',8);
          }
        }else {
          const reach=Math.sin(Math.PI*Math.min(1,wick/.98))**.7;
          hand[0]=.15;hand[1]=1.02+.16*reach;hand[2]=.14+.24*reach;
          const tip=[hand[0],hand[1]+.17,hand[2]+.15];
          bone(hand,tip,.016,.012,'ad8050');
          shape(...tip,[[0,.021,.021],[.035,.018,.018],[.082,.001,.001]],'ffd28b',8);
        }
        const axis=unit(sub(hand,shoulder)),span=Math.hypot(...sub(hand,shoulder));
        const guide=[sign*.45,-.85,-.20],along=dot(guide,axis);
        const out=unit(guide.map((v,i)=>v-along*axis[i]));
        const bend=Math.sqrt(Math.max(0,.30*.30-span*span/4));
        for(let i=0;i<3;i++)elbow[i]=(hand[i]+shoulder[i])/2+out[i]*bend;
      }
      // Rounded sleeve heads and elbow folds bridge both segments as the arm bends.
      for(const [joint,r] of [[shoulder,.108],[elbow,.096]]){
        shape(joint[0],joint[1],joint[2],[[-r,.001,.001],[-r*.65,r*.76,r*.76],[0,r,r],[r*.65,r*.76,r*.76],[r,.001,.001]],sleeveColor,16);
      }
      bone(shoulder,elbow,.112,.098,sleeveColor);bone(elbow,hand,.098,opera?.105:.068,sleeveColor);
      const cuff=hand.map((v,k)=>v+(elbow[k]-v)*.12);
      bone(cuff,hand,opera?.107:.071,opera?.107:.071,opera?'e9d7b5':hem);
      if(grip&&grip.blend>.85){
        // Knuckles rest above the top lip. Four fingertips curl down the near face.
        const top=1.29+grip.height;
        bone(hand,[hand[0],top,.405],.030,.023,skin);
        for(let f=0;f<4;f++){
          const xx=hand[0]+(f-1.5)*.018;
          bone([xx,top,.405],[xx,top+.007,.54],.012,.012,skin);
          bone([xx,top+.007,.54],[xx,top-.033,.55],.012,.008,skin);
        }
      }
      shape(hand[0],hand[1]-.035,hand[2],[[ -.047,.027,.027],[.016,.048,.041],[.062,.038,.033]],skin,8);
      if(sign>0&&touch&&((touch.kind==='take'&&touch.transferred)||(touch.kind==='fit'&&!touch.transferred))){
        const [hx,hy,hz]=hand;
        if(touch.chapter===1)box(hx,hy+.032,hz+.014,.29,.052,.024,'c99c69');
        else if(touch.chapter===2&&touch.slot!==1){
          shape(hx,hy-.13,hz,[[0,.025,.025],[.03,.059,.059],[.085,.041,.041],[.17,.014,.014]],'c0995a',10);
        }else if(touch.slot===1){
          for(let j=0;j<3;j++)oval(hx,hy-.015+j*.015,hz+.018,.058,.044,.015,touch.chapter===3?'b65545':'ac885a');
        }else limb(hx,hy-.05,hx+.045,hy+.17,.010,hz+.018,'dfbc7e');
      }
      if(opera&&sleeve&&sign>0)bone(hand,[hand[0]+.028,hand[1]-.226,hand[2]-.09*weight],.08,.055,'ebddbe');
    }
    const robe=[[opera?-.50:-.31,.30,.19],[0,.209,.149],[.13,.175,.13],[.37,.22,.158],[.46,.224,.146],[.51,.135,.103],[.52,.084,.087]];
    shape(0,torso,0,robe,coat,28,.022);
    shape(0,torso,0,[[robe[0][0],.304,.194],[robe[0][0]+.033,.30,.192]],hem,28,.022);
    shape(0,torso,0,[[.09,.196,.147],[.157,.182,.144]],opera?'bba06e':'493b35',16);
    // The player's moving costume carries its trim on the garment surface.
    for (const side of [-1,1]) {
      const border=opera?'b2996d':'706e5d';
      for(let j=0;j<(opera?5:3);j++){
        const h=robe[0][0]+.068+j*.038, x=side*(.121+.014*Math.sin(j*1.6));
        bone([x,torso+h,.171],[x+side*.029,torso+h+.017,.165],.005,.004,border);
      }
    }
    // Dyed silk binding, a narrow inner piping and the woven waist tie.
    shape(0,torso,0,[[.102,.197,.148],[.119,.192,.148]],opera?'933f40':'406a68',24);
    shape(0,torso,0,[[.145,.184,.145],[.154,.183,.145]],opera?'ecbd70':'ad9d79',24);
    const edgeY=robe[0][0];
    shape(0,torso,0,[[edgeY+.040,.298,.189],[edgeY+.052,.295,.188]],opera?'e6bc7c':'879888',28,.018);
    const backTrim=opera?'be965e':'697e87';
    for(const dir of [-1,1]){
      bone([0,torso+.387,-.164],[dir*.09,torso+.417,-.151],.007,.007,backTrim);
      bone([dir*.09,torso+.417,-.151],[dir*.165,torso+.452,-.107],.007,.005,backTrim);
    }
    const sash=opera?'dbc79d':'ac896b';
    const collar=[[-.076,.506,.083],[-.058,.476,.144],[-.020,.417,.166],[.052,.336,.163],[.113,.250,.130]];
    for(let i=1;i<collar.length;i++){
      const at=p=>[p[0],torso+p[1],p[2]];
      bone(at(collar[i-1]),at(collar[i]),.013,.013,sash);
    }
    bone([.08,torso+.50,.096],[-.002,torso+.408,.169],.012,.012,hem);
    for(const y of [.20,.235])bone([.097,torso+y,.124],[.138,torso+y,.11],.007,.007,sash);
    shape(0,torso+.467,0,[[0,.08,.076],[.14,.074,.074]],skin);
    const head=torso+.548-.035*greeting;
    // Each face has its own cross sections, chin, cheeks and forehead.
    const outline=opera
      ? [[0,.025,.046,.037],[.031,.058,.078,.031],[.077,.086,.104,.019],
         [.131,.110,.110,.005],[.172,.112,.104],[.218,.105,.102],[.271,.082,.091],[.286,.018,.032]]
      : [[0,.047,.063,.022],[.027,.086,.084,.016],[.060,.111,.099,.012],
         [.103,.133,.111,.008],[.148,.136,.109],[.198,.129,.108],[.236,.098,.091],[.256,.030,.031]];
    shape(0,head,0,outline,skin,32);
    // A continuous rear hairline follows the skull down to the nape.
    if(!opera){
      for(let i=3;i<outline.length-1;i++)for(let j=0;j<16;j++){
        function lock(layer,index){
          const [h,rx,rz,shift=0]=outline[layer],a=Math.PI+Math.PI*index/16;
          return point((rx+.002)*Math.cos(a),head+h+(layer===3?.045*Math.abs(Math.cos(a)):0),shift+(rz+.003)*Math.sin(a));
        }
        face(lock(i,j),lock(i+1,j),lock(i+1,j+1),lock(i,j+1),hair);
      }
    }
    function faceDepth(x,y){
      let j=1;
      while(j<outline.length-1&&outline[j][0]<y)j++;
      const lo=outline[j-1],hi=outline[j],f=Math.max(0,Math.min(1,(y-lo[0])/(hi[0]-lo[0])));
      const radius=lo[1]+(hi[1]-lo[1])*f;
      const depth=lo[2]+(hi[2]-lo[2])*f;
      const shift=(lo[3]||0)*(1-f)+(hi[3]||0)*f;
      return shift+depth*Math.sqrt(Math.max(0,1-(x/radius)**2));
    }
    // Thin strips follow the face around the cheekbone, including in profile.
    // Each column supplies x, the lower edge and the upper edge.
    function ribbon(sign,columns,tint,layer=.0025){
      const edge=(col,i)=>point(sign*col[0],head+col[i],faceDepth(sign*col[0],col[i])+layer);
      for(let j=1;j<columns.length;j++){
        const a=columns[j-1],b=columns[j];
        const quad=[edge(a,1),edge(b,1),edge(b,2),edge(a,2)];
        if(sign<0)quad.reverse();
        face(...quad,tint);
      }
    }
    const eyeY=opera?.153:.136;
    for(const sign of [-1,1]){
      const eyeX=opera?.048:.060;
      oval(sign*(opera?.109:.130),head+.120,.003,.020,.035,.029,skin);
      if(opera){
        ribbon(sign,[[.018,.151,.167],[.040,.137,.179],[.071,.143,.185],[.091,.154,.184],[.104,.170,.177]],'b96a6b');
        ribbon(sign,[[.019,.152,.156],[.040,.144,.162],[.062,.147,.166],[.079,.155,.165],[.097,.172,.174]],'442d36',.0045);
        ribbon(sign,[[.024,.153,.154],[.043,.148,.157],[.059,.150,.160],[.075,.156,.159]],'e4c7ac',.0065);
        ribbon(sign,[[.021,.180,.184],[.041,.184,.191],[.065,.192,.198],[.089,.196,.200],[.100,.196,.197]],'392b31');
      }else{
        ribbon(sign,[[.026,.136,.138],[.045,.126,.147],[.065,.125,.148],[.086,.130,.145],[.091,.135,.138]],'604237');
        ribbon(sign,[[.031,.135,.137],[.049,.129,.144],[.064,.128,.145],[.079,.132,.142],[.086,.136,.138]],'e9cdb1',.0048);
        const raised=sign<0?.004:0;
        ribbon(sign,[[.028,.161,.170],[.048,.166+raised,.177+raised],[.072,.170+raised,.178+raised],[.093,.166,.169]],'4d372e');
      }
      const irisX=sign*eyeX;
      oval(irisX,head+eyeY,faceDepth(irisX,eyeY)+.008,opera?.0056:.0074,opera?.0052:.0084,.005,'302828');
    }
    const noseY=opera?.084:.080;
    shape(0,head+noseY,.107,opera?
      [[0,.014,.010],[.011,.019,.024],[.025,.014,.031],[.083,.009,.008]]:
      [[0,.021,.012],[.010,.029,.022],[.026,.022,.022],[.053,.013,.009]],skin,12);
    if(opera){
      ribbon(1,[[-.030,.057,.058],[-.014,.053,.062],[0,.051,.060],[.013,.053,.063],[.029,.060,.061]],'a2494f',.004);
    }else{
      ribbon(1,[[-.035,.062,.064],[-.018,.057,.061],[.002,.055,.059],[.021,.056,.061],[.039,.063,.066]],'935f51',.004);
      for(const [x,y] of [[.074,.109],[.082,.111],[.088,.105],[-.086,.112]])
        oval(x,head+y,faceDepth(x,y)+.003,.0023,.0019,.003,'94664e');
    }
    const h=head+.13;
    if(opera){
      shape(0,h,0,[[.061,.113,.108],[.087,.117,.113],[.137,.086,.094],[.15,.024,.03]],hair,16);
      for(const sign of [-1,1])ribbon(sign,[[.083,.201,.218],[.090,.160,.212],[.101,.142,.205],[.109,.153,.198]],hair,.005);
      shape(0,h+.081,0,[[0,.129,.120],[.040,.142,.123],[.111,.120,.113],[.163,.070,.086],[.170,0,0]],'324954',16);
      shape(0,h+.095,0,[[0,.141,.124],[.012,.143,.124]],'cfaf73',16);
      for(const sign of [-1,1]){
        panel([[sign*.106,h+.144],[sign*.170,h+.156],[sign*.262,h+.204],[sign*.249,h+.215],[sign*.157,h+.182]],-.006,.022,'40545b');
        limb(sign*.131,h+.156,sign*.252,h+.207,.004,.009,'c7ab79');
      }
      oval(0,h+.157 ,.123,.026,.034,.019,'b99a63');
      oval(0,h+.159,.135,.015,.022,.012,'9d5351');
      // A white undercollar and paired gold couching frame the painted face.
      bone([-.085,torso+.510,.091],[.019,torso+.387,.169],.020,.018,'e5d7b8');
      for(const sign of [-1,1]){
        bone([sign*.130,torso+.414,.130],[sign*.164,torso+.387,.110],.005,.004,'d4b77f');
        bone([sign*.164,torso+.387,.110],[sign*.154,torso+.365,.126],.004,.004,'d4b77f');
      }
    }else{
      shape(0,h,0,[[.067,.128,.106],[.079,.129,.109],[.111,.105,.097],[.137,.033,.039]],hair,16);
      // A side part leaves the right brow clear; a longer lock hooks by the ear.
      ribbon(1,[[-.112,.157,.218],[-.099,.161,.232],[-.083,.177,.237],[-.061,.188,.240],[-.039,.199,.244],[-.022,.204,.247],[.002,.213,.248],[.030,.220,.242]],hair,.009);
      ribbon(1,[[.024,.217,.231],[.060,.207,.227],[.091,.190,.215],[.113,.154,.196],[.119,.133,.173]],hair,.005);
      shape(-.030,h+.091,-.081,[[0,.087,.072],[.043,.094,.084],[.085,.068,.063],[.105,.025,.029]],hair,14);
      bone([-.136,h+.126,-.065],[.101,h+.165,-.077],.008,.005,'b38d53');
      oval(-.134,h+.126,-.063,.015,.014,.018,'c9a362');
      shape(-.035,h+.125,-.093,[[0,.088,.074],[.014,.088,.074]],'865347',14);
    }
    origin=[0,0,0];yaw=0;
  }
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  // Paint the same projected triangles back to front on devices without a GPU context.
  function paint(env,eye,right,up,forward,light,brightness,w,h){
    paper.clearRect(0,0,w,h);
    const mural=materials.get(env.room);
    const shell=[],faces=[], sun=unit([-.55,.95,.65]), scale=h*1.25;
    for(const mesh of [env.mesh,data])for(let i=0;i<mesh.length;i+=27){
      const pt=mesh.slice(i,i+3),n=mesh.slice(i+3,i+6);
      if(dot(n,sub(eye,pt))<=0)continue;
      const vertices=[];
      for(let j=i;j<i+27;j+=9){
        const v=sub(mesh.slice(j,j+3),eye);vertices.push([dot(v,right),dot(v,up),dot(v,forward)]);
      }
      const xy=[];let depth=0;
      const project=v=>{xy.push(w/2+v[0]*scale/v[2],h/2-v[1]*scale/v[2]);depth+=v[2]};
      for(let j=0;j<3;j++){
        const a=vertices[(j+2)%3],b=vertices[j];
        if((a[2]>=.101)!==(b[2]>=.101)){
          const f=(.101-a[2])/(b[2]-a[2]);project([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,.101]);
        }
        if(b[2]>=.101)project(b);
      }
      if(xy.length<6)continue;
      const ray=sub(light,pt);
      const lamp=brightness*Math.max(0,dot(n,unit(ray)))*(1/(1+.68*dot(ray,ray)));
      const day=.47*Math.max(0,dot(n,sun));
      const rgb=[.52,.55,.56].map((base,k)=>Math.min(255,Math.round(255*mesh[i+6+k]*(mesh===env.mesh?env.tint[k]:1)*(base+day+lamp*[.89,.55,.23][k]))));
      let uv;
      if(mural && mesh===env.mesh && xy.length===6 && vertices.every(v=>v[2]>=.101) &&
         [i,i+9,i+18].every(j=>mesh[j+2]>-2.99 && mesh[j+2]<-2.925 && Math.abs(mesh[j])<=3.531 && mesh[j+1]>=.799 && mesh[j+1]<=4.291)){
        uv=[i,i+9,i+18].flatMap(j=>[(mesh[j]+3.53)/7.06*mural.width,(4.29-mesh[j+1])/3.49*mural.height]);
      }
      (mesh===env.mesh&&i<env.shellLength?shell:faces).push([depth/xy.length,xy,'rgb('+rgb.join(',')+')',uv]);
    }
    shell.sort((a,b)=>b[0]-a[0]);faces.sort((a,b)=>b[0]-a[0]);
    for(const [,xy,color,uv] of shell.concat(faces)){
      paper.beginPath();paper.moveTo(xy[0],xy[1]);for(let j=2;j<xy.length;j+=2)paper.lineTo(xy[j],xy[j+1]);paper.closePath();
      paper.fillStyle=color;paper.fill();paper.strokeStyle=color;paper.lineWidth=.55;paper.stroke();if(uv)paintPanelTriangle(paper,mural,xy,uv);
    }
  }
  const wx=n=>(n-50)*.162;
  const environments=new Map();
  function paintPanelTriangle(ctx,image,xy,uv){
    const [x0,y0,x1,y1,x2,y2]=xy;
    const [u0,v0,u1,v1,u2,v2]=uv;
    const du=u1-u0,dv=v1-v0,eu=u2-u0,ev=v2-v0,det=du*ev-dv*eu;
    if(Math.abs(det)<.01)return;
    const a=((x1-x0)*ev-(x2-x0)*dv)/det,b=((y1-y0)*ev-(y2-y0)*dv)/det;
    const c=(du*(x2-x0)-eu*(x1-x0))/det,d=(du*(y2-y0)-eu*(y1-y0))/det;
    ctx.save();ctx.clip();ctx.transform(a,b,c,d,x0-a*u0-c*v0,y0-b*u0-d*v0);
    ctx.drawImage(image,0,0);ctx.restore();
  }
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
    const subject=visual.work?36+s.chair*.24:s.role==='b'?visual.b:visual.a;
    orbit=track(orbit,(s.role==='b'?.115:-.11)+turn+visual.look,0,3.4);
    focus=track(focus,s.role==='b'? .18:0,1,3.8);
    aim=track(aim,s.stage===4?0:wx(subject)*(w/h<1.25?.92:.38),2,3.6);
    camHeight=track(camHeight,s.stage===4?2.85:s.role==='b'?2.75:2.45,3,3.3);
    camRadius=track(camRadius,visual.work?6.7:s.stage===4?13.8:!visual.started?14.6:lens+(s.role==='b'?-.4:0),4,3.2);
    const shot=visual.shot, work=visual.work;
    const room=s.stage<2?'shop':s.stage===2?'river':'opera';
    const cx=room==='river'?-3.9:room==='opera'?-1.1:wx(36+s.chair*.24);
    const lx=room==='river'?-5.36:wx(17+s.lamp*.09),lz=.1;
    let eye=[Math.max(-10.1,Math.min(10.1,aim+Math.sin(orbit)*camRadius)),camHeight,Math.min(15,Math.cos(orbit)*camRadius)];
    let target=[aim,2.02+focus+(visual.pitch||0),0];
    const lampShot=shot?.kind==='lamp',portrait=shot?.kind==='portrait';
    if(portrait){
      const k=shot.role,x=wx(visual[k]),y=k==='b'?.98:0,z=s.depth[k];
      target=[x,y+1.49,z];eye=[x+.18,y+1.55,z+1.03];
    }else if(lampShot){
      target=[lx+.18,1.21,lz+.16];eye=[lx+1.02,1.52,lz+1.86];
    }else if(work){
      target=[cx,.9,.52];eye=[cx-2.58,1.81,2.28];
    }
    const anchors=s.stage>=1&&s.stage<=3?window.relicSpots(s.stage):[];
    if(visual.probe!=null&&anchors[visual.probe]){
      const [x,y,z]=anchors[visual.probe];
      // Keep the socket in the clear band between the menu and the evidence card.
      const lift=canvas.clientHeight<470?.31:.15;
      const distance=Math.max(2.3,1.82*h/w);
      target=[x,y-lift,z];eye=[x+.18*distance,y-lift+.23*distance,z+distance];
    }
    const contact=visual.contact;
    if(contact){
      const [x,y,z]=contact.point;
      target=[x-.27,(y+contact.ground+1.02)*.5,z+.18];
      eye=[x+1.82,contact.ground+1.89,z+2.95];
    }
    if(visual.tuning){
      const [x,y,z]=stageProp(visual.tuning==='angle'?'window':'lamp');
      target=[x,y,z];eye=[x+.80,y+.34,z+2.12];
    }
    // Frame the entire usable rail. A fixed camera keeps the destination still during a drag.
    if(!contact&&(work||visual.tuning==='lamp')){
      const chair=!!work,lo=wx(chair?36:17),hi=wx(chair?60:26)+(chair?0:.42);
      target=[(lo+hi)/2,.91,chair?.46:.1];
      const back=unit(chair?[-.68,.33,.76]:[.23,.30,1]);
      const horizontal=unit(cross([0,1,0],back)),vertical=unit(cross(back,horizontal));
      let range=chair?3.35:2.65;
      for(const x of [lo-.42,hi+.42])for(const y of [.02,1.9])for(const z of [-.16,chair?1.17:.42]){
        const v=sub([x,y,z],target);
        range=Math.max(range,dot(v,back)+Math.max(Math.abs(dot(v,horizontal))*2.5*h/w/.86,Math.abs(dot(v,vertical))*2.5/.69));
      }
      eye=target.map((v,i)=>v+back[i]*range);
    }
    const forward=unit(sub(target,eye)),right=unit(cross(forward,[0,1,0])),up=cross(right,forward);
    const projectTrace=p=>{
      const v=sub(p,eye),d=dot(v,forward);return [.5+1.25*h/w*dot(v,right)/d,.5-1.25*dot(v,up)/d,d];
    };
    drawStageTraces(projectTrace);
    visual.pickCoords=anchors.map(projectTrace);
    projectClues(visual.pickCoords);
    const objects=s.stage===0?['lamp']:s.stage===1?['lamp','chair','lock']:s.stage===2?['bell']:s.stage===3?['window','bell']:[];
    visual.propHits=objects.map(name=>{
      const v=sub(stageProp(name),eye),d=dot(v,forward);
      return {name,x:.5+1.25*h/w*dot(v,right)/d,y:.5-1.25*dot(v,up)/d,d};
    });
    positionPropPins(visual.propHits);
    const wickLit=s.stage>0 || contact?.kind==='light' && contact.transferred || lampShot && shot.progress>=.59;
    const flicker=reduced?1:1+.027*Math.sin(t*3.2)+.012*Math.sin(t*6.6+.8);
    const targetWarmth=wickLit?1.55:0;
    warmth=reduced?targetWarmth:(warmth??targetWarmth)+(targetWarmth-(warmth??targetWarmth))*(1-Math.exp(-dt*2.4));
    finalPose+=((s.stage===4?1:0)-finalPose)*(1-Math.exp(-dt*2));
    const light=[lx+.42,1.28,lz],brightness=warmth*flicker;
    canvas.parentElement.style.setProperty('--parallax',(50+orbit*18)+'%');
    if(gl){for(const [k,v] of Object.entries({eye,right,up,forward,light}))gl.uniform3fv(un[k],v);
    gl.uniform3fv(un.roomTint, roomColors[room]);gl.uniform1f(un.aspect,w/h);gl.uniform1f(un.illum,brightness);}
    if(!environments.has(room)){
      data=[];origin=[0,0,0];yaw=0;
      buildRoomShell(room,{box,face,panel,shape,limb,oval});
      const shellLength=data.length;
      const river=room==='river', opera=room==='opera';
      const wood=opera?'713d35':'644731',trim=opera?'cf9d5f':'ad8558';
      const planks=['68665a','766f60','716958','605c51'];
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
          box(x,-.799,z,.17+(j%4)*.09,.008,.025,j%4===0?'a5aa8e':j%2?'759391':'617f81');
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
              const fold=j%2===0?.035:0;
              box(x,(bottom+3.67)/2,-1.80+fold,.12,3.67-bottom,.09,j%2?'73322f':'994739');
              box(x,bottom,-1.80+fold,.12,.05,.105,trim);
              box(x,bottom+.105,-1.744+fold,.11,.021,.012,'c49254');
              if(j%2===0)shape(x,bottom-.12,-1.80+fold,[[0,.026,.022],[.077,.017,.016],[.12,.009,.009]],'b7884c',6);
            }
          }else{
            for(const y of [.62,1.46])box(cx,y,-1.7,2.44,.09,.62,wood);
            for(const dx of [-1.08,1.08])box(cx+dx,.75,-1.7,.09,1.5,.4,wood);
            // Bolts of dyed cloth rest on the top shelf. The cut ends face the room.
            for(let k=0;k<3;k++){
              const x=cx-.62+k*.53, fabric=['877253','687b73','9b6551'][k];
              box(x,1.62,-1.68,.46,.23,.43,fabric);
              for(const y of [1.54,1.60,1.66])box(x,y,-1.459,.395,.012,.013,'bdab87');
              box(x+.05,1.74,-1.68,.056,.016,.42,'a48c66');
            }
          }
        }
        box(0,3.83,-2.0,14.7,.28,.46,wood);
        box(0,3.69,-1.76,14.65,.055,.075,trim);
      }
      let buffer;
      if(gl){
        buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
      }
      environments.set(room,{mesh:data,shellLength,buffer,room,tint:roomColors[room]});
    }
    const env=environments.get(room);data=[];
    origin=[0,0,0];yaw=0;
    if(anchors.length){
      const token={...s.kit[s.stage],angle:s.angle};
      if(contact?.transferred){
        if(contact.kind==='take')token.mask|=1<<contact.slot;
        if(contact.kind==='fit')token.installed=true;
        if(contact.kind==='unlock')token.opened=true;
      }
      window.drawRelics(s.stage,token,{box:(x,y,z,w,h,d,c)=>{
        if(Math.min(w,h,d)>=.045)roundedBox(x,y,z,w,h,d,c,.014);
        else box(x,y,z,w,h,d,c);
      },shape,limb,oval,panel});
    }
    const left=wx(33),rightEnd=wx(67),z=-.88,deckY=.98;
    function deck(lo,hi){box((lo+hi)/2,deckY-.11,z,hi-lo,.22,.75,'504138');box((lo+hi)/2,deckY-.035,z+.38,hi-lo,.047,.03,'d3a975')}
    for(const x of room==='river'?[]:[wx(20),left-.18,rightEnd+.18,wx(78)]){
      box(x,.47,z,.115,.94,.28,'6e4b34');box(x,.12,z,.29,.24,.43,'8a6c52');
    }
    deck(wx(18),left);deck(rightEnd,wx(80));
    const lit=s.stage===0?0:1;
    bridgeReveal=(bridgeReveal??lit)+(lit-(bridgeReveal??lit))*(1-Math.exp(-5*dt));
    const start=Math.max(left,visual.lo),end=Math.min(rightEnd,visual.lo+(visual.hi-visual.lo)*bridgeReveal);
    if(bridgeReveal>.007&&end>start){
      deck(start,end);
      for(let n=0;n<14;n++){
        const x=start+n*(end-start)/13;
        box(x,deckY-.075,z+.401,.073,.025,.023,'ffdc99');
      }
      if(room!=='river'){
        for(const f of [.22,.78]){
          const x=start+(end-start)*f;
          box(x,.39,z,.095,.78,.20,'72523b');
          box(x,.045,z,.48,.09,.52,'9c764f');
        }
      }
    }
    const lifting=contact?.kind==='lift';
    const lift= lifting?.085*eased((contact.progress-.48)/.14)*(1-eased((contact.progress-.68)/.12)):0;
    const chairHeight=work?work.height:lift||0;
    origin=[cx,chairHeight,.24];yaw=Math.PI;
    for(const x of [-.29,.29])for(const z of [-.25,.25]){
      shape(x,0,z,[[0,.035,.035],[.025,.041,.041],[.085,.032,.032],[.45,.040,.040],[.54,.042,.042]],'674932',16);
    }
    roundedBox(0,.56,0,.72,.12,.64,'ab7650',.045);
    for(const x of [-.29,.29]){
      roundedBox(x,.91,-.25,.075,.74,.08,'80573d');
      bone([x,.18,-.25],[x,.18,.25],.021,.021,'78543b');
    }
    roundedBox(0,1.20,-.25,.66,.14,.09,'a9784f',.038);
    roundedBox(0,.90,-.25,.13,.56,.049,'865b40',.021);
    origin=[0,0,0];yaw=0;
    // The ribbed silk shade meets the bracket at the cap; the wick remains at its original height.
    roundedBox(lx,.065,lz,.49,.13,.46,'797369',.05);roundedBox(lx,.91,lz,.24,1.72,.15,'644936');
    roundedBox(lx+.19,1.72,lz,.57,.09,.13,'76553c');
    bone([lx,1.42,lz],[lx+.34,1.69,lz],.034,.029,'946b44');
    bone([lx+.42,1.51,lz],[lx+.42,1.72,lz],.020,.017,'a38250');
    const shell=[[0,.083,.094],[.035,.126,.135],[.10,.146,.149],[.21,.15,.15],[.30,.14,.14],[.365,.123,.130],[.39,.08,.09]];
    shape(lx+.42,1.085,lz,shell,wickLit?'edb86c':'887b64',32);
    // The lower dyed silk and patinated collars remain distinct at night.
    shape(lx+.42,1.085,lz,[[.036,.127,.136],[.063,.137,.144],[.088,.144,.149]],wickLit?'d48254':'996955',32);
    shape(lx+.42,1.085,lz,[[.302,.142,.142],[.322,.138,.139]],wickLit?'e9a65e':'b28a68',32);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      const rib=shell.map(([h,rx,rz])=>[lx+.42+rx*Math.cos(a),1.085+h,lz+rz*Math.sin(a)]);
      for(let j=1;j<rib.length;j++)bone(rib[j-1],rib[j],.005,.005,'896440');
    }
    for(const y of [1.077,1.475]){
      shape(lx+.42,y,lz,[[0,.075,.075],[.012,.111,.111],[.026,.109,.109],[.038,.074,.074],[.039,0,0]],'68857a',24);
      shape(lx+.42,y+.013,lz,[[0,.112,.112],[.007,.112,.112]],'d3af73',24);
    }
    const side=s.stage>=3?1:0;
    bellSide=(bellSide??side)+(side-(bellSide??side))*(1-Math.exp(-4.3*dt));
    for(const [gx,level] of [[wx(74),1-bellSide],[wx(25),bellSide]]){
      if(level<.02)continue;
      // A cantilever post is fixed to the stone or wooden landing at the rear.
      const bellZ=bellLaneZ,back=bellZ+.03,post=gx+.32;
      box(post,.885,(back+z)/2,.18,.14,Math.abs(back-z)+.20,'71513a');
      box(post,1.59,back,.12,1.24,.13,'71513a');
      box(post,1.04,back,.21,.13,.21,'ae8758');
      box(gx+.15,2.19,back,.52,.105,.16,'684c36');
      box(gx,2.17,bellZ,.09,.11,.16,'806246');
      const drop=contact?.kind==='pull'?contact.pull:0;
      box(gx,1.995-drop/2,bellZ,.042,.32+drop,.042,'b99455');
      shape(gx,1.69-drop,bellZ,[[0,.13,.13],[.04,.115,.115],[.13,.078,.078],[.16,.044,.044]],'bb9758',28);
      box(gx,1.64-drop,bellZ,.032,.14,.033,'c7a263');
      oval(gx,1.56-drop,bellZ,.055,.056,.05,'e5c283');
    }
    const costumes=[];
    // The apprentice walks downstage, the furniture sits midstage and the puppet walks on the raised rear deck.
    for(const k of ['a','b']){
      // The object insert uses the performer's viewpoint after the reach has ended.
      if(!contact&&(visual.probe!=null||visual.tuning))continue;
      if(contact&&k!==contact.role)continue;
      if(portrait?shot.role!==k:k==='b'&&(!s.stage||work||lampShot))continue;
      const carrying=k==='a'&&work, lighting=k==='a'&&lampShot;
      const x=lifting?cx:contact?contact.point[0]+.19+.20*(1-contact.step):carrying?cx:lighting?lx-.22:wx(visual[k]),y=contact?contact.ground:k==='a'?0:deckY;
      const zp=lifting?.97+.10*(1-contact.step):contact?contact.point[2]+(contact.ground?.43:.80):carrying?.97:lighting?lz+.30:s.depth[k];
      origin=[x,y+.009,zp];yaw=0;
      for(let j=0;j<12;j++){
        const a=j*Math.PI/6,b=(j+1)*Math.PI/6;
        tri(point(0,0,0),point(.27*Math.cos(b),0,.12*Math.sin(b)),point(.27*Math.cos(a),0,.12*Math.sin(a)),'40352d');
      }
      const facing=lifting||contact||carrying?Math.PI:portrait?.08:lighting?Math.PI*.5:visual.motion[k].yaw;
      const motion=contact?{phase:x*2*Math.PI/1.12,weight:Math.sin(Math.PI*contact.step)}:carrying?{phase:cx*2*Math.PI/1.12,weight:work.moving}:visual.motion[k];
      costumes.push({first:data.length/9,origin:[x,y,zp]});
      actor(x,y+.014,zp,k==='b',motion,facing,t,s.stage>=3,portrait?0:finalPose,
        carrying||lifting?{height:chairHeight-.014,bend:.055+chairHeight*.18,blend:lifting?contact.reach:1}:null,lighting?shot.progress:null,contact);
    }
    if(!gl){paint(env,eye,right,up,forward,light,brightness,w,h);return}
    function bindMesh(buffer){
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      for(const [index,location] of attributes.entries())gl.vertexAttribPointer(location,3,gl.FLOAT,false,36,12*index);
    }
    gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,materials.get('courtyard').texture);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,materials.get('oak').texture);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,materials.get(room).texture);
    gl.uniform3f(un.clothOrigin,0,0,0);gl.uniform1f(un.cloth,0);gl.uniform1f(un.atlasReady,Number(materials.get('oak').ready));
    gl.uniform1f(un.printed,Number(materials.get(room).ready));gl.uniform1f(un.timber,1);bindMesh(env.buffer);gl.drawArrays(gl.TRIANGLES,0,env.mesh.length/9);gl.uniform1f(un.timber,0);bindMesh(buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,costumes[0]?.first??data.length/9);
    for (const [i,costume] of costumes.entries()){
      gl.uniform1f(un.cloth,1);gl.uniform3fv(un.clothOrigin,costume.origin);
      gl.drawArrays(gl.TRIANGLES,costume.first,(costumes[i+1]?.first??data.length/9)-costume.first);
    }
  }
}

