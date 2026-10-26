(function(){
'use strict';
const {clamp,rng,rr,txt,pill,polyline,atLeast,PAL,FONT,RM}=BioLab.h;
const PATH_N=polyline([[115,318],[115,214],[268,212],[331,212],[331,172],[405,148],[470,172],[470,262],[470,300]]);
const PATH_F=polyline([[212,300],[212,232],[268,212],[331,212],[331,172],[405,148],[470,172],[470,262],[470,300]]);
/* ---------- Virtual lab benches (Virtual lab mode; see VLAB.md) ----------
   co2o2: a 250 mL bottle read with a CO₂ gas sensor (ppm) and an O₂ gas sensor (%), in four parts:
     empty bottle, 2 g yeast + 2 g sugar in 50 mL water, a plant in the dark, a plant on a sunny windowsill.
   germseeds: 25 dormant and 25 germinating beans in 250 mL bottles, one CO₂ sensor laid on its side,
     1 sample every 15 s for 5 min after a 1 min wait, plus a student-designed extension (germination time, temperature).
   Run-to-run variation comes from the lab's saved seed and a run counter, so a reload never changes recorded data.
   The bench state (gas in the bottle, probe readings, every recorded reading) lives in sim.vlab.bench. */
function hr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function hn(seed,a,b){const u=Math.max(1e-9,hr(seed,a,b)),w=hr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const BS=10;   // bench seconds per second of sim time: at 1× the bench clock runs 10 times faster than real time
const mmss=s=>{s=Math.max(0,Math.floor(s+1e-6));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const LCD='700 VSIZEpx "Consolas","Menlo","DejaVu Sans Mono","Courier New",monospace';
const r2=v=>Math.round(v*100)/100;
/* the sensor software's screen: fixed colors (a white screen, like the real software), so it reads the same in both themes and in the notebook image */
const SCR={bg:'#ffffff',grid:'#e3e7ed',ax:'#3b4048',ink:'#1d2127',soft:'#5b6470',c:'#c0392b',o:'#1f6fb2',fit:'#2e7d32',cur:'#7b3fb5',bez:'#2b2f36',lab:'#d7dbe0',lcd:'#cfe3c8',lcdInk:'#1b2a1b'};
function nice(lo,hi,minSpan){const mid=(lo+hi)/2,span=Math.max(hi-lo,minSpan)*1.2;lo=mid-span/2;hi=mid+span/2;const raw=span/4,p=Math.pow(10,Math.floor(Math.log10(raw))),m=raw/p,st=(m<1.5?1:m<3?2:m<7?5:10)*p;
  return {lo:Math.floor(lo/st+1e-9)*st,hi:Math.ceil(hi/st-1e-9)*st,st};}
const dpOf=st=>st>=1-1e-9?0:st>=0.1-1e-9?1:st>=0.01-1e-9?2:3;
const fmt=(v,d)=>{const s=v.toFixed(d);return /^-0(\.0*)?$/.test(s)?s.slice(1):s;};
function lcdCard(ctx,x,y,w,h,label,value,vs,fs){ctx.fillStyle='#3a3f47';rr(ctx,x,y,w,h,8);ctx.fill();txt(ctx,label,x+10,y+fs+4,{s:fs,w:700,c:SCR.lab});
  const sy=y+fs+10,sh=h-fs-16;ctx.fillStyle=SCR.lcd;rr(ctx,x+8,sy,w-16,sh,5);ctx.fill();ctx.fillStyle=SCR.lcdInk;let f=vs;ctx.font=LCD.replace('VSIZE',String(f));while(f>12&&ctx.measureText(value).width>w-30){f--;ctx.font=LCD.replace('VSIZE',String(f));}ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(value,x+w-16,sy+sh/2+1);}
/* axes on the sensor screen: left axis (and optional right axis) with grid lines */
function scrFrame(ctx,X,Y,W,H,o){const fs=o.fs,L=X+fs*4.3,Rm=X+W-(o.R?fs*4.3:fs*1.4),T=Y+fs*2.4,B=Y+H-fs*2.7;
  ctx.fillStyle=SCR.bg;ctx.fillRect(X,Y,W,H);
  const xm=v=>L+v/o.xmax*(Rm-L),yl=v=>B-(v-o.L.r.lo)/(o.L.r.hi-o.L.r.lo)*(B-T),yr=o.R?v=>B-(v-o.R.r.lo)/(o.R.r.hi-o.R.r.lo)*(B-T):null;
  ctx.lineWidth=1;
  for(let i=0;;i++){const v=o.L.r.lo+i*o.L.r.st;if(v>o.L.r.hi+o.L.r.st*1e-6)break;const y=Math.round(yl(v))+.5;ctx.strokeStyle=SCR.grid;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(Rm,y);ctx.stroke();
    txt(ctx,fmt(v,dpOf(o.L.r.st)),L-5,y+fs*0.36,{s:fs,c:o.L.color,a:'right'});}
  if(o.R)for(let i=0;;i++){const v=o.R.r.lo+i*o.R.r.st;if(v>o.R.r.hi+o.R.r.st*1e-6)break;txt(ctx,fmt(v,dpOf(o.R.r.st)),Rm+5,yr(v)+fs*0.36,{s:fs,c:o.R.color});}
  for(let i=0;;i++){const v=i*o.xst;if(v>o.xmax+1e-6)break;const x=Math.round(xm(v))+.5;ctx.strokeStyle=SCR.grid;ctx.beginPath();ctx.moveTo(x,T);ctx.lineTo(x,B);ctx.stroke();
    txt(ctx,fmt(v,o.xdp||0),x,B+fs*1.3,{s:fs,c:SCR.soft,a:'center'});}
  ctx.strokeStyle=SCR.ax;ctx.lineWidth=1.5;ctx.strokeRect(L,T,Rm-L,B-T);
  txt(ctx,o.xl,(L+Rm)/2,Y+H-fs*0.3,{s:fs,c:SCR.ink,a:'center'});
  txt(ctx,o.L.label,L,Y+fs*1.5,{s:fs,w:700,c:o.L.color});if(o.R)txt(ctx,o.R.label,Rm,Y+fs*1.5,{s:fs,w:700,c:o.R.color,a:'right'});
  return {xm,yl,yr,L,R:Rm,T,B};}

/* ===== co2o2: Photosynthesis versus respiration with CO₂ and O₂ gas sensors ===== */
const CO={parts:[{n:1,name:'empty bottle',short:'Empty bottle',contents:'none',end:300},{n:2,name:'yeast and sugar',short:'Yeast + sugar',contents:'yeast',end:600},
    {n:3,name:'plant in the dark',short:'Plant, dark',contents:'plant',loc:'dark',end:600},{n:4,name:'plant in sunlight',short:'Plant, sunlight',contents:'plant',loc:'window',end:600}],
  air:20.95,       // % O₂ in dry room air
  tauC:40,tauO:15, // s: response time of the CO₂ probe (gas diffuses into it) and of the O₂ probe
  Gam:40,Kc:250,   // ppm: the leaves' CO₂ compensation point, and the CO₂ level that gives half the maximum photosynthesis rate
  Ik:0.15,         // light (as a share of full sun) that gives half the maximum photosynthesis rate
  room:0.05};      // classroom light at the lab bench, as a share of full sun
function coPar(seed){return {room:430+140*hr(seed,1,0),                   // ppm CO₂ in the classroom
  off:-0.05+0.035*hn(seed,2,0),                                            // the O₂ sensor's calibration offset (%)
  Py:7.0*Math.exp(0.15*hn(seed,3,0)),tauY:150*Math.exp(0.2*hn(seed,4,0)),  // yeast: top CO₂ output (ppm/s in the bottle) and how fast it wakes up (s)
  pf:Math.exp(0.18*hn(seed,5,0)),                                          // the size of this group's plant
  sun:0.8+0.2*hr(seed,6,0)};}                                              // how bright the windowsill is today, as a share of full sun
const coLocs={bench:'On the lab bench',dark:'In a box (dark)',window:'On a sunny windowsill'};
function coInit(sim){const b=sim.vlab.bench,P=coPar(sim.vlab.seed);
  if(!Array.isArray(b.runs))b.runs=[null,null,null,null];if(!Array.isArray(b.cap))b.cap=[null,null,null,null];
  if(b.part===undefined)b.part=-1;if(!b.contents)b.contents='none';if(b.ins===undefined)b.ins=false;if(b.cur===undefined)b.cur=-1;if(b.last===undefined)b.last=-1;
  ['att','yatt','capN','idleS'].forEach(k=>{if(!Number.isFinite(b[k]))b[k]=0;});if(!b.loc)b.loc='bench';
  if(!b.g||!Number.isFinite(b.g.C))b.g={C:P.room,O:CO.air,Cp:P.room,Op:CO.air,A:0,tY:0};
  if(!b.disp)b.disp={c:Math.round(P.room),o:r2(CO.air+P.off)};
  return {kind:'co',P,hold:false,holdAt:0,acc:0,bub:[]};}
const coRec=b=>b.cur>=0?b.runs[b.cur]:null;
/* gas sources in the closed bottle, per second: dC in ppm, dO in % */
function coRates(sim,g){const b=sim.vlab.bench,P=sim.st.B.P;
  if(b.contents==='yeast'){const ya=Math.exp(0.06*hn(sim.vlab.seed,7,b.yatt)),act=1-Math.exp(-(g.tY+20)/P.tauY),Pr=P.Py*ya*act,fe=0.15+0.3*(1-Math.exp(-g.tY/360));
    return {dC:Pr,dO:-Pr*(1-fe)/1e4,act};}   // fe: the share of CO₂ from fermentation, which uses no O₂
  if(b.contents==='plant'){const R=0.5*P.pf,I=g.A,Cx=Math.max(0,g.C-CO.Gam),Pg=2.6*P.pf*I/(I+CO.Ik)*Cx/(Cx+CO.Kc);return {dC:R-Pg,dO:-(R-Pg)/1e4,act:0};}
  return {dC:0,dO:0,act:0};}
function coPhys(sim,h){const b=sim.vlab.bench,g=b.g,P=sim.st.B.P,loc=b.loc;
  const Lt=b.contents==='plant'?(loc==='window'?P.sun:loc==='dark'?0:CO.room):0;g.A+=(Lt-g.A)*(1-Math.exp(-h/45));
  if(b.contents==='yeast')g.tY+=h;
  if(b.ins){const r=coRates(sim,g);g.C=Math.max(0,g.C+r.dC*h);g.O+=r.dO*h;}else{g.C=P.room;g.O=CO.air;}
  g.Cp+=(g.C-g.Cp)*(1-Math.exp(-h/CO.tauC));g.Op+=(g.O-g.Op)*(1-Math.exp(-h/CO.tauO));}
function coRead(sim,key,s){const g=sim.vlab.bench.g,P=sim.st.B.P,seed=sim.vlab.seed;
  return {c:Math.round(clamp(g.Cp+(3+0.004*g.Cp)*hn(seed,key,s),0,10000)),o:r2(g.Op+P.off+0.006*hn(seed,key+1,s))};}
function coTick(sim,rec){const s=Math.floor(rec.t+1e-6);while(rec.lastS<s){rec.lastS++;const d=coRead(sim,1000+rec.part*37+rec.att*5,rec.lastS);rec.co2[rec.lastS]=d.c;rec.o2[rec.lastS]=d.o;sim.vlab.bench.disp=d;}}
function coIdle(sim,h){const B=sim.st.B,b=sim.vlab.bench;B.acc+=h;while(B.acc>=1){B.acc-=1;b.idleS++;b.disp=coRead(sim,9000,b.idleS);}}
const coReads=rec=>[60,rec.end];
function coStep(sim,ds){const B=sim.st.B,b=sim.vlab.bench;if(B.hold){if(!sim.running)return;B.hold=false;}
  if(b.loc!==sim.p.coLoc)b.loc=sim.p.coLoc;
  while(ds>1e-9){let h=Math.min(ds,0.5);const rec=coRec(b);
    if(rec&&!rec.done){if(rec.loc!==b.loc)rec.mixed=true;
      const nx=Math.min(...coReads(rec).filter(x=>x>rec.t+1e-9));
      if(rec.t+h>=nx-1e-9){h=Math.max(0,nx-rec.t);coPhys(sim,h);rec.t=nx;coTick(sim,rec);ds-=h;if(nx>=rec.end-1e-9)rec.done=true;
        if(sim.p.pauseRead){B.hold=true;B.holdAt=nx;BioLab.pause(sim);return;}continue;}
      coPhys(sim,h);rec.t+=h;coTick(sim,rec);}
    else{coPhys(sim,h);coIdle(sim,h);}
    ds-=h;}}
const coB=sim=>sim.st&&sim.st.B&&sim.st.B.kind==='co'&&sim.vlab?sim.st.B:null;
/* what the meters show right now */
function coShow(sim){const b=sim.vlab.bench,rec=coRec(b);if(rec&&!rec.done&&rec.lastS>=0)return {c:rec.co2[rec.lastS],o:rec.o2[rec.lastS]};return b.disp;}
/* the run the screen shows: this part's run, or the last one */
function coScreenRun(b){const p=b.part>=0?b.part:b.last;return p>=0?b.runs[p]:null;}
function coGraph(ctx,X,Y,W,H,tr,fs){const c=(tr&&tr.c)||[],o=(tr&&tr.o)||[],cf=c.filter(Number.isFinite),of=o.filter(Number.isFinite),end=(tr&&tr.end)||600;
  const rc=cf.length?nice(Math.min(...cf),Math.max(...cf),100):nice(400,600,100),ro=of.length?nice(Math.min(...of),Math.max(...of),0.2):nice(20.8,21.0,0.2);
  const F=scrFrame(ctx,X,Y,W,H,{xmax:end,xst:end/6,xl:'Time (s)',L:{r:rc,color:SCR.c,label:'CO₂ Gas (ppm)'},R:{r:ro,color:SCR.o,label:'O₂ Gas (%)'},fs});
  ctx.save();ctx.beginPath();ctx.rect(F.L,F.T,F.R-F.L,F.B-F.T);ctx.clip();
  [[c,F.yl,SCR.c],[o,F.yr,SCR.o]].forEach(([a,ym,col])=>{ctx.strokeStyle=col;ctx.lineWidth=2;ctx.lineJoin='round';ctx.beginPath();let pen=false;
    a.forEach((v,i)=>{if(!Number.isFinite(v)){pen=false;return;}const x=F.xm(i*tr.dt),y=ym(v);pen?ctx.lineTo(x,y):ctx.moveTo(x,y);pen=true;});ctx.stroke();});
  ctx.restore();
  if(!cf.length)txt(ctx,'The graph draws when you start collecting.',(F.L+F.R)/2,(F.T+F.B)/2,{s:fs,c:SCR.soft,a:'center',b:'middle'});}
const coTrace=rec=>rec?{end:rec.end,dt:1,c:rec.co2.slice(0,rec.lastS+1),o:rec.o2.slice(0,rec.lastS+1)}:null;
/* "Capture graph": a snapshot of the trace (every 5 s), saved with the notebook; the image is drawn from it */
function coSnap(rec){const c=[],o=[];for(let s=0;s<=rec.lastS;s+=5){c.push(rec.co2[s]);o.push(rec.o2[s]);}return {end:rec.end,dt:5,t:Math.min(rec.t,rec.end),c,o};}
const CAPC={};
function coCapImg(p){const S=BioLab.sims&&BioLab.sims.resp,V=S&&S.vlab;if(!V||V.lab.id!=='co2o2')return '';const cp=(V.bench.cap||[])[p];if(!cp)return '';
  const key=V.seed+':'+p+':'+cp.n;if(CAPC[key]!==undefined)return CAPC[key];let url='';
  try{const W=640,H=340,cv=document.createElement('canvas');cv.width=W;cv.height=H;const ctx=cv.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
    txt(ctx,'Part '+(p+1)+': '+CO.parts[p].name+' · captured at '+mmss(cp.t),12,20,{s:14,w:700,c:SCR.ink});coGraph(ctx,0,28,W,H-28,cp,13);url=cv.toDataURL('image/png');}catch(e){url='';}
  return (CAPC[key]=url);}
/* Interim image slot (see the report): a table title is HTML, so a captured graph rides in its title until the engine has an image field. */
function coTitle(p){const base='Table '+(p+1)+': Part '+(p+1)+', '+CO.parts[p].name,u=coCapImg(p);
  return u?base+'<br><img src="'+u+'" width="480" height="255" alt="Sensor graph captured for Part '+(p+1)+'" style="display:block;max-width:100%;height:auto;margin:6px 0 2px;border:1px solid #c8ccd2;border-radius:4px">':base;}
function coCheck(p,col){return (sim,rv,v)=>{const b=sim.vlab.bench,rec=b.runs&&b.runs[p],s=Math.round(+rv*60),pn='Part '+(p+1);
  if(!rec)return 'Run '+pn+' on the bench first, then read the sensors.';
  if(rec.lastS<s)return pn+' has not reached '+rv+' min yet.';
  const arr=col==='co2'?rec.co2:rec.o2,rows=[1,p?10:5],raw=sim.vlab.raw('c:t'+(p+1)+':o2:'+rows.indexOf(+rv)),dec=(raw.split('.')[1]||'').length;
  for(let k=Math.max(0,s-5);k<=Math.min(rec.lastS,s+5);k++){const d=arr[k];if(!Number.isFinite(d))continue;
    if(col==='co2'?Math.abs(d-v)<=2+0.005*d:Math.abs(d-v)<=(dec>=2?0.0051:0.051))return null;}
  const d=arr[s];return col==='co2'?'The CO₂ sensor read '+d+' ppm at '+rv+' min. Check your reading.':'The O₂ sensor read '+d.toFixed(2)+' % at '+rv+' min. Check your reading.';};}
const coRun=(sim,p)=>{const r=sim.vlab.bench.runs[p],P=CO.parts[p];return !!(r&&r.done&&r.contents===P.contents&&(!P.loc||(r.loc===P.loc&&!r.mixed)));};
function coHint(p){return sim=>{const b=sim.vlab.bench,r=b.runs[p],P=CO.parts[p],B=coB(sim),pn='Part '+(p+1);
  if(r&&r.done&&r.contents!==P.contents)return pn+' needs '+(P.contents==='none'?'an empty bottle':P.contents==='yeast'?'the yeast and sugar mixture':'the plant')+' in the bottle. Remove the sensors, empty the bottle and run '+pn+' again.';
  if(r&&r.done&&P.loc&&(r.loc!==P.loc||r.mixed))return 'The bottle has to stay '+(P.loc==='dark'?'in the dark box':'on the sunny windowsill')+' for the whole run. Remove the sensors, empty the bottle and run '+pn+' again.';
  if(!b.ins)return 'Press <b>Insert the sensors and start collecting</b>.';
  if(B&&B.hold)return 'Type the '+(B.holdAt/60)+' min readings in Table '+(p+1)+', then press <b>Play</b>.';
  return 'Let the sensors collect until the screen reaches '+mmss(P.end)+'.';};}
function coNarrate(sim){const b=sim.vlab.bench,B=sim.st.B,rec=coRec(b),pn=b.part>=0?'<b>Part '+(b.part+1)+'.</b> ':'';
  const what=b.contents==='yeast'?'The yeast, sugar and warm water are in the bottle.':b.contents==='plant'?'The plant is in the bottle. '+(b.loc==='dark'?'The box keeps it in the dark.':b.loc==='window'?'Sunlight falls on its leaves.':'It sits on the lab bench under the classroom lights.'):'The bottle is empty.';
  if(!b.ins)return pn+what+' The sensors are out of the bottle, reading room air.';
  if(rec&&!rec.done){if(B.hold)return pn+'<b>Reading time: '+(B.holdAt/60)+' min.</b> Read the CO₂ and O₂ meters on the screen, type both in Table '+(rec.part+1)+', then press Play.';
    return pn+what+' The sensors are collecting. '+(sim.p.pauseRead?'The clock stops at the next reading.':'Read the meters at 1 min and at '+(rec.end/60)+' min.');}
  return pn+'<b>Data collection is done.</b> Press <b>Capture graph</b> to put the graph in your notebook, then remove the sensors and empty the bottle.';}
function drawProbe(ctx,x,top,bot,w,body,tip,label,k){ctx.fillStyle=body;rr(ctx,x-w/2,top,w,bot-top-26,5);ctx.fill();ctx.fillStyle=tip;rr(ctx,x-w/2+3,bot-30,w-6,30,4);ctx.fill();
  ctx.fillStyle='#1d2127';ctx.fillRect(x-w/2-2,top+30,w+4,10);
  ctx.save();ctx.translate(x,top+54);ctx.rotate(-Math.PI/2);txt(ctx,label,-2,1,{s:Math.min(11*k,15),w:700,c:'#ffffff',a:'right',b:'middle'});ctx.restore();}
function drawCO(sim,ctx,vdt,k,t){const b=sim.vlab.bench,B=sim.st.B,p=sim.p,v=sim.vis,fz=(s,m)=>Math.min(s*k,m),loc=p.coLoc,R=Math.random;
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,394,800,56);ctx.fillStyle=PAL['line'];ctx.fillRect(0,394,800,2);
  const part=b.part>=0?CO.parts[b.part]:null;txt(ctx,part?'Part '+part.n+': '+part.name:'CO₂ and O₂ bench',16,28,{s:fz(16,24),w:700});
  // windowsill scene
  if(loc==='window'){ctx.fillStyle='#cfe8fb';rr(ctx,36,60,276,300,6);ctx.fill();ctx.fillStyle='#ffd54a';ctx.beginPath();ctx.arc(84,104,24,0,6.29);ctx.fill();
    ctx.strokeStyle='rgba(255,196,40,.55)';ctx.lineWidth=3;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(84+Math.cos(a)*32,104+Math.sin(a)*32);ctx.lineTo(84+Math.cos(a)*44,104+Math.sin(a)*44);ctx.stroke();}
    const gr=ctx.createLinearGradient(84,104,200,360);gr.addColorStop(0,'rgba(255,214,90,.45)');gr.addColorStop(1,'rgba(255,214,90,.05)');ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(70,90);ctx.lineTo(110,90);ctx.lineTo(250,392);ctx.lineTo(100,392);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#8a6d4b';ctx.lineWidth=8;rr(ctx,36,60,276,300,6);ctx.stroke();ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(174,60);ctx.lineTo(174,150);ctx.moveTo(36,150);ctx.lineTo(312,150);ctx.stroke();
    ctx.fillStyle='#b98f5e';ctx.fillRect(20,392,308,12);}
  // the bottle: 250 mL, body 196 px tall (0.784 px per mL)
  const L=112,Rr=232,BOT=392,TOP=196;
  ctx.fillStyle='rgba(200,225,240,.18)';ctx.beginPath();ctx.moveTo(L,BOT);ctx.lineTo(L,TOP);ctx.quadraticCurveTo(L,176,140,176);ctx.lineTo(140,156);ctx.lineTo(204,156);ctx.lineTo(204,176);ctx.quadraticCurveTo(Rr,176,Rr,TOP);ctx.lineTo(Rr,BOT);ctx.closePath();ctx.fill();
  if(b.contents==='yeast'){const top=BOT-50*0.784,g=b.g,act=b.ins?1-Math.exp(-(g.tY+20)/B.P.tauY):Math.min(1,g.tY/200);
    ctx.fillStyle='rgba(205,168,104,.85)';ctx.fillRect(L+2,top,Rr-L-4,BOT-top);const fh=2+6*act;ctx.fillStyle='rgba(246,238,214,.95)';ctx.fillRect(L+2,top-fh,Rr-L-4,fh);
    if(vdt>0){let n=act*vdt*14*(RM?.5:1);while(n>0){if(R()<n&&B.bub.length<60)B.bub.push({x:L+8+R()*(Rr-L-16),y:BOT-4,r:1.2+R()*2});n--;}B.bub.forEach(q=>{q.y-=40*vdt;});B.bub=B.bub.filter(q=>q.y>top);}
    ctx.strokeStyle='rgba(120,84,40,.8)';ctx.lineWidth=1;B.bub.forEach(q=>{ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,6.29);ctx.stroke();});}
  else B.bub=[];
  if(b.contents==='plant'){ctx.fillStyle='#6b4a2b';ctx.beginPath();ctx.ellipse(172,384,36,9,0,0,6.29);ctx.fill();ctx.fillRect(136,376,72,10);
    ctx.strokeStyle='#3d7a2e';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(172,378);ctx.quadraticCurveTo(166,300,174,232);ctx.stroke();
    [[150,330,-0.6],[194,310,0.6],[148,282,-0.5],[196,262,0.5],[160,240,-0.3],[186,228,0.3]].forEach(q=>{ctx.fillStyle=PAL['cv-leaf'];ctx.beginPath();ctx.ellipse(q[0],q[1],22,9,q[2],0,6.29);ctx.fill();
      ctx.strokeStyle=PAL['cv-leaf2'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(q[0]-Math.cos(q[2])*18,q[1]-Math.sin(q[2])*18);ctx.lineTo(q[0]+Math.cos(q[2])*18,q[1]+Math.sin(q[2])*18);ctx.stroke();});}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(L,BOT);ctx.lineTo(L,TOP);ctx.quadraticCurveTo(L,176,140,176);ctx.lineTo(140,156);ctx.moveTo(204,156);ctx.lineTo(204,176);ctx.quadraticCurveTo(Rr,176,Rr,TOP);ctx.lineTo(Rr,BOT);ctx.lineTo(L,BOT);ctx.stroke();
  ctx.lineWidth=1.2;for(let ml=50;ml<=200;ml+=50){const y=BOT-ml*0.784;ctx.beginPath();ctx.moveTo(Rr-14,y);ctx.lineTo(Rr,y);ctx.stroke();}
  // sensors: in the bottle through the lid, or standing in their holder reading room air
  const dark=loc==='dark';
  if(b.ins){ctx.fillStyle='#3a3e45';rr(ctx,136,146,72,14,4);ctx.fill();}
  if(dark){ctx.fillStyle='#23272e';rr(ctx,74,120,176,272,8);ctx.fill();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;rr(ctx,74,120,176,272,8);ctx.stroke();
    txt(ctx,'Box (dark)',162,262,{s:fz(15,22),w:700,c:'#f1f3f5',a:'center'});txt(ctx,'The bottle is inside',162,286,{s:fz(12,17),c:'#c9ced6',a:'center'});}
  const px=b.ins?[156,190]:[272,304],pTop=b.ins?56:150,pBot=b.ins?[226,212]:[332,322];
  ctx.save();if(dark&&b.ins){ctx.beginPath();ctx.rect(0,0,800,120);ctx.clip();}
  drawProbe(ctx,px[0],pTop,pBot[0],22,'#4a4f57','#6c737c','CO₂',k);drawProbe(ctx,px[1],pTop+12,pBot[1],20,'#8d949d','#d0d4da','O₂',k);ctx.restore();
  if(!b.ins){ctx.fillStyle='#5b6068';rr(ctx,258,330,60,62,6);ctx.fill();txt(ctx,'holder',288,368,{s:fz(11,15),c:'#e9ecef',a:'center'});}
  // cables to the interface
  ctx.strokeStyle=PAL['cv-lamp'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px[0],pTop);ctx.bezierCurveTo(px[0]+10,pTop-16,300,44,342,96);ctx.moveTo(px[1],pTop+12);ctx.bezierCurveTo(px[1]+10,pTop-4,300,64,342,120);ctx.stroke();
  txt(ctx,'250 mL bottle',172,420,{s:fz(13,20),w:600,a:'center'});txt(ctx,b.ins?coLocs[loc]:'Sensors out: room air',172,442,{s:fz(12,18),c:PAL['cv-soft'],a:'center'});
  // the sensor software: meters and graph
  const SX=340,SY=40,SW=450,SH=354;ctx.fillStyle=SCR.bez;rr(ctx,SX,SY,SW,SH,12);ctx.fill();
  const d=coShow(sim),rec=coRec(b),fs=fz(12,19),ms=Math.min(k,1.4);
  lcdCard(ctx,SX+10,SY+10,180,74,'CO₂ GAS',String(d.c)+' ppm',Math.round(26*ms),fs);
  lcdCard(ctx,SX+198,SY+10,140,74,'O₂ GAS',d.o.toFixed(2)+' %',Math.round(26*ms),fs);
  const tsec=rec?Math.min(rec.t,rec.end):0;lcdCard(ctx,SX+346,SY+10,94,74,'TIME',mmss(tsec),Math.round(24*ms),fs);
  const run=coScreenRun(b);coGraph(ctx,SX+10,SY+92,SW-20,SH-102,coTrace(run)||{end:part?part.end:600,dt:1,c:[],o:[]},fz(11.5,19));
  if(B.hold)pill(ctx,'Reading time: '+(B.holdAt/60)+' min · read both meters',565,422,PAL['rj'],'#fff',fz(13,19));
  else if(rec&&!rec.done)txt(ctx,'Collecting · '+mmss(rec.t)+' of '+mmss(rec.end),565,428,{s:fz(13,20),c:PAL['cv-soft'],a:'center'});
  else if(rec&&rec.done)pill(ctx,'Data collection done',565,422,PAL['s3'],'#fff',fz(13,19));
  if(part&&b.cap[b.part])txt(ctx,'Graph captured',782,30,{s:fz(12,18),w:700,c:PAL['s3'],a:'right'});}

/* ===== germseeds: CO₂ from dormant and germinating seeds ===== */
const GS={n:25,
  dry:0.245,          // g per dry bean, so 25 dormant beans are about 6 g
  swell:{24:1.95,48:2.25,72:2.45},  // soaked mass ÷ dry mass after 24, 48 and 72 h of germination
  qg:3.6,             // ppm CO₂/min per g of blotted 24 h germinating seeds, in a 250 mL bottle at 22 °C
  qd:0.12,            // the same for dry, dormant seeds
  hf:{24:1,48:1.65,72:2.15},        // respiration per gram rises as germination goes on
  Q10:2.3,tau:20,     // temperature sensitivity, and the sensor's response time (s)
  dt:15,dur:300,wait:60};           // 1 sample per 15 s, 5 min of recording, after a 1 min wait
function gsPar(seed){const md=r2(GS.n*GS.dry*Math.exp(0.05*hn(seed,30,0))),mg=r2(GS.n*GS.dry*Math.exp(0.05*hn(seed,31,0))*GS.swell[24]*Math.exp(0.03*hn(seed,32,0)));
  return {room:440+120*hr(seed,50,0),off:40+50*hr(seed,51,0),md,mg,wet:r2(mg+0.9+0.5*hr(seed,33,0)),
    rd:GS.qd*md*Math.exp(0.3*hn(seed,34,0)),rg:GS.qg*mg*Math.exp(0.12*hn(seed,35,0))};}
function gsExtMass(seed,att,hours){return r2(GS.n*GS.dry*Math.exp(0.05*hn(seed,40,att))*GS.swell[hours]*Math.exp(0.03*hn(seed,42,att)));}
function gsInit(sim){const b=sim.vlab.bench,P=gsPar(sim.vlab.seed);
  ['cal','counted','wd','wgDry','bottled','blot','waitHeld'].forEach(k=>{if(b[k]===undefined)b[k]=false;});
  if(!b.runs||typeof b.runs!=='object')b.runs={dorm:null,germ:null};if(!Array.isArray(b.ext))b.ext=[];if(b.extReady===undefined)b.extReady=-1;
  if(!b.sensor)b.sensor='air';if(!b.phase)b.phase='idle';['tw','att','idleS'].forEach(k=>{if(!Number.isFinite(b[k]))b[k]=0;});if(!Number.isFinite(b.airT))b.airT=999;
  if(!b.bal)b.bal={w:null,g:0};if(!b.g||!Number.isFinite(b.g.C))b.g={C:P.room,Cp:P.room};if(!b.view)b.view='dorm';if(b.target===undefined)b.target=null;
  if(!Number.isFinite(b.disp))b.disp=Math.round(P.room+P.off);
  return {kind:'gs',P,hold:false,holdWhat:'',acc:0};}
const gsB=sim=>sim.st&&sim.st.B&&sim.st.B.kind==='gs'&&sim.vlab?sim.st.B:null;
/* ppm CO₂ per second in the bottle the sensor is in */
function gsRate(sim,where){const b=sim.vlab.bench,P=sim.st.B.P;if(where==='dorm')return P.rd/60;if(where==='germ')return P.rg/60;
  if(where==='ext'){const e=b.ext[b.extReady];if(!e)return 0;return GS.qg*e.mass*GS.hf[e.hours]*Math.pow(GS.Q10,(e.temp-22)/10)*Math.exp(0.12*hn(sim.vlab.seed,41,e.att))/60;}return 0;}
function gsPhys(sim,h){const b=sim.vlab.bench,g=b.g,P=sim.st.B.P;
  if(b.sensor==='air'){g.C=P.room;b.airT+=h;}else g.C+=gsRate(sim,b.sensor)*h;
  g.Cp+=(g.C-g.Cp)*(1-Math.exp(-h/GS.tau));}
function gsRead(sim,key,s){const b=sim.vlab.bench,P=sim.st.B.P;return Math.round(clamp(b.g.Cp+(b.cal?0:P.off)+2.5*hn(sim.vlab.seed,key,s),0,10000));}
function gsCur(b){if(b.sensor==='air')return null;if(b.sensor==='ext')return (b.ext[b.extReady]||{}).run||null;return b.runs[b.sensor];}
function gsIdle(sim,h){const B=sim.st.B,b=sim.vlab.bench;B.acc+=h;while(B.acc>=1){B.acc-=1;b.idleS++;b.disp=gsRead(sim,7000,b.idleS);}}
function gsStep(sim,ds){const B=sim.st.B,b=sim.vlab.bench;if(B.hold){if(!sim.running)return;B.hold=false;}
  if(b.view!==sim.p.gsView)b.view=sim.p.gsView;
  while(ds>1e-9){let h=Math.min(ds,0.5);
    if(b.phase==='wait'&&!b.waitHeld&&b.tw+h>=GS.wait-1e-9){h=Math.max(0,GS.wait-b.tw);gsPhys(sim,h);gsIdle(sim,h);b.tw=GS.wait;b.waitHeld=true;ds-=h;
      if(sim.p.pauseRead){B.hold=true;B.holdWhat='wait';BioLab.pause(sim);return;}continue;}
    if(b.phase==='rec'){const rec=gsCur(b);if(!rec){b.phase='done';continue;}const nx=rec.pts.length*GS.dt;
      if(rec.rt+h>=nx-1e-9){h=Math.max(0,nx-rec.rt);gsPhys(sim,h);rec.rt=nx;b.tw+=h;const d=gsRead(sim,8000+rec.att*3,rec.pts.length);rec.pts.push(d);b.disp=d;B.acc=0;ds-=h;
        if(nx>=GS.dur-1e-9){rec.done=true;b.phase='done';if(sim.p.pauseRead){B.hold=true;B.holdWhat='rec';BioLab.pause(sim);return;}}continue;}
      rec.rt+=h;}
    if(b.phase==='wait'||b.phase==='done'||b.phase==='rec')b.tw+=h;
    gsPhys(sim,h);gsIdle(sim,h);ds-=h;}}
function gsFit(pts){const n=pts.length;if(n<2)return null;let sx=0,sy=0,sxx=0,sxy=0;pts.forEach((y,i)=>{const x=i*GS.dt/60;sx+=x;sy+=y;sxx+=x*x;sxy+=x*y;});
  const m=(n*sxy-sx*sy)/(n*sxx-sx*sx);return {m,c:(sy-m*sx)/n};}
const GSN={dorm:'dormant',germ:'germinating'};
function gsViewRun(b,v){if(v==='ext'){for(let i=b.ext.length-1;i>=0;i--)if(b.ext[i].run)return b.ext[i].run;return null;}return b.runs[v];}
function gsGraph(ctx,X,Y,W,H,run,o,fs){const pts=(run&&run.pts)||[],f=pts.filter(Number.isFinite);
  const r=f.length?nice(Math.min(...f),Math.max(...f),20):nice(420,480,20);
  const F=scrFrame(ctx,X,Y,W,H,{xmax:5,xst:1,xl:'Time (min)',L:{r,color:SCR.c,label:'CO₂ (ppm)'},fs});
  ctx.save();ctx.beginPath();ctx.rect(F.L-6,F.T-6,F.R-F.L+12,F.B-F.T+12);ctx.clip();
  ctx.strokeStyle='rgba(192,57,43,.45)';ctx.lineWidth=1.2;ctx.beginPath();pts.forEach((y,i)=>{const x=F.xm(i*GS.dt/60);i?ctx.lineTo(x,F.yl(y)):ctx.moveTo(x,F.yl(y));});ctx.stroke();
  ctx.fillStyle=SCR.c;pts.forEach((y,i)=>{ctx.beginPath();ctx.arc(F.xm(i*GS.dt/60),F.yl(y),3.6,0,6.29);ctx.fill();});
  const fit=o.fit&&run&&run.done?gsFit(pts):null;
  if(fit){ctx.strokeStyle=SCR.fit;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(F.xm(0),F.yl(fit.c));ctx.lineTo(F.xm(5),F.yl(fit.c+5*fit.m));ctx.stroke();}
  if(o.cur!==null&&o.cur!==undefined&&pts.length){const i=Math.round(o.cur*60/GS.dt),x=F.xm(o.cur);ctx.strokeStyle=SCR.cur;ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x,F.T);ctx.lineTo(x,F.B);ctx.stroke();ctx.setLineDash([]);
    if(Number.isFinite(pts[i])){ctx.strokeStyle=SCR.cur;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,F.yl(pts[i]),6,0,6.29);ctx.stroke();}}
  ctx.restore();
  if(o.cur!==null&&o.cur!==undefined&&pts.length){const i=Math.round(o.cur*60/GS.dt),t1='t = '+o.cur.toFixed(2)+' min: '+(Number.isFinite(pts[i])?pts[i]+' ppm':'no data yet'),
      t2=fit?'Fit line at this time: '+Math.round(fit.c+fit.m*o.cur)+' ppm':'';ctx.font='700 '+fs+'px '+FONT;const w=Math.max(ctx.measureText(t1).width,t2?ctx.measureText(t2).width:0)+14,bx=F.L+6,by=F.T+6,bh=t2?fs*2.7:fs*1.6;
    ctx.fillStyle='rgba(255,255,255,.94)';ctx.fillRect(bx,by,w,bh);ctx.strokeStyle=SCR.cur;ctx.lineWidth=1;ctx.strokeRect(bx,by,w,bh);txt(ctx,t1,bx+7,by+fs*1.15,{s:fs,w:700,c:SCR.cur});if(t2)txt(ctx,t2,bx+7,by+fs*2.3,{s:fs,c:SCR.fit});}
  if(!pts.length)txt(ctx,'Data points appear here when you start recording.',(F.L+F.R)/2,(F.T+F.B)/2,{s:fs,c:SCR.soft,a:'center',b:'middle'});}
