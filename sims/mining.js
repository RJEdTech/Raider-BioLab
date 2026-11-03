(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,polyline,atLeast,PAL,FONT,RM,axes,legend,serColor,fmtNum}=BioLab.h;

/* ===================== Full lab: a copper mine in cross-section =====================
   The mine makes a fixed amount of copper each year (open pit 200,000 t, underground 60,000 t), so a lower ore grade
   means more ore, more waste rock and more tailings for the same copper.
   Ore per tonne of copper = 1 / (grade × recovery), recovery 88%.
   Open pit strip ratio (t waste per t ore) = 0.5 + 1.2 × (depth / 100 m)^1.5: the pit walls must slope, so a deeper
   ore body means far more overburden. Hauling costs $2.00 + $0.005 per m of depth for every tonne moved.
   Underground: $28 + $0.03 per m of depth per tonne of ore, plus a little development rock (0.12 t per t of ore).
   Milling $10 per t of ore; smelting, refining and shipping $800 per t of copper.
   Land: waste dumps hold about 1 Mt per hectare, tailings about 0.35 Mt per hectare.
   Reclamation: regrade and replant $25,000 per ha; full reclamation $60,000 per ha plus water treatment
   ($0.15 per t of rock placed at 2% pyrite).
   Acid drainage index: exposed sulfide rock E (Mt) grows with the rock placed and shrinks as it is covered;
   acid load S = pyrite × (E + 5% of covered rock) × (0.15 if the water is treated); the stream lags S by 4 years;
   stream pH = 7.3 − 1.8 log10(1 + S / 0.29). An index for comparing choices, not a geochemical model. */
const REC=0.88,CONC=0.28,SMELT=800,MILL=10,CU_YR={surface:200e3,under:60e3};
const RECL={none:{ha:0,r:0,tf:1},basic:{ha:25000,r:0.3,tf:1},full:{ha:60000,r:0.8,tf:0.15}};
const RECL_L={none:'no reclamation',basic:'regrade and replant',full:'full reclamation and water treatment'};
function econ(p){const g=p.grade/100,D=p.depth,surf=p.method!=='under',cu=CU_YR[surf?'surface':'under'],R=cu/(g*REC);
  const strip=surf?0.5+1.2*Math.pow(D/100,1.5):0.12,haul=2+0.005*D;
  const mineT=surf?(1+strip)*haul:28+0.03*D+strip*3;
  const conc=cu/CONC,tail=R-conc,waste=R*strip,ha=waste/1e6+tail/0.35e6,rc=RECL[p.recl]||RECL.basic;
  const treat=(p.recl==='full'?1:0)*0.15*(p.pyrite/2)*(waste+tail),reclCost=rc.ha*ha+treat;
  const costOre=mineT+MILL,cost=R*costOre+cu*SMELT+reclCost,rev=cu*p.price;
  return {g,D,surf,cu,R,strip,tail,waste,ha,reclCost,cost,rev,profit:rev-cost,perCu:cost/cu,orePer:1/(g*REC),rockPer:(1+strip)/(g*REC),
    be:(costOre+reclCost/R)/(REC*(p.price-SMELT))*100,rock:(waste+tail)/1e6,rc};}
const phOf=A=>clamp(7.3-1.8*Math.log10(1+Math.max(0,A)/0.29),2.6,7.3);
function amdStep(s,p,dt){const e=econ(p),rc=e.rc;s.E+=(e.rock-rc.r*s.E)*dt;s.C+=rc.r*s.E*dt;const S=p.pyrite/100*(s.E+0.05*s.C)*rc.tf;s.A+=(S-s.A)*dt/4;}
/* the pH the stream would reach after 15 years of these choices (for the risk readout) */
const RISK={};
function risk15(p){const key=[p.grade,p.depth,p.method,p.recl,p.pyrite].join('|');if(RISK[key]!==undefined)return RISK[key];const s={E:0,C:0,A:0};for(let i=0;i<300;i++)amdStep(s,p,0.05);return (RISK[key]=phOf(s.A));}
const riskText=ph=>ph>=6?'Low':ph>=5?'Moderate':ph>=4?'High':'Severe';
const money=v=>'$'+Math.round(v).toLocaleString('en-US');
const fmt0=v=>Math.round(v).toLocaleString('en-US');

/* ===================== Virtual lab: the cookie mine =====================
   1 cm graph paper (36 px squares). The cookie is about 5.6 cm across, with a slightly uneven outline.
   Dough lives on a 5 px grid, 9 units thick. Chips sit at three depths: on top (visible), in the middle, or near the bottom.
   Everything random comes from the lab's saved seed and a counter of the student's actions, so a reload never changes
   what already happened on the bench. */
function hr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
const GX=14,GY=44,GS=36,GC=11,GRW=11,PW=GC*GS,PH=GRW*GS;      // the paper: 1 cm squares, 36 px each
const CW=5,CN=48;                                             // dough cells
const PRICE={clip:1000,round:800,flat:500},LAND=2000,RATE_MIN=200,FINE=100,SELL={w:500,d:200,p:100};
const TN={clip:'paper clip',round:'round toothpick',flat:'flat toothpick'};
/* rad: bite radius (px); u: dough removed at the center of a bite (of 9); time: seconds per careful stroke;
   brk: chance of breaking per stroke; part / dirt: base chances that a pried chip breaks or comes out dirty */
const TOOL={clip:{rad:15,u:4,time:2.2,brk:0.002,part:0.22,dirt:0.30},
            round:{rad:10,u:4,time:2.6,brk:0.012,part:0.08,dirt:0.32},
            flat:{rad:13,u:3,time:2.4,brk:0.022,part:0.12,dirt:0.14}};
let GEO=null;
function geoFor(seed){if(GEO&&GEO.seed===seed)return GEO;
  const cx=GX+PW/2+12*(hr(seed,1,1)-.5),cy=GY+PH/2+12*(hr(seed,1,2)-.5),R=97+6*hr(seed,1,3),a3=0.02+0.022*hr(seed,1,4),p3=6.283*hr(seed,1,5),a5=0.008+0.014*hr(seed,1,6),p5=6.283*hr(seed,1,7);
  const rOf=th=>R*(1+a3*Math.sin(3*th+p3)+a5*Math.sin(5*th+p5));
  const inside=(x,y,pad)=>{const dx=x-cx,dy=y-cy;return Math.hypot(dx,dy)<rOf(Math.atan2(dy,dx))-(pad||0);};
  const poly=[];for(let i=0;i<120;i++){const th=i/120*6.2832,r=rOf(th);poly.push([cx+Math.cos(th)*r,cy+Math.sin(th)*r]);}
  const ox=Math.round(cx)-CN*CW/2,oy=Math.round(cy)-CN*CW/2,inCk=new Uint8Array(CN*CN);
  for(let j=0;j<CN;j++)for(let i=0;i<CN;i++)inCk[j*CN+i]=inside(ox+i*CW+CW/2,oy+j*CW+CW/2,-4)?1:0;
  // chips: uneven, clustered around two or three spots, at three depths
  const g=rng((seed^0x5bd1e995)|0),nCl=2+Math.floor(g()*2),cl=[];for(let i=0;i<nCl;i++){const a=g()*6.283,r=Math.sqrt(g())*0.55*R;cl.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}
  const N=15+Math.floor(g()*6),chips=[];let tries=0;
  while(chips.length<N&&tries<600){tries++;let x,y;
    if(g()<0.68){const c=cl[Math.floor(g()*nCl)],u=Math.max(1e-9,g()),w=g(),rad=Math.sqrt(-2*Math.log(u))*0.2*R;x=c[0]+Math.cos(6.283*w)*rad;y=c[1]+Math.sin(6.283*w)*rad;}
    else{const a=g()*6.283,r=Math.sqrt(g())*0.86*R;x=cx+Math.cos(a)*r;y=cy+Math.sin(a)*r;}
    const r=7.8+2.6*g();if(!inside(x,y,r+4))continue;if(chips.some(c=>Math.hypot(c.x-x,c.y-y)<c.r+r+2))continue;
    const u=g(),d=u<0.32?0:u<0.7?1:2;chips.push({x,y,r,d,ang:g()*6.283});}
  for(let i=0;chips.filter(c=>c.d===0).length<3&&i<chips.length;i++)if(chips[i].d===2)chips[i].d=0;
  chips.forEach(c=>{c.cells=[];for(let j=0;j<CN;j++)for(let i=0;i<CN;i++){const k=j*CN+i;if(inCk[k]&&Math.hypot(ox+i*CW+CW/2-c.x,oy+j*CW+CW/2-c.y)<c.r)c.cells.push(k);}});
  // keyboard digging spots, on a 15 px grid inside the cookie
  const spots=[];for(let y=cy-R;y<=cy+R;y+=15)for(let x=cx-R;x<=cx+R;x+=15)if(inside(x,y,6))spots.push([x,y]);
  GEO={seed,cx,cy,R,rOf,inside,poly,ox,oy,inCk,chips,spots,cache:{}};return GEO;}
/* squares on the paper covered by the outline (and the pencil circles): "sure" = at least 6% of the square inside, "max" = any part */
function cover(G,circ){const key=JSON.stringify(circ||[]);if(G.cache[key])return G.cache[key];
  const vcell=new Set();G.poly.forEach(q=>{const c=Math.floor((q[0]-GX)/GS),r=Math.floor((q[1]-GY)/GS);if(c>=0&&c<GC&&r>=0&&r<GRW)vcell.add(r*GC+c);});
  let sure=0,max=0;for(let r=0;r<GRW;r++)for(let c=0;c<GC;c++){const x0=GX+c*GS,y0=GY+r*GS;let n=0;
    for(let a=0;a<10;a++)for(let b=0;b<10;b++){const px=x0+(a+.5)*GS/10,py=y0+(b+.5)*GS/10;if(G.inside(px,py,0)||(circ||[]).some(q=>Math.hypot(px-q[0],py-q[1])<q[2]))n++;}
    let hit=n>0||vcell.has(r*GC+c);if(!hit&&circ)hit=circ.some(q=>{const nx=clamp(q[0],x0,x0+GS),ny=clamp(q[1],y0,y0+GS);return Math.hypot(nx-q[0],ny-q[1])<q[2];});
    if(hit)max++;if(n>=6)sure++;}
  return (G.cache[key]={sure,max});}
const enc=H=>{let s='';for(let i=0;i<H.length;i++)s+=String.fromCharCode(48+H[i]);return s;};
const bn=sim=>sim.vlab.bench;
const ckB=sim=>sim&&sim.vlab&&sim.st&&sim.st.B&&sim.st.B.kind==='cookie'?sim.st.B:null;
function rnd(sim){const b=bn(sim);b.rc=(b.rc||0)+1;return hr(sim.vlab.seed,4242,b.rc);}
function benchInit(sim){const V=sim.vlab,b=V.bench,G=geoFor(V.seed);
  if(!b.v){Object.assign(b,{v:1,land:false,buys:{clip:0,round:0,flat:0},tools:[],traced:false,lifted:false,back:false,started:false,stopped:false,clock:0,tEnd:0,
    cs:'.'.repeat(G.chips.length),hit:[],ord:[],cr:[],lost:0,d0:[],d1:[],circ:null,rc:0,strokes:0});
    const H=new Uint8Array(CN*CN);for(let k=0;k<H.length;k++)H[k]=G.inCk[k]?9:0;b.h=enc(H);}
  const H=new Uint8Array(CN*CN);for(let k=0;k<H.length;k++)H[k]=Math.max(0,Math.min(9,(b.h.charCodeAt(k)||48)-48));
  return {kind:'cookie',G,H,ev:'',evT:-1};}
