(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,axes,legend,serColor}=BioLab.h;

/* ---------------- the true history ----------------
   Time runs from 0 (450 million years ago, the shark split) to 450 (today). */
const NAMES=['Human','Chimp','Mouse','Chicken','Frog','Shark'];
const COLS=['#c8553d','#b5651d','#9a5bb8','#b58a1c','#3a9a52','#3f6fb0'];
const TREE={id:'root',t:0,kids:[{leaf:5},{id:'tet',t:100,kids:[{leaf:4},{id:'amn',t:130,kids:[{leaf:3},{id:'mam',t:360,kids:[{leaf:2},{id:'pri',t:444,kids:[{leaf:1},{leaf:0}]}]}]}]}]};
const END=450,L=1000,SHOW=120;
const RATE={slow:0.0004,fast:0.002};
const BCOL=['#2f9a4c','#2f6fd0','#d89a12','#d0453a']; // A C G T
const BASES='ACGT';
(function annotate(n){n.leaves=n.leaf!==undefined?[n.leaf]:n.kids.flatMap(k=>annotate(k));return n.leaves;})(TREE);
// time of the split (since root) between two leaves
const SPLIT=[];(function walk(n){if(n.kids){n.kids.forEach(walk);const [a,b]=n.kids;a.leaves.forEach(i=>b.leaves.forEach(j=>{SPLIT[i]=SPLIT[i]||[];SPLIT[j]=SPLIT[j]||[];SPLIT[i][j]=SPLIT[j][i]=n.t;}));}})(TREE);
const mya=t=>END-t;
const PAIRS=[];for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)PAIRS.push([i,j]);
const CAL={hm:{a:0,b:2,T:90,label:'Human–mouse = 90 million years ago'},hc:{a:0,b:3,T:320,label:'Human–chicken = 320 million years ago'}};
let SEED=1234;

function poisson(lam,r){const Lm=Math.exp(-lam);let k=0,p=1;do{k++;p*=r();}while(p>Lm);return k-1;}
function init(sim){const r=rng(SEED+=7919),anc=new Uint8Array(L);for(let i=0;i<L;i++)anc[i]=Math.floor(r()*4);
  const s={t:0,r,anc,edges:[],flash:new Map(),joins:null,nJoin:0,mut:0};
  TREE.kids.forEach(k=>s.edges.push({n:k,start:0,seq:anc.slice(),alive:true}));return s;}
function step(sim,dt){const s=sim.st;if(s.t>=END)return;dt=Math.min(dt,END-s.t);const mu=RATE[sim.p.gene]||RATE.slow;
  s.edges.forEach((e,ei)=>{if(!e.alive)return;const n=poisson(mu*L*dt,s.r);for(let q=0;q<n;q++){const site=Math.floor(s.r()*L);e.seq[site]=(e.seq[site]+1+Math.floor(s.r()*3))%4;s.mut++;if(site<SHOW)s.flash.set(ei+':'+site,s.t);}});
  s.t+=dt;
  s.edges.forEach(e=>{if(e.alive&&e.n.kids&&s.t>=e.n.t){e.alive=false;e.end=e.n.t;e.n.kids.forEach(k=>s.edges.push({n:k,start:e.n.t,seq:e.seq.slice(),alive:true}));}});
  if(s.t>=END){s.edges.forEach(e=>{if(e.alive)e.end=END;});s.joins=null;}
  if(s.flash.size>400){for(const [k,v] of s.flash)if(s.t-v>10)s.flash.delete(k);}}
