(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;
/* ---------- Plant water model (shared by the Full lab and the virtual-lab bench) ----------
   Transpiration E = g·VPD/P, where g is the stomatal conductance (gs, plus a small cuticular gc) in series with
   the boundary-layer conductance gb, VPD = es(T)·(1 − RH) and P is air pressure. Units: g in mol m⁻² s⁻¹, E in mmol m⁻² s⁻¹.
   gs = gsmax·f(light)·f(ψleaf). gsmax grows with stomatal density. ψleaf = ψsoil − E·R (cohesion-tension: the xylem
   pulls water up against a hydraulic resistance R). Stomata close as ψleaf approaches −1 MPa. ψsoil falls steeply as
   the pot dries. gb rises with the square root of wind speed (forced convection) on top of a free-convection floor.
   The constants are tuned so a 70 g pansy loses about 8% of its mass a day in a dry classroom, a fan multiplies that by
   about 1.5 and a leaky humidity tent by about 0.9, matching RJ class data (2021–22). */
const MOD={gmax:0.002,   // mol m⁻² s⁻¹ per stoma per mm² (150 per mm² → gsmax 0.30)
  K:50,                  // µmol photons m⁻² s⁻¹ for half-open stomata
  night:0.08,            // share of gsmax still open in the dark
  gcut:0.004,            // cuticular conductance
  psi50:-1.0,            // MPa: leaf water potential that half-closes the stomata
  Rh:0.2,                // MPa per (mmol m⁻² s⁻¹): soil-to-leaf hydraulic resistance
  tau:0.3,               // h: how fast the stomata respond
  psA:0.012,psB:3,       // ψsoil = −psA·θ^(−psB), θ = share of the pot's available water left
  u0:0.03,               // m/s: slow drift of room air, even with no fan
  dEff:0.08,             // m: a small rosette acts like one wide leaf
  Asoil:0.006};          // m²: bare root-ball surface when it is not wrapped
const es=T=>0.6108*Math.exp(17.27*T/(T+237.3));
const gbOf=u=>0.05+0.147*Math.sqrt((Math.max(0,u)+MOD.u0)/MOD.dEff);
const DvC=(P,T)=>2.42e-5*(101.3/P)*Math.pow((T+273.15)/293.15,1.8)*(P*1000/(8.314*(T+273.15)));
const blMM=(u,P,T)=>1000*DvC(P,T)/gbOf(u);
const psiSoil=th=>Math.max(-3,-MOD.psA*Math.pow(Math.max(th,0.05),-MOD.psB));
const psiAir=(T,RH)=>8.314*(T+273.15)/18.05e-6/1e6*Math.log(clamp(RH,0.01,0.999));
function solve(o){const vpd=es(o.T)*(1-o.RH),gb=gbOf(o.u),ps=psiSoil(o.th),gmx=MOD.gmax*o.dens*(o.gsF||1),fL=Math.max(o.par/(o.par+MOD.K),MOD.night);
  let pL=Number.isFinite(o.pL)?o.pL:ps,gsT=0;
  for(let i=0;i<12;i++){const f=1/(1+Math.pow(Math.max(0,pL/MOD.psi50),6));gsT=gmx*fL*f;const g=1/(1/(gsT+MOD.gcut)+1/gb);pL=0.5*pL+0.5*(ps-g*vpd/o.P*1000*MOD.Rh);}
  return {vpd,gb,ps,gsT,gmx};}
/* one sub-step of h hours for one plant; pl holds {W,W0,gs,pL}. Returns the grams of water lost. */
function advance(pl,o,h){const r=solve(Object.assign({},o,{th:pl.W/pl.W0,pL:pl.pL}));
  if(!Number.isFinite(pl.gs))pl.gs=r.gsT;else pl.gs+=(r.gsT-pl.gs)*Math.min(1,h/MOD.tau);
  const g=1/(1/(pl.gs+MOD.gcut)+1/r.gb),E=g*r.vpd/o.P*1000;pl.pL=r.ps-E*MOD.Rh;pl.E=E;
  let Es=0;if(o.bare){const th=pl.W/pl.W0,gsu=0.3*th*th*th;Es=(1/(1/Math.max(gsu,1e-6)+1/r.gb))*r.vpd/o.P*1000;}pl.Es=Es;
  const loss=Math.min(pl.W,(E*o.A+Es*MOD.Asoil)*64.8*h);pl.W-=loss;pl.r=r;return loss;}
const r1=v=>Math.round(v*10)/10;
function hr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function hn(seed,a,b){const u=Math.max(1e-9,hr(seed,a,b)),w=hr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const LCD='700 VSIZEpx "Consolas","Menlo","DejaVu Sans Mono","Courier New",monospace';
function lcd(ctx,x,y,w,h,label,value,k,vs){ctx.fillStyle='#2b2f36';rr(ctx,x,y,w,h,10);ctx.fill();txt(ctx,label,x+12,y+8+12*k,{s:12*k,w:700,c:'#d7dbe0'});
  const sy=y+14+14*k,sh=h-sy+y-8;ctx.fillStyle='#cfe3c8';rr(ctx,x+10,sy,w-20,sh,5);ctx.fill();ctx.fillStyle='#1b2a1b';ctx.font=LCD.replace('VSIZE',String(vs));while(vs>10&&ctx.measureText(value).width>w-34){vs--;ctx.font=LCD.replace('VSIZE',String(vs));}ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(value,x+w-20,sy+sh/2+1);}

/* ---------- drawing: a pansy ---------- */
const LEAF='#3f8f3a',LEAF2='#2f7330',PET=['#6a3fb0','#8a52c8','#5a2f99'];
function pansy(ctx,x,y,sc,droop,ball,label,k,dark){// y = bottom of the root ball; ball: 'pack' | 'bare' | 'foil'
  const bw=64*sc,bh=50*sc,top=y-bh;
  if(ball==='pack'){ctx.fillStyle='#24262a';ctx.beginPath();ctx.moveTo(x-bw/2-4,top);ctx.lineTo(x+bw/2+4,top);ctx.lineTo(x+bw/2-4,y);ctx.lineTo(x-bw/2+4,y);ctx.closePath();ctx.fill();
    ctx.fillStyle='#5a3f28';ctx.fillRect(x-bw/2,top+2,bw,6);}
  else if(ball==='bare'){ctx.fillStyle='#6b4a2e';ctx.beginPath();ctx.ellipse(x,top+bh/2+2,bw/2,bh/2,0,0,6.2832);ctx.fill();
    ctx.strokeStyle='#e8dcc8';ctx.lineWidth=1.2;for(let i=0;i<7;i++){const a=-1.3+i*0.43;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*bw*0.28,top+bh*0.6+Math.sin(a)*bh*0.2);ctx.quadraticCurveTo(x+Math.cos(a)*bw*0.42,top+bh*0.8,x+Math.cos(a)*bw*0.47,top+bh*0.55+Math.sin(a)*bh*0.3);ctx.stroke();}}
  else{const g=ctx.createLinearGradient(x-bw/2,0,x+bw/2,0);g.addColorStop(0,'#9aa1a8');g.addColorStop(0.35,'#e9edf0');g.addColorStop(0.6,'#b9c0c6');g.addColorStop(1,'#8d949b');
    ctx.fillStyle=g;rr(ctx,x-bw/2,top,bw,bh+2,10*sc);ctx.fill();ctx.strokeStyle='rgba(80,86,92,.6)';ctx.lineWidth=1;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(x-bw/2+8+i*14*sc,top+4);ctx.lineTo(x-bw/2+14+i*13*sc,y-4);ctx.stroke();}}
  // leaves: a low rosette; droop (0..1) tips them down when the plant is short of water
  const n=9;for(let i=0;i<n;i++){const s=i/(n-1)*2-1,a=-Math.PI/2+s*(1.15+0.5*droop),L=(34+10*(1-Math.abs(s)))*sc,cx=x+Math.cos(a)*L*0.55,cy=top-4*sc+Math.sin(a)*L*0.55+droop*14*sc*Math.abs(s);
    ctx.save();ctx.translate(cx,cy);ctx.rotate(a+Math.PI/2+droop*0.5*s);ctx.fillStyle=i%2?LEAF:LEAF2;ctx.beginPath();ctx.ellipse(0,0,10*sc,L*0.5,0,0,6.2832);ctx.fill();
    ctx.strokeStyle='rgba(20,60,20,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-L*0.42);ctx.lineTo(0,L*0.42);ctx.stroke();ctx.restore();}
  // flowers
  [[-18,-52],[16,-60],[2,-38]].forEach((f,j)=>{const fx=x+f[0]*sc,fy=top+(f[1]+droop*10)*sc;ctx.fillStyle=PET[j];
    for(let q=0;q<5;q++){const a=q/5*6.2832-1.57;ctx.beginPath();ctx.ellipse(fx+Math.cos(a)*6*sc,fy+Math.sin(a)*6*sc,7*sc,6*sc,a,0,6.2832);ctx.fill();}
    ctx.fillStyle='#f2c230';ctx.beginPath();ctx.arc(fx,fy,3.4*sc,0,6.2832);ctx.fill();});
  if(label){ctx.font='700 '+(12*k)+'px '+FONT;const w=ctx.measureText(label).width+10;ctx.fillStyle='#fbf8ee';ctx.fillRect(x-w/2,top+bh*0.5-8*k,w,16*k);ctx.strokeStyle='#c9bf9e';ctx.lineWidth=1;ctx.strokeRect(x-w/2,top+bh*0.5-8*k,w,16*k);
    txt(ctx,label,x,top+bh*0.5+1,{s:12*k,w:700,c:'#2b2b2b',a:'center',b:'middle'});}}
function fanDraw(ctx,x,y,r,ang,on){ctx.fillStyle='#4a4f57';ctx.fillRect(x-4,y,8,394-y);rr(ctx,x-26,384,52,10,4);ctx.fill();
  ctx.strokeStyle='#4a4f57';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.stroke();
  ctx.fillStyle=on?'rgba(120,170,220,.85)':'#9aa3ab';for(let i=0;i<3;i++){const a=ang+i*2.094;ctx.beginPath();ctx.ellipse(x+Math.cos(a)*r*0.48,y+Math.sin(a)*r*0.48,r*0.46,r*0.2,a,0,6.2832);ctx.fill();}
  ctx.fillStyle='#2b2f36';ctx.beginPath();ctx.arc(x,y,5,0,6.2832);ctx.fill();}

/* ---------- Virtual lab bench: pansy mass lab (RJ handout, Powell) ----------
   Three foil-wrapped pansies on a balance that reads to 0.1 g. Each plant runs the same water model as the Full lab,
   hour by hour, in its own environment (room, humidity tent, fan), with classroom lights on 7:00 to 16:00.
   The class data sheet is six other groups' plants, run through the same model from the lab's saved seed. */
const PM={names:['Control','Humidity','Wind'],env:['Room (control)','Humidity tent','Fan (wind)'],col:['ctl','hum','wnd'],X:[100,282,550],BX:705,D:6,P:82};
const pmV=sim=>sim&&sim.vlab&&sim.vlab.lab&&sim.vlab.lab.id==='pansy-mass'?sim.vlab:null;
const pmB=sim=>sim&&sim.st&&sim.st.B&&sim.st.B.kind==='pm'?sim.st.B:null;
function pmPlant(seed,g,i){const Mb=clamp(70+7*hn(seed,300+g,i),56,84),s=Mb/70;
  return {Mb,foil:1.3+0.3*hr(seed,310+g,i),A:0.0032*s*Math.exp(0.05*hn(seed,320+g,i)),W0:34*s*Math.exp(0.06*hn(seed,330+g,i)),gsF:Math.exp(0.05*hn(seed,340+g,i))};}
function pmRoom(seed,g){return {T:21.1+0.35*hn(seed,400,g),RH:clamp(0.25+0.025*hn(seed,401,g),0.2,0.3),tent:0.09+0.04*hr(seed,402,g),fan:2.2+0.6*hr(seed,403,g)};}
function pmCond(seed,g,R,i,day){const rh=clamp(R.RH+0.015*hn(seed,410+g,day),0.18,0.32);
  return i===1?{T:R.T+0.5,RH:rh+R.tent,u:0}:i===2?{T:R.T,RH:rh,u:R.fan}:{T:R.T,RH:rh,u:0};}
/* classroom light at hour h after Day 1, 8:00 am (µmol photons m⁻² s⁻¹) */
function pmPar(h){const c=((8+h)%24+24)%24;return c>=7&&c<16?90:(c>=16&&c<17.5)||(c>=6.5&&c<7)?25:0;}
function pmRun(seed,g,i,P,R,pl,h0,h1,bare){let h=h0;while(h<h1-1e-9){const d=Math.min(0.25,h1-h),c=pmCond(seed,g,R,i,Math.floor(h/24+1e-9));
  pl.M-=advance(pl,{par:pmPar(h),T:c.T,RH:c.RH,u:c.u,P:PM.P,dens:150,gsF:P.gsF,A:P.A,bare},d);h+=d;}}
const pmCache={};
function pmClass(seed){if(pmCache[seed])return pmCache[seed];const mine=1+Math.floor(hr(seed,500,0)*7),gone=Math.floor(hr(seed,501,0)*6),groups=[];let gi=0;
  for(let n=1;n<=7;n++){if(n===mine)continue;gi++;const R=pmRoom(seed,gi),m=[];
    for(let i=0;i<3;i++){if(i===2&&gi-1===gone){m.push(null);continue;}const P=pmPlant(seed,gi,i),pl={M:P.Mb+P.foil,W:P.W0,W0:P.W0};
      const d1=r1(pl.M+0.04*hn(seed,520+gi,i));pmRun(seed,gi,i,P,R,pl,0,72,false);m.push([d1,r1(pl.M+0.04*hn(seed,530+gi,i))]);}
    groups.push({n,m});}
  const D={mine,groups,gone:groups[gone].n,sum:[0,1,2].map(i=>{const L=groups.map(g=>g.m[i]).filter(Boolean);return {n:L.length,i:L.reduce((a,x)=>a+x[0],0),f:L.reduce((a,x)=>a+x[1],0)};})};
  pmCache[seed]=D;return D;}
function pmInit(sim){const V=sim.vlab,b=V.bench,seed=V.seed;
  if(!b.v){b.v=1;b.unpacked=false;b.wrap=[false,false,false];b.labeled=false;b.placed=false;b.day=1;b.clock=0;b.target=0;b.onBal=-1;b.disp=0;b.watt=0;b.bare=[0,0,0];
    b.rd=[0,1,2].map(()=>[[],[],[],[]]);b.pl=[0,1,2].map(i=>{const P=pmPlant(seed,0,i);return {M:P.Mb,W:P.W0,W0:P.W0};});
    let d=new Date();d.setHours(8,0,0,0);b.start=d.getTime();}
  return {kind:'pm',fan:0,puffs:[]};}
const pmAdv=b=>b.clock<b.target-1e-9;
function pmStep(sim,ds){const b=sim.vlab.bench,B=pmB(sim);if(!B||!pmAdv(b))return;const seed=sim.vlab.seed,R=pmRoom(seed,0);
  const h=Math.min(ds,b.target-b.clock);
  for(let i=0;i<3;i++){const P=pmPlant(seed,0,i);pmRun(seed,0,i,P,R,b.pl[i],b.clock,b.clock+h,!b.wrap[i]);if(!b.wrap[i])b.bare[i]+=h;}
  b.clock+=h;if(!pmAdv(b)){b.clock=b.target;b.day=Math.round(b.target/24)+1;}}
function pmDate(b,day){try{return new Date(b.start+(day-1)*86400000).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});}catch(e){return 'Day '+day;}}
function pmClockText(b){const c=((8+b.clock)%24+24)%24,hh=Math.floor(c),mm=Math.floor((c-hh)*60/5)*5,ap=hh<12?'am':'pm',h12=hh%12===0?12:hh%12;return h12+':'+String(mm).padStart(2,'0')+' '+ap;}
const pmToday=b=>Math.min(4,Math.floor(b.clock/24+1e-6)+1);
const pmWeighed=(b,d)=>[0,1,2].every(i=>b.rd[i][d-1].length>0);
function pmRead(sim,i){const b=sim.vlab.bench;b.watt=(b.watt||0)+1;return r1(b.pl[i].M+0.04*hn(sim.vlab.seed,600+i,b.watt));}