function gsMassCheck(which){return (sim,rv,v)=>{const b=sim.vlab.bench,P=sim.st.B?sim.st.B.P:gsPar(sim.vlab.seed);
  if(which==='dorm'){if(!b.wd)return 'Weigh the dormant seeds on the balance first.';return Math.abs(v-P.md)<0.006?null:'The balance read '+P.md.toFixed(2)+' g for the 25 dormant seeds. Check your reading.';}
  if(Math.abs(v-P.wet)<0.006)return 'This is the mass of the wet seeds. Blot the germinating seeds dry with the paper towel, then weigh them again.';
  if(!b.wgDry)return 'Blot the germinating seeds dry with the paper towel, then weigh them.';
  return Math.abs(v-P.mg)<0.006?null:'The balance read '+P.mg.toFixed(2)+' g for the 25 blotted germinating seeds. Check your reading.';};}
const gsTol=s=>Math.max(0.25*Math.abs(s),3);
function gsRateCheck(which){return (sim,rv,v)=>{const run=sim.vlab.bench.runs[which];if(!run||!run.done)return 'Record 5 minutes of data for the '+GSN[which]+' seeds on the bench first.';
  const f=gsFit(run.pts);if(Math.abs(v-f.m)<=gsTol(f.m))return null;
  return 'This slope does not match your '+GSN[which]+'-seed data. Pick two points far apart on the line of best fit (or on the straight part of the data), then divide the change in CO₂ (ppm) by the change in time (min).';};}
