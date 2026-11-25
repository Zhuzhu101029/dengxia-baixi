/* Clue stations use the same world coordinates in both stage renderers.
   Each anchor is the point a player examines, not the base of the furniture. */
(() => {
  const locations = {
    1: [[-6.5,1.04,.48],[3.20,1.24,.35],[5.33,1.10,.53]],
    2: [[-6.60,.99,.32],[3.95,.93,.35],[6.40,1.30,.33]],
    3: [[-6.43,1.09,.39],[2.07,.95,.42],[5.52,1.42,.45]]
  };
  window.relicSpots = stage => locations[stage] || [];

  window.drawRelics = (stage, token, {box,shape,limb,oval,panel}) => {
    const stations=locations[stage];
    if(!stations)return;
    const oak='6e4832',dark='45362c',light='ac8050',brass='ba9251',
      gilt='e5bd77',jade='53716a',ivory='e3d0a2',silk='b74944',ink='433c37';
    const loose=i=>!(token.mask & (1<<i));
    function table(x,z,width,top,depth=.72){
      const foot=width/2-.15;
      if(stage===1){
        // Splayed trestles and a through-tenon carry the joiner's thick bench top.
        for(const side of [-1,1]){
          const x0=x+side*foot;
          for(const dz of [-1,1]){
            const zz=z+dz*(depth/2-.075);
            limb(x0+side*.056,.028,x0-side*.085,top-.10,.056,zz,'805737');
          }
          box(x0,.24,z,.12,.09,depth-.07,'b28b5c');
        }
        box(x,.247,z,width-.14,.077,.09,'8c603d');
        box(x,top-.12,z,width-.16,.16,depth-.07,'755138');
        box(x,top-.048,z,width,.096,depth,'c59a63');
        box(x,top-.147,z+depth/2-.023,width-.19,.05,.018,'3c665d');
        for(const side of [-1,1])oval(x+side*foot,top-.145,z+depth/2,.029,.029,.014,brass);
      }else if(stage===2){
        // Two hollow stone cradles, bound in verdigris, replace the joiner's legs.
        for(const side of [-1,1]){
          const cx=x+side*width*.31;
          shape(cx,.018,z,[[0,.19,.22],[.07,.20,.22],[.11,.145,.17],
            [top-.18,.111,.143],[top-.11,.17,.20]],'70847c',8);
          shape(cx,top-.21,z,[[0,.122,.149],[.047,.133,.161]],brass,8);
        }
        box(x,top-.063,z,width,.126,depth,'49645c');
        box(x,top-.018,z,width+.032,.036,depth+.027,'9d997c');
      }else{
        // A red lacquer sewing cabinet with a recessed toe and paired brass drops.
        box(x,.075,z,width-.22,.15,depth-.12,'513c3c');
        box(x,top*.53,z,width-.105,top-.18,depth-.075,'743c43');
        const front=z+depth/2-.030;
        for(const side of [-1,1]){
          const cx=x+side*width*.221;
          box(cx,top*.53,front,width*.414,top-.24,.04,'975450');
          box(cx,top*.53,front+.024,width*.345,top-.32,.012,'81504c');
          oval(x+side*.081,top*.57,front+.05,.03,.039,.025,brass);
          limb(x+side*.081,top*.57,x+side*.081,top*.46,.014,front+.065,gilt);
        }
        box(x,top-.047,z,width,.094,depth,'553a39');
        box(x,top-.085,z,width+.014,.018,depth+.012,brass);
      }
    }
    function ruler(x,y,z,w,chair){
      // The stepped ends interlock. The pictograms differentiate the two scales.
      const half=w/2;
      const outline=[[-half,0],[half-.07,0],[half-.07,.041],[half,.041],
        [half,.152],[-half,.152]];
      panel(outline.map(([a,b])=>[x+(chair?a:-a),y+b]),z,.058,chair?'bd9059':'d3a874');
      // Faded lacquer along the shoulder of each scale distinguishes the pair in close-up.
      box(x,y+.020,z+.031,w-.046,.016,.004,chair?'885345':'42716d');
      const count=chair?6:5;
      for(let i=0;i<=count;i++){
        const len=i===count?.038:.079;
        box(x-half+.055+i*(w*.51/count),y+.145-len/2,z+.034,.013,len,.012,ink);
      }
      const xx=x+half-.155,zz=z+.037;
      if(chair){
        box(xx,y+.074,zz,.108,.014,.010,ink);
        for(const dx of [-.043,.043])box(xx+dx,y+.044,zz,.012,.056,.01,ink);
        box(xx-.043,y+.096,zz,.013,.064,.010,ink);
      }else{
        oval(xx,y+.082,zz,.041,.035,.010,ink);
        box(xx,y+.038,zz,.012,.041,.010,ink);
      }
    }
    function clapper(x,y,z,size){
      shape(x,y,z,[[0,.045,.045],[.03,.091,.091],[.115,.077,.077],
        [.15,.03,.03],[.39,.025,.025],[.411,.045,.045]].map(r=>r.map(v=>v*size)),brass,10);
    }
    function threadSpool(x,y,z,red){
      const shade=red?silk:'bc9255';
      shape(x,y,z,[[0,.17,.17],[.04,.17,.17],[.05,.08,.08],[.28,.08,.08],[.29,.17,.17],[.33,.17,.17]],oak);
      shape(x,y+.048,z,[[0,.11,.11],[.018,.142,.142],[.206,.142,.142],[.229,.111,.111]],shade);
      for(let i=0;i<4;i++)shape(x,y+.074+i*.045,z,[[0,.144,.144],[.008,.144,.144]],red?'d87a64':'d5b176');
    }
    function rackBell(x,base,z,mult,sounding){
      shape(x,base,z,[[0,.23,.19],[.045,.22,.18],[.09,.185,.154],[.30,.142,.12],[.37,.065,.063],[.39,.038,.038]].map(r=>r.map(v=>v*mult)),brass,12);
      shape(x,base+.046*mult,z,[[0,.221*mult,.182*mult],[.017,.213*mult,.174*mult]],gilt,12);
      shape(x,base+.22*mult,z,[[0,.159*mult,.133*mult],[.026*mult,.156*mult,.129*mult]],jade,24);
      if(sounding)clapper(x,base-.11*mult,z,.45*mult);
    }
    function hook(x,y,z,scale){
      limb(x,y,x+.038*scale,y+.35*scale,.018*scale,z,gilt);
      limb(x+.038*scale,y+.35*scale,x+.098*scale,y+.38*scale,.016*scale,z,gilt);
      limb(x+.098*scale,y+.38*scale,x+.112*scale,y+.335*scale,.014*scale,z,gilt);
    }
    const [[a,,az],[b,,bz],[c,,cz]]=stations;
    if(stage===1){
      table(a,az,1.42,.87);
      box(a,.924,az,1.16,.108,.45,dark);
      box(a,.994,az-.062,1.13,.032,.25,light);
      if(loose(0))ruler(a+.08,.979,az+.103,.74,true);
      // Bench vise, jaws and screw handle.
      box(a-.49,.985,az+.19,.14,.17,.16,jade);
      limb(a-.57,1.02,a-.43,.94,.013,az+.295,brass);
      table(b,bz,1.26,.82);
      box(b,1.095,bz-.08,.81,.54,.069,oak);
      box(b,1.091,bz-.035,.71,.47,.03,ivory);
      for(let i=0;i<5;i++)box(b-.22+i*.078,1.122,bz-.011,.013,.212-i*.022,.008,'8d7556');
      box(b,1.325,bz+.003,.32,.073,.066,brass);
      box(b,.865,bz+.01,.86,.075,.20,light);
      if(loose(1))ruler(b,.90,bz+.047,.69,false);
      table(c,cz,1.68,.83);
      box(c,.923,cz,1.46,.185,.48,jade);
      box(c,1.048,cz-.073,1.38,.105,.20,dark);
      for(const dx of [-.66,.66])box(c+dx,1.045,cz+.075,.075,.115,.22,brass);
      box(c,1.025,cz+.07,1.28,.025,.112,'40392f');
      if(token.installed){ruler(c-.304,1.035,cz+.073,.64,true);ruler(c+.302,1.035,cz+.073,.64,false)}
    }else if(stage===2){
      table(a,az,1.35,.79);
      box(a,.839,az,1.10,.096,.51,jade);
      for(const dz of [-.23,.23])box(a,.91,az+dz,1.12,.11,.045,brass);
      for(const dx of [-.53,.53])box(a+dx,.91,az,.05,.11,.45,brass);
      for(const dx of [-.37,-.28])limb(a+dx,.887,a+dx+.06,1.101,.019,az-.073,oak);
      if(loose(0))clapper(a+.10,.887,az+.03,1);
      table(b,bz,.98,.56,.46);
      for(const dz of [-.22,.22]){
        limb(b-.25,.56,b,.94,.047,bz+dz,'54685c');
        limb(b+.25,.56,b,.94,.047,bz+dz,'54685c');
      }
      for(const dz of [-.16,.16])oval(b,.94,bz+dz,.208,.208,.044,'927554');
      oval(b,.94,bz,.143,.143,.30,'815d42');
      if(loose(1))for(let i=0;i<6;i++)oval(b,.94,bz-.115+i*.045,.153,.153,.037,i%2?'d5b47b':'c6a16e');
      oval(b,.94,bz+.22,.051,.051,.19,brass);
      if(loose(1)){
        // The tucked end and the detachable coil are both visible from the approach.
        const front=bz+.203;
        let last=[b+.060,.94];
        for(let n=1;n<=38;n++){
          const t=n*Math.PI/8,r=.060+n*.0037,pt=[b+r*Math.cos(t),.94+r*Math.sin(t)];
          limb(...last,...pt,.012,front,n%3?'d2ae74':'edd09b');last=pt;
        }
        for(const pt of [[b-.214,.998],[b-.266,.910],[b-.294,.860],[b-.329,.867]]){
          limb(...last,...pt,.014,front,'e1bb80');last=pt;
        }
      }
      table(c,cz,1.60,.66);
      for(const dx of [-.70,.70])box(c+dx,1.122,cz,.104,.924,.14,oak);
      box(c,1.61,cz,1.64,.13,.18,oak);
      box(c,1.624,cz+.099,1.58,.02,.018,gilt);
      for(let i=0;i<3;i++){
        const x=c-.45+i*.45,k=1.02-i*.15,y=1.471-.39*k;
        box(x,1.51,cz,.032,.098,.038,i===1&&token.installed?'ceac72':brass);
        rackBell(x,y,cz,k,i!==1||token.installed);
      }
    }else{
      table(a,az,1.25,.83);
      shape(a,.83,az,[[0,.34,.245],[.055,.34,.245],[.095,.31,.22]],brass);
      shape(a,.92,az,[[0,.30,.218],[.085,.28,.20],[.159,.205,.143],[.18,.035,.03]],'845352');
      for(const dx of [-.14,-.07]){
        limb(a+dx,1.04,a+dx-.048,1.22,.009,az,ivory);
        oval(a+dx-.048,1.22,az,.023,.023,.036,jade);
      }
      if(loose(0))hook(a+.08,1.028,az+.068,.85);
      table(b,bz,1.47,.56);
      box(b,.728,bz,1.28,.334,.65,'78473d');
      if(token.opened)box(b,1.188,bz-.31,1.36,.63,.068,dark);
      else box(b,.933,bz,1.36,.073,.70,dark);
      for(const dx of [-.46,.46])box(b+dx,.739,bz+.332,.091,.31,.022,brass);
      box(b,.84,bz+.345,.145,.119,.038,gilt);
      box(b-.19,.978,bz,.53,.022,.56,'566f71');
      box(b-.19,.896,bz+.307,.52,.17,.038,'566f71');
      if(token.opened&&loose(1))threadSpool(b+.22,.969,bz+.04,true);
      for(const dx of [-.62,.62]){
        box(c+dx,.09,cz,.35,.18,.46,dark);
        box(c+dx,.96,cz,.105,1.77,.13,oak);
      }
      // Side trunnions carry the circular window above a low stretcher.
      for(const side of [-1,1]){
        oval(c+side*.62,1.38,cz+.014,.071,.071,.16,brass);
        shape(c+side*.62,1.79,cz,[[0,.066,.066],[.059,.076,.076],[.103,.035,.035],[.112,0,0]],gilt,12);
      }
      box(c,.62,cz,1.32,.068,.12,oak);
      oval(c,1.38,cz-.066,.664,.664,.033,'9ba58a');
      // Brass axle on the front of the frame. Its pointer follows the real detent.
      const axisX=c+.37,axisY=1.13,axisZ=cz+.20;
      oval(axisX,axisY,axisZ,.19,.19,.04,dark);
      for(let i=0;i<=10;i++){
        const a=Math.PI*(.12+i*.076);
        limb(axisX+.151*Math.cos(a),axisY+.151*Math.sin(a),axisX+.177*Math.cos(a),axisY+.177*Math.sin(a),.005,axisZ+.03,gilt);
      }
      const pointerAngle=Math.PI*(.12+.76*(token.angle??15)/100);
      limb(axisX,axisY,axisX+.145*Math.cos(pointerAngle),axisY+.145*Math.sin(pointerAngle),.012,axisZ+.047,brass);
      oval(axisX,axisY,axisZ+.05,.023,.023,.018,gilt);
      // Six open lozenges form a revolving flower around the spindle.
      const phase=((token.angle??15)-70)*Math.PI/100;
      const node=(r,t)=>[c+r*Math.cos(t),1.38+r*Math.sin(t)];
      for(let i=0;i<6;i++){
        const t=phase+i*Math.PI/3;
        const path=[node(.09,t),node(.37,t-.27),node(.632,t),node(.37,t+.27),node(.09,t)];
        for(let j=1;j<path.length;j++)limb(...path[j-1],...path[j],.013,cz-.011,'946d48');
      }
      panel([[c-.52,1.67],[c+.19,1.67],[c+.13,1.43],[c-.10,1.38],[c-.31,1.18],[c-.52,1.24]],cz+.066,.042,'82534e');
      // The old selvedge deliberately stops at the physical needle socket.
      for(const [u,v,xx,yy] of [[-.50,1.63,.13,1.63],[-.48,1.60,.10,1.60],[-.48,1.26,-.32,1.21],[-.32,1.21,-.11,1.40]]){
        limb(c+u,v,c+xx,yy,.007,cz+.095,'c49870');
      }
      for(let i=0;i<3;i++){
        const x=c-.405+i*.089, y=1.47+i*.034;
        panel([[x-.045,y],[x,y+.034],[x+.045,y],[x,y-.034]],cz+.099,.009,'ab795c');
      }
      limb(c-.27,1.27,c-.105,1.39,.013,cz+.103,gilt);
      if(token.installed){
        hook(c-.10,1.39,cz+.12,.55);
        limb(c+.21,1.49,c+.51,1.29,.012,cz+.142,silk);
        for(let i=0;i<7;i++)oval(c+.21+i*.049,1.49-i*.032,cz+.146,.023,.020,.020,'ca775b');
        limb(c-.034,1.57,c+.17,1.47,.017,cz+.121,silk);
        limb(c+.17,1.47,c+.32,1.57,.017,cz+.121,silk);
        limb(c+.32,1.57,c+.42,1.54,.017,cz+.121,silk);
      }
    }
  };
})();
