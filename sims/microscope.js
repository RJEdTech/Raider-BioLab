(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,niceStep}=BioLab.h;
/* Optics: field number 18 mm with a 10× eyepiece, so field of view = 18 mm ÷ objective.
   Parfocal objectives with small focus offsets; depth of field shrinks at high power. */
const OBJ={4:{fov:4500,dof:50,off:0,wd:17,na:0.10,bright:1,len:30,band:'#d23a3a'},
           10:{fov:1800,dof:8,off:4,wd:7,na:0.25,bright:0.85,len:40,band:'#e0b020'},
           40:{fov:450,dof:1.5,off:10,wd:0.6,na:0.65,bright:0.6,len:52,band:'#3a7ad2'},
           100:{fov:180,dof:0.6,off:15,wd:0.15,na:1.25,bright:0.45,len:60,band:'#f2f2f2'}};
const SLIDES={onion:{name:'onion skin cells',unit:'onion cell',len:250},cheek:{name:'human cheek cells',unit:'cheek cell',len:60},
  elodea:{name:'Elodea leaf cells',unit:'leaf cell',len:75},blood:{name:'a human blood smear',unit:'red blood cell',len:7.5},e:{name:'a newspaper letter “e”',unit:'',len:NaN}};
const VX=255,VY=225,VR=200;
function H(a,b,c){let h=Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^Math.imul((c|0)+1013,-2048144789);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function optics(sim){const p=sim.p,o=OBJ[p.obj]||OBJ[4],zf=p.coarse*20+p.fine,target=1000+o.off,noOil=p.obj===100&&!p.oil;
  const blur=Math.min(14,Math.abs(zf-target)/o.dof*1.2)+(noOil?4:0);
  const bright=p.light/100*o.bright*(noOil?0.55:1);
  return {o,zf,target,blur,bright,noOil,fov:o.fov,S:400/o.fov};}
function fmtInt(n){return Math.round(n).toLocaleString('en-US');}
/* ---- specimens, drawn in world micrometers ---- */
function rowsSpecimen(ctx,x0,x1,y0,y1,RH,CL,jit,wallColor,wallW,cb){const walls=new Path2D(),j0=Math.floor(y0/RH)-1,j1=Math.ceil(y1/RH);
  for(let j=j0;j<=j1;j++){const y=j*RH;walls.moveTo(x0,y);walls.lineTo(x1,y);const off=H(j,7,1)*CL,k0=Math.floor((x0-off)/CL)-1,k1=Math.ceil((x1-off)/CL)+1;let prev=null;
    for(let k=k0;k<=k1;k++){const x=off+k*CL+(H(j,k,2)-.5)*jit;walls.moveTo(x,y);walls.lineTo(x,y+RH);if(prev!==null&&cb)cb(prev,y,x-prev,RH,j,k);prev=x;}}
  ctx.strokeStyle=wallColor;ctx.lineWidth=wallW;ctx.stroke(walls);}
function drawOnion(ctx,x0,x1,y0,y1,S,t,lw){ctx.fillStyle='#f1dfa2';ctx.fillRect(x0,y0,x1-x0,y1-y0);const nucs=[];
  rowsSpecimen(ctx,x0,x1,y0,y1,60,250,90,'#8c6420',Math.max(3.5,1.2*lw),(x,y,w,h,j,k)=>nucs.push([x+w/2+(H(j,k,3)-.5)*w*.5,y+h/2+(H(j,k,4)-.5)*18]));
  if(13*S>=0.7){ctx.fillStyle='#8a5a17';ctx.beginPath();nucs.forEach(n=>{ctx.moveTo(n[0]+13,n[1]);ctx.ellipse(n[0],n[1],13,10,0,0,6.29);});ctx.fill();
    if(S>0.5){ctx.fillStyle='#5a370b';ctx.beginPath();nucs.forEach(n=>{ctx.moveTo(n[0]+6.5,n[1]-2);ctx.arc(n[0]+3,n[1]-2,3.5,0,6.29);});ctx.fill();}}}
function drawCheek(ctx,x0,x1,y0,y1,S,t,lw){ctx.fillStyle='#edf2f8';ctx.fillRect(x0,y0,x1-x0,y1-y0);const G=90,cells=new Path2D(),nucs=[];
  for(let i=Math.floor(x0/G)-1;i<=Math.ceil(x1/G);i++)for(let j=Math.floor(y0/G)-1;j<=Math.ceil(y1/G);j++){
    const d=0.3+0.26*Math.sin(i*0.09+1)*Math.cos(j*0.07);if(H(i,j,5)>d)continue;
    const cx=(i+H(i,j,6))*G,cy=(j+H(i,j,7))*G,r=25+H(i,j,8)*14,rot=H(i,j,9)*6.28;
    for(let m=0;m<9;m++){const a=rot+m/9*6.283,rad=r*(0.78+0.4*H(i,j,10+m));const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad;m?cells.lineTo(x,y):cells.moveTo(x,y);}cells.closePath();
    nucs.push([cx+(H(i,j,30)-.5)*r*.3,cy+(H(i,j,31)-.5)*r*.3]);}
  ctx.fillStyle='rgba(140,172,212,0.38)';ctx.fill(cells);ctx.strokeStyle='#5a82b6';ctx.lineWidth=Math.max(0.8,1.1*lw);ctx.stroke(cells);
  if(4.5*S>=0.4){ctx.fillStyle='#2c4c98';ctx.beginPath();nucs.forEach(n=>{ctx.moveTo(n[0]+4.5,n[1]);ctx.ellipse(n[0],n[1],4.5,3.8,0,0,6.29);});ctx.fill();}}
function drawElodea(ctx,x0,x1,y0,y1,S,t,lw){ctx.fillStyle='#cde8b2';ctx.fillRect(x0,y0,x1-x0,y1-y0);const cells=[];
  rowsSpecimen(ctx,x0,x1,y0,y1,28,75,30,'#2f6b2a',Math.max(2.2,1.2*lw),(x,y,w,h,j,k)=>cells.push([x,y,w,h,j,k]));
  if(S>=0.5){ctx.fillStyle='#2b8a2b';ctx.beginPath();const sp=RM?2:6;
    cells.forEach(c=>{const [x,y,w,h,j,k]=c,iw=w-8,ih=h-8,P=2*(iw+ih),dir=H(j,k,5)<.5?1:-1;if(iw<4)return;
      for(let m=0;m<16;m++){let u=((H(j,k,20+m)*P+dir*t*sp)%P+P)%P,px,py;
        if(u<iw){px=x+4+u;py=y+4;}else if((u-=iw)<ih){px=x+4+iw;py=y+4+u;}else if((u-=ih)<iw){px=x+4+iw-u;py=y+4+ih;}else{u-=iw;px=x+4;py=y+4+ih-u;}
        ctx.moveTo(px+3.4,py);ctx.ellipse(px,py,3.4,2.6,0,0,6.29);}});ctx.fill();}}
function drawBlood(ctx,x0,x1,y0,y1,S,t,lw){ctx.fillStyle='#f6ebee';ctx.fillRect(x0,y0,x1-x0,y1-y0);
  if(S>=0.45){const G=9,o=new Path2D(),c=new Path2D();
    for(let i=Math.floor(x0/G)-1;i<=Math.ceil(x1/G);i++)for(let j=Math.floor(y0/G)-1;j<=Math.ceil(y1/G);j++){if(H(i,j,1)>0.6)continue;
      const cx=(i+H(i,j,2))*G,cy=(j+H(i,j,3))*G,r=3.75*(0.92+0.16*H(i,j,4));o.moveTo(cx+r,cy);o.arc(cx,cy,r,0,6.29);c.moveTo(cx+r*.4,cy);c.arc(cx,cy,r*.4,0,6.29);}
    ctx.fillStyle='#e2848f';ctx.fill(o);ctx.strokeStyle='#c45867';ctx.lineWidth=Math.max(0.25,0.8*lw);ctx.stroke(o);ctx.fillStyle='#f3c3c9';ctx.fill(c);
    const pl=new Path2D();for(let i=Math.floor(x0/22)-1;i<=Math.ceil(x1/22);i++)for(let j=Math.floor(y0/22)-1;j<=Math.ceil(y1/22);j++){if(H(i,j,40)>0.12)continue;const cx=(i+H(i,j,41))*22,cy=(j+H(i,j,42))*22;pl.moveTo(cx+1.3,cy);pl.arc(cx,cy,1.3,0,6.29);}
    ctx.fillStyle='#8e5bb5';ctx.fill(pl);}
  else{const G=Math.max(9,4/S),q=new Path2D();for(let i=Math.floor(x0/G)-1;i<=Math.ceil(x1/G);i++)for(let j=Math.floor(y0/G)-1;j<=Math.ceil(y1/G);j++){if(H(i,j,1)>0.7)continue;const cx=(i+H(i,j,2))*G,cy=(j+H(i,j,3))*G,r=G*0.32;q.rect(cx-r,cy-r,2*r,2*r);}
    ctx.fillStyle='#e6a0aa';ctx.fill(q);}
  for(let i=Math.floor(x0/160)-1;i<=Math.ceil(x1/160);i++)for(let j=Math.floor(y0/160)-1;j<=Math.ceil(y1/160);j++){if(H(i,j,30)>0.16)continue;const cx=(i+H(i,j,31))*160,cy=(j+H(i,j,32))*160;
    if(S>=0.45){ctx.fillStyle='#e9e0f1';ctx.beginPath();ctx.arc(cx,cy,6.5,0,6.29);ctx.fill();ctx.fillStyle='#6b3fa0';[[-2.2,-1],[0.8,-2.4],[2.4,1.2]].forEach(d=>{ctx.beginPath();ctx.arc(cx+d[0],cy+d[1],2.3,0,6.29);ctx.fill();});}
    else{ctx.fillStyle='#7b4fb0';ctx.beginPath();ctx.arc(cx,cy,Math.max(6.5,1.6/S),0,6.29);ctx.fill();}}}
function drawE(ctx,x0,x1,y0,y1,S,t,lw){ctx.fillStyle='#f3efe4';ctx.fillRect(x0,y0,x1-x0,y1-y0);const f=new Path2D();
  for(let i=Math.floor(x0/220)-1;i<=Math.ceil(x1/220);i++)for(let j=Math.floor(y0/220)-1;j<=Math.ceil(y1/220);j++)for(let m=0;m<3;m++){const cx=(i+H(i,j,m))*220,cy=(j+H(i,j,m+5))*220,a=H(i,j,m+9)*6.28,L=150+H(i,j,m+12)*250;f.moveTo(cx-Math.cos(a)*L/2,cy-Math.sin(a)*L/2);f.lineTo(cx+Math.cos(a)*L/2,cy+Math.sin(a)*L/2);}
  ctx.strokeStyle='rgba(140,128,105,0.35)';ctx.lineWidth=Math.max(6,lw);ctx.stroke(f);
  ctx.fillStyle='#1d1d1d';ctx.font='bold 1500px Georgia, "Times New Roman", serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('e',0,0);
  if(S>0.6){ctx.fillStyle='rgba(243,239,228,0.55)';const d=new Path2D();for(let i=Math.floor(x0/14);i<=Math.ceil(x1/14);i++)for(let j=Math.floor(y0/14);j<=Math.ceil(y1/14);j++){if(H(i,j,50)>0.25)continue;const cx=(i+H(i,j,51))*14,cy=(j+H(i,j,52))*14;d.moveTo(cx+2,cy);d.arc(cx,cy,2,0,6.29);}ctx.fill(d);}}
const DRAW={onion:drawOnion,cheek:drawCheek,elodea:drawElodea,blood:drawBlood,e:drawE};

/* ---------- Virtual lab benches: osmosis in red onion and Elodea cells (Virtual lab mode; see VLAB.md) ----------
   The water-potential model follows the transport tool: water flows into a protoplast at dV/dt = k·(ψout − ψin),
   with ψin = ψs + ψp, ψs = −Ci·R·T, Ci = n·(1 − Vb)/(V − Vb) (Boyle–van ’t Hoff) and ψp = E·(V − 1) while the protoplast presses on the wall.
   V is the protoplast volume relative to the relaxed cell wall. Below 1 the membrane pulls away from the wall (plasmolysis); the wall stays put.
   A solution drawn under the cover slip reaches each cell after a delay and mixes in over tens of seconds, so cells change at different times.
   48 seeded cell types (solute content, water permeability, mixing delay) are shared out among the cells by position. */
const ORT=0.002451,OPCT=342,NT=48,OVB=0.1,OTAP=4,ODW=30,OSQ=150,OMAX=900,OSTOPS=[0,60,120,180];
const OSP={onion:{RH:60,CL:250,jit:90,n:520,E:15,k:0.006,d:[5,115],tau:35,d2:[2,40],tau2:18,salt:5,ex:0.6,ey:0.25},
           elodea:{RH:28,CL:75,jit:30,n:400,E:12,k:0.007,d:[4,95],tau:30,d2:[2,40],tau2:18,salt:5,ex:0.5,ey:0.35}};
const OSOL={salt:'salt water',dw:'distilled water'};
function ohr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function ohn(seed,a,b){const u=Math.max(1e-9,ohr(seed,a,b)),w=ohr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const mmss=s=>{s=Math.max(0,Math.floor(s+1e-6));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const LCD='700 VSIZEpx "Consolas","Menlo","DejaVu Sans Mono","Courier New",monospace';
function lcdBox(ctx,x,y,w,h,label,value,k,vsize){ctx.fillStyle='#2b2f36';rr(ctx,x,y,w,h,12);ctx.fill();txt(ctx,label,x+14,y+20,{s:Math.min(12*k,16),w:700,c:'#d7dbe0'});
  const sy=y+30,sh=h-42;ctx.fillStyle='#cfe3c8';rr(ctx,x+12,sy,w-24,sh,6);ctx.fill();ctx.fillStyle='#1b2a1b';ctx.font=LCD.replace('VSIZE',String(vsize||44));ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(value,x+w-24,sy+sh/2+2);}
/* the same cell geometry as rowsSpecimen, without drawing */
function eachCell(x0,x1,y0,y1,RH,CL,jit,cb){const j0=Math.floor(y0/RH)-1,j1=Math.ceil(y1/RH);
  for(let j=j0;j<=j1;j++){const y=j*RH,off=H(j,7,1)*CL,k0=Math.floor((x0-off)/CL)-1,k1=Math.ceil((x1-off)/CL)+1;let prev=null;
    for(let k=k0;k<=k1;k++){const x=off+k*CL+(H(j,k,2)-.5)*jit;if(prev!==null)cb(prev,y,x-prev,RH,j,k);prev=x;}}}
const cellType=(j,k)=>Math.floor(H(j,k,77)*NT);
function osmPsi(A,V){return -A.n*(1-OVB)/Math.max(V-OVB,0.02)*ORT+A.E*Math.max(0,V-1);}
function osmTypes(seed,P){const T=[];for(let a=0;a<NT;a++){const A={n:P.n*Math.exp(0.13*ohn(seed,1,a)),E:P.E,k:P.k*Math.exp(0.3*ohn(seed,2,a)),
    d:P.d[0]+(P.d[1]-P.d[0])*ohr(seed,3,a),tau:P.tau*Math.exp(0.4*ohn(seed,4,a)),d2:P.d2[0]+(P.d2[1]-P.d2[0])*ohr(seed,5,a),tau2:P.tau2*Math.exp(0.4*ohn(seed,6,a)),slow:ohr(seed,7,a)<0.04};
    let lo=1,hi=1.6;for(let i=0;i<50;i++){const m=(lo+hi)/2;if(osmPsi(A,m)>-OTAP*ORT)hi=m;else lo=m;}A.V0=(lo+hi)/2;T.push(A);}return T;}
/* outside concentration (mOsm/L) around cells of type a right now */
function osmCo(L,b,a){if(b.ph!=='salt'&&b.ph!=='dw')return OTAP;const A=L.T[a],sal=b.ph==='salt',d=sal?A.d:A.d2,tau=sal?A.tau:A.tau2,tg=sal?L.P.salt*OPCT:ODW,c0=b.C0[a];
  return b.clk<=d?c0:tg+(c0-tg)*Math.exp(-(b.clk-d)/tau);}
function osmAdvance(L,b,h){for(let a=0;a<NT;a++){const A=L.T[a],Co=osmCo(L,b,a);let k=A.k;if(b.ph==='dw'&&A.slow)k*=0.06;b.V[a]=Math.max(OVB+0.03,b.V[a]+k*(-Co*ORT-osmPsi(A,b.V[a]))*h);}}
/* cells in the counting field: more than half inside the 40× circle (onion) or the eyepiece counting square (Elodea) */
function osmCells(L,view){const P=L.P,cx=-view.sx,cy=-view.sy,out=[];
  if(L.kind==='elodea'){const hs=OSQ/2;eachCell(cx-hs-120,cx+hs+120,cy-hs-40,cy+hs+40,P.RH,P.CL,P.jit,(x,y,w,h,j,k)=>{if(Math.abs(x+w/2-cx)<hs&&Math.abs(y+h/2-cy)<hs)out.push(cellType(j,k));});}
  else{const R=OBJ[40].fov/2;eachCell(cx-R-300,cx+R+300,cy-R-80,cy+R+80,P.RH,P.CL,P.jit,(x,y,w,h,j,k)=>{if(Math.hypot(x+w/2-cx,y+h/2-cy)<R)out.push(cellType(j,k));});}
  return out;}
function osmCount(L,b){let lo=0,mid=0,hi=0;L.cells.forEach(a=>{const V=b.V[a];if(V<0.93)lo++;if(V<0.95)mid++;if(V<0.985)hi++;});return {lo,mid,hi};}
function osmRecord(L,b){const h=b.hist[b.ph];if(!h)return;const s=Math.min(OMAX,Math.floor(b.clk+1e-6));if(h.length>s)return;const c=osmCount(L,b);while(h.length<=s)h.push([c.lo,c.hi]);}
const osmL=s=>s&&s.vlab&&s.st&&s.st.L?s.st.L:null;
function osmInit(sim){const V=sim.vlab,b=V.bench,kind=V.lab.id==='elodea-osmosis'?'elodea':'onion',P=OSP[kind],seed=V.seed;
  // Reset bench gives you a fresh slide. Your recorded readings stay, so the checks still work.
  if(V._live){b.prep=0;b.drop='';b.ph='tap';b.clk=0;b.mix=false;b.V=null;b.C0=null;b.f4=b.f10=b.f40=false;}
  if(!b.hist||typeof b.hist!=='object')b.hist={};['salt','dw'].forEach(x=>{if(!Array.isArray(b.hist[x]))b.hist[x]=[];});
  if(!Number.isFinite(b.prep))b.prep=0;if(b.ph!=='salt'&&b.ph!=='dw')b.ph='tap';if(!Number.isFinite(b.clk))b.clk=0;if(typeof b.drop!=='string')b.drop='';
  const T=osmTypes(seed,P),L={kind,P,T,hold:false,holdAt:0,sph:new Array(NT).fill(0)};
  if(!Array.isArray(b.V)||b.V.length!==NT||!b.V.every(Number.isFinite))b.V=T.map(A=>A.V0);
  if(!Array.isArray(b.C0)||b.C0.length!==NT)b.C0=T.map(()=>OTAP);
  // each student looks at a different patch of the specimen, chosen so the counting field holds a countable number of cells
  if(!b.view||!Number.isFinite(b.view.sx)){let best=null;for(let i=0;i<30;i++){const vw={sx:Math.round((ohr(seed,11,i)*2-1)*150)*10,sy:Math.round((ohr(seed,12,i)*2-1)*150)*10},n=osmCells(L,vw).length;
      if(!best||Math.abs(n-11)<Math.abs(best.n-11))best={vw,n};if(n>=9&&n<=13)break;}b.view=best.vw;}
  L.cells=osmCells(L,b.view);L.tot=b.tot=L.cells.length;
  const cx=-b.view.sx,cy=-b.view.sy;L.bub=[0,1].map(i=>{const a=ohr(seed,13,i)*6.283,d=(kind==='elodea'?300:330)+320*ohr(seed,14,i),r=30+42*ohr(seed,15,i);return {x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d,r};});
  return L;}
function osmFlags(sim){const b=sim.vlab.bench,p=sim.p,c=b.ctl;
  if(!c||c.obj!==p.obj||c.coarse!==p.coarse||c.fine!==p.fine||c.light!==p.light)b.ctl={obj:p.obj,coarse:p.coarse,fine:p.fine,light:p.light};
  const o=optics(sim);if(b.prep>=3&&!sim.st.crashed&&o.blur<1.2&&o.bright>=0.3){if(p.obj===4)b.f4=true;else if(b.f4){if(p.obj===10)b.f10=true;if(p.obj===40)b.f40=true;}}}
function osmStep(sim,ds){const L=sim.st.L,b=sim.vlab.bench;if(L.hold){if(!sim.running)return;L.hold=false;}if(b.ph==='tap')return;
  while(ds>1e-9){if(b.clk>=OMAX)return;let h=Math.min(ds,0.25);const nx=OSTOPS.find(x=>x>b.clk+1e-9);
    if(sim.p.pauseRead&&nx!==undefined&&b.clk+h>=nx-1e-9){h=Math.max(0,nx-b.clk);osmAdvance(L,b,h);b.clk=nx;osmRecord(L,b);L.hold=true;L.holdAt=nx;BioLab.pause(sim);return;}
    osmAdvance(L,b,h);b.clk+=h;osmRecord(L,b);ds-=h;}}
/* a reload mid-reading puts the clock back on hold */
function osmResume(sim){const L=osmL(sim);if(!L)return;const b=sim.vlab.bench;if(b.ph!=='tap'&&sim.p.pauseRead&&OSTOPS.includes(b.clk)&&!L.hold&&b.hist[b.ph].length===b.clk+1){L.hold=true;L.holdAt=b.clk;BioLab.pause(sim);}}
function osmSetup(sim){const b=sim.vlab.bench,L=osmL(sim);sim.vlab._live=true;if(!L)return;
  BioLab.setValues(sim,Object.assign({slide:L.kind==='elodea'?'elodea':'onion',sx:b.view.sx,sy:b.view.sy,obj:4,coarse:38,fine:0,light:90},b.ctl||{},{sx:b.view.sx,sy:b.view.sy}));
  sim.st.crashed=false;sim.st.warnAt=-99;BioLab.refresh(sim);}
function osmExtraBlur(sim){const b=sim.vlab.bench;return b.prep===1?3.2:b.prep===2?1.6:0;}
/* ---- drawing the living specimens, in world micrometers ---- */
let RR_MIN=0;   // corner radii below this (µm) are drawn square: far cheaper at low power, where they are under a pixel
function rrPath(P,x,y,w,h,r){if(w<=0||h<=0)return;r=Math.max(0,Math.min(r,w/2,h/2));if(r<RR_MIN){P.rect(x,y,w,h);return;}P.moveTo(x+r,y);P.arcTo(x+w,y,x+w,y+h,r);P.arcTo(x+w,y+h,x,y+h,r);P.arcTo(x,y+h,x,y,r);P.arcTo(x,y,x+w,y,r);P.closePath();}
/* the protoplast inside a cell's wall: it fills the wall at V ≥ 1 and shrinks into a rounded mass below that */
function protoBox(x,y,w,h,V,j,k,ex,ey){const f=clamp(V,0.22,1);if(f>=0.999)return {x,y,w,h,r:Math.min(w,h)*0.08,f:1};
  const pw=w*Math.pow(f,ex),ph=h*Math.pow(f,ey),ox=(H(j,k,79)-.5)*(w-pw)*0.9,oy=(H(j,k,81)-.5)*(h-ph)*0.6;
  return {x:x+(w-pw)/2+ox,y:y+(h-ph)/2+oy,w:pw,h:ph,r:Math.min(pw,ph)/2*clamp(0.08+(1-f)*7,0,1),f};}
function drawEmptySlide(ctx,x0,x1,y0,y1){ctx.fillStyle='#f5f2ec';ctx.fillRect(x0,y0,x1-x0,y1-y0);const d=new Path2D();
  for(let i=Math.floor(x0/300)-1;i<=Math.ceil(x1/300);i++)for(let j=Math.floor(y0/300)-1;j<=Math.ceil(y1/300);j++){if(H(i,j,60)>0.3)continue;const cx=(i+H(i,j,61))*300,cy=(j+H(i,j,62))*300,r=3+6*H(i,j,63);d.moveTo(cx+r,cy);d.arc(cx,cy,r,0,6.29);}
  ctx.fillStyle='rgba(120,110,100,0.35)';ctx.fill(d);}
function drawBubblesAndFlow(ctx,sim,S,lw){const L=sim.st.L,b=sim.vlab.bench;
  if(b.ph!=='tap'&&b.clk<45){const cx=-sim.p.sx,cy=-sim.p.sy,D=900*(1-Math.exp(-b.clk/9)),a=clamp(1-b.clk/45,0,1),d=new Path2D();
    for(let i=0;i<26;i++){const x=cx+(H(i,3,9)-.5)*2600-500+D,y=cy+(H(i,4,9)-.5)*1800,r=2.5+5*H(i,5,9);d.moveTo(x+r,y);d.arc(x,y,r,0,6.29);}
    ctx.fillStyle='rgba(90,84,80,'+(0.55*a).toFixed(3)+')';ctx.fill(d);}
  if(b.prep>=3)L.bub.forEach(q=>{ctx.fillStyle='rgba(252,252,250,0.92)';ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,6.29);ctx.fill();
    ctx.strokeStyle='rgba(28,28,32,0.9)';ctx.lineWidth=Math.max(q.r*0.2,2*lw);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.85)';ctx.beginPath();ctx.arc(q.x-q.r*.3,q.y-q.r*.3,q.r*.18,0,6.29);ctx.fill();});}
const ONV=[[214,132,188],[198,108,172],[182,86,156],[164,66,140],[146,48,124],[128,34,108],[112,24,94]].map(c=>'rgb('+c.join(',')+')');
function drawOnionLab(ctx,x0,x1,y0,y1,S,t,lw,sim){RR_MIN=1.2/S;const b=sim.vlab.bench,P=OSP.onion;if(b.prep<1){drawEmptySlide(ctx,x0,x1,y0,y1);return;}
  ctx.fillStyle='#f3eaf0';ctx.fillRect(x0,y0,x1-x0,y1-y0);   // the solution that fills the space a shrunken protoplast leaves inside its wall
  const NB=ONV.length,vac=ONV.map(()=>new Path2D()),cyt=new Path2D(),walls=new Path2D(),nuc=new Path2D(),wt=2.2,cy=1.8,detail=S>=0.4;
  eachCell(x0,x1,y0,y1,P.RH,P.CL,P.jit,(x,y,w,h,j,k)=>{const V=b.V[cellType(j,k)];walls.rect(x,y,w,h);
    const B=protoBox(x+wt,y+wt,w-2*wt,h-2*wt,V,j,k,P.ex,P.ey);rrPath(cyt,B.x,B.y,B.w,B.h,B.r);
    const pg=(0.78+0.44*H(j,k,78))*Math.pow(1/B.f,0.75),li=clamp(Math.round((pg-0.78)/1.9*(NB-1)),0,NB-1);
    rrPath(vac[li],B.x+cy,B.y+cy,B.w-2*cy,B.h-2*cy,Math.max(0,B.r-cy));
    if(detail){const nx=B.x+B.w*(0.18+0.64*H(j,k,80)),ny=B.y+B.h*(0.35+0.3*H(j,k,82)),rx=Math.min(11,B.w*0.3),ry=Math.min(8,B.h*0.32);nuc.moveTo(nx+rx,ny);nuc.ellipse(nx,ny,rx,ry,0,0,6.29);}});
  ctx.fillStyle='#ecdde8';ctx.fill(cyt);                       // cytoplasm: a thin, nearly clear layer just inside the membrane
  for(let i=0;i<NB;i++){ctx.fillStyle=ONV[i];ctx.fill(vac[i]);}  // central vacuole, purple with anthocyanin
  if(detail){ctx.fillStyle='rgba(120,92,120,0.32)';ctx.fill(nuc);ctx.strokeStyle='rgba(92,34,78,0.8)';ctx.lineWidth=0.9*lw;ctx.stroke(cyt);}
  ctx.strokeStyle='#73405f';ctx.lineWidth=Math.max(1.6,1.0*lw);ctx.stroke(walls);
  drawBubblesAndFlow(ctx,sim,S,lw);}
function drawElodeaLab(ctx,x0,x1,y0,y1,S,t,lw,sim){RR_MIN=1.2/S;const b=sim.vlab.bench,L=sim.st.L,P=OSP.elodea;if(b.prep<1){drawEmptySlide(ctx,x0,x1,y0,y1);return;}
  ctx.fillStyle='#e8f1df';ctx.fillRect(x0,y0,x1-x0,y1-y0);
  const cyt=[new Path2D(),new Path2D(),new Path2D()],walls=new Path2D(),chl=new Path2D(),detail=S>=0.5,sp=[];
  eachCell(x0,x1,y0,y1,P.RH,P.CL,P.jit,(x,y,w,h,j,k)=>{const a=cellType(j,k),V=b.V[a];walls.rect(x,y,w,h);
    const B=protoBox(x+1.4,y+1.4,w-2.8,h-2.8,V,j,k,P.ex,P.ey),li=B.f>0.8?0:B.f>0.5?1:2;rrPath(cyt[li],B.x,B.y,B.w,B.h,B.r);
    if(!detail)return;const iw=B.w-6,ih=B.h-6,Pm=2*(iw+ih),dir=H(j,k,5)<.5?1:-1,ph=L.sph[a]*dir;
    for(let m=0;m<16;m++){let px,py;
      if(iw<6||ih<5){px=B.x+B.w*(0.2+0.6*H(j,k,40+m));py=B.y+B.h*(0.2+0.6*H(j,k,60+m));}
      else{let u=((H(j,k,20+m)*Pm+ph)%Pm+Pm)%Pm;if(u<iw){px=B.x+3+u;py=B.y+3;}else if((u-=iw)<ih){px=B.x+3+iw;py=B.y+3+u;}else if((u-=ih)<iw){px=B.x+3+iw-u;py=B.y+3+ih;}else{u-=iw;px=B.x+3;py=B.y+3+ih-u;}}
      chl.moveTo(px+3.4,py);chl.ellipse(px,py,3.4,2.6,0,0,6.29);}});
  ['#cde8b0','#b8dd94','#a1d07a'].forEach((c,i)=>{ctx.fillStyle=c;ctx.fill(cyt[i]);});
  if(detail){ctx.strokeStyle='rgba(46,104,40,0.75)';ctx.lineWidth=0.9*lw;cyt.forEach(p=>ctx.stroke(p));ctx.fillStyle='#2b8a2b';ctx.fill(chl);}
  ctx.strokeStyle='#2f6b2a';ctx.lineWidth=Math.max(1.6,1.1*lw);ctx.stroke(walls);
  drawBubblesAndFlow(ctx,sim,S,lw);}
/* cytoplasmic streaming slows, then stops, as a protoplast shrinks */
function osmStream(sim,vdt){const L=sim.st.L,b=sim.vlab.bench;if(!(vdt>0))return;const sp=RM?2:6;for(let a=0;a<NT;a++)L.sph[a]+=vdt*sp*clamp((b.V[a]-0.6)/0.35,0,1);}
/* the bench beside the eyepiece: the slide from above, what is under the cover slip, and the lab clock */
function osmPanel(sim,ctx,k){const b=sim.vlab.bench,L=sim.st.L,el=L.kind==='elodea',X=486,W=304,fs=Math.min(13*k,22),fb=Math.min(14*k,24),fm=Math.min(12*k,19);
  txt(ctx,'Your slide, from above',X,26,{s:fs,w:700});
  const sy=40,sh=128,cx=X+W/2+18,cy=sy+sh/2,cs=sh-18;
  ctx.fillStyle='rgba(206,228,238,0.6)';rr(ctx,X,sy,W,sh,6);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;rr(ctx,X,sy,W,sh,6);ctx.stroke();
  ctx.fillStyle='rgba(232,229,220,0.95)';rr(ctx,X+5,sy+5,46,sh-10,4);ctx.fill();
  if(b.prep===2){ctx.fillStyle='rgba(110,168,222,0.38)';ctx.beginPath();ctx.ellipse(cx,cy,52,38,0,0,6.29);ctx.fill();}
  if(b.prep>=3){ctx.fillStyle='rgba(110,168,222,0.24)';ctx.fillRect(cx-cs/2,cy-cs/2,cs,cs);}
  if(b.prep>=1){if(el){const pl=osmCount(L,b).mid/Math.max(1,L.tot),wd=15*(1-0.12*pl);ctx.fillStyle='rgba(70,150,52,0.9)';ctx.beginPath();
      ctx.moveTo(cx-56,cy);for(let i=0;i<=12;i++){const u=i/12,x=cx-56+u*112,w=wd*Math.sin(Math.PI*u)*(1+(i%2?0.06:0));ctx.lineTo(x,cy-w);}for(let i=12;i>=0;i--){const u=i/12,x=cx-56+u*112,w=wd*Math.sin(Math.PI*u)*(1+(i%2?0.06:0));ctx.lineTo(x,cy+w);}ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(40,98,30,0.9)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx-50,cy);ctx.lineTo(cx+52,cy);ctx.stroke();}
    else{ctx.fillStyle='rgba(150,48,122,0.78)';ctx.beginPath();for(let i=0;i<14;i++){const a=i/14*6.283,r=1+0.16*(H(i,1,90)-.5);const x=cx+Math.cos(a)*44*r,y=cy+Math.sin(a)*28*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();}}
  if(b.prep>=3){ctx.strokeStyle='rgba(88,128,158,0.95)';ctx.lineWidth=1.5;ctx.strokeRect(cx-cs/2,cy-cs/2,cs,cs);ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-cs/2+10,cy-cs/2+30);ctx.lineTo(cx-cs/2+30,cy-cs/2+10);ctx.stroke();}
  if(b.drop){ctx.fillStyle='rgba(110,168,222,0.6)';ctx.strokeStyle='rgba(60,110,160,0.9)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(cx-cs/2-7,cy,10,18,0,0,6.29);ctx.fill();ctx.stroke();}
  if(b.ph!=='tap'&&b.clk<25){const a=clamp(1-b.clk/25,0,1),tx=cx+cs/2-3,wet=Math.min(1,b.clk/6+0.2);ctx.fillStyle='#fbfaf3';ctx.fillRect(tx,cy-36,32,72);ctx.fillStyle='rgba(110,168,222,0.5)';ctx.fillRect(tx,cy-36,32*wet,72);
    ctx.strokeStyle='rgba(150,150,140,0.7)';ctx.lineWidth=1;ctx.strokeRect(tx,cy-36,32,72);
    ctx.strokeStyle='rgba(40,96,170,'+a.toFixed(2)+')';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=2.5;[-26,0,26].forEach(dy=>{const y=cy+dy,x1=cx-cs/2+12,x2=cx+cs/2-16;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();ctx.beginPath();ctx.moveTo(x2+8,y);ctx.lineTo(x2-2,y-6);ctx.lineTo(x2-2,y+6);ctx.closePath();ctx.fill();});}
  // what surrounds the cells
  const under=b.prep<2?'Nothing yet':b.ph==='salt'?'Salt water ('+L.P.salt+'% NaCl)':b.ph==='dw'?'Distilled water':'Tap water';
  txt(ctx,b.prep>=3?'Under the cover slip':'On the slide',X,196,{s:fs,c:PAL['cv-soft']});txt(ctx,under,X,220,{s:fb,w:700});
  if(b.drop)txt(ctx,'Drop at edge: '+OSOL[b.drop],X,246,{s:fm,c:PAL['cv-soft']});
  else if(el&&b.ph==='tap')txt(ctx,b.mix?'Salt water: ready':'Salt water: not made yet',X,246,{s:fm,c:PAL['cv-soft']});
  lcdBox(ctx,X+20,262,W-40,108,'LAB CLOCK',mmss(b.ph==='tap'?0:b.clk),k,46);
  if(L.hold)pill(ctx,'Reading time: '+mmss(L.holdAt),X+W/2,396,PAL['rj'],'#fff',Math.min(14*k,20));
  else if(b.ph!=='tap'&&b.clk<180&&sim.p.pauseRead)txt(ctx,'Stops at '+mmss(OSTOPS.find(x=>x>b.clk+1e-9)),X+W/2,400,{s:fm,c:PAL['cv-soft'],a:'center'});
  else if(b.ph==='tap')txt(ctx,'Starts with the paper towel',X+W/2,400,{s:fm,c:PAL['cv-soft'],a:'center'});
  txt(ctx,(el?'Counting square: '+OSQ+' µm at 40×':'40× field of view: 450 µm'),X+W/2,434,{s:fm,c:PAL['cv-soft'],a:'center'});}
function osmNarrate(sim){const L=sim.st.L,b=sim.vlab.bench,p=sim.p,s=sim.st,o=optics(sim),el=L.kind==='elodea',mag=10*p.obj;
  if(s.crashed)return '<b>Cracked slide!</b> At '+p.obj+'× the objective sits only '+o.o.wd+' mm above the slide, and the coarse knob raised the stage into it. Press “Replace cracked slide”, and use only fine focus at high power.';
  if(b.prep===0)return el?'A clean slide sits on the stage. Place one Elodea leaf flat on it.':'A clean slide sits on the stage. Peel a very thin piece of epidermis from the purple side of a red onion layer and lay it flat on the slide.';
  if(b.prep===1)return 'The '+(el?'leaf':'epidermis')+' is on the slide, but it is dry and wrinkled. Add 1–2 drops of tap water.';
  if(b.prep===2)return 'Lower the cover slip at an angle, one edge first, so that you trap as few air bubbles as possible.';
  if(L.hold)return '<b>Reading time: '+mmss(L.holdAt)+'.</b> Count the cells '+(el?'inside the counting square':'in view')+' and how many of them are plasmolyzed. Type both in your table, then press <b>Play</b>.';
  if(p.obj>=40&&sim.t-s.warnAt<4)return '<b>Careful:</b> at '+p.obj+'× use only the fine focus knob. One click of coarse focus moves the stage 20 µm, more than 10 times the depth of focus.';
  if(o.blur>4)return '<b>Out of focus.</b> '+(p.obj<=10?'Turn the coarse focus knob slowly until the image sharpens.':'Turn only the fine focus knob to sharpen the image.');
  if(o.bright<0.3)return '<b>Too dark.</b> Turn up the light or open the diaphragm.';
  if(b.drop)return 'A drop of '+OSOL[b.drop]+' sits at one edge of the cover slip. Touch a paper towel to the opposite edge to draw it across the cells.';
  if(b.ph!=='tap'&&b.clk<25)return 'The paper towel soaks up the water at one edge and pulls the '+OSOL[b.ph]+' under the cover slip and across the cells.';
  if(b.ph!=='tap')return 'The cells are now surrounded by '+OSOL[b.ph]+'. Keep watching '+(el?'the green structures and the edges of each cell':'the purple vacuoles and the cell walls')+'. Not every cell changes at the same moment.';
  if(p.obj===4)return 'Low power: '+mag+'× total. The field is 4.5 mm across. Find an area where the cells lie flat in a single layer, then focus.';
  return el?'Living Elodea leaf cells at '+mag+'× total. The green structures move slowly around the edge of each cell, carried by the moving cytoplasm.':'Red onion epidermis at '+mag+'× total, with no stain. The purple color is a pigment, anthocyanin, dissolved in each cell’s large central vacuole.';}
/* ---- checks: they compare your counts with what the field showed at that time on the lab clock ---- */
const OROWS=[0,1,2,3];
function osmTotCheck(sim,rv,v){const L=osmL(sim),b=sim.vlab.bench;if(Math.round(v)!==v||v<0)return 'Count whole cells: enter a whole number.';
  const tot=L?L.tot:b.tot;if(!Number.isFinite(tot)||Math.abs(v-tot)<=1)return null;const where=L&&L.kind==='elodea'?'the counting square':'the circle';
  return v>tot?'That is more cells than are in view. At 40×, count each cell once, and only the cells that are more than half inside '+where+'.':'Some cells are missing from your count. At 40×, count every cell that is more than half inside '+where+'.';}
function osmPlCheck(ph,plas){return (sim,rv,v)=>{const b=sim.vlab.bench,h=(b.hist||{})[ph]||[],t=Math.round(+rv*60),nm=OSOL[ph];
  if(Math.round(v)!==v||v<0)return 'Count whole cells: enter a whole number.';
  if(!h.length)return 'Draw the '+nm+' across the cells first, then count at each reading time.';
  if(h.length<=t)return 'The lab clock has not reached '+mmss(t)+' in '+nm+' yet.';
  let lo=1e9,hi=-1;for(let s=Math.max(0,t-3);s<=Math.min(h.length-1,t+3);s++){lo=Math.min(lo,h[s][0]);hi=Math.max(hi,h[s][1]);}
  if(v>=lo-1&&v<=hi+1)return null;if(Number.isFinite(b.tot)&&v>b.tot+1)return 'You counted more plasmolyzed cells than there are cells in view.';
  return v>hi?'Fewer cells than that were plasmolyzed at '+mmss(t)+'. Count only the cells whose '+plas+' had pulled away from the cell wall.':'More cells than that were plasmolyzed at '+mmss(t)+'. Count every cell whose '+plas+' had pulled away from the wall, even just at one end or a corner.';};}
function osmPctCheck(tid){return (sim,rv,v)=>{const V=sim.vlab,r=OROWS.indexOf(+rv),n=V.val(tid,'tot',r),m=V.val(tid,'pl',r);
  if(!Number.isFinite(n)||!Number.isFinite(m))return 'Fill in both cell counts in this row first.';if(n<=0)return null;
  const pc=100*m/n;if(Math.abs(v-pc)<=0.6)return null;if(pc>0&&Math.abs(v-pc/100)<0.006)return 'That is a fraction. Multiply by 100 to make it a percent.';
  return 'Percent plasmolyzed = plasmolyzed cells ÷ cells in view × 100. Check it against the counts in this row.';};}
function countTable(id,ph,title,plas){return {id,title,cols:[{id:'t',label:'Time (min)',rows:OROWS,rowLabels:['0 (just as the '+OSOL[ph]+' is drawn across)','1','2','3']},
  {id:'tot',label:'Cells in view',input:'number',dp:0,check:osmTotCheck},{id:'pl',label:'Plasmolyzed cells',input:'number',dp:0,check:osmPlCheck(ph,plas)},
  {id:'pct',label:'Percent plasmolyzed (%)',input:'number',dp:1,check:osmPctCheck(id)}]};}
function osmDescCheck(sim,rv,v){const b=sim.vlab.bench,h=b.hist||{},r=String(rv);
  if(r==='tap water'&&!b.seen&&!(b.prep>=3))return 'Make the wet mount and look at the cells under the microscope first.';
  if(r==='salt water'&&!((h.salt||[]).length>110))return 'Draw the salt water across and watch the cells for 2 minutes before you describe them.';
  if(r==='distilled water'&&!((h.dw||[]).length>110))return 'Draw the distilled water across and watch the cells for a few minutes before you describe them.';
  return null;}
/* circle-one rows: the solution type and the direction of net water movement must agree with each other */
function osmAgree(tid,tc,dc){return (sim,rv,v)=>{const V=sim.vlab,tb=V.lab.tables.find(t=>t.id===tid),r=tb.cols[0].rows.map(String).indexOf(String(rv)),ty=V.raw('c:'+tid+':'+tc+':'+r),d=V.raw('c:'+tid+':'+dc+':'+r);
  if(!ty||!d)return null;if((ty==='hyper'&&d!=='out')||(ty==='hypo'&&d!=='in')||(ty==='iso'&&d!=='eq'))return 'Your choices in this row disagree with each other. Compare the type of solution you chose with the direction of net water movement.';return null;};}
const TONIC=[{v:'hyper',l:'hypertonic'},{v:'hypo',l:'hypotonic'},{v:'iso',l:'isotonic'}];
/* the two handout diagrams, drawn as small figures */
function osmFig(shrunk){const arr=(x1,y1,x2,y2)=>{const a=Math.atan2(y2-y1,x2-x1),hx=x2-Math.cos(a)*7,hy=y2-Math.sin(a)*7,px=Math.sin(a)*4.5,py=-Math.cos(a)*4.5;
    return `<path d="M${x1} ${y1}L${hx.toFixed(1)} ${hy.toFixed(1)}" stroke="#2f73c4" stroke-width="2.6" fill="none"/><path d="M${x2} ${y2}L${(hx+px).toFixed(1)} ${(hy+py).toFixed(1)}L${(hx-px).toFixed(1)} ${(hy-py).toFixed(1)}Z" fill="#2f73c4"/>`;};
  const dots=shrunk?[[8,10],[30,6],[64,8],[104,6],[140,10],[152,40],[154,74],[146,102],[110,104],[70,106],[34,104],[8,96],[6,62],[10,34],[34,30],[118,30],[36,82],[122,84],[46,58],[114,58]]:[[14,8],[150,100]];
  const proto=shrunk?'<rect x="52" y="38" width="56" height="34" rx="15" fill="#a3428a" stroke="#6d2259" stroke-width="1.5"/>':'<rect x="25" y="20" width="110" height="70" rx="4" fill="#b5569c" stroke="#6d2259" stroke-width="1.5"/>';
  const ar=shrunk?arr(80,36,80,6)+arr(80,74,80,106)+arr(50,55,8,55)+arr(110,55,152,55):arr(80,2,80,22)+arr(80,108,80,88)+arr(2,55,26,55)+arr(158,55,134,55);
  return `<svg viewBox="0 0 160 110" width="160" height="110" role="img" aria-label="Diagram ${shrunk?1:2}" style="display:block;margin:0 auto"><rect x="0" y="0" width="160" height="110" rx="8" fill="#f7f4ee"/><rect x="20" y="15" width="120" height="80" rx="6" fill="#f2e8ee" stroke="#6f5a3c" stroke-width="4"/>${proto}${dots.map(d=>`<circle cx="${d[0]}" cy="${d[1]}" r="3.2" fill="#7d838e"/>`).join('')}${ar}</svg>`;}
const OSM_FIGS='<span style="display:inline-flex;flex-wrap:wrap;gap:12px;margin:6px 0 4px;font-weight:600">'+[1,2].map(i=>`<span style="display:inline-block;text-align:center">${osmFig(i===1)}Diagram ${i}</span>`).join('')+'</span><br><span style="font-weight:400">Blue arrows: H₂O (net movement). Grey dots: NaCl. Purple: the cell membrane and its contents. Brown: the cell wall.</span>';
/* the procedure steps that the two labs share */
const ob=sim=>sim.vlab.bench;
const osmPrepHint=leaf=>sim=>{const b=ob(sim);return b.prep===0?(leaf?'Press <b>Place an Elodea leaf on the slide</b>.':'Press <b>Peel a thin piece of epidermis onto the slide</b>.'):b.prep===1?'Press <b>Add 1–2 drops of tap water</b>.':'Press <b>Lower the cover slip</b>.';};
const SCOPE=['obj','coarse','fine','light','replace'];
const osmFilled=k=>sim=>sim.vlab.raw(k).trim()!=='';
const osmClockHint=ph=>sim=>{const b=ob(sim),L=osmL(sim);if(!(b.hist[ph]||[]).length)return 'Draw the '+OSOL[ph]+' across first.';if(L&&L.hold)return 'Type your counts for '+mmss(L.holdAt)+', then press <b>Play</b>.';return 'Keep counting at each reading until the lab clock reaches 3:00. Press <b>Play</b> if the clock is paused.';};
const osmFocusHint=(obj,coarse)=>sim=>{const b=ob(sim);if(b.prep<3)return 'Finish the wet mount first.';if(sim.st.crashed)return 'Press <b>Replace cracked slide</b>, then focus again.';
  if(obj===4)return sim.p.obj!==4?'Switch to the 4× objective.':'Turn the <b>coarse focus</b> knob until the cells look sharp.';
  if(!b.f4)return 'Focus at 4× first.';if(sim.p.obj!==obj)return 'Switch to the '+obj+'× objective.';return coarse?'Turn the focus knobs until the cells look sharp.':'Turn only the <b>fine focus</b> knob until the cells look sharp.';};
const osmGo=sim=>osmResume(sim);
function osmCountStep(ph,el){const sq=el?'inside the counting square':'more than half inside the circle',pl=el?'green contents':'purple contents';
  return {title:'Count the cells in '+OSOL[ph],setup:osmGo,controls:SCOPE.concat(['pauseRead']),
    text:'<p><b>Virtual lab:</b> count the cells at 40× when the lab clock reads 0:00, 1:00, 2:00 and 3:00. With <b>Pause at each reading</b> on, the clock stops at each time.</p><p>At each reading, count the cells '+sq+', and how many of those are <b>plasmolyzed</b>: a cell is plasmolyzed when its '+pl+' have pulled away from the cell wall anywhere, even just at one end or a corner. Type both counts in the <b>Cell counts in '+OSOL[ph]+'</b> table, work out the percent plasmolyzed, then press <b>Play</b>.</p>',
    done:sim=>(ob(sim).hist[ph]||[]).length>180,doneHint:osmClockHint(ph)};}
function osmDrawStep(ph,title,text,el){return {title,text,setup:osmGo,controls:(ph==='salt'?['om-salt']:['om-dw']).concat(['om-towel','pauseRead'],SCOPE),
  done:sim=>(ob(sim).hist[ph]||[]).length>0&&!ob(sim).drop,doneHint:sim=>{const b=ob(sim);if(b.drop)return 'Press <b>Touch a paper towel to the opposite edge</b>.';if(el&&!b.mix)return 'Make the salt water first.';return 'Press <b>Add '+OSOL[ph]+' at one edge of the cover slip</b>.';}};}
const OSM_ABOUT='<p><b>About the virtual bench.</b> Each cell follows a water-potential model. Water moves into or out of the cell at a rate in proportion to the difference in water potential, ψ<sub>outside</sub> − ψ<sub>inside</sub>. Inside, ψ = ψ<sub>s</sub> + ψ<sub>p</sub>: the solutes in the vacuole lower it, and the push of the wall (turgor pressure) raises it. The salt water is 5% NaCl (0.5 g of salt in 10 mL of water), about 1,700 mOsm/L, so its water potential is about −4.2 MPa. The cell sap is near −1 to −1.3 MPa, and tap and distilled water are near 0 MPa. Under the cover slip, a new solution reaches some cells sooner than others and mixes in over a minute or two, and each cell holds a slightly different amount of solute, as in a real lab. The lab clock runs in real time at 1× speed. Use Speed to run it up to 4 times faster.</p><p><b>Simplified:</b> the cells are drawn as neat rectangles, a shrinking protoplast keeps a rounded shape, and the thin strands that sometimes tie the membrane to the wall are left out.</p>';
const LAB_ONION={id:'onion-osmosis',title:'Red Onion Osmosis Lab',course:'CP Biology',teachers:'Weed, Baldasare, Hill',
  source:{label:'Red Onion Osmosis Lab.docx',href:'https://rjhs.instructure.com/courses/14906/assignments/547970'},level:'bio',
  purpose:'<p>Explore how osmosis impacts plant cells. Practice using microscopes.</p>',
  background:'<p>Plant cells are surrounded by a cell membrane and a cell wall. When exposed to different solutions, the cell membrane may shrink or grow depending on the concentration of the water-based solution. Water will move in and out of the cell in a process called osmosis.</p><p>Red onion epidermis needs no stain: its purple color comes from a pigment, anthocyanin, dissolved in the large central vacuole of each cell.</p>'+OSM_ABOUT,
  materials:['Red onion epidermis','Tweezers','Pipette','Tap water','Distilled water','Salt water','Paper towels','Microscope','Slide and cover slip'],
  hypothesis:{prompt:'<p>Predict what will happen to the red onion cells when you draw salt water across them, and then distilled water. Explain why you think so.</p>'},
  setup:osmSetup,controls:SCOPE.concat(['pauseRead']),
  steps:[
    {title:'Get set up',setup:osmGo,controls:['pauseRead'],text:'<p>The bench has a microscope, a clean slide and cover slip, a red onion, tweezers, a pipette, tap water, salt water, distilled water and paper towels. The eyepiece view is on the left. Your slide, seen from above, and the lab clock are on the right.</p><p>Leave <b>Pause at each reading</b> on: the lab clock will stop at each counting time. At 1× speed the clock runs in real time.</p>'},
    {title:'Prepare your wet mount slide',setup:osmGo,controls:['om-peel','om-water','om-cover'],text:'<p>Prepare your wet mount slide: peel off a very thin piece of red onion epidermis (the purple part). Place it on a clean slide, add 1–2 drops of tap water, then carefully place a cover slip over the onion cells.</p>',
     done:sim=>ob(sim).prep>=3,doneHint:osmPrepHint(false)},
    {title:'Focus on low power',setup:osmGo,controls:SCOPE,text:'<p>Focus your microscope and examine your sample under low power (4X objective). Use the coarse focus knob.</p>',done:sim=>!!ob(sim).f4,doneHint:osmFocusHint(4,true)},
    {title:'Switch to medium power',setup:osmGo,controls:SCOPE,text:'<p>When you have a clear view of several cells, switch to medium power (10X or 40X) and focus. Use only the fine focus knob at 40X.</p><p><b>Virtual lab:</b> finish on the <b>40X</b> objective, because your cell counts use the 40X field of view.</p>',done:sim=>!!ob(sim).f40,doneHint:osmFocusHint(40,false)},
    {title:'Control onion cells',setup:osmGo,controls:SCOPE,text:'<p>Sketch (colored pencils) or photograph the cells in the “control onion cell” section of the data chart: the cells’ original appearance. Label the cell wall, cell membrane, and cytoplasm in a cell.</p><p><b>Virtual lab:</b> in the <b>Control</b> row of the data chart below the bench, describe what the cells look like in words, then label each part in words: where it is and what it looks like.</p>',
     done:osmFilled('c:chart:desc:0'),doneHint:'Describe the control cells in the Control row of the data chart below the bench.'},
    osmDrawStep('salt','Add the salt water','<p>Use a pipette to add several drops of saltwater to one side of the cover slip (NOT on top), then place a small piece of paper towel along the opposite edge. The paper towel soaks up the water and draws the salt solution across the sample.</p><p>The lab clock starts when the paper towel draws the salt water across. It stops at 0:00 for your first count.</p>'),
    osmCountStep('salt',false),
    {title:'Onion cells in salt water',setup:osmGo,controls:SCOPE,text:'<p>Observe the effects of the salt solution. After 2 minutes, sketch or photograph the cells in salt water. Label cell wall, cell membrane, cytoplasm.</p><p><b>Virtual lab:</b> describe the cells in the <b>Salt water</b> row of the data chart, and label each part in words.</p>',
     done:osmFilled('c:chart:desc:1'),doneHint:'Describe the cells in the Salt water row of the data chart.'},
    osmDrawStep('dw','Add the distilled water','<p>Repeat step 6 with distilled water: add several drops of distilled water to one side of the cover slip (NOT on top), then place a small piece of paper towel along the opposite edge to draw it across the sample.</p>'),
    osmCountStep('dw',false),
    {title:'Onion cells in distilled water',setup:osmGo,controls:SCOPE,text:'<p>Complete the data section for the cells in distilled water. Label cell wall, cell membrane, cytoplasm.</p><p><b>Virtual lab:</b> describe the cells in the <b>Distilled water</b> row of the data chart, and label each part in words.</p>',
     done:osmFilled('c:chart:desc:2'),doneHint:'Describe the cells in the Distilled water row of the data chart.'},
    {title:'Post-lab analysis',setup:osmGo,controls:SCOPE,text:'<p>Check your graph of percent plasmolyzed against time. Then complete the post-lab analysis: for each diagram in the post-lab table, choose the type of solution, the matching situation from the lab and the direction of the net movement of water. Answer the questions and write your conclusion.</p>'}],
  tables:[
    {id:'chart',title:'Data collection: the cells, described in words',cols:[{id:'cond',label:'Cells in',rows:['tap water','salt water','distilled water'],rowLabels:['Control onion cells (tap water)','Onion cells in salt water','Onion cells in distilled water']},
      {id:'desc',label:'What the cells look like',input:'text',check:osmDescCheck},{id:'wall',label:'Cell wall',input:'text'},{id:'mem',label:'Cell membrane',input:'text'},{id:'cyto',label:'Cytoplasm',input:'text'}]},
    countTable('salt','salt','Cell counts in salt water (40×)','purple contents'),
    countTable('dw','dw','Cell counts in distilled water (40×)','purple contents'),
    {id:'post',title:'Post-lab analysis: for each diagram, choose one answer in each column.<br>'+OSM_FIGS,cols:[{id:'d',label:'Diagram',rows:['1','2'],rowLabels:['Diagram 1','Diagram 2']},
      {id:'type',label:'Type of solution',input:'select',options:TONIC},
      {id:'sit',label:'Which situation in the lab matches the image?',input:'select',options:[{v:'salt',l:'onion cells in salt water'},{v:'dw',l:'onion cells in distilled water'}]},
      {id:'dir',label:'Direction of the net movement of water',input:'select',options:[{v:'in',l:'into the onion cells'},{v:'out',l:'out of the onion cells'},{v:'eq',l:'equally in both directions'}],check:osmAgree('post','type','dir')}]}],
  graph:{type:'line',title:'Percent of cells plasmolyzed over time',xl:'Time (min)',yl:'Cells plasmolyzed (%)',xmin:0,xmax:3,ymin:0,ymax:100,
    series:[{table:'salt',x:'t',y:'pct',label:'Salt water'},{table:'dw',x:'t',y:'pct',label:'Distilled water'}]},
  questions:[
    {id:'d1',n:'Data',q:'<p>Use your graph and counts. How long did it take for most of the cells in view to plasmolyze in salt water, and to recover in distilled water? Did every cell change at the same moment? Suggest a reason.</p>'},
    {id:'road',n:'Final',q:'<p>Plants store water (in the large central vacuole) to help with structural support. After snowstorms, salt can be put on the road to help melt the snow. When the snow melts, it dissolves the salt. Describe what might happen to a plant along the road after salt is placed on the road to melt snow after a winter storm.</p>'}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion: how does osmosis affect red onion cells in salt water and in distilled water? Use your descriptions and your cell counts as evidence.</p>',cer:true}};
const LAB_ELODEA={id:'elodea-osmosis',title:'Elodea Lab',course:'Biology',teachers:'Stearman',
  source:{label:'Elodea Lab',href:'https://rjhs.instructure.com/courses/16510/assignments/618549'},level:'bio',
  purpose:'<p>Observe living Elodea leaf cells under the microscope, then see how salt water changes them.</p>',
  background:'<p>Elodea is a water plant whose leaves are only two cells thick, so you can see living cells without cutting or staining them. Like all plant cells, each Elodea cell is surrounded by a cell membrane and a cell wall. Water moves into and out of cells by osmosis, depending on the concentration of the solution around them.</p>'+OSM_ABOUT,
  materials:['Elodea leaf','Microscope slide and cover slip','Pipette or dropper','Tap water','Salt','10 mL of water (for the salt water)','Paper towel','Microscope'],
  hypothesis:{prompt:'<p>Predict what will happen to the Elodea cells when you draw salt water across them. Explain why you think so.</p>'},
  setup:osmSetup,controls:SCOPE.concat(['pauseRead']),
  steps:[
    {title:'Get set up',setup:osmGo,controls:['pauseRead'],text:'<p>The bench has a microscope, a clean slide and cover slip, an Elodea sprig in tap water, a dropper, salt, 10 mL of water and a paper towel. The eyepiece view is on the left. Your slide, seen from above, and the lab clock are on the right.</p><p>Leave <b>Pause at each reading</b> on: the lab clock will stop at each counting time. At 1× speed the clock runs in real time.</p>'},
    {title:'Make a wet mount',setup:osmGo,controls:['om-leaf','om-water','om-cover'],text:'<p>Make a wet mount of an Elodea leaf in water: lay one leaf flat on a clean slide, add a drop of tap water and lower the cover slip.</p>',done:sim=>ob(sim).prep>=3,doneHint:osmPrepHint(true)},
    {title:'View at 4×',setup:osmGo,controls:SCOPE,text:'<p>View the leaf at 4×. Use the coarse focus knob.</p>',done:sim=>!!ob(sim).f4,doneHint:osmFocusHint(4,true)},
    {title:'View at 10×',setup:osmGo,controls:SCOPE,text:'<p>Switch to 10× and focus.</p>',done:sim=>!!(ob(sim).f10||ob(sim).f40),doneHint:osmFocusHint(10,true)},
    {title:'Sketch the cells',setup:osmGo,controls:SCOPE,text:'<p>Sketch the cells. You may switch to 40× to see them more closely.</p><p><b>Virtual lab:</b> in the <b>Before</b> row of the data chart below the bench, describe what the cells look like in words, and label the cell wall, the cell membrane and the green structures in words.</p>',
     done:osmFilled('c:chart:desc:0'),doneHint:'Describe the cells in the Before row of the data chart below the bench.'},
    {title:'Switch to 40×',setup:osmGo,controls:SCOPE,text:'<p><b>Virtual lab:</b> switch to 40× and focus with the fine focus knob only. Your cell counts use the counting square in the 40× eyepiece view.</p>',done:sim=>!!ob(sim).f40,doneHint:osmFocusHint(40,false)},
    {title:'Make salt water',setup:osmGo,controls:['om-mix'].concat(SCOPE),text:'<p>Make salt water: stir salt into 10 mL of water. On the virtual bench you use 0.5 g of salt, about a 5% solution.</p>',done:sim=>!!ob(sim).mix,doneHint:'Press <b>Stir 0.5 g of salt into 10 mL of water</b>.'},
    osmDrawStep('salt','Add the salt water','<p>Add one drop of salt water at the edge of the cover slip, then draw it across with a paper towel at the opposite edge.</p><p>The lab clock starts when the paper towel draws the salt water across. It stops at 0:00 for your first count.</p>',true),
    osmCountStep('salt',true),
    {title:'Sketch after',setup:osmGo,controls:SCOPE,text:'<p>Sketch the cells after the salt water.</p><p><b>Virtual lab:</b> describe the cells in the <b>After</b> row of the data chart, and label each part in words.</p>',done:osmFilled('c:chart:desc:1'),doneHint:'Describe the cells in the After row of the data chart.'},
    {title:'Answer the questions',setup:osmGo,controls:SCOPE,text:'<p>Check your graph of percent plasmolyzed against time. Answer questions 1 to 7: questions 4 to 6 are the choose-one table in the Data section. Then write your conclusion.</p>'}],
  tables:[
    {id:'chart',title:'Data: the cells, described in words',cols:[{id:'cond',label:'Cells in',rows:['tap water','salt water'],rowLabels:['Before: Elodea cells in tap water','After: Elodea cells in salt water']},
      {id:'desc',label:'What the cells look like',input:'text',check:osmDescCheck},{id:'wall',label:'Cell wall',input:'text'},{id:'mem',label:'Cell membrane',input:'text'},{id:'grn',label:'Green structures',input:'text'}]},
    countTable('salt','salt','Cell counts in salt water (40×, inside the counting square)','green contents'),
    {id:'q46',title:'Questions 4 to 6: choose one answer in each column',cols:[{id:'c',label:'Cell',rows:['salt'],rowLabels:['An Elodea cell in salt water']},
      {id:'tonic',label:'4. Is the salt water hypertonic, isotonic or hypotonic to the cell?',input:'select',options:[{v:'hyper',l:'hypertonic'},{v:'iso',l:'isotonic'},{v:'hypo',l:'hypotonic'}]},
      {id:'water',label:'5. Which way does water move?',input:'select',options:[{v:'in',l:'into the cell'},{v:'out',l:'out of the cell'},{v:'eq',l:'equally in both directions'}],check:osmAgree('q46','tonic','water')},
      {id:'state',label:'6. What state is the cell in?',input:'select',options:[{v:'turgid',l:'turgid'},{v:'flaccid',l:'flaccid'},{v:'plasmolyzed',l:'plasmolyzed'},{v:'lysed',l:'lysed'}]}]}],
  graph:{type:'line',title:'Percent of Elodea cells plasmolyzed in salt water',xl:'Time (min)',yl:'Cells plasmolyzed (%)',xmin:0,xmax:3,ymin:0,ymax:100,series:[{table:'salt',x:'t',y:'pct',label:'Salt water'}]},
  questions:[
    {id:'q1',n:'1',q:'<p>What are the green structures?</p>'},
    {id:'q2',n:'2',q:'<p>What are the 2 structures that surround each plant cell?</p>'},
    {id:'q3',n:'3',q:'<p>What happens to each of those with salt water?</p>',fields:[{id:'a',label:'The first structure'},{id:'b',label:'The second structure'}]},
    {id:'q7',n:'7',q:'<p>How does the leaf’s shape change?</p>'},
    {id:'d1',n:'Data',q:'<p>Use your graph and counts. How long did it take for most of the cells in the counting square to plasmolyze? Did every cell change at the same moment? Suggest a reason.</p>'}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion: what does salt water do to Elodea cells, and why? Use your descriptions and your cell counts as evidence.</p>',cer:true}};
const osmE=s=>osmL(s)?s.vlab.bench:null;
const OSM_ACTIONS=[
  {id:'om-peel',label:'Peel a thin piece of epidermis onto the slide',vlab:true,enabled:s=>{const b=osmE(s);return !!b&&b.prep===0;},run(s){const b=osmE(s);if(!b||b.prep!==0)return;b.prep=1;BioLab.play(s);}},
  {id:'om-leaf',label:'Place an Elodea leaf on the slide',vlab:true,enabled:s=>{const b=osmE(s);return !!b&&b.prep===0;},run(s){const b=osmE(s);if(!b||b.prep!==0)return;b.prep=1;BioLab.play(s);}},
  {id:'om-water',label:'Add 1–2 drops of tap water',vlab:true,enabled:s=>{const b=osmE(s);return !!b&&b.prep===1;},run(s){const b=osmE(s);if(!b||b.prep!==1)return;b.prep=2;BioLab.play(s);}},
  {id:'om-cover',label:'Lower the cover slip',vlab:true,enabled:s=>{const b=osmE(s);return !!b&&b.prep===2;},run(s){const b=osmE(s);if(!b||b.prep!==2)return;b.prep=3;b.seen=true;BioLab.play(s);}},
  {id:'om-mix',label:'Stir 0.5 g of salt into 10 mL of water',vlab:true,enabled:s=>{const b=osmE(s);return !!b&&!b.mix;},run(s){const b=osmE(s);if(!b)return;b.mix=true;}},
  {id:'om-salt',label:'Add salt water at one edge of the cover slip',vlab:true,enabled:s=>{const b=osmE(s);return !!b&&b.prep>=3&&b.ph==='tap'&&!b.drop&&(osmL(s).kind!=='elodea'||!!b.mix);},
   run(s){const b=osmE(s);if(!b||b.prep<3||b.ph!=='tap'||b.drop||(osmL(s).kind==='elodea'&&!b.mix))return;b.drop='salt';}},
  {id:'om-dw',label:'Add distilled water at one edge of the cover slip',vlab:true,enabled:s=>{const b=osmE(s);return !!b&&b.ph==='salt'&&!b.drop;},run(s){const b=osmE(s);if(!b||b.ph!=='salt'||b.drop)return;b.drop='dw';}},
  {id:'om-towel',label:'Touch a paper towel to the opposite edge',primary:true,vlab:true,enabled:s=>{const b=osmE(s);return !!b&&!!b.drop;},
   run(s){const L=osmL(s),b=osmE(s);if(!b||!b.drop)return;b.C0=L.T.map((A,a)=>osmCo(L,b,a));b.ph=b.drop;b.drop='';b.clk=0;b.hist[b.ph]=[];osmRecord(L,b);
     if(s.p.pauseRead){L.hold=true;L.holdAt=0;BioLab.pause(s);}else{L.hold=false;BioLab.play(s);}}}];

const MIC={
  id:'microscope',hash:'microscope',apUnit:2,order:2,kind:'Lab skills',tab:'Virtual microscope',
  card:'Focus, change objectives and measure real cells: onion, cheek, Elodea and blood.',
  title:'Virtual microscope',
  lede:{bio:'Practice using a compound light microscope: find the specimen on low power, focus, switch to high power, and measure how big cells really are.',
        honors:'Use the field of view to estimate cell size, see why the image is flipped, and learn why you use only fine focus at high power.',
        ap:'Magnification is not resolution. Compare objectives by numerical aperture and resolution limit, and use oil immersion at 100×.'},
  scale:{bio:'You are looking through the eyepiece. At 4× the circle is 4.5 mm across, about the size of a grain of rice. At 40× it is only 0.45 mm.',
         ap:'Field of view = field number (18 mm) ÷ objective magnification. Resolution limit d = 0.61λ/NA, with λ = 0.55 µm green light.'},
  timeless:true,animated:true,chChange:1.5,chReveal:4,
  controls:[
    {id:'slide',label:'Slide',type:'select',def:'onion',lvl:'bio',options:[{v:'onion',l:'Onion skin (iodine stain)'},{v:'cheek',l:'Cheek cells (methylene blue)'},{v:'elodea',l:'Elodea leaf (living)'},{v:'blood',l:'Human blood smear (Wright stain)'},{v:'e',l:'Letter “e” from a newspaper'}]},
    {id:'obj',label:'Objective lens',type:'seg',def:4,lvl:'bio',options:[{v:4,l:'4×'},{v:10,l:'10×'},{v:40,l:'40×'},{v:100,l:'100× oil',lvl:'ap'}]},
    {id:'coarse',label:'Coarse focus',type:'range',min:0,max:100,step:1,def:49,unit:'',lvl:'bio',noTrial:true,help:'Big knob: moves the stage 20 µm per click',
     onChange(sim){if(sim.p.obj>=40)sim.st.warnAt=sim.t;}},
    {id:'fine',label:'Fine focus',type:'range',min:-25,max:25,step:0.5,def:0,unit:' µm',lvl:'bio',noTrial:true,help:'Small knob: tiny adjustments'},
    {id:'light',label:'Light (diaphragm)',type:'range',min:0,max:100,step:1,def:70,unit:'%',lvl:'bio'},
    {id:'sx',label:'Move slide left / right',type:'range',min:-2000,max:2000,step:10,def:0,unit:' µm',lvl:'bio',noTrial:true},
    {id:'sy',label:'Move slide forward / back',type:'range',min:-2000,max:2000,step:10,def:0,unit:' µm',lvl:'bio',noTrial:true},
    {id:'oil',label:'Immersion oil',help:'A drop of oil between the 100× lens and the slide',type:'toggle',def:false,lvl:'ap'},
    // virtual lab bench only (hidden in the other views)
    {id:'pauseRead',label:'Pause at each reading',type:'toggle',def:true,vlab:true,noTrial:true,help:'The lab clock stops at 0:00, 1:00, 2:00 and 3:00 so you can count the cells.'}
  ],
  actions:[{id:'replace',label:'Replace cracked slide',lvl:'bio',run(sim){sim.st.crashed=false;BioLab.setValues(sim,{coarse:49,fine:0});sim.st.warnAt=-99;}}].concat(OSM_ACTIONS),
  labs:[LAB_ONION,LAB_ELODEA],
  /* what the bench shows right now (used by the virtual-lab tests) */
  benchRead(sim){const L=osmL(sim);if(!L)return null;const b=sim.vlab.bench,c=osmCount(L,b),o=optics(sim);
    return {prep:b.prep,ph:b.ph,drop:b.drop,clock:b.clk,hold:L.hold,holdAt:L.holdAt,tot:L.tot,count:c.mid,lo:c.lo,hi:c.hi,obj:sim.p.obj,blur:o.blur,f4:!!b.f4,f10:!!b.f10,f40:!!b.f40,mix:!!b.mix};},
  init(sim){const s={crashed:false,warnAt:-99,auto:null};if(sim&&sim.vlab&&(sim.vlab.lab.id==='onion-osmosis'||sim.vlab.lab.id==='elodea-osmosis'))s.L=osmInit(sim);return s;},
  step(sim,dt){const s=sim.st,o=optics(sim);
    if(sim.p.obj>=40&&o.zf>o.target+400)s.crashed=true;
    if(s.auto){const upd={};let busy=false;s.auto.forEach(a=>{const cur=sim.p[a.id];if(Math.abs(cur-a.to)<1e-6)return;busy=true;const st=Math.sign(a.to-cur)*Math.min(Math.abs(a.to-cur),a.rate*dt);upd[a.id]=Math.round((cur+st)*100)/100;});
      if(busy)BioLab.setValues(sim,upd);else s.auto=null;}
    if(s.L&&sim.vlab&&sim.t>=-1e-9){osmFlags(sim);osmStep(sim,dt);}},
  metrics:[
    {id:'mag',label:'Total magnification',unit:'×',lvl:'bio',min:0,max:1000,d:0,get:s=>10*s.p.obj},
    {id:'fov',label:'Field of view',unit:'µm across',lvl:'bio',min:0,max:4500,d:0,get:s=>(OBJ[s.p.obj]||OBJ[4]).fov},
    {id:'across',label:'Cells across the field',unit:'',lvl:'bio',min:0,max:null,d:1,get:s=>(OBJ[s.p.obj]||OBJ[4]).fov/SLIDES[s.p.slide].len},
    {id:'focus',label:'Focus',unit:'',lvl:'bio',text:true,get:s=>{if(s.st.crashed)return 'Cracked slide!';const b=optics(s).blur;return b<1.2?'Sharp':b<4?'Slightly blurry':'Blurry';}},
    {id:'bright',label:'Brightness',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>Math.min(100,optics(s).bright*100)},
    {id:'wd',label:'Working distance',unit:'mm',lvl:'honors',min:0,max:17,d:2,get:s=>(OBJ[s.p.obj]||OBJ[4]).wd},
    {id:'res',label:'Smallest detail you can resolve',unit:'µm',lvl:'ap',min:0,max:4,d:2,get:s=>{const o=OBJ[s.p.obj]||OBJ[4];const na=s.p.obj===100&&!s.p.oil?0.95:o.na;return 0.61*0.55/na;}}
  ],
  graphs:[],defaultGraph:'fov',
  challenges:[
    {lvl:'bio',q:'You switch from the 10× to the 40× objective. What happens to the field of view (the width of the circle you see)?',
     choices:['It gets 4 times wider','It gets 4 times narrower','It stays the same'],correct:1,
     baseline:{obj:10,coarse:50},change:{obj:40},changeText:'Switched to the 40× objective',
     explain:{bio:'Magnifying 4 times more means you see a smaller piece of the slide: the field drops from 1,800 µm to 450 µm across. Each cell looks bigger, but fewer fit in the circle. Always find your target on low power first.',
              honors:'Field of view is inversely proportional to magnification: FOV = 18 mm ÷ objective. 4× the magnification means ¼ the width and 1/16 the area.'}},
    {lvl:'bio',q:'You push the slide to the right. Which way does the image of the letter “e” move?',
     choices:['To the right','To the left','It does not move'],correct:1,
     baseline:{slide:'e',obj:4},change:{sx:600},changeText:'Slide pushed 600 µm to the right',
     explain:{bio:'The lenses flip the image upside down and backward. That is why the “e” looks like “ə” rotated, and why the image moves the opposite way from the slide. With practice you move the slide the “wrong” way without thinking.'}},
    {lvl:'bio',q:'Which slide has cells with both chloroplasts and a cell wall?',
     choices:['Cheek cells','Elodea leaf','Human blood'],correct:1,instant:true,
     explain:{bio:'Elodea is a plant, so its cells have cell walls (the outlines) and chloroplasts (the green dots). Cheek and blood cells are animal cells: no walls, no chloroplasts. Onion skin cells have walls but no chloroplasts, because they grow underground.'}},
    {lvl:'honors',q:'At 10× the field of view is 1,800 µm. About 7 onion cells fit end to end across it. About how long is one onion cell?',
     choices:['About 26 µm','About 260 µm','About 2,600 µm'],correct:1,instant:true,
     explain:{honors:'Cell length ≈ field of view ÷ number of cells across = 1,800 µm ÷ 7 ≈ 260 µm, about a quarter of a millimeter. Check it: switch to Onion skin at 10× and compare with the readouts.'}},
    {lvl:'honors',q:'You are focused at 10× and switch to 40×. The image is slightly blurry. Which knob should you turn?',
     choices:['The coarse focus knob','The fine focus knob'],correct:1,
     baseline:{obj:10,coarse:50},change:{obj:40},changeText:'Switched to 40×. Try the fine focus knob',
     explain:{honors:'The objectives are parfocal: switching keeps the image nearly in focus. At 40× the depth of focus is only about 1.5 µm, but one click of the coarse knob moves the stage 20 µm. Only the fine knob can make that small an adjustment.'}},
    {lvl:'honors',q:'At 40× you crank the coarse focus knob from 50 up to 75. What happens?',
     choices:['The image gets sharper','The stage rises into the objective and cracks the slide'],correct:1,
     baseline:{obj:40,coarse:50,fine:10},change:{coarse:75},changeText:'Coarse focus turned up to 75',
     explain:{honors:'The 40× objective sits only 0.6 mm above the slide (its working distance). The coarse knob raises the stage 0.5 mm here, so the slide hits the lens. This is how real slides and lenses get broken.'}},
    {lvl:'ap',q:'At 100× the blood cells look dim and fuzzy even when focused. You add a drop of immersion oil. What happens?',
     choices:['The image gets sharper and brighter','Nothing; the oil only protects the lens','The image gets darker'],correct:0,
     baseline:{slide:'blood',obj:100,coarse:50,fine:15,oil:false,light:95},change:{oil:true},changeText:'Immersion oil added',
     explain:{ap:'Light bends as it leaves the glass slide into air, so the widest-angle rays miss the lens. Oil has the same refractive index as glass (about 1.52), so those rays get in. The numerical aperture rises to 1.25, giving a brighter image and a resolution limit near 0.27 µm.'}},
    {lvl:'ap',q:'The 100× oil lens magnifies 2.5 times more than the 40×. Why do you also see real new detail, rather than just a bigger blur?',
     choices:['Its higher numerical aperture improves resolution','More magnification always reveals more detail','The light is brighter at 100×'],correct:0,instant:true,
     explain:{ap:'Resolution depends on numerical aperture, not magnification: d = 0.61λ/NA. The 40× (NA 0.65) resolves about 0.52 µm; the 100× oil (NA 1.25) about 0.27 µm. Magnifying past what the optics can resolve is “empty magnification”: bigger, but no new detail.'}}
  ],
  narrate(sim){if(osmL(sim))return osmNarrate(sim);const p=sim.p,s=sim.st,o=optics(sim),sl=SLIDES[p.slide],mag=10*p.obj;
    if(s.crashed)return '<b>Cracked slide!</b> At '+p.obj+'× the objective sits only '+o.o.wd+' mm above the slide, and the coarse knob raised the stage into it. Press “Replace cracked slide”, and use only fine focus at high power.';
    if(p.obj>=40&&sim.t-s.warnAt<4)return '<b>Careful:</b> at '+p.obj+'× use only the fine focus knob. One click of coarse focus moves the stage 20 µm, more than 10 times the depth of focus.';
    if(o.noOil)return '<b>No immersion oil.</b> At 100× light bends away as it leaves the glass into air, so the image is dim and fuzzy. Add a drop of immersion oil.';
    if(o.blur>4)return '<b>Out of focus.</b> '+(p.obj<=10?'Turn the coarse focus knob slowly until the image sharpens.':'Turn only the fine focus knob to sharpen the image.');
    if(o.bright<0.3)return '<b>Too dark.</b> Turn up the light or open the diaphragm. Higher-power objectives always need more light.';
    if(p.slide==='e')return 'The letter looks <b>upside down and backward</b>: the lenses flip the image. Move the slide and the image moves the opposite way.';
    const n=o.fov/sl.len;
    if(p.slide==='elodea'&&p.obj>=40)return 'Watch the green chloroplasts circle around each cell. This <b>cytoplasmic streaming</b> only happens in living cells. Each cell is about '+sl.len+' µm long.';
    if(p.slide==='blood'&&p.obj<40)return 'At '+mag+'× the red blood cells are too small to see one by one (each is only 7.5 µm). Switch to 40× to see them. The purple dots are white blood cells.';
    return 'You are looking at '+sl.name+' at <b>'+mag+'× total</b>. The field is '+fmtInt(o.fov)+' µm across, about '+(n<10?n.toFixed(1):Math.round(n))+' cells wide, so each '+sl.unit+' is about '+sl.len+' µm long.';},
  tour:[
    {title:'Parts of the microscope',text:'Light from the bulb shines up through the slide. The objective lens just above the slide magnifies the image, and the eyepiece magnifies it again, 10×.',focus:[478,0,322,450],pause:true},
    {title:'Start on low power',text:'Always begin with the 4× objective, because its wide field makes the specimen easy to find. Watch the coarse knob bring the cells into focus.',focus:[[50,20,410,410],[730,270,60,60]],speed:1,setup(sim){BioLab.setValues(sim,{obj:4,coarse:42,fine:0});sim.st.auto=[{id:'coarse',to:50,rate:3}];}},
    {title:'Center your target',text:'Move the slide to put the area you want in the middle. The image moves the opposite way, because the lenses flip it upside down and backward.',focus:[50,20,410,410],speed:1,setup(sim){BioLab.setValues(sim,{coarse:50});sim.st.auto=[{id:'sx',to:-400,rate:200}];}},
    {title:'Switch to high power',text:'Turn the nosepiece to 40×. The image stays almost in focus (the objectives are parfocal), but you now see a circle only 450 µm across, magnified 400×.',focus:[[50,20,410,410],[620,140,100,115]],speed:1,setup(sim){sim.st.auto=null;BioLab.setValues(sim,{sx:-400,obj:40});}},
    {title:'Fine focus only',text:'At high power, use only the small fine focus knob. One click of the coarse knob moves the stage more than 10 times the depth of focus and could crack the slide.',focus:[[50,20,410,410],[738,328,44,44]],speed:1,setup(sim){sim.st.auto=[{id:'fine',to:10,rate:3}];}},
    {title:'Add light',text:'A higher-power lens collects light from a smaller area, so the image gets darker. Open the diaphragm to brighten it.',focus:[[50,20,410,410],[640,370,60,40]],speed:1,setup(sim){BioLab.setValues(sim,{fine:10,light:30});sim.st.auto=[{id:'light',to:90,rate:20}];}},
    {lvl:'honors',title:'Look for signs of life',text:'This is a living Elodea leaf at 400×. The green chloroplasts circle around the edge of each cell. This cytoplasmic streaming only happens in living cells.',focus:[50,20,410,410],speed:1,setup(sim){sim.st.auto=null;BioLab.setValues(sim,{slide:'elodea',obj:40,coarse:50,fine:10,light:85,sx:0});}},
    {lvl:'ap',title:'Oil immersion',text:'At 100×, a drop of immersion oil fills the gap between lens and slide, so wide-angle light is not lost. With a numerical aperture of 1.25 you can resolve details about 0.27 µm apart, like the lobed nuclei of white blood cells.',focus:[50,20,410,410],speed:1,setup(sim){sim.st.auto=null;BioLab.setValues(sim,{slide:'blood',obj:100,oil:true,coarse:50,fine:15,light:95,sx:-370,sy:-150});}}
  ],
  onTourExit(sim){sim.st.auto=null;},
  lab:{bio:'<p><b>Question:</b> Which cells are biggest: onion, cheek, Elodea or blood?</p><ol><li>For each slide: start at 4×, focus with coarse focus, then switch to 40× and focus with fine focus only.</li><li>Record a trial. It saves the field of view and how many cells fit across it.</li><li>Calculate cell length = field of view ÷ cells across.</li></ol><p>Rank the four cell types by size, and give one reason the biggest cells might be so big.</p>',
       honors:'<p><b>Question:</b> How does magnification affect the field of view?</p><ol><li>On any slide, record a trial at each objective (4×, 10×, 40×).</li><li>On the Trials graph, plot total magnification (x) against field of view (y).</li><li>Predict the field of view at 1,000×, then check it with the AP level.</li></ol><p>Describe the relationship in words and as an equation.</p>',
       ap:'<p><b>Question:</b> Is more magnification always better?</p><ol><li>Record a trial at every objective, including 100× with and without immersion oil.</li><li>Plot total magnification (x) against smallest resolvable detail (y).</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why resolution, not magnification, limits what you can see, and why 1000× is about the useful limit of a light microscope.</p>'},
  terms:[{t:'Eyepiece (ocular)',d:'The lens you look through. It magnifies 10×.'},{t:'Objective',d:'The lens just above the slide: 4×, 10× or 40× (100× with oil).'},{t:'Total magnification',d:'Eyepiece × objective, e.g. 10 × 40 = 400×.'},{t:'Field of view',d:'The width of the circle you see. It shrinks as magnification grows.'},{t:'Coarse / fine focus',d:'Knobs that move the stage a lot or a little.'},
    {lvl:'honors',t:'Parfocal',d:'Objectives stay nearly in focus when you switch between them.'},{lvl:'honors',t:'Working distance',d:'The gap between the objective and the slide. Only 0.6 mm at 40×.'},{lvl:'honors',t:'Diaphragm',d:'Controls how much light reaches the slide.'},
    {lvl:'ap',t:'Resolution',d:'The smallest distance between two points that you can still see as separate.'},{lvl:'ap',t:'Numerical aperture (NA)',d:'How wide a cone of light the objective collects. Higher NA gives better resolution.'},{lvl:'ap',t:'Immersion oil',d:'Oil matched to glass, so the 100× lens collects more light.'}],
  about:'<p>Field of view = 18 mm ÷ objective (field number 18 with a 10× eyepiece). Specimens are drawn at real size: onion cells about 250 × 60 µm, cheek cells about 60 µm, Elodea cells about 75 × 28 µm with 5 µm chloroplasts streaming at 6 µm/s, and red blood cells 7.5 µm. The image is drawn rotated 180°, as a compound microscope shows it.</p><p>Focus: the coarse knob moves the stage 20 µm per click, and fine focus moves it up to ±25 µm. Objectives are parfocal, within 4–15 µm of each other. Depth of field is about 50, 8, 1.5 and 0.6 µm, and blur grows with distance from the focal plane. The slide cracks if the stage rises more than 0.4 mm past focus at 40× or 100×.</p><p>Resolution = 0.61 × 0.55 µm ÷ NA, with NA 0.10, 0.25, 0.65 and 1.25 (0.95 at 100× without oil). Brightness falls with magnification. Simplification: real slides vary much more, and phase effects and staining artifacts are ignored.</p><p><b>The virtual lab benches (osmosis).</b> Each living cell follows a water-potential model: water flows at a rate in proportion to ψ<sub>outside</sub> − ψ<sub>inside</sub>, with ψ<sub>s</sub> = −iCRT and turgor pressure from the wall (elastic modulus 12–15 MPa). The solutes stay inside while the water volume changes, so the protoplast shrinks away from the wall in 5% NaCl and refills it in distilled water. The wall does not move. A new solution reaches each cell after a delay of a few seconds to about 2 minutes and mixes in gradually, and cells differ a little in solute content and water permeability, so they change at different times and by different amounts.</p>',
  onClick(sim,x,y){if(osmL(sim))return;if(x>615&&x<725&&y>140&&y<260){const list=[4,10,40].concat(atLeast('ap')?[100]:[]);const i=list.indexOf(sim.p.obj);BioLab.setValues(sim,{obj:list[(i+1)%list.length]});}},
  initVis(sim){sim.vis.oc=null;},
  draw(sim,ctx,vdt,k,t){
    const p=sim.p,s=sim.st,v=sim.vis,o=optics(sim),S=o.S,hon=atLeast('honors'),OL=osmL(sim),blur=o.blur+(OL?osmExtraBlur(sim):0);
    ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,450);
    // ---- eyepiece view
    ctx.fillStyle='#0d0d10';ctx.beginPath();ctx.arc(VX,VY,VR+12,0,6.29);ctx.fill();
    const sc=ctx.getTransform().a||1,N=Math.max(50,Math.ceil(400*sc));
    if(!v.oc)v.oc=document.createElement('canvas');if(v.oc.width!==N){v.oc.width=N;v.oc.height=N;}
    const oc=v.oc.getContext('2d');oc.setTransform(1,0,0,1,0,0);oc.clearRect(0,0,N,N);oc.setTransform(N/400,0,0,N/400,0,0);
    oc.save();oc.translate(200,200);oc.scale(-S,-S);oc.translate(p.sx,p.sy);const lw=1/S,hw=200/S;
    if(OL){osmStream(sim,vdt);(OL.kind==='elodea'?drawElodeaLab:drawOnionLab)(oc,-p.sx-hw,-p.sx+hw,-p.sy-hw,-p.sy+hw,S,t,lw,sim);}
    else DRAW[p.slide](oc,-p.sx-hw,-p.sx+hw,-p.sy-hw,-p.sy+hw,S,t,lw);oc.restore();
    ctx.save();ctx.beginPath();ctx.arc(VX,VY,VR,0,6.29);ctx.clip();
    const canFilter='filter' in ctx;if(canFilter&&blur>0.3)ctx.filter='blur('+(blur*sc).toFixed(2)+'px)';
    ctx.drawImage(v.oc,VX-200,VY-200,400,400);ctx.filter='none';
    if(!canFilter&&blur>0.3){ctx.fillStyle='rgba(235,235,235,'+clamp(blur/16,0,.8)+')';ctx.fillRect(VX-200,VY-200,400,400);}
    const b=o.bright;if(b<1){ctx.fillStyle='rgba(0,0,0,'+clamp(1-b*1.6,0,0.93)+')';ctx.fillRect(VX-200,VY-200,400,400);}
    if(b>0.9){ctx.fillStyle='rgba(255,255,255,'+clamp((b-0.9)*1.5,0,.3)+')';ctx.fillRect(VX-200,VY-200,400,400);}
    const g=ctx.createRadialGradient(VX,VY,VR*0.72,VX,VY,VR);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,0.45)');ctx.fillStyle=g;ctx.fillRect(VX-200,VY-200,400,400);
    if(s.crashed){ctx.strokeStyle='rgba(255,255,255,0.9)';ctx.lineWidth=2.5;const cx=VX+30,cy=VY-20;ctx.beginPath();
      for(let i=0;i<7;i++){let x=cx,y=cy,a=i/7*6.283+0.3;ctx.moveTo(x,y);for(let m=0;m<6;m++){a+=Math.sin(i*3.1+m*1.7)*0.5;x+=Math.cos(a)*34;y+=Math.sin(a)*34;ctx.lineTo(x,y);}}ctx.stroke();}
    // scale bar
    let L=niceStep(o.fov/4,1);if(L*S>160)L/=2;const bpx=L*S;ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.fillRect(VX-bpx/2,VY+150,bpx,5);ctx.strokeRect(VX-bpx/2,VY+150,bpx,5);
    if(OL&&OL.kind==='elodea'){const q=OSQ*400/OBJ[40].fov;ctx.strokeStyle='rgba(255,255,255,0.75)';ctx.lineWidth=4.5;ctx.strokeRect(VX-q/2,VY-q/2,q,q);ctx.strokeStyle='rgba(12,12,14,0.95)';ctx.lineWidth=2;ctx.strokeRect(VX-q/2,VY-q/2,q,q);}   // eyepiece counting square
    ctx.restore();
    txt(ctx,(L>=1000?(L/1000)+' mm':L+' µm'),VX,VY+172,{s:12*k,w:700,c:'#fff',a:'center'});
    if(s.crashed)pill(ctx,'Cracked slide!',VX,VY-150,'#c62828','#fff',14*k);
    txt(ctx,p.obj+'× objective',12,24,{s:14*k,w:700});txt(ctx,(10*p.obj)+'× total',12,44,{s:13*k,c:PAL['cv-soft']});
    txt(ctx,'Field of view',12,416,{s:12*k,c:PAL['cv-soft']});txt(ctx,fmtInt(o.fov)+' µm',12,438,{s:14*k,w:700});
    if(OL){osmPanel(sim,ctx,k);return;}
    // ---- microscope diagram
    const C=670,metal='#5a616d',dark='#30353d';
    const yst=clamp(262-(o.zf-1000)*0.06,205,332),ol=o.o.len;
    ctx.fillStyle=metal;rr(ctx,575,404,205,24,6);ctx.fill();
    ctx.strokeStyle=metal;ctx.lineWidth=22;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(762,404);ctx.lineTo(762,150);ctx.quadraticCurveTo(762,88,705,72);ctx.stroke();ctx.lineCap='butt';
    ctx.fillStyle=metal;rr(ctx,635,52,85,40,10);ctx.fill();ctx.fillStyle=dark;rr(ctx,655,10,30,46,6);ctx.fill();ctx.fillStyle='#8fb7c9';ctx.beginPath();ctx.ellipse(670,11,13,3.5,0,0,6.29);ctx.fill();
    ctx.fillStyle=metal;ctx.fillRect(658,90,24,60);ctx.fillStyle=dark;ctx.beginPath();ctx.ellipse(C,156,44,13,0,0,6.29);ctx.fill();
    const objs=[4,10,40].concat(atLeast('ap')?[100]:[]),others=objs.filter(x=>x!==p.obj);
    others.forEach((ob,i)=>{const a=(i%2?1:-1)*(0.55+Math.floor(i/2)*0.35);ctx.save();ctx.translate(C,162);ctx.rotate(a);ctx.globalAlpha=.55;ctx.fillStyle='#9aa1ad';rr(ctx,-8,0,16,OBJ[ob].len-8,4);ctx.fill();ctx.fillStyle=OBJ[ob].band;ctx.fillRect(-8,OBJ[ob].len-20,16,4);ctx.restore();});
    ctx.globalAlpha=1;ctx.fillStyle='#b9bfc9';rr(ctx,C-10,164,20,ol,4);ctx.fill();ctx.fillStyle=o.o.band;ctx.fillRect(C-10,164+ol-14,20,5);ctx.strokeStyle=dark;ctx.lineWidth=1.2;rr(ctx,C-10,164,20,ol,4);ctx.stroke();
    if(p.oil&&p.obj===100){ctx.fillStyle='rgba(230,200,90,0.8)';ctx.beginPath();ctx.ellipse(C,164+ol+2,8,4,0,0,6.29);ctx.fill();}
    const bl=p.light/100;ctx.fillStyle='rgba(255,220,110,'+(0.08+bl*0.35)+')';ctx.fillRect(C-6,yst+12,12,392-(yst+12));
    ctx.fillStyle=dark;ctx.fillRect(C-14,yst+12,28,10);
    ctx.fillStyle='rgba(255,214,90,'+(0.3+bl*0.7)+')';ctx.beginPath();ctx.arc(C,392,10,0,6.29);ctx.fill();ctx.strokeStyle=dark;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=dark;rr(ctx,600,yst,150,12,3);ctx.fill();ctx.fillRect(744,yst-6,18,26);
    ctx.fillStyle=s.crashed?'#e8a0a0':'#cfe6ee';ctx.fillRect(630+clamp(-p.sx/100,-20,20),yst-4,80,4);
    if(s.crashed){ctx.strokeStyle='#c62828';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(655,yst-8);ctx.lineTo(685,yst+2);ctx.moveTo(685,yst-8);ctx.lineTo(655,yst+2);ctx.stroke();}
    const knob=(x,y,r,rot)=>{ctx.fillStyle=dark;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();ctx.strokeStyle='#9aa1ad';ctx.lineWidth=2;for(let i=0;i<8;i++){const a=rot+i*Math.PI/4;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*.45,y+Math.sin(a)*r*.45);ctx.lineTo(x+Math.cos(a)*r*.9,y+Math.sin(a)*r*.9);ctx.stroke();}};
    knob(762,300,21,p.coarse*0.25);knob(762,350,12,p.fine*0.4);
    // labels with leader lines
    const lab=(s_,x,y,tx,ty)=>{ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+ctx.measureText(s_).width+6,y-4);ctx.lineTo(tx,ty);ctx.stroke();};
    ctx.font='600 '+12*k+'px '+FONT;
    [['Eyepiece (10×)',486,34,654,32],['Objective',486,212,C-11,200],['Stage',486,yst+10,599,yst+6],['Light',486,396,C-11,392]].forEach(q=>{txt(ctx,q[0],q[1],q[2],{s:12*k,w:600,c:PAL['cv-soft']});ctx.font='600 '+12*k+'px '+FONT;lab(q[0],q[1],q[2],q[3],q[4]);});
    txt(ctx,'Coarse',736,286,{s:11.5*k,w:600,c:PAL['cv-soft'],a:'right'});txt(ctx,'Fine',746,354,{s:11.5*k,w:600,c:PAL['cv-soft'],a:'right'});
  }
};
BioLab.register(MIC);
})();