function gsNormCheck(tid){return (sim,rv,v)=>{const V=sim.vlab,r=tid==='t1'?(rv==='Dormant'?0:1):(+rv-1);
  const rate=V.val(tid,'rate',r),mass=V.val(tid,'mass',r);if(!Number.isFinite(rate)||!Number.isFinite(mass)||mass<=0)return 'Fill in the seed mass and the respiration rate in this row first.';
  const e=rate/mass;return Math.abs(v-e)<=Math.max(0.011,0.03*Math.abs(e))?null:'Divide the respiration rate in this row by the seed mass in this row.';};}
function gsPtCheck(col){return (sim,rv,v)=>{const V=sim.vlab,r=+rv-1,which=r<2?'dorm':'germ',run=V.bench.runs[which];
  if(col==='time')return v>=0&&v<=5?null:'The recording ran from 0 to 5 min, so pick a time in that range.';
  if(!run||!run.pts.length)return 'Record the '+GSN[which]+' seeds on the bench first.';
  const t=V.val('t2','time',r);if(!Number.isFinite(t))return 'Type the time of this point first.';
  const x=t*60/GS.dt,i=Math.floor(x),j=Math.min(run.pts.length-1,i+1);if(i>run.pts.length-1)return 'Your '+GSN[which]+' run has no data at '+t+' min.';
  const d=run.pts[i]+(run.pts[j]-run.pts[i])*(x-i),f=run.done?gsFit(run.pts):null;
  if(Math.abs(v-d)<=4||(f&&Math.abs(v-(f.c+f.m*t))<=4))return null;
  return 'At '+t+' min, your '+GSN[which]+' data read about '+Math.round(d)+' ppm. Check this point on the graph.';};}
