(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,RM,lerp,FONT}=BioLab.h;

/* Eutrophication in a farm-country lake, time in days.
   Nutrients:  dP/dt = P_in − uptake + recycling − flushing  (phosphate, µg/L); nitrogen the same way.
   Algae:      dA/dt = μ(T)·A·min(fP,fN)·(1 − A/250) − deaths      (Liebig: the scarcer nutrient limits growth)
   Detritus:   dead algae (+ sewage organic matter) sink and are decomposed at k(T)·D
   Oxygen:     surface DO relaxes toward saturation DOsat(T); bottom DO is resupplied only by mixing with the
               surface and is used up by decomposers (BOD). Warm water and summer stratification both cut mixing.
   Fish:       die when bottom DO falls below ~3 mg/L, regrow and recolonize when it is above 4 mg/L. */
const DOSAT=T=>14.652-0.41022*T+0.007991*T*T-0.000077774*T*T*T;
const CHL=0.4,FISHK=400;
function rates(p,s){const T=p.temp,th=Math.pow(1.07,T-20),buf=p.buffer?0.4:1,run=p.runoff/100,nP=p.nut!=='N',nN=p.nut!=='P';
  const Pin=0.3+(nP?run*20*buf:0)+(p.sewage?6:0),Nin=60+(nN?run*120*buf:0)+(p.sewage?40:0);
  const fP=s.P/(s.P+6),fN=s.N/(s.N+40),lim=fP<fN?'P':'N',f=Math.min(fP,fN);
  const g=0.9*th*s.A*f*(1-s.A/250),die=0.16*s.A+0.0006*s.A*s.A,kd=0.15*Math.pow(1.08,T-20),dec=kd*s.D;
  const mix=(p.strat?0.35:1)*0.3*clamp(1-(T-8)/30,0.25,1);
  return {Pin,Nin,g,die,dec,mix,lim,bod:0.085*dec,sat:DOSAT(T)};}
function trophic(chl){return chl<2.6?'Oligotrophic (clear)':chl<20?'Mesotrophic':chl<56?'Eutrophic':'Hypereutrophic';}

/* ---------- Virtual lab bench: the APES water quality lab (Virtual lab mode; see VLAB.md) ----------
   Two unlabeled samples, A and B: Denver-area tap water and turtle-tank water, assigned at random from the lab's saved
   seed (plus Sample C, pond or stream water, as an extension). The student runs kit tests the way a test kit works:
   fill to the line, add the reagent, cap and mix, wait, then read the tube against a printed color card. DO and
   hardness are drop-count titrations; TDS and temperature are meters; coliform is a 24 h presence/absence vial.
   The bench runs in seconds: 1 day of lake time = KS bench seconds, so 1x speed runs the kit timer 20 times faster
   than real time. Every shown color, drop count and meter value is stored in sim.vlab.bench for the checks. */
const KS=20/3;
function whr(seed,a,b){let h=(seed^Math.imul(a+1,0x9E3779B1)^Math.imul(b+7,0x85EBCA77))|0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);h^=h>>>16;return (h>>>0)/4294967296;}
function whn(seed,a,b){const u=Math.max(1e-9,whr(seed,a,b)),w=whr(seed,a,b+100003);return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*w);}
const WQ_ORDER=['ph','temp','do','no3','po4','nh3','hard','tds','coli'];
const WQT={
  ph:{n:'pH',u:'',kind:'card',vol:'10 mL',reag:'10 drops of wide-range indicator',wait:0,steps:[3,4,5,6,7,8,9,10],dp:1,hue:'color',
    cols:['#d8343a','#e8642f','#ef8f2b','#e6c83a','#62ad48','#2a9c8a','#3063b6','#6b3f9c']},
  temp:{n:'Temperature',u:'°C',kind:'meter',settle:30,dp:1},
  do:{n:'Dissolved oxygen',sh:'DO',u:'ppm',kind:'titr',per:0.2,dp:1},
  no3:{n:'Nitrate',u:'ppm',kind:'card',vol:'5 mL',reag:'one nitrate reagent tablet',wait:300,steps:[0,5,10,20,40],dp:1,hue:'pink',
    cols:['#f4eef0','#f0c8d4','#e59ab4','#d56994','#b93b72']},
  po4:{n:'Phosphate',u:'ppm',kind:'card',vol:'10 mL',reag:'one phosphate reagent tablet',wait:300,steps:[0,1,2,4],dp:1,hue:'blue',
    cols:['#eef3f6','#bcd5ec','#84b0de','#4a7ec4']},
  nh3:{n:'Ammonia',u:'ppm',kind:'card',vol:'10 mL',reag:'the two ammonia reagent tablets',wait:300,steps:[0,0.5,1,2,4],dp:1,hue:'green',
    cols:['#f1eec0','#dbe5a0','#bad58a','#8cbc77','#559764']},
  hard:{n:'Hardness',u:'ppm as CaCO₃',kind:'titr',per:10,dp:0},
  tds:{n:'Total dissolved solids',sh:'TDS',u:'ppm',kind:'meter',settle:12,dp:0},
  coli:{n:'Coliform bacteria',u:'',kind:'pa'}};
const wqName=id=>WQT[id].n+(WQT[id].sh?' ('+WQT[id].sh+')':'');
const wqLabel=id=>WQT[id].n+(WQT[id].u?' ('+WQT[id].u+')':'');
/* reference values for the graph: the reading as a percent of each one (DO's is a minimum) */
const WQREF=[{t:'no3',l:'NO₃⁻',ref:10,rl:'10 ppm (drinking-water limit)'},{t:'po4',l:'PO₄³⁻',ref:0.5,rl:'0.5 ppm (drinking-water limit)'},{t:'nh3',l:'NH₃',ref:1.9,rl:'1.9 ppm (EPA limit for freshwater life)'},
  {t:'tds',l:'TDS',ref:500,rl:'500 ppm (EPA secondary standard)'},{t:'do',l:'DO',ref:7,rl:'7 ppm (minimum that organisms need)'},{t:'hard',l:'Hardness',ref:200,rl:'200 ppm (drinking water)'}];