/* --- checks: masses against the balance; calculations against the student's own entries (never the answer) --- */
const PN=PM.names;
function pmMassCheck(i){return (sim,rv,v)=>{const b=sim.vlab.bench,d=+rv,L=(b.rd&&b.rd[i]&&b.rd[i][d-1])||[];
  if(!L.length)return 'Weigh the '+PN[i]+' plant on Day '+d+' first, then type the balance reading.';
  if(L.some(x=>Math.abs(x-v)<0.051))return null;
  if(L.some(x=>Math.abs(x-v*10)<0.051||Math.abs(x-v/10)<0.051))return 'Check the decimal point: the balance reads to 0.1 g.';
  return 'That does not match the balance reading for the '+PN[i]+' plant on Day '+d+'. Read the balance again.';};}
const own=(V,i,row)=>V.val('t1',PM.col[i],row);
function pmChgCheck(sim,rv,v){const V=sim.vlab,i=PN.indexOf(rv),a=own(V,i,0),f=own(V,i,3);if(i<0)return null;
  if(!Number.isFinite(a)||!Number.isFinite(f))return 'Fill in the Day 1 and Day 4 masses for the '+rv+' plant in Table 1 first.';
  const c=f-a;if(Math.abs(v-c)<0.051)return null;if(Math.abs(v+c)<0.051)return 'Change in mass = final − initial. The plant lost mass, so the change is negative.';
  return 'Check your subtraction: Day 4 (final) mass − Day 1 (initial) mass for the '+rv+' plant.';}
function pctMsg(v,p,what){if(Math.abs(v-p)<=0.15)return null;if(Math.abs(v-p/100)<=0.0016)return 'That is a fraction. Multiply by 100 to make it a percent.';
  if(Math.abs(v+p)<=0.15)return 'The mass went down, so the percent change is negative.';return 'Check your calculation: '+what+'.';}
function pmPctCheck(sim,rv,v){const V=sim.vlab,i=PN.indexOf(rv),a=own(V,i,0),f=own(V,i,3);if(i<0)return null;
  if(!Number.isFinite(a)||!Number.isFinite(f)||a<=0)return 'Fill in the Day 1 and Day 4 masses for the '+rv+' plant in Table 1 first.';
  return pctMsg(v,100*(f-a)/a,'% change = (final − initial) ÷ initial × 100');}
function t2Check(f){return (sim,rv,v)=>{const V=sim.vlab,i=PN.indexOf(rv);if(i<0)return null;const C=pmClass(sim.vlab.seed).sum[i],g=c=>V.val('t2',c,i);
  if(f==='n'){if(v===C.n+1)return null;if(v===C.n)return 'Count your own group’s '+rv+' plant too.';return 'Count every '+rv+' plant: the ones on the class data sheet and your own group’s.';}
  if(f==='ti'||f==='tf'){const mine=own(V,i,f==='ti'?0:3),other=f==='ti'?C.i:C.f,day=f==='ti'?'Day 1':'Day 4';
    if(!Number.isFinite(mine))return 'Fill in your own '+day+' mass for the '+rv+' plant in Table 1 first.';
    if(Math.abs(v-(other+mine))<=0.15)return null;if(Math.abs(v-other)<=0.15)return 'Add your own group’s '+day+' mass to the class total.';
    return 'Add the '+day+' masses of every '+rv+' plant: the class data sheet and your own Table 1.';}
  if(f==='ai'||f==='af'){const t=g(f==='ai'?'ti':'tf'),n=g('n');if(!Number.isFinite(t)||!Number.isFinite(n)||n<=0)return 'Fill in the number of plants and the total '+(f==='ai'?'initial':'final')+' mass first.';
    return Math.abs(v-t/n)<=0.06?null:'Average mass = total mass ÷ number of plants. Check your division.';}
  if(f==='dch'){const a=g('ai'),b=g('af');if(!Number.isFinite(a)||!Number.isFinite(b))return 'Fill in the average initial and final masses first.';
    if(Math.abs(v-(b-a))<=0.06)return null;if(Math.abs(v+(b-a))<=0.06)return 'Change = average final − average initial. The plants lost mass, so it is negative.';return 'Check your subtraction: average final mass − average initial mass.';}
  if(f==='pct'){const a=g('ai'),b=g('af');if(!Number.isFinite(a)||!Number.isFinite(b)||a<=0)return 'Fill in the average initial and final masses first.';
    return pctMsg(v,100*(b-a)/a,'average % change = 100 × (average final − average initial) ÷ average initial');}
  return null;};}

/* --- bench drawing --- */
function benchBase(ctx){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,394,800,56);ctx.fillStyle=PAL['line'];ctx.fillRect(0,394,800,2);}
function drawPM(sim,ctx,vdt,k,t){const b=sim.vlab.bench,B=pmB(sim),p=sim.p,seed=sim.vlab.seed;
  if(p.tView==='sheet'){drawSheet(sim,ctx,k);return;}if(p.tView==='graph2'){drawG2(sim,ctx,k);return;}
  benchBase(ctx);const R=pmRoom(seed,0),day=pmToday(b),cond=pmCond(seed,0,R,0,Math.min(3,Math.floor(b.clock/24))),adv=pmAdv(b);
  // header and room thermo-hygrometer
  const cal=Math.floor((8+b.clock)/24+1e-9)+1;txt(ctx,(adv?'Waiting for Day '+(b.day+1):'Day '+day+' of 4')+' · '+pmDate(b,cal)+' · '+pmClockText(b),16,14+16*k,{s:Math.min(16*k,24),w:700});
  lcd(ctx,600,8,192,30+30*k,'ROOM AIR',(cond.T).toFixed(1)+' °C  '+Math.round(cond.RH*100)+'%',k,Math.round(20*k));
  // the three stations
  const lab=b.labeled,ball=i=>!b.unpacked?'pack':b.wrap[i]?'foil':'bare';
  if(b.placed){// humidity tent frame and fan go up when the plants are placed
    const tx=PM.X[1];ctx.fillStyle='rgba(190,225,245,.22)';ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx-82,394);ctx.lineTo(tx-82,250);ctx.quadraticCurveTo(tx,176,tx+82,250);ctx.lineTo(tx+82,394);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(120,170,210,.55)';for(let q=0;q<14;q++){const a=hr(7,q,1),c=hr(7,q,2);ctx.beginPath();ctx.ellipse(tx-70+a*140,240+c*120,1.6,2.4,0,0,6.2832);ctx.fill();}
    ctx.fillStyle='rgba(90,140,200,.35)';rr(ctx,tx-60,382,120,10,3);ctx.fill();
    B.fan=(B.fan+(RM?2:9)*vdt)%6.2832;fanDraw(ctx,430,300,32,B.fan,true);
    if(!RM){ctx.strokeStyle='rgba(120,170,220,.55)';ctx.lineWidth=2;for(let q=0;q<4;q++){const ph=((t*1.6+q*0.25)%1);ctx.beginPath();ctx.moveTo(466+ph*14,276+q*12);ctx.lineTo(478+ph*14,276+q*12);ctx.stroke();}}}
  for(let i=0;i<3;i++){if(b.onBal===i)continue;const pl=b.pl[i],dr=clamp((-pl.pL-0.7)/0.6,0,1)||0;
    pansy(ctx,PM.X[i],392,1.15,dr,ball(i),lab?PN[i]:String(i+1),k);
    if(sim.p.tPlant===i&&!adv){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.setLineDash([6,4]);rr(ctx,PM.X[i]-70,196,140,202,10);ctx.stroke();ctx.setLineDash([]);}}
  for(let i=0;i<3;i++)txt(ctx,b.placed?PM.env[i]:(b.labeled?PN[i]:'Plant '+(i+1)),PM.X[i],412+12*k,{s:12*k,w:600,a:'center'});
  if(b.placed)pill(ctx,'Tent '+Math.round(Math.min(0.99,pmCond(seed,0,R,1,0).RH)*100)+'% RH',PM.X[1],204,PAL['card'],PAL['cv-ink'],12*k);
  // balance
  const bx=PM.BX;ctx.fillStyle='#d9dde2';rr(ctx,bx-75,328,150,66,8);ctx.fill();ctx.fillStyle='#b5bcc4';rr(ctx,bx-62,318,124,12,4);ctx.fill();
  lcd(ctx,bx-66,340,132,52,'g',b.onBal>=0?b.disp.toFixed(1):'0.0',0.8,26);
  if(b.onBal>=0){const i=b.onBal;pansy(ctx,bx,318,1.05,clamp((-b.pl[i].pL-0.7)/0.6,0,1)||0,ball(i),lab?PN[i]:String(i+1),k);}
  txt(ctx,'Balance (0.1 g)',bx,412+12*k,{s:12*k,w:600,a:'center'});
  // night and time passing
  if(adv){const par=pmPar(b.clock);if(par<90){ctx.fillStyle='rgba(10,18,40,'+(par>0?0.2:0.42)+')';ctx.fillRect(0,0,800,394);}
    pill(ctx,par>0?'Time passing · lights on':'Time passing · night, lights off',400,150,PAL['rj'],'#fff',14*k);}}
