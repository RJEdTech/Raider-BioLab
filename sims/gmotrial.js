(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,rng,randn}=BioLab.h;
/* GMO field trial: design a fair test of a genetically modified corn seed on a 24-plot field in eastern Colorado.
   Yield model (bushels per acre, illustrative but realistic for irrigated corn): 180 + soil + season effect + fertilizer + noise.
   - Soil: the field's east end has deeper soil, +15 at the east edge and −15 at the west edge (hidden unless you show the soil map).
   - Season: corn borers cost conventional corn 25 bu/acre and Bt corn about 3; drought costs conventional corn 60 and
     drought-tolerant corn 48; herbicide-tolerant corn yields the same as conventional when both are kept weed-free.
     With no borers and normal rain, none of the traits change yield.
   - Extra fertilizer, if you give it only to the new seed: +14. Plot-to-plot noise: standard deviation 8.
   Statistics: means, standard errors, a 2-standard-error rule of thumb, and at AP Welch's t-test with an exact t distribution. */
const COLS=6,ROWS=4,FX=22,FY=74,CW=74,RH=78,BASE=180,SOIL=15,NOISE=8,FERT=14,LASTYEAR=178;
const Q={bt:{l:'Bt corn',short:'Bt',trait:'makes its own protein that kills corn borer caterpillars',eff:{normal:0,borers:22,drought:0}},
         dt:{l:'Drought-tolerant corn',short:'DT',trait:'keeps growing longer when water runs short',eff:{normal:0,borers:0,drought:12}},
         ht:{l:'Herbicide-tolerant corn',short:'HT',trait:'survives a weed-killer spray, so weeds can be sprayed without hurting the corn',eff:{normal:0,borers:0,drought:0}}};
const SEASON={normal:{l:'Normal year',loss:0},borers:{l:'Corn borer outbreak',loss:25},drought:{l:'Dry summer',loss:60}};
const q=sim=>Q[sim.p.q]||Q.bt;

/* ---------- design → plots ---------- */
function slots(){const s=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)s.push({r,c});return s;}
function layout(sim){const p=sim.p,st=sim.st,R=rng(st.seed*7919+13),n=p.n,S=slots(),out=[];
  if(p.ctrl==='last'){// only the new seed is planted
    const order=p.layout==='split'?S.slice().sort((a,b)=>b.c-a.c||a.r-b.r):shuffle(S.slice(),R);order.slice(0,n).forEach(s=>out.push({...s,v:'g'}));return out;}
  if(p.layout==='split'){const west=S.slice().sort((a,b)=>a.c-b.c||a.r-b.r),east=S.slice().sort((a,b)=>b.c-a.c||a.r-b.r);
    west.slice(0,n).forEach(s=>out.push({...s,v:'c'}));east.slice(0,n).forEach(s=>out.push({...s,v:'g'}));return out;}
  if(p.layout==='blocks'){// pairs of neighbors; a coin flip decides which gets which seed
    const pairs=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c+=2)pairs.push([{r,c},{r,c:c+1}]);const use=shuffle(pairs,R).slice(0,n);
    use.forEach(pr=>{const f=R()<0.5;out.push({...pr[0],v:f?'g':'c'},{...pr[1],v:f?'c':'g'});});return out;}
  const pick=shuffle(S.slice(),R).slice(0,2*n),lab=shuffle(pick.map((s,i)=>i<n?'c':'g'),R);pick.forEach((s,i)=>out.push({...s,v:lab[i]}));return out;}
function shuffle(a,R){for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const soilAt=c=>-SOIL+2*SOIL*c/(COLS-1);
function grow(sim){const p=sim.p,st=sim.st,R=rng(st.seed*104729+7),Qd=q(sim),sea=SEASON[p.season];
  st.plots=layout(sim).map(pl=>{let y=BASE+soilAt(pl.c)+(pl.r-1.5)*1.2-sea.loss+NOISE*randn(R);if(pl.v==='g'){y+=Qd.eff[p.season]||0;if(p.fair==='extra')y+=FERT;}return {...pl,y:Math.max(20,y)};});
  st.phase='grow';st.t=0;st.res=null;}
function stats(a){const n=a.length,m=n?a.reduce((t,x)=>t+x,0)/n:NaN,sd=n>1?Math.sqrt(a.reduce((t,x)=>t+(x-m)*(x-m),0)/(n-1)):NaN;return {n,m,sd,se:sd/Math.sqrt(n)};}
/* Student t two-sided p-value via the regularized incomplete beta function */
function betacf(a,b,x){let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<1e-30)d=1e-30;d=1/d;let h=d;
  for(let m=1;m<=200;m++){const m2=2*m;let aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;h*=d*c;
    aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-12)break;}return h;}
