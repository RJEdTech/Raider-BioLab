/* Story: "Why can't you drink seawater?"  Membrane transport, told as one story: a wall that blocks salt, a doorway that
   lets water through, and what happens to a red blood cell when the two sides stop matching.
   Real shapes (Protein Data Bank): aquaporin-1 from a human red blood cell 7UZE, human sodium-potassium pump 7E1Z.
   True on screen: the membrane, the proteins, the waters and the ions are at one scale (bar = 5 nanometers); the number of
   dissolved particles drawn is in true proportion to the water (about 1 for every 185 waters in blood); the pump moves
   3 Na⁺ out and 2 K⁺ in for each ATP; the cell bursts when its volume passes about 1.6 times normal. */
(function(){
'use strict';
const {clamp,lerp,ease,rr,txt,pill,ring,arrow,hash}=Story.h,M=Story.mol;
const W=1200,H=600,CW=770,SC=2.4,MY=250,HM=19*SC,AX=250,PX=570;
const C={out:'#e9f3fb',ins:'#fdeceb',head:'#e9c46a',tail:'#d9c08a',ink:'#26262b',soft:'#62626a',w:'#2f7fd0',na:'#2e9a4c',cl:'#8c9a1c',k:'#7a4fc0',o:'#d9534f',rj:'#C11430',cell:'#d5433f',atp:'#b8424f'};
const PORE=[0,5].map(i=>M.pts('AQP').slice(i,i+5).map(q=>[AX+q[1]*SC,MY+q[2]*SC]));
const NAS=[-13,0,13].map(d=>[PX+d,MY]),ATPS=[PX-7*SC,MY+48*SC];
const RATE=9,AK=.27,DV=.025,BURST=1.62;
const cIn=V=>.54/(V-.4);

/* ---------------- the model ---------------- */
function newSim(){return {t:0,cOut:.9,V:1,Vt:1,burst:false,bt:0,cross:[],accI:0,accO:0,n:{in:0,out:0,cyc:0,na:0,k:0},ev:{i:[],o:[]},test:[],did:{},pump:null,showPump:false,flow:true};}
function recent(a,t,w){while(a.length&&a[0]<t-w)a.shift();return a.length;}
function step(sim,dt){sim.t+=dt;
  if(sim.flow){const ci=sim.burst?sim.cOut:cIn(sim.Vt);sim.accI+=RATE*Math.max(.05,1-AK*sim.cOut)*dt;sim.accO+=RATE*Math.max(.05,1-AK*ci)*dt;
    for(const d of [1,-1]){const k=d>0?'accI':'accO';while(sim[k]>=1){sim[k]-=1;if(!sim.burst)sim.Vt=clamp(sim.Vt+d*DV,.52,2);const s=sim.t*7.3+sim.cross.length;sim.cross.push({d,pore:Math.random()<.5?0:1,p:0,sx:(hash(s)-.5)*150,sy:30+hash(s+.3)*70,ex:(hash(s+.6)-.5)*170,ey:36+hash(s+.9)*80});}}}
  for(const c of sim.cross){c.p+=dt/1.5;if(c.p>=1){if(c.d>0){sim.n.in++;sim.ev.i.push(sim.t);}else{sim.n.out++;sim.ev.o.push(sim.t);}if(!sim.burst)sim.V=clamp(sim.V+c.d*DV,.5,2);}}
  sim.cross=sim.cross.filter(c=>c.p<1);
  if(!sim.burst&&sim.V>=BURST){sim.burst=true;sim.bt=sim.t;}
  for(const q of sim.test){q.p+=dt/(q.k==='na'?2.6:2.2);if(q.p>=1)sim.did[q.k]=1;}sim.test=sim.test.filter(q=>q.p<1);
  if(sim.pump){sim.pump.p+=dt/4.2;if(sim.pump.p>=1){sim.pump=null;sim.n.cyc++;sim.n.na+=3;sim.n.k+=2;}}}

/* ---------------- drawing helpers ---------------- */
function dot(ctx,x,y,r,fill,stroke,lw){ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=lw||1.2;ctx.strokeStyle=stroke;ctx.stroke();}}
function shade(hex,k){const n=parseInt(hex.slice(1),16);const f=v=>Math.round(k>0?v+(255-v)*k:v*(1+k));return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')';}
function poly(pts,p){p=clamp(p,0,1);let L=0;const seg=[];for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(d);L+=d;}
  let s=p*L;for(let i=0;i<seg.length;i++){if(s<=seg[i]||i===seg.length-1){const k=seg[i]?s/seg[i]:0;return [lerp(pts[i][0],pts[i+1][0],k),lerp(pts[i][1],pts[i+1][1],k)];}s-=seg[i];}return pts[pts.length-1];}
const waterDot=(ctx,x,y,a)=>{ctx.globalAlpha=a==null?1:a;dot(ctx,x,y,3.6,C.w,shade(C.w,-.4),1);ctx.globalAlpha=1;};
function ion(ctx,x,y,col,lab,a){ctx.globalAlpha=(a==null?1:a)*.5;dot(ctx,x,y,9.5,'#d6e9f8','#8fb8de',1);ctx.globalAlpha=a==null?1:a;dot(ctx,x,y,5,col,shade(col,-.45),1);if(lab)txt(ctx,lab,x,y-12,{s:11.5,w:700,a:'center',c:shade(col,-.45)});ctx.globalAlpha=1;}
function chip(ctx,s,x,y,o){o=o||{};return pill(ctx,s,x,y,Object.assign({bg:'#fff',c:C.ink,bd:C.ink,s:16,w:700,a:'left',r:8,lw:2},o));}
function tag(ctx,s,x,y){pill(ctx,s,x,y,{bg:C.ink,c:'#fff',bd:null,s:13.5,w:700,a:'right',r:5});}
let TEX=null;
function texture(){if(TEX)return TEX;TEX=document.createElement('canvas');TEX.width=CW;TEX.height=H;const x=TEX.getContext('2d');x.fillStyle='rgba(47,127,208,.2)';   // water fills both sides, packed close
  for(let j=0;j<H/7.4;j++)for(let i=0;i<CW/7.4;i++){const s=i*31.7+j*17.3;x.beginPath();x.arc(i*7.4+hash(s)*5,j*7.4+hash(s+.5)*5,2.6,0,6.2832);x.fill();}return TEX;}

