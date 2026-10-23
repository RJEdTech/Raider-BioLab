(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;

/* 2D lattice protein (HP model with charges). Monte Carlo (Metropolis) folding in water.
   20-residue mini-protein; its hydrophobic pattern is the classic 20-mer HP benchmark. */
const TYPES={Met:'H',Leu:'H',Val:'H',Ile:'H',Phe:'H',Ala:'H',Trp:'H',Ser:'P',Thr:'P',Asn:'P',Gln:'P',Gly:'P',Tyr:'P',Lys:'+',Arg:'+',Glu:'-',Asp:'-'};
const ONE={Met:'M',Leu:'L',Val:'V',Ile:'I',Phe:'F',Ala:'A',Trp:'W',Ser:'S',Thr:'T',Asn:'N',Gln:'Q',Gly:'G',Tyr:'Y',Lys:'K',Arg:'R',Glu:'E',Asp:'D'};
const WT=['Met','Lys','Leu','Ser','Glu','Val','Ile','Asn','Phe','Asp','Arg','Leu','Thr','Ala','Val','Glu','Lys','Ile','Gln','Leu'];
const N=WT.length,SICKLE=4; // residue 5 (index 4) is a surface Glu
const NATIVE=[[0,0],[0,-1],[1,-1],[1,-2],[2,-2],[2,-1],[3,-1],[3,0],[3,1],[3,2],[2,2],[2,1],[2,0],[1,0],[1,1],[1,2],[0,2],[0,1],[-1,1],[-1,0]];
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const key=(x,y)=>x*1000+y;
const TCOL={H:'#d9962b',P:'#2f9a62','+':'#3f6fd6','-':'#d64545'};
function contactsOf(pos){const m=new Map();pos.forEach((p,i)=>m.set(key(p[0],p[1]),i));const out=[];
  for(let i=0;i<pos.length;i++)for(const d of DIRS){const j=m.get(key(pos[i][0]+d[0],pos[i][1]+d[1]));if(j!==undefined&&j>i+1)out.push([i,j]);}return out;}
const NATIVE_C=contactsOf(NATIVE).map(([i,j])=>i*100+j);
const charges=ph=>({fm:1/(1+Math.pow(10,4.0-ph)),fp:1/(1+Math.pow(10,ph-10.5))});
function energy(pos,types,ph,out){const m=new Map();pos.forEach((p,i)=>m.set(key(p[0],p[1]),i));const {fm,fp}=charges(ph);
  let E=0,hh=0,ion=0,other=0,expH=0,possH=0;
  for(let i=0;i<pos.length;i++){const ti=types[i];if(ti==='H')possH+=(i===0||i===pos.length-1)?3:2;
    for(const d of DIRS){const j=m.get(key(pos[i][0]+d[0],pos[i][1]+d[1]));
      if(j===undefined){if(ti==='H')expH++;continue;}
      if(j<=i+1)continue;const tj=types[j];
      if(ti==='H'&&tj==='H'){E-=1;hh++;}
      else if((ti==='+'&&tj==='-')||(ti==='-'&&tj==='+')){const w=fm*fp;E-=0.6*w;ion+=w;}
      else if(ti===tj&&(ti==='+'||ti==='-')){const w=ti==='+'?fp*fp:fm*fm;E+=0.5*w;}
      else other++;}}
  if(out){out.hh=hh;out.ion=ion;out.other=other;out.expH=expH;out.possH=possH;}return E;}
function selfAvoid(pos){const s=new Set();for(const p of pos){const k=key(p[0],p[1]);if(s.has(k))return false;s.add(k);}return true;}
function propose(pos,r){const n=pos.length,i=Math.floor(r()*n),np=pos.map(p=>p.slice());
  if(r()<0.5){const rot=[[0,-1,1,0],[-1,0,0,-1],[0,1,-1,0]][Math.floor(r()*3)],c=pos[i],tail=r()<0.5;
    for(let j=0;j<n;j++){if(tail?j<=i:j>=i)continue;const dx=pos[j][0]-c[0],dy=pos[j][1]-c[1];np[j]=[c[0]+rot[0]*dx+rot[1]*dy,c[1]+rot[2]*dx+rot[3]*dy];}}
  else if(i===0||i===n-1){const nb=pos[i===0?1:n-2],d=DIRS[Math.floor(r()*4)];np[i]=[nb[0]+d[0],nb[1]+d[1]];}
  else{const a=pos[i-1],b=pos[i+1];if(Math.abs(a[0]-b[0])===1&&Math.abs(a[1]-b[1])===1)np[i]=[a[0]+b[0]-pos[i][0],a[1]+b[1]-pos[i][1]];else return null;}
  return selfAvoid(np)?np:null;}
const tempMC=c=>0.15+(c-20)/80*1.0;
function types(st){return st.seq.map(n=>TYPES[n]);}
function measure(sim){const st=sim.st,o={};st.E=energy(st.pos,types(st),sim.p.ph,o);st.m=o;
  const cs=contactsOf(st.pos).map(([i,j])=>i*100+j),set=new Set(cs);st.fold=NATIVE_C.filter(c=>set.has(c)).length/NATIVE_C.length;
  let cx=0,cy=0;st.pos.forEach(p=>{cx+=p[0];cy+=p[1];});cx/=N;cy/=N;let g=0;st.pos.forEach(p=>{g+=(p[0]-cx)**2+(p[1]-cy)**2;});st.rg=Math.sqrt(g/N);
  // sticky patch: a mutated hydrophobic residue facing water
  const m=new Set(st.pos.map(p=>key(p[0],p[1])));st.patch=0;
  st.seq.forEach((n,i)=>{if(n!==WT[i]&&TYPES[n]==='H'&&TYPES[WT[i]]!=='H'){for(const d of DIRS)if(!m.has(key(st.pos[i][0]+d[0],st.pos[i][1]+d[1])))st.patch++;}});}

const SIM={
  id:'protein',hash:'protein',apUnit:1,order:4,kind:'Simulation',tab:'Protein folding',
  card:'Watch a chain of amino acids fold itself in water, then heat it, change the pH or add the sickle-cell mutation.',
  title:'Protein folding: from a chain of amino acids to a working shape',
  lede:{bio:'A protein is a chain of amino acids that folds into a shape. Oily (nonpolar) amino acids hide from water in the middle. Heat it and watch the shape fall apart.',
        honors:'The sequence decides the fold. Hydrophobic interactions, ionic bonds and hydrogen bonds hold it together. Change the pH or one amino acid and see what happens.',
        ap:'Folding as free-energy minimization. Track the energy, radius of gyration and native contacts as temperature, pH and mutations shift the balance.'},
  scale:'Molecular scale: each bead is one amino acid, about 0.38 nm apart. This 20-amino-acid mini-protein is about 1.5 nm across. Hemoglobin’s β chain has 146.',
  timeScale:1,dtMax:0.02,prewarm:1,sampleDt:0.05,window:20,unit:'µs',timeLabel:'Simulated time',chChange:1.5,chReveal:9,
  controls:[
    {id:'temp',label:'Temperature',type:'range',min:20,max:100,step:1,def:37,unit:' °C',lvl:'bio'},
    {id:'ph',label:'pH',type:'range',min:1,max:14,step:0.5,def:7,unit:'',lvl:'honors',help:'Low pH neutralizes Glu and Asp (−); high pH neutralizes Lys and Arg (+).'},
    {id:'mpos',label:'Mutate amino acid number',type:'range',min:1,max:20,step:1,def:5,unit:'',lvl:'honors',noTrial:true},
    {id:'maa',label:'Change it to',type:'select',def:'Val',lvl:'honors',noTrial:true,options:['Val','Leu','Phe','Ser','Asn','Lys','Arg','Glu','Asp'].map(n=>({v:n,l:n+' ('+{H:'nonpolar','P':'polar','+':'positive','-':'negative'}[TYPES[n]]+')'}))}
  ],
  actions:[
    {id:'unfold',label:'Stretch it out',primary:true,run(sim){sim.st.pos=WT.map((_,i)=>[i-9,0]);measure(sim);}},
    {id:'mutate',label:'Apply mutation',lvl:'honors',run(sim){sim.st.seq[sim.p.mpos-1]=sim.p.maa;sim.st.stuck=false;sim.st.stick=0;measure(sim);}},
    {id:'sickle',label:'Sickle-cell change: Glu → Val',lvl:'honors',run(sim){sim.st.seq[SICKLE]='Val';sim.st.stick=0;measure(sim);}},
    {id:'undo',label:'Undo mutations',lvl:'honors',run(sim){sim.st.seq=WT.slice();sim.st.stuck=false;sim.st.stick=0;measure(sim);}}
  ],
  init(sim){const st={seq:WT.slice(),pos:NATIVE.map(p=>p.slice()),rand:rng(1234+Math.floor(Math.random()*1e6)),stuck:false,stick:0,acc:0};sim.st=st;measure(sim);return st;},
  step(sim,dt){const st=sim.st,T=tempMC(sim.p.temp),ty=types(st),ph=sim.p.ph;st.acc+=dt*1000;let n=Math.floor(st.acc);st.acc-=n;
    let E=energy(st.pos,ty,ph);for(let k=0;k<n;k++){const np=propose(st.pos,st.rand);if(!np)continue;const E2=energy(np,ty,ph);if(E2<=E||st.rand()<Math.exp(-(E2-E)/T)){st.pos=np;E=E2;}}
    measure(sim);if(st.patch>0&&atLeast('honors')){st.stick+=dt;if(st.stick>0.6)st.stuck=true;}else st.stick=Math.max(0,st.stick-dt*0.5);},
  metrics:[
    {id:'fold',label:'Folded (native contacts)',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>s.st.fold*100},
    {id:'buried',label:'Nonpolar side chains hidden from water',unit:'%',lvl:'bio',min:0,max:100,d:0,get:s=>100*(1-s.st.m.expH/s.st.m.possH)},
    {id:'ion',label:'Ionic bonds',unit:'',lvl:'honors',min:0,max:4,d:0,get:s=>s.st.m.ion},
    {id:'patch',label:'Sticky nonpolar patch on surface',unit:'faces',lvl:'honors',min:0,max:4,d:0,get:s=>s.st.patch},
    {id:'agg',label:'Neighbor molecules',text:true,lvl:'honors',get:s=>s.st.stuck?'Stuck together (clumping)':'Floating separately'},
    {id:'energy',label:'Folding energy',unit:'kJ/mol',lvl:'ap',min:-45,max:5,d:0,get:s=>s.st.E*4.2},
    {id:'rg',label:'Radius of gyration',unit:'nm',lvl:'ap',min:0.5,max:2.5,d:2,get:s=>s.st.rg*0.38}
  ],
  graphs:[{id:'fold',label:'% folded',lines:['fold']},{id:'both',label:'% folded and % hidden',lines:['fold','buried']},
    {id:'ion',label:'Ionic bonds',lvl:'honors',lines:['ion']},{id:'energy',label:'Folding energy',lvl:'ap',lines:['energy']},{id:'rg',label:'Radius of gyration',lvl:'ap',lines:['rg']}],
  defaultGraph:'fold',
  challenges:[
    {lvl:'bio',q:'You heat the protein from body temperature (37 °C) to 90 °C. What happens to its shape?',choices:['It folds even tighter','It unfolds into a floppy chain','Nothing; proteins are rigid'],correct:1,
     change:{temp:90},changeText:'Heated to 90 °C',watch:'fold',
     explain:{bio:'Heat makes the chain shake so hard that the weak attractions holding the fold break. The protein loses its shape (denatures), so it can no longer do its job.',ap:'At high T the entropy gained by the floppy chain outweighs the energy of the native contacts, so the unfolded state has lower free energy.'}},
    {lvl:'bio',q:'You stretch the chain out straight in water at 37 °C and let go. Where do the nonpolar (orange) amino acids end up?',choices:['Spread along the outside, touching water','Clustered together in the middle, away from water','Scattered randomly'],correct:1,
     baselineAction:'unfold',watch:'both',
     explain:{bio:'Nonpolar side chains are like oil: water pushes them together. They collapse into a core, and the polar and charged amino acids stay on the outside facing water.',honors:'This hydrophobic collapse is the main driving force of folding. Water molecules gain freedom when nonpolar side chains stop touching them.'}},
    {lvl:'bio',q:'When heat denatures a protein, which bonds break?',choices:['The peptide bonds between amino acids, so the chain falls apart','The weak attractions (hydrogen bonds, hydrophobic and ionic interactions) that hold the fold','None; only the color changes'],correct:1,instant:true,
     explain:'Denaturing destroys the shape, not the sequence. The chain of amino acids (primary structure) stays intact; only the weak interactions that create the 3D fold break. Watch the beads stay connected when you heat it.'},
    {lvl:'honors',q:'You lower the pH from 7 to 2. What happens to the ionic bond(s) holding the fold?',choices:['They get stronger','They break','No change'],correct:1,
     change:{ph:2},changeText:'pH lowered to 2',watch:'ion',
     explain:'At pH 2, the extra H⁺ ions bind to the negative side chains (Glu, Asp), making them neutral. With no negative charge, the ionic bond to Lys or Arg can no longer form. This is why stomach acid denatures many proteins.'},
    {lvl:'honors',q:'You make the sickle-cell type change: a negative Glu on the surface becomes a nonpolar Val. What happens to nearby molecules?',choices:['Nothing; one amino acid can’t matter','They stick to the new nonpolar patch and clump together','The protein dissolves faster'],correct:1,
     changeAction:'sickle',changeText:'Glu changed to Val on the surface',watch:'fold',at:1,reveal:6,
     explain:{honors:'The fold barely changes, but now a nonpolar amino acid sits on the surface touching water. Nonpolar patches stick to each other, so molecules clump into long fibers. In sickle-cell hemoglobin (β6 Glu→Val), these fibers bend red blood cells into sickles.',ap:'The mutation doesn’t unfold the protein; it changes the surface. The exposed Val fits into a hydrophobic pocket on another hemoglobin, driving polymerization of deoxygenated HbS.'}},
    {lvl:'ap',q:'You raise the temperature from 37 °C to 70 °C. What happens to the radius of gyration (how spread out the chain is)?',choices:['It increases','It decreases','It stays the same'],correct:0,
     change:{temp:70},changeText:'Heated to 70 °C',watch:'rg',
     explain:'The native fold is compact. As native contacts break, the chain spreads out and samples many floppy shapes, so its radius of gyration rises (here from about 0.7 to about 1 nm).'},
    {lvl:'ap',q:'You unfold the protein at 90 °C, then cool it back to 37 °C. In this model, what happens over the next 10 µs?',choices:['It stays a fully stretched-out, floppy chain','It collapses back into a compact shape with a nonpolar core, but usually not the exact native fold','It snaps back to exactly the original fold every time'],correct:1,
     baseline:{temp:90},change:{temp:37},changeText:'Cooled back to 37 °C',watch:'both',at:2,reveal:12,
     explain:'Hydrophobic collapse is fast, so the chain quickly becomes compact again (% hidden rises). Finding the one exact native fold is slow: the chain often gets stuck in a misfolded “kinetic trap”. Anfinsen showed small proteins can refold on their own given time; in crowded cells, chaperone proteins help, and some proteins (like cooked egg white) clump instead.'}
  ],
  narrate(sim){const st=sim.st,p=sim.p,hon=atLeast('honors'),f=Math.round(st.fold*100),bur=Math.round(100*(1-st.m.expH/st.m.possH));
    if(hon&&st.stuck)return '<b>The molecules are clumping.</b> The new nonpolar Val on the surface sticks to the neighbors, the way sickle-cell hemoglobin forms fibers.';
    if(hon&&st.patch>0)return 'A nonpolar amino acid now faces the water. Water pushes nonpolar surfaces together, so watch the neighboring molecules.';
    if(p.temp>=65&&f<55)return '<b>Too hot.</b> The chain is shaking so hard that the weak bonds holding the fold keep breaking. The protein is denatured: '+f+'% folded.';
    if(hon&&(p.ph<=3||p.ph>=12))return '<b>Extreme pH.</b> The charged side chains have lost their charge, so the ionic bonds that help hold the fold are gone.';
    if(st.fold<0.5)return 'The chain is still searching for its shape. Nonpolar amino acids (orange) are drifting together to escape the water: '+bur+'% hidden so far.';
    return 'Folded: the nonpolar amino acids (orange) are packed in the core, away from water, with polar and charged ones on the outside. '+f+'% of the native contacts are in place.';},
  tour:[
    {title:'The sequence',text:{bio:'Every protein starts as a chain of amino acids in a set order, its <b>primary structure</b>. This one has 20. Real proteins have hundreds.',honors:'The primary structure is the amino-acid sequence, set by the gene. Orange = nonpolar, green = polar, blue = positive, red = negative.'},focus:[90,6,620,46],pause:true},
    {title:'Stretched out in water',text:'Now the chain is stretched straight. Every nonpolar (orange) amino acid is touching water, which is unstable.',focus:[60,150,680,210],pause:true,setup(sim){act(sim,'unfold');}},
    {title:'Hydrophobic collapse',text:'Watch at slow speed: the nonpolar amino acids clump together to escape the water, just like oil droplets merging.',focus:[60,70,680,330],speed:0.3},
    {title:'The folded shape',text:{bio:'The finished fold has an oily core with water-loving amino acids on the outside. That shape is what lets a protein do its job.',honors:'Hydrophobic packing, ionic bonds (purple) and hydrogen bonds hold the <b>tertiary structure</b>. Here the fold is shown flat; real proteins fold in 3D.'},focus:[200,80,400,320],speed:0.3},
    {title:'Heat breaks the weak bonds',text:'Now it heats to 90 °C. The beads stay linked (the peptide bonds don’t break), but the fold falls apart.',focus:[60,70,680,330],speed:0.5,setup(sim){BioLab.setValues(sim,{temp:90});}},
    {lvl:'honors',title:'One amino acid can matter',text:'Back to 37 °C, folded. A surface Glu (negative) becomes Val (nonpolar). The fold barely changes, but now a sticky patch faces the water, and neighboring molecules start to clump.',focus:[0,60,800,360],speed:0.5,setup(sim){BioLab.reset(sim);BioLab.setValues(sim,{temp:37});act(sim,'sickle');}},
    {lvl:'ap',title:'Quaternary structure',text:'Many proteins work as several folded chains held together (hemoglobin has four). The same surface forces that make the mutant clump also hold healthy subunits together at their proper interfaces.',focus:[0,60,800,360],speed:0.5}
  ],
  onTourExit(sim){BioLab.reset(sim);BioLab.setValues(sim,{temp:37});act(sim,'undo');},
  lab:{bio:'<p><b>Question:</b> How does temperature affect a protein’s shape?</p><ol><li>Record % folded at 20, 37, 50, 60, 70, 80 and 90 °C. Let each setting run about 10 µs first.</li><li>Plot temperature (x) against % folded (y).</li></ol><p>At what temperature does the protein lose about half its shape? Connect this to why a high fever is dangerous.</p>',
       honors:'<p><b>Question:</b> Which bonds hold this protein together?</p><ol><li>At 37 °C, record % folded and ionic bonds at pH 2, 4, 7, 10 and 13.</li><li>Then mutate amino acid 9 (Phe, in the core) to Lys and record % folded.</li></ol><p>Explain which change hurts the fold more and why.</p>',
       ap:'<p><b>Question:</b> How does a single substitution change stability?</p><ol><li>Record folding energy and radius of gyration for the wild type at 37 °C.</li><li>Repeat for a core substitution (Leu12 → Asp) and a surface substitution (Glu5 → Val).</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why a surface Glu → Val barely changes stability but can still cause disease.</p>'},
  terms:[{t:'Amino acid',d:'One building block of a protein. There are 20 kinds, each with a different side chain.'},{t:'Nonpolar (hydrophobic)',d:'A side chain that avoids water, like oil.'},
    {t:'Denature',d:'To lose the folded shape while the amino-acid chain stays intact.'},{t:'Primary structure',d:'The sequence of amino acids.'},
    {lvl:'honors',t:'Secondary structure',d:'Local coils (α helices) and folds (β sheets) held by backbone hydrogen bonds.'},{lvl:'honors',t:'Tertiary structure',d:'The overall 3D fold of one chain.'},
    {lvl:'honors',t:'Ionic bond (salt bridge)',d:'An attraction between a positive and a negative side chain.'},
    {lvl:'ap',t:'Quaternary structure',d:'Two or more folded chains working together, like hemoglobin’s four subunits.'},{lvl:'ap',t:'Radius of gyration',d:'A measure of how spread out the chain is; small when folded.'}],
  about:'<p>The chain lives on a 2D square grid. It moves by Monte Carlo steps (pivots, corner flips and end moves). Each step is accepted using the Metropolis rule at a temperature mapped from °C. Energy: −1 for each pair of touching nonpolar side chains, −0.6 for each + / − pair (scaled by how charged each is at that pH, with pKa 4.0 for Glu/Asp and 10.5 for Lys/Arg), and +0.5 for touching like charges. % folded is the share of the native fold’s contacts that are present.</p><p><b>Simplified:</b> real proteins fold in 3D, with 20 distinct side chains, explicit hydrogen bonds and much longer chains. The “neighbor molecules” are drawn as copies to show clumping; only one chain is simulated. The real sickle-cell mutation is at position 6 of the 146-amino-acid β-globin; here it is position 5 of a 20-amino-acid model. Simulated time is approximate.</p>',
  initVis(sim){const r=rng(5),v=sim.vis;v.w=[];for(let i=0;i<70;i++)v.w.push([r()*800,60+r()*360,r()*6.28]);v.vp=null;v.c=null;v.nb=0;},
  draw(sim,ctx,vdt,k,t){const st=sim.st,v=sim.vis,hon=atLeast('honors'),ap=atLeast('ap'),SP=33;
    ctx.fillStyle=PAL['cv-sol'];ctx.fillRect(0,0,800,450);
    // water molecules
    ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.5;ctx.globalAlpha=.5;v.w.forEach(q=>{const x=q[0]+(RM?0:Math.sin(t*.7+q[2])*4),y=q[1]+(RM?0:Math.cos(t*.6+q[2])*4);ctx.beginPath();ctx.moveTo(x-3,y+2);ctx.lineTo(x,y);ctx.lineTo(x+3,y+2);ctx.stroke();});ctx.globalAlpha=1;
    // sequence strip (primary structure)
    const bw=30,sx=400-N*bw/2;st.seq.forEach((n,i)=>{const ty=TYPES[n];ctx.fillStyle=TCOL[ty];rr(ctx,sx+i*bw+1,14,bw-2,30,5);ctx.fill();if(n!==WT[i]){ctx.strokeStyle='#ffd23f';ctx.lineWidth=3;rr(ctx,sx+i*bw,13,bw,32,6);ctx.stroke();}
      txt(ctx,n,sx+i*bw+bw/2,30,{s:Math.min(10.5*k,12),w:700,c:'#fff',a:'center',b:'middle'});});
    txt(ctx,'Primary structure: the amino-acid sequence',400,60,{s:Math.min(12*k,14),c:PAL['cv-soft'],a:'center'});
    // smooth display positions
    let cx=0,cy=0;st.pos.forEach(p=>{cx+=p[0];cy+=p[1];});cx/=N;cy/=N;
    // align to last frame's orientation (rigid rotations/reflections cost no energy, so ignore them on screen)
    const rel=st.pos.map(p=>[p[0]-cx,p[1]-cy]);let tgt=null,bestD=Infinity;
    for(const [a1,b1,c1,d1] of [[1,0,0,1],[0,-1,1,0],[-1,0,0,-1],[0,1,-1,0],[-1,0,0,1],[1,0,0,-1],[0,1,1,0],[0,-1,-1,0]]){
      const c=rel.map(q=>[400+(a1*q[0]+b1*q[1])*SP,250+(c1*q[0]+d1*q[1])*SP]);if(!v.vp){tgt=c;break;}
      let dd=0;c.forEach((q,i)=>{dd+=(q[0]-v.vp[i][0])**2+(q[1]-v.vp[i][1])**2;});if(dd<bestD){bestD=dd;tgt=c;}}
    if(!v.vp||v.vp.length!==N)v.vp=tgt.map(p=>p.slice());v.vp.forEach((p,i)=>{const b=1-Math.exp(-vdt*14);p[0]=lerp(p[0],tgt[i][0],vdt?b:1);p[1]=lerp(p[1],tgt[i][1],vdt?b:1);});
    const P=v.vp,ty=types(st);
    // neighbor molecules (honors): copies that clump onto a sticky patch
    if(hon){v.nb=lerp(v.nb,st.stuck?1:0,1-Math.exp(-(vdt||0.05)*1.5));const drawCopy=(ox,oy,rot)=>{ctx.save();ctx.globalAlpha=.25+.3*v.nb;ctx.translate(ox,oy);ctx.rotate(rot);
        ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=5;ctx.beginPath();NATIVE.forEach((q,i)=>{const x=(q[0]-1.2)*16,y=(q[1]-0.2)*16;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
        NATIVE.forEach((q,i)=>{ctx.fillStyle=TCOL[TYPES[st.seq[i]]];ctx.beginPath();ctx.arc((q[0]-1.2)*16,(q[1]-0.2)*16,6,0,6.29);ctx.fill();});ctx.restore();};
      const sp=P[SICKLE];let mx=0,my=0;P.forEach(q=>{mx+=q[0];my+=q[1];});mx/=N;my/=N;let ux=sp[0]-mx,uy=sp[1]-my;const ul=Math.hypot(ux,uy)||1;ux/=ul;uy/=ul;
      if(Math.abs(ux)<0.35){ux=ux<0?-0.8:0.8;uy*=0.6;}const d1=lerp(230,98,v.nb),d2=lerp(330,190,v.nb);
      drawCopy(clamp(sp[0]+ux*d1,70,730),clamp(sp[1]+uy*d1*0.5,110,400),0.3);drawCopy(clamp(sp[0]+ux*d2,70,730),clamp(sp[1]+uy*d2*0.5+20,110,400),-0.4);
      if(st.stuck)txt(ctx,'Molecules clumping on the sticky patch',400,440,{s:Math.min(12.5*k,14),w:700,a:'center',c:PAL['s1']});}
    // hydrophobic core glow
    const hi=ty.map((x,i)=>x==='H'?i:-1).filter(i=>i>=0);const buried=1-st.m.expH/st.m.possH;
    if(buried>0.45){let hx=0,hy=0;hi.forEach(i=>{hx+=P[i][0];hy+=P[i][1];});hx/=hi.length;hy/=hi.length;ctx.fillStyle='rgba(217,150,43,'+(0.12+0.15*buried)+')';ctx.beginPath();ctx.arc(hx,hy,48,0,6.29);ctx.fill();
}
    // contacts
    contactsOf(st.pos).forEach(([i,j])=>{if(Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1])>SP*1.4)return;const a_=ty[i],b_=ty[j];let col=null,dash=[];
      if(a_==='H'&&b_==='H'){col='rgba(217,150,43,.9)';}
      else if((a_==='+'&&b_==='-')||(a_==='-'&&b_==='+')){const {fm,fp}=charges(sim.p.ph);if(fm*fp<0.3)return;col=PAL['cv-inn'];dash=[4,3];}
      else if(hon){col=PAL['s2'];dash=[2,4];}
      if(!col)return;ctx.strokeStyle=col;ctx.lineWidth=3;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(P[i][0],P[i][1]);ctx.lineTo(P[j][0],P[j][1]);ctx.stroke();ctx.setLineDash([]);});
    // backbone + residues
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=6;ctx.lineJoin='round';ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
    P.forEach((p,i)=>{const n=st.seq[i];ctx.fillStyle=TCOL[TYPES[n]];ctx.beginPath();ctx.arc(p[0],p[1],12,0,6.29);ctx.fill();
      if(n!==WT[i]){ctx.strokeStyle='#ffd23f';ctx.lineWidth=3;ctx.stroke();}
      txt(ctx,ONE[n],p[0],p[1]+1,{s:11,w:800,c:'#fff',a:'center',b:'middle'});});
    if(buried>0.45){const by=Math.max(...P.map(q=>q[1]));let hx2=0;hi.forEach(i=>{hx2+=P[i][0];});hx2/=hi.length;txt(ctx,'nonpolar core in the middle',hx2,by+30,{s:Math.min(11.5*k,13),w:600,a:'center',c:PAL['cv-soft']});}
    // legend
    const items=[['nonpolar','H'],['polar','P'],['positive','+'],['negative','-']];let lx=14;
    items.forEach(([l,tp])=>{ctx.fillStyle=TCOL[tp];ctx.beginPath();ctx.arc(lx+6,418,6,0,6.29);ctx.fill();txt(ctx,l,lx+16,422,{s:Math.min(11.5*k,13),c:PAL['cv-ink']});ctx.font='11.5px '+FONT;lx+=ctx.measureText(l).width*Math.min(k,1.13)+34;});
    if(hon){ctx.strokeStyle=PAL['cv-inn'];ctx.lineWidth=3;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(14,440);ctx.lineTo(34,440);ctx.stroke();ctx.setLineDash([]);txt(ctx,'ionic bond',40,444,{s:Math.min(11.5*k,13),c:PAL['cv-ink']});}
    pill(ctx,sim.p.temp+' °C'+(hon?' · pH '+sim.p.ph:''),720,80,PAL['card'],PAL['cv-ink'],Math.min(12*k,14));
  }
};
function act(sim,id){SIM.actions.find(a=>a.id===id).run(sim);}
BioLab.register(SIM);
})();