function lgamma(x){const g=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];let y=x,t=x+5.5;t-=(x+0.5)*Math.log(t);let s=1.000000000190015;for(const c of g)s+=c/++y;return -t+Math.log(2.5066282746310005*s/x);}
function ibeta(a,b,x){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(lgamma(a+b)-lgamma(a)-lgamma(b)+a*Math.log(x)+b*Math.log(1-x));return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b;}
const pT=(t,df)=>ibeta(df/2,0.5,df/(df+t*t));
function tcrit(df){let lo=1,hi=20;for(let i=0;i<60;i++){const m=(lo+hi)/2;if(pT(m,df)>0.05)lo=m;else hi=m;}return (lo+hi)/2;}
function results(sim){const st=sim.st,p=sim.p;if(st.res)return st.res;if(!st.plots||st.phase==='plan')return null;
  const G=stats(st.plots.filter(x=>x.v==='g').map(x=>x.y)),C=p.ctrl==='last'?null:stats(st.plots.filter(x=>x.v==='c').map(x=>x.y));
  let diff,se,df,t,pv,lo,hi;
  let paired=false;
  if(C&&p.layout==='blocks'){paired=true;const pr={};st.plots.forEach(x=>{const key=x.r+','+(x.c>>1);(pr[key]=pr[key]||{})[x.v]=x.y;});const D=stats(Object.values(pr).map(o=>o.g-o.c));diff=D.m;se=D.se;df=D.n-1;}
  else if(C){diff=G.m-C.m;se=Math.sqrt(G.sd*G.sd/G.n+C.sd*C.sd/C.n);const a=G.sd*G.sd/G.n,b=C.sd*C.sd/C.n;df=(a+b)*(a+b)/(a*a/(G.n-1)+b*b/(C.n-1));}
  else{diff=G.m-LASTYEAR;se=G.se;df=G.n-1;}
  if(Number.isFinite(se)&&se>0&&df>=1){t=diff/se;pv=pT(Math.abs(t),df);const tc=tcrit(df);lo=diff-tc*se;hi=diff+tc*se;}
  st.res={G,C,diff,se,df,t,pv,lo,hi,paired};return st.res;}
function checks(sim){const p=sim.p;return [
  {ok:p.ctrl!=='last',t:'Control group grown at the same time',bad:'Compared with last year, a different season'},
  {ok:p.fair!=='extra',t:'Only the seed is different',bad:'The new seed also got extra fertilizer'},
  {ok:p.n>=4,t:'Replicates: '+p.n+' plots per seed',bad:p.n===1?'One plot per seed: no way to see luck':'Only '+p.n+' plots per seed'},
  {ok:p.layout!=='split',t:p.layout==='blocks'?'Randomized in matched pairs':'Plots assigned at random',bad:'Each seed on its own half of the field'}];}
function verdict(sim){const r=results(sim);if(!r)return null;const p=sim.p,nm=q(sim).short;
  if(r.G.n<2||(r.C&&r.C.n<2))return {k:'luck',t:'One plot per seed can’t separate the seed from luck.'};
  const big=Math.abs(r.diff)>2*r.se;
  if(!big)return {k:'close',t:'Too close to call: the difference ('+fmtD(r.diff)+') is within the plot-to-plot noise.'};
  return {k:'big',t:nm+' '+(r.diff>0?'out-yielded':'under-yielded')+' by '+Math.abs(r.diff).toFixed(0)+' bu/acre, more than twice the uncertainty.'};}
const fmtD=d=>(d>=0?'+':'−')+Math.abs(d).toFixed(0)+' bu/acre';