function flash(sim,m){const B=ckB(sim);if(B){B.ev=m;B.evT=sim.vt+2.8;}}
function chipFrac(B,i){const c=B.G.chips[i],thr=7.5-3*c.d;if(!c.cells.length)return 1;let n=0;c.cells.forEach(k=>{if(B.H[k]<=thr)n++;});return n/c.cells.length;}
function chipExp(B,i){const f=chipFrac(B,i);return B.G.chips[i].d===0?0.45+0.55*f:f;}
const chipVis=(B,i)=>B.G.chips[i].d===0||chipFrac(B,i)>0;
const chipIn=(b,i)=>b.cs.charAt(i)==='.';
function chipAt(sim,x,y){const B=ckB(sim),b=bn(sim);let best=-1,bd=1e9;B.G.chips.forEach((c,i)=>{if(!chipIn(b,i)||!chipVis(B,i)||chipExp(B,i)<0.35)return;const d=Math.hypot(c.x-x,c.y-y);if(d<=c.r+4&&d<bd){bd=d;best=i;}});return best;}
function workMsg(sim){const b=bn(sim);if(!b.started)return 'Start the timer before you touch the cookie.';if(b.stopped)return 'The timer is stopped, so mining is over.';return '';}
function toolIdx(sim,any){const b=bn(sim),t=sim.p.mTool;let i=b.tools.findIndex(o=>o.t===t&&!o.b);if(i<0&&any)i=b.tools.findIndex(o=>!o.b);return i;}
function needTool(sim){return 'You have no working '+TN[sim.p.mTool]+'. Buy one, or choose another tool.';}
function breakCheck(sim,ti,mult){const b=bn(sim),o=b.tools[ti];if(!o)return;const T=TOOL[o.t],fast=sim.p.mCare==='fast';
  if(rnd(sim)<T.brk*(fast?1.6:0.6)*mult){o.b=1;flash(sim,'Your '+TN[o.t]+(o.t==='clip'?' bent out of shape.':' snapped.'));}}
function addCrumb(sim,x,y){const b=bn(sim),G=ckB(sim).G;if(x<GX||x>GX+PW||y<GY||y>GY+PH){b.lost++;return;}if(G.inside(x,y,1))return;if(b.cr.length<900)b.cr.push([Math.round(x*2)/2,Math.round(y*2)/2]);}
const expo=r=>-Math.log(1-Math.min(0.999,r));
function spray(sim,x,y,n,fast){for(let i=0;i<n;i++){const a=rnd(sim)*6.2832,flick=fast&&rnd(sim)<0.07?4:1,d=fast?(10+expo(rnd(sim))*33)*flick:4+expo(rnd(sim))*10;addCrumb(sim,x+Math.cos(a)*d,y+Math.sin(a)*d);}}
function digAt(sim,x,y){const B=ckB(sim),b=bn(sim),G=B.G;let m=workMsg(sim);if(m){flash(sim,m);return;}
  const ti=toolIdx(sim);if(ti<0){flash(sim,needTool(sim));return;}
  const ci=chipAt(sim,x,y);if(ci>=0){pry(sim,ci,ti);return;}
  const t=b.tools[ti].t,T=TOOL[t],fast=sim.p.mCare==='fast',rad=T.rad*(fast?1.25:0.85),u=T.u+(fast?2:0);
  let removed=0;const i0=Math.max(0,Math.floor((x-rad-G.ox)/CW)),i1=Math.min(CN-1,Math.ceil((x+rad-G.ox)/CW)),j0=Math.max(0,Math.floor((y-rad-G.oy)/CW)),j1=Math.min(CN-1,Math.ceil((y+rad-G.oy)/CW));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*CN+i;if(!B.H[k])continue;const d=Math.hypot(G.ox+i*CW+CW/2-x,G.oy+j*CW+CW/2-y);if(d>=rad)continue;const take=Math.min(B.H[k],Math.ceil(u*(1-(d/rad)*(d/rad))));B.H[k]-=take;removed+=take;}
  if(fast)G.chips.forEach((c,i)=>{if(chipIn(b,i)&&chipExp(B,i)<0.35&&Math.hypot(c.x-x,c.y-y)<rad+c.r*0.5)b.hit[i]=(b.hit[i]||0)+1;});
  b.clock+=removed?T.time*(fast?0.4:1):0.3;b.strokes++;
  if(!removed){flash(sim,'Nothing is left to dig right here.');BioLab.play(sim);return;}
  spray(sim,x,y,Math.max(1,Math.round(removed*(fast?0.1:0.045))),fast);
  breakCheck(sim,ti,1);b.h=enc(B.H);BioLab.play(sim);}
function pry(sim,ci,ti){const B=ckB(sim),b=bn(sim),c=B.G.chips[ci],t=b.tools[ti].t,T=TOOL[t],fast=sim.p.mCare==='fast',e=chipExp(B,ci);
  const pP=T.part*(fast?1.7:0.6)*(1+1.6*(1-e))+0.18*(b.hit[ci]||0),pD=T.dirt*(fast?1.4:0.7)*(1+1.5*(1-e));
  const u1=rnd(sim),u2=rnd(sim),q=u1<pP?'p':u2<pD?'d':'w';
  b.cs=b.cs.slice(0,ci)+q+b.cs.slice(ci+1);b.ord.push(ci);
  c.cells.forEach(k=>{B.H[k]=Math.max(0,B.H[k]-2);});b.h=enc(B.H);
  spray(sim,c.x,c.y,2+Math.floor(rnd(sim)*3),fast);
  b.clock+=T.time*(fast?0.5:1.3);b.strokes++;
  flash(sim,q==='w'?'A whole, clean chip.':q==='d'?'A dirty chip: dough is stuck to it.':'The chip broke: a partial chip.');
  breakCheck(sim,ti,1.5);BioLab.play(sim);}
function pushAt(sim,x,y){const B=ckB(sim),b=bn(sim),G=B.G;let m=workMsg(sim);if(m){flash(sim,m);return;}
  if(b.circ){flash(sim,'Erase the pencil circles before you push more crumbs.');return;}
  const ti=toolIdx(sim,true);if(ti<0){flash(sim,'You have no working tool. Buy one to push the crumbs.');return;}
  const fast=sim.p.mCare==='fast',reach=fast?38:30,stepD=fast?25:11;let n=0;const keep=[];
  b.cr.forEach(q=>{const d=Math.hypot(q[0]-x,q[1]-y);if(d>reach){keep.push(q);return;}n++;
    let nx,ny;if(fast&&rnd(sim)<0.12){const a=rnd(sim)*6.2832,dd=13+45*rnd(sim);nx=q[0]+Math.cos(a)*dd;ny=q[1]+Math.sin(a)*dd;}
    else{const dx=G.cx-q[0],dy=G.cy-q[1],L=Math.hypot(dx,dy)||1;nx=q[0]+dx/L*stepD;ny=q[1]+dy/L*stepD;}
    if(nx<GX||nx>GX+PW||ny<GY||ny>GY+PH){b.lost++;return;}if(G.inside(nx,ny,1))return;keep.push([Math.round(nx*2)/2,Math.round(ny*2)/2]);});
  b.cr=keep;b.clock+=n?(fast?0.2:0.45):0.1;if(n)breakCheck(sim,ti,0.3);BioLab.play(sim);return n;}
function farCrumb(sim){const b=bn(sim),G=ckB(sim).G;let best=null,bd=-1;b.cr.forEach(q=>{const d=Math.hypot(q[0]-G.cx,q[1]-G.cy);if(d>bd){bd=d;best=q;}});return best;}
function nextSpot(sim){const B=ckB(sim),G=B.G;let best=null,bs=0;G.spots.forEach(s=>{const i=Math.floor((s[0]-G.ox)/CW),j=Math.floor((s[1]-G.oy)/CW);let sum=0;
  for(let dj=-2;dj<=2;dj++)for(let di=-2;di<=2;di++){const ii=i+di,jj=j+dj;if(ii>=0&&jj>=0&&ii<CN&&jj<CN)sum+=B.H[jj*CN+ii];}if(sum>bs){bs=sum;best=s;}});return best;}
function bestChip(sim){const B=ckB(sim),b=bn(sim);let best=-1,be=0.35-1e-9;B.G.chips.forEach((c,i)=>{if(!chipIn(b,i)||!chipVis(B,i))return;const e=chipExp(B,i);if(e>be){be=e;best=i;}});return best;}
/* pencil circles: start at the crumb farthest from the cookie, circle every loose crumb within 24 px of it, repeat */
function circlesFor(sim){const b=bn(sim),G=ckB(sim).G,left=b.cr.slice().sort((p,q)=>Math.hypot(q[0]-G.cx,q[1]-G.cy)-Math.hypot(p[0]-G.cx,p[1]-G.cy)),out=[];
  while(left.length){const s0=left[0],grp=[],rest=[];left.forEach(q=>(Math.hypot(q[0]-s0[0],q[1]-s0[1])<24?grp:rest).push(q));
    const mx=grp.reduce((a,q)=>a+q[0],0)/grp.length,my=grp.reduce((a,q)=>a+q[1],0)/grp.length,r=Math.max(10,Math.max(...grp.map(q=>Math.hypot(q[0]-mx,q[1]-my)))+7);
    out.push([Math.round(mx),Math.round(my),Math.round(r)]);left.length=0;left.push(...rest);}
  return out;}
function chipCounts(b){const o={w:0,d:0,p:0};for(const ch of b.cs)if(o[ch]!==undefined)o[ch]++;return o;}
const cellAt=(x,y)=>{const c=Math.floor((x-GX)/GS),r=Math.floor((y-GY)/GS);return c>=0&&c<GC&&r>=0&&r<GRW?r*GC+c:-1;};
const curStep=sim=>sim.vlab&&(sim.vlab.lab.steps||[])[sim.vlab.step]||{};
function stageMode(sim){if(!ckB(sim)||sim.mode!=='vlab')return null;const s=curStep(sim);return s.mode||null;}
let PAINT=null;
function markAt(sim,x,y,first){const b=bn(sim),key=curStep(sim).dots||'d0',k=cellAt(x,y);if(k<0)return;const arr=b[key],i=arr.indexOf(k);
  if(first)PAINT=i<0?'add':'del';if(PAINT==='add'&&i<0)arr.push(k);else if(PAINT==='del'&&i>=0)arr.splice(i,1);}
function stageAct(sim,mode,x,y,first){if(mode==='dig')digAt(sim,x,y);else if(mode==='push')pushAt(sim,x,y);else if(mode==='mark')markAt(sim,x,y,first);BioLab.refresh(sim);}
function bindStage(sim){const cv=sim.ui&&sim.ui.stage;if(!cv||cv._mine)return;cv._mine=true;let down=false,last=null;
  const pos=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*800,(e.clientY-r.top)/r.height*450];};
  cv.addEventListener('pointerdown',e=>{const m=stageMode(sim);if(!m)return;e.preventDefault();down=true;try{cv.setPointerCapture(e.pointerId);}catch(_){}last=pos(e);stageAct(sim,m,last[0],last[1],true);});
  cv.addEventListener('pointermove',e=>{if(!down)return;const m=stageMode(sim);if(!m){down=false;return;}const p=pos(e),gap=m==='dig'?11:m==='push'?7:3;if(Math.hypot(p[0]-last[0],p[1]-last[1])<gap)return;last=p;stageAct(sim,m,p[0],p[1],false);});
  const up=()=>{down=false;PAINT=null;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);}
const mmss=s=>{s=Math.max(0,Math.floor(s+1e-6));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};

/* ---------- drawing: the bench ---------- */
const LCD='700 VSIZEpx "Consolas","Menlo","DejaVu Sans Mono","Courier New",monospace';
function lcdBox(ctx,x,y,w,h,label,value,k,vsize){const ls=12*k;ctx.fillStyle='#2b2f36';rr(ctx,x,y,w,h,10);ctx.fill();txt(ctx,label,x+12,y+5+ls*0.85,{s:ls,w:700,c:'#d7dbe0'});
  const sy=y+10+ls,sh=h-(sy-y)-8;ctx.fillStyle='#cfe3c8';rr(ctx,x+10,sy,w-20,sh,6);ctx.fill();ctx.fillStyle='#1b2a1b';ctx.font=LCD.replace('VSIZE',String(Math.min(vsize||36,sh-2)));ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(value,x+w-20,sy+sh/2+2);}