/* ---------------- the close-up: one patch of a red blood cell's membrane, everything at one scale ---------------- */
function drawClose(ctx,sim,o){o=o||{};const t=sim.t,y0=MY-HM,y1=MY+HM;
  ctx.fillStyle=C.out;ctx.fillRect(0,0,CW,MY);ctx.fillStyle=C.ins;ctx.fillRect(0,MY,CW,H-MY);ctx.drawImage(texture(),0,0);
  ctx.fillStyle='#f6ead4';ctx.fillRect(0,y0,CW,y1-y0);
  ctx.strokeStyle=C.tail;ctx.lineWidth=2.2;ctx.beginPath();const sp=8*SC,hr=3.2*SC,tl=12.5*SC;
  for(let x=sp/2;x<CW;x+=sp){ctx.moveTo(x-3,y0+hr*2);ctx.lineTo(x-3,y0+hr*2+tl);ctx.moveTo(x+3,y0+hr*2);ctx.lineTo(x+3,y0+hr*2+tl);ctx.moveTo(x-3,y1-hr*2);ctx.lineTo(x-3,y1-hr*2-tl);ctx.moveTo(x+3,y1-hr*2);ctx.lineTo(x+3,y1-hr*2-tl);}ctx.stroke();
  for(let x=sp/2;x<CW;x+=sp){dot(ctx,x,y0+hr,hr,C.head,'#b89238',1);dot(ctx,x,y1-hr,hr,C.head,'#b89238',1);}
  M.draw(ctx,'AQP',AX,MY,SC);if(sim.showPump)M.draw(ctx,'NAK',PX,MY,SC);
  {const w=txt(ctx,'OUTSIDE THE CELL',14,24,{s:15,w:700,c:'#2c5f8a',halo:4});txt(ctx,o.outLab||'(blood plasma)',22+w,24,{s:15,c:'#2c5f8a',halo:4});}
  txt(ctx,'INSIDE THE CELL',14,H-12,{s:15,w:700,c:'#8a3a36',halo:4});
  ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(600,H-18);ctx.lineTo(600+50*SC,H-18);ctx.moveTo(600,H-25);ctx.lineTo(600,H-11);ctx.moveTo(600+50*SC,H-25);ctx.lineTo(600+50*SC,H-11);ctx.stroke();txt(ctx,'5 nanometers',660,H-26,{s:14.5,w:600,a:'center',halo:4});
  if(!sim.showPump)txt(ctx,'the membrane: two layers of fat molecules',CW-14,MY+5,{s:14,w:600,a:'right',c:'#6b5320',halo:4});
  {let x=196;for(const [col,lab] of [[C.w,'water'],[C.na,'Na⁺'],[C.cl,'Cl⁻'],[C.k,'K⁺']]){dot(ctx,x,H-17,5,col,shade(col,-.45),1);x+=10;x+=txt(ctx,lab,x,H-12,{s:14,w:600,halo:4})+22;}}
  txt(ctx,'water channel',AX,y0-64,{s:16,w:700,a:'center',c:'#1f4f86',halo:4.5});txt(ctx,'(aquaporin)',AX,y0-46,{s:14,a:'center',c:'#1f4f86',halo:4});
  if(sim.showPump){txt(ctx,'sodium-potassium pump',PX+10,36,{s:16,w:700,a:'center',c:'#7a3f1c',halo:4.5});}
  // dissolved particles, in true proportion to the water: about 1 for every 185 waters at blood strength
  const nOut=Math.round(15*sim.cOut/.9),ci=sim.burst?sim.cOut:cIn(Math.max(.52,sim.V)),nIn=Math.round(22*ci/.9);
  for(let i=0;i<nOut;i++){const x=24+hash(i*3.1+1)*(CW-48)+Math.sin(t*.6+i)*7,y=44+hash(i*5.7+2)*(y0-76)+Math.cos(t*.5+i*1.7)*6;if(Math.abs(x-AX)<70&&y>y0-84)continue;ion(ctx,x,y,i%2?C.cl:C.na);}
  for(let i=0;i<nIn;i++){const x=24+hash(i*4.3+7)*(CW-48)+Math.sin(t*.55+i*2)*7,y=y1+30+hash(i*6.1+3)*(H-y1-70)+Math.cos(t*.45+i)*6;if(sim.showPump&&Math.abs(x-PX)<120)continue;ion(ctx,x,y,i%3?C.k:C.cl);}
  // a few waters picked out so you can follow them; then the ones on their way through a channel
  for(let i=0;i<26;i++)waterDot(ctx,30+hash(i*2.3+11)*(CW-60)+Math.sin(t*1.1+i*1.3)*9,40+hash(i*7.9+5)*(y0-70)+Math.cos(t*.9+i)*8,.9);
  for(let i=0;i<34;i++)waterDot(ctx,30+hash(i*3.7+17)*(CW-60)+Math.sin(t+i*1.9)*9,y1+26+hash(i*5.3+9)*(H-y1-60)+Math.cos(t*.8+i*1.1)*8,.9);
  for(const c of sim.cross){const path=c.d>0?PORE[c.pore]:PORE[c.pore].slice().reverse(),a=path[0],b=path[4],sx=a[0]+c.sx,sy=c.d>0?a[1]-c.sy:a[1]+c.sy,ex=b[0]+c.ex,ey=c.d>0?b[1]+c.ey:b[1]-c.ey;
    let x,y;if(c.p<.3){const k=ease(c.p/.3);x=lerp(sx,a[0],k);y=lerp(sy,a[1],k);}else if(c.p<.72){[x,y]=poly(path,(c.p-.3)/.42);}else{const k=ease((c.p-.72)/.28);x=lerp(b[0],ex,k);y=lerp(b[1],ey,k);}
    dot(ctx,x,y,5,'#fff','#0f4f9a',2);dot(ctx,x,y,2.6,'#0f4f9a');}
  // step 3: what gets through the wall on its own?
  for(const q of sim.test){const p=q.p;
    if(q.k==='o2'){const y=lerp(60,H-90,ease(p)),x=430+Math.sin(p*9)*5;dot(ctx,x-5,y,5.5,C.o,'#7d1f1c',1);dot(ctx,x+5,y,5.5,C.o,'#7d1f1c',1);txt(ctx,'O₂',x+16,y+5,{s:14,w:700,c:'#7d1f1c',halo:4});}
    else if(q.k==='na'){const k=p<.5?ease(p/.5):1-ease((p-.5)/.5),y=lerp(60,y0-12,k);ion(ctx,520,y,C.na,'Na⁺');if(p>.42&&p<.62)pill(ctx,'blocked',520,y0-44,{bg:C.rj,c:'#fff',bd:null,s:14,w:700});}
    else{const path=PORE[0],a=path[0],b=path[4];let x,y;if(p<.3){x=a[0];y=lerp(60,a[1],ease(p/.3));}else if(p<.72)[x,y]=poly(path,(p-.3)/.42);else{x=b[0];y=lerp(b[1],H-90,ease((p-.72)/.28));}dot(ctx,x,y,6,'#fff','#0f4f9a',2.2);dot(ctx,x,y,3,'#0f4f9a');txt(ctx,'water',x+12,y+5,{s:14,w:700,c:'#0f4f9a',halo:4});}}
  // the pump: 3 Na⁺ out and 2 K⁺ in for one ATP
  if(sim.showPump){dot(ctx,ATPS[0],ATPS[1],4,'#ffe58a','rgba(60,30,0,.8)',1);
    const pm=sim.pump;if(pm){const p=pm.p,L=(a,b,k)=>lerp(a,b,ease(clamp(k,0,1)));
      if(p<.7)for(let i=0;i<3;i++){const s=NAS[i];let x=s[0],y=s[1];if(p<.25){x=L(PX-90+i*60,s[0],p/.25);y=L(MY+150,s[1],p/.25);}else if(p>.42){x=L(s[0],PX-70+i*70,(p-.42)/.26);y=L(s[1],MY-150-i*12,(p-.42)/.26);}ion(ctx,x,y,C.na,'Na⁺',p>.62?(.7-p)/.08:1);}
      if(p>.24&&p<.46){pill(ctx,p<.34?'ATP':'ADP + P',ATPS[0]-66,ATPS[1],{bg:'#fde9ec',c:'#8a1f33',bd:C.atp,s:15,w:700});arrow(ctx,ATPS[0]-30,ATPS[1],ATPS[0]-7,ATPS[1],{c:C.atp,lw:2.5,head:9});}
      if(p>.6)for(let i=0;i<2;i++){const s=NAS[i*2];let x=s[0],y=s[1];if(p<.8){x=L(PX-60+i*110,s[0],(p-.6)/.2);y=L(MY-150,s[1],(p-.6)/.2);}else{x=L(s[0],PX-70+i*130,(p-.8)/.2);y=L(s[1],MY+170,(p-.8)/.2);}ion(ctx,x,y,C.k,'K⁺',p>.95?(1-p)/.05:1);}}
    else for(const s of NAS)dot(ctx,s[0],s[1],3,'#ffe58a','rgba(60,30,0,.8)',1);}
}