/* ---------- tool ---------- */
const GMO={
  id:'gmotrial',hash:'gmotrial',apUnit:13,order:1.6,tab:'GMO field trial',kind:'Virtual lab',prereq:['expdesign'],next:['farm'],
  card:'A seed company says its genetically modified corn yields more. Design the field trial to find out: control group, replicates, randomization, and a season with or without pests. Bad designs give convincing wrong answers.',
  title:'GMO field trial: does the new seed really yield more?',
  lede:{bio:'A family farm in eastern Colorado has 24 test plots. Design a fair test of a genetically modified corn seed: what to compare it with, how many plots, and where to plant each one.',
        honors:'Use error bars to tell a real difference from plot-to-plot noise, and randomized matched pairs to cancel out the field’s hidden soil differences.',
        ap:'Run Welch’s t-test on your yields and report a 95% confidence interval for the difference, the way university variety trials do.'},
  scale:{bio:'Each plot is a strip of the field. Yields are in bushels per acre; irrigated corn in eastern Colorado typically yields about 180 to 200. The trait effects are illustrative, sized from published field trials.'},
  timeless:true,animated:true,graph:false,
  controls:[
    {id:'q',label:'Seed to test',type:'select',def:'bt',lvl:'bio',options:[{v:'bt',l:'Bt corn (resists corn borers)'},{v:'dt',l:'Drought-tolerant corn'},{v:'ht',l:'Herbicide-tolerant corn',lvl:'honors'}],onChange(sim){replan(sim);}},
    {id:'season',label:'This year’s season',type:'seg',def:'borers',lvl:'bio',options:[{v:'normal',l:'Normal'},{v:'borers',l:'Corn borers'},{v:'drought',l:'Dry summer'}],onChange(sim){replan(sim);}},
    {id:'ctrl',label:'Compare with',type:'seg',def:'side',lvl:'bio',options:[{v:'side',l:'Regular corn, same year'},{v:'last',l:'Last year’s yield'}],onChange(sim){replan(sim);}},
    {id:'n',label:'Plots of each seed',type:'range',min:1,max:12,step:1,def:6,unit:'',lvl:'bio',onChange(sim){replan(sim);}},
    {id:'layout',label:'Where each seed goes',type:'seg',def:'random',lvl:'bio',options:[{v:'split',l:'Each on its own half'},{v:'random',l:'At random'},{v:'blocks',l:'Random pairs',lvl:'honors'}],onChange(sim){replan(sim);}},
    {id:'fair',label:'Fertilizer',type:'seg',def:'same',lvl:'bio',options:[{v:'same',l:'Same on every plot'},{v:'extra',l:'Extra on the new seed'}],onChange(sim){replan(sim);}}
  ],
  actions:[
    {id:'grow',label:'Plant and grow',lvl:'bio',primary:true,run(sim){grow(sim);}},
    {id:'again',label:'Run it again (new year, new draw)',lvl:'bio',run(sim){const st=sim.st;if(st.phase==='done'&&results(sim))st.hist.push(results(sim).diff);st.seed++;grow(sim);}},
    {id:'soil',label:'Show the soil map',lvl:'bio',run(sim){sim.st.soil=!sim.st.soil;}},
    {id:'replan',label:'Back to planning',lvl:'bio',run(sim){replan(sim);}}
  ],
  init(sim){return {phase:'plan',t:0,plots:null,seed:1,soil:false,res:null,hist:[]};},
  step(sim,dt){const st=sim.st;if(st.phase==='grow'){st.t+=dt/(RM?0.01:3.2);if(st.t>=1){st.t=1;st.phase='done';sim.infoDirty=true;}}},
  metrics:[
    {id:'mg',label:'New seed: average yield',unit:'bu/acre',lvl:'bio',d:0,min:0,max:250,get:s=>{const r=results(s);return r?r.G.m:0;}},
    {id:'mc',label:'Comparison: average yield',unit:'bu/acre',lvl:'bio',d:0,min:0,max:250,get:s=>{const r=results(s);return r?(r.C?r.C.m:LASTYEAR):0;}},
    {id:'diff',label:'Difference',unit:'bu/acre',lvl:'bio',d:0,min:-60,max:60,get:s=>{const r=results(s);return r?r.diff:0;}},
    {id:'se',label:'Uncertainty (standard error)',unit:'bu/acre',lvl:'honors',d:1,min:0,max:40,get:s=>{const r=results(s);return r&&Number.isFinite(r.se)?r.se:0;}},
    {id:'pv',label:'p-value',unit:'',lvl:'ap',d:3,min:0,max:1,get:s=>{const r=results(s);return r&&Number.isFinite(r.pv)?r.pv:1;}},
    {id:'ci',label:'95% CI for the difference',unit:'',lvl:'ap',text:true,get:s=>{const r=results(s);return r&&Number.isFinite(r.lo)?fmtD(r.lo).replace(' bu/acre','')+' to '+fmtD(r.hi):'—';}}
  ],
  challenges:[
    {lvl:'bio',instant:true,q:'Bt corn is planted on the east half and regular corn on the west half, in a year with no corn borers. Bt yields 25 bu/acre more. What is the best explanation?',choices:['The east half has better soil, so the layout favored Bt','Bt corn always yields more, whether or not borers come','Regular corn grows weaker on every part of the field','The harvest machine weighed the Bt plots too heavily'],correct:0,
     explain:'With no borers, the Bt trait has nothing to fight, so it can’t raise yield. The east end of this field has deeper soil. When each seed gets its own half, soil and seed are mixed up (confounded). Random placement spreads good and bad soil across both seeds.'},
    {lvl:'bio',instant:true,q:'Why plant several plots of each seed instead of one big plot each?',choices:['To see how much yields vary by chance','To use up more seed from the company','Because one plot gives a bigger yield','So the plots can have different fertilizer'],correct:0,
     explain:'Two plots of the same seed never yield exactly the same: soil, water and insects vary. Replicates show that spread, so you can tell whether the gap between seeds is bigger than the luck between plots.'},
    {lvl:'bio',instant:true,q:'A farmer plants only drought-tolerant corn in a dry summer and gets 140 bu/acre, down from 178 last year. What can she conclude about the seed?',choices:['Nothing yet: she needs regular corn grown this year','The new seed yields less than her old seed did','Drought-tolerant corn does not work in Colorado','The new seed is better, since it survived a drought'],correct:0,
     explain:'Last year was a different season. Without regular corn grown beside it this year, she can’t separate the seed’s effect from the drought’s. Her regular corn might have yielded only 120 this year.'},
    {lvl:'bio',instant:true,q:'In a normal year with few corn borers, a fair trial shows Bt and regular corn yield about the same. Why?',choices:['Bt’s trait only helps when borers are attacking','Bt corn needs more water than regular corn does','The trial must have been unfair to the Bt seed','Bt corn grows more slowly in the early summer'],correct:0,
     explain:'A trait helps only when its problem shows up. Bt protects against borers; with few borers there is nothing to protect against. The same is true of drought tolerance in a wet year.'},
    {lvl:'honors',instant:true,q:'Two seeds differ by 6 bu/acre and the standard error of the difference is 5 bu/acre. What should you say?',choices:['Too close to call; test more plots','The new seed is clearly better','The new seed is clearly worse','The seeds are exactly the same'],correct:0,
     explain:'A difference smaller than about twice its standard error (here 10 bu/acre) could easily be plot-to-plot luck. More plots shrink the standard error, about by √n.'},
    {lvl:'honors',instant:true,q:'Why do randomized matched pairs work even better than random placement on this field?',choices:['Each pair shares its soil, so soil cancels out','Pairs use fewer seeds than scattered plots do','Pairs put every seed on the field’s best soil','Neighbor plots grow faster when they are paired'],correct:0,
     explain:'Neighbors share nearly the same soil. Comparing the two seeds within each pair removes most of the soil differences, so the seed effect stands out with fewer plots.'},
    {lvl:'ap',instant:true,q:'A trial reports p = 0.03 and a 95% CI of +2 to +30 bu/acre. Which statement is correct?',choices:['A gap this big would be rare if the seeds yielded the same','There is only a 3% chance that the new seed is better','The new seed yields exactly 16 bu/acre more than regular','The trial shows the new seed is 97% likely to be better'],correct:0,
     explain:'A p-value is the chance of a difference at least this large if the seeds really yield the same. The interval gives the plausible range of the true difference. Neither says anything about other questions, like food safety, which need their own studies.'}
  ],
  initVis(sim){},
  onTourExit(sim){BioLab.setValues(sim,{q:'bt',season:'borers',ctrl:'side',n:6,layout:'random',fair:'same'});replan(sim);},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);drawField(sim,ctx,k,t);drawResults(sim,ctx,k);},
  infoPanel(sim){const C=checks(sim),v=verdict(sim),r=results(sim),Qd=q(sim);
    let h='<div class="p-head"><h3>Is it a fair test?</h3></div><ul class="checks">'+C.map(c=>'<li>'+(c.ok?'✅ ':'⚠️ ')+(c.ok?c.t:c.bad)+'</li>').join('')+'</ul>';
    if(sim.st.phase==='done'&&v){h+='<p class="verdict '+(v.k==='big'?'ok':'no')+'">'+v.t+'</p>';
      if(C.some(c=>!c.ok)&&v.k==='big')h+='<p>But check the ⚠️ above: a flaw in the design can create a difference the seed didn’t cause.</p>';
      if(atLeast('ap')&&r&&Number.isFinite(r.pv))h+='<p>'+(r.paired?'Paired t (one difference per pair)':'Welch’s t')+' = '+r.t.toFixed(2)+', df ≈ '+r.df.toFixed(1)+', p = '+(r.pv<0.001?'< 0.001':r.pv.toFixed(3))+'. 95% CI: '+fmtD(r.lo).replace(' bu/acre','')+' to '+fmtD(r.hi)+'.</p>';}
    else h+='<p>'+Qd.l+' '+Qd.trait+'. Set up the trial, then press <b>Plant and grow</b>.</p>';
    return h;},
  narrate(sim){const st=sim.st,p=sim.p,Qd=q(sim),r=results(sim);
    if(st.phase==='plan')return 'Plan: '+(p.ctrl==='last'?p.n+' plots of '+Qd.l.toLowerCase()+', compared with last year’s 178 bu/acre':p.n+' plots of '+Qd.l.toLowerCase()+' and '+p.n+' of regular corn')+', '+(p.layout==='split'?'each seed on its own half of the field':p.layout==='blocks'?'in randomized neighbor pairs':'placed at random')+'. Season: '+SEASON[p.season].l.toLowerCase()+'.';
    if(st.phase==='grow')return 'Growing… '+(p.season==='borers'?'Corn borer caterpillars tunnel into the stalks.':p.season==='drought'?'The summer turns dry.':'A normal summer.');
    return 'New seed: <b>'+r.G.m.toFixed(0)+' bu/acre</b>; '+(r.C?'regular corn: <b>'+r.C.m.toFixed(0)+'</b>':'last year: <b>'+LASTYEAR+'</b>')+'. Difference '+fmtD(r.diff)+(atLeast('honors')&&Number.isFinite(r.se)?' ± '+r.se.toFixed(1)+' (standard error)':'')+'.'+(st.hist.length?' Earlier runs of this design: '+st.hist.slice(-5).map(d=>fmtD(d).replace(' bu/acre','')).join(', ')+'.':'');},
  tour:[
    {title:'The question',text:'A seed company says its Bt corn yields more. Bt corn makes a protein that kills corn borer caterpillars. You have 24 plots to find out if the claim holds on your farm.',pause:true,setup(sim){BioLab.setValues(sim,{q:'bt',season:'borers',ctrl:'side',n:6,layout:'random',fair:'same'});replan(sim);}},
    {title:'A control group',text:'Plant regular corn in the same field, the same year, as the comparison. Everything else stays the same: water, fertilizer, planting day. Only the seed changes.',pause:true,setup(sim){replan(sim);}},
    {title:'Replicates and randomization',text:'Six plots of each seed, placed at random, so luck and soil differences spread across both seeds. Watch the season, then the harvest.',pause:false,setup(sim){grow(sim);}},
    {title:'Read the result',text:'Compare the averages, and the spread of the dots. A gap much bigger than the spread is probably the seed, not luck.',pause:false,setup(sim){}}
  ],
  lab:{bio:'<p><b>Question:</b> Does Bt corn yield more than regular corn, and when?</p><ol><li>Run a fair trial (regular corn this year, 6 plots each, at random, same fertilizer) in a corn borer year. Record the difference.</li><li>Run the same trial in a normal year.</li><li>Now run an unfair one: each seed on its own half, in a normal year. Show the soil map.</li></ol><p><b>Claim–evidence:</b> When does the Bt trait help, and how could a bad design fool you?</p>',
       honors:'<p><b>Question:</b> How many plots do you need to detect the drought-tolerant trait?</p><ol><li>Test drought-tolerant corn in a dry summer with 2, 4, 8 and 12 plots per seed, at random. Run each design three times.</li><li>Record the difference and its standard error each time.</li><li>Repeat 4 plots with random pairs.</li></ol><p>Explain how replication and pairing shrink the uncertainty.</p>',
       ap:'<p><b>Question:</b> Is the drought-tolerant trait’s yield gain statistically significant?</p><ol><li>Design the strongest trial you can with 24 plots in a dry summer.</li><li>Report the mean difference, Welch’s t, df, the p-value and a 95% CI.</li><li>Run it five times. How often is p < 0.05?</li></ol><p>Discuss statistical power and why seed companies and universities test across many locations and years.</p>'},
  terms:[{t:'GMO',d:'Genetically modified organism: one whose DNA was changed in a lab, such as corn given a gene from a soil bacterium.'},{t:'Bt corn',d:'Corn carrying a gene from the bacterium Bacillus thuringiensis. It makes a protein that kills corn borer caterpillars but not people or most other insects.'},
    {t:'Control group',d:'The comparison group, treated exactly the same except for the one thing you are testing.'},{t:'Replicates',d:'Repeated plots of the same treatment, which show how much results vary by chance.'},{t:'Randomization',d:'Assigning treatments by chance so hidden differences (like soil) don’t line up with one treatment.'},
    {t:'Confounding variable',d:'Something besides the treatment that differs between groups, like soil or fertilizer, and could explain the result.'},
    {lvl:'honors',t:'Standard error',d:'How much an average would move around if you repeated the experiment. It shrinks as you add plots.'},{lvl:'honors',t:'Blocking (matched pairs)',d:'Grouping similar plots and comparing treatments within each group, so their shared conditions cancel out.'},
    {lvl:'ap',t:'p-value',d:'If the treatments truly had no effect, the chance of a difference at least as large as the one observed.'},{lvl:'ap',t:'Refuge',d:'Plots of non-Bt corn the EPA requires near Bt corn, so borers that survive Bt mate with ones that never met it, slowing resistance.'}],
  about:'<p>Each plot’s yield = 180 bu/acre + a soil effect (from −15 on the west edge to +15 on the east edge) + the season’s loss + the trait’s benefit in that season + 14 if only the new seed got extra fertilizer + random noise (standard deviation 8). Losses: corn borers −25 for regular corn and −3 for Bt; a dry summer −60 for regular corn and −48 for drought-tolerant corn. The traits do nothing in a season without their problem, and herbicide-tolerant corn yields the same as regular corn when both are kept weed-free. These sizes are illustrative, chosen to match the range in published trials, not taken from one study.</p><p>Statistics use the sample standard deviation, the standard error of a difference of two means (or, for random pairs, of the within-pair differences), and (AP) Welch’s or the paired t-test with the exact t distribution. The “twice the standard error” verdict is a rule of thumb, close to a 95% test.</p>'
};