const isDark=()=>{const c=String(PAL['cv-bg']||'#fff').replace('#','');if(c.length<6)return false;const v=parseInt(c.slice(0,2),16)+parseInt(c.slice(2,4),16)+parseInt(c.slice(4,6),16);return v<300;};
const NOISE=Array.from({length:97},(_,i)=>{const v=hr(77,i,3);return v<0.18?-1:v>0.85?1:0;});
const DOUGH=['','#ecd3a4','#e8c995','#e3be86','#ddb277','#d6a76a','#cf9c5e','#c99254','#c2884a','#b77c3e'];
function chipShape(ctx,x,y,r,a,q){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#3a2213';
  if(q==='p'){ctx.beginPath();ctx.moveTo(-r,r*0.5);ctx.lineTo(-r*0.2,-r*0.95);ctx.lineTo(r*0.1,-r*0.2);ctx.lineTo(r*0.35,-r*0.55);ctx.lineTo(r*0.2,r*0.6);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(r*0.55,-r*0.35);ctx.lineTo(r*1.05,r*0.3);ctx.lineTo(r*0.5,r*0.7);ctx.closePath();ctx.fill();}
  else{ctx.beginPath();ctx.moveTo(0,-r*1.15);ctx.quadraticCurveTo(r*0.95,r*0.1,r*0.7,r*0.55);ctx.quadraticCurveTo(0,r*1.05,-r*0.7,r*0.55);ctx.quadraticCurveTo(-r*0.95,r*0.1,0,-r*1.15);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.arc(-r*0.25,-r*0.1,r*0.28,0,6.29);ctx.fill();
    if(q==='d'){ctx.fillStyle='#d9b07a';[[0.35,0.25,0.42],[-0.4,0.35,0.34],[0.05,-0.45,0.3],[0.5,-0.15,0.25]].forEach(o=>{ctx.beginPath();ctx.arc(o[0]*r,o[1]*r,o[2]*r,0,6.29);ctx.fill();});}}
  ctx.restore();}
function toolIcon(ctx,t,x,y,broken,sel){ctx.save();ctx.translate(x,y);if(sel){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2.5;rr(ctx,-22,-24,44,48,8);ctx.stroke();}
  if(t==='clip'){ctx.strokeStyle='#9aa3ad';ctx.lineWidth=2.6;ctx.lineCap='round';ctx.beginPath();
    if(broken){ctx.moveTo(-6,-16);ctx.lineTo(-6,10);ctx.arc(0,10,6,Math.PI,0,true);ctx.lineTo(6,-4);ctx.moveTo(10,-12);ctx.lineTo(18,8);}
    else{ctx.moveTo(-3,-6);ctx.lineTo(-3,10);ctx.arc(1,10,4,Math.PI,0,true);ctx.lineTo(5,-14);ctx.arc(0,-14,5,0,Math.PI,true);ctx.lineTo(-5,14);ctx.arc(1,14,6,Math.PI,0,true);ctx.lineTo(7,-6);}ctx.stroke();}
  else{const w=t==='flat'?4.5:2.6;ctx.fillStyle='#d8b56e';ctx.strokeStyle='#8f6d2e';ctx.lineWidth=1;
    const seg=(y0,y1)=>{ctx.beginPath();ctx.moveTo(-w/2,y0);ctx.lineTo(w/2,y0);ctx.lineTo(w/2,y1);ctx.lineTo(-w/2,y1);ctx.closePath();ctx.fill();ctx.stroke();};
    ctx.rotate(0.5);if(broken){seg(-18,-2);ctx.translate(6,4);seg(2,18);}else{seg(-16,16);ctx.beginPath();ctx.moveTo(-w/2,-16);ctx.lineTo(0,-21);ctx.lineTo(w/2,-16);ctx.fill();ctx.beginPath();ctx.moveTo(-w/2,16);ctx.lineTo(0,t==='flat'?18:21);ctx.lineTo(w/2,16);ctx.fill();}}
  ctx.restore();}
function wrapLines(ctx,s,maxW){const out=[];let line='';s.split(' ').forEach(w=>{const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){out.push(line);line=w;}else line=t;});if(line)out.push(line);return out;}
/* the mining timer is a real stopwatch: Pause and Speed do not change it, and each tool stroke adds its own working time */
function tickTimer(sim){const B=ckB(sim),b=bn(sim),now=performance.now();if(B.lastNow!==undefined&&b.started&&!b.stopped)b.clock+=Math.min(0.1,Math.max(0,(now-B.lastNow)/1000));B.lastNow=now;}
function drawBench(sim,ctx,vdt,k,t){tickTimer(sim);const B=sim.st.B,b=bn(sim),G=B.G,p=sim.p,dark=isDark(),fs=v=>v*k;
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,0,800,450);
  txt(ctx,'Cookie mine on 1 cm graph paper',GX,30,{s:fs(15),w:700});
  // paper and grid
  ctx.fillStyle=dark?'#e4e0d4':'#fcfbf6';ctx.fillRect(GX,GY,PW,PH);
  ctx.strokeStyle=dark?'#93aec4':'#a8c6e0';ctx.lineWidth=1;ctx.beginPath();for(let c=0;c<=GC;c++){const x=GX+c*GS+.5;ctx.moveTo(x,GY);ctx.lineTo(x,GY+PH);}for(let r=0;r<=GRW;r++){const y=GY+r*GS+.5;ctx.moveTo(GX,y);ctx.lineTo(GX+PW,y);}ctx.stroke();
  const onPaper=!b.traced||!b.lifted||b.back;
  // the cookie
  if(onPaper){ctx.save();ctx.beginPath();G.poly.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.clip();
    for(let j=0;j<CN;j++)for(let i=0;i<CN;i++){const h=B.H[j*CN+i];if(!h)continue;ctx.fillStyle=DOUGH[clamp(h+NOISE[(j*CN+i)%97],1,9)];ctx.fillRect(G.ox+i*CW,G.oy+j*CW,CW,CW);}
    ctx.strokeStyle='rgba(120,70,25,.55)';ctx.lineWidth=5;ctx.beginPath();G.poly.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.stroke();
    G.chips.forEach((c,i)=>{if(!chipIn(b,i)||!chipVis(B,i))return;chipShape(ctx,c.x,c.y,c.r,c.ang,'w');
      if(c.d>0){const thr=7.5-3*c.d;c.cells.forEach(kk=>{const h=B.H[kk];if(h>thr){ctx.fillStyle=DOUGH[clamp(h+NOISE[kk%97],1,9)];ctx.fillRect(G.ox+(kk%CN)*CW,G.oy+Math.floor(kk/CN)*CW,CW,CW);}});}});
    ctx.restore();}
  // pencil outline
  if(b.traced){ctx.strokeStyle='#4a4a4f';ctx.lineWidth=1.6;ctx.beginPath();G.poly.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.stroke();}
  // loose crumbs outside the line
  b.cr.forEach((q,i)=>{const r=1.7+((i*37)%10)/10;ctx.fillStyle=DOUGH[4+(i%4)];ctx.beginPath();ctx.arc(q[0],q[1],r,0,6.29);ctx.fill();ctx.strokeStyle='rgba(110,70,30,.55)';ctx.lineWidth=0.8;ctx.stroke();});
  if(b.circ){ctx.save();ctx.beginPath();ctx.rect(GX,GY,PW,PH);ctx.clip();ctx.strokeStyle='#4a4a4f';ctx.lineWidth=1.4;b.circ.forEach(q=>{ctx.beginPath();ctx.arc(q[0],q[1],q[2],0,6.29);ctx.stroke();});ctx.restore();}
  // pencil dots for counting
  const dk=curStep(sim).dots,dots=dk?b[dk]||[]:[];ctx.fillStyle='#2a2a2e';dots.forEach(kk=>{ctx.beginPath();ctx.arc(GX+(kk%GC+.5)*GS,GY+(Math.floor(kk/GC)+.5)*GS,4.5,0,6.29);ctx.fill();});
  if(!b.land&&onPaper)pill(ctx,'For sale: '+money(LAND),G.cx,G.cy+G.R+22,PAL['rj'],'#fff',fs(13));
  if(b.traced&&b.lifted&&!b.back)txt(ctx,'The cookie is off the paper.',GX+PW/2,GY+PH-12,{s:fs(12),c:'#4a4a4f',a:'center'});
  // right panel
  const X0=424,W0=368;
  lcdBox(ctx,X0,44,178,82,'MINING TIMER',mmss(b.stopped?b.tEnd:b.clock),k,34);
  lcdBox(ctx,X0+190,44,178,82,'PENCIL DOTS',dk?String(dots.length):'–',k,34);
  ctx.fillStyle=PAL['card'];rr(ctx,X0,136,W0,62,10);ctx.fill();
  txt(ctx,'Tools',X0+12,156,{s:fs(12),w:700,c:PAL['cv-soft']});
  if(!b.tools.length)txt(ctx,'none yet',X0+12,184,{s:fs(12),c:PAL['cv-soft']});
  ctx.font='700 '+fs(12)+'px '+FONT;const ix=X0+12+ctx.measureText('Tools').width+32;
  const sel=toolIdx(sim);b.tools.slice(0,6).forEach((o,i)=>toolIcon(ctx,o.t,ix+i*44,167,!!o.b,i===sel&&!!stageMode(sim)&&stageMode(sim)!=='mark'));
  if(b.tools.length>6)txt(ctx,'+'+(b.tools.length-6),X0+W0-8,190,{s:fs(12),w:700,c:PAL['cv-soft'],a:'right'});
  ctx.fillStyle=dark?'#d6cfbf':'#f4efe3';rr(ctx,X0,208,W0,228,10);ctx.fill();ctx.strokeStyle='#b9ad94';ctx.lineWidth=1.5;ctx.stroke();
  txt(ctx,'Sale tray',X0+12,229,{s:fs(12),w:700,c:'#5a5346'});
  const mined=b.ord.map(i=>({i,q:b.cs.charAt(i)}));
  if(!mined.length)txt(ctx,'Chips you mine go here.',X0+W0/2,330,{s:fs(12),c:'#5a5346',a:'center'});
  const cr=8.5+3*clamp(k-1,0,0.8);ctx.save();rr(ctx,X0,208,W0,228,10);ctx.clip();
  if(mined.length&&!b.stopped){mined.forEach((m,n)=>{const c=G.chips[m.i],col=n%12,row=Math.floor(n/12);chipShape(ctx,X0+24+col*29,236+fs(12)+row*30,cr,c.ang*0.3,m.q);});}
  else if(mined.length){let y=236+fs(12)*1.6;[['w','Whole, clean'],['d','Dirty'],['p','Partial']].forEach(([q,l])=>{txt(ctx,l,X0+12,y,{s:fs(12),w:700,c:'#2f2b24'});y+=fs(12)*0.5+14;
      const list=mined.filter(m=>m.q===q);if(!list.length){txt(ctx,'none',X0+24,y+5,{s:fs(12),c:'#5a5346'});y+=22;}
      list.forEach((m,n)=>{const col=n%12;if(n&&!col)y+=cr*2+6;chipShape(ctx,X0+24+col*29,y,cr,0,q);});if(list.length)y+=cr+16;y+=8;});}
  ctx.restore();
  // event message
  if(B.ev&&sim.vt<B.evT){const z=fs(13);ctx.font='700 '+z+'px '+FONT;const L=wrapLines(ctx,B.ev,PW-40),w=Math.min(PW-10,Math.max(...L.map(l=>ctx.measureText(l).width))+24),h=L.length*z*1.25+12;
    ctx.fillStyle='rgba(30,30,34,.9)';rr(ctx,GX+PW/2-w/2,GY+8,w,h,8);ctx.fill();L.forEach((l,i)=>txt(ctx,l,GX+PW/2,GY+14+z*0.62+i*z*1.25,{s:z,w:700,c:'#fff',a:'center',b:'middle'}));}
  const want=stageMode(sim)?'none':'';if(sim.ui&&sim.ui.stage&&sim.ui.stage.style.touchAction!==want){sim.ui.stage.style.touchAction=want;sim.ui.stage.style.cursor=want?'crosshair':'';}}

