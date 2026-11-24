/* Two painted interior sets. The instruments themselves are interactive HTML. */
window.paintAlcove = function paintAlcove(canvas, kind) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * scale);
  canvas.height = Math.round(bounds.height * scale);
  const W = 960, H = 540;
  ctx.setTransform(canvas.width/W, 0, 0, canvas.height/H, 0, 0);
  const bells = kind === 'bells';
  const wood = bells ? '#4d4133' : '#5d3831';
  const edge = bells ? '#96815c' : '#a37a53';
  const dark = '#2c2723';
  const rect = (x,y,w,h,color) => {ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
  function poly(points,fill,stroke,width=1) {
    ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill()}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}
  }
  function stripe(y0,y1,colors){
    const g=ctx.createLinearGradient(0,y0,0,y1);
    colors.forEach((c,i)=>g.addColorStop(i/(colors.length-1),c));return g;
  }
  function ellipse(x,y,rx,ry,color) {
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,2*Math.PI);ctx.fillStyle=color;ctx.fill();
  }
  function rail(x,y,w,h){
    rect(x,y,w,h,stripe(y,y+h,[edge,wood,dark]));
    rect(x+1,y+h*.55,w-2,1,'#c8a97939');
  }
  function lantern(x,y) {
    rect(x-13,39,26,6,wood);rect(x-1,45,2,y-45,'#ac9465');
    const light=ctx.createRadialGradient(x,y+23,3,x,y+23,110);
    light.addColorStop(0,'#ffc36d52');light.addColorStop(1,'#f6c26600');
    rect(x-110,y-87,220,220,light);
    rail(x-16,y,32,5);
    poly([[x-16,y+5],[x+16,y+5],[x+22,y+15],[x+20,y+42],[x+12,y+50],[x-12,y+50],[x-20,y+42],[x-22,y+15]],
      stripe(y+4,y+50,bells?['#bd9055','#efc684','#a47a46']:['#a95638','#ecaa6b','#aa623e']),dark,1.6);
    for(const dx of [-13,0,13])poly([[x+dx*.75,y+5],[x+dx,y+15],[x+dx,y+42],[x+dx*.70,y+48]],null,'#725033',1.1);
    rail(x-13,y+48,26,4);poly([[x,y+52],[x,y+68]],null,edge,2);
  }
  // Receding plank roof, closed side returns and the rear wall meet at the corner posts.
  rect(0,0,W,H,dark);
  poly([[0,0],[960,0],[825,79],[135,79]],stripe(0,80,[dark,wood]));
  for(let x=-360;x<=1360;x+=98){
    poly([[x,0],[480+(x-480)*.70,79]],null,'#9a816151',2);
  }
  rect(135,79,690,284,stripe(79,363,bells?['#65736b','#9a9981','#647064']:['#9a705a','#c2a084','#93735f']));
  for(const flip of [false,true]){
    ctx.save();
    if(flip){ctx.translate(W,0);ctx.scale(-1,1)}
    poly([[0,0],[135,79],[135,363],[0,441]],bells?'#52625b':'#815f50');
    poly([[0,295],[135,284],[135,363],[0,441]],wood);
    for(const x of [18,78]){
      let y=x*79/135;
      poly([[x,y],[x+9,y+4],[x+9,441-(x+9)*.58],[x,441-x*.58]],dark);
    }
    poly([[0,36],[137,87],[137,96],[0,48]],null,edge,2);
    ctx.restore();
  }
  rect(138,273,684,90,wood);
  for(let x=145;x<815;x+=52)rect(x,282,45,67,bells?'#574d3f':'#69423a');
  rail(134,273,692,9);rail(130,354,700,12);
  poly([[0,441],[135,363],[825,363],[960,441],[960,540],[0,540]],stripe(363,540,bells?['#777769','#40463f']:['#88664f','#4d3c33']));
  for(let x=-600;x<1600;x+=99)poly([[480+(x-480)*.35,364],[x,540]],null,'#382e2888',1);
  for(const y of [376,400,435,486])poly([[0,y],[960,y]],null,'#3c342c6b',1);
  for(const x of [132,824]){rect(x-5,61,11,301,wood);rect(x-8,345,17,22,'#635e51')}
  rail(0,22,960,20);rail(124,66,712,18);
  // Paper windows frame the rear wall. All panes have an opaque backing.
  for(const x of [162,660]){
    rect(x,100,140,150,dark);rect(x+6,106,128,138,stripe(106,245,bells?['#bdc5b6','#77918b']:['#dcbb8b','#ab8a6a']));
    for(let j=0;j<5;j++)rect(x+8+j*30,107,4,137,wood);
    for(const y of [122,141,215,236])rect(x+5,y,130,4,wood);
    rail(x-5,246,150,8);
  }
  // Low wall-mounted shelves hold the maker's materials, away from the central working area.
  function shelf(x){
    poly([[x+9,306],[x+26,306],[x+9,322]],wood);
    poly([[x+95,306],[x+111,306],[x+111,322]],wood);
    rail(x,299,120,8);
  }
  for(const x of [159,680]){
    shelf(x);
    for(let j=0;j<4;j++){
      const cx=x+19+j*26;
      if(bells){
        const h=20+((j*11)%20);
        poly([[cx-8,298],[cx-8,298-h],[cx-4,294-h],[cx+4,294-h],[cx+8,298-h],[cx+8,298]],
          stripe(298-h,299,['#958975','#6b6c5c','#504b41']),dark);
        rect(cx-5,292-h,10,4,'#b6a384');rect(cx-6,286,12,5,'#bda888');
      }else{
        rect(cx-8,281,16,17,['#a05e4d','#667d72','#a58b63','#84616a'][j]);
        for(let y=283;y<297;y+=3)rect(cx-8,y,16,1,'#fff1cf35');
        ellipse(cx,281,10,2,'#584035');ellipse(cx,298,10,2,'#49362b');
      }
    }
  }
  lantern(185,80);lantern(775,80);
  // The working surface intersects its apron and legs, with a cast shadow beneath.
  ellipse(480,463,319,24,'#221e1c48');
  for(const x of [174,765]){rect(x,394,20,74,wood);rail(x-2,456,24,7)}
  rect(179,407,600,14,dark);rail(173,415,616,7);
  poly([[194,351],[766,351],[830,388],[130,388]],stripe(351,391,[edge,wood]));
  rail(130,387,700,18);
  if(!bells){
    poly([[315,352],[620,352],[659,388],[637,416],[328,416],[299,388]],'#854f48');
    for(let i=0;i<2;i++)poly([[307+i*5,387],[336+i*5,409],[630-i*5,409],[651-i*5,387]],null,'#c9a479',1);
  }
  // Light passing through the same paper windows falls across the side aisles.
  for (const side of [-1,1]) {
    ctx.save();
    if (side===1) {ctx.translate(W,0);ctx.scale(-1,1)}
    for (let pane=0;pane<4;pane++) {
      const x=36+pane*18;
      poly([[x,426],[x+12,421],[x+109,478],[x+94,484]],bells?'#b7d8cc16':'#f4ca8e17');
    }
    ctx.restore();
  }
  const vignette=ctx.createRadialGradient(480,240,150,480,240,550);
  vignette.addColorStop(0,'#18181300');vignette.addColorStop(.7,'#1b181310');vignette.addColorStop(1,'#17161576');
  rect(0,0,W,H,vignette);
};
