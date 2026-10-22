(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;

/* Build and break polymers one bond at a time. Each join releases one H2O (dehydration
   synthesis); each split consumes one H2O (hydrolysis). Counts change at the moment the bond
   forms or breaks in the animation. */
const TYPES={
  glucose:{label:'Glucose',name:'glucose',poly:'Starch',M:180.16,bond:'glycosidic bond',enzyme:'Amylase',abbr:'Glc',color:'#b9790f'},
  amino:{label:'Amino acid',name:'amino acid',poly:'Polypeptide (protein)',M:89.09,bond:'peptide bond',enzyme:'Protease',abbr:'Ala',color:'#3f6fb0'},
  nucleotide:{label:'Nucleotide',name:'nucleotide',poly:'DNA strand',M:331.22,bond:'phosphodiester bond',enzyme:'Nuclease',abbr:'A',color:'#7a4fa6'}
};
const MAXU=13,SLOTW=56,CHX=44,CHY=318;
const slotX=i=>CHX+i*SLOTW+SLOTW/2;
const poolPos=(i,t)=>[60+(i%6)*72,100+Math.floor(i/6)*62+(RM?0:Math.sin(t*1.3+i*1.7)*3)];
const waterPos=(i,t)=>[522+(i%7)*37,82+Math.floor(i/7)*30+(RM?0:Math.sin(t*1.1+i)*2)];
const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);

function drawWater(ctx,x,y,s){s=s||1;ctx.fillStyle='#f2f2f2';ctx.strokeStyle='#8a8a90';ctx.lineWidth=1;
  for(const a of [-2.2,-0.94]){ctx.beginPath();ctx.arc(x+Math.cos(a)*8*s,y+Math.sin(a)*8*s,3.6*s,0,6.29);ctx.fill();ctx.stroke();}
  ctx.fillStyle='#d64545';ctx.beginPath();ctx.arc(x,y,6*s,0,6.29);ctx.fill();}
function drawOH(ctx,x,y,glow){if(glow){ctx.fillStyle='rgba(255,210,63,.55)';ctx.beginPath();ctx.arc(x+3,y,12,0,6.29);ctx.fill();}
  ctx.fillStyle='#d64545';ctx.beginPath();ctx.arc(x,y,5.5,0,6.29);ctx.fill();ctx.fillStyle='#f2f2f2';ctx.strokeStyle='#8a8a90';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x+8,y-2,3.4,0,6.29);ctx.fill();ctx.stroke();}
function drawH(ctx,x,y,glow){if(glow){ctx.fillStyle='rgba(255,210,63,.55)';ctx.beginPath();ctx.arc(x,y,10,0,6.29);ctx.fill();}
  ctx.fillStyle='#f2f2f2';ctx.strokeStyle='#8a8a90';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,3.6,0,6.29);ctx.fill();ctx.stroke();}
