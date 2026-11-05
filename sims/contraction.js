(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
/* Muscle contraction and fatigue.
   Sarcomere scene: time is in milliseconds, slowed 10 times. Each nerve signal gives a twitch, x2(t) = J (t/tp) exp(-t/tp), and activation = 1 - exp(-x2).
   Twitches add before the saturation, which gives summation and tetanus. Force = activation x overlap(length), using the classic length-tension curve.
   Energy scene: a pool model in mmol ATP per kg of muscle per second, with ATP, creatine phosphate, aerobic and anaerobic supply and lactic acid. */
const FT={slow:{n:'Slow twitch',tp:.08,tca:.05,cyc:1.4,D:2,Ao:1.7,An:1.5,clr:.006,Mb:12},fast:{n:'Fast twitch',tp:.03,tca:.02,cyc:.65,D:5,Ao:.6,An:5,clr:.004,Mb:1}};
const LT=[[1.27,0],[1.67,.84],[2,1],[2.25,1],[3.65,0]];
function overlap(L){if(L<=LT[0][0]||L>=LT[4][0])return 0;for(let i=0;i<4;i++)if(L<=LT[i+1][0])return lerp(LT[i][1],LT[i+1][1],(L-LT[i][0])/(LT[i+1][0]-LT[i][0]));return 0;}
const J=.29*Math.E,DL=.2,SLOW=.1,ENERGY=3,BURN=12,ATP0=7,PCR0=25,G0=90;
const fib=sim=>FT[sim.p.fiber==='fast'?'fast':'slow'];
function newPool(k){return {ATP:ATP0,PCr:PCR0,Lac:0,G:G0,aer:.2,f:0,an:0,pc:0,Mb:FT[k].Mb};}
function poolStep(q,tgt,o2,c,dt){
  const cap=clamp(1-.7*Math.max(0,q.Lac-15)/25,.3,1),af=clamp((q.ATP-3)/2,0,1),f=Math.min(tgt,cap*af);q.f=f;const D=f*c.D;
  let Ao=c.Ao*(q.G>0?1:.6);if(!o2){Ao=q.Mb>0?c.Ao:0;}
  q.aer+=(Math.min(D,Ao)-q.aer)*dt/20;if(q.aer>D)q.aer=D;if(q.aer>Ao)q.aer=Ao;if(!o2)q.Mb=Math.max(0,q.Mb-q.aer*dt);
  let R=Math.max(0,D-q.aer);const use=Math.min(R,9,q.PCr/dt);q.PCr=Math.max(0,q.PCr-use*dt);R-=use;q.pc=use;
  const capAn=c.An*clamp(1-q.Lac/45,0,1)*(q.G>0?1:0),an=Math.min(R,capAn);q.an=an;q.Lac+=an/1.5*dt;R-=an;
  q.ATP=Math.max(3,q.ATP-R*dt);q.G=Math.max(0,q.G-(q.aer/38*.5+an/2)*dt);
  if(o2){const spare=Ao-q.aer;if(R<=1e-9&&spare>0&&use<=1e-9){q.PCr+=(PCR0-q.PCr)*dt/30;q.ATP+=(ATP0-q.ATP)*dt/5;q.Mb+=(c.Mb-q.Mb)*dt/20;}
    q.Lac=Math.max(0,q.Lac-c.clr*q.Lac*(2-f)*dt);}}
function fractions(sim){const f=sim.p.fiber;return f==='mixed'?{s:.5,f:.5}:f==='fast'?{s:0,f:1}:{s:1,f:0};}
function energyStep(sim,dt){const s=sim.st,p=sim.p,e=p.effort/100,F=fractions(sim);const ts=F.s>0?Math.min(1,e/(F.s+(F.f?0:0))):0,tf=F.f>0?clamp((e-F.s)/F.f,0,1):0;
  poolStep(s.ps,ts,p.o2,FT.slow,dt);poolStep(s.pf,tf,p.o2,FT.fast,dt);s.et+=dt;
  s.eF=F.s*s.ps.f+F.f*s.pf.f;s.eT=e;s.eLac=(F.s*s.ps.Lac+F.f*s.pf.Lac);s.eATP=F.s*s.ps.ATP+F.f*s.pf.ATP;s.ePCr=F.s*s.ps.PCr+F.f*s.pf.PCr;s.eG=F.s*s.ps.G+F.f*s.pf.G;
  s.eAer=F.s*s.ps.aer+F.f*s.pf.aer;s.eAn=F.s*s.ps.an+F.f*s.pf.an;s.ePc=F.s*s.ps.pc+F.f*s.pf.pc;
  if(e>0){if(s.tBurn===null&&s.eLac>=BURN)s.tBurn=s.et;if(s.tFat===null&&s.eF<.9*e-1e-4)s.tFat=s.et;}
  s.lastE=(s.lastE||0)+dt;if(s.lastE>=.5){s.lastE=0;s.eh.push([s.et,s.eF*100,s.eLac,s.eAer,s.eAn,s.ePc]);if(s.eh.length>1200)s.eh.shift();}}
function fireStim(s,c,caOn,atpOn){s.ticks.push(s.tm);s.ap=1;if(atpOn&&caOn){s.ca+=(1-s.ca)*.85;s.x1+=J;}else if(!atpOn&&caOn)s.ca+=(1-s.ca)*.85;}
function sarcStep(sim,dt){const s=sim.st,p=sim.p,c=fib(sim),h=dt*SLOW;s.tm+=h;
  const r=p.rate;if(r>0){s.nextS-=h;if(s.nextS<=0){s.nextS+=1/r;if(s.nextS<0)s.nextS=1/r;fireStim(s,c,p.caOn,p.atpOn);}}else s.nextS=0;
  if(p.atpOn){s.x1+=(-s.x1/c.tp)*h;s.x2+=((s.x1-s.x2)/c.tp)*h;s.ca+=(-s.ca/c.tca)*h;s.rig=false;}
  else if(!s.rig){s.rig=true;s.x1=0;}
  s.ap=Math.max(0,s.ap-dt/.35);const A=1-Math.exp(-s.x2);s.A=A;
  if(!s.rig){const ol=overlap(p.L0);s.L=p.L0-DL*A*ol;s.ovl=overlap(s.L);s.F=A*s.ovl;}else{s.ovl=overlap(s.L);s.F=A*s.ovl;}
  s.last=(s.last||0)+h;if(s.last>=.002){s.last=0;s.h.push([s.tm,s.F*100]);if(s.h.length>1600)s.h.shift();}
  while(s.ticks.length&&s.ticks[0]<s.tm-2)s.ticks.shift();
  const w=s.h.filter(q=>q[0]>s.tm-Math.max(.12,2/Math.max(r,1)));if(r>0&&w.length>4){const y=w.map(q=>q[1]);s.ripple=Math.max(...y)-Math.min(...y);}else s.ripple=0;s.Fpk=Math.max(s.Fpk,s.F);}
const stageKind=sim=>sim.mode==='vlab'&&sim.vlab&&sim.vlab.lab&&sim.vlab.lab.id==='muscle-fatigue'?'bench':sim.p.scene;

/* ---------- bench: the fatigue lab ---------- */
const CH={1:{n:'Clothespin pinch',rA:.5,rB:2.5,A:[150,70],B:[38,18]},2:{n:'Textbook lift',rA:.33,rB:1,A:[120,55],B:[30,14]}};
const TRIALS=['A1D','A1N','A2D','A2N','B1D','B1N','B2D','B2N'],TLABEL=['A1 dominant','A1 non-dominant','A2 dominant','A2 non-dominant','B1 dominant','B1 non-dominant','B2 dominant','B2 non-dominant'];
const trialKey=sim=>sim.p.fPart+sim.p.fCh+sim.p.fHand;
function trialParams(sim,key){const part=key[0],c=CH[+key[1]],idx=TRIALS.indexOf(key),g0=sim.vlab.rng(0),pf=.9+.28*g0(),g=sim.vlab.rng(10+idx),hand=key[2]==='N'?.84+.1*g():1,noise=.92+.16*g(),b=c[part],total=b[0]*pf*hand*noise,burn=b[1]*pf*hand*(.9+.2*g());return {total:Math.round(total*10)/10,burn:Math.round(burn*10)/10,r0:part==='A'?c.rA:c.rB,scale:part==='A'?5:1};}
const bench=sim=>sim.vlab.bench;
function curRun(sim){const b=bench(sim);if(!b.runs)b.runs={};return b.runs[trialKey(sim)]||null;}
function benchStep(sim,dt){const b=bench(sim);if(!b.cur)return;const key=b.cur.key,P=trialParams(sim,key),u=b.cur,h=dt*P.scale;u.t+=h;
  const late=u.t-P.total;const r=late<=0?P.r0:P.r0*Math.max(.3,1-late/(P.total*.25+8));u.r=r;u.ph=(u.ph+r*h)%1e6;u.reps=Math.floor(u.ph);
  sim.vis=sim.vis||{};const sp=sim.vis.sp||(sim.vis.sp=[]);if(sim.vis.spk!==key){sim.vis.spk=key;sp.length=0;}sim.vis.spT=(sim.vis.spT||0)+h;if(sim.vis.spT>P.total/60){sim.vis.spT=0;sp.push(r/P.r0);if(sp.length>120)sp.shift();}}
function benchStart(sim){const b=bench(sim),k=trialKey(sim);if(!b.runs)b.runs={};if(b.cur)return;delete b.runs[k];b.cur={key:k,t:0,ph:0,reps:0,r:0,lap:null};if(sim.vis)sim.vis.sp=[];BioLab.vlab.save(sim);}
function benchLap(sim){const b=bench(sim);if(b.cur&&b.cur.lap===null)b.cur.lap=Math.round(b.cur.t*10)/10;}
function benchStop(sim){const b=bench(sim);if(!b.cur)return;const u=b.cur;b.runs[u.key]={total:Math.round(u.t*10)/10,lap:u.lap,reps:u.reps};b.cur=null;BioLab.vlab.save(sim);}
function benchRedo(sim){const b=bench(sim);if(b.cur)b.cur=null;if(b.runs)delete b.runs[trialKey(sim)];BioLab.vlab.save(sim);}
const fmtW=t=>{const m=Math.floor(t/60),q=t-m*60;return String(m).padStart(2,'0')+':'+q.toFixed(1).padStart(4,'0');};
function drawPinch(ctx,x,y,c,k){/* a hand from the side, thumb and index on a clothespin. c = 0 open, 1 squeezed */
  const gap=lerp(34,10,c);ctx.lineCap='round';
  ctx.fillStyle='#d8b596';ctx.strokeStyle='#7a5a44';ctx.lineWidth=1.4;rr(ctx,x+74,y-44,110,88,26);ctx.fill();ctx.stroke();
  ctx.fillStyle='#c79a63';ctx.strokeStyle='#6d4f2c';ctx.lineWidth=1.3;
  ctx.save();ctx.translate(x-70,y);[-1,1].forEach(sd=>{ctx.save();const a=sd*Math.atan2(gap/2,90);ctx.rotate(a);rr(ctx,-30,-7,120,14,3);ctx.fill();ctx.stroke();ctx.restore();});ctx.fillStyle='#8f949b';ctx.beginPath();ctx.arc(0,0,10,0,6.3);ctx.fill();ctx.strokeStyle='#4c5057';ctx.stroke();ctx.restore();
  const fy=gap/2+12;ctx.strokeStyle='#7a5a44';ctx.lineWidth=22;ctx.beginPath();ctx.moveTo(x+88,y-30);ctx.quadraticCurveTo(x+50,y-fy-6,x+12,y-fy);ctx.stroke();ctx.beginPath();ctx.moveTo(x+88,y+26);ctx.quadraticCurveTo(x+50,y+fy+6,x+12,y+fy);ctx.stroke();
  ctx.strokeStyle='#d8b596';ctx.lineWidth=19;ctx.beginPath();ctx.moveTo(x+88,y-30);ctx.quadraticCurveTo(x+50,y-fy-6,x+12,y-fy);ctx.stroke();ctx.beginPath();ctx.moveTo(x+88,y+26);ctx.quadraticCurveTo(x+50,y+fy+6,x+12,y+fy);ctx.stroke();}
function drawLift(ctx,x,y,c,k){/* a person from the side, arm swinging a textbook from hip level to shoulder level */
  const a=lerp(.15,Math.PI/2,c),sx=x,sy=y-70,hand={x:sx+Math.sin(a)*115,y:sy+Math.cos(a)*115};ctx.lineCap='round';
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=20;ctx.beginPath();ctx.moveTo(x,y-74);ctx.lineTo(x,y+40);ctx.stroke();ctx.lineWidth=15;ctx.beginPath();ctx.moveTo(x,y+40);ctx.lineTo(x-10,y+120);ctx.moveTo(x,y+40);ctx.lineTo(x+10,y+120);ctx.stroke();
  ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.arc(x,y-112,23,0,6.3);ctx.fill();
  ctx.strokeStyle='#c8564c';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(hand.x,hand.y);ctx.stroke();
  ctx.save();ctx.translate(hand.x+6,hand.y);ctx.fillStyle='#2f6f9f';ctx.strokeStyle='#123a57';ctx.lineWidth=1.3;rr(ctx,-6,-20,42,40,3);ctx.fill();ctx.stroke();ctx.fillStyle='#e8e2d2';ctx.fillRect(-1,-16,5,32);ctx.restore();
  ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([4,5]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+24,sy);ctx.lineTo(x+170,sy);ctx.moveTo(x+24,sy+112);ctx.lineTo(x+170,sy+112);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'Shoulder level',x+174,sy+4,{s:12*k,c:PAL['cv-soft']});txt(ctx,'Hip level',x+174,sy+116,{s:12*k,c:PAL['cv-soft']});}
