/* Story: "What is a tree made of?"  Photosynthesis, told as one story: light lifts electrons out of water, the lift
   charges two batteries (ATP and NADPH), and Rubisco spends them to build sugar out of air. The mirror of respiration.js.
   Real shapes (Protein Data Bank): photosystem II 3JCU, cytochrome b6f 6RQF, photosystem I 5L8R, chloroplast ATP synthase 6FKF,
   Rubisco 1RCX. Counts that are literally true on screen: 2 electrons and 2 H⁺ per water, 1 O₂ per 2 waters, 4 H⁺ moved by
   the pump per pair, 1 NADPH per pair, 14 H⁺ and 3 ATP per turn of the ring, 3 ATP + 2 NADPH per CO₂, 3 CO₂ per 3-carbon sugar. */
(function(){
'use strict';
const {clamp,lerp,ease,rr,txt,pill,ring,arrow,hash}=Story.h,M=Story.mol;
const W=1200,H=600,TOPH=310,M0=142,M1=178,MY=160,SA=.8;
const C={stroma:'#eef6e3',lumen:'#e1eff8',head:'#dca23a',tail:'#eadbb2',ink:'#26262b',soft:'#62626a',h:'#d81b6a',e:'#f7c20a',es:'#6b4e00',o:'#2f7fd0',
  light:'#f0b400',c:'#3b3b42',good:'#1b7339',rj:'#C11430',atp:'#b8424f',nad:'#6b4fc0',leaf:'#4f9a45',syn:'#8a1f33'};
const X={P2:200,B:470,P1:690,S:985};
const at=(mol,cx,i)=>{const q=M.pts(mol)[i];return [cx+q[1]*SA,MY+q[2]*SA];};
const P={oex:at('PS2',X.P2,0),p680:at('PS2',X.P2,1),pheo:at('PS2',X.P2,2),q:at('PS2',X.P2,3),qo:at('B6F',X.B,0),fes:at('B6F',X.B,1),hf:at('B6F',X.B,2),
  p700:at('PS1',X.P1,0),a1:at('PS1',X.P1,1),fx:at('PS1',X.P1,2),fa:at('PS1',X.P1,3),fb:at('PS1',X.P1,4),fnr:[806,104]};
const ST=['oex','ps2','pq','b6f','pc','p700','ps1','fd','fnr'],DUR={ps2:.8,pq:1.4,b6f:.9,pc:1.2,ps1:.8,fd:.9,fnr:.5};
const PATH={ps2:[P.oex,P.p680,P.pheo,P.q],pq:[P.q,[300,157],[400,163],P.qo],b6f:[P.qo,P.fes,P.hf],pc:[P.hf,[565,208],[640,202],[P.p700[0],P.p700[1]+16]],
  ps1:[P.p700,P.a1,P.fx,P.fa,P.fb],fd:[P.fb,[735,108],P.fnr],fnr:[P.fnr,P.fnr]};
const ATPMAX=9,NADMAX=6,LMAX=60,RING=14;
const POOL={x:486,ya:62,yn:92};

/* ---------------- the model: every dot is one event ---------------- */
function newSim(){return {t:0,pairs:[],fly:[],lum:[],bub:[],tok:[],light:0,co2:0,open:true,showH:true,cap:false,calvin:false,atp:0,nadph:0,tray:0,
  rotor:0,rotT:0,acc:0,through:0,cacc:0,seed:1,stall:false,n:{water:0,o2:0,nadph:0,atp:0,h:0,co2:0,sugar:0},ev:{o2:[]}};}
function addLum(sim,n,from){sim.n.h+=n;if(!sim.showH)return;for(let k=0;k<n;k++){const s=sim.seed++;sim.lum.push({bx:30+hash(s)*1140,by:200+hash(s+.5)*92,ph:hash(s+.2)*6.3,p:from?0:1,fx:from?from[0]+(k-(n-1)/2)*9:0,fy:from?from[1]+8:0});}}
const busy=(sim,st)=>sim.pairs.some(p=>p.st===st);
function rateO2(sim,win){win=win||10;const a=sim.ev.o2;while(a.length&&a[0]<sim.t-win)a.shift();return a.length;}
function step(sim,dt){sim.t+=dt;
  if(!busy(sim,'oex'))sim.pairs.push({st:'oex',p:0});
  for(const pr of sim.pairs){
    if(pr.st==='oex'||pr.st==='p700'){const nx=pr.st==='oex'?'ps2':'ps1';      // waiting for light: one photon per electron
      if(!busy(sim,nx)&&Math.random()<sim.light*2.4*dt){if(nx==='ps2'){sim.n.water++;addLum(sim,2,P.oex);if(sim.n.water%2===0){sim.n.o2++;sim.ev.o2.push(sim.t);sim.bub.push({p:0});}}pr.st=nx;pr.p=0;}
      continue;}
    if(pr.st==='b6f'&&!pr.h&&pr.p>.45){if(sim.showH&&sim.lum.length>LMAX-4){pr.p=.45;continue;}pr.h=1;addLum(sim,4,P.fes);}   // a full lumen pushes back on the pump
    pr.p+=dt/DUR[pr.st];
    if(pr.p>=1){
      if(pr.st==='fnr'){if(!sim.cap||sim.nadph<NADMAX){pr.dead=1;sim.nadph++;sim.n.nadph++;sim.fly.push({k:'nadph',p:0});}else pr.p=1;continue;}
      const nx=ST[ST.indexOf(pr.st)+1];if(!busy(sim,nx)){pr.st=nx;pr.p=0;pr.h=0;}else pr.p=1;}
  }
  sim.pairs=sim.pairs.filter(p=>!p.dead);
  for(const d of sim.lum)if(d.p<1)d.p=Math.min(1,d.p+dt/.7);
  // ATP synthase: 14 H⁺ turn the ring once, and each turn makes 3 ATP
  if(sim.open&&sim.lum.length&&(!sim.cap||sim.atp<ATPMAX)){sim.acc+=(1.4+5.5*sim.lum.length/LMAX)*dt;
    while(sim.acc>=1&&sim.lum.length){sim.acc-=1;let bi=0,bd=1e9;sim.lum.forEach((d,i)=>{const q=Math.abs(d.bx-X.S-24)+(d.p<1?999:0);if(q<bd){bd=q;bi=i;}});const d=sim.lum.splice(bi,1)[0];
      sim.fly.push({k:'hup',p:0,x:d.bx,y:d.by});const a0=Math.floor(sim.through*3/RING);sim.through++;sim.rotT+=2*Math.PI/RING;if(Math.floor(sim.through*3/RING)>a0){sim.atp++;sim.n.atp++;sim.fly.push({k:'atp',p:0});}}}
  else sim.acc=Math.min(sim.acc,.9);
  sim.rotor+=(sim.rotT-sim.rotor)*Math.min(1,dt*7);
  // the Calvin cycle: each CO₂ costs 3 ATP and 2 NADPH
  if(sim.calvin){const ready=sim.atp>=3&&sim.nadph>=2;if(sim.co2>0)sim.cacc=Math.min(1,sim.cacc+sim.co2*1.1*dt);sim.stall=sim.cacc>=1&&!ready;
    if(sim.cacc>=1&&ready&&sim.tok.length<3){sim.cacc=0;sim.atp-=3;sim.nadph-=2;sim.n.co2++;sim.tok.push({p:0});sim.spendT=sim.t;}}
  for(const k of sim.tok){k.p+=dt/2.6;if(k.p>=1&&!k.done){k.done=1;sim.tray++;if(sim.tray>=3){sim.tray=0;sim.n.sugar++;sim.fly.push({k:'sugar',p:0});}}}
  sim.tok=sim.tok.filter(k=>!k.done);
  for(const f of sim.fly)f.p+=dt/(f.k==='hup'?.8:f.k==='sugar'?1.2:1.1);sim.fly=sim.fly.filter(f=>f.p<1);
  for(const b of sim.bub)b.p+=dt/2.2;sim.bub=sim.bub.filter(b=>b.p<1);}

/* ---------------- drawing helpers ---------------- */
function dot(ctx,x,y,r,fill,stroke,lw){ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=lw||1.2;ctx.strokeStyle=stroke;ctx.stroke();}}
function shade(hex,k){const n=parseInt(hex.slice(1),16);const f=v=>Math.round(k>0?v+(255-v)*k:v*(1+k));return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')';}
function hplus(ctx,x,y,a){ctx.globalAlpha=a==null?1:a;dot(ctx,x,y,4.6,C.h,'#fff',1.3);ctx.globalAlpha=1;}
function epair(ctx,x,y){dot(ctx,x-5.5,y,5.2,C.e,C.es,1.4);dot(ctx,x+5.5,y,5.2,C.e,C.es,1.4);}
function poly(pts,p){p=clamp(p,0,1);let L=0;const seg=[];for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);L+=d;}if(L===0)return pts[0];
  let s=p*L;for(let i=0;i<seg.length;i++){if(s<=seg[i]||i===seg.length-1){const k=seg[i]?s/seg[i]:0;return [lerp(pts[i][0],pts[i+1][0],k),lerp(pts[i][1],pts[i+1][1],k)];}s-=seg[i];}return pts[pts.length-1];}
function pairXY(pr){if(pr.st==='oex')return P.oex;if(pr.st==='p700')return [P.p700[0],P.p700[1]+4];return poly(PATH[pr.st],ease(pr.p));}
function tag(ctx,s,x,y){pill(ctx,s,x,y,{bg:C.ink,c:'#fff',bd:null,s:13.5,w:700,a:'right',r:5});}
function chip(ctx,s,x,y,o){o=o||{};return pill(ctx,s,x,y,Object.assign({bg:'#fff',c:C.ink,bd:C.ink,s:17,w:700,a:'left',r:8,lw:2},o));}
function co2mol(ctx,x,y,s){s=s||1;dot(ctx,x-9*s,y,5.5*s,'#d9534f','#7d1f1c',1);dot(ctx,x+9*s,y,5.5*s,'#d9534f','#7d1f1c',1);dot(ctx,x,y,6.2*s,C.c,'#000',1);}
function water(ctx,x,y){dot(ctx,x-7,y-6,4.2,'#fff','#7a8794',1.2);dot(ctx,x+7,y-6,4.2,'#fff','#7a8794',1.2);dot(ctx,x,y,7.5,C.o,shade(C.o,-.4),1.3);}
function o2mol(ctx,x,y,a){ctx.globalAlpha=a==null?1:a;dot(ctx,x-6.5,y,7.5,C.o,shade(C.o,-.4),1.3);dot(ctx,x+6.5,y,7.5,C.o,shade(C.o,-.4),1.3);ctx.globalAlpha=1;}