/* ---------------- the whole cell: a red blood cell seen edge-on ---------------- */
const RP={x:985,y:250};
function cellPath(ctx,V,cx,cy,k){k=k||1;const up=clamp((V-1)/.62,0,1),dn=clamp((1-V)/.45,0,1),a=150*k*(V>=1?lerp(1,.76,up):lerp(1,.8,dn)),hh=44*k*(V>=1?lerp(1,2.55,up):lerp(1,.72,dn)),d=V>=1?lerp(.36,1,up):.36;
  ctx.beginPath();for(let i=0;i<=120;i++){const th=i/120*6.2832,c=Math.cos(th),s=Math.sin(th),sp=1+dn*.09*Math.sin(th*13),x=cx+a*c*sp,y=cy+hh*s*(d+(1-d)*c*c)*sp;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();}
function drawCell(ctx,sim,o){o=o||{};rr(ctx,CW+10,8,W-CW-18,H-16,12);ctx.fillStyle='#fffdf7';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#d9d4c6';ctx.stroke();
  tag(ctx,'THE WHOLE CELL, SEEN EDGE-ON',W-18,26);const t=sim.t;
  if(sim.burst){const k=clamp((t-sim.bt)/1.2,0,1);ctx.setLineDash([7,6]);cellPath(ctx,BURST,RP.x,RP.y);ctx.lineWidth=2.5;ctx.strokeStyle='#c98a86';ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<70;i++){const a=hash(i+1)*6.28,r=(30+hash(i+9)*150)*k;ctx.globalAlpha=.55*(1-k*.4);dot(ctx,RP.x+Math.cos(a)*r,RP.y+Math.sin(a)*r*.75,4,C.cell);}ctx.globalAlpha=1;
    pill(ctx,'the cell burst',RP.x,RP.y,{bg:C.rj,c:'#fff',bd:null,s:18,w:700});}
  else{cellPath(ctx,sim.V,RP.x,RP.y);const g=ctx.createLinearGradient(0,RP.y-110,0,RP.y+110);g.addColorStop(0,'#e5605a');g.addColorStop(1,'#b93430');ctx.fillStyle=g;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#8f2622';ctx.stroke();}
  txt(ctx,'a red blood cell, about 8 micrometers across',RP.x,RP.y+140,{s:13.5,a:'center',c:C.soft});
  // how much water is inside, against normal
  const bx=CW+40,bw=W-CW-80,by=430,fx=v=>bx+bw*(v-.4)/1.4;txt(ctx,'Water inside the cell',bx,by-14,{s:15,w:700});
  rr(ctx,bx,by,bw,20,6);ctx.fillStyle='#eee9dc';ctx.fill();const v=sim.burst?BURST:sim.V;rr(ctx,bx,by,Math.max(8,fx(v)-bx),20,6);ctx.fillStyle=sim.burst?'#c98a86':C.w;ctx.fill();
  for(const [val,lab,col] of [[1,'normal',C.ink],[BURST,'bursts',C.rj]]){ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx(val),by-5);ctx.lineTo(fx(val),by+25);ctx.stroke();txt(ctx,lab,fx(val),by+42,{s:13.5,a:'center',c:col,w:600});}
  if(o.counts!==false){const ri=recent(sim.ev.i,t,5),ro=recent(sim.ev.o,t,5);chip(ctx,'Waters in (last 5 s): '+ri,bx,by+82,{c:'#0f4f9a',bd:C.w,s:15.5});chip(ctx,'Waters out (last 5 s): '+ro,bx,by+116,{c:'#0f4f9a',bd:C.w,s:15.5});}
  const ciT=cIn(sim.Vt),st=sim.burst?'':Math.abs(sim.cOut-ciT)<.16?(sim.V<.93?'In = out again, at a smaller size.':sim.V>1.07?'In = out again, at a bigger size.':'In = out. The cell holds its size.'):sim.cOut>ciT?'More water out than in. The cell is shrinking.':'More water in than out. The cell is swelling.';
  if(st)txt(ctx,st,RP.x,74,{s:15.5,w:700,a:'center',c:C.ink});
  txt(ctx,'Outside: '+sim.cOut.toFixed(1)+'% salt'+(sim.cOut>3.4?' (seawater)':Math.abs(sim.cOut-.9)<.05?' (same as blood)':sim.cOut<.05?' (pure water)':''),RP.x,100,{s:14.5,a:'center',c:'#2c5f8a'});}

