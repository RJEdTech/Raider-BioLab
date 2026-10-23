(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,lvText}=BioLab.h;

/* Hardy–Weinberg trainer. One gene, two alleles: A (purple flowers, dominant) and a (white).
   Large, randomly mating population with every condition met: genotype frequencies are p², 2pq, q² and stay put.
   Breaking a condition (each generation, in this order):
     mutation A→a at 2% per generation; migration: 10% of the gene pool replaced by migrants with p = 0.9;
     non-random mating: inbreeding coefficient F = 0.5 (AA = p² + Fpq, Aa = 2pq(1 − F), aa = q² + Fpq);
     selection: aa plants survive half as well; small population: the next 20 plants are a random sample. */
const ACOL='#3b1f5c',aCOL='#e3d6f0',PURPLE='#7a4fa6',WHITE='#f6f3f9',MID='#a98bc9';
const MU=0.02,MIG=0.1,PMIG=0.9,FINB=0.5,WAA=0.5;
function roundCounts(f,N){const raw=f.map(x=>x*N),c=raw.map(Math.floor);let left=N-c.reduce((a,b)=>a+b,0);
  raw.map((x,i)=>[x-Math.floor(x),i]).sort((a,b)=>b[0]-a[0]).forEach(([,i])=>{if(left>0){c[i]++;left--;}});return c;}
const hw=p=>[p*p,2*p*(1-p),(1-p)*(1-p)];
const f2=x=>(Math.round(x*100)/100).toFixed(2);
function chi2(counts){const N=counts[0]+counts[1]+counts[2];if(!N)return 0;const p=(2*counts[0]+counts[1])/(2*N),e=hw(p).map(x=>x*N);
  return counts.reduce((a,o,i)=>a+(e[i]>0?(o-e[i])*(o-e[i])/e[i]:0),0);}
function brokenList(p){const b=[];if(!p.large)b.push('Small population');if(!p.random)b.push('Inbreeding');if(!p.nomut)b.push('Mutation A → a');if(!p.nomig)b.push('Migrants arriving');if(!p.nosel)b.push('Selection against aa');return b;}
function generation(sim){const p=sim.p,s=sim.st;let x=s.p;
  if(!p.nomut)x=x*(1-MU);
  if(!p.nomig)x=(1-MIG)*x+MIG*PMIG;
  const q=1-x,F=p.random?0:FINB;let z=[x*x+F*x*q,2*x*q*(1-F),q*q+F*x*q];
  if(!p.nosel){z=[z[0],z[1],z[2]*WAA];const t=z[0]+z[1]+z[2];z=z.map(v=>v/t);}
  if(p.large){s.N=100;s.freq=z;s.counts=roundCounts(z,100);s.p=z[0]+z[1]/2;}
  else{const N=20,c=[0,0,0];for(let i=0;i<N;i++){const r=s.r();c[r<z[0]?0:r<z[0]+z[1]?1:2]++;}s.N=N;s.counts=c;s.freq=c.map(v=>v/N);s.p=(2*c[0]+c[1])/(2*N);}
  s.gen++;s.flash=0.5;s.hist.push({g:s.gen,p:s.p});if(s.hist.length>300)s.hist.shift();sim.infoDirty=true;}
