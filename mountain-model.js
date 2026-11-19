/* Land for sale: shared model for sims/mountain.js and mountainboard.html.
   Based on Paul Stearman's "Mountain Scenario" land-use game (harvest, mine, park, corridor, a bank loan).
   Every land uses his rules and numbers (thousands of dollars, or his original CFA francs).
   Roles are the same on every land: 'tree' = the plant or habitat patch, 'deer' = the hunted animal,
   'lynx' = the protected rare animal that needs the plant. Lands only change names, shapes, art and extras.
   All money values and rates are illustrative. Land definitions after Colorado live in lands.js. */
(function(){
'use strict';
const W=800,H=450;
/* ---------- rules (Paul's numbers, in thousands of dollars) ---------- */
const R={loan:2000,tree:{get:500,cost:50},deer:{get:50,cost:0},lynx:{get:0,cost:0},vein:{get:1000,cost:250},
  protect:500,spill:1000,hunt:10,park:2500,corridor:1000,move:{lynx:250,deer:500,tree:1000},parkVal:{lynx:800,deer:400,tree:250},
  safety:100,jobs:{vein:30,tree:3,deer:1,park:15,protect:5}};
const DEFAULTS={spillPct:30,visitPct:5,leakPct:10,hunt:true,safety:'standard'};
let CUR='usd';
function setCurrency(c){CUR=c==='cfa'?'cfa':'usd';}
function fmtK(v){const s=v<0?'−':'';v=Math.abs(Math.round(v));if(CUR==='cfa')return s+v.toLocaleString('en-US')+' CFA';
  if(v>=1000){const m=v/1000;return s+'$'+(Math.round(m*100)/100).toLocaleString('en-US',{maximumFractionDigits:2})+'M';}return s+'$'+v+'K';}
function fmtK2(v){const s=v<0?'−':'';v=Math.abs(Math.round(v));return CUR==='cfa'?s+v.toLocaleString('en-US')+' CFA':s+'$'+v.toLocaleString('en-US')+'K';}
const clone=o=>JSON.parse(JSON.stringify(o));
/* ---------- geometry helpers ---------- */
function polyLen(P){const c=[0];for(let i=1;i<P.length;i++)c.push(c[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));return c;}
function pointAt(L,s){const P=L.surf,c=L.cum;s=Math.max(0,Math.min(c[c.length-1],s));let i=1;while(i<c.length-1&&c[i]<s)i++;const f=(s-c[i-1])/((c[i]-c[i-1])||1);
  const x=P[i-1][0]+(P[i][0]-P[i-1][0])*f,y=P[i-1][1]+(P[i][1]-P[i-1][1])*f,len=(c[i]-c[i-1])||1,tx=(P[i][0]-P[i-1][0])/len,ty=(P[i][1]-P[i-1][1])/len;return {x,y,tx,ty,nx:-ty,ny:tx};}
function project(L,x,y){const P=L.surf,c=L.cum;let best=1e9,bs=0;for(let i=1;i<P.length;i++){const ax=P[i-1][0],ay=P[i-1][1],dx=P[i][0]-ax,dy=P[i][1]-ay,l2=dx*dx+dy*dy||1;
  const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l2)),px=ax+t*dx,py=ay+t*dy,d=Math.hypot(x-px,y-py);if(d<best){best=d;bs=c[i-1]+t*Math.sqrt(l2);}}return bs;}
function lineY(P,x){if(!P||x<P[0][0]||x>P[P.length-1][0])return null;for(let i=1;i<P.length;i++)if(x<=P[i][0]){const f=(x-P[i-1][0])/((P[i][0]-P[i-1][0])||1);return P[i-1][1]+(P[i][1]-P[i-1][1])*f;}return null;}
function nearWaterXY(L,x,y,r){for(const w of L.WATER){const [x0,y0,x1,y1]=w.hit;const dx=Math.max(x0-x,0,x-x1),dy=Math.max(y0-y,0,y-y1);if(Math.hypot(dx,dy)<=r)return w.k;}return null;}
/* ---------- build a land from its definition ---------- */
const LANDS={},ORDER=[];
function addLand(def){const L=Object.assign({},def);L.cum=polyLen(L.surf);L.SLOTS=[];
  L.spots.forEach(z=>z.s.forEach((s,k)=>{const p=pointAt(L,s);L.SLOTS.push({i:L.SLOTS.length,s,x:p.x,y:p.y,nx:p.nx,ny:p.ny,zone:z.zone,n:k+1});}));
  L.NS=L.SLOTS.length;if(L.start.length!==L.NS)throw new Error('Land '+L.key+': start has '+L.start.length+' for '+L.NS+' spots');
  L.RIDGE=L.barrier?L.barrier.after+0.5:null;L.WATER=L.water;
  L.VEINS=L.veins.map((v,i)=>{const V={i,a:v.a,b:v.b,cx:(v.a[0]+v.b[0])/2,cy:(v.a[1]+v.b[1])/2};
    const dA=lineY(L.deep,v.a[0]),dB=lineY(L.deep,v.b[0]);V.deep=dA!=null&&dB!=null&&v.a[1]>dA+2&&v.b[1]>dB+2&&(L.deepMaxY==null||(v.a[1]<L.deepMaxY&&v.b[1]<L.deepMaxY));
    const s0=Math.min(project(L,...v.a),project(L,...v.b)),s1=Math.max(project(L,...v.a),project(L,...v.b));
    V.above=V.deep?[]:L.SLOTS.filter(sl=>sl.s>=s0-9&&sl.s<=s1+9).map(sl=>sl.i);V.water=nearWaterXY(L,V.cx,V.cy,74);
    V.nearTown=!!(L.town&&L.town.setback&&Math.abs(V.cx-L.town.x)<L.town.setback);return V;});
  let nd=0,nsh=0;L.VEINS.forEach(V=>{V.name=(V.deep?'Deep ':'Shallow ')+L.res.one+' '+(V.deep?++nd:++nsh);});
  L.SLOTS.forEach(s=>{s.water=nearWaterXY(L,s.x,s.y,52);});
  LANDS[L.key]=L;ORDER.push(L.key);return L;}
const land=st=>LANDS[(st&&st.land)||'colorado']||LANDS.colorado;
/* ---------- state ---------- */
function newState(key){const L=LANDS[key]||LANDS.colorado;return {land:L.key,cash:R.loan,slots:L.start.map(o=>({o,g:'',lost:false})),veins:L.VEINS.map(()=>0),protect:{res:false,creek:false},
  polluted:{res:0,creek:0},park:null,corr:[],log:[],harv:{tree:0,deer:0,lynx:0,gold:0},lost:{tree:0,deer:0,lynx:0},spills:0,done:false,
  jobs:0,hurt:0,nearHomes:0,aq:L.aquifer?100:null,safe:0};}