function scene(ctx,S,o){drawClose(ctx,S.sim,o);drawCell(ctx,S.sim,o);}
function setup(S,o){const sim=S.sim=newSim();Object.assign(sim,o||{});return sim;}

/* ---------------- the sea, and the zoom from you to the membrane ---------------- */
function drawSea(ctx,S,hook){const g=ctx.createLinearGradient(0,0,0,330);g.addColorStop(0,'#bfe3f7');g.addColorStop(1,'#eef8fd');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);dot(ctx,1010,96,46,'#ffd95a','#f0b400',3);
  ctx.fillStyle='#2f7fb8';ctx.fillRect(0,330,W,H-330);ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=3;ctx.lineCap='round';const t=S.t||0;
  for(let j=0;j<6;j++)for(let i=0;i<9;i++){const x=40+i*140+(j%2)*70+Math.sin(t*.6+j)*8,y=360+j*42;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+18,y-9,x+36,y);ctx.stroke();}
  ctx.fillStyle='#b98a52';rr(ctx,430,318,330,26,8);ctx.fill();ctx.strokeStyle='#7d5a30';ctx.lineWidth=2.5;ctx.stroke();
  ctx.strokeStyle='#3b3b42';ctx.fillStyle='#3b3b42';ctx.lineWidth=9;ctx.lineJoin='round';dot(ctx,566,236,17,'#3b3b42');ctx.beginPath();ctx.moveTo(566,254);ctx.lineTo(560,304);ctx.lineTo(618,306);ctx.lineTo(650,316);ctx.moveTo(564,270);ctx.lineTo(602,286);ctx.stroke();
  if(hook){pill(ctx,'day 2 on the raft: no fresh water left',596,150,{bg:'#fff',c:C.ink,bd:C.ink,s:17,w:700});pill(ctx,'water everywhere: about 3.5% salt',260,470,{bg:'#fff',c:'#1f4f86',bd:'#1f4f86',s:17,w:700});}}
function drawBlood(ctx){ctx.fillStyle='#fbf1df';ctx.fillRect(0,0,W,H);for(let i=0;i<46;i++){const x=hash(i*3.3+1)*W,y=hash(i*7.1+2)*H,r=54+hash(i)*10,sq=.45+hash(i+5)*.55;ctx.save();ctx.translate(x,y);ctx.rotate(hash(i+3)*3);ctx.scale(1,sq);dot(ctx,0,0,r,'#d5433f','#8f2622',3);dot(ctx,0,0,r*.45,'#bf3a36');ctx.restore();}}
function drawOne(ctx){ctx.fillStyle='#fbf1df';ctx.fillRect(0,0,W,H);cellPath(ctx,1,600,300,3.4);const g=ctx.createLinearGradient(0,150,0,450);g.addColorStop(0,'#e5605a');g.addColorStop(1,'#b93430');ctx.fillStyle=g;ctx.fill();ctx.lineWidth=7;ctx.strokeStyle='#8f2622';ctx.stroke();}
const BOX=[{x:584,y:262,w:44},{x:560,y:272,w:150},{x:566,y:237,w:36}],WIDE=[4,1.1e-4,1.2e-5,5e-8];
const LEVELS=[(ctx,S)=>drawSea(ctx,S,false),ctx=>drawBlood(ctx),ctx=>drawOne(ctx),(ctx,S)=>scene(ctx,S,{counts:false})];
function lvl(ctx,k,S){ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();LEVELS[k](ctx,S);ctx.restore();}
function drawZoom(ctx,S,z){const k=Math.min(2,Math.floor(z)),f=z>=3?1:z-k,b=BOX[k],bh=b.w*H/W;
  const w=W*Math.pow(b.w/W,f),r=(w-b.w)/(W-b.w),cx=b.x+b.w/2+(W/2-b.x-b.w/2)*r,cy=b.y+bh/2+(H/2-b.y-bh/2)*r,s=W/w;
  ctx.save();ctx.translate(W/2,H/2);ctx.scale(s,s);ctx.translate(-cx,-cy);lvl(ctx,k,S);
  const a=ease((f-.3)/.5);if(a>0){ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.w/W,b.w/W);ctx.globalAlpha=a;lvl(ctx,k+1,S);ctx.restore();}
  ctx.globalAlpha=1-ease((f-.05)/.4);ctx.lineWidth=3/s;ctx.strokeStyle=C.rj;ctx.strokeRect(b.x,b.y,b.w,bh);ctx.restore();ctx.globalAlpha=1;
  const near=z>=3?3:(f<.1?k:f>.9?k+1:-1);
  if(near>=0&&near<3){const wd=WIDE[near],u=wd>=.5?[wd,'meters']:wd>=1e-4?[wd*1e3,'millimeters']:[wd*1e6,'micrometers'];
    pill(ctx,'This picture is about '+(u[0]>=10?Math.round(u[0]):u[0].toFixed(1))+' '+u[1]+' wide',W-16,H-24,{a:'right',bg:'#fff',c:C.ink,bd:C.ink,s:16,w:700,r:8});
    const mag=WIDE[0]/wd;if(mag>1.5)pill(ctx,'Zoomed in about '+(mag>=1e6?Math.round(mag/1e6)+' million':mag>=1e3?Math.round(mag/1e3)+' thousand':Math.round(mag))+' times',16,H-24,{a:'left',bg:C.ink,c:'#fff',bd:null,s:16,w:700,r:8});}
  else if(near<0)pill(ctx,'zooming in…',W-16,H-24,{a:'right',bg:'#fff',c:C.soft,bd:'#a9afb8',s:16,w:600,r:8});}