function drawSheet(sim,ctx,k){const D=pmClass(sim.vlab.seed);ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,450);
  const s=Math.max(12*k,13);txt(ctx,'Class data sheet: pansy masses (g), all sections',16,10+s*1.2,{s:s*1.15,w:700});
  const cx=[16,150,250,365,465,580,680],L=['Group','Day 1','Day 4','Day 1','Day 4','Day 1','Day 4'],y0=26+s*2.6,rh=s*1.75;
  [['Control',200],['Humidity',415],['Wind',630]].forEach(([n,x])=>txt(ctx,n,x,y0,{s,w:700,a:'center'}));
  L.forEach((l,j)=>txt(ctx,l,j?cx[j]+40:cx[j],y0+rh,{s,w:600,c:PAL['cv-soft'],a:j?'center':'left'}));
  ctx.fillStyle=PAL['line'];ctx.fillRect(12,y0+rh+s*0.5,776,2);[140,355,570].forEach(x=>ctx.fillRect(x,y0-s,1.5,rh*(D.groups.length+1.4)+s));
  D.groups.forEach((g,r)=>{const y=y0+rh*(r+2);if(r%2){ctx.fillStyle=PAL['card2'];ctx.fillRect(12,y-s*1.15,776,rh);}
    txt(ctx,'Group '+g.n,cx[0],y,{s});g.m.forEach((m,i)=>{if(!m){txt(ctx,'no plant',(cx[1+2*i]+cx[2+2*i])/2+40,y,{s,c:PAL['cv-soft'],a:'center'});return;}
      txt(ctx,m[0].toFixed(1),cx[1+2*i]+40,y,{s,a:'center'});txt(ctx,m[1].toFixed(1),cx[2+2*i]+40,y,{s,a:'center'});});});
  const yb=y0+rh*(D.groups.length+2)+4;
  txt(ctx,'You are Group '+D.mine+'. Add your own three plants from Table 1.',16,yb,{s,w:700,c:PAL['rj']});
  txt(ctx,'Group '+D.gone+'’s wind plant was knocked off the fan stand on Day 2, so it has no data.',16,yb+rh,{s,c:PAL['cv-soft']});}