const WQ_SRC={tap:'Tap water',turtle:'Turtle-tank water',pond:'Pond or stream water'};
const WQ_LOOK={tap:[206,228,240],turtle:[176,170,118],pond:[158,164,112]};
const WQ_HAZE={tap:0,turtle:0.55,pond:0.4};
/* the true samples, from the seed: Denver-area tap water vs a turtle tank (the handout's realism notes) */
const wqDC={};
function wqData(seed){if(wqDC[seed])return wqDC[seed];const S=seed|0,u=(a,b)=>whr(S,a,b),L=(lo,hi,a)=>lo+(hi-lo)*u(10,a),G=(lo,hi,a)=>Math.exp(Math.log(lo)+(Math.log(hi)-Math.log(lo))*u(10,a));
  const tap={ph:L(7.8,8.8,1),temp:L(18.6,21.4,2),do:L(7.4,8.4,3),no3:L(0,0.5,4),po4:L(0,0.2,5),nh3:L(0,0.22,6),hard:L(40,100,7),tds:L(90,190,8),coli:false};
  const turtle={ph:L(6.8,7.8,11),temp:L(23,26.5,12),do:L(3,6,13),no3:G(12,70,14),po4:L(1,5,15),nh3:G(0.5,4,16),hard:clamp(tap.hard*L(1.4,2.2,17),80,220),tds:L(300,600,18),coli:true};
  const pond={ph:L(7.4,8.6,21),temp:L(9,15,22),do:L(5.5,8.8,23),no3:L(0.3,4,24),po4:L(0.05,0.8,25),nh3:L(0,0.5,26),hard:L(150,300,27),tds:L(350,800,28),coli:true};
  const tapA=u(1,0)<0.5,src={A:tapA?'tap':'turtle',B:tapA?'turtle':'tap',C:'pond'},vals={tap,turtle,pond};
  const pick=['ph','do','no3','po4','nh3','hard','tds','coli'],asg=pick[Math.min(pick.length-1,Math.floor(u(2,0)*pick.length))];
  const grp=1+Math.floor(u(3,0)*10),slop=asg==='do'?'temp':'do';
  // the class spreadsheet: every other test once, the sloppy group's test a second time, and your group's row
  const list=WQ_ORDER.filter(t=>t!==asg).map(t=>({t}));list.push({t:slop,sloppy:true});
  for(let i=list.length-1;i>0;i--){const j=Math.floor(u(4,i)*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  list.splice(grp-1,0,{t:asg,you:true});
  const rows=list.map((r,i)=>{const o={g:i+1,t:r.t,you:!!r.you,sloppy:!!r.sloppy,v:{}};if(!r.you)['A','B','C'].forEach((s,j)=>{o.v[s]=wqClassVal(S,r,vals[src[s]][r.t],i*3+j);});return o;});
  const D={seed:S,src,vals,asg,grp,slop,rows};wqDC[seed]=D;return D;}
/* another group's reading: the closest color step (sometimes one off), a drop count, or a meter value */
function wqClassVal(S,r,x,k){const T=WQT[r.t],n=whn(S,700+k,r.t.length);
  if(T.kind==='pa')return x?'Present':'Absent';
  if(T.kind==='card'){const i=clamp(Math.round(wqPos(r.t,x)+0.3*n),0,T.steps.length-1);return T.steps[i];}
  if(T.kind==='titr'){const d=Math.max(1,Math.round(x/T.per+0.7*n));return r.sloppy?d:+(d*T.per).toFixed(T.dp);}
  if(r.t==='temp'){const v=+(x+0.15*n).toFixed(1);return r.sloppy?+(v*1.8+32).toFixed(1):v;}
  return Math.round(x*(1+0.02*n));}
/* color-card position: 0 at the first swatch, 1 at the next, and so on (past the last swatch it keeps going) */
function wqPos(t,v){const s=WQT[t].steps,n=s.length;if(v<=s[0])return t==='ph'?v-s[0]:0;for(let i=1;i<n;i++)if(v<=s[i])return i-1+(v-s[i-1])/(s[i]-s[i-1]);return n-1+(v-s[n-1])/(s[n-1]-s[n-2]);}
const hexRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mixRGB=(a,b,f)=>a.map((x,i)=>Math.round(x+(b[i]-x)*f));
const css=(c,a)=>a===undefined?`rgb(${c[0]},${c[1]},${c[2]})`:`rgba(${c[0]},${c[1]},${c[2]},${a})`;
function wqCardRGB(t,pos){const c=WQT[t].cols.map(hexRGB),n=c.length,p=clamp(pos,0,n-1),i=Math.min(n-2,Math.floor(p));let r=mixRGB(c[i],c[i+1],p-i);if(pos>n-1)r=mixRGB(r,[40,20,30],clamp((pos-n+1)*0.35,0,0.45));return r;}
const wqV=sim=>sim&&sim.vlab&&sim.vlab.lab&&sim.vlab.lab.id==='waterquality'?sim.vlab:null;
const wqD=sim=>wqV(sim)?wqData(sim.vlab.seed):null;
const wqB=sim=>wqV(sim)&&sim.st&&sim.st.W?sim.vlab.bench:null;
let WQCUR=null;const wqCur=()=>wqD(WQCUR);
const SIDX={A:0,B:1,C:2};
/* a fresh tube: what this run will show (seeded per attempt, so a reload never changes it) */
function wqFill(sim){const b=wqB(sim);if(!b||b.tube)return;const D=wqD(sim),t=sim.p.wqTest,s=sim.p.wqSample,T=WQT[t],x=D.vals[D.src[s]][t],ti=WQ_ORDER.indexOf(t),si=SIDX[s];
  b.att=(b.att||0)+1;const a=b.att,u={test:t,s,st:'filled',att:a,t0:b.t,D:0,starch:false};
  if(T.kind==='card')u.pos=clamp(wqPos(t,x)+0.12*whn(D.seed,400+ti*5+si,a),t==='ph'?-0.4:0,T.steps.length-0.6);
  else if(T.kind==='titr')u.E=Math.max(1,Math.round(x/T.per+0.45*whn(D.seed,500+ti*5+si,a)));
  else if(t==='temp')u.val=+(x+0.06*whn(D.seed,600+si,a)).toFixed(1);
  else if(t==='tds')u.val=Math.max(1,Math.round(x*(1+0.008*whn(D.seed,610+si,a))));
  else u.present=!!x;
  b.tube=u;b.sel={wqTest:t,wqSample:s,wqView:sim.p.wqView};wqRefresh(sim);}
function wqRec(sim,u,o){const b=sim.vlab.bench,k=u.test+':'+u.s;b.done=b.done||{};const L=b.done[k]=b.done[k]||[];L.push(Object.assign({att:u.att},o));while(L.length>6)L.shift();}
function wqRun(sim,u){const L=(sim.vlab.bench.done||{})[u.test+':'+u.s]||[];return L.find(r=>r.att===u.att);}
function wqStep(sim,ds){const b=sim.vlab.bench;b.t=(b.t||0)+ds;const u=b.tube;if(!u)return;const T=WQT[u.test];
  if(u.st==='timing'&&b.t-u.t0>=T.wait){u.st='ready';wqRec(sim,u,{pos:u.pos});}
  if(u.st==='probe'&&!u.rec&&b.t-u.t0>=T.settle){u.rec=true;wqRec(sim,u,{val:u.val});}}
function wqDrops(sim,n){const b=wqB(sim),u=b&&b.tube;if(!u||u.st!=='titrate')return;for(let i=0;i<n;i++){u.D++;if(u.D>=u.E&&!u.ended){u.ended=true;wqRec(sim,u,{E:u.E,D:u.D,starch:u.starch});}}
  if(u.ended){const r=wqRun(sim,u);if(r)r.D=u.D;}}
/* what the student sees in the tube */
function wqShade(u){if(u.test==='do'){if(u.D>=u.E)return 0;return u.starch?clamp((u.E-u.D)/5,0.18,1):(u.E-u.D)/u.E;}
  if(u.test==='hard')return 1-clamp((u.D-(u.E-2))/2,0,1);return 0;}
function wqTubeRGB(sim,u){const D=wqD(sim),look=WQ_LOOK[D.src[u.s]],T=WQT[u.test],b=sim.vlab.bench;
  if(T.kind==='card'){if(u.st==='filled')return look;const f=u.st==='reagent'?(u.test==='ph'?0.7:0.12):u.st==='timing'?0.12+0.88*(1-Math.exp(-3*(b.t-u.t0)/T.wait)):1;return mixRGB(look,wqCardRGB(u.test,u.pos),f);}
  if(T.kind==='pa'){if(u.st==='filled')return look;if(u.st==='ready'&&u.present)return [228,196,58];return [168,62,112];}
  if(u.test==='do'){if(u.st==='filled')return look;if(u.st==='reagent')return [196,150,96];const sh=wqShade(u);if(sh<=0)return mixRGB(look,[238,242,244],0.85);
    return u.starch?mixRGB([236,240,242],[38,52,128],sh):mixRGB([240,238,214],[176,112,40],sh);}
  if(u.test==='hard'){if(u.st==='filled')return look;return mixRGB([46,96,182],[160,44,86],wqShade(u));}
  return look;}
function wqMeter(sim,u){const b=sim.vlab.bench,age=b.t-u.t0,sec=Math.floor(b.t),D=wqD(sim);
  if(u.test==='temp'){const room=21,T=room+(u.val-room)*(1-Math.exp(-age/6)),j=age>=WQT.temp.settle?Math.round(whn(D.seed,620+u.att,sec)*0.6)/10:0;return +(T+clamp(j,-0.1,0.1)).toFixed(1);}
  const v=u.val*(1-Math.exp(-age/2.5)),j=age>=WQT.tds.settle?Math.round(clamp(whn(D.seed,630+u.att,sec)*0.7,-1,1)):0;return Math.max(0,Math.round(v)+j);}
/* which bench controls show right now: the test pickers, then each kit step's button in turn */
function wqCtl(sim){const b=wqB(sim),L=['wqView'];if(!b)return L.concat(['wqTest','wqSample','wq-fill']);const u=b.tube;
  if(!u)return L.concat(['wqTest','wqSample','wq-fill']);const T=WQT[u.test];
  if(T.kind==='meter'){if(u.st==='filled')L.push('wq-probe');}
  else if(u.st==='filled')L.push('wq-reag');else if(u.st==='reagent')L.push('wq-mix');
  else if(T.kind==='pa'&&u.st==='mixed')L.push('wq-incub');
  else if(T.kind==='titr'&&u.st==='titrate'){if(!(u.test==='do'&&u.starch))L.push('wq-d10');L.push('wq-d1');if(u.test==='do'&&!u.starch)L.push('wq-starch');}
  L.push('wq-rinse');return L;}
function wqRefresh(sim){if(sim.p.wqView==='sheet')BioLab.setValues(sim,{wqView:'bench'});if(sim.vlab&&sim.mode==='vlab'&&BioLab.vlab&&BioLab.vlab.go)BioLab.vlab.go(sim,sim.vlab.step);}
const wqTube=sim=>{const b=wqB(sim);return b&&b.tube?b.tube:null;};
const wqKind=sim=>{const u=wqTube(sim);return u?WQT[u.test].kind:null;};
const WQ_ACTIONS=[
  {id:'wq-fill',label:'Fill to the line',primary:true,vlab:true,enabled:s=>!!wqB(s)&&!s.vlab.bench.tube,run:wqFill},
  {id:'wq-reag',label:'Add the reagent',primary:true,vlab:true,enabled:s=>{const u=wqTube(s);return !!u&&u.st==='filled'&&WQT[u.test].kind!=='meter';},
   run(s){const u=wqTube(s);if(!u||u.st!=='filled'||WQT[u.test].kind==='meter')return;u.st='reagent';u.tr=s.vlab.bench.t;wqRefresh(s);}},
  {id:'wq-mix',label:'Cap and mix',primary:true,vlab:true,enabled:s=>{const u=wqTube(s);return !!u&&u.st==='reagent';},
   run(s){const u=wqTube(s);if(!u||u.st!=='reagent')return;const T=WQT[u.test],b=s.vlab.bench;
     if(T.kind==='card'){if(T.wait>0){u.st='timing';u.t0=b.t;}else{u.st='ready';wqRec(s,u,{pos:u.pos});}}
     else if(T.kind==='titr')u.st='titrate';else u.st='mixed';BioLab.play(s);wqRefresh(s);}},
  {id:'wq-probe',label:'Put in the probe',primary:true,vlab:true,enabled:s=>{const u=wqTube(s);return !!u&&u.st==='filled'&&WQT[u.test].kind==='meter';},
   run(s){const u=wqTube(s);if(!u||u.st!=='filled'||WQT[u.test].kind!=='meter')return;u.st='probe';u.t0=s.vlab.bench.t;BioLab.play(s);wqRefresh(s);}},
  {id:'wq-incub',label:'Incubate 24 hours',primary:true,vlab:true,enabled:s=>{const u=wqTube(s);return !!u&&u.st==='mixed';},
   run(s){const u=wqTube(s);if(!u||u.st!=='mixed')return;u.st='ready';wqRec(s,u,{present:u.present});wqRefresh(s);}},
  {id:'wq-d10',label:'Add 10 drops',vlab:true,enabled:s=>{const u=wqTube(s);return !!u&&u.st==='titrate'&&!(u.test==='do'&&u.starch);},run(s){wqDrops(s,10);wqRefresh(s);}},
  {id:'wq-d1',label:'Add 1 drop',primary:true,vlab:true,enabled:s=>{const u=wqTube(s);return !!u&&u.st==='titrate';},run(s){wqDrops(s,1);if(s.p.wqView==='sheet')wqRefresh(s);}},
  {id:'wq-starch',label:'Add starch indicator',vlab:true,enabled:s=>{const u=wqTube(s);return !!u&&u.st==='titrate'&&u.test==='do'&&!u.starch;},
   run(s){const u=wqTube(s);if(!u||u.test!=='do'||u.starch)return;u.starch=true;u.starchAt=u.D;wqRefresh(s);}},
  {id:'wq-rinse',label:'Empty and rinse',vlab:true,enabled:s=>!!wqTube(s),run(s){const b=wqB(s);if(!b||!b.tube)return;b.tube=null;wqRefresh(s);}}];
/* ---------- checks ---------- */
const WQ_RD=WQ_ORDER.filter(t=>t!=='coli');
const wqRowId=rv=>WQT[rv]?rv:(WQ_RD.find(t=>wqLabel(t)===rv)||(WQREF.find(r=>r.l===rv)||{}).t||rv);
const fmtV=(t,v)=>typeof v==='number'?(WQT[t].kind==='card'&&t!=='ph'?String(v):v.toFixed(WQT[t].dp)):String(v);
/* is a reading within one step of what this run showed? */
function wqMatch(t,run,v){const T=WQT[t];
  if(T.kind==='card'){const k=clamp(Math.round(run.pos),0,T.steps.length-1),sp=wqPos(t,v);return Math.abs(sp-k)<=1.001||(k===T.steps.length-1&&sp>k);}
  if(T.kind==='titr')return Math.abs(v-run.E*T.per)<=T.per*1.01+1e-9||Math.abs(v-run.D*T.per)<=1e-9&&run.D<=run.E+1;
  if(t==='temp')return Math.abs(v-run.val)<=0.2001;
  return Math.abs(v-run.val)<=Math.max(4,0.02*run.val);}
function wqRdCheck(S){return (sim,rv,v)=>{const V=wqV(sim);if(!V)return null;const t=wqRowId(rv),T=WQT[t],runs=((V.bench.done||{})[t+':'+S]||[]);
  if(!runs.length)return 'Run the '+T.n.toLowerCase()+' test on Sample '+S+' on the bench first, then record what you read.';
  if(runs.some(r=>wqMatch(t,r,v)))return null;const r=runs[runs.length-1];
  if(T.kind==='card'){const k=clamp(Math.round(r.pos),0,T.steps.length-1);return 'Your Sample '+S+' tube was closest to the '+(t==='ph'?'pH '+T.steps[k]:T.steps[k]+' '+T.u)+' color on the card. Check your reading.';}
  if(T.kind==='titr'){if(runs.some(x=>Math.abs(v-x.D)<1e-9||Math.abs(v-x.E)<1e-9))return 'That looks like your drop count. Each drop is '+T.per+' ppm, so multiply the number of drops by '+T.per+'.';
    if(r.D>r.E+1)return 'You added '+r.D+' drops, but the color had already changed at drop '+r.E+'. Empty and rinse, then run the test again and add the last drops one at a time.';
    return 'You counted '+r.E+' drops to the end point. Check your reading: each drop is '+T.per+' ppm.';}
  if(t==='temp')return 'The thermometer settled at '+r.val.toFixed(1)+' °C. Check your reading.';
  return 'The TDS meter settled at about '+r.val+' ppm. Check your reading.';};}
function wqPaCheck(S){return (sim,rv,v)=>{const V=wqV(sim);if(!V)return null;const runs=(V.bench.done||{})['coli:'+S]||[];
  if(!runs.length)return 'Run the coliform test on Sample '+S+' on the bench first, then record what you see after 24 hours.';
  const r=runs[runs.length-1];if((v==='P')===!!r.present)return null;return 'Look at the Sample '+S+' vial again after 24 hours: '+(r.present?'it turned yellow.':'it stayed red-purple.');};}
/* the numbers a student could have used: their own readings and every class spreadsheet value for that test */
function wqCands(sim,t,S){const V=wqV(sim),D=wqD(sim),out=[];if(!V||!D)return out;
  if(t==='coli'){const o=V.raw('c:col:'+S.toLowerCase()+':0');if(o)out.push({v:o==='P'?'Present':'Absent',own:true});}
  else{const i=WQ_RD.indexOf(t),x=V.val('rd',S.toLowerCase(),i);if(Number.isFinite(x))out.push({v:x,own:true});}
  D.rows.forEach(r=>{if(r.t===t&&!r.you)out.push({v:r.v[S],sloppy:r.sloppy,g:r.g});});return out;}
function wqNear(t,a,b){const T=WQT[t];if(T.kind==='card')return Math.abs(wqPos(t,a)-wqPos(t,b))<=1.001;if(T.kind==='titr')return Math.abs(a-b)<=T.per*1.01;if(t==='temp')return Math.abs(a-b)<=0.25;return Math.abs(a-b)<=Math.max(5,0.03*b);}
function wqEvCheck(S){return (sim,rv,v)=>{const V=wqV(sim);if(!V)return null;const r=(+rv)-1,t=V.raw('c:ev:test:'+r);if(!t)return 'Choose the water quality test for this row first.';
  const C=wqCands(sim,t,S);
  if(t==='coli'){const m=/present|absent/i.exec(v);if(!m)return 'Write Present or Absent for the coliform test.';const w=m[0].toLowerCase()==='present'?'Present':'Absent';
    return C.some(c=>c.v===w)?null:'This does not match your coliform reading or the class spreadsheet for Sample '+S+'.';}
  const m=/-?\d+(\.\d+)?|-?\.\d+/.exec(v);if(!m)return 'Write the Sample '+S+' number from your readings table or the class spreadsheet.';const x=parseFloat(m[0]);
  const hit=C.filter(c=>typeof c.v==='number'&&wqNear(t,x,c.v));
  if(hit.length&&hit.every(c=>c.sloppy)){if(t==='do')return 'No water sample holds that much oxygen at room temperature. In Denver, water at 20 °C can hold only about 7.5 ppm. Check that group’s data, or run the test yourself.';
    return 'Neither sample could be that warm in the lab. Check the units in that group’s data, or run the test yourself.';}
  return hit.length?null:'This does not match your readings table or the class spreadsheet for '+WQT[t].n.toLowerCase()+', Sample '+S+'.';};}
function wqPctCheck(S){return (sim,rv,v)=>{rv=wqRowId(rv);const R=WQREF.find(x=>x.t===rv);if(!R||!wqV(sim))return null;const C=wqCands(sim,rv,S).filter(c=>typeof c.v==='number');
  if(C.some(c=>{const e=100*c.v/R.ref;return Math.abs(v-e)<=Math.max(1,0.03*e);}))return null;
  if(C.some(c=>Math.abs(v-c.v/R.ref)<=Math.max(0.01,0.03*c.v/R.ref)))return 'That is a fraction. Multiply by 100 to make it a percent.';
  return 'Percent of the reference = your Sample '+S+' '+WQT[rv].n.toLowerCase()+' value ÷ '+R.ref+' ppm × 100. Use your own reading, or the class spreadsheet if you did not run this test.';};}
function wqRowRecheck(tb,cols){return (sim,rv)=>{const V=wqV(sim),r=+rv-1;if(V&&BioLab.vlab&&BioLab.vlab.check)cols.forEach(c=>{const k='c:'+tb+':'+c+':'+r;if(V.raw(k).trim()!==''||V.notes[k])BioLab.vlab.check(sim,k);});return null;};}
function wqPlanCheck(sim,rv,v){const D=wqD(sim),V=wqV(sim);if(!D)return null;
  if(+rv===1&&V.raw('c:plan:test:1')&&BioLab.vlab&&BioLab.vlab.check)setTimeout(()=>{if(sim.vlab)BioLab.vlab.check(sim,'c:plan:test:1');},0);
  if(+rv===1&&v!==D.asg)return 'Your group was assigned the '+WQT[D.asg].n.toLowerCase()+' test. Choose it as Test 1.';
  if(+rv===2&&v===V.raw('c:plan:test:0'))return 'Choose a different test for Test 2.';return null;}
/* ---------- bench drawing ---------- */
const WLCD='700 VSIZEpx "Consolas","Menlo","DejaVu Sans Mono","Courier New",monospace';
const wmmss=s=>{s=Math.max(0,Math.ceil(s-1e-6));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
function wLcd(ctx,x,y,w,h,label,value,k,vs){ctx.fillStyle='#2b2f36';rr(ctx,x,y,w,h,12);ctx.fill();txt(ctx,label,x+14,y+20,{s:Math.min(12*k,16),w:700,c:'#d7dbe0'});
  const sy=y+30,sh=h-42;ctx.fillStyle='#cfe3c8';rr(ctx,x+12,sy,w-24,sh,6);ctx.fill();ctx.fillStyle='#1b2a1b';let z=vs||40;ctx.font=WLCD.replace('VSIZE',String(z));
  while(z>16&&ctx.measureText(value).width>w-40){z-=2;ctx.font=WLCD.replace('VSIZE',String(z));}ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(value,x+w-24,sy+sh/2+2);}
function wWrap(ctx,s,x,y,maxW,size,o){o=o||{};ctx.font=(o.w||400)+' '+size+'px '+FONT;const words=String(s).split(' ');let line='',yy=y;
  words.forEach(wd=>{const tst=line?line+' '+wd:wd;if(line&&ctx.measureText(tst).width>maxW){txt(ctx,line,x,yy,Object.assign({s:size},o));yy+=size*1.3;line=wd;}else line=tst;});
  if(line)txt(ctx,line,x,yy,Object.assign({s:size},o));return yy+size*1.3;}
function wBottle(ctx,cx,top,lab,look,haze,sel,k){const w=46,h=118,x=cx-w/2;
  ctx.fillStyle=css(look,0.85);rr(ctx,x+3,top+26,w-6,h-30,6);ctx.fill();
  if(haze>0){ctx.fillStyle='rgba(120,110,70,'+(0.25*haze)+')';for(let i=0;i<10;i++){ctx.beginPath();ctx.arc(x+8+((i*17)%30),top+40+((i*23)%70),2.2,0,6.29);ctx.fill();}}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;rr(ctx,x,top+14,w,h-14,8);ctx.stroke();ctx.fillStyle='#3d5a80';rr(ctx,cx-14,top,28,16,4);ctx.fill();
  ctx.fillStyle='#fbfaf4';rr(ctx,x+7,top+50,w-14,34,4);ctx.fill();txt(ctx,lab,cx,top+75,{s:Math.min(20*k,26),w:800,c:'#222',a:'center'});
  if(sel){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;rr(ctx,x-7,top-7,w+14,h+14,10);ctx.stroke();}}
/* the color card: printed swatches on white, with your tube held in the slot at the top */
function wCard(ctx,sim,t,u,k){const T=WQT[t],X=566,Y=46,W=226,H=340,narrow=k>1.35,fs=Math.min(12.5*k,narrow?21:17);ctx.fillStyle='#fbfaf6';rr(ctx,X,Y,W,H,10);ctx.fill();ctx.strokeStyle='#b9b4a6';ctx.lineWidth=1.5;rr(ctx,X,Y,W,H,10);ctx.stroke();
  txt(ctx,(narrow?T.n:T.n+' color card')+(T.u?' ('+T.u+')':''),X+W/2,Y+24,{s:Math.min(14*k,20),w:700,c:'#222',a:'center'});
  let y0=Y+42;if(u&&u.test===t&&u.st!=='filled'){const c=wqTubeRGB(sim,u);txt(ctx,'Your tube',X+14,y0+14,{s:fs,w:600,c:'#444'});ctx.fillStyle=css(c);rr(ctx,X+14,y0+20,W-28,38,6);ctx.fill();ctx.strokeStyle='#9a9588';ctx.lineWidth=1;rr(ctx,X+14,y0+20,W-28,38,6);ctx.stroke();y0+=72;}
  const n=T.steps.length,rows=Math.ceil(n/2),pitch=(Y+H-10-y0)/rows,sw=(W-42)/2,shh=Math.max(18,Math.min(36,pitch-fs-10));
  T.steps.forEach((v,i)=>{const c=i%2,r=Math.floor(i/2),x=X+14+c*(sw+14),y=y0+r*pitch;ctx.fillStyle=T.cols[i];rr(ctx,x,y,sw,shh,5);ctx.fill();ctx.strokeStyle='#bdb8aa';ctx.lineWidth=1;rr(ctx,x,y,sw,shh,5);ctx.stroke();
    txt(ctx,t==='ph'?'pH '+v:v+' ppm',x+sw/2,y+shh+fs+1,{s:fs,w:600,c:'#222',a:'center'});});}
function wGuide(ctx,lines,title,k){const X=566,Y=46,W=226,H=340,narrow=k>1.35,fs=Math.min(13*k,narrow?20:18);lines=lines.filter(L=>!(narrow&&L.wide)).map(L=>narrow&&L.n?Object.assign({},L,{t:L.n}):L);ctx.fillStyle='#fbfaf6';rr(ctx,X,Y,W,H,10);ctx.fill();ctx.strokeStyle='#b9b4a6';ctx.lineWidth=1.5;rr(ctx,X,Y,W,H,10);ctx.stroke();
  txt(ctx,title,X+W/2,Y+24,{s:Math.min(14*k,20),w:700,c:'#222',a:'center'});let y=Y+(narrow?48:52);
  lines.forEach(L=>{if(L.sw){ctx.fillStyle=L.sw;rr(ctx,X+14,y-fs+2,30,fs+6,4);ctx.fill();ctx.strokeStyle='#9a9588';ctx.lineWidth=1;rr(ctx,X+14,y-fs+2,30,fs+6,4);ctx.stroke();y=wWrap(ctx,L.t,X+52,y+2,W-64,fs,{c:'#222',w:L.b?700:400})+6;}
    else y=wWrap(ctx,L.t,X+14,y,W-28,fs,{c:'#222',w:L.b?700:400})+6;});}
function drawWQ(sim,ctx,vdt,k,t){const D=wqD(sim),b=sim.vlab.bench,p=sim.p,u=b.tube;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);if(!D)return;
  if(p.wqView==='sheet'){drawSheet(sim,ctx,k);return;}
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,394,800,56);ctx.fillStyle=PAL['line'];ctx.fillRect(0,394,800,2);
  txt(ctx,'Group '+D.grp+' · your test: '+WQT[D.asg].n,16,30,{s:Math.min(16*k,24),w:700});
  // the three sample bottles
  ['A','B','C'].forEach((s,i)=>wBottle(ctx,48+i*66,262,s,WQ_LOOK[D.src[s]],WQ_HAZE[D.src[s]],u?u.s===s:p.wqSample===s,k));
  txt(ctx,'Samples',114,420,{s:Math.min(13*k,20),w:600,a:'center',c:PAL['cv-soft']});
  const fsl=Math.min(13*k,20),cx=300;
  if(!u){ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;rr(ctx,250,330,100,64,6);ctx.stroke();for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(270+i*30,334,10,4,0,0,6.29);ctx.stroke();}
    txt(ctx,'Test tube rack',cx,420,{s:fsl,w:600,a:'center',c:PAL['cv-soft']});}
  else{const T=WQT[u.test],c=wqTubeRGB(sim,u),bt=b.t;
    if(T.kind==='meter'){const top=300,x=cx-48;ctx.fillStyle=css(c,0.85);ctx.fillRect(x+4,top+18,88,62);ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x+6,top+84);ctx.lineTo(x+90,top+84);ctx.lineTo(x+96,top);ctx.stroke();
      if(u.st==='probe'){ctx.fillStyle='#9aa3ab';ctx.fillRect(cx-3,170,6,top+70-170);ctx.fillStyle='#3a3e45';rr(ctx,cx-10,150,20,30,4);ctx.fill();ctx.strokeStyle=PAL['cv-lamp']||PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,152);ctx.bezierCurveTo(cx,90,420,90,440,120);ctx.stroke();}}
    else if(u.test==='do'&&(u.st==='filled'||u.st==='reagent')){const x=cx-34,top=178,w=68,h=206;ctx.fillStyle=css(c,0.9);rr(ctx,x+3,top+40,w-6,h-43,10);ctx.fill();
      if(u.st==='reagent'){ctx.fillStyle='rgba(120,70,30,.75)';for(let i=0;i<40;i++){const fx=x+8+((i*37)%(w-16)),fy=top+60+((i*53)%(h-80));ctx.beginPath();ctx.arc(fx,fy,2.4,0,6.29);ctx.fill();}}
      ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx-10,top);ctx.lineTo(cx-10,top+24);ctx.quadraticCurveTo(x,top+28,x,top+48);ctx.lineTo(x,top+h);ctx.lineTo(x+w,top+h);ctx.lineTo(x+w,top+48);ctx.quadraticCurveTo(x+w,top+28,cx+10,top+24);ctx.lineTo(cx+10,top);ctx.stroke();
      ctx.fillStyle='#3d5a80';rr(ctx,cx-13,top-12,26,14,3);ctx.fill();}
    else{const x=cx-23,top=150,w=46,BOT=384,fill=BOT-150;ctx.fillStyle=css(c,0.92);ctx.fillRect(x+3,BOT-fill,w-6,fill-4);
      if(T.kind==='pa'&&u.st==='ready'&&u.present){ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1.2;for(let i=0;i<9;i++){ctx.beginPath();ctx.arc(x+10+((i*13)%26),BOT-30-((i*47)%(fill-40)),2+(i%3),0,6.29);ctx.stroke();}}
      if(u.st==='reagent'&&u.test!=='ph'&&T.kind!=='titr'){ctx.fillStyle='#f2f0ea';ctx.beginPath();ctx.ellipse(cx,BOT-10,12,5,0,0,6.29);ctx.fill();ctx.strokeStyle='#b4ae9e';ctx.lineWidth=1;ctx.stroke();}
      ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,top-8);ctx.lineTo(x,BOT-10);ctx.quadraticCurveTo(x,BOT+4,cx,BOT+4);ctx.quadraticCurveTo(x+w,BOT+4,x+w,BOT-10);ctx.lineTo(x+w,top-8);ctx.stroke();
      ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-6,BOT-fill);ctx.lineTo(x+12,BOT-fill);ctx.stroke();txt(ctx,T.kind==='titr'?(u.test==='do'?'20 mL':'5 mL'):(T.vol||'10 mL'),x-10,BOT-fill+5,{s:Math.min(12*k,18),c:PAL['cv-soft'],a:'right'});
      if(u.st!=='filled'&&T.kind!=='titr'){ctx.fillStyle='#3d5a80';rr(ctx,x-2,top-22,w+4,16,4);ctx.fill();}
      if(T.kind==='titr'&&u.st==='titrate'){ctx.fillStyle='#e9eef2';rr(ctx,cx-9,60,18,70,4);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.5;rr(ctx,cx-9,60,18,70,4);ctx.stroke();ctx.fillStyle='#e9eef2';ctx.beginPath();ctx.moveTo(cx-5,130);ctx.lineTo(cx,144);ctx.lineTo(cx+5,130);ctx.fill();}}
    txt(ctx,(WQT[u.test].sh||WQT[u.test].n)+' · Sample '+u.s,cx,420,{s:fsl,w:700,a:'center'});
    // instruments in the middle
    const LX=376,LW=176;
    if(T.kind==='card'&&T.wait>0&&(u.st==='timing'||u.st==='ready'))wLcd(ctx,LX,52,LW,104,'KIT TIMER',u.st==='ready'?'0:00':wmmss(T.wait-(bt-u.t0)),k,40);
    if(T.kind==='titr'&&u.st==='titrate')wLcd(ctx,LX,52,LW,104,'DROPS ADDED',String(u.D),k,44);
    if(T.kind==='meter'&&u.st==='probe')wLcd(ctx,LX,52,LW,104,u.test==='temp'?'THERMOMETER':'TDS METER',u.test==='temp'?wqMeter(sim,u).toFixed(1)+' °C':wqMeter(sim,u)+' ppm',k,38);
    if(T.kind==='pa'&&(u.st==='mixed'||u.st==='ready'))wLcd(ctx,LX,52,LW,104,'INCUBATOR 35 °C',u.st==='ready'?'24 h':'0 h',k,40);
    if(u.st==='ready'&&T.kind==='card')pill(ctx,k>1.35?'Read the card':'Compare with the card',LX+LW/2,186,PAL['rj'],'#fff',Math.min(13*k,19));
    if(u.st==='ready'&&T.kind==='pa')pill(ctx,'24 hours later',LX+LW/2,186,PAL['rj'],'#fff',Math.min(13*k,19));
    if(T.kind==='titr'&&u.st==='titrate'&&wqShade(u)<=0)pill(ctx,'Color change',LX+LW/2,186,PAL['rj'],'#fff',Math.min(13*k,19));
    if(T.kind==='meter'&&u.rec)pill(ctx,'Reading settled',LX+LW/2,186,PAL['rj'],'#fff',Math.min(13*k,19));}
  // the right-hand card for the test in the tube (or the one you have chosen)
  const tt=u?u.test:p.wqTest,T=WQT[tt];
  if(T.kind==='card')wCard(ctx,sim,tt,u,k);
  else if(tt==='do')wGuide(ctx,[{t:'Titration guide',b:true,wide:1},{sw:'#b0702a',t:'Yellow-brown: add titrant, counting drops',n:'Yellow-brown: titrate'},{sw:'#f0eed6',t:'Pale yellow: add the starch',n:'Pale yellow: add starch'},{sw:'#26347f',t:'Blue: add 1 drop at a time',n:'Blue: 1 drop at a time'},{sw:'#eef1f3',t:'Clear: end point'},{t:'Each drop = 0.2 ppm',b:true}],k>1.35?'DO kit':'Dissolved oxygen kit',k);
  else if(tt==='hard')wGuide(ctx,[{t:'Titration guide',b:true,wide:1},{sw:'#a02c56',t:'Wine red: calcium and magnesium still free',n:'Red: keep adding'},{sw:'#6a4a9c',t:'Purple: almost there'},{sw:'#2e60b6',t:'Blue: end point'},{t:'Each drop = 10 ppm as CaCO₃',b:true,n:'1 drop = 10 ppm'}],'Hardness kit',k);
  else if(tt==='coli')wGuide(ctx,[{t:'After 24 hours at 35 °C:',b:true},{sw:'#a83e70',t:'Red-purple: no coliform found',n:'Red-purple: none found'},{sw:'#e4c43a',t:'Yellow, often with gas bubbles: coliform present',n:'Yellow: coliform present'}],'Coliform vial',k);
  else wGuide(ctx,tt==='temp'?[{t:'Digital thermometer',b:true},{t:'Reads to 0.1 °C.'},{t:'Wait about 30 s for the number to stop changing, then read it.',n:'Wait for the number to settle.'}]:[{t:'TDS meter',b:true},{t:'Reads total dissolved solids in ppm (mg/L).',n:'Reads ppm (mg/L).'},{t:'Wait for the number to stop changing, then read it.',n:'Wait for the number to settle.'}],tt==='temp'?'Temperature':'TDS',k);}
