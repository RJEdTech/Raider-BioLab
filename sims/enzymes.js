(function(){
'use strict';
const {clamp,rng,rr,txt,pill,polyline,atLeast,PAL,FONT,RM}=BioLab.h;
const ENZ={amylase:{name:'Amylase',pH:6.8,Tref:37,Tm:44,w:2.5,Tirr:55},
           pepsin:{name:'Pepsin',pH:2.0,Tref:37,Tm:44,w:2.5,Tirr:55},
           taq:{name:'Taq polymerase',pH:8.3,Tref:72,Tm:80,w:3,Tirr:95}};
const KM=5,KI=2,VMAX=100;
const ENZPOS=[[120,150],[300,130],[480,150],[660,130],[160,320],[340,300],[520,320],[690,300]];
function benchNarrate(sim){const B=sim.st.B,b=sim.vlab.bench;
  if(B.kind==='cp'){const k=b.slot,tl=k>=0?'<b>Trial '+(k+1)+'</b> ('+CP.al[k]+' yeast). ':'';
    if(B.state==='empty')return tl+'The beaker is empty, rinsed and dry. Add 100 mL of 1% H₂O₂ when the procedure says to.';
    if(B.state==='peroxide')return tl+'The thermometer probe sits in the H₂O₂. Wait for the reading to settle before you record the starting temperature.';
    if(B.state==='running'){const r=B.o2,w=r>2.5?'Bubbles pour off the yeast and foam climbs the beaker.':r>1?'Steady streams of bubbles rise and a layer of foam builds.':r>0.3?'Small bubbles rise slowly from the yeast.':'Only a few bubbles rise.';
      return tl+w+(B.hold?' <b>Reading time: '+B.holdAt+' s.</b> Record the temperature, then press Play.':' Catalase splits H₂O₂ into water and O₂, and the reaction releases heat.');}
    return tl+'<b>The stopwatch reached 3:00.</b> Write your observations, then empty, rinse and dry the beaker.';}
  if(!b.h2o2)return 'Three clean 100 mL graduated cylinders. Add 5 mL of 3% H₂O₂ to each.';
  if(!b.buf)return 'Each cylinder holds 5 mL of H₂O₂. Add the buffers next: pH 10, pH 7 and pH 4.';
  if(!b.liver)return 'Each cylinder now holds H₂O₂ at a different pH. Add the liver homogenate to start the reactions.';
  if(b.t<120)return 'Catalase from the liver splits H₂O₂ into water and O₂ gas, and the gas is trapped as foam. <b>Compare how fast the foam rises in each cylinder.</b>';
  return '<b>2:00.</b> Read the top of the foam in each cylinder. Choose a cylinder under Magnify to read its scale up close.';}
/* ---------- Virtual lab benches (Virtual lab mode; see VLAB.md) ----------
   catalase-cp: yeast catalase in 100 mL of 1% H₂O₂ in a 250 mL beaker, read with a digital thermometer and a stopwatch.
   catalase-honors: liver catalase with pH 4, 7 and 10 buffers in three 100 mL graduated cylinders; read the top of the foam.
   Run-to-run variation comes from the lab's saved seed, so a reload never changes data already recorded. */
function hr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function hn(seed,a,b){const u=Math.max(1e-9,hr(seed,a,b)),w=hr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const r1=v=>Math.round(v*10)/10;
const LCD='700 VSIZEpx "Consolas","Menlo","DejaVu Sans Mono","Courier New",monospace';
const mmss=s=>{s=Math.max(0,Math.floor(s+1e-6));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
/* --- CP: yeast amount vs temperature rise --- */
const CP={amt:[0.25,0.5,1],al:['0.25 tbsp','0.5 tbsp','1.0 tbsp'],
  Q:2890,     // J if 100 mL of 1% H₂O₂ (1.00 g = 0.0294 mol) fully decomposes, at 98.2 kJ per mol of H₂O₂
  Csol:418,Cgl:84, // J/°C: 100 g of solution, and about 100 g of beaker glass
  eff:0.9,    // share of the heat that stays in the beaker (some leaves with the O₂ and the foam)
  kc:0.0115,  // first-order rate constant per tbsp of yeast (1/s) once the yeast has mixed in
  hl:1/700,   // Newton cooling of a 100 mL beaker (1/s)
  tp:3,       // thermometer probe response time (s)
  o2:360,     // mL of O₂ from 0.0294 mol H₂O₂ at room temperature
  fa:0.35,ft:40}; // share of O₂ held as foam, and foam lifetime (s)
const amtLabel=a=>a===0.25?'0.25 tbsp':a===0.5?'0.5 tbsp':'1.0 tbsp';
function cpInit(sim){const V=sim.vlab,seed=V.seed,b=V.bench;if(!Array.isArray(b.trials))b.trials=[null,null,null];if(b.slot===undefined)b.slot=-1;if(!b.att)b.att=0;
  const room=20.6+1.8*hr(seed,2,0);
  return {kind:'cp',room,stock:room-0.2+0.4*(hr(seed,3,0)-0.5),act:Math.exp(0.12*hn(seed,1,0)),state:'empty',glass:room,T:room,Tp:room,P:1,F:0,o2:0,
    t:0,tr:0,clock:0,stop:30,hold:false,holdAt:0,disp:r1(room),dsec:-1,lastS:0,pre:[],rec:null,yeast:0,k:0};}
function cpPhys(B,h){
  if(B.state==='empty'){B.glass+=(B.room-B.glass)*h/240;B.Tp+=(B.room-B.Tp)*h/8;B.o2=0;B.F=Math.max(0,B.F-B.F*h/3);return;}
  let r=0;if(B.yeast>0){const k=B.k*(1-Math.exp(-B.tr/12));r=k*B.P;B.P=Math.max(0,B.P-r*h);B.tr+=h;}
  B.T+=(CP.Q*CP.eff*r/(CP.Csol+CP.Cgl)-CP.hl*(B.T-B.room))*h;B.glass=B.T;
  B.Tp+=(B.T-B.Tp)*h/CP.tp;B.o2=r*CP.o2;B.F+=(CP.fa*B.o2-B.F/CP.ft)*h;}
function cpTickRun(sim,B){const s=Math.floor(B.t+1e-6);while(B.lastS<s&&B.lastS<180){B.lastS++;const d=r1(B.Tp+0.05*hn(sim.vlab.seed,1000+B.rec.att,B.lastS));B.rec.disp[B.lastS]=d;B.disp=d;}}
function cpTickIdle(sim,B){const s=Math.floor(B.clock);if(s!==B.dsec){B.dsec=s;B.disp=r1(B.Tp+0.05*hn(sim.vlab.seed,9000,s));B.pre.push(B.disp);if(B.pre.length>12)B.pre.shift();}}
function cpStep(sim,ds){const B=sim.st.B;if(B.hold){if(!sim.running)return;B.hold=false;}
  while(ds>1e-9){let h=Math.min(ds,0.5);
    if(B.state==='running'){const to=B.stop-B.t;
      if(to<=h+1e-9){h=Math.max(0,to);cpPhys(B,h);B.clock+=h;ds-=h;B.t=B.stop;cpTickRun(sim,B);const at=B.stop;B.stop+=30;
        if(at>=180){B.state='done';B.rec.done=true;}
        if(sim.p.pauseRead){B.hold=true;B.holdAt=at;BioLab.pause(sim);return;}continue;}
      cpPhys(B,h);B.clock+=h;B.t+=h;cpTickRun(sim,B);}
    else{cpPhys(B,h);B.clock+=h;cpTickIdle(sim,B);}
    ds-=h;}}
const cpB=sim=>sim.st&&sim.st.B&&sim.st.B.kind==='cp'?sim.st.B:null;
function cpCheck(k){return (sim,tr,v)=>{const rec=(sim.vlab.bench.trials||[])[k],B=cpB(sim);
  // the 0 s reading is taken before the yeast goes in: compare it with the live display
  if(+tr===0&&B&&B.state==='peroxide'&&sim.vlab.bench.slot===k){if([B.disp].concat(B.pre).some(x=>Math.abs(x-v)<0.051))return null;return 'The thermometer reads '+B.disp.toFixed(1)+' °C right now. Check your reading.';}
  if(!rec)return 'Run Trial '+(k+1)+' on the bench first, then read the thermometer.';
  const d=rec.disp||[];tr=+tr;
  if(tr===0){if([d[0]].concat(rec.pre||[]).some(x=>Number.isFinite(x)&&Math.abs(x-v)<0.051))return null;
    return 'The thermometer read '+d[0].toFixed(1)+' °C just before you added the yeast. Check your reading.';}
  if(!Number.isFinite(d[tr]))return 'Trial '+(k+1)+' has not reached '+tr+' s on the stopwatch yet.';
  for(let s=tr-2;s<=tr+2;s++)if(Number.isFinite(d[s])&&Math.abs(d[s]-v)<0.051)return null;
  return 'The thermometer read '+d[tr].toFixed(1)+' °C at '+tr+' s. Check your reading.';};}
function cpCalcCheck(k){return (sim,v,V)=>{const T=V.col('t'+(k+1),'T'),f=T.filter(Number.isFinite);
  if(!Number.isFinite(T[0])||f.length<2)return 'Fill in the Trial '+(k+1)+' table first, including the 0 s temperature.';
  if(v<0)return 'ΔT is the highest temperature minus the starting temperature, so it should not be negative here.';
  if(Math.abs(v-(Math.max(...f)-T[0]))>0.051)return 'Check this against your Trial '+(k+1)+' table: subtract the 0 s temperature from the highest temperature you recorded.';
  return null;};}
/* --- Honors: pH vs catalase activity (foam height) --- */
const HZ={ph:[10,7,4],act:{10:0.42,7:1,4:0.10},Fmax:46,liq:9,tint:{10:'#3f7fd9',7:'#e0b030',4:'#d9534f'}};
function hzAct(seed,att,j){return HZ.act[HZ.ph[j]]*Math.exp(0.1*hn(seed,20+j,att))*Math.exp(0.08*hn(seed,30,att));}
function hzFoam(seed,att,j,t){if(!(t>0))return 0;const a=hzAct(seed,att,j),kk=0.05*a+0.004;return HZ.Fmax*Math.pow(a,0.9)*(1-Math.exp(-kk*t))*Math.exp(-t/1800);}
function hzLiquid(b){return (b.h2o2?5:0)+(b.buf?3:0)+(b.liver?1:0);}
function hzLevel(sim,j){const b=sim.vlab.bench;return hzLiquid(b)+(b.liver?hzFoam(sim.vlab.seed,b.att||0,j,b.t||0):0);}
function hzInit(sim){const b=sim.vlab.bench;if(!b.att)b.att=0;if(!Number.isFinite(b.t))b.t=0;return {kind:'hz',hold:false,stopped:(b.t||0)>=120};}
function hzStep(sim,ds){const B=sim.st.B,b=sim.vlab.bench;if(B.hold){if(!sim.running)return;B.hold=false;}if(!b.liver)return;
  const t0=b.t||0;let t1=Math.min(600,t0+ds);if(!B.stopped&&t0<120&&t1>=120){t1=120;B.stopped=true;b.t=120;if(sim.p.pauseRead){B.hold=true;BioLab.pause(sim);return;}}
  b.t=Math.round(t1*100)/100;}
const hzB=sim=>sim.st&&sim.st.B&&sim.st.B.kind==='hz'?sim.st.B:null;
function hzVolCheck(sim,rv,v){const b=sim.vlab.bench,run=b.liver?{att:b.att||0,t:b.t||0}:b.last;
  if(!run)return 'Run the reactions on the bench first, then read the top of the foam.';
  const j=HZ.ph.indexOf(parseFloat(rv));if(j<0)return null;const t=run.t,top=s=>HZ.liq+hzFoam(sim.vlab.seed,run.att,j,s);
  if(t<110)return 'Let the reactions run until the stopwatch reads 2:00, then read the top of the foam.';
  let lo=1e9,hi=-1e9;for(let s=Math.min(120,t);s<=t+0.01;s+=5){const L=top(s);lo=Math.min(lo,L);hi=Math.max(hi,L);}
  if(v>=lo-2.5&&v<=hi+2.5)return null;
  return 'The top of the foam in cylinder '+(j+1)+' (pH '+rv+') was at about '+Math.round(top(Math.min(t,120)))+' mL at 2:00. Check your reading.';}
function hzRateCheck(sim,rv,v){const V=sim.vlab,vol=V.col('t1','vol'),rate=V.col('t1','rate'),rows=['4.0','7.0','10.0'],i=rows.indexOf(String(rv));if(i<0)return null;
  for(let j=0;j<3;j++){if(j===i||!Number.isFinite(vol[i])||!Number.isFinite(vol[j])||!Number.isFinite(rate[j]))continue;
    if(vol[i]>vol[j]+3&&rate[i]<rate[j])return 'Your rating does not match your foam volumes: the pH '+rv+' cylinder made more foam than the pH '+rows[j]+' cylinder, so it reacted faster.';
    if(vol[i]+3<vol[j]&&rate[i]>rate[j])return 'Your rating does not match your foam volumes: the pH '+rv+' cylinder made less foam than the pH '+rows[j]+' cylinder.';}
  return null;}
/* --- drawing helpers --- */
function lcdBox(ctx,x,y,w,h,label,value,k,vsize){ctx.fillStyle='#2b2f36';rr(ctx,x,y,w,h,12);ctx.fill();txt(ctx,label,x+14,y+20,{s:Math.min(12*k,16),w:700,c:'#d7dbe0'});
  const sy=y+30,sh=h-42;ctx.fillStyle='#cfe3c8';rr(ctx,x+12,sy,w-24,sh,6);ctx.fill();ctx.fillStyle='#1b2a1b';ctx.font=LCD.replace('VSIZE',String(vsize||48));ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(value,x+w-24,sy+sh/2+2);}
function benchBase(ctx){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,394,800,56);ctx.fillStyle=PAL['line'];ctx.fillRect(0,394,800,2);}
function drawCP(sim,ctx,vdt,k,t){const B=sim.st.B,b=sim.vlab.bench,p=sim.p,v=sim.vis,R=Math.random;benchBase(ctx);
  const slot=b.slot,head=slot>=0?'Trial '+(slot+1)+' of 3 · '+CP.al[slot]+' yeast':'Yeast and H₂O₂ bench';
  txt(ctx,head,16,32,{s:Math.min(16*k,26),w:700});
  // supplies
  ctx.fillStyle='#6b4a2b';rr(ctx,36,262,62,132,10);ctx.fill();ctx.fillStyle='#4e351e';ctx.fillRect(52,240,30,24);ctx.fillStyle='#f6f2ea';ctx.fillRect(42,300,50,40);
  txt(ctx,'1%',67,316,{s:13,w:700,c:'#2b2b2b',a:'center'});txt(ctx,'H₂O₂',67,333,{s:13,w:700,c:'#2b2b2b',a:'center'});
  ctx.fillStyle='#d9c79a';rr(ctx,112,318,70,76,10);ctx.fill();ctx.fillStyle='#8a6d3b';ctx.fillRect(108,306,78,16);ctx.fillStyle='#f6f2ea';ctx.fillRect(120,340,54,30);txt(ctx,'YEAST',147,360,{s:12,w:700,c:'#2b2b2b',a:'center'});
  txt(ctx,'Spoon: '+amtLabel(p.spoon),110,424,{s:Math.min(13*k,23),w:600,a:'center'});
  // beaker: inner 255..405, bottom 388, 0.9 px per mL
  const L=255,Rr=405,BOT=388,PX=0.9,Y=ml=>BOT-ml*PX;const liq=B.state==='empty'?0:100;
  if(liq){const top=Y(liq);ctx.fillStyle=PAL['cv-water'];ctx.fillRect(L,top,Rr-L,BOT-top);
    if(B.yeast>0){ctx.fillStyle='rgba(196,156,92,'+(0.22+0.22*Math.min(1,B.yeast))+')';ctx.fillRect(L,top,Rr-L,BOT-top);ctx.fillStyle='rgba(150,110,60,.55)';ctx.fillRect(L,BOT-8,Rr-L,8);}
    // foam
    const fh=Math.min(B.F*PX,top-Y(255));if(fh>1){if(!v.foam){const g=rng(5);v.foam=[];for(let i=0;i<160;i++)v.foam.push([g(),g(),2+g()*5]);}
      ctx.fillStyle='rgba(246,240,224,.95)';ctx.fillRect(L,top-fh,Rr-L,fh);ctx.strokeStyle='#cbbf9e';ctx.lineWidth=1;
      for(const f of v.foam){const fy=top-f[1]*fh;if(fy<top-fh+2)continue;ctx.beginPath();ctx.arc(L+4+f[0]*(Rr-L-8),fy,Math.min(f[2],fh/2),0,6.29);ctx.stroke();}}
    // bubbles rise from the yeast
    if(!v.bub)v.bub=[];if(vdt>0){let n=B.o2*vdt*6*(RM?.5:1);while(n>0){if(R()<n&&v.bub.length<140)v.bub.push({x:L+8+R()*(Rr-L-16),y:BOT-6-R()*10,r:1.5+R()*2.5,s:40+R()*50});n--;}
      v.bub.forEach(q=>{q.y-=q.s*vdt;q.x+=(R()-.5)*20*vdt;});v.bub=v.bub.filter(q=>q.y>top+2);}
    ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.2;v.bub.forEach(q=>{ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,6.29);ctx.stroke();});}
  else v.bub=[];
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(L-10,146);ctx.lineTo(L,154);ctx.lineTo(L,BOT+4);ctx.lineTo(Rr,BOT+4);ctx.lineTo(Rr,150);ctx.stroke();
  ctx.lineWidth=1.5;for(let ml=50;ml<=250;ml+=50){const y=Y(ml);ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(L+18,y);ctx.stroke();txt(ctx,String(ml),L-8,y+5,{s:Math.min(12*k,20),c:PAL['cv-soft'],a:'right'});}
  txt(ctx,'250 mL beaker',(L+Rr)/2,424,{s:Math.min(13*k,23),w:600,a:'center'});
  // thermometer probe and cable
  ctx.strokeStyle=PAL['cv-lamp'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(386,104);ctx.bezierCurveTo(400,40,520,40,548,92);ctx.stroke();
  ctx.fillStyle='#9aa3ab';ctx.fillRect(383,128,6,BOT-20-128);ctx.fillStyle='#3a3e45';rr(ctx,377,98,18,36,4);ctx.fill();
  // instruments
  lcdBox(ctx,548,48,230,130,'DIGITAL THERMOMETER',B.disp.toFixed(1)+' °C',k,46);
  const sw=B.state==='running'||B.state==='done'?Math.min(180,B.t):0;
  lcdBox(ctx,548,196,230,130,'STOPWATCH',mmss(sw),k,52);
  if(B.hold)pill(ctx,'Reading time: '+B.holdAt+' s',663,356,PAL['rj'],'#fff',Math.min(14*k,22));
  else if(B.state==='done')pill(ctx,'3:00 · trial done',663,356,PAL['s3'],'#fff',Math.min(14*k,22));
  else if(B.state==='running'&&p.pauseRead)txt(ctx,'Stops at '+B.stop+' s',663,362,{s:Math.min(13*k,22),c:PAL['cv-soft'],a:'center'});}
function drawHZ(sim,ctx,vdt,k,t){const b=sim.vlab.bench,p=sim.p,v=sim.vis,seed=sim.vlab.seed;benchBase(ctx);
  const CX=[120,265,410],W2=24,BOT=384,PX=3,Y=ml=>BOT-ml*PX,liq=hzLiquid(b),fs=Math.min(12*k,20);
  lcdBox(ctx,560,10,224,92,'TIME SINCE LIVER',mmss(b.liver?b.t:0),k,40);
  if(!v.foam){const g=rng(7);v.foam=[];for(let i=0;i<90;i++)v.foam.push([g(),g(),1.5+g()*3.5]);}
  CX.forEach((cx,j)=>{const ph=HZ.ph[j],x0=cx-W2,x1=cx+W2;
    if(liq>0){const top=Y(liq);ctx.fillStyle=PAL['cv-water'];ctx.fillRect(x0,top,x1-x0,BOT-top);
      if(b.buf){ctx.globalAlpha=.38;ctx.fillStyle=HZ.tint[ph];ctx.fillRect(x0,top,x1-x0,BOT-top);ctx.globalAlpha=1;}
      if(b.liver){ctx.fillStyle='rgba(122,40,30,.6)';ctx.fillRect(x0,BOT-PX*1.2,x1-x0,PX*1.2);}
      const lv=hzLevel(sim,j);if(lv>liq+0.2){const ft=Y(lv);ctx.fillStyle='rgba(243,234,210,.96)';ctx.fillRect(x0,ft,x1-x0,top-ft);ctx.strokeStyle='#c9b98f';ctx.lineWidth=1;
        for(const f of v.foam){const fy=top-f[1]*(top-ft);if(fy<ft+1.5)continue;ctx.beginPath();ctx.arc(x0+3+f[0]*(x1-x0-6),fy,Math.min(f[2],(top-ft)/2),0,6.29);ctx.stroke();}
        ctx.fillStyle='rgba(243,234,210,.96)';for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(x0+4+i*(x1-x0-8)/5,ft+1,3.2,Math.PI,0);ctx.fill();}}}
    // glass, base and scale
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x0-6,58);ctx.lineTo(x0,64);ctx.lineTo(x0,BOT+2);ctx.lineTo(x1,BOT+2);ctx.lineTo(x1,60);ctx.stroke();
    ctx.fillStyle=PAL['cv-glass'];rr(ctx,cx-44,BOT+2,88,8,3);ctx.fill();
    ctx.lineWidth=1;for(let ml=2;ml<=100;ml+=2){const y=Math.round(Y(ml))+.5,big=ml%10===0;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x1-(big?16:ml%10===5?10:6),y);ctx.stroke();
      if(big&&(k<1.35||ml%20===0))txt(ctx,String(ml),x0-6,y+4,{s:fs,c:PAL['cv-soft'],a:'right'});}
    txt(ctx,(j+1)+' · pH '+ph,cx,420,{s:Math.min(14*k,23),w:700,a:'center'});
    if(p.zoom===j+1){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;rr(ctx,x0-34,52,x1-x0+50,BOT-40,8);ctx.stroke();}});
  txt(ctx,'100 mL graduated cylinders',265,443,{s:Math.min(12*k,17),c:PAL['cv-soft'],a:'center'});
  if(p.zoom>0)drawLoupe(sim,ctx,k,p.zoom-1);
  else{// supplies
    const sx=520;ctx.fillStyle='#6b4a2b';rr(ctx,sx,276,50,118,8);ctx.fill();ctx.fillStyle='#f6f2ea';ctx.fillRect(sx+5,310,40,36);txt(ctx,'3%',sx+25,325,{s:12,w:700,c:'#2b2b2b',a:'center'});txt(ctx,'H₂O₂',sx+25,340,{s:12,w:700,c:'#2b2b2b',a:'center'});
    [10,7,4].forEach((ph,i)=>{const x=sx+64+i*48;ctx.fillStyle='#e9eef2';rr(ctx,x,312,38,82,6);ctx.fill();ctx.globalAlpha=.75;ctx.fillStyle=HZ.tint[ph];ctx.fillRect(x+3,340,32,51);ctx.globalAlpha=1;txt(ctx,'pH '+ph,x+19,332,{s:11,w:700,c:'#2b2b2b',a:'center'});});
    ctx.fillStyle='rgba(122,40,30,.85)';rr(ctx,sx+212,340,44,54,6);ctx.fill();txt(ctx,'liver',sx+234,334,{s:Math.min(12*k,15),c:PAL['cv-ink'],a:'center'});
    if(b.liver&&b.t>=120)pill(ctx,'2:00 · read the foam',672,150,PAL['rj'],'#fff',Math.min(14*k,22));}}
