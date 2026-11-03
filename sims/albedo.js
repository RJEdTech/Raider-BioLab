(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,serColor,fmtNum}=BioLab.h;

/* Albedo and surface temperature.
   Each surface is a two-layer slab with a surface energy balance (W/m²):
     C1 dT1/dt = (1 − albedo)·S + ε·L↓ − ε·σ·T1⁴ − h·(T1 − Tair) − LE − g12·(T1 − T2)
     C2 dT2/dt = g12·(T1 − T2) − g2d·(T2 − Tdeep)
   S is clear-sky sunlight on a horizontal surface, L↓ is infrared from the sky, h = 4 + 3u is convection with wind u (m/s),
   LE is evaporation (a share of the net radiation, set by moisture). Snow and ice cannot warm above 0 °C: extra energy melts them.
   Time is in hours of a day in Aurora, Colorado (39.7° N). The virtual lab runs the same physics for eight campus spots. */
const SIG=5.67e-8,EPS=0.95,K0=273.15,LAT=39.7,ARCTIC=75;
const F2K=f=>(f-32)*5/9+K0,K2F=k=>(k-K0)*9/5+32,rad=d=>d*Math.PI/180;
const SEAS={jun:{l:'June 21',dec:23.44,noon:13.0},sep:{l:'September 15',dec:2.9,noon:12.92},dec:{l:'December 21',dec:-23.44,noon:11.97}};
const SF={
  blacktop:{l:'Blacktop',a:0.10,C1:4e4,C2:3e5,g12:8.8,g2d:2.5,ef:[0,0,0.45],col:'#36383c',ink:'#ffffff'},
  concrete:{l:'Concrete',a:0.32,C1:4e4,C2:3e5,g12:16.5,g2d:4.7,ef:[0,0,0.45],col:'#c2beb4',ink:'#1e1e1e'},
  brick:{l:'Brick',a:0.26,C1:3.2e4,C2:2.4e5,g12:8.2,g2d:2.3,ef:[0,0,0.45],col:'#a4533c',ink:'#ffffff'},
  grass:{l:'Grass',a:0.23,C1:2e4,C2:3.75e5,g12:3,g2d:4,ef:[0.3,0.9,0.92],col:'#4f8f34',ink:'#ffffff'},
  roof:{l:'White roof',a:0.70,C1:1e4,C2:2e4,g12:2,g2d:0.25,ef:[0,0,0.45],inside:295.15,col:'#eef0ec',ink:'#1e1e1e'},
  snow:{l:'Snow',a:0.85,C1:1.9e4,C2:9.5e4,g12:2.8,g2d:0.8,ef:[0,0,0],cap:K0,base:K0,col:'#f7fafd',ink:'#1e1e1e'},
  darkroof:{l:'Dark roof',a:0.07,C1:1e4,C2:2e4,g12:2,g2d:0.25,ef:[0,0,0.45],inside:295.15,col:'#232427',ink:'#ffffff'},
  greenroof:{l:'Green roof',a:0.20,C1:3e4,C2:6e4,g12:2,g2d:0.25,ef:[0.3,0.65,0.7],inside:295.15,col:'#6c9c3c',ink:'#ffffff'},
  seaice:{l:'Bare ice',a:0.50,C1:3.8e4,C2:1.9e5,g12:10,g2d:2,ef:[0,0,0],cap:K0,base:271.35,col:'#c7dbe8',ink:'#1e1e1e'},
  pond:{l:'Melt pond',a:0.25,C1:4.2e5,C2:1.9e5,g12:20,g2d:2,ef:[0,0,0],cap:K0+0.5,base:K0,col:'#4f93bd',ink:'#ffffff'},
  ocean:{l:'Open ocean',a:0.06,C1:8.4e6,C2:4.2e7,g12:60,g2d:1,ef:[0,0,0],base:271.35,col:'#1d4c78',ink:'#ffffff'}};
const ALL=Object.keys(SF);
const SETS={campus:['blacktop','concrete','brick','grass','roof','snow'],roofs:['darkroof','roof','greenroof','blacktop','grass'],ice:['snow','seaice','pond','ocean']};
const SETL={roofs:{blacktop:'Parking lot',grass:'Park lawn'},ice:{snow:'Snow on ice'}};
const labelOf=(set,s)=>(SETL[set]&&SETL[set][s])||SF[s].l;
const MI={dry:0,normal:1,wet:2};
/* clear-sky sunlight on flat ground (W/m²): direct beam through the air (transmissivity 0.80 at Denver's altitude) plus scattered skylight */
function sunAt(h,lat,dec,noon){const w=rad(15*(h-noon)),s=Math.sin(rad(lat))*Math.sin(rad(dec))+Math.cos(rad(lat))*Math.cos(rad(dec))*Math.cos(w),el=Math.asin(clamp(s,-1,1))*180/Math.PI;
  if(el<=0.3)return {el,dir:0,dif:0};const am=1/Math.sin(rad(el)),tb=Math.pow(0.80,am);return {el,dir:1361*tb*Math.sin(rad(el)),dif:1361*Math.sin(rad(el))*Math.max(0,0.271-0.294*tb)*1.3};}
function dayLen(lat,dec){const x=clamp(-Math.tan(rad(lat))*Math.tan(rad(dec)),-1,1);return 24*Math.acos(x)/Math.PI;}
/* air temperature: coolest near dawn, warmest about 3 PM; the daily range is 26 °F in dry Colorado air (12 °F over sea ice) */
const AMP=13,AMPI=3;
function airAt(h,high,amp){return F2K(high-amp+amp*Math.cos(2*Math.PI*(h-15)/24));}
/* one surface's energy budget right now (W/m²) */
function flux(S,L,env){const Q=(1-S.a)*(env.shade?env.tr*env.dir+0.6*env.dif:env.dir+env.dif),Lsky=0.74*SIG*Math.pow(env.Ta,4),Ld=env.shade?0.5*Lsky+0.5*EPS*SIG*Math.pow(env.Ta,4):Lsky;
  const em=EPS*SIG*Math.pow(L.T1,4),Rn=Q+EPS*Ld-em,G=S.g12*(L.T1-L.T2),ef=env.ef!==undefined?env.ef:S.ef[env.mi],LE=ef*Math.max(0,Rn-G),H=env.hc*(L.T1-env.Ta);
  return {S:env.shade?env.tr*env.dir+0.6*env.dif:env.dir+env.dif,Q,ir:em-EPS*Ld,H,LE,G,net:Rn-H-LE-G};}
function stepLayer(S,L,env,dts){const f=flux(S,L,env);L.T1+=f.net*dts/S.C1;
  if(S.inside)L.Td=S.inside;else if(S.base!==undefined)L.Td=S.base;else L.Td+=(L.T2-L.Td)*dts/86400;
  L.T2+=(f.G-S.g2d*(L.T2-L.Td))*dts/S.C2;L.melt=0;
  if(S.cap!==undefined){if(L.T1>S.cap){L.melt=(L.T1-S.cap)*S.C1/dts;L.T1=S.cap;}if(L.T2>S.cap)L.T2=S.cap;}
  return f;}

/* ---------------- the Full lab: every surface side by side ---------------- */
const curSet=sim=>atLeast('ap')?sim.p.set:'campus';
const latOf=sim=>curSet(sim)==='ice'?ARCTIC:LAT;
const hourOf=(sim,t)=>(((sim.st.h0+(t===undefined?sim.t:t))%24)+24)%24;
function envOf(sim,h){const p=sim.p,se=SEAS[p.season]||SEAS.sep,ice=curSet(sim)==='ice',sn=sunAt(h,latOf(sim),se.dec,se.noon),u=(atLeast('honors')?p.wind:5)*0.447;
  return {h,el:sn.el,dir:sn.dir,dif:sn.dif,Ta:airAt(h,p.airT,ice?AMPI:AMP),hc:4+3*u,shade:p.shade==='shade',tr:0.1,mi:atLeast('honors')?MI[p.moist]:1};}
function integrate(sim,t0,hours){const st=sim.st,n=Math.max(1,Math.ceil(hours/0.01-1e-9)),h=hours/n,dts=h*3600;
  for(let i=0;i<n;i++){const env=envOf(sim,hourOf(sim,t0+(i+0.5)*h));ALL.forEach(s=>stepLayer(SF[s],st.L[s],env,dts));}}
function freshLayers(sim){const L={},Tm=F2K(sim.p.airT-AMP);ALL.forEach(s=>{const S=SF[s];const T=S.cap!==undefined?Math.min(S.cap,Tm):Tm;L[s]={T1:T,T2:T,Td:S.inside||(S.base!==undefined?S.base:Tm+4),melt:0};});return L;}
/* jump the clock to a time of day; the surfaces spin up over the two days before it */
function jumpTo(sim,H){const st=sim.st;if(!st||st.B)return;st.h0=((H-sim.t)%24+24)%24;st.L=freshLayers(sim);integrate(sim,sim.t-48,48);st.H=[];st.lastH=-1e9;sim.hist.length=0;sim.lastSample=-1e9;}
function cur(sim){const s=SETS[curSet(sim)].includes(sim.p.surf)?sim.p.surf:SETS[curSet(sim)][0];const env=envOf(sim,hourOf(sim));const L=sim.st.L[s];return {s,S:SF[s],L,env,f:flux(SF[s],L,env)};}
const fmtT=h=>{h=((h%24)+24)%24;let H=Math.floor(h),m=Math.round((h-H)*60);if(m===60){m=0;H=(H+1)%24;}return (H%12===0?12:H%12)+':'+String(m).padStart(2,'0')+' '+(H<12?'AM':'PM');};
const dayMJ=(sim,s)=>{const p=sim.p,se=SEAS[p.season]||SEAS.sep,S=SF[s],sh=p.shade==='shade';let e=0;for(let i=0;i<96;i++){const sn=sunAt((i+0.5)/4,latOf(sim),se.dec,se.noon);e+=(1-S.a)*(sh?0.1*sn.dir+0.6*sn.dif:sn.dir+sn.dif)*900;}return e/1e6;};