function gsExtMassCheck(sim,rv,v){const b=sim.vlab.bench;if(!b.ext.length)return 'Prepare and weigh an extension bottle on the bench first.';
  return b.ext.some(e=>Math.abs(e.mass-v)<0.006)?null:'This does not match a mass the balance showed for an extension bottle. Check your reading.';}
function gsExtRateCheck(sim,rv,v){const runs=sim.vlab.bench.ext.map(e=>e.run).filter(r=>r&&r.done);if(!runs.length)return 'Record an extension bottle for 5 minutes on the bench first.';
  return runs.some(r=>{const f=gsFit(r.pts);return Math.abs(v-f.m)<=gsTol(f.m);})?null:'This slope does not match any of your extension runs. Find the slope of the line of best fit in ppm CO₂/min.';}
function gsNarrate(sim){const b=sim.vlab.bench,B=sim.st.B,rec=gsCur(b),nm=w=>w==='ext'?'extension':GSN[w];
  if(B.hold&&B.holdWhat==='wait')return '<b>1 minute is up.</b> The sensor has settled in the '+nm(b.sensor)+' bottle. Press <b>Start recording</b>.';
  if(B.hold&&B.holdWhat==='rec')return '<b>5 minutes recorded.</b> Use <b>Examine</b> and the line of best fit on the screen to find the slope.';
  if(b.phase==='wait')return 'The sensor is in the '+nm(b.sensor)+' bottle, lying on its side. Wait 1 minute for the reading to settle before you record ('+mmss(b.tw)+' so far).';
  if(b.phase==='rec'&&rec)return 'Recording the '+nm(b.sensor)+' bottle: 1 sample every 15 s ('+mmss(rec.rt)+' of 5:00). Each red dot on the screen is one sample.';
  if(b.phase==='done')return 'The run is done. Read the data points on the screen with <b>Examine</b>, then take the sensor out and air it for 1 minute.';
  if(!b.cal)return 'The CO₂ sensor sits in fresh air. Calibrate it before you start.';
  if(!b.counted)return 'Two dishes of beans: dry, dormant seeds and seeds that have soaked and germinated for 24 hours. Count out 25 of each.';
  if(!b.bottled)return 'Weigh each set of 25 seeds on the balance. Blot the germinating seeds dry first, so surface water does not add to their mass.';
  return b.sensor==='air'?'The sensor is out in fresh air'+(b.airT<GS.wait?' ('+mmss(b.airT)+' of airing so far).':'.'):'';}
function drawBean(ctx,x,y,s,germ,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle=germ?'#efe2c4':'#c9a36b';ctx.strokeStyle=germ?'#b89b68':'#8a6a3c';ctx.lineWidth=1;
  ctx.beginPath();ctx.ellipse(0,0,6.5*s,4.2*s,0,0,6.29);ctx.fill();ctx.stroke();if(germ){ctx.strokeStyle='#f7f3e6';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(5*s,1);ctx.quadraticCurveTo(10*s,4*s,9*s,8*s);ctx.stroke();}ctx.restore();}
function beanPile(ctx,cx,cy,w,h,germ,seedKey){const g=rng(seedKey);for(let i=0;i<25;i++){const x=cx+(g()-.5)*w,y=cy+(g()-.5)*h;drawBean(ctx,x,y,germ?1.25:1,germ,g()*6.28);}}
function hBottle(ctx,cy,label,k,germ,seedKey,live){const x0=200,x1=330;ctx.fillStyle='rgba(200,225,240,.16)';rr(ctx,x0,cy-30,x1-x0,60,12);ctx.fill();
  beanPile(ctx,(x0+x1)/2+6,cy+14,x1-x0-34,16,germ,seedKey);
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;rr(ctx,x0,cy-30,x1-x0,60,12);ctx.stroke();ctx.fillStyle='rgba(200,225,240,.16)';ctx.fillRect(182,cy-13,20,26);ctx.strokeRect(182,cy-13,20,26);
  txt(ctx,label,(x0+x1)/2,cy-37,{s:Math.min(12*k,15),w:700,c:live?PAL['rj']:PAL['cv-ink'],a:'center'});}
function hSensor(ctx,x,cy,k){ctx.fillStyle='#4a4f57';rr(ctx,x,cy-12,62,24,6);ctx.fill();ctx.fillStyle='#6c737c';rr(ctx,x+58,cy-9,26,18,4);ctx.fill();txt(ctx,'CO₂',x+30,cy+1,{s:Math.min(11*k,15),w:700,c:'#fff',a:'center',b:'middle'});}
function drawGS(sim,ctx,vdt,k,t){const b=sim.vlab.bench,B=sim.st.B,p=sim.p,P=B.P,fz=(s,m)=>Math.min(s*k,m);
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,394,800,56);ctx.fillStyle=PAL['line'];ctx.fillRect(0,394,800,2);
  txt(ctx,'Seed respiration bench',16,28,{s:fz(16,24),w:700});
  // seeds in their dishes until they go in the bottles
  if(!b.bottled){[[80,'Dormant (dry)',false,b.bal.w==='dorm'],[232,'Germinating (24 h)',true,b.bal.w==='germ']].forEach(([cx,lab,germ,away])=>{
      ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.fillStyle='rgba(200,225,240,.14)';ctx.beginPath();ctx.ellipse(cx,96,62,24,0,0,6.29);ctx.fill();ctx.stroke();
      if(!away)beanPile(ctx,cx,96,74,22,germ,germ?21:11);
      if(germ&&!b.blot&&!away){ctx.fillStyle='rgba(120,180,230,.35)';ctx.beginPath();ctx.ellipse(cx,100,50,14,0,0,6.29);ctx.fill();}
      txt(ctx,lab+(germ?(b.blot?' · blotted':' · wet'):''),cx,140,{s:fz(12,16),w:600,a:'center'});});
    if(!b.counted)txt(ctx,'Count out 25 of each',156,160,{s:fz(12,16),c:PAL['cv-soft'],a:'center'});}
  // balance (0.01 g)
  ctx.fillStyle='#d9dde2';rr(ctx,16,326,160,66,8);ctx.fill();ctx.fillStyle='#9aa1aa';ctx.fillRect(66,316,60,10);ctx.fillStyle='#c3c8ce';ctx.beginPath();ctx.ellipse(96,314,62,8,0,0,6.29);ctx.fill();
  if(b.bal.w){ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(96,308,40,7,0,0,6.29);ctx.fill();beanPile(ctx,96,302,56,8,b.bal.w!=='dorm',b.bal.w==='dorm'?11:b.bal.w==='germ'?21:31);}
  ctx.fillStyle=SCR.lcd;rr(ctx,30,340,132,40,5);ctx.fill();ctx.fillStyle=SCR.lcdInk;ctx.font=LCD.replace('VSIZE','26');ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText((b.bal.w?b.bal.g:0).toFixed(2)+' g',154,361);
  txt(ctx,'Balance (0.01 g)',96,420,{s:fz(12,18),w:600,a:'center'});
  // paper towel
  ctx.fillStyle='#f4f1e8';ctx.fillRect(196,360,130,32);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(196,360,130,32);if(b.blot){ctx.fillStyle='rgba(120,180,230,.35)';ctx.fillRect(210,366,96,20);}
  txt(ctx,'Paper towel',261,420,{s:fz(12,18),w:600,a:'center'});
  // bottles, lying on their sides; the sensor goes in the neck
  const lane={ext:110,dorm:200,germ:286};
  if(b.bottled){hBottle(ctx,lane.dorm,'Dormant',k,false,11,b.sensor==='dorm');hBottle(ctx,lane.germ,'Germinating (24 h)',k,true,21,b.sensor==='germ');}
  const e=b.ext[b.extReady];if(e)hBottle(ctx,lane.ext,e.hours+' h · '+e.temp+' °C',k,true,31+e.att,b.sensor==='ext');
  const sy=b.sensor==='air'?244:lane[b.sensor],sx=b.sensor==='air'?24:104;hSensor(ctx,sx,sy,k);
  if(b.sensor==='air')txt(ctx,'Sensor in fresh air',60,276,{s:fz(11.5,15),c:PAL['cv-soft'],a:'center'});
  ctx.strokeStyle=PAL['cv-lamp'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(sx-26,sy-24,2,74,40,54);ctx.bezierCurveTo(120,44,300,44,358,70);ctx.stroke();
  // the sensor software
  const SX=352,SY=40,SW=438,SH=354;ctx.fillStyle=SCR.bez;rr(ctx,SX,SY,SW,SH,12);ctx.fill();const fs=fz(12,19),ms=Math.min(k,1.4);
  const rec=gsCur(b);lcdCard(ctx,SX+10,SY+10,200,74,'CO₂ GAS',String(b.disp)+' ppm',Math.round(26*ms),fs);
  const tl=b.phase==='wait'?'WAITING':b.phase==='rec'?'RECORDING':b.phase==='done'?'RUN DONE':'TIME';lcdCard(ctx,SX+218,SY+10,210,74,tl,b.phase==='rec'||b.phase==='done'?mmss(rec?rec.rt:0)+' / 5:00':b.phase==='wait'?mmss(b.tw):'0:00',Math.round(24*ms),fs);
  const vw=p.gsView,run=gsViewRun(b,vw);txt(ctx,'Data set: '+(vw==='ext'?'extension'+(run?'':' (none yet)'):GSN[vw]+' seeds'),SX+14,SY+106,{s:fz(12,18),w:700,c:SCR.lab});
  gsGraph(ctx,SX+10,SY+114,SW-20,SH-124,run,{fit:!!p.gsFit,cur:run?p.gsPt:null},fz(11.5,19));
  if(B.hold)pill(ctx,B.holdWhat==='wait'?'1:00 · ready to record':'5:00 · recording done',571,422,PAL['rj'],'#fff',fz(13,19));
  else if(b.phase==='rec')txt(ctx,'Recording · 1 sample per 15 s',571,428,{s:fz(13,20),c:PAL['cv-soft'],a:'center'});}
/* --- the two labs, from the teachers' handouts --- */
const cob=sim=>sim.vlab.bench,coSet=p=>sim=>{sim.vlab.bench.part=p;};
function coRefreshCap(sim,p){const nb=sim.ui&&sim.ui.nb,el=nb&&nb.querySelector('.vl-tb[data-t="t'+(p+1)+'"] .vl-cap');if(el)el.innerHTML=coTitle(p);}
function coCollect(p,text){return {title:'Part '+(p+1)+': collect',text,setup:coSet(p),controls:['pauseRead','co-start'],done:sim=>coRun(sim,p),doneHint:coHint(p)};}
function coCapStep(p){return {title:'Part '+(p+1)+': save the graph',text:'<p>Instead of taking a screenshot, press <b>Capture graph</b>. The graph from the screen goes into your notebook with Table '+(p+1)+'.</p><p>Then remove the sensors and empty the bottle'+(p===0?'':(p===1?', and rinse it':''))+'.</p>',
  setup:coSet(p),controls:['co-cap','co-out'],done:sim=>{const b=cob(sim);return !!b.cap[p]&&!b.ins&&b.contents==='none';},
  doneHint:sim=>{const b=cob(sim);return !b.cap[p]?'Press <b>Capture graph</b>.':'Press <b>Remove the sensors and empty the bottle</b>.';}};}
const coLoad=(p,loc,txt)=>({title:'Part '+(p+1)+': '+CO.parts[p].name,text:txt,setup:coSet(p),controls:['co-plant','coLoc'],
  done:sim=>(cob(sim).contents==='plant'&&sim.p.coLoc===loc)||coRun(sim,p),
  doneHint:sim=>cob(sim).contents!=='plant'?'Press <b>Put the plant in the bottle</b>.':'Under <b>Where the bottle sits</b>, choose <b>'+(loc==='dark'?'Box (dark)':'Sunny windowsill')+'</b>.'});
