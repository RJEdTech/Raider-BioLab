(function(){
'use strict';
const {clamp,rng,binom,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,legend,lvText,fmtNum}=BioLab.h;

/* SIR / SEIR epidemic in a town. City mode is the smooth (deterministic) model for 10,000 people;
   village mode is a chance-driven (stochastic) model for 100 people. The dots on the stage follow the
   model's counts: every new infection is drawn as a line from a nearby sick person. */
const PRESETS={
  flu:{contacts:10,trans:3.3,days:4,lat:2},
  covid:{contacts:10,trans:4,days:7,lat:5},
  measles:{contacts:20,trans:9.4,days:8,lat:10}
};
const CITY=10000,VILLAGE=100;
const TOWN={x:12,y:44,w:510,h:394};
const COL=()=>({S:PAL['s2'],E:PAL['s4'],I:PAL['s1'],R:PAL['s3'],V:PAL['s5']});

function params(sim){const p=sim.p;const c=p.contacts*(1-p.dist/100);const tau=p.trans/100*(p.masks?0.6:1);const D=p.days;
  return {c,tau,D,beta:c*tau,gamma:1/D,R:c*tau*D,latent:!!p.latent,sigma:1/Math.max(1,p.lat)};}
function hit(R){return R>1?(1-1/R)*100:0;}
function matchesPreset(p){const q=PRESETS[p.disease];return q&&q.contacts===p.contacts&&Math.abs(q.trans-p.trans)<1e-9&&q.days===p.days;}

/* one chance-driven village outbreak, used by the "Run 50 villages" batch */
function villageRun(sim){const q=params(sim),p=sim.p;const N=VILLAGE;let V=Math.round(p.vax/100*N);let S=N-V-1,E=0,I=1,C=1,t=0;const dt=0.25;
  while((I+E)>0&&t<400){const ni=binom(S,1-Math.exp(-q.beta*I/N*dt));const nr=binom(I,1-Math.exp(-q.gamma*dt));
    if(q.latent){const ne=binom(E,1-Math.exp(-q.sigma*dt));E+=ni-ne;I+=ne-nr;}else{I+=ni-nr;}S-=ni;C+=ni;t+=dt;}
  return C;}
function runBatch(sim){const sizes=[];for(let i=0;i<50;i++)sizes.push(villageRun(sim));sim.st.batch={n:50,sizes,big:sizes.filter(c=>c>=10).length};}

const SIM={
  id:'epidemic',hash:'epidemic',apUnit:11,order:6,kind:'Go further',prereq:['virus'],
  tab:'Epidemics and herd immunity',
  card:'Release a disease into a town of 10,000, then use vaccines, distancing and masks to stop it.',
  title:'Epidemics and herd immunity',
  lede:{bio:'A disease spreads from person to person. Change how many people each person meets and how many are vaccinated, and watch whether the outbreak takes off or fizzles out.',
        honors:'R₀ is contacts × chance of passing it on × days contagious. Push the effective R below 1 with vaccines, distancing or masks, and compare flu, COVID-19 and measles.',
        ap:'Run the SIR model, add a latent period (SEIR), and compare the smooth city model with chance-driven village outbreaks that can die out on their own.'},
  scale:{bio:'A town of 10,000 people over several months. Each dot stands for 50 people.',
         ap:'City mode: 10,000 people, each dot is 50 people, smooth (deterministic) model. Village mode: 100 people, one dot each, chance (stochastic) model.'},
  timeScale:6,dtMax:0.05,prewarm:0,sampleDt:0.5,window:200,unit:'days',timeLabel:'Day',clock:sim=>'Day '+Math.floor(sim.t),
  chChange:2,chReveal:150,
  controls:[
    {id:'disease',label:'Disease',type:'seg',def:'covid',lvl:'bio',options:[{v:'flu',l:'Flu'},{v:'covid',l:'COVID-19'},{v:'measles',l:'Measles'},{v:'custom',l:'Custom',lvl:'honors'}],
     help:'Sets the three numbers below to typical values',
     onChange(sim){const q=PRESETS[sim.p.disease];if(q)BioLab.setValues(sim,{contacts:q.contacts,trans:q.trans,days:q.days,lat:q.lat});}},
    {id:'contacts',label:'People each person meets per day',type:'range',min:1,max:30,step:1,def:10,unit:'',lvl:'bio',
     onChange(sim){if(sim.p.disease!=='custom'&&!matchesPreset(sim.p)&&atLeast('honors'))BioLab.setValues(sim,{disease:'custom'});}},
    {id:'vax',label:'Vaccinated',type:'range',min:0,max:100,step:1,def:0,unit:'%',lvl:'bio',help:'Vaccinated people cannot catch or pass on the disease'},
    {id:'trans',label:'Chance of passing it on per meeting',type:'range',min:1,max:20,step:0.1,def:4,unit:'%',lvl:'honors',
     onChange(sim){if(sim.p.disease!=='custom'&&!matchesPreset(sim.p))BioLab.setValues(sim,{disease:'custom'});}},
    {id:'days',label:'Days contagious',type:'range',min:1,max:14,step:1,def:7,unit:' days',lvl:'honors',
     onChange(sim){if(sim.p.disease!=='custom'&&!matchesPreset(sim.p))BioLab.setValues(sim,{disease:'custom'});}},
    {id:'dist',label:'Social distancing',type:'range',min:0,max:80,step:5,def:0,unit:'%',lvl:'honors',help:'Cuts the number of people each person meets'},
    {id:'masks',label:'Masks',type:'toggle',def:false,lvl:'honors',help:'Lower the chance of passing it on per meeting by 40%'},
    {id:'latent',label:'Latent period (SEIR)',type:'toggle',def:false,lvl:'ap',help:'Infected people are not contagious at first'},
    {id:'lat',label:'Days before contagious',type:'range',min:1,max:14,step:1,def:5,unit:' days',lvl:'ap'},
    {id:'model',label:'Model',type:'seg',def:'city',lvl:'ap',options:[{v:'city',l:'City of 10,000 (smooth)'},{v:'village',l:'Village of 100 (chance)'}],
     onChange(sim){if(sim.ch.phase!=='running')BioLab.reset(sim);}}
  ],
  actions:[
    {id:'add',label:'Bring in a sick traveler',lvl:'bio',run(sim){const s=sim.st;if(s.S>=1){s.S-=1;s.I+=1;s.C+=1;}}},
    {id:'batch',label:'Run 50 villages',lvl:'ap',primary:true,run(sim){runBatch(sim);if(sim.ui&&sim.ui.gm&&[...sim.ui.gm.options].some(o=>o.value==='batch')){sim.gMetric='batch';sim.ui.gm.value='batch';}}}
  ],
  init(sim){const N=sim.p.model==='village'?VILLAGE:CITY,I0=N===VILLAGE?1:10;
    return {N,S:N-I0,E:0,I:I0,R:0,V:0,C:I0,peakI:I0,peakDay:0,series:[],lastSer:-1,batch:null,newInf:0};},
  step(sim,dt){const s=sim.st,p=sim.p,q=params(sim);
    const target=Math.round(p.vax/100*s.N);
    if(target>s.V){const m=Math.min(s.S,target-s.V);s.S-=m;s.V+=m;}else if(target<s.V){const m=s.V-target;s.V-=m;s.S+=m;}
    if(!q.latent&&s.E>0){s.I+=s.E;s.E=0;}
    if(s.N===VILLAGE){
      const S=Math.round(s.S),ni=binom(S,1-Math.exp(-q.beta*s.I/s.N*dt)),nr=binom(Math.round(s.I),1-Math.exp(-q.gamma*dt));
      if(q.latent){const ne=binom(Math.round(s.E),1-Math.exp(-q.sigma*dt));s.E+=ni-ne;s.I+=ne-nr;}else s.I+=ni-nr;
      s.S-=ni;s.R+=nr;s.C+=ni;s.newInf+=ni;
    }else{
      const ni=Math.min(s.S,q.beta*s.S*s.I/s.N*dt),nr=Math.min(s.I,q.gamma*s.I*dt);
      if(q.latent){const ne=Math.min(s.E,q.sigma*s.E*dt);s.E+=ni-ne;s.I+=ne-nr;}else s.I+=ni-nr;
      s.S-=ni;s.R+=nr;s.C+=ni;s.newInf+=ni;
      if(s.I<0.5&&s.E<0.5&&s.I+s.E>0){s.R+=s.I+s.E;s.I=0;s.E=0;}
    }
    if(s.I>s.peakI){s.peakI=s.I;s.peakDay=Math.max(0,sim.t);}
    if(sim.t<s.lastSer)s.series=[];
    if(sim.t-s.lastSer>=0.5||s.lastSer<0){s.lastSer=sim.t;s.series.push({t:sim.t,S:s.S/s.N,E:s.E/s.N,I:s.I/s.N,R:s.R/s.N,V:s.V/s.N});if(s.series.length>900)s.series.shift();}},
  metrics:[
    {id:'sick',label:'Sick right now',unit:'people',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.I+s.st.E},
    {id:'ever',label:'Ever infected',unit:'% of town',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.C/s.st.N*100},
    {id:'peak',label:'Peak sick at once',unit:'people',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.peakI},
    {id:'r0',label:'Each sick person infects (R₀)',unit:'people',lvl:'bio',min:0,max:16,d:1,get:s=>params(s).R},
    {id:'hit',label:'Herd immunity threshold',unit:'% immune',lvl:'bio',min:0,max:100,d:0,get:s=>hit(params(s).R)},
    {id:'reff',label:'Infects right now (Rₑ)',unit:'people',lvl:'honors',min:0,max:16,d:2,get:s=>params(s).R*s.st.S/s.st.N},
    {id:'pday',label:'Peak day',unit:'day',lvl:'honors',min:0,max:null,d:0,get:s=>s.st.peakDay},
    {id:'batch',label:'Villages with a big outbreak',unit:'',lvl:'ap',text:true,noTrial:false,get:s=>s.st.batch?(s.st.batch.big+' of '+s.st.batch.n+' (10+ infected)'):'Press Run 50 villages'}
  ],
  graphs:[{id:'sir',label:'Town over time (S, I, R)',custom:true},{id:'batch',label:'50 villages: outbreak sizes',lvl:'ap',custom:true}],
  defaultGraph:'sir',
  plot(sim,ctx,box,id){const s=sim.st,C=COL();
    if(id==='batch'){if(!s.batch){txt(ctx,'Press “Run 50 villages” to see how 50 outbreaks turn out.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
      const bins=new Array(10).fill(0);s.batch.sizes.forEach(c=>{bins[Math.min(9,Math.floor((c-1)/10))]++;});
      const ax=axes(ctx,box,{xmin:0,xmax:10,ymin:0,ymax:Math.max(10,...bins)*1.15,xcats:['1–10','11–20','21–30','31–40','41–50','51–60','61–70','71–80','81–90','91–100'],xl:'People infected in the village (of 100)',yl:'Villages'});
      bars(ctx,ax,bins,{colors:bins.map((b,i)=>i===0?PAL['s2']:PAL['s1'])});return;}
    const ser=s.series,tmax=Math.max(sim.def.window,sim.t),tmin=tmax-sim.def.window;const b2=Object.assign({},box,{T:box.T+24,H:box.H-24});
    const ax=axes(ctx,b2,{xmin:tmin,xmax:tmax,ymin:0,ymax:100,xl:'Day',yl:'% of town'});
    const keys=[['S','Susceptible'],['E','Exposed'],['I','Infected'],['R','Recovered'],['V','Vaccinated']].filter(([k])=>k!=='E'||sim.p.latent);
    ctx.save();ctx.beginPath();ctx.rect(b2.L,b2.T,b2.W,b2.H);ctx.clip();
    keys.forEach(([k])=>{ctx.beginPath();let on=false;ser.forEach(pt=>{if(pt.t<tmin)return;const x=ax.X(pt.t),y=ax.Y(pt[k]*100);on?ctx.lineTo(x,y):ctx.moveTo(x,y);on=true;});ctx.strokeStyle=C[k];ctx.lineWidth=k==='I'?3:2.2;ctx.stroke();});
    ctx.restore();legend(ctx,b2.L,box.T+10,keys.map(([k,l])=>({label:l,color:C[k]})));},
  challenges:[
    {lvl:'bio',q:'A COVID-like disease has just arrived. If 70% of the town gets vaccinated right now, what happens?',
     choices:['Almost everyone still gets sick, just more slowly','The outbreak fizzles out: each sick person now infects fewer than one other','Only the vaccinated people get sick'],correct:1,
     change:{vax:70},changeText:'70% of the town vaccinated',watch:'sir',
     explain:{bio:'With 70% immune, a sick person’s contacts are mostly people who can’t catch it. Each case passes it on to fewer than one new person, so the chain of infections dies out. That protection for everyone, even the unvaccinated, is herd immunity.',
              honors:'R₀ ≈ 2.8, so the herd immunity threshold is 1 − 1/2.8 ≈ 64%. At 70% vaccinated, Rₑ = 2.8 × 0.30 ≈ 0.84, below 1, so cases shrink instead of growing.'}},
    {lvl:'bio',q:'Everyone cuts the number of people they meet each day in half, from 10 to 5. What happens to the outbreak’s peak?',
     choices:['The peak is higher and comes sooner','The peak is much lower and comes later','Nothing changes'],correct:1,
     change:{contacts:5},changeText:'Contacts cut from 10 to 5 per day',watch:'sir',reveal:200,
     explain:{bio:'Fewer meetings means fewer chances to pass the disease on, so it spreads more slowly. Fewer people are sick at the same time, which keeps hospitals from being overwhelmed. This is “flattening the curve.”',
              honors:'Halving contacts halves R₀ (2.8 → 1.4). The epidemic still happens, but it grows slowly, peaks much lower and later, and infects fewer people in total.'}},
    {lvl:'honors',q:'Flu needs only about 25% of people immune to stop spreading. Measles has R₀ ≈ 15. With 80% of the town vaccinated, can measles still spread?',
     choices:['No, 80% is far above what flu needs','Yes, measles needs about 93% immune before it stops'],correct:1,
     baseline:{disease:'measles',vax:80},change:{},changeText:'Measles arrives in a town that is 80% vaccinated',watch:'sir',reveal:100,
     explain:{honors:'The threshold is 1 − 1/R₀. For flu (R₀ ≈ 1.3) that is about 25%, but for measles (R₀ ≈ 15) it is about 93%. At 80% vaccinated, Rₑ = 15 × 0.20 = 3, so measles still tears through the unvaccinated 20%. That is why measles outbreaks start when vaccination rates slip even a little.'}},
    {lvl:'honors',q:'A new treatment makes people contagious for 3 days instead of 7. Contacts and chance per meeting stay the same. What happens?',
     choices:['Nothing, because the same people still meet','The outbreak becomes much smaller, because R₀ drops from 2.8 to about 1.2','The outbreak gets bigger'],correct:1,
     change:{days:3},changeText:'Contagious period cut from 7 to 3 days',watch:'sir',reveal:200,
     explain:{honors:'R₀ = contacts × chance per meeting × days contagious = 10 × 4% × 3 ≈ 1.2. A shorter contagious period means fewer people infected per case, so the outbreak grows slowly and infects far fewer people.'}},
    {lvl:'ap',q:'Turn on a 5-day latent period: newly infected people are not contagious for 5 days. R₀ stays 2.8. What changes?',
     choices:['The peak comes later, but about the same share of the town gets infected in the end','Far fewer people get infected in the end','The peak comes sooner'],correct:0,
     change:{latent:true},changeText:'Latent period turned on (SEIR)',watch:'sir',reveal:240,
     explain:{ap:'A latent period stretches each generation of infection, so the epidemic grows more slowly and peaks later. But each case still causes R₀ new cases, and the final size depends only on R₀: about 92% here, same as the SIR model. Compare the “Ever infected” readout.'}},
    {lvl:'ap',q:'Flu (R₀ ≈ 1.3) arrives in 50 separate villages of 100 people, one sick traveler each. In how many does a big outbreak (10+ people) happen?',
     choices:['All 50, because R₀ is above 1','Only some, roughly 1 in 4 to 1 in 3; the rest fizzle out by chance','None, because R₀ is so close to 1'],correct:1,
     baseline:{disease:'flu',model:'village'},changeAction:'batch',at:1,reveal:4,changeText:'50 villages simulated',watch:'batch',
     explain:{ap:'With R₀ = 1.3, the first sick person often recovers before infecting anyone, or the first few cases happen to infect no one. Branching-process theory says a single case fizzles out with probability about 1/R₀ ≈ 0.77, so only a quarter to a third of villages get a real outbreak (a few small chains reach 10 people before dying out). The smooth city model cannot show this; only a chance-driven model can.'}}
  ],
  narrate(sim){const s=sim.st,q=params(sim),re=q.R*s.S/s.N,imm=(s.R+s.V)/s.N*100,th=hit(q.R),hon=atLeast('honors');
    if(s.I+s.E<0.5)return s.C/s.N>0.05?'<b>The outbreak is over.</b> '+Math.round(s.C/s.N*100)+'% of the town caught it. The rest were protected because too few susceptible people were left to keep the chain going.':'<b>No one is sick right now.</b> Press “Bring in a sick traveler” to start an outbreak.';
    if(s.V/s.N*100>=th&&th>0)return '<b>'+Math.round(s.V/s.N*100)+'% are vaccinated, above the herd immunity threshold of '+Math.round(th)+'%.</b> Each sick person meets too few people who can catch it, so the disease cannot take off.';
    if(re>1)return '<b>Cases are growing.</b> Each sick person is infecting about '+re.toFixed(1)+' others'+(hon?' (Rₑ = R₀ × share still susceptible)':'')+', so every round of infection is bigger than the last.';
    return '<b>Cases are shrinking.</b> So many people are immune ('+Math.round(imm)+'%) that each sick person now infects only about '+re.toFixed(2)+' others, fewer than one.';},
  tour:[
    {title:'The town',text:'Each dot stands for 50 people in a town of 10,000. Blue dots can still catch the disease. Ten people (a red dot) have just come back sick.',focus:[TOWN.x,TOWN.y-6,TOWN.w,TOWN.h+8],speed:0.3},
    {title:'Passing it on',text:'Sick people (red) meet others as they move around town. Each red line is one infection passed on during a meeting.',focus:[TOWN.x,TOWN.y-6,TOWN.w,TOWN.h+8],speed:0.4},
    {title:'R₀: how many each case infects',text:'R₀ multiplies three things: people met per day × chance of passing it on per meeting × days contagious. For this COVID-like disease, 10 × 4% × 7 ≈ 2.8.',focus:[532,40,262,128],pause:true},
    {title:'Who is immune',text:'This bar shows the whole town. When the immune share (recovered plus vaccinated) passes the dashed line, the herd immunity threshold, the outbreak starts shrinking.',focus:[532,176,262,110],speed:0.6},
    {title:'Herd immunity',text:'Now we restart and vaccinate 70% of the town first. Watch: the sick travelers infect a few people, but the chain dies out.',focus:[[TOWN.x,TOWN.y-6,TOWN.w,TOWN.h+8],[532,176,262,110]],speed:1,setup(sim){BioLab.setValues(sim,{vax:70});BioLab.reset(sim);}},
    {lvl:'honors',title:'Flattening the curve',text:'No vaccine this time, but everyone cuts their contacts by half (50% distancing). R drops from 2.8 to 1.4: the outbreak still happens, but slowly, with fewer people sick at once.',focus:[532,40,262,128],speed:1.5,setup(sim){BioLab.setValues(sim,{vax:0,dist:50});BioLab.reset(sim);}},
    {lvl:'ap',title:'Latent period (SEIR)',text:'Now new infections spend 5 days “exposed” (amber) before becoming contagious. The epidemic slows down and peaks later, but R₀ and the final size do not change.',focus:[TOWN.x,TOWN.y-6,TOWN.w,TOWN.h+8],speed:1.5,setup(sim){BioLab.setValues(sim,{dist:0,latent:true});BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{vax:0,dist:0,latent:false});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How much of the town has to be vaccinated to stop a COVID-like outbreak?</p><ol><li>Set Vaccinated to 0%, press Reset, and let the outbreak run to about day 150. Record a trial.</li><li>Repeat at 20, 40, 60, 70 and 80% vaccinated.</li><li>On the Trials graph, plot Vaccinated (x) against Ever infected (y).</li></ol><p>Where does the curve drop to nearly zero? Compare it with the herd immunity threshold readout.</p>',
       honors:'<p><b>Question:</b> Why does measles need much higher vaccination rates than flu?</p><ol><li>For flu, COVID-19 and measles, find the lowest vaccination rate that keeps Ever infected under 5%. Reset after each change.</li><li>Record R₀ and the herd immunity threshold for each.</li></ol><p>Explain the pattern using R₀ = contacts × chance per meeting × days contagious.</p>',
       ap:'<p><b>Question:</b> Does the herd immunity formula 1 − 1/R₀ predict the outcome, and when does chance matter?</p><ol><li>In City mode, test vaccination levels just below and just above 1 − 1/R₀ for three custom diseases.</li><li>Switch to Village mode and press Run 50 villages at R₀ ≈ 1.3, 2 and 4. Record how many villages had a big outbreak.</li><li>Compare with the branching-process prediction 1 − 1/R₀.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why small, isolated outbreaks often fizzle even when R₀ &gt; 1.</p>'},
  terms:[{t:'Susceptible',d:'Able to catch the disease: not immune yet.'},{t:'R₀ (basic reproduction number)',d:'The average number of people one sick person infects when everyone else is susceptible.'},{t:'Herd immunity',d:'When enough people are immune that each case infects fewer than one other, protecting even those who are not immune.'},{t:'Epidemic curve',d:'A graph of how many people are sick over time.'},
    {lvl:'honors',t:'Effective reproduction number (Rₑ)',d:'R₀ × the fraction still susceptible. The outbreak grows while Rₑ > 1 and shrinks once Rₑ < 1.'},{lvl:'honors',t:'Herd immunity threshold',d:'1 − 1/R₀: the share of people who must be immune to stop sustained spread.'},{lvl:'honors',t:'Flattening the curve',d:'Slowing spread so fewer people are sick at the same time.'},
    {lvl:'ap',t:'SEIR model',d:'Adds an Exposed group: infected but not yet contagious.'},{lvl:'ap',t:'Stochastic extinction',d:'An outbreak dying out by chance while case numbers are still small.'},{lvl:'ap',t:'Final size',d:'The share of people ever infected. In SIR and SEIR models it depends only on R₀.'}],
  about:'<p><b>City mode</b> uses the SIR equations, stepped forward every 0.05 days: new infections per day = β·S·I/N, recoveries per day = γ·I, with β = contacts × chance per meeting and γ = 1/(days contagious). So R₀ = β/γ. With the latent period on (SEIR), new infections enter an Exposed group and become contagious at rate 1/(latent days).</p><p><b>Village mode</b> uses the same rates but draws each day’s infections and recoveries at random (binomial chances), so small outbreaks can die out by luck.</p><p><b>Simplifications:</b> everyone mixes equally (no households, schools or age groups), vaccines are 100% effective and given instantly, immunity is permanent, nobody is born or dies, and distancing and masks simply scale contacts and transmission. Real outbreaks also have superspreaders and changing behavior. The town dots are a sample that follows the model’s counts; each dot stands for 50 people in City mode.</p>',
  thumbSetup(sim){for(let i=0;i<500;i++){sim.def.step(sim,0.1);sim.t+=0.1;}},
  initVis(sim){const r=rng(31),v=sim.vis,s=sim.st,nv=s.N===VILLAGE?100:200;v.nv=nv;v.links=[];v.r=r;
    v.blocks=[];const bx=[TOWN.x+14,TOWN.x+136,TOWN.x+258,TOWN.x+380],by=[TOWN.y+16,TOWN.y+144,TOWN.y+272];
    bx.forEach((x,i)=>by.forEach((y,j)=>{v.blocks.push({x,y,w:104,h:104,label:(i===1&&j===1)?'School':(i===3&&j===0)?'Market':(i===0&&j===2)?'Clinic':''});}));
    v.dots=[];for(let i=0;i<nv;i++){const b=v.blocks[i%v.blocks.length],hx=b.x+10+r()*(b.w-20),hy=b.y+10+r()*(b.h-20);v.dots.push({hx,hy,x:hx,y:hy,vx:0,vy:0,st:'S',since:0,ph:r()*6.28});}
    v.clock=0;reconcile(sim,true);},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,C=COL(),q=params(sim),hon=atLeast('honors'),ap=atLeast('ap');
    if(!v.dots||v.nv!==(s.N===VILLAGE?100:200))SIM.initVis(sim);
    v.clock+=vdt;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // town
    ctx.fillStyle=PAL['cv-bg2'];rr(ctx,TOWN.x,TOWN.y,TOWN.w,TOWN.h,12);ctx.fill();
    v.blocks.forEach(b=>{ctx.fillStyle=PAL['card'];rr(ctx,b.x,b.y,b.w,b.h,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
      if(b.label)txt(ctx,b.label,b.x+b.w/2,b.y+b.h-8,{s:11.5*k,w:600,c:PAL['cv-soft'],a:'center'});});
    txt(ctx,(s.N===VILLAGE?'Village of 100 · each dot = 1 person':'Town of 10,000 · each dot = 50 people'),TOWN.x+4,30,{s:13*k,w:700});
    reconcile(sim,false);
    // movement
    const dist=p.dist/100,amp=(RM?0.3:1)*(1-0.8*dist),spring=0.6+3*dist;
    v.dots.forEach(d=>{const sick=d.st==='I';d.vx+=(Math.random()-.5)*160*vdt*amp-(d.x-d.hx)*spring*vdt*(sick?3:1);d.vy+=(Math.random()-.5)*160*vdt*amp-(d.y-d.hy)*spring*vdt*(sick?3:1);
      const sp=Math.hypot(d.vx,d.vy),mx=(sick?10:28)*amp+2;if(sp>mx){d.vx*=mx/sp;d.vy*=mx/sp;}d.x=clamp(d.x+d.vx*vdt,TOWN.x+5,TOWN.x+TOWN.w-5);d.y=clamp(d.y+d.vy*vdt,TOWN.y+5,TOWN.y+TOWN.h-5);});
    // transmission lines
    v.links=v.links.filter(l=>(l.life-=vdt)>0);
    v.links.forEach(l=>{ctx.globalAlpha=clamp(l.life/1.2,0,1);ctx.strokeStyle=C.I;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(l.a.x,l.a.y);ctx.lineTo(l.b.x,l.b.y);ctx.stroke();});ctx.globalAlpha=1;
    const rad=s.N===VILLAGE?5.5:4.6;
    v.dots.forEach(d=>{ctx.fillStyle=C[d.st];ctx.beginPath();ctx.arc(d.x,d.y,d.st==='I'?rad+1:rad,0,6.29);ctx.fill();
      if(p.masks&&hon){ctx.fillStyle='#ffffff';ctx.fillRect(d.x-rad*0.8,d.y+rad*0.05,rad*1.6,rad*0.55);}
      if(d.st==='I'&&!RM){ctx.strokeStyle=C.I;ctx.globalAlpha=0.35+0.25*Math.sin(t*5+d.ph);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(d.x,d.y,rad+4,0,6.29);ctx.stroke();ctx.globalAlpha=1;}});
    // right panel 1: R0 explanation
    const PX=532,PW=262;
    ctx.fillStyle=PAL['card'];rr(ctx,PX,40,PW,128,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
    txt(ctx,'Each sick person infects',PX+12,62,{s:13*k,w:700});
    txt(ctx,q.R.toFixed(1),PX+12,98,{s:30,w:800,c:C.I});
    txt(ctx,(hon?'R₀ = ':'')+q.c.toFixed(q.c%1?1:0)+' met × '+(q.tau*100).toFixed(1)+'% × '+q.D+' d',PX+76,92,{s:12*k,c:PAL['cv-soft']});
    // fan diagram
    const n=Math.min(16,Math.round(q.R)),fx=PX+22,fy=140;ctx.fillStyle=C.I;ctx.beginPath();ctx.arc(fx,fy,6,0,6.29);ctx.fill();
    for(let i=0;i<n;i++){const x=fx+30+i*13.5,y=fy;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(fx+7,fy);ctx.lineTo(x-4,y);ctx.stroke();ctx.fillStyle=C.S;ctx.beginPath();ctx.arc(x,y,4.5,0,6.29);ctx.fill();}
    if(q.R%1>0.05&&n<16){const x=fx+30+n*13.5;ctx.globalAlpha=(q.R%1);ctx.fillStyle=C.S;ctx.beginPath();ctx.arc(x,fy,4.5,0,6.29);ctx.fill();ctx.globalAlpha=1;}
    // right panel 2: population bar with threshold
    ctx.fillStyle=PAL['card'];rr(ctx,PX,176,PW,110,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
    txt(ctx,'Whole town',PX+12,198,{s:13*k,w:700});
    const bx=PX+12,bw=PW-24,by=210,bh=26;let x0=bx;
    [['V',s.V],['R',s.R],['I',s.I],['E',s.E],['S',s.S]].forEach(([key,val])=>{const w=bw*val/s.N;if(w<=0)return;ctx.fillStyle=C[key];ctx.fillRect(x0,by,w,bh);x0+=w;});
    const th=hit(q.R);if(th>0){const tx=bx+bw*th/100;ctx.setLineDash([4,3]);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx,by-6);ctx.lineTo(tx,by+bh+6);ctx.stroke();ctx.setLineDash([]);}
    const imm=(s.R+s.V)/s.N*100;
    txt(ctx,'Immune '+Math.round(imm)+'%',bx,by+bh+20,{s:12.5*k,w:700,c:PAL['cv-ink']});
    txt(ctx,th>0?'Needed '+Math.round(th)+'%':'R₀ ≤ 1: cannot spread',bx+bw,by+bh+20,{s:12.5*k,c:PAL['cv-soft'],a:'right'});
    // right panel 3: legend with counts
    ctx.fillStyle=PAL['card'];rr(ctx,PX,294,PW,144,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
    const rows=[['S','Can catch it',s.S],['I','Sick, contagious',s.I],['R','Recovered, immune',s.R],['V','Vaccinated',s.V]];if(p.latent)rows.splice(1,0,['E','Exposed, not yet contagious',s.E]);
    rows.forEach((r,i)=>{const y=318+i*(p.latent?24:28);ctx.fillStyle=C[r[0]];ctx.beginPath();ctx.arc(PX+18,y-4,6,0,6.29);ctx.fill();txt(ctx,r[1],PX+32,y,{s:12.5*k,c:PAL['cv-ink']});txt(ctx,Math.round(r[2]).toLocaleString('en-US'),PX+PW-12,y,{s:12.5*k,w:700,a:'right'});});
  }
};
/* Bring the dots in line with the model's counts. New infections are drawn from the nearest
   susceptible dot to a sick dot, with a line showing who infected whom. */
function reconcile(sim,init){const s=sim.st,v=sim.vis,d=v.dots,nv=v.nv,sc=nv/s.N,latent=!!sim.p.latent;
  const tg={I:Math.round(s.I*sc),E:Math.round(s.E*sc),R:Math.round(s.R*sc),V:Math.round(s.V*sc)};
  if(s.I>=0.5&&tg.I===0)tg.I=1;if(s.E>=0.5&&tg.E===0)tg.E=1;
  const cnt={S:0,E:0,I:0,R:0,V:0};d.forEach(x=>cnt[x.st]++);
  const set=(x,st)=>{cnt[x.st]--;x.st=st;x.since=v.clock;cnt[st]++;};
  const evT=tg.E+tg.I+tg.R,ev=cnt.E+cnt.I+cnt.R;
  if(ev>evT+3||init){d.forEach(x=>{x.st='S';});cnt.S=nv;cnt.E=cnt.I=cnt.R=cnt.V=0;
    const order=d.slice().sort((a,b)=>a.ph-b.ph);let i=0;
    for(let n=0;n<tg.I;n++)set(order[i++],'I');for(let n=0;n<tg.E;n++)set(order[i++],'E');for(let n=0;n<tg.R;n++)set(order[i++],'R');for(let n=0;n<tg.V&&i<nv;n++)set(order[i++],'V');return;}
  const S=()=>d.filter(x=>x.st==='S');
  while(cnt.V<tg.V&&cnt.S>0){const a=S();set(a[(Math.random()*a.length)|0],'V');}
  while(cnt.V>tg.V){const a=d.filter(x=>x.st==='V');set(a[0],'S');}
  let need=evT-(cnt.E+cnt.I+cnt.R);
  while(need>0&&cnt.S>0){const src=d.filter(x=>x.st==='I'||x.st==='E');const a=src.length?src[(Math.random()*src.length)|0]:null;let best=null,bd=1e9;
    S().forEach(x=>{const dd=a?Math.hypot(x.x-a.x,x.y-a.y):Math.random();if(dd<bd){bd=dd;best=x;}});
    set(best,latent?'E':'I');if(a&&!init)v.links.push({a,b:best,life:1.2});need--;}
  const oldest=st=>d.filter(x=>x.st===st).sort((a,b)=>a.since-b.since);
  if(cnt.I<tg.I&&cnt.E>0){const o=oldest('E');while(cnt.I<tg.I&&o.length)set(o.shift(),'I');}
  if(cnt.R<tg.R&&cnt.I>0){const o=oldest('I');while(cnt.R<tg.R&&o.length)set(o.shift(),'R');}
  if(cnt.R<tg.R&&cnt.E>0){const o=oldest('E');while(cnt.R<tg.R&&o.length)set(o.shift(),'R');}
  if(cnt.I>tg.I+1){const o=oldest('I');while(cnt.I>tg.I&&o.length)set(o.shift(),'R');}
}
SIM.onLevel=function(sim){};
BioLab.register(SIM);
})();