/* ---------------- top picture: the thylakoid membrane and its machines ---------------- */
function drawTop(ctx,sim,o){o=o||{};const t=o.t||0;
  ctx.fillStyle=C.stroma;ctx.fillRect(0,0,W,M0+18);ctx.fillStyle=C.lumen;ctx.fillRect(0,M1-18,W,TOPH-M1+18);
  ctx.strokeStyle=C.tail;ctx.lineWidth=1.6;ctx.beginPath();
  for(let x=4;x<W;x+=6.6){ctx.moveTo(x-1.5,M0+6);ctx.lineTo(x-1.5,M0+18);ctx.moveTo(x+1.5,M0+6);ctx.lineTo(x+1.5,M0+18);ctx.moveTo(x-1.5,M1-18);ctx.lineTo(x-1.5,M1-6);ctx.moveTo(x+1.5,M1-18);ctx.lineTo(x+1.5,M1-6);}ctx.stroke();
  for(let x=4;x<W;x+=6.6){dot(ctx,x,M0+3.5,3.1,C.head,shade(C.head,-.3),.8);dot(ctx,x,M1-3.5,3.1,C.head,shade(C.head,-.3),.8);}
  {const w=txt(ctx,'OUTSIDE THE DISC',14,22,{s:15,w:700,c:'#4c7a2c'});txt(ctx,'(stroma)',22+w,22,{s:15,c:'#4c7a2c'});}
  {const w=txt(ctx,'INSIDE THE DISC',14,TOPH-8,{s:15,w:700,c:'#44688a'});txt(ctx,'(thylakoid space)',22+w,TOPH-8,{s:15,c:'#44688a'});}
  ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(330,17);ctx.lineTo(410,17);ctx.moveTo(330,11);ctx.lineTo(330,23);ctx.moveTo(410,11);ctx.lineTo(410,23);ctx.stroke();txt(ctx,'10 nanometers',419,22,{s:15,w:600});
  // light: one photon for each electron, at each photosystem
  if(sim.light>0){ctx.save();ctx.strokeStyle=C.light;ctx.lineWidth=3.2;ctx.lineCap='round';ctx.globalAlpha=.35+.6*sim.light;ctx.setLineDash([11,9]);ctx.lineDashOffset=-t*70;
    for(const cx of [X.P2,X.P1])for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(cx+k*46+34,34);ctx.lineTo(cx+k*46,118);ctx.stroke();}ctx.restore();
    txt(ctx,'light',X.P2+92,52,{s:15,w:700,c:'#9a7400'});txt(ctx,'light',X.P1+92,52,{s:15,w:700,c:'#9a7400'});}
  // the real structures (3JCU, 6RQF, 5L8R, 6FKF), all at one scale
  M.draw(ctx,'PS2',X.P2,MY,SA);M.draw(ctx,'B6F',X.B,MY,SA);M.draw(ctx,'PS1',X.P1,MY,SA);M.drawATP(ctx,X.S,MY,SA,sim.rotor,'CATP');
  // the stepping stones inside them, at their measured positions
  for(const [mol,cx] of [['PS2',X.P2],['B6F',X.B],['PS1',X.P1]])for(const q of M.pts(mol)){const px=cx+q[1]*SA,py=MY+q[2]*SA,k=q[0];
    if(k==='OEX')dot(ctx,px,py,4.2,'#b78be0','rgba(40,20,60,.8)',1);else dot(ctx,px,py,k[0]==='P'?3.6:3,k[0]==='P'?'#9be28a':k[0]==='h'?'#f08a6a':'#ffe58a','rgba(40,30,0,.75)',1);}
  const nm=(a,b,x,y)=>{txt(ctx,a,x,y,{s:16,w:700,a:'center',c:'#fff',halo:4,hc:'rgba(20,30,20,.75)'});if(b)txt(ctx,b,x,y+15,{s:12.5,w:600,a:'center',c:'#fff',halo:3.5,hc:'rgba(20,30,20,.75)'});};
  nm('Photosystem II','',X.P2-48,147);nm('Pump','cytochrome b₆f',X.B,146);txt(ctx,'Photosystem I',X.P1+4,224,{s:16,w:700,a:'center',c:'#2f5a1c',halo:4.5});
  txt(ctx,'ATP synthase',X.S+6,224,{s:16.5,w:700,a:'center',c:C.syn,halo:4.5});
  // water waiting at the splitting site, and the oxygen it leaves behind
  water(ctx,P.oex[0]+24,P.oex[1]+34);water(ctx,P.oex[0]+50,P.oex[1]+44);txt(ctx,'water',P.oex[0]+64,P.oex[1]+32,{s:14.5,w:600,c:shade(C.o,-.45)});
  for(const b of sim.bub){const k=ease(b.p);o2mol(ctx,lerp(P.oex[0]-8,70,k),lerp(P.oex[1]+26,268,k),b.p>.8?(1-b.p)/.2:1);if(b.p<.8)txt(ctx,'O₂',lerp(P.oex[0]-8,70,k)+18,lerp(P.oex[1]+26,268,k)+5,{s:14.5,w:700,c:shade(C.o,-.45)});}
  // H⁺ crowd inside the disc
  for(const d of sim.lum){const k=ease(d.p),x=d.bx+Math.sin(t*.8+d.ph)*6,y=d.by+Math.cos(t*.6+d.ph)*5;hplus(ctx,d.p<1?lerp(d.fx,x,k):x,d.p<1?lerp(d.fy,y,k):y);}
  // carriers at rest, then every moving pair
  const on=st=>sim.pairs.find(p=>p.st===st);
  const car=(st,home,col,lab)=>{const pr=on(st),[x,y]=pr?pairXY(pr):home;dot(ctx,x,y-(pr?0:0),8.5,col,shade(col,-.45),1.3);txt(ctx,lab,x,y+4.2,{s:lab.length>1?9.5:11,w:700,a:'center',c:'#fff'});if(pr)epair(ctx,x,y-12);};
  car('pq',[P.q[0]+22,P.q[1]+1],'#d98324','Q');car('pc',[P.hf[0]+16,P.hf[1]+8],'#2f7f9f','PC');car('fd',[P.fb[0]+20,P.fb[1]-8],'#9a5a2a','Fd');
  for(const pr of sim.pairs){if(pr.st==='pq'||pr.st==='pc'||pr.st==='fd')continue;const [x,y]=pairXY(pr);
    if((pr.st==='ps2'||pr.st==='ps1')&&pr.p<.5){ctx.globalAlpha=1-pr.p/.5;dot(ctx,x,y,13,'#fff3b0','#f0b400',2);ctx.globalAlpha=1;}
    if(pr.st!=='fnr')epair(ctx,x,y);}
  // NADP⁺ waiting to be loaded, and what the flies carry
  {const full=sim.cap&&sim.nadph>=NADMAX;pill(ctx,full?'no empty NADP⁺':'NADP⁺',P.fnr[0]+38,P.fnr[1]-22,{bg:'#f3effc',c:'#4a3690',bd:'#8d7bd0',s:14,w:700});if(on('fnr'))epair(ctx,P.fnr[0],P.fnr[1]);dot(ctx,P.fnr[0],P.fnr[1]+0,3,'#8d7bd0','#4a3690',1);}
  for(const f of sim.fly){const k=ease(f.p);
    if(f.k==='hup'){const x=k<.4?lerp(f.x,X.S+24,k/.4):X.S+24,y=k<.4?lerp(f.y,196,k/.4):lerp(196,112,(k-.4)/.6);hplus(ctx,x,y,f.p>.85?(1-f.p)/.15:1);}
    else if(f.k==='atp'){ctx.globalAlpha=f.p>.85?(1-f.p)/.15:1;pill(ctx,'ATP',lerp(X.S-8,sim.cap?POOL.x+30:1100,k),lerp(52,sim.cap?POOL.ya:84,k),{bg:'#fde9ec',c:C.syn,bd:C.atp,s:14,w:700});ctx.globalAlpha=1;}
    else if(f.k==='nadph'){ctx.globalAlpha=f.p>.85?(1-f.p)/.15:1;pill(ctx,'NADPH',lerp(P.fnr[0]+38,sim.cap?POOL.x+30:850,k),lerp(P.fnr[1]-22,sim.cap?POOL.yn:22,k)-(sim.cap?Math.sin(k*3.14)*40:0),{bg:'#ece6fb',c:'#3d2a8a',bd:C.nad,s:14,w:700});ctx.globalAlpha=1;}}
  // the two batteries, when the story is counting what is in stock
  if(sim.cap){const row=(lab,n,max,y,col)=>{txt(ctx,lab,POOL.x-6,y+5,{s:14,w:700,a:'right',c:col,halo:4});for(let i=0;i<max;i++){rr(ctx,POOL.x+i*13,y-8,10,16,3);ctx.fillStyle=i<n?col:'#fff';ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle=col;ctx.stroke();}};
    row('ATP',sim.atp,ATPMAX,POOL.ya,C.atp);row('NADPH',sim.nadph,NADMAX,POOL.yn,C.nad);txt(ctx,'in stock',POOL.x+124,POOL.ya+5,{s:13,c:C.soft});}
}

/* ---------------- bottom picture 1: the same trip drawn as energy (to scale: 92 px per volt) ---------------- */
const eY=v=>352+(v+1.3)*92,EV={w:.82,s2:-.8,q:0,f:.36,p7:.45,s1:-1.2,fe:-.55,fd:-.42,n:-.32};
function pairE(pr){const p=clamp(pr.p,0,1),L=(a,b,k)=>lerp(a,b,ease(k));
  switch(pr.st){case 'oex':return [205,eY(EV.w)];
    case 'ps2':return p<.45?[205,L(eY(EV.w),eY(EV.s2),p/.45)]:[L(205,255,(p-.45)/.55),L(eY(EV.s2),eY(EV.q),(p-.45)/.55)];
    case 'pq':return [L(255,445,p),eY(EV.q)];case 'b6f':return [L(445,520,p),L(eY(EV.q),eY(EV.f),p)];case 'pc':return [L(520,690,p),L(eY(EV.f),eY(EV.p7),p)];
    case 'p700':return [690,eY(EV.p7)];
    case 'ps1':return p<.45?[690,L(eY(EV.p7),eY(EV.s1),p/.45)]:[L(690,735,(p-.45)/.55),L(eY(EV.s1),eY(EV.fe),(p-.45)/.55)];
    case 'fd':return [L(735,815,p),L(eY(EV.fe),eY(EV.fd),p)];default:return [L(815,860,p),L(eY(EV.fd),eY(EV.n),p)];}}