function replan(sim){const st=sim.st;st.phase='plan';st.plots=null;st.res=null;st.t=0;st.hist=[];sim.infoDirty=true;}

/* ---------- drawing ---------- */
const COL={c:'#c9a227',g:'#1f8a70'};
function drawField(sim,ctx,k,t){const st=sim.st,p=sim.p,Qd=q(sim);
  txt(ctx,'West',FX,FY-10,{s:12*k,w:700,c:PAL['cv-soft']});txt(ctx,'East',FX+COLS*CW,FY-10,{s:12*k,w:700,c:PAL['cv-soft'],a:'right'});
  txt(ctx,SEASON[p.season].l,FX+COLS*CW/2,FY-10,{s:13*k,w:700,a:'center'});
  const plan=st.phase==='plan',plots=plan?layout(sim):st.plots,map={};plots.forEach(pl=>map[pl.r+','+pl.c]=pl);
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const x=FX+c*CW,y=FY+r*RH,pl=map[r+','+c];
    ctx.fillStyle=st.soil?soilCol(c):'#b49a7a';rr(ctx,x+2,y+2,CW-4,RH-4,5);ctx.fill();
    if(!pl){ctx.fillStyle='rgba(255,255,255,.35)';rr(ctx,x+2,y+2,CW-4,RH-4,5);ctx.fill();continue;}
    ctx.strokeStyle=COL[pl.v];ctx.lineWidth=3;rr(ctx,x+3,y+3,CW-6,RH-6,5);ctx.stroke();
    const g=plan?0.12:st.phase==='grow'?st.t:1;drawCorn(ctx,x,y,pl,g,p,sim,t);
    pill(ctx,pl.v==='g'?Qd.short:'Reg.',x+CW/2,y+13,COL[pl.v],'#fff',10.5*k);
    if(st.phase==='done')pill(ctx,pl.y.toFixed(0),x+CW/2,y+RH-14,'rgba(0,0,0,.72)','#fff',12*k);}
  if(st.soil){const y=FY+ROWS*RH+16;const g=ctx.createLinearGradient(FX,0,FX+COLS*CW,0);g.addColorStop(0,soilCol(0));g.addColorStop(1,soilCol(COLS-1));ctx.fillStyle=g;rr(ctx,FX,y-8,COLS*CW,12,4);ctx.fill();
    txt(ctx,'Soil map: shallow, sandy (−15)  →  deep, rich (+15 bu/acre)',FX+COLS*CW/2,y+20,{s:11.5*k,a:'center',c:PAL['cv-ink'],w:700});}
  else{txt(ctx,'Gold: regular corn · green: '+Qd.l.toLowerCase(),FX,FY+ROWS*RH+18,{s:11.5*k,c:PAL['cv-soft'],w:600});}
  if(p.fair==='extra'&&plan)txt(ctx,'Extra fertilizer on every '+Qd.short+' plot',FX+COLS*CW/2,FY+ROWS*RH+34,{s:11.5*k,a:'center',c:'#b3261e',w:700});}
