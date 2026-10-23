(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,lvText}=BioLab.h;

/* Bird beak lab. Five beak "tools", five foods.
   EFF[b][f] = items a bird with beak b collects in one feeding round when food f is plentiful.
   Each beak type forages on the food that pays it best, given how crowded each food patch is (optimal foraging).
   Food supply per round S = 5 items per bird of carrying capacity, split among foods by the island's mix.
   On a patch, if demand exceeds supply, everyone there gets the same fraction σ = supply ÷ demand.
   Each bird's catch is Poisson(λ) with λ = EFF × σ. Birds that collect at least T items survive.
   Survivors each raise up to 3 chicks (population capped at K); chicks inherit the parent's beak
   (honors: 4% chance of a neighboring beak type). */
const BEAKS=[{id:'tw',name:'Tweezers',col:'#c0392b'},{id:'ch',name:'Chopsticks',col:'#2d6bd2'},{id:'sp',name:'Spoon',col:'#1b8a4a'},{id:'cl',name:'Clothespin',col:'#c27a00'},{id:'bc',name:'Binder clip',col:'#7b3fe4'}];
const FOODS=[{id:'rice',name:'Rice'},{id:'small',name:'Small seeds'},{id:'worms',name:'Worms'},{id:'large',name:'Large seeds'},{id:'nuts',name:'Hard nuts'}];
const EFF=[[4,9,5,2,0.5],[2,4,9,3,1],[9,5,1,4,3],[2,3,4,9,3],[1,2,2,6,9]];
const ISL={mixed:[.2,.2,.2,.2,.2],small:[0,1,0,0,0],worms:[0,0,1,0,0],drought:[0,0,0,.6,.4],nuts:[0,0,0,0,1]};
const ISLNAME={mixed:'Mixed foods',small:'Only small seeds',worms:'Only worms',drought:'Drought: only large, hard seeds',nuts:'Only hard nuts'};
const SPB=5,FEC=3,MUT=0.04,IX=320,IY=252,IRX=292,IRY=168;
function pois(l,r){if(l<=0)return 0;const L=Math.exp(-l);let k=0,p=1;do{k++;p*=r();}while(p>L);return k-1;}
function poisCDFge(l,T){let p=Math.exp(-l),c=0;for(let k=0;k<T;k++){c+=p;p*=l/(k+1);}return 1-c;}
function forage(n,a,K){const S=SPB*K;let sig=a.map(v=>v>0?1:0),ch=[];
  for(let it=0;it<10;it++){ch=EFF.map(row=>{let best=-1,bv=-1;row.forEach((e,j)=>{if(a[j]<=0)return;const v=e*sig[j];if(v>bv){bv=v;best=j;}});return best;});
    const D=a.map((v,j)=>EFF.reduce((s,row,i)=>s+(ch[i]===j?n[i]*row[j]:0),0));
    const ns=a.map((v,j)=>v<=0?0:(D[j]>0?Math.min(1,v*S/D[j]):1));sig=sig.map((v,j)=>0.5*v+0.5*ns[j]);}
  return {lam:EFF.map((row,i)=>ch[i]<0?0:row[ch[i]]*sig[ch[i]]),choice:ch};}
function inIsland(r,m){const a=r()*6.283,d=Math.sqrt(r())*(m||0.86);return [IX+Math.cos(a)*IRX*d,IY+Math.sin(a)*IRY*d];}
function newRound(sim){const s=sim.st,p=sim.p,r=s.r,a=ISL[p.food],N=s.n.reduce((x,y)=>x+y,0);
  const fo=forage(s.n,a,p.K);s.lam=fo.lam;s.choice=fo.choice;
  const birds=[];s.n.forEach((cnt,b)=>{for(let i=0;i<cnt;i++){const home=inIsland(r,0.8);birds.push({b,home,c:pois(fo.lam[b],r),face:r()<.5?1:-1,pecks:[]});}});
  // food items: one per catch plus spares, placed by food type
  const items=[];const add=(f)=>{const [x,y]=inIsland(r,0.88);items.push({x,y,f,taken:false,jig:r()*6.28});};
  let total=0;birds.forEach(bd=>{total+=Math.min(bd.c,10);});const cap=260;
  birds.forEach(bd=>{const f=fo.choice[bd.b];const k=Math.min(bd.c,10);const times=[];for(let i=0;i<k;i++)times.push(0.08+0.6*r());times.sort((x,y)=>x-y);
    times.forEach(t=>{if(items.length>=cap||f<0)return;const [x,y]=inIsland(r,0.88);const it={x,y,f,taken:false,jig:r()*6.28};
      it.x=lerp(it.x,bd.home[0],0.55);it.y=lerp(it.y,bd.home[1],0.55);items.push(it);bd.pecks.push({t,item:items.length-1});});});
  a.forEach((v,f)=>{const spare=Math.round(v*Math.max(20,60-total/4));for(let i=0;i<spare&&items.length<cap;i++)add(f);});
  s.round={birds,items,N};}
