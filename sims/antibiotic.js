(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,lvText,fmtNum}=BioLab.h;

/* Three ways to watch antibiotic resistance evolve:
   MEGA-plate: a grid of sites on a long dish with antibiotic bands; bacteria spread into empty
     neighbor sites and each division has a small chance of one more resistance step.
   Patient: sensitive (S) and resistant (R) bacteria in an infection, with dosing every 12 h.
   Flask: daily-transfer competition between resistant and sensitive strains. */
const GW=63,GH=18,BW=7;
const BANDS={steps:[0,1,2,3,4,3,2,1,0],ten:[0,1,2,2,2,2,2,1,0],none:[0,0,0,0,0,0,0,0,0],jump:[0,4,4,4,4,4,4,4,0]};
const LVL=['0','1×','10×','100×','1000×'];
const MU={low:0.001,med:0.005,high:0.02};
const G=20;                     // colonization attempts per site per day (wild type)
const PL={x:20,y:78,w:760,h:300};
const KP=1e10,KMAX=14,MICR=5,R_GROW=4,MUT=1e-8;   // patient model constants (per day)
const KF=1e9,RF=16.6;                              // flask: carrying capacity, growth rate per day (1 h doubling)
const hill=x=>x*x/(x*x+1);
const bandAt=(sim,col)=>BANDS[sim.p.steps][Math.floor(col/BW)];

function dosesTaken(p){return p.treat==='none'?[]:Array.from({length:p.treat==='full'?20:4},(_,i)=>1+i*0.5);}
function fmtCells(n){if(n<1)return '0';if(n<1000)return Math.round(n).toString();const u=[[1e9,' billion'],[1e6,' million'],[1e3,' thousand']];for(const [v,l] of u)if(n>=v)return (n/v).toFixed(n/v<10?1:0)+l;return String(Math.round(n));}
function feel(s){const N=s.S+s.R;return N<1?'Cured':N>1e7?'Sick':'Feeling better';}