function drawSheet(sim,ctx,k){const D=wqD(sim),V=sim.vlab,narrow=k>1.35,z=Math.min((narrow?12.5:12.5)*k,21);
  txt(ctx,'Class spreadsheet · water quality',16,26,{s:Math.min(15*k,22),w:700});txt(ctx,'Samples may differ by class',784,26,{s:Math.min(12*k,17),c:PAL['cv-soft'],a:'right'});
  const top=40,hh=32,rh=narrow?34:33,cs=narrow?[[8,84],[92,326],[418,124],[542,124],[666,126]]:[[16,100],[116,300],[416,124],[540,124],[664,120]];
  const N=D.rows.length,x0=cs[0][0],x1=cs[4][0]+cs[4][1];ctx.fillStyle=PAL['card'];ctx.fillRect(x0,top,x1-x0,hh+N*rh);ctx.fillStyle=PAL['card2'];ctx.fillRect(x0,top,x1-x0,hh);
  const yi=D.rows.findIndex(r=>r.you);if(yi>=0){ctx.fillStyle='rgba(193,20,48,.10)';ctx.fillRect(x0,top+hh+yi*rh,x1-x0,rh);}
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;for(let r=0;r<=N;r++){const y=Math.round(top+hh+r*rh)+.5;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();}
  cs.forEach(c=>{ctx.beginPath();ctx.moveTo(Math.round(c[0])+.5,top);ctx.lineTo(Math.round(c[0])+.5,top+hh+N*rh);ctx.stroke();});ctx.beginPath();ctx.moveTo(x1+.5,top);ctx.lineTo(x1+.5,top+hh+N*rh);ctx.stroke();
  const cell=(s,c,y,o)=>{o=o||{};ctx.save();ctx.beginPath();ctx.rect(c[0]+1,y-rh/2,c[1]-2,rh);ctx.clip();txt(ctx,s,o.l?c[0]+8:c[0]+c[1]/2,y+1,{s:z,w:o.w||400,c:o.c||PAL['cv-ink'],a:o.l?'left':'center',b:'middle'});ctx.restore();};
  ['Group','Test','Sample A','Sample B',narrow?'C (ext.)':'C (extension)'].forEach((h,i)=>cell(h,cs[i],top+hh/2,{w:700,l:i===1}));
  D.rows.forEach((r,i)=>{const y=top+hh+i*rh+rh/2,col=r.you?PAL['rj']:PAL['cv-ink'],T=WQT[r.t],lab=narrow?(T.sh||T.n)+(T.u?' ('+(r.t==='hard'?'ppm':T.u)+')':''):wqLabel(r.t);
    cell(r.you?r.g+' (you)':String(r.g),cs[0],y,{w:r.you?700:400,c:col});cell(lab,cs[1],y,{l:1,c:col});
    ['A','B','C'].forEach((s,j)=>{let v;if(r.you){const raw=r.t==='coli'?V.raw('c:col:'+s.toLowerCase()+':0'):V.raw('c:rd:'+s.toLowerCase()+':'+WQ_RD.indexOf(r.t));v=raw?(r.t==='coli'?(raw==='P'?'Present':'Absent'):raw):'?';}
      else v=typeof r.v[s]==='number'?fmtV(r.t,r.v[s]):r.v[s];cell(v,cs[2+j],y,{c:col,w:r.you?700:400});});});
  txt(ctx,narrow?'Your row fills in from your readings table.':'Each group ran one test on every sample. Your row (red) fills in from your readings table.',400,top+hh+N*rh+18,{s:Math.min(12*k,17),c:PAL['cv-soft'],a:'center'});}