function benchNarrate(sim){const B=ckB(sim),b=bn(sim),G=B.G,s=sim.vlab.step,cc=chipCounts(b),nm=b.ord.length,left=b.cr.length,working=b.tools.filter(o=>!o.b).length;
  if(!b.land)return 'The bank lends you the money to buy your land: one chocolate chip cookie for <b>$2,000</b>. Everything you spend is on credit, so the bank wants it back from what you sell.';
  if(b.tools.length<2)return 'Buy at least two mining tools on credit. Each tool digs at a different speed, breaks at a different rate and is gentler or rougher on the chips.';
  if(!b.traced)return 'Trace the cookie’s outline in pencil so you know the original size of your land.';
  if(b.lifted&&!b.back&&curStep(sim).mode!=='mark')return 'Put the cookie back inside its circle on the paper. Wait to start mining until you are ready.';
  if(b.lifted&&!b.back)return 'Count every square inside the pencil line. A square the line cuts through counts as a whole square. Tap a square to put a pencil dot on it if that helps you keep track.';
  if(!b.back)return 'Lift the cookie off the paper so you can see the squares under it.';
  if(!b.started)return 'Your cookie sits back in its circle. Only tools may touch it: no fingers, no flipping it over and no blowing the crumbs. Start the timer when you are ready.';
  if(b.stopped)return 'The timer stopped at <b>'+mmss(b.tEnd)+'</b>. Your chips are sorted in the sale tray: count each kind and fill in your ledger.';
  const fast=sim.p.mCare==='fast',tail=(b.lost?' '+b.lost+' crumb'+(b.lost>1?'s have':' has')+' fallen off the paper and '+(b.lost>1?'are':'is')+' lost.':'');
  if(working===0)return '<b>All your tools are broken.</b> Buy a replacement on credit to keep working. The timer is still running.';
  const st=curStep(sim);
  if(st.mode==='push'){if(b.circ)return 'You drew the pencil circles. Count the squares inside all the circles, or erase them to push more crumbs.';
    return left?'<b>Reclamation.</b> '+left+' crumb'+(left>1?'s are':' is')+' still outside the pencil line. Push them back into the circle with your tool. Every square outside the line that still has crumbs will cost you $100.'+tail:'Every crumb you can still reach is back inside the line.'+tail;}
  if(st.mode==='mark')return b.circ?'Count every square inside all the circles: the original outline and each pencil circle. Count a square once, even if two circles touch it.':'Draw circles around the crumbs that are still outside the line, then count the squares.';
  return (fast?'<b>Fast mining:</b> big bites save time, but crumbs fly farther and chips break or come out dirty more often. ':'<b>Careful mining:</b> small bites keep the crumbs close and the chips whole, but every stroke takes longer. ')+
    'You have mined '+nm+' chip'+(nm===1?'':'s')+'. Every minute on the timer costs $200.'+(left?' '+left+' crumb'+(left>1?'s are':' is')+' outside the line.':'')+tail;}

/* ---------- drawing: the full-lab cross-section ---------- */
const GY0=104,PXM=0.45,OREX=380,OREW=150,ORET=120;
function tag(ctx,s,x,y,k,o){o=o||{};const size=(o.s||12)*k;ctx.font=(o.w||600)+' '+size+'px '+FONT;const w=ctx.measureText(s).width+12,h=size+8,a=o.a||'center',x0=a==='center'?x-w/2:a==='right'?x-w:x;
  ctx.fillStyle=PAL['card'];ctx.globalAlpha=.9;rr(ctx,x0,y-h/2,w,h,6);ctx.fill();ctx.globalAlpha=1;txt(ctx,s,x0+6,y+1,{s:size,w:o.w||600,c:o.c||PAL['cv-ink'],b:'middle'});return w;}
function pitGeom(p){const D=p.depth,yTop=GY0+D*PXM,yF=GY0+(D+ORET/2)*PXM,half=Math.min(232,62+(yF-GY0)*0.8);return {yTop,yF,half,floor:62};}
function drawMine(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,e=econ(p),surf=e.surf,hon=atLeast('honors'),v=sim.vis,fsz=12*k;
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  // ground: soil and bedrock
  ctx.fillStyle='#8e9094';ctx.fillRect(0,GY0,800,450-GY0);ctx.fillStyle='#7f8186';ctx.fillRect(0,GY0+300*PXM,800,450);
  ctx.fillStyle='#8a6a45';ctx.fillRect(0,GY0,800,22*PXM+4);ctx.fillStyle='#5f8d3e';ctx.fillRect(0,GY0-3,800,4);
  // ore body
  const G=pitGeom(p),oy=G.yTop,oh=ORET*PXM,lens=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI*2;lens.push([OREX+Math.cos(a)*OREW,oy+oh/2+Math.sin(a)*oh/2*(1+0.15*Math.cos(3*a))]);}
  ctx.fillStyle='#6b8a78';ctx.beginPath();lens.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fill();
  if(!v.specks){const g=rng(17);v.specks=[];for(let i=0;i<240;i++)v.specks.push([g()*2-1,g()*2-1,g()]);}
  const nS=clamp(Math.round(p.grade*44),6,240);ctx.fillStyle='#e2bf4c';for(let i=0;i<nS;i++){const q=v.specks[i],x=OREX+q[0]*OREW*0.92,y=oy+oh/2+q[1]*oh/2*0.8;if(Math.hypot(q[0],q[1])>0.95)continue;ctx.fillRect(x-1.5,y-1.5,3,3);}
  // waste dump and tailings pond grow with the totals
  const dumpH=clamp(8+2.4*Math.sqrt(s.Wc),8,surf?40:26),dumpW=surf?Math.min(140,OREX-G.half-14):110;
  ctx.fillStyle='#9a8f80';ctx.beginPath();ctx.moveTo(6,GY0);ctx.lineTo(6+dumpH*0.6,GY0-dumpH);ctx.lineTo(6+dumpW-dumpH*0.6,GY0-dumpH);ctx.lineTo(6+dumpW,GY0);ctx.closePath();ctx.fill();ctx.strokeStyle='#6d6458';ctx.lineWidth=1.5;ctx.stroke();
  const pondW=clamp(36+4*Math.sqrt(s.Tc),36,66),px0=648;
  ctx.fillStyle='#8f8a7a';ctx.beginPath();ctx.moveTo(px0+pondW,GY0);ctx.lineTo(px0+pondW+10,GY0-18);ctx.lineTo(px0+pondW+18,GY0-18);ctx.lineTo(px0+pondW+30,GY0);ctx.closePath();ctx.fill();
  ctx.fillStyle='#b9b2a0';ctx.fillRect(px0,GY0-14,pondW+12,14);ctx.fillStyle='rgba(110,140,150,.55)';ctx.fillRect(px0,GY0-14,pondW+12,4);
  // mill
  ctx.fillStyle='#5b6470';ctx.fillRect(600,GY0-34,40,34);ctx.fillRect(608,GY0-50,8,16);
  // stream: blue when clean, orange with iron when acidic
  const ph=phOf(s.A),acid=clamp((6.5-ph)/3,0,1);ctx.fillStyle=PAL['cv-water'];ctx.beginPath();ctx.moveTo(752,GY0-1);ctx.lineTo(762,GY0+16);ctx.lineTo(800,GY0+16);ctx.lineTo(800,GY0-1);ctx.closePath();ctx.fill();
  if(acid>0){ctx.globalAlpha=acid*0.9;ctx.fillStyle='#c8701f';ctx.fill();ctx.globalAlpha=1;}
  if(surf){// the pit, with benches
    const L=OREX-G.half,Rr=OREX+G.half,fl=OREX-G.floor,fr=OREX+G.floor,steps=Math.max(3,Math.round((G.yF-GY0)/18));
    ctx.fillStyle=PAL['cv-bg'];ctx.beginPath();ctx.moveTo(L,GY0);for(let i=1;i<=steps;i++){const y=GY0+(G.yF-GY0)*i/steps,x=L+(fl-L)*i/steps;ctx.lineTo(L+(fl-L)*(i-1)/steps+((fl-L)/steps)*0.35,y);ctx.lineTo(x,y);}
    ctx.lineTo(fr,G.yF);for(let i=steps-1;i>=0;i--){const y=GY0+(G.yF-GY0)*i/steps,x=Rr+(fr-Rr)*i/steps;ctx.lineTo(x-((Rr-fr)/steps)*0.35,GY0+(G.yF-GY0)*(i+1)/steps);ctx.lineTo(x,y);}ctx.closePath();ctx.fill();
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.2;ctx.stroke();
    // trucks: share of loads that are waste = strip / (1 + strip)
    const up=polyline([[OREX-20,G.yF-3],[fl-6,G.yF-3],[L+(fl-L)*0.5,GY0+(G.yF-GY0)*0.5-3],[L,GY0-3]]);
    const nT=6,nW=clamp(Math.round(nT*e.strip/(1+e.strip)),1,nT-1);v.tp=(v.tp||0)+vdt*0.12*(RM?0.5:1);
    for(let i=0;i<nT;i++){const f=(v.tp+i/nT)%1,waste=i<nW,pth=up.L;const [x,y]=up.at(f*pth);ctx.fillStyle='#e0a526';ctx.fillRect(x-7,y-6,14,6);ctx.fillStyle=waste?'#8a8178':'#4f9b6e';ctx.fillRect(x-5,y-9,10,4);}
  }else{// underground: headframe, shaft and drifts
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(OREX-60-14,GY0);ctx.lineTo(OREX-60,GY0-34);ctx.lineTo(OREX-60+14,GY0);ctx.moveTo(OREX-60,GY0-34);ctx.lineTo(OREX-60,GY0);ctx.stroke();
    ctx.fillStyle='#3d3f44';ctx.fillRect(OREX-64,GY0,8,oy+oh/2-GY0);
    [0.3,0.55,0.8].forEach(f=>{ctx.fillRect(OREX-60,oy+oh*f-3,OREW*1.2,6);});
    v.sk=((v.sk||0)+vdt*0.4*(RM?0.5:1))%2;const sy=v.sk<1?lerp(oy+oh/2,GY0+4,v.sk):lerp(GY0+4,oy+oh/2,v.sk-1);ctx.fillStyle='#e0a526';ctx.fillRect(OREX-66,sy-6,12,12);}
  // labels
  const hs=14*k,head=k>1.4?(surf?'Open pit':'Underground')+' · ore '+(+p.grade).toFixed(1)+'% copper · '+p.depth+' m':(surf?'Open-pit':'Underground')+' copper mine · ore '+(+p.grade).toFixed(1)+'% copper · '+p.depth+' m down';
  txt(ctx,head,14,8+hs,{s:hs,w:700});
  txt(ctx,'Copper made: '+fmt0(e.cu/1000)+',000 t a year',14,14+hs+fsz,{s:fsz,c:PAL['cv-soft']});
  tag(ctx,'Ore body',OREX+OREW-10,Math.min(oy+oh+fsz*0.9,450-fsz*0.5-6),k,{a:'right'});
  tag(ctx,'Waste rock',6+dumpW/2,GY0+fsz*0.5+8,k);
  if(k<1.5)tag(ctx,'Mill',620,GY0-50-fsz*0.8,k);
  tag(ctx,'Tailings',px0+pondW/2+6,GY0+fsz*0.5+8,k);
  tag(ctx,hon?'Stream pH '+ph.toFixed(1):'Stream: '+(ph>=6?'clean':ph>=4.5?'acidic':'very acidic'),800-4,GY0-30-fsz*0.3,k,{a:'right',c:acid>0.4?PAL['s1']:PAL['cv-ink']});
  // depth scale
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;const sx=30;[0,200,400,600].forEach(m=>{const y=GY0+m*PXM;ctx.beginPath();ctx.moveTo(sx,y);ctx.lineTo(sx+8,y);ctx.stroke();});ctx.beginPath();ctx.moveTo(sx,GY0);ctx.lineTo(sx,GY0+600*PXM);ctx.stroke();
  [200,400,600].forEach(m=>{const y=GY0+m*PXM;if(k>1.5&&m===400)return;tag(ctx,m+' m',sx+12,y,k,{a:'left',s:12,w:400});});}

