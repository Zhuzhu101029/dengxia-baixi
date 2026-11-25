// Stage furniture is built around the existing hand, socket and walking coordinates.
function buildSetFurniture(stage, {box, panel, bone, shape, oval, face}) {
  const [[a,,az],[b,,bz],[c,,cz]]=relicSpots(stage);
  const brass='c69a58', gilt='e7c989', ink='383733', blue='345e69', red='833d38';
  const rod=(x,y,xx,yy,z,r,color)=>bone([x,y,z],[xx,yy,z],r,r,color);
  function rim(x,y,z,rx,ry,width,depth,color,steps=32){
    for(let i=0;i<steps;i++){
      const at=(j,inner)=>{const t=j*Math.PI*2/steps;return [x+(rx-inner)*Math.cos(t),y+(ry-inner)*Math.sin(t)]};
      panel([at(i,0),at(i+1,0),at(i+1,width),at(i,width)],z,depth,color);
    }
  }
  function flower(x,y,z,r,pigment){
    for(let n=0;n<5;n++){
      const t=(n*.4-.5)*Math.PI, petal=(u,v)=>[x+r*(u*Math.cos(t)-v*Math.sin(t)),y+r*(u*Math.sin(t)+v*Math.cos(t))];
      panel([petal(.09,0),petal(.56,-.27),petal(.96,-.19),petal(1,0),petal(.87,.22),petal(.53,.27)],z,.008,pigment);
    }
    oval(x,y,z+.012,r*.20,r*.20,.012,gilt);
  }
  if(stage===1){
    // A suspended working drawing, weighted with a second roller, hangs behind the ledger.
    const x=b+.20,z=bz-.34;
    for(const dx of [-.86,.86]){
      box(x+dx,.055,z,.33,.11,.38,'42443c');
      box(x+dx,1.08,z,.08,2.1,.09,'596653');
      oval(x+dx,2.13,z,.078,.078,.105,brass);
    }
    rod(x-.96,2.13,x+.96,2.13,z,.043,'71583d');
    panel([[x-.76,2.12],[x+.76,2.12],[x+.76,1.25],[x-.76,1.25]],z,.023,'bc9e68');
    box(x,1.69,z+.018,1.36,.74,.008,'dfce9c');
    rod(x-.79,1.24,x+.79,1.24,z,.038,'7b583b');
    // Elevation of the bridge, drawn in ink on the master's setting-out sheet.
    const p=z+.032;
    for(const y of [1.43,1.47,1.53])box(x,y,p,1.19,.009,.006,'695b49');
    for(let i=0;i<9;i++){
      const xx=x-.53+i*.132;
      box(xx,1.55,p,.01,.12,.006,'695b49');
      box(xx,1.447,p+.004,.008,i%2?.035:.06,.006,'92654b');
      if(i<8)rod(xx,1.66+.21*Math.sin(i*Math.PI/8),xx+.132,1.66+.21*Math.sin((i+1)*Math.PI/8),p,.008,'5a6d65');
    }
    box(x-.49,1.93,p,.18,.038,.01,red);
    // Fan of bamboo profile templates pinned to the back jaws of the workbench.
    const fx=a+.15,fy=.92,fz=az-.32;
    for(let i=0;i<8;i++){
      const ang=(.14+i*.098)*Math.PI,l=.81+(i%3)*.042;
      const xx=fx+l*Math.cos(ang),yy=fy+l*Math.sin(ang);
      rod(fx,fy,xx,yy,fz,.033,i%2?'9f774c':'cfab71');
      for(let j=3;j<=6;j++){
        const u=j/7,mark=.031;
        rod(fx+(xx-fx)*u,fy+(yy-fy)*u,fx+(xx-fx)*u+mark*Math.sin(ang),fy+(yy-fy)*u-mark*Math.cos(ang),fz+.031,.005,ink);
      }
    }
    oval(fx,fy+.035,fz+.04,.088,.088,.035,brass);
    // Registration levers flank the inset ruler without covering its socket.
    for(const side of [-1,1]){
      const xx=c+side*.69;
      rod(xx,.99,xx+side*.18,1.37,cz-.10,.039,'62796c');
      oval(xx,.99,cz-.07,.067,.067,.045,brass);
      oval(xx+side*.18,1.37,cz-.10,.062,.062,.07,'96664a');
    }
  }else if(stage===2){
    // Shallow clinker-built tool boat on two cradles; its open well holds the clapper tray.
    const hull=[[-.98,1.17,1.17],[-.80,.76,1.005],[-.52,.65,.926],[.51,.65,.926],[.82,.77,1.009],[.99,1.13,1.13]];
    for(const side of [-1,1]){
      const z=az+side*.27;
      for(let i=1;i<hull.length;i++){
        const [u,y,upper]=hull[i-1],[v,h,next]=hull[i];
        panel([[a+u,y],[a+v,h],[a+v,next],[a+u,upper]],z,.047,i%2?'396b67':'477b75');
        rod(a+u,upper,a+v,next,z,.024,'bb9160');
      }
    }
    // A spoked capstan wheel shares its axle with the working rope drum.
    const x=b,y=.94,z=bz-.19;
    rim(x,y,z,.55,.55,.055,.084,'496c68');
    rim(x,y,z+.049,.54,.54,.015,.014,brass);
    for(let i=0;i<8;i++){
      const t=i*Math.PI/4,cs=Math.cos(t),sn=Math.sin(t);
      rod(x,y,x+.505*cs,y+.505*sn,z,.022,'a48351');
    }
    oval(x,y,z+.055,.105,.105,.08,brass);
    // Swan-neck ends and patinated crests identify the east-bank peal in silhouette.
    for(const side of [-1,1]){
      const at=(dx,h)=>[c+side*dx,h];
      panel([at(.05,1.65),at(.56,1.78),at(.81,1.95),at(1.03,1.99),at(.92,1.83),at(.77,1.69),at(.51,1.60)],cz-.035,.13,'376960');
      rod(c+side*.71,1.61,c+side*.56,1.79,cz,.031,brass);
      oval(c+side*.86,1.89,cz+.055,.035,.035,.02,gilt);
    }
    // Mooring rings and pale inlaid wave bands belong to the bridge coping.
    for(const side of [-1,1]){
      for(let j=0;j<3;j++){
        const px=side*(3.67+j*.65);
        shape(px,1.48,-1.29,[[0,.071,.071],[.08,.081,.081],[.13,.037,.037],[.136,0,0]],'879c8f',12);
      }
    }
  }else{
    // A costume drying bar holds a folded water sleeve, each pleat a continuous piece of cloth.
    const x=-1.58,z=.02,y=2.06;
    for(const side of [-1,1]){
      const xx=x+side*.82;
      shape(xx,0,z,[[0,.18,.19],[.06,.19,.20],[.12,.084,.085],[.16,.058,.06]],'674137',12);
      rod(xx,.13,xx,2.10,z,.044,'734439');
      shape(xx,2.095,z,[[0,.052,.052],[.05,.073,.073],[.094,.036,.036],[.10,0,0]],brass,14);
    }
    rod(x-.91,y,x+.91,y,z,.038,brass);
    function silkFold(lo,hi,front,colors,bottom){
      const folds=10;
      const at=(i,v)=>{const u=i/folds;
        return [x+lo+(hi-lo)*u+v*.036*Math.sin(u*5),y-(y-bottom(u))*v,z+front+.049*Math.cos(i*Math.PI)+.07*v*v];};
      for(let i=0;i<folds;i++){
        for(const [top,bot,co] of [[0,.76,colors[i%2]],[.76,.785,gilt],[.785,.935,colors[2]],[.935,.955,gilt],[.955,1,colors[i%2]]]){
          face(at(i,top),at(i,bot),at(i+1,bot),at(i+1,top),co);
        }
      }
    }
    silkFold(-.66,-.06,.018,['84434d','a55458','414f58'],u=>.52+.09*Math.sin(u*4));
    silkFold(.02,.58,.022,['b9ac90','e0cfa6','647c79'],u=>.87-.19*u);
    for(const [xx,yy] of [[-.50,1.70],[-.30,1.52],[-.44,1.31]])flower(x+xx,yy,z+.123,.075,'d3b579');
    // Lacquer sewing cabinet, loose peony petals and a moon-shaped gilt frame.
    for(const side of [-1,1]){
      rod(c+side*.62,1.83,c+side*.51,1.97,cz-.03,.030,'7f5445');
    }
    rim(c,1.38,cz-.085,.73,.73,.047,.07,'976440');
    rim(c,1.38,cz-.041,.72,.72,.013,.016,gilt);
    flower(a-.23,.986,az+.176,.071,'b86665');
    for(const side of [-1,1])flower(b+side*.37,.747,bz+.35,.073,'c99b64');
  }
}