function drawBench(sim,ctx,vdt,k,t){const b=bench(sim),u=b.cur,key=u?u.key:trialKey(sim),done=(b.runs||{})[key],P=trialParams(sim,key),part=key[0],ch=CH[+key[1]];
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,444,800,56);ctx.fillStyle=PAL['line'];ctx.fillRect(0,444,800,2);
  txt(ctx,'Part '+part+': '+(part==='A'?'sustainable pace':'fastest pace'),16,12+14*k,{s:15*k,w:700});txt(ctx,ch.n+', '+(key[2]==='D'?'dominant':'non-dominant')+' hand',16,14+32*k,{s:13*k,c:PAL['cv-soft']});
  const running=!!u,ph=running?u.ph:0,late=running?u.t-P.total:0,amp=running?(late>0?Math.max(.45,1-late/(P.total*.4+8)):1):0,c=running?amp*(.5-.5*Math.cos(ph*6.2832)):0;
  if(key[1]==='1')drawPinch(ctx,190,270,c,k);else drawLift(ctx,120,300,c,k);
  /* what your partner says */
  let say=null;if(running){if(late>10)say='I’m done.';else if(late>0&&part==='A')say='I can’t keep this pace.';else if(u.t>=P.burn)say='It’s starting to burn.';}
  if(say){ctx.font='600 '+13.5*k+'px '+FONT;const w=ctx.measureText(say).width+22,x=key[1]==='1'?60:210,y=key[1]==='1'?150:130,h=20*k+10;rr(ctx,x,y,w,h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.6;ctx.stroke();txt(ctx,say,x+11,y+h/2,{s:13.5*k,w:600,b:'middle'});}
  /* stopwatch */
  const X=470,Y=96,W=314,rowH=25*k,H=112+2*rowH+8;rr(ctx,X,Y,W,H,20);ctx.fillStyle='#2b2d33';ctx.fill();ctx.strokeStyle='#121316';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#2b2d33';rr(ctx,X+W/2-20,Y-16,40,20,5);ctx.fill();
  rr(ctx,X+18,Y+16,W-36,88,8);ctx.fillStyle='#c7d5b6';ctx.fill();const tNow=running?u.t:(done?done.total:0),lap=running?u.lap:(done?done.lap:null);
  txt(ctx,fmtW(tNow),X+W/2,Y+54,{s:52,w:700,c:'#1b2615',a:'center',b:'middle'});
  const r1=Y+112+rowH-6,r2=r1+rowH;txt(ctx,'Burn mark',X+22,r1,{s:13*k,w:600,c:'#e9eaec'});txt(ctx,lap===null||lap===undefined?'none':fmtW(lap),X+W-22,r1,{s:16*k,w:700,c:'#ffd27a',a:'right'});
  txt(ctx,'Reps',X+22,r2,{s:13*k,w:600,c:'#e9eaec'});txt(ctx,String(running?u.reps:(done?done.reps:0)),X+W-22,r2,{s:16*k,w:700,c:'#fff',a:'right'});
  /* pace strip */
  const px=470,py=Y+H+8+13*k,pw=314,ph2=Math.max(36,438-py-8);txt(ctx,'Pace',px,py-3,{s:13*k,w:600});if(running){txt(ctx,Math.round(u.r*60)+' reps per min',px+pw,py-3,{s:13*k,c:PAL['cv-soft'],a:'right'});}
  rr(ctx,px,py+3,pw,ph2,6);ctx.fillStyle=PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();const sp=(sim.vis&&sim.vis.sp)||[];if(sp.length>1&&running){ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.4;ctx.beginPath();sp.forEach((q,i)=>{const x=px+4+(pw-8)*i/Math.max(60,sp.length-1),y=py+3+ph2-6-(ph2-12)*q;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
  txt(ctx,running?'Stopwatch running':done?'Trial finished. Read your times and record them.':'Press Start to begin this trial.',16,500-20,{s:13*k,w:600,c:PAL['cv-ink']});}
function benchNarrate(sim){const b=bench(sim),u=b.cur;if(u){const P=trialParams(sim,u.key);return u.key[0]==='A'?'Your partner works at a steady pace that could last. <b>Mark the burn</b> as soon as your partner reports it. <b>Stop</b> when your partner cannot keep the pace. The bench runs 5 times faster than real time, but the stopwatch reads true seconds.':'Your partner works as fast as possible. <b>Mark the burn</b> when your partner reports it. Watch the pace strip and <b>Stop</b> as soon as the pace starts to slow.';}
  const d=curRun(sim);return d?'This trial is finished. Read the stopwatch, type the total time and the burn mark in your table, then choose the next trial. <b>Your readings are your data.</b>':'Choose the challenge, part and hand under the bench, then press <b>Start</b>.';}

/* ---------- sarcomere drawing ---------- */
const STRIP=['Muscle','Fascicle','Muscle fiber','Myofibril','Sarcomere'];
function drawStrip(ctx,k){const w=800/5,y=4,H=30;STRIP.forEach((n,i)=>{const cx=w*(i+.5),on=i===4;
    ctx.fillStyle='#b4534a';ctx.strokeStyle='#3d1815';ctx.lineWidth=1;
    if(i===0){ctx.beginPath();ctx.moveTo(cx-44,y+H/2);ctx.quadraticCurveTo(cx,y-6,cx+44,y+H/2);ctx.quadraticCurveTo(cx,y+H+6,cx-44,y+H/2);ctx.fill();ctx.stroke();}
    if(i===1){for(let q=0;q<7;q++){ctx.beginPath();ctx.arc(cx+Math.cos(q)*(q?10:0)*1.2,y+H/2+Math.sin(q)*(q?9:0),6.5,0,6.3);ctx.fill();ctx.stroke();}}
    if(i===2){rr(ctx,cx-44,y+6,88,H-12,8);ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(60,14,10,.6)';for(let q=cx-40;q<cx+42;q+=5){ctx.beginPath();ctx.moveTo(q,y+7);ctx.lineTo(q,y+H-7);ctx.stroke();}}
    if(i===3){rr(ctx,cx-44,y+10,88,H-20,4);ctx.fill();ctx.stroke();ctx.strokeStyle='#3d1815';ctx.lineWidth=2;for(let q=cx-40;q<cx+42;q+=20){ctx.beginPath();ctx.moveTo(q,y+9);ctx.lineTo(q,y+H-9);ctx.stroke();}}
    if(i===4){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.4;[-24,24].forEach(d=>{ctx.beginPath();ctx.moveTo(cx+d,y+3);ctx.lineTo(cx+d,y+H-3);ctx.stroke();});ctx.strokeStyle=PAL['s1'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx-13,y+H/2);ctx.lineTo(cx+13,y+H/2);ctx.stroke();ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2;[-7,7].forEach(d=>{ctx.beginPath();ctx.moveTo(cx-24,y+H/2+d);ctx.lineTo(cx-4,y+H/2+d);ctx.moveTo(cx+24,y+H/2+d);ctx.lineTo(cx+4,y+H/2+d);ctx.stroke();});}
    txt(ctx,n,cx,y+H+13*k,{s:12*k,w:on?700:500,c:on?PAL['cv-ink']:PAL['cv-soft'],a:'center'});
    if(i<4){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.4;const ax=w*(i+1);ctx.beginPath();ctx.moveTo(ax-8,y+H/2);ctx.lineTo(ax+6,y+H/2);ctx.moveTo(ax+2,y+H/2-4);ctx.lineTo(ax+6,y+H/2);ctx.lineTo(ax+2,y+H/2+4);ctx.stroke();}});
  return y+H+18*k;}
const U=185,THICK=.8,THIN=1,SY={a:0};
function initHeads(v){if(v.heads)return;const g=rng(77);v.heads=[];for(let row=0;row<3;row++)for(const side of [-1,1])for(let i=0;i<7;i++)for(const up of [-1,1]){v.heads.push({row,side,up,d:.14+i*.095+(up>0?.03:0),st:'cocked',t:g()*1,j:g()});}}
function updateHeads(sim,v,vdt){const s=sim.st,c=fib(sim),L=s.L,tip=L/2-THIN,on=sim.p.atpOn;if(vdt<=0)return;const Tc=c.cyc;
  v.heads.forEach(h=>{const elig=h.d>=tip;h.t+=vdt;
    if(h.st==='cocked'){if(elig&&Math.random()<(on?s.A*vdt*6/Tc:s.A>.02?vdt*2:0)){h.st='bound';h.t=0;}else if(!on&&elig&&Math.random()<vdt*.5){h.st='bound';h.t=0;}}
    else if(h.st==='bound'){if(h.t>.14*Tc){h.st='stroke';h.t=0;}}
    else if(h.st==='stroke'){if(on&&h.t>.42*Tc){h.st='rel';h.t=0;}}
    else if(h.st==='rel'){if(!on){h.st='bound';h.t=0;}else if(h.t>.3*Tc){h.st='cocked';h.t=0;}}
    if(!elig&&on&&h.st!=='cocked'){h.st='cocked';h.t=0;}});}
function drawSarcomere(sim,ctx,vdt,k,t,y0){const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors'),cx=400,rowsY=[y0+40,y0+95,y0+150],L=s.L,half=L/2*U;initHeads(v);updateHeads(sim,v,vdt);
  const thinYs=[y0+13,y0+67.5,y0+122.5,y0+177];
  /* Z discs and M line */
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=4;[-1,1].forEach(d=>{ctx.beginPath();ctx.moveTo(cx+d*half,y0-4);ctx.lineTo(cx+d*half,y0+194);ctx.stroke();});ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,y0+22);ctx.lineTo(cx,y0+168);ctx.stroke();
  /* thin filaments */
  const beadR=4.2,stepB=9.4,tropo=s.A>.03;
  [-1,1].forEach(d=>{thinYs.forEach(y=>{const x0=cx+d*half,x1=x0-d*THIN*U;ctx.fillStyle=PAL['s2'];for(let q=0;q*stepB<THIN*U;q++){const X=x0-d*(q*stepB+4);ctx.beginPath();ctx.arc(X,y+(q%2?1.8:-1.8),beadR,0,6.3);ctx.fill();}
    ctx.strokeStyle=tropo?PAL['s4']:'#2b2d33';ctx.lineWidth=2;ctx.globalAlpha=tropo?.6:.85;ctx.beginPath();const oy=tropo?-4.5:0;ctx.moveTo(x0,y+oy);ctx.lineTo(x1,y+oy);ctx.stroke();ctx.globalAlpha=1;});});
  /* thick filaments */
  rowsY.forEach(y=>{ctx.strokeStyle=PAL['s1'];ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-THICK*U,y);ctx.lineTo(cx+THICK*U,y);ctx.stroke();ctx.lineCap='butt';});
  /* myosin heads: bound heads reach the thin filament */
  let nb=0,nt=0;v.heads.forEach(h=>{const y=rowsY[h.row],bx=cx+h.side*h.d*U,dir=h.up,reach=19.5;nt++;
    const lean=h.st==='stroke'?Math.min(1,RM?1:h.t/.18):h.st==='rel'?1:0,isBound=h.st==='bound'||h.st==='stroke';if(isBound)nb++;
    const tipX=isBound?bx+h.side*(-6-lean*9):(h.st==='rel'?bx+h.side*(-9):bx+h.side*(4)),tipY=y+dir*(isBound?reach:(h.st==='rel'?11:14));
    ctx.strokeStyle=isBound?HEADON:PAL['s1'];ctx.lineWidth=isBound?3.2:2.2;ctx.beginPath();ctx.moveTo(bx,y+dir*3);ctx.lineTo(tipX,tipY);ctx.stroke();ctx.fillStyle=isBound?HEADON:PAL['s1'];ctx.beginPath();ctx.ellipse(tipX,tipY,isBound?5:4,3,0,0,6.3);ctx.fill();
    if(h.st==='rel'&&p.atpOn){ctx.fillStyle=PAL['cv-atp'];ctx.beginPath();ctx.arc(tipX,tipY,2.8,0,6.3);ctx.fill();}});
  s.nb=nb/nt;
  /* calcium */
  const nCa=p.caOn||s.ca>0?Math.round(clamp(s.ca,0,1)*60):0;if(!v.caP){const g=rng(5);v.caP=[];for(let i=0;i<60;i++)v.caP.push([g(),g(),g()*6.3]);}ctx.fillStyle=PAL['s6'];for(let i=0;i<nCa;i++){const q=v.caP[i];const X=cx-half+q[0]*2*half+(RM?0:Math.sin(t*2+q[2])*5),Y=y0+q[1]*186+(RM?0:Math.cos(t*2.4+q[2])*4);ctx.beginPath();ctx.arc(X,Y,2.6,0,6.3);ctx.fill();}
  /* brackets */
  const by=y0+208;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.4;const br=(x1,x2,y)=>{ctx.beginPath();ctx.moveTo(x1,y-5);ctx.lineTo(x1,y+5);ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.moveTo(x2,y-5);ctx.lineTo(x2,y+5);ctx.stroke();};
  br(cx-half,cx+half,by);ctx.fillStyle=PAL['cv-bg'];const lb='Sarcomere: '+L.toFixed(2)+' µm';ctx.font='700 '+13*k+'px '+FONT;const lw=ctx.measureText(lb).width+12;ctx.fillRect(cx-lw/2,by-9*k,lw,18*k);txt(ctx,lb,cx,by,{s:13*k,w:700,a:'center',b:'middle'});
  if(hon&&k<1.5){const yb=by+22;txt(ctx,'A band',cx,yb+10,{s:12,c:PAL['cv-soft'],a:'center'});ctx.strokeStyle=PAL['cv-soft'];br(cx-THICK*U,cx+THICK*U,yb-2);const Iw=half-THICK*U;if(Iw>30){br(cx-half,cx-THICK*U,yb-2);txt(ctx,'I band',cx-half+Iw/2,yb+10,{s:12,c:PAL['cv-soft'],a:'center'});br(cx+THICK*U,cx+half,yb-2);txt(ctx,'I band',cx+half-Iw/2,yb+10,{s:12,c:PAL['cv-soft'],a:'center'});}
    const hz=(L/2-THIN)*U;if(hz>28){ctx.strokeStyle=PAL['s4'];br(cx-hz,cx+hz,y0+196);txt(ctx,'H zone',cx,y0+192,{s:12,c:PAL['cv-ink'],a:'center'});}}
  return by+26;}
const HEADON='#f0a020';
function drawCycle(sim,ctx,x,y,w,h,k,t){const s=sim.st,p=sim.p,c=fib(sim);
  rr(ctx,x,y,w,h,8);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  let step=-1,msg='';if(!p.atpOn&&s.rig){step=2;msg='No ATP: the head stays stuck on actin. This is rigor.';}else if(!p.caOn){step=-1;msg='No calcium: tropomyosin keeps the binding sites covered.';}else if(s.A<.03){msg='At rest: tropomyosin covers the binding sites on actin.';}
  else{const ph=(t/c.cyc)%1;step=ph<.2?0:ph<.6?1:ph<.8?2:3;msg=['1. The cocked head binds actin (a cross-bridge).','2. Power stroke: the head pulls actin toward the M line.','3. A new ATP binds and the head lets go.','4. ATP splits, and its energy recocks the head.'][step];}
  const ax=x+w*.5,ay=y+18,by=ay+40;ctx.fillStyle=PAL['s2'];for(let q=-7;q<=7;q++){ctx.beginPath();ctx.arc(ax+q*11,ay+(q%2?1.5:-1.5),5,0,6.3);ctx.fill();}
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ax-74,by);ctx.lineTo(ax+74,by);ctx.stroke();ctx.lineCap='butt';
  const ang=step===0?.25:step===1?-.85:step===2?-.85:step===3?.3:.3,bound=step===0||step===1||(step===2&&!p.atpOn),len=bound?33:24;const tx=ax+Math.sin(ang)*len,ty=by-Math.cos(ang)*len;ctx.strokeStyle=bound?HEADON:PAL['s1'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(ax,by-3);ctx.lineTo(tx,ty);ctx.stroke();ctx.fillStyle=bound?HEADON:PAL['s1'];ctx.beginPath();ctx.ellipse(tx,ty,7,4.5,ang,0,6.3);ctx.fill();
  if(step===2&&p.atpOn||step===3){ctx.fillStyle=PAL['cv-atp'];ctx.beginPath();ctx.arc(tx+8,ty+2,4,0,6.3);ctx.fill();}
  ctx.font='400 '+12.5*k+'px '+FONT;const words=msg.split(' ');let line='',yy=by+18*k;words.forEach(wd=>{const q=line?line+' '+wd:wd;if(ctx.measureText(q).width>w-20&&line){txt(ctx,line,x+10,yy,{s:12.5*k});yy+=15*k;line=wd;}else line=q;});if(line)txt(ctx,line,x+10,yy,{s:12.5*k});}
function drawTrace(sim,ctx,x,y,w,h,k){const s=sim.st,win=1;rr(ctx,x,y,w,h,8);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Force: '+Math.round(s.F*100)+'% of max',x+10,y+6+13*k,{s:13*k,w:700});const X=x+10,W=w-20,T=y+12+17*k,H=h-(T-y)-10;
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X,T+H);ctx.lineTo(X+W,T+H);ctx.moveTo(X,T);ctx.lineTo(X+W,T);ctx.stroke();
  ctx.strokeStyle=PAL['s6'];ctx.lineWidth=1.5;s.ticks.forEach(q=>{if(q<s.tm-win)return;const px=X+W*(q-(s.tm-win))/win;ctx.beginPath();ctx.moveTo(px,T+H);ctx.lineTo(px,T+H-8);ctx.stroke();});
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.4;ctx.beginPath();let pen=false;s.h.forEach(q=>{if(q[0]<s.tm-win)return;const px=X+W*(q[0]-(s.tm-win))/win,py=T+H-H*q[1]/100;pen?ctx.lineTo(px,py):ctx.moveTo(px,py);pen=true;});ctx.stroke();}
function drawSarcScene(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis||(sim.vis={});ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);const hon=atLeast('honors');
  let y=drawStrip(ctx,k);y+=2;
  /* nerve and SR */
  const ny=y+14*k*.5+4,th=Math.max(26,15*k+8);const ay=ny+th/2-3;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(14,ay);ctx.lineTo(150,ay);ctx.stroke();ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.arc(150,ay,5,0,6.3);ctx.fill();
  if(s.ap>0){const q=1-s.ap;ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(14+q*136,ay,6.5,0,6.3);ctx.fill();}
  txt(ctx,'Nerve signal',14,ny+1,{s:12*k,c:PAL['cv-soft'],b:'alphabetic'});v.ly={strip:[0,0,800,y],nerve:[0,y,800,th+14],sarc:[0,ny+th/2+2,800,216]};
  rr(ctx,166,ny-th/2,624,th,th/2);ctx.fillStyle=PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['s6'];ctx.lineWidth=1.4;ctx.stroke();
  txt(ctx,'Sarcoplasmic reticulum: stores calcium',478,ny+.5,{s:12*k,c:PAL['cv-ink'],a:'center',b:'middle'});
  ctx.fillStyle=PAL['s6'];const ncs=Math.round((1-clamp(s.ca,0,1))*(p.caOn?14:0));for(let i=0;i<ncs;i++){ctx.beginPath();ctx.arc(178+i*43,ny+(i%2?-th*.28:th*.28),2.4,0,6.3);ctx.fill();}
  const y0=ny+th/2+10;const end=drawSarcomere(sim,ctx,vdt,k,t,y0);
  /* lower panels */
  const py=Math.max(end+(hon&&k<1.5?16:2),y0+228),ph=496-py;drawCycle(sim,ctx,8,py,386,ph,k,t);drawTrace(sim,ctx,406,py,386,ph,k);v.ly.low=[0,py-4,400,ph+8];v.ly.tr=[400,py-4,400,ph+8];}

