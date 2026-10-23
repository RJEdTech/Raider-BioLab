(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend}=BioLab.h;

/* Wolf, Moose, Grass — a virtual version of the classroom "sharks and minnows" game.
   A fixed class of players changes roles every round (one round = one year):
   moose tagged by a wolf become wolves; moose that tag a grass player survive and that
   grass becomes a moose; moose that find no grass and wolves that catch nothing become grass. */
const COL={W:'#6f7884',M:'#9a5f2a',G:'#3f9a46'};
const LINE={W:'#8a94a3',M:'#b9733a',G:'#46a853'};
const PAR={hw:3,hm:1};
const LS='rjbiolab-wmg-class';
const EXAMPLE=[[2,6,16],[4,6,14],[4,10,10],[6,12,6],[10,8,6],[12,4,8],[6,2,16],[2,4,18],[2,8,14],[2,12,10]];

function loadClass(){try{const a=JSON.parse(localStorage.getItem(LS)||'null');if(Array.isArray(a))return a;}catch(e){}return [{W:'',M:'',G:''},{W:'',M:'',G:''},{W:'',M:'',G:''}];}
function saveClass(a){try{localStorage.setItem(LS,JSON.stringify(a));}catch(e){}}
const num=v=>v===''||v===null||v===undefined?NaN:+v;
function classRows(sim){return (sim.st.cls||[]).map((r,i)=>({y:i+1,W:num(r.W),M:num(r.M),G:num(r.G)}));}
function filledRows(sim){return classRows(sim).filter(r=>Number.isFinite(r.W)&&Number.isFinite(r.M)&&Number.isFinite(r.G));}
function rows(sim){return sim.p.mode==='class'?filledRows(sim):sim.st.hist;}
function disp(W,M,G){const w=Math.round(W),m=Math.round(M);return {W:w,M:m,G:Math.max(0,Math.round(W+M+G)-w-m)};}

/* Average game: expected values (no luck). Used for the main game in Average mode and the dashed comparison line. */
function avgNext(S,p,ev){let W=S.W,M=S.M,G=S.G,N=S.N;
  if(ev.winter)M*=0.5;
  const Ga=ev.drought?G*0.5:G;
  const caught=Math.min(M,W*p.skill*M/(M+PAR.hw));const Ml=M-caught;
  const fed=p.speed*Math.min(Ml,Ga)*Ga/(Ga+PAR.hm);
  let W2=2*caught,M2=2*fed;if(p.wd)W2*=0.8;
  if(S.noWolves)W2=0;else if(p.restock&&W2<1)W2=1;
  if(p.restock&&M2<1)M2=1;
  if(W2+M2>N){const k=N/(W2+M2);W2*=k;M2*=k;}
  let G2=N-W2-M2,N2=N;
  if(p.gb){const Kg=S.N0||N;G2+=0.6*G2*Math.max(0,1-G2/Kg);N2=W2+M2+G2;}
  return {W:W2,M:M2,G:G2,N:N2,N0:S.N0,noWolves:S.noWolves};}

function slot(role,i,n){
  if(role==='M'){const per=Math.max(7,Math.ceil(n/4));const dy=Math.min(40,270/(per-1||1));return [50+Math.floor(i/per)*36,128+(i%per)*dy];}
  if(role==='W'){const per=Math.max(6,Math.ceil(n/5));const dy=Math.min(46,270/(per-1||1));return [354+Math.floor(i/per)*40,128+(i%per)*dy];}
  const cols=5,rowsN=Math.max(1,Math.ceil(n/cols)),dy=Math.min(42,270/(rowsN-1||1));const r=Math.floor(i/cols),c=i%cols;return [604+c*36+(r%2)*12,128+r*dy];}