function drawG2(sim,ctx,k){const V=sim.vlab,vals=V.col('t2','pct');ctx.fillStyle=PAL['card'];ctx.fillRect(0,0,800,450);
  const s=Math.max(12*k,13);txt(ctx,'Graph 2: Mean % change in mass by condition (class data)',400,10+s*1.2,{s:s*1.1,w:700,a:'center'});
  const L=40+s*3.6,T=30+s*2.6,Wd=800-L-24,H=450-T-24-s*3.2,fin=vals.filter(Number.isFinite);
  let lo=Math.min(0,...fin),hi=Math.max(0,...fin);if(!fin.length){lo=-40;hi=0;}const span=Math.max(5,hi-lo),step=span>60?20:span>25?10:5;
  lo=Math.floor((lo-span*0.1)/step)*step;hi=Math.ceil((hi+(hi>0?span*0.1:0))/step)*step;if(hi-lo<step)hi=lo+step;
  const Y=v=>T+(hi-v)/(hi-lo)*H;ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;
  for(let v=lo;v<=hi+1e-9;v+=step){const y=Math.round(Y(v))+.5;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(L+Wd,y);ctx.stroke();txt(ctx,String(v),L-8,y,{s,c:PAL['g-axis'],a:'right',b:'middle'});}
  ctx.strokeStyle=PAL['g-axis'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(L,T);ctx.lineTo(L,T+H);ctx.stroke();ctx.beginPath();ctx.moveTo(L,Y(0));ctx.lineTo(L+Wd,Y(0));ctx.stroke();
  const cw=Wd/3;PN.forEach((n,i)=>{const cxx=L+cw*(i+0.5);txt(ctx,n,cxx,T+H+s*1.3,{s,w:600,a:'center',c:PAL['g-axis']});const v=vals[i];if(!Number.isFinite(v))return;
    const y0=Y(0),y1=Y(clamp(v,lo,hi));ctx.fillStyle=PAL[['s2','s3','s4'][i]];ctx.fillRect(cxx-cw*0.3,Math.min(y0,y1),cw*0.6,Math.abs(y1-y0));
    const lab=(Math.round(v*10)/10).toFixed(1)+'%',inside=Math.abs(y1-y0)>s*1.8;txt(ctx,lab,cxx,v<0?(inside?y1-s*0.5:y1+s*1.1):(inside?y1+s*1.2:y1-6),{s,w:700,a:'center',c:inside?'#fff':PAL['fg']});});
  txt(ctx,'Condition',L+Wd/2,450-s*0.6,{s,c:PAL['muted'],a:'center'});
  ctx.save();ctx.translate(14+s*0.4,T+H/2);ctx.rotate(-Math.PI/2);txt(ctx,'Mean % change in mass',0,0,{s,c:PAL['muted'],a:'center',b:'middle'});ctx.restore();
  if(!fin.length)txt(ctx,'Fill in the Average % change column of Table 2, and your bars draw here.',L+Wd/2,T+H/2,{s,c:PAL['muted'],a:'center',b:'middle'});}
function pmNarrate(sim){const b=sim.vlab.bench,p=sim.p,lab=i=>b.labeled?'the '+PN[i]+' plant':'plant '+(i+1),bare=[0,1,2].filter(i=>b.unpacked&&!b.wrap[i]);
  if(p.tView==='sheet')return 'The class data sheet lists every other group’s plants on Day 1 and Day 4. <b>Add your own group’s three plants</b> when you total each condition in Table 2.';
  if(p.tView==='graph2')return 'Graph 2 draws from the Average % change column of your Table 2. The longer the bar, the larger the share of its mass a plant lost.';
  if(!b.unpacked)return 'Three pansies sit on the bench in their plastic packaging, with three pieces of aluminum foil, tape for labels and a balance that reads to 0.1 g.';
  if(pmAdv(b)){const par=pmPar(b.clock);return par>0?'<b>Daytime.</b> The lights are on, so the stomata are open and the leaves lose water vapor. The fan thins the still air around the leaves of the Wind plant.':'<b>Night.</b> With the lights off, most stomata close, so the plants lose water much more slowly.';}
  if(b.onBal>=0){const i=b.onBal;return 'The '+(b.labeled?PN[i]+' plant':'plant '+(i+1))+' is on the balance. Read the display to 0.1 g and type it in Table 1.'+(!b.wrap[i]?' Its root ball is bare, so the reading includes water lost from the soil.':'');}
  if(bare.length&&!b.placed)return '<b>'+bare.map(i=>(b.labeled?PN[i]:'Plant '+(i+1))).join(', ')+(bare.length>1?' have bare root balls.':' has a bare root ball.')+'</b> Water also evaporates from bare soil, and the balance cannot tell that water from the water the leaves transpired.';
  if(bare.length&&b.day>1)return '<b>'+bare.map(i=>PN[i]).join(' and ')+(bare.length>1?' were':' was')+' not wrapped.</b> '+(bare.length>1?'Their':'Its')+' mass loss includes water that evaporated from the soil, so it overstates transpiration. Note this in your observations.';
  if(!b.placed)return b.labeled?'Weigh each wrapped plant and record its mass and the date. Then place each one in its environment.':'Wrap each root ball tightly in foil, then label the plants Control, Humidity and Wind.';
  const d=pmToday(b);if(!pmWeighed(b,d))return '<b>Day '+d+'.</b> Take each plant out of its environment, weigh it, record its mass and the date, and put it back.';
  return d<4?'<b>Day '+d+' is recorded.</b> The plants sit in the room air, the humidity tent and the fan’s wind. Let one day pass.':'<b>Day 4 is recorded.</b> Work out the change and the percent change for each plant in Table 1.';}

/* --- the lab, from Mr. Powell’s handout --- */
const pmb=sim=>sim.vlab.bench;
const filled=(sim,row)=>PM.col.every(c=>sim.vlab.raw('c:t1:'+c+':'+row).trim()!=='');
function dayStep(d){return {title:'Day '+d+': weigh the plants',controls:['tPlant','t-day','t-weigh','t-return'],setup(sim){BioLab.setValues(sim,{tView:'bench'});},
  text:'<p><b>Day '+d+'.</b> Press <b>Let one day pass</b>. Then remove each plant from its environment, weigh it, and record its mass and the date in Table 1 (Day '+d+'). '+(d<4?'Return each plant to its environment.':'This is the last weighing.')+'</p>',
  done:sim=>{const b=pmb(sim);return b.day>=d&&pmWeighed(b,d)&&filled(sim,d-1)&&(d===4||b.onBal<0);},
  doneHint:sim=>{const b=pmb(sim);if(b.day<d){if(b.onBal>=0)return 'Return the plant on the balance to its environment first.';if(!pmWeighed(b,b.day))return 'Weigh all three plants on Day '+b.day+' first.';return pmAdv(b)?'A day is passing. Press <b>Play</b> if the clock is paused.':'Press <b>Let one day pass</b>.';}
    const w=[0,1,2].filter(i=>!b.rd[i][d-1].length);if(w.length)return 'Weigh the '+PN[w[0]]+' plant: choose it under <b>Plant</b>, then press <b>Put it on the balance</b>.';
    if(!filled(sim,d-1))return 'Type the Day '+d+' masses in Table 1.';return 'Press <b>Return it to its environment</b>.';}};}
const LAB_PM={id:'pansy-mass',title:'Transpiration Lab: Wind, Humidity and Water Loss',course:'AP Biology and Honors Biology',teachers:'Powell',
  source:{label:'Transpiration lab fill in & directions 21-22 A.docx',href:'https://rjhs.instructure.com/courses/16705/assignments/604565'},level:'honors',
  purpose:'<p>Transpiration is the evaporation of water from the pores (stomata) in leaves. In this lab you determine how much water a plant loses under wind and under humidity, compared with a control. You weigh each plant before, during and after its exposure. The loss of mass is assumed to be water lost by transpiration.</p><p>Your class shares its data across sections, so you will also analyze the class averages. Do your own work.</p>',
  background:'<p>Water enters a plant’s roots, travels up the xylem and evaporates from the moist cells inside the leaf. The water vapor diffuses out through the stomata into the air. Each stoma is a pore between two guard cells, which open it in the light and close it when the plant runs short of water.</p><p>Water vapor moves from where there is more of it (the air spaces inside the leaf, nearly 100% humidity) to where there is less (the room). Drier air pulls water out faster. Right next to the leaf is a thin layer of still, humid air, the <b>boundary layer</b>. Wind thins it, so vapor escapes faster.</p>'+
    '<p><b>About the virtual bench.</b> Each plant runs a model of a real pansy, hour by hour. Its transpiration rate depends on how open its stomata are, the boundary layer around its leaves and how dry the air is (the vapor pressure deficit). The classroom is at about 21 °C and 20 to 30% relative humidity, which is normal for a heated room in Colorado in the fall, and the lights are on from 7:00 am to 4:00 pm. The humidity tent is a loose plastic tent, so it only raises the humidity by about 9 to 13 points. The fan blows at about 2 to 3 m/s. Stomata close most of the way at night and partly close as the soil dries. The balance reads to 0.1 g. Every plant differs a little in size and leaves, so your numbers are your own. The model leaves out growth, which adds well under 1% of the mass in four days. A day passes in a few seconds at 1× speed.</p>',
  materials:['3 plants (pansies)','3 pieces of aluminum foil','1 scale (a balance that reads to 0.1 g)','Labels (tape)','Environments set up by your teacher: control (the room), humidity (a plastic tent) and wind (a fan)'],
  hypothesis:{prompt:'<p>Write your hypothesis: how will wind and humidity affect the amount of water a plant loses by transpiration, compared with the control? Give your reasoning.</p>'},
  setup(sim){BioLab.refresh(sim);},
  controls:[],
  steps:[
    {title:'Get your materials',text:'<p>Get 3 plants, 3 pieces of aluminum foil and the scale. The plants are still in their plastic packaging.</p><p>You will weigh each plant today (Day 1) and on Days 2, 3 and 4, and record every mass in Table 1. At 1× speed, a day on the bench passes in about 4 seconds. Use Speed to change that.</p>'},
    {title:'Remove the packaging',text:'<p>Remove the plants from their plastic packaging.</p>',controls:['t-unpack'],done:sim=>!!pmb(sim).unpacked,doneHint:'Press <b>Remove the plants from the packaging</b>.'},
    {title:'Wrap the root balls',text:'<p>Tightly wrap each plant’s root ball in a piece of aluminum foil. Wrap the <b>whole</b> root ball, or water evaporating from the soil will affect your results.</p><p>Choose a plant under <b>Plant</b>, then press <b>Wrap this root ball in foil</b>. Do this for all three.</p>',controls:['tPlant','t-wrap']},
    {title:'Label the plants',text:'<p>Label the plants with tape, as your instructor directs: <b>Control</b>, <b>Humidity</b> and <b>Wind</b>.</p>',controls:['tPlant','t-wrap','t-label'],done:sim=>!!pmb(sim).labeled,doneHint:'Press <b>Label the plants</b>.'},
    {title:'Day 1: weigh the plants',text:'<p>Weigh each wrapped plant. Record its mass and the date in Table 1 (Day 1).</p><p>Choose a plant under <b>Plant</b>, press <b>Put it on the balance</b>, read the display, then press <b>Return it</b> before you weigh the next one.</p>',controls:['tPlant','t-weigh','t-return'],
     done:sim=>pmWeighed(pmb(sim),1)&&filled(sim,0),doneHint:sim=>{const b=pmb(sim),w=[0,1,2].filter(i=>!b.rd[i][0].length);return w.length?'Weigh the '+PN[w[0]]+' plant: choose it under <b>Plant</b>, then press <b>Put it on the balance</b>.':'Type the Day 1 masses in Table 1.';}},
    {title:'Place the plants',text:'<p>Place each plant in its environment: the Control plant in the room, the Humidity plant in the humidity tent, and the Wind plant in front of the fan.</p>',controls:['t-place'],done:sim=>!!pmb(sim).placed,doneHint:'Press <b>Place each plant in its environment</b>.'},
    {title:'Write your hypothesis',text:'<p>Write your hypothesis in the Hypothesis box below the bench.</p>',done:sim=>sim.vlab.raw('hyp').trim()!=='',doneHint:'Type your hypothesis in the Hypothesis box.'},
    dayStep(2),dayStep(3),dayStep(4),
    {title:'Change in mass',text:'<p>Last day. In the second part of Table 1, work out each plant’s change in mass (final − initial) and its percent change in mass ((final − initial) ÷ initial × 100).</p><p>In Observations, describe how the plants looked and whether every root ball stayed wrapped.</p>'},
    {title:'Class data',text:'<p>Choose <b>Class data</b> under <b>Bench view</b> to see the other groups’ masses. Fill in Table 2 for each condition. Include your own group’s plant in every count, total and average.</p>',controls:['tView'],setup(sim){BioLab.setValues(sim,{tView:'sheet'});}},
    {title:'Graph 1',text:'<p>Graph 1 is a line graph of the daily mass of each of your group’s plants. It draws below the bench from Table 1, one line for each condition.</p>',controls:['tView']},
    {title:'Graph 2',text:'<p>Graph 2 is a bar graph of the mean percent change in mass for each condition, using the class data. Choose <b>Graph 2</b> under <b>Bench view</b>: it draws from the Average % change column of Table 2.</p>',controls:['tView'],setup(sim){BioLab.setValues(sim,{tView:'graph2'});}},
    {title:'Analysis',text:'<p>Use the class averages to answer the analysis questions below the bench. Then write your conclusion and turn in your lab.</p>',controls:['tView']}],
  tables:[
    {id:'t1',title:'Table 1: Individual data (your group’s plants)',cols:[{id:'day',label:'Day',rows:[1,2,3,4],rowLabels:['Day 1 (initial)','Day 2','Day 3','Day 4 (final)']},
      {id:'date',label:'Date',input:'text'},
      {id:'ctl',label:'Control mass (g)',input:'number',dp:1,check:pmMassCheck(0)},{id:'hum',label:'Humidity mass (g)',input:'number',dp:1,check:pmMassCheck(1)},{id:'wnd',label:'Wind mass (g)',input:'number',dp:1,check:pmMassCheck(2)}]},
    {id:'t1b',title:'Table 1 (continued): Change in mass',cols:[{id:'cond',label:'Condition',rows:PN},
      {id:'chg',label:'Change in mass (g): final − initial',input:'number',dp:1,check:pmChgCheck},{id:'pct',label:'% change in mass: (final − initial) ÷ initial × 100',input:'number',dp:1,check:pmPctCheck}]},
    {id:'t2',title:'Table 2: Overall data (class data, with your group)',cols:[{id:'cond',label:'Condition',rows:PN},
      {id:'n',label:'Number of plants',input:'number',dp:0,check:t2Check('n')},{id:'ti',label:'Total mass, initial (g)',input:'number',dp:1,check:t2Check('ti')},{id:'ai',label:'Average mass, initial (g)',input:'number',dp:1,check:t2Check('ai')},
      {id:'tf',label:'Total mass, final (g)',input:'number',dp:1,check:t2Check('tf')},{id:'af',label:'Average mass, final (g)',input:'number',dp:1,check:t2Check('af')},
      {id:'dch',label:'Change in average mass (g)',input:'number',dp:1,check:t2Check('dch')},{id:'pct',label:'Average % change: 100 × (avg final − avg initial) ÷ avg initial',input:'number',dp:1,check:t2Check('pct')}]}],
  observations:[{id:'look',label:'How did each plant look on Day 4? (leaves firm or wilting, soil, anything else)'},{id:'wrap',label:'Were all three root balls wrapped the whole time? If any soil was bare, explain how that changes what your mass loss measures.'}],
  graph:{type:'line',title:'Graph 1: Daily mass of each plant (group data)',xl:'Day',yl:'Mass (g)',xmin:0,xmax:5,
    series:[{table:'t1',x:'day',y:'ctl',label:'Control'},{table:'t1',x:'day',y:'hum',label:'Humidity'},{table:'t1',x:'day',y:'wnd',label:'Wind'}]},
  /* Graph 2 for an engine that supports several graphs per lab; today it draws on the bench (Bench view: Graph 2) */
  graphs:[{type:'line',title:'Graph 1: Daily mass of each plant (group data)',xl:'Day',yl:'Mass (g)',xmin:0,xmax:5,series:[{table:'t1',x:'day',y:'ctl',label:'Control'},{table:'t1',x:'day',y:'hum',label:'Humidity'},{table:'t1',x:'day',y:'wnd',label:'Wind'}]},
    {type:'bar',title:'Graph 2: Mean % change in mass by condition (class data)',xl:'Condition',yl:'Mean % change in mass',series:[{table:'t2',x:'cond',y:'pct',label:'Mean % change'}]}],
  questions:[
    {id:'q1',n:'1',q:'<p>Use the class averages. Which condition led to the greatest water loss? Suggest a reason why.</p>'},
    {id:'q2',n:'2',q:'<p>Which condition led to the lowest water loss? Why?</p>'},
    {id:'q3',n:'3',q:'<p>Why is it better to use the percent mass change, rather than the mass change, to compare plants?</p>'},
    {id:'q4',n:'4',q:'<p>Under which conditions is it most important for plants to be resistant to water loss through transpiration? Why?</p>'},
    {id:'q5',n:'5',q:'<p>Do you live in an area where environmental conditions lead to high transpiration? Explain.</p>'}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion: how do wind and humidity affect the rate of transpiration? Use the class averages, and your own group’s data, as evidence.</p>',cer:true}};

/* ---------- Full lab: one potted pansy on a balance ---------- */
const LIGHT={dark:0,room:90,window:400,sun:1500},SITE={denver:82,sea:101.3};
const FL={M0:70,A:0.0032,W0:34};
const flo=sim=>{const p=sim.p;return {par:LIGHT[p.light],T:p.temp,RH:p.rh/100,u:p.wind,P:SITE[p.site]||82,dens:p.dens,gsF:1,A:FL.A,bare:false};};
const fs=sim=>sim.st&&!sim.st.B?sim.st:null;
const M_=(f,d)=>sim=>{const s=fs(sim);return s?f(s,sim):(d===undefined?0:d);};
const PEEL=0.196;   // mm²: field of view 0.50 mm across at 400×
const SEC={x:484,y:12,w:308,h:426};
function drawFull(sim,ctx,vdt,k,t){const p=sim.p,s=sim.st,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap'),R=Math.random;
  const par=LIGHT[p.light],o=flo(sim),open=s.gmx>0?clamp(s.gs/s.gmx,0,1):0,bl=blMM(p.wind,o.P,p.temp);
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  // light: lamp and glow
  const gl=par>0?clamp(0.12+Math.log10(par)/5,0.15,0.8):0;
  if(gl>0){const g=ctx.createRadialGradient(250,24,10,250,24,300);g.addColorStop(0,'rgba(255,214,90,'+gl+')');g.addColorStop(1,'rgba(255,214,90,0)');ctx.fillStyle=g;ctx.fillRect(0,0,476,394);}
  ctx.fillStyle=PAL['cv-lamp'];rr(ctx,214,8,72,16,6);ctx.fill();ctx.fillStyle=par>0?'#ffd65a':'#6b7078';ctx.beginPath();ctx.ellipse(250,26,22,7,0,0,6.2832);ctx.fill();
  txt(ctx,{dark:'Dark',room:'Room lights',window:'Sunny window',sun:'Full sun'}[p.light],300,24,{s:12*k,c:PAL['cv-soft']});
  // humidity haze
  const nH=Math.round(clamp(p.rh,0,100)/100*70);if(!v.haze){const g=rng(4);v.haze=[];for(let i=0;i<70;i++)v.haze.push([g()*460+8,60+g()*320,g()*6.28]);}
  ctx.fillStyle=PAL['cv-bstroke'];ctx.globalAlpha=0.35;for(let i=0;i<nH;i++){const q=v.haze[i];ctx.beginPath();ctx.arc(q[0]+(RM?0:Math.sin(t*0.5+q[2])*3),q[1],1.8,0,6.2832);ctx.fill();}ctx.globalAlpha=1;
  // fan and wind streaks
  if(p.wind>0.05){v.fa=((v.fa||0)+(RM?1:3+p.wind*3)*vdt)%6.2832;fanDraw(ctx,54,250,30,v.fa,true);
    if(!RM){ctx.strokeStyle=PAL['s2'];ctx.globalAlpha=0.45;ctx.lineWidth=2;for(let q=0;q<6;q++){const ph=((t*(0.4+p.wind*0.25)+q*0.17)%1);const x=96+ph*300,y=186+q*22;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+14+p.wind*6,y);ctx.stroke();}ctx.globalAlpha=1;}}
  // balance and plant
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,394,476,56);ctx.fillStyle=PAL['line'];ctx.fillRect(0,394,476,2);
  const bx=260;ctx.fillStyle='#d9dde2';rr(ctx,bx-80,330,160,64,8);ctx.fill();ctx.fillStyle='#b5bcc4';rr(ctx,bx-66,320,132,12,4);ctx.fill();
  lcd(ctx,bx-70,340,140,50,'g',s.M.toFixed(1),0.8,26);
  const dr=clamp((-s.pL-0.75)/0.6,0,1)||0;
  // boundary layer halo: thickness on screen follows the real thickness (about 1 to 7 mm)
  const halo=4+bl*3.2;ctx.fillStyle=PAL['s2'];ctx.globalAlpha=0.16;ctx.beginPath();ctx.ellipse(bx,262,96+halo,48+halo*0.8,0,0,6.2832);ctx.fill();ctx.globalAlpha=1;
  pansy(ctx,bx,320,1.35,dr,'foil','',k);
  // vapor leaving the leaves, at a rate set by the model
  if(!v.vap)v.vap=[];if(vdt>0){v.acc=(v.acc||0)+s.rate*vdt*24*(RM?0.4:1);while(v.acc>=1&&v.vap.length<90){v.acc--;const a=R()*6.2832;v.vap.push({x:bx+Math.cos(a)*70,y:258+Math.sin(a)*34,vx:(Math.cos(a)*14+p.wind*22),vy:-18-R()*10,life:2.2});}
    v.vap.forEach(q=>{q.x+=q.vx*vdt;q.y+=q.vy*vdt;q.life-=vdt;});v.vap=v.vap.filter(q=>q.life>0&&q.x<470);}
  ctx.fillStyle=PAL['cv-sub'];v.vap.forEach(q=>{ctx.globalAlpha=clamp(q.life/1.2,0,0.85);ctx.beginPath();ctx.arc(q.x,q.y,2.6,0,6.2832);ctx.fill();});ctx.globalAlpha=1;
  txt(ctx,k>1.3?'Pot sealed in foil':'Pot sealed in foil, so only the leaves lose water',bx,412+12*k,{s:12*k,c:PAL['cv-soft'],a:'center'});
  if(ap){pill(ctx,'ψ air '+Math.round(psiAir(p.temp,p.rh/100))+' MPa',380,62,PAL['card'],PAL['cv-ink'],12*k);
    pill(ctx,'ψ leaf '+s.pL.toFixed(2)+' MPa',400,206,PAL['card'],PAL['cv-ink'],12*k);pill(ctx,'ψ soil '+s.ps.toFixed(2)+' MPa',120,318,PAL['card'],PAL['cv-ink'],12*k);}
  // right panel
  const view=hon?p.view:'surface';ctx.fillStyle=PAL['cv-bg2'];rr(ctx,SEC.x,SEC.y,SEC.w,SEC.h,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  ctx.save();rr(ctx,SEC.x,SEC.y,SEC.w,SEC.h,12);ctx.clip();
  if(view==='section')drawSection(sim,ctx,vdt,k,t,open,bl);else if(view==='potometer')drawPot(sim,ctx,vdt,k,t);else if(view==='peel')drawPeel(sim,ctx,k);else drawSurface(sim,ctx,vdt,k,t,open);
  ctx.restore();}
function guard(ctx,cx,cy,sc,open,vert){// a pair of kidney-shaped guard cells, top view
  const gap=2+open*7;ctx.save();ctx.translate(cx,cy);if(vert)ctx.rotate(Math.PI/2);
  ctx.fillStyle='#5aa64e';[-1,1].forEach(sd=>{ctx.beginPath();ctx.ellipse(sd*(gap/2+6*sc),0,7*sc,17*sc,0,0,6.2832);ctx.fill();});
  ctx.fillStyle='#2c3a2a';ctx.beginPath();ctx.ellipse(0,0,gap/2,13*sc*(0.35+0.65*open),0,0,6.2832);ctx.fill();
  ctx.fillStyle='#2f7d2f';[-1,1].forEach(sd=>{for(let i=-1;i<=1;i++){ctx.beginPath();ctx.arc(sd*(gap/2+6*sc),i*8*sc,2.2*sc,0,6.2832);ctx.fill();}});ctx.restore();}
function drawSurface(sim,ctx,vdt,k,t,open){const v=sim.vis,s=sim.st,X=SEC.x,Y=SEC.y;
  txt(ctx,'Underside of a leaf, zoomed in',X+SEC.w/2,Y+10+13*k,{s:13*k,w:700,a:'center'});
  ctx.fillStyle='#cfe6bd';ctx.fillRect(X+10,Y+24+16*k,SEC.w-20,300);ctx.strokeStyle='#a8c995';ctx.lineWidth=1;
  for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(X+10,Y+60+i*50);for(let x=0;x<=SEC.w-20;x+=20)ctx.quadraticCurveTo(X+20+x,Y+50+i*50+(x%40?14:-14),X+30+x,Y+60+i*50);ctx.stroke();}
  const P=[[X+80,Y+120],[X+160,Y+170],[X+240,Y+115],[X+90,Y+260],[X+190,Y+270],[X+260,Y+220]];
  P.forEach((q,i)=>{guard(ctx,q[0],q[1],1.25,open,i%2===1);});
  if(!v.puff)v.puff=[];if(vdt>0&&open>0.05){v.pacc=(v.pacc||0)+open*vdt*8;while(v.pacc>=1){v.pacc--;const q=P[Math.floor(Math.random()*P.length)];v.puff.push({x:q[0],y:q[1],r:2,life:1.2});}}
  v.puff.forEach(q=>{q.r+=12*vdt;q.life-=vdt;});v.puff=v.puff.filter(q=>q.life>0);ctx.strokeStyle=PAL['cv-sub'];ctx.lineWidth=1.5;v.puff.forEach(q=>{ctx.globalAlpha=clamp(q.life,0,1);ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,6.2832);ctx.stroke();});ctx.globalAlpha=1;
  const y2=Y+SEC.h-18-28*k;txt(ctx,'Stomata '+Math.round(open*100)+'% open',X+SEC.w/2,y2,{s:14*k,w:700,a:'center'});
  txt(ctx,open>0.6?'Guard cells swell and bow apart.':open>0.25?'Guard cells partly open.':'Guard cells go limp and close the pores.',X+SEC.w/2,y2+18*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}
function drawSection(sim,ctx,vdt,k,t,open,bl){const v=sim.vis,X=SEC.x,Y=SEC.y,W=SEC.w,big=k>1.35;
  txt(ctx,'Leaf cross-section',X+W/2,Y+8+13*k,{s:13*k,w:700,a:'center'});
  const yc=Y+20+18*k,ye1=yc+6,ye2=ye1+26,yp=ye2+70,ys=yp+86,yl=ys+22,cx=X+W/2+40;
  // cuticle and upper epidermis
  ctx.fillStyle='#e9d77a';ctx.fillRect(X+8,yc,W-16,6);ctx.fillStyle='#e4efd7';ctx.strokeStyle='#9cb88a';ctx.lineWidth=1;
  for(let x=X+8;x<X+W-8;x+=30){ctx.fillRect(x,ye1,30,26);ctx.strokeRect(x,ye1,30,26);}
  // palisade
  for(let x=X+10;x<X+W-10;x+=20){ctx.fillStyle='#bfe0a4';rr(ctx,x,ye2+2,17,66,7);ctx.fill();ctx.stroke();ctx.fillStyle='#3f9a3f';for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(x+8.5,ye2+12+j*15,4,3,0,0,6.2832);ctx.fill();}}
  // spongy mesophyll with air spaces
  ctx.fillStyle=PAL['cv-water'];ctx.fillRect(X+8,yp,W-16,ys-yp);if(!v.spg){const g=rng(9);v.spg=[];for(let i=0;i<22;i++)v.spg.push([g(),g(),9+g()*6]);}
  v.spg.forEach(q=>{ctx.fillStyle='#cfe7b8';ctx.beginPath();ctx.ellipse(X+20+q[0]*(W-40),yp+10+q[1]*(ys-yp-20),q[2]*1.3,q[2],q[0]*3,0,6.2832);ctx.fill();ctx.strokeStyle='#9cb88a';ctx.stroke();});
  // vein (xylem)
  ctx.fillStyle='#d8c38f';ctx.beginPath();ctx.arc(X+70,yp+36,20,0,6.2832);ctx.fill();ctx.fillStyle='#8a6d3b';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(X+60+(i%3)*10,yp+30+Math.floor(i/3)*12,4,0,6.2832);ctx.fill();}
  // lower epidermis with a stoma between two guard cells
  const gap=3+open*12;ctx.fillStyle='#e4efd7';for(let x=X+8;x<X+W-8;x+=30){if(Math.abs(x+15-cx)<34)continue;ctx.fillRect(x,ys,30,22);ctx.strokeRect(x,ys,30,22);}
  ctx.fillStyle='#5aa64e';[-1,1].forEach(sd=>{ctx.beginPath();ctx.ellipse(cx+sd*(gap/2+11),ys+11,11,12,0,0,6.2832);ctx.fill();});
  ctx.fillStyle='#e9d77a';ctx.fillRect(X+8,yl,W-16,3);
  // boundary layer: drawn 6 px per mm of real thickness
  const bpx=clamp(bl*7,4,60);ctx.fillStyle=PAL['s2'];ctx.globalAlpha=0.14;ctx.fillRect(X+8,yl+3,W-16,bpx);ctx.globalAlpha=1;ctx.strokeStyle=PAL['s2'];ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(X+8,yl+3+bpx);ctx.lineTo(X+W-8,yl+3+bpx);ctx.stroke();ctx.setLineDash([]);
  // water vapor: from the air spaces, out the pore, through the boundary layer
  if(!v.wv)v.wv=[];if(vdt>0){v.wacc=(v.wacc||0)+sim.st.E*vdt*3;while(v.wacc>=1&&v.wv.length<60){v.wacc--;v.wv.push({x:X+30+Math.random()*(W-60),y:yp+10+Math.random()*(ys-yp-20),ph:0});}}
  const sp=(RM?0.5:1)*(0.6+sim.st.E*0.25);v.wv.forEach(q=>{if(q.ph===0){const dx=cx-q.x,dy=ys-4-q.y,d=Math.hypot(dx,dy);if(d<6)q.ph=1;else{q.x+=dx/d*40*sp*vdt;q.y+=dy/d*40*sp*vdt;}}
    else{q.y+=(q.y<yl+3+bpx?(18+60*(1/bpx)*20)*vdt*sp:40*vdt*sp);q.x+=(Math.random()-.5)*30*vdt;}});
  v.wv=v.wv.filter(q=>q.y<Y+SEC.h-8&&!(q.ph===0&&open<0.05&&Math.random()<vdt));ctx.fillStyle=PAL['cv-sub'];v.wv.forEach(q=>{ctx.beginPath();ctx.arc(q.x,q.y,2.6,0,6.2832);ctx.fill();});
  // labels (fewer on small screens)
  const L=(s,x,y)=>pill(ctx,s,x,y,PAL['card'],PAL['cv-ink'],12*k);
  ctx.font='700 '+12*k+'px '+FONT;const lx=s=>X+12+(ctx.measureText(s).width+13*k)/2;
  if(big){L('Palisade',X+W/2,ye2+35);L('Spongy mesophyll',X+W/2,yp+28);L('Guard cells',cx-20,ys-16);}
  else{L('Upper epidermis',lx('Upper epidermis'),ye1+13);L('Palisade',lx('Palisade')+60,ye2+34);L('Xylem',X+70,yp+70);L('Spongy mesophyll',lx('Spongy mesophyll')+84,yp+20);L('Guard cells',cx-30,ys-14);}
  L('Boundary layer '+bl.toFixed(1)+' mm',X+W/2,yl+3+bpx+12*k);
  txt(ctx,'Stoma '+Math.round(open*100)+'% open',X+W/2,Y+SEC.h-12,{s:13*k,w:700,a:'center'});}