// Some props share a contact point but serve different rooms. Their mounts and
// enclosures can change while the light and the performer's hands stay aligned.
function buildRoomLamp(room,lit,{shape,bone,face}){
  const jade=room==='river'?'41695f':'834145', brass='c9a76b', dark='594533';
  const x=.42;
  shape(x,0,0,[[0,.29,.25],[.055,.31,.27],[.105,.22,.19],[.16,.14,.13],[.21,.09,.085]],jade,room==='river'?8:20);
  shape(x,.19,0,[[0,.09,.09],[.09,.115,.11],[.16,.078,.075],[.64,.047,.045],[.70,.096,.09],[.76,.114,.105]],dark,16);
  if(room==='river'){
    // A harbour beacon: a low, broad roof shelters the square panes.
    shape(x,.90,0,[[0,.09,.09],[.085,.21,.21],[.125,.225,.225]],brass,4);
    for(let i=0;i<4;i++){
      const a=(.25+i*.5)*Math.PI,b=a+.5*Math.PI,r=.24;
      const at=(angle,yy)=>[x+r*Math.cos(angle),yy,r*Math.sin(angle)];
      face(at(a,1.025),at(b,1.025),at(b,1.51),at(a,1.51),i%2?'b8caa5':'d7d7ab');
      bone(at(a,1.005),at(a,1.54),.017,.017,dark);
    }
    shape(x,1.49,0,[[0,.32,.32],[.046,.34,.34],[.115,.19,.19],[.155,.06,.06],[.185,0,0]],jade,4);
  }else{
    // A lotus oil cup, with two tiers of enamel petals around the exposed flame.
    shape(x,.92,0,[[0,.09,.09],[.10,.18,.18],[.18,.22,.22],[.211,.21,.21],[.218,.03,.03]],brass,24);
    for(let i=0;i<10;i++){
      const a=i*Math.PI/5;
      const petal=(r,ang,h)=>[x+r*Math.cos(a+ang),h,r*Math.sin(a+ang)];
      const base=petal(.12,0,1.025),left=petal(.194,-.29,1.14),tip=petal(.25,0,1.31),right=petal(.194,.29,1.14);
      face(base,left,tip,petal(.212,0,1.17),i%2?'b06b62':'985455');
      face(base,petal(.212,0,1.17),tip,right,'cf9180');
    }
    shape(x,1.13,0,[[0,.035,.035],[.04,.030,.030],[.09,.011,.011]],'51382d',10);
    if(lit)shape(x,1.20,0,[[0,.013,.013],[.048,.044,.035],[.118,.023,.019],[.19,0,0]],'fbd582',14);
  }
}