function wqNarrate(sim){const D=wqD(sim),b=sim.vlab.bench,p=sim.p,u=b.tube;if(!D)return '';
  if(p.wqView==='sheet')return '<b>Class spreadsheet.</b> Each group ran one test on Samples A, B and C. Your group’s row fills in from your readings table. If a group’s numbers look impossible, run that test yourself.';
  if(!u)return '<b>Ready for a test.</b> Choose a test and a sample, then press <b>Fill to the line</b>. Your group’s assigned test is '+WQT[D.asg].n.toLowerCase()+'.';
  const T=WQT[u.test],h='<b>'+T.n+', Sample '+u.s+'.</b> ',bt=b.t;
  if(T.kind==='card'){if(u.st==='filled')return h+'The tube is filled to the '+T.vol+' line. Next: add '+T.reag+'.';
    if(u.st==='reagent')return h+'The reagent is in. Next: cap the tube and mix'+(T.wait?' until the tablet dissolves. The timer starts when you mix.':'.');
    if(u.st==='timing')return h+'The color is developing. Wait for the timer ('+wmmss(T.wait-(bt-u.t0))+' left) before you compare it with the card.';
    return h+'<b>Read it now.</b> Compare your tube with the color card and find the closest color. Record that value in your readings table, then empty and rinse the tube.';}
  if(T.kind==='pa'){if(u.st==='filled')return h+'The sterile vial is filled to the 10 mL line. Next: drop in the coliform tablet.';if(u.st==='reagent')return h+'Next: cap the vial and swirl until the tablet dissolves.';
    if(u.st==='mixed')return h+'The vial is red-purple. Next: incubate it for 24 hours at about 35 °C, so any coliform bacteria can grow.';
    return h+'<b>24 hours later.</b> Yellow means coliform bacteria are present; red-purple means none were found. Record Present or Absent.';}
  if(T.kind==='meter'){if(u.st==='filled')return h+'The sample is in a clean cup. Next: put in the '+(u.test==='temp'?'thermometer':'TDS meter')+' probe.';
    return h+(u.rec?'<b>The reading has settled.</b> Record it in your readings table, then empty and rinse the cup.':'Wait for the reading to stop changing before you record it.');}
  if(u.test==='do'){if(u.st==='filled')return h+'The 25 mL bottle is filled to the top with no air bubble, so no air oxygen gets in. Next: add the two fixing reagents.';
    if(u.st==='reagent')return h+'A brown precipitate forms: it fixes the dissolved oxygen. Next: cap and mix. This also adds the acid and pours 20 mL into the titration tube.';
    const sh=wqShade(u);if(sh<=0)return h+(u.starch?'<b>End point.</b> The blue is gone. Use your drop count: DO (ppm) = drops × 0.2. Record it, then empty and rinse.':'The color is gone. That is past the pale-yellow stage, so you may have added too many drops. Empty and rinse, then run the test again and slow down near the end.');
    return h+(u.starch?'Blue: the starch shows iodine is left. Add 1 drop at a time and count until the blue disappears.':sh>0.3?'Yellow-brown: iodine released by the oxygen. Add titrant and count every drop. 10 at a time is fine while the color is dark.':'Pale yellow: add the starch indicator now, then go 1 drop at a time.');}
  if(u.st==='filled')return h+'The tube is filled to the 5 mL line. Next: add the hardness buffer and indicator.';if(u.st==='reagent')return h+'Next: cap and mix.';
  const sh=wqShade(u);return h+(sh<=0?'<b>End point: blue.</b> Use your drop count: hardness (ppm as CaCO₃) = drops × 10. Record it, then empty and rinse.':sh<1?'Purple: you are close. Add 1 drop at a time.':'Wine red: calcium and magnesium are still free. Add titrant and count the drops until the color turns blue.');}