function drawPot(sim,ctx,vdt,k,t){const v=sim.vis,s=sim.st,X=SEC.x,Y=SEC.y,W=SEC.w;
  txt(ctx,'Bubble potometer',X+W/2,Y+8+13*k,{s:13*k,w:700,a:'center'});
  const up=s.rate*1000/60,mmMin=up/0.785;// µL/min; 1.0 mm bore holds 0.785 µL per mm
  v.pt=(v.pt||0)+vdt;v.bub=((v.bub===undefined?92:v.bub)-mmMin*vdt);if(v.bub<4){v.bub=92;v.pt=0;}
  // shoot in a sealed tube
  const tx=X+60,ty=Y+70+12*k;ctx.fillStyle=PAL['cv-water'];ctx.fillRect(tx-10,ty+40,20,110);ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.strokeRect(tx-10,ty+40,20,110);
  ctx.strokeStyle='#3f8f3a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(tx,ty+120);ctx.lineTo(tx,ty+10);ctx.stroke();
  [[-1,0],[1,20],[-1,40]].forEach(([sd,dy])=>{ctx.save();ctx.translate(tx+sd*16,ty+10+dy);ctx.rotate(sd*0.7);ctx.fillStyle=LEAF;ctx.beginPath();ctx.ellipse(0,0,8,18,0,0,6.2832);ctx.fill();ctx.restore();});
  // capillary with scale
  const cy=ty+150,x0=tx+10,x1=X+W-16,PX=(x1-x0)/100;ctx.fillStyle=PAL['cv-water'];ctx.fillRect(x0,cy-5,x1-x0,10);ctx.strokeStyle=PAL['cv-glass'];ctx.strokeRect(x0,cy-5,x1-x0,10);
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;for(let mm=0;mm<=100;mm+=5){const x=x0+mm*PX;ctx.beginPath();ctx.moveTo(x,cy+6);ctx.lineTo(x,cy+(mm%10?11:16));ctx.stroke();if(mm%(k>1.35?50:20)===0)txt(ctx,String(mm),x,cy+18+12*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  txt(ctx,'mm',x1,cy+34+24*k,{s:12*k,c:PAL['cv-soft'],a:'right'});
  ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-ink'];const bxp=x0+v.bub*PX;rr(ctx,bxp-7,cy-4,14,8,4);ctx.fill();ctx.stroke();
  txt(ctx,'Bubble moves left',X+W-16,cy-12,{s:12*k,c:PAL['cv-soft'],a:'right'});
  const yy=Y+SEC.h-16-48*k;lcd(ctx,X+14,yy,W-28,26+32*k,'STOPWATCH (1 s = 1 min)',(Math.floor(v.pt)+':'+String(Math.floor((v.pt%1)*60)).padStart(2,'0')),k,Math.round(22*k));}
function drawPeel(sim,ctx,k){const v=sim.vis,p=sim.p,X=SEC.x,Y=SEC.y,W=SEC.w;
  txt(ctx,'Leaf peel at 400×',X+W/2,Y+8+13*k,{s:13*k,w:700,a:'center'});
  const cx=X+W/2,cy=Y+30+16*k+125,R=125;ctx.fillStyle='#000';ctx.beginPath();ctx.arc(cx,cy,R+6,0,6.2832);ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,6.2832);ctx.clip();ctx.fillStyle='#e8efe0';ctx.fillRect(cx-R,cy-R,2*R,2*R);
  ctx.strokeStyle='#b9c9a8';ctx.lineWidth=1;for(let i=0;i<9;i++){ctx.beginPath();for(let x=-R;x<=R;x+=12)ctx.lineTo(cx+x,cy-R+i*30+Math.sin(x*0.15+i)*6);ctx.stroke();}
  if(v.peelD!==p.dens){v.peelD=p.dens;const g=rng(1000+p.dens),n=Math.round(p.dens*PEEL+Math.sqrt(p.dens*PEEL)*(g()-0.5)*1.5);v.peel=[];let tries=0;
    while(v.peel.length<n&&tries<4000){tries++;const a=g()*6.2832,d=Math.sqrt(g())*(R-8),x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d;if(v.peel.every(q=>Math.hypot(q[0]-x,q[1]-y)>17))v.peel.push([x,y,g()*3.14]);}}
  v.peel.forEach(q=>{ctx.save();ctx.translate(q[0],q[1]);ctx.rotate(q[2]);ctx.fillStyle='#6fae5e';ctx.beginPath();ctx.ellipse(-3,0,3,7,0,0,6.2832);ctx.fill();ctx.beginPath();ctx.ellipse(3,0,3,7,0,0,6.2832);ctx.fill();ctx.restore();});
  ctx.restore();txt(ctx,'Field of view 0.50 mm across',cx,cy+R+12+12*k,{s:12*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'Area = πr² = 0.196 mm²',cx,cy+R+16+26*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}

const PANSY={
  id:'transpiration',hash:'transpiration',apUnit:2,order:6,kind:'Simulation',prereq:['transport'],next:['photosynthesis'],
  tab:'Transpiration',card:'Turn on a fan, raise the humidity or switch off the lights, and weigh how much water a pansy loses.',
  title:'Transpiration: wind, humidity and light',
  lede:{bio:'Plants lose water through tiny pores in their leaves. Change the light, the wind and the humidity, and watch the balance as the plant loses water.',
        honors:'Stomata open in the light and close when the plant runs short of water. Look inside a leaf to see the guard cells, the air spaces and the boundary layer that wind strips away.',
        ap:'Cohesion-tension, measured. Follow water potential from soil to leaf to air, and use a potometer and a leaf peel to measure transpiration and stomatal density.'},
  scale:{bio:'One potted pansy, about 15 cm across, with about 32 cm² of leaves. Its pot is sealed in foil, so the balance only counts water that leaves through the leaves.',
         honors:'Left: a whole pansy on a balance. Right: one leaf, about 0.3 mm thick. Each stoma is about 20 µm long, and a pansy leaf has about 150 of them on each square millimeter of its underside.'},
  timeScale:1,dtMax:0.02,prewarm:2,sampleDt:0.05,window:24,unit:'h',timeLabel:'Time',chChange:1,chReveal:3,aspect:16/9,
  controls:[
    {id:'light',label:'Light',type:'seg',def:'room',lvl:'bio',options:[{v:'dark',l:'Dark'},{v:'room',l:'Room lights'},{v:'window',l:'Sunny window'},{v:'sun',l:'Full sun'}]},
    {id:'wind',label:'Wind',type:'range',min:0,max:5,step:0.1,def:0,unit:' m/s',d:1,lvl:'bio',help:'Room air is nearly still. A desk fan blows about 2 to 3 m/s.'},
    {id:'rh',label:'Relative humidity',type:'range',min:5,max:95,step:1,def:25,unit:'%',lvl:'bio',help:'A heated Colorado classroom is often 20 to 30%.'},
    {id:'temp',label:'Air temperature',type:'range',min:5,max:35,step:1,def:21,unit:' °C',lvl:'honors'},
    {id:'soil0',label:'Soil water',type:'range',min:10,max:100,step:5,def:100,unit:'%',lvl:'honors',help:'Share of the pot’s available water. Setting it refills or dries the pot; then the plant uses it up.',
     onChange(sim){const s=fs(sim);if(s)s.W=FL.W0*sim.p.soil0/100;}},
    {id:'dens',label:'Stomatal density',type:'range',min:50,max:300,step:10,def:150,unit:' per mm²',lvl:'ap',help:'Stomata on each square millimeter of the leaf underside.'},
    {id:'site',label:'Elevation',type:'seg',def:'denver',lvl:'ap',options:[{v:'denver',l:'Aurora, CO (1,750 m)'},{v:'sea',l:'Sea level'}]},
    {id:'view',label:'Zoom panel',type:'seg',def:'section',lvl:'honors',noTrial:true,options:[{v:'section',l:'Leaf cross-section'},{v:'surface',l:'Leaf underside'},{v:'potometer',l:'Potometer',lvl:'ap'},{v:'peel',l:'Leaf peel',lvl:'ap'}]},
    // virtual lab bench only
    {id:'tPlant',label:'Plant',type:'seg',def:0,vlab:true,noTrial:true,options:[{v:0,l:'1: Control'},{v:1,l:'2: Humidity'},{v:2,l:'3: Wind'}]},
    {id:'tView',label:'Bench view',type:'seg',def:'bench',vlab:true,noTrial:true,options:[{v:'bench',l:'Bench'},{v:'sheet',l:'Class data'},{v:'graph2',l:'Graph 2'}]}
  ],
  actions:[
    {id:'water',label:'Water the plant',lvl:'bio',run(sim){const s=fs(sim);if(s){s.W=FL.W0;BioLab.setValues(sim,{soil0:100});}}},
    {id:'t-unpack',label:'Remove the plants from the packaging',primary:true,vlab:true,enabled:s=>!!pmB(s)&&!s.vlab.bench.unpacked,run(s){if(pmB(s))s.vlab.bench.unpacked=true;}},
    {id:'t-wrap',label:'Wrap this root ball in foil',primary:true,vlab:true,enabled:s=>{const b=pmB(s)&&s.vlab.bench;return !!b&&b.unpacked&&!b.wrap[s.p.tPlant]&&b.rd[s.p.tPlant][0].length===0;},
     run(s){const b=pmB(s)&&s.vlab.bench,i=s.p.tPlant;if(!b||!b.unpacked||b.wrap[i]||b.rd[i][0].length)return;b.wrap[i]=true;b.pl[i].M+=pmPlant(s.vlab.seed,0,i).foil;}},
    {id:'t-label',label:'Label the plants: Control, Humidity, Wind',vlab:true,enabled:s=>{const b=pmB(s)&&s.vlab.bench;return !!b&&b.unpacked&&!b.labeled;},run(s){const b=pmB(s)&&s.vlab.bench;if(b&&b.unpacked)b.labeled=true;}},
    {id:'t-weigh',label:'Put it on the balance',primary:true,vlab:true,enabled:s=>{const b=pmB(s)&&s.vlab.bench;return !!b&&b.unpacked&&b.onBal<0&&!pmAdv(b);},
     run(s){const b=pmB(s)&&s.vlab.bench,i=s.p.tPlant;if(!b||b.onBal>=0||pmAdv(b))return;const d=pmToday(b);b.onBal=i;b.disp=pmRead(s,i);b.rd[i][d-1].push(b.disp);}},
    {id:'t-return',label:'Return it',vlab:true,enabled:s=>{const b=pmB(s)&&s.vlab.bench;return !!b&&b.onBal>=0;},run(s){const b=pmB(s)&&s.vlab.bench;if(b)b.onBal=-1;}},
    {id:'t-place',label:'Place each plant in its environment',primary:true,vlab:true,enabled:s=>{const b=pmB(s)&&s.vlab.bench;return !!b&&b.unpacked&&!b.placed;},run(s){const b=pmB(s)&&s.vlab.bench;if(b&&b.unpacked){b.placed=true;b.onBal=-1;}}},
    {id:'t-day',label:'Let one day pass',primary:true,vlab:true,enabled:s=>{const b=pmB(s)&&s.vlab.bench;return !!b&&b.placed&&b.onBal<0&&b.day<4&&!pmAdv(b)&&pmWeighed(b,b.day);},
     run(s){const b=pmB(s)&&s.vlab.bench;if(!b||!b.placed||b.onBal>=0||b.day>=4||pmAdv(b)||!pmWeighed(b,b.day))return;b.target=b.day*24;BioLab.play(s);}}
  ],
  labs:[LAB_PM],
  benchRead(sim){const B=pmB(sim);if(!B)return null;const b=sim.vlab.bench;return {day:b.day,today:pmToday(b),clock:b.clock,advancing:pmAdv(b),onBal:b.onBal,balance:b.onBal>=0?b.disp:0,
    unpacked:b.unpacked,wrap:b.wrap.slice(),labeled:b.labeled,placed:b.placed,rd:b.rd,cls:pmClass(sim.vlab.seed),date:[1,2,3,4].map(d=>pmDate(b,d))};},
  init(sim){if(sim&&sim.vlab&&sim.vlab.lab.id==='pansy-mass')return {B:pmInit(sim)};
    const W=FL.W0*((sim&&sim.p&&sim.p.soil0)||100)/100;return {M:FL.M0,W,W0:FL.W0,gs:NaN,pL:NaN,E:0,Es:0,rate:0,lost:0,gmx:0.3,gsT:0,vpd:0,ps:0,gb:0.14};},
  step(sim,dt){if(sim.st.B){if(sim.t<-1e-9)return;pmStep(sim,dt*PM.D);return;}
    const s=sim.st,o=flo(sim);let h=dt;
    while(h>1e-12){const d=Math.min(h,0.05),loss=advance(s,o,d);s.lost+=loss;s.M-=loss;s.rate=loss/d;h-=d;}
    const r=s.r;s.gmx=MOD.gmax*sim.p.dens;s.vpd=r.vpd;s.ps=r.ps;s.gb=r.gb;},
  afterPrewarm(sim){const s=fs(sim);if(!s)return;s.lost=0;s.M=FL.M0;s.W=FL.W0*sim.p.soil0/100;},
  metrics:[
    {id:'rate',label:'Water loss rate',unit:'g/h',lvl:'bio',min:0,max:null,d:2,get:M_(s=>s.rate)},
    {id:'lost',label:'Water lost so far',unit:'g',lvl:'bio',min:0,max:null,d:1,get:M_(s=>s.lost)},
    {id:'open',label:'Stomata open',unit:'%',lvl:'bio',min:0,max:100,d:0,get:M_(s=>clamp(100*s.gs/s.gmx,0,100))},
    {id:'vpd',label:'Vapor pressure deficit',unit:'kPa',lvl:'honors',min:0,max:6,d:2,get:M_(s=>s.vpd)},
    {id:'bl',label:'Boundary layer',unit:'mm',lvl:'honors',min:0,max:10,d:1,get:M_((s,sim)=>blMM(sim.p.wind,SITE[sim.p.site]||82,sim.p.temp))},
    {id:'soil',label:'Soil water left',unit:'%',lvl:'honors',min:0,max:100,d:0,get:M_(s=>100*s.W/s.W0)},
    {id:'E',label:'Transpiration rate E',unit:'mmol m⁻² s⁻¹',lvl:'ap',min:0,max:null,d:2,get:M_(s=>s.E)},
    {id:'gs',label:'Stomatal conductance gs',unit:'mol m⁻² s⁻¹',lvl:'ap',min:0,max:0.6,d:3,get:M_(s=>s.gs)},
    {id:'psiS',label:'ψ soil',unit:'MPa',lvl:'ap',min:-3,max:0,d:2,get:M_(s=>s.ps)},
    {id:'psiL',label:'ψ leaf',unit:'MPa',lvl:'ap',min:-3,max:0,d:2,get:M_(s=>s.pL)},
    {id:'psiA',label:'ψ air',unit:'MPa',lvl:'ap',min:-400,max:0,d:0,get:M_((s,sim)=>psiAir(sim.p.temp,sim.p.rh/100))}
  ],
  graphs:[{id:'rate',label:'Water loss rate',lines:['rate']},{id:'lost',label:'Water lost so far',lines:['lost']},{id:'open',label:'Stomata open',lines:['open']},
    {id:'psi',label:'Soil and leaf water potential',lvl:'ap',lines:['psiS','psiL'],yl:'Water potential (MPa)'}],
  defaultGraph:'rate',
  challenges:[
    {lvl:'bio',q:'A desk fan starts blowing on the plant at 3 m/s. What happens to how fast it loses water?',
     choices:['It slows down, because the wind cools the leaves','It speeds up','It stays the same'],correct:1,
     baseline:{wind:0},change:{wind:3},changeText:'Fan on: 3 m/s',watch:'rate',
     explain:{bio:'Still air next to a leaf fills up with water vapor, which slows evaporation. Wind blows that humid air away, so water vapor escapes faster. Here the loss rate nearly doubles, for the same reason wet clothes dry faster on a windy day.',
              honors:'Wind thins the boundary layer from about 7 mm to about 1 mm, so water vapor crosses it faster. The stomata did not change; the path outside the leaf got shorter.'}},
    {lvl:'bio',q:'The humidity in the room rises from 25% to 85%. What happens to the plant’s water loss?',
     choices:['It rises: the plant drinks more in damp air','It drops a lot','It stays the same'],correct:1,
     baseline:{rh:25},change:{rh:85},changeText:'Humidity raised to 85%',watch:'rate',
     explain:{bio:'Water vapor moves from the wet inside of the leaf to the drier air. In damp air there is less difference, so less water leaves. At 85% humidity this plant loses about a fifth as much water as at 25%.',
              honors:'The vapor pressure deficit falls from about 1.9 kPa to about 0.37 kPa. Transpiration follows the deficit, so it falls by about 80%.'}},
    {lvl:'bio',q:'The lights go off. What happens to the plant’s water loss?',
     choices:['It stops completely','It drops, but some water still leaves','It rises, because the leaves cool down'],correct:1,
     baseline:{light:'room'},change:{light:'dark'},changeText:'Lights off',watch:'open',
     explain:{bio:'In the dark the guard cells close most of the stomata, so water loss drops to less than a third. It does not reach zero: a few stomata stay partly open, and a little water escapes through the waxy cuticle.',
              ap:'gs falls to the night share (8% of gsmax) plus the cuticular conductance. Because gb now limits much less, E drops from about 1.9 to about 0.55 mmol m⁻² s⁻¹, not to zero.'}},
    {lvl:'honors',q:'The room warms from 21 °C to 30 °C. The relative humidity stays at 25%. What happens to transpiration?',
     choices:['Nothing, because the humidity did not change','It rises a lot','It drops'],correct:1,
     baseline:{temp:21,rh:25},change:{temp:30},changeText:'Air warmed to 30 °C (still 25% RH)',watch:'rate',
     explain:{honors:'Warm air can hold much more water vapor. At the same 25% relative humidity, the vapor pressure deficit rises from about 1.9 to about 3.2 kPa, so water leaves the leaf about 1.7 times as fast. Relative humidity alone does not tell you how drying the air is.'}},
    {lvl:'honors',q:'This plant’s soil is nearly dry (30% of its water left). A fan starts blowing at 3 m/s. Does its water loss jump the way a well-watered plant’s would?',
     choices:['Yes, it rises just as much','No: it rises a little, then the stomata partly close','It stops completely'],correct:1,
     baseline:{soil0:30,wind:0},change:{wind:3},changeText:'Fan on: 3 m/s, soil nearly dry',watch:'open',
     explain:{honors:'Dry soil holds its water tightly. As the leaves lose water faster, they run short, and the guard cells lose turgor and close the stomata. Watch Stomata open fall. A water-stressed plant trades photosynthesis for survival.',
              ap:'ψsoil is already about −0.6 MPa. A higher E pulls ψleaf down past −1 MPa, where f(ψ) closes the stomata. E rises only about 25% instead of nearly doubling.'}},
    {lvl:'ap',q:'The fan speeds up from 0 to 4 m/s. What happens to the leaf’s water potential (ψ leaf)?',
     choices:['It becomes more negative: the xylem is under more tension','It rises toward 0','It does not change, because the soil water is the same'],correct:0,
     baseline:{wind:0},change:{wind:4},changeText:'Wind raised to 4 m/s',watch:'psi',
     explain:{ap:'Water moves up the xylem because evaporation at the leaf pulls on a continuous water column (cohesion-tension). Faster transpiration means a larger drop across the hydraulic resistance, ψleaf = ψsoil − E·R, so the leaf becomes more negative: here from about −0.4 to about −0.7 MPa. The air, at about −190 MPa, is the final sink.'}},
    {lvl:'ap',q:'In still air, you double the stomatal density from 150 to 300 per mm². Does transpiration double?',
     choices:['Yes, twice the pores means twice the water loss','No, it rises much less than double','No, it does not change at all'],correct:1,
     baseline:{wind:0,dens:150},change:{dens:300},changeText:'Stomatal density doubled (still air)',watch:'rate',
     explain:{ap:'The stomata and the boundary layer are resistances in series: 1/g = 1/gs + 1/gb. In still air the boundary layer (gb ≈ 0.14 mol m⁻² s⁻¹) is a big part of the total, so doubling gs raises g only about 25%. In wind, gb is large, so gs controls most of the total.'}}
  ],
  narrate(sim){if(sim.st.B&&sim.vlab)return pmNarrate(sim);const s=sim.st,p=sim.p,hon=atLeast('honors'),ap=atLeast('ap'),open=clamp(s.gs/s.gmx,0,1);
    if(s.W/s.W0<0.12)return '<b>The soil is almost dry.</b> The leaves cannot pull in water as fast as they lose it, so the stomata close and the plant wilts. Press Water the plant.';
    if(open<0.2&&s.pL<-0.85)return '<b>Water stress.</b> The leaves are short of water, so the guard cells close the stomata. That saves water but stops most CO₂ from getting in.';
    if(p.light==='dark')return '<b>Dark.</b> Most stomata are closed, so the plant loses water slowly, at '+s.rate.toFixed(2)+' g per hour. A little still escapes through the cuticle and the few open pores.';
    if(p.rh>=80)return '<b>Humid air.</b> The air already holds almost as much water vapor as it can, so little moves out of the leaf: '+s.rate.toFixed(2)+' g per hour.'+(hon?' The vapor pressure deficit is only '+s.vpd.toFixed(2)+' kPa.':'');
    if(p.wind>=1)return '<b>Wind</b> sweeps away the humid air around the leaves, so water vapor escapes faster: '+s.rate.toFixed(2)+' g per hour.'+(hon?' The boundary layer is only '+blMM(p.wind,SITE[p.site]||82,p.temp).toFixed(1)+' mm thick.':'');
    if(ap)return 'Water moves from soil ('+s.ps.toFixed(2)+' MPa) to leaf ('+s.pL.toFixed(2)+' MPa) to air ('+Math.round(psiAir(p.temp,p.rh/100))+' MPa), pulled up the xylem by evaporation from the leaves.';
    return 'Light opens the stomata and water vapor leaves the leaves. The plant loses <b>'+s.rate.toFixed(2)+' g of water per hour</b>, and the balance reading drops.';},
  tour:[
    {title:'A plant on a balance',text:'This pansy sits on a balance. Its pot is sealed in foil, so any mass it loses is water leaving through its leaves. That loss of water vapor is <b>transpiration</b>.',focus:[150,150,230,250],speed:0.3},
    {title:'Tiny pores',text:'Zoom in on the underside of a leaf. Each pair of green guard cells surrounds a pore, a <b>stoma</b>. In the light the guard cells swell and open the pores, and water vapor puffs out.',focus:[484,12,308,426],speed:0.3,setup(sim){BioLab.setValues(sim,{view:'surface'});}},
    {title:'Lights off',text:'Now the lights go off. The guard cells relax and close most of the pores, so the plant loses water much more slowly.',focus:[[484,12,308,426],[150,150,230,250]],speed:1,setup(sim){BioLab.setValues(sim,{light:'dark'});}},
    {title:'Humid air',text:'Lights back on, and the air is now very humid (85%). The leaf’s inside is nearly 100% humid, so water vapor only leaves when the air is drier. Damp air means little water loss.',focus:[0,0,476,394],speed:1,setup(sim){BioLab.setValues(sim,{light:'room',rh:85});}},
    {title:'Wind',text:'Back to dry classroom air (25%), and a fan starts. Still air next to the leaves fills with water vapor. Wind sweeps it away, so the blue halo around the leaves, the <b>boundary layer</b>, thins and the plant loses water faster.',focus:[0,140,476,260],speed:1,setup(sim){BioLab.setValues(sim,{rh:25,wind:3});}},
    {lvl:'honors',title:'Inside the leaf',text:'In this cross-section, water evaporates from the spongy mesophyll cells into the air spaces. The vapor diffuses out through the stoma between two <b>guard cells</b>, then through the boundary layer. The xylem in the vein brings water in to replace it.',focus:[484,12,308,426],speed:0.4,setup(sim){BioLab.setValues(sim,{view:'section',wind:0});}},
    {lvl:'honors',title:'Dry soil',text:'Now the soil holds only 30% of its water. As the leaves lose water, they run short and the guard cells close the stomata. Watch Stomata open fall. The plant saves water but takes in less CO₂.',focus:[484,12,308,426],speed:1,setup(sim){BioLab.setValues(sim,{soil0:30,wind:3});}},
    {lvl:'ap',title:'Cohesion-tension',text:'Water potential falls from soil to leaf to air. Evaporation at the leaf pulls on a continuous column of water in the xylem, held together by hydrogen bonds. The air, at about −190 MPa, is the final sink. Read ψ soil, ψ leaf and ψ air on the left.',focus:[0,30,476,320],pause:true,setup(sim){BioLab.setValues(sim,{soil0:100,wind:0});}}
  ],
  onTourExit(sim){const base={};(sim.def.controls||[]).forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How do wind and humidity change how much water a plant loses?</p><ol><li>Start with Room lights, no wind and 25% humidity. Press Reset, wait 6 hours on the clock, and record a trial: note the Water lost so far.</li><li>Press Reset. Set the wind to 3 m/s, wait 6 hours and record a trial.</li><li>Press Reset. Set the wind back to 0 and the humidity to 85%, wait 6 hours and record a trial.</li></ol><p>Which condition lost the most water? Which lost the least? Explain why, using the words <b>stomata</b> and <b>water vapor</b>.</p>',
       honors:'<p><b>Question:</b> How do light and temperature change transpiration, and what happens when the soil dries?</p><ol><li>Record the water loss rate for each light setting at 21 °C, 25% humidity, no wind.</li><li>With Room lights, record the rate at 15, 21, 27 and 33 °C, keeping the humidity at 25%. Write down the vapor pressure deficit each time.</li><li>Set Soil water to 30% and the wind to 3 m/s. Watch Stomata open and the rate for 6 hours.</li></ol><p>Graph the rate against the vapor pressure deficit. Explain why stomata close in dry soil, and what the plant gives up when they do.</p>',
       ap:'<p><b>Question:</b> In still air and in wind, which limits transpiration more: the stomata or the boundary layer?</p><ol><li>With no wind, record E at stomatal densities of 50, 100, 150, 200 and 300 per mm². Use the leaf peel to count the stomata in the field of view and check each density (density = count ÷ 0.196 mm²).</li><li>Repeat at 4 m/s.</li><li>Use the potometer: time the bubble over 10 mm and work out the uptake in µL/min (the 1.0 mm bore holds 0.785 µL per mm). Compare it with the water loss rate.</li></ol><p><b>Claim–evidence–reasoning:</b> Use 1/g = 1/gs + 1/gb to explain why doubling the stomata helps so little in still air. Then explain why the same plant loses more water at 1,750 m than at sea level at the same temperature and humidity.</p>'},
  terms:[{t:'Transpiration',d:'Loss of water vapor from a plant, mostly through the stomata in its leaves.'},{t:'Stoma (plural stomata)',d:'A pore in the leaf surface that lets CO₂ in and water vapor out.'},{t:'Humidity',d:'How much water vapor the air holds. Dry air pulls water out of leaves faster.'},{t:'Wilting',d:'Drooping when a plant loses water faster than its roots take it up.'},
    {lvl:'honors',t:'Guard cells',d:'The pair of cells around each stoma. They swell with water to open it and go limp to close it.'},{lvl:'honors',t:'Boundary layer',d:'The thin layer of still, humid air next to a leaf. Wind thins it.'},{lvl:'honors',t:'Vapor pressure deficit (VPD)',d:'How far the air is from saturated, in kPa. Transpiration rises with it.'},{lvl:'honors',t:'Xylem',d:'The tubes that carry water from the roots to the leaves.'},{lvl:'honors',t:'Spongy mesophyll',d:'Loosely packed leaf cells with air spaces, where water evaporates inside the leaf.'},
    {lvl:'ap',t:'Water potential (ψ)',d:'The tendency of water to move, in MPa. Water flows from higher to lower ψ: soil, then leaf, then air.'},{lvl:'ap',t:'Cohesion-tension',d:'Evaporation from leaves pulls a continuous water column up the xylem. Hydrogen bonds hold the column together.'},{lvl:'ap',t:'Stomatal conductance (gs)',d:'How easily water vapor leaves through the stomata, in mol m⁻² s⁻¹.'},{lvl:'ap',t:'Potometer',d:'A device that measures how fast a cut shoot takes up water, by timing a bubble in a thin tube.'},{lvl:'ap',t:'Stomatal density',d:'Stomata per mm² of leaf, counted on a leaf peel under a microscope.'}],
  about:'<p><b>The model.</b> Transpiration E = g·VPD/P. VPD = es(T)·(1 − RH), with es from the Tetens equation (2.49 kPa at 21 °C). g is the stomatal conductance (plus a cuticular 0.004 mol m⁻² s⁻¹) in series with the boundary-layer conductance: 1/g = 1/gs + 1/gb. gb = 0.05 + 0.147·√(u/d) mol m⁻² s⁻¹, with a slow 0.03 m/s room drift added to the wind and d = 8 cm, because a whole small rosette behaves like one wide leaf in still air. The boundary layer thickness shown is D·C/gb, about 7 mm in still air and about 1 mm in a 3 m/s wind.</p>'+
    '<p>Stomata open with light, gs = gsmax·PAR/(PAR + 50), and never close below 8% of gsmax at night. gsmax = 0.002 mol m⁻² s⁻¹ per stoma per mm², so 150 per mm² gives 0.30, typical of a soft-leaved garden plant. Water stress closes them: they are half closed when ψleaf reaches −1.0 MPa. ψleaf = ψsoil − E·R, with R = 0.2 MPa per mmol m⁻² s⁻¹, and ψsoil = −0.012·θ⁻³ MPa, where θ is the share of the pot’s 34 g of available water left. Air pressure is 82 kPa at RJ’s elevation (about 1,750 m) and 101.3 kPa at sea level. Lower pressure raises the vapor gradient VPD/P, so the same plant transpires about 20% faster in Colorado than at sea level. ψair = (RT/V̄w)·ln(RH).</p>'+
    '<p><b>Calibration.</b> The plant has 32 cm² of leaves. The constants were tuned so that, with classroom lights on 9 hours a day, a 70 g foil-wrapped pansy in a 21 °C room at 25% relative humidity loses about 8% of its mass per day, a fan at 2 to 3 m/s multiplies that by about 1.5, and a leaky humidity tent (9 to 13 points more humid) by about 0.9. Those ratios match RJ class data from 2021–22 (−24.2%, −21.7% and −35.9% over the lab). Typical gs (0.1 to 0.4 mol m⁻² s⁻¹) and E (1 to 5 mmol m⁻² s⁻¹) values for herbs come from plant physiology texts (Taiz and Zeiger; Jones, <i>Plants and Microclimate</i>).</p>'+
    '<p><b>Simplifications.</b> The leaves stay at air temperature; real leaves in sun run a few degrees warmer, and transpiring leaves in wind a little cooler. The stomata respond with one 20-minute time constant, and there is no CO₂ or hormone (ABA) signal. Growth, root pressure and the water stored in the stem are left out. The potometer assumes uptake equals transpiration, which is close for a cut shoot over minutes. The leaf peel places stomata at random with a minimum spacing.</p>',
  initVis(sim){sim.vis.vap=[];sim.vis.puff=[];sim.vis.wv=[];},
  draw(sim,ctx,vdt,k,t){if(sim.st.B&&sim.vlab){drawPM(sim,ctx,vdt,k,t);return;}drawFull(sim,ctx,vdt,k,t);}
};
BioLab.addPractical({transpiration:{
  hook:'A potted pansy sits in a Colorado classroom at 21 °C and 25% humidity, in still air with the room lights on. How much water does it lose in an hour? What changes when a desk fan blows on it at 3 m/s, or when the lights go off?',
  answer:'In still air it loses about 0.39 g of water per hour, about 9 g a day with the lights on. The fan nearly doubles that, to about 0.7 g per hour. With the lights off, the stomata close and the loss drops to about 0.11 g per hour.',
  uses:['Rooting cuttings: gardeners cover new cuttings with a clear dome. The humid air cuts their water loss, so they survive until they grow roots.',
    'Watering lawns: Denver Water bases its watering advice on how fast plants transpire. On hot, dry, windy summer days a lawn can lose about a quarter inch of water a day.',
    'Farm windbreaks: rows of trees on the eastern plains slow the wind over crops, so the crops lose less water and need less irrigation.'],
  takeaway:'Plants lose water fastest in dry, warm, windy air with their stomata open, and they save water by closing their stomata in the dark or when the soil dries.',
  lede:'Plants lose water through tiny pores in their leaves. Change the light, the wind and the humidity, and watch the balance as a pansy loses water.',
  tour:['This pansy sits on a balance, like a bathroom scale for plants. Its pot is sealed in foil, so any mass it loses is water leaving through its leaves. This loss of water vapor is called <b>transpiration</b>.',
    'Zoom in on the underside of a leaf. Each pair of green guard cells surrounds a tiny pore called a <b>stoma</b>. In the light the guard cells swell and open the pores, and water vapor puffs out, like steam from a kettle.',
    'Now the lights go off. The guard cells relax and close most of the pores, the way you close windows at night. The plant loses water much more slowly.',
    'Lights back on, and the air is now very humid (85%), like a bathroom after a shower. Water vapor only leaves the leaf when the air outside is drier, so damp air means little water loss.',
    'Back to dry classroom air, and a fan starts. Still air next to the leaves fills with water vapor. Wind blows it away, the way wet clothes dry faster on a windy day, so the plant loses water faster.']}});
BioLab.register(PANSY);
})();