let zAnim=null;

/* ---------------- tell it back ---------------- */
function crop(ctx,x,y,w,fn){ctx.save();ctx.beginPath();ctx.rect(0,0,300,193.3);ctx.clip();const s=300/w;ctx.scale(s,s);ctx.translate(-x,-y);fn();ctx.restore();}
function still(o){return Object.assign(newSim(),o);}
const cellPic=(V,lab,burst)=>ctx=>{ctx.save();ctx.beginPath();ctx.rect(0,0,300,193.3);ctx.clip();ctx.fillStyle='#fffdf7';ctx.fillRect(0,0,300,194);
  if(burst){ctx.setLineDash([6,5]);cellPath(ctx,BURST,150,92,.8);ctx.lineWidth=2;ctx.strokeStyle='#c98a86';ctx.stroke();ctx.setLineDash([]);for(let i=0;i<40;i++){const a=hash(i+1)*6.28,r=20+hash(i+9)*90;ctx.globalAlpha=.5;dot(ctx,150+Math.cos(a)*r,92+Math.sin(a)*r*.7,3.5,C.cell);}ctx.globalAlpha=1;}
  else{cellPath(ctx,V,150,92,.8);ctx.fillStyle='#d5433f';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#8f2622';ctx.stroke();}
  txt(ctx,lab,150,180,{s:14,w:700,a:'center'});ctx.restore();};
const FRAMES=[
  {label:'The membrane blocks salt, but water has its own channels',draw:ctx=>crop(ctx,90,60,470,()=>drawClose(ctx,still({test:[{k:'na',p:.5}],t:1}),{}))},
  {label:'In blood, the salt matches: water goes in and out equally',draw:cellPic(1,'in = out')},
  {label:'Seawater puts about four times as much salt outside',draw:ctx=>crop(ctx,90,0,470,()=>drawClose(ctx,still({cOut:3.5,t:1}),{outLab:'(seawater)'}))},
  {label:'Fewer free waters go in than come out: osmosis',draw:ctx=>crop(ctx,110,110,300,()=>{drawClose(ctx,still({cOut:3.5,t:1,cross:[{d:-1,pore:0,p:.5,sx:0,sy:40,ex:0,ey:40},{d:-1,pore:1,p:.8,sx:0,sy:40,ex:10,ey:50}]}),{outLab:'(seawater)'});arrow(ctx,AX-70,MY+70,AX-70,MY-70,{c:'#0f4f9a',lw:6,head:16});})},
  {label:'The cell loses water and shrivels',draw:cellPic(.56,'less water inside')},
  {label:'So drinking seawater leaves you with less water, not more',draw:ctx=>crop(ctx,330,130,480,()=>drawSea(ctx,{t:0},false))}
];
const PICK=['They soak it up and swell','They lose water and shrivel','Nothing: water is water','The salt gets into them and poisons them'];


/* ---------- "Who used this" (Nov 24, 2026): Dr. Dilip Mahalanabis and oral rehydration ----------
   Sources: Bulletin of the WHO 2001;79(5):471-472 (camp case-fatality about 3% vs 20-30% in IV-only camps);
   Bulletin of the WHO 2009;87:91-92 (interview: clinicians resisted untrained people giving ORS; drums with nozzles, cups and mugs);
   Our World in Data, "Oral rehydration therapy" (about 70 million lives saved since the late 1970s, an estimate). */
function whoCamp(ctx,S){const k=Math.round(S.v.k),x0=50,y0=142,gap=40;
  // a drum with a tap, and cups: how the drink reached each patient
  ctx.save();ctx.fillStyle='#5b6b7c';rr(ctx,70,40,70,90,10);ctx.fill();ctx.fillStyle='#46525f';ctx.fillRect(70,60,70,6);ctx.fillRect(70,104,70,6);ctx.fillStyle='#8a99a8';ctx.fillRect(140,96,16,8);
  for(let c=0;c<3;c++){ctx.fillStyle='#d9c9a8';rr(ctx,176+c*40,98,26,30,4);ctx.fill();}
  txt(ctx,S.v.cm==='ors'?'Sugar-salt drink, given by family members':'IV fluid only (and it ran short)',260,74,{s:17,w:700,c:'#26262b'});ctx.restore();
  // 100 patients
  for(let i=0;i<100;i++){const r=Math.floor(i/10),c=i%10,x=x0+c*gap+20,y=y0+r*gap+20,dead=i>=100-k;
    ctx.fillStyle=dead?'#C11430':'#2f8f6a';ctx.beginPath();ctx.arc(x,y-8,7,0,7);ctx.fill();rr(ctx,x-8,y,16,14,6);ctx.fill();}
  txt(ctx,S.v.cm==='ors'?'About 3 of every 100 died':'About 20 to 30 of every 100 died',x0+gap*5+20,y0+gap*10+26,{s:19,w:700,c:'#C11430',a:'center'});
  whyGut(ctx,S,500,130,370,420);}
/* why the drink works: sodium and sugar go in together through one door in the gut wall, and water follows the salt */
function whyGut(ctx,S,x,y,w,h){const on=S.v.cm==='ors',t=S.t;ctx.save();rr(ctx,x,y,w,h,12);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#d5d9de';ctx.stroke();
  txt(ctx,'Why the drink works',x+16,y+28,{s:16,w:700,c:'#26262b'});txt(ctx,'inside the gut',x+16,y+60,{s:13.5,c:'#62626a'});txt(ctx,'gut wall',x+16,y+h*.52,{s:13.5,c:'#62626a'});txt(ctx,'blood',x+16,y+h-18,{s:13.5,c:'#62626a'});
  const wy=y+h*.42,wh=h*.2;ctx.fillStyle='#f3d9c9';ctx.fillRect(x+90,wy,w-110,wh);ctx.strokeStyle='#d9b29a';for(let i=0;i<6;i++){ctx.strokeRect(x+90+i*(w-110)/6,wy,(w-110)/6,wh);}
  const dx=x+90+(w-110)*.5;ctx.fillStyle='#7a5ad0';rr(ctx,dx-16,wy-4,32,wh+8,8);ctx.fill();
  if(!on){txt(ctx,'Plain water alone: the gut',x+w/2+40,y+h*.82,{s:14,c:'#26262b',a:'center'});txt(ctx,'pushes salt and water out',x+w/2+40,y+h*.82+20,{s:14,c:'#26262b',a:'center'});ctx.restore();return;}
  // a sodium and a sugar travel down through the door together, over and over; water dots follow beside the door
  for(let k=0;k<3;k++){const u=((t*.35+k/3)%1),py=lerp(y+80,y+h-40,u);
    ctx.fillStyle='#2e9a4c';ctx.beginPath();ctx.arc(dx-8,py,7,0,7);ctx.fill();
    ctx.fillStyle='#df741a';ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx[i?'lineTo':'moveTo'](dx+9+8*Math.cos(a),py+8*Math.sin(a));}ctx.closePath();ctx.fill();
    for(let j=0;j<3;j++){const v=((t*.3+k/3+j*.08)%1),qy=lerp(y+80,y+h-40,v);ctx.fillStyle='#2f7fd0';ctx.beginPath();ctx.arc(dx+60+j*22,qy,5,0,7);ctx.fill();}}
  txt(ctx,'Na⁺ + sugar go in together',dx-150,y+88,{s:13.5,w:700,c:'#2e9a4c'});txt(ctx,'water follows the salt',x+w-12,y+h-56,{s:13.5,w:700,c:'#2f7fd0',a:'right'});
  ctx.restore();}