/* ---------- energy scene ---------- */
function fiberDisc(ctx,x,y,R,type){const c=type==='slow';ctx.fillStyle=c?'#8e2433':'#e6bfb6';ctx.strokeStyle=c?'#4b0f1a':'#8b5f55';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(x,y,R,0,6.3);ctx.fill();ctx.stroke();
  const g=rng(c?3:9),N=c?26:6;ctx.fillStyle=c?'#f0a39b':'#a55a4d';for(let i=0;i<N;i++){const a=g()*6.3,r=Math.sqrt(g())*R*.88;ctx.beginPath();ctx.ellipse(x+Math.cos(a)*r,y+Math.sin(a)*r,4.2,2.3,a,0,6.3);ctx.fill();}
  const cap=c?7:3;ctx.fillStyle='#c22f3f';ctx.strokeStyle='#5a0e18';for(let i=0;i<cap;i++){const a=i/cap*6.3+.4;ctx.beginPath();ctx.arc(x+Math.cos(a)*(R+7),y+Math.sin(a)*(R+7),4,0,6.3);ctx.fill();ctx.stroke();}}
function bar(ctx,x,y,w,h,frac,col){rr(ctx,x,y,w,h,5);ctx.fillStyle=PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();const q=clamp(frac,0,1);if(q>.002){rr(ctx,x,y,Math.max(4,w*q),h,5);ctx.fillStyle=col;ctx.fill();}}
function drawEnergy(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,hon=atLeast('honors'),ap=atLeast('ap'),F=p.fiber;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
  const sm=k>1.35;
  /* left: fibers */
  const lx=16;txt(ctx,F==='mixed'?'Mixed muscle':FT[F].n,lx,12+15*k,{s:15*k,w:700});
  if(F==='mixed'){const dy=sm?96:126,d2=sm?230:192;fiberDisc(ctx,lx+62,dy,44,'slow');fiberDisc(ctx,lx+d2,dy,44,'fast');[[62,'Slow'],[d2,'Fast']].forEach(q=>txt(ctx,q[1],lx+q[0],dy+52+12*k,{s:12*k,c:PAL['cv-soft'],a:'center'}));}
  else{fiberDisc(ctx,lx+(sm?110:120),sm?104:130,sm?50:58,F);}
  const desc=F==='slow'?['Red: myoglobin','Many mitochondria','Many capillaries']:F==='fast'?['White: little myoglobin','Few mitochondria','Few capillaries']:['Slow fibers work first.','Fast fibers join at','higher effort.'];
  if(!sm)desc.forEach((l,i)=>txt(ctx,l,lx,222+i*17*k+(k-1)*10,{s:12.5*k,c:PAL['cv-ink']}));
  /* middle: the arm doing the work */
  const mx=sm?240:345,my=140,force=s.eF,vm=(s.vPh=(s.vPh||0)+vdt*(1+force*2.2));
  if(!sm){const swing=(RM?force*.5:force*(.5-.5*Math.cos(vm*2.2)));const ang=-.95+swing*2.1,ex=mx-40,ey=my+36,hx=ex+Math.cos(ang)*96,hy=ey-Math.sin(ang)*96;
    ctx.lineCap='round';ctx.strokeStyle='#b4534a';ctx.lineWidth=20;ctx.beginPath();ctx.moveTo(ex-2,ey-96);ctx.lineTo(ex,ey);ctx.stroke();ctx.lineWidth=15;ctx.strokeStyle='#ad4f47';ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(hx,hy);ctx.stroke();ctx.lineCap='butt';
    ctx.fillStyle=PAL['cv-soft'];rr(ctx,hx-20,hy-4,40,8,3);ctx.fill();rr(ctx,hx-24,hy-13,9,26,3);ctx.fill();rr(ctx,hx+15,hy-13,9,26,3);ctx.fill();}
  const gx=sm?16:mx-90,gw=sm?430:180,gy=sm?190:226;txt(ctx,'Force',gx,gy,{s:13*k,w:600});txt(ctx,Math.round(s.eF*100)+'%',gx+gw,gy,{s:15*k,w:700,a:'right'});
  bar(ctx,gx,gy+6,gw,18,s.eF,PAL['s1']);if(s.eT>0){const tx=gx+gw*s.eT;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx,gy+2);ctx.lineTo(tx,gy+28);ctx.stroke();}
  if(!sm)txt(ctx,'Line marks the force you are asking for',gx,gy+30+13*k,{s:12*k,c:PAL['cv-soft']});
  /* right: stores */
  const rx=478,rw=306,un=sm?'':' mmol/kg';let ry=sm?4:14;const rows=[['ATP',s.eATP/ATP0,PAL['cv-atp'],s.eATP.toFixed(1)+un]];if(hon)rows.push(['Creatine phosphate',s.ePCr/PCR0,PAL['s3'],s.ePCr.toFixed(0)+un]);rows.push(['Lactic acid',s.eLac/40,s.eLac>=BURN?PAL['s1']:PAL['s4'],s.eLac.toFixed(1)+un]);if(ap)rows.push(['Glycogen',s.eG/G0,PAL['s5'],s.eG.toFixed(0)+un]);
  rows.forEach(r=>{txt(ctx,r[0],rx,ry+13*k,{s:13*k,w:600});txt(ctx,r[3],rx+rw,ry+13*k,{s:12*k,c:PAL['cv-soft'],a:'right'});bar(ctx,rx,ry+17*k,rw,14,r[1],r[2]);if(r[0]==='Lactic acid'){const bx=rx+rw*BURN/40;ctx.strokeStyle=PAL['cv-ink'];ctx.setLineDash([3,3]);ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(bx,ry+15*k);ctx.lineTo(bx,ry+19*k+14);ctx.stroke();ctx.setLineDash([]);}ry+=(sm?26:34)+17*k;});
  /* status */
  const burn=s.eLac>=BURN,fatigued=s.eT>0&&s.eF<.9*s.eT-1e-4;let sx=rx,sy=Math.max(ry+6,0);const pp=(lab,col)=>{ctx.font='700 '+13*k+'px '+FONT;const w=ctx.measureText(lab).width+18;rr(ctx,sx,sy,w,20*k+4,8);ctx.fillStyle=col;ctx.fill();txt(ctx,lab,sx+9,sy+(20*k+4)/2,{s:13*k,w:700,c:'#fff',b:'middle'});sx+=w+8;};
  if(burn)pp('The burn','#b03a2e');if(fatigued)pp('Fatigue','#6a3d9a');if(!p.o2)pp('No oxygen','#2c5f8a');
  /* bottom: the two pathways */
  const by=Math.max(306,sy+24*k+14),bh=(496-by-8)/2,tot=Math.max(.2,s.eAer+s.eAn+s.ePc),path=(y,t1,t2,rate,col)=>{rr(ctx,8,y,784,bh,8);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();txt(ctx,t1,20,y+4+13*k,{s:13*k,w:700});txt(ctx,t2,20,y+6+29*k,{s:12.5*k});if(!sm){const bw=320*(rate/5.5);rr(ctx,20,y+bh-16,Math.max(2,bw),10,3);ctx.fillStyle=col;ctx.fill();}txt(ctx,rate.toFixed(1)+' ATP/s',sm?780:360,y+(sm?4+13*k:bh-7),{s:12*k,c:PAL['cv-soft'],a:sm?'right':'left'});};
  path(by,'Aerobic (needs oxygen)','glucose + oxygen → 38 ATP + water + CO₂',s.eAer,PAL['s2']);path(by+bh+8,'Anaerobic (no oxygen)','glucose → 2 ATP + lactic acid',s.eAn+(hon?0:s.ePc),PAL['s4']);}