/* ---------- the custom graph: rock moved per tonne of copper against ore grade ---------- */
function plotPerTon(sim,ctx,box){const p=sim.p,base=Object.assign({},p);const f=g=>econ(Object.assign(base,{grade:g}));
  const ymax=Math.ceil(f(0.3).rockPer*1.08/100)*100;const ax=axes(ctx,box,{xmin:0,xmax:5,ymin:0,ymax,xl:'Ore grade (% copper)',yl:'Tonnes per tonne of copper'});
  ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
  const line=(fn,col,dash)=>{ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.setLineDash(dash?[6,4]:[]);ctx.beginPath();for(let i=0;i<=120;i++){const g=0.3+i/120*4.7,y=fn(g);i?ctx.lineTo(ax.X(g),ax.Y(y)):ctx.moveTo(ax.X(g),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);};
  line(g=>f(g).rockPer,serColor(0),false);line(g=>f(g).orePer,serColor(1),true);ctx.restore();
  [[5,'1900: 5%'],[0.5,'Today: 0.5%']].forEach(([g,l])=>{const y=f(g).rockPer,X=ax.X(g),Y=ax.Y(Math.min(y,ymax));ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(X,Y,4.5,0,6.29);ctx.fill();
    txt(ctx,l+' → '+fmt0(y)+' t',g>2?X-8:X+10,Y-10,{s:13,w:600,c:PAL['fg'],a:g>2?'right':'left'});});
  const gc=p.grade,yc=f(gc).rockPer;if(gc>=0.3){ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.arc(ax.X(gc),ax.Y(Math.min(yc,ymax)),6.5,0,6.29);ctx.fill();}
  legend(ctx,box.L+10,box.T+12,[{label:'All rock moved',color:serColor(0)},{label:'Ore only',color:serColor(1),dash:true}]);}

/* ===================== the virtual lab notebook ===================== */
const TOOLS=['clip','round','flat'];
/* the fixed-column values read well in the check notes ("Tool paper clip"); checks map them back to keys */
const RK={'initial size':'init','final size':'final','paper clip':'clip','round toothpick':'round','flat toothpick':'flat','total':'tot','whole, clean':'w','dirty':'d','partial':'p','operations':'ops','fine':'recl','revenue':'rev','bottom line':'net','mining time':'t'};
const rk=f=>(sim,rv,v)=>f(sim,RK[rv]||rv,v);
const num=(V,t,c,r)=>V.val(t,c,r);
function landCheck(sim,rv,v){const b=bn(sim),G=geoFor(sim.vlab.seed);
  if(rv==='init'){if(!b.traced)return 'Trace the cookie’s outline on the bench first, then count the squares.';const C=cover(G,null);
    if(v>=C.sure-1&&v<=C.max+1)return null;return 'Count again. Count every square inside the pencil line, and count a square the line cuts through as a whole square.';}
  if(!b.circ)return 'Push the crumbs back and draw the pencil circles on the bench first, then count the squares.';
  const C=cover(G,b.circ);if(v>=C.sure-1&&v<=C.max+1)return null;
  return 'Count again. Count every square inside all the circles, the original outline and each pencil circle, and count each square only once.';}
function eqNCheck(sim,rv,v){const b=bn(sim);if(rv==='tot'){const n=TOOLS.map((t,i)=>num(sim.vlab,'equip','n',i));if(n.some(x=>!Number.isFinite(x)))return 'Fill in the number of each tool first, then add them up.';
    return Math.abs(v-n.reduce((a,c)=>a+c,0))<1e-9?null:'The total should be the sum of the numbers above it.';}
  return v===b.buys[rv]?null:'Check your purchases: count every '+TN[rv]+' you bought, including replacements for broken ones.';}
function eqCostCheck(sim,rv,v){const V=sim.vlab,b=bn(sim);if(rv==='tot'){const c=TOOLS.map((t,i)=>num(V,'equip','cost',i));if(c.some(x=>!Number.isFinite(x)))return 'Fill in the cost of each tool first, then add them up.';
    return Math.abs(v-c.reduce((a,x)=>a+x,0))<0.5?null:'Add up the Cost column: the total should be the sum of the three costs above it.';}
  const i=TOOLS.indexOf(rv),n=Number.isFinite(num(V,'equip','n',i))?num(V,'equip','n',i):b.buys[rv];
  return Math.abs(v-n*PRICE[rv])<0.5?null:'Cost = number bought × the price of one '+TN[rv]+' ('+money(PRICE[rv])+').';}
function minCheck(sim,rv,v){const b=bn(sim);if(!b.stopped)return 'Stop the timer on the bench first, then read it.';const s=Math.floor(b.tEnd+1e-6),m=s/60;
  if(Math.abs(v-m)<=0.051||v===Math.ceil(m-1e-9)||v===Math.round(m))return null;
  return 'The timer read '+mmss(s)+' when you stopped it. Convert the seconds to part of a minute: 30 s is 0.5 min.';}
function timeCostCheck(sim,rv,v){const m=num(sim.vlab,'time','min',0);if(!Number.isFinite(m))return 'Fill in the minutes first.';return Math.abs(v-m*RATE_MIN)<=1?null:'Time cost = minutes × $200.';}
function chipNCheck(sim,rv,v){const b=bn(sim),V=sim.vlab;if(rv==='tot'){const n=['w','d','p'].map((q,i)=>num(V,'chips','n',i));if(n.some(x=>!Number.isFinite(x)))return 'Fill in the number of each kind of chip first, then add them up.';
    return Math.abs(v-n.reduce((a,c)=>a+c,0))<1e-9?null:'The total should be the sum of the numbers above it.';}
  if(!b.stopped)return 'Finish mining, then arrange your chips and stop the timer before you count them.';
  const c=chipCounts(b);return v===c[rv]?null:'Count the '+(rv==='w'?'whole, clean':rv==='d'?'dirty':'partial')+' chips in the sale tray again.';}
function chipRevCheck(sim,rv,v){const V=sim.vlab,b=bn(sim);if(rv==='tot'){const r=['w','d','p'].map((q,i)=>num(V,'chips','rev',i));if(r.some(x=>!Number.isFinite(x)))return 'Fill in the revenue for each kind of chip first, then add them up.';
    return Math.abs(v-r.reduce((a,x)=>a+x,0))<0.5?null:'Add up the Revenue column: the total should be the sum of the three amounts above it.';}
  const i=['w','d','p'].indexOf(rv),n=Number.isFinite(num(V,'chips','n',i))?num(V,'chips','n',i):chipCounts(b)[rv];
  return Math.abs(v-n*SELL[rv])<0.5?null:'Revenue = number of chips × the price of one chip ('+money(SELL[rv])+').';}
function ledCheck(sim,rv,v){const V=sim.vlab,eq=num(V,'equip','cost',3),tc=num(V,'time','cost',0),i0=num(V,'land','sq',0),f1=num(V,'land','sq',1),rev=num(V,'chips','rev',3);
  if(rv==='ops'){if(!Number.isFinite(eq)||!Number.isFinite(tc))return 'Fill in your equipment total and your time cost first.';return Math.abs(v-(LAND+eq+tc))<=1?null:'Cost of operations = cookie ($2,000) + equipment total + time cost.';}
  if(rv==='recl'){if(!Number.isFinite(i0)||!Number.isFinite(f1))return 'Fill in your initial and final land sizes first.';return Math.abs(v-(f1-i0)*FINE)<=1?null:'Reclamation cost = (final size − initial size) × $100 per square.';}
  if(rv==='rev'){if(!Number.isFinite(rev))return 'Fill in your total revenue in the chip table first.';return Math.abs(v-rev)<=1?null:'This line is your total revenue from the chip table.';}
  const o=num(V,'ledger','amt',0),r=num(V,'ledger','amt',1),R=num(V,'ledger','amt',2);if(![o,r,R].every(Number.isFinite))return 'Fill in the three lines above first.';
  return Math.abs(v-(R-o-r))<=1?null:'Bottom line = total revenue − cost of operations − reclamation cost. A loss is a negative number.';}

const LAB_COOKIE={id:'cookie-mining',title:'Cookie Mining Lab',course:'AP Environmental Science',teachers:'Weed, Brown, Overly, Robertson',
  source:{label:'Cookie Mining Lab (APES)',href:'https://rjhs.instructure.com/courses/16648/assignments/589259'},level:'ap',
  purpose:'<p>Mining is used to get many resources, including fossil fuels, out of the ground. In this lab you analyze the environmental and economic challenges that come from mining.</p>',
  background:'<p>Most of the metal, coal and stone people use comes out of a mine. <b>Ore</b> is rock that holds a mineral worth enough to dig out and sell at a profit. The rest of the rock, the <b>gangue</b>, has to be dug up and moved too, then left somewhere. In this lab, your cookie is the land, the chocolate chips are the ore and the cookie dough is the gangue.</p>'+
    '<p>Your mining company runs on credit. The bank lends you the money to buy the land and the equipment, and you pay it back from the ore you sell to the bank. Before you mine, you survey the land by tracing it on graph paper. Mining time costs money because you pay workers and run machines by the minute. The law also requires you to <b>reclaim</b> the land when you finish: you push what is left back where it came from, and you pay a fine for every square of land you disturbed beyond the original size. Your goal is to make money, but think about the environmental and social side too.</p>'+
    '<p><b>Prices.</b> Land: one cookie, $2,000. Tools: paper clip $1,000, round toothpick $800, flat toothpick $500. Operating cost: $200 per minute. Reclamation fine: $100 for each square beyond the original size. The bank pays $500 for a whole, clean chip, $200 for a dirty chip (dough stuck to it) and $100 for a partial chip. On the bench, the pieces of one broken chip stay together and count as one partial chip.</p>'+
    '<p><b>Which rates?</b> The handout’s worksheet prints $100 per minute and $50 per square, but its procedure says $200 per minute and $100 per square. This lab uses the procedure’s rates: <b>$200 per minute</b> and <b>$100 per square</b>.</p>'+
    '<p><b>About the virtual bench.</b> The cookie is about 5.6 cm across on 1 cm graph paper, and each cookie is a little different. Its chips are spread unevenly, and some sit on top while others are buried in the middle or near the bottom, where you only find them by digging. Each tool digs at its own speed, breaks at its own rate and is rougher or gentler on the chips. Careful strokes take about 2 to 3 seconds of timer time each and keep the crumbs close; fast strokes take under 1 second but throw crumbs farther and damage more chips. The timer runs in real time like a stopwatch on the lab table, and Pause and Speed do not change it. To dig, tap or drag on the cookie; the buttons beside the bench do the same work from the keyboard.</p>',
  materials:['1 chocolate chip cookie (the land)','Mining tools: paper clip, round toothpick, flat toothpick','Timer','Graph paper with 1 cm squares','Pencil'],
  hypothesis:{prompt:'<p>Before you start: will mining carefully or mining fast give your company the better bottom line? Write your prediction and your reason.</p>'},
  setup(sim){bindStage(sim);BioLab.refresh(sim);},
  teardown(sim){if(sim.ui&&sim.ui.stage){sim.ui.stage.style.touchAction='';sim.ui.stage.style.cursor='';}},
  controls:[],
  steps:[
    {title:'Buy the land',text:'<p>Buy your land on credit from the bank: one chocolate chip cookie for $2,000.</p>',controls:['m-land'],done:sim=>!!bn(sim).land,doneHint:'Press <b>Buy the cookie ($2,000)</b>.'},
    {title:'Buy your mining equipment',text:'<p>Buy at least two mining tools on credit. You may buy more than one of a kind, and you can buy replacements later if a tool breaks.</p><ul><li>Paper clip, $1,000: digs fast and almost never breaks, but it is rough on the chips.</li><li>Round toothpick, $800: slow and precise, so chips come out whole more often. It snaps now and then.</li><li>Flat toothpick, $500: scrapes chips out cleanly, but it snaps the most.</li></ul>',
     controls:['m-clip','m-round','m-flat'],done:sim=>bn(sim).tools.length>=2,doneHint:'Buy at least two tools.'},
    {title:'Survey the land',text:'<p>Place the cookie on the graph paper and trace its outline in pencil. Lift the cookie off the paper, then count the squares inside the line. A partial square counts as a full square.</p><p>Tap a square to put a pencil dot on it while you count; drag to dot several. Tap a dot again to erase it. Record the count as the <b>Initial size</b> in your Land area table.</p>',
     mode:'mark',dots:'d0',controls:['m-trace','m-lift','m-clear0'],done:sim=>{const b=bn(sim);return b.traced&&b.lifted&&sim.vlab.raw('c:land:sq:0').trim()!=='';},
     doneHint:sim=>{const b=bn(sim);return !b.traced?'Press <b>Trace the outline in pencil</b>.':!b.lifted?'Press <b>Lift the cookie off the paper</b>.':'Type the number of squares as the Initial size in your Land area table.';}},
    {title:'Put the cookie back',text:'<p>Put the cookie back inside its circle on the graph paper. Wait to start until you are ready to mine.</p>',controls:['m-back'],done:sim=>!!bn(sim).back,doneHint:'Press <b>Put the cookie back in the circle</b>.'},
    {title:'Start the timer',text:'<p>The rules of the mine:</p><ul><li>Only your tools may touch the cookie. No fingers, no flipping the cookie over and no blowing the crumbs.</li><li>Anything that falls off the paper is lost.</li></ul><p>Start the timer. Mining costs <b>$200 for every minute</b> on it, until you stop it at the end of the lab.</p>',
     controls:['m-start'],done:sim=>!!bn(sim).started,doneHint:'Press <b>Start the timer</b>.'},
    {title:'Mine the chips',text:'<p>Dig the chips out of the cookie with your tools. Choose a tool and a mining style, then tap or drag on the cookie to dig. Tap a chip you have uncovered to pry it out; it goes to the sale tray.</p><p>The bank buys whole, clean chips for $500, dirty chips for $200 and partial chips for $100. Some chips are buried, so you may need to dig to find them. Decide for yourself when the rest is not worth the time.</p>',
     mode:'dig',controls:['mTool','mCare','m-dig','m-pry','m-clip','m-round','m-flat'],done:sim=>bn(sim).ord.length>=1,doneHint:'Mine at least one chip before you move on.'},
    {title:'Reclaim the land',text:'<p>Reclamation: use your tools to push the crumbs that are outside the pencil line back into the circle. Tap or drag on the crumbs to push them toward the cookie. The timer is still running.</p>',
     mode:'push',controls:['mTool','mCare','m-push','m-clip','m-round','m-flat']},
    {title:'Survey the land again',text:'<p>Draw circles in pencil around the crumbs that are still outside the line. Then count the squares inside all the circles, the original outline included, and record the count as the <b>Final size</b>. Count a square only once.</p><p>You pay a reclamation fine of $100 for each square beyond the initial size.</p>',
     mode:'mark',dots:'d1',controls:['m-circle','m-erase','m-clear1'],done:sim=>{const b=bn(sim);return !!b.circ&&sim.vlab.raw('c:land:sq:1').trim()!=='';},
     doneHint:sim=>!bn(sim).circ?'Press <b>Draw circles around the crumbs</b>.':'Type the number of squares as the Final size in your Land area table.'},
    {title:'Count your chips and stop the timer',text:'<p>Arrange your chips in the sale tray for counting, and record the end time: press <b>Arrange the chips and stop the timer</b>.</p><p>Read the timer and record the mining time in minutes in the Operating cost table. Count each kind of chip and record it in the Revenue table.</p>',
     controls:['m-stop'],done:sim=>!!bn(sim).stopped,doneHint:'Press <b>Arrange the chips and stop the timer</b>.'},
    {title:'Fill in your ledger',text:'<p>Complete your ledger below the bench: what you spent on tools, your time cost, your revenue for each kind of chip and your bottom line. Work out every line yourself. Then answer the post-lab questions and write your conclusion.</p>'}],
  tables:[
    {id:'land',title:'Land area (graph-paper squares)',cols:[{id:'w',label:'Land area',rows:['initial size','final size'],rowLabels:['Initial size','Final size, after reclamation']},{id:'sq',label:'Squares',input:'number',dp:0,check:rk(landCheck)}]},
    {id:'equip',title:'Costs: equipment, bought on credit',cols:[{id:'tool',label:'Tool',rows:['paper clip','round toothpick','flat toothpick','total'],rowLabels:['Paper clip ($1,000 each)','Round toothpick ($800 each)','Flat toothpick ($500 each)','Total equipment']},
      {id:'n',label:'Number bought, with replacements',input:'number',dp:0,check:rk(eqNCheck)},{id:'cost',label:'Cost ($)',input:'number',dp:0,check:rk(eqCostCheck)}]},
    {id:'time',title:'Costs: operating time at $200 per minute',cols:[{id:'x',label:'Operating cost',rows:['mining time'],rowLabels:['Mining time']},{id:'min',label:'Minutes on the timer',input:'number',dp:2,check:minCheck},{id:'cost',label:'Time cost = minutes × $200 ($)',input:'number',dp:0,check:timeCostCheck}]},
    {id:'chips',title:'Revenue: chips sold to the bank',cols:[{id:'type',label:'Kind of chip',rows:['whole, clean','dirty','partial','total'],rowLabels:['Whole, clean chips ($500 each)','Dirty chips ($200 each)','Partial chips ($100 each)','Total']},
      {id:'n',label:'Number of chips',input:'number',dp:0,check:rk(chipNCheck)},{id:'rev',label:'Revenue ($)',input:'number',dp:0,check:rk(chipRevCheck)}]},
    {id:'ledger',title:'Bottom line. Cost of operations = cookie ($2,000) + equipment total + time cost. Fine (reclamation cost) = (final − initial squares) × $100. Bottom line = total revenue − cost of operations − fine.',
      cols:[{id:'line',label:'Ledger line',rows:['operations','fine','revenue','bottom line'],rowLabels:['Operations','Fine','Revenue','Bottom line']},{id:'amt',label:'Amount ($)',input:'number',dp:0,check:rk(ledCheck)}]}],
  graph:{type:'bar',title:'Your cookie mine’s ledger',xl:'Ledger line',yl:'Amount ($)',series:[{table:'ledger',x:'line',y:'amt',label:'Amount ($)'}]},
  questions:[
    {id:'q1',n:'1',q:'<p>Were the minerals (chips) evenly distributed in your cookie mine? Is this a good model of a real mine? Explain.</p>'},
    {id:'q2',n:'2',q:'<p>Did you leave chips behind in your cookie? Why or why not? Is this a good model of a real mine?</p>'},
    {id:'q3',n:'3',q:'<p>Were you able to restore the land to its previous condition? Use your initial and final sizes, and any crumbs that fell off the paper, in your answer.</p>'},
    {id:'q4',n:'4',q:'<p>How is the time required for mining affected by knowing that the land must be restored?</p>'},
    {id:'q5',n:'5',q:'<p>Why does legislation requiring restoration of the land make mining more expensive?</p>'},
    {id:'q6',n:'6',q:'<p>Assume your mine was not reclaimed well, and acid mine drainage resulted. Describe the effects of acid mine drainage.</p>'},
    {id:'q7',n:'7',q:'<p>In 1900, the average copper ore was 5% copper by weight. Today it is about 0.5% copper. What factors could account for this? (In the Full lab, compare how much rock a mine moves for each tonne of copper at 5% and at 0.5%.)</p>'}],
  conclusion:{prompt:'<p>Write a conclusion of one or two paragraphs. Did your mine make or lose money? Use the numbers in your ledger to explain which costs decided your bottom line, and describe one environmental tradeoff you made while you mined.</p>'}};

/* ===================== the definition ===================== */
const own=s=>{const B=ckB(s);return !!B;};
const buy=t=>({id:'m-'+t,label:'Buy a '+TN[t]+' ('+money(PRICE[t])+')',vlab:true,enabled:s=>own(s)&&!!bn(s).land&&!bn(s).stopped,
  run(s){if(!own(s))return;const b=bn(s);if(!b.land||b.stopped)return;b.buys[t]=(b.buys[t]||0)+1;b.tools.push({t,b:0});flash(s,'You bought a '+TN[t]+' on credit.');}});
const SIM={
  id:'mining',hash:'mining',apUnit:13,order:5,kind:'Simulation',tab:'Mining: ore, cost and reclamation',next:['commons'],
  card:'Mine a copper ore body by open pit or underground, weigh cost against price, and see why falling ore grades mean more waste rock.',
  title:'Mining: ore, cost and reclamation',
  lede:{bio:'A copper mine digs up ore, keeps the copper and leaves the rest as waste rock and tailings. Change the ore grade and depth, choose open pit or underground, and see what it costs the land, the water and the bottom line.',
        honors:'Weigh extraction cost against the copper price, and add the cost of reclamation and water treatment. Find out why low-grade ore means far more waste rock and tailings for each tonne of copper.',
        ap:'Work out the strip ratio, the break-even ore grade and the acid drainage that sulfide waste rock can cause, and test when underground mining beats an open pit.'},
  scale:'Cross-section about 1.8 km across and 700 m deep. A large open-pit copper mine like this one makes about 200,000 t of copper a year and moves hundreds of thousands of tonnes of rock a day.',
  timeScale:1,dtMax:0.05,prewarm:0,sampleDt:0.1,window:20,unit:'yr',timeLabel:'Year',chChange:1,chReveal:3,
  clock:sim=>{const B=ckB(sim);if(B){const b=bn(sim);return 'Timer '+mmss(b.stopped?b.tEnd:b.clock);}return 'Year '+Math.floor(sim.t);},
  controls:[
    {id:'grade',label:'Ore grade',type:'range',min:0.2,max:5,step:0.1,def:0.6,unit:'% copper',lvl:'bio',help:'In 1900 the average copper ore was about 5% copper. Today it is about 0.5%.'},
    {id:'depth',label:'Depth to the top of the ore',type:'range',min:20,max:600,step:10,def:150,unit:' m',lvl:'bio',help:'The rock above the ore is the overburden.'},
    {id:'method',label:'Mining method',type:'seg',def:'surface',lvl:'bio',options:[{v:'surface',l:'Open pit'},{v:'under',l:'Underground'}]},
    {id:'recl',label:'Reclamation',type:'seg',def:'basic',lvl:'bio',options:[{v:'none',l:'None'},{v:'basic',l:'Regrade and replant'},{v:'full',l:'Full, with water treatment'}],help:'What the company does with the waste rock and tailings it leaves behind.'},
    {id:'price',label:'Copper price ($ per tonne)',type:'range',min:4000,max:14000,step:500,def:9000,unit:'',d:0,lvl:'honors',help:'Copper has sold for about $8,000 to $10,000 per tonne in recent years.'},
    {id:'pyrite',label:'Pyrite in the waste rock',type:'range',min:0,max:5,step:0.5,def:2,unit:'%',lvl:'ap',help:'Pyrite (FeS₂) is the sulfide mineral that makes acid mine drainage.'},
    // virtual lab bench only
    {id:'mTool',label:'Tool in your hand',type:'seg',def:'clip',vlab:true,noTrial:true,options:[{v:'clip',l:'Paper clip'},{v:'round',l:'Round toothpick'},{v:'flat',l:'Flat toothpick'}]},
    {id:'mCare',label:'Mining style',type:'seg',def:'careful',vlab:true,noTrial:true,options:[{v:'careful',l:'Mine carefully'},{v:'fast',l:'Mine fast'}],help:'Careful: slower strokes, fewer crumbs, fewer broken chips. Fast: the opposite.'}
  ],
  actions:[
    {id:'restart',label:'Start a new mine',lvl:'bio',run(s){BioLab.reset(s);}},
    {id:'m-land',label:'Buy the cookie ($2,000)',primary:true,vlab:true,enabled:s=>own(s)&&!bn(s).land,run(s){if(!own(s))return;bn(s).land=true;flash(s,'You own the land. You owe the bank $2,000.');}},
    buy('clip'),buy('round'),buy('flat'),
    {id:'m-trace',label:'Trace the outline in pencil',primary:true,vlab:true,enabled:s=>own(s)&&!!bn(s).land&&!bn(s).traced,run(s){if(!own(s)||!bn(s).land)return;bn(s).traced=true;}},
    {id:'m-lift',label:'Lift the cookie off the paper',vlab:true,enabled:s=>own(s)&&!!bn(s).traced&&!bn(s).lifted,run(s){if(!own(s)||!bn(s).traced)return;bn(s).lifted=true;}},
    {id:'m-clear0',label:'Erase my pencil dots',vlab:true,enabled:s=>own(s)&&bn(s).d0.length>0,run(s){if(own(s))bn(s).d0=[];}},
    {id:'m-back',label:'Put the cookie back in the circle',primary:true,vlab:true,enabled:s=>own(s)&&!!bn(s).lifted&&!bn(s).back,run(s){if(!own(s)||!bn(s).lifted)return;bn(s).back=true;}},
    {id:'m-start',label:'Start the timer',primary:true,vlab:true,enabled:s=>own(s)&&!!bn(s).back&&!bn(s).started&&bn(s).tools.length>=2,
     run(s){if(!own(s))return;const b=bn(s);if(!b.back||b.started||b.tools.length<2)return;b.started=true;b.clock=0;BioLab.play(s);}},
    {id:'m-dig',label:'Dig the next spot',vlab:true,enabled:s=>own(s)&&!!bn(s).started&&!bn(s).stopped,run(s){if(!own(s))return;const q=nextSpot(s);if(q)digAt(s,q[0],q[1]);else flash(s,'There is no dough left to dig.');}},
    {id:'m-pry',label:'Pry out a visible chip',primary:true,vlab:true,enabled:s=>own(s)&&!!bn(s).started&&!bn(s).stopped&&bestChip(s)>=0,
     run(s){if(!own(s)||workMsg(s))return;const i=bestChip(s);if(i<0)return;const ti=toolIdx(s);if(ti<0){flash(s,needTool(s));return;}pry(s,i,ti);}},
    {id:'m-push',label:'Push crumbs back',primary:true,vlab:true,enabled:s=>own(s)&&!!bn(s).started&&!bn(s).stopped&&!bn(s).circ&&bn(s).cr.length>0,
     run(s){if(!own(s))return;for(let i=0;i<6;i++){const q=farCrumb(s);if(!q)break;pushAt(s,q[0],q[1]);}}},
    {id:'m-circle',label:'Draw circles around the crumbs',primary:true,vlab:true,enabled:s=>own(s)&&!!bn(s).started&&!bn(s).circ,run(s){if(!own(s)||!bn(s).started)return;bn(s).circ=circlesFor(s);bn(s).d1=[];}},
    {id:'m-erase',label:'Erase the circles',vlab:true,enabled:s=>own(s)&&!!bn(s).circ&&!bn(s).stopped,run(s){if(!own(s)||bn(s).stopped)return;bn(s).circ=null;bn(s).d1=[];}},
    {id:'m-clear1',label:'Erase my pencil dots',vlab:true,enabled:s=>own(s)&&bn(s).d1.length>0,run(s){if(own(s))bn(s).d1=[];}},
    {id:'m-stop',label:'Arrange the chips and stop the timer',primary:true,vlab:true,enabled:s=>own(s)&&!!bn(s).started&&!bn(s).stopped,run(s){if(!own(s))return;const b=bn(s);if(!b.started||b.stopped)return;b.stopped=true;b.tEnd=b.clock;}}
  ],
  labs:[LAB_COOKIE],
  benchRead(sim){const B=ckB(sim);if(!B)return null;const b=bn(sim),G=B.G,ci=cover(G,null),cf=b.circ?cover(G,b.circ):null;
    return {timer:b.clock,tEnd:b.tEnd,stopped:b.stopped,initSquares:ci,finalSquares:cf,buys:Object.assign({},b.buys),chips:chipCounts(b),left:G.chips.length-b.ord.length,crumbsOut:b.cr.length,lost:b.lost,
      dots:[b.d0.length,b.d1.length],working:b.tools.filter(o=>!o.b).length,broken:b.tools.filter(o=>o.b).map(o=>o.t),circles:b.circ?b.circ.length:0};},
  init(sim){const s={E:0,C:0,A:0,Wc:0,Tc:0,land:0,cum:0};if(sim&&sim.vlab&&sim.vlab.lab.id==='cookie-mining')s.B=benchInit(sim);return s;},
  step(sim,dt){const s=sim.st;if(s.B)return; // the bench timer runs in real time: see tickTimer()
    const e=econ(sim.p);s.Wc+=e.waste/1e6*dt;s.Tc+=e.tail/1e6*dt;s.land+=e.ha*dt;s.cum+=e.profit/1e6*dt;amdStep(s,sim.p,dt);},
  metrics:[
    {id:'orePer',label:'Ore mined per tonne of copper',unit:'t',lvl:'bio',min:0,max:600,d:0,get:s=>econ(s.p).orePer},
    {id:'rockPer',label:'All rock moved per tonne of copper',unit:'t',lvl:'bio',min:0,max:3000,d:0,get:s=>econ(s.p).rockPer},
    {id:'profit',label:'Profit per year',unit:'$ million',lvl:'bio',min:-1500,max:2000,d:0,get:s=>econ(s.p).profit/1e6},
    {id:'cum',label:'Total profit so far',unit:'$ million',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.cum},
    {id:'risk',label:'Acid drainage risk',unit:'',lvl:'bio',text:true,get:s=>riskText(risk15(s.p))},
    {id:'ore',label:'Ore mined per year',unit:'million t',lvl:'honors',min:0,max:120,d:1,get:s=>econ(s.p).R/1e6},
    {id:'waste',label:'Waste rock per year',unit:'million t',lvl:'honors',min:0,max:600,d:1,get:s=>econ(s.p).waste/1e6},
    {id:'tail',label:'Tailings per year',unit:'million t',lvl:'honors',min:0,max:120,d:1,get:s=>econ(s.p).tail/1e6},
    {id:'perCu',label:'Cost per tonne of copper',unit:'$/t',lvl:'honors',min:0,max:14000,d:0,get:s=>econ(s.p).perCu},
    {id:'recl',label:'Reclamation cost per year',unit:'$ million',lvl:'honors',min:0,max:80,d:1,get:s=>econ(s.p).reclCost/1e6},
    {id:'ph',label:'Stream pH below the mine',unit:'',lvl:'honors',min:2,max:8,d:1,fixed:true,get:s=>phOf(s.st.A)},
    {id:'land',label:'Land disturbed so far',unit:'ha',lvl:'honors',min:0,max:null,d:0,get:s=>s.st.land},
    {id:'strip',label:'Strip ratio (waste : ore)',unit:'',lvl:'ap',min:0,max:20,d:1,get:s=>econ(s.p).strip},
    {id:'be',label:'Break-even ore grade',unit:'% copper',lvl:'ap',min:0,max:3,d:2,get:s=>econ(s.p).be}
  ],
  graphs:[{id:'perton',label:'Rock moved per tonne of copper vs ore grade',lvl:'bio',custom:true},{id:'g-cum',label:'Total profit so far',lvl:'bio',lines:['cum']},
    {id:'g-ph',label:'Stream pH below the mine',lvl:'honors',lines:['ph']},{id:'g-land',label:'Land disturbed so far',lvl:'honors',lines:['land']}],
  defaultGraph:'perton',
  plot(sim,ctx,box,id){if(id==='perton')plotPerTon(sim,ctx,box);},
  challenges:[
    {lvl:'bio',q:'Ore grade falls from 5% copper, as in 1900, to 0.5%, as today. To make one tonne of copper, how much rock does the mine have to move?',
     choices:['About the same: copper is copper','About twice as much','About ten times as much'],correct:2,
     baseline:{grade:5},change:{grade:0.5},changeText:'Ore grade lowered from 5% to 0.5%',watch:'rockPer',
     explain:{bio:'At 5% a tonne of ore holds 50 kg of copper; at 0.5% it holds only 5 kg. So you need ten times as much ore, and ten times as much overburden comes off with it: about 840 t of rock for each tonne of copper instead of 84 t.'}},
    {lvl:'bio',q:'The ore body is 400 m down instead of 50 m, and you dig an open pit. What happens to the rock moved for each tonne of copper?',
     choices:['It stays the same, because the ore is the same','It rises a lot','It falls, because deep ore is richer'],correct:1,
     baseline:{depth:50},change:{depth:400},changeText:'Ore body moved from 50 m to 400 m deep',watch:'rockPer',
     explain:{bio:'A pit’s walls have to slope so they do not collapse, so a deeper pit is also a much wider one. To reach ore 400 m down you strip about 10 t of overburden for every tonne of ore, instead of about 1 t. The rock moved per tonne of copper jumps from about 360 t to about 2,100 t.'}},
    {lvl:'bio',q:'The mine was fully reclaiming its waste rock and treating its water. To save money it stops. What happens to the stream below the mine over the next ten years?',
     choices:['Nothing: waste rock is just rock','It slowly turns acidic and orange','It is fine as soon as the digging stops'],correct:1,
     baseline:{recl:'full'},change:{recl:'none'},changeText:'Reclamation and water treatment stopped',watch:'ph',at:1,reveal:12,
     explain:{bio:'Waste rock and tailings hold pyrite. Once air and rain reach it, it makes sulfuric acid, and iron turns the water orange. The acid keeps coming for as long as the rock sits uncovered, long after the copper is gone. Watch the stream pH fall from about 7 to below 4.'}},
    {lvl:'honors',q:'The ore is 0.5% copper. The copper price drops from $9,000 to $5,000 per tonne. What happens to the mine?',
     choices:['It still makes money, just less','It loses money on every tonne of copper','Nothing, because the cost of digging does not change'],correct:1,
     baseline:{grade:0.5,price:9000},change:{price:5000},changeText:'Copper price cut to $5,000 per tonne',watch:'profit',
     explain:{honors:'At 0.5% the mine spends about $5,400 to make each tonne of copper. At $9,000 it profits; at $5,000 every tonne loses about $400. Low-grade mines close first when prices fall, and reopen when prices rise.'}},
    {lvl:'honors',q:'The ore is 2% copper but 500 m down. You switch from an open pit to underground mining. What happens to the cost per tonne of copper?',
     choices:['It rises: underground mining always costs more','It falls','It stays the same'],correct:1,
     baseline:{grade:2,depth:500,method:'surface'},change:{method:'under'},changeText:'Switched to underground mining',watch:'perCu',
     explain:{honors:'Underground, each tonne of ore costs more to mine, about $43 instead of about $10 of digging and hauling in a shallow pit. But a 500 m deep pit must strip about 14 t of overburden for every tonne of ore. Skipping the overburden cuts the cost per tonne of copper from about $5,200 to about $3,800.'}},
    {lvl:'honors',q:'The company switches from no reclamation to full reclamation with water treatment. Roughly how much does the cost of a tonne of copper rise?',
     choices:['It doubles','A few percent','Not at all'],correct:1,
     baseline:{recl:'none'},change:{recl:'full'},changeText:'Full reclamation and water treatment added',watch:'perCu',
     explain:{honors:'Full reclamation and treatment add about $170 to a $4,600 tonne of copper, under 4%. Digging and milling cost far more. That is why the law has to require it: a few percent still matters to a company, but the acid drainage it prevents can last for centuries.'}},
    {lvl:'ap',q:'The open pit’s ore body moves from 100 m to 400 m deep. What happens to the break-even ore grade, the lowest grade that pays for itself?',
     choices:['It falls','It stays the same','It rises'],correct:2,
     baseline:{depth:100},change:{depth:400},changeText:'Ore body moved from 100 m to 400 m deep',watch:'be',
     explain:{ap:'Deeper ore means a higher strip ratio and longer hauls, so each tonne of ore costs more to reach. The ore has to be richer to pay its way: the break-even grade rises from about 0.23% to about 0.76% copper.'}},
    {lvl:'ap',q:'With no reclamation, the waste rock’s pyrite content is 4% instead of 0.5%. What happens to the stream pH over the next few years?',
     choices:['It falls faster and lower','No change, because pyrite is insoluble','It rises, because pyrite is a mineral that buffers acid'],correct:0,
     baseline:{recl:'none',pyrite:0.5},change:{pyrite:4},changeText:'Pyrite raised from 0.5% to 4%',watch:'ph',at:1,reveal:7,
     explain:{ap:'Pyrite oxidizes: 2FeS₂ + 7O₂ + 2H₂O → 2Fe²⁺ + 4SO₄²⁻ + 4H⁺. Eight times as much pyrite releases about eight times as much acid, and because pH is a log scale the stream drops by more than a full pH unit within a few years.'}}
  ],
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){if(ckB(sim)){drawBench(sim,ctx,vdt,k,t);return;}drawMine(sim,ctx,vdt,k,t);},
  thumbFrames:30
};
Object.assign(SIM,{
  narrate(sim){if(ckB(sim))return benchNarrate(sim);
    const p=sim.p,e=econ(p),ph=phOf(sim.st.A),hon=atLeast('honors'),g=(+p.grade).toFixed(1);
    if(e.perCu>p.price)return '<b>This mine loses money.</b> Each tonne of copper costs '+money(e.perCu)+' to make but sells for '+money(p.price)+'. At '+g+'% copper you move '+fmt0(e.rockPer)+' t of rock for every tonne of copper.';
    if(p.recl==='none'&&ph<5.5&&sim.t>2)return '<b>Acid mine drainage.</b> Air and rain reach the pyrite in the uncovered waste rock and tailings and make sulfuric acid. The stream below the mine is at pH '+ph.toFixed(1)+' and stained orange with iron.';
    if(!e.surf)return 'Underground, a shaft reaches the ore without removing the overburden, so you move only '+fmt0(e.rockPer)+' t of rock per tonne of copper. <b>Each tonne of ore costs more to mine and lift</b>, so underground mining needs richer ore.';
    if(p.grade<=1)return 'At '+g+'% copper you mine '+fmt0(e.orePer)+' t of ore for each tonne of copper, and the pit moves '+fmt0(e.rockPer)+' t of rock in all. <b>Almost all of it ends up as waste rock and tailings.</b>';
    return 'Rich ore: at '+g+'% copper, each tonne of copper takes '+fmt0(e.orePer)+' t of ore. The overburden still has to come off: '+(hon?'the strip ratio is '+e.strip.toFixed(1)+' t of waste per tonne of ore.':'that is the waste rock on the dump.');},
  tour:[
    {title:'A copper mine in cross-section',text:'You are looking at a slice through the ground, about 1.8 km across and 700 m deep. The green lens is the <b>ore body</b>: rock with enough copper minerals to mine at a profit. The gray rock around it is waste rock.',focus:[150,150,470,140],speed:0.3},
    {title:'Ore grade',text:'<b>Ore grade</b> is the percent of the ore that is copper. At 0.6%, a tonne of ore holds 6 kg of copper. The yellow specks are copper minerals. The rest of the ore, the <b>gangue</b>, becomes waste.',focus:[220,160,330,90],speed:0.3},
    {title:'Strip the overburden',text:'To reach ore 150 m down, the open pit removes the <b>overburden</b> above it, and its walls must slope so they do not collapse. Trucks haul that waste rock to the dump on the left. The <b>strip ratio</b> is the tonnes of waste moved per tonne of ore.',focus:[0,10,620,230],speed:0.5},
    {title:'Mill and tailings',text:'Ore goes to the mill, which crushes it and floats off a copper concentrate. More than 99% of the ore leaves as <b>tailings</b>, a wet slurry of ground-up rock held behind a dam.',focus:[590,40,210,110],speed:0.5},
    {title:'Ore grade in 1900',text:'In 1900, copper ore averaged about 5% copper. One tonne of copper took about 23 t of ore. Look at the graph: the dot for 5% sits low on the curve.',focus:[150,150,470,140],speed:0.5,setup(sim){BioLab.setValues(sim,{grade:5});}},
    {title:'Ore grade today',text:'Today ore averages about 0.5%: one tenth as much copper in each tonne. So the mine moves ten times as much ore, tailings and overburden for each tonne of copper. The richest ore was mined first.',focus:[150,150,470,140],speed:0.5,setup(sim){BioLab.setValues(sim,{grade:0.5});}},
    {title:'Go underground',text:'Deep, rich ore can be mined underground through a shaft. You skip the overburden, so far less waste rock comes up, but each tonne of ore costs more to mine and lift.',focus:[250,60,320,320],speed:0.5,setup(sim){BioLab.setValues(sim,{grade:2,depth:450,method:'under'});}},
    {title:'Acid mine drainage',text:'Back to the open pit, now with no reclamation. Air and rain reach the pyrite in the waste rock and tailings and make sulfuric acid. Over a few years the stream turns acidic and orange with iron.',focus:[600,60,200,110],speed:2,
     setup(sim){BioLab.setValues(sim,{grade:0.6,depth:150,method:'surface',recl:'none'});BioLab.reset(sim);}}
  ],
  onTourExit(sim){const base={};SIM.controls.forEach(c=>{if(!c.vlab)base[c.id]=c.def;});BioLab.setValues(sim,base);BioLab.reset(sim);},
  about:'<p><b>The mine.</b> The mine makes a fixed amount of copper each year: 200,000 t from the open pit or 60,000 t underground. The mill recovers 88% of the copper in the ore, so the ore needed for one tonne of copper is 1 ÷ (grade × 0.88). An open pit’s strip ratio, the tonnes of waste rock per tonne of ore, is 0.5 + 1.2 × (depth ÷ 100 m)<sup>1.5</sup>, because deeper pits need wider, sloping walls. Hauling costs $2.00 plus $0.005 per meter of depth for every tonne moved. Underground mining costs $28 plus $0.03 per meter of depth for each tonne of ore, with little waste rock. Milling costs $10 per tonne of ore, and smelting, refining and shipping $800 per tonne of copper. These are rounded figures in the range of published costs for large copper mines; real mines differ a great deal.</p>'+
    '<p><b>Land and reclamation.</b> A waste dump holds about 1 million tonnes per hectare and a tailings pond about 0.35 million tonnes. Regrading and replanting cost $25,000 per hectare; full reclamation costs $60,000 per hectare plus $0.15 per tonne of rock for water treatment at 2% pyrite. The pit itself is not counted.</p>'+
    '<p><b>Acid drainage.</b> The stream pH is an index for comparing choices, not a chemistry model. Uncovered sulfide rock builds up as the mine places waste rock and tailings, and reclamation covers it over time. The acid reaching the stream follows the pyrite in the uncovered rock (and a little from covered rock) with a lag of a few years, and water treatment removes most of it.</p>'+
    '<p><b>The cookie mine bench.</b> The virtual lab runs the APES cookie mining activity on 1 cm graph paper. Chip positions, depths and the chance that a chip breaks or comes out dirty come from a saved random seed, so each student’s cookie is different but a reload never changes what already happened. The tools and mining styles differ in speed, breakage and damage to the chips, as described in the lab.</p>',
  lab:{bio:'<p><b>Question:</b> How does ore grade change how much rock you dig and how much money you make?</p><ol><li>Keep the open pit at 150 m. Record a trial at ore grades of 5, 2, 1, 0.5 and 0.3% copper.</li><li>For each, record the rock moved per tonne of copper and the profit per year.</li><li>Plot ore grade (x) against rock moved per tonne of copper (y).</li></ol><p>What happens to the rock moved each time the grade is cut in half? At which grade does the mine stop making money?</p>',
       honors:'<p><b>Question:</b> When does an underground mine beat an open pit?</p><ol><li>Set the grade to 1.5% copper. Record the cost per tonne of copper for both methods at depths of 50, 150, 300, 450 and 600 m.</li><li>Repeat at 0.6% copper.</li><li>Then compare the three reclamation choices at 150 m: record the cost per tonne of copper and the stream pH after 15 years.</li></ol><p>Explain why open pits dominate low-grade, shallow ore, and what reclamation costs compared with the damage it prevents.</p>',
       ap:'<p><b>Question:</b> How do depth and copper price set the break-even ore grade?</p><ol><li>For the open pit, record the break-even grade at depths of 50, 150, 300 and 450 m, at copper prices of $6,000 and $10,000 per tonne.</li><li>Run 15 years with no reclamation at 0.5% and 4% pyrite, and record the stream pH.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why falling ore grades and deeper deposits raise both the cost and the environmental footprint of each tonne of copper.</p>'},
  terms:[{t:'Ore',d:'Rock that holds a mineral worth enough to dig up and sell at a profit.'},{t:'Gangue',d:'The worthless minerals in ore, left over after the valuable mineral is removed.'},
    {t:'Ore grade',d:'The percent of the ore, by weight, that is the metal. 0.5% copper is 5 kg of copper in each tonne of ore.'},{t:'Overburden',d:'The soil and rock above an ore body, removed to reach it.'},
    {t:'Tailings',d:'The finely ground rock left after the mill removes the metal, stored as a slurry behind a dam.'},{t:'Reclamation',d:'Restoring mined land: regrading, covering waste, replacing soil, replanting and treating water.'},
    {t:'Acid mine drainage',d:'Acidic, metal-rich water that forms when sulfide minerals in mine rock react with air and water.'},{t:'Surface (open-pit) mining',d:'Removing the overburden to dig the ore from the surface.'},{t:'Underground mining',d:'Reaching the ore through shafts and tunnels, leaving the overburden in place.'},
    {lvl:'honors',t:'Strip ratio',d:'Tonnes of waste rock removed for each tonne of ore.'},{lvl:'honors',t:'Extraction cost',d:'The cost of mining, milling and refining one tonne of metal.'},
    {lvl:'ap',t:'Break-even (cut-off) grade',d:'The lowest ore grade that pays for its own mining and processing at a given metal price.'},{lvl:'ap',t:'Pyrite',d:'Iron sulfide, FeS₂ (fool’s gold). Its oxidation releases sulfuric acid.'}]
});
BioLab.register(SIM);