/* park gates are fractions of the land's path */
function pathPos(st,i){const L=land(st),s=L.SLOTS[i].s;return (s-L.path[0])/(L.path[1]-L.path[0]);}
function pathPtL(L,f){return pointAt(L,L.path[0]+f*(L.path[1]-L.path[0]));}
function pathPt(st,f){return pathPtL(land(st),f);}
function inPark(st,i){if(!st.park)return false;const f=pathPos(st,i);return f>=st.park.a-1e-9&&f<=st.park.b+1e-9;}
function veinInPark(st,V){if(!st.park)return false;if(V.above.some(i=>inPark(st,i)))return true;const L=land(st);const s=project(L,V.cx,V.cy);
  return L.SLOTS.some(sl=>Math.abs(sl.s-s)<14&&inPark(st,sl.i));}
function parkValue(st){if(!st.park)return 0;let t=0;st.slots.forEach((s,i)=>{if(s.o&&inPark(st,i))t+=R.parkVal[s.o];});return t;}
function count(st,kind){return st.slots.filter(s=>s.o===kind).length;}
/* ---------- habitat patches: the natural barrier, open pits and 3+ cleared spots in a row split habitat ---------- */
function bridged(st,a,b){return st.corr.some(c=>c>=a-0.01&&c<=b+0.01);}
function barriers(st){const L=land(st),NS=L.NS,out=[];if(L.RIDGE!=null&&!bridged(st,L.RIDGE,L.RIDGE))out.push({a:L.RIDGE,b:L.RIDGE,kind:'ridge'});
  let i=0;while(i<NS){const g=st.slots[i].g;if(g==='pit'||g==='stump'){let j=i;while(j+1<NS&&(st.slots[j+1].g==='pit'||st.slots[j+1].g==='stump'))j++;
      const pit=st.slots.slice(i,j+1).some(s=>s.g==='pit');if((pit||j-i+1>=3)&&!bridged(st,i,j))out.push({a:i,b:j,kind:pit?'pit':'clear'});i=j+1;}else i++;}
  return out;}
function patches(st){const L=land(st),NS=L.NS,br=barriers(st),id=new Array(NS).fill(0);let p=0;
  for(let i=0;i<NS;i++){if(i>0){const cut=br.some(b=>(b.kind==='ridge'&&i===Math.ceil(L.RIDGE))||(b.kind!=='ridge'&&(i===b.a||i===b.b+1)));if(cut)p++;}
    id[i]=(st.slots[i].g==='pit'&&!bridged(st,i,i))?-1:p;}
  return id;}
const TREES_PER_LYNX=2;
function treesNear(st,i){let n=0;const NS=land(st).NS;for(let j=Math.max(0,i-3);j<=Math.min(NS-1,i+3);j++)if(st.slots[j].o==='tree')n++;return n;}
/* the rare animal needs at least 2 plant patches in its connected patch (and, on some lands, clean water) */
function lynxCheck(st){const L=land(st),id=patches(st),lostNow=[];const groups={};
  if(L.topNeedsClean){st.slots.forEach((s,i)=>{const w=L.SLOTS[i].water;if(s.o==='lynx'&&w&&st.polluted[w]>0){s.o='';st.lost.lynx++;lostNow.push(i);}});}
  st.slots.forEach((s,i)=>{if(id[i]<0)return;(groups[id[i]]=groups[id[i]]||{t:0,l:[]});if(s.o==='tree')groups[id[i]].t++;if(s.o==='lynx')groups[id[i]].l.push(i);});
  Object.values(groups).forEach(g=>{const cap=Math.floor(g.t/TREES_PER_LYNX);let extra=g.l.length-cap;
    if(extra>0){const sc=g.l.map(i=>({i,n:treesNear(st,i)})).sort((a,b)=>a.n-b.n);for(let k=0;k<extra;k++){const i=sc[k].i;st.slots[i].o='';st.lost.lynx++;lostNow.push(i);}}});
  return lostNow;}
/* ---------- actions; each returns {ok,msg,row,lost,spill,at,...} ---------- */
function canPay(st,c){return st.cash>=c;}
function safetyCost(L){return L.safetyCost||R.safety;}
function spillRows(L){return (L.spillParts||[['Spill: pollution clean-up',1]]).map(([a,f])=>({a,b:0,c:Math.round(R.spill*f)}));}
function spillRoll(st,wk,opts,rng){if(!wk||st.protect[wk])return null;const p=(opts.spillPct==null?DEFAULTS.spillPct:opts.spillPct)/100;const hit=rng()<p;
  if(hit){st.cash-=R.spill;st.polluted[wk]++;st.spills++;}return {w:wk,hit,p};}
function harvest(st,i,opts,rng){const L=land(st),s=st.slots[i],sl=L.SLOTS[i];if(st.done)return {ok:false,msg:'Your plan is finished.'};
  if(!s.o)return {ok:false,msg:'Nothing to harvest here.'};
  if(inPark(st,i)&&st.park.open)return {ok:false,msg:'This spot is inside your park. Parks protect everything in them.'};
  if(s.o==='lynx')return {ok:false,msg:L.sp.lynx.protectedMsg};
  const r=R[s.o];if(!canPay(st,r.cost))return {ok:false,msg:'You need '+fmtK(r.cost)+' to pay for this.'};
  const kind=s.o;st.cash+=r.get-r.cost;s.o='';if(kind==='tree')s.g='stump';st.harv[kind]++;st.jobs+=R.jobs[kind]||0;
  const row={a:L.sp[kind].verbRow+' ('+sl.zone.toLowerCase()+')',b:r.get,c:r.cost};
  let spill=null;if(kind==='tree'&&sl.water)spill=spillRoll(st,sl.water,opts,rng);
  if(spill&&spill.hit)row.spill=1;const lost=lynxCheck(st);
  return {ok:true,row,spill,lost,kind,at:sl};}
