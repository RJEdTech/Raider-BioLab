(function(){
'use strict';
const {clamp,lerp,rng,binom,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;

/* Rock pocket mice. One gene: D (dark fur) and d (light fur).
   Each generation, for every population:
     selection: genotype fitness w = 1 if fur matches the ground, 1 − s if it contrasts (heterozygotes at 1 − s/2 when not dominant)
       p' = (p²·wDD + pq·wDd) / w̄
     migration: p'' = (1 − m)·p' + m·p_migrants
     mutation:  p''' = p''(1 − μ) + (1 − p'')μ
     drift: the next generation's 2N alleles are a random (binomial) sample of p'''  */
const NPOP=5;
const COL={dark:'#2a2522',mid:'#8b7356',light:'#dcc597'};
function phen(g,dom){return g===0?'dark':g===2?'light':(dom?'dark':'mid');}
function fitness(g,p){const ph=phen(g,p.dom),lava=p.bg==='lava';if(ph==='mid')return 1-p.s/2;return (ph==='dark')===lava?1:1-p.s;}
function nextP(pp,p,rand){const q=1-pp,wDD=fitness(0,p),wDd=fitness(1,p),wdd=fitness(2,p),wbar=pp*pp*wDD+2*pp*q*wDd+q*q*wdd;
  let x=wbar>0?(pp*pp*wDD+pp*q*wDd)/wbar:pp;x=(1-p.m)*x+p.m*p.pm;x=x*(1-p.mu)+(1-x)*p.mu;
  if(!rand)return x;const n=2*p.N;return binom(n,clamp(x,0,1),rand)/n;}
function sampleGen(p,pp,n,rand){const out=[];for(let i=0;i<n;i++){const a=rand()<pp,b=rand()<pp;out.push(a&&b?0:(a||b)?1:2);}return out;}
function newDisplay(sim){const s=sim.st,p=sim.p,r=s.r,M=Math.min(p.N,120),gen=sampleGen(p,s.P[0],M,r);
  s.disp=gen.map(g=>({g,x:30+r()*740,y:88+r()*318,face:r()<.5?1:-1,doomed:r()>fitness(g,p)}));
  const doomed=s.disp.filter(d=>d.doomed);doomed.forEach((d,i)=>{d.tk=0.18+0.55*(i+0.5)/doomed.length;});
  const big=sampleGen(p,s.P[0],p.N,r),c=[0,0,0];big.forEach(g=>c[g]++);s.obs=c.map(x=>x/p.N);}
function generation(sim){const s=sim.st,p=sim.p;s.P=s.P.map(x=>nextP(x,p,s.r));s.pdet=nextP(s.pdet,p,null);s.g++;
  s.hist.push({g:s.g,P:s.P.slice(),d:s.pdet});if(s.hist.length>500)s.hist.shift();newDisplay(sim);}
function mouse(ctx,x,y,col,alpha,face,sc){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(face*(sc||1),(sc||1));
  ctx.strokeStyle=col;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-9,1);ctx.quadraticCurveTo(-18,-2,-22,4);ctx.stroke();
  ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(0,0,10,6.5,0,0,6.29);ctx.fill();ctx.beginPath();ctx.ellipse(9,-2,5.5,4.5,0.2,0,6.29);ctx.fill();
  ctx.beginPath();ctx.arc(7,-6.5,2.8,0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=0.8;ctx.beginPath();ctx.ellipse(0,0,10,6.5,0,0,6.29);ctx.stroke();
  ctx.fillStyle=col===COL.dark?'#d8d0c4':'#1b1714';ctx.beginPath();ctx.arc(11,-3,1.2,0,6.29);ctx.fill();ctx.restore();}
function owl(ctx,x,y,flap,sc){ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);const w=Math.sin(flap)*10;
  ctx.fillStyle='#7a5636';ctx.beginPath();ctx.moveTo(-6,-4);ctx.lineTo(-34,-8+w);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(6,-4);ctx.lineTo(34,-8+w);ctx.lineTo(10,10);ctx.closePath();ctx.fill();
  ctx.fillStyle='#8f6a45';ctx.beginPath();ctx.ellipse(0,2,13,17,0,0,6.29);ctx.fill();ctx.fillStyle='#e8d8b8';ctx.beginPath();ctx.ellipse(0,-6,11,8,0,0,6.29);ctx.fill();
  ctx.fillStyle='#f2c230';ctx.beginPath();ctx.arc(-4.5,-7,3.6,0,6.29);ctx.arc(4.5,-7,3.6,0,6.29);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(-4.5,-7,1.7,0,6.29);ctx.arc(4.5,-7,1.7,0,6.29);ctx.fill();
  ctx.fillStyle='#c98a1c';ctx.beginPath();ctx.moveTo(-2,-3);ctx.lineTo(2,-3);ctx.lineTo(0,2);ctx.closePath();ctx.fill();ctx.restore();}
function groundCanvas(bg){const c=document.createElement('canvas');c.width=800;c.height=450;const g=c.getContext('2d'),r=rng(bg==='lava'?3:4);
  if(bg==='lava'){g.fillStyle='#3a3431';g.fillRect(0,0,800,450);for(let i=0;i<420;i++){g.fillStyle=['#2c2725','#46403c','#332d2a','#4d4541'][i%4];g.beginPath();g.ellipse(r()*800,r()*450,4+r()*22,3+r()*12,r()*3,0,6.29);g.fill();}}
  else{g.fillStyle='#d6be8c';g.fillRect(0,0,800,450);for(let i=0;i<900;i++){g.fillStyle=['#cbb27e','#e0caa0','#c4a978','#e6d4ae'][i%4];g.beginPath();g.arc(r()*800,r()*450,0.8+r()*2.6,0,6.29);g.fill();}
    for(let i=0;i<14;i++){g.fillStyle='#7d8a4a';const x=r()*800,y=r()*450;for(let j=0;j<6;j++){g.beginPath();g.ellipse(x+(r()-.5)*14,y+(r()-.5)*8,2,7,r()*3,0,6.29);g.fill();}}}
  return c;}
const fmtP=x=>Math.round(x*100)+'%';

const EVO={
  id:'evolution',hash:'evolution',apUnit:7,order:1,tab:'Natural selection and drift',kind:'Simulation',
  card:'Rock pocket mice on sand and lava. Owls hunt, survivors breed, and allele frequencies change.',
  title:'Natural selection and genetic drift: rock pocket mice',
  lede:{bio:'Rock pocket mice live on light sand and on dark lava rock. Owls catch the mice that stand out. Watch fur color change over many generations.',
        honors:'Run five populations side by side. Compare natural selection, random genetic drift in small populations, and migration between populations.',
        ap:'Track allele and genotype frequencies against Hardy–Weinberg expectations, and test how dominance, mutation and population size change the outcome.'},
  scale:'Real scale: a patch of desert a few hundred meters across in Arizona or New Mexico. Each mouse is about 9 cm long, and one generation is about a year.',
  timeScale:1,dtMax:0.05,prewarm:0,sampleDt:0.25,window:60,unit:'generations',timeLabel:'Generation',chChange:2,chReveal:40,
  clock(sim){return 'Generation '+sim.st.g;},
  controls:[
    {id:'bg',label:'Ground color',type:'seg',def:'lava',lvl:'bio',options:[{v:'sand',l:'Light sand'},{v:'lava',l:'Dark lava'}]},
    {id:'s',label:'Owl hunting pressure',type:'range',min:0,max:0.6,step:0.05,def:0.3,unit:'',d:2,lvl:'bio',help:'Extra chance that a mouse whose fur stands out gets caught (selection coefficient s)'},
    {id:'N',label:'Mice per population',type:'range',min:10,max:500,step:10,def:200,unit:'',lvl:'bio'},
    {id:'p0',label:'Starting dark-fur allele',type:'range',min:0.01,max:0.99,step:0.01,def:0.1,unit:'',d:2,lvl:'bio',help:'Changing this restarts the populations.',onChange(sim){BioLab.reset(sim);}},
    {id:'m',label:'Migration rate',type:'range',min:0,max:0.2,step:0.01,def:0,unit:'',d:2,lvl:'honors',help:'Fraction of each generation that are migrants from a mainland'},
    {id:'pm',label:'Dark allele in migrants',type:'range',min:0,max:1,step:0.05,def:0.5,unit:'',d:2,lvl:'honors'},
    {id:'mu',label:'Mutation rate (D ↔ d)',type:'range',min:0,max:0.01,step:0.001,def:0,unit:'',d:3,lvl:'ap'},
    {id:'dom',label:'Dark allele is dominant',type:'toggle',def:true,lvl:'ap',help:'Off: heterozygotes have medium fur'}
  ],
  init(sim){const p=sim.p,s={r:rng((Math.random()*1e9)|0),P:new Array(NPOP).fill(p.p0),pdet:p.p0,g:0,acc:0,hist:[],obs:[0,0,0],disp:[]};
    sim.st=s;s.hist.push({g:0,P:s.P.slice(),d:p.p0});newDisplay(sim);return s;},
  step(sim,dt){const s=sim.st;s.acc+=dt;while(s.acc>=1){s.acc-=1;generation(sim);}},
  metrics:[
    {id:'p',label:'Dark-fur allele (D), population 1',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>100*s.st.P[0]},
    {id:'dark',label:'Mice born with dark fur',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>{const p=s.st.P[0],q=1-p;return 100*(s.p.dom?1-q*q:p*p);}},
    {id:'het',label:'Heterozygotes expected (2pq)',unit:'%',lvl:'honors',min:0,max:50,d:0,get:s=>{const p=s.st.P[0];return 200*p*(1-p);}},
    {id:'spread',label:'Spread between the 5 populations',unit:'points',lvl:'honors',min:0,max:100,d:0,get:s=>100*(Math.max(...s.st.P)-Math.min(...s.st.P))},
    {id:'fixed',label:'Populations that lost or fixed D',unit:'of 5',lvl:'honors',text:true,get:s=>String(s.st.P.filter(x=>x<=0||x>=1).length)},
    {id:'hwe',label:'Expected DD · Dd · dd',unit:'',lvl:'ap',text:true,get:s=>{const p=s.st.P[0],q=1-p;return fmtP(p*p)+' · '+fmtP(2*p*q)+' · '+fmtP(q*q);}},
    {id:'hwo',label:'Observed DD · Dd · dd',unit:'',lvl:'ap',text:true,get:s=>s.st.obs.map(fmtP).join(' · ')}
  ],
  graphs:[{id:'freq',label:'Dark allele frequency over generations',custom:true},{id:'dark',label:'Mice born with dark fur',lines:['dark']}],
  defaultGraph:'freq',
  plot(sim,ctx,box){const s=sim.st,win=60,xmax=Math.max(win,s.g),xmin=xmax-win,hon=atLeast('honors'),ap=atLeast('ap');
    const ax=axes(ctx,box,{xmin,xmax,ymin:0,ymax:1,xl:'Generation',yl:'Dark allele (D) frequency',yd:1});
    const H=s.hist.filter(h=>h.g>=xmin-1e-9);const n=hon?NPOP:1;
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H+2);ctx.clip();
    if(ap&&H.length>1){ctx.setLineDash([6,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=2;ctx.beginPath();H.forEach((h,j)=>{j?ctx.lineTo(ax.X(h.g),ax.Y(h.d)):ctx.moveTo(ax.X(h.g),ax.Y(h.d));});ctx.stroke();ctx.setLineDash([]);}
    for(let i=n-1;i>=0;i--){if(H.length<1)break;ctx.strokeStyle=serColor(i);ctx.lineWidth=i===0?2.8:2;ctx.beginPath();H.forEach((h,j)=>{j?ctx.lineTo(ax.X(h.g),ax.Y(h.P[i])):ctx.moveTo(ax.X(h.g),ax.Y(h.P[i]));});ctx.stroke();
      const L=H[H.length-1];ctx.fillStyle=serColor(i);ctx.beginPath();ctx.arc(ax.X(L.g),ax.Y(L.P[i]),4,0,6.29);ctx.fill();}
    ctx.restore();
    const items=[];for(let i=0;i<n;i++)items.push({label:n>1?'Pop '+(i+1):'Population 1',color:serColor(i)});
    legend(ctx,box.L+10,box.T+10,items);if(ap)legend(ctx,box.L+10,box.T+30,[{label:'Expected with no drift',color:PAL['muted'],dash:true}]);},
  narrate(sim){const p=sim.p,s=sim.st,P=s.P[0],hon=atLeast('honors'),pct=fmtP(P);
    let out;
    if(P>=1)out='<b>The dark allele is fixed in population 1.</b> Every mouse now carries only D, so there is no variation left for this gene.';
    else if(P<=0)out='<b>The dark allele is lost from population 1.</b> Every mouse is now dd, light-furred.';
    else if(p.s===0)out=p.N<=40?'<b>No owls, so fur color doesn’t affect survival.</b> But with only '+p.N+' mice, chance decides who breeds, so the allele frequency wanders randomly. This is genetic drift.':'<b>No owls and a large population.</b> Nothing favors either allele, so the dark allele stays near '+pct+', as Hardy–Weinberg predicts.';
    else if(p.bg==='lava')out='<b>On dark lava, light mice stand out</b>, so owls catch more of them. Dark mice survive to breed, so the dark allele rises each generation (now '+pct+').';
    else out='<b>On light sand, dark mice stand out</b>, so owls catch more of them. Light mice survive to breed, so the dark allele falls each generation (now '+pct+').';
    if(hon&&p.m>0)out+=' Migrants arrive every generation, pulling every population toward '+fmtP(p.pm)+'.';
    return out;},
  tour:[
    {title:'Rock pocket mice',text:'These mice live in the desert, some on light sand and some on dark lava rock. Their fur color is set by one gene. Owls hunt them by sight.',focus:[0,0,800,450],speed:0.25},
    {title:'One gene, two alleles',text:{bio:'The dark allele (D) is dominant: DD and Dd mice have dark fur. Only dd mice have light fur.',ap:'D (dark) is dominant: DD and Dd are dark and dd is light. Turn dominance off and Dd mice have medium fur.'},focus:[8,412,330,34],speed:0.25},
    {title:'Owls hunt by sight',text:'On dark lava, light mice stand out. Slow down and watch the owl pick off mice that contrast with the ground. Most of the mice it catches are light.',focus:[0,40,800,410],speed:0.12,setup(sim){BioLab.setValues(sim,{bg:'lava',s:0.5});}},
    {title:'Survivors have the babies',text:'Only survivors breed, so the next generation inherits their alleles. More D alleles get passed on than d alleles.',focus:[0,40,800,410],speed:0.12},
    {title:'Generation after generation',text:'Each generation the dark allele frequency creeps up. Over many generations, most mice end up dark. This is natural selection: the environment selects which alleles get passed on.',focus:[0,0,420,44],speed:1.5},
    {lvl:'honors',title:'Chance matters in small populations',text:'Now there are no owls and only 10 mice per population. The five populations (top right) drift apart by pure chance. Some lose the dark allele or fix it completely.',focus:[612,6,184,92],speed:2,setup(sim){BioLab.setValues(sim,{s:0,N:10,p0:0.5});}},
    {lvl:'ap',title:'Hardy–Weinberg',text:'In a large population with no selection, drift, migration or mutation, allele frequencies stay the same and genotypes stay at p², 2pq, q². Every force in this sim is a way to break one of those conditions.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{s:0,N:500,p0:0.5});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{s:0.3,N:200,p0:0.1,bg:'lava'});},
  challenges:[
    {lvl:'bio',q:'Mice live on dark lava, where owls easily spot light mice. The dark allele starts at 10%. What happens over 40 generations?',choices:['It drops to 0%','It rises, and most mice end up dark','It stays near 10%'],correct:1,
     baseline:{bg:'lava',s:0.4,N:200,p0:0.1},change:{},changeText:'Watching 40 generations',watch:'freq',at:1,reveal:40,
     explain:{bio:'Dark mice blend in with lava, so more of them survive to breed and pass on the D allele. Each generation has a slightly higher share of D, until most mice are dark.'}},
    {lvl:'bio',q:'Now the mice live on light sand. The dark allele starts at 50%. What happens?',choices:['The dark allele rises','The dark allele falls toward 0%','Nothing changes'],correct:1,
     baseline:{bg:'sand',s:0.4,N:200,p0:0.5},change:{},changeText:'Watching 40 generations',watch:'freq',at:1,reveal:40,
     explain:{bio:'On sand, dark mice stand out. The same owls now favor light fur, so the dark allele falls. Which trait is “best” depends on the environment.'}},
    {lvl:'honors',q:'Five tiny populations of 10 mice, with no owls. All start at 50% dark allele. After 60 generations, what do you expect?',choices:['All five stay near 50%','They drift apart, and some lose or fix the allele by chance','All five reach 100%'],correct:1,
     baseline:{s:0,N:10,p0:0.5},change:{},changeText:'Watching drift',watch:'freq',at:1,reveal:60,
     explain:{honors:'In small populations, which mice happen to breed is partly luck. Allele frequencies wander randomly (genetic drift), and once an allele hits 0% or 100% it stays there.'}},
    {lvl:'honors',q:'Same test, but each population has 500 mice. What happens?',choices:['They stay close to 50%','They all lose the dark allele','They all fix the dark allele'],correct:0,
     baseline:{s:0,N:500,p0:0.5},change:{},changeText:'Watching drift in large populations',watch:'freq',at:1,reveal:25,
     explain:{honors:'Drift still happens, but in a large population the random ups and downs mostly cancel out. Drift is strongest in small populations, like a species reduced to a few survivors.'}},
    {lvl:'honors',q:'Small populations have drifted apart. Now 20% of each generation are migrants from a mainland where the dark allele is 50%. What happens to the differences between populations?',choices:['They grow','They shrink, as migration pulls every population toward 50%','Nothing changes'],correct:1,
     baseline:{s:0,N:20,p0:0.5,m:0,pm:0.5},change:{m:0.2,pm:0.5},changeText:'Migration starts',watch:'freq',at:30,reveal:70,
     explain:{honors:'Migration (gene flow) mixes alleles between populations. It works against drift and keeps populations similar. Islands with little gene flow drift apart most.'}},
    {lvl:'ap',q:'On lava, with light fur (d) recessive, selection removes light alleles. Why does it struggle to remove the last few?',choices:['It removes them quickly and completely','Most remaining d alleles hide in dark Dd mice, which owls don’t target','The light allele starts increasing again'],correct:1,
     baseline:{bg:'lava',s:0.5,N:500,p0:0.5,dom:true},change:{},changeText:'Watching 60 generations',watch:'freq',at:1,reveal:60,
     explain:{ap:'When q is small, most d alleles are in heterozygotes (2pq ≫ q²), and those mice are dark. Selection only “sees” dd mice, so Δq ≈ −sq² shrinks as q falls. Turn dominance off and compare.'}},
    {lvl:'ap',instant:true,q:'A large population with no selection, drift, migration or mutation has p(D) = 0.7. Which genotype frequencies do you expect?',choices:['70% DD, 0% Dd, 30% dd','49% DD, 42% Dd, 9% dd','35% DD, 35% Dd, 30% dd'],correct:1,
     explain:{ap:'Hardy–Weinberg: p² = 0.49, 2pq = 2(0.7)(0.3) = 0.42, q² = 0.09. Set the starting allele to 0.70 with no owls and 500 mice, then compare the Expected and Observed readouts.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does the color of the ground affect the fur color of a mouse population over time?</p><ol><li>On dark lava, press Reset and record a trial at generations 0, 10, 20, 30 and 40 (pause to record).</li><li>Switch to light sand, set the starting allele to 0.90, and repeat.</li><li>Plot generation against mice born with dark fur.</li></ol><p>Explain the change using the words <i>survive</i>, <i>reproduce</i> and <i>allele</i>.</p>',
       honors:'<p><b>Question:</b> How does population size affect genetic drift?</p><ol><li>Set owl pressure to 0 and the starting allele to 0.50.</li><li>For 10, 50, 200 and 500 mice, run 50 generations and record the spread between populations.</li><li>Plot mice per population (x) against spread (y).</li></ol><p>Explain why endangered species with small populations lose genetic variation.</p>',
       ap:'<p><b>Question:</b> How does selection strength change the rate of evolution, and how far do genotypes depart from Hardy–Weinberg?</p><ol><li>On lava with 500 mice and p₀ = 0.10, find the generation where D first passes 50% for s = 0.1, 0.3 and 0.5.</li><li>With s = 0, compare observed and expected genotype frequencies, and run a χ² test.</li></ol><p><b>Claim–evidence–reasoning:</b> Which Hardy–Weinberg condition does each control break?</p>'},
  terms:[{t:'Allele',d:'One version of a gene. Here, D (dark fur) or d (light fur).'},{t:'Natural selection',d:'Individuals with traits that suit their environment survive and reproduce more, so their alleles become more common.'},{t:'Adaptation',d:'A trait that helps an organism survive and reproduce in its environment.'},
    {lvl:'honors',t:'Allele frequency',d:'The share of all copies of a gene in a population that are one allele.'},{lvl:'honors',t:'Genetic drift',d:'Random changes in allele frequency from chance, strongest in small populations.'},{lvl:'honors',t:'Gene flow',d:'Movement of alleles between populations through migration.'},{lvl:'honors',t:'Fixation',d:'When an allele reaches 100% and the other is lost.'},
    {lvl:'ap',t:'Hardy–Weinberg equilibrium',d:'p² + 2pq + q² = 1. Frequencies stay constant with no selection, drift, migration, mutation or non-random mating.'},{lvl:'ap',t:'Selection coefficient (s)',d:'The fitness cost of a trait relative to the best one.'}],
  about:'<p><b>Model:</b> a Wright–Fisher model with five independent populations. Each generation, genotype fitness is 1 for fur that matches the ground and 1 − s for fur that contrasts (1 − s/2 for medium fur). Then p′ = (p²w<sub>DD</sub> + pq·w<sub>Dd</sub>)/w̄, followed by migration p″ = (1 − m)p′ + m·p<sub>migrant</sub> and symmetric mutation. Finally the next generation’s 2N alleles are drawn at random (binomial), which is the drift. The dashed AP line shows the same model with no drift.</p><p><b>Simplified:</b> random mating, non-overlapping generations, and selection only through owl predation. The mice on screen are a sample of population 1, up to 120 of them. The model inspiration is real: Nachman and colleagues traced dark fur on lava flows to the <i>Mc1r</i> gene.</p>',
  initVis(sim){const v=sim.vis;v.ground={};v.owl={x:760,y:30};v.lastG=-1;},
  thumbSetup(sim){for(let i=0;i<8;i++)generation(sim);sim.t=sim.st.g+0.4;},
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,v=sim.vis,hon=atLeast('honors');
    if(!v.ground[p.bg])v.ground[p.bg]=groundCanvas(p.bg);ctx.drawImage(v.ground[p.bg],0,0);
    const u=clamp(sim.t-s.g,0,1);
    // mice: newborns appear, then the hunt removes doomed ones in order
    const doomed=s.disp.filter(d=>d.doomed&&d.tk>u);let target=null;
    for(const d of s.disp){if(d.doomed&&d.tk<=u)continue;const a=clamp(u/0.1,0,1),wob=RM?0:Math.sin(t*2+d.x)*1.2;mouse(ctx,d.x+wob,d.y,COL[phen(d.g,p.dom)],a,d.face,1.15);}
    // feathers where a mouse was just caught
    for(const d of s.disp){if(d.doomed&&d.tk<=u&&u-d.tk<0.08){ctx.fillStyle='rgba(255,255,255,.75)';for(let j=0;j<5;j++){ctx.beginPath();ctx.ellipse(d.x+Math.cos(j*1.3)*9*(1+(u-d.tk)*12),d.y+Math.sin(j*1.3)*6,3,1.4,j,0,6.29);ctx.fill();}}}
    if(doomed.length&&u>0.12&&u<0.76){target=doomed.reduce((a,b)=>a.tk<b.tk?a:b);}
    const tx=target?target.x:760,ty=target?target.y-14:28;v.owl.x=lerp(v.owl.x,tx,Math.min(1,vdt*(target?9:3)));v.owl.y=lerp(v.owl.y,ty,Math.min(1,vdt*(target?9:3)));
    owl(ctx,v.owl.x,v.owl.y,t*14,1.05);
    // phase label
    const phase=u<0.14?'New generation born':u<0.76?'Owls hunting':'Survivors breed';
    const lab=k>1.3?'Gen '+s.g+'  ·  D = '+fmtP(s.P[0]):'Population 1  ·  Generation '+s.g+'  ·  '+p.N+' mice  ·  D = '+fmtP(s.P[0]);
    ctx.font='700 '+12.5*k+'px '+FONT;const lw=ctx.measureText(lab).width+14*k;pill(ctx,lab,8+lw/2,22,PAL['card'],PAL['cv-ink'],12.5*k);
    ctx.font='700 '+12*k+'px '+FONT;const pw=ctx.measureText(phase).width+13*k;pill(ctx,phase,8+pw/2,26+22*k,'rgba(20,20,24,.72)','#fff',12*k);
    // all populations (honors+)
    if(hon){ctx.fillStyle=PAL['card'];rr(ctx,618,8,176,86,10);ctx.fill();txt(ctx,'All 5 populations: D',706,26,{s:11.5*k,w:700,a:'center'});
      s.P.forEach((x,i)=>{const bx=636+i*32,h=50;ctx.fillStyle=PAL['card2'];ctx.fillRect(bx,36,18,h);ctx.fillStyle=serColor(i);ctx.fillRect(bx,36+h*(1-x),18,h*x);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(bx+.5,36.5,17,h);});}
    // legend
    const items=p.dom?[['dark','dark fur (DD, Dd)'],['light','light fur (dd)']]:[['dark','dark (DD)'],['mid','medium (Dd)'],['light','light (dd)']];
    ctx.font='400 '+12*k+'px '+FONT;let w=16;items.forEach(it=>{w+=ctx.measureText(it[1]).width+44;});ctx.fillStyle=PAL['card'];rr(ctx,8,414,w,30,8);ctx.fill();
    let lx=22;items.forEach(it=>{mouse(ctx,lx+8,430,COL[it[0]],1,1,0.75);txt(ctx,it[1],lx+24,434,{s:12*k,c:PAL['cv-ink']});lx+=ctx.measureText(it[1]).width+44;});}
};
BioLab.register(EVO);
})();
