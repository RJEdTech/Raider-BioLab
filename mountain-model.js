/* Mountain for sale: shared model for sims/mountain.js and mountainboard.html.
   Based on Paul Stearman's "Mountain Scenario" land-use game (harvest, mine, park, corridor, a bank loan),
   rebuilt for Colorado: Canada lynx (state endangered), mule deer (below CPW's population goal) and spruce-fir forest.
   Money is kept in thousands of dollars ($K), using Paul's original numbers. All model rules are illustrative. */
(function(){
'use strict';
const W=800,H=450;
/* ---------- the mountain ---------- */
const Lb={x:170,y:392},P={x:400,y:58},Rb={x:610,y:392},GY=392,MEND=790;
const IN={p:{x:400,y:150},l:{x:258,y:392},r:{x:542,y:392}};   // the deep-rock line (Paul's thin black line)
const SNOW=104,TREELINE=132;
const lenL=Math.hypot(P.x-Lb.x,P.y-Lb.y),lenR=Math.hypot(Rb.x-P.x,Rb.y-P.y);
function onLeft(d){const f=d/lenL;return {x:Lb.x+(P.x-Lb.x)*f,y:Lb.y+(P.y-Lb.y)*f};}
function onRight(e){const f=e/lenR;return {x:P.x+(Rb.x-P.x)*f,y:P.y+(Rb.y-P.y)*f};}
function surfX(y,side){return side<0?Lb.x+(P.x-Lb.x)*(Lb.y-y)/(Lb.y-P.y):Rb.x-(Rb.x-P.x)*(Rb.y-y)/(Rb.y-P.y);}
function innerX(y,side){if(y<IN.p.y)return IN.p.x;return side<0?IN.l.x+(IN.p.x-IN.l.x)*(IN.l.y-y)/(IN.l.y-IN.p.y):IN.r.x-(IN.r.x-IN.p.x)*(IN.r.y-y)/(IN.r.y-IN.p.y);}
/* ---------- spots on the surface, in path order (left base → ridge → right base → meadow) ---------- */
const LD=[22,44,66,88,110,132,154,176,198,220,242,264,286,308];
const RE=[104,126,148,170,192,214,236,258,280,302,324,346];
const MX=[636,658,680,702,724,746,768];
const START=['deer','tree','tree','deer','tree','tree','lynx','tree','tree','deer','tree','lynx','tree','',  // left slope (bottom → top)
             'deer','tree','lynx','tree','tree','lynx','tree','','deer','tree','tree','',            // right slope (top → bottom)
             'tree','lynx','tree','','deer','tree','deer'];                                         // meadow (left → right)
const SLOTS=[];
LD.forEach((d,i)=>{const p=onLeft(d);SLOTS.push({i:SLOTS.length,x:p.x,y:p.y,side:-1,zone:'Left slope',n:i+1});});
RE.forEach((e,i)=>{const p=onRight(e);SLOTS.push({i:SLOTS.length,x:p.x,y:p.y,side:1,zone:'Right slope',n:i+1});});
MX.forEach((x,i)=>SLOTS.push({i:SLOTS.length,x,y:GY,side:2,zone:'Meadow',n:i+1}));
const RIDGE=13.5;           // the bare, snowy ridge between spot 13 (left) and 14 (right): a natural barrier
const NS=SLOTS.length;
/* ---------- water ---------- */
const WATER=[
  {k:'res',name:'Town reservoir',short:'reservoir',cx:88,cy:410,hit:[12,392,166,438],note:'The town below drinks this water, the way Denver drinks from mountain reservoirs.'},
  {k:'creek',name:'Trout creek',short:'creek',cx:592,cy:384,hit:[568,370,800,404],note:'A trout stream that runs past the meadow and down to farms.'}];
/* ---------- gold veins (Paul's gold bars) ---------- */
const VEINS=[
  {a:[372,212],b:[414,236]},{a:[330,302],b:[368,272]},{a:[424,300],b:[472,286]},{a:[302,372],b:[350,356]},{a:[446,360],b:[502,372]},
  {a:[296,222],b:[334,250]},{a:[222,354],b:[262,331]},{a:[192,386],b:[230,384]},{a:[444,166],b:[466,204]},{a:[500,262],b:[526,300]},{a:[548,346],b:[582,372]},{a:[626,404],b:[684,409]}];
function insideInner(x,y){if(y<IN.p.y||y>IN.l.y)return false;return x>innerX(y,-1)+2&&x<innerX(y,1)-2;}
VEINS.forEach((v,i)=>{v.i=i;v.deep=insideInner(v.a[0],v.a[1])&&insideInner(v.b[0],v.b[1]);
  const x0=Math.min(v.a[0],v.b[0]),x1=Math.max(v.a[0],v.b[0]),yAt=x=>v.a[1]+(v.b[1]-v.a[1])*((x-v.a[0])/((v.b[0]-v.a[0])||1));
  v.cx=(v.a[0]+v.b[0])/2;v.cy=(v.a[1]+v.b[1])/2;
  /* the spots right above a shallow vein: project onto the slope it runs under (or the meadow) */
  const side=(v.cy>GY-4&&v.cx>Rb.x-10)?2:(v.cx<P.x?-1:1);
  const along=(x,y)=>side===2?x:side<0?((x-Lb.x)*(P.x-Lb.x)+(y-Lb.y)*(P.y-Lb.y))/lenL:((x-P.x)*(Rb.x-P.x)+(y-P.y)*(Rb.y-P.y))/lenR;
  const t0=Math.min(along(...v.a),along(...v.b)),t1=Math.max(along(...v.a),along(...v.b));
  v.above=v.deep?[]:SLOTS.filter(s=>s.side===side&&along(s.x,s.y)>=t0-9&&along(s.x,s.y)<=t1+9).map(s=>s.i);
  v.water=nearWaterXY(v.cx,v.cy,74);
  v.name=(v.deep?'Deep vein ':'Shallow vein ')+(i<5?i+1:i-4);});
function nearWaterXY(x,y,r){for(const w of WATER){const [x0,y0,x1,y1]=w.hit;const dx=Math.max(x0-x,0,x-x1),dy=Math.max(y0-y,0,y-y1);if(Math.hypot(dx,dy)<=r)return w.k;}return null;}
SLOTS.forEach(s=>{s.water=nearWaterXY(s.x,s.y,52);});
/* ---------- rules (Paul's numbers, in thousands of dollars) ---------- */
const R={loan:2000,tree:{get:500,cost:50},deer:{get:50,cost:0},lynx:{get:0,cost:0},vein:{get:1000,cost:250},
  protect:500,spill:1000,hunt:10,park:2500,corridor:1000,move:{lynx:250,deer:500,tree:1000},parkVal:{lynx:800,deer:400,tree:250}};
const NAME={tree:'spruce stand',deer:'mule deer herd',lynx:'lynx family'},NAMES={tree:'spruce stands',deer:'mule deer herds',lynx:'lynx families'};
const DEFAULTS={spillPct:30,visitPct:5,leakPct:10,hunt:true};
/* ---------- state ---------- */
function newState(){return {cash:R.loan,slots:START.map(o=>({o,g:'',lost:false})),veins:VEINS.map(()=>0),protect:{res:false,creek:false},
  polluted:{res:0,creek:0},park:null,corr:[],log:[],harv:{tree:0,deer:0,lynx:0,gold:0},lost:{tree:0,deer:0,lynx:0},spills:0,done:false};}
const clone=o=>JSON.parse(JSON.stringify(o));
function fmtK(v){const s=v<0?'−':'';v=Math.abs(Math.round(v));if(v>=1000){const m=v/1000;return s+'$'+(Math.round(m*100)/100).toLocaleString('en-US',{maximumFractionDigits:2})+'M';}return s+'$'+v+'K';}
function fmtK2(v){const s=v<0?'−':'';return s+'$'+Math.abs(Math.round(v)).toLocaleString('en-US')+'K';}
/* path position (0..1) of a spot, used for park edges */
const PATHLEN=lenL+lenR+(MEND-Rb.x);
function pathPos(i){const s=SLOTS[i];if(s.side<0)return LD[s.n-1]/PATHLEN;if(s.side===1)return (lenL+RE[s.n-1])/PATHLEN;return (lenL+lenR+(s.x-Rb.x))/PATHLEN;}
function pathPt(f){let d=f*PATHLEN;if(d<=lenL)return onLeft(d);d-=lenL;if(d<=lenR)return onRight(d);d-=lenR;return {x:Rb.x+d,y:GY};}
function inPark(st,i){if(!st.park)return false;const f=pathPos(i);return f>=st.park.a-1e-9&&f<=st.park.b+1e-9;}
function veinInPark(st,v){if(!st.park)return false;if(v.above.some(i=>inPark(st,i)))return true;
  const near=SLOTS.filter(s=>Math.abs(s.x-v.cx)<14);return near.some(s=>inPark(st,s.i));}
function parkValue(st){if(!st.park)return 0;let t=0;st.slots.forEach((s,i)=>{if(s.o&&inPark(st,i))t+=R.parkVal[s.o];});return t;}
function count(st,kind){return st.slots.filter(s=>s.o===kind).length;}
/* ---------- habitat patches: the ridge, open pits and 3+ cleared spots in a row split the forest ---------- */
function bridged(st,a,b){return st.corr.some(c=>c>=a-0.01&&c<=b+0.01);}
function barriers(st){const out=[];if(!bridged(st,RIDGE,RIDGE))out.push({a:RIDGE,b:RIDGE,kind:'ridge'});
  let i=0;while(i<NS){const g=st.slots[i].g;if(g==='pit'||g==='stump'){let j=i;while(j+1<NS&&(st.slots[j+1].g==='pit'||st.slots[j+1].g==='stump'))j++;
      const pit=st.slots.slice(i,j+1).some(s=>s.g==='pit');if((pit||j-i+1>=3)&&!bridged(st,i,j))out.push({a:i,b:j,kind:pit?'pit':'clear'});i=j+1;}else i++;}
  return out;}
function patches(st){const br=barriers(st);const id=new Array(NS).fill(0);let p=0;
  for(let i=0;i<NS;i++){if(i>0){const cut=br.some(b=>(b.kind==='ridge'&&i===14)||(b.kind!=='ridge'&&(i===b.a||i===b.b+1)));if(cut)p++;}
    id[i]=(st.slots[i].g==='pit'&&!bridged(st,i,i))?-1:p;}
  return id;}
/* a lynx family needs at least 2 spruce stands in its connected patch */
const TREES_PER_LYNX=2;
function lynxCheck(st,why){const id=patches(st),lostNow=[];const groups={};
  st.slots.forEach((s,i)=>{if(id[i]<0)return;(groups[id[i]]=groups[id[i]]||{t:0,l:[]});if(s.o==='tree')groups[id[i]].t++;if(s.o==='lynx')groups[id[i]].l.push(i);});
  Object.values(groups).forEach(g=>{const cap=Math.floor(g.t/TREES_PER_LYNX);let extra=g.l.length-cap;
    if(extra>0){const sc=g.l.map(i=>({i,n:treesNear(st,i)})).sort((a,b)=>a.n-b.n);for(let k=0;k<extra;k++){const i=sc[k].i;st.slots[i].o='';st.lost.lynx++;lostNow.push(i);}}});
  return lostNow;}
function treesNear(st,i){let n=0;for(let j=Math.max(0,i-3);j<=Math.min(NS-1,i+3);j++)if(st.slots[j].o==='tree')n++;return n;}
/* ---------- actions ---------- */
/* each returns {ok, msg, row?, lost?, spill?, at:{x,y}} ; rng() is used only for spill chances */
function canPay(st,c){return st.cash>=c;}
function spillRoll(st,wk,opts,rng){if(!wk||st.protect[wk])return null;const p=(opts.spillPct==null?DEFAULTS.spillPct:opts.spillPct)/100;const hit=rng()<p;
  if(hit){st.cash-=R.spill;st.polluted[wk]++;st.spills++;}return {w:wk,hit,p};}
function harvest(st,i,opts,rng){const s=st.slots[i],sl=SLOTS[i];if(st.done)return {ok:false,msg:'Your plan is finished.'};
  if(!s.o)return {ok:false,msg:'Nothing to harvest here.'};
  if(inPark(st,i)&&st.park.open)return {ok:false,msg:'This spot is inside your park. Parks protect everything in them.'};
  if(s.o==='lynx')return {ok:false,msg:'Lynx are a protected endangered species in Colorado. Nobody can legally hunt or trap them, so they are worth $0 to harvest.'};
  const r=R[s.o];if(!canPay(st,r.cost))return {ok:false,msg:'You need '+fmtK(r.cost)+' to pay for this harvest.'};
  const kind=s.o;st.cash+=r.get-r.cost;s.o='';if(kind==='tree')s.g='stump';st.harv[kind]++;
  const row={a:'Harvest a '+NAME[kind]+' ('+sl.zone.toLowerCase()+')',b:r.get,c:r.cost};
  let spill=null;if(kind==='tree'&&sl.water)spill=spillRoll(st,sl.water,opts,rng);
  if(spill&&spill.hit)row.spill=1;const lost=lynxCheck(st);
  return {ok:true,row,spill,lost,kind,at:sl};}
function mine(st,v,opts,rng){const V=VEINS[v];if(st.done)return {ok:false,msg:'Your plan is finished.'};
  if(st.veins[v])return {ok:false,msg:'This vein has already been mined.'};
  if(st.park&&st.park.open&&veinInPark(st,V))return {ok:false,msg:'This vein is under your park. Parks protect the land above and below.'};
  if(!canPay(st,R.vein.cost))return {ok:false,msg:'Mining costs '+fmtK(R.vein.cost)+'. You do not have enough cash.'};
  st.cash+=R.vein.get-R.vein.cost;st.veins[v]=1;st.harv.gold++;const destroyed=[];
  V.above.forEach(i=>{const s=st.slots[i];if(s.o){st.lost[s.o]++;destroyed.push({i,o:s.o});s.o='';}s.g='pit';});
  const row={a:'Mine a '+(V.deep?'deep':'shallow')+' gold vein'+(destroyed.length?' (destroyed '+destroyed.length+' above it)':''),b:R.vein.get,c:R.vein.cost};
  const spill=spillRoll(st,V.water,opts,rng);if(spill&&spill.hit)row.spill=1;const lost=lynxCheck(st);
  return {ok:true,row,spill,lost,destroyed,at:{x:V.cx,y:V.cy}};}
function protect(st,wk){const w=WATER.find(x=>x.k===wk);if(st.done)return {ok:false,msg:'Your plan is finished.'};
  if(st.protect[wk])return {ok:false,msg:'The '+w.short+' is already protected.'};if(!canPay(st,R.protect))return {ok:false,msg:'Protecting water costs '+fmtK(R.protect)+'.'};
  st.cash-=R.protect;st.protect[wk]=true;return {ok:true,row:{a:'Protect the '+w.short+' (barriers and a treatment pond)',b:0,c:R.protect},at:{x:w.cx,y:w.cy}};}
function move(st,from,to){const a=st.slots[from],b=st.slots[to];if(st.done)return {ok:false,msg:'Your plan is finished.'};
  if(!a.o)return {ok:false,msg:'Nothing to move.'};if(b.o)return {ok:false,msg:'That spot is taken. Pick an empty spot.'};if(b.g==='pit')return {ok:false,msg:'Nothing can live in an open pit.'};
  const c=R.move[a.o];if(!canPay(st,c))return {ok:false,msg:'Moving a '+NAME[a.o]+' costs '+fmtK(c)+'.'};
  st.cash-=c;const kind=a.o;b.o=kind;a.o='';if(kind==='tree'){a.g='stump';if(b.g==='stump')b.g='';}
  const lost=lynxCheck(st);return {ok:true,row:{a:'Move a '+NAME[kind]+' to '+SLOTS[to].zone.toLowerCase()+' spot '+SLOTS[to].n,b:0,c},lost,kind,at:SLOTS[to]};}
function openPark(st,a,b){if(st.done)return {ok:false,msg:'Your plan is finished.'};if(st.park&&st.park.open)return {ok:false,msg:'Your park is already open.'};
  if(!canPay(st,R.park))return {ok:false,msg:'Opening a park costs '+fmtK(R.park)+'. Earn more first.'};
  st.cash-=R.park;st.park={a:Math.min(a,b),b:Math.max(a,b),open:true};return {ok:true,row:{a:'Open a park',b:0,c:R.park},at:pathPt((a+b)/2)};}
function corridor(st,pos){if(st.done)return {ok:false,msg:'Your plan is finished.'};const br=barriers(st);
  const hit=br.find(b=>pos>=b.a-0.6&&pos<=b.b+0.6);if(!hit)return {ok:false,msg:'A corridor goes across a break in the habitat: the bare ridge, an open pit, or 3+ cleared spots in a row.'};
  if(!canPay(st,R.corridor))return {ok:false,msg:'A wildlife corridor costs '+fmtK(R.corridor)+'.'};
  st.cash-=R.corridor;const c=hit.kind==='ridge'?RIDGE:(hit.a+hit.b)/2;st.corr.push(c);
  return {ok:true,row:{a:'Build a wildlife corridor across '+(hit.kind==='ridge'?'the ridge':hit.kind==='pit'?'an open pit':'a clearing'),b:0,c:R.corridor},at:corrPt(c),kind:hit.kind};}
function corrPt(c){if(c===RIDGE)return {x:P.x,y:P.y+30};const i=Math.round(c);return SLOTS[Math.max(0,Math.min(NS-1,i))];}
/* ---------- end of plan (Paul's scoring) ---------- */
function finish(st){st.done=true;const pv=parkValue(st);st.end={cash:st.cash,park:pv,net:st.cash+pv-R.loan,lynx:count(st,'lynx'),deer:count(st,'deer'),tree:count(st,'tree'),parkPops:st.park?st.slots.filter((s,i)=>s.o&&inPark(st,i)).length:0};return st.end;}
/* ---------- 20 years later ---------- */
function rngSeed(seed){let a=seed>>>0||1;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
/* one year; returns the list of events (each with x,y,text,kind,$) */
function yearTick(F,opts,rng){const st=F.st,ev=[],y=F.year+1;const vis=(opts.visitPct==null?DEFAULTS.visitPct:opts.visitPct)/100,leak=(opts.leakPct==null?DEFAULTS.leakPct:opts.leakPct)/100,hunt=opts.hunt==null?DEFAULTS.hunt:opts.hunt;
  // park visitors
  if(st.park&&st.park.open){const v=Math.round(parkValue(st)*vis);if(v>0){F.money+=v;F.inc.park+=v;ev.push({kind:'park',$:v,...pathPt((st.park.a+st.park.b)/2),text:'Park visitors +'+fmtK(v)});}}
  // hunting licenses on deer outside the park
  if(hunt){let n=0;st.slots.forEach((s,i)=>{if(s.o==='deer'&&!inPark(st,i))n++;});if(n){const v=n*R.hunt;F.money+=v;F.inc.hunt+=v;ev.push({kind:'hunt',$:v,x:700,y:300,text:'Hunting licenses +'+fmtK(v)});}}
  // mine drainage from mined veins near unprotected water
  VEINS.forEach((V,i)=>{if(st.veins[i]&&V.water&&!st.protect[V.water]&&rng()<leak){F.money-=R.spill;F.inc.leak+=R.spill;st.polluted[V.water]++;F.leaks++;ev.push({kind:'leak',$:-R.spill,x:V.cx,y:V.cy,w:V.water,text:'Acid drainage: clean-up −'+fmtK(R.spill)});}});
  // saplings grow on stumps (timber size takes about a century, so no timber income in 20 years)
  st.slots.forEach(s=>{if(s.g==='stump'||s.g==='sap'){s.g='sap';s.age=(s.age||0)+1;}});
  // deer move into open or regrowing spots next to a herd in the same patch
  const id=patches(st);const add=[];
  st.slots.forEach((s,i)=>{if(s.o||s.g==='pit'||id[i]<0)return;const nb=[i-1,i+1].filter(j=>j>=0&&j<NS&&id[j]===id[i]&&st.slots[j].o==='deer');if(nb.length&&rng()<(s.g==='sap'?0.14:0.07))add.push(i);});
  add.forEach(i=>{st.slots[i].o='deer';F.born++;ev.push({kind:'deer',x:SLOTS[i].x,y:SLOTS[i].y-12,text:'New deer herd'});});
  // lynx: too few trees, or a lone family cut off from others
  const before=st.slots.map(s=>s.o);lynxCheck(st);st.slots.forEach((s,i)=>{if(before[i]==='lynx'&&!s.o)ev.push({kind:'lynx',x:SLOTS[i].x,y:SLOTS[i].y-14,text:'Lynx gone: too little forest'});});
  const id2=patches(st);const fam={};st.slots.forEach((s,i)=>{if(s.o==='lynx'&&id2[i]>=0)(fam[id2[i]]=fam[id2[i]]||[]).push(i);});
  Object.values(fam).forEach(g=>{if(g.length===1&&rng()<0.08){const i=g[0];st.slots[i].o='';st.lost.lynx++;ev.push({kind:'lynx',x:SLOTS[i].x,y:SLOTS[i].y-14,text:'Lone lynx family gone: no mates nearby'});}});
  F.year=y;F.series.push({y,money:F.money,lynx:count(st,'lynx'),deer:count(st,'deer'),tree:count(st,'tree'),dirty:(st.polluted.res>0)+(st.polluted.creek>0)});
  return ev;}
function future(st,opts,seed){const F={st:clone(st),year:0,money:st.end?st.end.net:st.cash+parkValue(st)-R.loan,inc:{park:0,hunt:0,leak:0},leaks:0,born:0,seed,series:[]};
  F.series.push({y:0,money:F.money,lynx:count(F.st,'lynx'),deer:count(F.st,'deer'),tree:count(F.st,'tree'),dirty:(st.polluted.res>0)+(st.polluted.creek>0)});F.rng=rngSeed(seed);return F;}
function runFuture(st,opts,seed,years){const F=future(st,opts,seed);for(let k=0;k<(years||20);k++)yearTick(F,opts,F.rng);return F;}
function manyFutures(st,opts,n){const out=[];for(let k=0;k<n;k++){const F=runFuture(st,opts,1000+k*7919,20);out.push({money:F.money,lynx:count(F.st,'lynx'),deer:count(F.st,'deer'),leaks:F.leaks});}
  const m=out.map(o=>o.money).sort((a,b)=>a-b),avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
  return {n,avg:avg(m),min:m[0],max:m[m.length-1],p10:m[Math.floor(n*0.1)],p90:m[Math.floor(n*0.9)],lynxAvg:avg(out.map(o=>o.lynx)),lynxAny:out.filter(o=>o.lynx>0).length/n,deerAvg:avg(out.map(o=>o.deer)),leakAvg:avg(out.map(o=>o.leaks)),list:out};}
/* ---------- result code (for the class board) ---------- */
function encode(st,name,extra){const o={v:1,n:(name||'').slice(0,60),s:st.slots.map(s=>(s.o?s.o[0]:'-')+(s.g?s.g[0]:'-')).join(''),m:st.veins.join(''),p:st.protect.res?1:0,q:st.protect.creek?1:0,
  r:st.polluted.res,c:st.polluted.creek,k:st.park?[+st.park.a.toFixed(3),+st.park.b.toFixed(3)]:0,x:st.corr,cash:st.cash,h:st.harv,l:st.lost,sp:st.spills,e:st.end||0,f:extra||0};
  const json=JSON.stringify(o);let b64;try{b64=btoa(unescape(encodeURIComponent(json)));}catch(e){b64=btoa(json);}return 'MTN1.'+b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(code){code=(code||'').trim();const m=code.match(/MTN1\.([A-Za-z0-9_-]+)/);if(!m)return null;let b=m[1].replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';
  try{const o=JSON.parse(decodeURIComponent(escape(atob(b))));if(o.v!==1||typeof o.s!=='string'||o.s.length!==NS*2)return null;
    const st=newState();const O={t:'tree',d:'deer',l:'lynx'},G={s:'stump',p:'pit',a:'sap'};
    st.slots=st.slots.map((_,i)=>({o:O[o.s[i*2]]||'',g:G[o.s[i*2+1]]||'',lost:false}));st.veins=String(o.m||'').split('').map(Number).slice(0,VEINS.length);while(st.veins.length<VEINS.length)st.veins.push(0);
    st.protect={res:!!o.p,creek:!!o.q};st.polluted={res:+o.r||0,creek:+o.c||0};st.park=o.k?{a:+o.k[0],b:+o.k[1],open:true}:null;st.corr=Array.isArray(o.x)?o.x.map(Number):[];
    st.cash=+o.cash||0;st.harv=o.h||st.harv;st.lost=o.l||st.lost;st.spills=+o.sp||0;st.end=o.e||null;st.done=!!o.e;return {st,name:o.n||'',extra:o.f||{}};}catch(e){return null;}}
/* ---------- drawing ---------- */
function shade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const t=f<0?0:255,p=Math.abs(f);r=Math.round((t-r)*p+r);g=Math.round((t-g)*p+g);b=Math.round((t-b)*p+b);return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);}
function drawTree(ctx,x,y,s,a){ctx.save();ctx.globalAlpha*=a==null?1:a;ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle='#5b3a24';ctx.fillRect(-1.6,-5,3.2,5);
  const tiers=[[0,-34,5],[0,-28,7],[0,-21,9],[0,-13,10.5]];
  tiers.forEach(([_,top,w],k)=>{ctx.fillStyle=k%2?'#2b5a3a':'#24503a';ctx.beginPath();ctx.moveTo(0,top);ctx.lineTo(w,top+12);ctx.lineTo(-w,top+12);ctx.closePath();ctx.fill();});
  ctx.fillStyle='rgba(255,255,255,.10)';ctx.beginPath();ctx.moveTo(0,-34);ctx.lineTo(-10.5,-1);ctx.lineTo(-3,-1);ctx.closePath();ctx.fill();ctx.restore();}
function drawStump(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#7a5434';ctx.fillRect(-3.5,-5,7,5);ctx.fillStyle='#c79a63';ctx.beginPath();ctx.ellipse(0,-5,3.5,1.6,0,0,6.29);ctx.fill();ctx.restore();}
function drawSap(ctx,x,y,s,age){drawStump(ctx,x-5*s,y,s*0.8);const f=Math.min(1,0.25+age/40);drawTree(ctx,x+3*s,y,s*f);}
function drawDeer(ctx,x,y,s,flip){ctx.save();ctx.translate(x,y);ctx.scale(flip?-s:s,s);
  ctx.fillStyle='#8a6e55';ctx.strokeStyle='#4e3b2b';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.ellipse(0,-14,9,5,0,0,6.29);ctx.fill();ctx.stroke();                              // body
  ctx.fillStyle='#f1ebe2';ctx.beginPath();ctx.ellipse(-8.5,-14,2.6,3.6,0,0,6.29);ctx.fill();            // white rump
  ctx.fillStyle='#1d1a17';ctx.beginPath();ctx.ellipse(-10.6,-13,1,1.8,0,0,6.29);ctx.fill();            // black-tipped tail
  ctx.strokeStyle='#5d4733';ctx.lineWidth=1.6;[[-6,-10],[-3,-10],[4,-10],[7,-10]].forEach(([lx,ly])=>{ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(lx+(lx<0?-0.5:0.5),0);ctx.stroke();});
  ctx.fillStyle='#8a6e55';ctx.beginPath();ctx.moveTo(6,-17);ctx.lineTo(10,-25);ctx.lineTo(13,-24);ctx.lineTo(10,-14);ctx.closePath();ctx.fill();   // neck
  ctx.beginPath();ctx.ellipse(13,-25,3.6,2.3,0.35,0,6.29);ctx.fill();                                  // head
  ctx.fillStyle='#e8ddd0';ctx.beginPath();ctx.ellipse(15.6,-24,1.3,1.2,0,0,6.29);ctx.fill();
  ctx.fillStyle='#7a5f48';ctx.beginPath();ctx.ellipse(9.5,-29,1.7,4,-0.9,0,6.29);ctx.fill();ctx.beginPath();ctx.ellipse(12,-30,1.7,4,-0.3,0,6.29);ctx.fill();  // big mule ears
  ctx.restore();}
function drawLynx(ctx,x,y,s,flip){ctx.save();ctx.translate(x,y);ctx.scale(flip?-s:s,s);
  const fur='#a89c86',dark='#5f5546';ctx.strokeStyle=dark;ctx.lineWidth=0.8;
  ctx.fillStyle='#968a74';[[-5.5,-9],[5,-9]].forEach(([lx,ly])=>{ctx.fillRect(lx-1.4,ly,2.8,8);});                 // far legs
  ctx.fillStyle=fur;ctx.beginPath();ctx.ellipse(0,-12,8.5,4.6,-0.08,0,6.29);ctx.fill();ctx.stroke();                 // body (high rump)
  ctx.fillStyle='#7d725f';[[-7,-14],[-3,-15],[2,-14],[5,-12]].forEach(([sx,sy])=>{ctx.beginPath();ctx.arc(sx,sy,0.7,0,6.29);ctx.fill();}); // faint spots
  ctx.fillStyle=fur;[[-7,-9],[3.5,-9]].forEach(([lx,ly])=>{ctx.fillRect(lx-1.6,ly,3.2,9);});                         // near legs, long
  ctx.fillStyle='#8f836d';[[-7,0],[3.5,0],[-5.5,0],[5,0]].forEach(([px,py])=>{ctx.beginPath();ctx.ellipse(px,py-0.6,2.6,1.4,0,0,6.29);ctx.fill();}); // big snowshoe paws
  ctx.fillStyle=fur;ctx.beginPath();ctx.ellipse(-8.6,-15,2.2,1.6,0.5,0,6.29);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(-10.2,-16,1.3,0,6.29);ctx.fill(); // stubby black-tipped tail
  ctx.fillStyle=fur;ctx.beginPath();ctx.arc(10.5,-16.5,4.6,0,6.29);ctx.fill();ctx.stroke();                            // head
  ctx.fillStyle='#ece5d8';ctx.beginPath();ctx.moveTo(8,-14);ctx.lineTo(10,-9.5);ctx.lineTo(12,-12.5);ctx.lineTo(14.6,-10);ctx.lineTo(14.6,-15);ctx.closePath();ctx.fill();   // pale facial ruff
  ctx.strokeStyle='#2b2823';ctx.lineWidth=0.6;ctx.beginPath();ctx.moveTo(9,-13.5);ctx.lineTo(10.4,-10.5);ctx.moveTo(13.8,-13.5);ctx.lineTo(13.6,-10.8);ctx.stroke();
  ctx.fillStyle=fur;ctx.beginPath();ctx.moveTo(7.6,-19.5);ctx.lineTo(8.2,-25);ctx.lineTo(10.4,-20.5);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(11.4,-20.6);ctx.lineTo(13.2,-25.4);ctx.lineTo(14.2,-19.6);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#111';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(8.2,-25);ctx.lineTo(8,-28.5);ctx.moveTo(13.2,-25.4);ctx.lineTo(13.8,-28.8);ctx.stroke();   // black ear tufts
  ctx.fillStyle='#2c2a26';ctx.beginPath();ctx.arc(12.6,-17.4,0.8,0,6.29);ctx.fill();ctx.beginPath();ctx.arc(14.7,-15.6,0.7,0,6.29);ctx.fill();
  ctx.restore();}
function drawOrg(ctx,o,x,y,s,flip,alpha){ctx.save();if(alpha!=null)ctx.globalAlpha*=alpha;if(o==='tree')drawTree(ctx,x,y,s);else if(o==='deer')drawDeer(ctx,x,y,s,flip);else if(o==='lynx')drawLynx(ctx,x,y,s,flip);ctx.restore();}
function drawGate(ctx,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#6b4a2b';ctx.fillRect(-7,-22,3,22);ctx.fillRect(4,-22,3,22);ctx.fillStyle='#a8784a';for(let k=0;k<3;k++)ctx.fillRect(-4,-19+k*6,8,3);ctx.restore();}
/* the whole scene; C = colors {bg,ink,soft,sky}; o = {k, hover, pick, ghostPark, labels, ev:[], year} */
function drawScene(ctx,st,C,o){o=o||{};const k=o.k||1;
  const sky=ctx.createLinearGradient(0,0,0,GY);sky.addColorStop(0,C.dark?'#1c2633':'#cfe3f3');sky.addColorStop(1,C.dark?'#232a31':'#eef4f8');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  // far range
  ctx.fillStyle=C.dark?'#2b3440':'#b9c7d3';ctx.beginPath();ctx.moveTo(0,GY);ctx.lineTo(0,250);ctx.lineTo(70,205);ctx.lineTo(130,240);ctx.lineTo(200,190);ctx.lineTo(260,232);ctx.lineTo(560,232);ctx.lineTo(640,170);ctx.lineTo(700,215);ctx.lineTo(760,180);ctx.lineTo(800,205);ctx.lineTo(800,GY);ctx.closePath();ctx.fill();
  // valley floor
  ctx.fillStyle=C.dark?'#3a3a2c':'#a89a73';ctx.fillRect(0,GY,W,H-GY);ctx.fillStyle=C.dark?'#3f5a35':'#7da35a';ctx.fillRect(Rb.x,GY-2,W-Rb.x,10);ctx.fillRect(0,GY-2,Lb.x,10);
  // mountain
  const mg=ctx.createLinearGradient(0,P.y,0,GY);mg.addColorStop(0,C.dark?'#6a645c':'#9b948b');mg.addColorStop(1,C.dark?'#4c4740':'#7d7469');
  ctx.fillStyle=mg;ctx.beginPath();ctx.moveTo(Lb.x,GY);ctx.lineTo(P.x,P.y);ctx.lineTo(Rb.x,GY);ctx.closePath();ctx.fill();
  // snow above about 13,000 ft
  ctx.fillStyle='#f4f6f8';ctx.beginPath();ctx.moveTo(surfX(SNOW,-1),SNOW);ctx.lineTo(P.x,P.y);ctx.lineTo(surfX(SNOW,1),SNOW);ctx.lineTo(412,SNOW-6);ctx.lineTo(402,SNOW+6);ctx.lineTo(390,SNOW-4);ctx.lineTo(380,SNOW+5);ctx.closePath();ctx.fill();
  // deep-rock line
  ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle=C.dark?'rgba(255,255,255,.45)':'rgba(30,25,20,.55)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(IN.l.x,IN.l.y);ctx.lineTo(IN.p.x,IN.p.y);ctx.lineTo(IN.r.x,IN.r.y);ctx.stroke();ctx.restore();
  // water
  WATER.forEach(w=>{const bad=st.polluted[w.k]>0,col=bad?'#c4702a':'#3c7fc0';
    if(w.k==='res'){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(12,GY);ctx.quadraticCurveTo(88,446,166,GY);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(30,GY+3,60,2);}
    else{ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(590,383,19,10,-0.6,0,6.29);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(600,392);ctx.bezierCurveTo(640,404,700,396,800,402);ctx.stroke();}
    if(st.protect[w.k]){ctx.strokeStyle='#14a3a3';ctx.lineWidth=3.2;ctx.setLineDash([6,3]);ctx.beginPath();if(w.k==='res'){ctx.moveTo(8,GY-6);ctx.lineTo(170,GY-6);}else{ctx.ellipse(590,383,26,16,-0.6,0,6.29);}ctx.stroke();ctx.setLineDash([]);}});
  // park band
  const pk=st.park||o.ghostPark;if(pk){ctx.save();const a=pathPt(pk.a),b=pathPt(pk.b);ctx.strokeStyle=st.park?'rgba(40,160,70,.55)':'rgba(40,160,70,.5)';ctx.lineWidth=st.park?16:12;ctx.lineCap='round';if(!st.park)ctx.setLineDash([8,8]);
    ctx.beginPath();const N=40;for(let n=0;n<=N;n++){const p=pathPt(pk.a+(pk.b-pk.a)*n/N);n?ctx.lineTo(p.x,p.y+4):ctx.moveTo(p.x,p.y+4);}ctx.stroke();ctx.restore();
    drawGate(ctx,a.x,a.y+2,1.05);drawGate(ctx,b.x,b.y+2,1.05);}
  // veins
  VEINS.forEach((v,i)=>{const mined=st.veins[i];ctx.lineCap='round';
    if(mined){ctx.strokeStyle='#1d1b19';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(v.a[0],v.a[1]);ctx.lineTo(v.b[0],v.b[1]);ctx.stroke();}
    else{ctx.strokeStyle='#6d5513';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(v.a[0],v.a[1]);ctx.lineTo(v.b[0],v.b[1]);ctx.stroke();ctx.strokeStyle='#e0b42c';ctx.lineWidth=6;ctx.stroke();
      ctx.fillStyle='#fff3b0';[0.25,0.6,0.85].forEach(f=>{ctx.beginPath();ctx.arc(v.a[0]+(v.b[0]-v.a[0])*f,v.a[1]+(v.b[1]-v.a[1])*f,1.2,0,6.29);ctx.fill();});}});
  // forest floor along the surface: green under forest, brown where cut, dark in pits, so habitat breaks show
  ctx.save();ctx.lineCap='butt';st.slots.forEach((s,i)=>{const p=SLOTS[i],q0=i>0&&SLOTS[i-1].side===p.side?SLOTS[i-1]:null,q1=i<NS-1&&SLOTS[i+1].side===p.side?SLOTS[i+1]:null;
    const a=q0?{x:(q0.x+p.x)/2,y:(q0.y+p.y)/2}:{x:p.x-(q1?q1.x-p.x:10)/2,y:p.y-(q1?q1.y-p.y:0)/2},b=q1?{x:(q1.x+p.x)/2,y:(q1.y+p.y)/2}:{x:p.x+(q0?p.x-q0.x:10)/2,y:p.y+(q0?p.y-q0.y:0)/2};
    const col=s.g==='pit'?'#2e2620':s.g==='stump'?'#8b6b48':s.g==='sap'?'#7aa158':s.o==='tree'?'#2f5d3a':p.side===2?'#6f9a4a':'#5f8452';
    const nx=p.side<0?0.82:p.side===1?-0.82:0,ny=p.side===2?1:0.57;ctx.strokeStyle=col;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(a.x+nx*4,a.y+ny*4);ctx.lineTo(b.x+nx*4,b.y+ny*4);ctx.stroke();});ctx.restore();
  // pits (shallow mines) and spots
  st.slots.forEach((s,i)=>{const p=SLOTS[i];if(s.g==='pit'){ctx.fillStyle='#3a3029';ctx.beginPath();ctx.ellipse(p.x,p.y+3,11,6,p.side<0?-0.97:p.side===1?0.99:0,0,6.29);ctx.fill();}});
  // corridors
  st.corr.forEach(c=>{const p=corrPt(c);ctx.save();ctx.strokeStyle='#7b3fe4';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();
    if(c===RIDGE){ctx.moveTo(surfX(150,-1)+10,150);ctx.quadraticCurveTo(P.x,122,surfX(150,1)-10,150);}else{ctx.moveTo(p.x-22,p.y-14);ctx.quadraticCurveTo(p.x,p.y-30,p.x+22,p.y-14);}ctx.stroke();
    ctx.fillStyle='#7b3fe4';ctx.font='700 '+Math.round(11*k)+'px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText('corridor',p.x,(c===RIDGE?118:p.y-32));ctx.restore();});
  // organisms
  // trees first, then animals on top; animals face out from the mountain so their heads are in the open
  st.slots.forEach((s,i)=>{const p=SLOTS[i];if(s.g==='stump')drawStump(ctx,p.x,p.y,1.3);if(s.g==='sap')drawSap(ctx,p.x,p.y,1.15,s.age||1);
    if(s.o==='tree')drawOrg(ctx,'tree',p.x,p.y,1.15,false,o.pick===i?0.35:1);});
  st.slots.forEach((s,i)=>{const p=SLOTS[i];if(!s.o||s.o==='tree')return;const flip=p.side<0||(p.side===2&&i%2===0);
    drawOrg(ctx,s.o,p.x,p.y,s.o==='deer'?1.25:1.3,flip,o.pick===i?0.35:1);});
  if(o.pick!=null&&o.pickPos){const s=st.slots[o.pick];if(s&&s.o)drawOrg(ctx,s.o,o.pickPos.x,o.pickPos.y,1,false,0.9);}
  // labels
  if(o.labels!==false){const f=Math.round(12*k);ctx.textAlign='left';ctx.font='600 '+f+'px system-ui,sans-serif';
    ctx.fillStyle=C.ink;ctx.fillText('Town reservoir',14,GY+40>H-4?H-6:GY+40);
    ctx.textAlign='right';ctx.fillText('Trout creek',796,GY+30);ctx.textAlign='left';
    ctx.fillStyle=C.soft;ctx.font='500 '+f+'px system-ui,sans-serif';ctx.fillText('Bare ridge (no trees)',P.x+12,P.y+14);}
  return true;}
const API={W,H,SLOTS,VEINS,WATER,R,NAME,NAMES,DEFAULTS,RIDGE,NS,TREES_PER_LYNX,P,Lb,Rb,GY,IN,newState,clone,fmtK,fmtK2,pathPos,pathPt,inPark,veinInPark,parkValue,count,barriers,patches,lynxCheck,
  harvest,mine,protect,move,openPark,corridor,corrPt,finish,future,yearTick,runFuture,manyFutures,rngSeed,encode,decode,drawScene,drawOrg,drawTree,drawStump,drawGate,surfX,shade};
if(typeof window!=='undefined')window.MTN=API;if(typeof module!=='undefined')module.exports=API;
})();