/* ---------------- virtual lab bench: the campus albedo walk ----------------
   Eight spots: each of the handout's four surfaces in full sun and in shade. The weather, the exact albedo of each spot and
   when each shade spot fell into shadow come from the lab's saved seed, so a reload never changes data already recorded.
   The infrared thermometer reads the surface it points at to 0.1 °F, with about ±0.6 °F of spot-to-spot and reading noise. */
function hr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function hn(seed,a,b){const u=Math.max(1e-9,hr(seed,a,b)),w=hr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const ROWS=['sidewalk','blacktop','brick','grass'],ROWL=['Cement sidewalk','Blacktop','Brick','Grassy area'];
const SPOT=[
  {s:'concrete',sun:true, n:'Sidewalk by the main doors',sh:'Sidewalk, sun',x:300,y:168},
  {s:'concrete',sun:false,n:'Sidewalk on the north side of the gym',sh:'Sidewalk, shade',x:150,y:66,kind:'wall'},
  {s:'blacktop',sun:true, n:'Student parking lot',sh:'Blacktop, sun',x:96,y:330},
  {s:'blacktop',sun:false,n:'Parking lot under the trees',sh:'Blacktop, shade',x:232,y:408,kind:'tree'},
  {s:'brick',   sun:true, n:'Brick plaza by the chapel',sh:'Brick, sun',x:470,y:318},
  {s:'brick',   sun:false,n:'Covered brick walkway',sh:'Brick, shade',x:452,y:214,kind:'roof'},
  {s:'grass',   sun:true, n:'Open lawn on the quad',sh:'Grass, sun',x:318,y:266},
  {s:'grass',   sun:false,n:'Lawn under the big cottonwood',sh:'Grass, shade',x:364,y:372,kind:'tree'}];
const MPX=0.8;   // meters of campus per map pixel
const WXC={};
function weather(seed){if(WXC[seed])return WXC[seed];const S=seed|0,u=k=>hr(S,700+k,0);
  const day=8+Math.floor(u(1)*17),dec=23.44*Math.sin(2*Math.PI*(284+244+day)/365),
    W={seed:S,day,dec,noon:12.92,high:72+Math.round(u(2)*14),wind:3+Math.round(u(3)*6),start:12.9+u(4)*0.5,sky:u(5)<0.5?'Sunny, clear sky':'Sunny, a few small clouds'};
  W.sp=SPOT.map((o,i)=>{const v=k=>hr(S,800+i,k);const a=o.s==='blacktop'?0.08+0.06*v(1):o.s==='concrete'?0.27+0.10*v(1):o.s==='brick'?0.22+0.08*v(1):0.20+0.05*v(1);
    const ts=o.sun?99:o.kind==='tree'?(o.s==='blacktop'?12.05+0.35*v(2):10.2+0.6*v(2)):0;
    return {a,ef:o.s==='grass'?0.85+0.08*v(3):undefined,tr:o.kind==='tree'?0.06+0.08*v(4):0,ts};});
  /* run each spot through the two days before the lab, then record it from 11:00 to 17:00 */
  W.T=W.sp.map((q,i)=>{const S0=SF[SPOT[i].s],S1=Object.assign({},S0,{a:q.a}),L={T1:F2K(W.high-AMP),T2:F2K(W.high-AMP),Td:F2K(W.high-AMP)+4,melt:0},out=[];
    for(let j=-4800;j<=1700;j++){const h=((j/100)%24+24)%24,sn=sunAt(h,LAT,W.dec,W.noon),shade=h>=q.ts;
      const env={dir:sn.dir,dif:sn.dif,Ta:airAt(h,W.high,AMP),hc:4+3*W.wind*0.447,shade,tr:q.tr,mi:1,ef:q.ef};
      stepLayer(S1,L,env,36);if(j>=1100&&(j-1100)%5===0)out.push(K2F(L.T1));}
    return out;});
  WXC[seed]=W;return W;}
const spotT=(W,i,h)=>{const a=W.T[i],x=clamp((h-11)/0.05,0,a.length-1.001),j=Math.floor(x);return a[j]+(a[j+1]-a[j])*(x-j);};
const albV=sim=>sim&&sim.vlab&&sim.vlab.lab&&sim.vlab.lab.id==='albedo-campus'?sim.vlab:null;
const albB=sim=>albV(sim)&&sim.st&&sim.st.B?sim.vlab.bench:null;
function benchInit(sim){const b=sim.vlab.bench,W=weather(sim.vlab.seed);if(!b.reads||typeof b.reads!=='object')b.reads={};if(!Number.isFinite(b.clock))b.clock=W.start;if(!b.at)b.at='map';if(!Number.isFinite(b.pulls))b.pulls=0;if(b.disp===undefined)b.disp=null;return {kind:'alb'};}
const spotIx=id=>{const i=parseInt(String(id).replace('s',''),10);return id==='map'||!Number.isFinite(i)||!SPOT[i]?-1:i;};
const mapXY=at=>{const i=spotIx(at);return i<0?[300,440]:[SPOT[i].x,SPOT[i].y];};
function walkTo(sim){const b=albB(sim);if(!b||!b.at)return;const to=sim.p.walk;if(to===b.at)return;const a=mapXY(b.at),c=mapXY(to),d=Math.hypot(a[0]-c[0],a[1]-c[1])*MPX;
  b.clock+=(0.4+d/75)/60;b.at=to;b.disp=null;sim.infoDirty=true;}
function pull(sim){const b=albB(sim);if(!b)return;const i=spotIx(b.at);if(i<0)return;const W=weather(sim.vlab.seed);b.pulls++;b.clock+=0.15/60;
  const T=spotT(W,i,b.clock)+0.45*hn(W.seed,300+i,b.pulls)+0.25*hn(W.seed,400,b.pulls),v=Math.round(T*10)/10;b.disp=v;
  const k=String(i);if(!Array.isArray(b.reads[k]))b.reads[k]=[];b.reads[k].push(v);if(b.reads[k].length>12)b.reads[k].shift();}
const airNow=(W,h)=>K2F(airAt(h,W.high,AMP));
function cellCheck(col){return (sim,rv,v)=>{const b=albB(sim);if(!b)return null;const r=ROWS.indexOf(rv);if(r<0)return null;const i=2*r+(col==='sun'?0:1),o=SPOT[i],R=b.reads[String(i)]||[];
  if(!R.length)return 'Walk to spot '+(i+1)+', the '+o.n.toLowerCase()+', and pull the trigger to take a reading first.';
  const lo=Math.min(...R),hi=Math.max(...R);if(v>=lo-0.6&&v<=hi+0.6)return null;
  for(let j=0;j<8;j++){if(j===i)continue;const Q=b.reads[String(j)]||[];if(Q.some(x=>Math.abs(x-v)<=0.15))return 'That matches your reading at spot '+(j+1)+' ('+SPOT[j].sh.toLowerCase()+'). Check which row and column it belongs in.';}
  return R.length===1?'The thermometer read '+R[0].toFixed(1)+' °F at spot '+(i+1)+'. Check your reading.':'Your readings at spot '+(i+1)+' were from '+lo.toFixed(1)+' to '+hi.toFixed(1)+' °F. Check your reading.';};}
function benchNarrate(sim){const b=albB(sim);if(!b)return '';const W=weather(sim.vlab.seed),i=spotIx(b.at);
  if(i<0)return 'You are on the campus map. It is <b>'+fmtT(b.clock)+'</b>, '+W.sky.toLowerCase()+', about '+Math.round(airNow(W,b.clock))+' °F. Choose a spot under <b>Walk to</b>, or tap a numbered spot.';
  const o=SPOT[i];return '<b>Spot '+(i+1)+': '+o.n+'</b>, '+(o.sun?'in full sun.':'in the shade.')+' '+(b.disp===null?'Aim the infrared thermometer at the '+(o.s==='grass'?'grass':o.s==='concrete'?'sidewalk':o.s)+' and pull the trigger.':'The display holds <b>your reading</b>. Record it in the '+(o.sun?'Sunny':'Shade')+' column, then walk to the next spot.');}
/* bench drawing */
function lcd(ctx,x,y,w,h,val,k){ctx.fillStyle='#2b2f36';rr(ctx,x,y,w,h,10);ctx.fill();ctx.fillStyle='#cfe3c8';rr(ctx,x+10,y+10,w-20,h-20,6);ctx.fill();
  ctx.fillStyle='#1b2a1b';ctx.font='700 '+Math.round(h*0.44)+'px "Consolas","Menlo","DejaVu Sans Mono","Courier New",monospace';ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(val,x+w-20,y+h/2+3);
  ctx.font='700 '+Math.min(11*k,15)+'px '+FONT;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('°F',x+18,y+h-16);}
function drawMap(sim,ctx,k){const b=albB(sim),W=weather(sim.vlab.seed),fs=Math.min(12.5*k,21),here=spotIx(b.at);
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  txt(ctx,'Campus map (simplified, not to scale)',16,28,{s:Math.min(15*k,24),w:700});
  ctx.fillStyle='rgba(98,150,80,.22)';rr(ctx,16,40,520,404,10);ctx.fill();
  // buildings, lot, plaza, walks
  ctx.fillStyle='#8d9196';rr(ctx,60,78,190,88,6);ctx.fill();txt(ctx,'Gym',155,128,{s:fs,w:700,c:'#ffffff',a:'center'});
  ctx.fillStyle='#8d9196';rr(ctx,262,78,150,72,6);ctx.fill();txt(ctx,'Main building',337,120,{s:Math.min(12*k,18),w:700,c:'#ffffff',a:'center'});
  ctx.fillStyle='#8d9196';rr(ctx,430,240,90,54,6);ctx.fill();txt(ctx,'Chapel',475,272,{s:Math.min(12*k,18),w:700,c:'#ffffff',a:'center'});
  ctx.fillStyle='#3a3c40';rr(ctx,30,300,240,128,6);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;for(let x=50;x<260;x+=26){ctx.beginPath();ctx.moveTo(x,306);ctx.lineTo(x,336);ctx.stroke();}
  ctx.fillStyle='#d6d2c8';ctx.fillRect(40,58,380,12);ctx.fillRect(282,150,26,170);ctx.fillRect(282,180,170,18);
  ctx.fillStyle='#b0634a';rr(ctx,430,300,90,40,4);ctx.fill();ctx.fillStyle='#9a5a46';ctx.fillRect(430,204,90,22);ctx.fillStyle='rgba(60,60,60,.55)';ctx.fillRect(430,198,90,8);
  ctx.fillStyle='#5f9f42';rr(ctx,300,232,120,170,8);ctx.fill();
  const tree=(x,y,r)=>{ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(x+r*0.5,y+r*0.7,r,r*0.7,0,0,6.283);ctx.fill();ctx.fillStyle='#2f6b2a';ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();};
  [[200,398,15],[232,392,16],[264,400,14]].forEach(t=>tree(...t));tree(380,356,26);
  // spots
  SPOT.forEach((o,i)=>{const done=(b.reads[String(i)]||[]).length>0,me=i===here,r=Math.min(11*k,17);ctx.fillStyle=me?PAL['rj']:done?'#2e7d32':'#ffffff';ctx.strokeStyle=me?'#ffffff':'#1e1e1e';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(o.x,o.y,r,0,6.283);ctx.fill();ctx.stroke();txt(ctx,String(i+1),o.x,o.y+1,{s:Math.min(12*k,18),w:700,c:me||done?'#ffffff':'#1e1e1e',a:'center',b:'middle'});});
  // legend
  const X=552,Y=40;ctx.fillStyle=PAL['card'];rr(ctx,X,Y,236,404,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,X,Y,236,404,10);ctx.stroke();
  txt(ctx,fmtT(b.clock)+' · '+Math.round(airNow(W,b.clock))+' °F air',X+14,Y+28,{s:fs,w:700});
  const lh=Math.min(fs*1.55,40);SPOT.forEach((o,i)=>{const y=Y+28+lh*(i+1),done=(b.reads[String(i)]||[]).length>0;txt(ctx,(i+1)+'  '+o.sh,X+14,y,{s:fs,w:i===here?700:400,c:i===here?PAL['rj']:PAL['cv-ink']});if(done)txt(ctx,'✓',X+222,y,{s:fs,w:700,c:PAL['s3'],a:'right'});});}
function drawSite(sim,ctx,k,t){const b=albB(sim),W=weather(sim.vlab.seed),i=spotIx(b.at),o=SPOT[i],S=SF[o.s],fs=Math.min(12.5*k,21);
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  // sky and ground
  ctx.fillStyle='rgba(120,175,230,.28)';ctx.fillRect(0,0,800,210);
  const G=210;ctx.fillStyle=S.col;ctx.fillRect(0,G,800,240);const g=rng(17+i);
  if(o.s==='grass'){ctx.strokeStyle='rgba(20,70,10,.55)';ctx.lineWidth=2;for(let j=0;j<260;j++){const x=g()*800,y=G+6+g()*230;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(g()-.5)*6,y-8-g()*8);ctx.stroke();}}
  else if(o.s==='brick'){ctx.strokeStyle='rgba(235,215,200,.75)';ctx.lineWidth=2;for(let r=0;r<10;r++){const y=G+r*24;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(800,y);ctx.stroke();for(let x=(r%2)*30;x<800;x+=60){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+24);ctx.stroke();}}}
  else if(o.s==='concrete'){ctx.strokeStyle='rgba(90,90,90,.45)';ctx.lineWidth=2;for(let x=120;x<800;x+=200){ctx.beginPath();ctx.moveTo(x,G);ctx.lineTo(x-60,450);ctx.stroke();}ctx.fillStyle='rgba(0,0,0,.06)';for(let j=0;j<300;j++)ctx.fillRect(g()*800,G+g()*240,2,2);}
  else{ctx.fillStyle='rgba(255,255,255,.10)';for(let j=0;j<500;j++)ctx.fillRect(g()*800,G+g()*240,2,2);ctx.fillStyle='#e8d25a';ctx.fillRect(120,G+40,10,200);}
  // the shade source
  if(!o.sun){ctx.fillStyle='rgba(0,0,0,.34)';ctx.fillRect(0,G,560,240);
    if(o.kind==='wall'){ctx.fillStyle='#8d9196';ctx.fillRect(0,40,560,G-40);ctx.fillStyle='#7a7e83';for(let y=56;y<G;y+=30)ctx.fillRect(0,y,560,3);txt(ctx,'Gym wall (north side)',280,120,{s:fs,w:700,c:'#ffffff',a:'center'});}
    else if(o.kind==='roof'){ctx.fillStyle='#6d7176';ctx.fillRect(0,34,560,22);[60,240,420].forEach(x=>{ctx.fillStyle='#8d9196';ctx.fillRect(x,56,22,G-56);});txt(ctx,'Covered walkway roof',280,50,{s:Math.min(12*k,18),w:700,c:'#ffffff',a:'center',b:'middle'});}
    else{ctx.fillStyle='#5b3f26';ctx.fillRect(250,80,30,G-60);ctx.fillStyle='#2f6b2a';[[150,70,80],[265,40,95],[400,72,80]].forEach(c=>{ctx.beginPath();ctx.arc(c[0],c[1],c[2],0,6.283);ctx.fill();});}}
  else{const sx=660,sy=60;ctx.fillStyle='#ffcc33';ctx.beginPath();ctx.arc(sx,sy,24,0,6.283);ctx.fill();ctx.strokeStyle='#ffcc33';ctx.lineWidth=3;for(let a=0;a<8;a++){const c=Math.cos(a*0.785),s=Math.sin(a*0.785);ctx.beginPath();ctx.moveTo(sx+c*32,sy+s*32);ctx.lineTo(sx+c*44,sy+s*44);ctx.stroke();}}
  // info card
  ctx.fillStyle=PAL['card'];rr(ctx,12,12,370,Math.min(92*k*0.62+40,128),10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,12,12,370,Math.min(92*k*0.62+40,128),10);ctx.stroke();
  txt(ctx,'Spot '+(i+1)+' · '+(o.sun?'full sun':'shade'),26,38,{s:Math.min(14*k,22),w:700,c:PAL['rj']});
  txt(ctx,o.n,26,38+Math.min(fs*1.4,30),{s:fs,w:600});
  txt(ctx,fmtT(b.clock)+' · air '+Math.round(airNow(W,b.clock))+' °F',26,38+2*Math.min(fs*1.4,30),{s:fs,c:PAL['cv-soft']});
  // infrared thermometer: laser dot on the surface and the held reading
  const lx=420,ly=G+150;ctx.strokeStyle='rgba(230,30,30,.65)';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(600,330);ctx.lineTo(lx,ly);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#ff2a2a';ctx.beginPath();ctx.arc(lx,ly,6,0,6.283);ctx.fill();ctx.strokeStyle='rgba(255,60,60,.5)';ctx.beginPath();ctx.arc(lx,ly,18,0,6.283);ctx.stroke();
  ctx.fillStyle='#e9b021';ctx.beginPath();ctx.moveTo(596,300);ctx.lineTo(790,286);ctx.lineTo(790,350);ctx.lineTo(610,356);ctx.closePath();ctx.fill();
  ctx.fillStyle='#2b2f36';ctx.beginPath();ctx.moveTo(690,350);ctx.lineTo(760,350);ctx.lineTo(778,446);ctx.lineTo(712,446);ctx.closePath();ctx.fill();ctx.fillStyle='#4a4f57';rr(ctx,676,356,18,40,6);ctx.fill();
  lcd(ctx,590,170,200,104,b.disp===null?'---.-':b.disp.toFixed(1),k);
  txt(ctx,b.disp===null?'Pull the trigger':'HOLD · ε 0.95',690,164,{s:Math.min(12*k,18),w:700,a:'center'});}