BioLab.addPractical({mining:{
  hook:'In 1900 a copper mine dug ore that was about 5% copper. Today’s copper ore averages about 0.5%. To make one tonne of copper from an open pit 150 m deep, how much rock does each mine have to move?',
  answer:'At 5% the mine digs about 23 t of ore and moves about 84 t of rock in all for each tonne of copper. At 0.5% it digs about 227 t of ore and moves about 840 t, ten times as much, and nearly all of it becomes waste rock and tailings. Each tonne of copper costs about $1,260 to make at 5% and about $5,400 at 0.5%.',
  uses:[
    'Bingham Canyon, Utah: one of the world’s largest open-pit mines, more than 1 km deep and about 4 km across. Its ore is well under 1% copper, so almost everything its trucks carry is waste or tailings.',
    'Gold King Mine, Colorado: in 2015 a cleanup crew accidentally released about 3 million gallons of acid mine water that turned the Animas River orange through Durango.',
    'Electric cars: an electric car holds roughly 80 kg of copper, several times as much as a gasoline car, so demand for low-grade copper ore keeps climbing.'
  ],
  takeaway:'Ore grade sets how much rock you dig for each tonne of metal: cut the grade in half and you double the ore, the tailings and most of the cost. Reclamation adds only a few percent, but skipping it can leave acid drainage for centuries.',
  tour:[
    'This is a slice through the ground under a copper mine. The green patch is the ore: rock with enough copper in it to be worth digging up. The gray rock all around it is worthless.',
    'Ore grade tells you how much of the ore is copper. At 0.6%, a ton of ore has only about 12 pounds of copper in it. The yellow specks are the copper. Everything else is thrown away.',
    'To reach the ore, the mine digs a giant pit and hauls away all the rock on top. The walls slope so they do not cave in. Trucks dump that waste rock in a pile on the left.',
    'The ore goes to the mill, which grinds it up and pulls out the copper. Almost all of the ore is left over as wet, ground-up rock called tailings, kept behind a dam.',
    'Around 1900, ore was about 5% copper. A ton of copper took about 23 tons of ore.',
    'Today ore is about 0.5% copper, one tenth as much. Now a ton of copper takes about ten times as much digging, and ten times as much waste. The rich ore ran out first.',
    'Deep, rich ore can be mined underground through a shaft, like an elevator into the rock. Much less waste rock comes up, but each ton of ore costs more to get out.',
    'Here nobody cleans up the waste. Rain soaks the leftover rock and makes acid, and over a few years the stream below turns orange and too acidic for fish.'
  ]
}});
})();
