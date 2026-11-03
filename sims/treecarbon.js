(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,serColor,fmtNum}=BioLab.h;

/* Tree carbon storage and sequestration.
   Growth: trunk diameter at breast height and tree height follow Chapman–Richards curves for six Colorado campus species,
     d(a) = dmax·(1 − e^(−k·a))^p,  h(a) = 0.3 + (hmax − 0.3)·(1 − e^(−kh·a))^1.1   (a = age in years).
   Carbon, from the handout (after Trees for the Future, 2007), with d in cm and h in m:
     green weight GW = 0.0577·d²·h (d < 28 cm) or 0.0346·d²·h (d ≥ 28 cm); dry weight DW = 0.5·GW; carbon C = 0.5·DW.
   The readouts use those formulas exactly. The age curves blend the two coefficients smoothly around 28 cm, because the
   formulas jump by 40% there, which would make a tree look as if it lost carbon the year it passed 28 cm. */
const SP={
  honeylocust:{l:'Honeylocust',dm:85,k:0.028,p:1.15,hm:17,kh:0.045,shape:'round',leaf:'#6f9a3a'},
  ash:{l:'Green ash',dm:80,k:0.027,p:1.15,hm:18,kh:0.045,shape:'round',leaf:'#4f8a35'},
  pine:{l:'Austrian pine',dm:65,k:0.03,p:1.2,hm:16,kh:0.04,shape:'pine',leaf:'#2f5e35'},
  spruce:{l:'Blue spruce',dm:60,k:0.03,p:1.2,hm:19,kh:0.035,shape:'spruce',leaf:'#4d7a7a'},
  cottonwood:{l:'Plains cottonwood',dm:130,k:0.025,p:1.1,hm:26,kh:0.045,shape:'round',leaf:'#5c9640'},
  oak:{l:'Bur oak',dm:110,k:0.014,p:1.15,hm:22,kh:0.025,shape:'round',leaf:'#3f7a30'}};
const SPK=Object.keys(SP);
const dOf=(s,a)=>s.dm*Math.pow(1-Math.exp(-s.k*Math.max(0,a)),s.p);
const hOf=(s,a)=>0.3+(s.hm-0.3)*Math.pow(1-Math.exp(-s.kh*Math.max(0,a)),1.1);
const coef=d=>d<28?0.0577:0.0346;                                  // the handout's two formulas
const coefS=d=>0.0346+0.0231/(1+Math.exp((d-28)/6));               // the same two, blended for the curves
const GWf=(d,h)=>coef(d)*d*d*h;
const CS=(s,a,roots)=>{const d=dOf(s,a);return 0.25*coefS(d)*d*d*hOf(s,a)*(roots?1.2:1);};   // carbon on the curve (kg C)
const seqS=(s,a,roots)=>CS(s,a+0.5,roots)-CS(s,a-0.5,roots);
const CO2=44/12;

/* ---------------- Full lab ---------------- */
const spOf=sim=>SP[sim.p.species]||SP.ash;
const roots=sim=>atLeast('ap')&&!!sim.p.roots;
const dens=sim=>atLeast('honors')?sim.p.dens:400;
function now(sim){const s=spOf(sim),a=sim.st.age,d=dOf(s,a),h=hOf(s,a),gw=GWf(d,h)*(roots(sim)?1.2:1),dw=gw*0.5,c=dw*0.5;
  return {s,a,d,h,gw,dw,c,avg:a>0?c/a:0,seq:Math.max(0,seqS(s,a,roots(sim)))};}
function syncAge(sim){const a=Math.round(sim.st.age);if(sim.p.age!==a){sim.p.age=a;if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.age)sim.ui.ctl.age.set(a);}}
function event(sim,kind){const st=sim.st,n=now(sim),N=dens(sim),tC=n.c*N/1000;if(n.c<1)return;
  if(kind==='burn'){st.air+=0.9*tC;st.slash+=0.1*tC;st.fire=sim.t;}else{st.wood+=0.55*tC;st.slash+=0.45*tC;st.cut=sim.t;}
  st.age=1;st.evt=kind;syncAge(sim);sim.infoDirty=true;}

/* ---------------- virtual lab bench: the campus tree survey ----------------
   Eight numbered campus trees. Your group measures one. Species, age, trunk size and height come from the growth curves with
   seeded urban variation; the tape, the paces and every clinometer sighting carry their own small, seeded errors. */