function drawBench(sim,ctx,vdt,k,t){const b=albB(sim);if(!b)return;if(b.at==='map')drawMap(sim,ctx,k);else drawSite(sim,ctx,k,t);}

/* ---------------- the lab, from the APES teachers' handout ---------------- */
const albCells=(sim,r)=>['sun','shade'].every(c=>sim.vlab.raw('c:t1:'+c+':'+r).trim()!=='');
const surfStep=(r,title,txt1)=>({title,text:txt1,controls:['walk','ir'],done:sim=>albCells(sim,r),
  doneHint:'Record both the Sunny and the Shade reading for '+ROWL[r].toLowerCase()+' in the data table.'});
const LAB={id:'albedo-campus',title:'Albedo Lab',course:'AP Environmental Science',teachers:'Brown, Robertson, Overly',
  source:{label:'Lab Albedo Effect.pdf',href:'https://rjhs.instructure.com/courses/16473/assignments/588422'},level:'honors',
  purpose:'<p>Move around campus to collect the data below: the surface temperature of four surfaces, each in the sun and in the shade. Then use the data to answer the analysis questions. Complete the lab with your lab group.</p>',
  background:'<p><b>Albedo</b> is the fraction of sunlight a surface reflects, from 0 (reflects nothing) to 1 (reflects everything). Fresh blacktop reflects only about 5 to 10% of the sunlight that hits it, concrete about 25 to 40%, red brick about 20 to 30% and grass about 20 to 25%. Whatever a surface does not reflect, it absorbs, and absorbed sunlight warms it.</p>'+
    '<p>Albedo is not the whole story. A surface also loses heat: it glows in infrared, warms the air that blows across it and, if it is wet or alive, evaporates water. Heavy materials like blacktop and brick store heat, so they warm slowly and stay warm after the sun leaves them. In the shade, only scattered light reaches a surface, so it stays close to the air temperature.</p>'+
    '<p>An <b>infrared thermometer</b> measures a surface’s temperature from the infrared light it gives off. Point it at the surface and pull the trigger: the display holds the reading. The red dot shows where it is aimed. It reads the surface, not the air.</p>'+
    '<p><b>About the virtual campus.</b> The map is a simplified, fictional campus. Each surface runs an energy-balance model of a sunny September afternoon in Aurora, Colorado: sunlight absorbed according to the surface’s albedo, against infrared given off, heat carried away by the wind, evaporation from the grass, and heat stored in the material. Your weather, the exact albedo of each spot and when each shade spot fell into shadow are your own, so your numbers will differ from your classmates’. The thermometer reads to 0.1 °F, and two readings of the same spot differ by about a degree, as on a real surface.</p>',
  materials:['Infrared thermometer (point and read; emissivity 0.95)','Campus map with eight spots: four surfaces, each in sun and in shade','Data table for surface temperatures (°F)','Pencil (on the virtual bench, your notebook)'],
  hypothesis:{prompt:'<p>Predict which surface will be hottest in the sun and which will be coolest, and how the shade readings will compare with the sunny readings. Give your reasoning.</p>'},
  setup(sim){const b=albB(sim);if(b&&b.at&&sim.p.walk!==b.at)BioLab.setValues(sim,{walk:b.at});BioLab.refresh(sim);},
  controls:['walk','ir'],
  steps:[
    {title:'Get set up',text:'<p>Your group has an infrared thermometer and the campus map. The numbered spots are the places to measure: each surface in full sun and in the shade.</p><p>At each spot, aim at the surface and press <b>Pull the trigger</b>. Read the held display and record it in the data table to the nearest 0.1 °F. Walking between spots takes a few minutes, as it does on a real campus.</p><p>Before you start, write the weather in the <b>Observations</b> box: the sky, the air temperature and the time.</p>',controls:['walk']},
    surfStep(0,'Cement sidewalk','<p>Walk to spot 1, the <b>sidewalk by the main doors</b>, in full sun. Take a reading and record it in the <b>Sunny</b> column for cement sidewalk.</p><p>Then walk to spot 2, the <b>sidewalk on the north side of the gym</b>, in the shade, and record it in the <b>Shade</b> column.</p>'),
    surfStep(1,'Blacktop','<p>Walk to spot 3, the <b>student parking lot</b>, in full sun, and take a reading.</p><p>Then walk to spot 4, the part of the <b>parking lot under the trees</b>, and take a reading in the shade. Record both in the blacktop row.</p>'),
    surfStep(2,'Brick','<p>Walk to spot 5, the <b>brick plaza by the chapel</b>, in full sun, and take a reading.</p><p>Then walk to spot 6, the <b>covered brick walkway</b>, and take a reading in the shade. Record both in the brick row.</p>'),
    surfStep(3,'Grassy area','<p>Walk to spot 7, the <b>open lawn on the quad</b>, in full sun, and take a reading.</p><p>Then walk to spot 8, the <b>lawn under the big cottonwood</b>, and take a reading in the shade. Record both in the grassy area row.</p>'),
    {title:'Analyze your data',text:'<p>Head back to class. Your bar graph of sunny and shade temperatures draws below from your data table. Use your data to answer the three analysis questions, then write your conclusion.</p>',controls:['walk']}],
  tables:[{id:'t1',title:'Data for surface temperatures (°F)',cols:[{id:'s',label:'Surface',rows:ROWS,rowLabels:ROWL},
    {id:'sun',label:'Sunny (°F)',input:'number',dp:1,check:cellCheck('sun')},{id:'shade',label:'Shade (°F)',input:'number',dp:1,check:cellCheck('shade')}]}],
  observations:[{id:'wx',label:'Weather when you collected your data: sky, air temperature and time'}],
  graph:{type:'bar',title:'Surface temperature in sun and shade',xl:'Surface',yl:'Surface temperature (°F)',ymin:0,
    series:[{table:'t1',x:'s',y:'sun',label:'Sunny'},{table:'t1',x:'s',y:'shade',label:'Shade'}]},
  questions:[
    {id:'q1',n:'1',q:'<p>Compare the overall pattern you see between the sunny areas and the shade areas.</p>'},
    {id:'q2',n:'2',q:'<p>Based on your observations, what color car should you buy? Explain your reasoning.</p>'},
    {id:'q3',n:'3',q:'<p>Many urban areas are planting gardens and grass plots on the roofs of large buildings. Based on your observations why would they do this?</p>'}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion: how do a surface’s albedo and shade affect its temperature? Use your readings as evidence.</p>',cer:true}};

/* ---------------- the tool ---------------- */
const ALBEDO={
  id:'albedo',hash:'albedo',apUnit:12,order:3,kind:'Simulation',tab:'Albedo and surface temperature',
  card:'Put blacktop, grass, brick, a white roof and snow in the same sun, and watch why their temperatures split apart.',
  title:'Albedo and surface temperature',
  lede:{bio:'Dark surfaces absorb most of the sunlight that hits them, and light surfaces reflect it. Put six surfaces in the same sun and watch how hot each one gets.',
        honors:'Albedo sets how much sunlight a surface absorbs, but moisture, wind and shade decide how much of that heat it keeps. Compare surfaces through a whole day.',
        ap:'Follow every term of the surface energy balance, then use it to explain cool roofs, green roofs, the urban heat island and the ice–albedo feedback.'},
  scale:'Real scale: one square meter of each surface on a clear day in Aurora, Colorado (39.7° N). Midday sunlight brings about 850 to 950 W/m².',
  timeScale:0.4,dtMax:0.01,prewarm:48,sampleDt:0.1,window:16,unit:'h',timeLabel:'Time',chChange:0.3,chReveal:2.5,
  clock(sim){const b=albB(sim);if(b)return 'Campus · '+fmtT(b.clock);const se=SEAS[sim.p.season]||SEAS.sep;return (curSet(sim)==='ice'?'Arctic Ocean, 75° N · ':'Aurora, CO · ')+se.l+' · '+fmtT(hourOf(sim));},
  controls:[
    {id:'surf',label:'Surface',type:'select',def:'blacktop',lvl:'bio',options:[{v:'blacktop',l:'Blacktop (albedo 0.10)'},{v:'concrete',l:'Concrete (0.32)'},{v:'brick',l:'Brick (0.26)'},{v:'grass',l:'Grass (0.23)'},{v:'roof',l:'White roof (0.70)'},{v:'snow',l:'Snow (0.85)'},
      {v:'darkroof',l:'Dark roof (0.07)',lvl:'ap'},{v:'greenroof',l:'Green roof (0.20)',lvl:'ap'},{v:'seaice',l:'Bare sea ice (0.50)',lvl:'ap'},{v:'pond',l:'Melt pond (0.25)',lvl:'ap'},{v:'ocean',l:'Open ocean (0.06)',lvl:'ap'}],
     help:'The thermometer and the energy panel follow this surface.',onChange(sim){if(!atLeast('ap'))return;if(!SETS[sim.p.set].includes(sim.p.surf)){const s=['campus','roofs','ice'].find(k=>SETS[k].includes(sim.p.surf));if(s)BioLab.setValues(sim,{set:s});}}},
    {id:'shade',label:'Sun or shade',type:'seg',def:'sun',lvl:'bio',options:[{v:'sun',l:'In the sun'},{v:'shade',l:'In the shade'}],help:'Shade from a big tree: only scattered light gets through.'},
    {id:'airT',label:'Afternoon air temperature',type:'range',min:10,max:100,step:1,def:78,unit:' °F',lvl:'bio',help:'The day’s high, at about 3 PM. The air is coolest near dawn.'},
    {id:'season',label:'Date (sets the sun angle)',type:'seg',def:'sep',lvl:'honors',options:[{v:'jun',l:'June 21'},{v:'sep',l:'Sep 15'},{v:'dec',l:'Dec 21'}]},
    {id:'wind',label:'Wind',type:'range',min:0,max:25,step:1,def:5,unit:' mph',lvl:'honors',help:'Moving air carries heat off a hot surface.'},
    {id:'moist',label:'Moisture',type:'seg',def:'normal',lvl:'honors',options:[{v:'dry',l:'Drought'},{v:'normal',l:'Normal'},{v:'wet',l:'After rain'}],help:'Normal: a watered lawn and dry pavement. After rain, the pavement is wet too.'},
    {id:'set',label:'Compare',type:'seg',def:'campus',lvl:'ap',options:[{v:'campus',l:'Campus'},{v:'roofs',l:'Roofs and heat island'},{v:'ice',l:'Ice and ocean'}],
     onChange(sim){const s=sim.p.set,was=sim.st&&sim.st.lastSet;if(sim.st)sim.st.lastSet=s;if(!SETS[s].includes(sim.p.surf))BioLab.setValues(sim,{surf:SETS[s][s==='ice'?3:0]});
       if(s==='ice'&&was!=='ice')BioLab.setValues(sim,{airT:34,season:'jun'});else if(s!=='ice'&&was==='ice')BioLab.setValues(sim,{airT:78,season:'sep'});}},
    // virtual lab bench only
    {id:'walk',label:'Walk to',type:'select',def:'map',vlab:true,noTrial:true,options:[{v:'map',l:'Campus map'}].concat(SPOT.map((o,i)=>({v:'s'+i,l:(i+1)+' · '+o.sh}))),onChange:walkTo}
  ],
  actions:[
    {id:'j6',label:'Go to 6 AM',lvl:'bio',run(sim){jumpTo(sim,6);}},
    {id:'j13',label:'Go to 1 PM',lvl:'bio',run(sim){jumpTo(sim,13);}},
    {id:'j19',label:'Go to 7 PM',lvl:'bio',run(sim){jumpTo(sim,19);}},
    {id:'ir',label:'Pull the trigger',primary:true,vlab:true,enabled:s=>{const b=albB(s);return !!b&&b.at!=='map';},run:pull}
  ],
  labs:[LAB],
  benchRead(sim){const b=albB(sim);if(!b)return null;const W=weather(sim.vlab.seed);return {at:b.at,spot:spotIx(b.at),display:b.disp,clock:b.clock,air:airNow(W,b.clock),reads:JSON.parse(JSON.stringify(b.reads))};},
  init(sim){const st={h0:7,L:null,H:[],lastH:-1e9,lastSet:sim.p.set};st.L=freshLayers(sim);if(albV(sim))st.B=benchInit(sim);return st;},
  step(sim,dt){const st=sim.st;if(st.B)return;integrate(sim,sim.t,dt);
    if(sim.t>=0&&sim.t-st.lastH>=0.1-1e-9){st.lastH=sim.t;st.H.push({t:sim.t+dt,T:ALL.map(s=>K2F(st.L[s].T1))});while(st.H.length&&st.H[0].t<sim.t-17)st.H.shift();}},
  onClick(sim,x,y){const b=albB(sim);if(!b||b.at!=='map')return;let best=-1,bd=30;SPOT.forEach((o,i)=>{const d=Math.hypot(o.x-x,o.y-y);if(d<bd){bd=d;best=i;}});if(best>=0){BioLab.setValues(sim,{walk:'s'+best});BioLab.refresh(sim);}},
  metrics:[
    {id:'T',label:'Surface temperature',unit:'°F',lvl:'bio',min:0,max:null,d:0,get:s=>K2F(cur(s).L.T1)},
    {id:'Tair',label:'Air temperature',unit:'°F',lvl:'bio',min:0,max:null,d:0,get:s=>K2F(cur(s).env.Ta)},
    {id:'refl',label:'Sunlight reflected',unit:'%',lvl:'bio',min:0,max:100,d:0,fixed:true,get:s=>100*cur(s).S.a},
    {id:'sunW',label:'Sunlight hitting it',unit:'W/m²',lvl:'bio',min:0,max:1100,d:0,get:s=>cur(s).f.S},
    {id:'el',label:'Sun height above the horizon',unit:'°',lvl:'honors',min:0,max:90,d:0,fixed:true,get:s=>Math.max(0,cur(s).env.el)},
    {id:'dT',label:'Surface minus air',unit:'°F',lvl:'honors',min:-20,max:100,d:0,get:s=>{const c=cur(s);return (c.L.T1-c.env.Ta)*1.8;}},
    {id:'absW',label:'Sunlight absorbed',unit:'W/m²',lvl:'honors',min:0,max:1100,d:0,get:s=>cur(s).f.Q},
    {id:'ir',label:'Net infrared given off',unit:'W/m²',lvl:'ap',min:-100,max:600,d:0,get:s=>cur(s).f.ir},
    {id:'conv',label:'Heat carried off by the air',unit:'W/m²',lvl:'ap',min:-200,max:600,d:0,get:s=>cur(s).f.H},
    {id:'evap',label:'Heat used to evaporate water',unit:'W/m²',lvl:'ap',min:0,max:600,d:0,get:s=>cur(s).f.LE},
    {id:'grd',label:'Heat stored below the surface',unit:'W/m²',lvl:'ap',min:-200,max:400,d:0,get:s=>cur(s).f.G},
    {id:'day',label:'Sunlight absorbed per day',unit:'MJ/m²',lvl:'ap',min:0,max:40,d:1,get:s=>dayMJ(s,cur(s).s)}
  ],
  graphs:[{id:'temp',label:'Surface and air temperature',lines:['T','Tair']},{id:'all',label:'Every surface in this view',lvl:'honors',custom:true},{id:'flux',label:'Where the absorbed energy goes',lvl:'ap',lines:['absW','ir','conv','evap','grd']}],
  defaultGraph:'temp',
  plot(sim,ctx,box,id){const st=sim.st,set=SETS[curSet(sim)],idx=set.map(s=>ALL.indexOf(s)),H=st.H||[],xmax=Math.max(16,sim.t),xmin=xmax-16;
    let lo=1e9,hi=-1e9;H.forEach(r=>{if(r.t<xmin)return;idx.forEach(j=>{lo=Math.min(lo,r.T[j]);hi=Math.max(hi,r.T[j]);});});if(!(hi>lo)){lo=0;hi=100;}
    const items=set.map((s,i)=>({label:labelOf(curSet(sim),s),color:serColor(i)}));ctx.font='13px '+FONT;let lx=box.L,ly=14;items.forEach(it=>{const w=ctx.measureText(it.label).width+40;if(lx>box.L&&lx+w>box.L+box.W){lx=box.L;ly+=18;}
      ctx.strokeStyle=it.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(lx+16,ly);ctx.stroke();txt(ctx,it.label,lx+21,ly,{s:13,c:PAL['muted'],b:'middle'});lx+=w;});
    const b2={L:box.L,T:ly+14,W:box.W,H:box.H-(ly+14-box.T),cw:box.cw,ch:box.ch};
    const ax=axes(ctx,b2,{xmin,xmax,ymin:Math.floor((lo-5)/10)*10,ymax:Math.ceil((hi+5)/10)*10,xl:'Time (h)',yl:'Surface temperature (°F)'});
    ctx.save();ctx.beginPath();ctx.rect(b2.L,b2.T,b2.W,b2.H);ctx.clip();
    idx.forEach((j,i)=>{ctx.strokeStyle=serColor(i);ctx.lineWidth=set[i]===cur(sim).s?3.5:2;ctx.beginPath();let pen=false;H.forEach(r=>{if(r.t<xmin)return;const X=ax.X(r.t),Y=ax.Y(r.T[j]);pen?ctx.lineTo(X,Y):ctx.moveTo(X,Y);pen=true;});ctx.stroke();});ctx.restore();},
  initVis(sim){sim.vis.ph=[];sim.vis.ir=[];},
  draw(sim,ctx,vdt,k,t){if(albB(sim)){drawBench(sim,ctx,vdt,k,t);return;}drawFull(sim,ctx,vdt,k,t);}
};
/* the Full lab scene: sky with the Sun's path, the surfaces in a 3 by 2 grid, and the energy panel for the chosen surface */
function cellRect(i){const c=i%3,r=(i/3)|0;return [16+c*176,214+r*116,168,108];}
function drawFull(sim,ctx,vdt,k,t){const p=sim.p,setK=curSet(sim),set=SETS[setK],c=cur(sim),env=c.env,v=sim.vis,R=Math.random,fs=Math.min(12.5*k,20),hon=atLeast('honors'),ap=atLeast('ap');
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  const day=env.el>0;ctx.fillStyle=day?'rgba(110,170,235,'+(0.12+0.25*clamp(env.el/60,0,1))+')':'rgba(20,30,70,.22)';ctx.fillRect(0,0,544,206);
  // the Sun's path today
  const se=SEAS[p.season]||SEAS.sep,lat=latOf(sim),dl=dayLen(lat,se.dec),rise=se.noon-dl/2,set2=se.noon+dl/2,h=env.h;
  const sxy=hh=>{const e=sunAt(hh,lat,se.dec,se.noon).el;const f=dl>=23.9?((hh-se.noon+12)%24)/24:(hh-rise)/Math.max(0.1,set2-rise);return [40+460*clamp(f,0,1),196-2.3*Math.max(0,e)];};
  ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([4,5]);ctx.lineWidth=1.2;ctx.beginPath();for(let q=0;q<=40;q++){const hh=dl>=23.9?se.noon-12+q*0.6:rise+q*(set2-rise)/40,[x,y]=sxy(hh);q?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.setLineDash([]);
  let sun=null;if(day){sun=sxy(h);ctx.fillStyle='#ffcc33';ctx.beginPath();ctx.arc(sun[0],sun[1],15,0,6.283);ctx.fill();}
  txt(ctx,(setK==='ice'?'Arctic Ocean':'Aurora, CO')+' · air '+Math.round(K2F(env.Ta))+' °F'+(hon?' · wind '+p.wind+' mph':''),16,26,{s:Math.min(13.5*k,21),w:700});
  if(!day)txt(ctx,'Night: the Sun is down',16,26+Math.min(13.5*k,21)*1.4,{s:fs,c:PAL['cv-soft']});
  else txt(ctx,'Sun '+Math.round(env.el)+'° up',16,26+Math.min(13.5*k,21)*1.4,{s:fs,c:PAL['cv-soft']});
  // surfaces
  const shade=p.shade==='shade';
  set.forEach((s,i)=>{const [x,y,w,hh]=cellRect(i),S=SF[s],L=sim.st.L[s],T=K2F(L.T1),dT=(L.T1-env.Ta)*1.8;
    ctx.fillStyle=S.col;rr(ctx,x,y,w,hh,8);ctx.fill();
    if(dT>2){ctx.fillStyle='rgba(255,60,20,'+clamp(dT/120,0,0.42)+')';rr(ctx,x,y,w,hh,8);ctx.fill();}
    if(shade){ctx.fillStyle='rgba(0,0,0,.30)';rr(ctx,x,y,w,hh,8);ctx.fill();}
    ctx.strokeStyle=s===c.s?PAL['rj']:PAL['line'];ctx.lineWidth=s===c.s?4:1.5;rr(ctx,x,y,w,hh,8);ctx.stroke();
    const ink=shade&&S.ink!=='#ffffff'?'#ffffff':S.ink;
    txt(ctx,labelOf(setK,s),x+10,y+8+fs,{s:fs,w:700,c:shade?'#ffffff':S.ink});
    txt(ctx,Math.round(T)+' °F',x+10,y+hh-12,{s:Math.min(20*k,30),w:700,c:shade?'#ffffff':ink});
    if(ap&&setK==='ice'&&k<1.5)txt(ctx,dayMJ(sim,s).toFixed(0)+' MJ/m²·day',x+w-8,y+hh-14,{s:Math.min(11*k,16),c:shade?'#ffffff':S.ink,a:'right'});});
  if(shade){ctx.fillStyle='#2f6b2a';for(let q=0;q<9;q++){ctx.beginPath();ctx.arc(30+q*64,202,30,Math.PI,0);ctx.fill();}}
  // sunlight packets aimed at the chosen surface: some bounce back (albedo), the rest turn into heat
  const ci=set.indexOf(c.s),[cx,cy,cw,ch]=cellRect(Math.max(0,ci));
  if(vdt>0&&sun&&ci>=0){let n=c.f.S/1000*vdt*60*(RM?.4:1);while(n>0){if(R()<n&&v.ph.length<110)v.ph.push({x:sun[0],y:sun[1],tx:cx+12+R()*(cw-24),ty:cy+20+R()*(ch-40),s:0,up:false});n--;}}
  v.ph.forEach(q=>{if(!q.up){q.s+=vdt*1.4;const f=Math.min(1,q.s);q.cx=lerp(q.x,q.tx,f);q.cy=lerp(q.y,q.ty,f);if(f>=1){if(shade&&R()>0.25){q.dead=true;return;}if(R()<c.S.a){q.up=true;q.vx=(q.tx-q.x)*0.6;q.vy=-(q.ty-q.y)*0.8;}else{q.dead=true;if(v.ir.length<60)v.ir.push({x:q.tx,y:q.ty,a:1});}}}
    else{q.cx+=q.vx*vdt*0.9;q.cy+=q.vy*vdt*0.9;if(q.cy<0||q.cx>544)q.dead=true;}});
  v.ph=v.ph.filter(q=>!q.dead);
  ctx.fillStyle='#ffd22e';ctx.strokeStyle='rgba(120,80,0,.6)';ctx.lineWidth=1;v.ph.forEach(q=>{if(q.cx===undefined)return;ctx.beginPath();ctx.arc(q.cx,q.cy,4,0,6.283);ctx.fill();ctx.stroke();});
  v.ir.forEach(q=>{q.y-=vdt*30;q.a-=vdt*0.9;});v.ir=v.ir.filter(q=>q.a>0);ctx.strokeStyle='#ff4a2a';ctx.lineWidth=2;v.ir.forEach(q=>{ctx.globalAlpha=clamp(q.a,0,1);ctx.beginPath();for(let j=0;j<=6;j++){const yy=q.y-j*3,xx=q.x+Math.sin(j*1.6)*3;j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();});ctx.globalAlpha=1;
  drawPanel(sim,ctx,k,c);}
function drawPanel(sim,ctx,k,c){const X=552,Y=10,W=236,H=432,hon=atLeast('honors'),ap=atLeast('ap'),fs=Math.min(12*k,19),setK=curSet(sim);
  ctx.fillStyle=PAL['card'];rr(ctx,X,Y,W,H,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,X,Y,W,H,10);ctx.stroke();
  let y=Y+10+Math.min(15*k,23);txt(ctx,labelOf(setK,c.s),X+12,y,{s:Math.min(15*k,23),w:700});y+=fs*1.45;txt(ctx,'Albedo '+c.S.a.toFixed(2),X+12,y,{s:fs,c:PAL['cv-soft']});
  const bar=(label,frac,col,val)=>{y+=fs*1.5;txt(ctx,label,X+12,y,{s:fs});if(val!==undefined&&ap)txt(ctx,val,X+W-12,y,{s:fs,w:700,a:'right'});y+=7;ctx.fillStyle=PAL['line'];ctx.fillRect(X+12,y,W-24,9);ctx.fillStyle=col;ctx.fillRect(X+12,y,(W-24)*clamp(frac,0,1),9);y+=9;};
  const f=c.f,Sx=Math.max(1,f.S);
  if(f.S<1){y+=fs*1.5;txt(ctx,'No sunlight now.',X+12,y,{s:fs});y+=fs*1.4;txt(ctx,'It loses the heat it stored.',X+12,y,{s:fs,c:PAL['cv-soft']});}
  else{bar('Sunlight hitting it',f.S/1000,'#f2c230',Math.round(f.S)+' W/m²');bar('Reflected: '+Math.round(100*c.S.a)+'%',c.S.a*f.S/1000,'#f7e08a',Math.round(c.S.a*f.S));bar('Absorbed: '+Math.round(100*(1-c.S.a))+'%',f.Q/1000,'#e8772e',Math.round(f.Q));}
  if(hon){y+=fs*1.9;txt(ctx,'Heat leaving the surface',X+12,y,{s:fs,w:700});
    const out=[[ 'Infrared glow',f.ir,'#d9472b'],['Warms the air',f.H,'#5b8fd9'],['Evaporation',f.LE,'#3aa58f'],[f.G>=0?'Into the ground':'Out of the ground',Math.abs(f.G),'#9a7b4f']],tot=Math.max(50,...out.map(o=>Math.abs(o[1])));
    out.forEach(o=>bar(o[0],Math.abs(o[1])/tot,o[2],Math.round(o[1])+(ap?' W/m²':'')));}
  if(ap&&setK==='ice'){y+=fs*1.8;if(y<Y+H-fs*2.6){txt(ctx,'Warmer → ice melts → darker',X+12,y,{s:fs,w:600,c:PAL['rj']});y+=fs*1.35;txt(ctx,'water absorbs more → warmer',X+12,y,{s:fs,w:600,c:PAL['rj']});}}}
Object.assign(ALBEDO,{
  narrate(sim){if(albB(sim))return benchNarrate(sim);const c=cur(sim),p=sim.p,T=K2F(c.L.T1),Ta=K2F(c.env.Ta),dT=T-Ta,nm=labelOf(curSet(sim),c.s).toLowerCase(),setK=curSet(sim),pct=Math.round(100*c.S.a),hon=atLeast('honors');
    const diff=Math.abs(dT)<1.5?'about the same as the air':Math.round(Math.abs(dT))+' °F '+(dT>0?'warmer':'cooler')+' than the air';
    if(SF[c.s].cap!==undefined&&c.L.melt>1)return '<b>The '+nm+' is at 32 °F and melting.</b> It reflects '+pct+'% of the sunlight, and the energy it does absorb goes into melting ice instead of warming it.';
    if(setK==='ice'&&c.s==='ocean')return '<b>Open ocean reflects only 6% of the sunlight</b> and absorbs '+dayMJ(sim,'ocean').toFixed(0)+' MJ/m² a day, compared with '+dayMJ(sim,'snow').toFixed(0)+' for snow. That heat melts sea ice from below, which uncovers more dark water: the <b>ice–albedo feedback</b>.';
    if(c.f.S<1)return '<b>The Sun is down.</b> The '+nm+' is '+Math.round(T)+' °F, '+diff+'. '+(dT>2?'Heat stored in the material during the day is still coming out.':'It cools by glowing infrared into the clear sky.');
    if(p.shade==='shade')return '<b>In the shade</b>, only scattered light reaches the '+nm+', so it stays close to the air: '+Math.round(T)+' °F, '+diff+'.'+(dT>4?' Some of the heat it stored in the sun is still coming out.':'');
    let why=c.s==='grass'||c.s==='greenroof'?' Water evaporating from the leaves carries heat away, so it stays cooler than its albedo alone would suggest.':c.s==='roof'?' White reflects most of the sunlight, so it absorbs little.':c.s==='blacktop'||c.s==='darkroof'?' Dark surfaces absorb almost all of the sunlight.':c.s==='snow'?' Snow reflects most of the sunlight.':'';
    if(hon&&p.moist==='dry'&&c.s==='grass')why=' In a drought the grass closes its pores and evaporates less water, so it heats up.';
    if(setK==='roofs'&&c.s==='darkroof')why=' Dark roofs and pavement make cities hotter than the countryside: the <b>urban heat island</b>.';
    return 'The '+nm+' reflects <b>'+pct+'%</b> of the sunlight and absorbs the rest. It is <b>'+Math.round(T)+' °F</b>, '+diff+'.'+why;},
  tour:[
    {title:'Six surfaces, one sky',text:'These six squares of ground sit side by side under the same sky, in the same air. Each label shows how hot that surface is right now, read with an infrared thermometer.',focus:[8,206,536,236],speed:0.5,setup(sim){BioLab.setValues(sim,{surf:'blacktop',shade:'sun',airT:78});jumpTo(sim,9);}},
    {title:'Reflected or absorbed',text:'Yellow dots are sunlight. When sunlight hits blacktop, only 10% bounces back. The other 90% is absorbed and turns into heat. The fraction a surface reflects is its <b>albedo</b>.',focus:[548,6,244,440],speed:0.5,setup(sim){jumpTo(sim,13);}},
    {title:'Light surfaces stay cooler',text:'A white roof has an albedo of 0.70: it reflects 70% of the sunlight. In the same sun as the blacktop, it absorbs a third as much energy and stays far cooler.',focus:[8,206,536,236],speed:0.5,setup(sim){BioLab.setValues(sim,{surf:'roof'});}},
    {title:'Grass sweats',text:'Grass reflects less than concrete, yet it is cooler. Water evaporates from the leaves, and evaporation carries heat away, the way sweat cools your skin.',focus:[8,206,536,236],speed:0.5,setup(sim){BioLab.setValues(sim,{surf:'grass'});}},
    {title:'Into the shade',text:'A tree now shades every surface. Only scattered light gets through, so each one drifts toward the air temperature. The blacktop cools slowly, because it stored heat.',focus:[8,206,536,236],speed:1,setup(sim){BioLab.setValues(sim,{surf:'blacktop',shade:'shade'});}},
    {title:'After sunset',text:'At 7 PM the Sun is setting. Heavy materials like blacktop and brick hold the day’s heat and release it into the evening, while grass cools quickly.',focus:[8,206,536,236],speed:1,setup(sim){BioLab.setValues(sim,{shade:'sun'});jumpTo(sim,19);}},
    {lvl:'honors',title:'Wind and water',text:'Wind carries heat off a hot surface, and wet pavement after a rain cools by evaporation. Try the Wind and Moisture controls, and read the bars for where the heat goes.',focus:[548,6,244,440],speed:0.5,setup(sim){BioLab.setValues(sim,{surf:'blacktop',wind:5});jumpTo(sim,13);}},
    {lvl:'ap',title:'Roofs and the urban heat island',text:'Cities replace grass and trees with dark roofs and pavement, so they run hotter than the countryside. A white roof reflects the sunlight; a green roof cools by evaporation and insulates the building.',focus:[8,206,536,236],speed:0.5,setup(sim){BioLab.setValues(sim,{set:'roofs',surf:'darkroof'});jumpTo(sim,13);}},
    {lvl:'ap',title:'The ice–albedo feedback',text:'Snow on sea ice reflects 85% of the sunlight; open ocean reflects 6%. When warming melts the ice, dark water absorbs far more energy, which melts more ice. A change that feeds itself is a <b>positive feedback</b>.',focus:[8,206,536,236],speed:0.5,setup(sim){BioLab.setValues(sim,{set:'ice',surf:'ocean'});jumpTo(sim,13);}}],
  onTourExit(sim){BioLab.setValues(sim,{set:'campus',surf:'blacktop',shade:'sun',airT:78,season:'sep',wind:5,moist:'normal'});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'You point the infrared thermometer at a white roof in the 1 PM sun, then at the blacktop right next to it. What happens to the reading?',
     choices:['It jumps much higher on the blacktop','About the same: same sun, same air','It drops on the blacktop'],correct:0,
     baseline:{surf:'roof'},baselineAction:'j13',change:{surf:'blacktop'},changeText:'Thermometer moved to the blacktop',watch:'T',
     explain:{bio:'The same sunlight hits both, but the blacktop absorbs 90% of it and the white roof only 30%. More absorbed energy means a hotter surface: here the blacktop ends up about 30 °F hotter.',
              honors:'Absorbed sunlight is (1 − albedo) × S. With S near 890 W/m², the blacktop absorbs about 800 W/m² and the white roof about 265 W/m². Each surface warms until the heat it loses matches what it absorbs.'}},
    {lvl:'bio',q:'The blacktop has baked in the sun all morning. At 1 PM a tree’s shade falls on it. What happens over the next two hours?',
     choices:['It drops to the air temperature right away','It cools down gradually toward the air temperature','It stays just as hot'],correct:1,
     baseline:{surf:'blacktop'},baselineAction:'j13',change:{shade:'shade'},changeText:'Shade falls on the surfaces',watch:'T',
     explain:{bio:'Blacktop is heavy and stores a lot of heat, so it cannot cool instantly. It gives the stored heat back over about an hour and ends up close to the air temperature. That stored heat is why a parking lot still feels warm in the evening.'}},
    {lvl:'bio',instant:true,q:'Which surface reflects the most sunlight?',choices:['Fresh snow','Grass','Blacktop','Brick'],correct:0,
     explain:'Fresh snow has an albedo of about 0.85: it reflects 85% of the sunlight. Blacktop reflects only about 10%. That is why snow can stay frozen on a sunny day and why fresh snow is so bright to look at.'},
    {lvl:'honors',q:'Grass reflects less sunlight than the concrete sidewalk (albedo 0.23 vs 0.32). In the same 1 PM sun, you move the thermometer from the concrete to the grass. What happens?',
     choices:['It rises, because grass absorbs more sunlight','It drops, because the grass is cooling itself','No change'],correct:1,
     baseline:{surf:'concrete'},baselineAction:'j13',change:{surf:'grass'},changeText:'Thermometer moved to the grass',watch:'T',
     explain:{honors:'The grass absorbs a little more sunlight, but most of that energy goes into evaporating water from its leaves (transpiration) instead of heating it. Albedo is only one part of the energy budget. Look at the Evaporation bar.'}},
    {lvl:'honors',q:'The lawn has had no water for weeks. What happens to the grass temperature in the afternoon sun?',
     choices:['It rises a lot, because less water evaporates','No change: the grass is the same color','It drops'],correct:0,
     baseline:{surf:'grass'},baselineAction:'j13',change:{moist:'dry'},changeText:'Drought: the grass evaporates much less water',watch:'T',
     explain:{honors:'Drought-stressed grass closes its stomata to save water, so it evaporates much less. The energy that went into evaporation now heats the grass, and it climbs toward pavement temperatures.'}},
    {lvl:'honors',q:'The wind picks up from 5 to 20 mph over the hot blacktop. What happens to its temperature?',
     choices:['It drops, because moving air carries heat away faster','Nothing: wind does not change surface temperature','It rises, because wind brings more heat'],correct:0,
     baseline:{surf:'blacktop',wind:5},baselineAction:'j13',change:{wind:20},changeText:'Wind raised to 20 mph',watch:'T',
     explain:{honors:'Convection grows with wind speed: h = 4 + 3u W/m² per degree, with u in m/s. Stronger wind sweeps the hot air off the surface and brings cooler air, so the blacktop settles at a lower temperature.'}},
    {lvl:'ap',q:'Snow lies in the sun on a spring afternoon. The air warms from 50 °F to 65 °F. What happens to the snow surface temperature?',
     choices:['It rises with the air','It stays at 32 °F: the extra energy melts snow','It drops'],correct:1,
     baseline:{surf:'snow',airT:50},baselineAction:'j13',change:{airT:65},changeText:'Air temperature raised to 65 °F',watch:'T',
     explain:{ap:'Snow cannot warm above 0 °C (32 °F). Extra energy, from sunlight or from warm air, melts it instead: 334 kJ for every kilogram. The surface stays at 32 °F until the snow is gone.'}},
    {lvl:'ap',q:'It is 9 PM, two hours after sunset. You point the thermometer at the lawn, then at the blacktop beside it. What happens to the reading?',
     choices:['It rises: the blacktop is still warmer','No change: with no sun they are the same','It drops: blacktop loses heat faster'],correct:0,
     baseline:{surf:'grass'},baselineAction:'j19',at:2,reveal:3,change:{surf:'blacktop'},changeText:'Thermometer moved to the blacktop',watch:'T',
     explain:{ap:'Blacktop stored heat in its top 20 cm during the day and keeps releasing it at night. Grass holds little heat near its surface and radiates into the clear sky, so it ends up cooler than the air. This nighttime difference is a big part of the urban heat island.'}},
    {lvl:'ap',instant:true,q:'A city repaves a street with lighter asphalt, raising its albedo from 0.10 to 0.20. By about what percent does the sunlight it absorbs drop?',choices:['50%','About 11%','About 20%','10%'],correct:1,
     explain:'Absorbed sunlight is (1 − albedo) × S. It falls from 0.90 S to 0.80 S, a drop of 0.10/0.90 ≈ 11%. Doubling the albedo of a dark surface does not halve what it absorbs.'}],
  lab:{bio:'<p><b>Question:</b> Which surface gets hottest in the sun, and which stays coolest?</p><ol><li>Press <b>Go to 1 PM</b>.</li><li>Choose each surface and record a trial of its temperature.</li><li>Switch to <b>In the shade</b>, wait an hour of sim time, and record each surface again.</li></ol><p>Rank the surfaces from hottest to coolest. Explain the ranking with albedo.</p>',
       honors:'<p><b>Question:</b> Does albedo alone predict how hot a surface gets?</p><ol><li>At 1 PM, record the temperature and Sunlight absorbed for every surface.</li><li>Plot albedo (Sunlight reflected) against surface temperature.</li><li>Repeat for grass in Drought and Normal moisture, and for blacktop at 0, 10 and 20 mph wind.</li></ol><p>Which point does not fit the albedo pattern? Use the energy bars to explain why.</p>',
       ap:'<p><b>Question:</b> How much can cool roofs and green roofs reduce the urban heat island?</p><ol><li>Set Compare to Roofs and heat island. On June 21 with a 90 °F high, record each roof and the parking lot at 1 PM and at 9 PM.</li><li>Record every energy term for the dark, white and green roofs at 1 PM.</li><li>Then compare snow and open ocean under Ice and ocean, using Sunlight absorbed per day.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain which roof helps a city most by day and by night, and why melting sea ice speeds up Arctic warming.</p>'},
  terms:[{t:'Albedo',d:'The fraction of sunlight a surface reflects, from 0 (none) to 1 (all).'},{t:'Absorb',d:'To take in light energy, which turns into heat.'},{t:'Infrared thermometer',d:'A thermometer that reads a surface’s temperature from the infrared light it gives off.'},{t:'Shade',d:'A place where something blocks the direct sunlight, so only scattered light arrives.'},
    {lvl:'honors',t:'Transpiration',d:'Water evaporating from plant leaves. Evaporation uses energy, so it cools the leaves.'},{lvl:'honors',t:'Thermal mass',d:'How much heat a material stores. Heavy materials warm slowly and stay warm longer.'},{lvl:'honors',t:'Convection',d:'Heat carried away by moving air.'},{lvl:'honors',t:'Urban heat island',d:'A city that is warmer than the land around it, because of dark surfaces, buildings and less vegetation.'},
    {lvl:'ap',t:'Surface energy balance',d:'Absorbed sunlight plus sky infrared equals infrared emitted plus heat to the air, evaporation and storage.'},{lvl:'ap',t:'Emissivity',d:'How well a surface gives off infrared, from 0 to 1. Most natural surfaces are 0.9 to 0.98.'},{lvl:'ap',t:'Ice–albedo feedback',d:'Warming melts ice, which exposes darker water or land that absorbs more sunlight, which causes more warming.'},{lvl:'ap',t:'Green roof',d:'A roof planted with vegetation, which cools by evaporation and insulates the building.'}],
  about:'<p><b>The energy balance.</b> Each surface is a thin top layer over a thicker layer below. The top layer gains absorbed sunlight, (1 − albedo) × S, and infrared from the sky, and it loses infrared (emissivity 0.95), heat to the air (h = 4 + 3u W/m² per kelvin, u the wind speed in m/s), evaporation, and heat conducted downward. Sunlight is a clear-sky model for Aurora, Colorado (39.7° N): direct beam through an atmosphere with transmissivity 0.80, plus scattered skylight. The sky’s infrared uses an emissivity of 0.74 for dry Colorado air. The air temperature follows a daily curve with its high at 3 PM and a 26 °F range.</p>'+
    '<p><b>The surfaces.</b> Albedo values are typical published values (Oke, <i>Boundary Layer Climates</i>; the Lawrence Berkeley National Laboratory Heat Island Group): aged blacktop 0.10, concrete 0.32, red brick 0.26, grass 0.23, white roof 0.70, fresh snow 0.85, black roof 0.07, green roof 0.20, bare sea ice 0.50, melt pond 0.25 and open ocean 0.06. Heat capacities and conductivities are those of asphalt, concrete, brick, moist soil, an insulated roof and snow. Grass evaporates up to 90% of its net radiation when watered and 30% in drought; wet pavement evaporates 45%. Snow and ice cannot warm above 0 °C, so extra energy counts as melting.</p>'+
    '<p><b>Simplified:</b> a cloudless sky, flat surfaces, steady wind, shade that blocks 90% of the direct beam, and the same weather every day. Real surfaces vary with age, dirt, slope and moisture, so measured temperatures scatter around these values. The Ice and ocean view moves to 75° N, and its ocean layer is a 2 m mixed layer.</p>'+
    '<p><b>The virtual lab bench.</b> Each of the eight campus spots runs the same model for its own surface, with an albedo drawn from the published range, a shade start time for the tree-shaded spots, and seeded weather for a sunny mid-September afternoon. The infrared thermometer adds about ±0.6 °F of spot-to-spot and reading variation.</p>'
});
BioLab.addPractical({albedo:{
  hook:'On a 90 °F June afternoon in Denver, a black parking lot, a watered lawn and a white roof sit in the same sunshine. How hot does each one get by 3 PM?',
  answer:'The parking lot reaches about 150 °F, the white roof about 108 °F and the lawn about 100 °F. The blacktop reflects only 10% of the sunlight, the white roof 70%. The lawn absorbs nearly as much as the blacktop but spends most of that energy evaporating water.',
  uses:['Cars: on a sunny day a black car’s roof gets roughly 30 to 40 °F hotter than a white one, so a light car needs less air conditioning.',
    'Cool roofs: Denver’s 2017 Green Buildings Ordinance pushes large buildings to add cool roofs, green roofs or solar panels, partly to fight the urban heat island.',
    'Playgrounds: on a summer afternoon blacktop and rubber surfaces can pass 140 °F, hot enough to burn skin, while shaded or grassy areas stay near air temperature.'],
  takeaway:'Dark surfaces absorb most of the sunlight that hits them and get hot; light surfaces reflect it, and wet or living surfaces cool themselves by evaporation. Shade, color and water are the cheapest ways to keep a place cool.',
  lede:'Put six surfaces in the same sun and watch how hot each one gets. Dark ones absorb most of the sunlight; light ones reflect it.',
  tour:['These six squares of ground sit side by side under the same sky, like the parking lot, sidewalk and lawn at school. Each label shows how hot that surface is right now.',
    'The yellow dots are sunlight. On blacktop, only 1 dot in 10 bounces back. The rest is absorbed and turns into heat, which is why the parking lot feels like an oven. How much a surface reflects is its <b>albedo</b>.',
    'A white roof reflects 7 dots in 10, like a white T-shirt on a hot day. In the same sun as the blacktop, it absorbs about a third as much energy and stays far cooler.',
    'Grass reflects less than concrete, yet it is cooler. Water evaporates from the leaves, and evaporation carries heat away, the same way sweat cools you after a run.',
    'Now a tree shades every surface. Only scattered light gets through, so each one drifts toward the air temperature. The blacktop cools slowly, because it soaked up heat all morning.',
    'At 7 PM the Sun is setting. Blacktop and brick hold the day’s heat and release it into the evening, which is why a city stays warm after dark while a lawn cools off quickly.']}});
BioLab.register(ALBEDO);
})();