function panel(ctx){rr(ctx,22,TOPH+10,W-44,H-TOPH-18,12);ctx.fillStyle='#fffdf7';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#d9d4c6';ctx.stroke();}
function drawEnergy(ctx,sim,o){o=o||{};const a=o.alpha==null?1:o.alpha;if(a<=0)return;ctx.save();ctx.globalAlpha=a;panel(ctx);
  arrow(ctx,48,H-22,48,TOPH+34,{c:C.ink,lw:2.5,head:11});ctx.save();ctx.translate(36,470);ctx.rotate(-Math.PI/2);txt(ctx,'ENERGY',0,0,{s:14,w:700,a:'center'});ctx.restore();txt(ctx,'high',58,TOPH+42,{s:14,c:C.soft});txt(ctx,'low',58,H-22,{s:14,c:C.soft});
  ctx.setLineDash([3,6]);ctx.strokeStyle='#9aa0a8';ctx.lineWidth=1.5;ctx.beginPath();for(const x of [205,470,690]){ctx.moveTo(x,TOPH-6);ctx.lineTo(x,TOPH+30);}ctx.stroke();ctx.setLineDash([]);
  // the two lifts that light pays for
  for(const [x,v0,v1] of [[205,EV.w,EV.s2],[690,EV.p7,EV.s1]]){ctx.fillStyle='rgba(240,180,0,.2)';ctx.fillRect(x-17,eY(v1),34,eY(v0)-eY(v1));arrow(ctx,x-30,eY(v0)-6,x-30,eY(v1)+4,{c:'#c79200',lw:4,head:13});}
  txt(ctx,'light lifts',164,438,{s:15,w:700,c:'#8a6600',a:'right'});txt(ctx,'the electrons',164,456,{s:15,w:700,c:'#8a6600',a:'right'});txt(ctx,'light lifts',650,410,{s:15,w:700,c:'#8a6600',a:'right'});txt(ctx,'them again',650,428,{s:15,w:700,c:'#8a6600',a:'right'});
  // the path
  ctx.strokeStyle=C.ink;ctx.lineWidth=3.2;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(96,eY(EV.w));ctx.lineTo(222,eY(EV.w));ctx.stroke();
  ctx.beginPath();ctx.moveTo(188,eY(EV.s2));ctx.lineTo(214,eY(EV.s2));ctx.lineTo(255,eY(EV.q));ctx.lineTo(445,eY(EV.q));ctx.lineTo(520,eY(EV.f));ctx.lineTo(707,eY(EV.p7));ctx.stroke();
  ctx.beginPath();ctx.moveTo(673,eY(EV.s1));ctx.lineTo(699,eY(EV.s1));ctx.lineTo(735,eY(EV.fe));ctx.lineTo(815,eY(EV.fd));ctx.lineTo(860,eY(EV.n));ctx.lineTo(950,eY(EV.n));ctx.stroke();
  txt(ctx,'Water: the lowest step',96,eY(EV.w)+22,{s:15,w:700,c:shade(C.o,-.45)});txt(ctx,'riding on Q',350,eY(EV.q)+22,{s:14.5,a:'center',c:C.soft});
  if(o.lvl>=2)txt(ctx,'this drop runs the pump',486,eY(EV.f)+24,{s:14.5,a:'center',c:C.h,w:600});
  txt(ctx,'NADPH: high energy,',868,eY(EV.n)-28,{s:15,w:700,c:'#3d2a8a'});txt(ctx,'ready to build sugar',868,eY(EV.n)-10,{s:15,w:700,c:'#3d2a8a'});
  // the mirror of the respiration story
  rr(ctx,968,470,206,108,10);ctx.fillStyle='#f4f1e8';ctx.fill();
  ['In your mitochondria,','electrons roll down from','NADH to oxygen. Here','light pushes them up','from water to NADPH.'].forEach((s,i)=>txt(ctx,s,980,492+i*19,{s:14,c:C.ink,w:i>2?700:500}));
  for(const pr of sim.pairs){const [x,y]=pairE(pr);epair(ctx,x,y-8);}
  ctx.restore();}

/* ---------------- bottom picture 2: the sugar factory in the stroma (Calvin cycle) ---------------- */
const RB={x:215,y:452,s:1.22},CY={x:545,y:455,r:92},TRAY={x:725,y:455};
function ringXY(a,r){return [CY.x+Math.cos(a)*(r||CY.r),CY.y+Math.sin(a)*(r||CY.r)];}
function tokXY(p){const site=[RB.x+11*RB.s,RB.y+18*RB.s];if(p<.25)return [lerp(74,site[0],ease(p/.25)),lerp(452,site[1],ease(p/.25))];
  if(p<.38){const k=(p-.25)/.13,e=ringXY(Math.PI);return [lerp(site[0],e[0],k),lerp(site[1],e[1],k)];}
  if(p<.9)return ringXY(Math.PI+(p-.38)/.52*Math.PI);const k=(p-.9)/.1,e=ringXY(0);return [lerp(e[0],TRAY.x,k),lerp(e[1],TRAY.y,k)];}
function drawCalvin(ctx,sim,t){panel(ctx);tag(ctx,'IN THE STROMA: THE SUGAR FACTORY (THE CALVIN CYCLE)',W-30,TOPH+28);
  // CO₂ from the air
  const nC=Math.round(sim.co2*5);for(let k=0;k<nC;k++)co2mol(ctx,58+hash(k+1)*44+Math.sin(t*.7+k*2)*6,372+k*34+Math.cos(t*.5+k)*5,.85);
  txt(ctx,nC?'CO₂ from the air':'no CO₂ getting in',40,H-20,{s:14.5,w:700,c:nC?C.c:C.rj});
  // Rubisco, real shape (1RCX)
  M.draw(ctx,'RUB',RB.x,RB.y,RB.s);txt(ctx,'Rubisco',RB.x,RB.y-96,{s:16.5,w:700,a:'center',c:'#7a4a14'});txt(ctx,Story.view==='real'?'(an enzyme: its real shape)':'(an enzyme: a simple drawing)',RB.x,RB.y+104,{s:13.5,a:'center',c:'#7a4a14'});
  for(const q of M.pts('RUB').slice(0,2))dot(ctx,RB.x+q[1]*RB.s,RB.y+q[2]*RB.s,3.2,'#fff3c4','rgba(60,30,0,.8)',1);
  // the cycle: grab CO₂, spend the batteries, rebuild the helper
  ctx.strokeStyle='#b9c7a4';ctx.lineWidth=13;ctx.beginPath();ctx.arc(CY.x,CY.y,CY.r,0,6.2832);ctx.stroke();
  for(const a of [-2.4,-.75,.9,2.45]){const [x,y]=ringXY(a),d=a+Math.PI/2;ctx.save();ctx.translate(x,y);ctx.rotate(d);ctx.fillStyle='#7f9566';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-6,-8);ctx.lineTo(-6,8);ctx.closePath();ctx.fill();ctx.restore();}
  {const [x,y]=ringXY(Math.PI);dot(ctx,x,y,7,'#fff','#7f9566',2);}
  pill(ctx,'1. grab CO₂',378,CY.y-34,{bg:'#fff',c:C.ink,bd:'#9aa0a8',s:14.5,w:700});
  const spend=sim.spendT!=null&&sim.t-sim.spendT<1.6;
  pill(ctx,'2. spend 3 ATP + 2 NADPH',CY.x,CY.y-CY.r-17,{bg:spend?'#fde9ec':'#fff',c:C.ink,bd:spend?C.atp:'#9aa0a8',s:14.5,w:700});
  pill(ctx,'3. rebuild the 5-carbon helper',CY.x,CY.y+CY.r+18,{bg:'#fff',c:C.ink,bd:'#9aa0a8',s:14.5,w:700});
  txt(ctx,'RuBP',CY.x,CY.y-4,{s:15,w:700,a:'center',c:'#5a6b45'});txt(ctx,'(5 carbons)',CY.x,CY.y+14,{s:13,a:'center',c:'#5a6b45'});
  if(sim.stall)pill(ctx,'waiting: out of '+(sim.atp<3?'ATP':'NADPH'),CY.x,CY.y-CY.r-46,{bg:C.rj,c:'#fff',bd:null,s:15,w:700});
  for(const k of sim.tok){const [x,y]=tokXY(k.p);if(k.p<.25)co2mol(ctx,x,y,.85);else dot(ctx,x,y,7,C.c,'#000',1.2);}
  // the tray: three carbons make one small sugar
  rr(ctx,TRAY.x-8,TRAY.y-21,86,42,9);ctx.fillStyle='#f1eee4';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#b9b2a0';ctx.stroke();
  for(let i=0;i<3;i++)dot(ctx,TRAY.x+12+i*23,TRAY.y,7,i<sim.tray?C.c:'#fff',i<sim.tray?'#000':'#b9b2a0',1.2);
  txt(ctx,'3 carbons = 1 small sugar',TRAY.x-8,TRAY.y+40,{s:13.5,c:C.soft});
  const sug=(x,y,a)=>{ctx.globalAlpha=a;ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+30,y);ctx.stroke();for(let i=0;i<3;i++)dot(ctx,x+i*15,y,7,C.c,'#000',1.2);ctx.globalAlpha=1;};
  const slot=i=>[902+(i%6)*46,394+Math.floor(i/6)*24];
  const shown=Math.min(sim.n.sugar,18);for(let i=0;i<shown;i++){const fl=sim.fly.find(f=>f.k==='sugar');if(fl&&i===shown-1){const [x,y]=slot(i),k=ease(fl.p);sug(lerp(TRAY.x+12,x,k),lerp(TRAY.y,y,k),1);}else{const [x,y]=slot(i);sug(x,y,1);}}
  txt(ctx,'sugar made',900,370,{s:15,w:700,c:C.ink});txt(ctx,'(2 small sugars = 1 glucose)',990,370,{s:13.5,c:C.soft});
  chip(ctx,'CO₂ built in: '+sim.n.co2,900,500,{s:15.5});chip(ctx,'ATP spent: '+sim.n.co2*3,900,532,{s:15.5,c:C.syn,bd:C.atp});chip(ctx,'NADPH spent: '+sim.n.co2*2,900,564,{s:15.5,c:'#3d2a8a',bd:C.nad});
}

/* ---------------- zoom: from the tree to the membrane ---------------- */
const BOX=[{x:664,y:172,w:70},{x:588,y:286,w:60},{x:538,y:171,w:44},{x:548,y:236,w:60}];
const WIDE=[12,.09,2.2e-4,6e-6,1.5e-7];
function drawTree(ctx,S,hook){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#dbeefa');g.addColorStop(1,'#f4fbff');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#b9d892';ctx.fillRect(0,520,W,80);ctx.fillStyle='#8a6a48';ctx.fillRect(0,548,W,52);
  ctx.strokeStyle='#6b4c30';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(586,530);ctx.quadraticCurveTo(540,566,492,582);ctx.moveTo(618,530);ctx.quadraticCurveTo(668,562,716,578);ctx.moveTo(602,530);ctx.lineTo(604,590);ctx.stroke();
  ctx.fillStyle='#7b5a3c';ctx.beginPath();ctx.moveTo(572,532);ctx.lineTo(588,290);ctx.lineTo(614,290);ctx.lineTo(632,532);ctx.closePath();ctx.fill();
  const L=[[600,186,122],[502,244,90],[698,238,94],[556,118,86],[652,122,82],[600,274,96]];for(const [x,y,r] of L)dot(ctx,x,y,r,C.leaf);for(const [x,y,r] of L)dot(ctx,x-r*.25,y-r*.28,r*.56,'#63ad55');
  if(hook){ctx.save();ctx.translate(250,462);ctx.rotate(-.5);ctx.fillStyle='#c9a66b';ctx.strokeStyle='#8a6a3a';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,9,6,0,0,6.2832);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(6,-3);ctx.quadraticCurveTo(40,-22,58,-4);ctx.quadraticCurveTo(36,8,6,4);ctx.closePath();ctx.fillStyle='#e3cf9e';ctx.fill();ctx.stroke();ctx.restore();
    pill(ctx,'the seed: less than 1 gram',250,410,{bg:'#fff',c:C.ink,bd:C.ink,s:17,w:700});arrow(ctx,250,428,254,452,{c:C.ink,lw:2,head:9});
    pill(ctx,'50 years later: about 2,000 kilograms',905,84,{bg:'#fff',c:C.ink,bd:C.ink,s:17,w:700});arrow(ctx,800,100,730,140,{c:C.ink,lw:2,head:9});}}
function drawLeaf(ctx){ctx.fillStyle='#eef7fb';ctx.fillRect(0,0,W,H);ctx.beginPath();ctx.moveTo(150,300);ctx.bezierCurveTo(360,40,860,30,1080,300);ctx.bezierCurveTo(860,570,360,560,150,300);ctx.fillStyle='#5aa64c';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#3c7b34';ctx.stroke();
  ctx.lineCap='round';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(90,300);ctx.lineTo(1070,300);ctx.stroke();ctx.lineWidth=3;ctx.beginPath();
  for(let i=0;i<7;i++){const x=250+i*105,r=150-Math.abs(i-3)*24;ctx.moveTo(x,300);ctx.lineTo(x+70,300-r);ctx.moveTo(x,300);ctx.lineTo(x+70,300+r);}ctx.stroke();}