const SIM={
  id:'antibiotic',hash:'antibiotic',apUnit:11,order:7,kind:'Go further',prereq:['evolution'],
  tab:'Antibiotic resistance',
  card:'Watch bacteria evolve their way across a dish of antibiotic, then see why finishing a prescription matters.',
  title:'Antibiotic resistance: evolution you can watch',
  lede:{bio:'Bacteria can’t choose to become resistant. Random mutations happen as they divide, and the antibiotic kills everything except the lucky mutants. Watch it happen on a giant dish, and inside a patient.',
        honors:'Follow resistance step by step across a gradient of antibiotic, then test whether resistance has a cost when the drug is gone.',
        ap:'Explore how mutation supply, fitness costs and drug concentration (even below the lethal dose) shape the evolution of resistance.'},
  scale:{bio:'MEGA-plate: a dish about 120 cm long (Harvard, 2016). Each square holds millions of E. coli. Patient: an infection of up to 10 billion bacteria over 20 days.',
         honors:'MEGA-plate: a 120 cm dish; each square holds millions of E. coli. Patient: up to 10 billion bacteria. Flask: 10 million to 1 billion cells per mL, diluted 1:100 each day.'},
  timeScale:1,dtMax:0.02,prewarm:0,sampleDt:0.1,window:30,unit:'days',timeLabel:'Day',clock:sim=>'Day '+sim.t.toFixed(1),
  chChange:1,chReveal:14,
  controls:[
    {id:'mode',label:'Experiment',type:'seg',def:'mega',lvl:'bio',options:[{v:'mega',l:'MEGA-plate'},{v:'patient',l:'Patient'},{v:'flask',l:'Flask competition',lvl:'honors'}],
     onChange(sim){applyMode(sim);if(sim.ch.phase!=='running')BioLab.reset(sim);}},
    {id:'mu',label:'Mutation rate',type:'seg',def:'med',lvl:'bio',mode:['mega'],options:[{v:'low',l:'Low'},{v:'med',l:'Medium'},{v:'high',l:'High'}],help:'Chance that a division adds one resistance step'},
    {id:'steps',label:'Antibiotic bands',type:'seg',def:'steps',lvl:'bio',mode:['mega'],options:[{v:'steps',l:'Steps to 1000×'},{v:'ten',l:'Up to 10×'},{v:'none',l:'No drug'},{v:'jump',l:'Jump to 1000×',lvl:'honors'}],
     onChange(sim){if(sim.ch.phase!=='running')BioLab.reset(sim);}},
    {id:'treat',label:'Treatment',type:'seg',def:'full',lvl:'bio',mode:['patient'],options:[{v:'none',l:'No antibiotic'},{v:'early',l:'Stop on day 3'},{v:'full',l:'Full 10-day course'}],help:'A dose every 12 hours, starting on day 1'},
    {id:'pre',label:'Resistant cells before treatment',type:'select',def:100,lvl:'ap',mode:['patient'],options:[{v:0,l:'None'},{v:100,l:'100'},{v:10000,l:'10,000'}],onChange(sim){if(sim.ch.phase!=='running')BioLab.reset(sim);}},
    {id:'fdrug',label:'Antibiotic in the flask',type:'range',min:0,max:1.5,step:0.05,def:0,unit:'× MIC',d:2,lvl:'ap',mode:['flask'],help:'MIC is the lowest dose that stops sensitive cells from growing'},
    {id:'cost',label:'Fitness cost per resistance step',type:'range',min:0,max:30,step:1,def:5,unit:'%',lvl:'honors',help:'How much slower each resistance step makes the cells grow'}
  ],
  init(sim){const p=sim.p,r=rng(7);
    const st={series:[],lastSer:-1,events:[]};
    // MEGA-plate grid
    st.gr=new Int8Array(GW*GH).fill(-1);st.lin=new Int16Array(GW*GH).fill(-1);st.occ=[];st.lineages=[{hue:0,r:0}];st.reach=[0,null,null,null,null];st.hueR=r;
    for(let y=0;y<GH;y++)for(const x of [0,GW-1]){const i=y*GW+x;st.gr[i]=0;st.lin[i]=0;st.occ.push(i);}
    // patient
    st.S=1e8;st.R=+p.pre;st.C=0;st.doses=dosesTaken(p);st.nextDose=0;st.peakR=st.R;
    // flask
    st.fS=0.5e7;st.fR=0.5e7;st.day=0;
    return st;},
  step(sim,dt){const s=sim.st,p=sim.p,cost=p.cost/100;const t=sim.t;
    if(p.mode==='mega'){const mu=MU[p.mu];const n=s.occ.length;
      for(let k=0;k<n;k++){const i=s.occ[k],r=s.gr[i];if(Math.random()>G*Math.pow(1-cost,r)*dt)continue;
        const x=i%GW,y=(i/GW)|0,dd=(Math.random()*4)|0,nx=x+(dd===0)-(dd===1),ny=y+(dd===2)-(dd===3);
        if(nx<0||nx>=GW||ny<0||ny>=GH)continue;const j=ny*GW+nx;if(s.gr[j]>=0)continue;
        let r2=r,l2=s.lin[i];if(r<4&&Math.random()<mu)r2=r+1;
        const b=bandAt(sim,nx);if(r2<b)continue;
        if(r2!==r){s.lineages.push({hue:(s.lineages.length*137.5)%360,r:r2});l2=s.lineages.length-1;}
        s.gr[j]=r2;s.lin[j]=l2;s.occ.push(j);
        if(s.reach[b]===null){s.reach[b]=t;s.events.push({x:nx,y:ny,lvl:b,t,life:2.5});}
        else if(r2!==r&&s.events.length<40)s.events.push({x:nx,y:ny,lvl:-1,t,life:1.2});}}
    else if(p.mode==='patient'){
      s.doses=dosesTaken(p);
      while(s.nextDose<s.doses.length&&t>=s.doses[s.nextDose]){s.C+=4;s.nextDose++;}
      s.C*=Math.exp(-Math.LN2/0.25*dt);
      const N=s.S+s.R,g=R_GROW*Math.max(0,1-N/KP),imm=3/(1+N/1e5);
      const kS=KMAX*hill(s.C),kR=KMAX*hill(s.C/MICR);
      const mut=MUT*g*s.S*dt;
      s.S*=Math.exp((g-kS-imm)*dt);s.R=s.R*Math.exp((g*(1-cost)-kR-imm)*dt)+mut;
      if(s.S<1)s.S=Math.random()<s.S?1:0;if(s.R<1)s.R=Math.random()<s.R?1:0;
      if(s.R>s.peakR)s.peakR=s.R;}
    else{
      const fs=1-2*hill(p.fdrug),fr=(1-cost)*(1-2*hill(p.fdrug/8)),N=s.fS+s.fR,lg=Math.max(0,1-N/KF);
      s.fS*=Math.exp(RF*fs*(fs>0?lg:1)*dt);s.fR*=Math.exp(RF*fr*(fr>0?lg:1)*dt);
      if(Math.floor(t+dt)>s.day){s.day=Math.floor(t+dt);s.fS*=0.01;s.fR*=0.01;s.transfer=t;}}
    if(t<s.lastSer)s.series=[];
    if(t-s.lastSer>=0.1||s.lastSer<0){s.lastSer=t;s.series.push(snap(sim));if(s.series.length>600)s.series.shift();}},
  metrics:[
    {id:'col',label:'Dish colonized',unit:'%',lvl:'bio',mode:['mega'],min:0,max:100,d:0,get:s=>s.st.occ.length/(GW*GH)*100},
    {id:'maxr',label:'Strongest antibiotic survived',unit:'',lvl:'bio',mode:['mega'],text:true,get:s=>{let m=0;for(let l=4;l>=0;l--)if(s.st.reach[l]!==null){m=l;break;}return m===0?'None yet (0 band only)':LVL[m]+' band';}},
    {id:'resm',label:'Resistant share of the dish',unit:'%',lvl:'bio',mode:['mega'],min:0,max:100,d:0,get:s=>{let r=0;for(const i of s.st.occ)if(s.st.gr[i]>0)r++;return s.st.occ.length?r/s.st.occ.length*100:0;}},
    {id:'lin',label:'Resistant lineages',unit:'',lvl:'honors',mode:['mega'],min:0,max:null,d:0,get:s=>{const seen=new Set();for(const i of s.st.occ)if(s.st.gr[i]>0)seen.add(s.st.lin[i]);return seen.size;}},
    {id:'d1000',label:'Day the 1000× band was reached',unit:'day',lvl:'ap',mode:['mega'],min:0,max:30,d:1,get:s=>s.st.reach[4]===null?NaN:s.st.reach[4]},
    {id:'pn',label:'Bacteria in the infection',unit:'',lvl:'bio',mode:['patient'],text:true,get:s=>fmtCells(s.st.S+s.st.R)},
    {id:'pfeel',label:'Patient',unit:'',lvl:'bio',mode:['patient'],text:true,get:s=>feel(s.st)},
    {id:'pres',label:'Resistant share',unit:'%',lvl:'bio',mode:['patient'],min:0,max:100,d:0,get:s=>{const N=s.st.S+s.st.R;return N>=1?s.st.R/N*100:0;}},
    {id:'drug',label:'Antibiotic level',unit:'× MIC',lvl:'honors',mode:['patient'],min:0,max:8,d:1,get:s=>s.st.C},
    {id:'plog',label:'log₁₀ bacteria',unit:'',lvl:'ap',mode:['patient'],min:0,max:10,d:1,get:s=>Math.log10(1+s.st.S+s.st.R)},
    {id:'fres',label:'Resistant share',unit:'%',lvl:'honors',mode:['flask'],min:0,max:100,d:0,get:s=>s.st.fR/(s.st.fS+s.st.fR)*100},
    {id:'fday',label:'Daily transfers so far',unit:'',lvl:'honors',mode:['flask'],min:0,max:null,d:0,get:s=>s.st.day},
    {id:'fadv',label:'Resistant growth vs sensitive',unit:'%',lvl:'ap',mode:['flask'],min:-100,max:100,d:0,get:s=>{const p=s.p,cost=p.cost/100,fs=1-2*hill(p.fdrug),fr=(1-cost)*(1-2*hill(p.fdrug/8));return (fr-fs)*100;}}
  ],
  graphs:[{id:'main',label:'Over time',custom:true}],
  defaultGraph:'main',
  plot(sim,ctx,box,id){const s=sim.st,p=sim.p,ser=s.series,W={mega:30,patient:20,flask:15}[p.mode],tmax=Math.max(W,sim.t),tmin=tmax-W;
    const b2=Object.assign({},box,{T:box.T+24,H:box.H-24});let ax,lines;
    if(p.mode==='mega'){ax=axes(ctx,b2,{xmin:tmin,xmax:tmax,ymin:0,ymax:100,xl:'Day',yl:'% of dish'});lines=[['a','Dish colonized',PAL['s2']],['b','Resistant (1× or more)',PAL['s1']]];
      s.reach.forEach((tt,l)=>{if(l>0&&tt!==null&&tt>=tmin){const x=ax.X(tt);ctx.setLineDash([3,3]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,b2.T);ctx.lineTo(x,b2.T+b2.H);ctx.stroke();ctx.setLineDash([]);txt(ctx,LVL[l],x+3,b2.T+12+(l%2)*14,{s:12,c:PAL['muted']});}});}
    else if(p.mode==='patient'){ax=axes(ctx,b2,{xmin:tmin,xmax:tmax,ymin:0,ymax:10.5,xl:'Day',yl:'log₁₀ bacteria',yd:0});lines=[['a','Sensitive',PAL['s2']],['b','Resistant',PAL['s1']]];
      s.doses.forEach(d=>{if(d<tmin||d>tmax)return;ctx.fillStyle=PAL['s5'];ctx.globalAlpha=0.18;ctx.fillRect(ax.X(d),b2.T,Math.max(2,ax.X(d+0.25)-ax.X(d)),b2.H);ctx.globalAlpha=1;});
      ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.beginPath();ctx.moveTo(b2.L,ax.Y(7));ctx.lineTo(b2.L+b2.W,ax.Y(7));ctx.stroke();ctx.setLineDash([]);txt(ctx,'feels sick above here',b2.L+b2.W-4,ax.Y(7)-5,{s:12,c:PAL['muted'],a:'right'});}
    else{ax=axes(ctx,b2,{xmin:tmin,xmax:tmax,ymin:0,ymax:100,xl:'Day',yl:'% resistant'});lines=[['a','Resistant share',PAL['s1']]];
      ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.beginPath();ctx.moveTo(b2.L,ax.Y(50));ctx.lineTo(b2.L+b2.W,ax.Y(50));ctx.stroke();ctx.setLineDash([]);}
    ctx.save();ctx.beginPath();ctx.rect(b2.L,b2.T,b2.W,b2.H);ctx.clip();
    lines.forEach(([k,,c])=>{ctx.beginPath();let on=false;ser.forEach(pt=>{if(pt.t<tmin||pt[k]===undefined)return;const x=ax.X(pt.t),y=ax.Y(pt[k]);on?ctx.lineTo(x,y):ctx.moveTo(x,y);on=true;});ctx.strokeStyle=c;ctx.lineWidth=2.6;ctx.stroke();});
    ctx.restore();legend(ctx,b2.L,box.T+10,lines.map(([,l,c])=>({label:l,color:c})));},
  challenges:[
    {lvl:'bio',q:'On the MEGA-plate, how do the bacteria end up surviving the 1000× band in the middle?',
     choices:['One lucky mutation makes them resistant to everything at once','Step by step: they stall at each band until a new mutation lets one lineage break through','They get used to the drug, like building a tolerance'],correct:1,
     baseline:{mode:'mega'},change:{},changeText:'Bacteria spreading from both edges',watch:'main',reveal:16,
     explain:{bio:'Each mutation only adds a little resistance. The bacteria pile up at the edge of each band, and only when a random mutation appears in one cell can its descendants move on. Every new color on the dish is a new mutant lineage. Resistance builds up one step at a time, each built on the one before.',
              honors:'Each step is one mutation, and each new lineage descends from the previous step’s winner. That is why the colors branch like a family tree: resistance evolves through a series of selected mutations, not one jump.'}},
    {lvl:'bio',q:'You raise the mutation rate from medium to high. What happens on the MEGA-plate?',
     choices:['Nothing changes, because the antibiotic is the same','Bacteria break through each band much faster','The bacteria die off'],correct:1,
     baseline:{mode:'mega'},change:{mu:'high'},changeText:'Mutation rate raised to high',watch:'main',reveal:9,
     explain:{bio:'More mutations means a resistant mutant shows up sooner at each band’s edge. Mutations are random, but the more chances there are, the faster selection has something to work with.'}},
    {lvl:'bio',q:'A patient takes antibiotics, feels better on day 3, and stops. What happens over the next two weeks?',
     choices:['The infection is gone for good','The infection comes back, and now it is mostly resistant bacteria','It comes back, but it is still easy to treat with the same drug'],correct:1,
     baseline:{mode:'patient',treat:'full'},change:{treat:'early'},at:0.5,changeText:'Patient stops after day 3',watch:'main',reveal:16,
     explain:{bio:'The first few days kill the sensitive bacteria quickly, so the patient feels better. But a few resistant bacteria survive. Without the rest of the doses, they grow back, and the new infection is made of resistant bacteria the drug can’t easily kill. That is why doctors say to finish the whole course.'}},
    {lvl:'honors',q:'This dish jumps straight from no antibiotic to 1000×, with no middle steps. What happens?',
     choices:['The bacteria cross it, just more slowly','They stay stuck at the edge: no single mutation gives enough resistance'],correct:1,
     baseline:{mode:'mega',steps:'jump'},change:{},changeText:'Bacteria spreading toward a 1000× wall',watch:'main',reveal:14,
     explain:{honors:'Surviving 1000× takes four resistance steps. With no in-between bands, a cell would need all four mutations at once, which almost never happens. Gentle gradients, like a drug that is strong in some tissues and weak in others, give bacteria stepping stones. The Harvard team found exactly this.'}},
    {lvl:'honors',q:'With no antibiotic, resistant and sensitive bacteria share a flask, starting 50:50. Each resistance step costs 10% in growth. What happens over 12 days?',
     choices:['Resistant bacteria take over','Resistant bacteria shrink to a small share','It stays about 50:50'],correct:1,
     baseline:{mode:'flask',cost:10,fdrug:0},change:{},changeText:'Daily transfers with no antibiotic',watch:'main',reveal:12,
     explain:{honors:'Resistance usually costs the cell something, such as a slower pump or a less efficient enzyme. Without the drug that cost is all downside, so sensitive cells out-grow resistant ones a little every day. This is why cutting antibiotic use can slowly bring resistance down, unless the bacteria evolve ways to cancel the cost.'}},
    {lvl:'ap',q:'A flask gets a low dose of antibiotic: 30% of the MIC, too little to kill sensitive cells. Resistance costs 5%. What happens to the resistant share?',
     choices:['Nothing, because the dose is too low to matter','It rises: the drug slows sensitive cells more than resistance costs','All the bacteria die'],correct:1,
     baseline:{mode:'flask',cost:5,fdrug:0},change:{fdrug:0.3},changeText:'Antibiotic set to 0.3 × MIC',watch:'main',reveal:12,
     explain:{ap:'Below the MIC, sensitive cells still grow, just more slowly (about 16% here). That is a bigger handicap than the 5% cost of resistance, so resistant cells win every daily round. Sub-lethal antibiotic, from leftovers in the environment or underdosing, can select for resistance (Gullberg et al., 2011).'}},
    {lvl:'ap',q:'Each resistance step now costs 20% in growth instead of nothing. Compared with no cost, how do bacteria cross the MEGA-plate?',
     choices:['Faster, because resistant cells are stronger','More slowly, because highly resistant lineages grow and spread more slowly','Exactly the same'],correct:1,
     baseline:{mode:'mega',cost:0},change:{cost:20},changeText:'Cost of each resistance step set to 20%',watch:'main',reveal:16,
     explain:{ap:'A 20% cost per step leaves a four-step mutant growing at 0.8⁴ ≈ 41% of the wild-type rate. Slower growth means slower spreading and fewer divisions at each border, so fewer chances for the next mutation. Fitness costs slow resistance down but do not stop it.'}}
  ],
  narrate(sim){const s=sim.st,p=sim.p;
    if(p.mode==='mega'){let top=0;for(let l=4;l>=0;l--)if(s.reach[l]!==null){top=l;break;}
      const recent=s.events.find(e=>e.lvl>0&&sim.t-e.t<1.2);
      if(p.steps==='none')return '<b>No antibiotic anywhere.</b> The bacteria simply spread across the whole dish. Mutations still happen, but nothing selects for them.';
      if(p.steps==='jump'&&top===0)return '<b>The bacteria are stuck at the 1000× wall.</b> Mutations keep happening at the border, but one step of resistance is nowhere near enough, and no cell gets four at once.';
      if(recent)return '<b>A new mutant just broke into the '+LVL[recent.lvl]+' band.</b> Its descendants (a new color) spread through the band, then stall again at the next, stronger band.';
      const maxB=Math.max(...BANDS[p.steps]);
      if(top>=maxB&&s.occ.length>GW*GH*0.95)return '<b>The bacteria reached the strongest band on day '+(s.reach[maxB]||0).toFixed(1)+'.</b> Each band took a new mutation, and each one built on the last.';
      return '<b>Stuck at the edge of the '+LVL[Math.min(4,top+1)]+' band.</b> Only a cell with one more resistance mutation can survive there. Every division at the border is another roll of the dice.';}
    if(p.mode==='patient'){const N=s.S+s.R,f=feel(s),taking=s.nextDose<s.doses.length&&sim.t>=1;
      if(N<1)return '<b>Cured.</b> The antibiotic and the immune system together cleared every bacterium, including the resistant ones.';
      if(sim.t<1)return '<b>The infection is growing</b> and no antibiotic has been given yet. Treatment starts on day 1.';
      if(taking&&s.S>s.R)return '<b>The antibiotic is killing sensitive bacteria fast.</b> The few resistant cells die much more slowly.';
      if(taking)return '<b>Almost all sensitive bacteria are gone.</b> The survivors are mostly resistant cells, and the remaining doses are slowly wearing them down.';
      if(p.treat==='none')return '<b>No antibiotic.</b> The infection grows until the body’s resources limit it. The patient stays '+f.toLowerCase()+'.';
      if(s.R>s.S)return '<b>Treatment stopped while resistant bacteria were still alive.</b> They are regrowing, and this time the infection is mostly resistant.';
      return '<b>Treatment is over.</b> The immune system is mopping up the last few bacteria.';}
    const fr=s.fR/(s.fS+s.fR)*100;
    if(p.fdrug>=1)return '<b>The antibiotic is at or above the MIC</b>, so sensitive cells cannot grow at all. Resistant cells take over within a few transfers.';
    if(p.fdrug>0)return '<b>A low dose of antibiotic slows sensitive cells</b> more than resistance slows resistant ones, so the resistant share climbs ('+fr.toFixed(0)+'%).';
    if(p.cost>0)return '<b>No antibiotic, so resistance is only a cost.</b> Sensitive cells grow a little faster in every daily round, and the resistant share falls ('+fr.toFixed(0)+'%).';
    return '<b>No drug and no cost:</b> neither strain has an advantage, so the share stays near 50%.';},
  tour:[
    {title:'The MEGA-plate',text:'A giant dish of food for E. coli. The middle bands hold more and more antibiotic: 1×, 10×, 100×, then 1000× the dose that kills normal bacteria. Bacteria start at both edges.',focus:[PL.x,48,PL.w,PL.h+34],speed:0.25},
    {title:'Spreading into the safe edge',text:'Each colored square holds millions of bacteria. They divide and spread into empty neighboring squares. The drug-free edge fills quickly.',focus:[PL.x,PL.y,PL.w/9+6,PL.h],speed:0.5},
    {title:'Stuck at the first band',text:'Normal bacteria die in the 1× band, so the front stalls. But the bacteria keep dividing at the border, and every division has a small chance of a mutation.',focus:[PL.x+PL.w/9-10,PL.y,PL.w/9+20,PL.h],speed:1},
    {title:'A mutant breaks through',text:'One cell gets a resistance mutation and survives in the 1× band. Its descendants are a new color. They fill the band, then stall again at 10×.',focus:[PL.x,PL.y,PL.w*0.45,PL.h],speed:2},
    {title:'Step by step to 1000×',text:'Each band takes another mutation, each built on the last. The branching colors are a family tree of mutants, and the bacteria end up surviving 1000× in about 10 days.',focus:[PL.x,48,PL.w,PL.h+34],speed:3},
    {title:'Inside a patient',text:'Now a patient who stops antibiotics on day 3. The drug wipes out sensitive bacteria (blue) and the patient feels better, but the few resistant ones (red) survive and regrow.',focus:[20,20,440,420],speed:2,setup(sim){BioLab.setValues(sim,{mode:'patient',treat:'early'});}},
    {lvl:'honors',title:'The cost of resistance',text:'A flask with no antibiotic, resistant and sensitive cells mixed 50:50, diluted into fresh food every day. Resistance costs 10% growth, so the sensitive cells slowly win.',focus:[20,40,760,380],speed:2,setup(sim){BioLab.setValues(sim,{mode:'flask',cost:10,fdrug:0});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'mega',treat:'full',cost:5,fdrug:0});},
  lab:{bio:'<p><b>Question:</b> How does the mutation rate affect how fast bacteria evolve resistance?</p><ol><li>On the MEGA-plate, set Mutation rate to Low, press Reset and let it run 15 days. Record a trial.</li><li>Repeat at Medium and High.</li><li>Compare “Strongest antibiotic survived” and “Resistant share” for each.</li></ol><p>Then switch to Patient and compare “Stop on day 3” with “Full 10-day course.” Write two sentences explaining why finishing the course matters.</p>',
       honors:'<p><b>Question:</b> Does resistance have a cost when the antibiotic is gone?</p><ol><li>Choose Flask competition. Set the cost to 0%, Reset, and record the resistant share after 12 transfers.</li><li>Repeat at 5%, 10% and 20%.</li><li>Plot cost (x) against resistant share (y).</li></ol><p>Use your data to predict what happens to resistance in a hospital that cuts back on one antibiotic.</p>',
       ap:'<p><b>Question:</b> Can a dose too low to kill still select for resistance?</p><ol><li>In Flask competition with a 5% cost, record the resistant share after 12 days at 0, 0.1, 0.2, 0.3, 0.5 and 1.0 × MIC.</li><li>Find the minimal selective concentration: the lowest dose where resistance rises.</li><li>On the MEGA-plate, compare the day the 1000× band is reached at costs of 0, 10 and 20%.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain how mutation supply, fitness cost and drug concentration together decide whether resistance spreads.</p>'},
  terms:[{t:'Antibiotic resistance',d:'The ability of bacteria to survive a drug that would normally kill them.'},{t:'Mutation',d:'A random change in DNA. Resistance mutations happen whether or not the drug is present.'},{t:'Natural selection',d:'The drug kills sensitive cells, so resistant ones leave more offspring.'},
    {lvl:'honors',t:'Lineage',d:'A cell and all of its descendants.'},{lvl:'honors',t:'Fitness cost',d:'The growth disadvantage that resistance often carries when the drug is absent.'},{lvl:'honors',t:'MIC (minimum inhibitory concentration)',d:'The lowest drug concentration that stops a strain from growing.'},
    {lvl:'ap',t:'Minimal selective concentration',d:'The lowest drug level at which resistant cells out-compete sensitive ones, often far below the MIC.'},{lvl:'ap',t:'Mutation supply',d:'Population size × mutation rate: how many new mutants appear per generation.'},{lvl:'ap',t:'Compensatory mutation',d:'A later mutation that reduces the cost of resistance.'}],
  about:'<p><b>MEGA-plate.</b> A 63 × 18 grid. Each occupied square tries to colonize a random empty neighbor about 20 times a day, multiplied by (1 − cost)^(resistance steps). Each attempt has a small chance (0.1%, 0.5% or 2%) of adding one resistance step. A daughter survives only if its resistance is at least the band’s level (0, 1×, 10×, 100×, 1000×). Real mutation rates per cell are far lower, but each square stands for millions of cells, so the chance per square is much higher. Inspired by Baym et al., Science 2016.</p><p><b>Patient.</b> Sensitive and resistant populations grow logistically (doubling about every 4 hours, up to 10 billion cells). A dose every 12 hours adds 4 × MIC of drug, with a 6-hour half-life. Killing follows a Hill curve; resistant cells have a 5× higher MIC. The immune system clears cells mainly when numbers are small, and mutation creates about one resistant cell per hundred million divisions. Below one cell, a population survives only by chance.</p><p><b>Flask.</b> Two strains grow (doubling every hour) to 1 billion cells, then are diluted 1:100 each day. Antibiotic below the MIC slows growth; at the MIC growth stops.</p><p><b>Simplifications:</b> one antibiotic, no horizontal gene transfer (plasmids), no compensatory mutations, and no spatial structure inside the patient.</p>',
  thumbSetup(sim){for(let i=0;i<400;i++){sim.def.step(sim,0.02);sim.t+=0.02;}},
  onLevel(sim){applyMode(sim);},
  initVis(sim){const r=rng(19),v=sim.vis;v.rods=[];for(let i=0;i<170;i++){const a=r()*6.283,d=Math.sqrt(r())*150;v.rods.push({x:230+Math.cos(a)*d,y:220+Math.sin(a)*d,a:r()*3.14,ph:r()*6.28});}
    v.imm=[0,1,2].map(i=>({x:230+Math.cos(i*2.1)*90,y:220+Math.sin(i*2.1)*90,vx:0,vy:0}));v.fr=[];for(let i=0;i<120;i++)v.fr.push({x:r(),y:r(),a:r()*3.14,ph:r()*6.28});},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis;if(!v.rods)SIM.initVis(sim);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='mega')drawMega(sim,ctx,vdt,k,t);else if(p.mode==='patient')drawPatient(sim,ctx,vdt,k,t);else drawFlask(sim,ctx,vdt,k,t);}
};
function snap(sim){const s=sim.st,p=sim.p,t=sim.t;
  if(p.mode==='mega'){let r=0;for(const i of s.occ)if(s.gr[i]>0)r++;return {t,a:s.occ.length/(GW*GH)*100,b:s.occ.length?r/s.occ.length*100:0};}
  if(p.mode==='patient')return {t,a:Math.log10(1+s.S),b:Math.log10(1+s.R)};
  return {t,a:s.fR/(s.fS+s.fR)*100};}
function applyMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode;
  SIM.metrics.forEach(m=>{const t=sim.ui.tiles&&sim.ui.tiles[m.id];if(!t)return;const tile=t.num.closest('.tile');if(tile)tile.hidden=!(atLeast(m.lvl)&&m.mode.includes(mode));});
  SIM.controls.forEach(c=>{if(!c.mode)return;const e=sim.ui.sec.querySelector('#antibiotic-'+c.id)||sim.ui.sec.querySelector('#antibiotic-'+c.id+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!(atLeast(c.lvl)&&c.mode.includes(mode));});}

function drawMega(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,bands=BANDS[p.steps],cw=PL.w/GW,ch=PL.h/GH;
  txt(ctx,'MEGA-plate: E. coli on a dish with bands of antibiotic',PL.x,26,{s:14*k,w:700});
  // band labels
  bands.forEach((b,i)=>{const x=PL.x+i*BW*cw+BW*cw/2;txt(ctx,LVL[b],x,66,{s:13*k,w:700,a:'center',c:b>=3?PAL['s1']:PAL['cv-ink']});});
  // dark agar (real MEGA-plates use black ink so white colonies show up)
  ctx.fillStyle='#17191d';rr(ctx,PL.x,PL.y,PL.w,PL.h,10);ctx.fill();
  bands.forEach((b,i)=>{if(b>0){ctx.fillStyle='rgba(220,40,60,'+(0.05*b)+')';ctx.fillRect(PL.x+i*BW*cw,PL.y,BW*cw,PL.h);}
    if(i>0){ctx.strokeStyle='rgba(255,255,255,.25)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(PL.x+i*BW*cw,PL.y);ctx.lineTo(PL.x+i*BW*cw,PL.y+PL.h);ctx.stroke();ctx.setLineDash([]);}});
  for(const i of s.occ){const x=i%GW,y=(i/GW)|0,l=s.lin[i],r=s.gr[i];
    ctx.fillStyle=r===0?'#ecead8':'hsl('+s.lineages[l].hue+',75%,'+(70-r*6)+'%)';
    ctx.beginPath();ctx.arc(PL.x+x*cw+cw/2,PL.y+y*ch+ch/2,Math.max(cw,ch)*0.62,0,6.29);ctx.fill();}
  // mutation flashes
  s.events=s.events.filter(e=>(e.life-=vdt)>0);
  s.events.forEach(e=>{const x=PL.x+e.x*cw+cw/2,y=PL.y+e.y*ch+ch/2,rad=(e.lvl>0?26:14)*(1-e.life/(e.lvl>0?2.5:1.2))+6;ctx.strokeStyle='#ffd23f';ctx.lineWidth=e.lvl>0?3:1.5;ctx.globalAlpha=clamp(e.life,0,1);ctx.beginPath();ctx.arc(x,y,rad,0,6.29);ctx.stroke();ctx.globalAlpha=1;
    if(e.lvl>0)pill(ctx,'Mutant survives '+LVL[e.lvl],clamp(x,90,710),clamp(y-30,PL.y+14,PL.y+PL.h-14),'#ffd23f','#1b1b1b',12*k);});
  // key
  const ky=PL.y+PL.h+30;ctx.fillStyle='#ecead8';ctx.beginPath();ctx.arc(PL.x+8,ky-4,6,0,6.29);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'not resistant',PL.x+20,ky,{s:12.5*k,c:PAL['cv-soft']});
  ['hsl(30,75%,64%)','hsl(170,75%,58%)','hsl(300,75%,52%)'].forEach((c,i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(PL.x+130+i*14,ky-4,6,0,6.29);ctx.fill();});
  txt(ctx,'each color = a new mutant lineage (darker = more resistant)',PL.x+176,ky,{s:12.5*k,c:PAL['cv-soft']});
  txt(ctx,'Day '+sim.t.toFixed(1),PL.x+PL.w,26,{s:14*k,w:700,a:'right'});}

function drawPatient(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,N=s.S+s.R,cx=230,cy=220,R=168;
  txt(ctx,'Inside an infected wound',24,26,{s:14*k,w:700});
  ctx.fillStyle='#e9b8b4';ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();ctx.strokeStyle='#b5736d';ctx.lineWidth=3;ctx.stroke();
  // drug shading
  if(s.C>0.05){ctx.fillStyle='rgba(123,63,228,'+clamp(s.C/12,0,0.35)+')';ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();}
  const n=N<1?0:Math.min(170,Math.max(1,Math.round(Math.log10(N+1)*17)));let nr=N<1?0:Math.round(n*s.R/N);if(s.R>=1&&nr===0)nr=1;
  for(let i=0;i<n;i++){const r=v.rods[i],res=i<nr,jx=RM?0:Math.sin(t*1.3+r.ph)*2;ctx.save();ctx.translate(r.x+jx,r.y);ctx.rotate(r.a+(RM?0:Math.sin(t*0.7+r.ph)*0.2));
    ctx.fillStyle=res?PAL['s1']:PAL['s2'];rr(ctx,-7,-3,14,6,3);ctx.fill();ctx.restore();}
  // immune cells
  v.imm.forEach((m,i)=>{if(!RM&&vdt>0){m.vx+=(Math.random()-.5)*80*vdt-(m.x-cx)*0.3*vdt;m.vy+=(Math.random()-.5)*80*vdt-(m.y-cy)*0.3*vdt;m.x+=m.vx*vdt;m.y+=m.vy*vdt;const d=Math.hypot(m.x-cx,m.y-cy);if(d>R-20){m.x=cx+(m.x-cx)*(R-20)/d;m.y=cy+(m.y-cy)*(R-20)/d;}}
    ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();for(let a=0;a<6.3;a+=0.5){const rr2=15+3*Math.sin(a*3+t*2+i);const x=m.x+Math.cos(a)*rr2,y=m.y+Math.sin(a)*rr2;a?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.fillStyle='#9a8fb3';ctx.beginPath();ctx.arc(m.x,m.y,5,0,6.29);ctx.fill();});
  // right panel
  const PX=440;ctx.fillStyle=PAL['card'];rr(ctx,PX,40,340,250,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Bacteria in the infection',PX+14,64,{s:13*k,c:PAL['cv-soft']});txt(ctx,fmtCells(N),PX+14,98,{s:28,w:800});
  const f=feel(s),fc=f==='Sick'?PAL['s1']:f==='Cured'?PAL['s3']:PAL['s4'];pill(ctx,f,PX+280,86,fc,'#ffffff',13*k);
  const bx=PX+14,bw=312;ctx.fillStyle=PAL['card2'];ctx.fillRect(bx,114,bw,16);if(N>=1){ctx.fillStyle=PAL['s2'];ctx.fillRect(bx,114,bw*s.S/N,16);ctx.fillStyle=PAL['s1'];ctx.fillRect(bx+bw*s.S/N,114,bw*s.R/N,16);}
  txt(ctx,'Sensitive '+fmtCells(s.S),bx,148,{s:12.5*k,c:PAL['s2'],w:700});txt(ctx,'Resistant '+fmtCells(s.R),bx+bw,148,{s:12.5*k,c:PAL['s1'],w:700,a:'right'});
  // drug gauge with MIC marks
  txt(ctx,'Antibiotic level',PX+14,180,{s:13*k,c:PAL['cv-soft']});const gx=PX+14,gw=312,gy=190,mx=8,X=c=>gx+gw*clamp(c/mx,0,1);
  ctx.fillStyle=PAL['card2'];ctx.fillRect(gx,gy,gw,14);ctx.fillStyle=PAL['s5'];ctx.fillRect(gx,gy,X(s.C)-gx,14);
  [[1,'kills sensitive'],[MICR,'kills resistant']].forEach(([c,l],i)=>{const x=X(c);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,gy-4);ctx.lineTo(x,gy+18);ctx.stroke();txt(ctx,l,x,gy+32,{s:11.5*k,c:PAL['cv-soft'],a:i?'right':'left'});});
  txt(ctx,'Each dose fades with a 6-hour half-life',PX+14,270,{s:12*k,c:PAL['cv-soft']});
  // dose timeline
  const TX=40,TW=720,TY=318;ctx.fillStyle=PAL['card'];rr(ctx,20,298,760,140,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
  txt(ctx,'Doses',TX,TY+6,{s:13*k,w:700});const DX=d=>TX+60+(TW-80)*d/20;
  for(let d=0;d<=20;d+=2){txt(ctx,String(d),DX(d),TY+86,{s:11.5*k,c:PAL['cv-soft'],a:'center'});}
  txt(ctx,'day',DX(20)+16,TY+86,{s:11.5*k,c:PAL['cv-soft']});
  const all=Array.from({length:20},(_,i)=>1+i*0.5);
  all.forEach((d,i)=>{const taken=s.doses.includes(d),x=DX(d),y=TY+30+(i%2)*18;ctx.save();ctx.translate(x,y);ctx.rotate(-0.5);
    if(taken){ctx.fillStyle=d<=sim.t?PAL['s5']:PAL['cv-soft'];rr(ctx,-8,-4,16,8,4);ctx.fill();}else if(p.treat!=='none'){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;rr(ctx,-8,-4,16,8,4);ctx.stroke();}ctx.restore();});
  if(p.treat==='early')txt(ctx,'stopped: felt better',DX(3.2),TY+6,{s:12*k,c:PAL['s1'],w:700});
  if(p.treat==='none')txt(ctx,'no antibiotic given',DX(1),TY+30,{s:12*k,c:PAL['cv-soft']});
  const nx=DX(Math.min(20,sim.t));ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(nx,TY+16);ctx.lineTo(nx,TY+72);ctx.stroke();txt(ctx,'today',nx,TY+104,{s:11.5*k,w:700,c:PAL['s1'],a:'center'});}

function drawFlask(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,frac=s.fR/(s.fS+s.fR),N=s.fS+s.fR;
  txt(ctx,'Flask competition: resistant vs sensitive, fresh flask every day',24,26,{s:14*k,w:700});
  const flask=(cx,base,w,h,fill,label,alpha)=>{ctx.save();ctx.beginPath();ctx.moveTo(cx-w*0.18,base-h);ctx.lineTo(cx-w*0.18,base-h*0.6);ctx.lineTo(cx-w/2,base);ctx.lineTo(cx+w/2,base);ctx.lineTo(cx+w*0.18,base-h*0.6);ctx.lineTo(cx+w*0.18,base-h);ctx.closePath();
    ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=0.5+0.5*alpha;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.stroke();ctx.restore();txt(ctx,label,cx,base+24,{s:13*k,w:700,a:'center'});};
  // yesterday (small) and today (big)
  flask(130,330,150,170,0,'Yesterday’s flask',0.8);
  flask(430,380,300,320,0,'Today’s flask',clamp(Math.log10(N/1e7)/2,0,1));
  // transfer pipette animation
  const ph=sim.t-Math.floor(sim.t);if(ph<0.12&&!RM){const a=ph/0.12;const x=lerpN(130,430,a),y=150-Math.sin(a*Math.PI)*60;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-40);ctx.lineTo(x,y+20);ctx.stroke();ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(x,y+24,4,0,6.29);ctx.fill();}
  txt(ctx,'1% moves to fresh food',280,120,{s:12.5*k,c:PAL['cv-soft'],a:'center'});
  // rods in today's flask
  const n=Math.round(30+90*clamp(Math.log10(N/1e7)/2,0,1)),nr=Math.round(n*frac);
  for(let i=0;i<n;i++){const r=v.fr[i],x=430+(r.x-0.5)*(80+r.y*170),y=380-12-r.y*170;ctx.save();ctx.translate(x+(RM?0:Math.sin(t+r.ph)*2),y);ctx.rotate(r.a);ctx.fillStyle=i<nr?PAL['s1']:PAL['s2'];rr(ctx,-6,-2.5,12,5,2.5);ctx.fill();ctx.restore();}
  // share bar
  const PX=620;ctx.fillStyle=PAL['card'];rr(ctx,PX,60,160,320,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Share',PX+80,84,{s:13*k,w:700,a:'center'});const bh=230;ctx.fillStyle=PAL['s2'];ctx.fillRect(PX+50,100,60,bh*(1-frac));ctx.fillStyle=PAL['s1'];ctx.fillRect(PX+50,100+bh*(1-frac),60,bh*frac);
  txt(ctx,Math.round(frac*100)+'% resistant',PX+80,354,{s:13*k,w:700,a:'center',c:PAL['s1']});
  txt(ctx,'Day '+Math.floor(sim.t)+(p.fdrug>0?' · drug '+p.fdrug.toFixed(2)+'× MIC':' · no drug'),24,440,{s:13*k,c:PAL['cv-soft']});}
function lerpN(a,b,t){return a+(b-a)*t;}
BioLab.register(SIM);
})();