function drawAll(sim,ctx,vdt,k,t){sim.vis=sim.vis||{};const kd=stageKind(sim);if(kd==='bench')return drawBench(sim,ctx,vdt,k,t);if(kd==='energy')return drawEnergy(sim,ctx,vdt,k,t);drawSarcScene(sim,ctx,vdt,k,t);}

/* ---------- graphs ---------- */
function plotForce(sim,ctx,box){const s=sim.st;if(stageKind(sim)==='energy'){const hh=s.eh,xmax=Math.max(60,s.et),xmin=Math.max(0,xmax-300),ax=axes(ctx,box,{xmin,xmax,ymin:0,ymax:100,xl:'Time (s)',yl:'Force (% of max)'});ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.4;ctx.beginPath();let pen=false;hh.forEach(q=>{if(q[0]<xmin)return;const X=ax.X(q[0]),Y=ax.Y(q[1]);pen?ctx.lineTo(X,Y):ctx.moveTo(X,Y);pen=true;});ctx.stroke();return;}
  const xmax=Math.max(1,s.tm),xmin=xmax-1,ax=axes(ctx,box,{xmin:xmin*1000,xmax:xmax*1000,ymin:0,ymax:100,xl:'Time (ms)',yl:'Force (% of max)'});ctx.strokeStyle=PAL['s6'];ctx.lineWidth=1.3;s.ticks.forEach(q=>{if(q<xmin)return;const X=ax.X(q*1000);ctx.beginPath();ctx.moveTo(X,ax.Y(0));ctx.lineTo(X,ax.Y(7));ctx.stroke();});ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.4;ctx.beginPath();let pen=false;s.h.forEach(q=>{if(q[0]<xmin)return;const X=ax.X(q[0]*1000),Y=ax.Y(q[1]);pen?ctx.lineTo(X,Y):ctx.moveTo(X,Y);pen=true;});ctx.stroke();}