function drawLoupe(sim,ctx,k,j){const X=548,Yt=114,W=236,H=274;ctx.fillStyle=PAL['card'];rr(ctx,X,Yt,W,H,12);ctx.fill();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;rr(ctx,X,Yt,W,H,12);ctx.stroke();
  txt(ctx,'Magnified: cylinder '+(j+1)+' (pH '+HZ.ph[j]+')',X+W/2,Yt+24,{s:Math.min(13*k,16),w:700,a:'center'});
  const b=sim.vlab.bench,liq=hzLiquid(b),lv=liq>0?hzLevel(sim,j):0,c=Math.max(12,Math.round(lv/5)*5),PXm=12,top=Yt+40,bot=Yt+H-14,mid=(top+bot)/2,Ym=ml=>mid-(ml-c)*PXm;
  ctx.save();ctx.beginPath();ctx.rect(X+8,top,W-16,bot-top);ctx.clip();
  const gx0=X+70,gx1=X+W-30;
  if(liq>0){const yl=Ym(liq);ctx.fillStyle=PAL['cv-water'];ctx.fillRect(gx0,yl,gx1-gx0,bot-yl);if(b.buf){ctx.globalAlpha=.38;ctx.fillStyle=HZ.tint[HZ.ph[j]];ctx.fillRect(gx0,yl,gx1-gx0,bot-yl);ctx.globalAlpha=1;}
    if(lv>liq+0.2){const yf=Ym(lv);ctx.fillStyle='rgba(243,234,210,.97)';ctx.fillRect(gx0,yf,gx1-gx0,yl-yf);ctx.strokeStyle='#c9b98f';ctx.lineWidth=1;const v=sim.vis;
      for(const f of v.foam){const fy=yl-f[1]*(yl-yf);if(fy<yf+3)continue;ctx.beginPath();ctx.arc(gx0+5+f[0]*(gx1-gx0-10),fy,f[2]*2.2,0,6.29);ctx.stroke();}
      ctx.fillStyle='rgba(243,234,210,.97)';for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(gx0+8+i*(gx1-gx0-16)/6,yf+2,7,Math.PI,0);ctx.fill();}}}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(gx0,top);ctx.lineTo(gx0,bot);ctx.moveTo(gx1,top);ctx.lineTo(gx1,bot);ctx.stroke();
  ctx.strokeStyle=PAL['cv-ink'];for(let ml=Math.floor(c-16);ml<=c+16;ml++){if(ml<0||ml>100)continue;const y=Math.round(Ym(ml))+.5,big=ml%10===0,m5=ml%5===0;ctx.lineWidth=big?2:1;ctx.beginPath();ctx.moveTo(gx1,y);ctx.lineTo(gx1-(big?44:m5?30:16),y);ctx.stroke();
    if(m5)txt(ctx,String(ml),gx0-8,y+5,{s:Math.min((big?15:13)*k,19),w:big?700:400,c:PAL['cv-ink'],a:'right'});}
  ctx.restore();txt(ctx,'mL',X+16,Yt+56,{s:12,c:PAL['cv-soft']});}