/* ---------- the lab, from Weed's and Brown's APES handouts ---------- */
const WQ_KIT={
  ph:'<ol><li>Rinse a test tube with the sample, then fill it to the 10 mL line (<b>Fill to the line</b>).</li><li>Add 10 drops of wide-range pH indicator (<b>Add the reagent</b>).</li><li>Cap the tube and turn it over a few times to mix (<b>Cap and mix</b>). The color appears right away.</li><li>Hold the tube against the pH color card. Find the closest color and record that pH.</li></ol>',
  no3:'<ol><li>Fill a test tube to the 5 mL line with the sample.</li><li>Add one nitrate reagent tablet.</li><li>Cap and mix until the tablet dissolves. The kit timer starts.</li><li>Wait 5 minutes while the pink color develops.</li><li>Compare with the nitrate color card (0, 5, 10, 20 and 40 ppm) and record the closest value.</li></ol>',
  po4:'<ol><li>Fill a test tube to the 10 mL line with the sample.</li><li>Add one phosphate reagent tablet.</li><li>Cap and mix until the tablet dissolves. The kit timer starts.</li><li>Wait 5 minutes while the blue color develops.</li><li>Compare with the phosphate color card (0, 1, 2 and 4 ppm) and record the closest value.</li></ol>',
  nh3:'<ol><li>Fill a test tube to the 10 mL line with the sample.</li><li>Add the two ammonia reagent tablets.</li><li>Cap and mix until they dissolve. The kit timer starts.</li><li>Wait 5 minutes while the green color develops.</li><li>Compare with the ammonia color card (0, 0.5, 1, 2 and 4 ppm) and record the closest value.</li></ol>',
  do:'<ol><li>Fill the 25 mL sample bottle all the way to the top, so no air bubble is trapped. Air would add oxygen.</li><li>Add the two fixing reagents. A brown precipitate forms as the reagents fix the dissolved oxygen.</li><li>Cap and mix. On the virtual bench this step also adds the acid, which dissolves the precipitate and leaves a yellow-brown solution, and pours 20 mL into the titration tube.</li><li>Add titrant and count every drop. While the color is dark you may add 10 drops at a time. When it turns pale yellow, add the starch indicator: the solution turns blue.</li><li>Add 1 drop at a time until the blue disappears. That is the end point.</li><li>Dissolved oxygen (ppm) = number of drops × 0.2.</li></ol>',
  hard:'<ol><li>Fill a test tube to the 5 mL line with the sample.</li><li>Add the hardness buffer and indicator. Calcium and magnesium turn it wine red.</li><li>Cap and mix.</li><li>Add titrant 1 drop at a time, counting, until the color changes from red through purple to blue.</li><li>Hardness (ppm as CaCO₃) = number of drops × 10.</li></ol>',
  tds:'<ol><li>Pour the sample into a clean cup (<b>Fill to the line</b>).</li><li>Put in the TDS meter probe.</li><li>Wait for the number to stop changing, then record it in ppm.</li></ol>',
  temp:'<ol><li>Pour the sample into a clean cup (<b>Fill to the line</b>).</li><li>Put in the digital thermometer probe.</li><li>Wait about 30 seconds for the reading to settle, then record it to 0.1 °C.</li></ol>',
  coli:'<ol><li>Fill a sterile coliform vial to the 10 mL line. Do not touch the inside of the cap.</li><li>Drop in the coliform tablet.</li><li>Cap and swirl until it dissolves. The vial is red-purple.</li><li>Incubate the vial for 24 hours at about 35 °C (<b>Incubate 24 hours</b>).</li><li>Yellow, often with gas bubbles, means coliform bacteria are present. Red-purple means none were found. Record Present or Absent.</li></ol>'};