function finishRound(sim){const s=sim.st,p=sim.p,r=s.r,T=p.T;const surv=s.round.birds.filter(b=>b.c>=T).map(b=>b.b);
  const N0=s.round.birds.length;s.lastSurv=N0?surv.length/N0:0;const nn=[0,0,0,0,0];
  if(surv.length){const N=Math.min(p.K,FEC*surv.length);for(let k=0;k<N;k++){let t=surv[Math.floor(r()*surv.length)];if(p.mut&&r()<MUT)t=clamp(t+(r()<.5?-1:1),0,4);nn[t]++;}}
  s.n=nn;s.g++;s.hist.push({g:s.g,f:freqs(s),surv:s.lastSurv,N:nn.reduce((x,y)=>x+y,0)});if(s.hist.length>400)s.hist.shift();}
function freqs(s){const N=s.n.reduce((x,y)=>x+y,0);return s.n.map(v=>N?v/N:0);}
function topBeak(s){const f=freqs(s);let i=0;f.forEach((v,j)=>{if(v>f[i])i=j;});return i;}
function drawBeak(ctx,b,sc){ctx.save();ctx.scale(sc,sc);ctx.lineCap='round';
  if(b===0){ctx.strokeStyle='#8d99a6';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(6,-2);ctx.lineTo(19,-0.4);ctx.moveTo(6,2);ctx.lineTo(19,0.4);ctx.stroke();}
  else if(b===1){ctx.strokeStyle='#a0703c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(5,-2.5);ctx.lineTo(26,-0.6);ctx.moveTo(5,2.5);ctx.lineTo(26,0.6);ctx.stroke();}
  else if(b===2){ctx.strokeStyle='#8d99a6';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(13,0);ctx.stroke();ctx.fillStyle='#b8c1ca';ctx.beginPath();ctx.ellipse(17,0,5.5,4,0,0,6.29);ctx.fill();}
  else if(b===3){ctx.fillStyle='#c9a46a';ctx.fillRect(5,-4,15,3.2);ctx.fillRect(5,0.8,15,3.2);ctx.fillStyle='#7d8a96';ctx.fillRect(9,-1,3,2);}
  else{ctx.fillStyle='#222';ctx.beginPath();ctx.moveTo(6,-4.5);ctx.lineTo(17,-1.5);ctx.lineTo(17,1.5);ctx.lineTo(6,4.5);ctx.closePath();ctx.fill();ctx.strokeStyle='#b8c1ca';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(7,-4);ctx.lineTo(1,-8);ctx.moveTo(7,4);ctx.lineTo(1,8);ctx.stroke();}
  ctx.restore();}
function drawBird(ctx,x,y,b,face,alpha,sc){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(face*(sc||1),(sc||1));
  ctx.fillStyle=BEAKS[b].col;ctx.beginPath();ctx.ellipse(-3,2,10,7,0,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(-11,1);ctx.lineTo(-18,-2);ctx.lineTo(-17,5);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.arc(5,-3,5.5,0,6.29);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(6.5,-4,1.9,0,6.29);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(7,-4,1,0,6.29);ctx.fill();
  ctx.translate(4,-2);drawBeak(ctx,b,1);ctx.restore();}
function drawFood(ctx,f,x,y,j){ctx.save();ctx.translate(x,y);
  if(f===0){ctx.fillStyle='#fbf8f0';ctx.strokeStyle='#bdb3a0';ctx.lineWidth=0.6;ctx.beginPath();ctx.ellipse(0,0,2.6,1.3,j,0,6.29);ctx.fill();ctx.stroke();}
  else if(f===1){ctx.fillStyle='#7a4e2d';ctx.beginPath();ctx.arc(0,0,2.4,0,6.29);ctx.fill();}
  else if(f===2){ctx.strokeStyle='#d9738c';ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-5,0);ctx.quadraticCurveTo(-2,-3+Math.sin(j)*2,0,0);ctx.quadraticCurveTo(2,3,5,0);ctx.stroke();}
  else if(f===3){ctx.fillStyle='#8b5a2b';ctx.beginPath();ctx.ellipse(0,0,5,3.4,j,0,6.29);ctx.fill();ctx.strokeStyle='#5c3a1a';ctx.lineWidth=0.7;ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(3,0);ctx.stroke();}
  else{ctx.fillStyle='#8f9aa5';ctx.beginPath();ctx.arc(0,0,4.6,0,6.29);ctx.fill();ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(-1.5,-1.5,1.4,0,6.29);ctx.fill();}
  ctx.restore();}
const pctOf=(sim,i)=>100*freqs(sim.st)[i];

const BEAK={
  id:'beaks',hash:'beaks',apUnit:7,order:3,tab:'Bird beak lab',kind:'Virtual lab',prereq:['evolution'],
  card:'Birds with tweezer, spoon and clothespin beaks compete for food on an island. Change the food and watch natural selection work.',
  title:'The bird beak lab: natural selection on an island',
  lede:{bio:'Each bird’s beak is a tool. Birds that gather enough food survive and pass their beak type to their chicks. Change the island’s food and watch which beaks take over.',
        honors:'Turn on mutation, change carrying capacity, and see how competition for each food keeps several beak types alive on a mixed island.',
        ap:'Measure survival for each beak type, calculate relative fitness, and connect frequency-dependent competition to the coexistence of specialists.'},
  scale:'A model island like the Galápagos, where Peter and Rosemary Grant measured finch beaks for 40 years. Each generation is one breeding season.',
  timeScale:0.5,dtMax:0.05,prewarm:0,sampleDt:0.25,window:30,unit:'generations',timeLabel:'Generation',chChange:1,chReveal:13,
  clock(sim){return 'Generation '+(sim.st.g+1);},
  controls:[
    {id:'food',label:'Food on the island',type:'seg',def:'mixed',lvl:'bio',options:[{v:'mixed',l:'Mixed'},{v:'small',l:'Small seeds'},{v:'worms',l:'Worms'},{v:'drought',l:'Drought'},{v:'nuts',l:'Hard nuts',lvl:'honors'}],
     help:'Drought leaves only large, hard seeds.'},
    {id:'mut',label:'Mutation',type:'toggle',def:false,lvl:'honors',help:'Each chick has a 4% chance of a slightly different beak'},
    {id:'K',label:'Island carrying capacity',type:'range',min:20,max:60,step:5,def:40,unit:' birds',lvl:'honors'},
    {id:'T',label:'Food needed to survive',type:'range',min:2,max:6,step:1,def:4,unit:' items',lvl:'ap'}
  ],
  actions:[
    {id:'drought',label:'Drought hits',lvl:'bio',run(sim){BioLab.setValues(sim,{food:'drought'});}},
    {id:'rain',label:'Rains return',lvl:'bio',run(sim){BioLab.setValues(sim,{food:'mixed'});}},
    {id:'restock',label:'Restock: 8 birds of each beak',lvl:'honors',run(sim){BioLab.reset(sim);}}
  ],
  init(sim){const s={r:rng((Math.random()*1e9)|0),n:[8,8,8,8,8],g:0,acc:0,hist:[],lastSurv:NaN,lam:[0,0,0,0,0],choice:[],round:null};sim.st=s;
    s.hist.push({g:0,f:freqs(s),surv:NaN,N:40});newRound(sim);return s;},
  step(sim,dt){const s=sim.st;s.acc+=dt;while(s.acc>=1){s.acc-=1;finishRound(sim);newRound(sim);}},
  metrics:[
    ...BEAKS.map((b,i)=>({id:b.id,label:b.name,unit:'% of birds',lvl:'bio',min:0,max:100,d:0,get:s=>pctOf(s,i)})),
    {id:'birds',label:'Birds on the island',unit:'',lvl:'bio',min:0,max:60,d:0,get:s=>s.st.n.reduce((x,y)=>x+y,0)},
    {id:'surv',label:'Survived last round',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>100*s.st.lastSurv},
    {id:'catch',label:'Average catch per bird',unit:'items',lvl:'honors',min:0,max:10,d:1,get:s=>{const N=s.st.n.reduce((x,y)=>x+y,0);return N?s.st.n.reduce((a,v,i)=>a+v*s.st.lam[i],0)/N:0;}},
    {id:'fit',label:'Relative fitness this round (chance to survive ÷ best)',unit:'',lvl:'ap',text:true,get:s=>{const pr=s.st.lam.map(l=>poisCDFge(l,s.p.T)),m=Math.max(...pr);
      return BEAKS.map((b,i)=>b.name+' '+(m>0?(pr[i]/m).toFixed(2):'—')).join(' · ');}}
  ],
  graphs:[{id:'freq',label:'Beak types over generations',custom:true},{id:'surv',label:'Survived each round',lines:['surv']},{id:'birds',label:'Birds on the island',lines:['birds']}],
  defaultGraph:'freq',
  plot(sim,ctx,box){const s=sim.st,win=30,xmax=Math.max(win,s.g),xmin=xmax-win,b2={L:box.L,T:box.T+20,W:box.W,H:box.H-20,cw:box.cw,ch:box.ch};
    const ax=axes(ctx,b2,{xmin,xmax,ymin:0,ymax:100,xl:'Generation',yl:'% of birds'});
    ctx.save();ctx.beginPath();ctx.rect(b2.L,b2.T,b2.W,b2.H+2);ctx.clip();const H=s.hist.filter(h=>h.g>=xmin);
    BEAKS.forEach((b,i)=>{ctx.strokeStyle=b.col;ctx.lineWidth=2.4;ctx.beginPath();H.forEach((h,j)=>{const x=ax.X(h.g),y=ax.Y(100*h.f[i]);j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();});ctx.restore();
    let lx=box.L;ctx.font='12px '+FONT;BEAKS.forEach(b=>{const w=ctx.measureText(b.name).width+30;if(lx+w>box.cw-6)return;ctx.fillStyle=b.col;ctx.fillRect(lx,8,14,4);txt(ctx,b.name,lx+18,14,{s:12,c:PAL['muted'],b:'middle'});lx+=w;});},
  narrate(sim){const s=sim.st,p=sim.p,ph=s.acc,f=freqs(s),ti=topBeak(s),T=p.T,N=s.n.reduce((x,y)=>x+y,0);
    if(!N)return '<b>Every bird starved.</b> No beak type in the population could collect enough of this food. Press Restock to start over.';
    let trend='';if(s.g>=3&&f[ti]>0.6)trend=` <b>${BEAKS[ti].name}</b> beaks now make up ${Math.round(100*f[ti])}% of the birds. No bird’s beak changed; birds with ${BEAKS[ti].name.toLowerCase()} beaks simply survived and raised more chicks.`;
    else if(s.g>=3&&p.food==='mixed'&&f.filter(v=>v>=0.1).length>=3)trend=' With several foods, each beak type has its own food to specialize on, so several types survive side by side.';
    const isl={mixed:'Every food is on the island.',small:'Only small seeds are left: tweezers pick them up fastest.',worms:'Only worms are left: long chopsticks reach them best.',drought:'The drought left only large, hard seeds: strong clothespin and binder-clip beaks crack and grip them.',nuts:'Only hard nuts are left: only a strong binder clip can grab them.'}[p.food];
    if(ph<0.7)return `<b>Feeding round, generation ${s.g+1}.</b> ${isl} Each bird needs at least ${T} items (the dots above it) to survive.`+trend;
    return `<b>Survivors breed.</b> Birds with fewer than ${T} items starve (gray ✕). Survivors raise chicks with the same beak as the parent.`+trend;},
  tour:[
    {title:'The island',text:'Birds live on an island with five kinds of food, from tiny rice grains to hard nuts. Each bird gets one feeding round per generation.',focus:[20,72,600,365],speed:0.3},
    {title:'Five kinds of beaks',text:'Each bird’s beak works like a tool: tweezers, chopsticks, a spoon, a clothespin or a binder clip. Each tool is best at one food.',focus:[632,34,166,206],pause:true},
    {title:'Feeding',text:'Watch the birds hop from item to item. The dots above each bird count what it has collected. It needs at least 4 to survive.',focus:[20,72,600,365],speed:0.25},
    {title:'Survival',text:'Birds that collected fewer than 4 items starve (gray ✕). The survivors breed, and each chick has the same beak as its parent.',focus:[20,72,600,365],speed:0.25},
    {title:'The next generation',text:'Count the beaks again. Types that fed well make up more of the population, while types that struggled shrink. This is natural selection.',focus:[632,34,166,206],speed:0.6},
    {title:'A drought hits',text:'Now only large, hard seeds grow. Tweezers and spoons can barely grip them, while clothespins and binder clips do fine. Watch the population shift over the next few generations.',focus:[20,72,600,365],speed:1.5,setup(sim){BioLab.setValues(sim,{food:'drought'});}},
    {lvl:'honors',title:'Variation has to exist first',text:'Selection can only favor beaks that are already in the population. If a type dies out, it is gone, unless mutation produces it again.',focus:[632,34,166,206],speed:1.5}
  ],
  onTourExit(sim){BioLab.setValues(sim,{food:'mixed'});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'The island’s food changes to only small seeds. Which beak type will become most common?',choices:['Tweezers','Binder clips','They stay evenly mixed'],correct:0,
     change:{food:'small'},changeText:'Only small seeds now',watch:'freq',
     explain:'Tweezers pick up small seeds fastest (about 9 per round), so tweezer birds usually collect enough to survive and pass on their beaks. Over generations they take over. The binder clips mostly starve.'},
    {lvl:'bio',q:'A drought leaves only large, hard seeds. Which birds increase?',choices:['Birds with thin beaks, like tweezers','Birds with big, strong beaks, like clothespins and binder clips','All birds increase equally'],correct:1,
     changeAction:'drought',changeText:'Drought: only large, hard seeds',watch:'freq',
     explain:{bio:'Big, strong beaks can grip and crack hard seeds. Those birds survive the drought and raise chicks, so strong beaks become common.',honors:'This mirrors the Grants’ 1977 drought on Daphne Major: medium ground finches with deeper beaks survived on the remaining large, hard seeds, and the next generation’s average beak depth increased.'}},
    {lvl:'bio',instant:true,q:'During the drought, does any individual bird’s beak change to fit the hard seeds?',choices:['Yes, beaks grow stronger when birds need them','No. Each bird keeps its beak, and the population changes because survivors pass on theirs','Only the young birds’ beaks change'],correct:1,
     explain:'Individuals don’t evolve; populations do. A bird is born with its beak. Selection changes which beaks are common in the next generation, because birds with useful beaks leave more chicks.'},
    {lvl:'honors',q:'On a mixed island with all five foods, what happens to beak variety after many generations?',choices:['One beak type wins everywhere','Several beak types survive side by side','All beak types die out'],correct:1,
     changeText:'Watching a mixed island',watch:'freq',
     explain:'When one beak type gets common, its favorite food gets crowded and runs short, so its members start to struggle. Rare types have their own food mostly to themselves. This competition (frequency-dependent selection) lets specialists coexist, a little like Darwin’s finches.'},
    {lvl:'honors',instant:true,q:'Binder-clip birds died out during a long wet period. Then the island turns to hard nuts. Mutation is off. What happens?',choices:['Binder clips reappear because they are needed','Binder clips can’t come back; selection can only act on beaks already in the population','The other birds’ beaks change into binder clips'],correct:1,
     explain:'Selection works only on existing variation. A trait that has been lost can only return through new mutation or migration. Try it: turn mutation on and watch new beak types slowly appear.'},
    {lvl:'ap',q:'The island switches to only hard nuts. What happens to the share of birds that survive each round?',choices:['It stays the same','It drops sharply, then recovers as binder-clip birds take over','It rises immediately'],correct:1,
     change:{food:'nuts'},changeText:'Only hard nuts now',watch:'surv',
     explain:'Right after the switch, most beaks can’t grab nuts, so survival crashes. Binder-clip birds survive at high rates and fill the island. As the population adapts, average survival climbs back, now limited by competition among binder clips for the nuts.'},
    {lvl:'ap',instant:true,q:'On a small-seed island, 90% of tweezer birds survive a round but only 63% of spoon birds do. What is the relative fitness of spoons (tweezers = 1)?',choices:['0.27','0.70','0.63'],correct:1,
     explain:'Relative fitness w = 0.63 ÷ 0.90 = 0.70. The selection coefficient against spoons is s = 1 − w = 0.30, so spoons leave about 30% fewer surviving offspring per bird than tweezers each generation.'}
  ],
  lab:{bio:'<p><b>Question:</b> Which beak is best for each kind of food?</p><ol><li>Choose an island (small seeds, worms or drought). Press Reset.</li><li>Let it run for 15 generations, then record a trial.</li><li>Repeat for each island.</li></ol><p>For each island, which beak won? Explain using how each beak picks up that food.</p>',
       honors:'<p><b>Question:</b> How does mutation change what happens after an environment change?</p><ol><li>Run a drought for 15 generations with mutation off, then press Rains return and run 15 more. Record the beak percentages.</li><li>Repeat with mutation on.</li></ol><p>Which beak types came back after the rains, and why?</p>',
       ap:'<p><b>Question:</b> Does relative fitness depend on how common a beak is?</p><ol><li>On the mixed island, record the relative fitness tile at generation 0, 5 and 15.</li><li>Do the same on the small-seed island.</li></ol><p><b>Claim–evidence–reasoning:</b> Use your data to explain frequency-dependent selection and why it can maintain variation.</p>'},
  terms:[{t:'Natural selection',d:'Individuals with traits that help them survive and reproduce leave more offspring, so those traits become more common.'},{t:'Adaptation',d:'A heritable trait that helps an organism survive and reproduce in its environment.'},{t:'Variation',d:'Differences among individuals in a population. Selection needs variation to act on.'},
    {lvl:'honors',t:'Carrying capacity',d:'The largest population the island’s food can support.'},{lvl:'honors',t:'Mutation',d:'A random change in DNA that can create a new version of a trait.'},{lvl:'honors',t:'Frequency-dependent selection',d:'A trait’s advantage depends on how common it is. Rare specialists face less competition.'},
    {lvl:'ap',t:'Relative fitness (w)',d:'A type’s survival or reproduction divided by the best type’s. s = 1 − w is the selection coefficient.'},{lvl:'ap',t:'Niche partitioning',d:'Competing species or types specialize on different resources, which lets them coexist.'}],
  about:'<p>Each beak type has a catch rate for each food (items per feeding round when food is plentiful), ranging from 0.5 (tweezers on hard nuts) to 9 (each beak on its specialty). Each beak type forages on the food that pays it best, given how crowded that food is. Food per round is 5 items per bird of carrying capacity, split among foods by the island’s mix. When demand on a food exceeds supply, every bird feeding on it gets the same share.</p><p>A bird’s catch is a Poisson random number around its expected rate. Birds that collect at least the survival threshold live, and each survivor raises up to 3 chicks until the island is full. Chicks inherit the parent’s beak, with a 4% chance of a neighboring beak type when mutation is on.</p><p>Real beaks vary continuously and are partly heritable. The tool beaks are the classroom lab’s simplification of that.</p>',
  draw(sim,ctx,vdt,k,t){const s=sim.st,p=sim.p,ph=s.acc,R=s.round,T=p.T,hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-water'];ctx.fillRect(0,0,800,450);
    // island
    ctx.fillStyle='#d4bd84';ctx.beginPath();ctx.ellipse(IX,IY+6,IRX+8,IRY+8,0,0,6.29);ctx.fill();ctx.fillStyle='#e8d5a3';ctx.beginPath();ctx.ellipse(IX,IY,IRX,IRY,0,0,6.29);ctx.fill();
    const gr=rng(9);ctx.strokeStyle=p.food==='drought'?'#b59a55':'#7f9a4c';ctx.lineWidth=1.4;for(let i=0;i<40;i++){const [x,y]=inIsland(gr,0.95);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y-7);ctx.moveTo(x,y);ctx.lineTo(x+2,y-8);ctx.stroke();}
    txt(ctx,'Generation '+(s.g+1)+' · '+(ph<0.7?'feeding round':'survivors breed'),16,26,{s:14*k,w:700});
    txt(ctx,ISLNAME[p.food],16,46,{s:12.5*k,c:PAL['cv-soft']});
    if(!R)return;
    // food items (taken ones disappear at peck time)
    const taken=new Set();R.birds.forEach(bd=>bd.pecks.forEach(pk=>{if(pk.t<=ph)taken.add(pk.item);}));
    R.items.forEach((it,i)=>{if(!taken.has(i))drawFood(ctx,it.f,it.x,it.y,it.jig);});
    // birds
    const judge=ph>=0.7,breed=ph>=0.85;
    R.birds.forEach(bd=>{let x=bd.home[0],y=bd.home[1],face=bd.face,got=0,hop=0;
      for(let i=0;i<bd.pecks.length;i++){const pk=bd.pecks[i],it=R.items[pk.item];if(!it)continue;const prev=i?R.items[bd.pecks[i-1].item]:{x:bd.home[0],y:bd.home[1]};const t0=i?bd.pecks[i-1].t:0.05;
        if(ph>=pk.t){x=it.x;y=it.y;got=i+1;continue;}if(ph>t0){const u=clamp((ph-t0)/Math.max(0.01,pk.t-t0),0,1);x=lerp(prev.x,it.x,u);y=lerp(prev.y,it.y,u)-Math.sin(u*Math.PI)*6;face=it.x>=prev.x?1:-1;hop=1;}break;}
      if(bd.pecks.length&&ph>=bd.pecks[bd.pecks.length-1].t){got=Math.min(bd.c,10);}
      if(ph>=0.7)got=bd.c;
      const alive=bd.c>=T,dead=judge&&!alive;const alpha=dead?(breed?0.15:0.45):1;
      drawBird(ctx,x,y-6,bd.b,face,alpha,1);
      // food counter dots
      const need=T;for(let d=0;d<Math.max(need,Math.min(got,8));d++){ctx.fillStyle=d<got?(got>=need?'#1b8a4a':'#c27a00'):'rgba(0,0,0,.18)';ctx.beginPath();ctx.arc(x-((Math.max(need,Math.min(got,8))-1)*4.5)/2+d*4.5,y-24,1.9,0,6.29);ctx.fill();}
      if(dead){ctx.strokeStyle='#d32f2f';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(x-5,y-11);ctx.lineTo(x+5,y-1);ctx.moveTo(x+5,y-11);ctx.lineTo(x-5,y-1);ctx.stroke();}});
    if(!R.birds.length)pill(ctx,'No birds left',IX,IY,'#d32f2f','#fff',13*k);
    // side panel: beak types
    ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.94;rr(ctx,636,38,158,198,10);ctx.fill();ctx.globalAlpha=1;
    const compact=k>1.35;txt(ctx,compact?'Beaks':'Beak types',646,56,{s:12.5*k,w:700,c:PAL['cv-ink']});const N=s.n.reduce((x,y)=>x+y,0);
    BEAKS.forEach((b,i)=>{const y=80+i*34;drawBird(ctx,658,y,i,1,1,0.85);if(!compact)txt(ctx,b.name,684,y-3,{s:12*k,w:600,c:PAL['cv-ink']});
      const w=96*(N?s.n[i]/N:0);ctx.fillStyle=PAL['line'];ctx.fillRect(684,y+5,96,5);ctx.fillStyle=b.col;ctx.fillRect(684,y+5,w,5);txt(ctx,String(s.n[i]),786,compact?y+1:y-3,{s:12*k,w:700,c:PAL['cv-ink'],a:'right'});});
    // food legend
    ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.94;rr(ctx,636,244,158,174,10);ctx.fill();ctx.globalAlpha=1;txt(ctx,compact?'Food':'Food here',646,262,{s:12.5*k,w:700,c:PAL['cv-ink']});
    const a=ISL[p.food];let fy=284;FOODS.forEach((f,j)=>{const on=a[j]>0;ctx.globalAlpha=on?1:0.35;drawFood(ctx,j,656,fy-4,0.4);txt(ctx,compact?(on?Math.round(a[j]*100)+'%':'—'):f.name+(on&&a[j]<1?' ('+Math.round(a[j]*100)+'%)':''),672,fy,{s:12*k,c:PAL['cv-ink']});ctx.globalAlpha=1;fy+=26;});
    txt(ctx,compact?'Dots: food eaten (needs '+T+')':'Dots above a bird: items eaten (needs '+T+')',16,440,{s:12*k,c:PAL['cv-soft']});},
  thumbFrames:60
};
BioLab.register(BEAK);
})();