function mine(st,v,opts,rng){const L=land(st),V=L.VEINS[v];if(st.done)return {ok:false,msg:'Your plan is finished.'};
  if(st.veins[v])return {ok:false,msg:'This '+L.res.one+' has already been taken.'};
  if(st.park&&st.park.open&&veinInPark(st,V))return {ok:false,msg:'This '+L.res.one+' is under your park. Parks protect the land above and below.'};
  const safe=(opts&&opts.safety)==='safe',cost=R.vein.cost+(safe?safetyCost(L):0);
  if(!canPay(st,cost))return {ok:false,msg:L.res.verb+' costs '+fmtK(cost)+'. You do not have enough cash.'};
  st.cash+=R.vein.get-cost;st.veins[v]=1;st.harv.gold++;st.jobs+=R.jobs.vein;if(safe)st.safe++;const destroyed=[];
  V.above.forEach(i=>{const s=st.slots[i];if(s.o){st.lost[s.o]++;destroyed.push({i,o:s.o});s.o='';}s.g='pit';});
  const row={a:L.res.verb+' a '+(V.deep?'deep':'shallow')+' '+L.res.one+(safe?' (with full worker safety)':'')+(destroyed.length?' (destroyed '+destroyed.length+' above it)':''),b:R.vein.get,c:cost};
  let hurt=0;const pInj=(L.injury||0.05)*(safe?0.15:1);if(rng()<pInj){hurt=1;st.hurt++;}
  if(V.nearTown)st.nearHomes++;
  if(st.aq!=null)st.aq=Math.max(0,st.aq-(L.aquifer.perMine||8));
  const spill=spillRoll(st,V.water,opts,rng);if(spill&&spill.hit)row.spill=1;
  let blowout=null;if(L.blowout){const B=L.blowout,p=B.p*(safe?B.safeK:1);if(rng()<p){const rows=B.parts.map(([a,f])=>({a,b:0,c:Math.round(B.cost*f)}));st.cash-=B.cost;st.spills++;st.blowouts=(st.blowouts||0)+1;
      L.WATER.forEach(w=>{st.polluted[w.k]++;});const near=st.slots.map((s,i)=>s.o==='tree'?i:-1).filter(i=>i>=0).sort((a,b)=>Math.hypot(L.SLOTS[a].x-V.cx,L.SLOTS[a].y-V.cy)-Math.hypot(L.SLOTS[b].x-V.cx,L.SLOTS[b].y-V.cy)).slice(0,B.kill||0);
      near.forEach(i=>{st.slots[i].o='';st.slots[i].g='stump';st.slots[i].age=0;st.lost.tree++;});blowout={p,cost:B.cost,rows,killed:near};}else blowout={p,miss:1};}
  const lost=lynxCheck(st);
  return {ok:true,row,spill,blowout,lost,destroyed,hurt,nearTown:V.nearTown,at:{x:V.cx,y:V.cy}};}
function protect(st,wk){const L=land(st),w=L.WATER.find(x=>x.k===wk);if(st.done)return {ok:false,msg:'Your plan is finished.'};
  if(st.protect[wk])return {ok:false,msg:'The '+w.short+' is already protected.'};if(!canPay(st,R.protect))return {ok:false,msg:'Protecting water costs '+fmtK(R.protect)+'.'};
  st.cash-=R.protect;st.protect[wk]=true;st.jobs+=R.jobs.protect;return {ok:true,row:{a:'Protect the '+w.short+' ('+(L.protectHow||'barriers and a treatment pond')+')',b:0,c:R.protect},at:{x:w.cx,y:w.cy}};}
function move(st,from,to){const L=land(st),a=st.slots[from],b=st.slots[to];if(st.done)return {ok:false,msg:'Your plan is finished.'};
  if(!a.o)return {ok:false,msg:'Nothing to move.'};if(b.o)return {ok:false,msg:'That spot is taken. Pick an empty spot.'};if(b.g==='pit')return {ok:false,msg:'Nothing can live in an open pit.'};
  const c=R.move[a.o];if(!canPay(st,c))return {ok:false,msg:'Moving a '+L.sp[a.o].one+' costs '+fmtK(c)+'.'};
  st.cash-=c;const kind=a.o;b.o=kind;a.o='';if(kind==='tree'){a.g='stump';if(b.g==='stump')b.g='';}
  const lost=lynxCheck(st);return {ok:true,row:{a:'Move a '+L.sp[kind].one+' to '+L.SLOTS[to].zone.toLowerCase()+' spot '+L.SLOTS[to].n,b:0,c},lost,kind,at:L.SLOTS[to]};}
function openPark(st,a,b){if(st.done)return {ok:false,msg:'Your plan is finished.'};if(st.park&&st.park.open)return {ok:false,msg:'Your park is already open.'};
  if(!canPay(st,R.park))return {ok:false,msg:'Opening a park costs '+fmtK(R.park)+'. Earn more first.'};
  st.cash-=R.park;st.park={a:Math.min(a,b),b:Math.max(a,b),open:true};st.jobs+=R.jobs.park;return {ok:true,row:{a:'Open a '+(land(st).parkName||'park'),b:0,c:R.park},at:pathPt(st,(a+b)/2)};}
function corridor(st,pos){if(st.done)return {ok:false,msg:'Your plan is finished.'};const L=land(st),br=barriers(st);
  const hit=br.find(b=>pos>=b.a-0.6&&pos<=b.b+0.6);if(!hit)return {ok:false,msg:'A corridor goes across a break in the habitat: '+(L.barrier?L.barrier.name+', ':'')+'an open pit, or 3+ cleared spots in a row.'};
  if(!canPay(st,R.corridor))return {ok:false,msg:'A wildlife corridor costs '+fmtK(R.corridor)+'.'};
  st.cash-=R.corridor;const c=hit.kind==='ridge'?L.RIDGE:(hit.a+hit.b)/2;st.corr.push(c);
  return {ok:true,row:{a:'Build a wildlife corridor across '+(hit.kind==='ridge'?L.barrier.name:hit.kind==='pit'?'an open pit':'a clearing'),b:0,c:R.corridor},at:corrPt(st,c),kind:hit.kind};}
function corrPtL(L,c){if(L.RIDGE!=null&&c===L.RIDGE)return {x:L.barrier.at[0],y:L.barrier.at[1]};const i=Math.round(c);return L.SLOTS[Math.max(0,Math.min(L.NS-1,i))];}
function corrPt(st,c){return corrPtL(land(st),c);}
/* ---------- end of plan (Paul's scoring) ---------- */
function finish(st){st.done=true;const pv=parkValue(st);st.end={cash:st.cash,park:pv,net:st.cash+pv-R.loan,lynx:count(st,'lynx'),deer:count(st,'deer'),tree:count(st,'tree'),parkPops:st.park?st.slots.filter((s,i)=>s.o&&inPark(st,i)).length:0,
  jobs:st.jobs,hurt:st.hurt,town:townUnsafe(st)?1:0};return st.end;}