function makePlan(sim,s){
  const p=sim.p,avg=p.luck==='avg',ev=s.pending;s.pending={};
  if(ev.removeWolves){s.G+=s.W;s.W=0;s.noWolves=true;}
  if(ev.addWolves){const k=Math.min(2,Math.floor(s.G));s.W+=k;s.G-=k;s.noWolves=false;}
  if(avg&&!s.shadow&&(ev.drought||ev.winter||ev.removeWolves||ev.addWolves)){s.shadow={W:s.preW,M:s.preM,G:s.preG,N:s.N,N0:s.N0,noWolves:false,p:Object.assign({},p),hist:[{y:s.year,W:s.preW,M:s.preM,G:s.preG}]};}
  s.ev=ev;
  const D=disp(s.W,s.M,s.G);const Wi=D.W,Mi=D.M,Gi=D.G;const R=avg?rng(s.year*977+3):s.R;
  const kd=ev.winter?Math.round(Mi*0.5):0;let Ma=Mi-kd;const kg=ev.drought?Math.floor(Gi/2):0;const Ga=Gi-kg;
  let c=0,f=0;
  if(avg){c=Math.min(Ma,Math.round(Wi*p.skill*Ma/(Ma+PAR.hw)));const Ml=Ma-c;f=Math.min(Ml,Ga,Math.round(p.speed*Math.min(Ml,Ga)*Ga/(Ga+PAR.hm)));}
  else{let av=Ma;for(let i=0;i<Wi;i++){const pr=p.skill*av/(av+PAR.hw);if(av>0&&R()<pr){c++;av--;}}let g=Ga;for(let i=0;i<av;i++){const pr=p.speed*g/(g+PAR.hm);if(g>0&&R()<pr){f++;g--;}}}
  const starve=Ma-c-f,failW=Wi-c;
  let next;
  if(avg){next=avgNext({W:s.W,M:s.M,G:s.G,N:s.N,N0:s.N0,noWolves:s.noWolves},p,ev);}
  else{let W2=2*c,M2=2*f;if(p.wd){let d=0;for(let i=0;i<W2;i++)if(R()<0.2)d++;W2-=d;}
    const N=s.N;if(s.noWolves)W2=0;else if(p.restock&&W2===0&&N-M2>0)W2=1;if(p.restock&&M2===0&&N-W2>0)M2=1;if(W2+M2>N)M2=N-W2;
    let G2=N-W2-M2,N2=N;if(p.gb){G2+=Math.round(0.6*G2*Math.max(0,1-G2/s.N0));N2=W2+M2+G2;}next={W:W2,M:M2,G:G2,N:N2};}
  // players for the animation
  const VR=rng(s.year*131+(s.seed||1));const pl=[];const newIdx={W:0,M:0,G:0};
  for(let i=0;i<Wi;i++)pl.push({role:'W',i,fate:i<c?'hunt':'miss'});
  for(let i=0;i<Mi;i++){const fate=i<kd?'winter':i<kd+c?'caught':i<kd+c+f?'fed':'starve';pl.push({role:'M',i,fate});}
  for(let i=0;i<Gi;i++){const fate=i<kg?'dormant':i<kg+f?'eaten':'stay';pl.push({role:'G',i,fate});}
  const cnt={W:Wi,M:Mi,G:Gi};
  pl.forEach(o=>{o.start=slot(o.role,o.i,cnt[o.role]);o.jx=(VR()-.5)*8;o.jy=(VR()-.5)*8;});
  const wolves=pl.filter(o=>o.role==='W'),moose=pl.filter(o=>o.role==='M'),grass=pl.filter(o=>o.role==='G');
  const caughtM=moose.filter(o=>o.fate==='caught'),fedM=moose.filter(o=>o.fate==='fed'),eatenG=grass.filter(o=>o.fate==='eaten');
  caughtM.forEach((m,k)=>{const w=wolves[k];const cx=330+VR()*150,cy=clamp(m.start[1]+(VR()-.5)*40,128,398);m.end=[cx,cy];w.end=[cx+18,cy-2];});
  fedM.forEach((m,k)=>{const g=eatenG[k];m.end=[g.start[0]-18,g.start[1]+2];});
  moose.filter(o=>o.fate==='starve').forEach(m=>{m.end=[560+VR()*18,clamp(m.start[1]+(VR()-.5)*60,128,398)];});
  moose.filter(o=>o.fate==='winter').forEach(m=>{m.end=m.start;});
  wolves.filter(o=>o.fate==='miss').forEach(w=>{w.end=[w.start[0]+(VR()-.3)*80,clamp(w.start[1]+(VR()-.5)*70,128,398)];});
  grass.forEach(g=>{g.end=g.start;});
  const NEW={hunt:'W',miss:'G',winter:'G',caught:'W',fed:'M',starve:'G',dormant:'G',eaten:'M',stay:'G'};
  const D2=disp(next.W,next.M,next.G);
  pl.forEach(o=>{o.nr=NEW[o.fate];});
  // keep the drawing consistent with the rounded next-year counts
  ['W','M','G'].forEach(r=>{let have=pl.filter(o=>o.nr===r).length;const want=D2[r];
    if(have>want){for(const o of pl){if(have<=want)break;if(o.nr===r&&r!=='G'){o.nr='G';have--;}}}});
  const after={W:pl.filter(o=>o.nr==='W').length,M:pl.filter(o=>o.nr==='M').length,G:pl.filter(o=>o.nr==='G').length};
  pl.forEach(o=>{o.ni=newIdx[o.nr]++;o.dest=slot(o.nr,o.ni,after[o.nr]);});
  const extra=Math.max(0,D2.G-after.G);
  s.plan={pl,c,f,starve,failW,kd,kg,next,extra,D:{W:Wi,M:Mi,G:Gi},D2};}

function resolve(sim,s){const n=s.plan.next;
  s.W=n.W;s.M=n.M;s.G=n.G;s.N=n.N;s.year++;
  s.hist.push({y:s.year,W:s.W,M:s.M,G:s.G});
  if(s.shadow){const sh=s.shadow,n2=avgNext(sh,sh.p,{});Object.assign(sh,{W:n2.W,M:n2.M,G:n2.G,N:n2.N});sh.hist.push({y:s.year,W:sh.W,M:sh.M,G:sh.G});}
  s.preW=s.W;s.preM=s.M;s.preG=s.G;
  sim.infoDirty=true;
  if(s.year>=sim.p.years){s.done=true;s.plan=null;return;}
  makePlan(sim,s);}

function person(ctx,x,y,col,lab,a,pose){ctx.save();ctx.globalAlpha=a;
  if(pose==='down'){ctx.fillStyle=col;rr(ctx,x-14,y-10,28,12,6);ctx.fill();ctx.fillStyle='#e7c39d';ctx.beginPath();ctx.arc(x-18,y-4,6.5,0,6.29);ctx.fill();ctx.restore();return;}
  const h=pose==='crouch'?15:22;ctx.fillStyle='#e7c39d';ctx.beginPath();ctx.arc(x,y-h-6,7,0,6.29);ctx.fill();
  ctx.fillStyle=col;rr(ctx,x-9,y-h,18,h,6);ctx.fill();txt(ctx,lab,x,y-h/2,{s:12,w:800,c:'#fff',a:'center',b:'middle'});ctx.restore();}
const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
const mix=(a,b,t)=>a+(b-a)*t;
function blend(c1,c2,t){const h=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));const a=h(c1),b=h(c2);return 'rgb('+a.map((v,i)=>Math.round(mix(v,b[i],t))).join(',')+')';}

function rW(rs){if(rs.length<2)return NaN;const a=rs[0].W,b=rs[rs.length-1].W,t=rs.length-1;return a>0&&b>0?Math.log(b/a)/t:NaN;}
function rM(rs,a,K){const r0=rs[a-1],r1=rs[a];if(!r0||!r1)return NaN;const M=r0.M;if(!(M>0)||M>=K)return NaN;return (r1.M-M)/(M*(1-M/K));}
function Kof(sim){if(sim.p.mode==='class'){const r=filledRows(sim);return r.length?r[0].W+r[0].M+r[0].G:24;}return sim.st.N0;}
const f2=x=>Number.isFinite(x)?x.toFixed(2):'—';
const f1=x=>Number.isFinite(x)?(Math.abs(x-Math.round(x))<1e-9?String(Math.round(x)):x.toFixed(1)):'—';