function skip(sim){let g=0;while(sim.st.t<END&&g++<2000)step(sim,1);}
const leafEdge=(s,i)=>{let best=null;s.edges.forEach(e=>{if(e.n.leaves.includes(i)&&e.start<=s.t+1e-9&&(e.alive||e.end>=s.t-1e-9)){if(!best||e.start>=best.start)best=e;}});return best;};
function diffs(s,i,j){const a=leafEdge(s,i).seq,b=leafEdge(s,j).seq;let d=0;for(let q=0;q<L;q++)if(a[q]!==b[q])d++;return d;}
const jcOf=p=>p>=0.749?Infinity:-0.75*Math.log(1-4/3*p);
const useJC=sim=>!!sim.p.jc&&atLeast('ap');
function dist(sim,i,j){const p=diffs(sim.st,i,j)/L;return useJC(sim)?jcOf(p):p;}
function est(sim,i,j){if(sim.st.t<END)return NaN;const c=CAL[atLeast('honors')?sim.p.cal:'hm']||CAL.hm,dc=dist(sim,c.a,c.b);if(!(dc>0))return NaN;const d=dist(sim,i,j);return Number.isFinite(d)?d/dc*c.T:Infinity;}
/* ---------------- UPGMA ---------------- */
function upgma(sim){const s=sim.st;if(s.t<END)return null;const key=(useJC(sim)?'j':'p');if(s.joins&&s.joinKey===key)return s.joins;
  let cl=NAMES.map((n,i)=>({members:[i],name:n,h:0,kids:null,id:'L'+i}));const D=new Map(),k=(a,b)=>a.id<b.id?a.id+'|'+b.id:b.id+'|'+a.id;
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const d=dist(sim,i,j);D.set(k(cl[i],cl[j]),Number.isFinite(d)?d:9);}
  const joins=[],snaps=[];let nid=0;
  while(cl.length>1){let best=null;for(let a=0;a<cl.length;a++)for(let b=a+1;b<cl.length;b++){const d=D.get(k(cl[a],cl[b]));if(!best||d<best.d)best={a,b,d};}
    snaps.push({cl:cl.map(c=>c.name),M:cl.map(x=>cl.map(y=>x===y?null:D.get(k(x,y)))),best:[best.a,best.b]});
    const A=cl[best.a],B=cl[best.b],N={members:A.members.concat(B.members),name:A.name+' + '+B.name,h:best.d/2,kids:[A,B],id:'N'+(nid++),d:best.d};
    cl.forEach(c=>{if(c!==A&&c!==B){const d=(D.get(k(A,c))*A.members.length+D.get(k(B,c))*B.members.length)/(A.members.length+B.members.length);D.set(k(N,c),d);}});
    cl=cl.filter(c=>c!==A&&c!==B);cl.push(N);joins.push(N);}
  s.joins={joins,snaps,root:cl[0]};s.joinKey=key;return s.joins;}
function nodeAge(sim,N){const c=CAL[atLeast('honors')?sim.p.cal:'hm']||CAL.hm,dc=dist(sim,c.a,c.b);return dc>0?N.h*2/dc*c.T:NaN;}
function trueAgeOf(N){let t=END;N.members.forEach(i=>N.members.forEach(j=>{if(i!==j)t=Math.min(t,SPLIT[i][j]);}));return mya(t);}
const fmtMya=v=>!Number.isFinite(v)?(v===Infinity?'too saturated':'—'):Math.round(v)+' Mya';