function buildYokeChair({shape,bone,box,panel,oval}){
  const wood='6d3930', honey='b98757', gilt='cfab72', lacquer='376b67';
  for(const side of [-1,1])for(const end of [-1,1]){
    const leg=(h,spread)=>[side*(.26+spread),h,end*(.22+spread)];
    bone(leg(.015,.035),leg(.53,0),.031,.043,wood);
    bone(leg(.009,.035),leg(.083,.030),.036,.034,gilt);
  }
  box(0,.545,0,.74,.095,.63,honey,.036);
  box(0,.591,0,.66,.022,.54,'b59e75',.013);
  for(const side of [-1,1]){
    bone([side*.28,.55,-.23],[side*.29,1.18,-.25],.030,.035,wood);
    bone([side*.29,.18,-.24],[side*.29,.18,.24],.020,.020,honey);
    panel([[side*.31,.51],[side*.14,.51],[side*.19,.459],[side*.26,.445],[side*.30,.386]],.24,.055,lacquer);
  }
  bone([-.29,.20,.24],[.29,.20,.24],.019,.019,wood);
  // The yoke stays at the height and width of the existing two-hand grip.
  const crest=[[-.36,1.225],[-.28,1.205],[-.15,1.212],[0,1.245],[.15,1.212],[.28,1.205],[.36,1.225]];
  for(let i=1;i<crest.length;i++){
    const [u,h]=crest[i-1],[v,k]=crest[i];
    bone([u,h,-.25],[v,k,-.25],.043,.043,honey);
  }
  panel([[-.067,.594],[.067,.594],[.054,.82],[.094,1.05],[.071,1.205],[-.071,1.205],[-.094,1.05],[-.054,.82]],-.246,.05,lacquer);
  for(const side of [-1,1])bone([side*.058,.65,-.273],[side*.21,1.115,-.273],.012,.012,gilt);
  oval(0,1.023,-.279,.045,.068,.009,'dfbd83');
}