function shuffle(arr,r){for(let i=arr.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function mc(q,opts,correctText,explain,lvl,extra){const r=extra.r;const order=shuffle(opts.slice(),r);return Object.assign({lvl,instant:true,q,choices:order,correct:order.indexOf(correctText),explain},extra.keep||{});}
function pct(x){const v=x*100;return (v>=10?v.toFixed(0):v>=1?v.toFixed(1):v.toFixed(2))+'%';}
function makeProblems(seed){const r=rng(1000+seed*7919),pick=a=>a[Math.floor(r()*a.length)],L=[];
  // Bio 1: heterozygotes from p
  {const p=pick([0.6,0.7,0.8,0.9,0.3,0.4]),q=+(1-p).toFixed(1),het=2*p*q,opts=[f2(het),f2(p*p),f2(q*q),f2(p*q)];
   L.push(mc(`In a large, randomly mating population, the allele for purple flowers (A) has frequency p = ${p}. What fraction of the plants should be heterozygous (Aa)?`,
     opts,f2(het),`q = 1 − p = ${q}. Heterozygotes = 2pq = 2 × ${p} × ${q} = <b>${f2(het)}</b>. The other plants are AA (p² = ${f2(p*p)}) and aa (q² = ${f2(q*q)}); the three add up to 1.`,'bio',{r,keep:{showP:p}}));}
  // Bio 2: q from recessive phenotype
  {const [q2,q]=pick([[0.09,0.3],[0.16,0.4],[0.04,0.2],[0.36,0.6],[0.49,0.7]]),p=+(1-q).toFixed(1),opts=[f2(q),f2(q2),f2(p),f2(1-q2)];
   L.push(mc(`${Math.round(q2*100)}% of the plants in a population have white flowers (aa). What is q, the frequency of the white allele?`,
     opts,f2(q),`White plants are aa, so q² = ${q2}. Take the square root: q = √${q2} = <b>${f2(q)}</b>. Then p = 1 − q = ${f2(p)}. Watch out: q² is the fraction of white <i>plants</i>, while q is the fraction of white <i>alleles</i>.`,'bio',{r,keep:{showP:p}}));}
  // Bio 3: conditions
  L.push(mc('Which of these is NOT one of the conditions for Hardy–Weinberg equilibrium?',['A very large population','Random mating','Strong natural selection','No migration in or out'],'Strong natural selection',
    'Hardy–Weinberg needs <b>no</b> natural selection. The five conditions are: a very large population, random mating, no mutation, no migration and no selection. Break any one and allele or genotype frequencies can change. That change is evolution.','bio',{r}));
  // Honors 1: carriers
  {const [N,q]=pick([[100,0.1],[400,0.05],[2500,0.02],[10000,0.01],[625,0.04]]),p=1-q,het=2*p*q,opts=[pct(het),pct(q),pct(q*q),pct(p*p)];
   L.push(mc(`About 1 in ${N.toLocaleString()} people has a recessive genetic condition (aa). Assuming Hardy–Weinberg equilibrium, about what percentage of people are carriers (Aa)?`,
     opts,pct(het),`q² = 1/${N.toLocaleString()} = ${+(q*q).toPrecision(4)}, so q = √${+(q*q).toPrecision(4)} = ${q}. p = 1 − q = ${+p.toFixed(2)}. Carriers = 2pq = 2 × ${+p.toFixed(2)} × ${q} = ${+het.toFixed(4)} ≈ <b>${pct(het)}</b>. Far more people carry the allele than have the condition.`,'honors',{r,keep:{showP:+p.toFixed(2)}}));}
  // Honors 2: allele frequency from counts
  {let N,a,b,c,p,opts,tries=0;
   do{N=pick([100,200,400]);a=Math.round(N*(0.1+0.45*r()));b=Math.round((N-a)*(0.2+0.6*r()));c=N-a-b;p=(2*a+b)/(2*N);
     const ds=[a/N,(a+b)/N,Math.sqrt(a/N),1-p].map(f2);opts=[f2(p)].concat(ds);tries++;}
   while(tries<50&&(c<5||new Set(opts).size<5||opts.slice(1).some(o=>Math.abs(+o-p)<0.02)));
   opts=opts.slice(0,4);
   L.push(mc(`A sample of ${N} plants has ${a} AA, ${b} Aa and ${c} aa. What is p, the frequency of allele A?`,
     opts,f2(p),`Count alleles. Each AA plant has two A alleles and each Aa has one: ${2*a} + ${b} = ${2*a+b} A alleles. There are 2 × ${N} = ${2*N} alleles in all. p = ${2*a+b} ÷ ${2*N} = <b>${f2(p)}</b>. This works whether or not the population is in equilibrium.`,'honors',{r,keep:{showP:+f2(p)}}));}
  // AP 1: chi-square
  {let N,a,b,c,x2,fits,tries=0;
   do{N=pick([100,200]);const p0=pick([0.4,0.5,0.6,0.7]);fits=r()<0.5;let e=roundCounts(hw(p0),N);
     if(fits){const d=Math.round((r()-0.5)*4);e=[e[0]+d,e[1]-2*d,e[2]+d];}else{const m=Math.round(e[1]*(0.3+0.15*r()));const h=Math.floor(m/2);e=[e[0]+h,e[1]-2*h,e[2]+h];}
     [a,b,c]=e;x2=chi2(e);tries++;}while(tries<80&&(a<1||b<1||c<1||(fits&&x2>=3.0)||(!fits&&x2<=6)));
   const p=(2*a+b)/(2*N),ex=hw(p).map(v=>v*N),fitTxt='Yes: χ² is below 3.84, so the difference could be chance',noTxt='No: χ² is above 3.84, so the population is not in equilibrium';
   L.push(mc(`A sample of ${N} plants has ${a} AA, ${b} Aa and ${c} aa. Is this population in Hardy–Weinberg equilibrium? (Use χ² with df = 1; the critical value at p = 0.05 is 3.84.)`,
     [fitTxt,noTxt],x2<3.84?fitTxt:noTxt,`p = (2×${a} + ${b}) ÷ ${2*N} = ${p.toFixed(3)}. Expected: AA = p²N = ${ex[0].toFixed(1)}, Aa = 2pqN = ${ex[1].toFixed(1)}, aa = q²N = ${ex[2].toFixed(1)}. χ² = Σ(o − e)²/e = <b>${x2.toFixed(2)}</b>, which is ${x2<3.84?'below':'above'} 3.84. ${x2<3.84?'The small differences are consistent with chance.':'There are '+(b<ex[1]?'too few':'too many')+' heterozygotes for chance alone.'} (df = 3 genotype classes − 1 − 1 estimated allele frequency = 1.)`,'ap',{r}));}
  // AP 2: which condition
  L.push(mc('A population has far fewer heterozygotes than 2pq predicts, but its allele frequencies have not changed in many generations. Which condition is most likely broken?',
    ['Natural selection','Non-random mating, such as inbreeding','Mutation','Migration'],'Non-random mating, such as inbreeding',
    'Inbreeding pairs similar genotypes, so offspring are more often homozygous: heterozygotes drop and both homozygotes rise, while p and q stay the same. Selection, mutation and migration would change the allele frequencies themselves. Try it: turn off Random mating and run 10 generations.','ap',{r}));
  return L;}

const HW={
  id:'hardyweinberg',hash:'hardyweinberg',apUnit:7,order:2,tab:'Hardy–Weinberg trainer',kind:'Learning tool',prereq:['evolution'],
  card:'See where p², 2pq and q² come from, break the five conditions one at a time, and practice fresh problems with worked answers.',
  title:'Hardy–Weinberg equilibrium',
  lede:{bio:'Slide p to change how common the purple allele is, and see how many purple and white plants random mating produces. Then practice the math.',
        honors:'Break the five Hardy–Weinberg conditions one at a time. See which ones change allele frequencies and which only change genotype frequencies. Then solve carrier and allele-counting problems.',
        ap:'Test populations for equilibrium with χ², and connect each broken condition to its signature in the data.'},
  scale:'A model population: 100 plants of one species, each with two alleles of one flower-color gene.',
  timeless:true,animated:true,graph:true,
  controls:[
    {id:'p',label:'Frequency of allele A (p)',type:'range',min:0,max:1,step:0.01,def:0.7,unit:'',d:2,lvl:'bio',help:'Changing p restarts the population.',onChange(sim){BioLab.reset(sim);}},
    {id:'large',label:'Large population',help:'Off: only 20 plants, so chance (genetic drift) changes p',type:'toggle',def:true,lvl:'honors',onChange(sim){const s=sim.st;if(sim.p.large){s.N=100;s.counts=roundCounts(s.freq,100);}else{s.N=20;s.counts=roundCounts(s.freq,20);}}},
    {id:'random',label:'Random mating',help:'Off: plants mostly mate with relatives (inbreeding)',type:'toggle',def:true,lvl:'honors'},
    {id:'nomut',label:'No mutation',help:'Off: 2% of A alleles mutate to a each generation',type:'toggle',def:true,lvl:'honors'},
    {id:'nomig',label:'No migration',help:'Off: 10% of each generation are migrants (p = 0.9)',type:'toggle',def:true,lvl:'honors'},
    {id:'nosel',label:'No natural selection',help:'Off: white (aa) plants survive half as well',type:'toggle',def:true,lvl:'honors'}
  ],
  actions:[
    {id:'gen1',label:'Run 1 generation',lvl:'honors',run(sim){sim.st.queue+=1;}},
    {id:'gen10',label:'Run 10 generations',lvl:'honors',primary:true,run(sim){sim.st.queue+=10;}},
    {id:'restart',label:'Start over',lvl:'honors',run(sim){BioLab.reset(sim);}},
    {id:'newprob',label:'New practice problems',lvl:'bio',run(sim){sim.st.seed++;BioLab.gotoChallenge(sim,0);}}
  ],
  init(sim){const p=sim.p.p,ord=shuffle([...Array(100).keys()],rng(5)),seed=sim.st?sim.st.seed:((Math.random()*1000)|0);
    const freq=hw(p),N=sim.p.large?100:20;return {p,freq,counts:roundCounts(freq,N),N,gen:0,hist:[{g:0,p}],queue:0,acc:0,seed,ord,r:rng((Math.random()*1e9)|0),flash:0,t:0};},
  step(sim,dt){const s=sim.st;s.t+=dt;if(s.flash>0)s.flash=Math.max(0,s.flash-dt);
    if(s.queue>0){s.acc+=dt;if(s.acc>=0.35){s.acc=0;s.queue--;generation(sim);}}},
  metrics:[
    {id:'pA',label:'Allele A (p)',unit:'',lvl:'bio',min:0,max:1,d:2,get:s=>s.st.p},
    {id:'qa',label:'Allele a (q)',unit:'',lvl:'bio',min:0,max:1,d:2,get:s=>1-s.st.p},
    {id:'AA',label:'Expected AA (p²)',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>100*hw(s.st.p)[0]},
    {id:'Aa',label:'Expected Aa (2pq)',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>100*hw(s.st.p)[1]},
    {id:'aa',label:'Expected aa (q²)',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>100*hw(s.st.p)[2]},
    {id:'obs',label:'Plants counted: AA · Aa · aa',unit:'',lvl:'honors',text:true,get:s=>s.st.counts.join(' · ')+' of '+s.st.N},
    {id:'gen',label:'Generation',unit:'',lvl:'honors',min:0,max:null,d:0,get:s=>s.st.gen},
    {id:'chi',label:'χ² vs. Hardy–Weinberg (cutoff 3.84)',unit:'',lvl:'ap',min:0,max:10,d:2,get:s=>chi2(s.st.counts)}
  ],
  graphs:[{id:'geno',label:'Expected vs. counted genotypes',custom:true},{id:'phist',label:'Allele A (p) over generations',lvl:'honors',custom:true}],
  defaultGraph:'geno',
  plot(sim,ctx,box,id){const s=sim.st;
    if(id==='phist'){const xmax=Math.max(10,s.gen),ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax:1,xl:'Generation',yl:'Frequency of A (p)',yd:1});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H+2);ctx.clip();ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();
      s.hist.forEach((h,i)=>{i?ctx.lineTo(ax.X(h.g),ax.Y(h.p)):ctx.moveTo(ax.X(h.g),ax.Y(h.p));});ctx.stroke();const L=s.hist[s.hist.length-1];ctx.fillStyle=PAL['g-line'];ctx.beginPath();ctx.arc(ax.X(L.g),ax.Y(L.p),4.5,0,6.29);ctx.fill();ctx.restore();return;}
    const e=hw(s.p).map(x=>x*100),o=s.counts.map(c=>100*c/s.N);
    const ax=axes(ctx,{L:box.L,T:box.T+22,W:box.W,H:box.H-22,cw:box.cw,ch:box.ch},{xmin:0,xmax:3,ymin:0,ymax:100,xcats:['AA','Aa','aa'],yl:'% of plants'});
    [[e,PAL['s2'],0.2],[o,PAL['s1'],0.52]].forEach(([vals,col,off])=>vals.forEach((v,i)=>{const x0=ax.X(i+off),x1=ax.X(i+off+0.28),y0=ax.Y(0),y1=ax.Y(v);ctx.fillStyle=col;ctx.fillRect(x0,y1,x1-x0,y0-y1);
      txt(ctx,v.toFixed(0),(x0+x1)/2,y1-4,{s:12,c:PAL['fg'],a:'center',w:600});}));
    legend(ctx,box.L,box.T+8,[{label:'Expected (p², 2pq, q²)',color:PAL['s2']},{label:'Counted in the population',color:PAL['s1']}]);},
  challenges(sim){return makeProblems(sim.st?sim.st.seed:0);},
  challengeTitle:'Practice problems',
  onChallenge(sim,ch,phase){if(phase==='done'&&ch&&ch.showP!==undefined){BioLab.setValues(sim,{p:ch.showP});}},
  narrate(sim){const s=sim.st,p=sim.p,b=brokenList(p),pp=s.p,q=1-pp,e=hw(pp).map(x=>Math.round(x*100));
    if(s.queue>0)return '<b>Running generations…</b> Watch the gene pool bar and the plants. '+(b.length?'Broken: '+b.join(', ').toLowerCase()+'.':'Every condition is met, so nothing should change.');
    if(!b.length)return `p = ${f2(pp)} and q = ${f2(q)}. Random mating combines alleles the way the square shows: <b>${e[0]}% AA, ${e[1]}% Aa, ${e[2]}% aa</b>. With all five conditions met, these numbers stay the same every generation.`;
    if(s.gen===0)return '<b>'+b.join(', ')+'</b> '+(b.length===1?'is':'are')+' now in effect. Press Run 10 generations to see what changes.';
    const msgs=[];if(!p.nosel)msgs.push('selection removes white plants, so q falls');if(!p.nomut)msgs.push('mutation slowly turns A into a');if(!p.nomig)msgs.push('migrants pull p toward 0.9');
    if(!p.random)msgs.push('inbreeding makes extra homozygotes without changing p');if(!p.large)msgs.push('chance in a tiny population makes p wander');
    return `After ${s.gen} generation${s.gen===1?'':'s'}, p = <b>${f2(pp)}</b>. ${msgs.join('; ').replace(/^./,c=>c.toUpperCase())}.`;},
  tour:[
    {title:'One gene, two alleles',text:'Each plant has two copies of a flower-color gene. A (dark dot) makes purple flowers and is dominant; a (light dot) makes white. The center of each flower shows its two alleles.',focus:[18,36,412,410],pause:true},
    {title:'The gene pool',text:'Put every allele from every plant into one pool. p is the fraction that are A and q is the fraction that are a. Since there are only two alleles, p + q = 1.',focus:[452,40,340,88],pause:true},
    {title:'Random mating',text:'If plants mate at random, each offspring draws two alleles from the pool. The chance of AA is p × p, of aa is q × q, and of Aa is 2pq (A from either parent). So p² + 2pq + q² = 1.',focus:[468,128,320,282],pause:true},
    {title:'Try a new p',text:'Here p is now 0.3. Purple is dominant, yet white plants are now the majority: q² = 0.49. Dominant does not mean common.',focus:[18,36,775,410],pause:true,setup(sim){BioLab.setValues(sim,{p:0.3});}},
    {lvl:'honors',title:'Break a condition',text:'Selection is now on: white plants survive half as well. Watch q fall generation by generation. That is evolution: a change in allele frequencies over time.',focus:[18,36,775,410],speed:1,setup(sim){BioLab.setValues(sim,{p:0.3,nosel:false});sim.st.queue=10;}},
    {lvl:'ap',title:'Inbreeding is different',text:'With inbreeding, p stays put, but heterozygotes drop and both homozygotes rise. A χ² test catches it even though allele frequencies never change.',focus:[18,36,775,410],speed:1,setup(sim){BioLab.setValues(sim,{p:0.5,nosel:true,random:false});sim.st.queue=6;}}
  ],
  tourReset:true,
  onTourExit(sim){BioLab.setValues(sim,{p:0.7,large:true,random:true,nomut:true,nomig:true,nosel:true});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> How does p control how many plants of each type there are?</p><ol><li>Set p to 0.1, 0.3, 0.5, 0.7 and 0.9. Record a trial at each.</li><li>On the Trials graph, plot p (x) against expected aa (y).</li></ol><p>Describe the shape of the curve. Why are white plants so rare when p is high?</p>',
       honors:'<p><b>Question:</b> Which conditions change <i>allele</i> frequencies, and which change only <i>genotype</i> frequencies?</p><ol><li>Set p = 0.5 and press Start over.</li><li>Turn off one condition, press Run 10 generations, then record a trial.</li><li>Repeat for each of the five conditions, starting over each time.</li></ol><p>Sort the five conditions into two groups using your p values and genotype counts.</p>',
       ap:'<p><b>Question:</b> Can a χ² test detect every broken condition?</p><ol><li>For each condition, start over at p = 0.5, break only that condition, run 10 generations and record χ².</li></ol><p><b>Claim–evidence–reasoning:</b> Which broken conditions give a large χ², and why can a population evolve (p changes) and still fit Hardy–Weinberg proportions each generation?</p>'},
  terms:[{t:'Allele frequency',d:'How common one allele is in the gene pool. p is for A and q is for a, so p + q = 1.'},{t:'Gene pool',d:'All the alleles in a population.'},{t:'Hardy–Weinberg equilibrium',d:'The model state in which allele and genotype frequencies do not change from generation to generation.'},
    {lvl:'honors',t:'p² + 2pq + q² = 1',d:'Expected genotype frequencies (AA, Aa, aa) under random mating.'},{lvl:'honors',t:'Carrier',d:'A heterozygote (Aa) who has the recessive allele but not the recessive trait.'},{lvl:'honors',t:'Five conditions',d:'Large population, random mating, no mutation, no migration, no natural selection.'},
    {lvl:'ap',t:'χ² goodness of fit',d:'Σ(observed − expected)²/expected. For Hardy–Weinberg with two alleles, df = 1 and the cutoff is 3.84 at p = 0.05.'},{lvl:'ap',t:'Inbreeding coefficient (F)',d:'How much inbreeding reduces heterozygosity: Aa = 2pq(1 − F).'}],
  about:'<p>The population has 100 plants (20 when “Large population” is off). Each generation, the model first applies mutation (2% of A becomes a), then migration (10% of the gene pool replaced by migrants with p = 0.9). Next it forms offspring by random mating, or by inbreeding with F = 0.5, then applies selection (aa survival × 0.5). In a large population the counts are the expected frequencies rounded to whole plants. In a small one they are a random sample of 20.</p><p>The rates are much stronger than in most real populations, so the effects show up within 10 generations. Practice problems are generated fresh, and their answers are computed exactly.</p>',
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,hon=atLeast('honors'),pp=s.p,q=1-pp;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    txt(ctx,(s.N===100?'100 plants':'Only 20 plants (small population)')+' · purple (A) is dominant to white (a)',24,26,{s:13*k,w:700});
    // plants
    const geno=[];for(let i=0;i<s.counts[0];i++)geno.push(0);for(let i=0;i<s.counts[1];i++)geno.push(1);for(let i=0;i<s.counts[2];i++)geno.push(2);
    const cells=new Array(100).fill(-1);geno.forEach((g,i)=>{cells[s.ord[i]]=g;});
    const pop=s.flash>0&&!RM?1+0.15*Math.sin(s.flash*12):1;
    for(let i=0;i<100;i++){const cx=48+(i%10)*39,cy=64+Math.floor(i/10)*38,g=cells[i];
      if(g<0){ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(cx,cy,12,0,6.29);ctx.stroke();ctx.setLineDash([]);continue;}
      ctx.save();ctx.translate(cx,cy);ctx.scale(pop,pop);const pet=g===2?WHITE:PURPLE;
      for(let j=0;j<5;j++){const a=j*1.2566+0.3;ctx.fillStyle=pet;ctx.beginPath();ctx.ellipse(Math.cos(a)*8,Math.sin(a)*8,7,4.6,a,0,6.29);ctx.fill();if(g===2){ctx.strokeStyle='#b7a9c9';ctx.lineWidth=0.8;ctx.stroke();}}
      ctx.fillStyle=g===2?aCOL:ACOL;ctx.beginPath();ctx.arc(0,0,5.2,Math.PI/2,Math.PI*1.5);ctx.fill();ctx.fillStyle=g===0?ACOL:aCOL;ctx.beginPath();ctx.arc(0,0,5.2,-Math.PI/2,Math.PI/2);ctx.fill();
      ctx.strokeStyle='#2a1640';ctx.lineWidth=0.8;ctx.beginPath();ctx.arc(0,0,5.2,0,6.29);ctx.stroke();ctx.restore();}
    // gene pool bar
    const bx=462,by=64,bw=320,bh=34;txt(ctx,'Gene pool: all alleles',bx,54,{s:12.5*k,w:700,c:PAL['cv-soft']});
    ctx.fillStyle=ACOL;ctx.fillRect(bx,by,bw*pp,bh);ctx.fillStyle=aCOL;ctx.fillRect(bx+bw*pp,by,bw*q,bh);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(bx,by,bw,bh);
    if(pp>0.22)txt(ctx,'A  p = '+f2(pp),bx+8,by+bh/2+1,{s:13*k,w:700,c:'#fff',b:'middle'});if(q>0.22)txt(ctx,'a  q = '+f2(q),bx+bw-8,by+bh/2+1,{s:13*k,w:700,c:ACOL,a:'right',b:'middle'});
    // broken conditions
    const b=brokenList(p);let px=bx;b.forEach(l=>{ctx.font='700 '+11*k+'px '+FONT;const w=ctx.measureText(l).width+14;if(px+w>796)return;pill(ctx,l,px+w/2,by+bh+16,'#d32f2f','#fff',11*k);px+=w+6;});
    // Punnett square of gametes
    const sx=530,sy=168,S=230,wp=S*pp,wq=S*q;txt(ctx,'Random mating',sx,sy-32,{s:12.5*k,w:700,c:PAL['cv-soft']});
    const lab=(t_,x,y,c)=>txt(ctx,t_,x,y,{s:12*k,w:700,c:c||PAL['cv-ink'],a:'center',b:'middle'});
    if(wp>14)lab('A (p)',sx+wp/2,sy-12);if(wq>14)lab('a (q)',sx+wp+wq/2,sy-12);if(wp>14)lab('A',sx-14,sy+wp/2);if(wq>14)lab('a',sx-14,sy+wp+wq/2);
    const cell=(x,y,w,h,col,l1,l2,ink)=>{if(w<=0||h<=0)return;ctx.fillStyle=col;ctx.fillRect(x,y,w,h);ctx.strokeStyle=PAL['cv-bg'];ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
      if(w>52&&h>34){lab(l1,x+w/2,y+h/2-8,ink);lab(l2,x+w/2,y+h/2+9,ink);}};
    cell(sx,sy,wp,wp,ACOL,'AA','p² = '+f2(pp*pp),'#fff');cell(sx+wp,sy,wq,wp,MID,'Aa','pq = '+f2(pp*q),'#2a1640');cell(sx,sy+wp,wp,wq,MID,'Aa','pq = '+f2(pp*q),'#2a1640');cell(sx+wp,sy+wp,wq,wq,aCOL,'aa','q² = '+f2(q*q),'#2a1640');
    const e=hw(pp);txt(ctx,'Expected: '+Math.round(e[0]*100)+'% AA · '+Math.round(e[1]*100)+'% Aa · '+Math.round(e[2]*100)+'% aa',462,424,{s:12.5*k,w:600});
    if(hon)txt(ctx,'Counted: '+s.counts[0]+' AA · '+s.counts[1]+' Aa · '+s.counts[2]+' aa'+(s.gen?' (generation '+s.gen+')':''),462,443,{s:12.5*k,c:PAL['cv-soft']});
    else txt(ctx,'Purple: '+(s.counts[0]+s.counts[1])+' · white: '+s.counts[2],462,443,{s:12.5*k,c:PAL['cv-soft']});
    // legend for dots
    ctx.fillStyle=ACOL;ctx.beginPath();ctx.arc(30,440,5,0,6.29);ctx.fill();txt(ctx,'A allele',40,444,{s:12*k,c:PAL['cv-soft']});
    ctx.fillStyle=aCOL;ctx.beginPath();ctx.arc(110,440,5,0,6.29);ctx.fill();ctx.strokeStyle='#2a1640';ctx.lineWidth=0.8;ctx.stroke();txt(ctx,'a allele',120,444,{s:12*k,c:PAL['cv-soft']});}
};
BioLab.register(HW);
})();