const MC={
  id:'molclock',hash:'molclock',apUnit:11,order:1,tab:'Molecular clock',kind:'Go further',prereq:['cladogram','evolution'],
  card:'Watch one gene mutate down six lineages for 450 million years, then rebuild the tree and date it from the DNA alone.',
  title:'The molecular clock: dating evolution from DNA',
  lede:{bio:'Mutations build up in DNA at a fairly steady rate. Watch a gene change in six lineages, count the differences, and use one fossil date to estimate the rest.',
        honors:'Build a tree from DNA differences with UPGMA, calibrate it with a fossil, and compare a fast-evolving gene with a slow one.',
        ap:'Deep splits saturate: sites change more than once, so raw differences undercount. See the Jukes–Cantor correction recover the true ages.'},
  scale:'Real timescale: 450 million years, from the split between sharks and bony vertebrates to today. The gene has 1,000 DNA sites; the first 120 are drawn.',
  timeScale:45,dtMax:1,prewarm:0,sampleDt:3,window:450,unit:'Myr',timeLabel:'Time',chChange:1,chReveal:452,
  clock(sim){return sim.st.t>=END?'Today':Math.round(mya(sim.st.t))+' million years ago';},
  controls:[
    {id:'gene',label:'Gene',type:'seg',def:'slow',lvl:'bio',options:[{v:'slow',l:'Slow gene'},{v:'fast',l:'Fast gene'}],help:'Slow: like a protein-coding nuclear gene. Fast: like mitochondrial DNA. The rate applies to new mutations.'},
    {id:'cal',label:'Fossil calibration',type:'select',def:'hm',lvl:'honors',options:[{v:'hm',l:'Human–mouse: 90 Mya'},{v:'hc',l:'Human–chicken: 320 Mya'}]},
    {id:'jc',label:'Jukes–Cantor correction',type:'toggle',def:false,lvl:'ap',help:'Estimates the hidden changes at sites that mutated more than once.'}
  ],
  actions:[
    {id:'skip',label:'Skip to today',run(sim){skip(sim);}},
    {id:'join',label:'Join the closest pair',primary:true,run(sim){skip(sim);const u=upgma(sim);if(u)sim.st.nJoin=Math.min(u.joins.length,sim.st.nJoin+1);}},
    {id:'all',label:'Build the whole tree',run(sim){skip(sim);const u=upgma(sim);if(u)sim.st.nJoin=u.joins.length;}},
    {id:'again',label:'Evolve again',run(sim){BioLab.reset(sim);}}
  ],
  init,step,
  metrics:[
    {id:'dHM',label:'Human–mouse differences',unit:'of 1,000',lvl:'bio',min:0,max:null,d:0,get:s=>diffs(s.st,0,2)},
    {id:'dHS',label:'Human–shark differences',unit:'of 1,000',lvl:'bio',min:0,max:null,d:0,get:s=>diffs(s.st,0,5)},
    {id:'dHC',label:'Human–chimp differences',unit:'of 1,000',lvl:'honors',min:0,max:null,d:0,get:s=>diffs(s.st,0,1)},
    {id:'eCh',label:'Clock date: human–chicken',unit:'Mya (true 320)',lvl:'bio',min:0,max:null,d:0,get:s=>{const v=est(s,0,3);return v===Infinity?'too saturated':v;}},
    {id:'eSh',label:'Clock date: shark split',unit:'Mya (true 450)',lvl:'honors',min:0,max:null,d:0,get:s=>{const v=est(s,0,5);return v===Infinity?'too saturated':v;}}
  ],
  graphs:[{id:'clock',label:'Differences vs time since split',custom:true},{id:'pairs',label:'Differences over time',lines:['dHM','dHS']}],
  defaultGraph:'clock',
  plot(sim,ctx,box,id){const s=sim.st,mu=RATE[sim.p.gene]||RATE.slow,jc=useJC(sim);
    const pts=PAIRS.filter(([i,j])=>s.t>=SPLIT[i][j]).map(([i,j])=>{const d=diffs(s,i,j);return {x:s.t-SPLIT[i][j],y:d,c:jc?Math.min(jcOf(d/L)*L,3000):null};});
    const ymax=Math.max(100,...pts.map(p=>p.y),...(jc?pts.map(p=>p.c):[]),2*mu*L*Math.min(450,Math.max(60,s.t))*0.6)*1.12;
    const ax=axes(ctx,box,{xmin:0,xmax:460,ymin:0,ymax:Math.min(ymax,3200),xl:'Millions of years since the two lineages split',yl:'Differences (of 1,000 sites)'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(460),ax.Y(2*mu*L*460));ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle=serColor(1);ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=460;x+=5){const y=L*0.75*(1-Math.exp(-4/3*2*mu*x));x?ctx.lineTo(ax.X(x),ax.Y(y)):ctx.moveTo(ax.X(x),ax.Y(y));}ctx.stroke();
    pts.forEach(p=>{ctx.fillStyle=serColor(1);ctx.beginPath();ctx.arc(ax.X(p.x),ax.Y(p.y),5,0,6.29);ctx.fill();if(jc&&Number.isFinite(p.c)){ctx.fillStyle=serColor(0);ctx.beginPath();ctx.arc(ax.X(p.x),ax.Y(p.c),5,0,6.29);ctx.fill();}});
    ctx.restore();
    const items=[{label:'Differences you can see',color:serColor(1)},{label:'Total mutations (straight clock)',color:PAL['muted'],dash:true}];if(jc)items.push({label:'Jukes–Cantor estimate',color:serColor(0)});
    legend(ctx,box.L+8,box.T+8,items);},
  narrate(sim){const s=sim.st,hon=atLeast('honors');
    if(s.t<1)return 'One ancestral gene, 450 million years ago. Press play: the lineages will split at the dates in the fossil record, and each picks up random mutations as it goes.';
    if(s.t<END){const alive=s.edges.filter(e=>e.alive).length;return `<b>${Math.round(mya(s.t))} million years ago.</b> ${alive} separate lineages, each collecting random mutations (the flashes) at about the same rate. Lineages that split longer ago have had more time to drift apart.`;}
    const u=upgma(sim),n=s.nJoin,c=CAL[hon?sim.p.cal:'hm'];
    if(!n)return `Today. Human and shark differ at <b>${diffs(s,0,5)}</b> of 1,000 sites, human and mouse at <b>${diffs(s,0,2)}</b>, human and chimp at <b>${diffs(s,0,1)}</b>. Press <b>Join the closest pair</b> to build a tree from these numbers.`;
    if(n<u.joins.length){const N=u.joins[n-1];return `UPGMA joined <b>${N.kids[0].name}</b> with <b>${N.kids[1].name}</b>: they have the fewest differences left in the table. Keep joining until everything is one tree.`;}
    const eS=est(sim,0,5),eC=est(sim,0,3);let t=`Tree complete. Calibrated with ${c.label.toLowerCase()}, the clock dates the shark split at <b>${fmtMya(eS)}</b> (true: 450 Mya)`+(c.b===3?'.':` and human–chicken at <b>${fmtMya(eC)}</b> (true: 320 Mya).`);
    if(sim.p.gene==='fast'&&!useJC(sim)&&eS<380)t+=' Deep splits come out too young: many sites have changed more than once, so the differences you can count undercount the real mutations.';
    return t;},
  draw(sim,ctx,vdt,k){const s=sim.st,soft=PAL['cv-soft'],ink=PAL['cv-ink'];ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const X=t=>34+t/END*290,rowY=i=>66+i*28;
    txt(ctx,'What really happened',16,24,{s:13.5*k,w:700});txt(ctx,'The gene in each species (first 120 of 1,000 sites)',412,24,{s:13.5*k,w:700});
    // time axis
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;[0,100,200,300,400,450].forEach(t=>{ctx.beginPath();ctx.moveTo(X(t),42);ctx.lineTo(X(t),222);ctx.stroke();txt(ctx,t===450?'today':t===0?'450 Mya':mya(t)+'',X(t),236,{s:11.5*k,c:soft,a:t===0?'left':'center'});});
    // edges of the true tree, up to the current time
    const yOf=n=>n.leaves.reduce((a,i)=>a+rowY(i),0)/n.leaves.length;
    ctx.lineCap='round';
    s.edges.forEach(e=>{const end=e.alive?s.t:e.end,y=yOf(e.n);const col=e.n.leaf!==undefined&&s.t>=END?COLS[e.n.leaf]:ink;ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X(e.start),y);ctx.lineTo(X(end),y);ctx.stroke();
      if(!e.alive&&e.n.kids){const ys=e.n.kids.map(yOf);ctx.strokeStyle=ink;ctx.beginPath();ctx.moveTo(X(e.end),Math.min(...ys));ctx.lineTo(X(e.end),Math.max(...ys));ctx.stroke();
        ctx.fillStyle=PAL['card'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(X(e.end),y,4.5,0,6.29);ctx.fill();ctx.stroke();}});
    {const ys=TREE.kids.map(yOf);ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X(0),Math.min(...ys));ctx.lineTo(X(0),Math.max(...ys));ctx.stroke();}
    if(s.t<END){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(X(s.t),42);ctx.lineTo(X(s.t),222);ctx.stroke();ctx.setLineDash([]);}
    // names and sequence strips
    NAMES.forEach((n,i)=>{const y=rowY(i),e=leafEdge(s,i);txt(ctx,n,338,y+4,{s:12.5*k,w:700,c:s.t>=END?ink:soft});
      if(!e)return;const ei=s.edges.indexOf(e);for(let q=0;q<SHOW;q++){const b=e.seq[q],ch=b!==s.anc[q];ctx.fillStyle=BCOL[b];ctx.globalAlpha=ch?1:0.22;ctx.fillRect(412+q*3,y-8,2.6,16);
        const f=s.flash.get(ei+':'+q);if(f!==undefined&&s.t-f<12){ctx.globalAlpha=1-(s.t-f)/12;ctx.fillStyle='#fff';ctx.fillRect(411+q*3,y-11,4.6,22);}}ctx.globalAlpha=1;});
    txt(ctx,'Bright = changed since the ancestor. Faded = unchanged.',412,236,{s:11.5*k,c:soft});
    // UPGMA tree and calibration
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(16,252);ctx.lineTo(784,252);ctx.stroke();
    txt(ctx,'Tree rebuilt from the DNA (UPGMA)',16,274,{s:13.5*k,w:700});
    const u=upgma(sim);
    if(!u){txt(ctx,'Available once evolution reaches today.',16,300,{s:12.5*k,c:soft});return;}
    const order=(function inord(n){return n.kids?inord(n.kids[0]).concat(inord(n.kids[1])):[n.members[0]];})(u.root);
    const shown=u.joins.slice(0,s.nJoin),ages=shown.map(N=>nodeAge(sim,N)).filter(Number.isFinite),amax=Math.max(500,...ages)*1.08;
    const AX=a=>330-Math.min(a,amax)/amax*290,ly=i=>294+order.indexOf(i)*26;
    const pos=new Map();order.forEach(i=>pos.set('L'+i,{x:AX(0),y:ly(i)}));
    ctx.lineWidth=2.5;
    shown.forEach(N=>{const a=nodeAge(sim,N),x=AX(Number.isFinite(a)?a:amax),ps=N.kids.map(c=>pos.get(c.id));const y=(ps[0].y+ps[1].y)/2;ctx.strokeStyle=ink;
      ps.forEach(p=>{ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(x,p.y);ctx.stroke();});ctx.beginPath();ctx.moveTo(x,ps[0].y);ctx.lineTo(x,ps[1].y);ctx.stroke();
      ctx.fillStyle=PAL['card'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,4.5,0,6.29);ctx.fill();ctx.stroke();ctx.lineWidth=2.5;pos.set(N.id,{x,y});
      ctx.font='600 '+11.5*k+'px '+FONT;const lw=ctx.measureText(fmtMya(a)).width;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(x-lw-9,y-7-12*k,lw+6,14*k);txt(ctx,fmtMya(a),x-6,y-7,{s:11.5*k,w:600,c:soft,a:'right'});});
    order.forEach(i=>{const p=pos.get('L'+i);ctx.fillStyle=COLS[i];ctx.beginPath();ctx.arc(p.x,p.y,4.5,0,6.29);ctx.fill();txt(ctx,NAMES[i],338,p.y+4,{s:12.5*k,w:600});});
    // calibration panel
    const c=CAL[atLeast('honors')?sim.p.cal:'hm'],dc=dist(sim,c.a,c.b);
    const lines=[[`Calibration: ${c.label}`,700],[`${NAMES[c.a]} and ${NAMES[c.b]} differ at ${diffs(s,c.a,c.b)} sites${useJC(sim)?' ('+Math.round(dc*L)+' mutations after correction)':''}.`,400],
      [`Rate: ${(dc*L/2/c.T).toFixed(2)} changes per 1,000 sites per million years`,400]];
    lines.forEach((l,i)=>txt(ctx,l[0],420,292+i*22,{s:12.5*k,w:l[1]}));
    txt(ctx,'Clock dates vs. the fossil record',420,368,{s:12.5*k,w:700});
    [['Human–chimp',0,1],['Human–chicken',0,3],['Human–shark',0,5]].forEach((r,i)=>{const e=est(sim,r[1],r[2]),tr=mya(SPLIT[r[1]][r[2]]);const off=Number.isFinite(e)&&Math.abs(e-tr)/tr>0.25;
      txt(ctx,`${r[0]}: ${fmtMya(e)}  (true ${tr} Mya)`,420,390+i*20,{s:12.5*k,w:off?700:400,c:off?PAL['s1']:ink});});},
  tour:[
    {title:'One ancestral gene',text:'450 million years ago, one population carried this gene. The left side shows the real history: when each lineage split off, from the fossil record.',focus:[10,36,380,210],pause:true},
    {title:'Mutations pile up',text:'As time passes, each lineage picks up random mutations (the white flashes). On average they arrive at a steady rate. That steadiness is what makes DNA a clock.',focus:[404,40,388,180],speed:0.15},
    {title:'Lineages split',text:'At each branch point the gene is copied into two lineages. From then on they mutate independently, so they drift further apart the longer they are separated.',focus:[10,36,380,210],speed:0.6},
    {title:'Count the differences',text:'Today, compare the species. Human and chimp split only 6 million years ago and differ at a few sites; human and shark split 450 million years ago and differ at many.',focus:[330,40,462,180],pause:true,setup(sim){skip(sim);}},
    {title:'Rebuild the tree',text:'UPGMA joins the two species with the fewest differences, averages their distances to everything else, and repeats. The result is a tree built from DNA alone.',focus:[10,256,390,190],pause:true,setup(sim){skip(sim);const u=upgma(sim);sim.st.nJoin=u.joins.length;}},
    {title:'Calibrate the clock',text:'One fossil date, such as human–mouse at 90 million years, sets the rate. Every other branch point can then be dated from its number of differences.',focus:[410,272,380,170],pause:true},
    {lvl:'ap',title:'Saturation',text:'With a fast gene, many sites change twice or more and some change back. Deep splits then look younger than they are. The Jukes–Cantor correction estimates the hidden changes.',focus:[410,350,380,96],pause:true,setup(sim){BioLab.setValues(sim,{gene:'fast'});BioLab.reset(sim);skip(sim);const u=upgma(sim);sim.st.nJoin=u.joins.length;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{gene:'slow'});},
  challenges:[
    {lvl:'bio',q:'By today, which pair will differ at more DNA sites?',choices:['Human and mouse','Human and shark','About the same'],correct:1,watch:'clock',changeText:'Evolving to today',
     explain:'Human and shark lineages split 450 million years ago, human and mouse only 90 million years ago. More time apart means more mutations, so more differences.'},
    {lvl:'bio',q:'Calibrate with the human–mouse split (90 million years ago). What will the clock say for the human–chicken split?',choices:['About 90 million years ago','About 300 million years ago','About 1,000 million years ago'],correct:1,watch:'clock',changeText:'Evolving to today',
     explain:'Human and chicken differ at about 3 times as many sites as human and mouse, so the clock puts their split about 3 times as far back: close to the fossil date of 320 million years.'},
    {lvl:'honors',q:'Switch to the fast-evolving gene. By today, human and chimp will have…',choices:['No differences at all','Many more differences than the slow gene gives (about 5×)','The same number as with the slow gene'],correct:1,change:{gene:'fast'},changeText:'Switched to the fast gene',watch:'clock',
     explain:'The fast gene mutates 5 times faster, so in the 6 million years since humans and chimps split it collects about 5 times as many differences. Fast genes are better for dating recent splits.'},
    {lvl:'honors',q:'Calibrate with the human–chicken split (320 million years ago) instead. What will the clock say for human–mouse?',choices:['About 20 million years ago','About 100 million years ago','About 300 million years ago'],correct:1,baseline:{cal:'hc'},changeText:'Evolving to today',watch:'clock',
     explain:'Human and mouse differ at about a third as many sites as human and chicken, so the clock dates their split at about a third of 320: close to the true 90 million years.'},
    {lvl:'ap',q:'Fast gene, no correction, calibrated on human–mouse. What will the clock say for the shark split (true age 450 million years)?',choices:['About 450 million years ago','Far too young: well under 300 million years','Far too old: over 700 million years'],correct:1,baseline:{gene:'fast'},changeText:'Evolving to today',watch:'clock',
     explain:'Over 450 million years the fast gene changes most sites more than once. Repeat hits are invisible, so the count of differences levels off near 75% and the deep split looks far too young. This is saturation.'},
    {lvl:'ap',q:'Same fast gene. Now turn on the Jukes–Cantor correction. What happens to the shark estimate?',choices:['It gets even younger','It moves much closer to 450 million years','It does not change'],correct:1,baseline:{gene:'fast'},change:{jc:true},changeText:'Jukes–Cantor correction on',watch:'clock',
     explain:'Jukes–Cantor converts the fraction of differing sites, p, into an estimate of all mutations, including hidden repeat hits: d = −¾ ln(1 − 4p/3). The corrected distance grows faster than p at large p, pulling the deep date back toward 450 million years.'},
    {lvl:'honors',instant:true,q:'UPGMA always joins the two groups with the fewest differences first. Which pair does it join first?',choices:['Human and chimp','Mouse and chicken','Frog and shark'],correct:0,
     explain:'Human and chimp split most recently (6 million years ago), so they have by far the fewest differences.'}
  ],
  lab:{bio:'<p><b>Question:</b> Does the number of DNA differences grow with time since two species split?</p><ol><li>Run to today with the slow gene.</li><li>Record a trial, then use the Graph tab “Differences vs time since split”.</li><li>Press Evolve again and repeat twice.</li></ol><p>Is the relationship close to a straight line? What does that tell you about the rate of mutation?</p>',
       honors:'<p><b>Question:</b> How accurate is the molecular clock?</p><ol><li>Run to today and build the tree. Record the clock dates for the chicken and shark splits.</li><li>Repeat with the other calibration, then with the fast gene.</li></ol><p>Which gene and which calibration give dates closest to the fossil record? Explain why.</p>',
       ap:'<p><b>Question:</b> When does saturation matter?</p><ol><li>For each gene, record the shark-split estimate with and without the Jukes–Cantor correction (5 runs each).</li><li>Compare means and spread.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why corrected estimates are more accurate but also more variable for deep splits.</p>'},
  terms:[{t:'Molecular clock',d:'Using the number of DNA or protein differences to estimate when two lineages split.'},{t:'Mutation rate',d:'How often changes appear in a gene, per site per year.'},{t:'Calibration',d:'Using one known date, usually from fossils, to convert differences into years.'},
    {lvl:'honors',t:'UPGMA',d:'A method that builds a tree by repeatedly joining the two closest groups and averaging their distances.'},{lvl:'honors',t:'Distance matrix',d:'A table of differences between every pair of species.'},
    {lvl:'ap',t:'Saturation',d:'When sites have changed so many times that new mutations no longer increase the visible differences.'},{lvl:'ap',t:'Jukes–Cantor correction',d:'d = −¾ ln(1 − 4p/3): estimates the total number of changes from the fraction p of differing sites.'}],
  about:'<p><b>Model:</b> a 1,000-site gene evolves down the real tree (split dates rounded from the fossil record). Each lineage gets mutations at random (a Poisson process) at the same rate per site, and each mutation changes a base to one of the other three at random (the Jukes–Cantor model). The slow gene has 0.4 changes per 1,000 sites per million years; the fast gene, 2.</p><p><b>Simplified:</b> real genes evolve at different rates in different lineages and at different sites, and real mutations favor some base changes (transitions) over others. Real molecular-clock studies use many genes and several fossil calibrations.</p>'
};
BioLab.register(MC);
})();
