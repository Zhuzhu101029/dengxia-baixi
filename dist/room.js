/* The camera and the actors share this continuous timber interior. */
function buildRoomShell(room, { box, face, shape, oval }) {
  const river = room === 'river';
  const opera = room === 'opera';
  const ink = river ? '394e4a' : opera ? '50332f' : '48392f';
  const wood = river ? '645348' : opera ? '80453b' : '76543e';
  const gold = river ? 'a78e65' : opera ? 'c49660' : 'b08c61';
  const plaster = river ? '9baca3' : opera ? 'ac9378' : 'b3b0a1';
  const left = -11, right = 11, back = -3.25, front = 16, floor = -.2, top = 5.9;

  // Interior quads share exact edges. Their normals point into the room.
  function backPanel(x0, x1, y0, y1, z, color) {
    face([x0,y0,z], [x1,y0,z], [x1,y1,z], [x0,y1,z], color);
  }
  function floorPanel(x0, x1, z0, z1, y, color) {
    face([x0,y,z0], [x0,y,z1], [x1,y,z1], [x1,y,z0], color);
  }
  function sidePanel(side, y0, y1, z0, z1, inset, color) {
    const x = side * (right - inset);
    const a = side > 0 ? z0 : z1, b = side > 0 ? z1 : z0;
    face([x,y0,a], [x,y0,b], [x,y1,b], [x,y1,a], color);
  }

  backPanel(left, right, floor, top, back, plaster);
  face([right,floor,front], [left,floor,front], [left,top,front], [right,top,front], plaster);
  for (const side of [-1,1]) sidePanel(side, floor, top, back, front, 0, plaster);

  const floorColor = river ? '77796d' : opera ? '6a5042' : '705a48';
  if (river) {
    const halfPool = 3.2, poolBack = -3.1, poolFront = 1.28, bed = -1.35;
    floorPanel(left, -halfPool, back, front, floor, floorColor);
    floorPanel(halfPool, right, back, front, floor, floorColor);
    floorPanel(-halfPool, halfPool, back, poolBack, floor, floorColor);
    floorPanel(-halfPool, halfPool, poolFront, front, floor, floorColor);
    floorPanel(-halfPool, halfPool, poolBack, poolFront, bed, '435554');
    for (const side of [-1,1]) {
      const x = side * halfPool, a = side > 0 ? poolBack : poolFront;
      const b = side > 0 ? poolFront : poolBack;
      face([x,bed,a], [x,bed,b], [x,floor,b], [x,floor,a], '6e756e');
    }
    backPanel(-halfPool, halfPool, bed, floor, poolBack, '798178');
    backPanel(halfPool, -halfPool, bed, floor, poolFront, '67736d');
  } else {
    floorPanel(left, right, back, front, floor, floorColor);
  }

  // The apron meets a laid audience floor. Joints stop at the stage edge.
  const grout = river ? '60665f' : '5c493d';
  for (let row = 0; row < 9; row++) {
    const z0 = 2.61 + row*1.52, z1 = Math.min(front, z0+1.52);
    floorPanel(left,right,z0,z0+.017,floor+.006,grout);
    const width = river ? 1.72 : 3.44;
    for (let x = left+width*(row%2 ? .5 : 1); x < right; x += width) {
      floorPanel(x,x+.012,z0,z1,floor+.006,grout);
    }
  }
  if (opera) {
    floorPanel(-1.13,1.13,2.68,front,floor+.015,'70433a');
    for (const side of [-1,1]) {
      floorPanel(side*1.04-.022,side*1.04+.022,2.68,front,floor+.021,gold);
    }
  }
  // Each coffer is a painted board behind the structural purlins.
  const boardColors = river ? ['7d7766','827d6b'] : opera ? ['765b4c','806352'] : ['65746b','718074'];
  for (let lane = 0; lane < 8; lane++) {
    const x0 = left + lane * 2.75, x1 = x0 + 2.75;
    face([x0,top,back], [x1,top,back], [x1,top,front], [x0,top,front], boardColors[lane % 2]);
    if (lane) box(x0, 5.81, (back+front)/2, .11, .18, front-back, wood);
  }
  for (const z of [-2.88, .90, 4.68, 8.46, 12.24, 15.84]) {
    box(0, 5.59, z, 22, .32, .26, wood);
    box(0, 5.415, z, 21.98, .036, .18, gold);
    for (const side of [-1,1]) {
      const x = side*10.83;
      box(x, 2.74, z, .34, 5.88, .36, ink);
      box(x, .065, z, .52, .53, .57, river ? '82857b' : '867b6c');
      box(side*10.59, 5.20, z, .82, .42, .42, wood);
      box(side*10.49, 5.40, z, 1.02, .15, .49, gold);
    }
  }

  // Brushwork on the two transverse beams facing the stage. Thin pigment lies
  // directly on the joinery; nothing projects into the walkable space.
  const blue = river ? '3e6262' : opera ? '365854' : '45615b';
  const leaf = river ? '93a79b' : opera ? 'afae88' : 'a4aa8a';
  const ochre = river ? 'b39d74' : 'c09b68';
  for (const z of [-2.88, .90]) {
    const surface = z + .135, y = 5.59;
    for (let bay = -2; bay <= 2; bay++) {
      const cx = bay * 3.8;
      backPanel(cx-1.86,cx+1.86,y-.133,y+.133,surface,blue);
      backPanel(cx-1.84,cx+1.84,y+.102,y+.119,surface+.004,ochre);
      backPanel(cx-1.84,cx+1.84,y-.119,y-.102,surface+.004,ochre);
      for (const sign of [-1,1]) {
        const p=(u,v)=>[cx+sign*u,y+v,surface+.009];
        // Broad and tapering strokes alternate around the paired cloud scroll.
        function stroke(points, pigment) {
          if (sign < 0) points.reverse();
          face(...points,pigment);
        }
        stroke([p(.09,0),p(.36,-.082),p(.98,-.052),p(.61,-.026)],leaf);
        stroke([p(.63,-.024),p(1.10,-.044),p(1.54,.071),p(1.14,.010)],ochre);
        stroke([p(1.15,.009),p(1.36,.015),p(1.68,-.04),p(1.51,-.029)],leaf);
      }
      const tip = .089, zz = surface+.013;
      face([cx-.19,y,zz],[cx,y-tip,zz],[cx+.19,y,zz],[cx,y+tip,zz],ochre);
      face([cx-.095,y,zz+.004],[cx,y-.048,zz+.004],[cx+.095,y,zz+.004],[cx,y+.048,zz+.004],
        opera?'995a43':river?'597e79':'865b43');
    }
  }

  // Dado, skirting and mouldings wrap around to the wall behind the viewer.
  const dado = river ? '677b74' : opera ? '865d4e' : '7d8170';
  for (const side of [-1,1]) {
    sidePanel(side, floor, 1.18, back, front, .015, dado);
    for (const [y, h, color] of [[-.03,.22,ink], [1.18,.12,wood], [4.92,.22,wood]]) {
      box(side*10.92, y, (back+front)/2, .16, h, front-back, color);
    }
  }
  for (const z of [back+.08,front-.08]) {
    const direction = z < 0 ? 1 : -1;
    box(0, 1.18, z, 22, .12, .16, wood);
    box(0, 4.92, z, 22, .22, .16, wood);
    box(0, -.03, z+.015*direction, 22, .22, .17, ink);
  }
  backPanel(left, right, floor, 1.16, back+.014, dado);
  backPanel(right, left, floor, 1.16, front-.014, dado);
  for (const x of [-8.65, -4.32, 0, 4.32, 8.65]) {
    box(x, 2.29, front-.11, .16, 5, .22, wood);
  }

  // In the water gallery, paper-paned windows frame the bridge on both banks.
  if (river) {
    for (const cx of [-6.2,6.2]) {
      const z = back+.12;
      backPanel(cx-1.79,cx+1.79,1.43,4.27,z,'546c66');
      backPanel(cx-1.68,cx+1.68,1.53,4.17,z+.024,'afbbab');
      for (const dx of [-1.07,-.535,0,.535,1.07]) {
        box(cx+dx,2.85,z+.07,.055,2.70,.065,wood);
      }
      for (const y of [1.94,3.58,3.88]) box(cx,y,z+.07,3.39,.052,.065,wood);
    }
  }
  // A mounted folding screen carries a continuous panorama across its leaves.
  const frameZ = back+.17, paperZ = back+.235;
  const paper = river ? 'aab5a0' : opera ? 'b38b63' : 'ceb791';
  box(0, 2.55, frameZ, 7.35, 3.76, .18, ink);
  backPanel(-3.53,3.53,.80,4.29,paperZ+.035,paper);
  const sunX = river ? -1.92 : opera ? 1.62 : 2.12;
  oval(sunX, 3.50, paperZ+.066, .32, .32, .014, river ? 'd1c7a1' : 'c28553');
  const distant = river ? '859a90' : opera ? '997b5e' : 'afa188';
  const near = river ? '657e75' : opera ? '806b55' : '8c8c76';
  const farPeaks = [2.44,2.61,3.01,2.78,3.23,3.04,2.83,3.15,2.86,2.58,2.78,3.03,2.69];
  const nearPeaks = [2.29,2.38,2.63,2.56,2.32,2.20,2.38,2.58,2.77,2.61,2.42,2.25,2.41];
  function ridge(peaks, z, color) {
    for (let i = 1; i < peaks.length; i++) {
      const x0 = -3.53 + (i-1)*7.06/(peaks.length-1), x1 = -3.53 + i*7.06/(peaks.length-1);
      face([x0,.80,z], [x1,.80,z], [x1,peaks[i],z], [x0,peaks[i-1],z], color);
    }
  }
  ridge(farPeaks, paperZ+.076, distant);
  ridge(nearPeaks, paperZ+.087, near);
  for (const x of [-3.5,-2.33,-1.16,0,1.16,2.33,3.5]) {
    box(x, 2.54, paperZ+.098, .048, 3.5, .04, wood);
  }
  for (const y of [.86, 4.22]) box(0, y, paperZ+.11, 7.04, .055, .046, gold);

  // The theatre proscenium is assembled later at z=-2; paint and openwork
  // are registered to the front face of that beam and its supporting posts.
  if (!river) {
    const z = -1.764, beamY = 3.83;
    for (const [cx,width] of [[-5.45,2.90],[0,7.10],[5.45,2.90]]) {
      backPanel(cx-width/2,cx+width/2,beamY-.082,beamY+.088,z,blue);
      for (const side of [-1,1]) {
        const u=side*(width/2-.10);
        for (const [dy,extent] of [[-.046,.30],[0,.43],[.046,.30]]) {
          const x0=cx+u-side*extent,x1=cx+u;
          backPanel(Math.min(x0,x1),Math.max(x0,x1),beamY+dy-.008,beamY+dy+.008,z+.003,ochre);
        }
      }
    }
    for (const side of [-1,1]) {
      const cx=side*3.80;
      const p=(u,v,z)=>[cx-side*u,3.685-v,z];
      const brush=(u0,v0,u1,v1,tone,thick)=>{
        const step=Math.hypot(u1-u0,v1-v0),du=(v1-v0)*thick/step,dv=(u0-u1)*thick/step;
        const depth=tone===ochre?-1.753:-1.76;
        const points=[p(u0+du,v0+dv,depth),p(u1+du,v1+dv,depth),p(u1-du,v1-dv,depth),p(u0-du,v0-dv,depth)];
        if(side<0)points.reverse();
        face(...points,tone);
      };
      // Stepped lacquer spandrels turn into an open lattice under the lintel.
      for(const [u,v,a,b] of [[0,.50,.20,.50],[.20,.50,.20,.34],[.20,.34,.44,.34],
        [.44,.34,.44,.19],[.44,.19,.64,.19],[.64,.19,.64,.04],[.64,.04,.77,.04],
        [.07,.04,.07,.42],[.07,.18,.36,.18],[.30,.18,.30,.06]]){
        brush(u,v,a,b,wood,.036);
        brush(u,v,a,b,ochre,.010);
      }
    }
  }

  // Twin hanging silk landscapes are mounted on rods at the wings of the room.
  for(const side of [-1,1]){
    const x=side*8.60,z=back+.16;
    backPanel(x-.77,x+.77,1.45,4.41,z,'746e57');
    backPanel(x-.66,x+.66,1.61,4.25,z+.012,'b4b198');
    for(const y of [1.43,4.43])box(x,y,z,.18+1.54,.055,.061,wood);
  }
  // Pendant lights have a ceiling rose, chain, shade, ring and finial.
  for (const side of [-1,1]) {
    const x = side * (river ? 4.55 : 3.35), z = -2.88;
    box(x, 5.35, z, .27, .10, .28, ink);
    box(x, 5.10, z, .035, .46, .035, gold);
    shape(x, 4.74, z, [[0,.25,.21],[.11,.18,.15],[.14,.06,.06]], wood, 8);
    const silk = opera ? 'd57a55' : river ? 'cbab77' : 'cb7350';
    shape(x, 4.22, z, [[0,.13,.12],[.10,.22,.18],[.43,.22,.18],[.52,.23,.19]], silk, 8);
    for(const h of [.12,.22,.32,.42])shape(x,4.22+h,z,[[0,.224,.184],[.011,.224,.184]],'a37550',8);
    shape(x, 4.18, z, [[0,.10,.09],[.04,.15,.13],[.08,.17,.14]], ink, 8);
    box(x, 4.085, z, .028, .19, .028, gold);
  }
}


