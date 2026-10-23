(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,lvText,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;

/* Cohort-component population model: single-year ages 0–100 for each sex, stepped one year at a time.
   Mortality comes from a Gompertz–Makeham schedule scaled to hit the chosen life expectancy;
   fertility is a bell curve over ages 15–49 scaled to the chosen total fertility rate (TFR). */
const AGES=101,SRB=1.05; // sex ratio at birth, boys per girl
function baseMu(x){if(x===0)return 0.025;if(x<5)return 0.0025;return 0.00035+0.000035*Math.exp(0.088*x)+(x>=15&&x<35?0.0006:0);}
const lifeCache={};
function lifeTable(e0){const key=e0.toFixed(1);if(lifeCache[key])return lifeCache[key];
  const e0of=lam=>{let l=1,T=0;const q=[];for(let x=0;x<AGES;x++){const mu=Math.min(5,baseMu(x)*(x===0?Math.pow(lam,1.15):lam));const qx=x===AGES-1?1:1-Math.exp(-mu);q.push(qx);T+=l*(1-qx*0.5);l*=1-qx;}return {e:T,q};};
  let lo=0.01,hi=80;for(let i=0;i<60;i++){const mid=Math.sqrt(lo*hi);if(e0of(mid).e>e0)lo=mid;else hi=mid;}
  const r=e0of(Math.sqrt(lo*hi));lifeCache[key]=r.q;return r.q;}
const FERT=(()=>{const f=new Array(AGES).fill(0);let sum=0;for(let x=15;x<=49;x++){f[x]=Math.exp(-Math.pow((x-27.5)/6.5,2));sum+=f[x];}return f.map(v=>v/sum);})();
/* Presets: history phases [years, TFR, e0, migration per 1000] run before year 0 to build a realistic pyramid */
const PRESETS={
  stage1:{l:'Pre-industrial village',year:1750,pop:2e6,tfr:4.7,e0:30,mig:0,hist:[[200,4.7,30,0]],stage:'Stage 1'},
  niger:{l:'Niger (today)',year:2026,pop:27e6,tfr:6.7,e0:62,mig:0,hist:[[150,7.5,38,0],[40,7.4,50,0],[20,7,58,0]],stage:'Stage 2'},
  india:{l:'India (today)',year:2026,pop:1.44e9,tfr:2.0,e0:72,mig:0,hist:[[150,5.8,40,0],[30,4.5,56,0],[25,3.2,64,0],[20,2.4,69,0]],stage:'Stage 3'},
  us:{l:'United States (today)',year:2026,pop:3.36e8,tfr:1.6,e0:79,mig:3.5,hist:[[150,4.2,48,3],[30,2.4,62,1],[19,3.5,70,1],[43,2.0,75,3],[17,1.8,78,3.5]],stage:'Stage 4'},
  japan:{l:'Japan (today)',year:2026,pop:1.24e8,tfr:1.2,e0:84.5,mig:0.3,hist:[[150,4.5,45,0],[12,3.8,60,0],[45,1.7,77,0],[30,1.35,83,0]],stage:'Stage 4–5'}};
function yearStep(st,tfr,e0,mig){const qM=lifeTable(e0-2.5),qF=lifeTable(e0+2.5);const M=st.m,F=st.f;
  let births=0;for(let x=15;x<=49;x++)births+=F[x]*FERT[x]*tfr;
  let deaths=0;const nM=new Array(AGES).fill(0),nF=new Array(AGES).fill(0);
  for(let x=AGES-1;x>=0;x--){const dm=M[x]*qM[x],df=F[x]*qF[x];deaths+=dm+df;const to=Math.min(AGES-1,x+1);nM[to]+=M[x]-dm;nF[to]+=F[x]-df;}
  const bM=births*SRB/(1+SRB),bF=births/(1+SRB);nM[0]=bM*(1-qM[0]*0.3);nF[0]=bF*(1-qF[0]*0.3);deaths+=bM*qM[0]*0.3+bF*qF[0]*0.3;
  let tot=0;for(let x=0;x<AGES;x++)tot+=M[x]+F[x];
  const net=tot*mig/1000;for(let x=20;x<35;x++){nM[x]+=net/30;nF[x]+=net/30;}
  st.m=nM;st.f=nF;st.births=births;st.deaths=deaths;st.migr=net;st.prevTot=tot;}
function total(st){let t=0;for(let x=0;x<AGES;x++)t+=st.m[x]+st.f[x];return t;}
function build(key,tfr,e0,mig){const P=PRESETS[key]||PRESETS.niger;const st={m:new Array(AGES).fill(0),f:new Array(AGES).fill(0)};
  for(let x=0;x<AGES;x++){st.m[x]=Math.exp(-0.03*x);st.f[x]=Math.exp(-0.03*x);}
  for(const ph of P.hist)for(let y=0;y<ph[0];y++){yearStep(st,ph[1],ph[2],ph[3]);const T=total(st),k=1e6/T;for(let x=0;x<AGES;x++){st.m[x]*=k;st.f[x]*=k;}}
  yearStep(st,tfr,e0,mig);const k=P.pop/total(st);for(let x=0;x<AGES;x++){st.m[x]*=k;st.f[x]*=k;}st.births*=k;st.deaths*=k;st.migr*=k;st.prevTot*=k;
  return st;}
function groups5(arr){const g=new Array(21).fill(0);for(let x=0;x<AGES;x++)g[Math.min(20,Math.floor(x/5))]+=arr[x];return g;}
function stats(st){const T=total(st);let kids=0,old=0,work=0,cum=0,med=0;const half=T/2;
  for(let x=0;x<AGES;x++){const n=st.m[x]+st.f[x];if(x<15)kids+=n;else if(x>=65)old+=n;else work+=n;if(cum<half&&cum+n>=half)med=x+(half-cum)/n;cum+=n;}
  const base=st.prevTot||T;return {T,cbr:1000*st.births/base,cdr:1000*st.deaths/base,gr:100*(T-base)/base,dep:100*(kids+old)/work,kids:100*kids/T,old:100*old/T,med};}
function stageText(sim){const s=stats(sim.st);
  if(s.cdr>=24)return 'Stage 1: high birth and death rates';
  if(s.cbr>=30)return 'Stage 2: death rate falling, birth rate high';
  if(s.cbr>=15)return 'Stage 3: birth rate falling';
  if(s.gr>-0.08)return 'Stage 4: low birth and death rates';
  return 'Stage 5: population shrinking';}
function stageNum(sim){const s=stats(sim.st);if(s.cdr>=24)return 1;if(s.cbr>=30)return 2;if(s.cbr>=15)return 3;if(s.gr>-0.08)return 4;return 5;}
function loadPreset(sim){const P=PRESETS[sim.p.preset];if(!P)return;BioLab.setValues(sim,{tfr:P.tfr,e0:P.e0,mig:P.mig});BioLab.reset(sim);}
const fmtPop=n=>n>=1e9?(n/1e9).toFixed(2)+' billion':n>=1e6?(n/1e6).toFixed(n>=1e8?0:1)+' million':Math.round(n).toLocaleString();

const HP={
  id:'humanpop',hash:'humanpop',apUnit:8,order:10,tab:'Human population',kind:'Simulation',prereq:['popgrowth'],
  card:'Grow a country year by year. Watch its age pyramid change as birth and death rates fall.',
  title:'Human population: age pyramids and the demographic transition',
  lede:{bio:'Pick a country and watch its population pyramid change year by year. See how birth rates, death rates and life expectancy shape who lives there.',
        honors:'Follow countries through the demographic transition. Change fertility, life expectancy and migration, and compare survivorship curves.',
        ap:'Read crude birth and death rates, growth rate, doubling time and dependency ratio, and see population momentum carry growth for decades after fertility drops.'},
  scale:'Real scale: a whole country. Each bar is a 5-year age group, as a share of the total population.',
  timeScale:3,dtMax:0.5,prewarm:0,sampleDt:1,window:80,unit:'years',timeLabel:'Time',chChange:1,chReveal:30,
  clock(sim){const P=PRESETS[sim.p.preset];return 'Year '+((P?P.year:2026)+Math.floor(sim.t));},
  controls:[
    {id:'preset',label:'Country',type:'select',def:'niger',lvl:'bio',options:[{v:'stage1',l:'Pre-industrial village (1750)'},{v:'niger',l:'Niger (Stage 2)'},{v:'india',l:'India (Stage 3)'},{v:'us',l:'United States (Stage 4)'},{v:'japan',l:'Japan (Stage 4–5)'}],
     help:'Loads that country’s age structure and its current rates.',onChange:loadPreset},
    {id:'tfr',label:'Total fertility rate',type:'range',min:1,max:8,step:0.1,def:6.7,unit:' children',lvl:'bio',help:'Average children per woman in her lifetime. Replacement is about 2.1.'},
    {id:'e0',label:'Life expectancy',type:'range',min:25,max:90,step:0.5,def:62,unit:' years',lvl:'honors'},
    {id:'mig',label:'Net migration',type:'range',min:-10,max:10,step:0.5,def:0,unit:' per 1,000',lvl:'honors',help:'Immigrants minus emigrants each year, per 1,000 people.'}
  ],
  actions:[{id:'load',label:'Restart this country',lvl:'bio',run:loadPreset}],
  init(sim){const p=sim.p;const st=build(p.preset,p.tfr,p.e0,p.mig);st.acc=0;st.start={m:groups5(st.m),f:groups5(st.f),T:total(st)};st.T0=total(st);st.births0=st.births;st.vis=0;return st;},
  step(sim,dt){const s=sim.st,p=sim.p;s.acc+=dt;while(s.acc>=1){s.acc-=1;yearStep(s,p.tfr,p.e0,p.mig);}},
  metrics:[
    {id:'pop',label:'Population',unit:'million',lvl:'bio',min:0,max:null,d:1,get:s=>total(s.st)/1e6},
    {id:'gr',label:'Growth rate',unit:'% per year',lvl:'bio',min:-2,max:4,d:2,get:s=>stats(s.st).gr},
    {id:'stage',label:'Demographic transition',unit:'',lvl:'bio',text:true,get:s=>stageText(s)},
    {id:'cbr',label:'Crude birth rate',unit:'per 1,000',lvl:'honors',min:0,max:60,d:1,get:s=>stats(s.st).cbr},
    {id:'cdr',label:'Crude death rate',unit:'per 1,000',lvl:'honors',min:0,max:60,d:1,get:s=>stats(s.st).cdr},
    {id:'med',label:'Median age',unit:'years',lvl:'honors',min:0,max:60,d:1,get:s=>stats(s.st).med},
    {id:'dbl',label:'Doubling time (rule of 70)',unit:'years',lvl:'ap',min:0,max:200,d:0,get:s=>{const g=stats(s.st).gr;return g>0.05?70/g:NaN;}},
    {id:'dep',label:'Dependency ratio',unit:'per 100 workers',lvl:'ap',min:0,max:120,d:0,get:s=>stats(s.st).dep},
    {id:'old',label:'Age 65 and older',unit:'% of people',lvl:'ap',min:0,max:45,d:1,get:s=>stats(s.st).old}
  ],
  graphs:[
    {id:'pop',label:'Population over time',lines:['pop']},
    {id:'gr',label:'Growth rate over time',lines:['gr']},
    {id:'bd',label:'Birth and death rates',lvl:'honors',lines:['cbr','cdr'],yl:'Per 1,000 people per year'},
    {id:'surv',label:'Survivorship curve',lvl:'honors',custom:true},
    {id:'dep',label:'Dependency ratio over time',lvl:'ap',lines:['dep']}
  ],
  defaultGraph:'pop',
  plot(sim,ctx,box,id){const q=lifeTable(sim.p.e0);let l=1000;const pts=[[0,1000]];for(let x=0;x<AGES-1;x++){l*=1-q[x];pts.push([x+1,Math.max(l,0.5)]);}
    const LY=v=>Math.log10(Math.max(v,0.5));
    const ax=axes(ctx,box,{xmin:0,xmax:100,ymin:0,ymax:3,xl:'Age (years)',yl:'Survivors of 1,000 born (log scale)',yd:0});
    // relabel log axis
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    const ref=[{n:'Type I',c:PAL['muted'],f:x=>1000*(1-Math.pow(x/100,6))},{n:'Type II',c:PAL['muted'],f:x=>1000*Math.exp(-0.069*x)},{n:'Type III',c:PAL['muted'],f:x=>1000*Math.exp(-0.5*Math.sqrt(x*12))}];
    ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ref.forEach(r=>{ctx.strokeStyle=r.c;ctx.beginPath();for(let x=0;x<=100;x+=2){const y=ax.Y(LY(r.f(x)));x?ctx.lineTo(ax.X(x),y):ctx.moveTo(ax.X(x),y);}ctx.stroke();});ctx.setLineDash([]);
    ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=3;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(ax.X(p[0]),ax.Y(LY(p[1]))):ctx.moveTo(ax.X(p[0]),ax.Y(LY(p[1]))));ctx.stroke();ctx.restore();
    txt(ctx,'Type I',ax.X(70),ax.Y(LY(1000*(1-Math.pow(0.7,6))))-8,{s:12,c:PAL['muted']});txt(ctx,'Type II',ax.X(40),ax.Y(LY(1000*Math.exp(-0.069*40)))-8,{s:12,c:PAL['muted']});txt(ctx,'Type III',ax.X(12),ax.Y(LY(1000*Math.exp(-0.5*Math.sqrt(144))))+16,{s:12,c:PAL['muted']});
    legend(ctx,box.L+12,box.T+10,[{label:'This country (life expectancy '+sim.p.e0+')',color:PAL['g-line']},{label:'Reference types',color:PAL['muted'],dash:true}]);
    ['1','10','100','1,000'].forEach((s,i)=>txt(ctx,s,box.L-8,ax.Y(i),{s:12,c:PAL['g-axis'],a:'right',b:'middle'}));},
  narrate(sim){const s=stats(sim.st),n=stageNum(sim),p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    const momentum=p.tfr<=2.3&&s.gr>0.2&&s.kids>20;
    if(momentum)return '<b>Population momentum.</b> Families now average only '+p.tfr+' children, yet the population still grows '+s.gr.toFixed(1)+'% a year. The big generation of young people is now having children, so births stay high for decades.';
    if(n===1)return '<b>Stage 1.</b> Many babies are born, but many people die young from disease and hunger. Births and deaths nearly cancel, so the population barely grows.';
    if(n===2)return '<b>Stage 2: fast growth.</b> Better food, clean water and medicine cut the death rate, but families are still large. The pyramid has a wide base: '+s.kids.toFixed(0)+'% of people are under 15.'+(ap?' At '+s.gr.toFixed(1)+'% a year, the population doubles in about '+Math.round(70/s.gr)+' years.':'');
    if(n===3)return '<b>Stage 3.</b> As children survive and education spreads, families get smaller. The birth rate falls, growth slows, and the pyramid’s base narrows.';
    if(n===4)return '<b>Stage 4: slow or no growth.</b> Low birth and death rates. The pyramid looks more like a column, and the median age is '+s.med.toFixed(0)+'.'+(p.mig>0&&hon?' Immigration adds young adults each year.':'');
    return '<b>Shrinking.</b> With '+p.tfr+' children per woman, each generation is smaller than the last. More people are over 65 ('+s.old.toFixed(0)+'%), so fewer workers support more retirees.';},
  tour:[
    {title:'Reading a pyramid',text:'Each bar is an age group, 5 years wide: babies at the bottom, the oldest at the top. Males are on the left and females on the right. Bar length is the share of the whole population.',focus:[20,40,520,400],speed:0.3,setup(sim){BioLab.setValues(sim,{preset:'niger'});}},
    {title:'A wide base means growth',text:'Niger has the highest fertility in the world. The wide bottom means many children, who will soon have children of their own.',focus:[20,330,520,95],speed:0.5},
    {title:'Watch the cohorts move up',text:'Every year each group gets one year older and slides upward, losing some people to death. The bars you see rising are real generations.',focus:[20,40,520,400],speed:1.5},
    {title:'The demographic transition',text:'The chart at the right shows the four stages: first death rates fall, then birth rates fall. The dot marks where this country is now.',focus:[548,34,245,210],speed:1},
    {title:'A Stage 4 country',text:'The United States has low birth and death rates. Its pyramid looks more like a column, and growth is slow. Immigration adds young adults.',focus:[20,40,520,400],speed:1,setup(sim){BioLab.setValues(sim,{preset:'us'});loadPreset(sim);}},
    {title:'Shrinking: Japan',text:'Japan’s fertility is far below replacement (2.1). The base is narrow and the top is heavy, so the population shrinks and ages.',focus:[20,40,520,400],speed:1.5,setup(sim){BioLab.setValues(sim,{preset:'japan'});loadPreset(sim);}},
    {lvl:'ap',title:'Momentum',text:'India’s fertility is already near replacement, but its pyramid still has a large young generation. Those young adults keep births high for decades. That is population momentum.',focus:[20,40,520,400],speed:1.5,setup(sim){BioLab.setValues(sim,{preset:'india'});loadPreset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{preset:'niger'});loadPreset(sim);},
  challenges:[
    {lvl:'bio',q:'Niger’s population grows nearly 4% a year. About how long until it doubles?',choices:['About 4 years','About 18 years','About 70 years'],correct:1,
     baseline:{preset:'niger'},baselineAction:'load',change:{},changeText:'Watching Niger grow',watch:'pop',at:1,reveal:19,
     explain:{bio:'Use the rule of 70: doubling time ≈ 70 ÷ growth rate in %. 70 ÷ 3.8 ≈ 18 years. Check the population readout: 27 million becomes about 54 million in 18 to 19 years.'}},
    {lvl:'bio',q:'Japan’s families average 1.2 children. What happens to Japan’s population over the next 30 years?',choices:['It grows','It stays the same','It shrinks'],correct:2,
     baseline:{preset:'japan'},baselineAction:'load',change:{},changeText:'Watching Japan',watch:'pop',at:1,reveal:30,
     explain:{bio:'Each couple needs about 2 children just to replace themselves. With 1.2, each generation is smaller than the one before, and deaths outnumber births.'}},
    {lvl:'honors',q:'India’s fertility rate is already about 2.0, near replacement. Does its population stop growing right away?',choices:['Yes, it levels off immediately','No, it keeps growing for decades','It starts shrinking right away'],correct:1,
     baseline:{preset:'india'},baselineAction:'load',change:{},changeText:'Watching India',watch:'pop',at:1,reveal:30,
     explain:{honors:'India has a large generation of young people from when families were bigger. As they reach their 20s and 30s they have children, so births still outnumber deaths. This is population momentum.'}},
    {lvl:'honors',q:'With modern death rates, what total fertility rate keeps a population steady in the long run (ignoring migration)?',choices:['About 1.0','About 2.1','About 4.0'],correct:1,instant:true,
     explain:{honors:'Two children replace the two parents. The extra 0.1 covers children who die before they grow up and the slight excess of boys born. In countries with high child mortality, replacement is higher.'}},
    {lvl:'ap',q:'A country grows at 1.4% per year. What is its doubling time?',choices:['14 years','50 years','98 years'],correct:1,instant:true,
     explain:{ap:'Rule of 70: 70 ÷ 1.4 = 50 years. It comes from ln 2 ≈ 0.693, so doubling time ≈ 69.3 ÷ (growth rate in %).'}},
    {lvl:'ap',q:'Over the next 30 years, what happens to Japan’s dependency ratio (children plus people 65 and older, per 100 working-age adults)?',choices:['It rises','It falls','It stays the same'],correct:0,
     baseline:{preset:'japan'},baselineAction:'load',change:{},changeText:'Watching Japan age',watch:'dep',at:1,reveal:30,
     explain:{ap:'The large post-war generations move past 65 while fewer young people enter the workforce. More dependents per worker strains pensions and health care, a key issue for Stage 4–5 countries.'}},
    {lvl:'ap',q:'In Niger, life expectancy rises from 62 to 75 years while fertility stays the same. What happens to the growth rate?',choices:['It rises','It falls','It does not change'],correct:0,
     baseline:{preset:'niger'},baselineAction:'load',change:{e0:75},changeText:'Life expectancy raised to 75',watch:'gr',at:2,reveal:12,
     explain:{ap:'Lower death rates with the same birth rate widen the gap between births and deaths, so growth speeds up. That is exactly what happens in Stage 2 of the demographic transition.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does family size change a country’s growth?</p><ol><li>Choose Niger. Set the fertility rate to 6, 4, 3, 2 and 1.5, pressing Restart after each.</li><li>Let each run 10 years, then record a trial.</li><li>Plot fertility rate (x) against growth rate (y).</li></ol><p>At what fertility rate does growth reach zero? Why isn’t it exactly 2?</p>',
       honors:'<p><b>Question:</b> How does a country move through the demographic transition?</p><ol><li>Record the birth rate, death rate and growth rate for each preset country.</li><li>Put them in order from Stage 1 to Stage 5.</li><li>Compare their survivorship curves.</li></ol><p>Explain which rate falls first, and why.</p>',
       ap:'<p><b>Question:</b> How long does population momentum last?</p><ol><li>Choose India and set fertility to exactly 2.1.</li><li>Record population every 10 years for 70 years.</li><li>Repeat with fertility 1.5.</li></ol><p><b>Claim–evidence–reasoning:</b> Use the pyramid shape to explain why the population keeps growing after fertility reaches replacement.</p>'},
  terms:[{t:'Age-structure diagram',d:'A population pyramid showing how many people are in each age group.'},{t:'Total fertility rate (TFR)',d:'The average number of children a woman has in her lifetime.'},{t:'Replacement-level fertility',d:'About 2.1 children per woman: enough to replace both parents.'},
    {lvl:'honors',t:'Demographic transition',d:'The shift from high birth and death rates to low ones as a country develops.'},{lvl:'honors',t:'Crude birth/death rate',d:'Births or deaths per 1,000 people per year.'},{lvl:'honors',t:'Survivorship curve',d:'A graph of how many individuals survive to each age. Type I: most live long (humans). Type III: most die young (fish).'},
    {lvl:'ap',t:'Rule of 70',d:'Doubling time ≈ 70 ÷ growth rate (%).'},{lvl:'ap',t:'Population momentum',d:'Continued growth after fertility drops, because a large young generation is still having children.'},{lvl:'ap',t:'Dependency ratio',d:'People under 15 and 65+ per 100 people aged 15–64.'}],
  about:'<p><b>Model:</b> a cohort-component projection with single years of age (0–100) for each sex. Each year every age group ages by one, survives with probabilities from a Gompertz–Makeham mortality schedule tuned to the chosen life expectancy (women live about 5 years longer than men), and women aged 15–49 have children following a bell-shaped age pattern scaled to the total fertility rate, with 105 boys per 100 girls. Migrants are added at ages 20–34.</p><p><b>Presets:</b> each country’s pyramid is built by running its approximate fertility and mortality history, then scaling to its current population. They are teaching approximations, not official projections.</p><p><b>Simplified:</b> no wars, pandemics or sudden policy changes, and rates stay fixed unless you change them.</p>',
  initVis(sim){sim.vis.drops=[];sim.vis.acc=0;},
  draw(sim,ctx,vdt,k,t){const s=sim.st,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap'),P=PRESETS[sim.p.preset];
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    const m=groups5(s.m),f=groups5(s.f),T=total(s),cx=280,top=52,bh=17.4,gap=2,half=22,scaleX=230/10; // 10% fills the side
    const yOf=i=>top+(20-i)*(bh+gap);
    // grid
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;for(let pc=2;pc<=10;pc+=2){const dx=half+pc*scaleX;ctx.beginPath();ctx.moveTo(cx-dx,top-4);ctx.lineTo(cx-dx,yOf(0)+bh);ctx.moveTo(cx+dx,top-4);ctx.lineTo(cx+dx,yOf(0)+bh);ctx.stroke();
      txt(ctx,pc+'%',cx-dx,yOf(0)+bh+15,{s:11*k,c:PAL['cv-soft'],a:'center'});txt(ctx,pc+'%',cx+dx,yOf(0)+bh+15,{s:11*k,c:PAL['cv-soft'],a:'center'});}
    const male=PAL['s2'],fem=PAL['s1'];
    for(let i=0;i<21;i++){const y=yOf(i),wm=Math.min(260,100*m[i]/T*scaleX),wf=Math.min(260,100*f[i]/T*scaleX);const dep=(i<3||i>=13);
      ctx.globalAlpha=hon&&dep?0.55:1;ctx.fillStyle=male;ctx.fillRect(cx-half-wm,y,wm,bh);ctx.fillStyle=fem;ctx.fillRect(cx+half,y,wf,bh);ctx.globalAlpha=1;
      if(i%2===0||k<1.2)txt(ctx,i===20?'100+':String(i*5),cx,y+bh/2,{s:10.5*k,c:PAL['cv-soft'],a:'center',b:'middle'});
      // ghost of the starting pyramid
      const gm=100*s.start.m[i]/s.start.T*scaleX,gf=100*s.start.f[i]/s.start.T*scaleX;ctx.setLineDash([3,3]);ctx.strokeStyle=PAL['cv-ink'];ctx.globalAlpha=0.55;ctx.lineWidth=1.2;
      ctx.strokeRect(cx-half-Math.min(260,gm),y,Math.min(260,gm),bh);ctx.strokeRect(cx+half,y,Math.min(260,gf),bh);ctx.setLineDash([]);ctx.globalAlpha=1;}
    txt(ctx,'Male',cx-half-8,top-12,{s:13*k,w:700,c:male,a:'right'});txt(ctx,'Female',cx+half+8,top-12,{s:13*k,w:700,c:fem});txt(ctx,'Age',cx,top-12,{s:12*k,w:700,c:PAL['cv-soft'],a:'center'});
    if(hon){txt(ctx,'Faded bars: dependents (under 15, 65+)',cx,yOf(0)+bh+32,{s:11*k,c:PAL['cv-soft'],a:'center'});}
    txt(ctx,'Dashed: pyramid at the start',cx,yOf(0)+bh+(hon?47:32),{s:11*k,c:PAL['cv-soft'],a:'center'});
    // births dropping into the youngest bar
    if(vdt>0){v.acc+=Math.min(8,s.births/T*1000*0.35)*vdt*sim.speed;while(v.acc>=1){v.acc--;const male_=Math.random()<0.512;v.drops.push({x:male_?cx-half-10-Math.random()*60:cx+half+10+Math.random()*60,y:yOf(0)-30,vy:40,life:0.8,c:male_?male:fem});}}
    for(const d of v.drops){d.y+=d.vy*vdt;d.life-=vdt;ctx.globalAlpha=clamp(d.life/0.8,0,1);ctx.fillStyle=d.c;ctx.beginPath();ctx.arc(d.x,d.y,3.2,0,6.29);ctx.fill();}ctx.globalAlpha=1;v.drops=v.drops.filter(d=>d.life>0);if(v.drops.length>40)v.drops.splice(0,v.drops.length-40);
    // header
    const yr=(P?P.year:2026)+Math.floor(sim.t);pill(ctx,(P?P.l.replace(/ \(.*\)/,''):'Country')+' · '+yr+' · '+fmtPop(T),cx,20,PAL['card'],PAL['cv-ink'],13*k);
    // demographic transition mini-chart
    const bx=556,by=40,bw=232,bH=196;ctx.fillStyle=PAL['card'];rr(ctx,bx-8,by-6,bw+16,bH+12,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
    txt(ctx,'Demographic transition',bx+bw/2,by+12,{s:12.5*k,w:700,a:'center'});
    const px=sx=>bx+sx*bw,py=v_=>by+bH-26-v_*(bH-60);
    for(let i=1;i<5;i++){ctx.strokeStyle=PAL['line'];ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(px(i/5),by+22);ctx.lineTo(px(i/5),by+bH-24);ctx.stroke();ctx.setLineDash([]);}
    for(let i=0;i<5;i++)txt(ctx,String(i+1),px((i+0.5)/5),by+bH-10,{s:12*k,w:700,c:PAL['cv-soft'],a:'center'});
    const br=x=>x<0.4?0.85:x<0.75?0.85-(x-0.4)/0.35*0.65:x<0.85?0.2:0.2-(x-0.85)*0.6,dr=x=>x<0.2?0.85:x<0.5?0.85-(x-0.2)/0.3*0.6:0.25-(x-0.5)*0.1,pp=x=>0.05+0.8/(1+Math.exp(-(x-0.5)*9))-(x>0.85?(x-0.85)*1.5:0);
    [[br,PAL['s1'],'Births'],[dr,PAL['s2'],'Deaths'],[pp,PAL['s3'],'Population']].forEach((L,j)=>{ctx.strokeStyle=L[1];ctx.lineWidth=2.5;ctx.setLineDash(j===2?[5,3]:[]);ctx.beginPath();for(let i=0;i<=50;i++){const x=i/50;i?ctx.lineTo(px(x),py(L[0](x))):ctx.moveTo(px(x),py(L[0](x)));}ctx.stroke();ctx.setLineDash([]);});
    const n=stageNum(sim);const mx=px((n-0.5)/5);ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(mx,by+36,7,0,6.29);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.stroke();
    txt(ctx,'Now',mx+(n===5?-11:11),by+37,{s:11.5*k,w:700,c:PAL['cv-ink'],a:n===5?'right':'left',b:'middle'});
    let lx=bx;[['Births',PAL['s1']],['Deaths',PAL['s2']],['Pop.',PAL['s3']]].forEach(L=>{ctx.fillStyle=L[1];ctx.fillRect(lx,by+bH+16,12,4);txt(ctx,L[0],lx+16,by+bH+18,{s:11*k,c:PAL['cv-soft'],b:'middle'});lx+=78;});
    // key numbers
    const S=stats(s);const rows=[['Under 15',S.kids.toFixed(0)+'%'],['65 and older',S.old.toFixed(0)+'%'],['Growth',S.gr.toFixed(2)+'%/yr']];
    rows.forEach((r_,i)=>{txt(ctx,r_[0],bx,by+bH+52+i*22*Math.min(k,1.3),{s:12.5*k,c:PAL['cv-soft']});txt(ctx,r_[1],bx+bw,by+bH+52+i*22*Math.min(k,1.3),{s:13*k,w:700,a:'right'});});}
};
BioLab.register(HP);
})();