function hr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function hn(seed,a,b){const u=Math.max(1e-9,hr(seed,a,b)),w=hr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const NT=8,TAPES=[0.5,1.0,1.4,1.8],FLARE={0.5:0.09,1:0.03,1.4:0,1.8:-0.015};
const TPOS=[[96,110],[208,92],[318,126],[440,96],[120,300],[250,330],[380,286],[478,352]];
const CAMPUS=(()=>{const C={};return seed=>{if(C[seed])return C[seed];const S=seed|0,u=(a,b)=>hr(S,a,b);
  const order=SPK.slice();for(let i=order.length-1;i>0;i--){const j=Math.floor(u(1,i)*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  const trees=[];for(let i=0;i<NT;i++){const sk=i<6?order[i]:order[Math.floor(u(2,i)*6)],s=SP[sk];let age=0,d=0,h=0;
    for(let t=0;t<30;t++){age=5*Math.round((15+u(3,i*31+t)*45)/5);d=dOf(s,age)*Math.exp(0.10*hn(S,4,i*31+t));h=hOf(s,age)*Math.exp(0.07*hn(S,5,i*31+t));if(d>=15&&d<=70&&h>=6&&h<=20)break;}
    d=clamp(d,15,70);h=clamp(h,6,20);
    // what that group measured (each group has its own small errors) and calculated with the handout's formulas
    const gd=Math.round(d*Math.exp(0.015*hn(S,6,i))*10)/10,gh=Math.round(h*Math.exp(0.04*hn(S,7,i))*10)/10,gw=GWf(gd,gh),c=gw*0.25;
    trees.push({n:i+1,sk,age,d,h,wrap:0.25*hn(S,8,i),g:{d:gd,h:gh,c:Math.round(c),r:Math.round(c/age*10)/10}});}
  const mine=Math.floor(u(9,0)*NT),T=trees[mine];
  const eye=1.45+0.25*u(10,0),pace=0.70+0.10*u(11,0);
  return C[seed]={seed:S,trees,mine,T,eye,pace};};})();
const tcV=sim=>sim&&sim.vlab&&sim.vlab.lab&&sim.vlab.lab.id==='treecarbon-campus'?sim.vlab:null;
const tcB=sim=>tcV(sim)&&sim.st&&sim.st.B?sim.vlab.bench:null;
const tcD=sim=>tcV(sim)?CAMPUS(sim.vlab.seed):null;
let TCUR=null;const tcCur=()=>TCUR&&tcV(TCUR)?CAMPUS(TCUR.vlab.seed):null;
const circAt=(D,z)=>Math.PI*D.T.d*(1+FLARE[z])+D.T.wrap;         // what the tape reads at height z (cm)
const tRad=D=>D.T.d/200;                                             // trunk radius (m)
const angTop=(D,pos)=>Math.atan((D.T.h-D.eye)/(pos+tRad(D)))*180/Math.PI;
const angBase=(D,pos)=>Math.atan(D.eye/(pos+tRad(D)))*180/Math.PI;
function benchInit(sim){const b=sim.vlab.bench;if(!Number.isFinite(b.pos))b.pos=0.6;if(!Number.isFinite(b.np))b.np=0;if(!Array.isArray(b.sights))b.sights=[];if(!Array.isArray(b.wraps))b.wraps=[];if(!Array.isArray(b.visits))b.visits=[];if(!b.view)b.view='map';if(!Number.isFinite(b.tape))b.tape=1;if(!Number.isFinite(b.att))b.att=0;if(b.last===undefined)b.last=null;return {kind:'tc'};}
function paceBy(sim,n){const b=tcB(sim),D=tcD(sim);if(!b)return;for(let i=0;i<Math.abs(n);i++){b.np++;b.pos=Math.max(0.4,b.pos+Math.sign(n)*D.pace*(1+0.04*hn(D.seed,20,b.np)));}
  b.pos=Math.round(b.pos*100)/100;b.visits.push(b.pos);if(b.visits.length>60)b.visits.shift();b.last=null;if(sim.p.tcView!=='height')BioLab.setValues(sim,{tcView:'height'});sim.infoDirty=true;}
const topHidden=(D,pos)=>angTop(D,pos)>62;
function sight(sim,k){const b=tcB(sim),D=tcD(sim);if(!b)return;if(sim.p.tcView!=='height')BioLab.setValues(sim,{tcView:'height'});
  if(k==='top'&&topHidden(D,b.pos)){b.last={k,blocked:true,pos:b.pos};return;}
  b.att++;const a=(k==='top'?angTop(D,b.pos):angBase(D,b.pos))+0.55*hn(D.seed,30+(k==='top'?0:1),b.att);
  const rec={k,a:Math.round(a*100)/100,pos:b.pos};b.last=rec;b.sights.push(rec);if(b.sights.length>40)b.sights.shift();if(!b.visits.includes(b.pos))b.visits.push(b.pos);}
/* checks: readings against the bench, calculations against the student's own numbers (hints only when clearly off) */
const near=(v,e,rel,abs)=>Math.abs(v-e)<=Math.max(abs||0,Math.abs(e)*rel);
const OFF=0.04;
function circCheck(sim,rv,v){const b=tcB(sim),D=tcD(sim);if(!b||!D)return null;const w=b.wraps||[];
  if(!w.includes(1.4)){if(w.some(z=>near(v,circAt(D,z),0,0.6)))return 'That matches the tape at '+w.find(z=>near(v,circAt(D,z),0,0.6))+' m. Wrap the tape at breast height, 1.4 m (4.5 ft), and read it there.';return 'Wrap the tape around the trunk at breast height, 1.4 m (4.5 ft), and read it first.';}
  const c=circAt(D,1.4);if(near(v,c,0,0.6))return null;
  for(const z of w)if(z!==1.4&&near(v,circAt(D,z),0,0.6))return 'That matches the tape at '+z+' m. Diameter at breast height is measured at 1.4 m (4.5 ft).';
  if(near(v,c/Math.PI,0,0.6))return 'That looks like a diameter. Record the circumference you read on the tape here; you divide by π later.';
  return 'Check your reading: read the tape where the zero end meets it, to the nearest 0.5 cm.';}
function abCheck(sim,rv,v){const b=tcB(sim);if(!b)return null;const sp=(b.sights||[]).map(s=>s.pos);
  if(!b.visits.length)return 'Pace back from the tree first, then read the tape at your feet.';
  if(sp.some(p=>near(v,p,0,0.06)))return null;
  if(!sp.length&&near(v,b.pos,0,0.06))return null;
  if(b.visits.some(p=>near(v,p,0,0.06)))return 'You sighted your angles from a different spot. Record the distance from the spot where you sighted the top and the base.';
  return 'Read the tape at your feet again, to the nearest 0.05 m (5 cm).';}
function angCheck(k){return (sim,rv,v)=>{const b=tcB(sim);if(!b)return null;const S=(b.sights||[]).filter(s=>s.k===k),nm=k==='top'?'top':'base';
  if(!S.length)return 'Sight the '+nm+' of the tree with the clinometer first.';
  const hit=S.filter(s=>Math.abs(s.a-v)<=1.0);
  if(hit.length){const ab=sim.vlab.val('ht','ab',0);if(Number.isFinite(ab)&&!hit.some(s=>near(ab,s.pos,0,0.06))&&S.some(s=>near(ab,s.pos,0,0.06)))return 'You sighted that angle from a different spot than your AB distance. Use AB and both angles from the same spot.';return null;}
  if(S.some(s=>Math.abs(90-s.a-v)<=1.0))return 'Check how you read the clinometer: record the angle above level, where the string crosses the scale.';
  return 'Check the clinometer reading for the '+nm+': read where the string crosses the scale, to the nearest degree.';};}
const V_=(sim,t,c)=>sim.vlab.val(t,c,0);
const degTan=a=>Math.tan(a*Math.PI/180);
function tanCheck(which){return (sim,rv,v)=>{const a=V_(sim,'ht',which==='1'?'t1':'t2');if(!Number.isFinite(a))return 'Fill in θ'+which+' first.';const e=degTan(a);if(near(v,e,OFF,0.005))return null;
  if(near(v,Math.tan(a),0.02,0.005))return 'Set your calculator to degrees, not radians.';return 'tan θ'+which+' is the tangent of your θ'+which+' angle, in degrees. Check your calculator entry.';};}
function prodCheck(which){return (sim,rv,v)=>{const ab=V_(sim,'ht','ab');let t=V_(sim,'ht',which==='1'?'tn1':'tn2');if(!Number.isFinite(t)){const a=V_(sim,'ht',which==='1'?'t1':'t2');if(Number.isFinite(a))t=degTan(a);}
  if(!Number.isFinite(ab)||!Number.isFinite(t))return 'Fill in AB and θ'+which+' first.';if(near(v,ab*t,OFF,0.03))return null;
  return (which==='1'?'DB = AB × tan θ1':'BC = AB × tan θ2')+'. Check your multiplication.';};}
function hCheck(sim,rv,v){const db=V_(sim,'ht','db'),bc=V_(sim,'ht','bc');if(!Number.isFinite(db)||!Number.isFinite(bc))return 'Fill in DB and BC first.';if(near(v,db+bc,OFF,0.05))return null;return 'h = DB + BC. Check your addition.';}
function spCheck(sim,rv,v){const D=tcD(sim);if(!D)return null;return v===D.T.sk?null:'Check the tag on your tree: that is not its species.';}
function ageCheck(sim,rv,v){const D=tcD(sim);if(!D)return null;return near(v,D.T.age,0,0.5)?null:'Use the approximate age your teacher gave on the tree tag.';}
function dCheck(sim,rv,v){const c=V_(sim,'dbh','c');if(!Number.isFinite(c))return 'Record the circumference first.';if(near(v,c/Math.PI,0.02,0.2))return null;
  if(near(v,c/2,0.02,0.2))return 'Diameter = circumference ÷ π, not ÷ 2.';return 'Diameter = circumference ÷ π. Check your calculation.';}
function htCheck(sim,rv,v){const h=V_(sim,'ht','h');if(!Number.isFinite(h))return 'Work out h in the height table first.';return near(v,h,0.02,0.1)?null:'Use the height h from your clinometer table.';}
function gwCheck(sim,rv,v){const d=V_(sim,'ts','d'),h=V_(sim,'ts','h');if(!Number.isFinite(d)||!Number.isFinite(h))return 'Fill in the diameter and height first.';
  if(near(v,coef(d)*d*d*h,OFF,1))return null;const other=d<28?0.0346:0.0577;
  if(near(v,other*d*d*h,OFF,1))return d<28?'Check the formula for d < 28 cm.':'Check the formula for d ≥ 28 cm.';
  return 'GW uses d², with d in centimeters and h in meters. Check your calculation.';}
function halfCheck(src,nm,f){return (sim,rv,v)=>{const g=V_(sim,'ts',src);if(!Number.isFinite(g))return 'Fill in the '+nm+' first.';return near(v,g*0.5,OFF,0.5)?null:f;};}
function rateCheck(sim,rv,v){const c=V_(sim,'ts','c'),a=V_(sim,'ts','age');if(!Number.isFinite(c)||!Number.isFinite(a)||a<=0)return 'Fill in the carbon storage and age first.';return near(v,c/a,OFF,0.05)?null:'Average sequestration rate = carbon storage ÷ age. Check your calculation.';}
function clsCheck(sim,rv,v){const D=tcD(sim);if(!D)return null;const i=(+rv)-1,t=D.trees[i];if(!t)return null;
  if(i===D.mine){const c=V_(sim,'ts','c');if(!Number.isFinite(c))return 'Work out your own tree’s carbon storage in the Tree Stats table first.';return near(v,c,0.01,1)?null:'For your own tree, use the carbon storage from your Tree Stats table.';}
  return near(v,t.g.c,0.01,1)?null:'Copy Tree '+t.n+'’s carbon storage from the class sheet.';}
/* the calculations from question 6 and the bonus */
function q6c(sim,v,V){const c=V_(sim,'ts','c');if(!Number.isFinite(c))return 'Work out your tree’s carbon storage first.';return near(v,400*c,OFF,1)?null:'Stored carbon per hectare = carbon in one tree × trees per hectare.';}
const kNum=(V,k)=>{const t=String(V.raw(k)).trim().replace(/\u2212/g,'-').replace(/^([-+]?\d*),(\d+)$/,'$1.$2');return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)?parseFloat(t):NaN;};
function q6r(sim,v,V){const s=kNum(V,'k:q6c'),r=V_(sim,'ts','r');
  if(Number.isFinite(s)&&near(v,s/45,OFF,0.5))return null;if(Number.isFinite(r)&&near(v,400*r,OFF,0.5))return null;
  if(!Number.isFinite(s))return 'Work out the stored carbon per hectare first.';return 'Average sequestration rate per hectare = stored carbon per hectare ÷ the forest’s age, 45 years.';}
function qB(sim,v,V){const r=kNum(V,'k:q6r');if(!Number.isFinite(r)||r<=0)return 'Work out the sequestration rate per hectare first.';return near(v,4363/r,OFF,0.02)?null:'Hectares needed = 4363 kg C per year ÷ your forest’s kg C per hectare per year.';}
function benchNarrate(sim){const b=tcB(sim),D=tcD(sim);if(!b)return '';const T=D.T,s=SP[T.sk],v=sim.p.tcView;
  if(v==='map')return 'Your group has <b>Tree '+T.n+'</b>, outlined in red. Its tag says <b>'+s.l+', about '+T.age+' years old</b>. The other groups are measuring the other numbered trees.';
  if(v==='dbh')return 'You are at Tree '+T.n+'. The tape is wrapped around the trunk at <b>'+sim.p.tapeAt+' m</b> above the ground. '+(sim.p.tapeAt===1.4?'This is breast height. Read where the zero end meets the tape.':'Diameter at breast height is measured at 1.4 m (4.5 ft).');
  if(v==='sheet')return 'The class sheet holds every group’s Tree Stats. Your group’s row is blank until you share your own numbers.';
  const L=b.last;if(L&&L.blocked)return '<b>From here, branches block your view of the top.</b> Back up a few paces so you can see the top of the tree.';
  if(L)return 'Your partner reads the clinometer: the string crosses the scale at the '+(L.k==='top'?'<b>top</b> sighting (θ1).':'<b>base</b> sighting (θ2).')+' Read it to the nearest degree.';
  return 'You have paced <b>'+b.np+' paces</b> from the trunk. The tape on the ground reads your distance AB at your feet.'+(topHidden(D,b.pos)?' You are still too close to see the top.':'');}
/* bench drawing */
function treeShape(ctx,s,x,yb,hpx,dpx,k,scale){const tw=Math.max(3,dpx),cr=s.shape==='round'?hpx*0.30:hpx*0.22;
  ctx.fillStyle='#6b4a2b';ctx.beginPath();ctx.moveTo(x-tw/2*1.25,yb);ctx.lineTo(x-tw/2,yb-hpx*0.6);ctx.lineTo(x+tw/2,yb-hpx*0.6);ctx.lineTo(x+tw/2*1.25,yb);ctx.closePath();ctx.fill();
  ctx.fillStyle=s.leaf;if(s.shape==='round'){ctx.beginPath();ctx.ellipse(x,yb-hpx+cr*1.05,cr*1.15,cr*1.05,0,0,6.283);ctx.fill();ctx.beginPath();ctx.arc(x-cr*0.7,yb-hpx+cr*1.5,cr*0.7,0,6.283);ctx.arc(x+cr*0.75,yb-hpx+cr*1.45,cr*0.7,0,6.283);ctx.fill();}
  else{const w=s.shape==='spruce'?hpx*0.20:hpx*0.28;ctx.beginPath();ctx.moveTo(x,yb-hpx);ctx.lineTo(x+w,yb-hpx*0.22);ctx.lineTo(x-w,yb-hpx*0.22);ctx.closePath();ctx.fill();}}
function drawTCMap(sim,ctx,k){const D=tcD(sim),fs=Math.min(12.5*k,21);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  txt(ctx,'Campus map (simplified, not to scale)',16,28,{s:Math.min(15*k,24),w:700});ctx.fillStyle='rgba(98,150,80,.22)';rr(ctx,16,40,520,404,10);ctx.fill();
  ctx.fillStyle='#8d9196';rr(ctx,150,170,230,70,6);ctx.fill();txt(ctx,'Main building',265,212,{s:Math.min(12*k,18),w:700,c:'#ffffff',a:'center'});
  ctx.fillStyle='#d6d2c8';ctx.fillRect(40,254,480,14);ctx.fillRect(255,40,14,130);
  D.trees.forEach((t,i)=>{const [x,y]=TPOS[i],s=SP[t.sk],r=10+t.h*1.3,me=i===D.mine;ctx.fillStyle='rgba(0,0,0,.16)';ctx.beginPath();ctx.ellipse(x+r*0.4,y+r*0.6,r,r*0.7,0,0,6.283);ctx.fill();
    ctx.fillStyle=s.leaf;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();if(me){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,r+5,0,6.283);ctx.stroke();}
    pill(ctx,String(t.n),x,y,me?PAL['rj']:'#ffffff',me?'#ffffff':'#1e1e1e',Math.min(12*k,18));});
  const X=552,Y=40,T=D.T,s=SP[T.sk];ctx.fillStyle=PAL['card'];rr(ctx,X,Y,236,404,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,X,Y,236,404,10);ctx.stroke();
  const lh=Math.min(fs*1.5,34);let y=Y+30;[['Your group',700],['Tree '+T.n,700,PAL['rj']],['',0],['Tree tag',700],[s.l,400],['About '+T.age+' years old',400],['(age from your teacher)',400,PAL['cv-soft']],['',0],['Other groups measure',400,PAL['cv-soft']],['the other 7 trees.',400,PAL['cv-soft']]]
    .forEach(L=>{if(L[1])txt(ctx,L[0],X+14,y,{s:fs,w:L[1],c:L[2]||PAL['cv-ink']});y+=lh;});}
function drawDBH(sim,ctx,k){const D=tcD(sim),b=tcB(sim),T=D.T,fs=Math.min(12.5*k,20),z=sim.p.tapeAt;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  const G=420,PXM=140,Y=m=>G-m*PXM,tw=T.d/100*PXM*1.0,cx=210;
  ctx.fillStyle='#5f9f42';ctx.fillRect(0,G,800,30);
  // trunk with a little flare at the base
  ctx.fillStyle='#7a5532';ctx.beginPath();ctx.moveTo(cx-tw/2*1.35,G);ctx.quadraticCurveTo(cx-tw/2,Y(0.6),cx-tw/2,Y(2.9));ctx.lineTo(cx+tw/2,Y(2.9));ctx.quadraticCurveTo(cx+tw/2,Y(0.6),cx+tw/2*1.35,G);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(40,25,10,.45)';ctx.lineWidth=2;for(let i=0;i<9;i++){const x=cx-tw/2+tw*(i+0.5)/9;ctx.beginPath();ctx.moveTo(x,Y(2.9));ctx.lineTo(x+(i%2?3:-3),G-6);ctx.stroke();}
  // meter stick
  const mx=cx-tw/2*1.4-46;ctx.fillStyle='#e8d27a';ctx.fillRect(mx,Y(2.0),16,G-Y(2.0));ctx.strokeStyle='#5a4a10';ctx.lineWidth=1.5;
  for(let m=0;m<=2.0+1e-9;m+=0.1){const y=Y(m),big=Math.abs(m*2-Math.round(m*2))<1e-6;ctx.beginPath();ctx.moveTo(mx,y);ctx.lineTo(mx+(big?16:8),y);ctx.stroke();if(big&&m>0)txt(ctx,m.toFixed(1)+' m',mx-6,y+5,{s:Math.min(12*k,18),a:'right'});}
  ctx.strokeStyle=PAL['rj'];ctx.setLineDash([6,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(mx+16,Y(1.4));ctx.lineTo(cx+tw/2+30,Y(1.4));ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'1.4 m (4.5 ft): breast height',cx+tw/2+34,Y(1.4)+5,{s:Math.min(12*k,17),w:700,c:PAL['rj']});
  // the tape around the trunk
  ctx.fillStyle='#f2c230';const ty=Y(z);ctx.fillRect(cx-tw/2*(z<0.7?1.12:1)-2,ty-6,tw*(z<0.7?1.12:1)+4,12);ctx.strokeStyle='#8a6a00';ctx.lineWidth=1;ctx.strokeRect(cx-tw/2*(z<0.7?1.12:1)-2,ty-6,tw*(z<0.7?1.12:1)+4,12);
  // magnified tape at the overlap
  const X=440,W=346,Yt=36,H=160,R=circAt(D,z),span=k>1.45?3.2:4.2,ppc=(W-28)/(2*span);ctx.fillStyle=PAL['card'];rr(ctx,X,Yt,W,H,10);ctx.fill();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;rr(ctx,X,Yt,W,H,10);ctx.stroke();
  txt(ctx,'Magnified: where the tape overlaps',X+W/2,Yt+24,{s:Math.min(12.5*k,18),w:700,a:'center'});
  const x0=X+W/2,ty0=Yt+70;ctx.save();ctx.beginPath();ctx.rect(X+8,Yt+34,W-16,H-42);ctx.clip();
  ctx.fillStyle='#f2c230';ctx.fillRect(X,ty0,W,46);ctx.strokeStyle='#1e1e1e';
  for(let c=Math.floor(R-span)-1;c<=R+span+1;c+=0.5){const x=x0+(c-R)*ppc,whole=Math.abs(c-Math.round(c))<1e-6;ctx.lineWidth=whole?2:1.2;ctx.beginPath();ctx.moveTo(x,ty0);ctx.lineTo(x,ty0+(whole?22:12));ctx.stroke();
    if(whole&&(k<1.45||Math.round(c)%2===0))txt(ctx,String(Math.round(c)),x,ty0+40,{s:Math.min(12.5*k,19),w:700,c:'#1e1e1e',a:'center'});}
  // the zero end of the tape comes around and lies over the scale
  ctx.fillStyle='rgba(242,194,48,.96)';ctx.fillRect(X,ty0-34,x0-X,30);ctx.fillStyle='#b8bcc2';ctx.fillRect(x0-6,ty0-38,8,40);ctx.strokeStyle='#1e1e1e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,ty0-36);ctx.lineTo(x0,ty0+24);ctx.stroke();
  txt(ctx,'0',x0-16,ty0-12,{s:Math.min(12*k,17),w:700,c:'#1e1e1e',a:'right'});ctx.restore();
  txt(ctx,'Tape wrapped at '+z+' m · reads in cm',X+W/2,Yt+H-12,{s:Math.min(12*k,17),c:PAL['cv-soft'],a:'center'});
  txt(ctx,'Tree '+T.n+' · '+SP[T.sk].l,16,30,{s:Math.min(15*k,23),w:700});}
function drawHeight(sim,ctx,k){const D=tcD(sim),b=tcB(sim),T=D.T,s=SP[T.sk],fs=Math.min(12.5*k,20),pos=b.pos;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  ctx.fillStyle='rgba(120,175,230,.20)';ctx.fillRect(0,0,548,400);const G=400,tx=110,sc=Math.min(330/T.h,380/(pos+1.2)),ox=tx+pos*sc,eyeY=G-D.eye*sc;
  ctx.fillStyle='#5f9f42';ctx.fillRect(0,G,548,50);
  treeShape(ctx,s,tx,G,T.h*sc,Math.max(4,T.d/100*sc),k,sc);
  // the tape on the ground
  ctx.strokeStyle='#e0b020';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(tx,G+3);ctx.lineTo(ox,G+3);ctx.stroke();
  // the student
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;const hh=1.7*sc;ctx.beginPath();ctx.moveTo(ox,G);ctx.lineTo(ox,G-hh*0.5);ctx.moveTo(ox-6,G);ctx.lineTo(ox,G-hh*0.5);ctx.lineTo(ox+6,G);ctx.moveTo(ox,G-hh*0.5);ctx.lineTo(ox,G-hh*0.86);ctx.stroke();
  ctx.beginPath();ctx.arc(ox,eyeY,Math.max(4,hh*0.08),0,6.283);ctx.stroke();
  const L=b.last;const lab=(t,x,y)=>txt(ctx,t,x,y,{s:Math.min(13*k,19),w:700,c:PAL['rj'],a:'center'});
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(ox,eyeY);ctx.lineTo(tx,eyeY);ctx.stroke();ctx.setLineDash([]);
  if(L&&!L.blocked){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(ox,eyeY);ctx.lineTo(tx,L.k==='top'?G-T.h*sc:G);ctx.stroke();ctx.setLineDash([]);}
  lab('A',ox+14,eyeY-8);lab('B',tx-14,eyeY+5);lab('C',tx-14,G-4);lab('D',tx-14,G-T.h*sc+12);
  txt(ctx,'Tree '+T.n+' · '+s.l,16,28,{s:Math.min(14*k,22),w:700});txt(ctx,b.np+' paces from the trunk',16,28+Math.min(14*k,22)*1.3,{s:fs,c:PAL['cv-soft']});
  // clinometer close-up
  const X=556,W=232;let Yt=10,H=232;ctx.fillStyle=PAL['card'];rr(ctx,X,Yt,W,H,10);ctx.fill();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;rr(ctx,X,Yt,W,H,10);ctx.stroke();
  txt(ctx,'Clinometer',X+W/2,Yt+24,{s:Math.min(12.5*k,18),w:700,a:'center'});
  if(!L||L.blocked){txt(ctx,L&&L.blocked?'Can’t see the top':'Sight the top or',X+W/2,Yt+H/2,{s:fs,a:'center'});txt(ctx,L&&L.blocked?'from here.':'the base.',X+W/2,Yt+H/2+fs*1.4,{s:fs,a:'center'});}
  else{const a=L.a,cxp=X+W/2,cyp=Yt-470,Rr=650,ppd=9.4;ctx.save();ctx.beginPath();ctx.rect(X+6,Yt+32,W-12,H-40);ctx.clip();
    // a magnified strip of the protractor scale; the string hangs straight down and crosses the scale at the reading
    const yS=Yt+150;ctx.fillStyle='#f6f2e4';ctx.fillRect(X,yS-40,W,70);ctx.strokeStyle='#1e1e1e';
    for(let d=Math.floor(a-14);d<=a+14;d++){const x=cxp+(d-a)*ppd,big=d%5===0;ctx.lineWidth=big?2:1;ctx.beginPath();ctx.moveTo(x,yS-40);ctx.lineTo(x,yS-40+(big?22:12));ctx.stroke();
      if(d%10===0||(k<1.45&&big))txt(ctx,String(Math.abs(d)),x,yS,{s:Math.min(13*k,19),w:700,c:'#1e1e1e',a:'center'});}
    ctx.strokeStyle='#c11430';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cxp,Yt+34);ctx.lineTo(cxp,yS+20);ctx.stroke();ctx.fillStyle='#555';ctx.beginPath();ctx.arc(cxp,yS+26,7,0,6.283);ctx.fill();ctx.restore();
    txt(ctx,(L.k==='top'?'Sighting the top (θ1)':'Sighting the base (θ2)'),X+W/2,Yt+H-14,{s:Math.min(12*k,17),c:PAL['cv-soft'],a:'center'});}
  // tape at the feet
  Yt=254;H=150;ctx.fillStyle=PAL['card'];rr(ctx,X,Yt,W,H,10);ctx.fill();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;rr(ctx,X,Yt,W,H,10);ctx.stroke();
  txt(ctx,'Tape at your feet (m)',X+W/2,Yt+24,{s:Math.min(12.5*k,18),w:700,a:'center'});
  {const cxp=X+W/2,yS=Yt+58,ppc=5.2;ctx.save();ctx.beginPath();ctx.rect(X+6,Yt+32,W-12,H-40);ctx.clip();ctx.fillStyle='#f2c230';ctx.fillRect(X,yS,W,40);ctx.strokeStyle='#1e1e1e';
    const c0=Math.round(pos*100);for(let c=c0-24;c<=c0+24;c++){const x=cxp+(c-pos*100)*ppc,m10=c%10===0,m5=c%5===0;ctx.lineWidth=m10?2:1;ctx.beginPath();ctx.moveTo(x,yS);ctx.lineTo(x,yS+(m10?20:m5?13:7));ctx.stroke();
      if(m10)txt(ctx,(c/100).toFixed(1),x,yS+36,{s:Math.min(12*k,17),w:700,c:'#1e1e1e',a:'center'});}
    ctx.fillStyle='rgba(40,40,40,.85)';ctx.beginPath();ctx.moveTo(cxp,yS-2);ctx.lineTo(cxp-46,yS-2);ctx.lineTo(cxp-46,yS-18);ctx.quadraticCurveTo(cxp-4,yS-24,cxp,yS-6);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#c11430';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cxp,yS-26);ctx.lineTo(cxp,yS+40);ctx.stroke();ctx.restore();
    txt(ctx,'Read the tape at your heel',X+W/2,Yt+H-12,{s:Math.min(12*k,17),c:PAL['cv-soft'],a:'center'});}}
function drawSheet(sim,ctx,k){const D=tcD(sim),narrow=k>1.35,z=Math.min(12.5*k,narrow?20:15);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  txt(ctx,'Class sheet: Tree Stats from every group',16,28,{s:Math.min(15*k,23),w:700});
  const cols=narrow?[['Tree',90],['Species',300],['C (kg C)',220]]:[['Tree',60],['Species',170],['Age (yr)',80],['d (cm)',90],['h (m)',90],['C (kg C)',110],['Rate (kg C/yr)',150]];
  const top=44,rh=narrow?40:42,hh=36;let x0=(800-cols.reduce((a,c)=>a+c[1],0))/2;const xs=[];cols.forEach(c=>{xs.push(x0);x0+=c[1];});const x1=x0;
  ctx.fillStyle=PAL['card'];ctx.fillRect(xs[0],top,x1-xs[0],hh+NT*rh);ctx.fillStyle=PAL['card2'];ctx.fillRect(xs[0],top,x1-xs[0],hh);
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;for(let r=0;r<=NT;r++){const y=Math.round(top+hh+r*rh)+.5;ctx.beginPath();ctx.moveTo(xs[0],y);ctx.lineTo(x1,y);ctx.stroke();}
  cols.forEach((c,i)=>{txt(ctx,c[0],xs[i]+c[1]/2,top+hh/2+1,{s:z,w:700,a:'center',b:'middle'});});
  D.trees.forEach((t,r)=>{const me=r===D.mine,y=top+hh+r*rh+rh/2+1,col=me?PAL['rj']:PAL['cv-ink'];if(me){ctx.fillStyle='rgba(193,20,48,.08)';ctx.fillRect(xs[0],top+hh+r*rh,x1-xs[0],rh);}
    const vals=narrow?[String(t.n),SP[t.sk].l,me?'your group':String(t.g.c)]:[String(t.n),SP[t.sk].l,String(t.age),me?'?':t.g.d.toFixed(1),me?'?':t.g.h.toFixed(1),me?'?':String(t.g.c),me?'?':t.g.r.toFixed(1)];
    vals.forEach((v,i)=>txt(ctx,v,xs[i]+cols[i][1]/2,y,{s:z,w:i===0||me?700:400,c:col,a:'center',b:'middle'}));});
  txt(ctx,'Red row: your group. Each group measured its own tree.',400,top+hh+NT*rh+18,{s:Math.min(12*k,17),c:PAL['cv-soft'],a:'center'});}
function drawTCBench(sim,ctx,k){const v=sim.p.tcView;if(v==='dbh')drawDBH(sim,ctx,k);else if(v==='height')drawHeight(sim,ctx,k);else if(v==='sheet')drawSheet(sim,ctx,k);else drawTCMap(sim,ctx,k);}

/* ---------------- the lab, from the APES teacher's handout ---------------- */
const tagRow=()=>{const D=tcCur();return ['Tree '+(D?D.T.n:'')];};
const fixedN={id:'n',label:'Tree #',get rows(){const D=tcCur();return [D?D.T.n:1];},get rowLabels(){return tagRow();}};
const filled=(sim,t,cols)=>cols.every(c=>sim.vlab.raw('c:'+t+':'+c+':0').trim()!=='');
const setView=(sim,v)=>{if(sim.p.tcView!==v)BioLab.setValues(sim,{tcView:v});};
const LAB={id:'treecarbon-campus',title:'Tree Carbon Storage and Sequestration Lab',course:'AP Environmental Science',teachers:'Weed',
  source:{label:'Tree Carbon Storage and Sequestration Lab.pdf',href:'https://rjhs.instructure.com/courses/16648/assignments/589273'},level:'honors',
  purpose:'<p>Describe how forests help mitigate climate change, one of the many ecosystem services of forests. Your lab group collects the data together, and each person completes their own calculations and analysis.</p><p>Lab questions: How much carbon is stored in an individual tree? How much carbon can a forest sequester? Why does this matter for how we use land? How can we use this to address climate change?</p>',
  background:'<p>Through photosynthesis, a tree takes carbon dioxide from the air and builds it into sugars, then into wood, bark, roots and leaves. That carbon stays stored in the tree until the wood decomposes or burns. Forests hold more carbon, for longer, than short-lived crops do.</p>'+
    '<p>Older, larger trees store more carbon. <b>Carbon storage</b> is the total held in the tree; <b>carbon sequestration</b> is how much it adds each year. Storage rises with age and then levels off. Sequestration rises while a tree grows fast, then falls as it slows down. Those shapes are similar for most species.</p>'+
    '<p>You estimate a tree’s carbon from two measurements, its trunk diameter at breast height and its height, using formulas adapted from Trees for the Future (2007). Moisture varies by species, so the formulas are an average. The sequestration rate you calculate is a lifetime average; young trees grow faster than that, and old trees slower.</p>'+
    '<p><b>About the virtual campus.</b> The campus and its trees are fictional. Each tree’s size comes from growth curves for that species in Colorado, with natural variation, and your group’s tree is your own. The tape, your paces and each clinometer sighting have small errors like the real ones, so your numbers will differ a little from your classmates’.</p>',
  materials:['Measuring tape (or a string and a meter stick)','Clinometer: a protractor with a straw and a weighted string','A partner to read the clinometer','Calculator','Your tree’s tag (species and approximate age, from your teacher)','The class sheet'],
  hypothesis:{prompt:'<p>Predict which tree on campus stores the most carbon. Will it be the tallest tree, the widest tree or the oldest tree? Explain your reasoning.</p>'},
  setup(sim){TCUR=sim;const b=tcB(sim);if(b){const o={};if(b.view&&sim.p.tcView!==b.view)o.tcView=b.view;if(sim.p.tapeAt!==b.tape)o.tapeAt=b.tape;if(Object.keys(o).length)BioLab.setValues(sim,o);}BioLab.refresh(sim);},
  teardown(){TCUR=null;},
  controls:['tcView'],
  steps:[
    {title:'Meet your tree',text:'<p>Your group has one numbered tree on the campus map. Its tag gives the species and the approximate age, from your teacher.</p><p>Record the species and the age in the <b>Tree Stats</b> table below the bench.</p>',controls:['tcView'],setup(sim){setView(sim,'map');},
     done:sim=>filled(sim,'ts',['sp','age']),doneHint:'Record your tree’s species and age in the Tree Stats table.'},
    {title:'Activity A: diameter',text:'<p>Go to your tree. Measure the circumference of the trunk at <b>4.5 ft (1.4 m)</b> above the ground: this is the diameter at breast height (DBH). Use the meter stick to set the height.</p><p>Read the tape where its zero end meets it, to the nearest 0.5 cm, and record the circumference in the <b>Diameter</b> table.</p>',controls:['tcView','tapeAt'],setup(sim){setView(sim,'dbh');},
     done:sim=>filled(sim,'dbh',['c']),doneHint:'Record the circumference in the Diameter table.'},
    {title:'Height: distance AB',text:'<p>Stand where you can see the top of the tree, on ground about level with the base. Pace away from the trunk with the tape laid out behind you.</p><p>Read the tape at your heel: this is your distance to the tree, <b>AB</b>, in meters. Record it in the height table.</p>',controls:['tcView','pb5','pb1','pf1'],setup(sim){setView(sim,'height');},
     done:sim=>filled(sim,'ht',['ab']),doneHint:'Record your distance AB in the height table.'},
    {title:'Height: sight the top',text:'<p>Without moving, look through the straw of the clinometer at the top of the tree. Your partner reads the angle where the string crosses the scale, to the nearest degree. This is <b>θ1</b>.</p>',controls:['tcView','pb5','pb1','pf1','top'],setup(sim){setView(sim,'height');},
     done:sim=>filled(sim,'ht',['t1']),doneHint:'Record θ1 in the height table.'},
    {title:'Height: sight the base',text:'<p>From the same spot, sight the base of the tree, where the trunk meets the ground. Your partner reads <b>θ2</b>.</p>',controls:['tcView','pb5','pb1','pf1','top','base'],setup(sim){setView(sim,'height');},
     done:sim=>filled(sim,'ht',['t2']),doneHint:'Record θ2 in the height table.'},
    {title:'Calculate the height',text:'<p>Fill in the rest of the height table:</p><ul><li>tan θ1 and tan θ2 (calculator in degrees)</li><li>DB = AB × tan θ1</li><li>BC = AB × tan θ2 (your eye height)</li><li>h = DB + BC</li></ul>',controls:['tcView'],
     done:sim=>filled(sim,'ht',['tn1','tn2','db','bc','h']),doneHint:'Fill in every column of the height table.'},
    {title:'Calculate carbon storage',text:'<p>Complete the <b>Tree Stats</b> table:</p><ul><li>Diameter d = circumference ÷ π (cm)</li><li>Height h from your height table (m)</li><li>Green weight: d &lt; 28 cm: GW = 0.0577 × d² × h; d ≥ 28 cm: GW = 0.0346 × d² × h (kg)</li><li>Dry weight DW = GW × 0.5 (kg)</li><li>Carbon storage C = DW × 0.5 (kg C)</li><li>Average carbon sequestration rate = C ÷ age (kg C/yr)</li></ul>',controls:['tcView'],
     done:sim=>filled(sim,'ts',['d','h','gw','dw','c','r']),doneHint:'Fill in every column of the Tree Stats table.'},
    {title:'Compare with other groups',text:'<p>Open the <b>class sheet</b>. Record each tree’s carbon storage in the <b>Class data</b> table, including your own tree. Your bar graph draws from it.</p>',controls:['tcView'],setup(sim){setView(sim,'sheet');},
     done:sim=>Array.from({length:NT},(_,r)=>sim.vlab.raw('c:cls:c:'+r).trim()!=='').every(Boolean),doneHint:'Record the carbon storage for all eight trees.'},
    {title:'Analysis and conclusion',text:'<p>Answer analysis questions 1 to 6 and the bonus below the bench. Question 6 and the bonus also have calculation boxes.</p>',controls:['tcView']}],
  tables:[
    {id:'dbh',title:'Diameter at breast height',cols:[fixedN,{id:'c',label:'Circumference at 1.4 m (cm)',input:'number',dp:1,check:circCheck}]},
    {id:'ht',title:'Height',cols:[fixedN,{id:'ab',label:'AB (m)',input:'number',dp:2,check:abCheck},{id:'t1',label:'θ1 (°)',input:'number',dp:0,check:angCheck('top')},{id:'t2',label:'θ2 (°)',input:'number',dp:0,check:angCheck('base')},
      {id:'tn1',label:'tan θ1',input:'number',dp:3,check:tanCheck('1')},{id:'tn2',label:'tan θ2',input:'number',dp:3,check:tanCheck('2')},{id:'db',label:'DB (m)',input:'number',dp:2,check:prodCheck('1')},{id:'bc',label:'BC (m)',input:'number',dp:2,check:prodCheck('2')},{id:'h',label:'h (m)',input:'number',dp:1,check:hCheck}]},
    {id:'ts',title:'Our Tree Stats data table',cols:[fixedN,{id:'sp',label:'Tree species',input:'select',options:SPK.map(k=>({v:k,l:SP[k].l})),check:spCheck},{id:'age',label:'Approximate age (yr)',input:'number',dp:0,check:ageCheck},
      {id:'d',label:'Diameter (cm)',input:'number',dp:1,check:dCheck},{id:'h',label:'Height (m)',input:'number',dp:1,check:htCheck},{id:'gw',label:'Green weight (kg)',input:'number',dp:0,check:gwCheck},
      {id:'dw',label:'Dry weight (kg)',input:'number',dp:0,check:halfCheck('gw','green weight','DW = GW × 0.5. Check your calculation.')},{id:'c',label:'Carbon storage (kg C)',input:'number',dp:0,check:halfCheck('dw','dry weight','C = DW × 0.5. Check your calculation.')},
      {id:'r',label:'Avg carbon sequestration rate (kg C/yr)',input:'number',dp:1,check:rateCheck}]},
    {id:'cls',title:'Class data: carbon storage of each tree',cols:[{id:'n',label:'Tree #',rows:Array.from({length:NT},(_,i)=>i+1)},
      {id:'sp',label:'Species',get rows(){const D=tcCur();return Array.from({length:NT},(_,i)=>D?SP[D.trees[i].sk].l:'');},get rowLabels(){return this.rows;}},
      {id:'c',label:'Carbon storage (kg C)',input:'number',dp:0,check:clsCheck}]}],
  graph:{type:'bar',title:'Carbon stored in each campus tree',xl:'Tree number',yl:'Carbon storage (kg C)',ymin:0,series:[{table:'cls',x:'n',y:'c',label:'Carbon storage'}]},
  calcs:[{id:'q6c',label:'Question 6: stored carbon in the forest',unit:'kg C/ha',input:'number',check:q6c},{id:'q6r',label:'Question 6: average sequestration rate of the forest',unit:'kg C/ha/yr',input:'number',check:q6r},
    {id:'qb',label:'Bonus: hectares of forest to offset one person',unit:'ha',input:'number',check:qB}],
  questions:[
    {id:'q1',n:'1',q:'<p>Compare your tree’s carbon storage with other groups. Which tree stores the most carbon? Does it look like the biggest tree?</p>'},
    {id:'q2',n:'2',q:'<p>Besides diameter and height, name at least 2 other factors that might influence how much carbon a tree can absorb.</p>'},
    {id:'q3',n:'3',q:'<p>Which forest would have more stored carbon: an old-growth forest or a young-growth forest? Answer in one sentence.</p>'},
    {id:'q4',n:'4',q:'<p>What happens to the stored carbon if the tree is burned? What is the impact on the carbon cycle and climate change?</p>'},
    {id:'q5',n:'5',q:'<p>What other part of the forest is likely to store a significant amount of carbon?</p>'},
    {id:'q6',n:'6',q:'<p>Assume a forest has 400 trees like yours per hectare (10,000 m², about 2.5 acres), and the forest is 45 years old. Calculate the stored carbon (kg C/ha) and the average sequestration rate (kg C/ha/yr). Show your work here, and put your answers in the Calculations boxes.</p>'},
    {id:'qb',n:'Bonus',q:'<p>The average carbon footprint of a person in the US is 16 metric tons of CO₂ per year, about 4363 kg of carbon. How many hectares of your forest would it take to offset one person’s footprint? Show your work, and put your answer in the Calculations box.</p>'}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion for the lab question: how much carbon can trees and forests store, and how can that help address climate change? Use your tree’s data and the class data as evidence.</p>',cer:true}};

/* ---------------- the tool ---------------- */
const TREE={
  id:'treecarbon',hash:'treecarbon',apUnit:13,order:2,kind:'Simulation',tab:'Tree carbon storage',
  card:'Grow a campus tree year by year and work out how much carbon its wood stores, then scale it up to a forest.',
  title:'Tree carbon storage and sequestration',
  lede:{bio:'A tree builds its wood out of carbon dioxide from the air. Pick a species and an age, and see how much carbon the tree stores and how much it adds each year.',
        honors:'Estimate a tree’s carbon from its diameter and height with the green weight, dry weight and carbon formulas, then scale one tree up to a hectare of forest.',
        ap:'Compare storage and sequestration curves across species, convert carbon to CO₂, and follow the carbon after a wildfire or a timber harvest.'},
  scale:'Real scale: one tree, 1 to 26 m tall, and a forest stand of 1 hectare (100 m × 100 m).',
  timeScale:3,dtMax:0.25,prewarm:0,sampleDt:0.5,window:100,unit:'years',timeLabel:'Time',chChange:2,chReveal:20,
  clock(sim){const b=tcB(sim);if(b)return 'Campus tree survey';return 'Tree age '+Math.round(sim.st.age)+' years';},
  controls:[
    {id:'species',label:'Species',type:'select',def:'ash',lvl:'bio',options:SPK.map(k=>({v:k,l:SP[k].l})),help:'Six trees common on Colorado campuses.'},
    {id:'age',label:'Tree age',type:'range',min:1,max:150,step:1,def:10,unit:' years',lvl:'bio',help:'Press Play to watch the tree grow.',onChange(sim){if(sim.st&&!sim.st.B){sim.st.age=sim.p.age;sim.st.H=[];sim.infoDirty=true;}}},
    {id:'view',label:'Look at',type:'seg',def:'tree',lvl:'bio',noTrial:true,options:[{v:'tree',l:'One tree'},{v:'stand',l:'Forest stand (1 hectare)'}]},
    {id:'dens',label:'Trees per hectare',type:'range',min:100,max:1000,step:50,def:400,unit:'',lvl:'honors',help:'All the same age as this tree.'},
    {id:'roots',label:'Count the roots too',type:'toggle',def:false,lvl:'ap',help:'Trees for the Future adds 20% for roots. The handout’s formula leaves them out.'},
    // virtual lab bench only
    {id:'tcView',label:'Look at',type:'seg',def:'map',vlab:true,noTrial:true,options:[{v:'map',l:'Campus map'},{v:'dbh',l:'Trunk'},{v:'height',l:'Height'},{v:'sheet',l:'Class sheet'}],onChange(sim){const b=tcB(sim);if(!b)return;b.view=sim.p.tcView;if(b.view==='dbh'&&!b.wraps.includes(sim.p.tapeAt))b.wraps.push(sim.p.tapeAt);}},
    {id:'tapeAt',label:'Wrap the tape at',type:'seg',def:1,vlab:true,noTrial:true,options:[{v:0.5,l:'0.5 m'},{v:1,l:'1.0 m'},{v:1.4,l:'1.4 m'},{v:1.8,l:'1.8 m'}],
     onChange(sim){const b=tcB(sim);if(!b)return;b.tape=sim.p.tapeAt;if(!b.wraps.includes(b.tape))b.wraps.push(b.tape);if(sim.p.tcView!=='dbh')BioLab.setValues(sim,{tcView:'dbh'});}}
  ],
  actions:[
    {id:'skip',label:'Skip ahead 10 years',lvl:'bio',run(sim){if(sim.st.B)return;sim.st.age=Math.min(150,sim.st.age+10);syncAge(sim);sim.infoDirty=true;}},
    {id:'burn',label:'Wildfire',lvl:'ap',run(sim){if(!sim.st.B)event(sim,'burn');}},
    {id:'harvest',label:'Harvest for lumber',lvl:'ap',run(sim){if(!sim.st.B)event(sim,'harvest');}},
    {id:'pb5',label:'Take 5 paces back',vlab:true,run(s){paceBy(s,5);}},
    {id:'pb1',label:'1 pace back',vlab:true,run(s){paceBy(s,1);}},
    {id:'pf1',label:'1 pace forward',vlab:true,enabled:s=>{const b=tcB(s);return !!b&&b.pos>1.2;},run(s){paceBy(s,-1);}},
    {id:'top',label:'Sight the top',primary:true,vlab:true,run(s){sight(s,'top');}},
    {id:'base',label:'Sight the base',vlab:true,run(s){sight(s,'base');}}
  ],
  labs:[LAB],
  benchRead(sim){const b=tcB(sim),D=tcD(sim);if(!b)return null;const T=D.T;return {view:sim.p.tcView,tree:{n:T.n,sp:T.sk,age:T.age},tapeAt:sim.p.tapeAt,circ:Math.round(circAt(D,sim.p.tapeAt)*100)/100,wraps:b.wraps.slice(),
    pos:b.pos,np:b.np,hidden:topHidden(D,b.pos),topAngle:angTop(D,b.pos),last:b.last,sheet:D.trees.map(t=>({n:t.n,sp:t.sk,c:t.g.c})),mine:D.mine};},
  init(sim){const st={age:sim.p.age,wood:0,slash:0,air:0,fire:-99,cut:-99,evt:null,H:[],lastH:-1e9};if(tcV(sim))st.B=benchInit(sim);return st;},
  step(sim,dt){const st=sim.st;if(st.B||sim.t<0)return;st.age=Math.min(150,st.age+dt);
    const ks=1-Math.pow(0.5,dt/3),kw=1-Math.pow(0.5,dt/35),ds=st.slash*ks,dw=st.wood*kw;st.slash-=ds;st.wood-=dw;st.air+=ds+dw;
    if(Math.round(st.age)!==sim.p.age){syncAge(sim);sim.infoDirty=true;}
    if(sim.t-st.lastH>=0.5-1e-9){st.lastH=sim.t;const N=dens(sim);st.H.push({t:sim.t,tree:now(sim).c*N/1000,wood:st.wood,air:st.air});if(st.H.length>400)st.H.shift();}},
  metrics:[
    {id:'d',label:'Trunk diameter (DBH)',unit:'cm',lvl:'bio',min:0,max:130,d:1,get:s=>now(s).d},
    {id:'h',label:'Height',unit:'m',lvl:'bio',min:0,max:30,d:1,get:s=>now(s).h},
    {id:'C',label:'Carbon stored',unit:'kg C',lvl:'bio',min:0,max:null,d:0,get:s=>now(s).c},
    {id:'seq',label:'Carbon taken in this year',unit:'kg C/yr',lvl:'bio',min:0,max:null,d:1,get:s=>now(s).seq},
    {id:'GW',label:'Green weight',unit:'kg',lvl:'honors',min:0,max:null,d:0,get:s=>now(s).gw},
    {id:'DW',label:'Dry weight',unit:'kg',lvl:'honors',min:0,max:null,d:0,get:s=>now(s).dw},
    {id:'avg',label:'Average sequestration rate (C ÷ age)',unit:'kg C/yr',lvl:'honors',min:0,max:null,d:1,get:s=>now(s).avg},
    {id:'standC',label:'Forest stand: carbon stored',unit:'t C/ha',lvl:'honors',min:0,max:null,d:1,get:s=>now(s).c*dens(s)/1000},
    {id:'standSeq',label:'Forest stand: carbon taken in',unit:'t C/ha/yr',lvl:'honors',min:0,max:null,d:2,get:s=>now(s).seq*dens(s)/1000},
    {id:'co2',label:'CO₂ pulled from the air (this tree)',unit:'kg CO₂',lvl:'ap',min:0,max:null,d:0,get:s=>now(s).c*CO2},
    {id:'lumber',label:'Carbon still in lumber',unit:'t C/ha',lvl:'ap',min:0,max:null,d:1,get:s=>s.st.wood},
    {id:'air',label:'CO₂ returned to the air',unit:'t CO₂/ha',lvl:'ap',min:0,max:null,d:1,get:s=>s.st.air*CO2}
  ],
  graphs:[{id:'store',label:'Carbon storage vs age',custom:true},{id:'seq',label:'Carbon sequestration vs age',custom:true},{id:'stand',label:'Forest stand carbon vs age',lvl:'honors',custom:true},{id:'pools',label:'Where the stand’s carbon goes',lvl:'ap',custom:true}],
  defaultGraph:'store',
  plot(sim,ctx,box,id){const s=spOf(sim),r=roots(sim),a=sim.st.age,hon=atLeast('honors');
    if(id==='pools'){const H=sim.st.H,xmax=Math.max(40,sim.t),xmin=Math.max(0,xmax-100);let hi=1;H.forEach(q=>{hi=Math.max(hi,q.tree,q.wood,q.air);});
      const items=[['Carbon in living trees','tree'],['Carbon in lumber','wood'],['Carbon back in the air','air']];let lx=box.L;items.forEach((it,i)=>{ctx.strokeStyle=serColor(i);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(lx,14);ctx.lineTo(lx+16,14);ctx.stroke();txt(ctx,it[0],lx+21,14,{s:13,c:PAL['muted'],b:'middle'});ctx.font='13px '+FONT;lx+=ctx.measureText(it[0]).width+40;});
      const b2=Object.assign({},box,{T:34,H:box.H-22});const ax=axes(ctx,b2,{xmin,xmax,ymin:0,ymax:hi*1.1,xl:'Time (years)',yl:'Carbon (t C/ha)'});
      ctx.save();ctx.beginPath();ctx.rect(b2.L,b2.T,b2.W,b2.H);ctx.clip();items.forEach((it,i)=>{ctx.strokeStyle=serColor(i);ctx.lineWidth=2.5;ctx.beginPath();let pen=false;H.forEach(q=>{if(q.t<xmin)return;const X=ax.X(q.t),Y=ax.Y(q[it[1]]);pen?ctx.lineTo(X,Y):ctx.moveTo(X,Y);pen=true;});ctx.stroke();});ctx.restore();return;}
    const N=dens(sim),f=id==='stand'?(x=>CS(s,x,r)*N/1000):id==='seq'?(x=>Math.max(0,seqS(s,x,r))):(x=>CS(s,x,r));
    const yl=id==='stand'?'Carbon stored (t C/ha)':id==='seq'?'Carbon taken in (kg C/yr)':'Carbon stored (kg C)';
    let hi=0;for(let x=1;x<=150;x++)hi=Math.max(hi,f(x));const others=hon&&id!=='stand';if(others)SPK.forEach(k=>{for(let x=1;x<=150;x+=2){const v=id==='seq'?seqS(SP[k],x,r):CS(SP[k],x,r);hi=Math.max(hi,Math.min(v,hi*3));}});
    const items=[{label:s.l,color:serColor(0)}];if(id==='seq'&&hon)items.push({label:'Lifetime average (C ÷ age)',color:serColor(1),dash:true});if(others)items.push({label:'Other species',color:PAL['cv-soft']});
    let lx=box.L;items.forEach(it=>{ctx.strokeStyle=it.color;ctx.lineWidth=3;ctx.setLineDash(it.dash?[5,4]:[]);ctx.beginPath();ctx.moveTo(lx,14);ctx.lineTo(lx+16,14);ctx.stroke();ctx.setLineDash([]);txt(ctx,it.label,lx+21,14,{s:13,c:PAL['muted'],b:'middle'});ctx.font='13px '+FONT;lx+=ctx.measureText(it.label).width+40;});
    const b2=Object.assign({},box,{T:34,H:box.H-22});const ax=axes(ctx,b2,{xmin:0,xmax:150,ymin:0,ymax:hi*1.08||1,xl:'Tree age (years)',yl});
    ctx.save();ctx.beginPath();ctx.rect(b2.L,b2.T,b2.W,b2.H);ctx.clip();const line=(g,col,w,dash)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.setLineDash(dash?[5,4]:[]);ctx.beginPath();for(let x=1;x<=150;x++){const X=ax.X(x),Y=ax.Y(g(x));x>1?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}ctx.stroke();ctx.setLineDash([]);};
    if(others)SPK.forEach(k=>{if(SP[k]===s)return;line(x=>id==='seq'?Math.max(0,seqS(SP[k],x,r)):CS(SP[k],x,r),PAL['cv-soft'],1.2);});
    if(id==='seq'&&hon)line(x=>CS(s,x,r)/x,serColor(1),2,true);
    line(f,serColor(0),3);ctx.fillStyle=serColor(0);ctx.beginPath();ctx.arc(ax.X(a),ax.Y(f(a)),6,0,6.283);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.stroke();ctx.restore();
    txt(ctx,'Age '+Math.round(a),clamp(ax.X(a),b2.L+30,b2.L+b2.W-30),Math.max(b2.T+14,ax.Y(f(a))-12),{s:12,w:700,a:'center',c:PAL['fg']});},
  initVis(sim){sim.vis.co=[];},
  draw(sim,ctx,vdt,k,t){if(tcB(sim)){drawTCBench(sim,ctx,k);return;}drawTree(sim,ctx,vdt,k,t);}
};
function drawTree(sim,ctx,vdt,k,t){const n=now(sim),s=n.s,p=sim.p,hon=atLeast('honors'),ap=atLeast('ap'),fs=Math.min(12.5*k,20),v=sim.vis,R=Math.random,st=sim.st;
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle='rgba(120,175,230,.18)';ctx.fillRect(0,0,548,400);const G=400;ctx.fillStyle='#5f9f42';ctx.fillRect(0,G,548,50);
  const fire=sim.t-st.fire<4,stand=p.view==='stand';
  if(!stand){const sc=330/(s.hm+2),tx=250;
    // scale bar
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;const step=n.h>14?5:2;for(let m=0;m<=n.h+2;m+=step){const y=G-m*sc;ctx.beginPath();ctx.moveTo(30,y);ctx.lineTo(40,y);ctx.stroke();txt(ctx,m+' m',46,y+5,{s:Math.min(12*k,17),c:PAL['cv-soft']});}
    ctx.beginPath();ctx.moveTo(35,G);ctx.lineTo(35,G-(Math.floor((n.h+2)/step)*step)*sc);ctx.stroke();
    if(fire&&st.evt==='burn'){ctx.fillStyle='#2b2522';ctx.fillRect(tx-6,G-60,12,60);ctx.fillStyle='rgba(90,90,90,.35)';for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(tx+Math.sin(t+i)*20,G-90-i*30-(t*20%30),18+i*3,0,6.283);ctx.fill();}}
    else if(fire&&st.evt==='harvest'){ctx.fillStyle='#7a5532';ctx.fillRect(tx-10,G-10,20,10);}
    treeShape(ctx,s,tx,G,n.h*sc,Math.max(4,n.d/100*sc*3),k,sc);
    // a person for scale
    const px=420,ph=1.7*sc;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(px,G);ctx.lineTo(px,G-ph*0.5);ctx.moveTo(px-5,G);ctx.lineTo(px,G-ph*0.5);ctx.lineTo(px+5,G);ctx.moveTo(px,G-ph*0.5);ctx.lineTo(px,G-ph*0.85);ctx.stroke();ctx.beginPath();ctx.arc(px,G-ph*0.93,Math.max(3,ph*0.08),0,6.283);ctx.stroke();
    txt(ctx,'1.7 m person',px,G+22,{s:Math.min(12*k,17),c:'#ffffff',a:'center',w:600});
    // the DBH tape at 1.4 m and the height arrow
    if(n.h>1.4){ctx.fillStyle='#f2c230';ctx.fillRect(tx-Math.max(4,n.d/100*sc*3)/2-3,G-1.4*sc-3,Math.max(4,n.d/100*sc*3)+6,6);}
    txt(ctx,'Trunk width drawn 3× wider',tx,G+22,{s:Math.min(11*k,16),c:'#ffffff',a:'center'});
    // CO2 entering the leaves, at the rate this tree takes in carbon
    if(vdt>0&&n.seq>0){let m=Math.min(4,0.5+n.seq/8)*vdt*8*(RM?.5:1);while(m>0){if(R()<m&&v.co.length<90)v.co.push({x:tx+(R()<.5?-1:1)*(120+R()*120),y:G-n.h*sc*(0.4+R()*0.6),tx:tx+(R()-.5)*n.h*sc*0.4,ty:G-n.h*sc*(0.55+R()*0.35),f:0});m--;}}
    v.co.forEach(q=>{q.f+=vdt*0.6;});v.co=v.co.filter(q=>q.f<1);ctx.font='700 '+Math.min(11*k,15)+'px '+FONT;v.co.forEach(q=>{const x=lerp(q.x,q.tx,q.f),y=lerp(q.y,q.ty,q.f);ctx.globalAlpha=1-q.f*0.7;pill(ctx,'CO₂',x,y,'rgba(70,110,170,.85)','#ffffff',Math.min(10*k,14));});ctx.globalAlpha=1;
    txt(ctx,SP[p.species].l+', '+Math.round(n.a)+' years',16,26,{s:Math.min(14*k,22),w:700});}
  else{const N=dens(sim),icons=100,per=N/icons;txt(ctx,'1 hectare: '+N+' trees, '+Math.round(n.a)+' years old',16,26,{s:Math.min(14*k,22),w:700});txt(ctx,'Each tree drawn here stands for '+fmtNum(per,per<10?1:0)+' trees',16,26+Math.min(14*k,22)*1.35,{s:fs,c:PAL['cv-soft']});
    ctx.fillStyle='rgba(98,150,80,.35)';ctx.beginPath();ctx.moveTo(40,G+30);ctx.lineTo(508,G+30);ctx.lineTo(430,150);ctx.lineTo(118,150);ctx.closePath();ctx.fill();
    const hs=Math.min(1,n.h/18);for(let r=0;r<10;r++)for(let c=0;c<10;c++){const f=r/9,y=150+(G+20-150)*f,x0=lerp(126,48,f),x1=lerp(422,500,f),x=lerp(x0,x1,(c+0.5)/10),sc2=lerp(0.45,1,f);
      if(fire&&st.evt==='burn'){ctx.fillStyle='#2b2522';ctx.fillRect(x-1.5,y-14*sc2,3,14*sc2);continue;}if(fire&&st.evt==='harvest'){ctx.fillStyle='#7a5532';ctx.fillRect(x-3,y-3,6,3);continue;}
      treeShape(ctx,s,x,y,Math.max(6,60*hs*sc2),Math.max(2,4*hs*sc2),k,1);}}
  // the carbon panel
  const X=556,W=232,Y=10,H=432;ctx.fillStyle=PAL['card'];rr(ctx,X,Y,W,H,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,X,Y,W,H,10);ctx.stroke();
  let y=Y+16+fs;const line=(a,b,o)=>{o=o||{};txt(ctx,a,X+12,y,{s:o.s||fs,w:o.w||400,c:o.c||PAL['cv-ink']});if(b!==undefined)txt(ctx,b,X+W-12,y,{s:o.s||fs,w:700,a:'right',c:o.c||PAL['cv-ink']});y+=(o.s||fs)*1.5;};
  line(stand?'This hectare':'This tree',undefined,{w:700});
  if(stand){line('Carbon stored',fmtNum(n.c*dens(sim)/1000,1)+' t');line('Added this year',fmtNum(n.seq*dens(sim)/1000,2)+' t');}
  else{line('Diameter',n.d.toFixed(1)+' cm');line('Height',n.h.toFixed(1)+' m');line('Carbon stored',Math.round(n.c)+' kg');line('Added this year',n.seq.toFixed(1)+' kg');}
  // carbon column: how much of the tree's dry wood is carbon
  y+=fs*0.4;const cw=W-24,chh=Math.min(120,H-(y-Y)-fs*5.5);if(chh>40){const full=Math.max(10,CS(s,150,roots(sim))),fr=clamp(CS(s,n.a,roots(sim))/full,0,1);ctx.fillStyle=PAL['line'];ctx.fillRect(X+12,y,cw,chh);ctx.fillStyle='#3a3a3a';ctx.fillRect(X+12,y+chh*(1-fr),cw,chh*fr);
    txt(ctx,'Carbon stored, vs the same tree at 150 years',X+12,y+chh+fs*1.2,{s:Math.min(11*k,15),c:PAL['cv-soft']});y+=chh+fs*2.2;}
  if(hon&&!stand&&y<Y+H-fs*3){line('d '+(n.d<28?'< 28':'≥ 28')+' cm: GW = '+(n.d<28?'0.0577':'0.0346')+' d²h',undefined,{s:Math.min(11*k,15),c:PAL['cv-soft']});}
  if(ap&&y<Y+H-fs*1.5)line('CO₂ = C × 44 ÷ 12',fmtNum(n.c*CO2*(stand?dens(sim)/1000:1),stand?1:0)+(stand?' t':' kg'),{s:Math.min(11.5*k,16)});}
Object.assign(TREE,{
  narrate(sim){if(tcB(sim))return benchNarrate(sim);const n=now(sim),st=sim.st,nm=n.s.l.toLowerCase(),peak=(()=>{let b=0,bx=0;for(let x=1;x<=150;x++){const q=seqS(n.s,x,roots(sim));if(q>b){b=q;bx=x;}}return bx;})();
    if(sim.t-st.fire<4&&st.evt==='burn')return '<b>The fire released most of the stored carbon as CO₂ within days.</b> A new tree is starting over, and it will take decades to take that carbon back out of the air.';
    if(sim.t-st.cut<4&&st.evt==='harvest')return '<b>The logs went to a sawmill.</b> About half the carbon stays locked in lumber for decades; the branches, roots and sawdust decay and release theirs within a few years.';
    if(n.d>=26&&n.d<31&&sim.p.view!=='stand')return 'The trunk is about 28 cm across, where the handout switches to its second formula, which gives about 40% less green weight for the same size. <b>The Carbon stored readout drops for a year or two, but the tree did not lose carbon</b>: only the estimate changed. The graph blends the two formulas.';
    if(sim.p.view==='stand')return 'This hectare of '+nm+' holds <b>'+fmtNum(n.c*dens(sim)/1000,1)+' metric tons of carbon</b> in its trees and adds '+fmtNum(n.seq*dens(sim)/1000,2)+' t each year. A forest is many trees each storing carbon at once.';
    if(n.a<peak-8)return 'This '+Math.round(n.a)+'-year-old '+nm+' is growing fast. It stores <b>'+Math.round(n.c)+' kg of carbon</b> and adds more each year than the year before: <b>'+n.seq.toFixed(1)+' kg</b> this year.';
    if(n.a<peak+8)return 'At '+Math.round(n.a)+' years this '+nm+' takes in carbon about as fast as it ever will: <b>'+n.seq.toFixed(1)+' kg of carbon a year</b>. It stores '+Math.round(n.c)+' kg in all.';
    return 'This '+Math.round(n.a)+'-year-old '+nm+' stores <b>'+Math.round(n.c)+' kg of carbon</b>, more than ever, but its growth is slowing, so it adds only <b>'+n.seq.toFixed(1)+' kg</b> a year now.';},
  tour:[
    {title:'A young tree',text:'This green ash is 10 years old and about 6 m tall. Its trunk is only 15 cm across at breast height, 1.4 m above the ground, where foresters measure it.',focus:[0,0,548,450],speed:0.3,setup(sim){BioLab.setValues(sim,{species:'ash',view:'tree',age:10});}},
    {title:'Wood is made of air',text:'The blue CO₂ labels drift into the leaves. Photosynthesis turns that carbon dioxide into sugar, and the tree builds the sugar into wood. About half of dry wood is carbon.',focus:[0,0,548,450],speed:0.3},
    {title:'Size tells you the carbon',text:'Bigger trunks and taller trees hold more wood. The handout’s formulas turn diameter and height into green weight, dry weight and carbon. Watch the Carbon stored readout as the tree grows.',focus:[552,6,240,440],speed:1},
    {title:'Storage keeps climbing',text:'The graph shows carbon stored against age. It climbs for decades and then levels off as the tree reaches its full size.',focus:[0,0,548,450],speed:2,setup(sim){BioLab.setValues(sim,{age:35});}},
    {title:'Sequestration rises, then falls',text:'Carbon taken in each year rises while the tree grows fast, peaks around 40 years for a green ash, then falls as growth slows. The old tree stores the most, but adds less each year.',focus:[552,6,240,440],speed:2,setup(sim){BioLab.setValues(sim,{age:70});}},
    {title:'A whole forest',text:'One hectare (100 m × 100 m) with 400 trees like this one. Multiply one tree by 400, and a forest stores many metric tons of carbon.',focus:[0,0,548,450],speed:1,setup(sim){BioLab.setValues(sim,{view:'stand',age:45});}},
    {lvl:'ap',title:'Fire returns the carbon',text:'A wildfire burns the stand. Most of its stored carbon goes back into the air as CO₂ within days. Regrowing that carbon takes as long as the forest took to grow.',focus:[0,0,548,450],speed:1,setup(sim){BioLab.setValues(sim,{view:'stand',age:60});event(sim,'burn');}}],
  onTourExit(sim){BioLab.setValues(sim,{species:'ash',view:'tree',dens:400,roots:false,age:10});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'Watch this 40-year-old green ash grow to 90. What happens to the carbon it takes in each year?',
     choices:['It keeps rising, because a bigger tree takes in more','It falls, even though the tree keeps storing more','It stays the same every year'],correct:1,
     baseline:{species:'ash',age:40},reveal:50,watch:'seq',
     explain:{bio:'Carbon stored keeps climbing, but the tree’s growth slows as it ages, so each year it adds less new wood. Sequestration peaks in the middle years and then falls. Storage and sequestration are different things.',
              honors:'Storage is the total, C(age). Sequestration is how fast that total grows, the slope of the storage curve. The slope is steepest around 40 years for a green ash and flattens as the tree approaches its full size.'}},
    {lvl:'bio',instant:true,q:'Two trees have the same trunk diameter, 40 cm. One is 8 m tall and the other is 16 m tall. How does their stored carbon compare?',
     choices:['The same, because the trunks are the same width','The taller tree stores about twice as much','The taller tree stores four times as much'],correct:1,
     explain:'Green weight is coefficient × d² × h. With d the same, doubling h doubles the green weight, the dry weight and the carbon. Diameter counts twice (it is squared), height once.'},
    {lvl:'bio',q:'This 20-year-old green ash keeps growing. Over the next 20 years, what happens to the carbon it stores?',
     choices:['It roughly quadruples','It grows by about 10%','It stays about the same, since the tree is already full grown'],correct:0,
     baseline:{species:'ash',age:20},reveal:20,watch:'C',
     explain:{bio:'A 20-year-old green ash is still young. Its trunk widens and it grows taller every year, and the carbon grows with d² × h, so it climbs fast: from about 75 kg to about 315 kg by age 40.'}},
    {lvl:'honors',q:'This 40-year-old bur oak is switched to a cottonwood of the same age. What happens to the carbon stored?',
     choices:['It rises sharply','It stays the same: same age, same carbon','It drops'],correct:0,
     baseline:{species:'oak',age:40},at:2,reveal:6,change:{species:'cottonwood'},changeText:'Switched to a cottonwood of the same age',watch:'C',
     explain:{honors:'Cottonwoods grow fast in wet soil and reach a wide trunk and great height quickly; bur oaks grow slowly. At the same age the cottonwood is far bigger, so it stores several times as much carbon. Age alone does not set carbon storage.'}},
    {lvl:'honors',instant:true,q:'A tree’s diameter grows from 27 cm to 29 cm in a year. Using the handout’s formulas, what happens to its green weight?',
     choices:['It rises a little','It drops by about a third','It doubles'],correct:1,
     explain:'At 27 cm, GW = 0.0577 × 27² × h = 42.1 h. At 29 cm the second formula applies: GW = 0.0346 × 29² × h = 29.1 h, about 31% less. The two formulas do not meet at 28 cm, so near that size the estimate is rough. Real trees do not lose weight as they grow.'},
    {lvl:'honors',instant:true,q:'Which stores more carbon per hectare: a 100-year-old stand of green ash or a 20-year-old stand with the same number of trees?',
     choices:['The 100-year-old stand','The 20-year-old stand, because young trees take in carbon faster','About the same'],correct:0,
     explain:'Young trees can take in carbon quickly, but storage is the running total. A 100-year-old green ash holds roughly ten times the carbon of a 20-year-old one, so old forests store far more. Set the age to 20 and then 100 in the Forest stand view.'},
    {lvl:'ap',q:'A wildfire burns this 60-year-old stand. What happens to the carbon it stored?',
     choices:['It stays in the ash and soil','Most of it goes back into the air as CO₂ right away','It is destroyed'],correct:1,
     baseline:{species:'ash',age:60,view:'stand'},at:2,reveal:5,changeAction:'burn',changeText:'Wildfire',watch:'air',
     explain:{ap:'Burning is fast oxidation: C + O₂ → CO₂. About 90% of the wood’s carbon goes up as CO₂ within days, and the rest is charcoal and dead wood that decay over years. Matter is not destroyed. The carbon moves from the forest pool to the atmosphere pool.'}},
    {lvl:'ap',q:'Instead of burning, the 60-year-old stand is harvested for lumber. Ten years later, about how much of its carbon is back in the air?',
     choices:['All of it','About half, because the lumber still holds the rest','None of it'],correct:1,
     baseline:{species:'ash',age:60,view:'stand'},at:2,reveal:12,changeAction:'harvest',changeText:'Harvested for lumber',watch:'air',
     explain:{ap:'About 55% of the carbon leaves as logs that become lumber, which can last for decades in buildings (half-life about 35 years here). The branches, roots and sawdust decay within a few years. After 10 years roughly half of the stand’s carbon is back in the air.'}},
    {lvl:'ap',instant:true,q:'Your tree stores 500 kg of carbon. How much CO₂ did it pull from the air to build that wood?',
     choices:['500 kg','About 1,830 kg','About 136 kg'],correct:1,
     explain:'Each CO₂ molecule (44 g/mol) carries one carbon atom (12 g/mol). So CO₂ = C × 44 ÷ 12 = 500 × 3.67 ≈ 1,833 kg. The oxygen goes back to the air.'}],
  lab:{bio:'<p><b>Question:</b> How does a tree’s carbon storage change as it ages?</p><ol><li>Choose a species. Set the age to 10, 20, 40, 60, 80 and 100 years and record a trial at each.</li><li>Do the same for a second species.</li></ol><p>Plot age against carbon stored for both. Which species stores more by age 60, and why?</p>',
       honors:'<p><b>Question:</b> When does a tree take in carbon fastest, and how much can a forest store?</p><ol><li>For one species, record diameter, height, green weight, dry weight and carbon at ages 10 to 100.</li><li>Check one row by hand with the handout formulas.</li><li>Record the carbon taken in each year, and find the age where it peaks.</li><li>In the Forest stand view, record stand carbon at 200, 400 and 800 trees per hectare.</li></ol><p>Explain why sequestration peaks while storage keeps rising.</p>',
       ap:'<p><b>Question:</b> How long does the carbon stay out of the atmosphere after a forest is burned or harvested?</p><ol><li>Grow a stand of green ash to 60 years, then use Wildfire. Record CO₂ returned to the air every 5 years for 30 years.</li><li>Repeat with Harvest for lumber.</li><li>Compare with the carbon the regrowing stand takes back in.</li></ol><p><b>Claim–evidence–reasoning:</b> Is harvested wood a carbon sink, and what land use stores the most carbon over 50 years?</p>'},
  terms:[{t:'Carbon storage',d:'The total carbon held in a tree’s wood, bark, roots and leaves (kg C).'},{t:'Carbon sequestration',d:'Carbon a tree pulls out of the air and adds to its body each year (kg C per year).'},{t:'DBH',d:'Diameter at breast height: trunk diameter measured 1.4 m (4.5 ft) above the ground.'},{t:'Photosynthesis',d:'Plants using light to turn CO₂ and water into sugar, releasing O₂.'},
    {lvl:'honors',t:'Green weight',d:'The weight of a living tree, water included.'},{lvl:'honors',t:'Dry weight',d:'The weight left once the water is gone, about half the green weight.'},{lvl:'honors',t:'Clinometer',d:'A tool that measures the angle up to the top of an object, used to work out its height.'},{lvl:'honors',t:'Hectare',d:'An area of 10,000 m², a square 100 m on a side, about 2.5 acres.'},
    {lvl:'ap',t:'Carbon sink',d:'Anything that takes in more carbon than it releases, such as a growing forest.'},{lvl:'ap',t:'Carbon pool',d:'A place carbon is held: the atmosphere, living trees, soil, the ocean, wood products.'},{lvl:'ap',t:'Old-growth forest',d:'A forest that has grown for centuries without major disturbance. It holds large amounts of carbon.'}],
  about:'<p><b>Growth.</b> Trunk diameter at breast height and height follow Chapman–Richards curves, d(a) = d<sub>max</sub>(1 − e<sup>−ka</sup>)<sup>p</sup> and h(a) = 0.3 + (h<sub>max</sub> − 0.3)(1 − e<sup>−k<sub>h</sub>a</sup>)<sup>1.1</sup>, set for each species from typical Colorado urban tree sizes (US Forest Service urban tree growth data and Colorado State Forest Service species notes): fast cottonwood, medium honeylocust and green ash, slower pines, spruces and bur oak.</p>'+
    '<p><b>Carbon.</b> The readouts use the handout’s formulas, after Trees for the Future (2007): GW = 0.0577 d²h for d &lt; 28 cm and 0.0346 d²h for d ≥ 28 cm (d in cm, h in m), DW = 0.5 GW and C = 0.5 DW. The original method adds 20% for roots; turn on Count the roots too to include them. The two formulas do not meet at 28 cm, so the age curves blend them smoothly between about 20 and 36 cm; otherwise a tree would seem to lose 40% of its carbon the year it passed 28 cm. Near 28 cm, the curve and the readout can differ by up to 20%. Carbon taken in each year is the slope of the storage curve.</p>'+
    '<p><b>Stands and fates.</b> Every tree in the stand is the same age and size, and none die. A wildfire releases 90% of the stand’s carbon at once and leaves 10% as dead wood. A harvest sends 55% to lumber (half-life 35 years) and leaves 45% as slash; dead wood and slash decay with a 3-year half-life. Soil carbon is not modeled, though in many forests the soil holds as much carbon as the trees.</p>'+
    '<p><b>The virtual lab bench.</b> Each campus tree’s size comes from its species curve with seeded variation, kept within 15 to 70 cm in diameter and 6 to 20 m in height. The trunk flares near the ground, so the tape reads about 9% more at 0.5 m than at breast height. Each pace is your own pace length with a little variation, and each clinometer sighting adds about ±0.6° of error. The geometry uses the distance to the center of the trunk, so your height will run a little low, as it does in a real survey.</p>'
});
BioLab.addPractical({treecarbon:{
  hook:'A 40-year-old green ash on campus has a trunk about 50 cm across and stands about 15 m tall. How much carbon does it store, and how many trees like it would it take to soak up one American’s 16 metric tons of CO₂ a year?',
  answer:'The handout formulas give about 315 kg of carbon, which is about 1,150 kg of CO₂ pulled from the air. At 40 the tree adds about 12.6 kg of carbon a year, about 46 kg of CO₂, so offsetting 16 t of CO₂ a year would take about 350 trees like it, growing every year.',
  uses:['City tree inventories: Denver and Aurora measure street trees by trunk diameter and species to estimate how much carbon their urban forest stores and how much it is worth.',
    'Carbon offsets: forest offset projects sell credits based on measured diameters and heights in sample plots, the same measurements you make with a tape and a clinometer.',
    'Wildfire: the 2020 Cameron Peak fire burned about 209,000 acres west of Fort Collins, sending carbon the forest had stored for over a century back into the air in a few weeks.'],
  takeaway:'Trees build their wood out of CO₂, so a tree’s size tells you how much carbon it holds. Old, big trees store the most; middle-aged trees add carbon fastest; and burning or decay sends it back to the air.',
  lede:'A tree builds its wood out of carbon dioxide from the air. Pick a species and an age, and see how much carbon it stores and how much it adds each year.',
  tour:['This green ash is 10 years old and about 6 m tall. Foresters measure a trunk 1.4 m off the ground, about chest height on an adult, and this one is only 15 cm across there.',
    'The blue CO₂ labels drift into the leaves. Leaves use sunlight to turn carbon dioxide into sugar, and the tree builds wood out of that sugar. Most of a tree’s dry weight came out of the air, not the soil.',
    'A wider, taller trunk means more wood, and more wood means more carbon. The formulas on your handout turn two measurements, the trunk diameter and the height, into kilograms of carbon.',
    'The graph shows carbon stored against age. Like your height as a kid, the tree grows a lot each year at first, then slows and levels off as it reaches full size.',
    'Carbon added each year rises while the tree grows fast, peaks around 40 years for a green ash, then falls. The old tree holds the most carbon, but adds less each year, like an older athlete who stops gaining speed.',
    'This is one hectare, about the size of two football fields, with 400 trees like this one. Multiply one tree’s carbon by 400 and a forest holds many metric tons.']}});
BioLab.register(TREE);
})();