const BASES=['A','T','G','C'],BASEC={A:'#d9534f',T:'#e0a100',G:'#2e8b57',C:'#2d6bd2'};
/* one monomer body centred at x,y; caps = which reactive ends to show */
function drawMono(ctx,type,x,y,k,caps,idx,glow){const T=TYPES[type];
  if(type==='glucose'){ctx.fillStyle=T.color;ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3;const px=x+Math.cos(a)*19,py=y+Math.sin(a)*19;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();
    txt(ctx,T.abbr,x,y+1,{s:11*Math.min(k,1.3),w:700,c:'#fff',a:'center',b:'middle'});}
  else if(type==='amino'){ctx.fillStyle='#8a8a90';ctx.beginPath();ctx.arc(x,y-20,7,0,6.29);ctx.fill();ctx.fillStyle=T.color;rr(ctx,x-19,y-13,38,26,7);ctx.fill();
    txt(ctx,T.abbr,x,y+1,{s:11*Math.min(k,1.3),w:700,c:'#fff',a:'center',b:'middle'});}
  else{const b=BASES[(idx||0)%4];ctx.fillStyle=BASEC[b];rr(ctx,x-9,y-34,18,20,4);ctx.fill();txt(ctx,b,x,y-23,{s:11*Math.min(k,1.3),w:800,c:'#fff',a:'center',b:'middle'});
    ctx.fillStyle=T.color;ctx.beginPath();for(let i=0;i<5;i++){const a=-Math.PI/2+i*2*Math.PI/5;const px=x+Math.cos(a)*16,py=y+4+Math.sin(a)*16;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();
    ctx.fillStyle='#e0a100';ctx.beginPath();ctx.arc(x-18,y+10,7,0,6.29);ctx.fill();txt(ctx,'P',x-18,y+11,{s:9,w:800,c:'#fff',a:'center',b:'middle'});}
  if(caps&&caps.l)drawH(ctx,x-(type==='nucleotide'?29:25),y+(type==='nucleotide'?10:0),glow&&glow.l);
  if(caps&&caps.r)drawOH(ctx,x+21,y+(type==='nucleotide'?10:0),glow&&glow.r);}

const MACRO={
  id:'macromolecules',hash:'macromolecules',apUnit:1,order:2,kind:'Simulation',tab:'Build a macromolecule',
  card:'Snap monomers into a chain and watch a water molecule leave with every bond, then split it back apart.',
  title:'Building macromolecules: dehydration synthesis and hydrolysis',
  lede:{bio:'Living things build big molecules by linking small ones. Each link releases a water molecule, and breaking a link takes one back.',
        honors:'Compare how sugars, amino acids and nucleotides form polymers. The bonds differ, but every one forms by dehydration synthesis and breaks by hydrolysis.',
        ap:'Track the molecular bookkeeping: bonds, waters and the polymer’s molar mass, n × M − (n − 1) × 18.02 g/mol.'},
  scale:{bio:'Molecular view: one glucose ring is about 1 nanometer across. A single starch molecule can hold thousands of glucose units.',
         ap:'Molecular view: a glucose ring is about 1 nm across; a peptide bond is about 0.13 nm long. Real polymers hold hundreds to millions of monomers.'},
  timeless:true,animated:true,
  controls:[
    {id:'mono',label:'Monomer',type:'seg',def:'glucose',lvl:'bio',options:[{v:'glucose',l:'Glucose'},{v:'amino',l:'Amino acid',lvl:'honors'},{v:'nucleotide',l:'Nucleotide',lvl:'ap'}],onChange(sim){BioLab.reset(sim);}},
    {id:'start',label:'Starting monomers',type:'range',min:2,max:12,step:1,def:6,unit:'',lvl:'bio',onChange(sim){BioLab.reset(sim);}},
    {id:'startAs',label:'Start with',type:'seg',def:'sep',lvl:'bio',options:[{v:'sep',l:'Separate monomers'},{v:'chain',l:'One chain'}],onChange(sim){BioLab.reset(sim);}},
    {id:'enzyme',label:'Digestive enzyme',help:'Breaks bonds by hydrolysis, one at a time',type:'toggle',def:false,lvl:'honors'}
  ],
  actions:[
    {id:'join',label:'Join (dehydration)',primary:true,run(sim){sim.st.q.push('join');}},
    {id:'split',label:'Split (hydrolysis)',run(sim){sim.st.q.push('split');}},
    {id:'add',label:'Add a monomer',run(sim){const s=sim.st;if(s.free+s.len<MAXU&&s.free<12)s.free++;}},
    {id:'joinall',label:'Join all',run(sim){const s=sim.st;const pend=s.q.filter(x=>x==='join').length;let n=(s.len===0?s.free-1:s.free)-pend;for(let i=0;i<n;i++)s.q.push('join');}},
    {id:'splitall',label:'Split all',run(sim){const s=sim.st;const pend=s.q.filter(x=>x==='split').length;let n=s.len-1-pend;for(let i=0;i<n;i++)s.q.push('split');}}
  ],
  init(sim){const n=sim.p.start;return sim.p.startAs==='chain'?{free:0,len:n,wout:0,win:0,q:[],ev:null,et:0}:{free:n,len:0,wout:0,win:0,q:[],ev:null,et:0};},
  step(sim,dt){const s=sim.st,p=sim.p;
    if(p.enzyme&&atLeast('honors')&&s.len>=2&&!s.ev&&!s.q.length){s.et+=dt;if(s.et>=1.4){s.et=0;s.q.push('esplit');}}
    while(!s.ev&&s.q.length){const type=s.q.shift(),fast=s.q.length>0;
      if(type==='join'){if(s.free>=1&&(s.len>=1||s.free>=2)&&s.len<MAXU){if(s.len===0){s.free--;s.len=1;}s.ev={type:'join',p:0,dur:fast?0.55:2.4,mid:0.6,done:false,from:s.free-1};}}
      else{if(s.len>=2)s.ev={type:'split',p:0,dur:fast?0.55:(type==='esplit'?1.3:2.4),mid:0.5,done:false,enz:type==='esplit'};}}
    if(s.ev){const e=s.ev;e.p+=dt/e.dur;
      if(!e.done&&e.p>=e.mid){e.done=true;
        if(e.type==='join'){s.free--;s.len++;s.wout++;}
        else{s.len--;s.free++;s.win++;if(s.len===1&&!s.q.some(x=>x!=='join')){/* last unit is just a monomer now */}}}
      if(e.p>=1){s.ev=null;if(e.type==='split'&&s.len===1){s.len=0;s.free++;}}}},
  metrics:[
    {id:'free',label:'Free monomers',unit:'',lvl:'bio',min:0,max:12,d:0,get:s=>s.st.free},
    {id:'len',label:'Chain length',unit:'units',lvl:'bio',min:0,max:13,d:0,get:s=>s.st.len},
    {id:'bonds',label:'Bonds in the chain',unit:'',lvl:'bio',min:0,max:12,d:0,get:s=>Math.max(0,s.st.len-1)},
    {id:'wout',label:'Water released',unit:'molecules',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.wout},
    {id:'win',label:'Water used',unit:'molecules',lvl:'bio',min:0,max:null,d:0,get:s=>s.st.win},
    {id:'poly',label:'Polymer',unit:'',lvl:'honors',text:true,get:s=>s.st.len<2?'None yet':TYPES[s.p.mono].poly+', '+s.st.len+' units'},
    {id:'mass',label:'Chain mass',unit:'g/mol',lvl:'ap',min:0,max:null,d:1,get:s=>{const n=s.st.len,M=TYPES[s.p.mono].M;return n?n*M-(n-1)*18.02:0;}}
  ],
  defaultGraph:'wout',
  narrate(sim){const s=sim.st,T=TYPES[sim.p.mono],hon=atLeast('honors'),ap=atLeast('ap'),e=s.ev;
    if(e&&e.type==='join')return '<b>Dehydration synthesis.</b> The –OH on one '+T.name+' and an –H on the next leave together as one water molecule (H₂O). '+(hon?'A '+T.bond+' now links them.':'A new bond now links them.');
    if(e&&e.type==='split')return '<b>Hydrolysis'+(e.enz?' by '+T.enzyme.toLowerCase():'')+'.</b> A water molecule is split: its –H goes to one '+T.name+' and its –OH to the other, breaking the '+(hon?T.bond:'bond')+'.';
    if(s.len>=2)return 'The chain has <b>'+s.len+' units held by '+(s.len-1)+' bonds</b>, so building it released '+(s.len-1)+' water molecules.'+(ap?' Mass: '+s.len+' × '+T.M+' − '+(s.len-1)+' × 18.02 = '+(s.len*T.M-(s.len-1)*18.02).toFixed(1)+' g/mol.':'');
    return 'These are separate '+T.name+' monomers. Each has an –H on one end and an –OH on the other. Press <b>Join</b> to link two of them.';},
  tour:[
    {title:'Monomers: the building blocks',text:{bio:'Each shape is one <b>monomer</b>, a small building-block molecule. Here they are glucose, a sugar. Linked together, they make a <b>polymer</b> such as starch.',honors:'Each shape is a monomer. Sugars build polysaccharides, amino acids build proteins, and nucleotides build DNA and RNA.'},focus:[20,50,450,150],speed:0.25},
    {title:'Reactive ends',text:'Every monomer has an –H (white) on its left end and an –OH (red O with white H) on its right end. These are where bonds form.',focus:[22,72,84,58],speed:0.25},
    {title:'Dehydration synthesis',text:'Watch one join, slowed down. The –OH from one monomer and the –H from the other glow, then leave together as H₂O. “De-hydration” means water is removed.',focus:[[20,50,450,150],[20,240,760,150]],speed:0.35,setup(sim){sim.st.q.push('join');}},
    {title:'Where the water goes',text:'Each new bond adds one more water molecule to the solution. Watch the water box fill as the chain grows.',focus:[500,50,280,150],speed:0.6,setup(sim){sim.st.q.push('join');}},
    {title:'Building the chain',text:'Joining all 6 monomers makes a chain of 6 units with 5 bonds, so 5 waters are released. A chain of n monomers always has n − 1 bonds.',focus:[20,240,760,150],speed:1,setup(sim){BioLab.reset(sim);const n=sim.st.free-1;for(let i=0;i<n;i++)sim.st.q.push('join');}},
    {title:'Hydrolysis: splitting with water',text:'Now the reverse. A water molecule flies in and splits: –H to one monomer, –OH to the other. The bond breaks. “Hydro-lysis” means splitting with water.',focus:[[20,240,760,150],[500,50,280,150]],speed:0.35,setup(sim){sim.st.q.push('split');}},
    {lvl:'honors',title:'Enzymes do this in digestion',text:'Your digestive enzymes, such as amylase in saliva, break food polymers by hydrolysis, one bond at a time, so the monomers can be absorbed.',focus:[20,240,760,150],speed:0.6,setup(sim){BioLab.setValues(sim,{enzyme:true});}},
    {lvl:'ap',title:'Keeping the books',text:'A polymer of n monomers weighs n × M minus (n − 1) waters × 18.02 g/mol. Watch the Chain mass readout as you join and split.',focus:[0,0,800,450],pause:true,setup(sim){BioLab.setValues(sim,{enzyme:false});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{enzyme:false});BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'You join 10 glucose molecules into one chain. How many water molecules are released?',
     choices:['10','9','0','11'],correct:1,baseline:{start:10},changeAction:'joinall',changeText:'Joining all 10',watch:'wout',at:0.3,reveal:7,
     explain:'A chain of 10 has 9 bonds between neighbors, and each bond released one H₂O. Check the readouts: chain length 10, water released 9.'},
    {lvl:'bio',q:'You split a 6-glucose starch chain back into single glucose. What happens to water?',
     choices:['Water is released','Water is used up','No water is involved'],correct:1,baseline:{start:6,startAs:'chain'},changeAction:'splitall',changeText:'Splitting every bond',watch:'win',at:0.3,reveal:5,
     explain:'Hydrolysis is the reverse of dehydration synthesis. Each of the 5 bonds needs one water molecule to break it, so 5 waters are used up.'},
    {lvl:'honors',q:'Two amino acids join with a peptide bond. Which atoms leave as water?',
     choices:['The –OH from one amino acid’s carboxyl group and an –H from the other’s amino group','Two –H atoms from the amino groups','Nothing leaves; the amino acids just stick together'],correct:0,instant:true,
     explain:'The carboxyl group (–COOH) of one amino acid gives up –OH, and the amino group (–NH₂) of the next gives up –H. They leave as H₂O, and C bonds to N: a peptide bond.'},
    {lvl:'honors',q:'You add a digestive enzyme to an 8-unit starch chain. What happens over time?',
     choices:['The chain grows longer','The chain breaks down, one bond at a time, using water','Nothing; enzymes only build molecules'],correct:1,
     baseline:{start:8,startAs:'chain'},change:{enzyme:true},changeText:'Enzyme added',watch:'len',at:0.3,reveal:8,
     explain:{honors:'Digestive enzymes catalyze hydrolysis. Amylase breaks starch into sugars your intestine can absorb, using up one water per bond broken.'}},
    {lvl:'ap',q:'What is the molar mass of a chain of 5 glucose units (glucose = 180.16 g/mol)?',
     choices:['900.8 g/mol (5 × 180.16)','828.7 g/mol','810.7 g/mol'],correct:1,baseline:{start:5},changeAction:'joinall',changeText:'Joining 5 glucose',watch:'mass',at:0.3,reveal:5,
     explain:{ap:'5 × 180.16 = 900.8, minus 4 waters lost (4 × 18.02 = 72.1), gives 828.7 g/mol. There are n − 1 bonds, not n.'}},
    {lvl:'ap',q:'Four nucleotides join into a DNA strand. How many water molecules are released?',
     choices:['4','3','8'],correct:1,instant:true,
     explain:'Each phosphodiester bond links the 3′ –OH of one sugar to the phosphate of the next and releases one water. Four nucleotides make 3 bonds, so 3 waters.'}
  ],
  lab:{bio:'<p><b>Question:</b> How does chain length relate to the number of water molecules released?</p><ol><li>Set starting monomers to 2, press <b>Join all</b>, and record a trial.</li><li>Repeat with 3, 4, 6, 8 and 10 monomers.</li><li>Plot chain length (x) against water released (y).</li></ol><p>Write a rule that predicts the water released for any chain length.</p>',
       honors:'<p><b>Question:</b> Does the type of monomer change the water bookkeeping?</p><ol><li>Build a 6-unit chain from glucose, then from amino acids. Record each.</li><li>Then start with a 6-unit chain, turn on the enzyme, and record once it is fully broken down.</li></ol><p>Compare dehydration synthesis and hydrolysis in one sentence each.</p>',
       ap:'<p><b>Question:</b> Can you predict a polymer’s molar mass?</p><ol><li>Predict the mass of 3-, 6- and 10-unit chains for each monomer type.</li><li>Build each chain and record the Chain mass readout to check.</li></ol><p><b>Claim–evidence–reasoning:</b> Derive and justify the formula for polymer mass from your data.</p>'},
  terms:[{t:'Monomer',d:'A small building-block molecule, such as glucose or an amino acid.'},{t:'Polymer',d:'A large molecule made of many monomers linked together.'},{t:'Dehydration synthesis',d:'Joining two monomers by removing a water molecule.'},{t:'Hydrolysis',d:'Breaking a bond by adding a water molecule.'},
    {lvl:'honors',t:'Glycosidic bond',d:'The bond between two sugars.'},{lvl:'honors',t:'Peptide bond',d:'The bond between two amino acids, from the carboxyl C to the amino N.'},{lvl:'honors',t:'Polysaccharide',d:'A sugar polymer, such as starch, glycogen or cellulose.'},
    {lvl:'ap',t:'Phosphodiester bond',d:'Links the 3′ carbon of one nucleotide’s sugar to the 5′ phosphate of the next.'},{lvl:'ap',t:'Directionality',d:'Polymers have distinct ends (N- and C-terminus for proteins, 5′ and 3′ for DNA), because each bond joins different groups.'}],
  about:'<p>Each Join removes one free monomer and adds it to the chain, releasing one H₂O. Each Split does the reverse and uses one H₂O. Chain mass = n × M − (n − 1) × 18.02 g/mol, with glucose 180.16, alanine 89.09 and dAMP 331.22 g/mol.</p><p>Simplified: every reactive end is shown as –H on the left and –OH on the right. In real molecules the groups are specific: C1–OH and C4–OH on glucose, –NH₂ and –COOH on amino acids, 3′–OH and 5′ phosphate on nucleotides. Cells use enzymes and energy from ATP to build polymers; here the joins simply happen when you press the button.</p>',
  initVis(sim){sim.vis.seed=rng(9);},
  draw(sim,ctx,vdt,k,t){
    const s=sim.st,p=sim.p,T=TYPES[p.mono],e=s.ev,hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // regions
    ctx.fillStyle=PAL['cv-bg2'];rr(ctx,20,50,452,150,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle=PAL['cv-water'];rr(ctx,500,50,280,150,12);ctx.fill();ctx.stroke();
    ctx.fillStyle=PAL['cv-bg2'];rr(ctx,20,240,760,150,12);ctx.fill();ctx.stroke();
    txt(ctx,'Free '+T.name+' monomers',30,44,{s:12.5*k,w:700,c:PAL['cv-soft']});
    txt(ctx,'Water molecules',510,44,{s:12.5*k,w:700,c:PAL['cv-soft']});
    txt(ctx,s.len>=2?(hon?T.poly:'Polymer chain')+' · '+s.len+' units':'Chain (empty until you join)',30,234,{s:12.5*k,w:700,c:PAL['cv-soft']});
    // water box
    let nW=6+s.wout-s.win;if(e&&e.type==='join'&&e.done)nW--;if(e&&e.type==='split'&&!e.done)nW--;nW=clamp(nW,0,28);
    for(let i=0;i<nW;i++){const q=waterPos(i,t);drawWater(ctx,q[0],q[1]);}
    // pool
    let nP=s.free;if(e&&e.type==='join'&&!e.done)nP--;if(e&&e.type==='split'&&e.done)nP--;nP=clamp(nP,0,12);
    for(let i=0;i<nP;i++){const q=poolPos(i,t);drawMono(ctx,p.mono,q[0],q[1],k,{l:true,r:true},i+7);}
    // chain
    let L=s.len;const off=0;
    for(let i=0;i<L;i++){const x=slotX(i);
      if(i<L-1){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+18,CHY+(p.mono==='nucleotide'?10:0));ctx.lineTo(x+SLOTW-18,CHY+(p.mono==='nucleotide'?10:0));ctx.stroke();
        if(p.mono!=='amino'){ctx.fillStyle='#d64545';ctx.beginPath();ctx.arc(x+SLOTW/2,CHY+(p.mono==='nucleotide'?10:0),4.5,0,6.29);ctx.fill();}}
      const glowR=e&&e.type==='join'&&!e.done&&i===L-1&&e.p>0.42;
      const splitting=e&&e.type==='split'&&!e.done&&i===L-1;
      drawMono(ctx,p.mono,x,CHY,k,{l:i===0,r:i===L-1&&!splitting||(i===L-2&&splitting&&false)},i,{r:glowR});}
    if(hon&&L>=2)txt(ctx,T.bond,slotX(0)+SLOTW/2,CHY+44,{s:12*k,w:600,a:'center',c:PAL['cv-soft']});
    // join animation
    if(e&&e.type==='join'){const tx=slotX(e.done?s.len-1:s.len),from=poolPos(clamp(nP,0,11),t);
      if(!e.done){const f=ease(e.p/0.45),x=lerp(from[0],tx,f),y=lerp(from[1],CHY,f);drawMono(ctx,p.mono,x,y,k,{l:true,r:true},s.len,{l:e.p>0.42});}
      else{const f=ease((e.p-e.mid)/(1-e.mid)),bx=slotX(s.len-1)-SLOTW/2,dest=waterPos(clamp(nW,0,27),t);
        drawWater(ctx,lerp(bx,dest[0],f),lerp(CHY-6,dest[1],f),1.25-0.25*f);
        if(e.p<e.mid+0.15){pill(ctx,'+ H₂O',bx,CHY-40,'#2d6bd2','#fff',12*k);}}}
    // split animation
    if(e&&e.type==='split'){const bx=slotX(s.len-(e.done?1:2))+SLOTW/2;
      if(!e.done){const f=ease(e.p/e.mid),src=waterPos(clamp(nW,0,27),t);drawWater(ctx,lerp(src[0],bx,f),lerp(src[1],CHY-6,f),1+0.25*f);
        if(e.enz){ctx.fillStyle=PAL['cv-enz'];ctx.beginPath();ctx.moveTo(bx,CHY+38);ctx.arc(bx,CHY+52,22,-1.2,4.3);ctx.closePath();ctx.fill();if(hon)txt(ctx,T.enzyme,bx,CHY+90,{s:12*k,w:700,a:'center',c:PAL['cv-enz']});}}
      else{const f=ease((e.p-e.mid)/(1-e.mid)),dest=poolPos(clamp(nP,0,11),t),x0=slotX(s.len);
        drawMono(ctx,p.mono,lerp(x0,dest[0],f),lerp(CHY,dest[1],f),k,{l:true,r:true},s.len,{l:f<0.4});
        drawOH(ctx,slotX(s.len-1)+21,CHY+(p.mono==='nucleotide'?10:0),f<0.4);}}
    // legend
    const ly=432;let lx=24;const lab=t2=>{txt(ctx,t2,lx,ly,{s:12*k,c:PAL['cv-soft']});ctx.font='400 '+12*k+'px '+FONT;lx+=ctx.measureText(t2).width+20;};
    drawH(ctx,lx+4,ly-4);lx+=14;lab('–H end');drawOH(ctx,lx+4,ly-4);lx+=18;lab('–OH end');drawWater(ctx,lx+6,ly-2,0.9);lx+=18;lab('water (H₂O)');
  }
};
BioLab.register(MACRO);
})();
