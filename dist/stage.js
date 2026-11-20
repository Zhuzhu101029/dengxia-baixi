// Perspective stage, lit extruded silhouettes, floor shadows and a travelling camera.
function theatre(canvas) {
  const gl = canvas.getContext('webgl', { alpha:true, antialias:true, premultipliedAlpha:false });
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
  function puppet(x,y,z,b,step,faceDir,sleeve,bow){
    origin=[x,y,z];yaw=faceDir<0?-.44:.44;const cloth=b?'374857':'a34b38',gold='d7ad6e',ink='302a28';
    for(let i of [-1,1]){let leg=.2*i+step*.12*i;limb(.14*i,.58,leg,.10,.065,0,ink);box(leg+.025,.06,.05,.19,.11,.22,ink)}
    panel([[-.34,.39],[.34,.39],[.21,1.05],[-.18,1.05]],0,b?.10:.27,cloth);
    box(0,.46,.14,.53,.04,.036,gold);
    limb(-.14,1.03,.15,.65,.021,.17,gold);limb(.12,1.02,-.02,.86,.02,.17,gold);
    for(let i of [-1,1]){let lift=bow?.20:0;limb(.19*i,.98,.37*i,.77+lift,.084,.02,cloth);limb(.37*i,.77+lift,.48*i,.86+lift+step*.06*i,.065,.09,b&&sleeve?gold:'dfb787');oval(.37*i,.77+lift,.13,.035,.035,.025,gold)}
    const hy=bow?1.17:1.24;oval(.03,hy,0,.17,.208,.22,'eac9a0');oval(.01,hy+.13,-.003,.19,.12,.24,ink);oval(.11,hy+.025,.122,.025,.018,.01,ink);
    if(b){
      oval(.095,hy-.035,.126,.048,.028,.013,'b57865');
      limb(-.18,1.00,.07,.71,.032,.17,'ecd5a0');
      for(let i=-1;i<=1;i++){oval(i*.14,.53,.15,.038,.035,.023,gold);oval(i*.14,.53,.166,.017,.016,.008,cloth)}
      for(let i of [-1,1]){limb(.13*i,hy+.24,.32*i,hy+.31,.025,.012,ink);oval(.34*i,hy+.32,.012,.058,.026,.036,gold)}
      if(sleeve)panel([[.43,.90],[.58,.86],[.69,.98],[.65,.78],[.54,.72],[.44,.77]],.10,.065,'ceab80');
      panel([[-.22,hy+.19],[.22,hy+.19],[.14,hy+.41],[0,hy+.36],[-.14,hy+.40]],0,.18,'4b5258');box(0,hy+.22,.11,.36,.042,.02,gold);for(let i of [-1,0,1])oval(i*.10,hy+.29,.11,.028,.032,.012,gold)}
    else{oval(-.16,hy+.22,-.01,.094,.094,.14,ink);limb(-.28,hy+.21,-.05,hy+.32,.016,.1,gold)}
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
  let staticGeometry;
  return function draw(s,visual,t,dt){
    const w=Math.max(2,Math.round(canvas.clientWidth*Math.min(devicePixelRatio||1,gl?1.6:1.1))),h=Math.round(w*.45);
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
    const subject=s.role==='b'?visual.b:visual.a;
    orbit=track(orbit,(s.role==='b'?.115:-.11)+turn+visual.look,0,3.4);
    focus=track(focus,s.role==='b'? .18:0,1,3.8);
    aim=track(aim,s.stage===4?0:wx(subject)*.16,2,3.6);
    camHeight=track(camHeight,s.stage===4?5.4:s.role==='b'?4.05:4.8,3,3.3);
    camRadius=track(camRadius,s.stage===4?13.8:!visual.started?14.6:s.role==='b'?11.9:12.65,4,3.2);
    const eye=[aim+Math.sin(orbit)*camRadius,camHeight,Math.cos(orbit)*camRadius],target=[aim,1.72+focus,0],forward=unit(sub(target,eye)),right=unit(cross(forward,[0,1,0])),up=cross(right,forward);
    const light=[wx(18+s.lamp*.1),2.4,.4],brightness=s.stage===0?.2:1;
    canvas.parentElement.style.setProperty('--parallax',(50+orbit*18)+'%');
    if(gl){for(const [k,v] of Object.entries({eye,right,up,forward,light}))gl.uniform3fv(un[k],v);
    gl.uniform1f(un.aspect,w/h);gl.uniform1f(un.illum,brightness);}
    if(!staticGeometry){
    data=[];
    // Separate floorboards keep the software depth ordering local around the actors.
    const woods=['60483a','634a3b','594338','624839'];
    for(let i=0;i<24;i++){
      const x=-8+(i+.5)*2/3;
      for(let row=0;row<4;row++){
        const z=-1.99+row*1.175;
        face([x-.33,0,z],[x-.33,0,z+1.174],[x+.33,0,z+1.174],[x+.33,0,z],woods[(i+row*3)%4]);
      }
      box(x,-.39,2.60,2/3,.51,.17,'603b31');
      box(x,-.38,2.70,.54,.28,.035,'82533b');
      box(x,-.38,2.726,.39,.15,.021,'654632');
    }
    box(0,-.69,2.62,16.1,.10,.28,'49382d');
    box(0,-.17,2.70,16,.055,.065,'bd9067');for(let x of [-6.85,6.85]){box(x,1.85,-1.75,.28,3.7,.32,'6b3931');box(x,.16,-1.75,.52,.32,.55,'807363');box(x,3.58,-1.75,.65,.22,.62,'805641')}
    box(0,3.85,-1.75,14.5,.27,.47,'533b31');box(0,3.70,-1.48,14.35,.045,.055,'c39b66');
    staticGeometry=data;
    }
    data=staticGeometry.slice();
    const left=wx(33),rightEnd=wx(67),z=-.88,deckY=.98;
    function deck(lo,hi){box((lo+hi)/2,deckY-.11,z,hi-lo,.22,.75,'504138');box((lo+hi)/2,deckY-.035,z+.38,hi-lo,.047,.03,'d3a975')}
    for(const x of [wx(20),left-.18,rightEnd+.18,wx(78)]){
      box(x,.47,z,.115,.94,.28,'6e4b34');box(x,.12,z,.29,.24,.43,'8a6c52');
    }
    deck(wx(18),left);deck(rightEnd,wx(80));
    if(s.stage!==0){deck(visual.lo,visual.hi);for(let n=0;n<14;n++){let x=left+n*(rightEnd-left)/13;box(x,deckY-.08,z+.405,.073,.025,.02,'ffdc99')}}
    const cx=wx(36+s.chair*.24);origin=[cx,0,.24];yaw=-.3;
    for(let x of [-.29,.29])for(let z of [-.25,.25])box(x,.27,z,.085,.54,.085,'583c2e');
    box(0,.56,0,.72,.12,.64,'ab7650');for(let x of [-.29,.29])box(x,.91,-.25,.075,.74,.08,'80573d');box(0,1.20,-.25,.66,.14,.09,'a9784f');origin=[0,0,0];yaw=0;
    const lx=wx(17+s.lamp*.09);box(lx,.86,.10,.083,1.72,.085,'49372b');box(lx+.23,1.70,.10,.55,.07,.08,'674633');box(lx+.42,1.40,.10,.29,.42,.30,s.stage?'f4bc64':'957d5a');box(lx+.42,1.62,.10,.33,.05,.35,'65462f');
    const gx=wx(s.stage===3?25:74);box(gx,1.68,z,.10,.45,.10,'bd8747');oval(gx,1.50,z+.20,.085,.095,.05,'f1c578');
    // The apprentice walks downstage, the furniture sits midstage and the puppet walks on the raised rear deck.
    for(const k of ['a','b']){if(k==='b'&&!s.stage)continue;const x=wx(visual[k]),y=k==='a'?0:deckY,zp=k==='a'?1.65:z;
    box(x,y+.006,zp,.59,.012,.33,'342e2b');puppet(x,y+.014,zp,k==='b',visual.stride[k],visual.dir[k],s.stage>=3,s.stage===4&&Math.sin(t*2)>.65)}
    if(!gl){paint(eye,right,up,forward,light,brightness,w,h);return}
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,data.length/9);
  }
}