/* --- the two labs, from the teachers' handouts --- */
const ROWS=[0,30,60,90,120,150,180],ROWL=['0 (initial, before adding the yeast)','30','60','90','120','150','180'];
const cpGate=sim=>cpB(sim);
function cpTrialSteps(k){const n=k+1,am=CP.al[k],set=sim=>{sim.vlab.bench.slot=k;};const rec=sim=>(sim.vlab.bench.trials||[])[k];
  return [
  {title:'Trial '+n+': add the H₂O₂',text:'<p>Add 100 mL of 1% hydrogen peroxide to the beaker.</p>',setup:set,
   done:sim=>{const B=cpGate(sim);return !B||B.state!=='empty'||!!(rec(sim)&&rec(sim).done);},doneHint:'Press <b>Add 100 mL of 1% H₂O₂</b>.'},
  {title:'Trial '+n+': initial temperature',text:'<p>Record the initial temperature of the hydrogen peroxide solution. Wait until the thermometer reading stops changing, then type it in the <b>0 s</b> row of the Trial '+n+' table below the bench.</p>',setup:set,
   done:sim=>sim.vlab.raw('c:t'+n+':T:0').trim()!=='',doneHint:'Type the starting temperature in the 0 s row of the Trial '+n+' table.'},
  {title:'Trial '+n+': add '+am+' of yeast',text:'<p>Set the spoon to <b>'+am+'</b>. Press <b>Add yeast and start timing</b>: this adds the yeast, stirs gently and starts the stopwatch.</p><p>Record the temperature every 30 seconds for 3 minutes in the Trial '+n+' table. Each time the stopwatch stops, type the reading, then press <b>Play</b>.</p>',setup:set,
   done:sim=>{const r=rec(sim);return !!(r&&r.done&&r.amt===CP.amt[k]);},
   doneHint:sim=>{const r=rec(sim),B=cpGate(sim);if(r&&r.done&&r.amt!==CP.amt[k])return 'Trial '+n+' uses '+am+' of yeast, but you added '+amtLabel(r.amt)+'. Empty, rinse and dry the beaker, add fresh H₂O₂ and run this trial again.';
     if(!B)return '';if(B.state==='empty')return 'Add 100 mL of 1% H₂O₂ to the beaker first.';if(B.state==='peroxide')return 'Set the spoon to '+am+', then press <b>Add yeast and start timing</b>.';
     if(B.state==='running')return B.hold?'Type the '+B.holdAt+' s reading, then press <b>Play</b>.':'Keep reading the thermometer every 30 s until the stopwatch reaches 3:00.';return 'Run this trial to 3:00.';}},
  {title:'Trial '+n+': observations',text:'<p>Record your observations about bubbling, foam formation and anything else you noticed in Trial '+n+'. Use the Observations boxes under the tables.</p>',setup:set},
  {title:'Trial '+n+': clean the beaker',text:k<2?'<p>Empty the beaker, rinse it with room-temperature water and dry it with paper towels before the next trial.</p><p><b>Important:</b> allow the beaker to return to room temperature between trials.</p>':'<p>Empty the beaker, rinse it with room-temperature water and dry it with paper towels.</p>',setup:set,
   done:sim=>{const B=cpGate(sim);return !B||B.state==='empty';},doneHint:'Press <b>Empty, rinse and dry the beaker</b>.'}];}