function plotLT(sim,ctx,box){const s=sim.st,ax=axes(ctx,box,{xmin:1.2,xmax:3.8,ymin:0,ymax:110,xl:'Sarcomere length (µm)',yl:'Force at full activation (% of max)'});ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.6;ctx.beginPath();LT.forEach((q,i)=>{const X=ax.X(q[0]),Y=ax.Y(q[1]*100);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();const L=s.L;ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(L),ax.Y(overlap(L)*100),6,0,6.3);ctx.fill();}
function plotEnergy(sim,ctx,box){const s=sim.st;if(stageKind(sim)!=='energy'){txt(ctx,'Choose Energy and fatigue to see this graph.',box.L+box.W/2,box.T+box.H/2,{s:14,c:PAL['muted'],a:'center'});return;}
  box.T=34;box.H-=22;const xmax=Math.max(60,s.et),xmin=Math.max(0,xmax-300),ax=axes(ctx,box,{xmin,xmax,ymin:0,ymax:6,xl:'Time (s)',yl:'ATP supply (mmol/kg/s)'});[[3,PAL['s2']],[5,PAL['s3']],[4,PAL['s4']]].forEach(c=>{ctx.strokeStyle=c[1];ctx.lineWidth=2.2;ctx.beginPath();let pen=false;s.eh.forEach(q=>{if(q[0]<xmin)return;const X=ax.X(q[0]),Y=ax.Y(q[c[0]]);pen?ctx.lineTo(X,Y):ctx.moveTo(X,Y);pen=true;});ctx.stroke();});legend(ctx,box.L,14,[{label:'Aerobic',color:PAL['s2']},{label:'Creatine phosphate',color:PAL['s3']},{label:'Anaerobic',color:PAL['s4']}]);}

function syncScene(sim){if(!sim.ui||!sim.ui.ctlW||sim.mode==='vlab'&&sim.vlab)return;const sc=sim.p.scene;(sim.def.controls||[]).forEach(c=>{const w=sim.ui.ctlW[c.id];if(w&&c.scene&&!c.vlab)w.hidden=!atLeast(c.lvl)||c.scene!==sc;});(sim.def.actions||[]).forEach(a=>{const b=sim.ui.actB&&sim.ui.actB[a.id];if(b&&a.scene)b.hidden=!atLeast(a.lvl)||a.scene!==sc;});
  sim.def.metrics.forEach(m=>{const t=sim.ui.tiles&&sim.ui.tiles[m.id];if(!t)return;const el=t.num.closest('.tile');if(el)el.hidden=!atLeast(m.lvl)||(m.scene&&m.scene!==sc);});}
function tilesForBench(sim,on){sim.def.metrics.forEach(m=>{const t=sim.ui.tiles&&sim.ui.tiles[m.id];if(!t)return;const el=t.num.closest('.tile');if(el)el.hidden=on||!atLeast(m.lvl)||(m.scene&&m.scene!==sim.p.scene);});}

/* ---------- the lab ---------- */
const TRAITS=['Color','Contraction speed','Power','How soon it fatigues','Main energy pathway','Oxygen use','Myoglobin','Good for'];
const KEY={Color:[/red|dark/i,/white|pale|light/i],'Contraction speed':[/slow/i,/fast|quick/i],Power:[/low|less|weak|small/i,/high|more|strong|great|big/i],'How soon it fatigues':[/late|slow|long|resist/i,/soon|quick|fast|early/i],'Main energy pathway':[/aerobic/i,/anaerobic/i],'Oxygen use':[/high|a lot|lots|much|more|needs/i,/low|little|less|no\b|none/i],Myoglobin:[/has|yes|lots|high|much|present/i,/lacks|no\b|none|little|low|absent/i],'Good for':[/.+/,/.+/]};
const traitCheck=which=>(sim,rv,v)=>{const re=KEY[rv];if(!re)return null;const r=re[which];if(rv==='Main energy pathway'&&which===0&&/anaerobic/i.test(v))return 'Reread the Background for this one.';if(!r.test(v))return 'Have another look at this one in the Background and your results.';return null;};
function rowOf(key){return TRIALS.indexOf(key);}
const timeCheck=col=>(sim,rv,v)=>{const b=sim.vlab.bench,i=TLABEL.indexOf(rv),key=TRIALS[i],r=(b.runs||{})[key];if(i<0)return null;if(!r)return 'Run this trial on the bench first.';
  const want=col==='total'?r.total:r.lap;if(want===null||want===undefined)return 'You did not mark the burn in this trial. You can redo the trial, or leave this cell blank and say why in your analysis.';if(Math.abs(want-v)>1)return 'That does not match your stopwatch for this trial. Choose the trial on the bench and read the stopwatch again.';return null;};
const trialDone=(sim,keys)=>keys.every(k=>{const r=(sim.vlab.bench.runs||{})[k],i=TRIALS.indexOf(k);return r&&sim.vlab.raw('c:data:total:'+i).trim()!=='';});
const trialStep=(title,part,ch,txtx)=>({title,text:txtx,controls:['fHand','sw-start','sw-burn','sw-stop','sw-redo'],setup(sim){BioLab.setValues(sim,{fPart:part,fCh:ch,fHand:'D'});},
  done:sim=>trialDone(sim,[part+ch+'D',part+ch+'N']),doneHint:'Run this challenge with each hand and type the total times in the data table.'});
const LAB={id:'muscle-fatigue',title:'Muscle Fatigue Lab',course:'Anatomy & Physiology',teachers:'McKeon',
  source:{label:'Muscle Fatigue Lab.pdf',href:'https://rjhs.instructure.com/courses/15586/assignments/580453'},
  purpose:'<p>You will compare how muscles tire when they work at a pace they can sustain and when they work as fast as they can. From that, you will work out which fiber type and which energy pathway each pace relies on.</p>',
  background:'<p>Skeletal muscles contain two main fiber types. <b>Slow twitch</b> fibers are red because they are rich in myoglobin, a protein that stores oxygen. They contract slowly, make ATP aerobically and keep going for a long time. <b>Fast twitch</b> fibers lack myoglobin and look white. They contract quickly and powerfully, depend on anaerobic ATP and tire fast.</p>'+
    '<p><b>Aerobic respiration</b> uses oxygen: glucose + oxygen → 38 ATP + water + CO₂. <b>Anaerobic respiration</b> needs no oxygen: glucose → 2 ATP + lactic acid. Your handout connects lactic acid buildup to “the burn” you feel in a working muscle.</p>'+
    '<p><b>About the virtual bench.</b> Your partner is fictional. Times vary from one partner to the next, as they do in a real class, and the non-dominant hand usually tires sooner. Your times depend on when you press the buttons. In Part A the bench runs 5 times faster than real time so you are not waiting for minutes, but the stopwatch still reads true seconds.</p>',
  materials:['Clothespin','Textbook','Stopwatch','A partner to do the work while you time and record, then switch roles if you repeat the lab in class'],
  hypothesis:{prompt:'<p>Which will last longer: a sustainable pace or the fastest pace? Which will bring on the burn sooner? Give a reason using what you know about the two fiber types.</p>'},
  setup(sim){sim.st.dummy=0;tilesForBench(sim,true);},
  teardown(sim){sim.vis&&(sim.vis.sp=[]);tilesForBench(sim,false);syncScene(sim);},
  controls:[],
  steps:[
    {title:'Predict the traits',text:'<p>Before reading further, fill in <b>Table 1</b> with your predictions for slow twitch and fast twitch fibers. It is fine to be wrong. You will come back to it in Table 4.</p>'},
    {title:'Check yourself',text:'<p>Read the Background. Answer the check-yourself questions, fill in the two ATP values under Calculations, and complete the matching in <b>Table 2</b>.</p>'},
    trialStep('Part A, challenge 1: clothespin','A','1','<p>Your partner holds a clothespin between thumb and index finger and squeezes it open and closed at a steady pace of about one squeeze every 2 seconds.</p><ol><li>Press <b>Start</b> and watch.</li><li>Press <b>Mark the burn</b> as soon as your partner reports the burn.</li><li>Press <b>Stop</b> when your partner can no longer keep the pace.</li></ol><p>Read the stopwatch and record both times. Do the dominant hand, then the non-dominant hand.</p>'),
    trialStep('Part A, challenge 2: textbook','A','2','<p>Your partner holds a textbook and raises it from hip level to shoulder level and back, at a pace of about once every 3 seconds. Use the same stopwatch routine. Dominant hand first, then non-dominant.</p>'),
    trialStep('Part B, challenge 1: clothespin','B','1','<p>Same clothespin, now as fast as possible. The strategy changes: <b>stop as soon as the pace slows</b>. Watch the pace strip. Your partner will not tell you when to stop. Dominant hand, then non-dominant.</p>'),
    trialStep('Part B, challenge 2: textbook','B','2','<p>Same textbook lift, now as fast as possible. Stop as soon as the pace slows. Dominant hand, then non-dominant.</p>'),
    {title:'Compare',text:'<p>Your graph draws from your table. Fill in the comparisons under Calculations, then answer the analysis questions.</p>',controls:['fPart','fCh','fHand']},
    {title:'Finish your chart',text:'<p>Complete <b>Table 4</b> using what you now know and what you measured, then write your conclusion.</p>'}],
  tables:[
    {id:'predict',title:'Table 1: Your prediction',cols:[{id:'t',label:'Trait',rows:TRAITS},{id:'slow',label:'Slow twitch',input:'text'},{id:'fast',label:'Fast twitch',input:'text'}]},
    {id:'match',title:'Table 2: Match each term',cols:[{id:'t',label:'Term',rows:['Myoglobin','Aerobic','Anaerobic','Lactic acid','Mitochondria']},{id:'m',label:'Best match',input:'select',options:['Without oxygen','With oxygen','Stores oxygen in muscle','Where most aerobic ATP is made','Made when glucose is broken down without oxygen'],check:(sim,rv,v)=>({Myoglobin:'Stores oxygen in muscle',Aerobic:'With oxygen',Anaerobic:'Without oxygen','Lactic acid':'Made when glucose is broken down without oxygen',Mitochondria:'Where most aerobic ATP is made'}[rv]===v?null:'Reread the Background and try this one again.')}]},
    {id:'data',title:'Table 3: Your stopwatch times (A = sustainable, B = fastest, 1 = clothespin, 2 = textbook)',cols:[{id:'trial',label:'Trial',rows:TRIALS.map((_,i)=>i+1),rowLabels:TLABEL},{id:'total',label:'Total time (s)',input:'number',dp:1,check:(sim,rv,v)=>timeCheck('total')(sim,TLABEL[rv-1],v)},{id:'burn',label:'Burn starts (s)',input:'number',dp:1,check:(sim,rv,v)=>timeCheck('burn')(sim,TLABEL[rv-1],v)}]},
    {id:'final',title:'Table 4: Your conclusion chart',cols:[{id:'t',label:'Trait',rows:TRAITS},{id:'slow',label:'Slow twitch',input:'text',check:traitCheck(0)},{id:'fast',label:'Fast twitch',input:'text',check:traitCheck(1)}]}],
  graphs:[{type:'bar',title:'Total time and burn time in each trial',xl:'Trial',yl:'Time (s)',series:[{table:'data',x:'trial',y:'total',label:'Total time'},{table:'data',x:'trial',y:'burn',label:'Burn starts'}]}],
  calcs:[
    {id:'atpa',label:'ATP from one glucose, aerobic (handout value)',unit:'ATP',check:(sim,n)=>n===38?null:'Find the aerobic equation in the Background.'},
    {id:'atpb',label:'ATP from one glucose, anaerobic',unit:'ATP',check:(sim,n)=>n===2?null:'Find the anaerobic equation in the Background.'},
    {id:'ratio',label:'How many times more ATP does aerobic respiration give per glucose?',unit:'times',check:(sim,n)=>Math.abs(n-19)<.6?null:'Divide your two ATP values.'},
    {id:'r1',label:'Clothespin, dominant hand: Part A total ÷ Part B total',check:(sim,n,V)=>{const a=V.val('data','total',0),b=V.val('data','total',4);if(!Number.isFinite(a)||!Number.isFinite(b)||b===0)return 'Fill in these two times in Table 3 first.';return Math.abs(n-a/b)<=Math.max(.15,a/b*.05)?null:'Check your division, using your own values from Table 3.';}},
    {id:'r2',label:'Textbook, dominant hand: Part A total ÷ Part B total',check:(sim,n,V)=>{const a=V.val('data','total',2),b=V.val('data','total',6);if(!Number.isFinite(a)||!Number.isFinite(b)||b===0)return 'Fill in these two times in Table 3 first.';return Math.abs(n-a/b)<=Math.max(.15,a/b*.05)?null:'Check your division, using your own values from Table 3.';}}],
  questions:[
    {id:'c1',n:'Check 1',q:'<p>What makes slow twitch fibers look red?</p>'},
    {id:'c2',n:'Check 2',q:'<p>Why does aerobic respiration need oxygen to reach the fiber the whole time, while anaerobic respiration does not?</p>'},
    {id:'c3',n:'Check 3',q:'<p>Which pathway gets more ATP per glucose? Which one can make ATP faster?</p>'},
    {id:'q1',n:'1',q:'<p>When a muscle fatigues, which two things has it run short of?</p>'},
    {id:'q2',n:'2',q:'<p>Using your Table 1 predictions, which fiber type should tire sooner? Why?</p>'},
    {id:'q3',n:'3',q:'<p>Which fiber type does Part A rely on most? Which does Part B rely on most? How can you tell from the pace?</p>'},
    {id:'q4',n:'4',q:'<p>Clothespin: compare your total times for Part A and Part B. Did the result match what you expected? Use numbers.</p>'},
    {id:'q5',n:'5',q:'<p>Textbook: compare your total times for Part A and Part B. Did the result match what you expected? Use numbers.</p>'},
    {id:'q6',n:'6',q:'<p>What is “the burn”? According to your handout, what causes it?</p>'},
    {id:'q7',n:'7',q:'<p>Which fiber type feels the burn sooner? Support your answer with your Part A and Part B burn times.</p>'},
    {id:'q8',n:'8',q:'<p>Why does the burn show up sooner at the fastest pace?</p>'},
    {id:'q9',n:'9',q:'<p>Compare your dominant and non-dominant hands in each part. Which lasted longer?</p>'},
    {id:'q10',n:'10',q:'<p>Explain any difference you found between hands. What might use and training change in a muscle?</p>'},
    {id:'q11',n:'11',q:'<p>Which challenge tired your partner sooner, the clothespin or the textbook? Suggest why.</p>'},
    {id:'q12',n:'12',q:'<p>Name one source of error in this lab, and one way to reduce it.</p>'},
    {id:'q13',n:'13',q:'<p>A marathon runner and a 100 m sprinter train for different events. Which fiber type would each want more of, and why?</p>'}],
  conclusion:{prompt:'<p>Use your data to explain how pace affects which fiber type and energy pathway a muscle relies on, and how that affects when it tires.</p>'}};

const foc=(sim,n)=>((sim.vis&&sim.vis.ly&&sim.vis.ly[n])||[0,0,800,500]);
const H={
  id:'contraction',hash:'contraction',apUnit:9,order:6,kind:'Simulation',tab:'Muscle contraction',
  card:'Slow a sarcomere down and watch calcium, ATP and cross-bridges slide the filaments. Then push a fiber until it fatigues.',
  title:'Muscle contraction and fatigue',
  lede:{bio:'Follow one nerve signal down to the filaments inside a muscle. See how calcium, ATP and myosin make a muscle pull, and why it eventually tires.',
        honors:'Connect the sliding filament model to whole-muscle behavior: twitch, summation, tetanus, length-tension, fiber types and fatigue.',
        ap:'Read the length-tension curve and the force-frequency response, and track the ATP sources that supply a working muscle.'},
  scale:{bio:'One sarcomere, about 2.2 µm long at rest. A single muscle fiber holds thousands of them end to end. Time is slowed 10 times in this view.'},
  timeScale:1,dtMax:.02,prewarm:0,sampleDt:.1,window:30,unit:'s',aspect:1.6,chChange:1,chReveal:5,
  clock(sim){const k=stageKind(sim);if(k==='bench')return 'Bench';if(k==='energy'){const t=Math.floor(sim.st.et),m=Math.floor(t/60);return 'Time '+m+':'+String(t%60).padStart(2,'0')+' (running 3× fast)';}return 'Time '+Math.round(sim.st.tm*1000)+' ms (slowed 10×)';},
  controls:[
    {id:'scene',label:'View',type:'seg',def:'sarc',lvl:'bio',noTrial:true,options:[{v:'sarc',l:'Sarcomere'},{v:'energy',l:'Energy and fatigue'}],onChange(sim){syncScene(sim);if(sim.ui&&sim.ui.gm&&sim.gMetric==='energy'&&sim.p.scene!=='energy'){sim.gMetric='force';sim.ui.gm.value='force';}BioLab.refresh&&sim.ui&&BioLab.refresh(sim);}},
    {id:'fiber',label:'Fiber type',type:'seg',def:'slow',lvl:'bio',options:[{v:'slow',l:'Slow twitch'},{v:'fast',l:'Fast twitch'},{v:'mixed',l:'Mixed muscle',lvl:'honors'}],onChange(sim){if(sim.st&&stageKind(sim)==='energy'){}}},
    {id:'rate',label:'Stimulation rate',type:'range',min:0,max:100,step:1,def:0,unit:' per s',lvl:'bio',scene:'sarc',help:'0 means no repeating signal. Use Single nerve signal for one twitch.'},
    {id:'L0',label:'Starting sarcomere length',type:'range',min:1.4,max:3.8,step:.05,def:2.2,d:2,unit:' µm',lvl:'honors',scene:'sarc',help:'Stretch or shorten the sarcomere before it contracts.'},
    {id:'atpOn',label:'ATP available',type:'toggle',def:true,lvl:'bio',scene:'sarc'},
    {id:'caOn',label:'Calcium released',type:'toggle',def:true,lvl:'bio',scene:'sarc'},
    {id:'effort',label:'Force you ask for',type:'range',min:0,max:100,step:5,def:30,unit:'% of max',lvl:'bio',scene:'energy'},
    {id:'o2',label:'Oxygen reaches the muscle',type:'toggle',def:true,lvl:'bio',scene:'energy',help:'Off is like a tight blood pressure cuff, or a muscle squeezing its own blood vessels shut.'},
    {id:'fPart',label:'Part',type:'seg',def:'A',vlab:true,noTrial:true,options:[{v:'A',l:'A: sustainable'},{v:'B',l:'B: fastest'}]},
    {id:'fCh',label:'Challenge',type:'seg',def:'1',vlab:true,noTrial:true,options:[{v:'1',l:'1: clothespin'},{v:'2',l:'2: textbook'}]},
    {id:'fHand',label:'Hand',type:'seg',def:'D',vlab:true,noTrial:true,options:[{v:'D',l:'Dominant'},{v:'N',l:'Non-dominant'}]}
  ],
  actions:[
    {id:'twitch',label:'Single nerve signal',primary:true,scene:'sarc',run(sim){if(sim.p.scene==='sarc'||sim.st)fireStim(sim.st,fib(sim),sim.p.caOn,sim.p.atpOn);}},
    {id:'pace',label:'Sustainable pace (30%)',scene:'energy',run(sim){BioLab.setValues(sim,{effort:30});}},
    {id:'allout',label:'All out (100%)',primary:true,scene:'energy',run(sim){BioLab.setValues(sim,{effort:100});}},
    {id:'rest',label:'Rest',scene:'energy',run(sim){BioLab.setValues(sim,{effort:0});}},
    {id:'sw-start',label:'Start',primary:true,vlab:true,enabled:s=>!!s.vlab&&!s.vlab.bench.cur&&!curRun(s),run(s){if(s.vlab)benchStart(s);}},
    {id:'sw-burn',label:'Mark the burn',vlab:true,enabled:s=>!!s.vlab&&!!s.vlab.bench.cur&&s.vlab.bench.cur.lap===null,run(s){if(s.vlab)benchLap(s);}},
    {id:'sw-stop',label:'Stop',vlab:true,enabled:s=>!!s.vlab&&!!s.vlab.bench.cur,run(s){if(s.vlab)benchStop(s);}},
    {id:'sw-redo',label:'Redo this trial',vlab:true,enabled:s=>!!s.vlab&&(!!curRun(s)||!!s.vlab.bench.cur),run(s){if(s.vlab)benchRedo(s);}}
  ],
  init(){return {tm:0,x1:0,x2:0,ca:0,A:0,F:0,L:2.2,ovl:1,ap:0,nextS:0,ticks:[],h:[],ripple:0,Fpk:0,rig:false,nb:0,
    ps:newPool('slow'),pf:newPool('fast'),et:0,eF:0,eT:0,eLac:0,eATP:ATP0,ePCr:PCR0,eG:G0,eAer:0,eAn:0,ePc:0,tBurn:null,tFat:null,eh:[]};},
  step(sim,dt){if(sim.mode==='vlab'&&sim.vlab){if(sim.vlab.lab.id==='muscle-fatigue')benchStep(sim,dt);return;}if(sim.p.scene==='energy')energyStep(sim,dt*ENERGY);else sarcStep(sim,dt);},
  initVis(sim){sim.vis=sim.vis||{};},
  draw:drawAll,
  onLevel(sim){if(sim.mode==='vlab'&&sim.vlab)tilesForBench(sim,true);else syncScene(sim);},
  metrics:[
    {id:'L',scene:'sarc',label:'Sarcomere length',unit:'µm',lvl:'bio',min:1,max:4,fixed:true,d:2,get:s=>s.st.L},
    {id:'F',scene:'sarc',label:'Force',unit:'% of max',lvl:'bio',min:0,max:100,fixed:true,d:0,get:s=>s.st.F*100},
    {id:'Ca',scene:'sarc',label:'Calcium around filaments',unit:'%',lvl:'bio',min:0,max:100,fixed:true,d:0,get:s=>clamp(s.st.ca,0,1)*100},
    {id:'ovl',scene:'sarc',label:'Filament overlap',unit:'% of best',lvl:'honors',min:0,max:100,fixed:true,d:0,get:s=>s.st.ovl*100},
    {id:'state',scene:'sarc',label:'Force pattern',unit:'',lvl:'honors',text:true,get:s=>{const p=s.p,st=s.st;if(st.rig)return 'Rigor: locked';if(p.rate===0)return st.F>.01?'Single twitch':'At rest';if(st.ripple>3&&p.rate<4)return 'Separate twitches';return st.ripple>3?'Summation':'Tetanus';}},
    {id:'ripple',scene:'sarc',label:'Force ripple',unit:'% of max',lvl:'ap',min:0,max:40,d:1,get:s=>s.st.ripple},
    {id:'eF',scene:'energy',label:'Force',unit:'% of max',lvl:'bio',min:0,max:100,fixed:true,d:0,get:s=>s.st.eF*100},
    {id:'eLac',scene:'energy',label:'Lactic acid',unit:'mmol/kg',lvl:'bio',min:0,max:40,d:1,get:s=>s.st.eLac},
    {id:'eATP',scene:'energy',label:'ATP',unit:'mmol/kg',lvl:'bio',min:0,max:8,d:1,get:s=>s.st.eATP},
    {id:'tb',scene:'energy',label:'Burn started',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>s.st.tBurn===null?'Not yet':'At '+Math.round(s.st.tBurn)+' s'},
    {id:'tf',scene:'energy',label:'Fatigue started',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>s.st.tFat===null?'Not yet':'At '+Math.round(s.st.tFat)+' s'},
    {id:'aerShare',scene:'energy',label:'Aerobic share of ATP',unit:'%',lvl:'honors',min:0,max:100,fixed:true,d:0,get:s=>{const q=s.st,t=q.eAer+q.eAn+q.ePc;return t>.01?q.eAer/t*100:100;}},
    {id:'ePCr',scene:'energy',label:'Creatine phosphate',unit:'mmol/kg',lvl:'ap',min:0,max:25,d:0,get:s=>s.st.ePCr}
  ],
  graphs:[{id:'force',label:'Force over time',custom:true},{id:'lt',label:'Length-tension curve',lvl:'honors',custom:true},{id:'energy',label:'Where ATP comes from',lvl:'honors',custom:true}],
  defaultGraph:'force',
  plot(sim,ctx,box,id){if(id==='lt')return plotLT(sim,ctx,box);if(id==='energy')return plotEnergy(sim,ctx,box);plotForce(sim,ctx,box);},
  narrate(sim){const k=stageKind(sim),s=sim.st,p=sim.p;if(k==='bench')return benchNarrate(sim);
    if(k==='energy'){const F=Math.round(s.eF*100),pct=Math.round(p.effort),T=Math.round(s.eLac);
      if(p.effort===0)return 'The muscle is resting. With oxygen, mitochondria rebuild creatine phosphate and ATP'+(s.eLac>1?', and lactic acid clears ('+T+' mmol/kg now)':'')+'.';
      if(!p.o2&&s.eAer<.05)return '<b>No oxygen: only anaerobic ATP is left.</b> Glucose gives 2 ATP instead of 38, so lactic acid builds fast ('+T+' mmol/kg).';
      if(s.tFat!==null&&s.eF<.9*s.eT)return '<b>Fatigue: force has dropped to '+F+'%</b> even though you ask for '+pct+'%. The fiber cannot supply ATP fast enough, and acid buildup interferes with contraction.';
      if(s.eLac>=BURN)return '<b>The burn.</b> Anaerobic ATP can’t keep up without lactic acid building up ('+T+' mmol/kg). Force is still holding, but not for long at this pace.';
      if(s.eAn>.1||s.ePc>.1)return 'Demand is above what oxygen can supply, so '+(s.ePc>.1?'creatine phosphate':'anaerobic ATP')+' is filling the gap.'+(atLeast('honors')?' Aerobic supply takes a minute or so to ramp up.':'');
      return '<b>Aerobic ATP is covering the demand.</b> This pace can last a long time because oxygen keeps arriving and little lactic acid builds up.';}
    if(s.rig)return '<b>No ATP: rigor.</b> Without ATP, heads cannot let go of actin, and the pump cannot put calcium back. The muscle stays locked and cannot relax. This is why bodies stiffen after death.';
    if(!p.caOn)return '<b>The signal arrives, but no calcium is released.</b> Tropomyosin stays on the binding sites, so myosin has nothing to grab and force stays at zero.';
    if(s.L>3.5&&p.L0>3.5)return '<b>Stretched too far.</b> The thin filaments barely overlap the thick ones, so few heads can reach actin and there is almost no force.';
    if(p.L0<1.7)return '<b>Too short.</b> Thin filaments overlap each other and thick filaments hit the Z discs, so force falls.';
    if(p.rate===0){return s.F>.02?'<b>A single twitch.</b> One signal released calcium, heads pulled briefly, and the pump put calcium back. Force peaks near '+Math.round(s.Fpk*100)+'% of max, then falls.':'<b>At rest.</b> Calcium is stored and tropomyosin covers actin’s binding sites. Press <b>Single nerve signal</b> to start a contraction.';}
    if(p.rate<4)return 'Signals arrive far apart, so the muscle relaxes between them. These are <b>separate twitches</b>.';
    if(s.ripple>3)return 'Signals now arrive before the muscle has relaxed, so twitches add. This is <b>summation</b>. Force is about '+Math.round(s.F*100)+'% of max, with visible ripple.';
    return 'Signals come so fast that twitches fuse into a smooth pull: <b>tetanus</b>. Force holds near '+Math.round(s.F*100)+'% of max. Calcium stays high, so cross-bridges keep cycling.';},
  tour:[
    {title:'From muscle to sarcomere',text:'A muscle is bundles of fibers, each fiber is packed with myofibrils, and each myofibril is a chain of sarcomeres. The sarcomere is the unit that actually shortens. Everything below is one sarcomere, slowed 10 times.',focus:sim=>foc(sim,'strip'),speed:.5,pause:true,setup(sim){BioLab.setValues(sim,{scene:'sarc',rate:0,atpOn:true,caOn:true,L0:2.2});BioLab.reset(sim);}},
    {title:'At rest',text:'Thin filaments (actin) reach in from the Z discs on each side. The thick filament (myosin) sits in the middle with its heads ready. Tropomyosin covers the binding sites on actin, so no cross-bridges can form.',focus:sim=>foc(sim,'sarc'),speed:.5,pause:true},
    {title:'The nerve signal arrives',text:'A motor neuron fires. The signal spreads over the fiber and reaches the sarcoplasmic reticulum, which releases its stored calcium.',focus:sim=>foc(sim,'nerve'),speed:.3,setup(sim){BioLab.setValues(sim,{rate:2});}},
    {title:'Calcium uncovers actin',text:'Calcium floods in around the filaments and binds to troponin. Troponin shifts tropomyosin off the binding sites. Watch the amber line move, and the teal calcium dots appear.',focus:sim=>foc(sim,'sarc'),speed:.3},
    {title:'Cross-bridges pull',text:'A cocked myosin head grabs actin and swings: the power stroke. Each stroke pulls the thin filament toward the M line. The filaments keep their length. The sarcomere shortens because they slide past each other.',focus:sim=>foc(sim,'sarc'),speed:.3,setup(sim){BioLab.setValues(sim,{rate:30});}},
    {title:'ATP lets go and recocks',text:'A new ATP binds and the head lets go. Splitting that ATP recocks the head for another stroke. Without ATP there is no release, so ATP is used for letting go as well as for pulling.',focus:sim=>foc(sim,'low'),speed:.3},
    {title:'Signals add up',text:'Fire signals quickly and each twitch starts before the last one ends. Force climbs and smooths out into tetanus. Your muscles grade force this way, and also by recruiting more fibers.',focus:sim=>foc(sim,'tr'),speed:.5,setup(sim){BioLab.setValues(sim,{rate:80});}},
    {title:'Stop the signal',text:'When signals stop, the pump moves calcium back into the sarcoplasmic reticulum, which costs ATP too. Tropomyosin covers the sites again, and the muscle relaxes.',focus:sim=>foc(sim,'nerve'),speed:.4,setup(sim){BioLab.setValues(sim,{rate:0});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{rate:0});},
  challenges:[
    {lvl:'bio',q:'A contracting muscle runs completely out of ATP. What happens?',choices:['It stays locked and cannot relax','It goes limp right away','It keeps contracting normally','It relaxes, then contracts again'],correct:0,baseline:{scene:'sarc',rate:40,fiber:'fast'},change:{atpOn:false},changeText:'ATP removed',watch:'F',at:3,reveal:7,
     explain:{bio:'ATP is what makes a myosin head let go. Without it, the heads stay stuck to actin and the calcium pump stops too. Force stays locked in. This is rigor, the same thing that causes rigor mortis.'}},
    {lvl:'bio',q:'A fast twitch fiber works all out. What will its force look like after about 45 seconds?',choices:['It has fallen far below 100%','It is still at 100%','It has risen above 100%'],correct:0,baseline:{scene:'energy',fiber:'fast',effort:0},change:{effort:100},changeText:'All-out effort started',watch:'eF',at:1,reveal:16,
     explain:{bio:'Fast twitch fibers make ATP mostly without oxygen. It is quick, but it runs through creatine phosphate in seconds and builds up lactic acid. Force falls within tens of seconds, which is why nobody sprints for a full lap at top speed.'}},
    {lvl:'honors',q:'One signal gives a twitch. What happens to force if you raise the rate to 80 signals per second?',choices:['Force climbs well above one twitch and becomes nearly smooth','Force stays the same as one twitch, just more often','Force drops, because the muscle has no time to recover'],correct:0,baseline:{scene:'sarc',rate:2,fiber:'fast'},change:{rate:80},changeText:'Rate raised to 80 per second',watch:'F',at:3,reveal:8,
     explain:{honors:'Each new signal arrives before the last twitch has faded and adds to it. A single twitch reaches about a quarter of maximum, while tetanus reaches near maximum. The ripple almost disappears.'}},
    {lvl:'honors',q:'You stretch a sarcomere to 3.6 µm before it contracts, then stimulate it hard. How much force can it make?',choices:['Almost none','The most it can','About the same as at rest length'],correct:0,baseline:{scene:'sarc',rate:80,fiber:'fast',L0:2.2},change:{L0:3.6},changeText:'Stretched to 3.6 µm',watch:'lt',at:3,reveal:7,
     explain:{honors:'Force depends on how many heads can reach actin. At 3.6 µm the filaments barely overlap. Too short also loses force, so the peak sits in between, at about 2.0 to 2.25 µm in this classic curve.'}},
    {lvl:'ap',q:'Cut oxygen to a slow twitch fiber holding a moderate 30% effort. What happens over the next couple of minutes?',choices:['It relies on stored oxygen, then creatine phosphate, then anaerobic ATP, and fatigues','Nothing changes, because 30% is below its aerobic capacity','It stops immediately'],correct:0,baseline:{scene:'energy',fiber:'slow',effort:30},change:{o2:false},changeText:'Oxygen cut off',watch:'energy',at:2,reveal:55,
     explain:{ap:'With oxygen, 30% effort is easily aerobic. Without it, myoglobin’s small oxygen store lasts seconds, creatine phosphate lasts under a minute, and anaerobic ATP then builds lactic acid until force falls. This is why a sustained hard grip that squeezes off its own blood supply tires quickly.'}},
    {lvl:'ap',q:'At 20 signals per second, how do slow and fast twitch fibers compare?',choices:['The slow fiber is smoother and closer to its maximum, because its twitches last longer','The fast fiber is smoother, because it is quicker','Rate does not depend on fiber type'],correct:0,baseline:{scene:'sarc',rate:20,fiber:'fast'},change:{fiber:'slow'},changeText:'Switched to slow twitch',watch:'F',at:4,reveal:9,
     explain:{ap:'Slow fibers take about 80 ms to reach peak twitch force, so 50 ms signals overlap heavily. Fast fibers peak in about 30 ms and have mostly relaxed by the next signal, so they need a much higher rate to fuse.'}}
  ],
  lab:{bio:'<p><b>Question:</b> What does a muscle need in order to contract and relax?</p><ol><li>Press <b>Single nerve signal</b> and watch one twitch.</li><li>Turn off <b>Calcium released</b> and try again. Record the force.</li><li>Turn calcium back on and set the rate to 40. Then turn off <b>ATP available</b>. Record what happens to force.</li><li>Choose <b>Energy and fatigue</b>. Run <b>All out</b> with a fast twitch fiber, then press <b>Rest</b>. Then run it with a slow twitch fiber. Record when the burn starts and when fatigue starts.</li></ol><p><b>Write:</b> Explain what calcium does and what ATP does.</p>',
       honors:'<p><b>Question:</b> How do muscles control how hard they pull?</p><ol><li>Record force and force pattern at rates of 2, 10, 20, 40 and 80 signals per second for each fiber type.</li><li>Set the rate to 80. Record force at starting lengths of 1.6, 2.2, 2.8 and 3.4 µm. Open the length-tension graph.</li><li>Use your data to find the rate at which each fiber type starts to fuse.</li></ol><p><b>Write:</b> Explain why summation raises force, and why stretching a muscle too far lowers it.</p>',
       ap:'<p><b>Question:</b> Which ATP source limits performance at different efforts?</p><ol><li>In <b>Energy and fatigue</b>, reset and hold 25, 50, 75 and 100% effort for each fiber type. Record time to burn and to fatigue.</li><li>Open <b>Where ATP comes from</b>, and describe the order in which the sources step in.</li><li>Repeat 30% effort with oxygen off.</li></ol><p><b>Write (CER):</b> Why can a person hold a pace just below a threshold for a long time, but only seconds above it?</p>'},
  terms:[
    {t:'Sarcomere',d:'The repeating unit of a myofibril, from one Z disc to the next. It is the unit that shortens.'},
    {t:'Actin',d:'The protein of the thin filament.'},
    {t:'Myosin',d:'The protein of the thick filament. Its heads form cross-bridges with actin.'},
    {t:'Cross-bridge',d:'A myosin head attached to actin.'},
    {t:'Sliding filament model',d:'Filaments keep their length, and slide past each other as the sarcomere shortens.'},
    {t:'Twitch',d:'The brief contraction caused by one nerve signal.'},
    {t:'Tetanus',d:'A smooth, sustained contraction from signals that arrive too fast for relaxation. This is different from the disease tetanus.'},
    {t:'Slow twitch fiber',d:'Red, rich in myoglobin and mitochondria, aerobic, fatigue resistant.'},
    {t:'Fast twitch fiber',d:'White, low in myoglobin, powerful, anaerobic, fatigues fast.'},
    {t:'Myoglobin',d:'A protein that stores oxygen in muscle. It makes slow twitch fibers red.'},
    {t:'Fatigue',d:'A drop in force from a muscle, even though the same effort is being asked for.'},
    {t:'Rigor',d:'A locked state with myosin heads stuck to actin, caused by a lack of ATP.'},
    {t:'Tropomyosin and troponin',d:'Thin filament proteins. Tropomyosin covers actin’s binding sites until calcium binds troponin and moves it.',lvl:'honors'},
    {t:'Sarcoplasmic reticulum',d:'The fiber’s calcium store. It releases calcium on a signal and pumps it back in using ATP.',lvl:'honors'},
    {t:'Summation',d:'Twitches adding together because each signal arrives before the fiber has relaxed.',lvl:'honors'},
    {t:'Creatine phosphate',d:'A fast store that hands its phosphate to ADP to remake ATP. It lasts seconds at maximum effort.',lvl:'ap'}
  ],
  about:'<p><b>Sarcomere model.</b> Each signal gives a twitch with a rise time of about 30 ms (fast) or 80 ms (slow). Twitches add together, and force saturates: activation = 1 − e<sup>−x</sup>. A single twitch reaches about 25% of maximum. Force is activation times the classic length-tension curve (Gordon, Huxley and Julian, 1966, from frog fibers: plateau at 2.0 to 2.25 µm, zero at 3.65 µm). Human sarcomeres are a bit longer, with an optimum near 2.7 µm, but the shape is the same. The drawing has far fewer heads than a real filament, and they show the idea, not an exact count.</p>'+
    '<p><b>Energy model.</b> Stores are per kg of muscle: ATP about 7 mmol, creatine phosphate about 25 mmol. Aerobic supply ramps up over about 20 s, and it reaches about 1.7 mmol ATP/kg/s for slow fibers and 0.6 for fast. Anaerobic supply reaches 1.5 and 5. These are rounded values in the range reported for human muscle. Real muscles recruit slow fibers first, as this model does in Mixed. ATP in a living muscle never runs out completely, because force falls first and protects it, so the model stops ATP from falling below about 40% of its resting level. The Sarcomere view lets a sarcomere shorten by up to 0.2 µm against its load.</p>'+
    '<p><b>Simplifications your handout uses.</b> The handout’s 38 ATP per glucose is the textbook maximum, and real cells yield nearer 30 to 32. “The burn” as lactic acid is the classic explanation. Lactate itself is actually a fuel, and acidity and other metabolites contribute to the burn and to fatigue. Fast fibers still use some oxygen. The burn threshold of 12 mmol/kg here is a teaching mark, since feeling varies by person.</p>'+
    '<p><b>Virtual lab.</b> Bench times are built from typical values for this kind of classroom lab, with variation between partners and hands. They are not the output of the energy model, because a pinch or a book lift uses many fibers at changing effort.</p>',
  labs:[LAB]
};
BioLab.register(H);
})();