const soilCol=c=>{const f=c/(COLS-1);return 'rgb('+Math.round(214-110*f)+','+Math.round(190-120*f)+','+Math.round(140-95*f)+')';};
function drawCorn(ctx,x,y,pl,g,p,sim,t){const hurtB=p.season==='borers'&&pl.v==='c'||(p.season==='borers'&&pl.v==='g'&&p.q!=='bt'),dry=p.season==='drought',dtProt=dry&&pl.v==='g'&&p.q==='dt';
  const H=8+38*g,brown=dry?(dtProt?0.35:0.65)*g:0;
  for(let i=0;i<3;i++)for(let j=0;j<2;j++){const sx=x+15+i*22,sy=y+RH-22-j*22,bent=hurtB&&g>0.55&&(i+j+pl.r+pl.c)%2===0;
    ctx.save();ctx.translate(sx,sy);if(bent)ctx.rotate(0.5);ctx.strokeStyle=mix('#3c8d2f','#a88b3d',brown);ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-H*0.62);ctx.stroke();
    ctx.fillStyle=mix('#4caf50','#b89a4a',brown);const lh=H*0.62;[[0.35,-1],[0.6,1],[0.85,-1]].forEach(([f,sd])=>{if(lh*f<4)return;ctx.beginPath();ctx.ellipse(sd*6,-lh*f,7,2.4,sd*0.5,0,Math.PI*2);ctx.fill();});
    if(g>0.8&&!bent){ctx.fillStyle='#e8c547';ctx.fillRect(1.5,-lh*0.55,3,7);}ctx.restore();
    if(bent&&g>0.6){ctx.fillStyle='#5b3a1e';ctx.beginPath();ctx.arc(sx+3,sy-H*0.3,2,0,Math.PI*2);ctx.fill();}}
  if(p.season==='borers'&&g>0.3&&g<1&&!RM){const n=hurtB?2:0;for(let i=0;i<n;i++){const a=t*3+i*2.1+pl.c;ctx.fillStyle='#8d6e63';ctx.beginPath();ctx.ellipse(x+CW/2+Math.cos(a)*18,y+RH/2+Math.sin(a*1.3)*12,4,2,a,0,Math.PI*2);ctx.fill();}}}