function drawCells(ctx){ctx.fillStyle='#f6faee';ctx.fillRect(0,0,W,H);
  const cell=(x,y,w,h,r,f)=>{rr(ctx,x,y,w,h,r);ctx.fillStyle=f;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#86a860';ctx.stroke();},cp=(x,y)=>{ctx.beginPath();ctx.ellipse(x,y,17,8.5,0,0,6.2832);ctx.fillStyle='#3f8f3f';ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle='#2c6a2c';ctx.stroke();};
  for(let i=0;i<10;i++)cell(8+i*120,36,116,60,14,'#eef5df');
  for(let i=0;i<10;i++){const x=20+i*118;cell(x,104,108,226,34,'#dcedc0');for(let k=0;k<5;k++){cp(x+24,138+k*40);cp(x+84,152+k*38);}}
  for(let i=0;i<9;i++){const x=70+i*128+(i%2)*14,y=392+(i%3)*26;ctx.beginPath();ctx.ellipse(x,y,50,36,0,0,6.2832);ctx.fillStyle='#dcedc0';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#86a860';ctx.stroke();cp(x-18,y-10);cp(x+16,y+12);}
  for(let i=0;i<10;i++){if(i===5)continue;cell(8+i*120,498,116,54,14,'#eef5df');}
  for(const x of [612,714]){ctx.beginPath();ctx.ellipse(x,525,18,27,0,0,6.2832);ctx.fillStyle='#9cc978';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#5d8a3e';ctx.stroke();}
  arrow(ctx,663,592,663,470,{c:C.c,lw:3,head:11});txt(ctx,'CO₂ in through a pore',680,585,{s:15,w:700,c:C.c});}
function drawChloro(ctx){ctx.fillStyle='#eef6da';ctx.fillRect(0,0,W,H);for(const [rx,ry,f,s] of [[560,268,'#cfe6a8','#6f9a3d'],[538,248,'#dcefbc','#8fb35c']]){ctx.beginPath();ctx.ellipse(600,300,rx,ry,0,0,6.2832);ctx.fillStyle=f;ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=s;ctx.stroke();}
  ctx.strokeStyle='#4f9244';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(190,300);ctx.bezierCurveTo(400,250,800,350,1010,300);ctx.moveTo(240,220);ctx.bezierCurveTo(480,260,720,200,960,250);ctx.moveTo(240,385);ctx.bezierCurveTo(480,340,720,400,960,360);ctx.stroke();
  for(const [x,y,n] of [[220,236,5],[395,190,7],[485,236,6],[690,176,7],[850,224,6],[300,330,6],[600,326,7],[790,332,6],[940,300,4]])for(let k=0;k<n;k++){rr(ctx,x,y+k*17,150,14,7);ctx.fillStyle='#3f8a3a';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#28632a';ctx.stroke();}}
function topXf(ctx,k){const s=lerp(1.2,1,k);ctx.translate(600,0);ctx.scale(s,s);ctx.translate(-600,lerp(95,0,k));if(k<1){ctx.fillStyle=C.stroma;ctx.fillRect(-200,-90,1600,100);ctx.fillStyle=C.lumen;ctx.fillRect(-200,TOPH-2,1600,200);}}
const LEVELS=[(ctx,S)=>drawTree(ctx,S,false),ctx=>drawLeaf(ctx),ctx=>drawCells(ctx),ctx=>drawChloro(ctx),(ctx,S)=>{topXf(ctx,0);drawTop(ctx,S.sim,{t:S.t});}];
function lvl(ctx,k,S){ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();LEVELS[k](ctx,S);ctx.restore();}
function drawZoom(ctx,S,z){const k=Math.min(3,Math.floor(z)),f=z>=4?1:z-k,b=BOX[k],bh=b.w*H/W;
  const w=W*Math.pow(b.w/W,f),r=(w-b.w)/(W-b.w),cx=b.x+b.w/2+(W/2-b.x-b.w/2)*r,cy=b.y+bh/2+(H/2-b.y-bh/2)*r,s=W/w;
  ctx.save();ctx.translate(W/2,H/2);ctx.scale(s,s);ctx.translate(-cx,-cy);lvl(ctx,k,S);
  const a=ease((f-.3)/.5);if(a>0){ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.w/W,b.w/W);ctx.globalAlpha=a;lvl(ctx,k+1,S);ctx.restore();}
  ctx.globalAlpha=1-ease((f-.05)/.4);ctx.lineWidth=3/s;ctx.strokeStyle=C.rj;ctx.strokeRect(b.x,b.y,b.w,bh);ctx.restore();ctx.globalAlpha=1;
  const near=z>=4?4:(f<.1?k:f>.9?k+1:-1);
  if(near>=0){const wd=WIDE[near],u=wd>=.5?[wd,'meters']:wd>=.01?[wd*100,'centimeters']:wd>=1e-4?[wd*1e3,'millimeters']:wd>=9e-7?[wd*1e6,'micrometers']:[wd*1e9,'nanometers'];
    pill(ctx,'This picture is about '+(u[0]>=10?Math.round(u[0]):u[0].toFixed(1))+' '+u[1]+' wide',W-16,H-24,{a:'right',bg:'#fff',c:C.ink,bd:C.ink,s:16,w:700,r:8});
    const mag=WIDE[0]/wd;if(mag>1.5)pill(ctx,'Zoomed in about '+(mag>=1e6?Math.round(mag/1e6)+' million':mag>=1e3?Math.round(mag/1e3)+' thousand':Math.round(mag))+' times',16,H-24,{a:'left',bg:C.ink,c:'#fff',bd:null,s:16,w:700,r:8});}
  else pill(ctx,'zooming in…',W-16,H-24,{a:'right',bg:'#fff',c:C.soft,bd:'#a9afb8',s:16,w:600,r:8});}

/* ---------------- scenes ---------------- */
function scene(ctx,S,o){o=o||{};const sim=S.sim,k=o.k==null?1:o.k;
  ctx.save();topXf(ctx,k);drawTop(ctx,sim,{t:S.t});if(o.over)o.over();ctx.restore();
  if(o.bottom==='energy'){drawEnergy(ctx,sim,{alpha:k,lvl:o.lvl||1});if(k>.9){tag(ctx,'THE REAL PARTS',W-10,18);tag(ctx,'THE SAME TRIP, DRAWN AS ENERGY',W-30,TOPH+26);}}
  else if(o.bottom==='calvin')drawCalvin(ctx,sim,S.t);}
function setup(S,o){const sim=S.sim=newSim();const fill=o&&o.fill;Object.assign(sim,o||{});delete sim.fill;if(fill)addLum(sim,fill);sim.n.h=0;return sim;}
let zAnim=null;
/* the last scene: the tree again, with the four parts of the equation */
function drawBack(ctx,S){drawTree(ctx,S,false);const T=S.v.term,t=S.t,pulse=k=>T===k?(.6+.4*Math.sin(t*5)):1;
  for(let i=0;i<9;i++){const p=(t*.12+i/9)%1,x=lerp(1120,720,p)+Math.sin(i*2.1)*20,y=lerp(60+i*22,170+((i*37)%120),p);ctx.globalAlpha=(p<.1?p/.1:p>.85?(1-p)/.15:1)*pulse('co2');co2mol(ctx,x,y,T==='co2'?1.1:.9);}ctx.globalAlpha=1;
  txt(ctx,'CO₂ from the air',960,44,{s:22,w:700,c:C.c});
  for(let i=0;i<5;i++){const p=(t*.1+i/5)%1;ctx.globalAlpha=(p<.1?p/.1:p>.85?(1-p)/.15:1)*pulse('h2o');water(ctx,602+Math.sin(i)*6,lerp(580,310,p));}ctx.globalAlpha=1;txt(ctx,'water from the soil',640,578,{s:22,w:700,c:'#fff',halo:5,hc:'#5a3f24'});
  for(let i=0;i<6;i++){const p=(t*.11+i/6)%1,x=lerp(480,130,p),y=lerp(150+((i*53)%140),70+i*26,p);o2mol(ctx,x,y,(p<.1?p/.1:p>.85?(1-p)/.15:1)*pulse('o2'));}txt(ctx,'O₂ out',60,44,{s:22,w:700,c:shade(C.o,-.45)});
  if(T==='sugar'){ctx.globalAlpha=.5+.4*Math.sin(t*5);ctx.strokeStyle=C.rj;ctx.lineWidth=5;ctx.strokeRect(566,286,72,250);ctx.globalAlpha=1;}
  pill(ctx,'wood = sugar units linked in long chains',262,318,{bg:'#fff',c:'#5a3f24',bd:'#8a6a48',s:20,w:700});arrow(ctx,470,332,566,372,{c:'#5a3f24',lw:2.5,head:12});
  rr(ctx,24,386,470,122,10);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=C.ink;ctx.stroke();
  ['Dry wood is about half carbon,','all of it from CO₂ in the air.','A willow grown in a pot for 5 years gained','74 kg. Its soil lost 57 grams. (Reported 1648.)'].forEach((s,i)=>txt(ctx,s,42,416+i*27,{s:20,w:i<2?700:500}));}

/* ---------------- tell it back ---------------- */
function crop(ctx,x,y,w,fn){ctx.save();ctx.beginPath();ctx.rect(0,0,300,193.3);ctx.clip();const s=300/w;ctx.scale(s,s);ctx.translate(-x,-y);fn();ctx.restore();}
function still(o){const s=newSim();const fill=o&&o.fill;Object.assign(s,o);if(fill)for(let k=0;k<fill;k++){const q=s.seed++;s.lum.push({bx:30+hash(q)*1140,by:200+hash(q+.5)*92,ph:0,p:1});}return s;}
const FRAMES=[
  {label:'Light lifts electrons out of water. Oxygen is left over',draw:ctx=>crop(ctx,60,70,330,()=>drawTop(ctx,still({light:1,pairs:[{st:'ps2',p:.3}],bub:[{p:.45}],showH:false}),{t:1}))},
  {label:'The electrons run a pump that crowds H⁺ inside the disc',draw:ctx=>crop(ctx,330,96,320,()=>drawTop(ctx,still({light:1,pairs:[{st:'b6f',p:.7}],fill:46}),{t:1}))},
  {label:'A second lift loads the electrons onto NADPH',draw:ctx=>crop(ctx,580,52,330,()=>drawTop(ctx,still({light:1,pairs:[{st:'fd',p:.8}],fly:[{k:'nadph',p:.12}]}),{t:1}))},
  {label:'H⁺ rush out through ATP synthase, which makes ATP',draw:ctx=>crop(ctx,830,10,350,()=>drawTop(ctx,still({fill:40,fly:[{k:'hup',p:.6,x:1000,y:230},{k:'atp',p:.25}],rotor:.4}),{t:1}))},
  {label:'Rubisco grabs CO₂. ATP and NADPH turn it into sugar',draw:ctx=>{ctx.save();ctx.beginPath();ctx.rect(0,0,300,193.3);ctx.clip();ctx.fillStyle='#fffdf7';ctx.fillRect(0,0,300,194);M.draw(ctx,'RUB',118,98,.92);co2mol(ctx,22,52,.95);co2mol(ctx,30,132,.95);arrow(ctx,40,58,58,70,{c:C.c,lw:2,head:7});
    pill(ctx,'ATP',252,34,{bg:'#fde9ec',c:C.syn,bd:C.atp,s:13,w:700});pill(ctx,'NADPH',246,62,{bg:'#ece6fb',c:'#3d2a8a',bd:C.nad,s:13,w:700});arrow(ctx,190,104,214,104,{c:C.ink,lw:2,head:7});
    ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(226,104);ctx.lineTo(262,104);ctx.stroke();for(let i=0;i<3;i++)dot(ctx,226+i*18,104,8,C.c,'#000',1.2);txt(ctx,'sugar',244,134,{s:14,w:700,a:'center'});txt(ctx,'Rubisco',118,180,{s:13,w:700,a:'center',c:'#7a4a14'});ctx.restore();}},
  {label:'The tree links the sugar into wood',draw:ctx=>crop(ctx,250,40,720,()=>drawTree(ctx,{t:0},false))}
];
const PICK=['The soil it grows in','The water it drinks','The air','The sunlight itself'];


/* ---------- "Who is doing this" (Nov 24, 2026; rebuilt Nov 23 for cause and effect): Wangari Maathai and the Green Belt Movement ----------
   Sources: NobelPrize.org (Peace 2004, the first African woman); National Academies laureate profile (biologist; founded the Green
   Belt Movement after rural women reported streams drying up, soil washing away and firewood running out; over 51 million trees;
   repeatedly arrested and jailed); LSE (founded 1977); Green Belt Movement (women's tree nurseries).
   What the student does and sees, with no numbers on screen (Jason: show the environment, not an abstract number):
   tap the bare hill to plant (cause) → each tree pulls CO₂ molecules out of the sky → in the leaf close-up, CO₂ + water become a sugar
   ring and O₂ leaves → sugar becomes wood: the log's rings grow and the trunks thicken (transformation) → when it rains, bare ground
   washes into the stream and turns it brown; roots hold the soil, so the stream runs clear and birds come back (effect). Cutting the
   trees brings the mud back. Rates and sizes are made up; dry wood is about half carbon by mass. */
const MT_PICK=[{v:'soil',x:600,y:30,draw(ctx,cx,cy){ctx.fillStyle='#8a5a2b';ctx.beginPath();ctx.ellipse(cx,cy+18,42,22,0,Math.PI,0);ctx.fill();ctx.fillRect(cx-42,cy+18,84,10);ctx.strokeStyle='#3f7a2f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy+2);ctx.quadraticCurveTo(cx-2,cy-14,cx,cy-24);ctx.stroke();ctx.fillStyle='#5a9a3a';ctx.beginPath();ctx.ellipse(cx-7,cy-18,7,3.5,-.5,0,7);ctx.ellipse(cx+7,cy-22,7,3.5,.5,0,7);ctx.fill();txt(ctx,'soil',cx,cy-34,{s:14,w:700,c:'#7a4f22',a:'center'});}},
  {v:'air',x:740,y:30,draw(ctx,cx,cy){co2Mini(ctx,cx-18,cy-14,1);co2Mini(ctx,cx+20,cy-4,1);txt(ctx,'air',cx,cy-34,{s:14,w:700,c:'#2f6fb0',a:'center'});co2Mini(ctx,cx,cy+22,1.4);}}];
function co2Mini(ctx,x,y,s,a){s=s||1;ctx.save();if(a!=null)ctx.globalAlpha=a;ctx.strokeStyle='#a3aab4';ctx.lineWidth=3*s;ctx.beginPath();ctx.moveTo(x-12*s,y);ctx.lineTo(x+12*s,y);ctx.stroke();
  [[x-12*s,'#d9362b',5.5],[x,'#5f6670',6],[x+12*s,'#d9362b',5.5]].forEach(([xx,c,r])=>{ctx.beginPath();ctx.arc(xx,y,r*s,0,7);ctx.fillStyle=c;ctx.fill();});ctx.restore();}
function treeIcon(ctx,x,y,s,a,tw){ctx.save();ctx.globalAlpha=a==null?1:a;tw=tw||1;const R=k=>{const v=Math.sin((x*12.9898+k*78.233))*43758.5453;return v-Math.floor(v);};
  // trunk and branches
  const th=26*s,tb=4.2*s*tw;const bg=ctx.createLinearGradient(x-tb,0,x+tb,0);bg.addColorStop(0,'#5a3a22');bg.addColorStop(.5,'#7a5434');bg.addColorStop(1,'#4a2f1b');ctx.fillStyle=bg;
  ctx.beginPath();ctx.moveTo(x-tb,y);ctx.lineTo(x-tb*.45,y-th);ctx.lineTo(x+tb*.45,y-th);ctx.lineTo(x+tb,y);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#5a3a22';ctx.lineCap='round';[[-1,.55],[1,.7],[-1,.85]].forEach(([d,h],i)=>{ctx.lineWidth=Math.max(1,2.2*s*tw*(1-i*.2));ctx.beginPath();ctx.moveTo(x,y-th*h);ctx.quadraticCurveTo(x+d*8*s,y-th*h-6*s,x+d*14*s,y-th*h-12*s);ctx.stroke();});
  // canopy: many leaf clusters, darker below, lit from the upper left
  const cy=y-th-10*s,cw=20*s,ch=15*s;for(let i=0;i<26;i++){const u=R(i)*2-1,v=R(i+40)*2-1,px=x+u*cw*(1-v*v*.3),py=cy+v*ch,r=(5+R(i+80)*4)*s;
    const lt=.5-.5*v+.25*(-u);ctx.fillStyle=`rgb(${Math.round(lerp(34,92,lt))},${Math.round(lerp(78,150,lt))},${Math.round(lerp(38,70,lt))})`;ctx.beginPath();ctx.arc(px,py,r,0,7);ctx.fill();}
  ctx.restore();}
const MT_X=[110,165,220,275,330,385,440,495,550],MT_HEX=[0,1,2,3,4,5].map(i=>[Math.cos(i*Math.PI/3+Math.PI/6),Math.sin(i*Math.PI/3+Math.PI/6)]);
const LC=[742,148],LR=104;
function hillY(x){let b=0,bd=1e9;for(let i=0;i<=80;i++){const t=i/80,bx=2*(1-t)*t*220+t*t*590,by=(1-t)*(1-t)*300+2*(1-t)*t*215+t*t*275;const d=Math.abs(bx-x);if(d<bd){bd=d;b=by;}}return b;}
function mtMol(x,y){return {x:x==null?20+Math.random()*560:x,y:y==null?30+Math.random()*150:y,vx:(Math.random()-.5)*40,vy:(Math.random()-.5)*24,tgt:null};}
function newMt(){const air=[];for(let i=0;i<34;i++)air.push(mtMol());return {pick:null,k:0,air,trees:[],inflow:0,mud:1,rain:0,rainT:6,soil:[],leaf:{co2:[],h2o:[],o2:[],phase:'collect',p:0},rings:0,cut:false,cutSeen:false,birds:0};}
function mtGrown(M){return M.trees.filter(t=>t.grow>=1).length;}
function mtBare(M){return 1-mtGrown(M)/MT_X.length;}
function mtPlant(S,x){const M=S.mt;if(!M||M.pick!=='air')return;const free=MT_X.filter(v=>!M.trees.some(t=>t.x===v));if(!free.length)return;
  const v=x==null?free[0]:free.reduce((a,b)=>Math.abs(b-x)<Math.abs(a-x)?b:a);M.trees.push({x:v,y:hillY(v),grow:0,cool:.6+Math.random(),got:0,wood:0});M.cut=false;}
function mtRain(S){const M=S.mt;if(M&&M.pick==='air'&&M.rain<=0){M.rain=3.2;M.rainT=12;}}
function mtCut(S){const M=S.mt;M.trees=[];M.air.forEach(m=>m.tgt=null);M.cut=true;M.rainT=Math.min(M.rainT,1.5);}
function mtLeafFeed(M){const L=M.leaf;if(L.phase==='collect'&&L.co2.length<6)L.co2.push({x:LC[0]-LR+6,y:LC[1]+(Math.random()-.5)*60,i:L.co2.length});}
function mtTick(S,dt){const M=S.mt;if(!M||!M.pick)return;M.k=Math.min(1,M.k+dt*.5);if(M.pick!=='air')return;
  M.inflow+=dt;while(M.inflow>.9){M.inflow-=.9;if(M.air.filter(m=>!m.tgt).length<42)M.air.push(mtMol(-10,40+Math.random()*120));}
  M.air.forEach(m=>{if(m.tgt){const tr=m.tgt,s=mtSize(tr),cx=tr.x,cy=tr.y-20*s,dx=cx-m.x,dy=cy-m.y,d=Math.hypot(dx,dy);if(d<8){m.done=true;tr.got++;M.last=tr;if(tr.got%3===0)tr.wood++;mtLeafFeed(M);}else{m.x+=dx/d*170*dt;m.y+=dy/d*170*dt;}return;}
    m.vx+=(Math.random()-.5)*40*dt;m.vy+=(Math.random()-.5)*30*dt;m.vx=clamp(m.vx,-30,40);m.vy=clamp(m.vy,-18,18);m.x+=m.vx*dt;m.y+=m.vy*dt;
    if(m.x<10){m.x=10;m.vx=Math.abs(m.vx);}if(m.x>580){m.x=580;m.vx=-Math.abs(m.vx);}if(m.y<24){m.y=24;m.vy=Math.abs(m.vy);}if(m.y>hillY(m.x)-70){m.y=hillY(m.x)-70;m.vy=-Math.abs(m.vy);}});
  M.air=M.air.filter(m=>!m.done);
  M.trees.forEach(tr=>{tr.grow=Math.min(1,tr.grow+dt*.6);if(tr.grow<1)return;tr.cool-=dt;if(tr.cool>0)return;tr.cool=1;
    let best=null,bd=1e9;M.air.forEach(m=>{if(m.tgt)return;const d=Math.hypot(m.x-tr.x,m.y-tr.y);if(d<bd){bd=d;best=m;}});if(best)best.tgt=tr;});
  // rain: bare ground washes into the stream, roots hold it
  M.rainT-=dt;if(M.rainT<=0)mtRain(S);
  if(M.rain>0){M.rain-=dt;const bare=mtBare(M);M.mud+=(bare-M.mud)*dt*.7;
    MT_X.forEach(x=>{if(M.trees.some(t=>t.x===x&&t.grow>=1))return;if(Math.random()<dt*6)M.soil.push({x:x+(Math.random()-.5)*40,y:hillY(x)+6,vy:20});});
    if(M.cut&&M.mud>.6)M.cutSeen=true;}
  M.soil.forEach(p=>{p.vy+=120*dt;p.y+=p.vy*dt;p.x+=(p.x<300?18:-8)*dt;});M.soil=M.soil.filter(p=>p.y<402);
  M.birds=lerp(M.birds,(M.mud<.35&&mtGrown(M)>=6)?1:0,dt*.8);
  // inside the leaf: CO₂ + water → sugar ring, O₂ out; the sugar becomes wood
  const L=M.leaf;L.co2.forEach(c=>{const w=[LC[0]-62,LC[1]-62+c.i*25];c.x=lerp(c.x,w[0],dt*3);c.y=lerp(c.y,w[1],dt*3);});
  if(L.phase==='collect'&&L.co2.length>=6){if(!L.h2o.length)for(let i=0;i<3;i++)L.h2o.push({x:LC[0]-30+i*30,y:LC[1]+LR-4});
    L.h2o.forEach(h=>{h.y=lerp(h.y,LC[1]+58,dt*3);});if(L.h2o.every(h=>h.y<LC[1]+64)){L.phase='build';L.p=0;}}
  else if(L.phase==='build'){L.p=Math.min(1,L.p+dt/1.8);if(L.p>=1){L.phase='out';L.p=0;L.o2=L.h2o.map(h=>({x:h.x,y:h.y,a:1}));}}
  else if(L.phase==='out'){L.p=Math.min(1,L.p+dt/1.4);if(L.p>=1){M.rings=Math.min(9,M.rings+1);L.phase='collect';L.co2=[];L.h2o=[];L.p=0;}}
  L.o2.forEach(o=>{o.y-=40*dt;o.a-=dt*.5;});L.o2=L.o2.filter(o=>o.a>0);}
function mtSize(tr){return (.35+.65*ease(tr.grow))*(1+Math.min(tr.wood,12)*.04);}
let MT_SOIL=null;
function mtSoil(){if(MT_SOIL)return MT_SOIL;const c=document.createElement('canvas');c.width=590;c.height=430;const x=c.getContext('2d');const g=x.createLinearGradient(0,200,0,430);g.addColorStop(0,'#a8552f');g.addColorStop(1,'#7c3a1f');x.fillStyle=g;x.fillRect(0,0,590,430);
  for(let i=0;i<2600;i++){const v=Math.sin(i*91.7)*43758.5;const f=v-Math.floor(v),w=Math.sin(i*37.1)*9131.3;const q=w-Math.floor(w);x.fillStyle=f<.5?'rgba(60,25,10,.18)':'rgba(230,150,100,.14)';x.fillRect(f*590,q*430,1.6,1.6);}MT_SOIL=c;return c;}
function mtScene(ctx,S){const M=S.mt,t=S.t,on=M.pick==='air',rainy=M.rain>0;
  const sky=ctx.createLinearGradient(0,0,0,300);sky.addColorStop(0,rainy?'#8d98a4':'#7fb2df');sky.addColorStop(1,rainy?'#c4cbd2':'#e4eef6');ctx.fillStyle=sky;ctx.fillRect(0,0,590,430);
  // Mount Kenya in the distance, snow on the peaks
  ctx.save();ctx.globalAlpha=rainy?.45:.8;const mg=ctx.createLinearGradient(0,60,0,230);mg.addColorStop(0,'#8a9bb0');mg.addColorStop(1,'#a9b6c4');ctx.fillStyle=mg;ctx.beginPath();ctx.moveTo(300,230);ctx.lineTo(392,118);ctx.lineTo(418,96);ctx.lineTo(430,70);ctx.lineTo(442,92);ctx.lineTo(456,84);ctx.lineTo(474,112);ctx.lineTo(590,210);ctx.lineTo(590,240);ctx.lineTo(300,240);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f4f7fa';ctx.beginPath();ctx.moveTo(410,104);ctx.lineTo(418,96);ctx.lineTo(430,70);ctx.lineTo(442,92);ctx.lineTo(456,84);ctx.lineTo(466,100);ctx.lineTo(452,98);ctx.lineTo(440,104);ctx.lineTo(428,96);ctx.lineTo(420,106);ctx.closePath();ctx.fill();ctx.restore();
  // the slope: red laterite soil, gullies where nothing holds it, grass coming back under grown trees
  ctx.save();ctx.beginPath();ctx.moveTo(0,hillY(0));for(let x=0;x<=590;x+=10)ctx.lineTo(x,hillY(x));ctx.lineTo(590,430);ctx.lineTo(0,430);ctx.closePath();ctx.clip();ctx.drawImage(mtSoil(),0,0);
  M.trees.forEach(tr=>{if(tr.grow<.4)return;const k=ease(clamp((tr.grow-.4)/.6,0,1))*(1+Math.min(tr.wood,10)*.05),gg=ctx.createRadialGradient(tr.x,tr.y+10,4,tr.x,tr.y+10,44*k);gg.addColorStop(0,'rgba(92,140,58,.95)');gg.addColorStop(.7,'rgba(92,140,58,.6)');gg.addColorStop(1,'rgba(92,140,58,0)');ctx.fillStyle=gg;ctx.beginPath();ctx.ellipse(tr.x,tr.y+12,46*k,30*k,0,0,7);ctx.fill();});
  ctx.strokeStyle='rgba(70,28,12,.55)';ctx.lineWidth=2.5;MT_X.forEach(x=>{if(M.trees.some(tr=>tr.x===x&&tr.grow>=1))return;ctx.beginPath();ctx.moveTo(x-6,hillY(x)+8);ctx.bezierCurveTo(x+8,hillY(x)+40,x-10,hillY(x)+70,x-4,398);ctx.stroke();ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+6,hillY(x)+20);ctx.quadraticCurveTo(x+14,hillY(x)+50,x+4,398);ctx.stroke();ctx.lineWidth=2.5;});
  ctx.restore();
  // the stream: red-brown with silt, or clear with the sky in it
  const mud=clamp(M.mud,0,1);ctx.fillStyle='#4a2414';ctx.fillRect(0,392,590,6);ctx.fillStyle='rgba(80,120,50,.8)';ctx.fillRect(0,390,590,2);
  const wg=ctx.createLinearGradient(0,398,0,430);wg.addColorStop(0,`rgb(${Math.round(lerp(110,201,mud))},${Math.round(lerp(168,146,mud))},${Math.round(lerp(205,96,mud))})`);wg.addColorStop(1,`rgb(${Math.round(lerp(46,158,mud))},${Math.round(lerp(104,108,mud))},${Math.round(lerp(150,64,mud))})`);ctx.fillStyle=wg;
  ctx.beginPath();ctx.moveTo(0,398);for(let x=0;x<=590;x+=10)ctx.lineTo(x,398+Math.sin(x*.05+t*2)*2);ctx.lineTo(590,430);ctx.lineTo(0,430);ctx.closePath();ctx.fill();
  ctx.strokeStyle=`rgba(255,255,255,${lerp(.55,.35,mud)})`;ctx.lineWidth=1.5;for(let k=0;k<7;k++){const x=(k*96+t*22)%640-30;ctx.beginPath();ctx.moveTo(x,412+(k%3)*5);ctx.lineTo(x+26,412+(k%3)*5);ctx.stroke();}
  if(M.birds>.05){ctx.save();ctx.globalAlpha=M.birds;for(let k=0;k<4;k++){const bx=(t*30+k*140)%620-20,by=150+k*14+Math.sin(t*3+k)*4,f=Math.sin(t*9+k)*4;ctx.fillStyle='#2b2b30';ctx.beginPath();ctx.moveTo(bx-9,by-f);ctx.quadraticCurveTo(bx-4,by-3,bx,by);ctx.quadraticCurveTo(bx+4,by-3,bx+9,by-f);ctx.quadraticCurveTo(bx+4,by+1,bx,by+2);ctx.quadraticCurveTo(bx-4,by+1,bx-9,by-f);ctx.fill();}ctx.restore();}
  // trees with roots holding the soil
  M.trees.forEach(tr=>{const s=mtSize(tr);if(tr.grow>=1){ctx.strokeStyle='rgba(60,32,14,.38)';ctx.lineWidth=1.4;for(let r=-3;r<=3;r++){ctx.beginPath();ctx.moveTo(tr.x,tr.y+1);ctx.quadraticCurveTo(tr.x+r*7,tr.y+14,tr.x+r*14,tr.y+26+Math.abs(r)*2);ctx.stroke();}}
    if(tr.grow<.35){ctx.fillStyle='#1d1d1d';ctx.fillRect(tr.x-4,tr.y-2,8,8);}treeIcon(ctx,tr.x,tr.y+2,s,1,1+Math.min(tr.wood,12)*.06);});
  ctx.fillStyle='rgba(110,50,22,.9)';M.soil.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,2.6,0,7);ctx.fill();});
  M.air.forEach(m=>co2Mini(ctx,m.x,m.y,.8,on||m.tgt?.95:.5));
  if(rainy){[[120,40],[300,30],[470,44]].forEach(([x,y])=>{const cg=ctx.createRadialGradient(x,y-8,6,x,y,80);cg.addColorStop(0,'#7d8691');cg.addColorStop(1,'rgba(125,134,145,0)');ctx.fillStyle=cg;ctx.beginPath();ctx.ellipse(x,y,90,30,0,0,7);ctx.fill();});
    ctx.strokeStyle='rgba(60,110,170,.45)';ctx.lineWidth=1.2;for(let k=0;k<90;k++){const x=(k*53)%590,y=(t*420+k*37)%380+40;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-2,y+11);ctx.stroke();}}
  if(M.pick==='soil'&&M.k<1){ctx.save();ctx.globalAlpha=1-M.k;ctx.fillStyle='rgba(255,255,255,.85)';rr(ctx,200,190,200,44,10);ctx.fill();txt(ctx,'the soil barely changes',300,218,{s:16,w:700,c:'#7a4f22',a:'center'});ctx.restore();}}
function mtLeaf(ctx,S){const M=S.mt,L=M.leaf;const tr=M.last&&M.trees.includes(M.last)?M.last:null;
  if(tr){const s=mtSize(tr),cx=tr.x,cy=tr.y-20*s+2;ctx.save();ctx.strokeStyle='rgba(47,143,78,.6)';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(cx,cy,15*s+4,0,7);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx+10,cy-12*s);ctx.lineTo(LC[0]-30,LC[1]-LR+6);ctx.moveTo(cx+10,cy+12*s);ctx.lineTo(LC[0]-30,LC[1]+LR-6);ctx.stroke();ctx.restore();}
  ctx.save();ctx.beginPath();ctx.arc(LC[0],LC[1],LR,0,7);ctx.fillStyle='#dff2df';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#2f8f4e';ctx.stroke();ctx.clip();
  for(let i=0;i<14;i++){const a=i*2.4,r=40+((i*37)%50),x=LC[0]+Math.cos(a)*r,y=LC[1]+Math.sin(a)*r*.8;ctx.save();ctx.translate(x,y);ctx.rotate(a);const cg=ctx.createRadialGradient(-3,-3,1,0,0,13);cg.addColorStop(0,'#8fd18a');cg.addColorStop(1,'#3d8f45');ctx.fillStyle=cg;ctx.beginPath();ctx.ellipse(0,0,13,7,0,0,7);ctx.fill();ctx.strokeStyle='rgba(30,90,40,.5)';ctx.lineWidth=1;for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(-7,k*2.2);ctx.lineTo(7,k*2.2);ctx.stroke();}ctx.restore();}
  ctx.save();ctx.globalAlpha=.35;ctx.strokeStyle='#ffd84a';ctx.lineWidth=3;for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(LC[0]+30+k*18,LC[1]-LR);ctx.lineTo(LC[0]-10+k*18,LC[1]-20);ctx.stroke();}ctx.restore();
  const H=(i,r)=>[LC[0]+MT_HEX[i][0]*r,LC[1]+MT_HEX[i][1]*r];
  if(L.phase==='collect'||L.phase==='build'){const p=L.phase==='build'?ease(L.p):0;
    L.co2.forEach(c=>{const v=H(c.i,30),cx=lerp(c.x,v[0],p),cy=lerp(c.y,v[1],p);
      ctx.globalAlpha=1;ctx.strokeStyle='#a3aab4';ctx.lineWidth=3*(1-p);if(p<1){ctx.beginPath();ctx.moveTo(c.x-12,c.y);ctx.lineTo(c.x+12,c.y);ctx.stroke();}
      [[-12,'#d9362b',5],[12,'#d9362b',5]].forEach(([d,col,r])=>{const o=H(c.i,42+(d>0?6:-6)*0);ctx.beginPath();ctx.arc(lerp(c.x+d,o[0]+d*.25,p),lerp(c.y,o[1],p),r*(1-.4*p),0,7);ctx.fillStyle=col;ctx.fill();});
      ctx.beginPath();ctx.arc(cx,cy,6,0,7);ctx.fillStyle='#5f6670';ctx.fill();});
    if(p>0){ctx.globalAlpha=p;ctx.strokeStyle='#5f6670';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=6;i++){const v=H(i%6,30);ctx[i?'lineTo':'moveTo'](v[0],v[1]);}ctx.stroke();ctx.globalAlpha=1;}
    L.h2o.forEach(h=>{const tx=lerp(h.x,LC[0],ease(L.phase==='build'?L.p:0)*.3);ctx.beginPath();ctx.arc(tx,h.y,7,0,7);ctx.fillStyle='#d9362b';ctx.fill();[[-8,-5],[8,-5]].forEach(([dx,dy])=>{ctx.beginPath();ctx.arc(tx+dx,h.y+dy,4,0,7);ctx.fillStyle='#f2f2f2';ctx.fill();ctx.strokeStyle='#bbb';ctx.lineWidth=1;ctx.stroke();});});}
  if(L.phase==='out'){const p=ease(L.p),x=lerp(LC[0],LC[0]+20,p),y=lerp(LC[1],LC[1]+LR+40,p);ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;ctx[i?'lineTo':'moveTo'](x+30*Math.cos(a),y+30*Math.sin(a));}ctx.closePath();ctx.fillStyle='#c98a4b';ctx.fill();ctx.strokeStyle='#7a4f22';ctx.lineWidth=2;ctx.stroke();}
  L.o2.forEach(o=>{ctx.globalAlpha=Math.max(0,o.a);[[-6,0],[6,0]].forEach(([dx])=>{ctx.beginPath();ctx.arc(o.x+dx,o.y,6,0,7);ctx.fillStyle='#d9362b';ctx.fill();});});
  ctx.restore();
  // the sugar becomes wood: a log whose rings grow
  arrow(ctx,LC[0],LC[1]+LR+4,LC[0],LC[1]+LR+30,'#7a4f22');
  const lx=LC[0],ly=346,rr2=26+M.rings*4.5;const bk=ctx.createRadialGradient(lx,ly,rr2*.9,lx,ly,rr2+7);bk.addColorStop(0,'#5a3a22');bk.addColorStop(1,'#3b2414');ctx.fillStyle=bk;ctx.beginPath();ctx.arc(lx,ly,rr2+7,0,7);ctx.fill();
  const wd=ctx.createRadialGradient(lx-4,ly-4,2,lx,ly,rr2);wd.addColorStop(0,'#f0c98e');wd.addColorStop(1,'#cf9a5c');ctx.fillStyle=wd;ctx.beginPath();ctx.arc(lx,ly,rr2,0,7);ctx.fill();
  ctx.strokeStyle='rgba(120,70,30,.55)';for(let i=1;i<=M.rings+3;i++){const r=rr2*Math.pow(i/(M.rings+3),.9);ctx.lineWidth=i%2?1.4:.8;ctx.beginPath();for(let a=0;a<=Math.PI*2+.01;a+=.2){const w=r*(1+.025*Math.sin(a*3+i));ctx[a?'lineTo':'moveTo'](lx+Math.cos(a)*w,ly+Math.sin(a)*w);}ctx.stroke();}
  ctx.strokeStyle='rgba(90,50,20,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(lx+2,ly-2);ctx.lineTo(lx+rr2*.7,ly-rr2*.5);ctx.stroke();}