const wqRan=(V,t,S)=>!!((V.bench.done||{})[t+':'+S]||[]).length;
const wqHas=(V,t,S)=>t==='coli'?V.raw('c:col:'+S.toLowerCase()+':0')!=='':V.raw('c:rd:'+S.toLowerCase()+':'+WQ_RD.indexOf(t)).trim()!=='';
const wqSet=(sim,o)=>BioLab.setValues(sim,o);
function wqOnce(sim,i,o){const b=sim.vlab&&sim.vlab.bench;if(!b)return;b.entered=b.entered||{};if(b.entered[i])return;b.entered[i]=1;if(b.tube)delete o.wqTest,delete o.wqSample;wqSet(sim,o);}
function wqKitStep(o){Object.defineProperty(o,'controls',{get(){return wqCtl(WQCUR);},enumerable:true});return o;}
const WQ_TESTOPTS=WQ_ORDER.map(t=>({v:t,l:wqName(t)}));
const wqSel=id=>sim=>{if(sim.vlab&&sim.st&&sim.st.W&&sim.vlab.lab.id==='waterquality'){const b=sim.vlab.bench;b.sel=b.sel||{};b.sel[id]=sim.p[id];}};
const wqRefTable='<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:.92em;min-width:520px"><thead><tr>'+['Test','What it tells you','Reference values'].map(h=>'<th style="text-align:left;white-space:normal;border:1px solid rgba(128,128,128,.55);padding:4px 6px">'+h+'</th>').join('')+'</tr></thead><tbody>'+
  [['pH','How acidic or basic the water is.','Aquatic life: best at 6.5 to 8.2. Drinking water: 6.5 to 8.5.'],
   ['Temperature','Warmer water holds less dissolved oxygen.','The tolerance depends on the organism.'],
   ['Dissolved oxygen (DO)','Oxygen gas dissolved in the water. BOD is the oxygen demanded by microbes as they decompose organic matter.','Organisms need at least 7 ppm.'],
   ['Nitrate (NO₃⁻)','From fertilizer and organism waste.','Natural freshwater: under 1.0 ppm. Trout: under 0.06 ppm. Drinking water: under 10.0 ppm. Sewage effluent: about 30 ppm.'],
   ['Phosphate (PO₄³⁻)','From rocks, animal waste, fertilizers and detergents.','Natural: under 0.03 ppm. Over 0.1 ppm: impact on the ecosystem likely. Over 0.5 ppm: impact certain. Drinking water: under 0.5 ppm. Sewage effluent: 5 to 30 ppm.'],
   ['Ammonia (NH₃)','From animal waste and decomposition. Toxic to fish. (Not in the PowerPoint.)','EPA’s long-term limit for freshwater life is about 1.9 ppm at pH 7 and 20 °C. There is no EPA drinking-water limit.'],
   ['Alkalinity and hardness (as CaCO₃)','Dissolved calcium and magnesium.','Drinking water: under 200 ppm. 0 to 60 soft, 60 to 120 medium, 120 to 180 hard, over 180 very hard.'],
   ['Turbidity and TDS (ppm)','Clarity and dissolved solids. Cloudy water blocks sunlight.','EPA’s secondary drinking-water standard for TDS: 500 ppm.'],
   ['Fecal coliform (E. coli)','Bacteria from animal waste.','Drinking water: under 4 colonies per 100 mL. Shellfish: under 70. Recreation: under 100.']]
  .map(r=>'<tr>'+r.map((c,i)=>'<td style="text-align:left;white-space:normal;border:1px solid rgba(128,128,128,.55);padding:4px 6px;vertical-align:top">'+(i?c:'<b>'+c+'</b>')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
const LAB_WQ={id:'waterquality',title:'Water Quality Lab: Which Sample Is from the Turtle Tank?',course:'AP Environmental Science',teachers:'Weed, Brown',
  source:{label:'Water Quality Lab.docx',href:'https://rjhs.instructure.com/courses/14902/assignments/578961'},level:'ap',
  purpose:'<p>Learn about and perform various water quality tests to determine which water sample is from the turtle tank. Practice using evidence to justify a claim.</p>',
  background:'<p><b>Your task.</b> You will be given 2 samples of water. Determine which sample is from the turtle tank and which is tap water, using the results of various water quality tests.</p>'+
    '<p><b>Day 1:</b> complete your assigned water quality test and record your data on the class spreadsheet. <b>Day 2:</b> complete the worksheet, using the class data. If you were absent, use the spreadsheet data.</p>'+
    '<p>Two federal laws, both carried out by the EPA, protect US water. The <b>Clean Water Act</b> works to restore and maintain the chemical, physical and biological integrity of the nation’s waters: it protects fish, shellfish and wildlife and water for recreation, requires permits for discharges into waters, and covers the cleanup of oil and hazardous-substance spills. The <b>Safe Drinking Water Act</b> sets the limits for contaminants in drinking water.</p>'+
    '<p><b>Reference values</b>, from the Water Quality Tests and Legislation PowerPoint. Use them, and the EPA drinking water standards, to judge each result.</p>'+wqRefTable+
    '<p><b>About the virtual samples.</b> Samples A and B are Denver-area tap water and turtle-tank water, assigned at random for each student, so your A and B may not match a classmate’s. Sample C, pond or stream water, is the extension that Ms. Brown’s classes test (<a href="https://rjhs.instructure.com/courses/15145/assignments/558805" target="_blank" rel="noopener">Brown’s Water Quality Lab</a>). The values follow real water: Denver Water raises the pH of tap water to about 8 to 9 to control lead, and tap water carries almost no nitrate, phosphate or bacteria. A turtle tank collects waste, so it is high in ammonia, nitrate and phosphate, lower in oxygen, cloudier, and full of bacteria.</p>'+
    '<p>The kit tests work like a real kit, simplified. A color test reads in steps: you hold the tube against the printed card and pick the closest color, so a reading is only as fine as the card. The colors on a screen are not exactly the printed card’s colors. The DO titration uses about 0.01 N titrant on 20 mL of sample, so each drop is 0.2 ppm. The hardness titration uses about 0.01 M titrant on 5 mL, so each drop is 10 ppm. Your water has small random differences from run to run, as in a real lab. At 1× speed, the kit timer runs 20 times faster than real time, and the 24-hour coliform incubation is skipped ahead.</p>',
  materials:['2 water samples, A and B (plus Sample C, pond or stream water, as an extension)','Water quality test kit: test tubes with fill lines, reagent tablets and drops, and printed color cards','Dissolved oxygen kit: 25 mL sample bottle, fixing reagents, titrant and starch indicator','Hardness titration reagents','TDS meter and digital thermometer','Coliform vials and a 35 °C incubator','The class spreadsheet','Water Quality Tests and Legislation PowerPoint (the reference values are in your Background) and the EPA drinking water standards'],
  hypothesis:{prompt:'<p>Before you test: how do you expect turtle-tank water to differ from tap water? Name two tests you expect to show the biggest difference, and explain why.</p>'},
  setup(sim){WQCUR=sim;const b=sim.vlab.bench;if(!Number.isFinite(b.t))b.t=0;b.done=b.done||{};if(b.sel)wqSet(sim,b.sel);BioLab.refresh(sim);},
  teardown(){WQCUR=null;},
  controls:['wqView','wqTest','wqSample','wq-fill','wq-reag','wq-mix','wq-probe','wq-incub','wq-d10','wq-d1','wq-starch','wq-rinse'],
  steps:[
    {title:'Your task',get text(){const D=wqCur();return '<p>You will be given 2 samples of water. Determine which sample is from the turtle tank and which is tap water, using the results of various water quality tests.</p><p>The bench has Samples A and B, plus Sample C (pond or stream water) for the extension. The class splits up the tests. You are in <b>Group '+(D?D.grp:'')+'</b>, and your group is assigned the <b>'+(D?WQT[D.asg].n.toLowerCase():'')+'</b> test. Follow the kit instructions and record your results on the class spreadsheet.</p>';},
     controls:['wqView'],setup(sim){wqOnce(sim,0,{wqView:'bench'});}},
    {title:'Initial tests',text:'<p>In the <b>Initial tests</b> table below the bench, write <b>Test 1</b>, your group’s assigned test, and its purpose: what it tells you about the water. Then choose <b>Test 2</b>, one more test you will run yourself, and write its purpose. The Background has notes on each test.</p>',
     controls:['wqView'],done:sim=>['c:plan:test:0','c:plan:test:1','c:plan:why:0','c:plan:why:1'].every(k=>sim.vlab.raw(k).trim()!==''),doneHint:'Fill in both rows of the Initial tests table.'},
    ...['A','B'].map((S,j)=>wqKitStep({title:'Day 1: your test on Sample '+S,get text(){const D=wqCur(),t=D?D.asg:'ph';return '<p>Run the <b>'+WQT[t].n.toLowerCase()+'</b> test on <b>Sample '+S+'</b>. Follow the kit instructions:</p>'+WQ_KIT[t]+'<p>Record your result in the <b>'+(t==='coli'?'Coliform':'Your readings')+'</b> table, in the Sample '+S+' column. Then press <b>Empty and rinse</b>.</p>';},
      setup(sim){const D=wqD(sim);if(D)wqOnce(sim,2+j,{wqTest:D.asg,wqSample:S,wqView:'bench'});},
      done:sim=>{const D=wqD(sim),V=sim.vlab;return !!D&&wqRan(V,D.asg,S)&&wqHas(V,D.asg,S);},
      doneHint:sim=>{const D=wqD(sim),V=sim.vlab;if(!D)return '';return !wqRan(V,D.asg,S)?'Run the '+WQT[D.asg].n.toLowerCase()+' test on Sample '+S+' all the way through.':'Record your Sample '+S+' result in your notebook table.';}})),
    wqKitStep({title:'Record on the class spreadsheet',text:'<p>Record your data on the class spreadsheet. Choose <b>Look at: Class spreadsheet</b>. Your group’s row fills in from your readings table, and the other groups’ results are already there.</p><p>Look over every group’s numbers. Do they make sense for water? If a group’s data look impossible, run that test yourself.</p>',
     setup(sim){wqOnce(sim,4,{wqView:'sheet'});}}),
    wqKitStep({title:'Run Test 2',text:'<p>Run your <b>Test 2</b> on Samples A and B, and record both results. You may run more tests too: the kit has every test, and you can repeat a test you doubt.</p><p>The kit instructions for every test are listed under <b>How each kit test works</b> in the Background.</p>',
      setup(sim){const t=sim.vlab.raw('c:plan:test:1'),D=wqD(sim);wqOnce(sim,5,{wqTest:WQT[t]?t:WQ_ORDER.find(x=>D&&x!==D.asg),wqSample:'A',wqView:'bench'});},
      done:sim=>{const D=wqD(sim),V=sim.vlab;return !!D&&WQ_ORDER.some(t=>t!==D.asg&&['A','B'].every(S=>wqRan(V,t,S)&&wqHas(V,t,S)));},doneHint:'Run one more test on both Sample A and Sample B, and record both results.'}),
    wqKitStep({title:'Extension: Sample C',text:'<p><b>Optional.</b> Ms. Brown’s classes test three samples. Run your tests on <b>Sample C</b>, water from a pond or stream, and record the results in the Sample C column. The class spreadsheet has Sample C too.</p>',
      setup(sim){wqOnce(sim,6,{wqSample:'C',wqView:'bench'});}}),
    wqKitStep({title:'Day 2: evidence',text:'<p>Complete the <b>evidence table</b> with <b>at least two</b> pieces of evidence. For each, choose the water quality test, write the Sample A and Sample B values (your own, or from the class spreadsheet), and say how each compares with the EPA standard in the reference values.</p>',
     setup(sim){wqOnce(sim,7,{wqView:'sheet'});},
     done:sim=>[0,1,2,3].filter(r=>['test','a','b','epa'].every(c=>sim.vlab.raw('c:ev:'+c+':'+r).trim()!=='')).length>=2,doneHint:'Fill in every column of at least two rows of the evidence table.'}),
    wqKitStep({title:'Day 2: graph',text:'<p>Fill in the <b>graph table</b>: each test as a percent of its reference value.</p><p><b>Percent of the reference = reading ÷ reference value × 100.</b> Use your own readings, or the class spreadsheet for a test you did not run.</p><p>The scale puts every test on one graph, even though the units differ. A bar at 100% is right at the reference. For nitrate, phosphate, ammonia, hardness and TDS the reference is an upper limit, so a bar over 100% is over the limit. For DO the reference is a minimum, so a bar under 100% means too little oxygen for most organisms. pH, temperature and coliform are not on the graph: pH has a range, temperature has no single limit, and the coliform test reads present or absent.</p>'}),
    wqKitStep({title:'Analysis and conclusion',text:'<p>Answer the <b>analysis questions</b>. Then write your conclusion: a <b>claim</b> (one sentence indicating which sample is from the turtle tank), your <b>evidence</b> (point to your evidence table), and your <b>reasoning</b> (a paragraph explaining how your evidence supports your claim, using relevant concepts and vocabulary).</p>'})],
  tables:[
    {id:'plan',title:'Initial tests',cols:[{id:'n',label:'Test',rows:[1,2],rowLabels:['Test 1 (your group’s test)','Test 2 (your choice)']},{id:'test',label:'Water quality test',input:'select',options:WQ_TESTOPTS,check:wqPlanCheck},{id:'why',label:'Purpose: what it tells you about the water',input:'text'}]},
    {id:'rd',title:'Your readings: record each test you ran',cols:[{id:'t',label:'Test',rows:WQ_RD.map(wqLabel)},{id:'a',label:'Sample A',input:'number',check:wqRdCheck('A')},{id:'b',label:'Sample B',input:'number',check:wqRdCheck('B')},{id:'c',label:'Sample C (extension)',input:'number',check:wqRdCheck('C')}]},
    {id:'col',title:'Coliform: 24-hour presence/absence vial',cols:[{id:'t',label:'Test',rows:['Coliform bacteria']},...['A','B','C'].map(S=>({id:S.toLowerCase(),label:S==='C'?'Sample C (extension)':'Sample '+S,input:'select',options:[{v:'P',l:'Present'},{v:'A',l:'Absent'}],check:wqPaCheck(S)}))]},
    {id:'ev',title:'Evidence: at least two water quality tests',cols:[{id:'n',label:'Evidence',rows:[1,2,3,4],rowLabels:['1','2','3 (optional)','4 (optional)']},{id:'test',label:'Water quality test',input:'select',options:WQ_TESTOPTS,check:wqRowRecheck('ev',['a','b'])},
      {id:'a',label:'Sample A value',input:'text',check:wqEvCheck('A')},{id:'b',label:'Sample B value',input:'text',check:wqEvCheck('B')},{id:'epa',label:'How it compares to the EPA standard',input:'text'}]},
    {id:'pct',title:'Graph table: each test as a percent of its reference value',cols:[{id:'t',label:'Test',rows:WQREF.map(r=>r.l)},{id:'ref',label:'Reference value',rows:WQREF.map(r=>r.rl)},
      ...['A','B','C'].map(S=>({id:S.toLowerCase(),label:'Sample '+S+(S==='C'?' (extension)':'')+': % of reference',input:'number',check:wqPctCheck(S)}))]}],
  observations:['A','B','C'].map(S=>({id:'look'+S,label:'Sample '+S+(S==='C'?' (extension)':'')+': color and clarity'})),
  graph:{type:'bar',title:'Each test as a percent of its reference value',xl:'Water quality test',yl:'Percent of the reference (%)',ymin:0,
    series:[{table:'pct',x:'t',y:'a',label:'Sample A'},{table:'pct',x:'t',y:'b',label:'Sample B'},{table:'pct',x:'t',y:'c',label:'Sample C (extension)'}]},
  questions:[
    {id:'q1',n:'Analysis 1',q:'<p>Identify which water sample goes with which source (tap water, turtle tank and, in the extension, pond or stream water). Explain your reasoning.</p>'},
    {id:'q2',n:'Analysis 2',q:'<p>Identify one test we did not perform in class. Describe how that information would be useful in evaluating water quality for a site.</p>'},
    {id:'q3',n:'Analysis 3',q:'<p>Identify a test you would perform on drinking water that we did not perform. Explain what would be learned.</p>'},
    {id:'q4',n:'Analysis 4',q:'<p>Someone says, “If water is clear, it is okay to drink.” Make a claim to defend or refute this statement.</p>'}],
  conclusion:{prompt:'<p>Which sample is from the turtle tank? <b>Claim:</b> one sentence indicating which sample is from the turtle tank. <b>Evidence:</b> at least two pieces of evidence from your evidence table. <b>Reasoning:</b> a paragraph explaining how your evidence supports your claim, using relevant concepts and vocabulary.</p>',cer:true}};
/* the kit instructions for every test, at the end of the background */
LAB_WQ.background+='<p><b>How each kit test works.</b> The bench caption under the bench always tells you the next kit step.</p>'+WQ_ORDER.map(t=>'<p><b>'+wqName(t)+'</b></p>'+WQ_KIT[t]).join('');

const SIM={
  id:'eutrophication',hash:'eutrophication',apUnit:14,order:3,kind:'Simulation',tab:'Eutrophication and dead zones',
  card:'Wash fertilizer into a lake and follow it: algae bloom, die and rot, and the bottom water runs out of oxygen.',
  title:'Eutrophication: from fertilizer to dead zone',
  lede:{bio:'Fertilizer that washes off farm fields feeds algae in a lake. The algae boom, die and rot, and the rotting uses up the oxygen that fish need. Watch it happen step by step.',
        honors:'Find the limiting nutrient, see why the oxygen crash lags weeks behind the bloom, and test whether buffer strips and wetlands can protect the lake.',
        ap:'Track dissolved oxygen against saturation, biochemical oxygen demand (BOD) and stratification, and connect a single lake to the Gulf of Mexico dead zone.'},
  scale:{bio:'A farm-country lake about 1 km across and 10 m deep. A healthy lake has 7–10 mg of oxygen in every liter of water; most fish struggle below 2 mg/L.',
         ap:'A lake about 1 km across and 10 m deep. The Gulf of Mexico dead zone is the same process at about 15,000 km², fed by fertilizer from the whole Mississippi River basin.'},
  timeScale:3,dtMax:0.05,prewarm:120,sampleDt:0.25,window:60,unit:'days',timeLabel:'Day',clock:sim=>'Day '+Math.floor(sim.t),
  chChange:3,chReveal:35,
  controls:[
    {id:'runoff',label:'Fertilizer runoff',type:'range',min:0,max:100,step:1,def:10,unit:'%',lvl:'bio',help:'How much fertilizer washes off the farm fields when it rains'},
    {id:'temp',label:'Water temperature',type:'range',min:5,max:35,step:1,def:20,unit:' °C',lvl:'bio',help:'Warmer water holds less oxygen. Power-plant cooling water causes thermal pollution.'},
    {id:'sewage',label:'Sewage overflow',help:'Untreated sewage adds nutrients and rotting organic matter',type:'toggle',def:false,lvl:'honors'},
    {id:'buffer',label:'Buffer strips and wetlands',help:'Grass, trees and wetlands that trap runoff before it reaches the lake',type:'toggle',def:false,lvl:'honors'},
    {id:'nut',label:'Nutrients in the runoff',type:'seg',def:'both',lvl:'honors',options:[{v:'both',l:'N and P'},{v:'N',l:'Nitrogen only'},{v:'P',l:'Phosphorus only'}]},
    {id:'strat',label:'Summer stratification',help:'A warm surface layer floats on cold bottom water, and the layers stop mixing',type:'toggle',def:false,lvl:'ap'},
    // virtual lab bench only (hidden in the other views)
    {id:'wqView',label:'Look at',type:'seg',def:'bench',vlab:true,noTrial:true,options:[{v:'bench',l:'Test bench'},{v:'sheet',l:'Class spreadsheet'}],onChange:wqSel('wqView')},
    {id:'wqTest',label:'Test',type:'select',def:'ph',vlab:true,noTrial:true,options:WQ_TESTOPTS,onChange:wqSel('wqTest')},
    {id:'wqSample',label:'Sample',type:'seg',def:'A',vlab:true,noTrial:true,options:[{v:'A',l:'A'},{v:'B',l:'B'},{v:'C',l:'C (extension)'}],onChange:wqSel('wqSample')}
  ],
  actions:[{id:'storm',label:'Big rainstorm',lvl:'bio',run(sim){if(sim.st.W)return;const p=sim.p,b=p.buffer?0.4:1,run=Math.max(p.runoff,30)/100;sim.st.P+=40*run*b*(p.nut==='N'?0.05:1);sim.st.N+=300*run*b;sim.vis.storm=2.5;}}].concat(WQ_ACTIONS),
  labs:[LAB_WQ],
  /* what the bench shows right now (used by the virtual-lab tests) */
  benchRead(sim){const D=wqD(sim);if(!D)return null;const b=sim.vlab.bench,u=b.tube,p=sim.p;let tube=null;
    if(u){const T=WQT[u.test];tube={test:u.test,s:u.s,st:u.st,kind:T.kind};
      if(T.kind==='card'&&u.st==='ready')tube.closest=T.steps[clamp(Math.round(u.pos),0,T.steps.length-1)];
      if(T.kind==='titr'){tube.drops=u.D;tube.starch=u.starch;tube.shade=wqShade(u);tube.clear=u.st==='titrate'&&wqShade(u)<=0;}
      if(T.kind==='meter'&&u.st==='probe'){tube.display=wqMeter(sim,u);tube.settled=!!u.rec;}
      if(T.kind==='pa'&&u.st==='ready')tube.present=u.present;}
    return {view:p.wqView,test:p.wqTest,sample:p.wqSample,assigned:D.asg,group:D.grp,sloppy:D.slop,tube,sheet:D.rows.map(r=>({g:r.g,t:r.t,you:r.you,sloppy:r.sloppy,v:r.v}))};},
  init(sim){const s={P:2,N:300,A:20,D:20,Os:9,Ob:8,F:100,killed:0,killRate:0,r:null};if(wqV(sim))s.W={kind:'wq'};return s;},
  step(sim,dt){if(sim.st.W){if(sim.t<-1e-9)return;wqStep(sim,dt*KS);return;}const p=sim.p,s=sim.st,r=rates(p,s);
    s.P=Math.max(0,s.P+dt*(r.Pin-0.9*r.g+0.54*r.dec-0.03*s.P));
    s.N=Math.max(0,s.N+dt*(r.Nin-7*r.g+4.2*r.dec-0.03*s.N));
    s.A=Math.max(0.5,s.A+dt*(r.g-r.die-0.02*s.A));
    s.D=Math.max(0,s.D+dt*(r.die+(p.sewage?8:0)-r.dec-0.03*s.D));
    s.Os=Math.max(0,s.Os+dt*(0.6*(r.sat-s.Os)+0.012*r.g-0.004*s.A-0.2*r.bod));
    s.Ob=Math.max(0,s.Ob+dt*(r.mix*(s.Os-s.Ob)-r.bod-0.002*s.F/100));
    const grow=s.Ob>4?0.03*s.F*(1-s.F/100)+0.4:0,kill=0.5*Math.pow(clamp((3-s.Ob)/3,0,1),1.5)*s.F;
    s.F=clamp(s.F+dt*(grow-kill),0,100);s.killed+=dt*kill;s.killRate=kill;s.r=r;},
  afterPrewarm(sim){sim.st.killed=0;},
  metrics:[
    {id:'chl',label:'Algae (chlorophyll a)',unit:'µg/L',lvl:'bio',min:0,max:70,d:1,get:s=>CHL*s.st.A},
    {id:'dos',label:'Surface oxygen',unit:'mg/L',lvl:'bio',min:0,max:14,d:1,get:s=>s.st.Os},
    {id:'dob',label:'Bottom oxygen',unit:'mg/L',lvl:'bio',min:0,max:14,d:1,get:s=>s.st.Ob},
    {id:'fish',label:'Fish',unit:'per hectare',lvl:'bio',min:0,max:FISHK,d:0,get:s=>FISHK*s.st.F/100},
    {id:'state',label:'Trophic state',unit:'',lvl:'honors',text:true,get:s=>trophic(CHL*s.st.A)},
    {id:'phos',label:'Dissolved phosphate',unit:'µg/L',lvl:'honors',min:0,max:60,d:1,get:s=>s.st.P},
    {id:'lim',label:'Limiting nutrient',unit:'',lvl:'honors',text:true,get:s=>(s.st.r?s.st.r.lim:'P')==='P'?'Phosphorus':'Nitrogen'},
    {id:'bod',label:'BOD (oxygen used per day)',unit:'mg/L/day',lvl:'ap',min:0,max:3,d:2,get:s=>s.st.r?s.st.r.bod:0},
    {id:'sat',label:'Oxygen saturation at this temperature',unit:'mg/L',lvl:'ap',min:0,max:14,d:1,get:s=>DOSAT(s.p.temp)}
  ],
  graphs:[{id:'do',label:'Dissolved oxygen',lvl:'bio',lines:['dos','dob'],min:0,max:14,yl:'Dissolved oxygen (mg/L)'},
          {id:'chl',label:'Algae',lvl:'bio',lines:['chl']},{id:'fish',label:'Fish',lvl:'bio',lines:['fish']},
          {id:'phos',label:'Dissolved phosphate',lvl:'honors',lines:['phos']},{id:'bod',label:'BOD',lvl:'ap',lines:['bod']}],
  defaultGraph:'do',
  narrate(sim){if(sim.st.W&&sim.vlab)return wqNarrate(sim);const s=sim.st,p=sim.p,r=s.r||rates(p,s),chl=CHL*s.A,hon=atLeast('honors');
    if(s.Ob<2&&s.F<60)return '<b>Dead zone.</b> The bottom water has under 2 mg/L of oxygen. Fish that can’t escape suffocate, and dead fish float to the surface. The rotting adds even more oxygen demand.';
    if(s.Ob<4&&r.bod>0.6)return '<b>The oxygen is running out at the bottom.</b> Dead algae pile up there, and bacteria breaking them down use oxygen faster than mixing can bring it down from the surface.';
    if(r.die*CHL>4&&s.Ob<s.Os-1.5)return '<b>Algae are dying and sinking.</b> Each dead cell becomes food for decomposers on the lake bottom. Their oxygen use is what will cause the crash, days to weeks after the bloom.';
    if(chl>20)return '<b>Algal bloom.</b> Fertilizer is feeding the algae, and the surface is turning green. The surface still has oxygen, because algae make it in daylight.';
    if(p.temp>=28)return '<b>Warm water.</b> At '+p.temp+' °C water can hold only about '+DOSAT(p.temp).toFixed(1)+' mg/L of oxygen, compared with '+DOSAT(10).toFixed(1)+' mg/L at 10 °C.';
    if(hon&&p.nut==='N'&&p.runoff>30)return 'Plenty of nitrogen is washing in, but algae barely grow. <b>Phosphorus is the limiting nutrient</b> in this lake, so extra nitrogen alone doesn’t help them.';
    return 'A healthy lake: clear water and about '+s.Ob.toFixed(1)+' mg/L of oxygen even at the bottom. Algae are kept in check by the small amount of phosphorus washing in.';},
  tour:[
    {title:'A healthy lake',text:'Clear water, a few algae, and oxygen from top to bottom (the white dots). Fish live throughout the lake.',focus:[205,150,595,295],speed:1},
    {title:'Fertilizer washes in',text:'After rain, nitrogen and phosphorus fertilizer run off the farm field and into the lake.',focus:[0,90,300,170],speed:2,setup(sim){BioLab.setValues(sim,{runoff:100});}},
    {title:'An algal bloom',text:'Algae use the nutrients to grow and multiply. The surface turns green, and sunlight can no longer reach deep water.',focus:[205,150,595,90],speed:3},
    {title:'Algae die and sink',text:'Algae live only days to weeks. Dead cells (brown flakes) sink to the bottom and pile up as muck.',focus:[300,180,330,250],speed:2},
    {title:'Decomposers use up the oxygen',text:'Bacteria on the bottom break down the dead algae, and they use oxygen as they do it. Watch the bottom-oxygen gauge fall.',focus:[[205,340,595,105],[612,6,184,142]],speed:3},
    {title:'A dead zone',text:'Below about 2 mg/L, most fish suffocate. The crash comes weeks <b>after</b> the bloom, because decomposition takes time.',focus:[205,150,595,295],speed:4},
    {lvl:'honors',title:'Protect the shoreline',text:'Buffer strips of grass and trees, plus restored wetlands, trap much of the runoff before it reaches the water. The bloom shrinks and oxygen slowly returns.',focus:[150,110,110,140],speed:4,setup(sim){BioLab.setValues(sim,{buffer:true});}},
    {lvl:'ap',title:'Scaling up: the Gulf dead zone',text:'Fertilizer from Midwest farms flows down the Mississippi. Every summer it fuels a bloom and a hypoxic dead zone off Louisiana of about 15,000 km², where the same BOD process plays out.',focus:[612,6,184,142],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{runoff:10,buffer:false});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'A wet spring sends much more fertilizer into the lake. What happens to the oxygen at the bottom of the lake?',
     choices:['It rises right away, because algae make oxygen','It drops, but only weeks later, after the algae die and rot','Nothing happens'],correct:1,
     baseline:{runoff:10},change:{runoff:100},changeText:'Fertilizer runoff raised to 100%',watch:'do',
     explain:{bio:'The bloom comes first. The oxygen crash comes later, when the algae die, sink and are eaten by decomposers that use up oxygen. That delay is why dead zones form weeks after heavy rain.',
              honors:'Algae add oxygen at the surface, but their biomass ends up as detritus on the bottom. Decomposers’ respiration (BOD) uses bottom oxygen faster than mixing replaces it, so DO falls with a lag of 2–3 weeks.'}},
    {lvl:'bio',q:'A power plant warms the lake from 15 °C to 30 °C with its cooling water. What happens to the oxygen in the surface water?',
     choices:['It goes up','It goes down','It stays the same'],correct:1,
     baseline:{temp:15},change:{temp:30},reveal:15,changeText:'Water warmed to 30 °C',watch:'do',
     explain:'Warm water holds less dissolved gas: about 10 mg/L of oxygen at 15 °C but only about 7.5 mg/L at 30 °C. That is why thermal pollution stresses fish even without any fertilizer.'},
    {lvl:'honors',q:'Heavy runoff has caused a bloom. The town plants buffer strips and restores the wetlands along the shore. Over the next month the bloom will…',
     choices:['Shrink','Get worse','Stay the same'],correct:0,
     baseline:{runoff:100},change:{buffer:true},reveal:40,changeText:'Buffer strips and wetlands added',watch:'chl',
     explain:'Plants and wetland soils trap and absorb much of the nitrogen and phosphorus before it reaches the lake. With less food, the bloom shrinks, though oxygen recovers slowly because muck on the bottom keeps rotting.'},
    {lvl:'honors',q:'Runoff into this lake carries lots of nitrogen but almost no phosphorus, and the algae stay low. Now the runoff switches to phosphorus instead. The algae will…',
     choices:['Bloom','Stay low','Die out'],correct:0,
     baseline:{runoff:100,nut:'N'},change:{nut:'P'},reveal:30,changeText:'Runoff now carries phosphorus',watch:'chl',
     explain:'Phosphorus is the limiting nutrient in most lakes: algae already have plenty of nitrogen. Adding the missing nutrient lets them bloom, which is why phosphate detergents were banned in many states.'},
    {lvl:'honors',q:'A sewage pipe starts overflowing into the lake. What happens to the bottom oxygen?',
     choices:['It falls','It rises','No change'],correct:0,
     baseline:{},change:{sewage:true},changeText:'Sewage overflow started',watch:'do',
     explain:'Sewage adds nutrients (feeding algae) and organic matter that decomposers start breaking down right away. Both raise the oxygen demand.'},
    {lvl:'ap',q:'Moderate runoff reaches the lake in summer, and the lake stratifies: warm surface water floats on cold bottom water and they stop mixing. Compared with a mixed lake, the bottom water will…',
     choices:['Lose its oxygen much sooner','Keep more oxygen','Be unaffected'],correct:0,
     baseline:{runoff:60},change:{strat:true},reveal:25,changeText:'Lake stratified',watch:'do',
     explain:'Bottom water gets oxygen only by mixing with the surface. A thermocline blocks that, so the same BOD drives the bottom to hypoxia in about two weeks instead of four.'},
    {lvl:'ap',instant:true,q:'Water just downstream of a sewage outfall has a very high BOD. That tells you the water…',
     choices:['Contains lots of organic matter that decomposers will use oxygen to break down','Already has a lot of dissolved oxygen','Is too cold for bacteria'],correct:0,
     explain:'Biochemical oxygen demand is the oxygen microbes will consume while decomposing organic matter. High BOD means the oxygen is about to be used up, a classic sign of organic pollution.'},
    {lvl:'ap',instant:true,q:'Each summer a hypoxic dead zone forms in the Gulf of Mexico. Its main cause is…',
     choices:['Nitrogen and phosphorus fertilizer carried down the Mississippi River','Oil spills','Warm water from power plants'],correct:0,
     explain:'Nutrient runoff from Midwest farms drives a huge spring bloom. When it dies and sinks, decomposition strips the bottom water of oxygen. Stratified summer water makes it worse.'}
  ],
  lab:{bio:'<p><b>Question:</b> How does the amount of fertilizer runoff affect the oxygen in a lake?</p><ol><li>Set runoff to 0% and press Reset. Run 40 days and record a trial.</li><li>Repeat at 25%, 50%, 75% and 100% runoff.</li><li>Plot runoff (x) against bottom oxygen (y) on the Trials graph.</li></ol><p>At what runoff level does the lake become a dead zone (under 2 mg/L)?</p>',
       honors:'<p><b>Question:</b> What is the best way to protect the lake?</p><ol><li>Set runoff to 100% and run 40 days. Record a trial.</li><li>Press Reset and try each fix on its own: buffer strips, runoff with nitrogen only, runoff with phosphorus only.</li><li>Record algae, bottom oxygen and fish for each.</li></ol><p>Which fix works best, and what does that tell you about the limiting nutrient?</p>',
       ap:'<p><b>Question:</b> How do temperature and stratification change a lake’s sensitivity to nutrients?</p><ol><li>With 60% runoff, record bottom DO after 30 days at 10, 20 and 30 °C.</li><li>Repeat at 20 °C with stratification on.</li><li>Compare each bottom DO with the saturation value and with BOD.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why dead zones are worst in late summer.</p>'},
  terms:[{t:'Eutrophication',d:'Too many nutrients in water, which leads to algal blooms and oxygen loss.'},{t:'Algal bloom',d:'A rapid increase in algae, often turning water green.'},{t:'Dissolved oxygen (DO)',d:'Oxygen gas dissolved in water, in mg/L. Most fish need more than about 5 mg/L.'},{t:'Dead zone (hypoxia)',d:'Water with too little oxygen for most life, under about 2 mg/L.'},
    {lvl:'honors',t:'Limiting nutrient',d:'The nutrient in shortest supply. Adding it causes the most growth. In most lakes it is phosphorus.'},{lvl:'honors',t:'Decomposers',d:'Bacteria and fungi that break down dead matter, using oxygen.'},{lvl:'honors',t:'Thermal pollution',d:'Heating water, often with power-plant cooling water, which lowers how much oxygen it can hold.'},
    {lvl:'ap',t:'BOD',d:'Biochemical oxygen demand: how much oxygen microbes will use to decompose the organic matter in water.'},{lvl:'ap',t:'Stratification and thermocline',d:'Layers of warm and cold water that don’t mix, cutting off oxygen to the bottom.'},{lvl:'ap',t:'Point vs. nonpoint source',d:'A sewage pipe is a point source. Runoff from many fields is a nonpoint source and much harder to regulate.'}],
  about:'<p>A two-layer lake model. Algae grow by μ·A·min(P/(P+6), N/(N+40))·(1 − A/250) with μ = 0.9/day at 20 °C (×1.07 per °C), so the scarcer nutrient limits growth. Dead algae become detritus decomposed at 0.15/day at 20 °C (×1.08 per °C), and decomposition sets the BOD. Surface DO relaxes toward saturation (DOsat ≈ 9.1 mg/L at 20 °C, 7.5 at 30 °C). Bottom DO is resupplied only by mixing, which slows in warm water and drops by 65% when stratified.</p><p>Simplified: day and night aren’t separated (real lakes are lowest in oxygen just before dawn), all algae are one type with no toxic cyanobacteria, nutrient units are model-scaled, and fish respond only to bottom oxygen. Chlorophyll is shown as 0.4 × algal biomass so values match common trophic-state ranges.</p>'+
    '<p><b>The water quality virtual lab.</b> The bench models a classroom test kit. Each sample has a true value for every test, drawn from realistic ranges for Denver-area tap water, a turtle tank and a pond. A color test shows a tube color between the printed swatches (with a little run-to-run variation), so you read it to the nearest step. The DO and hardness titrations count drops to an end point (0.2 ppm and 10 ppm per drop), the meters settle to a reading, and the coliform vial shows present or absent after a 24-hour incubation that the bench skips ahead.</p>',
  initVis(sim){const r=rng(9),v=sim.vis;v.fish=[];for(let i=0;i<18;i++)v.fish.push({x:260+r()*480,y:230+r()*150,vx:(r()<.5?-1:1)*(12+r()*14),ph:r()*6.28,depth:r()});
    v.flakes=[];v.dead=[];v.storm=0;v.sink=0;v.kill=0;v.grass=[];for(let i=0;i<40;i++)v.grass.push([r(),r()]);},
  draw(sim,ctx,vdt,k,t){if(sim.st.W&&sim.vlab){drawWQ(sim,ctx,vdt,k,t);return;}const s=sim.st,p=sim.p,v=sim.vis,r=s.r||rates(p,s),hon=atLeast('honors'),ap=atLeast('ap'),R=Math.random;
    const chl=CHL*s.A,green=clamp(chl/60,0,1),SURF=170,LAKE_L=212;
    // sky and land
    ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(0,0,800,SURF);
    ctx.fillStyle='#f2c14e';ctx.beginPath();ctx.arc(70,46,20,0,6.29);ctx.fill();
    ctx.fillStyle='#6f5538';ctx.fillRect(0,SURF,800,450-SURF);ctx.fillStyle='#8a6a45';ctx.beginPath();ctx.moveTo(0,118);ctx.lineTo(LAKE_L+20,SURF+6);ctx.lineTo(LAKE_L-10,450);ctx.lineTo(0,450);ctx.closePath();ctx.fill();
    // crop rows on the field
    for(let i=0;i<7;i++){for(let j=0;j<9;j++){const x=8+j*16+i*2,y=128+i*7+x*0.21;ctx.fillStyle=(i+j)%2?'#5a9a3e':'#4c8834';ctx.beginPath();ctx.ellipse(x,y,5,3.2,0,0,6.29);ctx.fill();}}
    txt(ctx,'Farm field',12,108,{s:12*k,w:700});
    if(p.runoff>0){ctx.fillStyle=PAL['cv-soft'];ctx.font='600 '+11*k+'px sans-serif';txt(ctx,'fertilizer: '+p.runoff+'%',12,94,{s:11*k,c:PAL['cv-soft']});}
    if(p.buffer){ctx.fillStyle='#3e7d3a';for(let i=0;i<7;i++){const x=158+i*8,y=148+i*3.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-6,y+14);ctx.lineTo(x+6,y+14);ctx.closePath();ctx.fill();}
      v.grass.forEach(g=>{ctx.strokeStyle='#5aa648';ctx.lineWidth=1.5;const x=150+g[0]*62,y=150+g[0]*22+g[1]*8;ctx.beginPath();ctx.moveTo(x,y+6);ctx.lineTo(x+1,y);ctx.stroke();});
      txt(ctx,'Buffer strip',176,138,{s:11.5*k,w:700,a:'center'});}
    // runoff stream
    const inflow=(p.runoff/100)*(p.buffer?0.4:1)+(v.storm>0?0.6:0);
    if(inflow>0.02){ctx.strokeStyle='rgba(150,190,90,'+clamp(0.45+inflow*0.5,0,0.95)+')';ctx.lineWidth=3+inflow*8;ctx.lineCap='round';ctx.setLineDash([10,8]);ctx.lineDashOffset=-(RM?0:t*30);
      ctx.beginPath();ctx.moveTo(70,140);ctx.quadraticCurveTo(150,165,LAKE_L+8,SURF+4);ctx.stroke();ctx.setLineDash([]);}
    if(v.storm>0){v.storm-=vdt;ctx.strokeStyle='rgba(120,150,190,.6)';ctx.lineWidth=1.5;for(let i=0;i<40;i++){const x=(i*37+t*400)%800,y=(i*53+t*600)%SURF;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+10);ctx.stroke();}pill(ctx,'Rainstorm: a pulse of fertilizer',300,24,'#4f6d8f','#fff',12*k);}
    // town and sewage pipe
    
    if(hon||p.sewage){ctx.fillStyle='#5d6168';ctx.fillRect(764,SURF-12,36,10);txt(ctx,'Sewage pipe',796,SURF-18,{s:10.5*k,a:'right',c:PAL['cv-soft']});}
    // lake body
    const lake=new Path2D();lake.moveTo(LAKE_L,SURF);lake.lineTo(800,SURF);lake.lineTo(800,440);lake.quadraticCurveTo(520,452,LAKE_L+50,395);lake.closePath();
    const wcol=`rgb(${Math.round(lerp(120,90,green))},${Math.round(lerp(175,150,green))},${Math.round(lerp(210,90,green))})`;
    ctx.save();ctx.clip(lake);
    const gr=ctx.createLinearGradient(0,SURF,0,445);gr.addColorStop(0,wcol);gr.addColorStop(1,`rgb(${Math.round(lerp(40,45,green))},${Math.round(lerp(80,70,green))},${Math.round(lerp(120,55,green))})`);
    ctx.fillStyle=gr;ctx.fillRect(LAKE_L,SURF,600,290);
    // thermocline
    const strat=p.strat||p.temp>=24;if(strat){ctx.strokeStyle='rgba(255,255,255,.55)';ctx.setLineDash([6,6]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(LAKE_L,300);ctx.lineTo(800,300);ctx.stroke();ctx.setLineDash([]);}
    // surface algae scum
    if(chl>8){ctx.fillStyle='rgba(70,150,50,'+clamp((chl-8)/50,0,0.85)+')';ctx.fillRect(LAKE_L,SURF,600,4+clamp(chl/4,0,16));}
    // algae cells
    const nA=Math.round(clamp(chl*1.6,3,110));ctx.fillStyle='#58b44a';for(let i=0;i<nA;i++){const x=LAKE_L+20+((i*97.3)%560),y=SURF+6+((i*41.7)%70)+(RM?0:Math.sin(t+i)*2);ctx.beginPath();ctx.arc(x,y,2.1,0,6.29);ctx.fill();}
    // sinking dead algae
    v.sink+=r.die*CHL*vdt*1.2;while(v.sink>=1){v.sink--;v.flakes.push({x:LAKE_L+40+R()*540,y:SURF+30,vy:18+R()*14});}
    ctx.fillStyle='#8a6a3c';v.flakes.forEach(f=>{f.y+=f.vy*vdt;f.x+=Math.sin(f.y*0.05)*0.2;ctx.fillRect(f.x,f.y,3,2);});v.flakes=v.flakes.filter(f=>f.y<420);if(v.flakes.length>160)v.flakes.splice(0,v.flakes.length-160);
    // oxygen bubbles: surface and bottom layers
    const nOs=Math.round(s.Os*3.2),nOb=Math.round(s.Ob*3.2);ctx.fillStyle='rgba(255,255,255,.85)';
    for(let i=0;i<nOs;i++){const x=LAKE_L+15+((i*61.3)%570),y=SURF+20+((i*23.1)%95)+(RM?0:Math.sin(t*1.3+i)*3);ctx.beginPath();ctx.arc(x,y,2.4,0,6.29);ctx.fill();}
    for(let i=0;i<nOb;i++){const x=LAKE_L+70+((i*53.7)%500),y=310+((i*29.3)%80)+(RM?0:Math.sin(t*1.1+i)*3);ctx.beginPath();ctx.arc(x,y,2.4,0,6.29);ctx.fill();}
    // sediment and decomposers
    const sed=clamp(4+s.D/8,4,26);ctx.fillStyle='#5b4630';ctx.beginPath();ctx.moveTo(LAKE_L+50,395);ctx.quadraticCurveTo(520,452,800,440);ctx.lineTo(800,440-sed);ctx.quadraticCurveTo(520,452-sed,LAKE_L+50,395-sed*0.6);ctx.closePath();ctx.fill();
    const nb=Math.round(clamp(r.bod*30,2,60));ctx.fillStyle='#e6c86e';for(let i=0;i<nb;i++){const x=LAKE_L+90+((i*71.3)%470),yb=420+((x-500)/300)*((x-500)/300)*-6-sed*0.6;ctx.beginPath();ctx.ellipse(x,yb-2+(RM?0:Math.sin(t*3+i)),2.4,1.3,0.4,0,6.29);ctx.fill();}
    // fish
    const nF=Math.round(18*s.F/100);v.kill+=s.killRate*vdt*0.18;while(v.kill>=1){v.kill--;v.dead.push({x:LAKE_L+60+R()*500,life:8});}
    v.fish.slice(0,nF).forEach((f,i)=>{const safeY=s.Ob<4?lerp(SURF+30,SURF+110,f.depth):lerp(SURF+40,380,f.depth);f.y+=(safeY-f.y)*Math.min(1,vdt*0.8);f.x+=f.vx*vdt;if(f.x<LAKE_L+60||f.x>780)f.vx*=-1;f.x=clamp(f.x,LAKE_L+60,780);
      const dir=f.vx>0?1:-1,y=f.y+(RM?0:Math.sin(t*2+f.ph)*2);ctx.fillStyle='#d8893a';ctx.beginPath();ctx.ellipse(f.x,y,10,4.5,0,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(f.x-dir*9,y);ctx.lineTo(f.x-dir*16,y-5);ctx.lineTo(f.x-dir*16,y+5);ctx.closePath();ctx.fill();
      ctx.fillStyle='#222';ctx.beginPath();ctx.arc(f.x+dir*6,y-1,1.2,0,6.29);ctx.fill();});
    ctx.restore();
    // dead fish float on the surface
    v.dead.forEach(d=>{d.life-=vdt;ctx.globalAlpha=clamp(d.life/3,0,1);ctx.fillStyle='#b9b1a3';ctx.beginPath();ctx.ellipse(d.x,SURF-1,9,3.2,0,Math.PI,0);ctx.fill();ctx.globalAlpha=1;});v.dead=v.dead.filter(d=>d.life>0);if(v.dead.length>30)v.dead.splice(0,v.dead.length-30);
    if(p.sewage){ctx.fillStyle='rgba(120,105,80,.55)';ctx.beginPath();ctx.ellipse(758,SURF+26,52,24,0,0,6.29);ctx.fill();pill(ctx,'Sewage overflow',724,SURF+62,'#6d5a3a','#fff',11*k);}
    // labels on the water
    txt(ctx,'Surface water',LAKE_L+30,SURF+(chl>8?30:22),{s:12*k,w:700,c:'#fff'});txt(ctx,'Bottom water',LAKE_L+120,385,{s:12*k,w:700,c:'#fff'});
    if(strat)txt(ctx,'thermocline (layers don’t mix)',560,296,{s:11*k,c:'#fff'});
    // oxygen gauges
    const GX=618,GY=10,GW=172;ctx.fillStyle=PAL['card'];rr(ctx,GX,GY,GW,134,9);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,'Dissolved oxygen (mg/L)',GX+10,GY+18,{s:11.5*k,w:700});
    [['Surface',s.Os,GY+32],['Bottom',s.Ob,GY+72]].forEach(g=>{const bx=GX+10,by=g[2],bw=GW-20,sc=bw/12;ctx.fillStyle=PAL['line'];rr(ctx,bx,by,bw,12,4);ctx.fill();
      ctx.fillStyle='rgba(214,51,47,.35)';ctx.fillRect(bx,by,2*sc,12);const val=clamp(g[1],0,12);ctx.fillStyle=g[1]<2?'#d6332f':g[1]<5?'#d99a1e':'#2f8f5b';rr(ctx,bx,by,Math.max(4,val*sc),12,4);ctx.fill();
      txt(ctx,g[0]+': '+g[1].toFixed(1),bx,by+26,{s:11.5*k,c:PAL['cv-ink']});});
    txt(ctx,'red zone = under 2 (hypoxic)',GX+GW-10,GY+126,{s:10.5*k,a:'right',c:PAL['cv-soft']});
    txt(ctx,'Water '+p.temp+' °C',GX-10,GY+16,{s:12*k,w:700,a:'right'});
    if(s.Ob<2&&s.F<80)pill(ctx,'Dead zone',500,SURF+150,'#d6332f','#fff',13*k);
  }
};
BioLab.register(SIM);
})();