function mix(a,b,f){const pa=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)),pb=[1,3,5].map(i=>parseInt(b.slice(i,i+2),16));return 'rgb('+pa.map((v,i)=>Math.round(v+(pb[i]-v)*f)).join(',')+')';}
function drawResults(sim,ctx,k){const st=sim.st,p=sim.p,X0=488,X1=790,Y0=60,Y1=360,Qd=q(sim);
  ctx.fillStyle=PAL['cv-bg2']||'#eef1ee';rr(ctx,X0-6,14,X1-X0+10,424,10);ctx.fill();txt(ctx,'Yield (bushels per acre)',X0+4,38,{s:13*k,w:700});
  const lo=90,hi=240,Y=v=>Y1-(clamp(v,lo,hi)-lo)/(hi-lo)*(Y1-Y0),ax=X0+44;
  ctx.strokeStyle=PAL['line']||'#ccc';ctx.lineWidth=1;for(let v=100;v<=240;v+=20){ctx.beginPath();ctx.moveTo(ax,Y(v));ctx.lineTo(X1-8,Y(v));ctx.stroke();txt(ctx,String(v),ax-6,Y(v)+4,{s:10.5*k,a:'right',c:PAL['cv-soft']});}
  const cols=[{v:'c',l:'Regular corn',x:ax+70},{v:'g',l:Qd.l,x:ax+190}];
  cols.forEach(cl=>{txt(ctx,cl.v==='c'&&p.ctrl==='last'?'Last year':cl.l.replace(' corn',''),cl.x,Y1+22,{s:12*k,a:'center',w:700,c:COL[cl.v]});});
  if(st.phase!=='done'){txt(ctx,st.phase==='grow'?'Harvest coming…':'Plant and grow to see yields',ax+130,(Y0+Y1)/2,{s:13*k,a:'center',c:PAL['cv-soft']});return;}
  const r=results(sim);
  cols.forEach(cl=>{if(cl.v==='c'&&p.ctrl==='last'){ctx.strokeStyle=COL.c;ctx.lineWidth=3;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(cl.x-34,Y(LASTYEAR));ctx.lineTo(cl.x+34,Y(LASTYEAR));ctx.stroke();ctx.setLineDash([]);txt(ctx,String(LASTYEAR),cl.x+38,Y(LASTYEAR)+4,{s:11*k,w:700,c:COL.c});return;}
    const ys=st.plots.filter(x=>x.v===cl.v).map(x=>x.y).sort((a,b)=>a-b),S=cl.v==='g'?r.G:r.C;
    ys.forEach((v,i)=>{const jit=((i*37)%9-4)*3.2;ctx.fillStyle=COL[cl.v];ctx.globalAlpha=0.75;ctx.beginPath();ctx.arc(cl.x+jit,Y(v),5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;});
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cl.x-30,Y(S.m));ctx.lineTo(cl.x+30,Y(S.m));ctx.stroke();txt(ctx,S.m.toFixed(0),cl.x+34,Y(S.m)+4,{s:12*k,w:700});
    if(atLeast('honors')&&S.n>1){ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cl.x-40,Y(S.m-2*S.se));ctx.lineTo(cl.x-40,Y(S.m+2*S.se));ctx.moveTo(cl.x-45,Y(S.m-2*S.se));ctx.lineTo(cl.x-35,Y(S.m-2*S.se));ctx.moveTo(cl.x-45,Y(S.m+2*S.se));ctx.lineTo(cl.x-35,Y(S.m+2*S.se));ctx.stroke();}});
  const v=verdict(sim);if(!sim.lnKey)pill(ctx,'Difference '+fmtD(r.diff),ax+130,Y0-6,v&&v.k==='big'?'#1b7a3a':'#555','#fff',13*k);
  if(atLeast('honors'))txt(ctx,'Bars: average ± 2 standard errors',ax+130,Y1+40,{s:11*k,a:'center',c:PAL['cv-soft']});
  if(st.hist.length)txt(ctx,'Earlier runs: '+st.hist.slice(-5).map(d=>fmtD(d).replace(' bu/acre','')).join(', '),X0+4,Y1+60,{s:11*k,c:PAL['cv-soft'],w:600});}

GMO._gm={grow,results,replan,rep(sim,target,tol){const st=sim.st;for(let sd=1;sd<400;sd++){st.seed=sd;grow(sim);const r=results(sim);if(r&&Math.abs(r.diff-target)<=tol)return sd;}st.seed=1;grow(sim);return 1;}};
BioLab.register(GMO);
})();