function mtRhyme(ctx){Who.rhyme(ctx,20,440,560,140,(c,x,y,w,h)=>{co2Mini(c,x+50,y+h/2,1.6);arrow(c,x+86,y+h/2,x+128,y+h/2,'#62626a');c.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3+Math.PI/6;c[k?'lineTo':'moveTo'](x+170+26*Math.cos(a),y+h/2+26*Math.sin(a));}c.closePath();c.fillStyle='#9b6a36';c.fill();},
  (c,x,y,w,h)=>{co2Mini(c,x+50,y+h/2,1.6);arrow(c,x+86,y+h/2,x+128,y+h/2,'#62626a');treeIcon(c,x+175,y+h/2+38,1.9);});}
function mtPick(S,v){const M=S.mt;if(!M||M.pick==='air')return;M.pick=v;M.k=0;if(v==='air')M.rainT=2.5;}
Story.start({
  id:'photosynthesis',title:'What is a tree made of?',W,H,views:true,labHref:'../index.html#chloroplast',
  about:'<p><b>Two ways to see it.</b> <b>Real shape</b> shows each machine as it was measured. <b>Simple drawing</b> shows the same outline smoothed and filled flat, the way a textbook or a test draws it. Nothing else changes when you switch.</p><p><b>The shapes are real.</b> Photosystem II, the pump (cytochrome b₆f), photosystem I, ATP synthase and Rubisco are drawn from the measured positions of their atoms in spinach and pea proteins (Protein Data Bank entries 3JCU, 6RQF, 5L8R, 6FKF and 1RCX). They are seen from the side, in their real order, all at one scale: the bar is 10 nanometers. The small dots inside them are the real stepping stones the electrons use, in their measured places; the purple one is the cluster of manganese atoms where water is split. The ring of this ATP synthase really has 14 parts, so 14 H⁺ turn it once.</p><p><b>What is simplified.</b> Colors are labels. A real disc holds thousands of these machines, with photosystem II packed into the stacked discs and photosystem I and ATP synthase out on the edges; here one of each sits side by side. The small carriers (Q, PC, Fd) are drawn as dots. Each photosystem’s short drop before its lift is left out, and so is a loop that real plants use to make extra ATP. The Calvin cycle is drawn as three stops; the real one has 13 steps. Everything is slowed down enormously.</p><p><b>The willow.</b> Jan van Helmont grew a willow in a weighed pot of soil for five years. His report was published in 1648: the tree had gained about 74 kilograms (164 pounds) and the soil had lost about 57 grams (2 ounces). He thought the weight came from water; the role of the air was worked out later.</p><p><b>The numbers.</b> Each water gives 2 electrons and 2 H⁺; two waters leave one O₂. The pump moves 4 H⁺ per pair of electrons. Each pair loads one NADPH. Fourteen H⁺ make 3 ATP. Each CO₂ costs 3 ATP and 2 NADPH, and 3 CO₂ make one 3-carbon sugar. The energy steps are drawn to scale from measured voltages.</p><p><b>Wangari Maathai (step 11).</b> Maathai, a Kenyan biologist (PhD 1971, University of Nairobi), founded the Green Belt Movement in 1977. It trained women to grow tree nurseries and has planted over 51 million trees in Kenya. She was arrested and jailed for her activism, and in 2004 became the first African woman to win the Nobel Peace Prize. She started it after rural women said their streams were drying up, their soil was washing away and firewood was running out. Dry wood is about half carbon by mass, and every gram of that carbon came from CO₂ in the air. In the picture, rates and sizes are made up; the O₂ a leaf gives off comes from the water it splits. Sources: NobelPrize.org; National Academies; London School of Economics; Green Belt Movement.</p>',
  tell:{frames:FRAMES,swaps:[[2,3]],terms:['light','water','electron','oxygen|O₂|o2','H⁺|h+|hydrogen ion|proton','NADPH','ATP','CO₂|co2|carbon dioxide','Rubisco','sugar|glucose'],
    nudge:'For each picture ask: what had to happen just before this could happen?',
    done:'<b>That is the story.</b> (Pictures 3 and 4 happen at the same time, so either order counts.) Now tell it in your own words.',
    prompt:'A seed lighter than a paperclip becomes a tree as heavy as two cars. Where did the weight come from? Tell the story. Use “because” and “so”.',placeholder:'Light hits the leaf and… because… so…'},
  chapters:[
  {rail:'The question',title:'A seed becomes a tree',views:false,
   predict:{key:'mass',q:'A maple seed weighs less than a paperclip. Fifty years later the tree weighs as much as two cars. Where did most of that weight come from?',opts:PICK,right:2,after:'<b>Locked in.</b> Now follow the light and find out.'},
   text:'<p class="why">Take your best guess. You will count the answer in step 9.</p>',
   enter(S){setup(S);},draw(ctx,S){drawTree(ctx,S,true);}},

  {rail:'Zoom in',title:'Go where the light goes',live:true,
   text(S){const z=S.v.z||0;return z<.5?'The work happens in the leaves. <b>Zoom in</b> until you reach the place that catches the light.':
     z<1.5?'One leaf: thin and flat, so light reaches every cell, with veins that bring water up from the roots.':
     z<2.5?'A slice through the leaf. The green ovals in each cell are <b class="term">chloroplasts</b>. Underneath, pores let CO₂ in.':
     z<3.5?'One chloroplast. Inside are stacks of flat green discs called <b class="term">thylakoids</b>. The fluid around them is the <b class="term">stroma</b>.':
     'The skin of one disc, close up, with the machines that sit in it, all at one scale. Above the picture, switch between <b>Simple drawing</b> and <b>Real shape</b>. This is where light gets caught.';},
   ui:[{type:'button',label:'Zoom in',pulse:true,act(S){const a=S.v.z,b=Math.min(4,Math.floor(a+.02)+1);zAnim={a,b,t:0};},show:S=>S.v.z<3.98},
       {type:'range',key:'z',min:0,max:4,step:.01,val:0,label:'Zoom',fmt:v=>['The tree','One leaf','Inside the leaf','One chloroplast','The skin of one disc'][Math.round(v)],on(){zAnim=null;}}],
   todo:[{t:'Zoom all the way in',ok:S=>S.v.z>=3.97}],
   enter(S){setup(S);S.v.z=0;zAnim=null;},
   tick(S,dt){if(zAnim){zAnim.t+=dt/2.3;S.v.z=lerp(zAnim.a,zAnim.b,ease(zAnim.t));if(zAnim.t>=1){S.v.z=zAnim.b;zAnim=null;}}},
   draw(ctx,S){drawZoom(ctx,S,S.v.z);}},

  {rail:'Light',title:'Light pulls electrons out of water',
   text:'Turn on the light. <b class="term">Photosystem II</b> catches it and uses the energy to pull electrons (yellow) out of water. What is left of the water? H⁺, and the oxygen you breathe. <b>Bottom:</b> the same trip drawn as energy.',
   alt:'Think of a ball at the bottom of a hill. It will not roll up on its own. Light is the kick that sends it up. The ball is an electron, and it started in a water molecule.',
   ui:[{type:'button',label:'Turn on the light',pulse:true,act(S){S.sim.light=1;},show:S=>!S.sim.light}],
   todo:[{t:'Turn on the light',ok:S=>S.sim.light>0},{t:'Watch 2 waters become 1 O₂',ok:S=>S.sim.n.o2>=1}],
   enter(S){setup(S,{showH:false});},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){scene(ctx,S,{bottom:'energy',k:ease(S.tau/1.2)});chip(ctx,'Waters split: '+S.sim.n.water,780,226);chip(ctx,'O₂ released: '+S.sim.n.o2,780,262,{c:shade(C.o,-.45),bd:C.o});}},

  {rail:'Two lifts',title:'Down through a pump, then up again',
   text(S){if(S.sim.light===0)return '<b>Light off:</b> no electrons get lifted, so nothing rolls through the pump, no H⁺ goes in, and no NADPH is made. <b>Turn it back on.</b>';
     return 'Follow one pair. The lifted electrons roll downhill through a pump, and the drop pushes H⁺ (pink) into the disc. Then <b class="term">photosystem I</b> lifts them again, high enough to load onto <b class="term">NADPH</b>, a carrier of high-energy electrons.'+(S.sim.n.nadph>=3?' <b>Now turn the light off.</b>':'');},
   ui:[{type:'seg',key:'L',val:1,label:'The light',opts:[{v:1,l:'☀️ On'},{v:0,l:'🌑 Off'}],on(S,v){S.sim.light=v;if(v)S.v.ltOn=S.v.ltOff;else S.v.ltOff=1;}}],
   alt:'It is two escalators with a water wheel between them. The first escalator lifts the electrons, the wheel takes some energy as they roll down, and the second escalator lifts them to the top floor: NADPH.',
   todo:[{t:'Make 3 NADPH',ok:S=>S.sim.n.nadph>=3},{t:'Count the H⁺ for each pair: 2 from water + 4 pumped = 6',ok:S=>S.sim.n.h>=18},{t:'Turn the light off, then back on',ok:S=>!!S.v.ltOn}],
   enter(S){setup(S,{light:1,open:false});S.v.L=1;S.v.ltOn=0;S.v.ltOff=0;},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){const n=S.sim.n;scene(ctx,S,{bottom:'energy',lvl:2});chip(ctx,'NADPH made: '+n.nadph,800,22,{c:'#3d2a8a',bd:C.nad,s:16});chip(ctx,'H⁺ added inside: '+n.h,780,262,{c:C.h,bd:C.h});
     if(S.sim.lum.length>LMAX-4)pill(ctx,'The disc is full of H⁺. Next step: the way out.',400,284,{bg:C.ink,c:'#fff',bd:null,s:15.5,w:700});}},

  {rail:'The turbine',title:'The crowd turns a turbine',
   text:'The H⁺ are crowded inside the disc with one way out: <b class="term">ATP synthase</b>, the same kind of turbine your mitochondria use. Open it. Fourteen H⁺ turn its ring once, and each turn makes 3 <b class="term">ATP</b>.',
   alt:'A dam holds back water. Open the gate and the rushing water spins a turbine. Here the water is the crowd of H⁺, and the turbine makes ATP.',
   ui:[{type:'button',label:'Open ATP synthase',pulse:true,act(S){S.sim.open=true;},show:S=>!S.sim.open}],
   todo:[{t:'Open ATP synthase',ok:S=>S.sim.open},{t:'Watch one full turn: 14 H⁺, 3 ATP',ok:S=>S.sim.n.atp>=3}],
   enter(S){setup(S,{light:1,open:false,fill:44});},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){const sim=S.sim;scene(ctx,S,{bottom:'energy',lvl:2,over(){if(!sim.open)ring(ctx,X.S+8,MY,44,S.t,C.rj);}});
     chip(ctx,'H⁺ through: '+sim.through+'   ('+(sim.through%RING)+' of 14 this turn)',540,262,{c:C.h,bd:C.h,s:16});chip(ctx,'ATP made: '+sim.n.atp,1062,84,{c:C.syn,bd:C.atp});}},

  {rail:'Sugar',title:'Spend the batteries on sugar',
   text:'Light has charged two batteries: ATP and NADPH. In the stroma, an enzyme called <b class="term">Rubisco</b> grabs CO₂ from the air and joins it to a 5-carbon helper. ATP and NADPH turn the result into sugar. Let CO₂ in and count.',
   alt:'It is a bakery. Flour comes in the door (CO₂). The oven runs on two kinds of power (ATP and NADPH) that the solar panels upstairs just made. Bread comes out (sugar).',
   ui:[{type:'button',label:'Let CO₂ in',pulse:true,act(S){S.sim.co2=.8;},show:S=>!S.sim.co2}],
   todo:[{t:'Let CO₂ in',ok:S=>S.sim.co2>0},{t:'Build one small sugar: 3 CO₂, 9 ATP, 6 NADPH',ok:S=>S.sim.n.sugar>=1}],
   enter(S){setup(S,{light:1,cap:true,calvin:true,fill:30,atp:6,nadph:4});},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){scene(ctx,S,{bottom:'calvin'});}},

  {rail:'Lights out',title:'The “dark reactions” in the dark',live:true,
   predict:{key:'dark',q:'The sugar factory never touches light. People even call it the “dark reactions”. The sun sets. What happens to it?',opts:['It keeps running all night','It stops within seconds','It speeds up in the dark'],right:1,
     after:i=>i===1?'<b>You called it.</b> Turn the light off and watch why.':'<b>Locked in.</b> Turn the light off and test it.'},
   text(S){const sim=S.sim;return sim.light?'Sugar is being made. Now turn off the light and watch the two batteries.':sim.stall?'<b>It stopped.</b> The factory needs ATP and NADPH, and only the light reactions make them. No light, no batteries, no sugar.':'The light is off. Watch the ATP and NADPH in stock.';},
   ui:[{type:'seg',key:'L',val:1,label:'The light',opts:[{v:1,l:'On'},{v:0,l:'Off'}],on(S,v){S.sim.light=v;}}],
   todo:[{t:'Turn the light off',ok:S=>S.sim.light===0},{t:'Watch the sugar factory stop',ok:S=>S.sim.light===0&&S.sim.stall}],
   enter(S){setup(S,{light:1,cap:true,calvin:true,co2:.8,fill:24,atp:9,nadph:6});S.v.L=1;},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){scene(ctx,S,{bottom:'calvin'});if(!S.sim.light)pill(ctx,'light off',X.P2,60,{bg:C.ink,c:'#fff',bd:null,s:16,w:700});}},

  {rail:'No CO₂',title:'A hot day: the pores close',live:true,patience:60,
   text(S){const sim=S.sim,jam=sim.co2===0&&sim.nadph>=NADMAX&&rateO2(sim,6)===0;return sim.co2?'A hot, dry afternoon. The leaf closes its pores to save water, so no CO₂ gets in. The sun is still bright. Close the pores and watch the oxygen.':
     jam?'<b>The oxygen stopped.</b> With no CO₂, nothing spends NADPH. It fills up, the electrons have nowhere to go, and the jam backs up all the way to water.':'The pores are closed. Watch NADPH fill up, then look at the electrons.';},
   alt:'An assembly line with a full loading dock. Nothing ships out, so every worker up the line has to stop, right back to the first one. The first worker here is the one that splits water.',
   ui:[{type:'seg',key:'pores',val:1,label:'The leaf’s pores',opts:[{v:1,l:'Open'},{v:0,l:'Closed'}],on(S,v){S.sim.co2=v?.8:0;}}],
   todo:[{t:'Close the pores',ok:S=>S.sim.co2===0},{t:'Watch the oxygen stop',ok:S=>S.sim.co2===0&&S.sim.nadph>=NADMAX&&rateO2(S.sim,6)===0}],
   enter(S){setup(S,{light:1,cap:true,calvin:true,co2:.8,fill:24,atp:6,nadph:3});S.v.pores=1;},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){scene(ctx,S,{bottom:'calvin'});chip(ctx,'O₂ in the last 10 seconds: '+rateO2(S.sim,10),300,262,{c:shade(C.o,-.45),bd:C.o,s:16});}},

  {rail:'The answer',title:'So what is a tree made of?',views:false,
   text(S){const p=S.picks.mass;return 'Mostly air. '+(p===2?'You called it. ':p==null?'':'Not “'+PICK[p].toLowerCase()+'”. ')+'The carbon in wood came in as CO₂ through the leaves. Water gave the hydrogen, and its oxygen went back out as the O₂ you breathe. Light paid for all of it.';},
   alt:'A tree is built like a brick wall, and the bricks arrive by air. Each CO₂ is one brick. The roots bring water and a pinch of minerals, but the bricks float in through the leaves.',
   strip:{terms:[{k:'co2',html:'6 CO₂',note:'<b>From the air,</b> in through the pores of the leaf. Rubisco builds its carbon into sugar. This is where most of a tree’s weight comes from.'},
     {k:'h2o',html:'6 H₂O',note:'<b>From the soil,</b> up through the trunk. Photosystem II splits it. Its hydrogen ends up in the sugar.'},
     {k:'sugar',html:'C₆H₁₂O₆',note:'<b>Sugar,</b> built in the stroma. The tree links sugar units into long chains called cellulose, and that is wood.'},
     {k:'o2',html:'6 O₂',note:'<b>Left over from the split water.</b> Every O₂ a plant gives off comes from water, not from CO₂.'}],ops:['+','→','+'],
     hint:'This is the equation for the whole story. Tap <b>CO₂</b>, then <b>O₂</b>, to find each one in the picture.'},
   todo:[{t:'Tap CO₂ in the equation',ok:S=>S.v.termsHit&&S.v.termsHit.co2},{t:'Tap O₂',ok:S=>S.v.termsHit&&S.v.termsHit.o2}],
   enter(S){setup(S);},draw(ctx,S){drawBack(ctx,S);}},

  window.Wood3D.chapter(C),

  {rail:'Who did it',title:'Wangari Maathai, Kenya',links:[{t:"Wangari Maathai, in the Green Belt Movement's own words",u:"https://www.greenbeltmovement.org/wangari-maathai/biography",d:"the movement she started is still planting"},{t:"Nobel Peace Prize 2004: Wangari Maathai",u:"https://www.nobelprize.org/prizes/peace/2004/maathai/facts/",d:"NobelPrize.org"},{t:"Photos of the Green Belt Movement at work",u:"https://artsandculture.google.com/asset/collecting-soil/lgFQDKqxigzfqw",d:"Google Arts & Culture"}],live:true,views:false,
   text(S){const M=S.mt;if(!M||!M.pick)return 'Kenya, 1977. The hills are cut bare and the streams run brown. <b>Tap where a tree\'s weight comes from.</b>';
     if(M.pick==='soil')return 'The soil barely changes. Try the other.';
     if(!M.trees.length&&!M.cut)return 'From the air. <b>Tap the bare hill to plant a tree.</b>';
     if(M.cutSeen)return 'No roots: the rain carries the hill into the stream again. Her Green Belt Movement planted over 51 million trees.';
     if(M.cut)return 'Watch the next rain.';
     if(M.mud>=.35)return 'Watch one CO₂ go in: the leaf turns it and water into sugar, then wood. Roots grip the soil. <b>Plant more.</b>';
     return 'The trees pull CO₂ out of the sky, and roots keep the soil out of the stream. <b>Now cut them down.</b>';},
   alt:'Look at the two pictures at the bottom. CO₂ becomes a sugar ring in the leaf, and sugar rings become wood. On a bare hill, rain carries soil into the stream; tree roots hold it in place.',
   ui:[{type:'seg',key:'mp',val:'',label:'Where does a tree\'s weight come from?',opts:[{v:'soil',l:'🌍 The soil'},{v:'air',l:'💨 The air'}],on(S,v){mtPick(S,v);},show:S=>S.mt&&S.mt.pick!=='air'},
     {type:'button',label:'🌱 Plant a tree',pulse:true,act(S){mtPlant(S);},show:S=>S.mt&&S.mt.pick==='air'&&S.mt.trees.length<MT_X.length},
     {type:'button',label:'🌧️ Make it rain',act(S){mtRain(S);},show:S=>S.mt&&S.mt.pick==='air'},
     {type:'button',label:'🪓 Cut the trees',act(S){mtCut(S);},show:S=>S.mt&&S.mt.trees.length>0}],
   todo:[{t:'Tap where a tree\'s weight comes from',ok:S=>S.mt&&S.mt.pick==='air'},{t:'Plant trees until the stream runs clear',ok:S=>S.mt&&S.mt.pick==='air'&&S.mt.mud<.35},{t:'Cut them down and watch the rain',ok:S=>S.mt&&S.mt.cutSeen}],
   enter(S){S.mt=newMt();S.v.mp='';},tick(S,dt){mtTick(S,dt);},
   click(S,x,y){const v=Who.hit(MT_PICK,x,y);if(v&&S.mt.pick!=='air'){mtPick(S,v);S.v.mp=v;return;}if(S.mt.pick==='air'&&x<590&&y>180&&y<400)mtPlant(S,x);},
   draw(ctx,S){const M=S.mt||(S.mt=newMt());ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,W,H);mtScene(ctx,S);
     if(M.pick!=='air')Who.cards(ctx,S,MT_PICK,M.pick);else mtLeaf(ctx,S);mtRhyme(ctx);
     Who.panel(ctx,'Wangari Maathai',[['🎓','biologist, PhD 1971'],['🌱','1977: Green Belt Movement'],['👩‍🌾','women grow tree nurseries'],['🌳','51 million trees, Kenya'],['✋','arrested and jailed'],['🏅','2004 Nobel Peace Prize']],['Sources: NobelPrize.org; National','Academies; LSE; Green Belt Movement.']);}},

  {rail:'Tell it',title:'Now you tell the story',tell:true,
   text:'You have followed the light from a leaf to a sugar. Put the story back in order, then explain it the way you would to a friend who missed class.'}
  ]});
})();