function whoPanel(ctx,S){const x=900;ctx.fillStyle='#fff';ctx.strokeStyle='#d5d9de';ctx.lineWidth=1;rr(ctx,x,24,280,552,12);ctx.fill();ctx.stroke();
  txt(ctx,'How he got there',x+18,58,{s:17,w:700,c:'#26262b'});
  const L=[['A children\'s doctor','trained in Kolkata, India'],['1966','starts studying oral rehydration at a research center in Kolkata'],['1971','runs a refugee-camp health center and uses it for everyone'],['The hard part','many doctors thought only IV fluid by trained staff was safe'],['Since the late 1970s','about 70 million lives saved (estimate)']];
  let y=92;L.forEach(([h,b])=>{txt(ctx,h,x+18,y,{s:14.5,w:700,c:'#C11430'});y+=20;const words=b.split(' ');let line='';
    for(const w of words){const t=line?line+' '+w:w;ctx.font='500 14px "Segoe UI",system-ui,sans-serif';if(ctx.measureText(t).width>240){txt(ctx,line,x+18,y,{s:14,c:'#26262b'});y+=19;line=w;}else line=t;}if(line){txt(ctx,line,x+18,y,{s:14,c:'#26262b'});y+=19;}y+=12;});
  txt(ctx,'Sources: WHO Bulletin 2001 and 2009;',x+18,540,{s:12,c:'#62626a'});txt(ctx,'Our World in Data.',x+18,556,{s:12,c:'#62626a'});}