const LAB_CP={id:'catalase-cp',title:'Catalase Activity Lab: Temperature Change Analysis',course:'Biology',teachers:'Hill, Baldasare, Lilyestrom',
  source:{label:'Catalase Activity Lab.docx',href:'https://rjhs.instructure.com/courses/16562/assignments/599822'},level:'bio',
  purpose:'<p>Investigate how different amounts of yeast (enzyme concentration) affect the rate of the catalase reaction by measuring temperature changes over time.</p>',
  background:'<p>Yeast cells contain the enzyme catalase, which catalyzes the breakdown of hydrogen peroxide (H₂O₂) into water and oxygen gas:</p><p><b>2H₂O₂ → 2H₂O + O₂ + heat</b></p><p>This reaction is exothermic, meaning it releases energy in the form of heat. In this experiment, you will investigate how different amounts of yeast (enzyme concentration) affect the rate of this reaction by measuring temperature changes over time.</p>'+
    '<p><b>About the virtual bench.</b> The bench runs a model of the real reaction. 100 mL of 1% H₂O₂ holds 1.0 g (0.029 mol) of H₂O₂. If all of it broke down, it would release about 2.9 kJ, enough to warm 100 mL of water by at most 6.9 °C with no heat loss. On the bench, the beaker glass soaks up some of the heat, some escapes to the room and with the O₂ foam, and the yeast does not break down all of the H₂O₂ in 3 minutes, so your rise will be smaller than that. The thermometer reads to 0.1 °C with a little random error, and each spoonful of yeast is a little different, as in a real lab. At 1× speed, the stopwatch runs 6 times faster than real time.</p>',
  materials:['Active dry yeast','1% hydrogen peroxide solution','Digital thermometer','250 mL beaker','Measuring spoons (tablespoon)','Graduated cylinder','Vernier Graphical Analysis software (on the virtual bench, your graph draws in the notebook)','Paper towels'],
  hypothesis:{prompt:'<p>Write your hypothesis about how different amounts of yeast (catalase) will affect the temperature change.</p>'},
  setup(sim){BioLab.refresh(sim);},
  controls:['spoon','pauseRead','cp-h2o2','cp-yeast','cp-rinse'],
  steps:[{title:'Get set up',text:'<p>You will run three separate trials using the same beaker:</p><ul><li>Trial 1: 0.25 tbsp yeast</li><li>Trial 2: 0.5 tbsp yeast</li><li>Trial 3: 1.0 tbsp yeast</li></ul><p>Leave <b>Pause at each reading</b> on, so the stopwatch stops at every 30 s mark and you can read the thermometer. At 1× speed the stopwatch runs 6 times faster than real time. Use Speed to change that.</p>',setup(sim){sim.vlab.bench.slot=-1;}}]
    .concat(cpTrialSteps(0),cpTrialSteps(1),cpTrialSteps(2),[{title:'Analyze your data',text:'<p>All three trials are done. Below the bench, work out ΔT for each trial, check your graph of temperature against time, and answer the questions. Finish with your conclusion, then turn in your lab.</p>',setup(sim){sim.vlab.bench.slot=-1;}}]),
  tables:[0,1,2].map(k=>({id:'t'+(k+1),title:'Trial '+(k+1)+': '+CP.al[k]+' yeast',cols:[{id:'t',label:'Time (s)',rows:ROWS,rowLabels:ROWL},{id:'T',label:'Temperature (°C)',input:'number',dp:1,check:cpCheck(k)}]})),
  observations:[].concat(...[0,1,2].map(k=>[{id:'o'+(k+1)+'b',label:'Trial '+(k+1)+' ('+CP.al[k]+'): bubbling intensity'},{id:'o'+(k+1)+'f',label:'Trial '+(k+1)+' ('+CP.al[k]+'): foam formation'},{id:'o'+(k+1)+'x',label:'Trial '+(k+1)+' ('+CP.al[k]+'): other observations'}])),
  calcs:[0,1,2].map(k=>({id:'dT'+(k+1),label:'Trial '+(k+1)+' ('+CP.al[k]+'): ΔT = T<sub>max</sub> − T<sub>initial</sub>',unit:'°C',input:'number',check:cpCalcCheck(k)})),
  graph:{type:'line',title:'Temperature vs time for three amounts of yeast',xl:'Time (s)',yl:'Temperature (°C)',xmin:0,xmax:180,
    series:[{table:'t1',x:'t',y:'T',label:'Trial 1: 0.25 tbsp'},{table:'t2',x:'t',y:'T',label:'Trial 2: 0.5 tbsp'},{table:'t3',x:'t',y:'T',label:'Trial 3: 1.0 tbsp'}]},
  questions:[
    {id:'da3',n:'DA 3',q:'<p>Data analysis: which amount of yeast produced the fastest temperature increase? Which was the slowest?</p>'},
    {id:'q1',n:'1',q:'<p>How does the amount of yeast (enzyme concentration) affect the rate of the catalase reaction? Use your temperature data.</p>'},
    {id:'q2',n:'2',q:'<p>Why does temperature increase?</p>'},
    {id:'q3',n:'3',q:'<p>At the molecular level, why does more yeast lead to a faster reaction rate?</p>'},
    {id:'q4',n:'4',q:'<p>Was your hypothesis supported by the data? Explain.</p>'},
    {id:'q5',n:'5',q:'<p>Sources of error: what factors might have affected the accuracy of your temperature measurements? Consider the sequential trial method.</p>'},
    {id:'q6',n:'6',q:'<p>Real-world application: how might enzyme concentration affecting reaction rate apply to biological processes in living organisms?</p>'}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion that answers the lab question: how does the amount of yeast (enzyme concentration) affect the rate of the catalase reaction?</p>',cer:true}};
const hzb=sim=>sim.vlab.bench;
const LAB_HZ={id:'catalase-honors',title:'Enzyme Lab: The Effects of pH on Catalase Activity',course:'Honors Biology',teachers:'Stearman, Powell, Lilyestrom',
  source:{label:'Enzyme Lab demo fill-in 20-21.docx',href:'https://rjhs.instructure.com/courses/14678/assignments/549721'},level:'honors',
  purpose:'<p>Observe catalase under basic, acidic and neutral pH. Record your results, make a bar graph of the reaction rate against pH, and answer the analysis questions.</p>',
  background:'<p>Catalase exists within liver cells (and some plant cells). It decomposes hydrogen peroxide (H₂O₂), a toxic by-product of cellular respiration, into oxygen gas and water:</p><p><b>2H₂O₂(l) → 2H₂O(l) + O₂(g)</b> (catalase)</p><p>Like all enzymes, catalase has a pH range in which it functions. Beyond that range it denatures, as the hydrogen bonds that maintain its shape break down. In this lab you observe catalase under basic, acidic and neutral pH, record your results, make a bar graph and answer the analysis questions.</p>'+
    '<p><b>About the virtual bench.</b> The bench runs a model of the real reaction. 5 mL of 3% H₂O₂ holds 0.15 g (4.4 mmol) of H₂O₂, which can release about 54 mL of O₂ gas. The liver homogenate traps much of that gas as foam, and a faster reaction builds more foam before the bubbles escape. The model sets the catalase activity in each cylinder from its pH, with a little random variation between cylinders and between students, as in a real lab. The top of a foam column is never perfectly flat, so read it to the nearest mL. At 1× speed, the stopwatch runs 6 times faster than real time.</p>',
  materials:['pH 4.0, 7.0 and 10.0 buffer solutions','Three 100 mL graduated cylinders','Syringes','3% hydrogen peroxide','Liver homogenate','Glass stirring rod','Forceps or scissors'],
  hypothesis:{prompt:'<p>Write your hypothesis: how will an acidic (pH 4), neutral (pH 7) and basic (pH 10) environment affect catalase activity? Give your reasoning.</p>'},
  setup(sim){BioLab.refresh(sim);},
  controls:['zoom','pauseRead','hz-h2o2','hz-buf','hz-liver','hz-clean'],
  steps:[
    {title:'Get set up',text:'<p>The bench has three 100 mL graduated cylinders, numbered 1 to 3, with syringes of 3% H₂O₂, the pH 10, 7 and 4 buffers, and liver homogenate.</p><p>Leave <b>Pause at each reading</b> on, so the stopwatch stops at 2:00 for your reading. At 1× speed the stopwatch runs 6 times faster than real time.</p>'},
    {title:'Add the H₂O₂',text:'<p>Use three graduated cylinders. Add 5 mL of H₂O₂ to each cylinder.</p>',done:sim=>!!hzb(sim).h2o2,doneHint:'Press <b>Add 5 mL of 3% H₂O₂ to each cylinder</b>.'},
    {title:'Add the buffers',text:'<p>Add 3 mL of pH 10 buffer to the first cylinder, 3 mL of pH 7 buffer to the second, and 3 mL of pH 4 buffer to the third.</p>',done:sim=>!!hzb(sim).buf,doneHint:'Press <b>Add 3 mL of buffer</b>.'},
    {title:'Add the liver',text:'<p>Add 1 mL of liver homogenate to each cylinder. The stopwatch starts when you add it.</p><p><b>Safety:</b> do not let the acid or base touch your skin or clothing.</p>',done:sim=>!!hzb(sim).liver,doneHint:'Press <b>Add 1 mL of liver homogenate to each</b>.'},
    {title:'Observe the reactions',text:'<p>Observe the reactions. Watch how fast the foam rises in each cylinder, and write what you see in the <b>Results</b> column of the data table.</p><p>Let the reactions run until the stopwatch reads 2:00.</p>',
     done:sim=>(hzb(sim).t||0)>=120,doneHint:sim=>!hzb(sim).liver?'Add the liver homogenate first.':'Let the reactions run until the stopwatch reads 2:00. Press <b>Play</b> if the stopwatch is paused.'},
    {title:'Read the foam',text:'<p>Read the top of the foam in each cylinder on its scale, to the nearest mL, and record it in the <b>Volume</b> column. Choose a cylinder under <b>Magnify</b> to read its scale up close.</p>'},
    {title:'Rate each reaction',text:'<p>Approximate the reaction rate for all 3 cylinders on the 0 to 5 scale in the <b>Rate</b> column. 0 means no reaction and 5 means very fast.</p>'},
    {title:'Answer question 1',text:'<p>Answer question 1 below the bench: name the enzyme, the substrate and the products in this lab.</p>'},
    {title:'Graph',text:'<p>Construct a graph of the rate of reaction against pH. Your bar graph draws below from your Rate column. Check that it has a title and labeled axes.</p>'},
    {title:'Disposal',text:'<p>Press <b>Empty and rinse the cylinders</b>. In the real lab, follow your teacher’s directions to dispose of the liver homogenate and the buffers.</p>'}],
  tables:[{id:'t1',title:'The effect of pH on catalase activity',cols:[{id:'ph',label:'pH',rows:['4.0','7.0','10.0']},{id:'res',label:'Results (what you observed)',input:'text'},
    {id:'vol',label:'Volume: top of the foam (mL)',input:'number',dp:0,check:hzVolCheck},
    {id:'rate',label:'Rate (0 to 5)',input:'select',options:[{v:'0',l:'0: no reaction'},{v:'1',l:'1: very slow'},{v:'2',l:'2: slow'},{v:'3',l:'3: moderate'},{v:'4',l:'4: fast'},{v:'5',l:'5: very fast'}],check:hzRateCheck}]}],
  questions:[
    {id:'q1',n:'1',q:'<p>Fill in the name of the substance(s) from this lab that match(es) each role.</p>',fields:[{id:'enz',label:'Enzyme'},{id:'sub',label:'Substrate'},{id:'prod',label:'Products'}]},
    {id:'q2',n:'2',q:'<p>How do enzymes speed up reactions?</p>'},
    {id:'q3',n:'3',q:'<p>Of those tested what is the optimal pH for catalase function?</p>'},
    {id:'q4',n:'4',q:'<p>What specifically do high and low pH levels physically do to enzymes? (Use your notes to find this answer.)</p>'}],
  graph:{type:'bar',title:'Rate of catalase reaction vs pH',xl:'pH',yl:'Reaction rate (0 to 5)',ymin:0,ymax:5,series:[{table:'t1',x:'ph',y:'rate',label:'Rate'}]},
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion: how does pH affect catalase activity? Use your foam volumes and rates as evidence.</p>',cer:true}};

const ENZYME={
  id:'enz',apUnit:3,order:3,kind:'Simulation',card:'Temperature, pH, substrate and inhibitors. Find the optimum, then break the enzyme.',hash:'enzymes',tab:'Enzyme activity',
  title:'Enzyme activity: temperature, pH and inhibitors',
  lede:{bio:'Enzymes speed up reactions when substrate fits their active site. Change the temperature, pH and amount of substrate, and watch the reaction rate.',
        honors:'Compare enzymes from different environments, and see how heat, pH and a competitive inhibitor change the active site and the reaction rate.',
        ap:'Michaelis–Menten kinetics. Read Vmax and Km under any conditions, and tell competitive from noncompetitive inhibition from your own rate data.'},
  timeScale:0.1,dtMax:0.005,prewarm:3,sampleDt:0.01,window:3,unit:'min',chChange:0.4,chReveal:1.3,
  controls:[
    {id:'enzyme',label:'Enzyme',type:'seg',def:'amylase',lvl:'honors',options:[{v:'amylase',l:'Amylase'},{v:'pepsin',l:'Pepsin'},{v:'taq',l:'Taq'}],
     help:'Amylase: saliva. Pepsin: stomach. Taq: hot-spring bacteria.'},
    {id:'temp',label:'Temperature',type:'range',min:0,max:100,step:1,def:37,unit:' °C',lvl:'bio'},
    {id:'ph',label:'pH',type:'range',min:1,max:12,step:0.5,def:7,unit:'',lvl:'bio'},
    {id:'sub',label:'Substrate concentration',type:'range',min:0,max:50,step:1,def:10,unit:' mM',lvl:'bio'},
    {id:'inhC',label:'Competitive inhibitor',type:'range',min:0,max:10,step:0.5,def:0,unit:' mM',lvl:'honors',help:'Competes for the active site'},
    {id:'inhN',label:'Noncompetitive inhibitor',type:'range',min:0,max:10,step:0.5,def:0,unit:' mM',lvl:'ap',help:'Binds elsewhere and changes the enzyme’s shape'},
    // virtual lab bench only (hidden in the other views)
    {id:'spoon',label:'Measuring spoon',type:'seg',def:0.25,vlab:true,noTrial:true,options:[{v:0.25,l:'0.25 tbsp'},{v:0.5,l:'0.5 tbsp'},{v:1,l:'1.0 tbsp'}]},
    {id:'zoom',label:'Magnify',type:'seg',def:0,vlab:true,noTrial:true,options:[{v:0,l:'Off'},{v:1,l:'Cylinder 1'},{v:2,l:'Cylinder 2'},{v:3,l:'Cylinder 3'}]},
    {id:'pauseRead',label:'Pause at each reading',type:'toggle',def:true,vlab:true,noTrial:true,help:'The stopwatch stops at each reading time in the procedure.'}
  ],
  actions:[
    {id:'cp-h2o2',label:'Add 100 mL of 1% H₂O₂',vlab:true,enabled:s=>{const B=cpB(s);return !!B&&B.state==='empty';},
     run(s){const B=cpB(s);if(!B||B.state!=='empty')return;B.T=(CP.Csol*B.stock+CP.Cgl*B.glass)/(CP.Csol+CP.Cgl);B.state='peroxide';B.P=1;B.F=0;B.yeast=0;B.tr=0;B.pre=[];B.dsec=-1;BioLab.play(s);}},
    {id:'cp-yeast',label:'Add yeast and start timing',primary:true,vlab:true,enabled:s=>{const B=cpB(s);return !!B&&B.state==='peroxide'&&s.vlab.bench.slot>=0;},
     run(s){const B=cpB(s),b=s.vlab&&s.vlab.bench;if(!B||B.state!=='peroxide'||!(b.slot>=0))return;b.att=(b.att||0)+1;
       const rec={amt:s.p.spoon,att:b.att,disp:[B.disp],pre:B.pre.slice(),done:false};b.trials[b.slot]=rec;B.rec=rec;B.yeast=s.p.spoon;
       B.k=CP.kc*s.p.spoon*B.act*Math.exp(0.08*hn(s.vlab.seed,50+b.slot,b.att));B.tr=0;B.t=0;B.lastS=0;B.stop=30;B.hold=false;B.state='running';BioLab.play(s);}},
    {id:'cp-rinse',label:'Empty, rinse and dry the beaker',vlab:true,enabled:s=>{const B=cpB(s);return !!B&&B.state!=='empty';},
     run(s){const B=cpB(s);if(!B||B.state==='empty')return;B.state='empty';B.glass=B.room+0.3*(B.T-B.room);B.T=B.glass;B.P=1;B.yeast=0;B.F=0;B.o2=0;B.hold=false;BioLab.play(s);}},
    {id:'hz-h2o2',label:'Add 5 mL of 3% H₂O₂ to each cylinder',vlab:true,enabled:s=>!!hzB(s)&&!s.vlab.bench.h2o2,run(s){if(!hzB(s))return;s.vlab.bench.h2o2=true;BioLab.play(s);}},
    {id:'hz-buf',label:'Add 3 mL of buffer (pH 10, 7, 4)',vlab:true,enabled:s=>!!hzB(s)&&!!s.vlab.bench.h2o2&&!s.vlab.bench.buf,run(s){const b=hzB(s)&&s.vlab.bench;if(!b||!b.h2o2)return;b.buf=true;BioLab.play(s);}},
    {id:'hz-liver',label:'Add 1 mL of liver homogenate to each',primary:true,vlab:true,enabled:s=>!!hzB(s)&&!!s.vlab.bench.buf&&!s.vlab.bench.liver,
     run(s){const B=hzB(s),b=B&&s.vlab.bench;if(!b||!b.buf||b.liver)return;b.liver=true;b.t=0;B.stopped=false;B.hold=false;BioLab.play(s);}},
    {id:'hz-clean',label:'Empty and rinse the cylinders',vlab:true,enabled:s=>!!hzB(s)&&!!s.vlab.bench.h2o2,
     run(s){const B=hzB(s),b=B&&s.vlab.bench;if(!b)return;if(b.liver&&b.t>=110)b.last={att:b.att||0,t:b.t};b.h2o2=b.buf=b.liver=false;b.t=0;b.att=(b.att||0)+1;B.stopped=false;B.hold=false;BioLab.play(s);}}
  ],
  labs:[LAB_CP,LAB_HZ],
  /* what the bench instruments show right now (used by the virtual-lab tests) */
  benchRead(sim){const B=sim.st.B;if(!B)return null;if(B.kind==='cp')return {thermometer:B.disp,stopwatch:Math.min(180,B.t),state:B.state,hold:B.hold};
    return {levels:[0,1,2].map(j=>Math.round(hzLevel(sim,j)*10)/10),stopwatch:sim.vlab.bench.t||0,hold:B.hold};},
  init(sim){const s={D:0,ff:1,fk:1,fph:1,intact:1,vmax:0,km:KM,v:0,prod:0};if(sim&&sim.vlab)s.B=sim.vlab.lab.id==='catalase-cp'?cpInit(sim):hzInit(sim);return s;},
  step(sim,dt){if(sim.st.B){if(sim.t<-1e-9)return;if(sim.st.B.kind==='cp')cpStep(sim,dt*60);else hzStep(sim,dt*60);return;}
    const p=sim.p,s=sim.st,e=ENZ[p.enzyme],T=p.temp;
    s.D+=(1-s.D)*Math.min(1,0.4*Math.exp((T-e.Tirr)/3)*dt);      // permanent heat damage
    s.ff=1/(1+Math.exp((T-e.Tm)/e.w));                           // reversible unfolding
    s.fk=Math.pow(2,(T-e.Tref)/10);                              // molecules move faster when warm (Q10 = 2)
    s.fph=Math.exp(-Math.pow((p.ph-e.pH)/1.6,2));
    s.intact=s.ff*(1-s.D);
    s.vmax=VMAX*s.fk*s.intact*s.fph/(1+p.inhN/KI);
    s.km=KM*(1+p.inhC/KI);
    s.v=s.vmax*p.sub/(s.km+p.sub); s.prod+=s.v*dt;},
  afterPrewarm(sim){sim.st.prod=0;},
  metrics:[
    {id:'rate',label:'Reaction rate',unit:'µmol/min',lvl:'bio',min:0,max:110,d:1,get:s=>s.st.v},
    {id:'prod',label:'Product made',unit:'µmol',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.prod},
    {id:'intact',label:'Enzymes with working shape',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.intact*100},
    {id:'occ',label:'Active sites filled',unit:'%',lvl:'honors',min:0,max:100,d:0,get:s=>100*s.p.sub/(s.st.km+s.p.sub)},
    {id:'vmax',label:'Vmax now',unit:'µmol/min',lvl:'ap',min:0,max:110,d:1,get:s=>s.st.vmax},
    {id:'km',label:'Km (apparent)',unit:'mM',lvl:'ap',min:0,max:40,d:1,get:s=>s.st.km}
  ],
  defaultGraph:'rate',
  challenges:[
    {lvl:'bio',q:'You heat amylase from 37 °C to 70 °C. What happens to the reaction rate?',
     choices:['It rises, because molecules move faster when hot','It drops to almost zero','It stays the same'],correct:1,
     baseline:{enzyme:'amylase'},change:{temp:70},changeText:'Temperature raised to 70 °C',watch:'rate',
     explain:{bio:'Heat makes molecules move faster, but too much heat shakes the enzyme out of shape. The active site no longer fits the substrate, so the reaction nearly stops. This is called denaturation.'}},
    {lvl:'bio',q:'Amylase works in your mouth (about pH 7). What happens at pH 2, the acidity of the stomach?',
     choices:['The rate rises','The rate drops sharply','No change'],correct:1,
     baseline:{enzyme:'amylase'},change:{ph:2},changeText:'pH lowered to 2',watch:'rate',
     explain:{bio:'Each enzyme has an ideal pH. Strong acid changes the charges in amylase’s active site so substrate no longer binds well. That is why starch digestion by saliva stops in the stomach.'}},
    {lvl:'honors',q:'This amylase was heated to 70 °C. If you cool it back down to 37 °C, what happens to the rate?',
     choices:['It returns to normal','It stays near zero','It rises above normal'],correct:1,
     baseline:{enzyme:'amylase',temp:70},change:{temp:37},changeText:'Cooled back to 37 °C',watch:'rate',
     explain:{honors:'High heat breaks the bonds that hold the enzyme’s shape, and the protein does not refold correctly. Cooling slows a working enzyme but does not damage it; overheating damages it permanently. Press Reset to start with fresh enzyme.'}},
    {lvl:'honors',q:'A competitive inhibitor is slowing the reaction. What happens if you flood the solution with substrate?',
     choices:['The rate rises a lot, because substrate outcompetes the inhibitor','Nothing changes; the inhibitor is stuck in the active site','The rate drops further'],correct:0,
     baseline:{enzyme:'amylase',inhC:5,sub:5},change:{sub:50},changeText:'Substrate raised from 5 to 50 mM',watch:'rate',
     explain:{honors:'A competitive inhibitor and the substrate take turns in the same active site. With far more substrate around, substrate wins most of the time and the rate climbs back up.',
              ap:'Competitive inhibition raises the apparent Km but leaves Vmax unchanged, so enough substrate overcomes it. Check the Km readout: 17.5 mM with the inhibitor vs. 5 mM without.'}},
    {lvl:'ap',q:'A noncompetitive inhibitor binds away from the active site. With much more substrate, can the rate reach the uninhibited maximum?',
     choices:['Yes, extra substrate outcompetes it','No, the rate rises a little but the maximum stays lower'],correct:1,
     baseline:{enzyme:'amylase',inhN:3,sub:5},change:{sub:50},changeText:'Substrate raised from 5 to 50 mM',watch:'rate',
     explain:{ap:'The inhibitor removes working enzyme no matter how much substrate is present, so Vmax drops (here to 40% of normal) while Km is unchanged. Adding substrate only moves you up a lower curve. Record trials at several [S] to see both curves.'}},
    {lvl:'ap',q:'Pepsin works in the stomach. You move it from pH 7 to pH 2. What happens?',
     choices:['The rate rises sharply','The rate drops','No change'],correct:0,
     baseline:{enzyme:'pepsin',ph:7},change:{ph:2},changeText:'pH lowered to 2',watch:'rate',
     explain:{ap:'An enzyme’s optimum matches its environment. Pepsin’s active site carries the right charges only at low pH, so it is nearly inactive at pH 7 and fully active at pH 2. That is the opposite of amylase.'}}
  ],
  initVis(sim){const r=rng(11),v=sim.vis;v.r1=[],v.r2=[],v.r3=[],v.ori=[],v.busy=[];
    for(let i=0;i<8;i++){v.r1.push((i+.5)/8);v.r2.push(r());v.r3.push(r());v.ori.push(r()*6.28);v.busy.push(0);}
    v.r1.sort(()=>r()-.5);v.subs=[];v.inC=[];v.inN=[];v.prods=[];v.ev=0;},
  draw(sim,ctx,vdt,k,t){
    if(sim.st.B&&sim.vlab){(sim.st.B.kind==='cp'?drawCP:drawHZ)(sim,ctx,vdt,k,t);return;}
    const s=sim.st,p=sim.p,v=sim.vis,R=Math.random,hon=atLeast('honors'),ap=atLeast('ap');
    ctx.fillStyle=PAL['cv-sol'];ctx.fillRect(0,0,800,450);
    if(p.temp>45){ctx.fillStyle='rgba(230,60,40,'+clamp((p.temp-45)/260,0,.2)+')';ctx.fillRect(0,0,800,450);}
    if(p.temp<15){ctx.fillStyle='rgba(60,130,230,'+clamp((15-p.temp)/90,0,.16)+')';ctx.fillRect(0,0,800,450);}
    const e=ENZ[p.enzyme];
    txt(ctx,(hon?e.name:'Amylase')+'  ·  '+p.temp+' °C  ·  pH '+p.ph.toFixed(1)+'  ·  substrate '+p.sub+' mM',16,28,{s:14*k,w:700});
    // particle populations follow concentrations
    const speed=Math.sqrt((p.temp+273)/310)*(RM?.5:1);
    const sync=(arr,n)=>{while(arr.length<n)arr.push({x:20+R()*760,y:50+R()*370,vx:0,vy:0});if(arr.length>n)arr.length=n;};
    sync(v.subs,Math.round(clamp(p.sub*1.3,0,65)));sync(v.inC,hon?Math.round(p.inhC*2.4):0);sync(v.inN,ap?Math.round(p.inhN*2.4):0);
    const move=(a,m)=>{a.vx+=(R()-.5)*600*vdt*m;a.vy+=(R()-.5)*600*vdt*m;const sp=Math.hypot(a.vx,a.vy),mx=55*m;if(sp>mx){a.vx*=mx/sp;a.vy*=mx/sp;}
      a.x+=a.vx*vdt;a.y+=a.vy*vdt;if(a.x<8||a.x>792)a.vx*=-1;if(a.y<44||a.y>442)a.vy*=-1;a.x=clamp(a.x,8,792);a.y=clamp(a.y,44,442);};
    // which enzymes are unfolded / inhibited right now
    const denFrac=1-s.intact,compFrac=(p.inhC/KI)/(1+p.inhC/KI+p.sub/KM),nonFrac=p.inhN/(KI+p.inhN);
    const st=ENZPOS.map((q,i)=>{const den=v.r1[i]<denFrac;return {den,comp:!den&&hon&&v.r2[i]<compFrac,non:!den&&ap&&v.r3[i]<nonFrac};});
    // reaction events in proportion to the modeled rate
    v.ev+=s.v*vdt*sim.def.timeScale*0.5;
    while(v.ev>=1){v.ev--;const free=st.map((q,i)=>i).filter(i=>!st[i].den&&!st[i].comp&&v.busy[i]<=0);if(!free.length){v.ev=Math.min(v.ev,2);break;}v.busy[free[Math.floor(R()*free.length)]]=0.35;}
    ENZPOS.forEach((q,i)=>{const [cx,cy]=q,o=v.ori[i]+Math.sin(t*.4+i)*0.15,c=st[i],Rr=34;
      if(c.den){ctx.strokeStyle=PAL['cv-enzd'];ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();
        for(let j=0;j<=28;j++){const x=cx-40+j*2.9,y=cy+Math.sin(j*0.8+i+t*.6)*9;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();return;}
      let a=0.40*s.fph+0.07;if(c.non)a*=0.45;
      ctx.fillStyle=PAL['cv-enz'];ctx.beginPath();ctx.moveTo(cx+Math.cos(o)*Rr*0.25,cy+Math.sin(o)*Rr*0.25);ctx.arc(cx,cy,Rr,o+a,o+6.283-a);ctx.closePath();ctx.fill();
      const sx=cx+Math.cos(o)*Rr*0.72,sy=cy+Math.sin(o)*Rr*0.72;
      if(c.comp){ctx.fillStyle=PAL['cv-inc'];ctx.beginPath();ctx.moveTo(sx+Math.cos(o)*9,sy+Math.sin(o)*9);ctx.lineTo(sx+Math.cos(o+2.2)*8,sy+Math.sin(o+2.2)*8);ctx.lineTo(sx+Math.cos(o-2.2)*8,sy+Math.sin(o-2.2)*8);ctx.closePath();ctx.fill();}
      if(c.non){const nx=cx-Math.cos(o)*Rr,ny=cy-Math.sin(o)*Rr;ctx.fillStyle=PAL['cv-inn'];ctx.beginPath();ctx.moveTo(nx,ny-9);ctx.lineTo(nx+8,ny);ctx.lineTo(nx,ny+9);ctx.lineTo(nx-8,ny);ctx.closePath();ctx.fill();}
      if(v.busy[i]>0){v.busy[i]-=vdt;ctx.fillStyle=PAL['cv-sub'];ctx.beginPath();ctx.arc(sx,sy,7,0,6.29);ctx.fill();
        if(v.busy[i]<=0){for(let m=0;m<2;m++)v.prods.push({x:sx,y:sy,vx:Math.cos(o+(m?.6:-.6))*60,vy:Math.sin(o+(m?.6:-.6))*60,life:5});}}
    });
    for(const a of v.subs){move(a,speed);ctx.fillStyle=PAL['cv-sub'];ctx.beginPath();ctx.arc(a.x,a.y,5.5,0,6.29);ctx.fill();}
    for(const a of v.inC){move(a,speed);ctx.fillStyle=PAL['cv-inc'];ctx.beginPath();ctx.moveTo(a.x,a.y-7);ctx.lineTo(a.x+6.5,a.y+5);ctx.lineTo(a.x-6.5,a.y+5);ctx.closePath();ctx.fill();}
    for(const a of v.inN){move(a,speed);ctx.fillStyle=PAL['cv-inn'];ctx.beginPath();ctx.moveTo(a.x,a.y-7);ctx.lineTo(a.x+6,a.y);ctx.lineTo(a.x,a.y+7);ctx.lineTo(a.x-6,a.y);ctx.closePath();ctx.fill();}
    for(const a of v.prods){move(a,speed);a.life-=vdt;ctx.globalAlpha=clamp(a.life/2,0,1);ctx.fillStyle=PAL['cv-prod'];ctx.beginPath();ctx.arc(a.x,a.y,4.2,0,6.29);ctx.fill();}
    ctx.globalAlpha=1;v.prods=v.prods.filter(a=>a.life>0);if(v.prods.length>120)v.prods.splice(0,v.prods.length-120);
    // legend
    let lx=16;const ly=438,item=(draw,label)=>{draw(lx+5,ly-4);txt(ctx,label,lx+15,ly,{s:12*k,c:PAL['cv-soft']});ctx.font='400 '+12*k+'px '+FONT;lx+=ctx.measureText(label).width+34;};
    item((x,y)=>{ctx.fillStyle=PAL['cv-enz'];ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,7,.5,5.8);ctx.closePath();ctx.fill();},'enzyme');
    item((x,y)=>{ctx.fillStyle=PAL['cv-sub'];ctx.beginPath();ctx.arc(x,y,5,0,6.29);ctx.fill();},'substrate');
    item((x,y)=>{ctx.fillStyle=PAL['cv-prod'];ctx.beginPath();ctx.arc(x,y,4,0,6.29);ctx.fill();},'product');
    if(hon)item((x,y)=>{ctx.fillStyle=PAL['cv-inc'];ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+6,y+5);ctx.lineTo(x-6,y+5);ctx.closePath();ctx.fill();},'competitive inhibitor');
    if(ap)item((x,y)=>{ctx.fillStyle=PAL['cv-inn'];ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+5,y);ctx.lineTo(x,y+6);ctx.lineTo(x-5,y);ctx.closePath();ctx.fill();},'noncompetitive');
  }
};
Object.assign(ENZYME,{
  scale:'Molecular view: each enzyme is about 5 nanometers across. One drop of saliva holds trillions of amylase molecules.',
  narrate(sim){if(sim.st.B&&sim.vlab)return benchNarrate(sim);
    const p=sim.p,s=sim.st,e=ENZ[p.enzyme],hon=atLeast('honors'),nm=hon?e.name:'Amylase',occ=Math.round(100*p.sub/(s.km+p.sub));
    if(s.D>0.5)return '<b>Most of the enzyme is permanently damaged by heat (denatured).</b> Its shape is gone, so cooling it down won’t bring it back. Press Reset for fresh enzyme.';
    if(s.ff<0.5)return '<b>Too hot.</b> The enzymes are shaking out of shape and their active sites no longer fit the substrate.';
    if(s.fph<0.3)return '<b>The pH is far from '+nm+'’s favorite (about pH '+e.pH+').</b> Charges in the active site change, so the substrate doesn’t fit well.';
    if(p.sub<0.5)return 'No substrate in the tube, so there is nothing for the enzyme to work on.';
    if(p.temp<15&&p.enzyme!=='taq')return '<b>Cold.</b> Molecules move slowly, so substrate bumps into active sites less often. The enzymes are not damaged, just slow.';
    if(p.enzyme==='taq'&&p.temp<60)return 'Taq comes from bacteria in hot springs. At '+p.temp+' °C it works slowly. It runs best near 72 °C.';
    if(atLeast('ap')&&p.inhN>0)return 'Noncompetitive inhibitor (purple) binds away from the active site and changes the enzyme’s shape. Those enzymes stop working no matter how much substrate you add.';
    if(hon&&p.inhC>0)return 'Competitive inhibitor (red) is sitting in some active sites, blocking substrate. More substrate can outcompete it.';
    return occ+'% of active sites are busy, making product at '+s.v.toFixed(0)+' µmol/min.'+(occ>85?' Nearly every active site is full, so adding more substrate barely helps (saturation).':'');},
  tour:[
    {title:'Meet the enzyme',text:'Each green shape is one enzyme molecule. The notch is its <b>active site</b>, a pocket shaped to fit one kind of molecule.',focus:[76,106,92,92],speed:0.25},
    {title:'Substrate wanders in',text:'Blue dots are substrate molecules (starch, for amylase). They move randomly and bump into enzymes by chance.',focus:[0,40,800,375],speed:0.25},
    {title:'The reaction',text:'When substrate lands in the active site, the enzyme splits it into two products (orange) and lets them go. The enzyme is not used up. It grabs the next one.',focus:[60,80,500,140],speed:0.1},
    {title:'Too hot',text:'Now we heat the tube to 70 °C. Watch the enzymes unravel: the active site loses its shape, so substrate can’t bind. This is <b>denaturation</b>.',focus:[0,40,800,375],speed:1,setup(sim){BioLab.setValues(sim,{temp:70});}},
    {lvl:'honors',title:'Competitive inhibitor',text:'Back to fresh enzyme at 37 °C, with a competitive inhibitor added. The red triangles fit the active site and block it, but substrate can still win the spot if there is enough of it.',focus:[0,40,800,375],speed:0.5,setup(sim){BioLab.reset(sim);BioLab.setValues(sim,{temp:37,inhC:5});}},
    {lvl:'ap',title:'Noncompetitive inhibitor',text:'The purple diamonds bind the back of the enzyme and pinch the active site shut. Extra substrate can’t undo that, so Vmax drops while Km stays the same.',focus:[0,40,800,375],speed:0.5,setup(sim){BioLab.setValues(sim,{inhC:0,inhN:3});}}
  ],
  about:'<p><b>The molecular view.</b> The rate follows Michaelis–Menten kinetics, v = Vmax·[S]/(Km + [S]), with Km = 5 mM and Vmax = 100 µmol/min for fresh enzyme at its best temperature and pH. Warming raises the rate by a factor of 2 for every 10 °C (Q10 = 2) until the protein starts to unfold, which the model treats as a smooth, reversible switch near each enzyme’s melting point. Above a higher temperature, heat damage builds up over time and does not reverse. Activity falls off on either side of each enzyme’s optimum pH in a bell shape. A competitive inhibitor raises the apparent Km, and a noncompetitive inhibitor lowers Vmax. Real enzymes have more complicated temperature and pH curves.</p>'+
    '<p><b>The virtual lab benches.</b> The yeast bench treats the breakdown of H₂O₂ as first order, with a rate constant in proportion to the amount of yeast. The heat released (98.2 kJ per mol of H₂O₂) warms the solution and the beaker glass, which lose heat to the room by Newton cooling. The thermometer lags the solution by a few seconds and reads to 0.1 °C with small random error. The liver bench sets catalase activity from the buffer’s pH and grows each foam column toward a height set by that activity, since a fast reaction traps more O₂ as foam. Both benches add small random differences between trials and between students.</p>',
  onTourExit(sim){BioLab.setValues(sim,{temp:37,inhC:0,inhN:0});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How does temperature affect how fast amylase works?</p><ol><li>Record the reaction rate at 10, 20, 30, 37, 45, 55 and 65 °C.</li><li>Press Reset before each temperature above 50 °C so you start with fresh enzyme.</li><li>Plot temperature (x) against reaction rate (y).</li></ol><p>What is the optimum temperature? Explain why the rate drops on each side of it.</p>',
       honors:'<p><b>Question:</b> How does substrate concentration affect reaction rate, with and without a competitive inhibitor?</p><ol><li>Record rates at substrate 1, 2, 5, 10, 20 and 50 mM.</li><li>Repeat with 5 mM competitive inhibitor.</li><li>Plot both sets on the Trials graph.</li></ol><p>Describe how the two curves differ at low and high substrate.</p>',
       ap:'<p><b>Question:</b> How can you tell competitive from noncompetitive inhibition using rate data alone?</p><ol><li>Collect rate vs. [S] for no inhibitor, 5 mM competitive and 3 mM noncompetitive.</li><li>Estimate Vmax and Km for each from your curves, then check against the readouts.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the mechanism behind each change in Vmax or Km.</p>'},
  terms:[{t:'Enzyme',d:'A protein that speeds up a reaction without being used up.'},{t:'Active site',d:'The pocket on an enzyme where the substrate binds.'},{t:'Substrate',d:'The molecule an enzyme acts on.'},{t:'Denature',d:'To lose shape, and with it function. High heat or extreme pH can denature an enzyme.'},
    {lvl:'honors',t:'Optimum',d:'The temperature or pH where an enzyme works fastest.'},{lvl:'honors',t:'Competitive inhibitor',d:'A molecule that competes with substrate for the active site.'},{lvl:'honors',t:'Saturation',d:'When nearly all active sites are full, so more substrate barely raises the rate.'},
    {lvl:'ap',t:'Vmax',d:'The maximum rate when the enzyme is saturated.'},{lvl:'ap',t:'Km',d:'The substrate concentration that gives half of Vmax. A lower Km means a tighter fit.'},{lvl:'ap',t:'Noncompetitive (allosteric) inhibitor',d:'Binds elsewhere on the enzyme and changes its shape, which lowers Vmax.'}]
});
BioLab.register(ENZYME);
})();