const SIM={
  id:'wolfmoose',hash:'wolfmoose',apUnit:8,order:8,kind:'Simulation',tab:'Wolf, Moose, Grass',
  card:'Play the gym game on screen: wolves chase moose, moose chase grass, and players switch roles every round.',
  title:'Wolf, Moose, Grass: the population game',
  lede:{bio:'The classroom game, on screen. Moose race to the grass, wolves try to tag them, and every round the players switch roles. Count each round and watch three populations rise and fall together.',
        honors:'Three linked populations: change the class size, wolf skill and moose speed, add a drought or a cold winter, and track how each change ripples from grass to moose to wolves.',
        ap:'Treat the game as a model. Calculate exponential and logistic growth rates from the data, add a wolf death rate or a grass birth rate, and judge what the game gets right and wrong about real ecosystems.'},
  scale:'A gym full of students standing in for an ecosystem. Each student is one animal or one patch of grass, and each round is one year. Real example: the wolves and moose of Isle Royale in Lake Superior, an island of about 540 km².',
  prereq:['popgrowth'],next:['predprey','energy'],
  timeScale:0.25,dtMax:0.02,prewarm:0,sampleDt:1,window:30,unit:'years',timeLabel:'Year',
  chChange:2,chReveal:9,
  clock(sim){const s=sim.st;if(sim.p.mode==='class')return 'Our class data';return 'Year '+s.year+(s.done?' · game over':'');},
  controls:[
    {id:'mode',label:'What to show',type:'seg',def:'game',lvl:'bio',noTrial:true,options:[{v:'game',l:'Play the game'},{v:'class',l:'Our class data'}],
     help:'Our class data: type in the numbers from the game you played in the gym.',onChange(sim){BioLab.reset(sim);}},
    {id:'luck',label:'Luck',type:'seg',def:'real',lvl:'bio',noTrial:true,options:[{v:'real',l:'Like a real game'},{v:'avg',l:'Average game'}],
     help:'Average game takes out luck so you can see the trend.',onChange(sim){BioLab.reset(sim);}},
    {id:'startW',label:'Starting wolves',type:'range',min:1,max:6,step:1,def:2,lvl:'bio',onChange(sim){BioLab.reset(sim);}},
    {id:'startM',label:'Starting moose',type:'range',min:2,max:12,step:1,def:6,lvl:'bio',onChange(sim){BioLab.reset(sim);}},
    {id:'players',label:'Students playing',type:'range',min:16,max:40,step:1,def:24,lvl:'honors',help:'Everyone not a wolf or moose starts as grass.',onChange(sim){BioLab.reset(sim);}},
    {id:'skill',label:'Wolf tagging skill',type:'range',min:0.4,max:1,step:0.05,def:0.75,lvl:'honors',d:2,help:'Chance a wolf tags a moose when moose are plentiful.'},
    {id:'speed',label:'Moose speed',type:'range',min:0.6,max:1,step:0.05,def:0.95,lvl:'honors',d:2,help:'Chance a moose reaches a free grass player.'},
    {id:'years',label:'Rounds (years) to play',type:'range',min:8,max:30,step:1,def:15,lvl:'honors',onChange(sim){if(sim.st.done&&sim.st.year<sim.p.years){sim.st.done=false;makePlan(sim,sim.st);}}},
    {id:'restock',label:'Migration',type:'toggle',def:true,lvl:'honors',help:'If a species disappears, one player rejoins it the next year.'},
    {id:'wd',label:'Wolves can die of old age',type:'toggle',def:false,lvl:'ap',help:'Each wolf has a 20% chance of dying each year (a death rate).',
     onChange(sim){const s=sim.st;if(sim.p.luck==='avg'&&!s.shadow&&sim.p.mode==='game'){s.shadow={W:s.W,M:s.M,G:s.G,N:s.N,N0:s.N0,noWolves:s.noWolves,p:Object.assign({},sim.p,{wd:!sim.p.wd}),hist:[{y:s.year,W:s.W,M:s.M,G:s.G}]};}if(s.plan&&!s.done)replan(sim);}},
    {id:'gb',label:'Grass grows on its own',type:'toggle',def:false,lvl:'ap',help:'Grass has a birth rate: new grass players join the meadow.',onChange(sim){const s=sim.st;if(s.plan&&!s.done)replan(sim);}},
    {id:'mYear',label:'Moose growth rate: start year',type:'range',min:1,max:14,step:1,def:3,lvl:'ap',help:'Logistic r from this year to the next, with K = class size.'}
  ],
  actions:[
    {id:'drought',label:'Drought this year',lvl:'bio',run(sim){queue(sim,{drought:true});}},
    {id:'winter',label:'Cold winter',lvl:'bio',run(sim){queue(sim,{winter:true});}},
    {id:'nowolves',label:'Remove all wolves',lvl:'bio',run(sim){queue(sim,{removeWolves:true});}},
    {id:'wolvesback',label:'Bring 2 wolves back',lvl:'bio',run(sim){queue(sim,{addWolves:true});}},
    {id:'newgame',label:'New game',lvl:'bio',primary:true,run(sim){sim.seed=(sim.seed||4)+1;BioLab.reset(sim);}}
  ],
  init(sim){const p=sim.p;const N=p.players;const W=Math.min(p.startW,N-2),M=Math.min(p.startM,N-W-1),G=N-W-M;
    const seed=sim.seed||4;const s={t:0,year:1,W,M,G,N,N0:N,seed,R:rng(seed*7919+13),hist:[{y:1,W,M,G}],plan:null,pending:{},noWolves:false,shadow:null,done:false,ev:{},preW:W,preM:M,preG:G};
    s.cls=loadClass();if(p.mode==='game')makePlan(sim,s);return s;},
  step(sim,dt){const s=sim.st;if(sim.p.mode==='class'||s.done)return;s.t+=dt;let guard=0;while(!s.done&&s.t>=s.year&&guard++<50)resolve(sim,s);},
  metrics:[
    {id:'year',label:'Year',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>{const r=rows(s);return r.length?r[r.length-1].y:NaN;}},
    {id:'W',label:'Wolves',unit:'players',lvl:'bio',min:0,max:40,d:0,get:s=>{const r=rows(s);return r.length?Math.round(r[r.length-1].W):NaN;}},
    {id:'M',label:'Moose',unit:'players',lvl:'bio',min:0,max:40,d:0,get:s=>{const r=rows(s);return r.length?Math.round(r[r.length-1].M):NaN;}},
    {id:'G',label:'Grass',unit:'players',lvl:'bio',min:0,max:40,d:0,get:s=>{const r=rows(s);if(!r.length)return NaN;const x=r[r.length-1];return s.p.mode==='class'?x.G:disp(x.W,x.M,x.G).G;}},
    {id:'wpc',label:'Wolf change since last year',unit:'%',lvl:'honors',min:-100,max:200,d:0,get:s=>{const r=rows(s);if(r.length<2)return NaN;const a=r[r.length-2].W,b=r[r.length-1].W;return a>0?100*(b-a)/a:NaN;}},
    {id:'mpc',label:'Moose change since last year',unit:'%',lvl:'honors',min:-100,max:200,d:0,get:s=>{const r=rows(s);if(r.length<2)return NaN;const a=r[r.length-2].M,b=r[r.length-1].M;return a>0?100*(b-a)/a:NaN;}},
    {id:'rW',label:'Wolf r (exponential, year 1 → now)',unit:'per year',lvl:'ap',min:-1,max:1,d:2,get:s=>rW(rows(s))},
    {id:'rM',label:'Moose r (logistic, K = class size)',unit:'per year',lvl:'ap',min:-2,max:2,d:2,get:s=>rM(rows(s),s.p.mYear,Kof(s))}
  ],
  graphs:[{id:'pop',label:'Wolves, moose and grass by year',custom:true},{id:'pyr',label:'Energy pyramid (10% rule)',lvl:'honors',custom:true}],
  defaultGraph:'pop',
  plot(sim,ctx,box,id){
    if(id==='pyr'){drawPyramid(sim,ctx,box);return;}
    const rs=rows(sim);const b={L:box.L,T:34,W:box.W,H:box.H-22,cw:box.cw,ch:box.ch};
    const xmax=Math.max(sim.p.mode==='class'?Math.max(rs.length,5):sim.p.years,2);
    const sh=sim.p.mode==='game'&&sim.st.shadow?sim.st.shadow.hist:null;
    let ymax=Math.max(10,...rs.map(r=>Math.max(r.W,r.M,r.G)),...(sh?sh.map(r=>Math.max(r.W,r.M,r.G)):[0]));ymax=Math.ceil(ymax/5)*5;
    const ax=axes(ctx,b,{xmin:1,xmax,ymin:0,ymax,xl:'Year (one round = one year)',yl:'Players (population size)',xd:0});
    if(!rs.length){txt(ctx,'Type your class numbers in the table to graph them.',b.L+b.W/2,b.T+b.H/2,{s:14,c:PAL['muted'],a:'center',b:'middle'});}
    const line=(data,key,col,dash)=>{const pts=data.filter(r=>Number.isFinite(r[key]));if(!pts.length)return;ctx.save();ctx.strokeStyle=col;ctx.lineWidth=dash?2:2.8;ctx.setLineDash(dash?[6,5]:[]);ctx.beginPath();
      pts.forEach((r,i)=>{const x=ax.X(r.y),y=ax.Y(r[key]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.setLineDash([]);
      if(!dash)pts.forEach(r=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(ax.X(r.y),ax.Y(r[key]),3.6,0,6.29);ctx.fill();});ctx.restore();};
    if(sh){line(sh,'G',LINE.G,true);line(sh,'M',LINE.M,true);line(sh,'W',LINE.W,true);}
    line(rs,'G',LINE.G);line(rs,'M',LINE.M);line(rs,'W',LINE.W);
    const items=[{label:'Wolves',color:LINE.W},{label:'Moose',color:LINE.M},{label:'Grass',color:LINE.G}];if(sh)items.push({label:'Same game, no change',color:PAL['muted'],dash:true});
    legend(ctx,b.L,14,items);},
  infoPanel(sim){return sim.p.mode==='class'?classPanel(sim):gamePanel(sim);},
  bindInfo(sim,el){
    el.querySelectorAll('[data-wm]').forEach(bn=>bn.addEventListener('click',()=>{const a=bn.dataset.wm,s=sim.st;
      if(a==='copy'){copyTable(sim,el);return;}
      if(a==='add')s.cls.push({W:'',M:'',G:''});
      if(a==='del'&&s.cls.length>1)s.cls.pop();
      if(a==='clear')s.cls=[{W:'',M:'',G:''},{W:'',M:'',G:''},{W:'',M:'',G:''}];
      if(a==='example')s.cls=EXAMPLE.map(r=>({W:r[0],M:r[1],G:r[2]}));
      saveClass(s.cls);BioLab.refresh(sim);}));
    el.querySelectorAll('input[data-row]').forEach(inp=>inp.addEventListener('input',()=>{const s=sim.st;const i=+inp.dataset.row,k=inp.dataset.k;s.cls[i][k]=inp.value===''?'':Math.max(0,Math.round(+inp.value));saveClass(s.cls);
      const rc=el.querySelector('#wm-rcalc');if(rc)rc.innerHTML=rateHTML(sim);}));},
  narrate(sim){const s=sim.st,p=sim.p,avg=p.luck==='avg',ab=avg?'about ':'';
    if(p.mode==='class'){const r=filledRows(sim);if(!r.length)return 'Type the numbers your class counted after each round into the table below the graph. The field, graph and growth rates fill in from your data.';
      const x=r[r.length-1];return 'Your class game, year '+x.y+': <b>'+x.W+' wolves, '+x.M+' moose and '+x.G+' grass</b>. Look at the graph for the pattern: which population rises first, and which follows?';}
    if(s.done){const h=s.hist,peak=k=>h.reduce((a,b)=>b[k]>a[k]?b:a);return 'Game over after '+s.year+' years. Moose peaked in year '+peak('M').y+' and wolves in year '+peak('W').y+'. Predators usually peak after their prey, because wolves need lots of moose first.';}
    const P=s.plan;if(!P)return '';const f=s.t-(s.year-1);const ev=s.ev||{};const n=(x,a,b)=>x+' '+(x===1?a:b);
    const evTxt=(ev.drought?'<b>Drought:</b> half the grass sits out this year. ':'')+(ev.winter?'<b>Cold winter:</b> half the moose died before the round. ':'')+(ev.removeWolves?'<b>All wolves were removed.</b> ':'');
    if(f<0.15)return evTxt+'Year '+s.year+' starts with <b>'+n(P.D.W,'wolf','wolves')+', '+P.D.M+' moose and '+P.D.G+' grass</b>. The moose line up at home, ready to run.';
    if(f<0.66)return evTxt+'The moose sprint for the meadow. Each wolf can tag one moose on the way, and each moose can tag one grass player.';
    if(f<0.84){const hung=P.starve+P.kd;return (P.c?'<b>'+P.c+' tagged moose</b> '+(P.c===1?'becomes a wolf. ':'become wolves. '):'No moose were tagged. ')+(P.f?'<b>'+P.f+' moose reached grass</b>, and each grass they tagged becomes a moose. ':'No moose reached grass. ')+(hung||P.failW?[hung?hung+' moose found no grass':'',P.failW?n(P.failW,'wolf','wolves')+' caught nothing':''].filter(Boolean).join(' and ')+', so they become grass.':'');}
    return 'Next year: '+ab+'<b>'+n(P.D2.W,'wolf','wolves')+', '+P.D2.M+' moose and '+P.D2.G+' grass</b>.'+(avg?' Average game shows the expected numbers, so they can be fractions in the table.':'');},
  initVis(sim){},
  thumbFrames:30,
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p;
    // field
    ctx.fillStyle=PAL['cv-bg']||PAL['card'];ctx.fillRect(0,0,800,450);
    ctx.fillStyle='#4f8f47';rr(ctx,16,58,768,358,10);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;rr(ctx,24,66,752,342,6);ctx.stroke();
    ctx.beginPath();ctx.moveTo(176,66);ctx.lineTo(176,408);ctx.moveTo(580,66);ctx.lineTo(580,408);ctx.moveTo(400,66);ctx.lineTo(400,408);ctx.stroke();
    ctx.beginPath();ctx.arc(400,237,46,0,6.29);ctx.stroke();
    if(s.ev&&s.ev.drought&&p.mode==='game'&&!s.done){ctx.fillStyle='rgba(196,150,70,.45)';ctx.fillRect(581,67,194,340);}
    txt(ctx,'HOME',100,82,{s:11*k,w:800,c:'rgba(255,255,255,.85)',a:'center'});txt(ctx,'WOLF ZONE',400,82,{s:11*k,w:800,c:'rgba(255,255,255,.85)',a:'center'});txt(ctx,'MEADOW',678,82,{s:11*k,w:800,c:'rgba(255,255,255,.85)',a:'center'});
    // header
    if(p.mode==='class'){drawClass(sim,ctx,k);return;}
    const P=s.plan,f=s.done?1:clamp(s.t-(s.year-1),0,1);
    txt(ctx,'Year '+s.year+(s.done?' · game over':''),20,32,{s:17*k,w:800});
    const D=s.done?disp(s.W,s.M,s.G):(f>0.9&&P?P.D2:(P?P.D:disp(s.W,s.M,s.G)));
    let x=790;[['G','Grass',D.G],['M','Moose',D.M],['W','Wolves',D.W]].forEach(([r,lab,n])=>{const label=lab+' '+n;ctx.font='700 '+13*k+'px '+FONT;const w=ctx.measureText(label).width+30;x-=w+8;pill(ctx,label,x+w/2,30,COL[r],'#fff',13*k);});
    if(s.ev&&s.ev.winter&&!s.done){ctx.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<40;i++){const sx=(i*97+t*20*(RM?0:1))%760+20,sy=(i*53+t*35*(RM?0:1))%330+70;ctx.beginPath();ctx.arc(sx,sy,2,0,6.29);ctx.fill();}}
    if(s.done||!P){const pl=[];const DD=disp(s.W,s.M,s.G);['W','M','G'].forEach(r=>{for(let i=0;i<DD[r];i++){const q=slot(r,i,DD[r]);person(ctx,q[0],q[1],COL[r],r,1,r==='G'?'crouch':'');}});drawLegend(ctx,k);return;}
    const run=ease((f-0.15)/0.5),tagT=ease((f-0.62)/0.12),move=ease((f-0.84)/0.16);
    for(const o of P.pl){let x0=o.start[0]+o.jx,y0=o.start[1]+o.jy,x1=o.end[0],y1=o.end[1];let px,py;
      if(o.role==='W'&&o.fate==='miss'){const u=Math.sin(Math.PI*clamp((f-0.2)/0.45,0,1));px=mix(x0,x1,u);py=mix(y0,y1,u);x1=x0;y1=y0;}
      else{const u=o.role==='W'?ease((f-0.2)/0.42):o.role==='M'?run:0;px=mix(x0,x1,u);py=mix(y0,y1,u);}
      if(move>0){px=mix(px,o.dest[0],move);py=mix(py,o.dest[1],move);}
      const c0=COL[o.role],c1=COL[o.nr];const col=move>0?blend(c0,c1,move):c0;const lab=move>0.5?o.nr:o.role;
      let a=1,pose=(move>0.5?o.nr:o.role)==='G'?'crouch':'';
      if(o.fate==='dormant'&&move<0.5){a=0.35;pose='crouch';}
      if(o.fate==='winter'&&move<0.5){pose='down';}
      if((o.fate==='caught'||o.fate==='eaten')&&tagT>0&&tagT<1&&!RM){ctx.strokeStyle='#ffd23f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,py-14,22,0,6.29);ctx.stroke();}
      person(ctx,px,py,col,lab,a,pose);
      if((o.fate==='starve'||o.fate==='miss')&&f>0.64&&move<0.5){txt(ctx,'×',px+12,py-30,{s:18,w:800,c:'#fff'});}}
    for(let i=0;i<P.extra;i++){const q=slot('G',P.D2.G-1-i,P.D2.G);person(ctx,q[0],q[1],COL.G,'G',move,'crouch');}
    let ex=150;if(s.ev&&s.ev.drought){pill(ctx,'Drought',ex+40,30,'#8a5a1a','#fff',12*k);ex+=96;}
    if(s.ev&&s.ev.winter)pill(ctx,'Cold winter',ex+52,30,'#2d5fa8','#fff',12*k);
    drawLegend(ctx,k);}
};
function drawLegend(ctx,k){txt(ctx,'Each figure is one student in a pinny: W = wolf, M = moose, G = grass.',20,440,{s:12*k,c:PAL['cv-soft']});}
function drawClass(sim,ctx,k){const r=filledRows(sim);
  txt(ctx,'Our class data'+(r.length?' · year '+r[r.length-1].y:''),20,32,{s:17*k,w:800});
  if(!r.length){rr(ctx,200,190,400,80,12);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fill();txt(ctx,'Type your game’s numbers into',400,224,{s:15*k,w:700,c:'#fff',a:'center'});txt(ctx,'the table below the graph.',400,246,{s:15*k,w:700,c:'#fff',a:'center'});drawLegend(ctx,k);return;}
  const x=r[r.length-1];let xx=790;[['G','Grass',x.G],['M','Moose',x.M],['W','Wolves',x.W]].forEach(([q,lab,n])=>{const label=lab+' '+n;ctx.font='700 '+13*k+'px '+FONT;const w=ctx.measureText(label).width+30;xx-=w+8;pill(ctx,label,xx+w/2,30,COL[q],'#fff',13*k);});
  ['W','M','G'].forEach(q=>{const n=Math.min(60,x[q]);for(let i=0;i<n;i++){const s=slot(q,i,n);person(ctx,s[0],s[1],COL[q],q,1,q==='G'?'crouch':'');}});drawLegend(ctx,k);}
function drawPyramid(sim,ctx,box){const r=rows(sim);const x=r.length?r[r.length-1]:{W:0,M:0,G:0};
  const lv=[{n:'Wolves',e:100,col:LINE.W,c:x.W},{n:'Moose',e:1000,col:LINE.M,c:x.M},{n:'Grass',e:10000,col:LINE.G,c:x.G}];
  const L=box.L,W=box.W,T=box.T+6,H=box.H-6,bh=H/3-10;
  lv.forEach((l,i)=>{const w=Math.max(6,W*0.62*Math.sqrt(l.e/10000)),y=T+i*(bh+10),cx=L+W*0.36;ctx.fillStyle=l.col;rr(ctx,cx-w/2,y,w,bh,6);ctx.fill();
    txt(ctx,l.n,cx-W*0.36+4,y+bh/2-7,{s:13,w:700,c:PAL['fg'],b:'middle'});
    txt(ctx,l.e.toLocaleString()+' units of energy'+(i<2?' ('+(i===0?'1%':'10%')+' of the grass)':' (100%)'),L+W*0.7,y+bh/2-8,{s:13,c:PAL['fg'],b:'middle'});
    txt(ctx,'Now: '+f1(l.c)+' players',L+W*0.7,y+bh/2+10,{s:12,c:PAL['muted'],b:'middle'});});
  txt(ctx,'About 90% of the energy at each level is used for living or lost as heat, so only about 10% moves up.',L,box.ch-6,{s:12,c:PAL['muted']});}
function replan(sim){const s=sim.st;const e=Object.assign({},s.ev||{});delete e.addWolves;delete e.removeWolves;s.pending=Object.assign(e,s.pending);s.W=s.preW;s.M=s.preM;s.G=s.preG;if(s.ev&&s.ev.removeWolves)s.pending.removeWolves=true;if(s.ev&&s.ev.addWolves)s.pending.addWolves=true;makePlan(sim,s);}
function queue(sim,ev){const s=sim.st;if(sim.p.mode!=='game'||s.done)return;Object.assign(s.pending,ev);const f=s.t-(s.year-1);
  if(f<0.15){Object.assign(s.pending,s.ev||{});s.pending=Object.assign({},s.pending);
    // redo this year's plan from the start-of-year numbers
    s.W=s.preW;s.M=s.preM;s.G=s.preG;makePlan(sim,s);}
  sim.infoDirty=true;}
function tableRows(sim){const r=rows(sim),avg=sim.p.luck==='avg'&&sim.p.mode==='game';return r.map(x=>({y:x.y,W:avg?f1(x.W):x.W,M:avg?f1(x.M):x.M,G:avg?f1(x.G):(sim.p.mode==='game'?disp(x.W,x.M,x.G).G:x.G)}));}
function rateHTML(sim){if(!atLeast('ap'))return '';const r=rows(sim);const K=Kof(sim);const a=sim.p.mYear;
  let h='<h3>Growth rates</h3>';
  if(r.length>=2&&r[0].W>0&&r[r.length-1].W>0){const t=r.length-1,N0=r[0].W,Nt=r[r.length-1].W;h+='<p><b>Wolves, exponential</b> (year 1 → year '+r[r.length-1].y+'): r = ln(N<sub>t</sub> ÷ N<sub>0</sub>) ÷ t = ln('+f1(Nt)+' ÷ '+f1(N0)+') ÷ '+t+' = <b>'+f2(Math.log(Nt/N0)/t)+' per year</b></p>';}
  else h+='<p><b>Wolves, exponential:</b> needs at least two years with wolves.</p>';
  const r0=r[a-1],r1=r[a];
  if(r0&&r1&&r0.M>0&&r0.M<K){h+='<p><b>Moose, logistic</b> (year '+a+' → '+(a+1)+', K = '+K+'): r = ΔN ÷ [N(1 − N/K)] = ('+f1(r1.M)+' − '+f1(r0.M)+') ÷ ['+f1(r0.M)+' × (1 − '+f1(r0.M)+'/'+K+')] = <b>'+f2((r1.M-r0.M)/(r0.M*(1-r0.M/K)))+' per year</b></p>';}
  else h+='<p><b>Moose, logistic:</b> choose a start year that has data for that year and the next.</p>';
  return h;}
function gamePanel(sim){const tr=tableRows(sim);
  return '<h3>Year-by-year data</h3><p>One round of the game is one year. Copy this into your worksheet table, then graph it.</p>'+
   '<div style="max-height:230px;overflow:auto;border:1px solid var(--line);border-radius:8px"><table><thead><tr><th>Year</th><th>Wolves</th><th>Moose</th><th>Grass</th></tr></thead><tbody>'+
   tr.map(x=>'<tr><td>'+x.y+'</td><td>'+x.W+'</td><td>'+x.M+'</td><td>'+x.G+'</td></tr>').join('')+'</tbody></table></div>'+
   '<p class="row" style="margin-top:10px"><button type="button" class="btn" data-wm="copy">Copy table</button></p><div id="wm-rcalc">'+rateHTML(sim)+'</div>';}
function classPanel(sim){const c=sim.st.cls;const inp=(i,k,v)=>'<input type="number" min="0" max="99" inputmode="numeric" data-row="'+i+'" data-k="'+k+'" id="wm-c'+i+k+'" aria-label="Year '+(i+1)+' '+({W:'wolves',M:'moose',G:'grass'}[k])+'" value="'+(v===''?'':v)+'" style="width:64px;padding:4px 6px;border:1px solid var(--line);border-radius:6px;background:var(--card2);color:var(--fg);font:inherit">';
  return '<h3>Our class data</h3><p>Type the numbers your class counted after each round of the real game. The field, graph and readouts update as you type, and your numbers stay in this browser.</p>'+
   '<div style="max-height:260px;overflow:auto;border:1px solid var(--line);border-radius:8px"><table><thead><tr><th>Year</th><th>Wolves</th><th>Moose</th><th>Grass</th></tr></thead><tbody>'+
   c.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+inp(i,'W',r.W)+'</td><td>'+inp(i,'M',r.M)+'</td><td>'+inp(i,'G',r.G)+'</td></tr>').join('')+'</tbody></table></div>'+
   '<p class="row" style="margin-top:10px"><button type="button" class="btn" data-wm="add">Add year</button><button type="button" class="btn" data-wm="del">Remove last year</button><button type="button" class="btn" data-wm="copy">Copy table</button><button type="button" class="btn" data-wm="example">Load example</button><button type="button" class="btn" data-wm="clear">Clear</button></p>'+
   '<div id="wm-rcalc">'+rateHTML(sim)+'</div>';}