Story.start({
  id:'transport',title:'Why can’t you drink seawater?',W,H,views:true,labHref:'../index.html#transport',
  about:'<p><b>Two ways to see it.</b> <b>Real shape</b> shows each protein as it was measured. <b>Simple drawing</b> shows the same outline smoothed and filled flat, the way a textbook or a test draws it.</p><p><b>The shapes and sizes are real.</b> The water channel is aquaporin-1 taken from human red blood cells, and the pump is the human sodium-potassium pump holding three sodium ions (Protein Data Bank entries 7UZE and 7E1Z, both found by cryo-electron microscopy). The membrane, the proteins, the water molecules and the ions are all drawn to one scale: the bar is 5 nanometers. The number of dissolved particles is in true proportion too: in blood, about 1 for every 185 water molecules.</p><p><b>What is simplified.</b> Colors are labels. Water really fills both sides, packed tight; the pale dots stand for it, and a few waters are drawn darker so you can follow them. The inside of a real red blood cell is crowded with hemoglobin, the protein that carries oxygen; it is left out so you can see the water. The real imbalance of water going in and out is small, under 1 in 100. It matters because one channel passes about 3 billion waters a second and a cell has thousands of channels; here the imbalance is made bigger so you can see it. The real pump changes shape at each step; here it stays in one measured shape. “Salt” stands for everything dissolved.</p><p><b>The numbers.</b> Blood is about 0.9% salt and seawater about 3.5%. A red blood cell bursts when the outside falls to about half the strength of blood. The pump moves 3 Na⁺ out and 2 K⁺ in for each ATP.</p><p><b>Who used this.</b> The camp numbers in step 10 (about 3 deaths per 100 with the drink, 20 to 30 in camps using IV fluid alone) are from the Bulletin of the World Health Organization (2001 and 2009). The 70 million lives saved is an estimate from Our World in Data. No home recipe is given here on purpose: the right amounts matter, so follow a health worker or an ORS packet.</p>',
  tell:{frames:FRAMES,terms:['membrane','channel|aquaporin','salt|solute|dissolved','water','osmosis','shrink|shrivel','concentrat|saltier|salty','diffus|spread'],
    nudge:'For each picture ask: what had to be true just before this could happen?',
    done:'<b>That is the story.</b> Now tell it in your own words.',
    prompt:'You are stuck on a raft with no fresh water. Why would drinking seawater make things worse? Tell the story. Use “because” and “so”.',placeholder:'Seawater has more salt than… because… so…'},
  chapters:[
  {rail:'The question',title:'Water, water everywhere',views:false,
   predict:{key:'sea',q:'You are adrift on a raft, out of fresh water, with an ocean all around you. If you drink seawater, what happens to the cells in your body?',opts:PICK,right:1,after:'<b>Locked in.</b> Now go and look at one cell.'},
   text:'<p class="why">Take your best guess. You will test it in step 9.</p>',
   enter(S){setup(S);},draw(ctx,S){drawSea(ctx,S,true);}},

  {rail:'Zoom in',title:'Go down to one cell',live:true,
   text(S){const z=S.v.z||0;return z<.5?'What you drink ends up in your blood, and your blood bathes your cells. <b>Zoom in</b> to one of them.':
     z<1.5?'A drop of blood, full of red blood cells. They float in a salty liquid called plasma.':
     z<2.5?'One red blood cell, seen edge-on. Its skin is a <b class="term">membrane</b> a thousand times thinner than the cell is wide.':
     'A tiny patch of that membrane, with one water channel in it. Everything here is drawn to one scale. Switch between <b>Simple drawing</b> and <b>Real shape</b> above the picture.';},
   ui:[{type:'button',label:'Zoom in',pulse:true,act(S){const a=S.v.z,b=Math.min(3,Math.floor(a+.02)+1);zAnim={a,b,t:0};},show:S=>S.v.z<2.98},
       {type:'range',key:'z',min:0,max:3,step:.01,val:0,label:'Zoom',fmt:v=>['You','A drop of blood','One red blood cell','A patch of its membrane'][Math.round(v)],on(){zAnim=null;}}],
   todo:[{t:'Zoom all the way in',ok:S=>S.v.z>=2.97}],
   enter(S){setup(S,{flow:false});S.v.z=0;zAnim=null;},
   tick(S,dt){S.sim.t+=dt;if(zAnim){zAnim.t+=dt/2.3;S.v.z=lerp(zAnim.a,zAnim.b,ease(zAnim.t));if(zAnim.t>=1){S.v.z=zAnim.b;zAnim=null;}}},
   draw(ctx,S){drawZoom(ctx,S,S.v.z);}},

  {rail:'The wall',title:'A wall that picks what passes',live:true,
   text(S){const d=S.sim.did,n=Object.keys(d).length;return n<3?'The membrane is two layers of fat molecules. Send three things at it and see what gets through: oxygen, a salt ion (Na⁺), and water.':
     'Oxygen is small and has no charge, so it slips between the fats. A salt ion has a charge and drags a coat of water, so it is blocked. Water gets its own doorway: a <b class="term">channel</b> protein.';},
   alt:'Think of a chain-link fence. A marble rolls through the gaps. A beach ball does not. And there is a gate built for one kind of visitor only: water.',
   ui:[{type:'seg',key:'send',val:null,label:'Send at the membrane',opts:[{v:'o2',l:'Oxygen'},{v:'na',l:'Salt ion'},{v:'h2o',l:'Water'}],on(S,v){S.sim.test.push({k:v,p:0});}}],
   todo:[{t:'Send all three and watch each one',ok:S=>S.sim.did.o2&&S.sim.did.na&&S.sim.did.h2o}],
   enter(S){setup(S,{flow:false});},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){scene(ctx,S,{counts:false});}},

  {rail:'The doorway',title:'Water goes both ways',
   text:'Now watch the water channel run. Waters (dark blue) squeeze through one at a time, in <b>and</b> out. In blood, the salt outside matches the salt inside, so the two directions match and the cell keeps its size.',
   alt:'Picture a doorway between two equally crowded rooms. People wander through both ways at the same rate, so neither room empties.',
   todo:[{t:'Count 8 waters going in',ok:S=>S.sim.n.in>=8},{t:'Count 8 coming out',ok:S=>S.sim.n.out>=8}],
   enter(S){setup(S);},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){scene(ctx,S,{});chip(ctx,'In: '+S.sim.n.in,380,60,{c:'#0f4f9a',bd:C.w});chip(ctx,'Out: '+S.sim.n.out,380,96,{c:'#0f4f9a',bd:C.w});}},

  window.Water3D.chapter(C),

  {rail:'More salt',title:'Make the outside saltier',live:true,patience:60,
   text(S){const s=S.sim;return s.cOut<1.5?'Add salt to the outside. Salt cannot cross, but each salt ion holds a coat of water around itself. Watch what that does to the water going in.':
     'With more salt outside, fewer waters are free to enter, but just as many leave. The cell loses water and shrivels. Water moving toward the saltier side is called <b class="term">osmosis</b>.';},
   alt:'Two rooms again, but now one room is full of people holding hands with the furniture. They cannot walk to the door. More people leave the other room than arrive, so it empties.',
   ui:[{type:'range',key:'c',min:0,max:3.5,step:.1,val:.9,label:'Salt outside the cell',fmt:v=>v.toFixed(1)+'%',stops:[{v:.9,l:'blood'},{v:2,l:'2%'},{v:3.5,l:'seawater'}]}],
   todo:[{t:'Raise the salt outside to 2% or more',ok:S=>S.sim.cOut>=2},{t:'Watch the cell shrivel',ok:S=>S.sim.cOut>=2&&S.sim.V<.78}],
   enter(S){setup(S);S.v.c=.9;},tick(S,dt){S.sim.cOut=S.v.c;step(S.sim,dt);},
   draw(ctx,S){scene(ctx,S,{});}},

  {rail:'Pure water',title:'Now take the salt away',live:true,patience:70,
   predict:{key:'pure',q:'You put a red blood cell in pure water, with no salt outside at all. What happens to it?',opts:['It shrivels','Nothing changes','It swells until it bursts'],right:2,
     after:i=>i===2?'<b>You called it.</b> Slide the salt to zero and watch.':'<b>Locked in.</b> Slide the salt to zero and test it.'},
   text(S){const s=S.sim;return s.burst?'<b>It burst.</b> With no salt outside, water pours in faster than it leaves until the membrane gives way. That is why a hospital drip is salt water, never pure water.':'Slide the salt outside down to zero and watch both pictures.';},
   ui:[{type:'range',key:'c',min:0,max:3.5,step:.1,val:.9,label:'Salt outside the cell',fmt:v=>v.toFixed(1)+'%',stops:[{v:0,l:'pure water'},{v:.9,l:'blood'},{v:3.5,l:'seawater'}]}],
   todo:[{t:'Set the salt outside to 0%',ok:S=>S.sim.cOut<=.05},{t:'Watch what happens to the cell',ok:S=>S.sim.burst}],
   enter(S){setup(S);S.v.c=.9;},tick(S,dt){S.sim.cOut=S.v.c;step(S.sim,dt);},
   draw(ctx,S){scene(ctx,S,{});}},

  {rail:'The pump',title:'Moving salt takes work',
   text:'Salt cannot drift across on its own, so the cell moves it by force. The <b class="term">sodium-potassium pump</b> spends one ATP to push 3 Na⁺ out and bring 2 K⁺ in. Going against the crowd costs energy: that is <b class="term">active transport</b>.',
   alt:'Water rolling downhill through a pipe is free. Pumping it back uphill takes a motor and electricity. The channel is the pipe. This is the motor, and ATP is its electricity.',
   ui:[{type:'button',label:'Give the pump one ATP',pulse:true,act(S){if(!S.sim.pump)S.sim.pump={p:0};}}],
   todo:[{t:'Run the pump 3 times',ok:S=>S.sim.n.cyc>=3}],
   enter(S){setup(S,{showPump:true});},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){const n=S.sim.n;scene(ctx,S,{counts:false});chip(ctx,'ATP spent: '+n.cyc,24,60,{c:'#8a1f33',bd:C.atp});chip(ctx,'Na⁺ pushed out: '+n.na,24,96,{c:shade(C.na,-.4),bd:C.na});chip(ctx,'K⁺ brought in: '+n.k,24,H-48,{c:shade(C.k,-.35),bd:C.k});}},

  {rail:'Seawater',title:'So why not drink seawater?',live:true,patience:60,
   text(S){const s=S.sim,p=S.picks.sea;return s.cOut<3?'Now run the real test. Swap the blood plasma outside the cell for seawater, which is about four times as salty.':
     (p===1?'You called it. ':p==null?'':'Not “'+PICK[p].toLowerCase()+'”. ')+'Seawater makes your blood saltier, so water leaves your cells and they shrivel. Your kidneys cannot make urine as salty as seawater, so flushing the salt out costs more water than you drank.';},
   alt:'Drinking seawater is like paying a $4 fee to deposit $3. Every sip costs your body more water than it brings in.',
   ui:[{type:'seg',key:'sw',val:0,label:'Outside the cell',opts:[{v:0,l:'Blood plasma (0.9%)'},{v:1,l:'Seawater (3.5%)'}],on(S,v){S.sim.cOut=v?3.5:.9;}}],
   todo:[{t:'Switch the outside to seawater',ok:S=>S.sim.cOut>3},{t:'Watch the cell',ok:S=>S.sim.cOut>3&&S.sim.V<.62}],
   enter(S){setup(S,{showPump:true});S.v.sw=0;},tick(S,dt){step(S.sim,dt);},
   draw(ctx,S){scene(ctx,S,{outLab:S.sim.cOut>3?'(seawater)':'(blood plasma)'});}},

  {rail:'Who did it',title:'Who used this to save lives: Dr. Dilip Mahalanabis',live:true,views:false,
   text(S){return S.v.cm==='ors'?
     'He had family members give the sick a drink of <b>sugar and salt in clean water</b>, from drums with taps. Deaths fell to about <b>3 in 100</b>. '+
     'Why it works is this story: a door in the gut wall lets sodium in only together with sugar, and water follows the salt (osmosis). '+
     'Many doctors called it second-class medicine. He kept going. Today this drink, oral rehydration solution, is estimated to have saved about <b>70 million lives</b>.':
     '<b>1971</b>, a refugee camp during Bangladesh\'s war for independence. Cholera drains the body of water and salt, and the camp ran short of IV fluid. '+
     'In camps that relied on IV drips alone, about <b>20 to 30 of every 100</b> cholera patients died. Each dot is one patient. <b>Switch to what Dr. Mahalanabis did.</b>';},
   alt:'Plain water alone does not stay in a cholera patient: the gut is pushing salt and water out. Adding salt and sugar opens a second way in. Sugar and sodium enter the gut wall together, and the water follows the salt, the same way water followed the salt in every step of this story.',
   ui:[{type:'seg',key:'cm',val:'iv',label:'Camp',opts:[{v:'iv',l:'IV drips only'},{v:'ors',l:'Sugar-salt drink by mouth'}]}],
   todo:[{t:'See what changed with the drink',ok:S=>S.v.cm==='ors'}],
   enter(S){S.v.cm='iv';S.v.k=25;},tick(S,dt){const tg=S.v.cm==='ors'?3:25;S.v.k+=(tg-S.v.k)*Math.min(1,dt*2.5);},
   draw(ctx,S){ctx.fillStyle='#f6f3ec';ctx.fillRect(0,0,W,H);whoCamp(ctx,S);whoPanel(ctx,S);}},

  {rail:'Tell it',title:'Now you tell the story',tell:true,
   text:'You have followed the water from the ocean to a single doorway in one cell. Put the story back in order, then explain it the way you would to a friend who missed class.'}
  ]});
})();