function townUnsafe(st){const L=land(st);return !!(st.polluted[L.town.water]>0||(st.aq!=null&&st.aq<L.aquifer.dry));}
/* ---------- 20 years later ---------- */
function rngSeed(seed){let a=seed>>>0||1;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function yearTick(F,opts,rng){const st=F.st,L=land(st),ev=[],y=F.year+1,NS=L.NS;const vis=(opts.visitPct==null?DEFAULTS.visitPct:opts.visitPct)/100,leak=(opts.leakPct==null?DEFAULTS.leakPct:opts.leakPct)/100,hunt=opts.hunt==null?DEFAULTS.hunt:opts.hunt;
  const PH=L.pollutionHurts;
  if(st.park&&st.park.open){let v=Math.round(parkValue(st)*vis);if(PH&&PH.visitors&&st.polluted[PH.visitorsWater]>0&&v>0){const cut=Math.round(v*PH.visitors);v-=cut;F.inc.lost+=cut;const w=L.WATER.find(x=>x.k===PH.visitorsWater);ev.push({kind:'lostinc',$:-cut,x:w.cx,y:w.cy+30,text:PH.visitorsText+' (−'+fmtK(cut)+')'});}
    if(v>0){F.money+=v;F.inc.park+=v;ev.push({kind:'park',$:v,...pathPt(st,(st.park.a+st.park.b)/2),text:(L.visitWord||'Park visitors')+' +'+fmtK(v)});}}
  if(hunt){(L.yearly||[{role:'deer',per:R.hunt,label:'Hunting licenses'}]).forEach(Y=>{let n=0;
      if(Y.role==='water'){if(st.aq!=null&&st.aq>0){n=1;st.aq=Math.max(0,st.aq-(Y.aq||3));}}else st.slots.forEach((s,i)=>{if(s.o===Y.role&&!inPark(st,i))n++;});
      if(n&&PH&&PH.harvestWater&&st.polluted[PH.harvestWater]>0){const v=n*Y.per;F.inc.lost+=v;const w=L.WATER.find(x=>x.k===PH.harvestWater);ev.push({kind:'lostinc',$:-v,x:w.cx,y:w.cy+30,text:PH.harvestText+' (−'+fmtK(v)+')'});n=0;}
      if(n){const v=n*Y.per;F.money+=v;F.inc.hunt+=v;ev.push({kind:'hunt',$:v,x:Y.x||700,y:Y.y||300,text:Y.label+' +'+fmtK(v)});}});}
  L.VEINS.forEach((V,i)=>{if(st.veins[i]&&V.water&&!st.protect[V.water]&&rng()<leak){F.money-=R.spill;F.inc.leak+=R.spill;st.polluted[V.water]++;st.pollutedY=st.pollutedY||{};st.pollutedY[V.water]=y;F.leaks++;
    ev.push({kind:'leak',$:-R.spill,x:V.cx,y:V.cy,w:V.water,text:(L.leakWord||'Old mine leak')+': clean-up −'+fmtK(R.spill)});}});
  // polluted water clears after 4 quiet years
  ['res','creek'].forEach(k=>{if(st.polluted[k]>0){st.pollutedY=st.pollutedY||{};if(st.pollutedY[k]==null)st.pollutedY[k]=0;if(y-st.pollutedY[k]>=4){st.polluted[k]=0;const w=L.WATER.find(x=>x.k===k);ev.push({kind:'clean',x:w.cx,y:w.cy,text:'The '+w.short+' is clean again'});}}});
  if(st.aq!=null&&L.aquifer.drift)st.aq=Math.max(0,st.aq-L.aquifer.drift);
  if(L.shock&&rng()<L.shock.p){const live=st.slots.map((s,i)=>s.o==='tree'?i:-1).filter(i=>i>=0);const n=Math.round(live.length*L.shock.frac);for(let k=0;k<n;k++){const j=live.splice(Math.floor(rng()*live.length),1)[0];st.slots[j].o='';st.slots[j].g='stump';st.slots[j].age=0;}
    F.shocks++;ev.push({kind:'shock',x:400,y:200,text:L.shock.text+': '+n+' '+L.sp.tree.many+' lost'});}
  if(!L.noRegrow)st.slots.forEach(s=>{if(s.g==='stump'||s.g==='sap'){s.g='sap';s.age=(s.age||0)+1;if(L.regrowYears&&s.age>=L.regrowYears&&!s.o){s.o='tree';s.g='';s.age=0;}}});
  const id=patches(st);const add=[];
  st.slots.forEach((s,i)=>{if(s.o||s.g==='pit'||id[i]<0||(L.noRegrow&&s.g==='stump'))return;const nb=[i-1,i+1].filter(j=>j>=0&&j<NS&&id[j]===id[i]&&st.slots[j].o==='deer');if(nb.length&&rng()<(s.g==='sap'?0.14:0.07))add.push(i);});
  add.forEach(i=>{st.slots[i].o='deer';F.born++;ev.push({kind:'deer',x:L.SLOTS[i].x,y:L.SLOTS[i].y-12,text:'New '+L.sp.deer.one});});
  const before=st.slots.map(s=>s.o);lynxCheck(st);st.slots.forEach((s,i)=>{if(before[i]==='lynx'&&!s.o)ev.push({kind:'lynx',x:L.SLOTS[i].x,y:L.SLOTS[i].y-14,text:L.sp.lynx.short+' gone: '+(L.topNeedsClean&&L.SLOTS[i].water&&st.polluted[L.SLOTS[i].water]?'polluted water':'too little habitat')});});
  const id2=patches(st);const fam={};st.slots.forEach((s,i)=>{if(s.o==='lynx'&&id2[i]>=0)(fam[id2[i]]=fam[id2[i]]||[]).push(i);});
  Object.values(fam).forEach(g=>{if(g.length===1&&rng()<0.08){const i=g[0];st.slots[i].o='';st.lost.lynx++;ev.push({kind:'lynx',x:L.SLOTS[i].x,y:L.SLOTS[i].y-14,text:'Lone '+L.sp.lynx.one+' gone: no mates nearby'});}});
  const unsafe=townUnsafe(st);if(unsafe)F.unsafeYears++;
  F.year=y;F.series.push({y,money:F.money,lynx:count(st,'lynx'),deer:count(st,'deer'),tree:count(st,'tree'),dirty:(st.polluted.res>0)+(st.polluted.creek>0),town:unsafe?1:0,aq:st.aq});
  return ev;}
function future(st,opts,seed){const F={st:clone(st),year:0,money:st.end?st.end.net:st.cash+parkValue(st)-R.loan,inc:{park:0,hunt:0,leak:0,lost:0},leaks:0,born:0,shocks:0,unsafeYears:0,seed,series:[]};
  F.st.pollutedY={res:F.st.polluted.res?0:null,creek:F.st.polluted.creek?0:null};
  F.series.push({y:0,money:F.money,lynx:count(F.st,'lynx'),deer:count(F.st,'deer'),tree:count(F.st,'tree'),dirty:(st.polluted.res>0)+(st.polluted.creek>0),town:townUnsafe(st)?1:0,aq:st.aq});F.rng=rngSeed(seed);return F;}
function runFuture(st,opts,seed,years){const F=future(st,opts,seed);for(let k=0;k<(years||20);k++)yearTick(F,opts,F.rng);return F;}
function manyFutures(st,opts,n){const out=[];for(let k=0;k<n;k++){const F=runFuture(st,opts,1000+k*7919,20);out.push({money:F.money,lynx:count(F.st,'lynx'),deer:count(F.st,'deer'),leaks:F.leaks,unsafe:F.unsafeYears});}
  const m=out.map(o=>o.money).sort((a,b)=>a-b),avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
  return {n,avg:avg(m),min:m[0],max:m[m.length-1],p10:m[Math.floor(n*0.1)],p90:m[Math.floor(n*0.9)],lynxAvg:avg(out.map(o=>o.lynx)),lynxAny:out.filter(o=>o.lynx>0).length/n,deerAvg:avg(out.map(o=>o.deer)),leakAvg:avg(out.map(o=>o.leaks)),unsafeAvg:avg(out.map(o=>o.unsafe)),list:out};}
/* ---------- result code (for the class board) ---------- */
function encode(st,name,extra){const o={v:1,L:st.land,n:(name||'').slice(0,60),s:st.slots.map(s=>(s.o?s.o[0]:'-')+(s.g?s.g[0]:'-')).join(''),m:st.veins.join(''),p:st.protect.res?1:0,q:st.protect.creek?1:0,
  r:st.polluted.res,c:st.polluted.creek,k:st.park?[+st.park.a.toFixed(3),+st.park.b.toFixed(3)]:0,x:st.corr,cash:st.cash,h:st.harv,l:st.lost,sp:st.spills,e:st.end||0,f:extra||0,j:st.jobs,u:st.hurt,nh:st.nearHomes,aq:st.aq,sf:st.safe};
  const json=JSON.stringify(o);let b64;try{b64=btoa(unescape(encodeURIComponent(json)));}catch(e){b64=btoa(json);}return 'MTN1.'+b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(code){code=(code||'').trim();const m=code.match(/MTN1\.([A-Za-z0-9_-]+)/);if(!m)return null;let b=m[1].replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';
  try{const o=JSON.parse(decodeURIComponent(escape(atob(b))));const L=LANDS[o.L||'colorado'];if(!L||o.v!==1||typeof o.s!=='string'||o.s.length!==L.NS*2)return null;
    const st=newState(L.key);const O={t:'tree',d:'deer',l:'lynx'},G={s:'stump',p:'pit',a:'sap'};
    st.slots=st.slots.map((_,i)=>({o:O[o.s[i*2]]||'',g:G[o.s[i*2+1]]||'',lost:false}));st.veins=String(o.m||'').split('').map(Number).slice(0,L.VEINS.length);while(st.veins.length<L.VEINS.length)st.veins.push(0);
    st.protect={res:!!o.p,creek:!!o.q};st.polluted={res:+o.r||0,creek:+o.c||0};st.park=o.k?{a:+o.k[0],b:+o.k[1],open:true}:null;st.corr=Array.isArray(o.x)?o.x.map(Number):[];
    st.cash=+o.cash||0;st.harv=o.h||st.harv;st.lost=o.l||st.lost;st.spills=+o.sp||0;st.end=o.e||null;st.done=!!o.e;st.jobs=+o.j||0;st.hurt=+o.u||0;st.nearHomes=+o.nh||0;if(o.aq!=null)st.aq=+o.aq;st.safe=+o.sf||0;
    return {st,name:o.n||'',extra:o.f||{}};}catch(e){return null;}}
/* ---------- drawing helpers shared by every land ---------- */
function drawStump(ctx,x,y,s,col){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=col||'#7a5434';ctx.fillRect(-3.5,-5,7,5);ctx.fillStyle='#c79a63';ctx.beginPath();ctx.ellipse(0,-5,3.5,1.6,0,0,6.29);ctx.fill();ctx.restore();}
function drawGate(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#6b4a2b';ctx.fillRect(-7,-22,3,22);ctx.fillRect(4,-22,3,22);ctx.fillStyle='#a8784a';for(let k=0;k<3;k++)ctx.fillRect(-4,-19+k*6,8,3);ctx.restore();}
function drawTown(ctx,x,y,s,dry){ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  [[-22,0,14,12,'#c9a27a'],[-6,0,16,15,'#d8b48a'],[12,0,13,11,'#bf9468']].forEach(([hx,hy,w,h,c])=>{ctx.fillStyle=c;ctx.fillRect(hx,hy-h,w,h);ctx.fillStyle='#8a4b2a';ctx.beginPath();ctx.moveTo(hx-2,hy-h);ctx.lineTo(hx+w/2,hy-h-7);ctx.lineTo(hx+w+2,hy-h);ctx.closePath();ctx.fill();ctx.fillStyle='#3a3a40';ctx.fillRect(hx+w/2-2,hy-6,4,6);});
  ctx.restore();}
function strokeLine(ctx,P,col,w,dash){ctx.save();if(dash)ctx.setLineDash(dash);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.restore();}
function fillGround(ctx,surf,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(surf[0][0],H);surf.forEach(p=>ctx.lineTo(p[0],p[1]));ctx.lineTo(surf[surf.length-1][0],H);ctx.closePath();ctx.fill();}
/* the whole scene; C = colors {dark,ink,soft}; o = {k, pick, pickPos, ghostPark, labels, t} */
function drawScene(ctx,st,C,o){o=o||{};const k=o.k||1,L=land(st),A=L.art;
  L.drawBack(ctx,C,st,k);
  // deep line
  if(L.deep){ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle=L.deepCol?L.deepCol(C):(C.dark?'rgba(255,255,255,.45)':'rgba(30,25,20,.55)');ctx.lineWidth=1.2;ctx.beginPath();L.deep.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.restore();}
  // water
  L.WATER.forEach(w=>{const bad=st.polluted[w.k]>0,dry=w.k===L.town.water&&st.aq!=null&&st.aq<L.aquifer.dry;w.draw(ctx,dry?'#cdb48a':bad?(L.pollCol||'#c4702a'):(w.col||'#3c7fc0'),C,st);
    if(st.protect[w.k]){ctx.save();ctx.strokeStyle='#14a3a3';ctx.lineWidth=3.2;ctx.setLineDash([6,3]);const [x0,y0,x1,y1]=w.hit;ctx.strokeRect(x0-3,y0-4,x1-x0+6,y1-y0+8);ctx.restore();}});
  if(L.town)L.drawTown?L.drawTown(ctx,C,st,k):drawTown(ctx,L.town.x,L.town.y,1);
  // park band
  const pk=st.park||o.ghostPark;if(pk){ctx.save();ctx.strokeStyle='rgba(40,160,70,.55)';ctx.lineWidth=st.park?16:12;ctx.lineCap='round';if(!st.park)ctx.setLineDash([8,8]);
    ctx.beginPath();const N=50;for(let n=0;n<=N;n++){const p=pathPtL(L,pk.a+(pk.b-pk.a)*n/N);n?ctx.lineTo(p.x+p.nx*4,p.y+p.ny*4):ctx.moveTo(p.x+p.nx*4,p.y+p.ny*4);}ctx.stroke();ctx.restore();
    const a=pathPtL(L,pk.a),b=pathPtL(L,pk.b);drawGate(ctx,a.x,a.y+2,1.05);drawGate(ctx,b.x,b.y+2,1.05);}
  // deposits
  const VC=L.res.col;L.VEINS.forEach((v,i)=>{const mined=st.veins[i];ctx.lineCap='round';
    if(mined){ctx.strokeStyle='#1d1b19';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(v.a[0],v.a[1]);ctx.lineTo(v.b[0],v.b[1]);ctx.stroke();}
    else{ctx.strokeStyle=VC[0];ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(v.a[0],v.a[1]);ctx.lineTo(v.b[0],v.b[1]);ctx.stroke();ctx.strokeStyle=VC[1];ctx.lineWidth=6;ctx.stroke();
      ctx.fillStyle=VC[2];[0.25,0.6,0.85].forEach(f=>{ctx.beginPath();ctx.arc(v.a[0]+(v.b[0]-v.a[0])*f,v.a[1]+(v.b[1]-v.a[1])*f,1.2,0,6.29);ctx.fill();});}});
  // ground strip under each spot: shows habitat, cut ground and pits
  const FC=L.floor;ctx.save();ctx.lineCap='butt';st.slots.forEach((s,i)=>{const p=L.SLOTS[i],q0=i>0&&Math.hypot(L.SLOTS[i-1].x-p.x,L.SLOTS[i-1].y-p.y)<40?L.SLOTS[i-1]:null,q1=i<L.NS-1&&Math.hypot(L.SLOTS[i+1].x-p.x,L.SLOTS[i+1].y-p.y)<40?L.SLOTS[i+1]:null;
    const a=q0?{x:(q0.x+p.x)/2,y:(q0.y+p.y)/2}:{x:p.x-(q1?q1.x-p.x:10)/2,y:p.y-(q1?q1.y-p.y:0)/2},b=q1?{x:(q1.x+p.x)/2,y:(q1.y+p.y)/2}:{x:p.x+(q0?p.x-q0.x:10)/2,y:p.y+(q0?p.y-q0.y:0)/2};
    const col=s.g==='pit'?FC.pit:s.g==='stump'?FC.cut:s.g==='sap'?FC.sap:s.o==='tree'?FC.tree:(FC.open[p.zone]||FC.open._);
    ctx.strokeStyle=col;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(a.x+p.nx*4,a.y+p.ny*4);ctx.lineTo(b.x+p.nx*4,b.y+p.ny*4);ctx.stroke();});ctx.restore();
  st.slots.forEach((s,i)=>{const p=L.SLOTS[i];if(s.g==='pit'){ctx.fillStyle='#3a3029';ctx.beginPath();ctx.ellipse(p.x+p.nx*3,p.y+p.ny*3,11,6,Math.atan2(-p.nx,p.ny),0,6.29);ctx.fill();}});
  // barrier marker
  if(L.drawBarrier)L.drawBarrier(ctx,C,st,k);
  // corridors
  st.corr.forEach(c=>{const p=corrPtL(L,c);ctx.save();ctx.strokeStyle='#7b3fe4';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();
    if(L.RIDGE!=null&&c===L.RIDGE&&L.barrier.arc){const r=L.barrier.arc;ctx.moveTo(r[0],r[1]);ctx.quadraticCurveTo(r[2],r[3],r[4],r[5]);}else{ctx.moveTo(p.x-22,p.y-14);ctx.quadraticCurveTo(p.x,p.y-30,p.x+22,p.y-14);}ctx.stroke();
    ctx.fillStyle='#7b3fe4';ctx.font='700 '+Math.round(11*k)+'px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText('corridor',p.x,(L.RIDGE!=null&&c===L.RIDGE&&L.barrier.arc?L.barrier.arc[3]-6:p.y-32));ctx.restore();});
  // living things: plants first, animals on top, facing out
  st.slots.forEach((s,i)=>{const p=L.SLOTS[i];if(s.g==='stump')(A.cut||drawStump)(ctx,p.x,p.y,1.3);if(s.g==='sap')(A.sap||((c,x,y,sc,age)=>{drawStump(c,x-5*sc,y,sc*0.8);A.tree(c,x+3*sc,y,sc*Math.min(1,0.25+age/40));}))(ctx,p.x,p.y,1.15,s.age||1);
    if(s.o==='tree'){ctx.save();if(o.pick===i)ctx.globalAlpha=0.35;A.tree(ctx,p.x,p.y,(L.sp.tree.scale||1.15)*(L.artK||1),false);ctx.restore();}});
  st.slots.forEach((s,i)=>{const p=L.SLOTS[i];if(!s.o||s.o==='tree')return;const flip=L.flip?L.flip(p,i):(p.nx>0.2||(Math.abs(p.nx)<=0.2&&i%2===0));
    ctx.save();if(o.pick===i)ctx.globalAlpha=0.35;if(C.dark){ctx.shadowColor='rgba(235,240,245,.7)';ctx.shadowBlur=4;}A[s.o](ctx,p.x,p.y,(L.sp[s.o].scale||1.25)*(L.artK||1),flip);ctx.restore();});
  if(o.pick!=null&&o.pickPos){const s=st.slots[o.pick];if(s&&s.o){ctx.save();ctx.globalAlpha=0.9;A[s.o](ctx,o.pickPos.x,o.pickPos.y,1,false);ctx.restore();}}
  if(L.drawFront)L.drawFront(ctx,C,st,k);
  if(o.labels!==false){const f=Math.round(12*k);ctx.save();ctx.font='600 '+f+'px system-ui,sans-serif';
    ctx.lineJoin='round';ctx.lineWidth=3.5;ctx.strokeStyle=C.dark?'rgba(18,20,24,.85)':'rgba(255,255,255,.88)';(L.labels||[]).forEach(lb=>{ctx.textAlign=lb.a||'left';ctx.strokeText(lb.t,lb.x,lb.y);ctx.fillStyle=lb.soft?C.soft:C.ink;ctx.fillText(lb.t,lb.x,lb.y);});ctx.restore();}
  return true;}
function drawOrg(ctx,st,role,x,y,s,flip){const L=land(st);L.art[role](ctx,x,y,s,flip);}
/* ================= COLORADO (the first land) ================= */
const Lb={x:170,y:392},P={x:400,y:58},Rb={x:610,y:392},GY=392;
const lenL=Math.hypot(P.x-Lb.x,P.y-Lb.y),lenR=Math.hypot(Rb.x-P.x,Rb.y-P.y);
function surfX(y,side){return side<0?Lb.x+(P.x-Lb.x)*(Lb.y-y)/(Lb.y-P.y):Rb.x-(Rb.x-P.x)*(Rb.y-y)/(Rb.y-P.y);}
function coTree(ctx,x,y,s,flip,a){ctx.save();ctx.globalAlpha*=a==null?1:a;ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle='#5b3a24';ctx.fillRect(-1.6,-5,3.2,5);
  [[0,-34,5],[0,-28,7],[0,-21,9],[0,-13,10.5]].forEach(([_,top,w],k)=>{ctx.fillStyle=k%2?'#2b5a3a':'#24503a';ctx.beginPath();ctx.moveTo(0,top);ctx.lineTo(w,top+12);ctx.lineTo(-w,top+12);ctx.closePath();ctx.fill();});
  ctx.fillStyle='rgba(255,255,255,.10)';ctx.beginPath();ctx.moveTo(0,-34);ctx.lineTo(-10.5,-1);ctx.lineTo(-3,-1);ctx.closePath();ctx.fill();ctx.restore();}
function coDeer(ctx,x,y,s,flip){ctx.save();ctx.translate(x,y);ctx.scale(flip?-s:s,s);
  ctx.fillStyle='#8a6e55';ctx.strokeStyle='#4e3b2b';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.ellipse(0,-14,9,5,0,0,6.29);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f1ebe2';ctx.beginPath();ctx.ellipse(-8.5,-14,2.6,3.6,0,0,6.29);ctx.fill();
  ctx.fillStyle='#1d1a17';ctx.beginPath();ctx.ellipse(-10.6,-13,1,1.8,0,0,6.29);ctx.fill();
  ctx.strokeStyle='#5d4733';ctx.lineWidth=1.6;[[-6,-10],[-3,-10],[4,-10],[7,-10]].forEach(([lx,ly])=>{ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(lx+(lx<0?-0.5:0.5),0);ctx.stroke();});
  ctx.fillStyle='#8a6e55';ctx.beginPath();ctx.moveTo(6,-17);ctx.lineTo(10,-25);ctx.lineTo(13,-24);ctx.lineTo(10,-14);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.ellipse(13,-25,3.6,2.3,0.35,0,6.29);ctx.fill();
  ctx.fillStyle='#e8ddd0';ctx.beginPath();ctx.ellipse(15.6,-24,1.3,1.2,0,0,6.29);ctx.fill();
  ctx.fillStyle='#7a5f48';ctx.beginPath();ctx.ellipse(9.5,-29,1.7,4,-0.9,0,6.29);ctx.fill();ctx.beginPath();ctx.ellipse(12,-30,1.7,4,-0.3,0,6.29);ctx.fill();
  ctx.restore();}
function coLynx(ctx,x,y,s,flip){ctx.save();ctx.translate(x,y);ctx.scale(flip?-s:s,s);
  const fur='#a89c86',dark='#5f5546';ctx.strokeStyle=dark;ctx.lineWidth=0.8;
  ctx.fillStyle='#968a74';[[-5.5,-9],[5,-9]].forEach(([lx,ly])=>{ctx.fillRect(lx-1.4,ly,2.8,8);});
  ctx.fillStyle=fur;ctx.beginPath();ctx.ellipse(0,-12,8.5,4.6,-0.08,0,6.29);ctx.fill();ctx.stroke();
  ctx.fillStyle='#7d725f';[[-7,-14],[-3,-15],[2,-14],[5,-12]].forEach(([sx,sy])=>{ctx.beginPath();ctx.arc(sx,sy,0.7,0,6.29);ctx.fill();});
  ctx.fillStyle=fur;[[-7,-9],[3.5,-9]].forEach(([lx,ly])=>{ctx.fillRect(lx-1.6,ly,3.2,9);});
  ctx.fillStyle='#8f836d';[[-7,0],[3.5,0],[-5.5,0],[5,0]].forEach(([px,py])=>{ctx.beginPath();ctx.ellipse(px,py-0.6,2.6,1.4,0,0,6.29);ctx.fill();});
  ctx.fillStyle=fur;ctx.beginPath();ctx.ellipse(-8.6,-15,2.2,1.6,0.5,0,6.29);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(-10.2,-16,1.3,0,6.29);ctx.fill();
  ctx.fillStyle=fur;ctx.beginPath();ctx.arc(10.5,-16.5,4.6,0,6.29);ctx.fill();ctx.stroke();
  ctx.fillStyle='#ece5d8';ctx.beginPath();ctx.moveTo(8,-14);ctx.lineTo(10,-9.5);ctx.lineTo(12,-12.5);ctx.lineTo(14.6,-10);ctx.lineTo(14.6,-15);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#2b2823';ctx.lineWidth=0.6;ctx.beginPath();ctx.moveTo(9,-13.5);ctx.lineTo(10.4,-10.5);ctx.moveTo(13.8,-13.5);ctx.lineTo(13.6,-10.8);ctx.stroke();
  ctx.fillStyle=fur;ctx.beginPath();ctx.moveTo(7.6,-19.5);ctx.lineTo(8.2,-25);ctx.lineTo(10.4,-20.5);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(11.4,-20.6);ctx.lineTo(13.2,-25.4);ctx.lineTo(14.2,-19.6);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#111';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(8.2,-25);ctx.lineTo(8,-28.5);ctx.moveTo(13.2,-25.4);ctx.lineTo(13.8,-28.8);ctx.stroke();
  ctx.fillStyle='#2c2a26';ctx.beginPath();ctx.arc(12.6,-17.4,0.8,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(14.7,-15.6,0.7,0,6.29);ctx.fill();
  ctx.restore();}
function skyGrad(ctx,C,top,bot,dtop,dbot,gy){const g=ctx.createLinearGradient(0,0,0,gy||GY);g.addColorStop(0,C.dark?dtop:top);g.addColorStop(1,C.dark?dbot:bot);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
const LD=[22,44,66,88,110,132,154,176,198,220,242,264,286,308],RE=[104,126,148,170,192,214,236,258,280,302,324,346],MX=[636,658,680,702,724,746,768];
addLand({key:'colorado',name:'Colorado mountain',place:'Rocky Mountains, Colorado, USA',icon:'⛰️',
  blurb:'Gold veins under a spruce-fir mountain with lynx and mule deer, above the town reservoir.',
  surf:[[0,GY],[Lb.x,Lb.y],[P.x,P.y],[Rb.x,Rb.y],[800,GY]],
  spots:[{zone:'Left slope',s:LD.map(d=>Lb.x+d)},{zone:'Right slope',s:RE.map(e=>Lb.x+lenL+e)},{zone:'Meadow',s:MX.map(x=>Lb.x+lenL+lenR+(x-Rb.x))}],
  start:['deer','tree','tree','deer','tree','tree','lynx','tree','tree','deer','tree','lynx','tree','',
         'deer','tree','lynx','tree','tree','lynx','tree','','deer','tree','tree','',
         'tree','lynx','tree','','deer','tree','deer'],
  path:[Lb.x,Lb.x+lenL+lenR+180],
  barrier:{after:13,name:'the bare ridge',at:[P.x,P.y+30],arc:[surfX(150,-1)+10,150,P.x,122,surfX(150,1)-10,150],desc:'Deer and lynx rarely cross bare rock and snow, so the two slopes are separate habitats.'},
  deep:[[258,392],[400,150],[542,392]],
  veins:[{a:[372,212],b:[414,236]},{a:[330,302],b:[368,272]},{a:[424,300],b:[472,286]},{a:[302,372],b:[350,356]},{a:[446,360],b:[502,372]},
    {a:[296,222],b:[334,250]},{a:[222,354],b:[262,331]},{a:[192,386],b:[230,384]},{a:[444,166],b:[466,204]},{a:[500,262],b:[526,300]},{a:[548,346],b:[582,372]},{a:[626,404],b:[684,409]}],
  res:{one:'gold vein',many:'gold veins',verb:'Mine',tool:'Mine',col:['#6d5513','#e0b42c','#fff3b0'],what:'gold'},
  sp:{tree:{one:'spruce stand',many:'spruce stands',short:'Spruce',icon:'🌲',verbRow:'Harvest a spruce stand',harvest:'Harvest',status:'Least concern'},
      deer:{one:'mule deer herd',many:'mule deer herds',short:'Deer',icon:'🦌',verbRow:'Harvest a mule deer herd (hunting season)',status:'Below Colorado’s population goal'},
      lynx:{one:'lynx family',many:'lynx families',short:'Lynx',icon:'🐈',status:'Endangered in Colorado; threatened federally',scale:1.3,
        needs:'spruce stands',protectedMsg:'Lynx are a protected endangered species in Colorado. Nobody can legally hunt or trap them, so they are worth $0 to harvest.'}},
  water:[{k:'res',name:'Town reservoir',short:'reservoir',cx:88,cy:410,hit:[12,392,166,438],note:'The town below drinks this water, the way Denver drinks from mountain reservoirs.',
      draw(ctx,col){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(12,GY);ctx.quadraticCurveTo(88,446,166,GY);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(30,GY+3,60,2);}},
    {k:'creek',name:'Trout creek',short:'creek',cx:592,cy:384,hit:[568,370,800,404],note:'A trout stream that runs past the meadow and down to farms.',
      draw(ctx,col){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(590,383,19,10,-0.6,0,6.29);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(600,392);ctx.bezierCurveTo(640,404,700,396,800,402);ctx.stroke();}}],
  town:{name:'the town',water:'res',x:120,y:440,people:'The town below the dam drinks from the reservoir.'},
  drawTown(){},
  injury:0.05,
  floor:{tree:'#2f5d3a',cut:'#8b6b48',sap:'#7aa158',pit:'#2e2620',open:{Meadow:'#6f9a4a',_:'#5f8452'}},
  art:{tree:coTree,deer:coDeer,lynx:coLynx},
  drawBack(ctx,C){skyGrad(ctx,C,'#cfe3f3','#eef4f8','#1c2633','#232a31');
    ctx.fillStyle=C.dark?'#2b3440':'#b9c7d3';ctx.beginPath();ctx.moveTo(0,GY);ctx.lineTo(0,250);ctx.lineTo(70,205);ctx.lineTo(130,240);ctx.lineTo(200,190);ctx.lineTo(260,232);ctx.lineTo(560,232);ctx.lineTo(640,170);ctx.lineTo(700,215);ctx.lineTo(760,180);ctx.lineTo(800,205);ctx.lineTo(800,GY);ctx.closePath();ctx.fill();
    ctx.fillStyle=C.dark?'#3a3a2c':'#a89a73';ctx.fillRect(0,GY,W,H-GY);ctx.fillStyle=C.dark?'#3f5a35':'#7da35a';ctx.fillRect(Rb.x,GY-2,W-Rb.x,10);ctx.fillRect(0,GY-2,Lb.x,10);
    const mg=ctx.createLinearGradient(0,P.y,0,GY);mg.addColorStop(0,C.dark?'#6a645c':'#9b948b');mg.addColorStop(1,C.dark?'#4c4740':'#7d7469');
    ctx.fillStyle=mg;ctx.beginPath();ctx.moveTo(Lb.x,GY);ctx.lineTo(P.x,P.y);ctx.lineTo(Rb.x,GY);ctx.closePath();ctx.fill();
    const SN=104;ctx.fillStyle='#f4f6f8';ctx.beginPath();ctx.moveTo(surfX(SN,-1),SN);ctx.lineTo(P.x,P.y);ctx.lineTo(surfX(SN,1),SN);ctx.lineTo(412,SN-6);ctx.lineTo(402,SN+6);ctx.lineTo(390,SN-4);ctx.lineTo(380,SN+5);ctx.closePath();ctx.fill();},
  labels:[{t:'Town reservoir',x:14,y:432},{t:'Trout creek',x:796,y:GY+30,a:'right'},{t:'Bare ridge (no trees)',x:P.x+12,y:P.y+14,soft:1}],
  cases:'colorado'});
const API={W,H,R,DEFAULTS,safetyCost,spillRows,LANDS,ORDER,TREES_PER_LYNX,addLand,land,newState,clone,setCurrency,fmtK,fmtK2,pathPos,pathPt,pathPtL,inPark,veinInPark,parkValue,count,barriers,patches,lynxCheck,townUnsafe,
  harvest,mine,protect,move,openPark,corridor,corrPt,finish,future,yearTick,runFuture,manyFutures,rngSeed,encode,decode,drawScene,drawOrg,drawStump,drawGate,drawTown,strokeLine,fillGround,skyGrad,pointAt,project,lineY,
  get currency(){return CUR;}};
if(typeof window!=='undefined')window.MTN=API;if(typeof module!=='undefined')module.exports=API;
})();