function copyTable(sim,el){const r=tableRows(sim).filter(x=>x.W!==''&&Number.isFinite(+x.W)||sim.p.mode==='game');const csv=['Year,Wolves,Moose,Grass'].concat(r.map(x=>[x.y,x.W,x.M,x.G].join(','))).join('\n');
  const fb=()=>{let ta=el.querySelector('textarea');if(!ta){ta=document.createElement('textarea');ta.className='csv-fallback';ta.setAttribute('aria-label','Table data');el.appendChild(ta);}ta.value=csv;ta.focus();ta.select();};
  try{navigator.clipboard.writeText(csv).then(()=>{const b=el.querySelector('[data-wm=copy]');if(b){b.textContent='Copied';setTimeout(()=>{b.textContent='Copy table';},1600);}},fb);}catch(e){fb();}}

Object.assign(SIM,{
  challenges:[
    {lvl:'bio',q:'All the wolves are removed from the game. What happens to the moose over the next several years?',
     choices:['They grow and stay high forever','They boom, then crash once they have eaten most of the grass','They die out right away'],correct:1,
     baseline:{luck:'avg'},changeAction:'nowolves',changeText:'All wolves removed',watch:'pop',at:2,reveal:8,
     explain:{bio:'With nothing hunting them, almost every moose reaches grass and the herd doubles. Soon there are more moose than grass, many find nothing to eat, and the herd crashes. Predators actually help keep prey from eating themselves out of food.',
              ap:'Removing the predator removes top-down control. The prey overshoots the grass it depends on, then crashes and swings up and down, because the food (grass) is now the only limit.'}},
    {lvl:'bio',q:'A drought dries up half the grass this year. Which population is hit first, and which feels it later?',
     choices:['Wolves drop first, then moose','Moose drop first, and wolves fall behind a few years later','Only the grass changes'],correct:1,
     baseline:{luck:'avg'},changeAction:'drought',changeText:'Drought this year',watch:'pop',at:4,reveal:10,
     explain:{bio:'Less grass means fewer moose get food, so the moose drop the next year. Fewer moose then means fewer meals for wolves, so the wolves fall below the dashed line (the same game with no drought) a few years later. A change at the bottom of the food chain ripples up.'}},
    {lvl:'honors',q:'An exceptionally cold winter kills extra moose. What happens to the wolves compared with a normal year?',
     choices:['Wolves increase because moose are weaker','Moose drop right away, and wolves end up lower than they would have been','Nothing happens to the wolves'],correct:1,
     baseline:{luck:'avg'},changeAction:'winter',changeText:'Cold winter',watch:'pop',at:4,reveal:10,
     explain:{honors:'The cold (an abiotic factor) removes moose directly. With fewer moose to catch, fewer moose turn into wolves, so the wolf line falls below the dashed line for several years. Meanwhile the grass gets a break.'}},
    {lvl:'honors',q:'Watch a whole game. Which population reaches its highest point first?',
     choices:['Wolves peak first, then moose','Moose peak first, then wolves','They peak at the same time'],correct:1,
     baseline:{luck:'avg'},change:{},changeText:'Just watch the game',watch:'pop',at:1,reveal:13,
     explain:{honors:'Moose peak first. Wolves can only grow after there are lots of moose to catch, so the predator peak lags behind the prey peak. Then the wolves eat the moose down and the wolves crash too. This lag is the classic predator–prey cycle.'}},
    {lvl:'ap',q:'Your wolves went from 2 in year 1 to 8 in year 5. Treating it as exponential growth, what is r?',
     choices:['0.35 per year','1.5 per year','0.75 per year','4 per year'],correct:0,instant:true,
     explain:{ap:'r = ln(N<sub>t</sub> ÷ N<sub>0</sub>) ÷ t = ln(8 ÷ 2) ÷ 4 = 1.386 ÷ 4 ≈ 0.35 per year. Year 1 to year 5 is 4 years, not 5.'}},
    {lvl:'ap',q:'Moose went from 6 in year 3 to 10 in year 4, with a carrying capacity of 24. Using dN/dt = rN(1 − N/K), what is r?',
     choices:['0.89 per year','0.67 per year','4 per year','0.17 per year'],correct:0,instant:true,
     explain:{ap:'ΔN = 10 − 6 = 4 in one year. N(1 − N/K) = 6 × (1 − 6/24) = 6 × 0.75 = 4.5. So r = 4 ÷ 4.5 ≈ 0.89 per year. Use the starting population (6) for N.'}},
    {lvl:'ap',q:'Turn on “Wolves can die of old age” (a death rate). Compared with the dashed line, what happens?',
     choices:['More wolves, fewer moose','Fewer wolves, and the moose stay higher','No change'],correct:1,
     baseline:{luck:'avg'},change:{wd:true},changeText:'Wolf death rate on',watch:'pop',at:2,reveal:13,
     explain:{ap:'In the gym game a wolf only dies if it catches nothing. Adding a death rate removes wolves even in good years, so the wolf population stays low, hunting pressure drops and the moose stay higher. Real populations have both birth and death rates.'}}
  ],
  tour:[
    {title:'The field',text:'This is the gym game. Every figure is a student in a pinny: <b>W</b> wolves wait in the middle, <b>M</b> moose start at home, and <b>G</b> grass players crouch in the meadow. One round of the game is one year.',focus:[16,58,768,358],speed:0.15},
    {title:'Moose run for food',text:'When the round starts, every moose sprints for the meadow. A moose needs to tag one grass player to eat.',focus:[16,58,580,358],speed:0.15},
    {title:'Wolves hunt',text:'Each wolf can tag one moose on the way across. A tagged moose has been eaten.',focus:[300,58,200,358],speed:0.15},
    {title:'Who eats, who starves',text:'Moose that reach grass eat and survive. Moose that find no free grass player starve. Wolves that catch nothing starve too.',focus:[560,58,224,358],speed:0.15},
    {title:'Everyone switches roles',text:'A tagged moose <b>becomes a wolf</b> (more wolves are born). The grass a moose ate <b>becomes a moose</b>. Starved moose and wolves <b>become grass</b>, like decomposers returning nutrients to the soil. The class size never changes.',focus:[16,58,768,358],speed:0.25},
    {title:'Count and graph',text:'After every round, count each population and record it. The scoreboard shows this year’s numbers, and the table and graph below build year by year.',focus:[470,8,326,46],speed:0.5},
    {lvl:'honors',title:'Shake it up',text:'Now a drought hits: half the grass sits out. Watch the moose suffer first, then the wolves a year or two later.',focus:[560,58,224,358],speed:0.6,setup(sim){queue(sim,{drought:true});}},
    {lvl:'ap',title:'Energy moves up, about 10%',text:'Grass captures sunlight, moose eat grass and wolves eat moose. Only about 10% of the energy at each level reaches the next, which is why there are always far fewer wolves than moose. Switch the graph to <b>Energy pyramid</b> to see it.',focus:[16,58,768,358],pause:true}
  ],
  lab:{bio:'<p><b>Question:</b> How do the wolf, moose and grass populations depend on each other?</p><ol><li>Press New game and let all 15 years play (or play the real game in the gym).</li><li>Record the number of wolves, moose and grass every year in a table. One round = one year.</li><li>Graph all three populations against time on one graph. Use SULTAN: Scale, Units, Labels, Title, Axes, Neat.</li></ol><p>Describe one pattern for each organism. How do the predator (wolf) and prey (moose) populations depend on each other? Use numbers from your graph.</p>',
       honors:'<p><b>Question:</b> How do abiotic and biotic changes ripple through the food chain?</p><ol><li>Switch Luck to Average game and run a normal game as your control.</li><li>Run it again with a drought in year 5, then with a cold winter in year 5, then with all wolves removed in year 3. Record each run.</li><li>Compare each run with the dashed line (the same game with no change).</li></ol><p>For each change, explain the order in which the populations were affected and why.</p>',
       ap:'<p><b>Question:</b> How good is this game as a model of real predator–prey dynamics?</p><ol><li>Play a game (or type in your class data) and record the table.</li><li>Calculate the wolves’ exponential r from year 1 to the final year, and the moose’s logistic r from year 3 to year 4 with K = 24. Check your work against the Growth rates panel.</li><li>Turn on a wolf death rate, then a grass birth rate, and describe how each changes the graph.</li></ol><p><b>Claim–evidence–reasoning:</b> What are two strengths and two weaknesses of this game as a scientific model? Compare it with the real wolves and moose of Isle Royale.</p>'},
  terms:[{t:'Population',d:'All the members of one species living in one area.'},{t:'Predator / prey',d:'The predator (wolf) hunts and eats the prey (moose).'},{t:'Biotic factor',d:'A living part of an ecosystem, like wolves, moose or grass.'},{t:'Abiotic factor',d:'A non-living part of an ecosystem, like water, temperature or sunlight.'},
    {lvl:'honors',t:'Limiting factor',d:'Whatever holds a population back: food for the moose, moose for the wolves.'},{lvl:'honors',t:'Carrying capacity (K)',d:'The largest population the environment can support over time.'},{lvl:'honors',t:'Trophic level',d:'A step in the food chain: producers (grass), primary consumers (moose), secondary consumers (wolves).'},
    {lvl:'ap',t:'Intrinsic growth rate (r)',d:'How fast a population grows per individual per year. Exponential: r = ln(N<sub>t</sub>/N<sub>0</sub>) ÷ t.'},{lvl:'ap',t:'Logistic growth',d:'Growth that slows as the population nears K: dN/dt = rN(1 − N/K).'},{lvl:'ap',t:'10% rule',d:'Only about 10% of the energy at one trophic level is passed to the next.'}],
  about:'<p><b>The rules</b> follow the classroom game. Each round (one year): every wolf can tag at most one moose, and every moose that is not tagged can tag at most one grass player. Tagged moose become wolves; moose that ate keep their role and the grass they tagged becomes a moose; moose that found no grass and wolves that caught nothing become grass. The total number of players never changes (unless grass growth is on).</p><p><b>Chances.</b> A wolf tags a moose with probability skill × M/(M + 3), so wolves struggle when moose are scarce. A moose reaches a free grass player with probability speed × G/(G + 1). <b>Like a real game</b> rolls these chances each round, so every game is different. <b>Average game</b> uses the expected numbers instead (no luck), which can be fractions; it also draws a dashed line showing the same game without your change.</p><p><b>Events.</b> Drought: half the grass sits out for one round. Cold winter: half the moose die before the round. Migration: if a species disappears, one player rejoins it next year. Wolf death rate: each wolf has a 20% chance of dying each year. Grass growth: new grass joins the meadow, faster when the meadow is sparse.</p><p><b>Simplified:</b> real wolves and moose live many years, breed once a year, and are not replaced one-for-one by the animals they eat. The game captures the feedback (more prey → more predators → fewer prey) but not real lifespans or birth rates. Isle Royale’s real wolf and moose numbers rise and fall in a similar lagged pattern over decades.</p>',
  onTourExit(sim){BioLab.reset(sim);}
});
BioLab.register(SIM);
})();