const LAB_CO={id:'co2o2',title:'Photosynthesis versus Respiration: CO₂ and O₂ Sensors',course:'Honors Biology',teachers:'Stearman, Powell',
  source:{label:'CO2 O2 Lab',href:'https://rjhs.instructure.com/courses/14659/assignments/553935'},level:'honors',
  purpose:'<p>Use CO₂ and O₂ gas sensors to compare cellular respiration and photosynthesis. You measure both gases in a closed bottle that is empty, that holds yeast and sugar, and that holds a plant, first in the dark and then in sunlight.</p>',
  background:'<p>You will use Vernier CO₂ and O₂ gas sensors in a 250 mL bottle, with Vernier Graphical Analysis showing the readings. There are four parts, about 10 minutes each. Your group gathers the data together, but you answer the questions on your own.</p><p>The O₂ gas sensor reads in percent (%). Room air is about 20.9% O₂. The CO₂ gas sensor reads in parts per million (ppm). Room air in a classroom is about 400 to 600 ppm CO₂.</p>'+
    '<p><b>About the virtual bench.</b> The bench runs a model of the real bottle, with realistic rates for yeast in sugar water and for a small plant in a 250 mL bottle. The CO₂ sensor takes about a minute to catch up with a change, the O₂ sensor about 15 seconds, and both readings jitter a little, as real sensors do. Your yeast, your plant and the sunlight on your windowsill differ a little from other groups’, so your numbers are your own. The model leaves out temperature changes and the CO₂ that dissolves in the water. At 1× speed the clock runs 10 times faster than real time.</p>',
  materials:['Vernier CO₂ gas sensor','Vernier O₂ gas sensor','250 mL bottle','Vernier Graphical Analysis (on the virtual bench, the screen beside the bottle)','2 g of yeast and 2 g of sugar','50 mL of water','A small plant that fits in the bottle','A box or cabinet','A sunny windowsill'],
  hypothesis:{prompt:'<p>Predict what will happen to the CO₂ and the O₂ in the bottle in each part: the empty bottle, yeast and sugar, a plant in the dark, and a plant in sunlight. Give your reasoning.</p>'},
  setup(sim){const b=sim.vlab.bench;BioLab.setValues(sim,{coLoc:b.loc||'bench'});BioLab.refresh(sim);},
  controls:['pauseRead'],
  steps:[
    {title:'Get set up',text:'<p>You will run four parts with the same 250 mL bottle, a CO₂ gas sensor and an O₂ gas sensor:</p><ul><li>Part 1: the empty bottle</li><li>Part 2: yeast and sugar</li><li>Part 3: a plant in the dark</li><li>Part 4: a plant in sunlight</li></ul><p>The screen on the bench shows a meter for each sensor and a live graph. Leave <b>Pause at each reading</b> on, so the clock stops when it is time to read the meters. At 1× speed the clock runs 10 times faster than real time. Use Speed to change that.</p>',setup:coSet(-1)},
    {title:'Part 1: empty bottle',text:'<p>Put the CO₂ and O₂ sensors in the empty bottle and start collecting.</p><p>Wait 1 minute and record the CO₂ and O₂ in Table 1. The CO₂ should start at about 400 ppm. Then wait until 5 minutes and record both again. Read the O₂ to 0.01%.</p>',
     setup:coSet(0),controls:['pauseRead','co-start'],done:sim=>coRun(sim,0),doneHint:coHint(0)},
    coCapStep(0),
    {title:'Part 2: yeast and sugar',text:'<p>Put 2 g of yeast and 2 g of sugar in the bottle with 50 mL of water. Swirl for 10 to 20 seconds.</p>',setup:coSet(1),controls:['co-yeast'],
     done:sim=>cob(sim).contents==='yeast'||coRun(sim,1),doneHint:'Press <b>Add 2 g yeast, 2 g sugar and 50 mL of water, and swirl</b>.'},
    coCollect(1,'<p>Put the sensors in the bottle. Don’t get liquid in the sensors. Start collecting.</p><p>Record the CO₂ and O₂ in Table 2 after 1 minute and after 10 minutes.</p>'),
    coCapStep(1),
    coLoad(2,'dark','<p>Parts 3 and 4 can go in either order in class. Here, do Part 3 first.</p><p>Put the plant in the bottle. Part 3 takes place in a box or cabinet: under <b>Where the bottle sits</b>, choose <b>Box (dark)</b>.</p>'),
    coCollect(2,'<p>Put the sensors in the bottle and start collecting. The bottle stays in the dark the whole time.</p><p>Record the CO₂ and O₂ in Table 3 after 1 minute and after 10 minutes.</p>'),
    coCapStep(2),
    coLoad(3,'window','<p>Put the plant back in the bottle. Part 4 takes place in the windowsill with light: under <b>Where the bottle sits</b>, choose <b>Sunny windowsill</b>.</p>'),
    coCollect(3,'<p>Put the sensors in the bottle and start collecting. The bottle stays in the sunny windowsill the whole time.</p><p>Record the CO₂ and O₂ in Table 4 after 1 minute and after 10 minutes.</p>'),
    coCapStep(3),
    {title:'Analyze your data',text:'<p>All four parts are done. Below the bench, check your tables and your four graphs, then answer the questions on your own and write your conclusion.</p>',setup:coSet(-1)}],
  tables:[0,1,2,3].map(p=>({id:'t'+(p+1),get title(){return coTitle(p);},
    cols:[{id:'t',label:'Time (min)',rows:[1,p?10:5],rowLabels:['After 1 min',p?'After 10 min':'After 5 min']},
          {id:'co2',label:'CO₂ (ppm)',input:'number',dp:0,check:coCheck(p,'co2')},{id:'o2',label:'O₂ (%)',input:'number',dp:2,check:coCheck(p,'o2')}]})),
  graph:{type:'line',title:'CO₂ in the bottle: your readings',xl:'Time (min)',yl:'CO₂ (ppm)',xmin:0,xmax:10,
    series:[0,1,2,3].map(p=>({table:'t'+(p+1),x:'t',y:'co2',label:'Part '+(p+1)+': '+CO.parts[p].short}))},
  questions:[
    {id:'q1',n:'1',q:'<p>Part 1 (empty bottle): what happened to the CO₂ and O₂ levels? Describe the trends, then explain why.</p>'},
    {id:'q2',n:'2',q:'<p>Part 2 (yeast and sugar): what happened to the CO₂ and O₂ levels? Describe the trends, then explain why.</p>'},
    {id:'q3',n:'3',q:'<p>Part 3 (plant in the dark): what happened to the CO₂ and O₂ levels? Describe the trends, then explain why.</p>'},
    {id:'q4',n:'4',q:'<p>Part 4 (plant in sunlight): what happened to the CO₂ and O₂ levels? Describe the trends, then explain why.</p>'},
    {id:'q5',n:'5',q:'<p>Which part was most similar to Part 2? Why?</p>'},
    {id:'q6',n:'6',q:'<p>What was the difference between Parts 3 and 4? How does sunlight change what the plant is doing?</p>'},
    {id:'q7',n:'7',q:'<p>Predict what would happen if you added yeast and sugar to the bottle with the plant in sunlight. Explain your prediction.</p>'},
    {id:'q8',n:'8',q:'<p>Make a diagram comparing photosynthesis and cellular respiration. Include the electron transport chain (ETC), chemiosmosis (ATP synthase), the light reactions, the dark reactions and NADH. Sort each one, with where it happens, into the three parts of the diagram below.</p>',
     fields:[{id:'ps',label:'Photosynthesis only'},{id:'both',label:'Both processes'},{id:'cr',label:'Cellular respiration only'}]}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion: how do cellular respiration and photosynthesis change the CO₂ and O₂ in a closed bottle? Use readings from your tables as evidence.</p>',cer:true}};

const gsb=sim=>sim.vlab.bench,gsSet=(tg,view)=>sim=>{const b=sim.vlab.bench;b.target=tg;if(view){b.view=view;BioLab.setValues(sim,{gsView:view});}};
const gsDoneRun=w=>sim=>{const r=gsb(sim).runs[w];return !!(r&&r.done);};
function gsInsHint(w){return sim=>{const b=gsb(sim);if(gsDoneRun(w)(sim))return '';if(b.sensor!=='air'&&b.sensor!==w)return 'Take the sensor out of the other bottle first.';
  if(b.sensor==='air')return 'Press <b>Insert the sensor and lay the bottle on its side</b>.';return 'Wait 1 minute for the reading to settle ('+mmss(b.tw)+' so far). Press <b>Play</b> if the clock is paused.';};}
function gsRecHint(w){return sim=>{const b=gsb(sim),r=b.runs[w];if(b.sensor!==w)return 'Put the sensor back in the '+GSN[w]+' bottle and wait 1 minute.';
  if(b.phase==='wait')return b.tw>=GS.wait?'Press <b>Start recording</b>.':'Wait until the sensor has been in the bottle for 1 minute.';
  if(b.phase==='rec')return 'Keep recording until the clock reaches 5:00.';if(r&&!r.done)return 'This run stopped early. Press <b>Start recording</b> to record 5 minutes again.';return '';};}
const gsRateText=w=>'<p>Find the rate of CO₂ release for the '+GSN[w]+' seeds. Turn on <b>Line of best fit</b> to draw the line through your data. Then move <b>Examine</b> to read two points far apart on the line, or on the straight part of the data. Write both points in the slope table, and work out the slope:</p><p><b>slope = (CO₂ at point 2 − CO₂ at point 1) ÷ (time at point 2 − time at point 1)</b></p><p>Record the slope, in ppm CO₂/min, as the '+GSN[w]+' respiration rate in Table 1.</p>';
const GSCTL_READ=['gsView','gsPt','gsFit'];
const LAB_GS={id:'germseeds',title:'Cellular Respiration: Germinating vs Dormant Seeds',course:'AP Biology',teachers:'Russell',
  source:{label:'Cell Respiration Lab Handout F17 (PASCO)',href:'https://rjhs.instructure.com/courses/16632/assignments/601375'},level:'ap',
  purpose:'<p><b>Driving question:</b> how does germination affect the rate of cellular respiration in seeds?</p><p>You measure the CO₂ that dormant seeds and germinating seeds release in closed bottles, find each rate from the slope of your data, and compare the rates per gram of seed.</p>',
  background:'<p>A dry seed is alive, but dormant: its cells hold stored food, mostly starch, and run very slowly. When a seed takes up water and begins to germinate, its cells break down that stored food in cellular respiration to make the ATP they need to grow:</p><p><b>C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy (ATP)</b></p><p>In a closed bottle, the CO₂ the seeds release builds up in the air. A CO₂ gas sensor tracks its concentration in parts per million (ppm). The slope of a graph of CO₂ against time is the rate of CO₂ release, in ppm CO₂/min, which stands in for the rate of cellular respiration. Soaked seeds weigh more than dry ones, so you divide each rate by the seed mass to compare them fairly.</p>'+
    '<p><b>About the virtual bench.</b> The bench models each bottle of seeds as releasing CO₂ at a steady rate set by the seeds’ mass and their state, with realistic magnitudes for 25 beans in a 250 mL bottle. The sensor takes about 20 seconds to respond, which is one reason you wait 1 minute before you record, and it reads to 1 ppm with a little random noise. Every batch of seeds is a little different, so your numbers are your own. The model leaves out the slow drop in O₂ and the CO₂ that dissolves in the water on the seeds. In the extension, respiration per gram rises with germination time and with temperature (about ×2.3 for every 10 °C). At 1× speed the clock runs 10 times faster than real time.</p>',
  materials:['Balance that reads to 0.01 g','Paper towel','25 germinating beans (soaked and germinated for 24 h)','25 dormant (dry) beans of the same type','CO₂ gas sensor','Two 250 mL sample bottles','Data collection software (on the virtual bench, the screen beside the bottles)'],
  hypothesis:{prompt:'<p>Answer the driving question with a testable prediction: how will the rate of cellular respiration of germinating seeds compare with that of dormant seeds? Explain your reasoning.</p>'},
  setup(sim){const b=sim.vlab.bench;BioLab.setValues(sim,{gsView:b.view||'dorm'});BioLab.refresh(sim);},
  controls:['pauseRead'],
  steps:[
    {title:'Get set up',text:'<p>You will compare two bottles of the same type of bean: 25 dormant (dry) seeds and 25 seeds that have germinated for 24 hours. The software on the bench plots CO₂ (ppm) against time (min) and records 1 sample every 15 seconds.</p><p>Leave <b>Pause at each reading</b> on. The clock stops when the 1 minute wait is up and when 5 minutes of recording are done. At 1× speed the clock runs 10 times faster than real time. Use Speed to change that.</p>',setup:gsSet(null)},
    {title:'Calibrate the sensor',text:'<p>Calibrate the CO₂ gas sensor in fresh air before you collect any data.</p>',setup:gsSet(null),controls:['gs-cal'],done:sim=>!!gsb(sim).cal,doneHint:'Press <b>Calibrate the CO₂ sensor in fresh air</b>.'},
    {title:'Count the seeds',text:'<p>Choose 25 dormant seeds and 25 germinating seeds of the same type. Type the seed quantity for each condition in Table 1.</p>',setup:gsSet(null),controls:['gs-count'],done:sim=>!!gsb(sim).counted,doneHint:'Press <b>Count out 25 dormant and 25 germinating seeds</b>.'},
    {title:'Weigh the dormant seeds',text:'<p>Weigh the 25 dormant seeds on the balance. Record the mass in Table 1, to 0.01 g.</p>',setup:gsSet(null),controls:['gs-wd'],done:sim=>!!gsb(sim).wd,doneHint:'Press <b>Weigh the dormant seeds</b>.'},
    {title:'Dry and weigh the germinating seeds',text:'<p>The germinating seeds are wet. Pat them dry with a paper towel, so the water on their surface does not add to their mass. Then weigh them and record the mass in Table 1.</p>',setup:gsSet(null),controls:['gs-blot','gs-wg'],
     done:sim=>!!gsb(sim).wgDry,doneHint:sim=>gsb(sim).blot?'Press <b>Weigh the germinating seeds</b>.':'Press <b>Blot the germinating seeds dry</b> first.'},
    {title:'Fill the bottles',text:'<p>Put the dormant seeds in one 250 mL bottle and the germinating seeds in the other.</p>',setup:gsSet(null),controls:['gs-bottle'],done:sim=>!!gsb(sim).bottled,doneHint:'Press <b>Put each set of seeds in its own bottle</b>.'},
    {title:'Dormant seeds: insert the sensor',text:'<p>Put the CO₂ sensor in the neck of the dormant-seed bottle and lay the bottle on its side, so the sensor is horizontal. Wait 1 minute before you record.</p>',setup:gsSet('dorm'),controls:['pauseRead','gs-ins'],
     done:sim=>{const b=gsb(sim);return (b.sensor==='dorm'&&b.tw>=GS.wait)||gsDoneRun('dorm')(sim);},doneHint:gsInsHint('dorm')},
    {title:'Dormant seeds: record',text:'<p>Press <b>Start recording</b> and record for 5 minutes.</p>',setup:gsSet('dorm'),controls:['pauseRead','gs-rec'],done:gsDoneRun('dorm'),doneHint:gsRecHint('dorm')},
    {title:'Dormant seeds: find the rate',text:gsRateText('dorm'),setup:gsSet('dorm','dorm'),controls:GSCTL_READ},
    {title:'Air out the sensor',text:'<p>Take the sensor out of the bottle and leave it in fresh air for 1 minute, so the gas from this bottle clears out of it.</p>',setup:gsSet('germ'),controls:['gs-out'],
     done:sim=>{const b=gsb(sim);return (b.sensor==='air'&&b.airT>=GS.wait)||b.sensor==='germ'||gsDoneRun('germ')(sim);},doneHint:sim=>gsb(sim).sensor!=='air'?'Press <b>Take the sensor out and air it</b>.':'Leave the sensor in fresh air for 1 minute ('+mmss(gsb(sim).airT)+' so far).'},
    {title:'Germinating seeds: insert the sensor',text:'<p>Put the sensor in the neck of the germinating-seed bottle and lay the bottle on its side. Wait 1 minute before you record.</p>',setup:gsSet('germ'),controls:['pauseRead','gs-ins'],
     done:sim=>{const b=gsb(sim);return (b.sensor==='germ'&&b.tw>=GS.wait)||gsDoneRun('germ')(sim);},doneHint:gsInsHint('germ')},
    {title:'Germinating seeds: record',text:'<p>Press <b>Start recording</b> and record for 5 minutes.</p>',setup:gsSet('germ'),controls:['pauseRead','gs-rec'],done:gsDoneRun('germ'),doneHint:gsRecHint('germ')},
    {title:'Germinating seeds: find the rate',text:gsRateText('germ'),setup:gsSet('germ','germ'),controls:GSCTL_READ},
    {title:'Compare the rates per gram',text:'<p>Germinating seeds hold much more water than dry seeds, so compare the rates per gram. For each condition, divide the respiration rate by the seed mass. Record the normalized rate in Table 1, in (ppm CO₂/min)/g.</p><p>Then answer question 1 below the bench.</p>',setup:gsSet(null),controls:GSCTL_READ.concat(['gs-out'])},
    {title:'Extension: design an experiment',text:'<p><b>Optional.</b> Design your own experiment on seed respiration. On this bench you can change how long the seeds have germinated (24, 48 or 72 h) or the temperature of the bottle (10, 22 or 32 °C). Choose one variable, keep everything else the same, and plan your trials in the Extension questions below the bench.</p>',setup:gsSet(null),controls:[]},
    {title:'Extension: run your trials',text:'<p><b>Optional.</b> For each trial, choose the germination time and the temperature, then press <b>Prepare an extension bottle</b>: it blots and weighs 25 new seeds. Record the mass, insert the sensor, wait 1 minute, record 5 minutes and find the slope, as before. Air the sensor for 1 minute between bottles.</p><p>Record each trial in the Extension data table. The screen’s Extension data set shows your latest extension run.</p>',
     setup:gsSet('ext'),controls:['gsHours','gsTemp','gs-ext','gs-ins','gs-rec','gs-out','pauseRead'].concat(GSCTL_READ)},
    {title:'Wrap up',text:'<p>Check your tables, answer the questions and write your conclusion below the bench. Then turn in your lab.</p>',setup:gsSet(null),controls:GSCTL_READ}],
  tables:[
    {id:'t1',title:'Table 1: Respiration rates of dormant and germinating seeds',cols:[{id:'cond',label:'Condition',rows:['Dormant','Germinating (24 h)']},
      {id:'qty',label:'Seed quantity',input:'number',dp:0,check:(sim,rv,v)=>v===GS.n?null:'The procedure uses '+GS.n+' seeds for each condition. Check your count.'},
      {id:'mass',label:'Seed mass (g)',input:'number',dp:2,check:(sim,rv,v)=>gsMassCheck(rv==='Dormant'?'dorm':'germ')(sim,rv,v)},
      {id:'rate',label:'Respiration rate (ppm CO₂/min)',input:'number',dp:1,check:(sim,rv,v)=>gsRateCheck(rv==='Dormant'?'dorm':'germ')(sim,rv,v)},
      {id:'norm',label:'Normalized rate ((ppm CO₂/min)/g)',input:'number',dp:2,check:gsNormCheck('t1')}]},
    {id:'t2',title:'Slope work: two points on each line',cols:[{id:'pt',label:'Point',rows:[1,2,3,4],rowLabels:['Dormant: point 1','Dormant: point 2','Germinating: point 1','Germinating: point 2']},
      {id:'time',label:'Time (min)',input:'number',dp:2,check:gsPtCheck('time')},{id:'ppm',label:'CO₂ (ppm)',input:'number',dp:0,check:gsPtCheck('ppm')}]},
    {id:'t3',title:'Extension data (optional)',cols:[{id:'n',label:'Trial',rows:[1,2,3]},{id:'cond',label:'Condition (germination time, temperature)',input:'text'},
      {id:'mass',label:'Seed mass (g)',input:'number',dp:2,check:gsExtMassCheck},{id:'rate',label:'Respiration rate (ppm CO₂/min)',input:'number',dp:1,check:gsExtRateCheck},
      {id:'norm',label:'Normalized rate ((ppm CO₂/min)/g)',input:'number',dp:2,check:gsNormCheck('t3')}]}],
  graph:{type:'bar',title:'Normalized rate of cellular respiration',xl:'Seeds',yl:'(ppm CO₂/min)/g',ymin:0,series:[{table:'t1',x:'cond',y:'norm',label:'Normalized rate'}]},
  questions:[
    {id:'q1',n:'1',q:'<p>Explain the difference in the rate of cellular respiration between the dormant seeds and the germinating seeds. Use your normalized rates as evidence.</p>'},
    {id:'ext1',n:'Ext 1',q:'<p><b>Extension (optional):</b> plan your experiment.</p>',fields:[{id:'q',label:'Your question'},{id:'iv',label:'Independent variable (and its levels)'},{id:'dv',label:'Dependent variable'},{id:'cv',label:'Variables you keep the same'}]},
    {id:'ext2',n:'Ext 2',q:'<p><b>Extension (optional):</b> what did you find? Use your extension data, and explain the result in terms of cellular respiration.</p>'}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion that answers the driving question: how does germination affect the rate of cellular respiration in seeds?</p>',cer:true}};

const VLAB_CONTROLS=[
  {id:'coLoc',label:'Where the bottle sits',type:'seg',def:'bench',vlab:true,noTrial:true,options:[{v:'bench',l:'Lab bench'},{v:'dark',l:'Box (dark)'},{v:'window',l:'Sunny windowsill'}]},
  {id:'gsView',label:'Data set on the screen',type:'seg',def:'dorm',vlab:true,noTrial:true,options:[{v:'dorm',l:'Dormant'},{v:'germ',l:'Germinating'},{v:'ext',l:'Extension'}]},
  {id:'gsPt',label:'Examine: time',type:'range',min:0,max:5,step:0.25,def:0,unit:' min',d:2,vlab:true,noTrial:true,help:'Moves the cursor on the sensor graph to read one data point.'},
  {id:'gsFit',label:'Line of best fit',type:'toggle',def:false,vlab:true,noTrial:true,help:'Draws the best-fit line through the data set on the screen.'},
  {id:'gsHours',label:'Extension: germination time',type:'seg',def:24,vlab:true,noTrial:true,options:[{v:24,l:'24 h'},{v:48,l:'48 h'},{v:72,l:'72 h'}]},
  {id:'gsTemp',label:'Extension: bottle temperature',type:'seg',def:22,vlab:true,noTrial:true,options:[{v:10,l:'10 °C'},{v:22,l:'22 °C (room)'},{v:32,l:'32 °C'}]},
  {id:'pauseRead',label:'Pause at each reading',type:'toggle',def:true,vlab:true,noTrial:true,help:'The clock stops at each reading time in the procedure.'}];
const VLAB_ACTIONS=[
  {id:'co-yeast',label:'Add 2 g yeast, 2 g sugar and 50 mL of water, and swirl',vlab:true,enabled:s=>{const B=coB(s),b=B&&s.vlab.bench;return !!b&&!b.ins&&b.contents==='none';},
   run(s){const B=coB(s),b=B&&s.vlab.bench;if(!b||b.ins||b.contents!=='none')return;b.contents='yeast';b.yatt++;b.g.tY=0;BioLab.play(s);}},
  {id:'co-plant',label:'Put the plant in the bottle',vlab:true,enabled:s=>{const B=coB(s),b=B&&s.vlab.bench;return !!b&&!b.ins&&b.contents==='none';},
   run(s){const B=coB(s),b=B&&s.vlab.bench;if(!b||b.ins||b.contents!=='none')return;b.contents='plant';b.g.A=CO.room;BioLab.play(s);}},
  {id:'co-start',label:'Insert the sensors and start collecting',primary:true,vlab:true,enabled:s=>{const B=coB(s),b=B&&s.vlab.bench;return !!b&&!b.ins&&b.part>=0;},
   run(s){const B=coB(s),b=B&&s.vlab.bench;if(!b||b.ins||b.part<0)return;b.att++;b.ins=true;b.loc=s.p.coLoc;b.g.C=B.P.room;b.g.O=CO.air;
     const rec={part:b.part,contents:b.contents,loc:b.loc,mixed:false,att:b.att,t:0,end:CO.parts[b.part].end,lastS:-1,co2:[],o2:[],done:false};
     b.runs[b.part]=rec;b.cur=b.part;b.last=b.part;B.hold=false;B.acc=0;coTick(s,rec);BioLab.play(s);}},
  {id:'co-cap',label:'Capture graph',vlab:true,enabled:s=>{const B=coB(s),b=B&&s.vlab.bench,r=b&&b.part>=0&&b.runs[b.part];return !!r&&r.lastS>=60;},
   run(s){const B=coB(s),b=B&&s.vlab.bench,r=b&&b.part>=0&&b.runs[b.part];if(!r||r.lastS<60)return;b.capN++;b.cap[b.part]=Object.assign(coSnap(r),{n:b.capN});coRefreshCap(s,b.part);}},
  {id:'co-out',label:'Remove the sensors and empty the bottle',vlab:true,enabled:s=>{const B=coB(s),b=B&&s.vlab.bench;return !!b&&(b.ins||b.contents!=='none');},
   run(s){const B=coB(s),b=B&&s.vlab.bench;if(!b)return;b.ins=false;b.cur=-1;b.contents='none';b.g.tY=0;b.g.Cp=B.P.room;b.g.Op=CO.air;B.hold=false;/* the sensors sit in room air while you set up the next part */B.bub=[];BioLab.play(s);}},
  {id:'gs-cal',label:'Calibrate the CO₂ sensor in fresh air',vlab:true,enabled:s=>{const B=gsB(s),b=B&&s.vlab.bench;return !!b&&!b.cal&&b.sensor==='air';},
   run(s){const B=gsB(s),b=B&&s.vlab.bench;if(!b||b.cal)return;b.cal=true;b.disp=gsRead(s,7000,b.idleS);BioLab.play(s);}},
  {id:'gs-count',label:'Count out 25 dormant and 25 germinating seeds',vlab:true,enabled:s=>{const B=gsB(s);return !!B&&!s.vlab.bench.counted;},run(s){if(gsB(s))s.vlab.bench.counted=true;}},
  {id:'gs-wd',label:'Weigh the dormant seeds',vlab:true,enabled:s=>{const B=gsB(s),b=B&&s.vlab.bench;return !!b&&b.counted&&!b.bottled;},
   run(s){const B=gsB(s),b=B&&s.vlab.bench;if(!b||!b.counted||b.bottled)return;b.wd=true;b.bal={w:'dorm',g:B.P.md};}},
  {id:'gs-blot',label:'Blot the germinating seeds dry with a paper towel',vlab:true,enabled:s=>{const B=gsB(s),b=B&&s.vlab.bench;return !!b&&b.counted&&!b.blot&&!b.bottled;},
   run(s){const B=gsB(s),b=B&&s.vlab.bench;if(!b||!b.counted||b.bottled)return;b.blot=true;if(b.bal.w==='germ')b.bal={w:null,g:0};}},
  {id:'gs-wg',label:'Weigh the germinating seeds',vlab:true,enabled:s=>{const B=gsB(s),b=B&&s.vlab.bench;return !!b&&b.counted&&!b.bottled;},
   run(s){const B=gsB(s),b=B&&s.vlab.bench;if(!b||!b.counted||b.bottled)return;b.bal={w:'germ',g:b.blot?B.P.mg:B.P.wet};if(b.blot)b.wgDry=true;}},
  {id:'gs-bottle',label:'Put each set of seeds in its own bottle',vlab:true,enabled:s=>{const B=gsB(s),b=B&&s.vlab.bench;return !!b&&b.counted&&!b.bottled;},
   run(s){const B=gsB(s),b=B&&s.vlab.bench;if(!b||!b.counted)return;b.bottled=true;b.bal={w:null,g:0};}},
  {id:'gs-ext',label:'Prepare an extension bottle (blot and weigh 25 seeds)',vlab:true,enabled:s=>{const B=gsB(s),b=B&&s.vlab.bench;return !!b&&b.bottled&&b.sensor==='air'&&b.ext.length<12;},
   run(s){const B=gsB(s),b=B&&s.vlab.bench;if(!b||!b.bottled||b.sensor!=='air')return;b.att++;const h=s.p.gsHours;
     b.ext.push({hours:h,temp:s.p.gsTemp,mass:gsExtMass(s.vlab.seed,b.att,h),att:b.att,run:null});b.extReady=b.ext.length-1;b.bal={w:'ext',g:b.ext[b.extReady].mass};}},
  {id:'gs-ins',label:'Insert the sensor and lay the bottle on its side',primary:true,vlab:true,
   enabled:s=>{const B=gsB(s),b=B&&s.vlab.bench;if(!b||b.sensor!=='air'||!b.target)return false;return b.target==='ext'?b.extReady>=0:b.bottled;},
   run(s){const B=gsB(s),b=B&&s.vlab.bench;if(!b||b.sensor!=='air'||!b.target)return;if(b.target==='ext'?b.extReady<0:!b.bottled)return;b.att++;
     b.sensor=b.target;b.phase='wait';b.tw=0;b.waitHeld=false;b.g.C=B.P.room+5+20*hr(s.vlab.seed,60,b.att);B.hold=false;b.view=b.target;BioLab.setValues(s,{gsView:b.target});BioLab.play(s);}},
  {id:'gs-rec',label:'Start recording',primary:true,vlab:true,enabled:s=>{const B=gsB(s),b=B&&s.vlab.bench;return !!b&&b.sensor!=='air'&&(b.phase==='wait'||b.phase==='done')&&b.tw>=GS.wait-1e-6;},
   run(s){const B=gsB(s),b=B&&s.vlab.bench;if(!b||b.sensor==='air'||b.tw<GS.wait-1e-6)return;b.att++;const rec={att:b.att,rt:0,pts:[],done:false};
     if(b.sensor==='ext')b.ext[b.extReady].run=rec;else b.runs[b.sensor]=rec;const d=gsRead(s,8000+rec.att*3,0);rec.pts.push(d);b.disp=d;B.acc=0;b.phase='rec';B.hold=false;BioLab.play(s);}},
  {id:'gs-out',label:'Take the sensor out and air it',vlab:true,enabled:s=>{const B=gsB(s),b=B&&s.vlab.bench;return !!b&&b.sensor!=='air';},
   run(s){const B=gsB(s),b=B&&s.vlab.bench;if(!b||b.sensor==='air')return;b.sensor='air';b.phase='idle';b.airT=0;B.hold=false;BioLab.play(s);}}];
const RESP={
  id:'resp',apUnit:3,order:1,kind:'Simulation',card:'Electron transport and ATP synthase. Starve it of oxygen, poison it, or uncouple it.',hash:'respiration',tab:'Cellular respiration',
  title:'Cellular respiration in the inner mitochondrial membrane',
  lede:{bio:'Electrons from your food power protein pumps that push H⁺ ions across the membrane. The H⁺ ions rush back through ATP synthase, which spins and makes ATP.',
        honors:'NADH and FADH₂ hand electrons to the electron transport chain. Complexes I, III and IV use that energy to pump H⁺ into the intermembrane space, and the gradient drives ATP synthase.',
        ap:'Chemiosmosis, measured. Track the proton-motive force and P/O ratio, and use inhibitors and an uncoupler to separate electron transport from ATP synthesis.'},
  timeScale:1,dtMax:0.01,prewarm:20,sampleDt:0.1,window:30,unit:'s',chChange:4,chReveal:12,
  controls:[
    {id:'o2',label:'Oxygen available',type:'range',min:0,max:100,step:1,def:100,unit:'%',lvl:'bio'},
    {id:'fuel',label:'Fuel supply (from glucose)',type:'range',min:0,max:100,step:1,def:80,unit:'%',lvl:'bio'},
    {id:'carrier',label:'Electron carrier',type:'seg',def:'NADH',lvl:'honors',options:[{v:'NADH',l:'NADH'},{v:'FADH2',l:'FADH₂'}]},
    {id:'cn',label:'Cyanide',help:'Blocks Complex IV',type:'toggle',def:false,lvl:'honors'},
    {id:'oligo',label:'Oligomycin',help:'Blocks ATP synthase',type:'toggle',def:false,lvl:'honors'},
    {id:'dnp',label:'DNP',help:'Makes the membrane leaky to H⁺',type:'toggle',def:false,lvl:'ap'}
  ].concat(VLAB_CONTROLS),
  actions:VLAB_ACTIONS,
  labs:[LAB_CO,LAB_GS],
  /* what the bench instruments show right now (used by the virtual-lab tests) */
  benchRead(sim){const B=sim.st.B;if(!B||!sim.vlab)return null;const b=sim.vlab.bench;
    if(B.kind==='co'){const d=coShow(sim),r=coRec(b);return {co2:d.c,o2:d.o,t:r?r.t:0,hold:B.hold,holdAt:B.holdAt,part:b.part,ins:b.ins,contents:b.contents,loc:b.loc};}
    const run=gsViewRun(b,sim.p.gsView),i=Math.round(sim.p.gsPt*60/GS.dt),f=run&&run.done?gsFit(run.pts):null;
    return {balance:b.bal.w?b.bal.g:0,ppm:b.disp,phase:b.phase,tw:b.tw,airT:b.airT,sensor:b.sensor,hold:B.hold,holdWhat:B.holdWhat,
      cursor:run?{t:sim.p.gsPt,ppm:run.pts[i],fit:f?Math.round(f.c+f.m*sim.p.gsPt):null}:null,slope:f?f.m:null,n:run?run.pts.length:0};},
  init(sim){const s={G:0,Je:0,P:0,Rs:0,Rl:0,h:10};if(sim&&sim.vlab){const id=sim.vlab.lab.id;if(id==='co2o2')s.B=coInit(sim);else if(id==='germseeds')s.B=gsInit(sim);}return s;},
  step(sim,dt){if(sim.st.B){if(sim.t<-1e-9)return;(sim.st.B.kind==='co'?coStep:gsStep)(sim,dt*BS);return;}
    const p=sim.p,s=sim.st,S=p.fuel/100,ox=p.o2/100,fo=ox*1.08/(ox+0.08),G=s.G;
    s.Je=p.cn?0:16*S*fo*Math.max(0,1-G);           // NADH (electron pairs) oxidized per s; slowed by back-pressure of the gradient
    s.h=p.carrier==='NADH'?10:6; s.P=s.h*s.Je;     // H+ pumped per s
    s.Rs=p.oligo?0:150*G;                          // H+ returning through ATP synthase
    s.Rl=5*G+(p.dnp?600*G:0);                      // H+ leaking back (heat)
    s.G=clamp(G+(s.P-s.Rs-s.Rl)/250*dt,0,1);},
  metrics:[
    {id:'atp',label:'ATP made',unit:'per s',lvl:'bio',min:0,max:30,d:1,get:s=>s.st.Rs/4},
    {id:'o2use',label:'O₂ used',unit:'per s',lvl:'bio',min:0,max:8,d:2,get:s=>s.st.Je/2},
    {id:'grad',label:'H⁺ gradient',unit:'% of max',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.G*100},
    {id:'ph',label:'Intermembrane pH',unit:'',lvl:'honors',min:6.4,max:7.8,d:2,fixed:true,get:s=>7.8-1.4*s.st.G},
    {id:'leak',label:'H⁺ leak (as heat)',unit:'per s',lvl:'honors',min:0,max:100,d:1,get:s=>s.st.Rl},
    {id:'pmf',label:'Proton-motive force',unit:'mV',lvl:'ap',min:0,max:350,d:0,get:s=>350*s.st.G},
    {id:'po',label:'P/O ratio',unit:'ATP per O',lvl:'ap',min:0,max:3,d:2,get:s=>s.st.Je>0.05?(s.st.Rs/4)/s.st.Je:NaN}
  ],
  defaultGraph:'atp',
  challenges:[
    {lvl:'bio',q:'The cell runs out of oxygen. What happens to ATP production?',
     choices:['It goes up, because the cell works harder','It drops to almost zero','Nothing changes; oxygen is only for breathing'],correct:1,
     change:{o2:0},changeText:'Oxygen set to 0%',watch:'atp',
     explain:{bio:'Oxygen catches the electrons at the end of the chain. With no oxygen, electrons back up, the pumps stop, the H⁺ gradient runs down, and ATP synthase has nothing to power it. That is why cells die within minutes without oxygen.',
              honors:'O₂ is the final electron acceptor at Complex IV. Without it, electrons back up through the chain, pumping stops, the H⁺ gradient runs down, and ATP synthase stalls.'}},
    {lvl:'bio',q:'The fuel supply is cut in half. What happens to the H⁺ gradient?',
     choices:['It gets bigger','It gets smaller','It stays the same'],correct:1,
     change:{fuel:40},changeText:'Fuel cut from 80% to 40%',watch:'grad',
     explain:{bio:'Fewer electrons from food means the pumps run more slowly. Fewer H⁺ ions are pushed across, so the gradient shrinks and ATP production falls with it.'}},
    {lvl:'honors',q:'Oligomycin blocks ATP synthase. What happens to oxygen use?',
     choices:['It rises, because the cell is desperate for ATP','It drops, because the H⁺ gradient backs up and slows the pumps','It stays the same; the electron chain does not depend on ATP synthase'],correct:1,
     change:{oligo:true},changeText:'Oligomycin added',watch:'o2use',
     explain:{honors:'Electron transport and ATP synthesis are coupled through the gradient. With ATP synthase blocked, H⁺ has nowhere to go, the gradient maxes out, and pumping against it becomes too hard. Electron flow, and so O₂ use, nearly stops.',
              ap:'This is respiratory control. With the F₀ channel blocked, the proton-motive force climbs until pumping is thermodynamically unfavorable, so electron transport and O₂ consumption nearly stop even though substrate and O₂ are present.'}},
    {lvl:'honors',q:'Switch the electron carrier from NADH to FADH₂. What happens to ATP output?',
     choices:['More ATP','Less ATP','The same ATP'],correct:1,
     change:{carrier:'FADH2'},changeText:'Carrier switched to FADH₂',watch:'atp',
     explain:{honors:'FADH₂ hands its electrons to Complex II, which skips Complex I. Complex II does not pump H⁺, so each FADH₂ moves fewer H⁺ across and produces less ATP than NADH.',
              ap:'FADH₂ enters at Complex II and bypasses Complex I’s 4 H⁺. That is 6 H⁺ per pair instead of 10, so at about 4 H⁺ per ATP the P/O ratio falls from about 2.5 to about 1.5.'}},
    {lvl:'ap',q:'DNP makes the membrane leaky to H⁺. What happens to O₂ use and ATP production?',
     choices:['Both drop','O₂ use rises while ATP production falls','Both rise','O₂ use falls while ATP production rises'],correct:1,
     change:{dnp:true},changeText:'DNP added',watch:'o2use',
     explain:{ap:'DNP is an uncoupler. H⁺ leaks back without passing through ATP synthase, so the proton-motive force collapses and the energy is released as heat. With no back-pressure, electron transport speeds up and O₂ use rises, but ATP output and the P/O ratio crash. DNP was sold as a diet drug in the 1930s and caused fatal overheating.'}},
    {lvl:'ap',q:'Cyanide binds Complex IV. What happens to the proton-motive force?',
     choices:['It rises','It collapses toward zero','It is unchanged'],correct:1,
     change:{cn:true},changeText:'Cyanide added',watch:'pmf',
     explain:{ap:'Cyanide stops electron transfer to O₂, so no complex can pump. ATP synthase and the small leak keep draining the gradient, and the proton-motive force decays toward zero. Compare this with oligomycin, where the force goes up instead.'}}
  ],
  initVis(sim){const r=rng(7),v=sim.vis;v.hpos=[];for(let i=0;i<80;i++)v.hpos.push([12+r()*776,34+r()*112,r()*6.28]);
    v.mpos=[];for(let i=0;i<7;i++)v.mpos.push([20+r()*560,270+r()*60]);
    v.e=[];v.p=[];v.atp=[];v.w=[];v.eAcc=0;v.pAcc=0;v.sAcc=0;v.lAcc=0;v.aAcc=0;v.wAcc=0;v.rot=0;},
  draw(sim,ctx,vdt,k,t){
    if(sim.st.B&&sim.vlab){(sim.st.B.kind==='co'?drawCO:drawGS)(sim,ctx,vdt,k,t);return;}
    const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap'),R=Math.random;
    ctx.fillStyle=PAL['cv-ims'];ctx.fillRect(0,0,800,172);
    ctx.fillStyle=PAL['cv-matrix'];ctx.fillRect(0,248,800,202);
    ctx.fillStyle=PAL['cv-tail'];ctx.fillRect(0,172,800,76);
    // phospholipid bilayer
    ctx.strokeStyle=PAL['cv-head'];ctx.lineWidth=1.4;ctx.globalAlpha=.55;ctx.beginPath();
    for(let x=6;x<800;x+=11){ctx.moveTo(x-2,181);ctx.lineTo(x-2,205);ctx.moveTo(x+2,181);ctx.lineTo(x+2,205);ctx.moveTo(x-2,215);ctx.lineTo(x-2,239);ctx.moveTo(x+2,215);ctx.lineTo(x+2,239);}
    ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=PAL['cv-head'];
    for(let x=6;x<800;x+=11){ctx.beginPath();ctx.arc(x,177,5,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(x,243,5,0,6.29);ctx.fill();}
    // region labels
    txt(ctx,'INTERMEMBRANE SPACE',12,22,{s:12*k,w:700,c:PAL['cv-soft']});
    txt(ctx,'MATRIX',12,442,{s:12*k,w:700,c:PAL['cv-soft']});
    // H+ ions accumulated in the intermembrane space
    const nH=Math.round(4+s.G*72),jit=RM?0:1.6;ctx.fillStyle=PAL['cv-h'];
    for(let i=0;i<nH&&i<v.hpos.length;i++){const q=v.hpos[i];ctx.beginPath();ctx.arc(q[0]+Math.sin(t*1.7+q[2])*jit,q[1]+Math.cos(t*1.3+q[2])*jit,4.2,0,6.29);ctx.fill();}
    ctx.globalAlpha=.75;for(const q of v.mpos){ctx.beginPath();ctx.arc(q[0]+Math.sin(t+q[1])*jit,q[1],4.2,0,6.29);ctx.fill();}ctx.globalAlpha=1;
    // proteins
    const lab=(s_,x,y,sz)=>txt(ctx,s_,x,y,{s:sz*k,w:700,c:'#fff',a:'center',b:'middle'});
    ctx.fillStyle='#3f6fb0';rr(ctx,70,160,82,104,14);ctx.fill();rr(ctx,88,250,52,78,14);ctx.fill();
    ctx.fillStyle='#5d72a0';rr(ctx,190,204,44,62,10);ctx.fill();rr(ctx,194,258,36,42,10);ctx.fill();
    ctx.fillStyle='#2a8276';rr(ctx,300,156,62,116,14);ctx.fill();
    ctx.fillStyle='#7a4fa6';rr(ctx,440,156,62,118,14);ctx.fill();
    ctx.fillStyle='#cf8619';ctx.beginPath();ctx.ellipse(268,212,15,11,0,0,6.29);ctx.fill();
    ctx.fillStyle='#c4533b';ctx.beginPath();ctx.arc(405,147,14,0,6.29);ctx.fill();
    if(hon){lab('I',111,205,18);lab('II',212,232,15);lab('III',331,214,18);lab('IV',471,214,18);lab('Q',268,213,12);lab('c',405,148,13);}
    else{lab('Pump',111,205,13);lab('Pump',331,214,13);lab('Pump',471,214,13);}
    // ATP synthase: F0 rotor ring in membrane, stalk, F1 head in matrix
    v.rot+=s.Rs*0.012*vdt;
    ctx.fillStyle='#8e1023';rr(ctx,616,176,68,68,12);ctx.fill();
    for(let i=0;i<8;i++){const a=v.rot+i*Math.PI/4,c=Math.cos(a);if(c<0)continue;const x=650+28*Math.sin(a);
      ctx.fillStyle=c>.5?'#e0455f':'#b5122d';rr(ctx,x-5,180,10,60,5);ctx.fill();}
    ctx.fillStyle='#8e1023';ctx.fillRect(645,244,10,46);
    ctx.strokeStyle='#8e1023';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(684,236);ctx.quadraticCurveTo(700,270,690,300);ctx.stroke();
    [[624,322,'#b5122d'],[650,326,'#e0455f'],[676,322,'#b5122d'],[637,302,'#e0455f'],[663,302,'#b5122d']].forEach(c=>{ctx.fillStyle=c[2];ctx.beginPath();ctx.arc(c[0],c[1],17,0,6.29);ctx.fill();});
    txt(ctx,'ATP synthase',704,326,{s:13*k,w:700});
    // entry / exit labels
    if(p.carrier==='NADH'||!hon)txt(ctx,hon?'NADH → NAD⁺':'Electrons from food',115,350,{s:12.5*k,w:600,a:'center'});
    if(hon&&p.carrier==='FADH2')txt(ctx,'FADH₂ → FAD',212,322,{s:12.5*k,w:600,a:'center'});
    txt(ctx,hon?'O₂ + H⁺ → H₂O':'Oxygen catches electrons',470,352,{s:12.5*k,w:600,a:'center'});
    if(ap){pill(ctx,p.carrier==='NADH'?'4 H⁺':'0 H⁺',111,120,PAL['card'],PAL['cv-ink'],11*k);pill(ctx,'4 H⁺',331,120,PAL['card'],PAL['cv-ink'],11*k);pill(ctx,'2 H⁺',470,120,PAL['card'],PAL['cv-ink'],11*k);pill(ctx,'≈4 H⁺ per ATP',650,120,PAL['card'],PAL['cv-ink'],11*k);}
    // fuel & oxygen tokens in the matrix
    const nf=Math.round(p.fuel/100*5);for(let i=0;i<nf;i++)txt(ctx,(hon&&p.carrier==='FADH2')?'FADH₂':'NADH',40+i*38+(i%2)*6,392+(i%2)*22,{s:12*k,w:600,c:PAL['cv-soft']});
    const no=Math.round(p.o2/100*6);for(let i=0;i<no;i++)txt(ctx,'O₂',400+i*32,392+(i%2)*22,{s:13*k,w:700,c:PAL['cv-soft']});
    // blockers
    if(p.cn){ctx.strokeStyle='#d32f2f';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(446,166);ctx.lineTo(496,264);ctx.moveTo(496,166);ctx.lineTo(446,264);ctx.stroke();pill(ctx,'Cyanide',470,92,'#d32f2f','#fff',12*k);}
    if(p.oligo){ctx.strokeStyle='#e08a00';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(620,180);ctx.lineTo(680,240);ctx.moveTo(680,180);ctx.lineTo(620,240);ctx.stroke();pill(ctx,'Oligomycin',650,92,'#b86e00','#fff',12*k);}
    if(p.dnp){pill(ctx,'DNP',560,92,'#6a32d0','#fff',12*k);ctx.fillStyle=PAL['cv-dnp'];
      [530,556,582,720,746,772].forEach((x,i)=>{const y=210+Math.sin(t*3+i*1.3)*30;ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x+6,y);ctx.lineTo(x,y+7);ctx.lineTo(x-6,y);ctx.closePath();ctx.fill();});}
    // spawn animated particles in proportion to the model's rates
    v.eAcc+=s.Je*0.55*vdt;while(v.eAcc>=1){v.eAcc--;v.e.push({d:0,path:(hon&&p.carrier==='FADH2')?PATH_F:PATH_N});}
    const pumps=(hon&&p.carrier==='FADH2')?[[331,4],[470,2]]:[[111,4],[331,4],[470,2]];const tw=pumps.reduce((a,b)=>a+b[1],0);
    v.pAcc+=s.P*0.05*vdt;while(v.pAcc>=1){v.pAcc--;let r=R()*tw,x=pumps[0][0];for(const q of pumps){if(r<q[1]){x=q[0];break;}r-=q[1];}v.p.push({x:x+R()*18-9,y:262,vy:-120,end:60+R()*80,c:'h'});}
    v.sAcc+=s.Rs*0.05*vdt;while(v.sAcc>=1){v.sAcc--;v.p.push({x:650+R()*10-5,y:140,vy:120,end:300,c:'h'});}
    if(p.dnp){v.lAcc+=(s.Rl-5*s.G)*0.05*vdt;while(v.lAcc>=1){v.lAcc--;const x=R()<.5?520+R()*70:710+R()*80;v.p.push({x,y:150,vy:120,end:280,c:'l'});}}
    v.aAcc+=(s.Rs/4)*0.32*vdt;while(v.aAcc>=1){v.aAcc--;v.atp.push({x:650,y:345,vx:R()*80-40,vy:20+R()*40,life:1.6});}
    v.wAcc+=(s.Je/2)*0.3*vdt;while(v.wAcc>=1){v.wAcc--;v.w.push({x:470,y:300,vx:R()*30-15,vy:22,life:1.4});}
    // electrons
    for(const e of v.e){e.d+=230*vdt;const q=e.path.at(e.d);ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(q[0],q[1],4.6,0,6.29);ctx.fill();ctx.stroke();}
    v.e=v.e.filter(e=>e.d<e.path.L);
    // moving H+
    for(const h of v.p){h.y+=h.vy*vdt;ctx.fillStyle=PAL['cv-h'];ctx.beginPath();ctx.arc(h.x,h.y,4.4,0,6.29);ctx.fill();if(h.c==='l'){ctx.strokeStyle=PAL['cv-dnp'];ctx.lineWidth=2;ctx.stroke();}}
    v.p=v.p.filter(h=>h.vy<0?h.y>h.end:h.y<h.end);
    for(const a of v.atp){a.x+=a.vx*vdt;a.y+=a.vy*vdt;a.life-=vdt;ctx.globalAlpha=clamp(a.life/1.6,0,1);txt(ctx,'ATP',a.x,a.y,{s:13*k,w:800,c:PAL['cv-atp'],a:'center'});}
    for(const a of v.w){a.x+=a.vx*vdt;a.y+=a.vy*vdt;a.life-=vdt;ctx.globalAlpha=clamp(a.life/1.4,0,1)*.8;txt(ctx,'H₂O',a.x,a.y,{s:11.5*k,w:600,c:PAL['cv-sub'],a:'center'});}
    ctx.globalAlpha=1;v.atp=v.atp.filter(a=>a.life>0);v.w=v.w.filter(a=>a.life>0);
    if(v.e.length>200)v.e.splice(0,v.e.length-200);if(v.p.length>300)v.p.splice(0,v.p.length-300);
    // legend
    const ly=438;ctx.fillStyle=PAL['cv-e'];ctx.beginPath();ctx.arc(600,ly-4,4.6,0,6.29);ctx.fill();txt(ctx,'electron',610,ly,{s:12*k,c:PAL['cv-soft']});
    ctx.fillStyle=PAL['cv-h'];ctx.beginPath();ctx.arc(690,ly-4,4.4,0,6.29);ctx.fill();txt(ctx,'H⁺ ion',700,ly,{s:12*k,c:PAL['cv-soft']});
  }
};
Object.assign(RESP,{
  scale:'Zoomed in on the inner membrane of one mitochondrion. This strip is about 100 nanometers wide, roughly 1/800 the width of a human hair.',
  narrate(sim){if(sim.st.B&&sim.vlab)return sim.st.B.kind==='co'?coNarrate(sim):gsNarrate(sim);
    const p=sim.p,s=sim.st,hon=atLeast('honors'),atp=(s.Rs/4).toFixed(1);
    if(p.cn)return '<b>Cyanide is jamming Complex IV.</b> Electrons can’t reach oxygen, so the whole chain stops. The H⁺ gradient drains away and ATP production collapses.';
    if(p.o2<5)return '<b>No oxygen is catching electrons at the end of the chain.</b> Electrons back up, the pumps stop, and ATP production falls to nothing.';
    if(p.oligo)return '<b>ATP synthase is blocked.</b> H⁺ piles up outside until the pumps can’t push any more, so electron flow slows to a trickle and oxygen use drops.';
    if(p.dnp)return '<b>DNP is letting H⁺ leak straight back through the membrane.</b> The pumps race and oxygen use climbs, but the energy escapes as heat instead of making ATP ('+atp+' per second).';
    if(p.fuel<8)return '<b>Almost no fuel.</b> With few electrons arriving, the pumps barely run and the gradient fades.';
    if(hon&&p.carrier==='FADH2')return 'FADH₂ hands its electrons to Complex II, which skips Complex I. Fewer H⁺ get pumped per pair of electrons, so ATP synthase makes only <b>'+atp+' ATP per second</b>.';
    return 'Electrons flow down the chain and the '+(hon?'complexes':'pumps')+' push H⁺ up into the space above. The H⁺ rush back down through ATP synthase, making <b>'+atp+' ATP every second</b>.';},
  tour:[
    {title:'Where we are',text:{bio:'This is the inner membrane of one mitochondrion, the cell’s power plant. Most cells in your body have hundreds of these. The membrane separates the <b>intermembrane space</b> (top) from the <b>matrix</b> (bottom).',honors:'The inner mitochondrial membrane separates the intermembrane space (top) from the matrix (bottom). The electron transport chain and ATP synthase are embedded in it.'},focus:[0,150,800,110]},
    {title:'Electrons arrive',text:{bio:'Food you ate was broken down earlier into carriers loaded with high-energy electrons. Watch the yellow dots: electrons enter at the first pump.',honors:'NADH from glycolysis and the Krebs cycle drops off two high-energy electrons at Complex I. Watch the yellow dots enter.'},focus:[60,150,110,215],speed:0.1},
    {title:'Electrons power the pumps',text:{bio:'As electrons pass from pump to pump, they release energy. The pumps use it to push H⁺ ions (pink) up across the membrane.',honors:'Electrons pass I → Q → III → cytochrome c → IV, dropping in energy at each step. Complexes I, III and IV use that energy to pump H⁺ into the intermembrane space.'},focus:[60,110,460,170],speed:0.1},
    {title:'Oxygen catches the electrons',text:{bio:'At the end of the chain, oxygen grabs the used-up electrons and joins with H⁺ to make water. No oxygen means nowhere for electrons to go.',honors:'O₂ is the final electron acceptor. At Complex IV it takes the electrons and H⁺ to form H₂O. Without O₂ the chain backs up and stops.'},focus:[425,150,95,215],speed:0.1},
    {title:'The gradient builds',text:'H⁺ ions crowd into the space above the membrane, like water piling up behind a dam. More H⁺ above than below means stored energy.',focus:[0,0,800,170],speed:0.4},
    {title:'ATP synthase spins',text:{bio:'H⁺ flow back down through ATP synthase, a tiny rotary machine. As it spins, it snaps phosphate onto ADP to make ATP, the energy your cells spend.',honors:'H⁺ diffuse back down their gradient through ATP synthase. The flow turns its rotor, which drives ADP + Pᵢ → ATP. This is chemiosmosis.'},focus:[605,110,130,270],speed:0.25},
    {lvl:'honors',title:'FADH₂ enters later',text:'FADH₂ drops its electrons at Complex II, which does not pump H⁺. Switch the carrier to FADH₂ and compare ATP output.',focus:[180,190,70,140],speed:0.25,setup(sim){BioLab.setValues(sim,{carrier:'FADH2'});}},
    {lvl:'ap',title:'Counting protons',text:'Per NADH: 4 + 4 + 2 = 10 H⁺ pumped. ATP synthase needs about 3 H⁺ per ATP, plus 1 to import phosphate, so roughly 4 H⁺ per ATP. 10 ÷ 4 = 2.5 ATP per NADH, and 6 ÷ 4 = 1.5 per FADH₂.',focus:[50,100,730,45],pause:true,setup(sim){BioLab.setValues(sim,{carrier:'NADH'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{carrier:'NADH'});},
  lab:{bio:'<p><b>Question:</b> How does the amount of oxygen affect ATP production?</p><ol><li>Leave fuel at 80%.</li><li>Record a trial at oxygen 100, 75, 50, 25, 10 and 0%. Let each one settle for a few seconds first.</li><li>On the Trials graph, plot oxygen (x) against ATP made (y).</li></ol><p>Write a claim about oxygen and ATP, and support it with two numbers from your table.</p>',
       honors:'<p><b>Question:</b> How do different poisons affect oxygen use and ATP production?</p><ol><li>Record a baseline trial.</li><li>Record one trial each with cyanide, then oligomycin (turn the first one off before the next).</li><li>Record NADH and FADH₂ trials with no poisons.</li></ol><p>Explain why oligomycin lowers oxygen use even though it acts on ATP synthase, not on the electron chain.</p>',
       ap:'<p><b>Question:</b> How tightly is electron transport coupled to ATP synthesis?</p><ol><li>Record baseline, oligomycin, DNP and cyanide trials, with NADH and then FADH₂.</li><li>For each, compare O₂ use, ATP made and the P/O ratio.</li></ol><p><b>Claim–evidence–reasoning:</b> Use your data to explain respiratory control and why uncouplers like DNP raise body temperature.</p>'},
  terms:[{t:'Electron transport chain',d:'Proteins in the inner membrane that pass electrons along and use their energy to pump H⁺.'},{t:'ATP synthase',d:'A rotary enzyme that makes ATP as H⁺ flow through it.'},{t:'H⁺ gradient',d:'More H⁺ on one side of the membrane than the other. It stores energy, like water behind a dam.'},
    {lvl:'honors',t:'Chemiosmosis',d:'Making ATP using the energy of H⁺ flowing down their gradient through ATP synthase.'},{lvl:'honors',t:'Final electron acceptor',d:'O₂. It takes electrons at the end of the chain and forms water.'},{lvl:'honors',t:'NADH / FADH₂',d:'Electron carriers made in glycolysis and the Krebs cycle.'},
    {lvl:'ap',t:'Proton-motive force',d:'The combined pH and voltage difference across the membrane that drives H⁺ back through ATP synthase.'},{lvl:'ap',t:'Uncoupler',d:'A molecule, like DNP, that lets H⁺ leak across the membrane, so energy becomes heat instead of ATP.'},{lvl:'ap',t:'P/O ratio',d:'ATP made per oxygen atom reduced: about 2.5 for NADH and 1.5 for FADH₂.'}]
});
BioLab.register(RESP);
})();
